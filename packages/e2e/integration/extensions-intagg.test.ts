import { expect, test } from "bun:test";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { createIntagg_1_1, int4NativeArray } from "../../../apps/loom/src/core/extensions/adapters/intagg";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { intaggDescriptor, intaggInstall } from "../fixtures/intagg";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { wave10CallbackProofCase, wave10CallbackProofs } from "../fixtures/wave10-callback-proof-cases";

const proof = wave10CallbackProofCase("intagg");
const witness = (index: number) => ({ ...proof.claims[index]!, schema: wave10CallbackProofs.intagg.schema });
extensionProofTest(proof, async () => {
  await withExtensionDatabase(async (url) =>
    extensionProofWitness(witness(0), async () => {
      const api = createIntagg_1_1(intaggDescriptor);
      const schema = defineSchema((fields) => ({
        samples: { grp: fields.text().notNull(), n: fields.integer() },
      }));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      try {
        await connection.db.execute(sql.raw(intaggInstall));
        await observeExtensionProofDatabase(url, proof.id, "intagg");
        for (const statement of await migrationStatements(await emptySnapshot("public"), await createSnapshot(schema)))
          await connection.db.execute(sql.raw(statement));
        await connection.db.insert(schema.tables.samples).values([
          { grp: "a", n: 1 },
          { grp: "a", n: null },
          { grp: "a", n: 3 },
          { grp: "b", n: -2 },
          { grp: "b", n: 4 },
          { grp: "empty", n: null },
        ]);
        const grouped = await connection.transaction((db) =>
          db
            .select({
              grp: schema.tables.samples.grp,
              value: api.intArrayAggregate(schema.tables.samples.n),
              filtered: api.intArrayAggregate.filter(
                sql<boolean>`${schema.tables.samples.n} > 0`,
                schema.tables.samples.n,
              ),
            })
            .from(schema.tables.samples)
            .groupBy(schema.tables.samples.grp)
            .orderBy(schema.tables.samples.grp),
        );
        const groupedOracle = await oracle.query(
          `SELECT grp,
          "int""agg".int_array_aggregate(n) AS value,
          "int""agg".int_array_aggregate(n) FILTER (WHERE n > 0) AS filtered
         FROM samples GROUP BY grp ORDER BY grp`,
        );
        expect(grouped.map((row) => [row.grp, row.value?.values ?? null, row.filtered?.values ?? null])).toEqual(
          groupedOracle.rows.map((row) => [row.grp, row.value, row.filtered]),
        );
        const empty = await connection.transaction((db) =>
          db
            .select({ value: api.intArrayAggregate(schema.tables.samples.n) })
            .from(schema.tables.samples)
            .where(sql`false`),
        );
        const emptyOracle = await oracle.query(
          `SELECT "int""agg".int_array_aggregate(n) AS value FROM samples WHERE false`,
        );
        expect(empty).toEqual([{ value: null }]);
        expect(emptyOracle.rows).toEqual([{ value: null }]);
        const windowed = await connection.transaction((db) =>
          db
            .select({
              n: schema.tables.samples.n,
              running: api.intArrayAggregate.over(
                { partitionBy: [schema.tables.samples.grp], orderBy: [schema.tables.samples.n] },
                schema.tables.samples.n,
              ),
            })
            .from(schema.tables.samples)
            .where(sql`grp = 'a'`)
            .orderBy(schema.tables.samples.n),
        );
        const windowOracle = await oracle.query(
          `SELECT n, "int""agg".int_array_aggregate(n) OVER (PARTITION BY grp ORDER BY n) AS running
         FROM samples WHERE grp = 'a' ORDER BY n`,
        );
        expect(windowed.map((row) => [row.n, row.running?.values ?? null])).toEqual(
          windowOracle.rows.map((row) => [row.n, row.running]),
        );
        await extensionProofWitness(witness(1), async () => {
          const enumerated = await connection.transaction((db) =>
            db.select({ n: api.intArrayEnum(int4NativeArray([1, null, 3])) }).from(sql`(values (1)) fixture(id)`),
          );
          const enumOracle = await oracle.query(`SELECT "int""agg".int_array_enum('{1,NULL,3}'::int4[]) AS n`);
          expect(enumerated).toEqual(enumOracle.rows);
          const nullEnum = await connection.transaction((db) =>
            db.select({ n: api.intArrayEnum(null) }).from(sql`(values (1)) fixture(id)`),
          );
          const nullEnumOracle = await oracle.query(`SELECT "int""agg".int_array_enum(NULL::int4[]) AS n`);
          expect(nullEnum).toEqual([]);
          expect(nullEnumOracle.rows).toEqual([]);
        });
        await oracle.query("BEGIN");
        await oracle.query(`INSERT INTO samples (grp, n) VALUES ('rollback', 9)`);
        const beforeRollback = await oracle.query(
          `SELECT "int""agg".int_array_aggregate(n) AS value FROM samples WHERE grp = 'rollback'`,
        );
        expect(beforeRollback.rows[0]?.value).toEqual([9]);
        await oracle.query("ROLLBACK");
        const afterRollback = await oracle.query(
          `SELECT "int""agg".int_array_aggregate(n) AS value FROM samples WHERE grp = 'rollback'`,
        );
        expect(afterRollback.rows).toEqual([{ value: null }]);
      } finally {
        await oracle.end();
        await connection.close();
      }
    }),
  );
});

test("intagg.internalCallbacksAreNotSqlCallable", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      await client.query(intaggInstall);
      for (const sqlText of [
        `SELECT "int""agg".int_agg_state(NULL, 1)`,
        `SELECT "int""agg".int_agg_final_array(NULL)`,
      ]) {
        await expect(client.query(sqlText)).rejects.toThrow();
      }
    } finally {
      await client.end();
    }
  });
});
