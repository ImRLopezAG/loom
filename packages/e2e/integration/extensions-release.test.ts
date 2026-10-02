import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, mkdir, realpath, symlink, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { initializeProject, prepareProject, generateRelease, withNeonReleaseDatabase } from "loom/tooling";
import type { DeploymentDatabaseProvider } from "loom/tooling";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "extension releases bind receipts, recheck activation and require retained work to drain",
  async () => {
    await withExtensionDatabase(async (url) => {
      const root = await mkdtemp(join(tmpdir(), "loom-extension-release-"));
      const role = `extension_runtime_${crypto.randomUUID().replaceAll("-", "")}`;
      const address = new URL(url);
      const env = `LOOM_EXTENSION_RELEASE_${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`;
      process.env[env] = url;
      const admin = new pg.Client({ connectionString: url });
      await admin.connect();
      const api: DeploymentDatabaseProvider = {
        getProject: async () => ({ id: "project", name: "extensions", regionId: "test", pgVersion: 18 }),
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
      async function configure(version: string) {
        await writeFile(
          join(root, "loom.config.ts"),
          `import {defineConfig} from "loom/tooling"; export default defineConfig(${JSON.stringify({ project: "extensions", database: { migrationUrlEnv: env, extensions: { pg_trgm: { version } } }, provider: { projectId: "project", targets: { preview: { branchId: "br-preview" } } } })});`,
        );
        return prepareProject(root);
      }
      try {
        await initializeProject(root, "extensions");
        await mkdir(join(root, "node_modules"), { recursive: true });
        for (const name of ["loom", "valibot", "drizzle-orm"])
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        const first = await configure("1.3");
        const initial = await generateRelease(root, "initial");
        const options = {
          releaseKey: "a".repeat(64),
          inputHash: "b".repeat(64),
          activationToken: "c".repeat(64),
          deployment: "preview",
          version: first.version,
          environment: "preview" as const,
          databaseName: address.pathname.slice(1),
          migrationRole: decodeURIComponent(address.username),
          runtimeRole: role,
          quarantine: "clone" as const,
          reviewedHashes: [],
          migrationHashes: [initial.plan.hash],
          schema: { minimum: initial.plan.after, maximum: initial.plan.after, target: initial.plan.after },
        };
        await withNeonReleaseDatabase(
          root,
          options,
          async ({ journal, activation }) => {
            assert.equal(journal.read().format, 2);
            assert.equal(journal.read().identity.extensions?.installed[0]?.version, "1.3");
            assert.equal(journal.read().identity.extensions?.changes[0]?.artifactHash, initial.plan.hash);
            await admin.query("CREATE SCHEMA moved; ALTER EXTENSION pg_trgm SET SCHEMA moved");
            await assert.rejects(activation.activate(), /extension|drift/i);
            await admin.query("ALTER EXTENSION pg_trgm SET SCHEMA extensions");
            await activation.activate();
            // These acknowledgements model a completed provider journal; actual provider health is covered separately.
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
          },
          api,
        );
        await admin.query("ALTER EXTENSION pg_trgm SET SCHEMA moved");
        let resumed = false;
        await assert.rejects(
          withNeonReleaseDatabase(
            root,
            options,
            async () => {
              resumed = true;
            },
            api,
          ),
          /inconsistent|extension|drift/i,
        );
        assert.equal(resumed, false);
        await admin.query("ALTER EXTENSION pg_trgm SET SCHEMA extensions");
        await withNeonReleaseDatabase(
          root,
          options,
          async ({ activation }) => {
            await activation.assertActive();
          },
          api,
        );
        const next = await configure("1.6");
        const update = await generateRelease(root, "update");
        assert.equal(update.plan.before, update.plan.after);
        const nextOptions = {
          ...options,
          quarantine: "preserve" as const,
          releaseKey: "f".repeat(64),
          version: next.version,
          migrationHashes: [initial.plan.hash, update.plan.hash],
          reviewedHashes: [update.plan.hash],
        };
        await assert.rejects(
          withNeonReleaseDatabase(root, nextOptions, async () => {}, api),
          /retire retained/i,
        );
        assert.equal(
          (await admin.query("SELECT extversion FROM pg_extension WHERE extname='pg_trgm'")).rows[0].extversion,
          "1.3",
        );
        assert.equal((await admin.query("SELECT count(*)::int AS n FROM loom_meta.migration_history")).rows[0].n, 1);
        // Model an already retired runtime with work still outstanding; retirement alone cannot bypass the drain.
        await admin.query("UPDATE loom_meta.deployment_activations SET state='retired'");
        await admin.query(
          `INSERT INTO loom_meta.jobs(id,deployment,deduplication_key,fingerprint,call,identity,due_at,max_attempts,retry_delay_seconds) VALUES(gen_random_uuid(),'preview','retained',repeat('a',64),$1,'{}',now(),1,0)`,
          [JSON.stringify({ version: first.version })],
        );
        await assert.rejects(
          withNeonReleaseDatabase(root, nextOptions, async () => {}, api),
          /retire retained/i,
        );
        await admin.query("UPDATE loom_meta.jobs SET state='cancelled'");
        await withNeonReleaseDatabase(
          root,
          nextOptions,
          async ({ journal, activation }) => {
            assert.equal(journal.read().identity.extensions?.installed[0]?.version, "1.6");
            await activation.activate();
            await activation.assertActive();
          },
          api,
        );
        assert.equal(
          (await admin.query("SELECT extversion FROM pg_extension WHERE extname='pg_trgm'")).rows[0].extversion,
          "1.6",
        );
        assert.equal((await admin.query("SELECT count(*)::int AS n FROM loom_meta.migration_history")).rows[0].n, 2);
      } finally {
        delete process.env[env];
        if ((await admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
          await admin.query(`DROP OWNED BY ${quoteIdentifier(role)}`);
          await admin.query(`DROP ROLE ${quoteIdentifier(role)}`);
        }
        await admin.end();
        await rm(root, { recursive: true, force: true });
      }
    });
  },
  120000,
);
