import * as v from "valibot";
import { createExtensionCodec } from "../codecs";

// Text forms are PostgreSQL 18 output under the defaults captured on Neon: DateStyle ISO, IntervalStyle postgres
// and an en_US/C monetary locale. Other session styles fail closed; PostgreSQL alone parses and computes values.
const money = v.pipe(v.string(), v.regex(/^-?\d+(?:\.\d{1,2})?$/));
const moneyOutput = /^(-)?\$(\d{1,3}(?:,\d{3})*)\.(\d{2})$/;
/** Plain decimal money input; en_US/C output `-$1,234.56` decodes to `-1234.56` without float arithmetic. */
export const btreeGistMoneyCodec = createExtensionCodec({
  id: "pg:money:en-us:1",
  sqlType: { schema: "pg_catalog", name: "money" },
  input: money,
  output: money,
  transport: "text",
  encode: (value) => value,
  decode(value) {
    const match = moneyOutput.exec(v.parse(v.string(), value));
    if (!match) throw new Error("PostgreSQL money output requires an en_US or C lc_monetary session");
    return `${match[1] ?? ""}${match[2]!.replaceAll(",", "")}.${match[3]}`;
  },
});
const date = v.pipe(v.string(), v.regex(/^(?:-?infinity|\d{4,7}-\d{2}-\d{2}(?: BC)?)$/));
/** ISO DateStyle date text, including BC and infinities; PostgreSQL validates the calendar. */
export const btreeGistDateCodec = createExtensionCodec({
  id: "pg:date:iso:1",
  sqlType: { schema: "pg_catalog", name: "date" },
  input: date,
  output: date,
  transport: "text",
  encode: (value) => value,
  decode: (value) => value,
});
const time = v.pipe(v.string(), v.regex(/^\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?$/));
/** Time without time zone, including PostgreSQL's 24:00:00 upper bound. */
export const btreeGistTimeCodec = createExtensionCodec({
  id: "pg:time:1",
  sqlType: { schema: "pg_catalog", name: "time" },
  input: time,
  output: time,
  transport: "text",
  encode: (value) => value,
  decode: (value) => value,
});
const interval = v.pipe(
  v.string(),
  v.regex(
    /^(?:-?infinity|(?=[+\-\d])(?:[+-]?\d+ years?(?: |$))?(?:[+-]?\d+ mons?(?: |$))?(?:[+-]?\d+ days?(?: |$))?(?:[+-]?\d+:\d{2}:\d{2}(?:\.\d{1,6})?)?)$/,
  ),
  v.check((value) => !value.endsWith(" "), "Invalid PostgreSQL interval text"),
);
/** IntervalStyle postgres text; months, days and microseconds stay separate PostgreSQL fields. */
export const btreeGistIntervalCodec = createExtensionCodec({
  id: "pg:interval:postgres:1",
  sqlType: { schema: "pg_catalog", name: "interval" },
  input: interval,
  output: interval,
  transport: "text",
  encode: (value) => value,
  decode: (value) => value,
});
const oid = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295));
export const btreeGistOidCodec = createExtensionCodec({
  id: "pg:oid:unsigned32:1",
  sqlType: { schema: "pg_catalog", name: "oid" },
  input: oid,
  output: oid,
  transport: "text",
  encode: String,
  decode: (value) => (v.is(v.string(), value) ? Number(v.parse(v.pipe(v.string(), v.regex(/^\d+$/)), value)) : value),
});
