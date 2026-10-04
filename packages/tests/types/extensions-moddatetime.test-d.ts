import { integer, pgTable, timestamp } from "drizzle-orm/pg-core";
import { createModdatetime_1_0 } from "kello/extensions/moddatetime";

const table = pgTable("t", {
  at: timestamp({ withTimezone: true }),
  civil: timestamp({ mode: "string" }),
  count: integer(),
});
const extension = createModdatetime_1_0({
  name: "moddatetime",
  version: "1.0",
  schema: "custom",
  apiSupport: { status: "verified", digest: "bfaa16ea149d74d0f9e6c5a74144a0240ad18e0e02098a5f39f462c942ca68b6" },
});
const trigger = extension.trigger({ name: "touch", table, column: table.at });
trigger.events satisfies readonly ["update"];
trigger.member satisfies "routine:$extension:moddatetime.moddatetime()";
extension.trigger({ name: "touch2", table, column: table.civil });
// @ts-expect-error integer columns are not timestamps
extension.trigger({ name: "x", table, column: table.count });
// @ts-expect-error moddatetime has no configurable events
extension.trigger({ name: "x", table, column: table.at, events: ["insert"] });
// @ts-expect-error trigger callbacks are not scalar SQL helpers
void extension.sql.functions.moddatetime;
