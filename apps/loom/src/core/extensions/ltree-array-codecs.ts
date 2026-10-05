import * as v from "valibot";
import { arrayCodec, decodeFailure, type ExtensionCodec, type PostgreSqlArray } from "./codecs";
import { createLtreeCodec } from "./ltree-codec";
import { createLqueryCodec, createLtxtqueryCodec } from "./ltree-query-codecs";

const dimensions = v.pipe(
  v.array(
    v.strictObject({
      lowerBound: v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
      length: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647)),
    }),
  ),
  v.maxLength(6),
);
const representation = v.strictObject({ dimensions, values: v.array(v.unknown()) });

function checkArray(input: PostgreSqlArray<string>): void {
  const checked = v.parse(representation, input);
  if (checked.dimensions.some(({ lowerBound, length }) => lowerBound + length > 2147483647))
    throw new Error("PostgreSQL array upper bound overflow");
  if (checked.dimensions.length === 0) {
    if (checked.values.length !== 0) throw new Error("Empty Ltree arrays require no values or dimensions");
    return;
  }
  const checkValues = (entries: readonly unknown[], depth: number): void => {
    const dimension = checked.dimensions[depth]!;
    if (entries.length !== dimension.length) throw new Error("Invalid Ltree array cardinality");
    for (const entry of entries) {
      if (depth + 1 < checked.dimensions.length) checkValues(v.parse(v.array(v.unknown()), entry), depth + 1);
      else if (entry !== null) v.parse(v.string(), entry);
    }
  };
  checkValues(checked.values, 0);
}

function nativeArray<Output extends string>(element: ExtensionCodec<string, Output>) {
  const array = arrayCodec(element);
  const codec: ExtensionCodec<PostgreSqlArray<string>, PostgreSqlArray<Output>> = {
    ...array,
    id: `ltree:array:int32:1:${element.id}`,
    sqlType: array.sqlType && Object.freeze({ ...array.sqlType }),
    encode(input) {
      checkArray(input);
      return array.encode(input);
    },
    decode(input) {
      return decodeFailure(() => {
        const output = array.decode(input);
        checkArray(output);
        return output;
      });
    },
  };
  return Object.freeze(codec);
}

/** Native ranks 0-6, signed lower bounds and nullable path leaves; PostgreSQL owns path grammar. */
export const createLtreeArrayCodec = (schema: string) => nativeArray(createLtreeCodec(schema));
/** Preserve native query arrays, including multidimensional storage; operators have narrower backend limits. */
export const createLqueryArrayCodec = (schema: string) => nativeArray(createLqueryCodec(schema));
/** Native text-query arrays with fixed decoded brands and backend canonical text. */
export const createLtxtqueryArrayCodec = (schema: string) => nativeArray(createLtxtqueryCodec(schema));
