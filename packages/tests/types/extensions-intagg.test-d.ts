import type { SQL } from "drizzle-orm";
import { integer, pgTable } from "drizzle-orm/pg-core";
import { createIntagg_1_1, int4NativeArray, type PostgreSqlArray } from "kello/extensions/intagg";

const descriptor = {
  name: "intagg",
  version: "1.1",
  schema: 'int"agg',
  apiSupport: { status: "verified", digest: "7e9c80504c50e5a1910b61667a1774d8c1976c676c087c23fd744168986311f1" },
} as const;
const api = createIntagg_1_1(descriptor);
const rows = pgTable("numbers", { value: integer().notNull(), nullable: integer() });
const aggregated: SQL<PostgreSqlArray<number> | null> = api.intArrayAggregate(rows.value);
const nullableAggregate: SQL<PostgreSqlArray<number> | null> = api.intArrayAggregate(rows.nullable);
const enumerated: SQL<number | null> = api.intArrayEnum(int4NativeArray([1, null, 2]));
const schema: 'int"agg' = api.schema;
const version: "1.1" = api.version;
// @ts-expect-error Exact factory only accepts 1.1.
createIntagg_1_1({ ...descriptor, version: "1.0" });
// @ts-expect-error Boolean columns are not int4.
api.intArrayAggregate(true);
// @ts-expect-error Transition internals are not application SQL.
api.sql.functions.int_agg_state(null, 1);
// @ts-expect-error Final internals are not application SQL.
api.sql.functions.int_agg_final_array(null);
// @ts-expect-error No caller-selected result generic.
api.intArrayAggregate<string[]>(1);
// @ts-expect-error Collapsed number[] is not the native array contract.
api.intArrayEnum([1, 2, 3]);
void [aggregated, nullableAggregate, enumerated, schema, version];
