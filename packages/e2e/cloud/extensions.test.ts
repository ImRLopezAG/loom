import assert from "node:assert/strict";
import { test } from "bun:test";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, realpath, symlink, writeFile, rm, cp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  initializeProject,
  prepareProject,
  generateRelease,
  createKelloNeonApi,
  withNeonReleaseDatabase,
  provisionProjectBranch,
  migrationStatus,
} from "kello/tooling";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

test.skipIf(process.env.LOOM_CLOUD_EXTENSIONS !== "1")(
  "Neon PostgreSQL 18 verifies pinned capabilities, releases and both branch modes",
  async () => {
    const projectId = process.env.LOOM_CLOUD_PROJECT_ID;
    const branchId = process.env.LOOM_CLOUD_BRANCH_ID;
    const url = process.env.LOOM_MIGRATION_DATABASE_URL;
    const runtimeRole = process.env.LOOM_CLOUD_RUNTIME_ROLE;
    const receiptPath = process.env.LOOM_CLOUD_RECEIPT;
    assert(projectId && branchId && url && runtimeRole && receiptPath);
    const api = createKelloNeonApi();
    const parent = (await api.listBranches(projectId)).find((branch) => branch.id === branchId);
    assert(parent && !parent.protected && !parent.isDefault && parent.name.startsWith("loom-acceptance-"));
    const address = new URL(url);
    const databaseName = decodeURIComponent(address.pathname.slice(1));
    const migrationRole = decodeURIComponent(address.username);
    const root = await mkdtemp(join(tmpdir(), "loom-neon-extensions-"));
    const cli = createRequire(import.meta.resolve("kello/tooling")).resolve("neon/dist/index.js");
    async function neon(args: string[]) {
      const child = Bun.spawn(["node", cli, ...args, "--project-id", projectId!], {
        stdout: "pipe",
        stderr: "pipe",
        timeout: 90000,
      });
      const [output, , code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      assert.equal(code, 0, "Neon acceptance operation failed");
      return output.trim();
    }
    const names: string[] = [];
    const modes: string[] = [];
    const checks: string[] = [];
    const cleanupFailures: string[] = [];
    const owner = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15000 });
    let passed = false;
    let created = false;
    let testedVector: string | undefined;
    try {
      await owner.connect();
      assert.equal(
        (await owner.query("SELECT to_regnamespace('app') AS app,to_regnamespace('loom_meta') AS metadata")).rows[0]
          .app,
        null,
        "Extension acceptance requires a fresh disposable database",
      );
      assert.equal((await owner.query("SELECT to_regnamespace('loom_meta') AS metadata")).rows[0].metadata, null);
      const available = await owner.query<{ name: string; version: string }>(
        "SELECT name,version FROM pg_available_extension_versions WHERE name IN ('vector','pg_trgm') ORDER BY name,version",
      );
      assert(
        available.rows.some((entry) => entry.name === "vector" && entry.version === "0.8.6"),
        "Acceptance pin must actually be available",
      );
      testedVector = "0.8.6";
      assert(available.rows.some((entry) => entry.name === "pg_trgm" && entry.version === "1.3"));
      assert(available.rows.some((entry) => entry.name === "pg_trgm" && entry.version === "1.6"));
      const path = await owner.query(
        "SELECT path FROM pg_extension_update_paths('pg_trgm') WHERE source='1.3' AND target='1.6'",
      );
      assert(path.rows[0]?.path, "The acceptance update must have a supported path");
      await initializeProject(root, "extensions");
      const provisionRoot = process.env.LOOM_CLOUD_PROVISION_ROOT;
      assert(provisionRoot, "Retain the acceptance branch's guarded provisioning receipts");
      await cp(join(provisionRoot, ".loom/provision"), join(root, ".loom/provision"), { recursive: true });
      await mkdir(join(root, "node_modules"), { recursive: true });
      for (const name of ["kello", "valibot", "drizzle-orm"])
        await symlink(
          await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
          join(root, "node_modules", name),
        );
      async function configure(version: string) {
        await writeFile(
          join(root, "kello.config.ts"),
          `import {defineConfig} from "kello/tooling";export default defineConfig(${JSON.stringify({ project: "extensions", database: { extensions: { vector: { version: testedVector }, pg_trgm: { version, schema: "text_search" } } }, provider: { projectId, targets: { preview: { branchId } } }, deployment: { environment: "preview", deployment: "extensions", databaseName, migrationRole, runtimeRole, quarantine: "clone" } })});`,
        );
        return prepareProject(root);
      }
      const initialProject = await configure("1.3");
      const initial = await generateRelease(root, "initial");
      const options = {
        releaseKey: "a".repeat(64),
        inputHash: "b".repeat(64),
        activationToken: "c".repeat(64),
        deployment: "extensions",
        version: initialProject.version,
        environment: "preview" as const,
        databaseName,
        migrationRole,
        runtimeRole,
        quarantine: "clone" as const,
        reviewedHashes: [],
        migrationHashes: [initial.plan.hash],
        schema: { minimum: initial.plan.after, maximum: initial.plan.after, target: initial.plan.after },
      };
      created = true;
      await withNeonReleaseDatabase(root, options, async ({ activation, journal }) => {
        assert.equal(journal.read().format, 2);
        await activation.activate();
        await activation.assertActive();
      });
      checks.push("pinned-installation", "database-activation", "extension-receipt");
      const installed = async (client: pg.Client) =>
        (
          await client.query(
            "SELECT e.extname AS name,e.extversion AS version,n.nspname AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname IN ('vector','pg_trgm') ORDER BY e.extname",
          )
        ).rows;
      const expected = [
        { name: "pg_trgm", version: "1.3", schema: "text_search" },
        { name: "vector", version: testedVector, schema: "extensions" },
      ];
      assert.deepEqual(await installed(owner), expected);
      const password = crypto.randomUUID().replaceAll("-", "");
      await owner.query(`ALTER ROLE ${quoteIdentifier(runtimeRole)} LOGIN PASSWORD '${password}'`);
      const runtimeAddress = new URL(url);
      runtimeAddress.username = runtimeRole;
      runtimeAddress.password = password;
      const runtime = new pg.Client({ connectionString: runtimeAddress.href, connectionTimeoutMillis: 15000 });
      try {
        await runtime.connect();
        assert.equal(
          (await runtime.query("SELECT text_search.similarity('kello','kello') AS similarity")).rows[0].similarity,
          1,
        );
        assert.equal(
          (await runtime.query("SELECT '[1,2,3]'::extensions.vector::text AS vector")).rows[0].vector,
          "[1,2,3]",
        );
        await assert.rejects(
          runtime.query("CREATE EXTENSION hstore"),
          (cause) => cause instanceof Error && "code" in cause && cause.code === "42501",
        );
      } finally {
        await runtime.end();
      }
      checks.push("qualified-runtime-sql", "runtime-ddl-refused");
      console.info("Neon extension acceptance: verifying resumed release and version update");
      // Neon trusted-extension members belong to its administrative role, so owner relocation can be refused.
      // This fixture has no dependent application objects; recreate only its extension to exercise version drift.
      await owner.query("DROP EXTENSION pg_trgm; CREATE EXTENSION pg_trgm WITH SCHEMA text_search VERSION '1.6'");
      await assert.rejects(
        withNeonReleaseDatabase(root, options, async () => {
          throw new Error("Unexpected resumed callback");
        }),
        /inconsistent|drift|extension/i,
      );
      await owner.query("DROP EXTENSION pg_trgm; CREATE EXTENSION pg_trgm WITH SCHEMA text_search VERSION '1.3'");
      checks.push("acknowledged-release-drift-refused");
      const updatedProject = await configure("1.6");
      const update = await generateRelease(root, "update_pg_trgm");
      assert.equal(update.plan.before, update.plan.after);
      const updateOptions = {
        ...options,
        releaseKey: "d".repeat(64),
        quarantine: "preserve" as const,
        version: updatedProject.version,
        migrationHashes: [initial.plan.hash, update.plan.hash],
        reviewedHashes: [update.plan.hash],
      };
      await assert.rejects(
        withNeonReleaseDatabase(root, updateOptions, async () => {}),
        /retire retained/i,
      );
      // This disposable fixture has no functions, jobs or sessions; clear only its owned activation dependency.
      await owner.query("UPDATE loom_meta.deployment_activations SET state='retired' WHERE deployment='extensions'");
      await withNeonReleaseDatabase(root, updateOptions, async ({ activation }) => {
        await activation.activate();
        await activation.assertActive();
      });
      assert.deepEqual(await installed(owner), [
        { name: "pg_trgm", version: "1.6", schema: "text_search" },
        { name: "vector", version: testedVector, schema: "extensions" },
      ]);
      checks.push("retained-upgrade-refused", "supported-version-update", "extension-only-release");
      for (const mode of ["schema-only", "parent-data"] as const) {
        console.info(`Neon extension acceptance: provisioning ${mode}`);
        const name = `loom-acceptance-extensions-${mode}-${Date.now()}`;
        names.push(name);
        const file = `${mode}.json`;
        await writeFile(
          join(root, file),
          JSON.stringify({
            format: 1,
            key: createHash("sha256").update(name).digest("hex"),
            projectId,
            parentBranchId: branchId,
            branchName: name,
            environment: "development",
            initSource: mode,
          }),
        );
        const receipt = await provisionProjectBranch(root, file, undefined, AbortSignal.timeout(180000));
        assert.equal(receipt.state, "complete");
        assert("branchId" in receipt);
        console.info(`Neon extension acceptance: verifying ${mode} baseline`);
        assert.deepEqual(await provisionProjectBranch(root, file), receipt);
        const targetUrl = await neon([
          "connection-string",
          receipt.branchId,
          "--role-name",
          migrationRole,
          "--database-name",
          databaseName,
          "--ssl",
          "verify-full",
        ]);
        const target = new pg.Client({ connectionString: targetUrl });
        try {
          await target.connect();
          assert.deepEqual(await installed(target), [
            { name: "pg_trgm", version: "1.6", schema: "text_search" },
            { name: "vector", version: testedVector, schema: "extensions" },
          ]);
          const status = await migrationStatus({
            root,
            connectionString: targetUrl,
            namespace: "app",
            metadataNamespace: "loom_meta",
            migrations: "kello/_generated/migrations",
          });
          assert(status.consistent && status.pending.length === 0);
          await target.query("DROP EXTENSION pg_trgm; CREATE EXTENSION pg_trgm WITH SCHEMA text_search VERSION '1.3'");
          await assert.rejects(provisionProjectBranch(root, file), /drift|extension/i);
          await target.query("DROP EXTENSION pg_trgm; CREATE EXTENSION pg_trgm WITH SCHEMA text_search VERSION '1.6'");
          assert.deepEqual(await provisionProjectBranch(root, file), receipt);
          modes.push(mode);
        } finally {
          await target.end();
        }
        await neon(["branches", "delete", receipt.branchId, "--output", "json"]);
      }
      checks.push("both-branch-baselines", "completed-baseline-drift-refused");
      passed = true;
    } finally {
      for (const name of names) {
        try {
          for (const branch of (await api.listBranches(projectId)).filter((entry) => entry.name === name)) {
            assert(!branch.isDefault && !branch.protected && branch.id !== branchId);
            await neon(["branches", "delete", branch.id, "--output", "json"]);
          }
        } catch {
          cleanupFailures.push(name);
        }
      }
      try {
        if (created) {
          await owner.query("RESET ROLE");
          await owner.query(
            "DROP SCHEMA IF EXISTS app CASCADE; DROP SCHEMA IF EXISTS loom_meta CASCADE; DROP EXTENSION IF EXISTS vector; DROP EXTENSION IF EXISTS pg_trgm; DROP SCHEMA IF EXISTS extensions CASCADE; DROP SCHEMA IF EXISTS text_search CASCADE; DROP SCHEMA IF EXISTS drifted CASCADE",
          );
          await owner.query(`DROP ROLE ${quoteIdentifier(runtimeRole)}`);
        }
      } catch {
        cleanupFailures.push("source-fixture");
      }
      await owner.end();
      await writeFile(
        receiptPath,
        JSON.stringify(
          {
            projectId,
            branchId,
            passed: passed && cleanupFailures.length === 0,
            postgresVersion: 18,
            versions: { vector: testedVector, pg_trgm: ["1.3", "1.6"] },
            branchModes: modes,
            checks,
            cleanup: cleanupFailures.length === 0,
            cleanupFailures,
          },
          null,
          2,
        ),
      );
      await rm(root, { recursive: true, force: true });
      if (passed) assert.deepEqual(cleanupFailures, []);
    }
  },
  1200000,
);
