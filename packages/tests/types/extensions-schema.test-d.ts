import * as v from "valibot";
import { defineRelations } from "drizzle-orm";
import type { BuildQueryResult } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createExtensionField } from "../../../apps/loom/src/core/extensions/fields";
import { textCodec, arrayCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";
import type { SearchFilter } from "../../../apps/loom/src/core/search/types";
const opaque = createExtensionField({
  extension: { name: "fixture", version: "1", schema: "custom", apiSupport: { status: "verified", digest: "fixture" } },
  member: "type:opaque",
  type: "opaque",
  operators: {
    eq: { member: "operator:=", schema: "custom", name: "=", operand: "field" },
    ne: { member: "operator:<>", schema: "custom", name: "<>", operand: "field" },
  },
  codec: textCodec,
  value: { kind: "string" },
  search: { filter: true, order: false, comparison: false, text: false },
});
const schema = defineSchema(() => ({
  documents: { opaque: opaque.notNull().unique().default("value").validate(v.string()), label: opaque },
}));
const graph = defineRelations(schema.tables);
const search = createSearchValidators(schema, graph);
// @ts-expect-error Extension representation does not grant ordering.
search.documents.search({ columns: ["opaque"], order: ["opaque"], scope: "public" });
// @ts-expect-error Extension representation does not grant text matching.
search.documents.search({ columns: ["opaque"], filter: ["opaque"], text: ["opaque"], scope: "public" });
type Filter = SearchFilter<typeof graph, typeof graph.documents, { filter: readonly ["opaque"] }>;
const filter: Filter = { opaque: { eq: "value" } };
// @ts-expect-error Equality approval does not grant scalar comparison.
const comparison: Filter = { opaque: { gt: "value" } };
// @ts-expect-error Checked native fields retain the codec's value type.
opaque.default(12);
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type NativeValues = [
  Assert<Equal<BuildQueryResult<typeof graph, typeof graph.documents, true>["opaque"], string>>,
  Assert<Equal<BuildQueryResult<typeof graph, typeof graph.documents, true>["label"], string | null>>,
];
void filter;
void comparison;
const array = createExtensionField({
  extension: { name: "fixture", version: "1", schema: "custom", apiSupport: { status: "verified", digest: "fixture" } },
  member: "type:opaque",
  type: "opaque",
  codec: arrayCodec(textCodec),
  array: true,
  value: {
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: { lowerBound: { kind: "number", integer: true }, length: { kind: "number", integer: true } },
        },
      },
      values: { kind: "array", items: { kind: "string" } },
    },
  },
  search: { filter: false, order: false, comparison: false, text: false },
});
array.default({ dimensions: [{ lowerBound: 0, length: 1 }], values: ["value"] });
