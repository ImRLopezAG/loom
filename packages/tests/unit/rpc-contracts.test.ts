import { describe, expect, test } from "vite-plus/test";
import { call, ORPCError } from "@orpc/server";
import { Context, Effect, Schema } from "effect";
import * as v from "valibot";
import {
  createProjectProcedures,
  defineSchema,
  Invocation,
  clientMode,
  getClientMode,
  serializeRpcValue,
  deserializeRpcValue,
  generateRpcOpenAPI,
} from "@loom/core/server";

const schema = defineSchema((s) => ({ tasks: { title: s.text().notNull() } }));
const { procedure } = createProjectProcedures(schema);
const invocation = { identity: null, requestId: "contracts", signal: new AbortController().signal };
const context = { ...invocation, "effect/context": Context.make(Invocation, invocation) };

describe("native project procedures", () => {
  test("injects schema bindings and infers no-input Promise and Effect handlers", async () => {
    const promise = procedure.handler(({ context }) => ({ table: context.tables.tasks.title.name }));
    const effect = procedure.effect(function* () {
      const current = yield* Invocation;
      return current.requestId;
    });
    expect(await call(promise, undefined, { context })).toEqual({ table: "title" });
    expect(await call(effect, undefined, { context })).toBe("contracts");
  });

  test("native transforms validate input and output without losing their types", async () => {
    let calls = 0;
    const item = procedure
      .input(v.pipe(v.string(), v.transform(Number), v.number()))
      .output(
        v.pipe(
          v.number(),
          v.transform((n) => ({ value: n })),
        ),
      )
      .handler(({ input }) => {
        calls++;
        return input + 1;
      });
    expect(await call(item, "41", { context })).toEqual({ value: 42 });
    await expect(call(item, "bad", { context })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(calls).toBe(1);
  });

  test("declared errors survive Effect while unexpected defects are redacted", async () => {
    const known = procedure.errors({ NOT_FOUND: {} }).effect(function* ({ errors }) {
      return yield* Effect.fail(errors.NOT_FOUND({ message: "Task missing" }));
    });
    const defect = procedure.effect(function* () {
      return yield* Effect.die(new Error("postgres://private-password"));
    });
    const undeclared = procedure.handler(() => {
      throw new ORPCError("BAD_REQUEST", { message: "secret" });
    });
    const declaredDefect = procedure.errors({ NOT_FOUND: {} }).effect(function* ({ errors }) {
      return yield* Effect.die(errors.NOT_FOUND({ message: "secret defect" }));
    });
    await expect(call(known, undefined, { context })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Task missing",
    });
    for (const item of [defect, undeclared, declaredDefect]) {
      await expect(call(item, undefined, { context })).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      });
    }
  });

  test("project ID validators reject malformed IDs without claiming existence", async () => {
    const item = procedure.input(schema.id("tasks")).handler(({ input }) => input);
    const missing = "b04fe8a3-2c1d-4d97-8f03-e96244cc9b70";
    expect(await call(item, missing, { context })).toBe(missing);
    await expect(call(item, "invalid", { context })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("client metadata overrides defaults without granting database authority", () => {
    const item = procedure.meta(clientMode("finite")).handler(() => "ok");
    expect(getClientMode(item)).toBe("finite");
    expect(getClientMode(procedure.handler(() => "default"))).toBe("mutation");
  });

  test("native RPC preserves dates, bigint, undefined and null", () => {
    const value = { date: new Date("2026-09-24T00:00:00Z"), count: 99n, empty: null, absent: undefined };
    expect(deserializeRpcValue(serializeRpcValue(value))).toEqual(value);
  });

  test("finite outputs reject values that JSON would silently discard", async () => {
    interface Cyclic {
      self?: Cyclic;
    }
    const cyclic: Cyclic = {};
    cyclic.self = cyclic;
    for (const value of [() => "lost", Symbol("lost"), { callback: () => 1 }, cyclic, new Date(NaN)]) {
      // @ts-expect-error Untyped callers must also fail at the serialization boundary.
      expect(() => serializeRpcValue(value)).toThrow();
      await expect(
        call(
          procedure.handler(() => value),
          undefined,
          { context },
        ),
      ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    }
  });

  test("OpenAPI names unsupported procedures and requires explicit output contracts", async () => {
    const typed = procedure.output(v.object({ title: v.string() })).handler(() => ({ title: "task" }));
    const doc = await generateRpcOpenAPI({ tasks: { list: typed } });
    expect(doc.paths?.["/tasks/list"]?.post?.operationId).toBe("tasks.list");
    await expect(generateRpcOpenAPI({ tasks: { inferred: procedure.handler(() => "hello") } })).rejects.toThrow(
      "tasks.inferred",
    );
    const unsupported = procedure.output(v.custom<string>(() => true)).handler(() => "hello");
    await expect(generateRpcOpenAPI({ tasks: { unsupported } })).rejects.toThrow("tasks.unsupported");
    const effect = procedure.output(Schema.toStandardSchemaV1(Schema.String)).handler(() => "typed");
    expect((await generateRpcOpenAPI({ tasks: { effect } })).paths?.["/tasks/effect"]).toBeDefined();
  });
});
