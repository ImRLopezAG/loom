import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { DATA_US_CUSTOM_SCHEMA, DATA_US_SEEDS } from "../fixtures/address-standardizer-data-us-generated-project.ts";
import { startDataUsOwnedPg } from "../fixtures/address-standardizer-data-us-owned-pg.ts";

// Fixture characterization only: no source-import/generation/tarball/provider gate claim.
const fixture = await startDataUsOwnedPg();
try {
  for (const placement of ["extensions", DATA_US_CUSTOM_SCHEMA]) {
    const client = new pg.Client({ connectionString: await fixture.provision(placement) });
    try {
      await client.connect();
      for (const seed of DATA_US_SEEDS) {
        const relation = `${pg.escapeIdentifier(placement)}.${pg.escapeIdentifier(seed.name)}`;
        const actual = await client.query(
          `SELECT count(*)::int AS count, count(*) FILTER (WHERE is_custom)::int AS custom, md5(string_agg(row_to_json(t)::text, E'\\n' ORDER BY id)) AS hash FROM ${relation} t`,
        );
        assert.deepEqual(actual.rows, [{ count: seed.count, custom: 0, hash: seed.hash }]);
      }
      await fixture.journal("native-seeds-characterized", { placement, seedRows: 8383 });
    } finally {
      await client.end();
    }
  }
} finally {
  await fixture.stop();
  await fixture.proveAbsent();
}
await writeFile(
  join(tmpdir(), "loom-address-standardizer-data-us-fixture-receipt.json"),
  JSON.stringify(
    {
      fixtureCharacterization: true,
      exactVersion: "3.6.4",
      postgresMajor: 18,
      baseAbsent: true,
      nativeSeeds: 8383,
      defaultAndQuotedSchemas: true,
      preDdlJournal: fixture.journalFile,
      independentCleanupAbsence: true,
      generationGate: "pending-parent-public-build",
      consumerGate: "pending-parent-frozen-artifact",
    },
    null,
    2,
  ),
  { mode: 0o600 },
);
console.log(
  `data-US UUID fixture native seeds/default+quoted schemas characterized; absence proven; journal=${fixture.journalFile}`,
);
