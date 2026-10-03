import type { ExtensionDescriptor } from "./bindings";
import type { ExtensionCodec, PostgreSqlArray } from "./codecs";
import { createExtensionField } from "./fields";
import { createHstoreArrayCodec, createHstoreCodec, type HstoreValue } from "./hstore-codec";
import type { ExtensionValueSchema } from "./values";

const digest = "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1";
type Descriptor = ExtensionDescriptor<"hstore", { readonly version: "1.8"; readonly schema: string }>;
// Ordering, comparison, filtering and text matching are not approved for hstore; native query helpers still read the field.
const noSearch = { filter: false, comparison: false, order: false, text: false } as const;
const nullableText: ExtensionValueSchema = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] };
// Uniqueness and well-formed UTF8 are codec invariants; the portable projection retains the fixed wrapper shape.
const hstoreValue: ExtensionValueSchema = {
  kind: "object",
  properties: {
    entries: {
      kind: "array",
      items: { kind: "object", properties: { key: { kind: "string" }, value: nullableText } },
    },
  },
};
// PostgreSQL MAXDIM is six. The codec validates rectangularity and exact bounds; the portable schema retains each native depth.
let nested: ExtensionValueSchema = { kind: "union", variants: [hstoreValue, { kind: "null" }] };
const depths: ExtensionValueSchema[] = [];
for (let dimension = 0; dimension < 6; dimension++) {
  nested = { kind: "array", items: nested };
  depths.push(nested);
}
const hstoreArrayValue: ExtensionValueSchema = {
  kind: "object",
  properties: {
    dimensions: {
      kind: "array",
      items: {
        kind: "object",
        properties: {
          lowerBound: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
          length: { kind: "number", integer: true, minimum: 1, maximum: 2147483647 },
        },
      },
    },
    values: { kind: "union", variants: depths },
  },
};

/** Exact hstore 1.8 scalar and native array schema fields. Public registration, indexes and subscripting remain separate. */
export function createHstoreFields_1_8<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "hstore" ||
    descriptor.version !== "1.8" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("hstore 1.8 fields require its exact verified contract");
  const codec = createHstoreCodec(descriptor.schema);
  const arrayCodec: ExtensionCodec<PostgreSqlArray<HstoreValue>, PostgreSqlArray<HstoreValue>> = createHstoreArrayCodec(
    descriptor.schema,
  );
  return Object.freeze({
    field: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:hstore.hstore",
        type: "hstore",
        codec,
        value: hstoreValue,
        search: noSearch,
      }),
    arrayField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:hstore._hstore",
        type: "hstore",
        array: true,
        codec: arrayCodec,
        value: hstoreArrayValue,
        search: noSearch,
      }),
  });
}
