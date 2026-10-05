import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, realpath, readdir, symlink, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type pg from "pg";
import * as v from "valibot";
import {
  initializeProject,
  prepareProject,
  prepareNeonEntrypoints,
  generateRelease,
  applyProjectMigrations,
  applyMigrations,
  emptySnapshot,
  planMigration,
  planCustomMigration,
  writeMigration,
} from "kello/tooling";
import { defineSchema, defineTable } from "kello/server";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { withMigrationConnection, quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import type { ExtensionPlan, ExtensionState } from "../../../apps/loom/src/tooling/migrations/extensions";

async function projectFixture(operation: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "loom-api-build-target-"));
  try {
    await initializeProject(root, "api-build");
    await mkdir(join(root, "node_modules"));
    for (const name of ["kello", "valibot", "drizzle-orm"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    await operation(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
function binding(version: string) {
  return {
    metadataNamespace: "loom_meta",
    deployment: "preview",
    version,
    projectId: "project",
    branchId: "br-preview",
    branchName: "preview",
    endpointHost: "ep-preview.example.test",
    databaseName: "neondb",
  };
}
function quoted(name: string) {
  return `"${name.replaceAll('"', '""')}"`;
}
const triggers = { wake: { kind: "wake", name: "worker" } } as const;
type CatalogueClient = Pick<pg.Client, "query">;
const privilegeRows = v.pipe(
  v.array(
    v.strictObject({
      grantable: v.boolean(),
      owned: v.boolean(),
      publicAllowed: v.boolean(),
      runtimeAllowed: v.boolean(),
    }),
  ),
  v.length(1),
);
type NativePrivileges = v.InferOutput<typeof privilegeRows>[number];
function assertPublicRevoke(before: NativePrivileges, after: NativePrivileges) {
  expect(before.publicAllowed).toBe(true);
  expect(before.runtimeAllowed).toBe(true);
  expect(after.grantable).toBe(before.grantable);
  expect(after.owned).toBe(before.owned);
  if (!before.grantable) expect(before.owned).toBe(false);
  expect(after.publicAllowed).toBe(!before.grantable);
  expect(after.runtimeAllowed).toBe(!before.grantable);
}
async function routinePrivileges(client: CatalogueClient, signature: string, runtimeRole: string) {
  const rows = v.parse(
    privilegeRows,
    (
      await client.query(
        "SELECT pg_catalog.has_function_privilege(CURRENT_USER,p.oid,'EXECUTE WITH GRANT OPTION') AS grantable,p.proowner=(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=CURRENT_USER) AS owned,EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) acl WHERE acl.grantee=0 AND acl.privilege_type='EXECUTE') AS \"publicAllowed\",pg_catalog.has_function_privilege($2::name,p.oid,'EXECUTE') AS \"runtimeAllowed\" FROM pg_catalog.pg_proc p WHERE p.oid=pg_catalog.to_regprocedure($1)",
        [signature, runtimeRole],
      )
    ).rows,
  );
  return rows[0]!;
}
async function typePrivileges(client: CatalogueClient, signature: string, runtimeRole: string) {
  const rows = v.parse(
    privilegeRows,
    (
      await client.query(
        "SELECT pg_catalog.has_type_privilege(CURRENT_USER,t.oid,'USAGE WITH GRANT OPTION') AS grantable,t.typowner=(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=CURRENT_USER) AS owned,EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(t.typacl,pg_catalog.acldefault('T',t.typowner))) acl WHERE acl.grantee=0 AND acl.privilege_type='USAGE') AS \"publicAllowed\",pg_catalog.has_type_privilege($2::name,t.oid,'USAGE') AS \"runtimeAllowed\" FROM pg_catalog.pg_type t WHERE t.oid=pg_catalog.to_regtype($1)",
        [signature, runtimeRole],
      )
    ).rows,
  );
  return rows[0]!;
}

test("baseline extension-free immutable generation and deploy identity remain characterized", async () => {
  await projectFixture(async (root) => {
    const generation = await prepareProject(root);
    const directory = join(root, ".loom/generations", generation.version);
    const before = await Promise.all(
      (await readdir(directory)).sort().map(async (name) => [name, await readFile(join(directory, name), "utf8")]),
    );
    expect((await prepareProject(root)).version).toBe(generation.version);
    expect(
      await Promise.all(
        (await readdir(directory)).sort().map(async (name) => [name, await readFile(join(directory, name), "utf8")]),
      ),
    ).toEqual(before);
    expect(await readdir(directory)).not.toContain("required-api.json");
    const entries = await prepareNeonEntrypoints(root, binding(generation.version), triggers);
    const originalHash = createHash("sha256")
      .update("loom-neon-entry-8\0")
      .update(
        JSON.stringify({
          binding: binding(generation.version),
          bindings: triggers,
          runtimeUrlEnv: "LOOM_DATABASE_URL",
          directRuntimeUrlEnv: "LOOM_DIRECT_DATABASE_URL",
          notify: false,
          storage: false,
        }),
      )
      .digest("hex");
    expect(entries.hash).toBe(originalHash);
    expect(await readdir(join(entries.directory, "runtime"))).not.toContain("required-api.json");
    await writeFile(join(directory, "manifest.json"), "changed immutable manifest");
    await assert.rejects(prepareProject(root), /inconsistent with their version/);
  });
});

test("cached installation-only generation rejects an unexpected required API sidecar without rewriting it", async () => {
  await projectFixture(async (root) => {
    const generation = await prepareProject(root);
    const filename = join(root, ".loom/generations", generation.version, "required-api.json");
    const prior = '{"format":1,"scopes":[]}\n';
    await writeFile(filename, prior);
    await assert.rejects(prepareProject(root), /inconsistent|immutable|unexpected/i);
    expect(await readFile(filename, "utf8")).toBe(prior);
  });
});

test("cached extension-free deployment rejects unexpected runtime API evidence without rewriting immutable bytes", async () => {
  await projectFixture(async (root) => {
    const generation = await prepareProject(root);
    const entries = await prepareNeonEntrypoints(root, binding(generation.version), triggers);
    const filename = join(entries.directory, "runtime/required-api.json");
    const injected = '{"format":1,"scopes":[]}\n';
    await writeFile(filename, injected);
    await assert.rejects(
      prepareNeonEntrypoints(root, binding(generation.version), triggers),
      /unexpected|inconsistent|immutable/i,
    );
    expect(await readFile(filename, "utf8")).toBe(injected);
  });
});

test("accepted scoped build pins survive deployment copy and reject changed or missing immutable evidence", async () => {
  await projectFixture(async (root) => {
    await writeFile(
      join(root, "kello.config.ts"),
      'import {defineConfig} from "kello/tooling"; export default defineConfig({project:"api-build", database:{extensions:{pg_trgm:{version:"1.6"},citext:{version:"1.8"}}}});',
    );
    const child = join(root, "kello/components/search");
    await mkdir(child, { recursive: true });
    await writeFile(
      join(child, "setup.ts"),
      'import {defineComponent} from "kello"; export default defineComponent({name:"search",extensions:{pg_trgm:{versions:["1.6"]}}});',
    );
    await writeFile(
      join(child, "schema.ts"),
      'import {defineSchema} from "kello/server"; export default defineSchema((f)=>({items:{title:f.text()}}));',
    );
    await writeFile(
      join(root, "kello/app.config.ts"),
      'import {defineApplication} from "kello"; import search from "./components/search/setup"; const app=defineApplication({rpc:({os})=>({os})}); app.use(search); export default app;',
    );
    const generation = await prepareProject(root);
    expect(Object.keys(generation).sort()).toEqual([
      "format",
      "procedures",
      "project",
      "protocol",
      "schemaFingerprint",
      "version",
    ]);
    const directory = join(root, ".loom/generations", generation.version);
    const sidecar = await readFile(join(directory, "required-api.json"), "utf8");
    const { validateGenerationRequiredApi, generationRequiredApiHash } =
      await import("../../../apps/loom/src/tooling/codegen/required-api");
    const payload = validateGenerationRequiredApi(JSON.parse(sidecar));
    expect(
      payload.scopes
        .find((scope) => scope.mountPath === "")
        ?.requiredApi.apis.map(({ manifest }) => manifest.contract.extension),
    ).toEqual(["citext", "pg_trgm"]);
    expect(
      payload.scopes
        .find((scope) => scope.mountPath === "search")
        ?.requiredApi.apis.map(({ manifest }) => manifest.contract.extension),
    ).toEqual(["pg_trgm"]);
    const entries = await prepareNeonEntrypoints(root, binding(generation.version), triggers);
    const expected = createHash("sha256")
      .update("loom-neon-entry-8\0")
      .update(
        JSON.stringify({
          binding: binding(generation.version),
          bindings: triggers,
          runtimeUrlEnv: "LOOM_DATABASE_URL",
          directRuntimeUrlEnv: "LOOM_DIRECT_DATABASE_URL",
          notify: false,
          storage: false,
          requiredApi: generationRequiredApiHash(payload),
        }),
      )
      .digest("hex");
    expect(entries.hash).toBe(expected);
    expect(await readFile(join(entries.directory, "runtime/required-api.json"), "utf8")).toBe(sidecar);
    const changed = structuredClone(payload);
    const api = changed.scopes[0]!.requiredApi.apis[0]!;
    const routine = api.manifest.contract.members.find((member) => member.kind === "routine");
    assert(routine && routine.kind === "routine");
    routine.returns = { namespace: "pg_catalog", name: "bool" };
    const { extensionContractDigest } = await import("../../../apps/loom/src/core/extensions/registry");
    api.manifest.digest = extensionContractDigest(api.manifest.contract);
    expect(generationRequiredApiHash(validateGenerationRequiredApi(changed))).not.toBe(
      generationRequiredApiHash(payload),
    );
    await writeFile(join(directory, "required-api.json"), JSON.stringify(changed, null, 2) + "\n");
    await assert.rejects(prepareProject(root), /inconsistent/);
    await writeFile(join(directory, "required-api.json"), sidecar.replace('"format": 1', '"format": 2'));
    await assert.rejects(prepareProject(root), /inconsistent/);
    await rm(join(directory, "required-api.json"));
    await assert.rejects(prepareProject(root), /inconsistent|immutable|ENOENT/);
    await rm(directory, { recursive: true });
    expect(await readFile(join(entries.directory, "runtime/required-api.json"), "utf8")).toBe(sidecar);
    for (const name of ["service.js", "worker.js", "runtime.js"])
      expect(await readFile(join(entries.directory, "runtime", name), "utf8")).not.toMatch(
        /required-api-verification|migrationUrlEnv|verifyRequiredApiOnTarget/,
      );
  });
});

async function cleanupRole(url: string, role: string) {
  await withMigrationConnection(url, async (client) => {
    if ((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
      await client.query(`GRANT ${quoteIdentifier(role)} TO CURRENT_USER`);
      await client.query(`DROP OWNED BY ${quoteIdentifier(role)}; DROP ROLE ${quoteIdentifier(role)}`);
    }
  });
}

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "project migration installs accepted API before application DDL and freshly rejects no-pending namespace denial",
  async () => {
    await withExtensionDatabase(async (url) => {
      const role = `api_role_${crypto.randomUUID().replaceAll("-", "")}`;
      const old = process.env.LOOM_API_BUILD_TARGET_DATABASE;
      process.env.LOOM_API_BUILD_TARGET_DATABASE = url;
      try {
        await projectFixture(async (root) => {
          await writeFile(
            join(root, "kello.config.ts"),
            'import {defineConfig} from "kello/tooling"; export default defineConfig({project:"api-build",database:{migrationUrlEnv:"LOOM_API_BUILD_TARGET_DATABASE",extensions:{pg_trgm:{version:"1.6"}}}});',
          );
          await prepareProject(root);
          await generateRelease(root, "initial");
          expect((await applyProjectMigrations(root, role)).applied).toHaveLength(1);
          await withMigrationConnection(url, async (client) => {
            await client.query(`REVOKE USAGE ON SCHEMA extensions FROM ${quoteIdentifier(role)}`);
            await assert.rejects(applyProjectMigrations(root, role), /runtime.*USAGE|USAGE.*runtime/i);
            await client.query(`GRANT USAGE ON SCHEMA extensions TO ${quoteIdentifier(role)}`);
          });
          expect((await applyProjectMigrations(root, role)).applied).toEqual([]);
        });
      } finally {
        if (old === undefined) delete process.env.LOOM_API_BUILD_TARGET_DATABASE;
        else process.env.LOOM_API_BUILD_TARGET_DATABASE = old;
        await cleanupRole(url, role);
      }
    });
  },
  120000,
);

// Capture real contracts, including an independent reversible signature probe; no native verification callbacks.
test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "runner ABI/ACL/operator gates prevent pending sentinel DDL, history and concurrent indexes and repeat at current head",
  async () => {
    await withExtensionDatabase(async (url) => {
      const root = await mkdtemp(join(tmpdir(), "loom-api-native-gate-"));
      const role = `native_role_${crypto.randomUUID().replaceAll("-", "")}`;
      const namespace = "api_native";
      const extNamespace = "native_api";
      const ext = quoted(extNamespace);
      const options = {
        connectionString: url,
        root,
        migrations: "migrations",
        namespace,
        metadataNamespace: "loom_api_native",
        runtimeRole: role,
      };
      try {
        await withMigrationConnection(url, async (client) => {
          await client.query(
            `CREATE SCHEMA ${ext}; CREATE EXTENSION pg_trgm SCHEMA ${ext} VERSION '1.6'; CREATE FUNCTION ${ext}.signature_probe(value text) RETURNS text LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT value'; ALTER EXTENSION pg_trgm ADD FUNCTION ${ext}.signature_probe(text); CREATE OPERATOR ${ext}.~#~ (FUNCTION=pg_catalog.int4eq,LEFTARG=integer,RIGHTARG=integer); ALTER EXTENSION pg_trgm ADD OPERATOR ${ext}.~#~(integer,integer)`,
          );
          const manifest = await captureExtensionContract(client, {
            name: "pg_trgm",
            provider: "neon",
            fixture: "migration-target-gate",
          });
          const pinnedProbe = manifest.contract.members.find(
            (member) => member.kind === "routine" && member.name === "signature_probe",
          );
          assert(pinnedProbe && pinnedProbe.kind === "routine");
          expect(pinnedProbe.publicExecute).toBe(true);
          const requiredApi = {
            format: 1,
            apis: [{ schema: extNamespace, manifest }],
            fields: [],
            indexes: [],
          } satisfies import("../../../apps/loom/src/tooling/migrations/required-api").RequiredApi;
          const state = {
            name: "pg_trgm",
            version: "1.6",
            schema: extNamespace,
            requires: [],
          } satisfies ExtensionState;
          const extensions: ExtensionPlan = {
            before: [state],
            after: [state],
            requirements: [state],
            operations: [],
            automatic: true,
          };
          const schema = defineSchema((f) => ({ tasks: { title: f.text() } }), { namespace });
          const first = await planMigration(await emptySnapshot(namespace), schema, [], null, {
            scope: "application",
            extensions,
            requiredApi,
          });
          await writeMigration(root, "migrations", "initial", first);
          expect((await applyMigrations(options)).applied).toEqual([first.hash]);
          const installation = async () =>
            (await client.query("SELECT extname,extversion,extnamespace FROM pg_extension WHERE extname='pg_trgm'"))
              .rows;
          const beforeInstallation = await installation();
          const mutations = [
            `ALTER EXTENSION pg_trgm DROP FUNCTION ${ext}.signature_probe(text); DROP FUNCTION ${ext}.signature_probe(text); CREATE FUNCTION ${ext}.signature_probe(value text) RETURNS integer LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT length(value)'; ALTER EXTENSION pg_trgm ADD FUNCTION ${ext}.signature_probe(text)`,
            `ALTER EXTENSION pg_trgm DROP OPERATOR ${ext}.~#~(integer,integer); DROP OPERATOR ${ext}.~#~(integer,integer); CREATE OPERATOR ${ext}.~#~ (FUNCTION=pg_catalog.int4ne,LEFTARG=integer,RIGHTARG=integer); ALTER EXTENSION pg_trgm ADD OPERATOR ${ext}.~#~(integer,integer)`,
            `REVOKE EXECUTE ON FUNCTION ${ext}.signature_probe(text) FROM PUBLIC`,
          ];
          // Each native mutation is committed and independently undone; the runner uses a fresh owned session.
          const reversals = [
            `ALTER EXTENSION pg_trgm DROP FUNCTION ${ext}.signature_probe(text); DROP FUNCTION ${ext}.signature_probe(text); CREATE FUNCTION ${ext}.signature_probe(value text) RETURNS text LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT value'; ALTER EXTENSION pg_trgm ADD FUNCTION ${ext}.signature_probe(text)`,
            `ALTER EXTENSION pg_trgm DROP OPERATOR ${ext}.~#~(integer,integer); DROP OPERATOR ${ext}.~#~(integer,integer); CREATE OPERATOR ${ext}.~#~ (FUNCTION=pg_catalog.int4eq,LEFTARG=integer,RIGHTARG=integer); ALTER EXTENSION pg_trgm ADD OPERATOR ${ext}.~#~(integer,integer)`,
            `GRANT EXECUTE ON FUNCTION ${ext}.signature_probe(text) TO PUBLIC`,
          ];
          const probe = await routinePrivileges(client, `${ext}.signature_probe(text)`, role);
          expect(probe.grantable).toBe(true);
          expect(probe.owned).toBe(true);
          expect(probe.publicAllowed).toBe(true);
          expect(probe.runtimeAllowed).toBe(true);
          async function revokeProbe() {
            await client.query(mutations[2]!);
            const privileges = await routinePrivileges(client, `${ext}.signature_probe(text)`, role);
            expect(privileges.grantable).toBe(true);
            expect(privileges.publicAllowed).toBe(false);
            expect(privileges.runtimeAllowed).toBe(false);
            const observed = await captureExtensionContract(client, {
              name: "pg_trgm",
              provider: "neon",
              fixture: "migration-target-public-acl-drift",
            });
            const routine = observed.contract.members.find(
              (member) => member.kind === "routine" && member.name === "signature_probe",
            );
            assert(routine && routine.kind === "routine");
            expect(routine.publicExecute).toBe(false);
            expect(observed.digest).not.toBe(manifest.digest);
            expect(await installation()).toEqual(beforeInstallation);
          }
          for (const [index, mutation] of mutations.entries()) {
            if (index === 2) await revokeProbe();
            else await client.query(mutation);
            try {
              expect(await installation()).toEqual(beforeInstallation);
              await assert.rejects(applyMigrations(options), /SQL contract mismatch/);
            } finally {
              await client.query(reversals[index]!);
            }
          }
          const sentinel = defineSchema((f) => ({ tasks: { title: f.text() }, sentinel: { title: f.text() } }), {
            namespace,
          });
          const pending = await planMigration(first.snapshot, sentinel, [], first.hash, {
            scope: "application",
            extensions,
            requiredApi,
          });
          await writeMigration(root, "migrations", "sentinel", pending);
          await revokeProbe();
          try {
            await assert.rejects(applyMigrations(options), /SQL contract mismatch/);
            expect(
              (await client.query("SELECT to_regclass('api_native.sentinel') AS relation")).rows[0].relation,
            ).toBeNull();
            expect(
              (await client.query("SELECT hash FROM loom_api_native.migration_history WHERE namespace=$1", [namespace]))
                .rows,
            ).toEqual([{ hash: first.hash }]);
          } finally {
            await client.query(reversals[2]!);
          }
          await rm(join(root, "migrations", `${pending.hash}_sentinel`), { recursive: true });
          const indexed = defineSchema(
            (f) => ({ tasks: defineTable({ title: f.text() }, { indexes: [{ fields: ["title"] }] }) }),
            { namespace },
          );
          const custom = await planCustomMigration(
            first.snapshot,
            indexed,
            'CREATE INDEX CONCURRENTLY "tasks_title_index" ON "api_native"."tasks" ("title")',
            "nontransactional",
            first.hash,
            { scope: "application", extensions, requiredApi },
          );
          const index = custom.snapshot.ddl.find((entry) => entry.entityType === "indexes");
          assert(index && index.entityType === "indexes");
          const concurrent = {
            ...custom,
            statements: [`CREATE INDEX CONCURRENTLY ${quoteIdentifier(index.name)} ON "api_native"."tasks" ("title")`],
          };
          const { migrationHash } = await import("../../../apps/loom/src/tooling/migrations/planner");
          const artifact = { ...concurrent, hash: migrationHash(concurrent) };
          await writeMigration(root, "migrations", "concurrent", artifact);
          await revokeProbe();
          try {
            await assert.rejects(
              applyMigrations({ ...options, recoverNontransactional: true, reviewedHashes: [artifact.hash] }),
              /SQL contract mismatch/,
            );
            expect(
              (await client.query("SELECT to_regclass($1) AS relation", [`${namespace}.${index.name}`])).rows[0]
                .relation,
            ).toBeNull();
            expect((await client.query("SELECT hash FROM loom_api_native.nontransactional_migrations")).rows).toEqual(
              [],
            );
            expect(
              (await client.query("SELECT hash FROM loom_api_native.migration_history WHERE namespace=$1", [namespace]))
                .rows,
            ).toEqual([{ hash: first.hash }]);
          } finally {
            await client.query(reversals[2]!);
          }
        });
      } finally {
        await cleanupRole(url, role);
        await rm(root, { recursive: true, force: true });
      }
    });
  },
  120000,
);

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "named runtime privileges resolve exact overloads, inherited grants, operator backing procedures and type USAGE without executing functions",
  async () => {
    await withExtensionDatabase(async (url) => {
      const role = `runtime_${crypto.randomUUID().replaceAll("-", "")}`;
      const group = `group_${crypto.randomUUID().replaceAll("-", "")}`;
      const schemaName = 'Privilege "API"';
      const schema = quoted(schemaName);
      const { verifyRequiredApiOnTarget } =
        await import("../../../apps/loom/src/tooling/migrations/required-api-verification");
      try {
        await withMigrationConnection(url, async (client) => {
          await client.query(
            `CREATE ROLE ${quoteIdentifier(role)} NOLOGIN NOINHERIT; CREATE ROLE ${quoteIdentifier(group)} NOLOGIN; GRANT ${quoteIdentifier(group)} TO ${quoteIdentifier(role)}; CREATE SCHEMA ${schema}; CREATE EXTENSION fuzzystrmatch SCHEMA ${schema} VERSION '1.2'; GRANT USAGE ON SCHEMA ${schema} TO ${quoteIdentifier(group)}`,
          );
          const schemaRows = v.pipe(
            v.array(v.strictObject({ grantable: v.boolean(), groupAllowed: v.boolean(), runtimeAllowed: v.boolean() })),
            v.length(1),
          );
          async function schemaPrivileges() {
            const rows = v.parse(
              schemaRows,
              (
                await client.query(
                  "SELECT pg_catalog.has_schema_privilege(CURRENT_USER,n.oid,'USAGE WITH GRANT OPTION') AS grantable,pg_catalog.has_schema_privilege($2::name,n.oid,'USAGE') AS \"groupAllowed\",pg_catalog.has_schema_privilege($3::name,n.oid,'USAGE') AS \"runtimeAllowed\" FROM pg_catalog.pg_namespace n WHERE n.nspname=$1",
                  [schemaName, group, role],
                )
              ).rows,
            );
            return rows[0]!;
          }
          const capture = () =>
            captureExtensionContract(client, {
              name: "fuzzystrmatch",
              provider: "neon",
              fixture: "runtime-overload-gate",
            });
          const overload = `${schema}.levenshtein(text,text)`;
          const overloadBefore = await routinePrivileges(client, overload, role);
          await client.query(`REVOKE EXECUTE ON FUNCTION ${overload} FROM PUBLIC`);
          assertPublicRevoke(overloadBefore, await routinePrivileges(client, overload, role));
          const manifest = await capture();
          const payload = { format: 1, apis: [{ schema: schemaName, manifest }], fields: [], indexes: [] } as const;
          // Membership alone is insufficient when the named runtime role does not inherit grants.
          expect(await schemaPrivileges()).toEqual({ grantable: true, groupAllowed: true, runtimeAllowed: false });
          await assert.rejects(verifyRequiredApiOnTarget(client, payload, role), /runtime.*USAGE|USAGE.*runtime/i);
          await client.query(
            `ALTER ROLE ${quoteIdentifier(role)} INHERIT; GRANT ${quoteIdentifier(group)} TO ${quoteIdentifier(role)} WITH INHERIT TRUE`,
          );
          expect(await schemaPrivileges()).toEqual({ grantable: true, groupAllowed: true, runtimeAllowed: true });
          if (overloadBefore.grantable) {
            await assert.rejects(
              verifyRequiredApiOnTarget(client, payload, role),
              /runtime.*EXECUTE|EXECUTE.*runtime/i,
            );
            await client.query(`GRANT EXECUTE ON FUNCTION ${overload} TO ${quoteIdentifier(group)}`);
          } else {
            // Provider-owned PUBLIC access is immutable to this migration role; do not claim a denied overload.
            expect((await routinePrivileges(client, overload, role)).runtimeAllowed).toBe(true);
          }
          expect((await routinePrivileges(client, overload, role)).runtimeAllowed).toBe(true);
          expect((await capture()).digest).toBe(manifest.digest);
          await verifyRequiredApiOnTarget(client, payload, role);
          await client.query(`REVOKE USAGE ON SCHEMA ${schema} FROM ${quoteIdentifier(group)}`);
          expect(await schemaPrivileges()).toEqual({ grantable: true, groupAllowed: false, runtimeAllowed: false });
          expect((await capture()).digest).toBe(manifest.digest);
          await assert.rejects(verifyRequiredApiOnTarget(client, payload, role), /runtime.*USAGE|USAGE.*runtime/i);
          await client.query(
            `GRANT USAGE ON SCHEMA ${schema} TO ${quoteIdentifier(group)}; CREATE EXTENSION citext SCHEMA ${schema} VERSION '1.8'`,
          );
          expect(await schemaPrivileges()).toEqual({ grantable: true, groupAllowed: true, runtimeAllowed: true });
          const type = `${schema}.citext`;
          const typeBefore = await typePrivileges(client, type, role);
          await client.query(`REVOKE USAGE ON TYPE ${type} FROM PUBLIC`);
          assertPublicRevoke(typeBefore, await typePrivileges(client, type, role));
          const citext = await captureExtensionContract(client, {
            name: "citext",
            provider: "neon",
            fixture: "runtime-type-gate",
          });
          const typed = {
            format: 1,
            apis: [{ schema: schemaName, manifest: citext }],
            fields: [],
            indexes: [],
          } as const;
          if (typeBefore.grantable) {
            await assert.rejects(verifyRequiredApiOnTarget(client, typed, role), /runtime.*USAGE|USAGE.*runtime/i);
            await client.query(`GRANT USAGE ON TYPE ${type} TO ${quoteIdentifier(group)}`);
          } else {
            expect((await typePrivileges(client, type, role)).runtimeAllowed).toBe(true);
          }
          expect((await typePrivileges(client, type, role)).runtimeAllowed).toBe(true);
          expect(
            (
              await captureExtensionContract(client, {
                name: "citext",
                provider: "neon",
                fixture: "runtime-type-after-grant",
              })
            ).digest,
          ).toBe(citext.digest);
          await verifyRequiredApiOnTarget(client, typed, role);
          await client.query(`CREATE EXTENSION pg_trgm SCHEMA ${schema} VERSION '1.6'`);
          const setter = `${schema}.set_limit(real)`;
          const internal = `${schema}.gtrgm_consistent(internal,text,smallint,oid,internal)`;
          const backing = `${schema}.similarity_op(text,text)`;
          const setterBefore = await routinePrivileges(client, setter, role);
          const internalBefore = await routinePrivileges(client, internal, role);
          const backingBefore = await routinePrivileges(client, backing, role);
          await client.query(`REVOKE EXECUTE ON FUNCTION ${setter}, ${internal}, ${backing} FROM PUBLIC`);
          assertPublicRevoke(setterBefore, await routinePrivileges(client, setter, role));
          assertPublicRevoke(internalBefore, await routinePrivileges(client, internal, role));
          assertPublicRevoke(backingBefore, await routinePrivileges(client, backing, role));
          const trgm = await captureExtensionContract(client, {
            name: "pg_trgm",
            provider: "neon",
            fixture: "operator-backing-runtime-gate",
          });
          const operators = {
            format: 1,
            apis: [{ schema: schemaName, manifest: trgm }],
            fields: [],
            indexes: [],
          } as const;
          if (backingBefore.grantable) {
            await assert.rejects(
              verifyRequiredApiOnTarget(client, operators, role),
              /runtime.*EXECUTE|EXECUTE.*runtime/i,
            );
            await client.query(`GRANT EXECUTE ON FUNCTION ${backing} TO ${quoteIdentifier(group)}`);
          } else {
            expect((await routinePrivileges(client, backing, role)).runtimeAllowed).toBe(true);
          }
          expect((await routinePrivileges(client, backing, role)).runtimeAllowed).toBe(true);
          expect(
            (
              await captureExtensionContract(client, {
                name: "pg_trgm",
                provider: "neon",
                fixture: "operator-backing-after-grant",
              })
            ).digest,
          ).toBe(trgm.digest);
          // Observe which tooling/internal privileges actually remain denied; provider no-op revokes are not denial evidence.
          expect((await routinePrivileges(client, setter, role)).runtimeAllowed).toBe(!setterBefore.grantable);
          expect((await routinePrivileges(client, internal, role)).runtimeAllowed).toBe(!internalBefore.grantable);
          await verifyRequiredApiOnTarget(client, operators, role);
        });
      } finally {
        await cleanupRole(url, role);
        await cleanupRole(url, group);
      }
    });
  },
  120000,
);
