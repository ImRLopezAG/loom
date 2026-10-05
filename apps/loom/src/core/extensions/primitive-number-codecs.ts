import * as v from "valibot";
import { createExtensionCodec } from "./codecs";

const smallInteger = v.pipe(v.number(), v.integer(), v.minValue(-32768), v.maxValue(32767));

/** PostgreSQL int2 is exactly representable as a JavaScript number. */
export const int2Codec = createExtensionCodec({
  id: "pg:int2:1",
  sqlType: { schema: "pg_catalog", name: "int2" },
  input: smallInteger,
  output: smallInteger,
  transport: "native",
  encode: (value) => value,
  decode(value) {
    const representation = v.parse(v.union([v.number(), v.pipe(v.string(), v.regex(/^[+-]?\d+$/))]), value);
    return Number(representation);
  },
});

const finiteFloat4 = v.pipe(
  v.number(),
  v.finite(),
  v.check((value) => Number.isFinite(Math.fround(value)), "PostgreSQL float4 overflow"),
  v.check((value) => value === 0 || Math.fround(value) !== 0, "PostgreSQL float4 underflow"),
);
const nonfinite = v.object({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) });
const floatingValue = v.union([finiteFloat4, nonfinite]);
const float4Representation = v.union([
  v.number(),
  v.nan(),
  v.pipe(v.string(), v.regex(/^(?:NaN|-?Infinity|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)$/)),
]);

/**
 * Restore the stored single precision from the driver's shortest decimal output.
 * Numeric inputs round as JS numbers before binding, so PostgreSQL's decimal
 * parser cannot introduce a second rounding at a binary halfway value.
 */
export const float4Codec = createExtensionCodec({
  id: "pg:float4:1",
  sqlType: { schema: "pg_catalog", name: "float4" },
  input: floatingValue,
  output: floatingValue,
  transport: "native",
  encode: (value) => (v.is(v.number(), value) ? (Object.is(value, -0) ? "-0" : Math.fround(value)) : value.nonfinite),
  decode(value) {
    const representation = v.parse(float4Representation, value);
    if (representation === "NaN" || Number.isNaN(representation)) return { nonfinite: "NaN" };
    if (representation === "Infinity" || representation === Infinity) return { nonfinite: "Infinity" };
    if (representation === "-Infinity" || representation === -Infinity) return { nonfinite: "-Infinity" };
    const parsed = Number(representation);
    if (v.is(v.string(), representation) && parsed === 0 && /[1-9]/.test(representation.split(/[eE]/)[0]!))
      throw new Error("PostgreSQL float4 underflow");
    return Math.fround(v.parse(finiteFloat4, parsed));
  },
});
