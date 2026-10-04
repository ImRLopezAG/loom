import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createAutoinc_1_0 } from "kello/extensions/autoinc";

const table = pgTable("t", { id: integer(), alt: serial(), title: text() });
const extension = createAutoinc_1_0({
  name: "autoinc",
  version: "1.0",
  schema: "custom",
  apiSupport: { status: "verified", digest: "bcd5ce0898658378ee20de54d2ca173811612f5d2c41c14345ed3eb9473403ee" },
});
const trigger = extension.trigger({
  name: "t_id",
  table,
  events: ["insert", "update"],
  columns: [
    { column: table.id, sequence: { name: "s" } },
    { column: table.alt, sequence: { schema: "x", name: "s2" } },
  ],
});
trigger.kind satisfies "trigger";
trigger.timing satisfies "before";
trigger.member satisfies "routine:$extension:autoinc.autoinc()";
trigger.create satisfies string;
extension.function.authority satisfies "schema";
// @ts-expect-error text columns are not int4
extension.trigger({ name: "x", table, columns: [{ column: table.title, sequence: { name: "s" } }] });
// @ts-expect-error at least one column pair is required
extension.trigger({ name: "x", table, columns: [] });
// @ts-expect-error delete is not an autoinc event
extension.trigger({ name: "x", table, events: ["delete"], columns: [{ column: table.id, sequence: { name: "s" } }] });
// @ts-expect-error trigger callbacks are not scalar SQL helpers
void extension.sql.functions.autoinc;
// @ts-expect-error wrong family version
createAutoinc_1_0({ name: "autoinc", version: "1.1", schema: "x", apiSupport: { status: "verified" } });
