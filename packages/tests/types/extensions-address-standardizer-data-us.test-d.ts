import type { SQL } from "drizzle-orm";
import {
  createAddressStandardizerDataUs_3_6_4,
  ADDRESS_STANDARDIZER_DATA_US_DIGEST,
} from "../../../apps/loom/src/core/extensions/adapters/address-standardizer-data-us";
import {
  createAddressStandardizer_3_6_4,
  ADDRESS_STANDARDIZER_DIGEST,
} from "../../../apps/loom/src/core/extensions/adapters/address-standardizer";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
const api = createAddressStandardizerDataUs_3_6_4({
  name: "address_standardizer_data_us",
  version: "3.6.4",
  schema: "extensions",
  apiSupport: { status: "verified", digest: ADDRESS_STANDARDIZER_DATA_US_DIGEST },
});
const base = createAddressStandardizer_3_6_4({
  name: "address_standardizer",
  version: "3.6.4",
  schema: "extensions",
  apiSupport: { status: "verified", digest: ADDRESS_STANDARDIZER_DIGEST },
});
base.standardizeAddress(api.sources, "123 Main St", "Boston, MA 02139");
const id: SQL<number> = api.tables.us_lex.rows("lex").columns.id;
const word: SQL<string | null> = api.tables.us_gaz.rows("gaz").columns.word;
const seq: SQL<bigint> = api.sequences.us_rules_id_seq.rows("s").columns.last_value;
const bool: SQL<boolean> = api.sequences.us_rules_id_seq.rows("s").columns.is_called;
defineSchema(() => ({
  entries: {
    lex: api.tables.us_lex.field(),
    gaz: api.tables.us_gaz.arrayField(),
    rules: api.tables.us_rules.field(),
    rulesArray: api.tables.us_rules.arrayField(),
  },
}));
api.tables.us_lex.codec.encode({ id: null, seq: null, word: null, stdword: "", token: -2147483648, is_custom: null });
// @ts-expect-error Exact selected version only.
createAddressStandardizerDataUs_3_6_4({ ...api, version: "3.6.3" });
// @ts-expect-error int4 is a number; sequences alone use bigint.
api.tables.us_rules.codec.encode({ id: 1n, rule: "", is_custom: true });
// @ts-expect-error Dataset adapter does not implement native address algorithms.
api.normalizeAddress("123 Main St");
// @ts-expect-error Native primary keys are installation declarations, not request-time DDL.
api.createIndex("us_lex");
void [id, word, seq, bool];
