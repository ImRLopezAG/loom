import assert from "node:assert/strict";
import { test } from "bun:test";
import {
  connectDatabase,
  createCronDispatcher,
  createDispatcher,
  createJobQueue,
  createJobWorker,
  cron,
  defineSchema,
  internalMutation,
} from "@loom/core/server";
import type { FunctionReference } from "@loom/core/client";
import { createNeonApplication } from "@loom/core/neon";
import { bootstrapDatabase } from "@loom/tooling";
import { defineRelations, sql } from "drizzle-orm";
import * as v from "valibot";
import pg from "pg";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "received cron occurrences persist once across dispatchers and completed-job redelivery",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_cron_${suffix}`;
    const applicationNamespace = `app_cron_${suffix}`;
    const runtimeRole = `loom_runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`CREATE SCHEMA "${applicationNamespace}"`);
      await admin.query(`CREATE TABLE "${applicationNamespace}".effects (job_id uuid PRIMARY KEY, value integer)`);
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
        const reference: FunctionReference<"mutation", "internal", { value: number }, null> = {
          name: "jobs:cron",
          kind: "mutation",
          visibility: "internal",
          version,
        };
        const functions = {
          "jobs:cron": internalMutation({
            args: v.object({ value: v.number() }),
            returns: v.null(),
            handler: async (context, args) => {
              assert.ok(context.job);
              assert.equal(context.identity, null);
              await context.db.execute(
                sql`INSERT INTO ${sql.identifier(applicationNamespace)}.effects VALUES (${context.job.id}::uuid, ${args.value})`,
              );
              return null;
            },
          }),
        };
        const queueOptions = { db: connection.db, deployment: "cron-test", metadataNamespace, version, functions };
        const queue = createJobQueue(queueOptions);
        const declaration = cron("* * * * *", reference, { value: 1 });
        const crons = { minute: declaration, second: declaration };
        const options = { db: connection.db, queue, crons, assertActive: async () => {} };
        const first = createCronDispatcher(options);
        const second = createCronDispatcher({ ...options, queue: createJobQueue(queueOptions) });
        crons.minute = cron("* * * * *", reference, { value: 9 });
        const occurrence = new Date("2026-01-01T00:00:00Z");
        const [a, b] = await Promise.all([first.dispatch("minute", occurrence), second.dispatch("minute", occurrence)]);
        assert.equal(a, b);
        const dispatcher = createDispatcher({
          connection,
          version,
          functions,
          authorize: async () => {},
          idempotency: queueOptions,
        });
        const worker = createJobWorker({ queue, dispatcher, assertActive: options.assertActive });
        try {
          assert.deepEqual(await worker.run(), { claimed: 1, completed: 1, failed: 0, leaseLost: 0 });
          assert.equal(await second.dispatch("minute", new Date(occurrence)), a);
          assert.equal((await worker.run()).claimed, 0);
          assert.equal(
            (await admin.query(`SELECT count(*)::int AS total FROM "${metadataNamespace}".jobs`)).rows[0].total,
            1,
          );
          assert.deepEqual((await admin.query(`SELECT value FROM "${applicationNamespace}".effects`)).rows, [
            { value: 1 },
          ]);
          assert.notEqual(await second.dispatch("second", occurrence), a);
          assert.equal((await worker.run()).completed, 1);
          await assert.rejects(first.dispatch("unknown", occurrence), /not configured/);
          await assert.rejects(first.dispatch("minute", new Date("invalid")), /Invalid/);
          const denied = createCronDispatcher({
            ...options,
            assertActive: async () => {
              throw new Error("inactive clone");
            },
          });
          await assert.rejects(denied.dispatch("minute", new Date("2026-01-01T00:01:00Z")), /inactive clone/);
          assert.equal((await worker.run()).claimed, 0);
          const changed = createCronDispatcher(options);
          await assert.rejects(changed.dispatch("minute", occurrence), /deduplication conflict/);
          const changedVersion = "b".repeat(64);
          const redeployed = createCronDispatcher({
            ...options,
            queue: createJobQueue({ ...queueOptions, version: changedVersion }),
            crons: { minute: cron("* * * * *", { ...reference, version: changedVersion }, { value: 1 }) },
          });
          await assert.rejects(redeployed.dispatch("minute", occurrence), /deduplication conflict/);
          assert.equal((await queue.inspect(a))?.state, "succeeded");
          const app = createNeonApplication({
            origins: [],
            dispatcher,
            verify: async () => {
              throw new Error("Trigger route does not use browser auth");
            },
            triggers: {
              bindings: { "trigger-minute": { kind: "cron", name: "minute", cron: "minute" } },
              crons: first,
              worker,
            },
          });
          function delivery() {
            return new Request("https://api.example.test/api/loom/triggers", {
              method: "POST",
              headers: { "content-type": "application/json", "x-neon-trigger-invocation-id": "occurrence-three" },
              body: JSON.stringify({
                version: 1,
                invocation_id: "occurrence-three",
                trigger: { type: "schedule", id: "trigger-minute", name: "minute" },
                data: { scheduled_at: "2026-01-01T00:03:00Z" },
              }),
            });
          }
          try {
            const responses = await Promise.all([app.fetch(delivery()), app.fetch(delivery())]);
            assert.ok(responses.every((response) => response.status === 200));
            assert.equal((await app.fetch(delivery())).status, 200);
            assert.deepEqual((await admin.query(`SELECT value FROM "${applicationNamespace}".effects`)).rows, [
              { value: 1 },
              { value: 1 },
              { value: 1 },
            ]);
          } finally {
            await app.stop();
          }
          const aborted = AbortSignal.abort();
          await assert.rejects(first.dispatch("minute", new Date("2026-01-01T00:02:00Z"), aborted));
          assert.equal(
            (await admin.query(`SELECT count(*)::int AS total FROM "${metadataNamespace}".jobs`)).rows[0].total,
            3,
          );
        } finally {
          await worker.stop();
        }
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
