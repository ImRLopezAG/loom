import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createRefint_1_0 } from "../../../apps/loom/src/core/extensions/adapters/refint";
const parent = pgTable("parent", { id: integer().primaryKey(), scope: text() });
const child = pgTable("child", { id: integer(), scope: text() });
const extension = createRefint_1_0({
  name: "refint",
  version: "1.0",
  schema: "custom",
  apiSupport: { status: "verified", digest: "689cb4ce75e39aea52f0b19a522b1b35bb743a8fca286195e9fa98894fa49011" },
});
const trigger = extension.checkPrimaryKey({
  name: "fk",
  table: child,
  columns: [child.id, child.scope],
  references: { table: parent, columns: [parent.id, parent.scope] },
});
trigger.timing satisfies "after";
trigger.member satisfies "routine:$extension:refint.check_primary_key()";
extension.checkForeignKey({
  name: "pk",
  table: parent,
  columns: [parent.id],
  references: [{ table: child, columns: [child.id] }],
  action: "cascade",
});
extension.checkPrimaryKey({
  name: "bad",
  table: child,
  columns: [child.id],
  // @ts-expect-error key data types are incompatible
  references: { table: parent, columns: [parent.scope] },
});
extension.checkPrimaryKey({
  name: "bad",
  table: child,
  columns: [child.id, child.scope],
  // @ts-expect-error key tuple lengths must match
  references: { table: parent, columns: [parent.id] },
});
extension.checkForeignKey({
  name: "bad",
  table: parent,
  columns: [parent.id],
  references: [{ table: child, columns: [child.id] }],
  action: "restrict",
  // @ts-expect-error INSERT cannot check references to an old primary key
  events: ["insert"],
});
extension.checkForeignKey({
  name: "bad",
  table: parent,
  columns: [parent.id],
  references: [{ table: child, columns: [child.id] }],
  // @ts-expect-error delete action is not a native refint action
  action: "delete",
});
// @ts-expect-error trigger callbacks are not SQL scalars
void extension.sql.functions.check_primary_key;
