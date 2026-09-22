import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import {
  connectDatabase,
  createJobQueue,
  defineSchema,
  executeDatabaseFunction,
  internalMutation,
  mutation,
} from "@loom/core/server";
import { bootstrapDatabase } from "@loom/tooling";
import { defineRelations, sql } from "drizzle-orm";
import * as v from "valibot";
import pg from "pg";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "durable jobs share transaction rollback, deduplicate and fence recovered leases",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_jobs_${suffix}`;
    const applicationNamespace = `app_jobs_${suffix}`;
    const runtimeRole = `loom_runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`CREATE SCHEMA "${applicationNamespace}"`);
      await admin.query(`CREATE TABLE "${applicationNamespace}".effects (value integer PRIMARY KEY)`);
      await admin.query(`GRANT USAGE ON SCHEMA "${applicationNamespace}" TO "${runtimeRole}"`);
      await admin.query(`GRANT SELECT, INSERT ON "${applicationNamespace}".effects TO "${runtimeRole}"`);
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
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
        const version = "a".repeat(64);
        const definition = internalMutation({
          args: v.object({ value: v.number() }),
          returns: v.null(),
          handler: () => null,
        });
        const options = {
          db: connection.db,
          metadataNamespace,
          deployment: "preview-one",
          version,
          functions: { "jobs:write": definition },
        };
        const queue = createJobQueue(options);
        const call = { name: "jobs:write", kind: "mutation" as const, version, args: { value: 1 } };
        const identity = { issuer: "test", subject: "alice", tenantId: "one" };
        const schedule = {
          deduplicationKey: "occurrence-one",
          dueAt: new Date(0),
          maxAttempts: 2,
          retryDelaySeconds: 0,
        };
        const invalid = mutation({
          args: v.null(),
          returns: v.pipe(v.string(), v.minLength(100)),
          handler: async (context) => {
            await context.db.execute(sql`INSERT INTO ${sql.identifier(applicationNamespace)}.effects VALUES (1)`);
            return queue.enqueue(context.db, call, context.identity, schedule);
          },
        });
        await assert.rejects(
          executeDatabaseFunction(connection, invalid, null, { identity }),
          /Invalid function result/,
        );
        expect((await admin.query(`SELECT * FROM "${applicationNamespace}".effects`)).rows).toEqual([]);
        expect(await queue.claim("worker-one", 30)).toBeNull();
        const enqueue = mutation({
          args: v.null(),
          returns: v.string(),
          handler: (context) => queue.enqueue(context.db, call, context.identity, schedule),
        });
        const id = v.parse(v.string(), await executeDatabaseFunction(connection, enqueue, null, { identity }));
        expect(await executeDatabaseFunction(connection, enqueue, null, { identity })).toBe(id);
        await assert.rejects(
          queue.enqueue(connection.db, { ...call, args: { value: 2 } }, identity, schedule),
          /deduplication conflict/,
        );
        await assert.rejects(
          queue.enqueue(connection.db, { ...call, args: null }, identity, { ...schedule, deduplicationKey: "invalid" }),
          /Invalid function arguments/,
        );
        await assert.rejects(
          queue.enqueue(connection.db, { ...call, version: "b".repeat(64) }, identity, schedule),
          /version/,
        );
        const claims = await Promise.all([
          queue.claim("worker-one", 30),
          createJobQueue(options).claim("worker-two", 30),
        ]);
        const lease = claims.find((value) => value !== null);
        assert.ok(lease);
        expect(claims.filter((value) => value !== null)).toHaveLength(1);
        expect(lease).toMatchObject({ id, call: { ...call, idempotencyKey: id }, identity, attempt: 1 });
        expect(await createJobQueue({ ...options, deployment: "other" }).claim("other", 30)).toBeNull();
        await admin.query(
          `UPDATE "${metadataNamespace}".jobs SET lease_expires_at = clock_timestamp() - interval '1 second' WHERE id = $1`,
          [id],
        );
        const recovered = await createJobQueue(options).claim("worker-three", 30);
        assert.ok(recovered);
        expect(recovered.attempt).toBe(2);
        expect(recovered.token).not.toBe(lease.token);
        expect(await queue.complete(lease, null)).toBe(false);
        expect(await queue.renew(lease, 30)).toBe(false);
        expect(await queue.fail(lease, "INTERNAL")).toBe(false);
        expect(await queue.renew(recovered, 30)).toBe(true);
        expect(await queue.complete(recovered, { saved: true })).toBe(true);
        expect(await queue.complete(recovered, null)).toBe(false);
        expect(await queue.inspect(id)).toMatchObject({ state: "succeeded", attempts: 2, result: { saved: true } });
        expect(await queue.claim("worker-four", 30)).toBeNull();
        expect(await queue.enqueue(connection.db, call, identity, schedule)).toBe(id);

        const pending = await queue.enqueue(connection.db, call, identity, {
          ...schedule,
          deduplicationKey: "cancel-pending",
        });
        expect(await queue.cancel(pending)).toBe("cancelled");
        expect(await queue.claim("worker", 30)).toBeNull();
        const running = await queue.enqueue(connection.db, call, identity, {
          ...schedule,
          deduplicationKey: "cancel-running",
        });
        const active = await queue.claim("worker", 30);
        assert.ok(active);
        expect(active.id).toBe(running);
        expect(await queue.cancel(running)).toBe("requested");
        expect(await queue.renew(active, 30)).toBe(false);
        expect(await queue.fail(active, "CANCELLED")).toBe(true);
        expect(await queue.inspect(running)).toMatchObject({ state: "cancelled" });

        const failed = await queue.enqueue(connection.db, call, identity, { ...schedule, deduplicationKey: "fail" });
        const first = await queue.claim("worker", 30);
        assert.ok(first);
        expect(await queue.fail(first, "INTERNAL")).toBe(true);
        const second = await queue.claim("worker", 30);
        assert.ok(second);
        expect(second.id).toBe(failed);
        expect(await queue.fail(second, "INTERNAL")).toBe(true);
        expect(await queue.inspect(failed)).toMatchObject({ state: "failed", attempts: 2, errorCode: "INTERNAL" });
        expect(await queue.claim("worker", 30)).toBeNull();

        const exhausted = await queue.enqueue(connection.db, call, identity, {
          ...schedule,
          deduplicationKey: "crashed",
          maxAttempts: 1,
        });
        const crashed = await queue.claim("worker", 30);
        assert.ok(crashed);
        await admin.query(
          `UPDATE "${metadataNamespace}".jobs SET lease_expires_at = clock_timestamp() - interval '1 second' WHERE id = $1`,
          [exhausted],
        );
        expect(await queue.claim("replacement", 30)).toBeNull();
        expect(await queue.inspect(exhausted)).toMatchObject({ state: "failed", errorCode: "LEASE_EXPIRED" });
        const future = await queue.enqueue(connection.db, call, identity, {
          ...schedule,
          deduplicationKey: "future",
          dueAt: new Date(Date.now() + 3600000),
        });
        expect(await queue.claim("worker", 30)).toBeNull();
        expect(await queue.cancel(future)).toBe("cancelled");
        const duplicateIds = await Promise.all([
          queue.enqueue(connection.db, call, identity, { ...schedule, deduplicationKey: "concurrent" }),
          createJobQueue(options).enqueue(connection.db, call, identity, {
            ...schedule,
            deduplicationKey: "concurrent",
          }),
        ]);
        expect(duplicateIds[0]).toBe(duplicateIds[1]);
        const lockedId = duplicateIds[0];
        assert.ok(lockedId);
        await admin.query("BEGIN");
        try {
          await admin.query(`SELECT id FROM "${metadataNamespace}".jobs WHERE id = $1 FOR UPDATE`, [lockedId]);
          expect(await queue.claim("worker", 30)).toBeNull();
        } finally {
          await admin.query("ROLLBACK");
        }
        const short = await queue.claim("worker", 1);
        assert.ok(short);
        await admin.query("BEGIN");
        let acknowledgement: Promise<boolean> | undefined;
        try {
          await admin.query(`SELECT id FROM "${metadataNamespace}".jobs WHERE id = $1 FOR UPDATE`, [short.id]);
          acknowledgement = queue.complete(short, null);
          let waiting = false;
          for (let attempt = 0; attempt < 100; attempt++) {
            await admin.query("SELECT pg_stat_clear_snapshot()");
            const state = await admin.query<{ waiting: boolean }>(
              "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE usename = $1 AND wait_event_type = 'Lock') AS waiting",
              [runtimeRole],
            );
            if (state.rows[0]?.waiting) {
              waiting = true;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 5));
          }
          assert.equal(waiting, true, "Acknowledgement must wait on the job row lock");
          await new Promise((resolve) => setTimeout(resolve, 1100));
        } finally {
          await admin.query("ROLLBACK");
        }
        expect(await acknowledgement).toBe(false);
        const afterWait = await queue.claim("replacement", 30);
        assert.ok(afterWait);
        expect(afterWait.id).toBe(short.id);
        expect(await queue.cancel(afterWait.id)).toBe("requested");
        // A cooperative cancellation cannot undo effects that have already completed.
        expect(await queue.complete(afterWait, null)).toBe(true);
        expect(await queue.cancel(afterWait.id)).toBe("finished");
        expect(await queue.inspect(afterWait.id)).toMatchObject({ state: "succeeded", cancelRequested: true });
        for (const seconds of [0, 301, 1.5]) await assert.rejects(queue.claim("worker", seconds));
        await assert.rejects(queue.claim("", 30));
        await assert.rejects(queue.enqueue(connection.db, { ...call, kind: "query" }, identity, schedule));
        await assert.rejects(queue.enqueue(connection.db, call, identity, { ...schedule, maxAttempts: 11 }));
        await assert.rejects(queue.enqueue(connection.db, call, identity, { ...schedule, dueAt: new Date(NaN) }));
        await assert.rejects(queue.enqueue(connection.db, call, identity, { ...schedule, retryDelaySeconds: 3601 }));
        const failure = await queue.inspect(failed);
        assert.ok(failure);
        const replays = await Promise.all([
          queue.replay(failed, failure.fencingToken, new Date(0)),
          createJobQueue(options).replay(failed, failure.fencingToken, new Date(0)),
        ]);
        expect(replays.filter(Boolean)).toHaveLength(1);
        const replay = await queue.claim("replay-worker", 30);
        assert.ok(replay);
        expect(replay.id).toBe(failed);
        expect(replay.call.idempotencyKey).toBe(failed);
        expect(replay.attempt).toBe(1);
        expect(replay.token).not.toBe(failure.fencingToken);
        expect(await queue.complete(second, null)).toBe(false);
        expect(await queue.fail(replay, "INTERNAL")).toBe(true);
        const replayLast = await queue.claim("replay-worker", 30);
        assert.ok(replayLast);
        expect(await queue.fail(replayLast, "INTERNAL")).toBe(true);
        expect(await queue.replay(failed, failure.fencingToken, new Date(0))).toBe(false);
        const beforeAuditFailure = await queue.inspect(failed);
        await admin.query(`REVOKE INSERT ON "${metadataNamespace}".job_replays FROM "${runtimeRole}"`);
        try {
          await assert.rejects(queue.replay(failed, replayLast.token, new Date(0)));
          expect(await queue.inspect(failed)).toEqual(beforeAuditFailure);
        } finally {
          await admin.query(`GRANT INSERT ON "${metadataNamespace}".job_replays TO "${runtimeRole}"`);
        }
        const audit = await admin.query(
          `SELECT attempts, error_code FROM "${metadataNamespace}".job_replays WHERE job_id = $1`,
          [failed],
        );
        expect(audit.rows).toEqual([{ attempts: 2, error_code: "INTERNAL" }]);
        const success = await queue.inspect(id);
        assert.ok(success);
        expect(await queue.replay(id, success.fencingToken, new Date(0))).toBe(false);
        expect(
          await createJobQueue({ ...options, deployment: "other" }).replay(failed, replayLast.token, new Date(0)),
        ).toBe(false);
        await assert.rejects(
          connection.pool.query(`DELETE FROM "${metadataNamespace}".job_replays`),
          /permission denied/,
        );
        expect(await queue.inspect(crypto.randomUUID())).toBeNull();
        await assert.rejects(connection.pool.query(`DELETE FROM "${metadataNamespace}".jobs`), /permission denied/);
      } finally {
        await connection.close();
      }
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${applicationNamespace}" CASCADE`);
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);
