import { expect } from "vite-plus/test";
import { integer, pgSchema, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { createTcn_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tcn";
import { tcnAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/tcn";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/tcn.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { tcnUnitCase } from "../../e2e/fixtures/tcn-proof-cases";

extensionProofUnitTest(tcnUnitCase, () => {
  const descriptor = {
    name: "tcn",
    version: "1.0",
    schema: 'trig"ext',
    apiSupport: { status: "verified", digest: manifest.digest },
  } as const;
  const extension = createTcn_1_0(descriptor);
  expect(() => createTcn_1_0({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow();
  expect(() => createTcn_1_0({ ...descriptor, apiSupport: { status: "verified", digest: "0" } })).toThrow();
  const table = pgSchema('app"s').table("Posts", { key: integer().primaryKey() });
  const trigger = extension.trigger({ name: 'posts"notify', table, channel: "Change'\\s" });
  expect(trigger).toMatchObject({
    timing: "after",
    level: "row",
    events: ["insert", "update", "delete"],
    arguments: ["Change'\\s"],
  });
  expect(trigger.create).toBe(
    `CREATE TRIGGER "posts""notify" AFTER INSERT OR UPDATE OR DELETE ON "app""s"."Posts" FOR EACH ROW EXECUTE FUNCTION "trig""ext"."triggered_change_notification"(E'Change''\\\\s')`,
  );
  expect(extension.trigger({ name: "p", table }).create).toContain('triggered_change_notification"()');
  expect(extension.trigger({ name: "p", table, events: ["delete", "delete", "update"] }).events).toEqual([
    "update",
    "delete",
  ]);
  const composite = pgTable("composite", { a: integer(), b: text() }, (t) => [primaryKey({ columns: [t.a, t.b] })]);
  expect(extension.trigger({ name: "c", table: composite }).arguments).toEqual([]);
  const missing = pgTable("missing", { id: integer() });
  expect(() => extension.trigger({ name: "p", table: missing })).toThrow("primary key");
  expect(() => extension.trigger({ name: "p", table, channel: "" })).toThrow();
  expect(() => extension.trigger({ name: "p", table, channel: "é".repeat(32) })).toThrow();
  // @ts-expect-error statement events are unsupported
  expect(() => extension.trigger({ name: "p", table, events: ["truncate"] })).toThrow();
  expect(extension.notifications).toEqual({
    authority: "dedicated-session",
    observability: "session",
    automaticLive: false,
  });
  expect(extension.sql.functions).toEqual({});
  expect(tcnAnnotations.map((entry) => entry.id)).toEqual(manifest.contract.members.map((entry) => entry.id));
});
