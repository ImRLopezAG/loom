import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import pg from "pg";
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
async function databaseFixture(operation: (url: string) => Promise<void>) {
  if (!connectionString) throw new Error("Missing PostgreSQL 18 extension fixture");
  const admin = new pg.Client({ connectionString });
  const name = `loom_ext_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(connectionString);
  url.pathname = `/${name}`;
  await admin.connect();
  try {
    const binaries = await admin.query<{ name: string }>(
      "SELECT DISTINCT name FROM pg_available_extension_versions WHERE name=ANY($1::name[])",
      [["pg_trgm", "citext", "hstore", "uuid-ossp", "cube", "earthdistance"]],
    );
    assert.equal(binaries.rowCount, 6, "The PostgreSQL 18 fixture must include contrib extension binaries");
    await admin.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
    await operation(url.href);
  } finally {
    await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`);
    await admin.end();
  }
}

test.skipIf(!connectionString)(
  "actual extension installation is exact, secure and idempotent with portable observations",
  async () => {
    await databaseFixture(async (url) => {
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
    await databaseFixture(async (url) => {
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
    await databaseFixture(async (url) => {
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
    await databaseFixture(async (url) => {
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
      });
    });
  },
);

test.skipIf(!connectionString)(
  "conflicting extension installs serialize and the second refuses its stale plan",
  async () => {
    await databaseFixture(async (url) => {
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
    await databaseFixture(async (url) => {
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
