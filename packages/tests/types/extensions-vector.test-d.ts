import { expectTypeOf } from "vite-plus/test";
import { sql, type SQL } from "drizzle-orm";
import { customType, pgTable, boolean } from "drizzle-orm/pg-core";
import { createVector_0_8_6 } from "../../../apps/loom/src/core/extensions/adapters/vector";
import type { NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
import type { DenseVectorValue, SparseVectorValue } from "../../../apps/loom/src/core/extensions/vector-codecs";

const descriptor = {
  name: "vector",
  version: "0.8.6",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4" },
} as const;
const api = createVector_0_8_6(descriptor);
const dense = customType<{ data: DenseVectorValue }>({ dataType: () => "extensions.vector" });
const sparse = customType<{ data: SparseVectorValue }>({ dataType: () => "extensions.sparsevec" });
const columns = pgTable("vectors", {
  value: dense().notNull(),
  missing: dense(),
  sparse: sparse().notNull(),
  active: boolean().notNull(),
});
expectTypeOf(api.version).toEqualTypeOf<"0.8.6">();
expectTypeOf(api.schema).toEqualTypeOf<"extensions">();
expectTypeOf(api.vector.l2Distance(columns.value, [1])).toEqualTypeOf<SQL<number | NonfiniteNumber>>();
expectTypeOf(api.vector.l2Distance(columns.missing, [1])).toEqualTypeOf<SQL<number | NonfiniteNumber | null>>();
expectTypeOf(api.halfvec.cosineDistance(null, [1])).toEqualTypeOf<SQL<number | NonfiniteNumber | null>>();
expectTypeOf(api.sparsevec.innerProduct(columns.sparse, { dimensions: 1, entries: [] })).toEqualTypeOf<
  SQL<number | NonfiniteNumber>
>();
expectTypeOf(api.vector.equals(columns.value, [1])).toEqualTypeOf<SQL<boolean>>();
expectTypeOf(api.vector.compare(null, [1])).toEqualTypeOf<SQL<number | null>>();
expectTypeOf(api.vector.concat([1], [2, 3])).toEqualTypeOf<SQL<DenseVectorValue>>();
expectTypeOf(api.halfvec.subvector([1, 2], 1, null)).toEqualTypeOf<SQL<DenseVectorValue | null>>();
expectTypeOf(api.sparsevec.normalize(columns.sparse)).toEqualTypeOf<SQL<SparseVectorValue>>();
expectTypeOf(api.vector.send([1])).toEqualTypeOf<SQL<{ hex: string }>>();
expectTypeOf(api.sql.overloads["routine:$extension:vector.vector_dims($extension:vector.halfvec)"]([1])).toEqualTypeOf<
  SQL<number>
>();
api.vector.norm(sql<DenseVectorValue>`value`.as("embedding"));
// @ts-expect-error No caller-selected output generic.
api.vector.l2Distance<string>([1], [2]);
// @ts-expect-error No finite-only distance promise: native cosine may return NaN.
const finite: SQL<number> = api.vector.cosineDistance([0], [1]);
// @ts-expect-error Nullable native inputs keep nullable outputs.
const nonnull: SQL<DenseVectorValue> = api.vector.normalize(columns.missing);
// @ts-expect-error Sparse and dense input representations are distinct.
api.vector.norm(columns.sparse);
// @ts-expect-error Boolean columns do not satisfy vector operands.
api.sparsevec.equals(columns.active, { dimensions: 1, entries: [] });
// @ts-expect-error subvector uses integer SQL inputs, not text parameters.
api.vector.subvector([1], "1", 1);
// @ts-expect-error Scalar query slice does not invent sparse arithmetic.
api.sparsevec.add({ dimensions: 1, entries: [] }, { dimensions: 1, entries: [] });
expectTypeOf(api.vector.binaryQuantize([1])).toEqualTypeOf<SQL<{ readonly bits: string }>>();
expectTypeOf(api.vector.average(columns.value)).toEqualTypeOf<SQL<DenseVectorValue | null>>();
expectTypeOf(api.halfvec.sum(columns.missing)).toEqualTypeOf<SQL<DenseVectorValue | null>>();
expectTypeOf(api.bit.hammingDistance({ bits: "01" }, { bits: "10" })).toEqualTypeOf<SQL<number | NonfiniteNumber>>();
expectTypeOf(api.bit.jaccardDistance(null, { bits: "10" })).toEqualTypeOf<SQL<number | NonfiniteNumber | null>>();
// @ts-expect-error Empty input sets can produce NULL even for a nonnullable column.
const aggregateNonnull: SQL<DenseVectorValue> = api.vector.average(columns.value);
// @ts-expect-error Native bit arguments require the exact bit-value representation.
api.bit.hammingDistance("01", { bits: "10" });
// @ts-expect-error Captured cast functions require all three SQL arguments.
api.sql.overloads[
  "routine:$extension:vector.vector_to_halfvec($extension:vector.vector,pg_catalog.int4,pg_catalog.bool)"
]([1]);
void aggregateNonnull;
// @ts-expect-error Factory rejects other versions.
createVector_0_8_6({ ...descriptor, version: "0.8.5" });
void [finite, nonnull];
