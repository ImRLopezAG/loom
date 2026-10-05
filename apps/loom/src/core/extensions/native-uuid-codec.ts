import * as v from "valibot";
import { createExtensionCodec } from "./codecs";

// PostgreSQL stores all 128-bit UUID identities, including nil, maximum and non-RFC version/variant bits.
const uuid = v.pipe(
  v.string(),
  v.regex(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/),
  v.transform((value) => value.toLowerCase()),
);

/** Canonical hyphenated UUID input, case insensitive; native PostgreSQL output is lower case. */
export const uuidCodec = createExtensionCodec({
  id: "pg:uuid:1",
  sqlType: { schema: "pg_catalog", name: "uuid" },
  input: uuid,
  output: uuid,
  transport: "native",
  encode: (value) => value,
  decode: (value) => value,
});
