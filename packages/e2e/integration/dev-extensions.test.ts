import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, realpath, symlink, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { initializeProject, prepareProject, synchronizeDevelopment, DevelopmentReviewRequired } from "kello/tooling";
import type { DevelopmentDatabaseProvider, KelloExtensionsInput } from "kello/tooling";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { withMigrationConnection, quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "development prepares shared extensions, records extension-only work and refuses updates or adoption",
  async () => {
    await withExtensionDatabase(async (url) => {
      const root = await mkdtemp(join(tmpdir(), "loom-dev-extensions-"));
      const runtimeRole = `extension_role_${crypto.randomUUID().replaceAll("-", "")}`;
      const address = new URL(url);
      const api: DevelopmentDatabaseProvider = {
        getProject: async () => ({ id: "project", name: "tasks", regionId: "test", pgVersion: 18 }),
        listBranches: async () => [{ id: "br-developer", name: "developer", protected: false, isDefault: false }],
        listEndpoints: async () => [
          {
            id: address.hostname.split(".")[0]!,
            branchId: "br-developer",
            type: "read_write",
            autoscalingLimitMinCu: 0.25,
            autoscalingLimitMaxCu: 1,
            suspendTimeout: 300,
          },
        ],
        getConnectionUri: async () => ({ uri: url }),
      };
      async function configure(extensions: KelloExtensionsInput) {
        await writeFile(
          join(root, "kello.config.ts"),
          `import {defineConfig} from "kello/tooling"; export default defineConfig(${JSON.stringify({
            project: "tasks",
            database: { extensions },
            provider: { projectId: "project", targets: { development: { branchId: "br-developer" } } },
          })});`,
        );
        return prepareProject(root);
      }
      const options = {
        root,
        runtimeRole,
        databaseName: address.pathname.slice(1),
        migrationRole: decodeURIComponent(address.username),
      };
      try {
        await initializeProject(root, "tasks");
        await mkdir(join(root, "node_modules"), { recursive: true });
        for (const name of ["kello", "valibot", "drizzle-orm"])
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        const initial = await configure({ pg_trgm: { version: "1.3", schema: "app" } });
        const first = await synchronizeDevelopment({ ...options, sourceVersion: initial.version }, api);
        expect(first.applied).toBe(true);
        expect(first.extensions?.operations.map((operation) => operation.kind)).toEqual(["install"]);
        expect((await synchronizeDevelopment({ ...options, sourceVersion: initial.version }, api)).applied).toBe(false);
        const expanded = await configure({ pg_trgm: { version: "1.3", schema: "app" }, citext: { version: "1.8" } });
        const second = await synchronizeDevelopment({ ...options, sourceVersion: expanded.version }, api);
        expect(second.applied).toBe(true);
        expect(second.extensions?.operations.map((operation) => operation.after.name)).toEqual(["citext"]);
        await withMigrationConnection(url, async (client) => {
          const rows = await client.query<{ artifact: { format: number; statements: string[] } }>(
            "SELECT artifact FROM loom_meta.development_history ORDER BY ordinal",
          );
          expect(rows.rows).toHaveLength(2);
          expect(rows.rows[1]?.artifact.format).toBe(3);
          expect(rows.rows[1]?.artifact.statements).toEqual([]);
          await client.query(`SET ROLE ${quoteIdentifier(runtimeRole)}`);
          expect(
            (
              await client.query(
                "SELECT 'Hello'::extensions.citext OPERATOR(extensions.=) 'hello'::extensions.citext AS same",
              )
            ).rows,
          ).toEqual([{ same: true }]);
          await assert.rejects(client.query("CREATE EXTENSION hstore"), /permission/i);
          await client.query("RESET ROLE");
        });
        const changed = await configure({ pg_trgm: { version: "1.6", schema: "app" }, citext: { version: "1.8" } });
        await assert.rejects(synchronizeDevelopment({ ...options, sourceVersion: changed.version }, api), (cause) => {
          expect(cause instanceof DevelopmentReviewRequired).toBe(true);
          return true;
        });
        await withMigrationConnection(url, async (client) => {
          expect((await client.query("SELECT extversion FROM pg_extension WHERE extname='pg_trgm'")).rows).toEqual([
            { extversion: "1.3" },
          ]);
          await client.query("CREATE EXTENSION hstore SCHEMA extensions VERSION '1.8'");
        });
        const adoption = await configure({
          pg_trgm: { version: "1.3", schema: "app" },
          citext: { version: "1.8" },
          hstore: { version: "1.8" },
        });
        await assert.rejects(synchronizeDevelopment({ ...options, sourceVersion: adoption.version }, api), /review/);
        await withMigrationConnection(url, async (client) =>
          expect((await client.query("SELECT * FROM loom_meta.development_history")).rows).toHaveLength(2),
        );
        expect(await readFile(join(root, "kello.config.ts"), "utf8")).toContain("hstore");
      } finally {
        await withMigrationConnection(url, async (client) => {
          if ((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [runtimeRole])).rowCount) {
            await client.query(`DROP OWNED BY ${quoteIdentifier(runtimeRole)}`);
            await client.query(`DROP ROLE ${quoteIdentifier(runtimeRole)}`);
          }
        });
        await rm(root, { recursive: true, force: true });
      }
    });
  },
);
