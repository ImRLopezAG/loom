import { expect, test } from "vite-plus/test";
import { defineSchema, defineTable, encodeWire } from "@loom/core/server";
import { z } from "zod";
import * as v from "valibot";
import { type } from "arktype";
import { Schema } from "effect";

test("field validators normalize through Standard Schema and outputs still fit storage", async () => {
  const schema = defineSchema((s) => ({
    items: {
      title: s
        .text()
        .notNull()
        .validate(z.string().transform((value) => value.trim())),
      count: s.integer().validate(z.string().transform(Number)),
      invalid: s.integer().validate(z.string()),
    },
  }));
  const insert = schema.validators.items.insert["~standard"].validate;
  expect(await insert({ title: " Build ", count: "12" })).toEqual({ value: { title: "Build", count: 12 } });
  expect((await insert({ title: "Build", invalid: "not an integer" })).issues?.[0]?.path).toEqual(["invalid"]);
  expect((await insert({ title: "Build", count: "1.2" })).issues).toBeDefined();
});

test("insert, patch, command and public masks reject unexpected writes and omit secrets", async () => {
  const schema = defineSchema((s) => ({
    accounts: defineTable(
      {
        name: s.text().notNull(),
        secret: s.text(),
        role: s.text().default("user"),
      },
      { serverFields: ["role"], commandFields: ["name"], publicFields: ["name"] },
    ),
  }));
  const validators = schema.validators.accounts;
  expect((await validators.insert["~standard"].validate({ name: "Angel", role: "admin" })).issues).toBeDefined();
  expect(
    (await validators.insert["~standard"].validate({ name: "Angel", _id: crypto.randomUUID() })).issues,
  ).toBeDefined();
  expect((await validators.insert["~standard"].validate({ name: "Angel", extra: 1 })).issues).toBeDefined();
  expect(await validators.patch["~standard"].validate({})).toEqual({ value: {} });
  expect(await validators.patch["~standard"].validate({ secret: null })).toEqual({ value: { secret: null } });
  expect((await validators.patch["~standard"].validate({ name: null })).issues).toBeDefined();
  expect((await validators.command["~standard"].validate({ name: "Angel", secret: "x" })).issues).toBeDefined();
  expect(await validators.public["~standard"].validate({ name: "Angel", secret: "hidden", role: "admin" })).toEqual({
    value: { name: "Angel" },
  });
  const closed = defineSchema((s) => ({ items: { value: s.text() } })).validators.items;
  expect(await closed.public["~standard"].validate({ value: "hidden" })).toEqual({ value: {} });
  expect((await closed.command["~standard"].validate({ value: "denied" })).issues).toBeDefined();
});

test("patch omission never applies an insert validator default", async () => {
  const schema = defineSchema((s) => ({
    items: { name: s.text().default("db").validate(z.string().default("validator")) },
  }));
  expect(await schema.validators.items.patch["~standard"].validate({})).toEqual({ value: {} });
  expect(await schema.validators.items.insert["~standard"].validate({})).toEqual({ value: { name: "validator" } });
  expect((await schema.validators.items.patch["~standard"].validate({ name: undefined })).issues).toBeDefined();
});

for (const [vendor, validator] of [
  ["Zod", z.string()],
  ["Valibot", v.string()],
  ["ArkType", type("string")],
  ["Effect", Schema.standardSchemaV1(Schema.String)],
] as const) {
  test(`derived validation supports ${vendor}`, async () => {
    const schema = defineSchema((s) => ({ items: { name: s.text().notNull().validate(validator) } }));
    expect(await schema.validators.items.insert["~standard"].validate({ name: "Loom" })).toEqual({
      value: { name: "Loom" },
    });
    expect((await schema.validators.items.insert["~standard"].validate({ name: 42 })).issues).toBeDefined();
  });
}

test("async refinement issues are normalized and storage/wire precision is explicit", async () => {
  const schema = defineSchema((s) => ({
    items: {
      name: s
        .text()
        .notNull()
        .validate(z.string().refine(async () => false, "denied")),
    },
  }));
  const result = await schema.validators.items.insert["~standard"].validate({ name: "Loom" });
  expect(result.issues).toEqual([{ message: "denied", path: ["name"] }]);
  expect(
    encodeWire({
      amount: 9007199254740993n,
      time: new Date("2026-01-01T00:00:00Z"),
      numeric: "1234567890123456789.25",
    }),
  ).toEqual({
    amount: "9007199254740993",
    time: "2026-01-01T00:00:00.000Z",
    numeric: "1234567890123456789.25",
  });
  expect(() => encodeWire({ value: Number.NaN })).toThrow();
});

test("public system fields are opt-in and cross-field checks cannot widen write masks", async () => {
  const schema = defineSchema((s) => ({
    items: defineTable(
      {
        min: s.integer().notNull(),
        max: s.integer().notNull(),
        secret: s.text(),
      },
      {
        publicFields: ["_id", "min"],
        serverFields: ["secret"],
        insertValidation: z
          .object({ min: z.number(), max: z.number() })
          .refine((row) => row.min <= row.max, "min exceeds max"),
        patchValidation: z.object({ min: z.number().optional(), max: z.number().default(10) }),
      },
    ),
  }));
  expect((await schema.validators.items.insert["~standard"].validate({ min: 3, max: 1 })).issues?.[0]?.message).toBe(
    "min exceeds max",
  );
  expect((await schema.validators.items.patch["~standard"].validate({ min: 1 })).issues?.[0]?.message).toContain(
    "omitted",
  );
  const id = crypto.randomUUID();
  const projected = await schema.validators.items.public["~standard"].validate({ _id: id, min: 1, secret: "hidden" });
  if (projected.issues) throw new Error("Unexpected projection issue");
  expect(projected.value._id === id).toBe(true);
  expect(Object.keys(projected.value).sort()).toEqual(["_id", "min"]);
  const widening = defineSchema((s) => ({
    items: defineTable(
      { value: s.integer(), secret: s.text() },
      {
        serverFields: ["secret"],
        insertValidation: z.object({ value: z.number() }).transform((row) => ({ ...row, secret: "injected" })),
      },
    ),
  }));
  expect((await widening.validators.items.insert["~standard"].validate({ value: 1 })).issues?.[0]?.path).toEqual([
    "secret",
  ]);
});
