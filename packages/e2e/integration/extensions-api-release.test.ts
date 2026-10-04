import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdir, mkdtemp, readFile, realpath, symlink, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  initializeProject,
  prepareProject,
  generateRelease,
  withNeonReleaseDatabase,
  writeMigration,
} from "kello/tooling";
import type { DeploymentDatabaseProvider, NeonReleaseJournal } from "kello/tooling";
import { migrationHash } from "../../../apps/loom/src/tooling/migrations/planner";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { loadProject } from "../../../apps/loom/src/tooling/project/load";
import { projectMigrationScopes } from "../../../apps/loom/src/tooling/migrations/component-scopes";
import { planProjectRelease } from "../../../apps/loom/src/tooling/deploy/neon/plan-release";
import { inspectRetainedRelease } from "../../../apps/loom/src/tooling/deploy/neon/retained-release";
import { readNeonReleaseReceipt } from "../../../apps/loom/src/tooling/deploy/neon/release-receipt";

interface FixtureSelection {
  readonly extensions: Readonly<Record<string, { readonly version: string }>>;
  readonly components: readonly string[];
}

async function prepareFixture(
  root: string,
  url: string,
  role: string,
  env: string,
  admin: pg.Client,
  selection: FixtureSelection,
) {
  const address = new URL(url);
  let providerCalls = 0;
  const provider: DeploymentDatabaseProvider = {
    getProject: async () => {
      providerCalls++;
      return { id: "project", name: "api-release", regionId: "test", pgVersion: 18 };
    },
    listBranches: async () => [{ id: "br-preview", name: "preview", protected: false, isDefault: false }],
    listEndpoints: async () => [
      {
        id: address.hostname.split(".")[0]!,
        branchId: "br-preview",
        type: "read_write",
        autoscalingLimitMinCu: 0.25,
        autoscalingLimitMaxCu: 1,
        suspendTimeout: 300,
      },
    ],
    getConnectionUri: async () => ({ uri: url }),
  };
  await initializeProject(root, "api-release");
  await mkdir(join(root, "node_modules"));
  for (const name of ["kello", "valibot", "drizzle-orm"])
    await symlink(
      await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
      join(root, "node_modules", name),
    );
  await writeFile(
    join(root, "kello.config.ts"),
    `import {defineConfig} from "kello/tooling"; export default defineConfig(${JSON.stringify({ project: "api-release", database: { migrationUrlEnv: env, extensions: selection.extensions }, provider: { projectId: "project", targets: { preview: { branchId: "br-preview" } } } })});`,
  );
  for (const name of selection.components) {
    const component = join(root, "kello/components", name);
    await mkdir(component, { recursive: true });
    await writeFile(
      join(component, "setup.ts"),
      `import {defineComponent} from "kello"; export default defineComponent({name:${JSON.stringify(name)},extensions:{pg_trgm:{versions:["1.6"]}}});`,
    );
    await writeFile(
      join(component, "schema.ts"),
      'import {defineSchema} from "kello/server"; export default defineSchema((f)=>({items:{title:f.text()}}));',
    );
  }
  if (selection.components.length) {
    await writeFile(
      join(root, "kello/app.config.ts"),
      `import {defineApplication} from "kello"; ${selection.components.map((name, index) => `import component${index} from "./components/${name}/setup";`).join(" ")} const app=defineApplication({rpc:({os})=>({os})}); ${selection.components.map((_, index) => `app.use(component${index});`).join(" ")} export default app;`,
    );
  }
  const prepared = await prepareProject(root);
  const initial = await generateRelease(root, "initial");
  const project = await loadProject(root);
  const migrations = project.config.database.migrations;
  const scopes = projectMigrationScopes(project);
  const appArtifact = initial.scopes.find((scope) => scope.mountPath === "")!.artifact;
  const app = appArtifact.plan;
  assert.equal(app.format, 3);
  if (app.format !== 3 || !app.requiredApi) throw new Error("Missing typed artifact");
  const options = {
    releaseKey: "a".repeat(64),
    inputHash: "b".repeat(64),
    activationToken: "c".repeat(64),
    deployment: "preview",
    version: prepared.version,
    environment: "preview" as const,
    databaseName: address.pathname.slice(1),
    migrationRole: decodeURIComponent(address.username),
    runtimeRole: role,
    quarantine: "clone" as const,
    reviewedHashes: [],
    migrationHashes: [app.hash],
    schema: { minimum: app.after, maximum: app.after, target: app.after },
    componentScopes: initial.scopes
      .filter((scope) => scope.mountPath !== "")
      .map((scope) => {
        const source = scopes.find((entry) => entry.mountPath === scope.mountPath);
        assert(source);
        return {
          mountPath: scope.mountPath,
          namespace: scope.namespace,
          migrations: source.migrations,
          migrationHashes: [scope.artifact.plan.hash],
          schema: {
            minimum: scope.artifact.plan.after,
            maximum: scope.artifact.plan.after,
            target: scope.artifact.plan.after,
          },
        };
      }),
  };
  return { root, role, admin, options, appArtifact, app, migrations, provider, providerCalls: () => providerCalls };
}

