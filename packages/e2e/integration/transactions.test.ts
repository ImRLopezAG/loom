import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { channel } from "node:diagnostics_channel";
import { setImmediate } from "node:timers/promises";
import {
  connectDatabase,
  createDispatcher,
  defineSchema,
  executeDatabaseFunction,
  internalMutation,
  mutation,
  query,
  runInternalMutation,
  runFunctionTransaction,
  TransactionConflictError,
} from "@loom/core/server";
import { defineRelations, sql } from "drizzle-orm";
import * as v from "valibot";
import { bootstrapDatabase } from "@loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "public conflict exhaustion is bounded and never exposes database diagnostics",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({ connectionString, schema, relations: defineRelations(schema.tables) });
    let attempts = 0;
    const version = "a".repeat(64);
    const dispatcher = createDispatcher({
      connection,
      version,
      idempotency: { deployment: "conflict-test", metadataNamespace },
      authorize: async () => {},
      functions: {
        "tasks:conflict": mutation({
          args: v.null(),
          returns: v.null(),
          handler: async ({ db }) => {
            attempts++;
            await db.execute(sql`DO $$ BEGIN RAISE EXCEPTION 'private-database-payload' USING ERRCODE='40001'; END $$`);
            return null;
          },
        }),
      },
    });
    try {
      const result = await dispatcher.public(
        { name: "tasks:conflict", kind: "mutation", version, args: null, idempotencyKey: "conflict" },
        null,
      );
      expect(result).toMatchObject({
        ok: false,
        error: { code: "TRANSACTION_CONFLICT", message: "Database conflict retry budget exhausted" },
      });
      expect(attempts).toBe(3);
      expect(JSON.stringify(result)).not.toContain("private-database-payload");
      expect(JSON.stringify(result)).not.toContain("40001");
      expect((await connection.db.execute(sql`SELECT 1 AS healthy`)).rows).toEqual([{ healthy: 1 }]);
    } finally {
      await connection.db.execute(sql`DROP SCHEMA ${sql.identifier(metadataNamespace)} CASCADE`);
      await connection.db.execute(sql`DROP ROLE ${sql.identifier(runtimeRole)}`);
      await connection.pool.end();
    }
  },
);
test.skipIf(!connectionString)(
  "function transactions enforce snapshots, rollback and bounded conflict retries",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      connectionString,
      schema,
      relations: defineRelations(schema.tables),
      maxConnections: 3,
    });
    const { db, pool } = connection;
    const table = `transaction_${crypto.randomUUID().replaceAll("-", "")}`;
    const relation = sql.identifier(table);
    const metrics: string[] = [];
    const metricChannel = channel("loom.runtime.metric");
    const captureMetric: Parameters<typeof metricChannel.subscribe>[0] = (event) => {
      if (v.parse(v.object({ type: v.string() }), event).type !== "transaction.retry") return;
      const metric = v.parse(
        v.strictObject({
          type: v.literal("transaction.retry"),
          kind: v.picklist(["query", "mutation"]),
          attempt: v.pipe(v.number(), v.integer(), v.minValue(2), v.maxValue(10)),
        }),
        event,
      );
      metrics.push(JSON.stringify(metric));
    };
    metricChannel.subscribe(captureMetric);
    try {
      await db.execute(sql`CREATE TABLE ${relation} (value integer NOT NULL)`);
      await db.execute(sql`INSERT INTO ${relation} VALUES (0)`);
      await runFunctionTransaction(connection, "query", async (tx) => {
        const before = await tx.execute<{ value: number }>(sql`SELECT value FROM ${relation}`);
        await db.execute(sql`UPDATE ${relation} SET value = 1`);
        const after = await tx.execute<{ value: number }>(sql`SELECT value FROM ${relation}`);
        expect(before.rows).toEqual([{ value: 0 }]);
        expect(after.rows).toEqual(before.rows);
      });
      await assert.rejects(
        runFunctionTransaction(connection, "query", async (tx) => {
          await tx.execute(sql`UPDATE ${relation} SET value = 100`);
        }),
        (error: Error) => error.cause instanceof Error && "code" in error.cause && error.cause.code === "25006",
      );
      let failedAttempts = 0;
      await assert.rejects(
        runFunctionTransaction(connection, "mutation", async (tx) => {
          failedAttempts++;
          await tx.execute(sql`UPDATE ${relation} SET value = 100`);
          throw new Error("Invalid output");
        }),
        /Invalid output/,
      );
      expect(failedAttempts).toBe(1);
      expect(metrics).toEqual([]);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 1 }]);

      let attempts = 0;
      await runFunctionTransaction(connection, "mutation", async (tx) => {
        attempts++;
        await tx.execute(sql`SELECT value FROM ${relation}`);
        if (attempts === 1) await db.execute(sql`UPDATE ${relation} SET value = value + 1`);
        await tx.execute(sql`UPDATE ${relation} SET value = value + 10`);
      });
      expect(attempts).toBe(2);
      expect(metrics).toEqual([JSON.stringify({ type: "transaction.retry", kind: "mutation", attempt: 2 })]);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 12 }]);

      let exhausted = 0;
      await assert.rejects(
        runFunctionTransaction(
          connection,
          "mutation",
          async (tx) => {
            exhausted++;
            await tx.execute(sql`SELECT value FROM ${relation}`);
            await db.execute(sql`UPDATE ${relation} SET value = value + 1`);
            await tx.execute(sql`UPDATE ${relation} SET value = value + 100`);
          },
          { maxAttempts: 2 },
        ),
        (error: Error) => error instanceof TransactionConflictError,
      );
      expect(exhausted).toBe(2);
      expect(metrics).toHaveLength(2);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 14 }]);
      const controller = new AbortController();
      await assert.rejects(
        runFunctionTransaction(
          connection,
          "mutation",
          async (tx) => {
            await tx.execute(sql`UPDATE ${relation} SET value = 100`);
            controller.abort();
          },
          { signal: controller.signal },
        ),
        /abort/i,
      );
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 14 }]);
      const ready = Promise.withResolvers<void>();
      const retriesBeforeDeadlock = metrics.length;
      const lock = Number.parseInt(crypto.randomUUID().slice(0, 8), 16);
      let arrivals = 0;
      let deadlockAttempts = 0;
      const contenders = [0, 1].map((offset) => {
        let firstAttempt = true;
        return runFunctionTransaction(connection, "mutation", async (tx) => {
          deadlockAttempts++;
          await tx.execute(sql`SELECT pg_advisory_xact_lock(${lock + offset}::bigint)`);
          if (firstAttempt) {
            firstAttempt = false;
            arrivals++;
            if (arrivals === 2) ready.resolve();
            await ready.promise;
          }
          await tx.execute(sql`SELECT pg_advisory_xact_lock(${lock + 1 - offset}::bigint)`);
          await tx.execute(sql`UPDATE ${relation} SET value = value + 1`);
        });
      });
      await Promise.all(contenders);
      expect(deadlockAttempts).toBeGreaterThanOrEqual(3);
      expect(metrics).toHaveLength(retriesBeforeDeadlock + deadlockAttempts - contenders.length);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 16 }]);
      const invalidResult = mutation({
        args: v.null(),
        returns: v.pipe(v.number(), v.minValue(1)),
        handler: async (context) => {
          await context.db.execute(sql`UPDATE ${relation} SET value = 100`);
          return 0;
        },
      });
      await assert.rejects(executeDatabaseFunction(connection, invalidResult, null), /Invalid function result/);
      const unencodable = mutation({
        args: v.null(),
        returns: v.unknown(),
        handler: async (context) => {
          await context.db.execute(sql`UPDATE ${relation} SET value = 200`);
          return Symbol("cannot encode");
        },
      });
      await assert.rejects(executeDatabaseFunction(connection, unencodable, null), /Invalid function result/);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 16 }]);
      let executionAttempts = 0;
      const increment = mutation({
        args: v.object({ increment: v.number() }),
        returns: v.number(),
        handler: async (context, args) => {
          executionAttempts++;
          await context.db.execute(sql`SELECT value FROM ${relation}`);
          if (executionAttempts === 1) await db.execute(sql`UPDATE ${relation} SET value = value + 1`);
          const amount = args.increment;
          args.increment = 1000;
          await context.db.execute(sql`UPDATE ${relation} SET value = value + ${amount}`);
          return amount;
        },
      });
      const input = { increment: 2 };
      expect(await executeDatabaseFunction(connection, increment, input)).toBe(2);
      expect(input).toEqual({ increment: 2 });
      expect(executionAttempts).toBe(2);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 19 }]);
      const escaped = await runFunctionTransaction(connection, "mutation", async (tx) => {
        const deferred = tx.execute(sql`UPDATE ${relation} SET value = 999`);
        const prepared = tx
          .select({ value: sql<number>`value` })
          .from(sql`${relation}`)
          .prepare("escaped");
        return {
          deferred: async () => {
            await deferred;
          },
          prepared: async () => {
            await prepared.execute();
          },
          late: async () => {
            await tx.execute(sql`UPDATE ${relation} SET value = 999`);
          },
        };
      });
      await assert.rejects(escaped.deferred(), /inactive/i);
      await assert.rejects(escaped.prepared(), /inactive/i);
      await assert.rejects(escaped.late(), /inactive/i);
      const borrowed = Promise.withResolvers<() => Promise<void>>();
      const release = Promise.withResolvers<void>();
      const owner = runFunctionTransaction(connection, "query", async (tx) => {
        borrowed.resolve(async () => {
          await tx.execute(sql`SELECT value FROM ${relation}`);
        });
        await release.promise;
      });
      try {
        const queryFromOwner = await borrowed.promise;
        await runFunctionTransaction(connection, "query", async () => {
          await assert.rejects(queryFromOwner(), /different invocation/i);
        });
      } finally {
        release.resolve();
        await owner;
      }
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 19 }]);
      const child = internalMutation({
        args: v.null(),
        returns: v.number(),
        handler: async (context) => {
          await context.db.execute(sql`UPDATE ${relation} SET value = value + 1`);
          return 1;
        },
      });
      const savedHelper = Promise.withResolvers<() => Promise<void>>();
      const parent = mutation({
        args: v.null(),
        returns: v.number(),
        handler: async (context) => {
          savedHelper.resolve(async () => {
            await runInternalMutation(context, child, null);
          });
          await runInternalMutation(context, child, null);
          const rows = await context.db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`);
          return rows.rows[0]?.value ?? 0;
        },
      });
      expect(await executeDatabaseFunction(connection, parent, null)).toBe(20);
      await assert.rejects((await savedHelper.promise)(), /inactive/i);
      const failingParent = mutation({
        args: v.null(),
        returns: v.null(),
        handler: async (context) => {
          await runInternalMutation(context, child, null);
          throw new Error("Parent failed");
        },
      });
      await assert.rejects(executeDatabaseFunction(connection, failingParent, null), /Parent failed/);
      const invalidChild = internalMutation({
        args: v.null(),
        returns: v.pipe(v.number(), v.minValue(1)),
        handler: async (context) => {
          await context.db.execute(sql`UPDATE ${relation} SET value = 999`);
          return 0;
        },
      });
      const catchesChildFailure = mutation({
        args: v.null(),
        returns: v.null(),
        handler: async (context) => {
          await assert.rejects(runInternalMutation(context, invalidChild, null), /Invalid function result/);
          return null;
        },
      });
      await assert.rejects(executeDatabaseFunction(connection, catchesChildFailure, null), /Invalid function result/);
      const queryCallsMutation = query({
        args: v.null(),
        returns: v.null(),
        handler: async (context) => {
          await runInternalMutation(context, child, null);
          return null;
        },
      });
      await assert.rejects(executeDatabaseFunction(connection, queryCallsMutation, null), /requires a mutation/);
      const startedChild = Promise.withResolvers<void>();
      const finishChild = Promise.withResolvers<void>();
      const slowChild = internalMutation({
        args: v.null(),
        returns: v.null(),
        handler: async (context) => {
          startedChild.resolve();
          await finishChild.promise;
          await context.db.execute(sql`UPDATE ${relation} SET value = 999`);
          return null;
        },
      });
      const detachedParent = mutation({
        args: v.null(),
        returns: v.null(),
        handler: async (context) => {
          void runInternalMutation(context, slowChild, null);
          await startedChild.promise;
          return null;
        },
      });
      const detachedRejection = assert.rejects(
        executeDatabaseFunction(connection, detachedParent, null),
        /must be awaited/,
      );
      await startedChild.promise;
      await setImmediate();
      finishChild.resolve();
      await detachedRejection;
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 20 }]);
      const retriesBeforeCancellation = metrics.length;
      const cancelledRetry = new AbortController();
      let cancelledAttempts = 0;
      await assert.rejects(
        runFunctionTransaction(
          connection,
          "mutation",
          async (tx) => {
            cancelledAttempts++;
            await tx.execute(sql`SELECT value FROM ${relation}`);
            await db.execute(sql`UPDATE ${relation} SET value = value + 1`);
            cancelledRetry.abort();
            await tx.execute(sql`UPDATE ${relation} SET value = value + 100`);
          },
          { signal: cancelledRetry.signal },
        ),
        /abort/i,
      );
      expect(cancelledAttempts).toBe(1);
      expect(metrics).toHaveLength(retriesBeforeCancellation);
      expect(pool.waitingCount).toBe(0);
      expect(pool.idleCount).toBe(pool.totalCount);
    } finally {
      metricChannel.unsubscribe(captureMetric);
      await db.execute(sql`DROP TABLE IF EXISTS ${relation}`);
      await connection.close();
    }
  },
);
