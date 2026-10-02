import type { SQL } from "drizzle-orm";
import { float4Codec, int2Codec } from "../../../apps/loom/src/core/extensions/primitive-number-codecs";
import {
  arrayCodec,
  compositeCodec,
  nullableCodec,
  type CodecInput,
  type CodecOutput,
  type NonfiniteNumber,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";

const smallInput: CodecInput<typeof int2Codec> = 32767;
const smallOutput: CodecOutput<typeof int2Codec> = int2Codec.decode("32767");
const realInput: CodecInput<typeof float4Codec> = { nonfinite: "Infinity" };
const realOutput: number | NonfiniteNumber = float4Codec.decode("0.1");
const checkedOutput: CodecOutput<typeof float4Codec> = realOutput;
int2Codec.encode(smallInput);
float4Codec.encode(realInput);
// @ts-expect-error int2 inputs use numbers, rather than precision-preserving int8 bigint.
int2Codec.encode(1n);
// @ts-expect-error int2 has no string input grammar.
int2Codec.encode("1");
// @ts-expect-error float4 strings are driver outputs, rather than public inputs.
float4Codec.encode("0.1");
// @ts-expect-error Nonfinite envelopes have the established exact tag union.
float4Codec.encode({ nonfinite: "inf" });
// @ts-expect-error NULL requires explicit nullable completion.
float4Codec.encode(null);
const identity = createSqlFunction({
  schema: "fixture",
  name: "identity",
  member: "fixture:identity",
  arguments: [int2Codec, float4Codec] as const,
  result: nullableCodec(float4Codec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
const result: SQL<number | NonfiniteNumber | null> = identity(1, { nonfinite: "NaN" });
// @ts-expect-error Checked numeric expressions reject boolean operands.
identity(false, 1);
// @ts-expect-error Result precision and nonfinite shape come from the codec.
identity<number>(1, 1);
const record = compositeCodec("fixture:primitive", { small: nullableCodec(int2Codec), real: float4Codec });
const recordOutput: { readonly small: number | null; readonly real: number | NonfiniteNumber } =
  record.decode("(,0.1)");
const arrays: PostgreSqlArray<number | NonfiniteNumber> = arrayCodec(float4Codec).decode("{0.1,NaN,NULL}");
// @ts-expect-error int2 arrays retain the number contract.
arrayCodec(int2Codec).encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [1n] });
void [smallOutput, checkedOutput, result, recordOutput, arrays];