type Fixture = Awaited<ReturnType<typeof prepareFixture>>;

async function withFixture(selection: FixtureSelection, operation: (fixture: Fixture) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const root = await mkdtemp(join(tmpdir(), "loom-api-release-"));
    const role = `api_release_${crypto.randomUUID().replaceAll("-", "")}`;
    const env = `LOOM_API_RELEASE_${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`;
    process.env[env] = url;
    const admin = new pg.Client({ connectionString: url });
    await admin.connect();
    try {
      await operation(await prepareFixture(root, url, role, env, admin, selection));
    } finally {
      delete process.env[env];
      try {
        if ((await admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
          await admin.query(`GRANT ${quoteIdentifier(role)} TO CURRENT_USER`);
          await admin.query(`DROP OWNED BY ${quoteIdentifier(role)}`);
          await admin.query(`DROP ROLE ${quoteIdentifier(role)}`);
        }
      } finally {
        try {
          await admin.end();
        } finally {
          await rm(root, { recursive: true, force: true });
        }
      }
    }
  });
}

async function addMember(admin: pg.Client) {
  await admin.query(
    "CREATE FUNCTION extensions.release_probe(value text) RETURNS text LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT value'; ALTER EXTENSION pg_trgm ADD FUNCTION extensions.release_probe(text)",
  );
}

async function removeMember(admin: pg.Client) {
  await admin.query(
    "ALTER EXTENSION pg_trgm DROP FUNCTION extensions.release_probe(text); DROP FUNCTION extensions.release_probe(text)",
  );
}

/** Model completed provider acknowledgements; this native database proof does not deploy provider functions. */
async function completeProviderJournal(journal: NeonReleaseJournal) {
  const functions = [
    { role: "service" as const, functionId: "service", deploymentId: 1, slug: "service" },
    { role: "worker" as const, functionId: "worker", deploymentId: 1, slug: "worker" },
  ] as const;
  await journal.complete({ stage: "bootstrap", artifactHash: "d".repeat(64), functions: [...functions] });
  await journal.complete({ stage: "triggers", triggers: [], bindings: {} });
  await journal.complete({ stage: "functions", artifactHash: "e".repeat(64), functions: [...functions] });
  await journal.complete({ stage: "health" });
  await journal.complete({ stage: "activated" });
  await journal.complete({ stage: "complete", enabledTriggerIds: [] });
}

function planningProvider(provider: DeploymentDatabaseProvider): NonNullable<Parameters<typeof planProjectRelease>[2]> {
  async function unexpectedProviderOperation(): Promise<never> {
    throw new Error("Unexpected provider operation");
  }
  return {
    ...provider,
    listProjects: unexpectedProviderOperation,
    createProject: unexpectedProviderOperation,
    updateProject: unexpectedProviderOperation,
    createBranch: unexpectedProviderOperation,
    updateBranch: unexpectedProviderOperation,
    updateEndpoint: unexpectedProviderOperation,
    listBranchRoles: unexpectedProviderOperation,
    listBranchDatabases: unexpectedProviderOperation,
    getNeonAuth: unexpectedProviderOperation,
    enableNeonAuth: unexpectedProviderOperation,
    getNeonDataApi: unexpectedProviderOperation,
    enableProjectBranchDataApi: unexpectedProviderOperation,
    updateProjectBranchDataApi: unexpectedProviderOperation,
    deleteProjectBranchDataApi: unexpectedProviderOperation,
    listBranchFunctions: async () =>
      ["service", "worker"].map((slug) => ({
        id: slug,
        slug,
        name: slug,
        invocationUrl: `https://example.invalid/${slug}`,
        activeDeploymentId: 1,
        currentDeployment: { id: 1, status: "completed" as const },
      })),
    listBranchBuckets: async () => [],
    listBranchTriggers: async () => [],
    createBranchBucket: unexpectedProviderOperation,
    deleteBranchBucket: unexpectedProviderOperation,
    getProjectBranchStorage: unexpectedProviderOperation,
    deleteBranchFunction: unexpectedProviderOperation,
    deployBranchFunction: unexpectedProviderOperation,
    getBranchFunction: unexpectedProviderOperation,
    createBranchTrigger: unexpectedProviderOperation,
    updateBranchTrigger: unexpectedProviderOperation,
    deleteBranchTrigger: unexpectedProviderOperation,
    listBranchCustomDomains: unexpectedProviderOperation,
    registerBranchCustomDomain: unexpectedProviderOperation,
    deleteBranchCustomDomain: unexpectedProviderOperation,
    createCredential: unexpectedProviderOperation,
    listCredentials: unexpectedProviderOperation,
    revealCredential: unexpectedProviderOperation,
    revokeCredential: unexpectedProviderOperation,
  };
}

