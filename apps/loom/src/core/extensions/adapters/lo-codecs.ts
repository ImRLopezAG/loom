import * as v from "valibot";
import { createExtensionCodec } from "../codecs";

export const loOidValidator = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295));
/** lo is an unconstrained domain over oid, including zero; an OID alone never proves object existence. */
export const loOidCodec = createExtensionCodec({
  id: "pg:oid:unsigned32:1",
  sqlType: { schema: "pg_catalog", name: "oid" },
  input: loOidValidator,
  output: loOidValidator,
  transport: "text",
  encode: (value) => String(value),
  decode: (value) => (v.is(v.string(), value) ? Number(v.parse(v.pipe(v.string(), v.regex(/^\d+$/)), value)) : value),
});
