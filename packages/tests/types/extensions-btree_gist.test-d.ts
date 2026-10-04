import { createBtreeGist_1_8 } from "../../../apps/loom/src/core/extensions/adapters/btree_gist";
import type { ExtensionIndexContract } from "../../../apps/loom/src/core/extensions/fields";
import { timestamp, timestamptz } from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import type { SQL } from "drizzle-orm";

const api = createBtreeGist_1_8({
  name: "btree_gist",
  version: "1.8",
  schema: 'Custom"gist',
  apiSupport: { status: "verified", digest: "73fdb4831683ee8042ecbcd0d0639909650d018d6c7ca51bb85c1cb38de96072" },
});
const version: "1.8" = api.version;
const schema: 'Custom"gist' = api.schema;
const name: "btree_gist" = api.name;
const classes: readonly ExtensionIndexContract[] = Object.values(api.indexes).map((declare) => declare());
const indexMethod: "gist" = api.indexes.int4().method;
const indexClass: "gist_cash_ops" = api.indexes.money().opclass;
const enumInput: "anyenum" = api.indexes.enum().input.type;
const varbitClass: "gist_vbit_ops" = api.indexes.varbit().opclass;
const indexSchema: 'Custom"gist' = api.indexes.uuid().schema;
defineSchema(
  (fields) => ({
    entries: defineTable(
      { code: fields.integer(), label: fields.text() },
      {
        indexes: [
          { fields: ["code"], extension: api.indexes.int4() },
          { fields: ["label"], extension: api.indexes.text() },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
const money: SQL<string | null> = api.distance.money("1.50", "-3");
const date: SQL<number | null> = api.sql.functions.date_dist("2000-01-01", "4713-01-01 BC");
const float4: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.distance.float4(1.5, {
  nonfinite: "NaN",
});
const int8: SQL<bigint | null> = api.sql.functions.int8_dist(9007199254740993n, null);
const oid: SQL<number | null> = api.sql.operators["<->(oid,oid)"](1, 4294967295);
const interval: SQL<string | null> = api.distance.time("01:00:00", "24:00:00");
const ts: SQL<string | null> = api.sql.functions.ts_dist(timestamp("2000-01-01 00:00:00"), null);
const tstz: SQL<string | null> = api.distance.timestamptz(timestamptz("2000-01-01 00:00:00+00"), null);
const cmptype: SQL<number | null> = api.sql.functions.gist_translate_cmptype_btree(3);
api.sql.overloads["routine:$extension:btree_gist.cash_dist(pg_catalog.money,pg_catalog.money)"]("1", "2");
api.sql.overloads["operator:$extension:btree_gist.<->(pg_catalog.interval,pg_catalog.interval)"]("1 day", "-02:00:00");
// @ts-expect-error Exact int8 values cannot be JavaScript numbers.
api.sql.functions.int8_dist(1, 2n);
// @ts-expect-error Money is exact decimal text, not a float.
api.distance.money(1.5, "2");
// @ts-expect-error Timestamps require the checked native constructor value.
api.sql.functions.ts_dist("2000-01-01", null);
// @ts-expect-error Distances accept only the same native type on both sides.
api.distance.int4(1, "2");
// @ts-expect-error Uncaptured distance types are absent.
api.distance.numeric("1", "2");
// @ts-expect-error Native-pointer GiST support routines are absent from SQL bindings.
api.sql.functions.gbt_int4_consistent(null, null);
// @ts-expect-error Uncaptured classes cannot be selected.
api.indexes.jsonb();
// @ts-expect-error Class declarations take no scalar arguments.
api.indexes.int4(42);
// @ts-expect-error Administrative surfaces are not part of the query binding.
api.reindex();
createBtreeGist_1_8({
  name: "btree_gist",
  // @ts-expect-error Only the exact captured version is admitted.
  version: "1.7",
  schema: "extensions",
  apiSupport: { status: "verified" },
});
createBtreeGist_1_8({
  // @ts-expect-error A different extension cannot use the factory.
  name: "btree_gin",
  version: "1.8",
  schema: "extensions",
  apiSupport: { status: "verified" },
});
void [
  version, schema, name, classes, indexMethod, indexClass, enumInput, varbitClass, indexSchema,
  money, date, float4, int8, oid, interval, ts, tstz, cmptype,
];
// @ts-expect-error Money distance decodes exact text, not bigint.
const wrongMoney: SQL<bigint | null> = api.distance.money("1", "2");
// @ts-expect-error date_dist decodes an int4 day count, not text.
const wrongDate: SQL<string | null> = api.sql.functions.date_dist("2000-01-01", "2000-01-02");
// @ts-expect-error Interval results stay PostgreSQL text, not numbers.
const wrongInterval: SQL<number | null> = api.distance.timestamp(timestamp("2000-01-01 00:00:00"), null);
void [wrongMoney, wrongDate, wrongInterval];
