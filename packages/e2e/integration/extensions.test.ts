import { withExtensionDatabase } from "../fixtures/extension-database";
import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineSchema } from "loom/server";
import {
  emptySnapshot,
  planMigration,
  planCustomMigration,
  writeMigration,
  applyMigrations,
  migrationStatus,
} from "loom/tooling";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgSchema, customType } from "drizzle-orm/pg-core";
import { inspectSnapshot } from "../../../apps/loom/src/tooling/migrations/adapter";
import { catalogFingerprint } from "../../../apps/loom/src/tooling/migrations/drift";
import { protectApplication } from "../../../apps/loom/src/tooling/migrations/application";
import { defineConfig } from "loom/tooling";
import {
  inspectExtensions,
  planExtensions,
  applyExtensionOperations,
  verifyExtensions,
  extensionStateHash,
} from "../../../apps/loom/src/tooling/migrations/extensions";
import {
  withMigrationConnection,
  acquireExtensionLock,
  quoteIdentifier,
} from "../../../apps/loom/src/tooling/migrations/connection";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;

for (const mode of ["install", "adopt"] as const)
  test.skipIf(!connectionString)(
    `an overlapping extension schema supports ${mode} before dependent native DDL without claiming extension members`,
    async () => {
      await withExtensionDatabase(async (url) => {
        const root = await mkdtemp(join(tmpdir(), "loom-extension-native-"));
        const runtimeRole = `extension_role_${crypto.randomUUID().replaceAll("-", "")}`;
        try {
          const table = pgSchema("app").table("typed_data", {
            properties: customType<{ data: string }>({ dataType: () => '"app"."hstore"' })("properties"),
          });
          const plan = await withMigrationConnection(url, async (client) => {
            if (mode === "adopt") {
              await client.query("CREATE SCHEMA app; CREATE EXTENSION hstore SCHEMA app VERSION '1.8'");
            }
            const extensions = planExtensions(
              defineConfig({ database: { extensions: { hstore: { version: "1.8", schema: "app" } } } }).database
                .extensions,
              await inspectExtensions(client),
            );
            return planMigration(
              await emptySnapshot("app"),
              { namespace: "app", tables: { typed_data: table } },
              [],
              null,
              { scope: "application", extensions },
            );
          });
          await writeMigration(root, "migrations", "initial", plan);
          if (mode === "adopt") {
            await assert.rejects(
              applyMigrations({ connectionString: url, root, migrations: "migrations", runtimeRole, namespace: "app" }),
              /requires review/,
            );
            await withMigrationConnection(url, (client) =>
              client.query("CREATE TABLE app.unmanaged(properties app.hstore)"),
            );
            expect(
              (await migrationStatus({ connectionString: url, root, migrations: "migrations", namespace: "app" }))
                .issues,
            ).toContain("UNTRACKED_NAMESPACE");
            await withMigrationConnection(url, (client) => client.query("DROP TABLE app.unmanaged"));
          }
          await applyMigrations({
            connectionString: url,
            root,
            migrations: "migrations",
            runtimeRole,
            namespace: "app",
            reviewedHashes: mode === "adopt" ? [plan.hash] : [],
          });
          await withMigrationConnection(url, async (client) => {
            await client.query(`SET ROLE ${quoteIdentifier(runtimeRole)}`);
            await client.query("INSERT INTO app.typed_data(properties) VALUES ('key=>value'::app.hstore)");
            expect(
              (await client.query("SELECT properties OPERATOR(app.->) 'key'::text AS value FROM app.typed_data")).rows,
            ).toEqual([{ value: "value" }]);
            await client.query("RESET ROLE");
            const snapshot = await inspectSnapshot(drizzle({ client }), "app");
            expect(
              snapshot.ddl.filter((entity) => entity.entityType === "tables").map((entity) => entity.name),
            ).toEqual(["typed_data"]);
          });
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

test.skipIf(!connectionString)(
  "the migration runner preflights review and replays each extension version with its dependent DDL",
  async () => {
    await withExtensionDatabase(async (url) => {
      const root = await mkdtemp(join(tmpdir(), "loom-extension-runner-"));
      const runtimeRole = `extension_role_${crypto.randomUUID().replaceAll("-", "")}`;
      const options = {
        root,
        connectionString: url,
        migrations: "migrations",
        namespace: "app",
        metadataNamespace: "loom_meta",
        runtimeRole,
      };
      const statusOptions = {
        root,
        connectionString: url,
        migrations: "migrations",
        namespace: "app",
        metadataNamespace: "loom_meta",
      };
      try {
        const schema = defineSchema((s) => ({ tasks: { title: s.text() } }), { namespace: "app" });
        const empty = await emptySnapshot("app");
        const structural = await planMigration(empty, schema);
        const initial = await withMigrationConnection(url, async (client) =>
          planExtensions(
            defineConfig({ database: { extensions: { pg_trgm: { version: "1.3" } } } }).database.extensions,
            await inspectExtensions(client),
          ),
        );
        const first = await planCustomMigration(
          empty,
          schema,
          [
            ...structural.statements,
            "INSERT INTO app.tasks(title) SELECT extversion FROM pg_extension WHERE extname='pg_trgm'",
          ].join("\n"),
          "transactional",
          null,
          { scope: "application", extensions: initial },
        );
        await writeMigration(root, "migrations", "initial", first);
        const before = initial.after[0]!;
        const after = { ...before, version: "1.6" };
        const update = {
          before: [before],
          after: [after],
          requirements: [after],
          operations: [{ kind: "update" as const, before, after }],
          automatic: false,
        };
        const second = await planCustomMigration(
          first.snapshot,
          schema,
          "INSERT INTO app.tasks(title) SELECT extversion FROM pg_extension WHERE extname='pg_trgm'",
          "transactional",
          first.hash,
          { scope: "application", extensions: update },
        );
        await writeMigration(root, "migrations", "update", second);
        await assert.rejects(applyMigrations({ ...options, reviewedHashes: [first.hash] }), /requires review/);
        await withMigrationConnection(url, async (client) => {
          expect((await inspectExtensions(client)).installed.some((entry) => entry.name === "pg_trgm")).toBe(false);
          const history = await client.query("SELECT to_regclass('loom_meta.migration_history') AS relation");
          if (history.rows[0]?.relation)
            expect((await client.query("SELECT * FROM loom_meta.migration_history")).rows).toEqual([]);
        });
        const receipt = await applyMigrations({ ...options, reviewedHashes: [first.hash, second.hash] });
        expect(receipt.applied).toEqual([first.hash, second.hash]);
        await withMigrationConnection(url, async (client) => {
          expect((await client.query("SELECT title FROM app.tasks ORDER BY title")).rows).toEqual([
            { title: "1.3" },
            { title: "1.6" },
          ]);
          expect((await inspectExtensions(client)).installed.find((entry) => entry.name === "pg_trgm")?.version).toBe(
            "1.6",
          );
        });
        const status = await migrationStatus(statusOptions);
        expect(status.consistent).toBe(true);
        expect(status.extensions?.required).toEqual([after]);
        expect(status.extensions?.pending).toEqual([]);
        expect((await applyMigrations({ ...options, reviewedHashes: [first.hash, second.hash] })).applied).toEqual([]);
        const removed = await planMigration(second.snapshot, schema, [], second.hash, {
          scope: "application",
          extensions: {
            before: [after],
            after: [after],
            requirements: [],
            operations: [],
            automatic: true,
          },
        });
        await writeMigration(root, "migrations", "retained_extension", removed);
        const extensionOnly = await applyMigrations({ ...options, reviewedHashes: [first.hash, second.hash] });
        expect(extensionOnly.applied).toEqual([removed.hash]);
        expect(extensionOnly.extensions?.required).toEqual([]);
        expect(extensionOnly.extensions?.installed).toEqual([after]);
        await withMigrationConnection(url, async (client) => {
          await client.query("CREATE SCHEMA moved_extensions");
          await client.query("ALTER EXTENSION pg_trgm SET SCHEMA moved_extensions");
        });
        expect((await migrationStatus(statusOptions)).issues).toContain("EXTENSION_DRIFT");
        await assert.rejects(
          applyMigrations({ ...options, reviewedHashes: [first.hash, second.hash] }),
          /extension drift/i,
        );
      } finally {
        await withMigrationConnection(url, async (client) => {
          await client.query(`DROP OWNED BY ${quoteIdentifier(runtimeRole)}`);
          await client.query(`DROP ROLE IF EXISTS ${quoteIdentifier(runtimeRole)}`);
        });
        await rm(root, { recursive: true, force: true });
      }
    });
  },
);

test.skipIf(!connectionString)(
  "a failed artifact rolls back its extension update and dependent DDL while preserving the prior artifact",
  async () => {
    await withExtensionDatabase(async (url) => {
      const root = await mkdtemp(join(tmpdir(), "loom-extension-rollback-"));
      const runtimeRole = `extension_role_${crypto.randomUUID().replaceAll("-", "")}`;
      try {
        const schema = defineSchema((s) => ({ tasks: { title: s.text() } }), { namespace: "app" });
        const initial = await withMigrationConnection(url, async (client) =>
          planExtensions(
            defineConfig({ database: { extensions: { pg_trgm: { version: "1.3" } } } }).database.extensions,
            await inspectExtensions(client),
          ),
        );
        const first = await planMigration(await emptySnapshot("app"), schema, [], null, {
          scope: "application",
          extensions: initial,
        });
        await writeMigration(root, "migrations", "initial", first);
        const before = initial.after[0]!;
        const after = { ...before, version: "1.6" };
        const second = await planCustomMigration(
          first.snapshot,
          schema,
          "INSERT INTO app.tasks(title) VALUES ('must roll back'); SELECT 1/0;",
          "transactional",
          first.hash,
          {
            scope: "application",
            extensions: {
              before: [before],
              after: [after],
              requirements: [after],
              operations: [{ kind: "update", before, after }],
              automatic: false,
            },
          },
        );
        await writeMigration(root, "migrations", "failing_update", second);
        await assert.rejects(
          applyMigrations({
            root,
            migrations: "migrations",
            namespace: "app",
            connectionString: url,
            runtimeRole,
            reviewedHashes: [second.hash],
          }),
          /Failed query: SELECT 1\/0/,
        );
        await withMigrationConnection(url, async (client) => {
          expect((await client.query("SELECT extversion FROM pg_extension WHERE extname='pg_trgm'")).rows).toEqual([
            { extversion: "1.3" },
          ]);
          expect((await client.query("SELECT title FROM app.tasks")).rows).toEqual([]);
          expect((await client.query("SELECT hash FROM loom_meta.migration_history")).rows).toEqual([
            { hash: first.hash },
          ]);
        });
        const status = await migrationStatus({
          root,
          migrations: "migrations",
          namespace: "app",
          connectionString: url,
        });
        expect(status.consistent).toBe(true);
        expect(status.pending.map((entry) => entry.hash)).toEqual([second.hash]);
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

test.skipIf(!connectionString)(
  "actual extension installation is exact, secure and idempotent with portable observations",
  async () => {
    await withExtensionDatabase(async (url) => {
      await withMigrationConnection(url, async (client) => {
        await acquireExtensionLock(client);
        const declarations = defineConfig({
          database: {
            extensions: {
              pg_trgm: { version: "1.6" },
              citext: { version: "1.8" },
              hstore: { version: "1.8", schema: "custom_extensions" },
              "uuid-ossp": { version: "1.1" },
            },
          },
        }).database.extensions;
        const plan = planExtensions(declarations, await inspectExtensions(client));
        expect(plan.before).toEqual([]);
        await client.query("BEGIN");
        await applyExtensionOperations(client, plan);
        await client.query("CREATE TABLE public.application_data (properties custom_extensions.hstore)");
        await client.query("COMMIT");
        const observed = await inspectExtensions(client);
        verifyExtensions(observed, plan.requirements);
        expect(planExtensions(declarations, observed, plan.after).operations).toEqual([]);
        expect(observed.schemas.find((schema) => schema.name === "extensions")).toMatchObject({
          owned: true,
          secure: true,
        });
        expect(extensionStateHash(plan.after)).toBe(extensionStateHash([...plan.after].reverse()));
        expect(observed.members.some((member) => member.name === "application_data")).toBe(false);
        const adoption = planExtensions(declarations, observed);
        expect(adoption.automatic).toBe(false);
        expect(adoption.operations.every((operation) => operation.kind === "adopt")).toBe(true);
      });
    });
  },
);

test.skipIf(!connectionString)(
  "reviewed PostgreSQL update paths and schema moves preserve dependent application data",
  async () => {
    await withExtensionDatabase(async (url) => {
      await withMigrationConnection(url, async (client) => {
        await acquireExtensionLock(client);
        const baseline = planExtensions(
          defineConfig({ database: { extensions: { pg_trgm: { version: "1.3" } } } }).database.extensions,
          await inspectExtensions(client),
        );
        await client.query("BEGIN");
        await applyExtensionOperations(client, baseline);
        await client.query("CREATE TABLE public.application_data (value text)");
        await client.query("INSERT INTO public.application_data VALUES ('preserved')");
        await client.query("COMMIT");
        const desired = defineConfig({
          database: { extensions: { pg_trgm: { version: "1.6", schema: "custom_extensions" } } },
        }).database.extensions;
        const update = planExtensions(desired, await inspectExtensions(client), baseline.after);
        expect(update.operations.map((operation) => operation.kind)).toEqual(["update", "move"]);
        expect(update.automatic).toBe(false);
        await client.query("BEGIN");
        await applyExtensionOperations(client, update);
        await client.query("COMMIT");
        verifyExtensions(await inspectExtensions(client), update.requirements);
        expect((await client.query("SELECT value FROM public.application_data")).rows).toEqual([
          { value: "preserved" },
        ]);
        const removed = planExtensions(undefined, await inspectExtensions(client), update.after);
        expect(removed.operations).toEqual([]);
        await client.query("BEGIN");
        await applyExtensionOperations(client, removed);
        await client.query("COMMIT");
        expect(
          (await inspectExtensions(client)).installed.find((extension) => extension.name === "pg_trgm")?.version,
        ).toBe("1.6");
      });
    });
  },
);

test.skipIf(!connectionString)(
  "failed dependent DDL rolls back installation and schema; stale preconditions leave no work",
  async () => {
    await withExtensionDatabase(async (url) => {
      await withMigrationConnection(url, async (client) => {
        await acquireExtensionLock(client);
        const initial = await inspectExtensions(client);
        expect(() =>
          planExtensions(
            defineConfig({ database: { extensions: { pg_trgm: { version: "^1.6" } } } }).database.extensions,
            initial,
          ),
        ).toThrow("unavailable");
        expect(() =>
          planExtensions(
            defineConfig({ database: { extensions: { earthdistance: { version: "1.2" } } } }).database.extensions,
            initial,
          ),
        ).toThrow("declare cube");
        const plan = planExtensions(
          defineConfig({ database: { extensions: { pg_trgm: { version: "1.6" } } } }).database.extensions,
          initial,
        );
        await assert.rejects(applyExtensionOperations(client, plan), /SAVEPOINT.*transaction/i);
        await client.query("BEGIN");
        try {
          await applyExtensionOperations(client, plan);
          await client.query("CREATE TABLE public.dependent_data(value text)");
          await assert.rejects(client.query("SELECT 1/0"), /division by zero/);
        } finally {
          await client.query("ROLLBACK");
        }
        const observed = await inspectExtensions(client);
        expect(observed.installed.some((extension) => extension.name === "pg_trgm")).toBe(false);
        expect(observed.schemas.some((schema) => schema.name === "extensions")).toBe(false);
        expect(
          (await client.query("SELECT to_regclass('public.dependent_data') AS relation")).rows[0]?.relation,
        ).toBeNull();
      });
    });
  },
);

test.skipIf(!connectionString)(
  "extension membership includes member-table indexes and columns but retains ordinary type dependencies",
  async () => {
    await withExtensionDatabase(async (url) => {
      await withMigrationConnection(url, async (client) => {
        await acquireExtensionLock(client);
        const plan = planExtensions(
          defineConfig({ database: { extensions: { hstore: { version: "1.8", schema: "app" } } } }).database.extensions,
          await inspectExtensions(client),
        );
        await client.query("BEGIN");
        await applyExtensionOperations(client, plan);
        await client.query("CREATE TABLE app.provider_members(id integer PRIMARY KEY, value app.hstore)");
        await client.query("ALTER EXTENSION hstore ADD TABLE app.provider_members");
        await client.query("CREATE TABLE app.application_data(value app.hstore)");
        await client.query("COMMIT");
        const observed = await inspectExtensions(client);
        expect(observed.members.some((member) => member.schema === "app" && member.name === "provider_members")).toBe(
          true,
        );
        expect(
          observed.members.some((member) => member.schema === "app" && member.name === "provider_members_pkey"),
        ).toBe(true);
        expect(
          observed.members.some(
            (member) => member.kind === "table column" && member.identity === "app.provider_members.value",
          ),
        ).toBe(true);
        expect(observed.members.some((member) => member.schema === "app" && member.name === "application_data")).toBe(
          false,
        );
        const snapshot = await inspectSnapshot(drizzle({ client }), "app");
        expect(snapshot.ddl.filter((entity) => entity.entityType === "tables").map((entity) => entity.name)).toEqual([
          "application_data",
        ]);
        const fingerprint = await catalogFingerprint(client, "app");
        await client.query("ALTER TABLE app.provider_members ADD COLUMN provider_only text");
        expect(await catalogFingerprint(client, "app")).toBe(fingerprint);
        await client.query("ALTER TABLE app.application_data ADD COLUMN application_only text");
        expect(await catalogFingerprint(client, "app")).not.toBe(fingerprint);
      });
    });
  },
);

test.skipIf(!connectionString)(
  "application protection preserves extension privileges and denies administration-table access",
  async () => {
    await withExtensionDatabase(async (url) =>
      withMigrationConnection(url, async (client) => {
        const role = `extension_role_${crypto.randomUUID().replaceAll("-", "")}`;
        await client.query(`CREATE ROLE ${quoteIdentifier(role)}`);
        try {
          await acquireExtensionLock(client);
          const plan = planExtensions(
            defineConfig({ database: { extensions: { hstore: { version: "1.8", schema: "app" } } } }).database
              .extensions,
            await inspectExtensions(client),
          );
          await client.query("BEGIN");
          await applyExtensionOperations(client, plan);
          await client.query("CREATE TABLE app.provider_members(id integer PRIMARY KEY, value app.hstore)");
          await client.query("ALTER EXTENSION hstore ADD TABLE app.provider_members");
          await client.query("CREATE TABLE app.application_data(value app.hstore)");
          await client.query("COMMIT");
          await protectApplication(client, "app", role, [], "loom_meta");
          const result = await client.query<{ member: boolean; application: boolean; routine: boolean }>(
            "SELECT has_table_privilege($1,'app.provider_members','SELECT') AS member, has_table_privilege($1,'app.application_data','SELECT') AS application, has_function_privilege($1,'app.hstore(text,text)','EXECUTE') AS routine",
            [role],
          );
          expect(result.rows[0]).toEqual({ member: false, application: true, routine: true });
        } finally {
          await client.query(`DROP OWNED BY ${quoteIdentifier(role)}`);
          await client.query(`DROP ROLE ${quoteIdentifier(role)}`);
        }
      }),
    );
  },
);

test.skipIf(!connectionString)(
  "conflicting extension installs serialize and the second refuses its stale plan",
  async () => {
    await withExtensionDatabase(async (url) => {
      const plans = await withMigrationConnection(url, async (client) => {
        const observed = await inspectExtensions(client);
        return [
          planExtensions(
            defineConfig({ database: { extensions: { pg_trgm: { version: "1.5" } } } }).database.extensions,
            observed,
          ),
          planExtensions(
            defineConfig({ database: { extensions: { pg_trgm: { version: "1.6", schema: "custom_extensions" } } } })
              .database.extensions,
            observed,
          ),
        ];
      });
      const installed = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const secondStarted = Promise.withResolvers<void>();
      const first = withMigrationConnection(url, async (client) => {
        await acquireExtensionLock(client);
        await client.query("BEGIN");
        await applyExtensionOperations(client, plans[0]!);
        await client.query("COMMIT");
        installed.resolve();
        await release.promise;
      });
      await installed.promise;
      const second = withMigrationConnection(url, async (client) => {
        secondStarted.resolve();
        await acquireExtensionLock(client);
        await client.query("BEGIN");
        try {
          await applyExtensionOperations(client, plans[1]!);
        } finally {
          await client.query("ROLLBACK");
        }
      });
      const refused = assert.rejects(second, /stale operation precondition/);
      await secondStarted.promise;
      release.resolve();
      await Promise.all([first, refused]);
      await withMigrationConnection(url, async (client) => {
        const observed = await inspectExtensions(client);
        expect(observed.installed.find((extension) => extension.name === "pg_trgm")?.version).toBe("1.5");
        expect(observed.schemas.some((schema) => schema.name === "custom_extensions")).toBe(false);
      });
    });
  },
);

test.skipIf(!connectionString)(
  "extension preparation preserves custom schema ownership and refuses unsafe CREATE grants",
  async () => {
    await withExtensionDatabase(async (url) => {
      await withMigrationConnection(url, async (client) => {
        const role = `extension_role_${crypto.randomUUID().replaceAll("-", "")}`;
        await client.query(`CREATE ROLE ${quoteIdentifier(role)}`);
        try {
          await client.query(
            `GRANT CREATE ON DATABASE ${quoteIdentifier(new URL(url).pathname.slice(1))} TO ${quoteIdentifier(role)}`,
          );
          await client.query("CREATE SCHEMA custom_extensions");
          await client.query(`GRANT USAGE,CREATE ON SCHEMA custom_extensions TO ${quoteIdentifier(role)}`);
          await client.query(`SET ROLE ${quoteIdentifier(role)}`);
          const declaration = defineConfig({
            database: { extensions: { pg_trgm: { version: "1.6", schema: "custom_extensions" } } },
          }).database.extensions;
          const observed = await inspectExtensions(client);
          expect(() => planExtensions(declaration, observed)).toThrow("ownership");
          await client.query("RESET ROLE");
          await client.query("GRANT CREATE ON SCHEMA custom_extensions TO PUBLIC");
          const unsafe = await inspectExtensions(client);
          expect(() => planExtensions(declaration, unsafe)).toThrow("CREATE");
          expect(unsafe.installed.some((extension) => extension.name === "pg_trgm")).toBe(false);
          expect(
            (
              await client.query(
                "SELECT pg_get_userbyid(nspowner)=current_user AS owned FROM pg_namespace WHERE nspname='custom_extensions'",
              )
            ).rows[0]?.owned,
          ).toBe(true);
        } finally {
          await client.query("RESET ROLE");
          await client.query(`DROP OWNED BY ${quoteIdentifier(role)}`);
          await client.query(`DROP ROLE ${quoteIdentifier(role)}`);
        }
      });
    });
  },
);
