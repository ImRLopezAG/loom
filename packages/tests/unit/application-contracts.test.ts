import { expect, test } from "vite-plus/test";
import { call, implement } from "@orpc/server";
import * as v from "valibot";
import { z } from "zod";
import { defineContract, resolveContract, oc, eventIterator } from "@loom/core/contract";

test("object contracts retain native input, output and declared error validation", async () => {
  const declaration = defineContract({
    hello: oc
      .errors({ NOT_FOUND: { message: "Missing" } })
      .input(z.object({ name: z.string() }))
      .output(v.object({ message: v.string() })),
  });
  const contract = resolveContract(declaration, { validators: { tables: {}, id: () => v.string() } });
  const os = implement(contract);
  const hello = os.hello.handler(({ input }) => ({ message: input.name }));
  expect(await call(hello, { name: "Loom" })).toEqual({ message: "Loom" });
  // @ts-expect-error Runtime input validation still applies to untyped callers.
  await expect(call(hello, { name: 42 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(contract.hello["~orpc"].errorMap.NOT_FOUND.message).toBe("Missing");
});

test("callback contracts resolve with schema validators without wrapping native contracts", () => {
  const declaration = defineContract(({ validators }) => ({
    hello: oc.output(z.string()),
    count: oc.output(v.number()),
    validatorsAvailable: oc.output(z.boolean().default(Boolean(validators))),
  }));
  const contract = resolveContract(declaration, { validators: { tables: {}, id: () => v.string() } });
  expect(Object.keys(contract)).toEqual(["hello", "count", "validatorsAvailable"]);
});

test("contracts reject implicit outputs and implemented procedures", () => {
  expect(() => defineContract({ missing: oc.input(z.string()) })).toThrow("missing");
  const implemented = implement({ hello: oc.output(z.string()) }).hello.handler(() => "hello");
  expect(() => defineContract({ hello: implemented })).toThrow("implementation");
  const deferred = defineContract(() => ({ nested: { missing: oc.input(z.string()) } }));
  expect(() => resolveContract(deferred, { validators: { tables: {}, id: () => v.string() } })).toThrow(
    "nested.missing",
  );
});

test("contract discovery rejects cycles while permitting shared native contracts", () => {
  interface ContractTree {
    [key: string]: ContractTree;
  }
  const cyclic: ContractTree = {};
  cyclic.self = cyclic;
  expect(() => defineContract(cyclic)).toThrow("Cyclic contract at self");
  const shared = { hello: oc.output(z.string()) };
  expect(() => defineContract({ first: shared, second: shared })).not.toThrow();
});

test("explicit streaming contracts retain native iterator schemas", async () => {
  const contract = resolveContract(
    defineContract({ events: oc.output(eventIterator(z.object({ value: z.number() }))) }),
    { validators: { tables: {}, id: () => v.string() } },
  );
  const events = implement(contract).events.handler(async function* () {
    yield { value: 1 };
  });
  const stream = await call(events, undefined);
  expect(await stream.next()).toEqual({ done: false, value: { value: 1 } });
  expect((await stream.next()).done).toBe(true);
});
