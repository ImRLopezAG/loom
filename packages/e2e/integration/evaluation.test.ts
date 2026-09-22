import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import { bootstrapDatabase, installRevisionTracking } from "@loom/tooling";
import {
  connectDatabase,
  createDispatcher,
  createRevisionReader,
  defineSchema,
  evaluateDatabaseQuery,
  FunctionAccessDenied,
  query,
  internalQuery,
  action,
} from "@loom/core/server";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "live evaluation reads authorization, query data and revisions from one snapshot",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadata = `loom_${suffix}`;
    const namespace = `app_${suffix}`;
    const role = `runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace: metadata, runtimeRole: role });
      await admin.query(`CREATE SCHEMA "${namespace}"`);
      await admin.query(`CREATE TABLE "${namespace}".tasks (title text NOT NULL)`);
      await admin.query(`CREATE TABLE "${namespace}".permissions (allowed boolean NOT NULL)`);
      await admin.query(`INSERT INTO "${namespace}".tasks VALUES ('old')`);
      await admin.query(`INSERT INTO "${namespace}".permissions VALUES (true)`);
      await admin.query("BEGIN");
      await installRevisionTracking(admin, namespace, metadata, ["tasks", "permissions"]);
      await admin.query("COMMIT");
      await admin.query(`GRANT USAGE ON SCHEMA "${namespace}" TO "${role}"`);
      await admin.query(`GRANT SELECT ON ALL TABLES IN SCHEMA "${namespace}" TO "${role}"`);
      await admin.query(`ALTER ROLE "${role}" LOGIN PASSWORD 'loom-test-only'`);
      const address = new URL(connectionString);
      address.username = role;
      address.password = "loom-test-only";
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: address.href,
      });
      try {
        const tables = ["tasks", "permissions"];
        const revisions = createRevisionReader({ namespace, metadataNamespace: metadata, tables });
        expect(() => createRevisionReader({ namespace, metadataNamespace: metadata, tables: [] })).toThrow();
        expect(() =>
          createRevisionReader({ namespace, metadataNamespace: metadata, tables: ["tasks; DROP TABLE tasks"] }),
        ).toThrow();
        tables.length = 0;
        const started = Promise.withResolvers<void>();
        const resume = Promise.withResolvers<void>();
        let pause = true;
        let calls = 0;
        const definition = query({
          args: v.null(),
          returns: v.string(),
          handler: async (context) => {
            calls++;
            if (pause) {
              started.resolve();
              await resume.promise;
            }
            return (
              (await context.db.execute<{ title: string }>(sql`SELECT title FROM ${sql.identifier(namespace)}.tasks`))
                .rows[0]?.title ?? "missing"
            );
          },
        });
        const options = {
          authorize: async (context: { readonly db?: NodePgDatabase }) => {
            if (!context.db) throw new FunctionAccessDenied();
            const result = await context.db.execute<{ allowed: boolean }>(
              sql`SELECT allowed FROM ${sql.identifier(namespace)}.permissions`,
            );
            if (!result.rows[0]?.allowed) throw new FunctionAccessDenied();
          },
        };
        const version = "a".repeat(64);
        const functions = {
          "tasks:read": definition,
          "tasks:private": internalQuery({ args: v.null(), returns: v.null(), handler: () => null }),
          "tasks:action": action({ args: v.null(), returns: v.null(), handler: () => null }),
        };
        const dispatcher = createDispatcher({ connection, version, functions, revisions, ...options });
        const call = { name: "tasks:read", kind: "query" as const, version, args: null };
        const pending = dispatcher.evaluate(call, null);
        await started.promise;
        await admin.query(`UPDATE "${namespace}".tasks SET title = 'new'`);
        resume.resolve();
        expect(await pending).toMatchObject({ ok: true, value: "old", revisions: { permissions: "1", tasks: "1" } });
        pause = false;
        expect(await evaluateDatabaseQuery(connection, definition, null, revisions, options)).toEqual({
          value: "new",
          revisions: { permissions: "1", tasks: "2" },
        });
        expect(await dispatcher.evaluate({ ...call, version: "b".repeat(64) }, null)).toMatchObject({
          ok: false,
          error: { code: "VERSION_MISMATCH" },
        });
        expect(await dispatcher.evaluate({ ...call, name: "tasks:private" }, null)).toMatchObject({
          ok: false,
          error: { code: "NOT_FOUND" },
        });
        expect(await dispatcher.evaluate({ ...call, name: "tasks:action", kind: "action" }, null)).toMatchObject({
          ok: false,
          error: { code: "NOT_FOUND" },
        });
        expect(await dispatcher.evaluate({ ...call, args: 1 }, null)).toMatchObject({
          ok: false,
          error: { code: "INVALID_ARGUMENTS" },
        });
        const disabled = createDispatcher({ connection, version, functions, ...options });
        expect(await disabled.evaluate(call, null)).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
        await admin.query(`UPDATE "${namespace}".permissions SET allowed = false`);
        expect(await revisions(connection.db)).toEqual({ permissions: "2", tasks: "2" });
        await assert.rejects(
          evaluateDatabaseQuery(connection, definition, null, revisions, options),
          FunctionAccessDenied,
        );
        expect(calls).toBe(2);
        expect(await dispatcher.evaluate(call, null)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
        await admin.query(`UPDATE "${namespace}".permissions SET allowed = true`);
        await admin.query(
          `UPDATE "${metadata}".table_revisions SET revision = 9007199254740993 WHERE table_name = 'tasks'`,
        );
        expect((await revisions(connection.db)).tasks).toBe("9007199254740993");
        await admin.query(`DELETE FROM "${metadata}".table_revisions WHERE table_name = 'tasks'`);
        await assert.rejects(revisions(connection.db), /Missing tracked table revision/);
        expect(await dispatcher.evaluate(call, null)).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
        expect(connection.pool.idleCount).toBe(connection.pool.totalCount);
      } finally {
        await connection.close();
      }
    } finally {
      await admin.query("ROLLBACK");
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.query(`DROP SCHEMA IF EXISTS "${metadata}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${role}"`);
      await admin.end();
    }
  },
);
