import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertUsername_1_0 } from "../../../apps/loom/src/core/extensions/adapters/insert-username";
const table = pgTable("posts", { author: text(), id: integer() });
const extension = createInsertUsername_1_0({
  name: "insert_username",
  version: "1.0",
  schema: "custom",
  apiSupport: { status: "verified", digest: "1e0649029c558b2e3000544c8066e51f12288377fd520226476740e7b0d25c32" },
});
const trigger = extension.trigger({ name: "user", table, column: table.author });
trigger.timing satisfies "before";
trigger.member satisfies "routine:$extension:insert_username.insert_username()";
// @ts-expect-error integer is not a string field
extension.trigger({ name: "bad", table, column: table.id });
// @ts-expect-error DELETE cannot call this callback
extension.trigger({ name: "bad", table, column: table.author, events: ["delete"] });
// @ts-expect-error trigger callbacks are not SQL scalars
void extension.sql.functions.insert_username;
