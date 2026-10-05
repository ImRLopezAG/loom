import { expect, test } from "bun:test";
import { defineRelations, sql } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createAutoinc_1_0 } from "../../../apps/loom/src/core/extensions/adapters/autoinc";
import { createModdatetime_1_0 } from "../../../apps/loom/src/core/extensions/adapters/moddatetime";
import { createInsertUsername_1_0 } from "../../../apps/loom/src/core/extensions/adapters/insert-username";
import { createRefint_1_0 } from "../../../apps/loom/src/core/extensions/adapters/refint";
import { createTcn_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tcn";
import { createLo_1_2 } from "../../../apps/loom/src/core/extensions/adapters/lo";
import { extensionTriggerContract } from "../../../apps/loom/src/core/extensions/triggers";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";

const namespace = "wave20_trigger_app";
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
const username = createInsertUsername_1_0({
  name: "insert_username",
  version: "1.0",
  schema: extSchema,
  apiSupport: { status: "verified", digest: "1e0649029c558b2e3000544c8066e51f12288377fd520226476740e7b0d25c32" },
});
const ref = createRefint_1_0({
  name: "refint",
  version: "1.0",
  schema: extSchema,
  apiSupport: { status: "verified", digest: "689cb4ce75e39aea52f0b19a522b1b35bb743a8fca286195e9fa98894fa49011" },
});
const tcn = createTcn_1_0({
  name: "tcn",
  version: "1.0",
  schema: extSchema,
  apiSupport: { status: "verified", digest: "9e2c3a247e11851d4d598bef9c62c5a7e26ba585089bce5d7a71e2c2db548a8a" },
});
const lo = createLo_1_2({
  name: "lo",
  version: "1.2",
  schema: extSchema,
  apiSupport: { status: "verified", digest: "84324b728d596a8bdef3088c411f769edab611e4a4a776070372f5e890d96ba1" },
});
function declaration() {
  return defineSchema(
    (f) => ({
      parents: { number: f.integer(), updated: f.timestamp(), username: f.text(), object: lo.field() },
      children: { key: f.integer() },
    }),
    {
      namespace,
      triggers: (tables) => [
        auto.trigger({
          name: "a_auto",
          table: tables.parents,
          columns: [{ column: tables.parents.number, sequence: { schema: extSchema, name: "numbers" } }],
        }),
        touch.trigger({ name: "b_touch", table: tables.parents, column: tables.parents.updated }),
        username.trigger({ name: 'c_user"name', table: tables.parents, column: tables.parents.username }),
        lo.trigger({ name: "d_lo", table: tables.parents, column: tables.parents.object }),
        tcn.trigger({ name: "e_tcn", table: tables.parents, events: ["insert", "update", "delete"] }),
        tcn.trigger({ name: "f_delete", table: tables.parents, events: ["delete"], channel: "changes" }),
        ref.checkPrimaryKey({
          name: "g_primary",
          table: tables.children,
          columns: [tables.children.key],
          references: { table: tables.parents, columns: [tables.parents.number] },
        }),
        ref.checkForeignKey({
          name: "h_foreign",
          table: tables.parents,
          columns: [tables.parents.number],
          action: "cascade",
          references: [{ table: tables.children, columns: [tables.children.key] }],
        }),
      ],
    },
  );
}
test("all six callback families roundtrip native timing, events, arguments and enabled state through migrations", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = declaration();
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(sql.raw(`CREATE SCHEMA "trig""ext"; CREATE SEQUENCE "trig""ext".numbers`));
      for (const name of ["autoinc", "moddatetime", "insert_username", "refint", "tcn", "lo"])
        await connection.db.execute(
          sql.raw(`CREATE EXTENSION ${name} WITH SCHEMA "trig""ext" VERSION '${name === "lo" ? "1.2" : "1.0"}'`),
        );
      const desired = await createSnapshot(schema);
      for (const statement of await migrationStatements(await emptySnapshot(namespace), desired))
        await connection.db.execute(sql.raw(statement));
      const observed = await inspectSnapshot(connection.db, namespace);
      expect(observed.extensionTriggers).toEqual(desired.extensionTriggers);
      expect(snapshotHash(observed)).toBe(snapshotHash(desired));
      expect(await migrationStatements(observed, desired)).toEqual([]);
      await connection.db.execute(sql.raw(`ALTER TABLE "${namespace}".parents DISABLE TRIGGER "f_delete"`));
      const disabled = await inspectSnapshot(connection.db, namespace);
      expect(disabled.extensionTriggers?.find((trigger) => trigger.name === "f_delete")?.enabled).toBe("disabled");
      const replacement = await migrationStatements(disabled, desired);
      await expect(
        connection.transaction(async (db) => {
          for (const statement of replacement) await db.execute(sql.raw(statement));
          expect((await inspectSnapshot(db, namespace)).extensionTriggers).toEqual(desired.extensionTriggers);
          throw new Error("callback migration rollback");
        }),
      ).rejects.toThrow("callback migration rollback");
      expect((await inspectSnapshot(connection.db, namespace)).extensionTriggers).toEqual(disabled.extensionTriggers);
      for (const statement of replacement) await connection.db.execute(sql.raw(statement));
      const declarations = schema.metadata.extensionTriggers!.map(extensionTriggerContract);
      expect(declarations).toHaveLength(8);
      expect(declarations.find((trigger) => trigger.name === "e_tcn")?.arguments).toEqual([]);
      expect(declarations.find((trigger) => trigger.name === "f_delete")?.events).toEqual(["delete"]);
      expect(await migrationStatements(await inspectSnapshot(connection.db, namespace), desired)).toEqual([]);
    } finally {
      await connection.close();
    }
  });
}, 90000);
