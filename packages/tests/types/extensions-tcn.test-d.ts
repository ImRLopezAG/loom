import { integer, pgTable } from "drizzle-orm/pg-core";
import { createTcn_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tcn";
import { withTcnNotifications, type TcnNotificationSession } from "../../../apps/loom/src/tooling/extensions/tcn";
const table = pgTable("posts", { id: integer().primaryKey() });
const extension = createTcn_1_0({
  name: "tcn",
  version: "1.0",
  schema: "custom",
  apiSupport: { status: "verified", digest: "9e2c3a247e11851d4d598bef9c62c5a7e26ba585089bce5d7a71e2c2db548a8a" },
});
const trigger = extension.trigger({ name: "notify", table, events: ["insert", "update", "delete"] });
trigger.timing satisfies "after";
extension.notifications.automaticLive satisfies false;
// @ts-expect-error callback cannot fire for TRUNCATE
extension.trigger({ name: "bad", table, events: ["truncate"] });
// @ts-expect-error trigger callbacks are not SQL scalars
void extension.sql.functions.triggered_change_notification;
async function receive(session: TcnNotificationSession) {
  session.automaticLive satisfies false;
  const message = await session.next();
  message.operation satisfies "insert" | "update" | "delete";
  message.keys[0]?.value satisfies string | undefined;
  // @ts-expect-error dedicated session exposes no arbitrary SQL execution
  void session.query;
  return message;
}
void receive;
// @ts-expect-error connection and scope require explicit options/callback
void withTcnNotifications("postgres://operator/db");
