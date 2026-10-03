import { expectTypeOf } from "vite-plus/test";
import {
  createHstoreCodec,
  createHstoreArrayCodec,
  type HstoreValue,
} from "../../../apps/loom/src/core/extensions/hstore-codec";
import {
  nullableCodec,
  type CodecInput,
  type CodecOutput,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";

const codec = createHstoreCodec("extensions");
const array = createHstoreArrayCodec("extensions");
const nullable = nullableCodec(codec);
const nullableArray = nullableCodec(array);
expectTypeOf<CodecInput<typeof codec>>().toEqualTypeOf<HstoreValue>();
expectTypeOf<CodecOutput<typeof codec>>().toEqualTypeOf<HstoreValue>();
expectTypeOf(codec.decode('"key"=>NULL')).toEqualTypeOf<HstoreValue>();
expectTypeOf<CodecInput<typeof array>>().toEqualTypeOf<PostgreSqlArray<HstoreValue>>();
expectTypeOf<CodecOutput<typeof array>>().toEqualTypeOf<PostgreSqlArray<HstoreValue>>();
expectTypeOf(array.decode("{}")).toEqualTypeOf<PostgreSqlArray<HstoreValue>>();
expectTypeOf<CodecInput<typeof nullable>>().toEqualTypeOf<HstoreValue | null>();
expectTypeOf(nullable.decode(null)).toEqualTypeOf<HstoreValue | null>();
expectTypeOf(nullableArray.decode(null)).toEqualTypeOf<PostgreSqlArray<HstoreValue> | null>();
const readonlyInput: HstoreValue = { entries: [{ key: "key", value: null }] };
codec.encode(readonlyInput);
array.encode({ dimensions: [{ lowerBound: -2, length: 2 }], values: [readonlyInput, null] });
array.encode({ dimensions: [], values: [] });
nullable.encode(null);
// @ts-expect-error fixed entries wrapper, not a dictionary
codec.encode({ key: "value" });
// @ts-expect-error a Map is not the fixed wrapper
codec.encode(new Map([["key", "value"]]));
// @ts-expect-error keys are text
codec.encode({ entries: [{ key: 1, value: "value" }] });
// @ts-expect-error values are text or stored NULL
codec.encode({ entries: [{ key: "key", value: 1 }] });
// @ts-expect-error undefined is not stored NULL
codec.encode({ entries: [{ key: "key", value: undefined }] });
// @ts-expect-error base codec does not accept whole SQL NULL
codec.encode(null);
// @ts-expect-error no caller-selected output generic
codec.decode<string>("");
// @ts-expect-error array input requires dimensions and values
array.encode([readonlyInput]);
// @ts-expect-error array leaves require the fixed hstore wrapper
array.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: ["key=>value"] });
// @ts-expect-error native dimension fields are numeric
array.encode({ dimensions: [{ lowerBound: "1", length: 1 }], values: [readonlyInput] });
// @ts-expect-error array nesting contains wrappers, nested arrays or NULL, not numbers
array.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [[1]] });
// Runtime/native tests, rather than this type, enforce rank, int32 bounds and rectangular cardinality.
