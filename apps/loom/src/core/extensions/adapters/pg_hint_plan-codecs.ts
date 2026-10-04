import * as v from "valibot";
import {
  arrayCodec,
  compositeCodec,
  createExtensionCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  type CompositeOutput,
} from "../codecs";

const int4 = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
const int4Wire = v.union([int4, v.pipe(v.string(), v.regex(/^-?\d+$/), v.transform(Number), int4)]);
const int4Codec = createExtensionCodec({
  id: "pg:int4:1",
  sqlType: { schema: "pg_catalog", name: "int4" },
  input: int4,
  output: int4,
  transport: "text",
  encode: String,
  // Composite text yields strings; the node-postgres runtime parses int4 columns to numbers.
  decode: (value) => v.parse(int4Wire, value),
});

/** Exact captured hint_plan.hints column order. Table columns are NOT NULL; '' application_name matches every application. */
export const pgHintPlanHintFields = Object.freeze({
  id: int4Codec,
  query_id: integerCodec,
  application_name: textCodec,
  hints: textCodec,
});
/** Composite values built in SQL (ROW(...)::hint_plan.hints) do not enforce the table's NOT NULL constraints. */
export const pgHintPlanCompositeFields = Object.freeze({
  id: nullableCodec(int4Codec),
  query_id: nullableCodec(integerCodec),
  application_name: nullableCodec(textCodec),
  hints: nullableCodec(textCodec),
});
export const pgHintPlanHintCodec = compositeCodec("pg_hint_plan:1.8.0:hints-row", pgHintPlanHintFields);
export const pgHintPlanCompositeCodec = compositeCodec("pg_hint_plan:1.8.0:hints", pgHintPlanCompositeFields);
export const pgHintPlanHintArrayCodec = arrayCodec(pgHintPlanCompositeCodec);
export type PgHintPlanHint = CompositeOutput<typeof pgHintPlanHintFields>;
export type PgHintPlanComposite = CompositeOutput<typeof pgHintPlanCompositeFields>;
