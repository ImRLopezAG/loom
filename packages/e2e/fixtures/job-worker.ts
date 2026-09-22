import assert from "node:assert/strict";
import {
  connectDatabase,
  createDispatcher,
  createJobQueue,
  createJobWorker,
  defineSchema,
  FunctionAccessDenied,
  internalMutation,
} from "@loom/core/server";
import { defineRelations, sql } from "drizzle-orm";
import * as v from "valibot";

assert.equal(Number(process.versions.node.split(".")[0]), 24);
assert.equal("Bun" in globalThis, false);
const config = v.parse(
  v.object({
    LOOM_TEST_DATABASE_URL: v.string(),
    LOOM_TEST_JOB_METADATA: v.string(),
    LOOM_TEST_JOB_SCHEMA: v.string(),
    LOOM_TEST_JOB_CRASH: v.picklist(["claimed", "committed"]),
  }),
  process.env,
);
const schema = defineSchema(() => ({}));
const connection = await connectDatabase({
  schema,
  relations: defineRelations(schema.tables),
  connectionString: config.LOOM_TEST_DATABASE_URL,
});
const version = "a".repeat(64);
const deployment = "worker-test";
const metadataNamespace = config.LOOM_TEST_JOB_METADATA;
const functions = {
  "jobs:write": internalMutation({
    args: v.null(),
    returns: v.number(),
    handler: async (context) => {
      assert.ok(context.job);
      assert.equal(context.job.attempt, 1);
      const result = await context.db.execute<{ value: number }>(
        sql`UPDATE ${sql.identifier(config.LOOM_TEST_JOB_SCHEMA)}.effects SET value = value + 1 RETURNING value`,
      );
      return result.rows[0]?.value ?? -1;
    },
  }),
};
const dispatcher = createDispatcher({
  connection,
  version,
  functions,
  idempotency: { deployment, metadataNamespace },
  authorize: async (context) => {
    if (context.identity?.subject !== "alice") throw new FunctionAccessDenied();
  },
});
const queue = createJobQueue({ db: connection.db, version, functions, deployment, metadataNamespace });
async function pause(stage: "claimed" | "committed"): Promise<void> {
  if (stage !== config.LOOM_TEST_JOB_CRASH) return;
  process.stdout.write(`${stage}\n`);
  await new Promise<void>(() => {});
}
const worker = createJobWorker({
  queue: {
    ...queue,
    claim: async (owner, seconds) => {
      const job = await queue.claim(owner, seconds);
      assert.ok(job);
      await pause("claimed");
      return job;
    },
    complete: async (lease, value) => {
      await pause("committed");
      return queue.complete(lease, value);
    },
  },
  dispatcher,
  // Explicit trusted local fixture. Cloud activation verification is a separate adapter gate.
  assertActive: async () => {},
  leaseSeconds: 1,
});
try {
  await worker.run(1);
} finally {
  await worker.stop();
  await connection.close();
}
