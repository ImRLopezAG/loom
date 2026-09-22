import { expect, test } from "bun:test";
import {
  connectDatabase,
  createDispatcher,
  defineSchema,
  FunctionAccessDenied,
  type FunctionAuthorization,
  mutation,
  mutationReplayWindowSeconds,
} from "@loom/core/server";
import { bootstrapDatabase } from "@loom/tooling";
import { defineRelations, sql } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "mutation replay is atomic, scoped, reauthorized and expires without executing again",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_replay_${suffix}`;
    const runtimeRole = `loom_runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      await admin.query(
        `CREATE TABLE "${metadataNamespace}".counter (value integer NOT NULL, allowed boolean NOT NULL)`,
      );
      await admin.query(`INSERT INTO "${metadataNamespace}".counter VALUES (0, true)`);
      await admin.query(`GRANT SELECT, UPDATE ON "${metadataNamespace}".counter TO "${runtimeRole}"`);
      await admin.query(`CREATE TABLE "${metadataNamespace}".effects (id uuid PRIMARY KEY)`);
      await admin.query(`GRANT INSERT ON "${metadataNamespace}".effects TO "${runtimeRole}"`);
      const address = new URL(connectionString);
      address.username = runtimeRole;
      address.password = "loom-test-only";
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: address.href,
      });
      try {
        const table = sql`${sql.identifier(metadataNamespace)}.${sql.identifier("counter")}`;
        let handlerCalls = 0;
        let authorizations = 0;
        let race = false;
        let arrivals = 0;
        const barrier = Promise.withResolvers<void>();
        const insertBarrier = Promise.withResolvers<void>();
        let insertArrivals = 0;
        const append = mutation({
          args: v.null(),
          returns: v.string(),
          handler: async (context) => {
            await context.db.execute(
              sql`INSERT INTO ${sql.identifier(metadataNamespace)}.effects VALUES (gen_random_uuid())`,
            );
            if (++insertArrivals === 2) insertBarrier.resolve();
            await insertBarrier.promise;
            return "saved";
          },
        });
        const increment = mutation({
          args: v.object({ amount: v.number(), label: v.string(), invalid: v.optional(v.boolean()) }),
          returns: v.number(),
          handler: async (context, args) => {
            handlerCalls++;
            if (race) {
              if (++arrivals === 2) barrier.resolve();
              await barrier.promise;
            }
            const result = await context.db.execute<{ value: number }>(
              sql`UPDATE ${table} SET value = value + ${args.amount} RETURNING value`,
            );
            return args.invalid ? Number.NaN : (result.rows[0]?.value ?? -1);
          },
        });
        const options = {
          connection,
          version: "a".repeat(64),
          functions: { "counter:increment": increment, "counter:append": append },
          idempotency: { deployment: "test-deployment", metadataNamespace },
          authorize: async (context: FunctionAuthorization) => {
            authorizations++;
            if (!context.db) throw new Error("Expected database authorization");
            const result = await context.db.execute<{ allowed: boolean }>(sql`SELECT allowed FROM ${table}`);
            if (!result.rows[0]?.allowed) throw new FunctionAccessDenied();
          },
        };
        const dispatcher = createDispatcher(options);
        expect(() =>
          createDispatcher({
            connection,
            version: options.version,
            functions: options.functions,
            authorize: options.authorize,
          }),
        ).toThrow("idempotency configuration");
        const identity = { issuer: "issuer", subject: "subject", tenantId: "tenant" };
        const call = {
          name: "counter:increment",
          kind: "mutation" as const,
          version: options.version,
          args: { amount: 1, label: "test" },
          idempotencyKey: "one",
        };
        const first = await dispatcher.public(call, identity);
        expect(first).toMatchObject({ ok: true, value: 1 });
        const replay = await createDispatcher(options).public(
          { ...call, args: { label: "test", amount: 1 } },
          identity,
        );
        expect(replay).toMatchObject({ ok: true, value: 1 });
        expect(replay.requestId).not.toBe(first.requestId);
        expect(handlerCalls).toBe(1);
        expect(authorizations).toBe(2);
        expect(await dispatcher.public({ ...call, args: { ...call.args, amount: 2 } }, identity)).toMatchObject({
          ok: false,
          error: { code: "IDEMPOTENCY_CONFLICT" },
        });
        expect(await dispatcher.public({ ...call, idempotencyKey: "" }, identity)).toMatchObject({
          ok: false,
          error: { code: "INVALID_IDEMPOTENCY_KEY" },
        });
        await admin.query(`UPDATE "${metadataNamespace}".counter SET allowed = false`);
        expect(await dispatcher.public(call, identity)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
        expect(handlerCalls).toBe(1);
        await admin.query(`UPDATE "${metadataNamespace}".counter SET allowed = true`);
        for (const other of [
          null,
          { ...identity, subject: "other" },
          { ...identity, issuer: "other" },
          { ...identity, tenantId: "other" },
        ]) {
          expect(await dispatcher.public(call, other)).toMatchObject({ ok: true });
        }
        expect(handlerCalls).toBe(5);
        const deployed = createDispatcher({ ...options, idempotency: { ...options.idempotency, deployment: "other" } });
        expect(await deployed.public(call, identity)).toMatchObject({ ok: true, value: 6 });
        const upgraded = createDispatcher({ ...options, version: "b".repeat(64) });
        expect(await upgraded.public({ ...call, version: "b".repeat(64) }, identity)).toMatchObject({
          ok: true,
          value: 7,
        });

        const invalid = { ...call, idempotencyKey: "invalid", args: { ...call.args, invalid: true } };
        expect(await dispatcher.public(invalid, identity)).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
        expect((await admin.query(`SELECT value FROM "${metadataNamespace}".counter`)).rows).toEqual([{ value: 7 }]);
        expect(
          (await admin.query(`SELECT count(*)::integer AS count FROM "${metadataNamespace}".mutation_results`)).rows,
        ).toEqual([{ count: 7 }]);
        expect(await dispatcher.public({ ...call, idempotencyKey: "invalid" }, identity)).toMatchObject({
          ok: true,
          value: 8,
        });

        race = true;
        const competing = { ...call, idempotencyKey: "concurrent" };
        const results = await Promise.all([
          dispatcher.public(competing, identity),
          dispatcher.public(competing, identity),
        ]);
        race = false;
        for (const result of results) expect(result).toMatchObject({ ok: true, value: 9 });
        expect(arrivals).toBe(2);
        const appendCall = { ...call, name: "counter:append", args: null, idempotencyKey: "concurrent-inserts" };
        const appended = await Promise.all([
          dispatcher.public(appendCall, identity),
          dispatcher.public(appendCall, identity),
        ]);
        for (const result of appended) expect(result).toMatchObject({ ok: true, value: "saved" });
        expect(insertArrivals).toBe(2);
        expect(
          (await admin.query(`SELECT count(*)::integer AS count FROM "${metadataNamespace}".effects`)).rows,
        ).toEqual([{ count: 1 }]);
        expect((await admin.query(`SELECT value FROM "${metadataNamespace}".counter`)).rows).toEqual([{ value: 9 }]);
        expect(mutationReplayWindowSeconds).toBe(86_400);
        await admin.query(
          `UPDATE "${metadataNamespace}".mutation_results SET expires_at = clock_timestamp() - interval '1 second'`,
        );
        const beforeExpiry = handlerCalls;
        expect(await dispatcher.public(call, identity)).toMatchObject({
          ok: false,
          error: { code: "IDEMPOTENCY_EXPIRED" },
        });
        expect(handlerCalls).toBe(beforeExpiry);
        expect(connection.pool.idleCount).toBe(connection.pool.totalCount);
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
