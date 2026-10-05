import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import * as v from "valibot";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineSchema } from "kello/server";
import {
  defineConfig,
  emptySnapshot,
  planMigration,
  writeMigration,
  applyMigrations,
  readMigrations,
} from "kello/tooling";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  withMigrationConnection,
  acquireExtensionLock,
  quoteIdentifier,
  extensionProviderEvidence,
} from "../../../apps/loom/src/tooling/migrations/connection";
import { bindNeonExtensionProvider } from "../../../apps/loom/src/tooling/deploy/neon/extension-provider";
import { inspectExtensions, planExtensions } from "../../../apps/loom/src/tooling/migrations/extensions";
import {
  captureSchemaBaseline,
  establishSchemaBaseline,
  verifyParentDataBaselines,
} from "../../../apps/loom/src/tooling/migrations/branch-baseline";
import { withCloneSourceGuard } from "../../../apps/loom/src/tooling/deploy/neon/extension-quarantine";
import { ormHistoryTable } from "../../../apps/loom/src/tooling/migrations/state";

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "schema-only baseline prepares a missing committed capability and reobserves completed adoption",
  async () => {
    await withExtensionDatabase(async (sourceUrl) =>
      withExtensionDatabase(async (targetUrl) => {
        const root = await mkdtemp(join(tmpdir(), "loom-extension-branch-"));
        const runtimeRole = `extension_role_${crypto.randomUUID().replaceAll("-", "")}`;
        try {
          const schema = defineSchema((s) => ({ tasks: { title: s.text() } }), { namespace: "app" });
          const extensions = await withMigrationConnection(sourceUrl, async (client) =>
            planExtensions(
              defineConfig({ database: { extensions: { pg_trgm: { version: "1.6" } } } }).database.extensions,
              await inspectExtensions(client),
            ),
          );
          const plan = await planMigration(await emptySnapshot("app"), schema, [], null, {
            scope: "application",
            extensions,
          });
          await writeMigration(root, "migrations", "initial", plan);
          for (const connectionString of [sourceUrl, targetUrl])
            await applyMigrations({ connectionString, root, migrations: "migrations", namespace: "app", runtimeRole });
          const artifacts = await readMigrations(root, "migrations");
          await withMigrationConnection(sourceUrl, async (source) => {
            const baseline = await captureSchemaBaseline(
              source,
              { namespace: "app", metadataNamespace: "loom_meta" },
              artifacts,
            );
            await withMigrationConnection(targetUrl, async (target) => {
              await verifyParentDataBaselines(source, target, [{ baseline, artifacts }]);
              await verifyParentDataBaselines(source, target, [{ baseline, artifacts }]);
              expect(
                (await target.query("SELECT count(*)::int AS count FROM loom_meta.migration_history")).rows[0]?.count,
              ).toBe(1);
              await target.query("ALTER EXTENSION pg_trgm SET SCHEMA app");
              await assert.rejects(
                verifyParentDataBaselines(source, target, [{ baseline, artifacts }]),
                /extension drift/i,
              );
              await target.query("ALTER EXTENSION pg_trgm SET SCHEMA extensions");
            });
          });
          await withMigrationConnection(targetUrl, async (client) => {
            await client.query(
              `TRUNCATE loom_meta.framework_migrations, loom_meta.migration_history, loom_meta.table_revisions, loom_meta.${quoteIdentifier(ormHistoryTable("app"))}`,
            );
            await client.query("DROP EXTENSION pg_trgm");
          });
          await withMigrationConnection(sourceUrl, async (source) => {
            const baseline = await captureSchemaBaseline(
              source,
              { namespace: "app", metadataNamespace: "loom_meta" },
              artifacts,
            );
            await withMigrationConnection(targetUrl, async (target) => {
              await establishSchemaBaseline(source, target, baseline, artifacts);
              expect((await target.query("SELECT extversion FROM pg_extension WHERE extname='pg_trgm'")).rows).toEqual([
                { extversion: "1.6" },
              ]);
              await establishSchemaBaseline(source, target, baseline, artifacts);
              expect((await target.query("SELECT hash FROM loom_meta.migration_history")).rows).toEqual([
                { hash: plan.hash },
              ]);
              await target.query("ALTER EXTENSION pg_trgm SET SCHEMA app");
              await assert.rejects(establishSchemaBaseline(source, target, baseline, artifacts), /extension drift/i);
            });
          });
          await withMigrationConnection(sourceUrl, async (source) => {
            await acquireExtensionLock(source);
            await source.query("ALTER EXTENSION pg_trgm SET SCHEMA app");
            await assert.rejects(
              captureSchemaBaseline(source, { namespace: "app", metadataNamespace: "loom_meta" }, artifacts),
              /consistent/,
            );
          });
        } finally {
          for (const url of [sourceUrl, targetUrl])
            await withMigrationConnection(url, (client) =>
              client.query(`DROP OWNED BY ${quoteIdentifier(runtimeRole)}`),
            );
          await withMigrationConnection(sourceUrl, (client) =>
            client.query(`DROP ROLE IF EXISTS ${quoteIdentifier(runtimeRole)}`),
          );
          await rm(root, { recursive: true, force: true });
        }
      }),
    );
  },
);

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "cron compute evidence distinguishes the provider default from disabled suspension",
  async () => {
    await withExtensionDatabase(async (url) =>
      withMigrationConnection(url, async (client) => {
        let suspendTimeout = 0;
        const target = { projectId: "project", branchId: "branch", endpointId: "endpoint" };
        const provider = {
          async listEndpoints() {
            return [
              {
                id: "endpoint",
                branchId: "branch",
                type: "read_write" as const,
                autoscalingLimitMinCu: 0.25 as const,
                autoscalingLimitMaxCu: 0.25 as const,
                suspendTimeout,
              },
            ];
          },
        };
        await bindNeonExtensionProvider(client, provider, target);
        expect(extensionProviderEvidence(client).activeCompute).toBe(false);
        suspendTimeout = -1;
        await bindNeonExtensionProvider(client, provider, target);
        expect(extensionProviderEvidence(client).activeCompute).toBe(true);
        await assert.rejects(
          bindNeonExtensionProvider(client, provider, { ...target, endpointId: "changed" }),
          /identity changed/,
        );
      }),
    );
  },
);

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "pre-create guard refuses mocked runnable cron before calling a provider",
  async () => {
    await withExtensionDatabase(async (url) =>
      withMigrationConnection(url, async (source) => {
        await acquireExtensionLock(source);
        const query = source.query.bind(source);
        let creates = 0;
        // This fixture models the provider's cron catalogue; contrib PostgreSQL does not preload pg_cron.
        source.query = new Proxy(query, {
          apply(target, _receiver, args) {
            assert.equal(args.length, 1);
            const sql = v.parse(v.string(), args[0]);
            if (sql.includes("extname IN ('pg_cron'"))
              return Promise.resolve({ rows: [{ extname: "pg_cron" }], rowCount: 1 });
            if (sql === "LOCK TABLE cron.job IN SHARE MODE") return Promise.resolve({ rows: [], rowCount: 0 });
            if (sql === "SELECT 1 FROM cron.job WHERE active LIMIT 1")
              return Promise.resolve({ rows: [{ value: 1 }], rowCount: 1 });
            return target(sql);
          },
        });
        await assert.rejects(
          withCloneSourceGuard(source, async () => {
            creates++;
          }),
          /Disable inherited cron/,
        );
        expect(creates).toBe(0);
        source.query = query;
        await withCloneSourceGuard(source, async () => {
          creates++;
        });
        expect(creates).toBe(1);
      }),
    );
  },
);
