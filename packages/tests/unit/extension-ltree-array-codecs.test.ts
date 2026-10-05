import { expect, test } from "vite-plus/test";
import { arrayCodec, nullableCodec, type PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import { createLtreeCodec } from "../../../apps/loom/src/core/extensions/ltree-codec";
import { createExtensionField, type ExtensionValueSchema } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import {
  createLtreeArrayCodec,
  createLqueryArrayCodec,
  createLtxtqueryArrayCodec,
} from "../../../apps/loom/src/core/extensions/ltree-array-codecs";

const schema = 'Ltree "Array_日本';
const codecs = [createLtreeArrayCodec(schema), createLqueryArrayCodec(schema), createLtxtqueryArrayCodec(schema)];

test("ltree.arrays.genericCodecAllowsBackendRejectedUpperBound", () => {
  // Actual PostgreSQL and Neon characterization observed SQLSTATE 54000 for this encoded operand.
  const value = { dimensions: [{ lowerBound: 2147483647, length: 1 }], values: ["Top.Science"] };
  expect(arrayCodec(createLtreeCodec("extensions")).encode(value)).toBe('[2147483647:2147483647]={"Top.Science"}');
});

test("ltree.arrays.preserveNativeIdentityBoundsRanksAndNullableLeaves", () => {
  for (const [index, codec] of codecs.entries()) {
    const name = ["ltree", "lquery", "ltxtquery"][index];
    expect(codec.sqlType).toEqual({ schema, name, array: true });
    expect(codec.transport).toBe("text");
    expect(codec.id).toContain("ltree:array:int32:1:");
    expect(Object.isFrozen(codec)).toBe(true);
    expect(Object.isFrozen(codec.sqlType)).toBe(true);
    const nullable = nullableCodec<PostgreSqlArray<string>, PostgreSqlArray<string>>(codec);
    expect(nullable.encode(null)).toBeNull();
    expect(nullable.decode(null)).toBeNull();
    const empty = { dimensions: [], values: [] };
    expect(codec.encode(empty)).toBe("{}");
    expect(codec.decode("{}")).toEqual(empty);
    for (const lowerBound of [-2147483648, -2, 0, 1, 2147483646]) {
      const value = { dimensions: [{ lowerBound, length: 1 }], values: ["Top"] };
      expect(codec.decode(codec.encode(value))).toEqual(value);
    }
    const value = { dimensions: [{ lowerBound: -2, length: 2 }], values: [null, "Top"] };
    expect(codec.decode(codec.encode(value))).toEqual(value);
    for (let rank = 2; rank <= 6; rank++) {
      let values: PostgreSqlArray<string>["values"] = ["Top"];
      for (let depth = 1; depth < rank; depth++) values = [values];
      const nested = { dimensions: Array.from({ length: rank }, () => ({ lowerBound: -2, length: 1 })), values };
      expect(codec.decode(codec.encode(nested))).toEqual(nested);
    }
  }
  expect(createLtreeArrayCodec("extensions").id).toBe(codecs[0]!.id);
  expect(createLqueryArrayCodec("extensions").id).toBe(codecs[1]!.id);
  expect(createLtxtqueryArrayCodec("extensions").id).toBe(codecs[2]!.id);
});

test("ltree.arrays.rejectNativeOverflowRaggedOrUnrepresentableInputs", () => {
  const invalid = [
    { dimensions: [{ lowerBound: 2147483647, length: 1 }], values: ["Top"] },
    { dimensions: [{ lowerBound: -2147483649, length: 1 }], values: ["Top"] },
    { dimensions: [{ lowerBound: 1.5, length: 1 }], values: ["Top"] },
    { dimensions: [{ lowerBound: 1, length: 0 }], values: [] },
    { dimensions: [{ lowerBound: 1, length: 2147483648 }], values: ["Top"] },
    { dimensions: [{ lowerBound: 1, length: 2 }], values: ["Top"] },
    { dimensions: [], values: ["Top"] },
    { dimensions: [], values: [[]] },
    { dimensions: [{ lowerBound: 1, length: 1 }], values: [["Top"]] },
    {
      dimensions: [
        { lowerBound: 1, length: 2 },
        { lowerBound: 1, length: 1 },
      ],
      values: [["Top"], ["Top", "Top"]],
    },
    { dimensions: Array.from({ length: 7 }, () => ({ lowerBound: 1, length: 1 })), values: [[[[[[["Top"]]]]]]] },
  ];
  for (const codec of codecs) {
    for (const value of invalid) expect(() => codec.encode(value)).toThrow();
    for (const value of [
      null,
      undefined,
      [],
      "{}",
      { dimensions: [], values: [], extra: true },
      { dimensions: [], values: null },
    ]) {
      // @ts-expect-error Verify the structured input contract at runtime.
      expect(() => codec.encode(value)).toThrow();
    }
    for (const leaf of [1, true, {}, undefined, "a\0b", "\ud800", "\udc00"]) {
      // @ts-expect-error Verify string-only leaves without coercion.
      expect(() => codec.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [leaf] })).toThrow();
    }
    for (const text of [
      "[2147483647:2147483647]={Top}",
      "[-2147483649:-2147483649]={Top}",
      "{{{{{{{Top}}}}}}}",
      "{{Top},{Top,Top}}",
      '{"a\u0000b"}',
      '{"\ud800"}',
    ])
      expect(() => codec.decode(text)).toThrow();
    for (const value of [null, undefined, 1, [], ["Top"], {}]) expect(() => codec.decode(value)).toThrow();
  }
});

test("ltree.arrays.keepEmptyPathsAndNativeGrammarDistinctFromRepresentation", () => {
  expect(codecs[0]!.decode('{"",NULL}')).toEqual({ dimensions: [{ lowerBound: 1, length: 2 }], values: ["", null] });
  for (const codec of codecs) {
    const input = { dimensions: [{ lowerBound: 1, length: 1 }], values: ["😀.𐐀"] };
    expect(codec.decode(codec.encode(input))).toEqual(input);
    // Representation is lossless even when the backend later rejects scalar grammar.
    const malformed = { dimensions: [{ lowerBound: 1, length: 1 }], values: ["a..b"] };
    expect(codec.decode(codec.encode(malformed))).toEqual(malformed);
  }
});

test("ltree.arrays.migrationDefaultsRetainArrayIdentityWithoutIntermediateScalarCast", async () => {
  const value: ExtensionValueSchema = {
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: { lowerBound: { kind: "number", integer: true }, length: { kind: "number", integer: true } },
        },
      },
      values: { kind: "array", items: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] } },
    },
  };
  for (const codec of codecs) {
    const name = codec.sqlType!.name;
    const field = createExtensionField({
      extension: {
        name: "ltree",
        version: "1.3",
        schema,
        apiSupport: { status: "verified", digest: "fixture-digest" },
      },
      member: `type:$extension:ltree._${name}`,
      type: name,
      array: true,
      codec,
      value,
      search: { filter: false, comparison: false, order: false, text: false },
    });
    const declared = defineSchema(
      () => ({
        docs: { items: field.notNull().default({ dimensions: [{ lowerBound: -2, length: 1 }], values: ["Top"] }) },
      }),
      { namespace: "app" },
    );
    const snapshot = await createSnapshot(declared);
    const ddl = (await migrationStatements(await emptySnapshot("app"), snapshot)).join("\n");
    const qualifiedType = `"Ltree ""Array_日本"."${name}"`;
    expect(ddl).toContain(`DEFAULT '[-2:-2]={"Top"}'::${qualifiedType}[]`);
    expect(ddl).not.toContain(`::${qualifiedType}::`);
  }
});
