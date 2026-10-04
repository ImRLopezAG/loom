import { test } from "bun:test";
import assert from "node:assert/strict";
import { exerciseNeonConsumerNative } from "../fixtures/neon-consumer-runtime";

test("Neon 1.25 compiled public read-only SQL, records, views and native errors", async () => {
  const connectionString = process.env.LOOM_NEON_NATIVE_DATABASE_URL;
  assert(connectionString, "Parent must supply its owned exact Neon 1.25 PG18 fixture; stock PG is not acceptance");
  await exerciseNeonConsumerNative(connectionString);
}, 180000);
