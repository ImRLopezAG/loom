import * as v from "valibot";
import {
  arrayCodec,
  compositeCodec,
  createExtensionCodec,
  nullableCodec,
  withCodecSqlType,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../codecs";
import { float4Codec } from "../primitive-number-codecs";
import { createHalfvecCodec, createVectorCodec, vectorLimits } from "../vector-codecs";

/** Native rabitq text/binary I/O is uncharacterized; values are opaque native text only. */
export type RabitqNativeText = {
  readonly kind: "native-text";
  readonly text: string;
};
const nativeText = v.pipe(
  v.strictObject({ kind: v.literal("native-text"), text: v.pipe(v.string(), v.minLength(1), v.maxLength(1_000_000)) }),
  v.check((value) => !value.text.includes("\0"), "Native rabitq text cannot contain NUL"),
);
export type RabitqKind = "rabitq4" | "rabitq8";

/** Brand a captured native rabitq text token; JavaScript arrays are not a quantization algorithm. */
export function rabitqNativeText(text: string): RabitqNativeText {
  return v.parse(nativeText, { kind: "native-text", text });
}

export function createRabitqCodec(schema: string, kind: RabitqKind, dimensions?: number) {
  const expected =
    dimensions === undefined
      ? undefined
      : v.parse(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(vectorLimits.vectorDimensions)), dimensions);
  return createExtensionCodec({
    id: `lakebase_vector:${kind}:native-text:1${expected === undefined ? "" : `:dimensions:${expected}`}`,
    sqlType: { schema, name: kind },
    input: nativeText,
    output: nativeText,
    transport: "text",
    encode: (value) => value.text,
    decode(value) {
      const parsed = v.parse(v.union([nativeText, v.string()]), value);
      return v.is(nativeText, parsed) ? parsed : rabitqNativeText(parsed);
    },
  });
}

export function createRabitqArrayCodec(schema: string, kind: RabitqKind, dimensions?: number) {
  return arrayCodec(createRabitqCodec(schema, kind, dimensions));
}

export function createSphereVectorCodec(schema: string, vectorSchema: string, dimensions?: number) {
  return withCodecSqlType(
    compositeCodec("lakebase_vector:sphere_vector:1", {
      center: nullableCodec(createVectorCodec(vectorSchema, dimensions)),
      radius: nullableCodec(float4Codec),
    }),
    { schema, name: "sphere_vector" },
  );
}
export function createSphereHalfvecCodec(schema: string, vectorSchema: string, dimensions?: number) {
  return withCodecSqlType(
    compositeCodec("lakebase_vector:sphere_halfvec:1", {
      center: nullableCodec(createHalfvecCodec(vectorSchema, dimensions)),
      radius: nullableCodec(float4Codec),
    }),
    { schema, name: "sphere_halfvec" },
  );
}
export function createSphereRabitqCodec(schema: string, kind: RabitqKind, dimensions?: number) {
  return withCodecSqlType(
    compositeCodec(`lakebase_vector:sphere_${kind}:1`, {
      center: nullableCodec(createRabitqCodec(schema, kind, dimensions)),
      radius: nullableCodec(float4Codec),
    }),
    { schema, name: `sphere_${kind}` },
  );
}

export type SphereVectorValue = {
  readonly center: readonly number[] | null;
  readonly radius: typeof float4Codec extends ExtensionCodec<infer Input, unknown> ? Input | null : never;
};
export type SphereRabitqValue = {
  readonly center: RabitqNativeText | null;
  readonly radius: SphereVectorValue["radius"];
};
export type { PostgreSqlArray };
