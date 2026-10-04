import { expect } from "bun:test";
import { defineRelations, sql } from "drizzle-orm";
import { integer, pgMaterializedView, pgTable } from "drizzle-orm/pg-core";
import { createTsmSystemRows_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tsm-system-rows";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { wave10CallbackProofCase, wave10CallbackProofs } from "../fixtures/wave10-callback-proof-cases";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";

const extension = createTsmSystemRows_1_0({
  name: "tsm_system_rows",
  version: "1.0",
  schema: 'sample"s',
  apiSupport: { status: "verified", digest: "cb606ea0ec43b299ed4776aaeb12126165f751dbf9c5d40a974df6a8a7067eec" },
});
const items = pgTable("items", { id: integer("id") });
const summary = pgMaterializedView("item_summary", { id: integer("id") }).existing();
const total = 10_000;

// Native characterization only; proof-host receipts and provider acceptance remain pending.
const proof = wave10CallbackProofCase("tsm_system_rows");
const witness = { ...proof.claims[0]!, schema: wave10CallbackProofs.tsm_system_rows.schema };
extensionProofTest(proof, async () => {
  await withExtensionDatabase(async (url) =>
    extensionProofWitness(witness, async () => {
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      try {
        const db = connection.db;
        await db.execute(
          sql.raw(`create schema "sample""s"; create extension tsm_system_rows with schema "sample""s" version '1.0'`),
        );
        await observeExtensionProofDatabase(url, proof.id, "tsm_system_rows");
        await db.execute(
          sql.raw(`create table items as select g as id from generate_series(1, ${total}) g;
        create materialized view item_summary as select id from items; create view item_view as select id from items`),
        );
        const installed = await db.execute(
          sql`select e.extversion, n.nspname from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid = e.extnamespace where e.extname = 'tsm_system_rows'`,
        );
        expect(installed.rows).toEqual([{ extversion: "1.0", nspname: 'sample"s' }]);
        // An unqualified method name does not resolve outside the search path, so qualification is load-bearing.
        await expect(
          Promise.resolve(db.execute(sql.raw("select 1 from items tablesample system_rows(1)"))),
        ).rejects.toMatchObject({ cause: { message: expect.stringContaining("does not exist") } });
        await expect(
          Promise.resolve(db.execute(sql.raw(`select 1 from item_view tablesample "sample""s".system_rows(1)`))),
        ).rejects.toMatchObject({
          cause: { message: expect.stringContaining("can only be applied to tables and materialized views") },
        });
        const five = await db.select({ id: sql<number | null>`${items.id}` }).from(extension.systemRows(items, 5n));
        expect(five).toHaveLength(5);
        expect(new Set(five.map((row) => row.id)).size).toBe(5);
        expect(five.every((row) => row.id !== null && row.id >= 1 && row.id <= total)).toBe(true);
        expect(await db.select({ id: sql<number | null>`${items.id}` }).from(extension.systemRows(items, 0))).toEqual(
          [],
        );
        expect(
          await db
            .select({ id: sql<number | null>`${items.id}` })
            .from(extension.systemRows(items, 9223372036854775807n)),
        ).toHaveLength(total);
        expect(
          await db.select({ id: sql<number | null>`${summary.id}` }).from(extension.systemRows(summary, 4)),
        ).toHaveLength(4);
        // Independent native oracle for the same qualified method and the native argument errors.
        const oracle = await db.execute<{ count: string }>(
          sql.raw(`select count(*)::text count from items tablesample "sample""s".system_rows(7)`),
        );
        expect(oracle.rows).toEqual([{ count: "7" }]);
        for (const [argument, message] of [
          ["-1", "sample size must not be negative"],
          ["null", "cannot be null"],
        ] as const)
          await expect(
            Promise.resolve(
              db.execute(sql.raw(`select 1 from items tablesample "sample""s".system_rows(${argument})`)),
            ),
          ).rejects.toMatchObject({ cause: { message: expect.stringContaining(message) } });
        await expect(
          Promise.resolve(
            db.execute(sql.raw(`select 1 from items tablesample "sample""s".system_rows(1) repeatable (7)`)),
          ),
        ).rejects.toMatchObject({ cause: { message: expect.stringContaining("does not support REPEATABLE") } });
        // A failed sampled statement aborts only its transaction; nothing persists and the pool stays usable.
        await expect(
          Promise.resolve(
            connection.transaction(async (tx) => {
              await tx.execute(sql`insert into items values (0)`);
              await tx.execute(sql.raw(`select 1 from items tablesample "sample""s".system_rows(-1)`));
            }),
          ),
        ).rejects.toMatchObject({ cause: { message: expect.stringContaining("negative") } });
        const after = await db.execute<{ count: string }>(sql`select count(*)::text count from items`);
        expect(after.rows).toEqual([{ count: String(total) }]);
      } finally {
        await connection.close();
      }
    }),
  );
});
