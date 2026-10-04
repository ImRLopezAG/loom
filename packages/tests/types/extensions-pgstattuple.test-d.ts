import type { SQL } from "drizzle-orm";
import { pgTable, integer } from "drizzle-orm/pg-core";
import type { NonfiniteNumber } from "kello/extensions/pgstattuple";
import { createPgstattuple_1_5 } from "kello/extensions/pgstattuple";
import { createPgrowlocks_1_2, type PostgreSqlArray, type Tid } from "kello/extensions/pgrowlocks";

const table = pgTable("documents", { id: integer() });
const stat = createPgstattuple_1_5({
  name: "pgstattuple",
  version: "1.5",
  schema: "stats",
  apiSupport: { status: "verified", digest: "6dd83523499b827ca6ba17e3af232cf28a46dded5819afef113fd37ff3913aec" },
});
const locks = createPgrowlocks_1_2({
  name: "pgrowlocks",
  version: "1.2",
  schema: "stats",
  apiSupport: { status: "verified", digest: "d14f05ab2ddaedb3b915bc6cbead50da7c1880dcaf2bf37a1e192d1a4a336f61" },
});
const pages: SQL<bigint> = stat.relationPages(table);
const textPages: SQL<bigint> = stat.sql.functions.pg_relpages("public.documents");
const tuple = stat.tupleRows({ schema: "app", name: "documents" }, "t").columns;
const deadCount: SQL<bigint> = tuple.dead_tuple_count;
const freePercent: SQL<number | NonfiniteNumber> = tuple.free_percent;
const level: SQL<number> = stat.btreeIndexRows({ schema: "app", name: "i" }, "b").columns.tree_level;
const lock = locks.rows(table).columns;
const row: SQL<Tid> = lock.locked_row;
const pids: SQL<PostgreSqlArray<number>> = lock.pids;
// @ts-expect-error relation names must be schema-qualified objects or tables
stat.tuple({ name: "documents" });
// @ts-expect-error GIN statistics have no text overload
stat.sql.functions.pgstatginindex("app.g");
// @ts-expect-error no administrative or mutation members exist
void locks.sql.functions.reset;
void [pages, textPages, deadCount, freePercent, level, row, pids];
