import * as v from "valibot";
import { arrayCodec, createExtensionCodec, decodeFailure, type PostgreSqlArray } from "./codecs";

const value = v.pipe(
  v.string(),
  v.check((value) => !value.includes("\0"), "PostgreSQL strings cannot contain NUL"),
  v.brand("Citext"),
);
export type Citext = v.InferOutput<typeof value>;
/** Preserve spelling. Comparison and case mapping belong to PostgreSQL's database locale. */
export const citext = (input: string): Citext => v.parse(value, input);
export function createCitextCodec(schema: string) {
  return createExtensionCodec({
    id: "citext:citext:case-preserving:1",
    sqlType: { schema, name: "citext" },
    input: v.string(),
    output: value,
    transport: "text",
    encode: (input) => citext(input),
    decode: (input) => input,
  });
}
/** Full native dimensions, lower bounds, nested values and NULL elements. */
export function createCitextArrayCodec(schema: string) {
  const array = arrayCodec(createCitextCodec(schema));
  const dimensions = v.pipe(
    v.array(
      v.strictObject({
        lowerBound: v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
        length: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647)),
      }),
    ),
    v.maxLength(6),
  );
  const bounds = (value: PostgreSqlArray<string>) => {
    const checked = v.parse(dimensions, value.dimensions);
    if (checked.some(({ lowerBound, length }) => lowerBound + length > 2147483647))
      throw new Error("PostgreSQL array upper bound overflow");
  };
  return Object.freeze({
    ...array,
    encode(value: PostgreSqlArray<string>) {
      bounds(value);
      return array.encode(value);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Driver array text is validated by the fixed native array codec.
    decode(value: unknown) {
      return decodeFailure(() => {
        const result = array.decode(value);
        bounds(result);
        return result;
      });
    },
  });
}

const bpcharValue = v.pipe(v.string(), v.brand("PgBpchar"));
const varcharValue = v.pipe(v.string(), v.brand("PgVarchar"));
const inetValue = v.pipe(v.string(), v.brand("PgInet"));
export const bpchar = (input: string) => v.parse(bpcharValue, input);
export const varchar = (input: string) => v.parse(varcharValue, input);
/** Syntax and canonical network output are PostgreSQL's; this constructor marks the requested SQL type. */
export const inet = (input: string) => v.parse(inetValue, input);
export const bpcharCodec = createExtensionCodec({
  id: "pg:bpchar:string:1",
  sqlType: { schema: "pg_catalog", name: "bpchar" },
  input: bpcharValue,
  output: bpcharValue,
  transport: "text",
  encode: (input) => input,
  decode: (input) => input,
});
export const varcharCodec = createExtensionCodec({
  id: "pg:varchar:string:1",
  sqlType: { schema: "pg_catalog", name: "varchar" },
  input: varcharValue,
  output: varcharValue,
  transport: "text",
  encode: (input) => input,
  decode: (input) => input,
});
export const inetCodec = createExtensionCodec({
  id: "pg:inet:string:1",
  sqlType: { schema: "pg_catalog", name: "inet" },
  input: inetValue,
  output: inetValue,
  transport: "text",
  encode: (input) => input,
  decode: (input) => input,
});