function phaseTiming(caseName: "source" | "fresh" | "resume" | "planning") {
  const started = performance.now();
  return (phase: string) =>
    console.info(`[required API release] ${caseName}/${phase} ${Math.round(performance.now() - started)}ms`);
}

test("native release refuses missing committed API evidence before database access and binds full host/component pins", async () => {
  const phase = phaseTiming("source");
  await withFixture(
    { extensions: { pg_trgm: { version: "1.6" }, citext: { version: "1.8" } }, components: ["search"] },
    async (fixture) => {
      phase("fixture-ready");
      const { root, app, appArtifact, migrations, admin, options, provider } = fixture;
      const { requiredApi: _removed, ...legacy } = app;
      await rm(appArtifact.directory, { recursive: true });
      const historical = await writeMigration(root, migrations, "initial", { ...legacy, hash: migrationHash(legacy) });
      await assert.rejects(
        withNeonReleaseDatabase(root, options, async () => {}, provider),
        /committed|required API/i,
      );
      assert.equal(fixture.providerCalls(), 0);
      assert.equal(
        (await admin.query("SELECT to_regclass('loom_meta.migration_history') AS relation")).rows[0].relation,
        null,
      );
      await rm(historical.directory, { recursive: true });
      await writeMigration(root, migrations, "initial", app);
      phase("source-head-restored");
      await withNeonReleaseDatabase(
        root,
        options,
        async ({ journal }) => {
          phase("prepared-callback");
          const receipt = journal.read();
          assert.equal(receipt.format, 3);
          const scoped = receipt.identity.requiredApi?.scopes;
          assert.deepEqual(
            scoped
              ?.find((scope) => scope.mountPath === "")
              ?.requiredApi.apis.map(({ manifest }) => manifest.contract.extension),
            ["citext", "pg_trgm"],
          );
          assert.deepEqual(
            scoped
              ?.find((scope) => scope.mountPath === "search")
              ?.requiredApi.apis.map(({ manifest }) => manifest.contract.extension),
            ["pg_trgm"],
          );
        },
        provider,
      );
    },
  );
}, 300000);

test("native release wraps prepare/activate with fresh member and named runtime authority checks", async () => {
  const phase = phaseTiming("fresh");
  await withFixture(
    { extensions: { pg_trgm: { version: "1.6" } }, components: [] },
    async ({ root, admin, role, options, provider }) => {
      phase("fixture-ready");
      await withNeonReleaseDatabase(
        root,
        options,
        async ({ activation, client }) => {
          phase("prepared-callback");
          const installed = (
            await admin.query(
              "SELECT extname,extversion,extnamespace::regnamespace::text AS schema FROM pg_extension WHERE extname = 'pg_trgm'",
            )
          ).rows;
          await addMember(admin);
          try {
            await assert.rejects(activation.prepare(), /SQL contract mismatch/);
            await assert.rejects(activation.activate(), /SQL contract mismatch/);
            assert.deepEqual(
              (
                await admin.query(
                  "SELECT extname,extversion,extnamespace::regnamespace::text AS schema FROM pg_extension WHERE extname = 'pg_trgm'",
                )
              ).rows,
              installed,
            );
          } finally {
            await removeMember(admin);
          }
          phase("member-drift-rejected");
          await admin.query(`REVOKE USAGE ON SCHEMA extensions FROM ${quoteIdentifier(role)}`);
          try {
            assert.equal(
              (await client.query("SELECT has_schema_privilege(current_user,'extensions','USAGE') AS allowed")).rows[0]
                .allowed,
              true,
            );
            assert.equal(
              (await client.query("SELECT has_schema_privilege($1,'extensions','USAGE') AS allowed", [role])).rows[0]
                .allowed,
              false,
            );
            await assert.rejects(activation.activate(), /runtime.*USAGE|USAGE.*runtime/i);
          } finally {
            await admin.query(`GRANT USAGE ON SCHEMA extensions TO ${quoteIdentifier(role)}`);
          }
          phase("runtime-denial-rejected");
          await activation.activate();
          phase("activated");
        },
        provider,
      );
    },
  );
}, 300000);

