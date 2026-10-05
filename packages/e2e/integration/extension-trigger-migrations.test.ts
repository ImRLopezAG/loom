import { expect, test } from "bun:test";
import { sql, defineRelations } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createAutoinc_1_0 } from "../../../apps/loom/src/core/extensions/adapters/autoinc";
import { createModdatetime_1_0 } from "../../../apps/loom/src/core/extensions/adapters/moddatetime";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import {
  createSnapshot,
  inspectSnapshot,
  emptySnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";
const namespace = "trigger_app";
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
function declaration(withTriggers = true, events: readonly ["insert"] | readonly ["insert", "update"] = ["insert"]) {
  return defineSchema((f) => ({ tickets: { number: f.integer(), updated: f.timestamp() } }), {
    namespace,
    triggers: (tables) =>
      withTriggers
        ? [
            auto.trigger({
              name: 'number"auto',
              table: tables.tickets,
              events,
              columns: [{ column: tables.tickets.number, sequence: { schema: extSchema, name: "Ticket\\'seq" } }],
            }),
            touch.trigger({ name: "updated touch", table: tables.tickets, column: tables.tickets.updated }),
          ]
        : [],
  });
}
test("extension triggers survive native migration inspection, replacement, rollback and removal", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = declaration();
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(
        sql.raw(
          `CREATE SCHEMA "trig""ext"; CREATE EXTENSION autoinc WITH SCHEMA "trig""ext" VERSION '1.0'; CREATE EXTENSION moddatetime WITH SCHEMA "trig""ext" VERSION '1.0'`,
        ),
      );
      const desired = await createSnapshot(schema);
      const initial = await migrationStatements(await emptySnapshot(namespace), desired);
      await connection.transaction(async (db) => {
        await db.execute(sql.raw("SET LOCAL standard_conforming_strings=off"));
        for (const statement of initial) {
          // Sequence provisioning is explicit, just as it is for the standalone callback declaration.
          if (statement.startsWith('CREATE TRIGGER "number'))
            await db.execute(sql.raw(`CREATE SEQUENCE "trig""ext"."Ticket\\'seq"`));
          await db.execute(sql.raw(statement));
        }
      });
      const observed = await inspectSnapshot(connection.db, namespace);
      expect(observed.extensionTriggers).toEqual(desired.extensionTriggers);
      expect(snapshotHash(observed)).toBe(snapshotHash(desired));
      expect(await migrationStatements(observed, desired)).toEqual([]);
      const inserted = await connection.transaction((db) =>
        db.insert(schema.tables.tickets).values({ number: null }).returning({
          id: schema.tables.tickets._id,
          number: schema.tables.tickets.number,
          updated: schema.tables.tickets.updated,
        }),
      );
      expect(inserted[0]?.number).toBe(1);
      expect(inserted[0]?.updated).toBeNull();
      const changed = await createSnapshot(declaration(true, ["insert", "update"]));
      const replace = await migrationStatements(observed, changed);
      expect(replace).toHaveLength(2);
      await expect(
        connection.transaction(async (db) => {
          for (const statement of replace) await db.execute(sql.raw(statement));
          expect((await inspectSnapshot(db, namespace)).extensionTriggers).toEqual(changed.extensionTriggers);
          throw new Error("trigger rollback");
        }),
      ).rejects.toThrow("trigger rollback");
      expect((await inspectSnapshot(connection.db, namespace)).extensionTriggers).toEqual(desired.extensionTriggers);
      for (const statement of replace) await connection.db.execute(sql.raw(statement));
      await connection.db.execute(sql.raw('UPDATE "trigger_app"."tickets" SET number=0'));
      const native = await connection.db.execute(
        sql.raw('SELECT number,updated IS NOT NULL AS touched FROM "trigger_app"."tickets"'),
      );
      expect(native.rows).toEqual([{ number: 2, touched: true }]);
      const after = await inspectSnapshot(connection.db, namespace);
      expect(snapshotHash(after)).toBe(snapshotHash(changed));
      await connection.db.execute(sql.raw('ALTER TABLE "trigger_app"."tickets" DISABLE TRIGGER "updated touch"'));
      const disabled = await inspectSnapshot(connection.db, namespace);
      expect(disabled.extensionTriggers?.find((trigger) => trigger.name === "updated touch")?.enabled).toBe("disabled");
      expect(snapshotHash(disabled)).not.toBe(snapshotHash(changed));
      for (const statement of await migrationStatements(disabled, changed))
        await connection.db.execute(sql.raw(statement));
      expect(await migrationStatements(await inspectSnapshot(connection.db, namespace), changed)).toEqual([]);
      const without = await createSnapshot(declaration(false));
      for (const statement of await migrationStatements(changed, without))
        await connection.db.execute(sql.raw(statement));
      expect((await inspectSnapshot(connection.db, namespace)).extensionTriggers).toBeUndefined();
      expect(await migrationStatements(await inspectSnapshot(connection.db, namespace), without)).toEqual([]);
    } finally {
      await connection.close();
    }
  });
});
