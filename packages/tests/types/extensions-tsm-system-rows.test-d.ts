import { expectTypeOf, test } from "vite-plus/test";
import { integer, pgTable, pgView } from "drizzle-orm/pg-core";
import { sql, type SQL } from "drizzle-orm";
import { createTsmSystemRows_1_0 } from "kello/extensions/tsm-system-rows";

const extension = createTsmSystemRows_1_0({
  name: "tsm_system_rows",
  version: "1.0",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "cb606ea0ec43b299ed4776aaeb12126165f751dbf9c5d40a974df6a8a7067eec" },
});
const items = pgTable("items", { id: integer("id") });

test("tsm_system_rows sampling is a relation source, not a scalar or seeded call", () => {
  expectTypeOf(extension.systemRows(items, 5)).toEqualTypeOf<SQL<unknown>>();
  expectTypeOf(extension.sampling.repeatable).toEqualTypeOf<false>();
  expectTypeOf(extension.sampling.observability).toEqualTypeOf<"external">();
  expectTypeOf(extension.sql.functions).toEqualTypeOf<Readonly<{}>>();
  // @ts-expect-error NULL is a native TABLESAMPLE error
  extension.systemRows(items, null);
  // @ts-expect-error SQL expressions are not admitted as sample arguments
  extension.systemRows(items, sql`1`);
  // @ts-expect-error REPEATABLE is unsupported natively, so no seed argument exists
  extension.systemRows(items, 5, 7);
  // @ts-expect-error views are rejected by native TABLESAMPLE
  extension.systemRows(pgView("v", { id: integer("id") }).existing(), 5);
});
