import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { sql, type SQL } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  createPgtap_1_3_3,
  pgtapRoutineSpecs,
  type PgtapMember,
} from "../../../apps/loom/src/core/extensions/adapters/pgtap";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { pgtapCaseArguments, pgtapNativeCases } from "../fixtures/pgtap-cases";
import { pgtapDescriptor, pgtapInstall, withPgtapDatabase } from "../fixtures/pgtap";

const output = process.argv[2];
assert(output, "Usage: run-pgtap-query-characterization.ts /absolute/scratch-output.json");
const observations = await withPgtapDatabase(async (url) => {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(pgtapInstall);
    await client.query("SET search_path = pg_catalog");
    const api = createPgtap_1_3_3(pgtapDescriptor);
    const dialect = extensionSqlDialect(nodePgCodecs);
    const results = [];
    for (const entry of pgtapNativeCases) {
      // SAFETY: the exhaustive baseline member IDs match the exact manifest in unit tests.
      const id = entry.id as PgtapMember;
      if (!pgtapRoutineSpecs[id].query) continue;
      // SAFETY: the preceding query flag selects only a mapped query member and fixture codecs validate its tuple.
      const call = api.sql.overloads[id as keyof typeof api.sql.overloads] as (...args: readonly unknown[]) => SQL;
      const values: readonly unknown[] =
        pgtapRoutineSpecs[id].name === "_pg_sv_table_accessible"
          ? (
              await client.query(
                "SELECT 'public'::regnamespace::oid AS schema_oid, 'public.fixture'::regclass::oid AS table_oid",
              )
            ).rows.flatMap((row: { schema_oid: number; table_oid: number }) => [row.schema_oid, row.table_oid])
          : entry.values;
      const expression = call(...pgtapCaseArguments(id, values));
      const query = dialect.sqlToQuery(sql`SELECT ${expression} AS value`);
      try {
        const result = await client.query(query.sql, query.params);
        results.push({ id, outcome: "returned", rows: result.rows });
      } catch (error) {
        assert(error instanceof Error);
        results.push({
          id,
          outcome: "native-error",
          message: error.message,
          sqlstate: "code" in error ? error.code : null,
        });
      }
    }
    return results;
  } finally {
    await client.end();
  }
});
await writeFile(output, JSON.stringify(observations, null, 2));
console.log(
  JSON.stringify({
    calls: observations.length,
    errors: observations.filter((entry) => entry.outcome === "native-error"),
  }),
);