test("native completed release repeats member checks on assertActive and refuses resumed callbacks until drift is restored", async () => {
  const phase = phaseTiming("resume");
  await withFixture(
    { extensions: { pg_trgm: { version: "1.6" } }, components: [] },
    async ({ root, options, provider, admin }) => {
      phase("fixture-ready");
      await withNeonReleaseDatabase(
        root,
        options,
        async ({ journal, activation }) => {
          phase("prepared-callback");
          await activation.activate();
          await addMember(admin);
          try {
            await assert.rejects(activation.assertActive(), /SQL contract mismatch/);
          } finally {
            await removeMember(admin);
          }
          await activation.assertActive();
          await completeProviderJournal(journal);
        },
        provider,
      );
      phase("journal-complete");
      await addMember(admin);
      let resumed = false;
      try {
        await assert.rejects(
          withNeonReleaseDatabase(
            root,
            options,
            async () => {
              resumed = true;
            },
            provider,
          ),
          /SQL contract mismatch/,
        );
        assert.equal(resumed, false);
      } finally {
        await removeMember(admin);
      }
      phase("resumed-drift-rejected");
      await withNeonReleaseDatabase(
        root,
        options,
        async ({ activation }) => {
          await activation.assertActive();
        },
        provider,
      );
      phase("restored-resume-verified");
    },
  );
}, 300000);

test("native read-only planning and retained code bind exact saved scoped API identity", async () => {
  const phase = phaseTiming("planning");
  await withFixture(
    { extensions: { pg_trgm: { version: "1.6" } }, components: [] },
    async ({ root, options, provider }) => {
      phase("fixture-ready");
      await withNeonReleaseDatabase(
        root,
        options,
        async ({ journal, activation }) => {
          await activation.activate();
          await completeProviderJournal(journal);
        },
        provider,
      );
      phase("journal-complete");
      const saved = await readNeonReleaseReceipt(root, options.releaseKey);
      assert(saved?.identity.requiredApi);
      const slugs = { service: "service", worker: "worker" };
      await inspectRetainedRelease(root, options.releaseKey, saved.identity, slugs);
      const { inputHash: _inputHash, activationToken: _activationToken, ...declaration } = options;
      await writeFile(
        join(root, "release.json"),
        JSON.stringify({
          ...declaration,
          quarantine: "preserve",
          format: 1,
          slugs,
          activationTokenEnv: "DEPLOY_TOKEN",
          variables: { LOOM_DATABASE_URL: "RUNTIME_URL" },
        }),
      );
      const observer = planningProvider(provider);
      const plan = await planProjectRelease(root, "release.json", observer);
      phase("matching-plan-read");
      assert(
        !plan.blockers.some(
          (blocker) => blocker.code === "RECEIPT_IDENTITY_CHANGED" || blocker.code === "REQUIRED_API_UNVERIFIED",
        ),
      );
      const path = join(root, ".loom/releases", options.releaseKey, "release.json");
      const original = await readFile(path, "utf8");
      const changed = structuredClone(saved);
      changed.identity.requiredApi!.scopes[0]!.mountPath = "foreign";
      await writeFile(path, JSON.stringify(changed));
      try {
        await assert.rejects(inspectRetainedRelease(root, options.releaseKey, saved.identity, slugs), /identity/);
        const changedPlan = await planProjectRelease(root, "release.json", observer);
        phase("changed-plan-read");
        assert(changedPlan.blockers.some((blocker) => blocker.code === "RECEIPT_IDENTITY_CHANGED"));
      } finally {
        await writeFile(path, original);
      }
    },
  );
}, 300000);
