import { expect } from "vite-plus/test";
import { integer, pgSchema, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertUsername_1_0 } from "../../../apps/loom/src/core/extensions/adapters/insert-username";
import { insertUsernameAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/insert-username";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/insert_username.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { insertUsernameUnitCase } from "../../e2e/fixtures/insert-username-proof-cases";

extensionProofUnitTest(insertUsernameUnitCase, () => {
  const descriptor = {
    name: "insert_username",
    version: "1.0",
    schema: 'trig"ext',
    apiSupport: { status: "verified", digest: manifest.digest },
  } as const;
  const extension = createInsertUsername_1_0(descriptor);
  expect(() => createInsertUsername_1_0({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow();
  expect(() => createInsertUsername_1_0({ ...descriptor, apiSupport: { status: "verified", digest: "0" } })).toThrow();
  const table = pgSchema('app"s').table("Posts", { author: text("Author'Name"), id: integer(), narrow: varchar() });
  const trigger = extension.trigger({ name: 'stamp"user', table, column: table.author });
  expect(trigger).toMatchObject({
    kind: "trigger",
    timing: "before",
    level: "row",
    events: ["insert", "update"],
    member: manifest.contract.members[0]!.id,
    arguments: ["Author'Name"],
  });
  expect(trigger.create).toBe(
    `CREATE TRIGGER "stamp""user" BEFORE INSERT OR UPDATE ON "app""s"."Posts" FOR EACH ROW EXECUTE FUNCTION "trig""ext"."insert_username"('Author''Name')`,
  );
  expect(trigger.drop).toBe(`DROP TRIGGER "stamp""user" ON "app""s"."Posts"`);
  expect(extension.trigger({ name: "i", table, column: table.author, events: ["insert", "insert"] }).events).toEqual([
    "insert",
  ]);
  const other = pgTable("other", { author: text() });
  expect(() => extension.trigger({ name: "x", table, column: other.author })).toThrow("belong to the trigger table");
  expect(() => extension.trigger({ name: "x", table, column: table.narrow })).toThrow("must be text");
  // @ts-expect-error integer has no text data contract
  expect(() => extension.trigger({ name: "x", table, column: table.id })).toThrow("must be text");
  // @ts-expect-error native callbacks reject DELETE
  expect(() => extension.trigger({ name: "x", table, column: table.author, events: ["delete"] })).toThrow();
  // @ts-expect-error nonempty event list is required
  expect(() => extension.trigger({ name: "x", table, column: table.author, events: [] })).toThrow();
  expect(() => extension.trigger({ name: "x".repeat(64), table, column: table.author })).toThrow();
  expect(extension.sql.functions).toEqual({});
  expect(Object.isFrozen(trigger.arguments)).toBe(true);
  expect(insertUsernameAnnotations.map((entry) => entry.id)).toEqual(
    manifest.contract.members.map((entry) => entry.id),
  );
});
