import { expect, test } from "vite-plus/test";
import { mutation, prepareFunction, query } from "@loom/core/server";
import { drizzle } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import { z } from "zod";

test("function preparation validates and transforms arguments before handler execution", async () => {
  let calls = 0;
  const definition = query({
    args: z.object({ name: z.string().transform((value) => value.trim()) }),
    returns: v.pipe(
      v.string(),
      v.transform((value) => value.toUpperCase()),
    ),
    handler: (_context, args) => {
      calls++;
      return args.name;
    },
  });
  await expect(prepareFunction(definition, { name: 1 })).rejects.toThrow("Invalid function arguments");
  expect(calls).toBe(0);
  const invoke = await prepareFunction(definition, { name: " loom " });
  expect(calls).toBe(0);
  expect(await invoke({ db: drizzle.mock() })).toBe("LOOM");
  expect(calls).toBe(1);
});

test("function output validation and encoding reject invalid results without exposing their contents", async () => {
  const definition = mutation({
    args: v.null(),
    returns: v.pipe(v.string(), v.minLength(100)),
    handler: () => "secret",
  });
  const invoke = await prepareFunction(definition, null);
  await expect(invoke({ db: drizzle.mock() })).rejects.toThrow("Invalid function result");
  const unsupported = query({ args: v.null(), returns: v.unknown(), handler: () => Symbol("secret") });
  const invokeUnsupported = await prepareFunction(unsupported, null);
  await expect(invokeUnsupported({ db: drizzle.mock() })).rejects.toThrow("Invalid function result");
  const encoded = query({
    args: v.null(),
    returns: v.object({ id: v.bigint(), time: v.date() }),
    handler: () => ({ id: 12n, time: new Date("2026-01-01T00:00:00Z") }),
  });
  expect(await (await prepareFunction(encoded, null))({ db: drizzle.mock() })).toEqual({
    id: "12",
    time: "2026-01-01T00:00:00.000Z",
  });
});
