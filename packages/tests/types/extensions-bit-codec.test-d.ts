import { expectTypeOf } from "vite-plus/test";
import {
  createBitArrayCodec,
  createBitCodec,
  createVarbitArrayCodec,
  createVarbitCodec,
  type BitStringValue,
} from "../../../apps/loom/src/core/extensions/bit-codec";
import {
  nullableCodec,
  type CodecInput,
  type CodecOutput,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";

const bit = createBitCodec(3);
const varbit = createVarbitCodec();
const bitArray = createBitArrayCodec();
const varbitArray = createVarbitArrayCodec(8);
expectTypeOf<CodecInput<typeof bit>>().toEqualTypeOf<BitStringValue>();
expectTypeOf<CodecOutput<typeof bit>>().toEqualTypeOf<BitStringValue>();
expectTypeOf(varbit.decode("")).toEqualTypeOf<BitStringValue>();
expectTypeOf<CodecInput<typeof bitArray>>().toEqualTypeOf<PostgreSqlArray<BitStringValue>>();
expectTypeOf(varbitArray.decode("{}")).toEqualTypeOf<PostgreSqlArray<BitStringValue>>();
expectTypeOf(nullableCodec(bit).decode(null)).toEqualTypeOf<BitStringValue | null>();
expectTypeOf<BitStringValue["bits"]>().toEqualTypeOf<string>();
const readonlyBits: BitStringValue = Object.freeze({ bits: "010" });
bit.encode(readonlyBits);
varbit.encode({ bits: "" });
bitArray.encode({ dimensions: [{ lowerBound: 0, length: 2 }], values: [readonlyBits, null] });
nullableCodec(varbitArray).encode(null);
// @ts-expect-error bit strings are wrapped, not arbitrary text
bit.encode("010");
// @ts-expect-error bit strings are not packed bytes
bit.encode(new Uint8Array([1]));
// @ts-expect-error bit strings are not boolean arrays
varbit.encode([true, false]);
// @ts-expect-error base codec does not accept whole SQL NULL
bit.encode(null);
// @ts-expect-error public values are readonly
readonlyBits.bits = "1";
// @ts-expect-error no caller-selected output generic
bit.decode<string>("1");
// @ts-expect-error bit arrays require dimensions and values
bitArray.encode([readonlyBits]);
// Runtime/native tests, rather than these types, enforce binary digits and runtime lengths.
