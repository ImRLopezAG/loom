import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { action, connectDatabase, createDispatcher, defineSchema, mutation, query } from "@loom/core/server";
import { bootstrapDatabase } from "@loom/tooling";
import { defineRelations, sql } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "verified invocation identity drives RLS without leaking through a pooled session",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_auth_${suffix}`;
    const runtimeRole = `loom_runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      await admin.query(`CREATE TABLE "${metadataNamespace}".documents (
      id text PRIMARY KEY, issuer text NOT NULL, owner text NOT NULL, tenant text NOT NULL, title text NOT NULL
    )`);
      await admin.query(`INSERT INTO "${metadataNamespace}".documents VALUES
      ('a', 'trusted', 'alice', 'one', 'Alice'), ('b', 'trusted', 'bob', 'two', 'Bob')`);
      await admin.query(`ALTER TABLE "${metadataNamespace}".documents ENABLE ROW LEVEL SECURITY`);
      await admin.query(`CREATE POLICY document_owner ON "${metadataNamespace}".documents USING (
      issuer = (nullif(current_setting('loom.identity', true), '')::jsonb ->> 'issuer')
      AND owner = (nullif(current_setting('loom.identity', true), '')::jsonb ->> 'subject')
      AND tenant = (nullif(current_setting('loom.identity', true), '')::jsonb ->> 'tenantId')
    )`);
      await admin.query(`GRANT SELECT, UPDATE ON "${metadataNamespace}".documents TO "${runtimeRole}"`);
      const address = new URL(connectionString);
      address.username = runtimeRole;
      address.password = "loom-test-only";
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: address.href,
        maxConnections: 1,
      });
      try {
        const table = sql`${sql.identifier(metadataNamespace)}.${sql.identifier("documents")}`;
        const read = query({
          args: v.string(),
          returns: v.object({
            titles: v.array(v.string()),
            subject: v.nullable(v.string()),
            requestId: v.string(),
            pid: v.number(),
          }),
          handler: async (context, id) => {
            const rows = await context.db.execute<{ title: string }>(sql`SELECT title FROM ${table} WHERE id = ${id}`);
            const session = await context.db.execute<{ pid: number }>(sql`SELECT pg_backend_pid() AS pid`);
            return {
              titles: rows.rows.map((row) => row.title),
              subject: context.identity?.subject ?? null,
              requestId: context.requestId,
              pid: session.rows[0]?.pid ?? -1,
            };
          },
        });
        const changeTenant = mutation({
          args: v.string(),
          returns: v.null(),
          handler: async (context, tenant) => {
            await context.db.execute(sql`UPDATE ${table} SET tenant = ${tenant} WHERE id = 'a'`);
            return null;
          },
        });
        const who = action({
          args: v.null(),
          returns: v.nullable(v.string()),
          handler: (context) => context.identity?.subject ?? null,
        });
        const version = "c".repeat(64);
        const dispatcher = createDispatcher({
          connection,
          version,
          idempotency: { deployment: "authorization-test", metadataNamespace },
          functions: { "documents:read": read, "documents:move": changeTenant, "documents:who": who },
          authorize: async (context) => {
            if (!context.db) return;
            const bound = await context.db.execute<{ identity: string }>(
              sql`SELECT current_setting('loom.identity') AS identity`,
            );
            expect(bound.rows[0]?.identity).toBe(JSON.stringify(context.identity));
          },
        });
        const alice = { issuer: "trusted", subject: "alice", tenantId: "one" };
        const bob = { issuer: "trusted", subject: "bob", tenantId: "two" };
        const call = { name: "documents:read", kind: "query" as const, version, args: "a" };
        const first = await dispatcher.public(call, alice);
        expect(first).toMatchObject({
          ok: true,
          value: { titles: ["Alice"], subject: "alice", requestId: first.requestId },
        });
        const second = await dispatcher.public({ ...call, args: "b" }, bob);
        expect(second).toMatchObject({ ok: true, value: { titles: ["Bob"], subject: "bob" } });
        assert(first.ok && second.ok);
        const result = v.object({
          titles: v.array(v.string()),
          subject: v.nullable(v.string()),
          requestId: v.string(),
          pid: v.number(),
        });
        expect(v.parse(result, first.value).pid).toBe(v.parse(result, second.value).pid);
        expect(await dispatcher.public({ ...call, args: "b" }, alice)).toMatchObject({
          ok: true,
          value: { titles: [] },
        });
        for (const identity of [
          null,
          { ...alice, issuer: "other" },
          { ...alice, tenantId: "two" },
          { issuer: "trusted", subject: "alice" },
        ]) {
          expect(await dispatcher.public(call, identity)).toMatchObject({ ok: true, value: { titles: [] } });
        }
        expect(
          await dispatcher.public(
            { ...call, name: "documents:move", kind: "mutation", args: "two", idempotencyKey: "forged-tenant" },
            alice,
          ),
        ).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
        expect((await admin.query(`SELECT tenant FROM "${metadataNamespace}".documents WHERE id = 'a'`)).rows).toEqual([
          { tenant: "one" },
        ]);
        const outside = await connection.pool.query<{ identity: string | null }>(
          "SELECT nullif(current_setting('loom.identity', true), '') AS identity",
        );
        expect(outside.rows[0]?.identity).toBeNull();
        expect((await connection.db.execute(sql`SELECT * FROM ${table}`)).rows).toEqual([]);
        await assert.rejects(
          connection.db.execute(sql`CREATE TABLE ${sql.identifier(metadataNamespace)}.forbidden (id integer)`),
        );
        expect(await dispatcher.public(call, alice)).toMatchObject({ ok: true, value: { titles: ["Alice"] } });
        expect(
          await dispatcher.public({ ...call, name: "documents:who", kind: "action", args: null }, bob),
        ).toMatchObject({ ok: true, value: "bob" });
        expect(connection.pool.totalCount).toBe(1);
        expect(connection.pool.idleCount).toBe(1);
      } finally {
        await connection.close();
      }
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);
