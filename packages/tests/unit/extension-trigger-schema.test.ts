import { expect, test } from "vite-plus/test";
import { defineSchema, bindSchemaNamespace } from "../../../apps/loom/src/core/schema/define-schema";
import { createAutoinc_1_0 } from "../../../apps/loom/src/core/extensions/adapters/autoinc";
import { createModdatetime_1_0 } from "../../../apps/loom/src/core/extensions/adapters/moddatetime";
import {
  createSnapshot,
  emptySnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { classifyMigration } from "../../../apps/loom/src/tooling/migrations/classifier";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { pgTable, integer } from "drizzle-orm/pg-core";
import { extensionTriggerContract } from "../../../apps/loom/src/core/extensions/triggers";
import { compareExtensionSchemaCompatibility } from "../../../apps/loom/src/tooling/migrations/extension-compatibility";
const schemaName = "triggers_app";
const extSchema = 'trig"ext';
const auto = createAutoinc_1_0({
  name: "autoinc",
  version: "1.0",
  schema: extSchema,
  apiSupport: { status: "verified", digest: "bcd5ce0898658378ee20de54d2ca173811612f5d2c41c14345ed3eb9473403ee" },
});
const touch = createModdatetime_1_0({
  name: "moddatetime",
  version: "1.0",
  schema: extSchema,
  apiSupport: { status: "verified", digest: "bfaa16ea149d74d0f9e6c5a74144a0240ad18e0e02098a5f39f462c942ca68b6" },
});
const selection = {
  autoinc: { version: "1.0", schema: extSchema },
  moddatetime: { version: "1.0", schema: extSchema },
} as const;
function declaration(withTriggers = true, events: readonly ["insert"] | readonly ["insert", "update"] = ["insert"]) {
  return defineSchema((f) => ({ tickets: { number: f.integer(), updated: f.timestamp() } }), {
    namespace: schemaName,
    triggers: (tables) =>
      withTriggers
        ? [
            auto.trigger({
              name: 'tickets"id',
              table: tables.tickets,
              events,
              columns: [{ column: tables.tickets.number, sequence: { schema: schemaName, name: "Ticket'seq" } }],
            }),
            touch.trigger({ name: "tickets touch", table: tables.tickets, column: tables.tickets.updated }),
          ]
        : [],
  });
}
test("extension triggers participate in schema requirements, namespace rebinding and deterministic snapshots", async () => {
  const schema = declaration();
  expect(schema.metadata.extensionRequirements?.map((x) => x.name).sort()).toEqual(["autoinc", "moddatetime"]);
  expect(() => buildRequiredApi(undefined, schema.metadata)).toThrow("Missing configured extension");
  expect(buildRequiredApi(selection, schema.metadata)?.apis).toHaveLength(2);
  const rebound = bindSchemaNamespace(schema, "component_app");
  expect(rebound.metadata.extensionTriggers?.map((x) => x.table.schema)).toEqual(["component_app", "component_app"]);
  const before = await emptySnapshot(schemaName);
  const after = await createSnapshot(schema);
  expect(after.extensionTriggers).toHaveLength(2);
  expect(snapshotHash(after)).not.toBe(snapshotHash(await createSnapshot(declaration(false))));
  expect(schema.fingerprint).not.toBe(declaration(false).fingerprint);
  const statements = await migrationStatements(before, after);
  expect(statements.filter((x) => x.startsWith("CREATE TRIGGER"))).toHaveLength(2);
  expect(statements.some((x) => x.includes('EXECUTE FUNCTION "trig""ext"."moddatetime"'))).toBe(true);
  expect(statements.findIndex((x) => x.startsWith("CREATE TRIGGER"))).toBeGreaterThan(
    statements.findLastIndex((x) => x.startsWith("CREATE TABLE")),
  );
  expect(await migrationStatements(after, await createSnapshot(declaration()))).toEqual([]);
});
test("trigger changes drop before structural DDL and create afterward, with explicit migration review", async () => {
  const before = await createSnapshot(declaration());
  const after = await createSnapshot(declaration(true, ["insert", "update"]));
  const statements = await migrationStatements(before, after);
  expect(statements).toHaveLength(2);
  expect(statements[0]).toBe('DROP TRIGGER "tickets""id" ON "triggers_app"."tickets"');
  expect(statements[1]).toContain("BEFORE INSERT OR UPDATE");
  const safety = await classifyMigration(before, after);
  expect(safety.automatic).toBe(false);
  expect(safety.issues.some((x) => x.reason === "review-required")).toBe(true);
  const removed = await createSnapshot(declaration(false));
  expect((await migrationStatements(after, removed)).filter((x) => x.startsWith("DROP TRIGGER"))).toHaveLength(2);
  expect((await classifyMigration(after, removed)).issues.some((x) => x.reason === "deletion")).toBe(true);
});
test("schema trigger declarations reject duplicate identities and tables outside the schema", () => {
  const foreign = pgTable("foreign", { number: integer() });
  expect(() =>
    defineSchema((f) => ({ tickets: { number: f.integer() } }), {
      triggers: () => [
        auto.trigger({
          name: "foreign",
          table: foreign,
          columns: [{ column: foreign.number, sequence: { name: "seq" } }],
        }),
      ],
    }),
  ).toThrow("outside this schema");
  expect(() =>
    defineSchema((f) => ({ tickets: { number: f.integer() } }), {
      triggers: (tables) => {
        const trigger = auto.trigger({
          name: "same",
          table: tables.tickets,
          columns: [{ column: tables.tickets.number, sequence: { name: "seq" } }],
        });
        return [trigger, trigger];
      },
    }),
  ).toThrow("Duplicate extension trigger");
});
test("trigger normalization rejects unsupported events before canonicalizing valid events", () => {
  const tables = declaration(false).tables;
  const trigger = auto.trigger({
    name: "events",
    table: tables.tickets,
    columns: [{ column: tables.tickets.number, sequence: { name: "seq" } }],
  });
  expect(extensionTriggerContract({ ...trigger, events: ["update", "insert", "update"] }).events).toEqual([
    "insert",
    "update",
  ]);
  expect(() =>
    extensionTriggerContract({
      ...trigger,
      // @ts-expect-error A JavaScript caller must not silently lose an unsupported event.
      events: ["insert", "truncate"],
    }),
  ).toThrow();
});
test("extension compatibility reports added, removed and changed trigger write behavior", () => {
  const absent = declaration(false).metadata;
  const before = declaration().metadata;
  const after = declaration(true, ["insert", "update"]).metadata;
  expect(compareExtensionSchemaCompatibility(before, declaration().metadata)).toEqual([]);
  expect(compareExtensionSchemaCompatibility(before, after)).toEqual([
    {
      entity: 'triggers_app.tickets.trigger[tickets"id]',
      compatible: false,
      reason: "Extension trigger contract changed",
    },
  ]);
  expect(compareExtensionSchemaCompatibility(absent, before)).toHaveLength(2);
  expect(compareExtensionSchemaCompatibility(before, absent)).toHaveLength(2);
});
