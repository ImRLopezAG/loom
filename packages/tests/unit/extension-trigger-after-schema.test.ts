import { expect, test } from "vite-plus/test";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createTcn_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tcn";
import { createExtensionTrigger, extensionTriggerContract } from "../../../apps/loom/src/core/extensions/triggers";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { compareExtensionSchemaCompatibility } from "../../../apps/loom/src/tooling/migrations/extension-compatibility";

const extension = createTcn_1_0({
  name: "tcn",
  version: "1.0",
  schema: "notifications",
  apiSupport: { status: "verified", digest: "9e2c3a247e11851d4d598bef9c62c5a7e26ba585089bce5d7a71e2c2db548a8a" },
});
function schema(events: readonly ["insert" | "update" | "delete", ...("insert" | "update" | "delete")[]]) {
  return defineSchema((fields) => ({ records: { text: fields.text() } }), {
    namespace: "after_triggers",
    triggers: (tables) => [extension.trigger({ name: 'changed"row', table: tables.records, events })],
  });
}
test("AFTER row declarations retain DELETE and canonicalize all three native events", () => {
  const declaration = schema(["delete", "update", "insert", "delete"]).metadata.extensionTriggers![0]!;
  expect(declaration.timing).toBe("after");
  expect(declaration.events).toEqual(["insert", "update", "delete"]);
  expect(createExtensionTrigger(declaration)).toEqual([
    'CREATE TRIGGER "changed""row" AFTER INSERT OR UPDATE OR DELETE ON "after_triggers"."records" FOR EACH ROW EXECUTE FUNCTION "notifications"."triggered_change_notification"()',
  ]);
  expect(() =>
    extensionTriggerContract({
      ...declaration,
      // @ts-expect-error TRUNCATE is outside these row callback contracts.
      events: ["truncate"],
    }),
  ).toThrow();
});
test("snapshot and migration SQL preserve AFTER DELETE instead of recreating a BEFORE trigger", async () => {
  const selected = schema(["delete"]);
  const snapshot = await createSnapshot(selected);
  const statements = await migrationStatements(await emptySnapshot("after_triggers"), snapshot);
  expect(statements.filter((statement) => statement.startsWith("CREATE TRIGGER"))).toEqual([
    'CREATE TRIGGER "changed""row" AFTER DELETE ON "after_triggers"."records" FOR EACH ROW EXECUTE FUNCTION "notifications"."triggered_change_notification"()',
  ]);
  expect(compareExtensionSchemaCompatibility(selected.metadata, schema(["update", "delete"]).metadata)).toEqual([
    {
      entity: 'after_triggers.records.trigger[changed"row]',
      compatible: false,
      reason: "Extension trigger contract changed",
    },
  ]);
});
