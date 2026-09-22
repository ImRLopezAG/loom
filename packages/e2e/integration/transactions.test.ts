import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { executeDatabaseFunction, mutation, runFunctionTransaction } from "@loom/core/server";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as v from "valibot";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "function transactions enforce snapshots, rollback and bounded conflict retries",
  async () => {
    const pool = new pg.Pool({ connectionString, max: 3 });
    const table = `transaction_${crypto.randomUUID().replaceAll("-", "")}`;
    const relation = sql.identifier(table);
    const db = drizzle({ client: pool });
    try {
      await db.execute(sql`CREATE TABLE ${relation} (value integer NOT NULL)`);
      await db.execute(sql`INSERT INTO ${relation} VALUES (0)`);
      await runFunctionTransaction(db, "query", async (tx) => {
        const before = await tx.execute<{ value: number }>(sql`SELECT value FROM ${relation}`);
        await db.execute(sql`UPDATE ${relation} SET value = 1`);
        const after = await tx.execute<{ value: number }>(sql`SELECT value FROM ${relation}`);
        expect(before.rows).toEqual([{ value: 0 }]);
        expect(after.rows).toEqual(before.rows);
      });
      await assert.rejects(
        runFunctionTransaction(db, "query", async (tx) => {
          await tx.execute(sql`UPDATE ${relation} SET value = 100`);
        }),
        (error: Error) => error.cause instanceof Error && "code" in error.cause && error.cause.code === "25006",
      );
      let failedAttempts = 0;
      await assert.rejects(
        runFunctionTransaction(db, "mutation", async (tx) => {
          failedAttempts++;
          await tx.execute(sql`UPDATE ${relation} SET value = 100`);
          throw new Error("Invalid output");
        }),
        /Invalid output/,
      );
      expect(failedAttempts).toBe(1);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 1 }]);

      let attempts = 0;
      await runFunctionTransaction(db, "mutation", async (tx) => {
        attempts++;
        await tx.execute(sql`SELECT value FROM ${relation}`);
        if (attempts === 1) await db.execute(sql`UPDATE ${relation} SET value = value + 1`);
        await tx.execute(sql`UPDATE ${relation} SET value = value + 10`);
      });
      expect(attempts).toBe(2);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 12 }]);

      let exhausted = 0;
      await assert.rejects(
        runFunctionTransaction(
          db,
          "mutation",
          async (tx) => {
            exhausted++;
            await tx.execute(sql`SELECT value FROM ${relation}`);
            await db.execute(sql`UPDATE ${relation} SET value = value + 1`);
            await tx.execute(sql`UPDATE ${relation} SET value = value + 100`);
          },
          { maxAttempts: 2 },
        ),
        (error: Error) => error.cause instanceof Error && "code" in error.cause && error.cause.code === "40001",
      );
      expect(exhausted).toBe(2);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 14 }]);
      const controller = new AbortController();
      await assert.rejects(
        runFunctionTransaction(
          db,
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
      const lock = Number.parseInt(crypto.randomUUID().slice(0, 8), 16);
      let arrivals = 0;
      let deadlockAttempts = 0;
      const contenders = [0, 1].map((offset) => {
        let firstAttempt = true;
        return runFunctionTransaction(db, "mutation", async (tx) => {
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
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 16 }]);
      const invalidResult = mutation({
        args: v.null(),
        returns: v.pipe(v.number(), v.minValue(1)),
        handler: async (context) => {
          await context.db.execute(sql`UPDATE ${relation} SET value = 100`);
          return 0;
        },
      });
      await assert.rejects(executeDatabaseFunction(db, invalidResult, null), /Invalid function result/);
      const unencodable = mutation({
        args: v.null(),
        returns: v.unknown(),
        handler: async (context) => {
          await context.db.execute(sql`UPDATE ${relation} SET value = 200`);
          return Symbol("cannot encode");
        },
      });
      await assert.rejects(executeDatabaseFunction(db, unencodable, null), /Invalid function result/);
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
      expect(await executeDatabaseFunction(db, increment, input)).toBe(2);
      expect(input).toEqual({ increment: 2 });
      expect(executionAttempts).toBe(2);
      expect((await db.execute<{ value: number }>(sql`SELECT value FROM ${relation}`)).rows).toEqual([{ value: 19 }]);
      expect(pool.waitingCount).toBe(0);
      expect(pool.idleCount).toBe(pool.totalCount);
    } finally {
      await db.execute(sql`DROP TABLE IF EXISTS ${relation}`);
      await pool.end();
    }
  },
);
