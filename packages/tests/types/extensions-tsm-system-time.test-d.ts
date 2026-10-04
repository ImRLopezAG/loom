import { expectTypeOf, test } from "vite-plus/test";
import { integer, pgTable, pgView } from "drizzle-orm/pg-core";
import { sql, type SQL } from "drizzle-orm";
import { createTsmSystemTime_1_0 } from "kello/extensions/tsm-system-time";

const extension = createTsmSystemTime_1_0({
  name: "tsm_system_time",
  version: "1.0",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "70720316f9c0607be92e7948af63f27a96da580a8f492ce7a3a7d972b779af1f" },
});
const items = pgTable("items", { id: integer("id") });

test("tsm_system_time sampling is a relation source, not a scalar or seeded call", () => {
  expectTypeOf(extension.systemTime(items, 2.5)).toEqualTypeOf<SQL<unknown>>();
  expectTypeOf(extension.sampling.repeatable).toEqualTypeOf<false>();
  expectTypeOf(extension.sampling.observability).toEqualTypeOf<"external">();
  expectTypeOf(extension.sql.functions).toEqualTypeOf<Readonly<{}>>();
  // @ts-expect-error NULL is a native TABLESAMPLE error
  extension.systemTime(items, null);
  // @ts-expect-error SQL expressions are not admitted as sample arguments
  extension.systemTime(items, sql`1`);
  // @ts-expect-error REPEATABLE is unsupported natively, so no seed argument exists
  extension.systemTime(items, 2.5, 7);
  // @ts-expect-error views are rejected by native TABLESAMPLE
  extension.systemTime(pgView("v", { id: integer("id") }).existing(), 2.5);
});
