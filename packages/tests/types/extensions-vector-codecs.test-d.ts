import { expectTypeOf } from "vite-plus/test";
import {
  createHalfvecArrayCodec,
  createHalfvecCodec,
  createSparsevecArrayCodec,
  createSparsevecCodec,
  createVectorArrayCodec,
  createVectorCodec,
  type DenseVectorValue,
  type SparseVectorValue,
} from "../../../apps/loom/src/core/extensions/vector-codecs";
import {
  nullableCodec,
  type CodecInput,
  type CodecOutput,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";

const vector = createVectorCodec("extensions", 3);
const halfvec = createHalfvecCodec("extensions");
const sparsevec = createSparsevecCodec("extensions", 5);
const vectorArray = createVectorArrayCodec("extensions");
const halfvecArray = createHalfvecArrayCodec("extensions", 2);
const sparsevecArray = createSparsevecArrayCodec("extensions");
expectTypeOf<CodecInput<typeof vector>>().toEqualTypeOf<DenseVectorValue>();
expectTypeOf<CodecOutput<typeof vector>>().toEqualTypeOf<DenseVectorValue>();
expectTypeOf<CodecInput<typeof halfvec>>().toEqualTypeOf<DenseVectorValue>();
expectTypeOf(halfvec.decode("[1]")).toEqualTypeOf<DenseVectorValue>();
expectTypeOf<CodecInput<typeof sparsevec>>().toEqualTypeOf<SparseVectorValue>();
expectTypeOf(sparsevec.decode("{}/5")).toEqualTypeOf<SparseVectorValue>();
expectTypeOf<CodecInput<typeof vectorArray>>().toEqualTypeOf<PostgreSqlArray<DenseVectorValue>>();
expectTypeOf<CodecOutput<typeof halfvecArray>>().toEqualTypeOf<PostgreSqlArray<DenseVectorValue>>();
expectTypeOf(sparsevecArray.decode("{}")).toEqualTypeOf<PostgreSqlArray<SparseVectorValue>>();
expectTypeOf(nullableCodec(vector).decode(null)).toEqualTypeOf<DenseVectorValue | null>();
expectTypeOf(nullableCodec(sparsevecArray).decode(null)).toEqualTypeOf<PostgreSqlArray<SparseVectorValue> | null>();
const readonlyDense: DenseVectorValue = Object.freeze([1, 2, 3]);
const readonlySparse: SparseVectorValue = { dimensions: 5, entries: [{ index: 2, value: 1 }] };
vector.encode(readonlyDense);
halfvec.encode([0.5]);
sparsevec.encode(readonlySparse);
vectorArray.encode({ dimensions: [{ lowerBound: 0, length: 2 }], values: [readonlyDense, null] });
sparsevecArray.encode({ dimensions: [], values: [] });
nullableCodec(halfvec).encode(null);
// @ts-expect-error dense elements are numbers
vector.encode(["1"]);
// @ts-expect-error dense vectors are arrays, not pgvector text
vector.encode("[1,2,3]");
// @ts-expect-error base codec does not accept whole SQL NULL
vector.encode(null);
// @ts-expect-error no caller-selected output generic
vector.decode<number[]>("[1]");
// @ts-expect-error sparsevec requires dimensions
sparsevec.encode({ entries: [] });
// @ts-expect-error sparsevec entries are index/value objects, not a dictionary
sparsevec.encode({ dimensions: 5, entries: { 1: 2 } });
// @ts-expect-error sparsevec indices are numbers
sparsevec.encode({ dimensions: 5, entries: [{ index: "1", value: 2 }] });
// @ts-expect-error dense and sparse values are distinct
sparsevec.encode(readonlyDense);
// @ts-expect-error vector arrays require dimensions and values
vectorArray.encode([readonlyDense]);
// @ts-expect-error dense array leaves are numeric arrays, not text
halfvecArray.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: ["[1,2]"] });
// Runtime/native tests, rather than these types, enforce typmod dimensions, float4/binary16 range and canonical sparse order.
