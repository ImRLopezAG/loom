import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { defineRelations } from "drizzle-orm";
import {
  defineSchema,
  createProjectProcedures,
  procedureCron,
  procedureObjectCreated,
  defineProcedureStorage,
  compileProcedureCapabilities,
  storageObjectCreatedValidator,
  createRpcRuntime,
  decodeRpcJobInput,
} from "@loom/core/server";

test("durable declarations capture inputs and reject public or ambiguous procedure targets", () => {
  const { procedure } = createProjectProcedures(defineSchema(() => ({})));
  const task = procedure.input(v.object({ at: v.date() })).handler(() => null);
  const event = procedure.input(storageObjectCreatedValidator).handler(() => null);
  const input = { at: new Date(0) };
  const cron = procedureCron("* * * * *", task, input, { maxAttempts: 2 });
  input.at.setFullYear(2030);
  const storage = defineProcedureStorage({ buckets: { uploads: { onObjectCreated: procedureObjectCreated(event) } } });
  const options = {
    version: "a".repeat(64),
    internal: [
      { path: ["task"], procedure: task },
      { path: ["event"], procedure: event },
    ],
    crons: { minute: cron },
    storage,
    maxAttempts: 2,
  };
  const compiled = compileProcedureCapabilities(options);
  expect(decodeRpcJobInput(compiled.crons.minute!.call)).toEqual({ at: new Date(0) });
  expect(compiled.handlers.uploads?.path).toEqual(["event"]);
  expect(() => compileProcedureCapabilities({ ...options, internal: [] })).toThrow("registered internal");
  expect(() =>
    compileProcedureCapabilities({ ...options, internal: [...options.internal, { path: ["alias"], procedure: task }] }),
  ).toThrow("multiple paths");
  expect(() => compileProcedureCapabilities({ ...options, maxAttempts: 1 })).toThrow("configured attempts");
});

test("notify configuration refuses missing or unrelated direct credentials before connecting", async () => {
  const schema = defineSchema(() => ({}));
  let activated = false;
  const options = {
    schema,
    relations: defineRelations(schema.tables),
    connectionString: "postgresql://runtime:fixture@ep-one-pooler.example.test/database",
    metadataNamespace: "loom_meta",
    deployment: "test",
    version: "a".repeat(64),
    procedures: [],
    config: { realtime: { mode: "notify" as const } },
    assertActive: async () => {
      activated = true;
    },
  };
  await expect(createRpcRuntime(options)).rejects.toThrow("direct runtime database URL");
  await expect(
    createRpcRuntime({
      ...options,
      directConnectionString: "postgresql://runtime:fixture@ep-other.example.test/database",
    }),
  ).rejects.toThrow("must match");
  for (const query of ["host=ep-other.example.test", "user=owner", "options=-crole%3Downer"]) {
    await expect(
      createRpcRuntime({
        ...options,
        directConnectionString: `postgresql://runtime:fixture@ep-one.example.test/database?${query}`,
      }),
    ).rejects.toThrow("must match");
  }
  expect(activated).toBe(false);
});
