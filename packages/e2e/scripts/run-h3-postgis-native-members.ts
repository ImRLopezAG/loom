import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { defineRelations, sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import pg from "pg";
import { createH3Postgis_4_2_3 } from "../../../apps/loom/src/core/extensions/adapters/h3-postgis";
import { h3Index } from "../../../apps/loom/src/core/extensions/adapters/h3-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/h3_postgis.json";
import h3Manifest from "../../../apps/loom/src/tooling/extensions/manifests/h3.json";
import postgisManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
import rasterManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_raster.json";
import { h3PostgisMemberExpressions, h3PostgisNativeWitnesses } from "../fixtures/h3-postgis-native-members";
import {
  H3_POSTGIS_CUSTOM_PLACEMENT,
  H3_POSTGIS_DIGEST,
  H3_POSTGIS_OBSERVED_EXTENSIONS,
  startH3PostgisOwnedPg,
  type H3PostgisPlacement,
} from "../fixtures/h3-postgis-owned-pg";

const directory = process.argv[2];
assert(directory, "Usage: bun packages/e2e/scripts/run-h3-postgis-native-members.ts <own UUID directory>");
const fixture = await startH3PostgisOwnedPg(directory);
const results: { id: string; rows: number; decoded: unknown[] }[] = [];
try {
  const placement = H3_POSTGIS_CUSTOM_PLACEMENT;
  const url = await fixture.provision(placement);
  await compareMembers(url, placement);
} catch (cause) {
  fixture.fail(cause);
  // close() rethrows this cause, or aggregates it first with cleanup failures.
  throw cause;
} finally {
  await fixture.close();
}
await writeFile(
  `${directory}/adapter-native-members.json`,
  JSON.stringify(
    {
      extensions: H3_POSTGIS_OBSERVED_EXTENSIONS,
      digest: H3_POSTGIS_DIGEST,
      results,
      callableMembers: results.length,
      fullFamilyAcceptance: false,
    },
    null,
    2,
  ),
);
console.log(
  `h3_postgis ${results.length}/56 exact adapter/native SQL and decoded outputs passed; own fixtures absent; provider/public acceptance pending`,
);

async function compareMembers(url: string, placement: H3PostgisPlacement) {
  assert.equal(manifest.digest, H3_POSTGIS_DIGEST);
  const api = createH3Postgis_4_2_3(
    {
      name: "h3_postgis",
      version: "4.2.3",
      schema: placement.h3_postgis,
      apiSupport: { status: "verified", digest: H3_POSTGIS_DIGEST },
    },
    {
      name: "h3",
      version: "4.2.3",
      schema: placement.h3,
      apiSupport: { status: "verified", digest: h3Manifest.digest },
    },
    {
      name: "postgis",
      version: "3.6.4",
      schema: placement.postgis,
      apiSupport: { status: "verified", digest: postgisManifest.digest },
    },
    {
      name: "postgis_raster",
      version: "3.6.4",
      schema: placement.postgis_raster,
      apiSupport: { status: "verified", digest: rasterManifest.digest },
    },
  );
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const managed = defineSchema(
    () => ({
      summaries: defineTable({
        item: api.field(),
        stats: api.statsField(),
        items: api.arrayField(),
        statistics: api.statsArrayField(),
      }),
    }),
    { namespace: "app" },
  );
  const relations = defineRelations(managed.tables);
  const connection = await connectDatabase({ schema: managed, relations, connectionString: url });
  const p = pg.escapeIdentifier(placement.postgis);
  const dialect = extensionSqlDialect(nodePgCodecs);
  try {
    // This geotransform was already characterized safely. No invalid raster or empty H3 array is sent.
    const nativeRaster = `${p}.st_addband(${p}.st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),'8BUI'::text,1::float8,0::float8)`;
    const hex = (await client.query<{ value: string }>(`SELECT ${nativeRaster}::text AS value`)).rows[0]!.value;
    const expressions = h3PostgisMemberExpressions(api, hex);
    const callable = manifest.contract.members.filter((member) =>
      ["routine", "cast", "operator"].includes(member.kind),
    );
    assert.deepEqual(Object.keys(expressions).sort(), callable.map((member) => member.id).sort());
    assert.equal(callable.length, 56);
    for (const [id, expression] of Object.entries(expressions)) {
      assert.equal(extensionExpressionContract(expression)?.member, id);
      const key = Object.keys(h3PostgisNativeWitnesses).find((key) => key === id);
      assert(key);
      // SAFETY: the exact native witness key has been checked against the 56 literal keys.
      let native: string = h3PostgisNativeWitnesses[key as keyof typeof h3PostgisNativeWitnesses];
      for (const [original, selected] of [
        ["custom H3", placement.h3],
        ["postgis 地", placement.postgis],
        ["h3 Pg", placement.h3_postgis],
      ] as const)
        native = native.replaceAll(pg.escapeIdentifier(original), pg.escapeIdentifier(selected));
      native = native.replace(/^\(SELECT t FROM (.*) t LIMIT 1\)$/, "$1");
      const compiled = dialect.sqlToQuery(
        sql`SELECT v::text AS value FROM (SELECT ${expression} AS v) q ORDER BY v::text`,
      );
      const actualText = (await client.query<{ value: string | null }>(compiled.sql, compiled.params)).rows;
      const expectedText = (
        await client.query<{ value: string | null }>(
          `SELECT v::text AS value FROM (SELECT ${native} AS v) q ORDER BY v::text`,
        )
      ).rows;
      assert.deepEqual(actualText, expectedText, `${id}: native SQL result`);
      const decoded = (
        await connection.transaction((db) => db.select({ value: expression }).from(sql`(VALUES (1)) witness(id)`))
      ).map((row) => row.value);
      const member = callable.find((member) => member.id === id);
      assert(member);
      const resultType =
        member.kind === "routine" ? member.returns?.name : member.kind === "cast" ? member.target?.name : "h3index";
      assert(resultType);
      const spatial = (value: string, kind: "geometry" | "geography") => {
        const geometry = kind === "geometry" ? value : `(${value})::${p}.geometry`;
        return `jsonb_build_object('kind','${kind}','format','ewkb','hex',(${value})::text,'srid',${p}.st_srid(${geometry}),'dimensions','XY','geometryType',CASE ${p}.geometrytype(${geometry}) WHEN 'POINT' THEN 1 WHEN 'POLYGON' THEN 3 WHEN 'MULTIPOLYGON' THEN 6 END)`;
      };
      let projection = "to_jsonb(v)";
      if (resultType === "geometry" || resultType === "geography") projection = spatial("v", resultType);
      else if (resultType === "bytea") projection = "jsonb_build_object('hex',encode(v,'hex'))";
      else if (resultType === "jsonb") projection = "jsonb_build_object('type','jsonb','text',v::text)";
      else if (id.includes(".__h3_raster_polygon_to_cell_boundaries_intersects("))
        projection = `jsonb_build_object('h3',(v).h3::text,'geom',${spatial("(v).geom", "geometry")})`;
      else if (id.includes(".__h3_raster_polygon_to_cell_parts("))
        projection =
          "jsonb_build_object('h3',(v).h3::text,'part',jsonb_build_object('kind','raster','format','wkb','hex',(v).part::text))";
      const expected = (
        await client.query<{ value: unknown }>(`SELECT ${projection} AS value FROM (SELECT ${native} AS v) q`)
      ).rows.map((row) => row.value);
      const ordered = (values: unknown[]) =>
        values.toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      // Native to_jsonb and native spatial metadata provide the independent output representation.
      assert.deepEqual(ordered(decoded), ordered(expected), `${id}: decoded native result`);
      results.push({ id, rows: decoded.length, decoded });
    }
    // Native SQL-body prerequisite: qualification alone does not replace the extension's search_path.
    await client.query("BEGIN; SET LOCAL search_path TO pg_catalog");
    try {
      await assert.rejects(
        client.query(
          `SELECT ${pg.escapeIdentifier(placement.h3_postgis)}.h3_cell_to_geometry('8928308280fffff'::${pg.escapeIdentifier(placement.h3)}.h3index)`,
        ),
        (error: pg.DatabaseError) => error instanceof pg.DatabaseError && error.code === "42704",
      );
    } finally {
      await client.query("ROLLBACK");
    }
    for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(managed)))
      await client.query(statement);
    const item = { val: 1, count: 2, area: 3 };
    const stats = { count: 2, sum: 4, mean: 2, stddev: 0, min: 2, max: 2 };
    const items = { dimensions: [{ lowerBound: -2, length: 2 }], values: [item, null] };
    const statistics = { dimensions: [{ lowerBound: 0, length: 2 }], values: [stats, null] };
    const table = managed.tables.summaries;
    await connection.transaction((db) => db.insert(table).values({ item, stats, items, statistics }));
    const stored = await connection.transaction((db) =>
      db.select({ item: table.item, stats: table.stats, items: table.items, statistics: table.statistics }).from(table),
    );
    assert.deepEqual(stored, [{ item, stats, items, statistics }]);
    const nullCell = await connection.transaction((db) =>
      db.select({ value: api.cellToBoundaryGeometry(null) }).from(sql`(VALUES (1)) witness(id)`),
    );
    assert.deepEqual(nullCell, [{ value: null }]);
    const cell = h3Index("8928308280fffff");
    const defaults = await connection.transaction((db) =>
      db
        .select({ omitted: api.cellToBoundaryGeometry(cell), explicit: api.cellToBoundaryGeometry(cell, false) })
        .from(sql`(VALUES (1)) witness(id)`),
    );
    assert.deepEqual(defaults[0]!.omitted, defaults[0]!.explicit);
    const summary = api.statsRows("w", { kind: "raster", format: "wkb", hex }, 8);
    const namedRows = await connection.transaction((db) => db.select(summary.columns).from(summary.from));
    assert.equal(namedRows.length, 4);
  } finally {
    await connection.close();
    await client.end();
  }
}
