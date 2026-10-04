import { sql, type SQL } from "drizzle-orm";
import {
  createAddressStandardizer_3_6_4,
  type AddressStandardizerParse,
  type AddressStandardizerStdaddr,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/address-standardizer";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { ADDRESS_STANDARDIZER_DIGEST } from "../../e2e/fixtures/address-standardizer-proof-cases";

const api = createAddressStandardizer_3_6_4({
  name: "address_standardizer",
  version: "3.6.4",
  schema: 'Addr"日本',
  apiSupport: { status: "verified", digest: ADDRESS_STANDARDIZER_DIGEST },
});
const fieldSchema = defineSchema(() => ({
  entries: { value: api.field(), tags: api.arrayField() },
}));
const sources = {
  lex: { schema: "lex_schema", name: "us_lex" },
  gaz: { schema: "lex_schema", name: "us_gaz" },
  rules: { schema: "lex_schema", name: "us_rules" },
} as const;
const searchPath = { lex: { name: "us_lex" }, gaz: { name: "us_gaz" }, rules: { name: "us_rules" } } as const;
const address: AddressStandardizerStdaddr = {
  building: null,
  house_num: "123",
  predir: null,
  qual: null,
  pretype: null,
  name: "MAIN",
  suftype: "ST",
  sufdir: null,
  ruralroute: null,
  extra: null,
  city: "BOSTON",
  state: "MA",
  country: "USA",
  postcode: "02139",
  box: null,
  unit: null,
};
const parsed: SQL<AddressStandardizerParse | null> = api.parseAddress("123 Main St");
const four: SQL<AddressStandardizerStdaddr | null> = api.standardizeAddress(sources, "123 Main St");
const five: SQL<AddressStandardizerStdaddr | null> = api.standardizeAddress(
  sources,
  "123 Main St",
  "Boston, MA 02139",
);
const search: SQL<AddressStandardizerStdaddr | null> = api.standardizeAddress(searchPath, "123 Main St");
const debug: SQL<string | null> = api.debugStandardizeAddress(sources, "123 Main St");
const debugMacro: SQL<string | null> = api.debugStandardizeAddress(sources, "123 Main St", "Boston, MA");
const stored = fieldSchema.tables.entries.value;
const array: PostgreSqlArray<AddressStandardizerStdaddr> = {
  dimensions: [{ lowerBound: 1, length: 1 }],
  values: [address],
};
api.arrayCodec.encode(array);
api.codec.encode(address);
const rawFour: SQL<AddressStandardizerStdaddr | null> = api.sql.functions.standardize_address(
  "us_lex",
  "us_gaz",
  "us_rules",
  "123 Main St",
);
const rawFive: SQL<AddressStandardizerStdaddr | null> = api.sql.functions.standardize_address(
  "us_lex",
  "us_gaz",
  "us_rules",
  "123 Main St",
  "Boston, MA",
);
// @ts-expect-error Wrong selected version is rejected statically.
createAddressStandardizer_3_6_4({ ...api, version: "3.6.3" });
// @ts-expect-error A caller cannot select a result type.
api.standardizeAddress<string>(sources, "123 Main St");
// @ts-expect-error Raw SQL text is never a typed lex/gaz/rules source.
api.standardizeAddress("us_lex", "123 Main St");
// @ts-expect-error Micro/macro addresses stay text; stdaddr is never an input to standardize_address.
api.standardizeAddress(sources, address);
// @ts-expect-error parse_address takes text, not a composite.
api.parseAddress(address);
// @ts-expect-error There is no JavaScript address normalizer.
api.normalizeAddress("123 Main St");
void [parsed, four, five, search, debug, debugMacro, stored, rawFour, rawFive, sql`true`];
