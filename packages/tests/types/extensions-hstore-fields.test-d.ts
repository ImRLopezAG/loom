import { expectTypeOf } from "vite-plus/test";
import { defineRelations } from "drizzle-orm";
import type { BuildQueryResult } from "drizzle-orm";
import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import * as v from "valibot";
import { createHstoreFields_1_8 } from "../../../apps/loom/src/core/extensions/hstore-fields";
import type { HstoreValue } from "../../../apps/loom/src/core/extensions/hstore-codec";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";

const descriptor = {
  name: "hstore",
  version: "1.8",
  schema: "case_maps",
  apiSupport: { status: "verified", digest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1" },
} as const;
const api = createHstoreFields_1_8(descriptor);
const schema = defineSchema(
  (fields) => ({
    docs: {
      label: fields.text().notNull(),
      value: api.field(),
      other: api
        .field()
        .notNull()
        .default({ entries: [{ key: "default", value: null }] }),
      items: api.arrayField(),
      many: api.arrayField().notNull().default({ dimensions: [], values: [] }),
      count: fields.integer(),
    },
  }),
  { namespace: "app" },
);
const relations = defineRelations(schema.tables);
type Doc = (typeof schema.tables.docs)["$inferSelect"];
type DocInsert = (typeof schema.tables.docs)["$inferInsert"];

// Real declared column values retain the fixed hstore wrapper and PostgreSQL array bounds.
expectTypeOf<Doc["value"]>().toEqualTypeOf<HstoreValue | null>();
expectTypeOf<Doc["other"]>().toEqualTypeOf<HstoreValue>();
expectTypeOf<Doc["items"]>().toEqualTypeOf<PostgreSqlArray<HstoreValue> | null>();
expectTypeOf<Doc["many"]>().toEqualTypeOf<PostgreSqlArray<HstoreValue>>();
expectTypeOf<DocInsert["value"]>().toEqualTypeOf<HstoreValue | null | undefined>();
expectTypeOf<DocInsert["other"]>().toEqualTypeOf<HstoreValue | undefined>();
expectTypeOf<DocInsert["items"]>().toEqualTypeOf<PostgreSqlArray<HstoreValue> | null | undefined>();
expectTypeOf<DocInsert["many"]>().toEqualTypeOf<PostgreSqlArray<HstoreValue> | undefined>();
type Queried = BuildQueryResult<typeof relations, typeof relations.docs, true>;
expectTypeOf<Queried["value"]>().toEqualTypeOf<HstoreValue | null>();
expectTypeOf<Queried["many"]>().toEqualTypeOf<PostgreSqlArray<HstoreValue>>();

const none: HstoreValue = { entries: [] };
const noItems: PostgreSqlArray<HstoreValue> = { dimensions: [], values: [] };
const one = { lowerBound: 1, length: 1 };
type ValidatorInput = StandardSchemaV1.InferInput<typeof schema.validators.docs.insert>;
expectTypeOf<ValidatorInput["value"]>().toEqualTypeOf<HstoreValue | null | undefined>();
expectTypeOf<ValidatorInput["items"]>().toEqualTypeOf<PostgreSqlArray<HstoreValue> | null | undefined>();
expectTypeOf<ValidatorInput["other"]>().toEqualTypeOf<HstoreValue | undefined>();
expectTypeOf<ValidatorInput["many"]>().toEqualTypeOf<PostgreSqlArray<HstoreValue> | undefined>();
const validatorInput: ValidatorInput = { label: "typed", value: none, items: noItems };
const requiredSchema = defineSchema(() => ({
  required: { value: api.field().notNull(), items: api.arrayField().notNull() },
}));
type RequiredInput = StandardSchemaV1.InferInput<typeof requiredSchema.validators.required.insert>;
const requiredInput: RequiredInput = { value: none, items: noItems };
// @ts-expect-error Required structured fields cannot be omitted from validator input.
const omittedRequired: RequiredInput = {};
// @ts-expect-error A required hstore field cannot take whole SQL NULL.
const nullRequired: RequiredInput = { value: null, items: noItems };
void [validatorInput, requiredInput, omittedRequired, nullRequired];
// Valid inputs, including stored NULL, whole SQL NULL, empty and ranked arrays.
const ok: DocInsert = {
  label: "ok",
  value: { entries: [{ key: "stored", value: null }] },
  items: {
    dimensions: [{ lowerBound: -2, length: 3 }],
    values: [{ entries: [] }, null, { entries: [{ key: "a", value: "b" }] }],
  },
};
const wholeNull: DocInsert = { label: "null", value: null, items: null };
const rank2: DocInsert = {
  label: "rank2",
  items: {
    dimensions: [
      { lowerBound: 1, length: 1 },
      { lowerBound: 1, length: 2 },
    ],
    values: [[{ entries: [] }, null]],
  },
};
void [ok, wholeNull, rank2];
// @ts-expect-error A dictionary is not the fixed entries wrapper.
const dictionary: DocInsert = { label: "x", value: { key: "value" } };
// @ts-expect-error A text spelling is not an hstore value.
const text: DocInsert = { label: "x", value: "key=>value" };
// @ts-expect-error A Map is not the fixed entries wrapper.
const map: DocInsert = { label: "x", value: new Map([["key", "value"]]) };
// @ts-expect-error Stored NULL is a null value, not undefined.
const undefinedValue: DocInsert = { label: "x", value: { entries: [{ key: "k", value: undefined }] } };
// @ts-expect-error Values are text or stored NULL.
const numberValue: DocInsert = { label: "x", value: { entries: [{ key: "k", value: 1 }] } };
// @ts-expect-error A notNull field has no SQL NULL input.
const requiredNull: DocInsert = { label: "x", other: null };
// @ts-expect-error A plain array erases PostgreSQL bounds.
const erased: DocInsert = { label: "x", items: [{ entries: [] }] };
// @ts-expect-error Array input requires dimensions and values.
const missingBounds: DocInsert = { label: "x", items: { values: [] } };
// @ts-expect-error Array leaves are hstore wrappers, nested arrays or NULL.
const textLeaf: DocInsert = { label: "x", items: { dimensions: [one], values: ["a=>b"] } };
// @ts-expect-error A scalar hstore is not an array field value.
const scalarForArray: DocInsert = { label: "x", items: { entries: [] } };
// @ts-expect-error An array is not a scalar field value.
const arrayForScalar: DocInsert = { label: "x", value: { dimensions: [], values: [] } };
// @ts-expect-error Dimension bounds are numeric.
const stringBound: DocInsert = { label: "x", items: { dimensions: [{ lowerBound: "1", length: 1 }], values: [] } };
void [
  dictionary,
  text,
  map,
  undefinedValue,
  numberValue,
  requiredNull,
  erased,
  missingBounds,
  textLeaf,
  scalarForArray,
  arrayForScalar,
  stringBound,
];

// RPC input and output come from the actual schema and relational query, with no caller-selected shape.
const { procedure, validators } = createProjectProcedures(schema);
const read = createDatabaseMiddleware(relations, "read", schema);
const list = procedure
  .use(read)
  .handler(({ context: { db } }) =>
    db.query.docs.findMany({ columns: { value: true, other: true, items: true, many: true } }),
  );
const output: InferRouterOutputs<typeof list> = [{ value: null, other: none, items: null, many: noItems }];
// @ts-expect-error Query output retains the fixed hstore wrapper.
const badOutput: InferRouterOutputs<typeof list> = [{ value: "a=>b", other: none, items: null, many: noItems }];
const create = procedure.input(validators.tables.docs.insert).handler(({ input }) => {
  expectTypeOf(input.value).toEqualTypeOf<HstoreValue | null | undefined>();
  expectTypeOf(input.items).toEqualTypeOf<PostgreSqlArray<HstoreValue> | null | undefined>();
  // @ts-expect-error The inferred hstore wrapper has no dictionary indexing.
  void input.value?.key;
  return input.value;
});
const okInput: InferRouterInputs<typeof create> = { label: "typed", value: none };
// @ts-expect-error RPC input rejects dictionaries.
const badInput: InferRouterInputs<typeof create> = { label: "typed", value: { key: "k" } };
// @ts-expect-error RPC input rejects erased array bounds.
const badArrayInput: InferRouterInputs<typeof create> = { label: "typed", items: [none] };
const caller = procedure
  .use(read)
  .input(v.object({ id: validators.id("docs") }))
  .handler(({ context: { db }, input }) =>
    db.query.docs.findFirst({ columns: { value: true }, where: { _id: { eq: input.id } } }),
  );
const single: InferRouterOutputs<typeof caller> = { value: none };
void [output, badOutput, okInput, badInput, badArrayInput, single];

// No caller generic, schema, result type or cast selects another value type.
// @ts-expect-error Field factories take no caller generic result.
api.field<{ forged: true }>();
// @ts-expect-error Array field factories take no caller generic result.
api.arrayField<PostgreSqlArray<string>>();
// @ts-expect-error Field factories take no installation-namespace or cast arguments.
api.field("other_schema");
// @ts-expect-error Only exact hstore 1.8 descriptors are selectable.
createHstoreFields_1_8({ ...descriptor, version: "1.7" });
// @ts-expect-error Only the hstore descriptor is selectable.
createHstoreFields_1_8({ ...descriptor, name: "citext" });
// @ts-expect-error Defaults use the fixed wrapper.
api.field().default({ key: "value" });
// @ts-expect-error Array defaults require PostgreSQL bounds.
api.arrayField().default([none]);

// Search remains closed: no filter, ordering, comparison or text evidence is granted.
const search = createSearchValidators(schema, relations);
// @ts-expect-error hstore comparison operators do not approve scalar filtering.
search.docs.search({ columns: ["value"], filter: ["value"], scope: "public" });
// @ts-expect-error hstore comparison operators do not approve ordering.
search.docs.search({ columns: ["value"], order: ["value"], scope: "public" });
// @ts-expect-error hstore text I/O does not approve text matching.
search.docs.search({ columns: ["value"], filter: ["value"], text: ["value"], scope: "public" });
// @ts-expect-error Arrays do not acquire scalar or element search.
search.docs.search({ columns: ["items"], filter: ["items"], scope: "public" });
// @ts-expect-error Arrays do not acquire ordering.
search.docs.search({ columns: ["items"], order: ["items"], scope: "public" });
// Ordinary fields in the same schema remain searchable.
search.docs.search({ columns: ["label", "count"], filter: ["label"], order: ["count"], scope: "public" });
