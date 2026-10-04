import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import pg from "pg";
import { connectDatabase, defineSchema, defineTable } from "kello/server";
import { createH3Postgis_4_2_3, rasterHex } from "kello/extensions/h3-postgis";
import { geographyEwkt, geometryEwkt } from "kello/extensions/postgis";
import {
  h3PostgisMemberExpressions,
  h3PostgisNativeWitnesses,
  H3_POSTGIS_POLYGON,
} from "./h3-postgis-native-members.ts";
import { H3_POSTGIS_DIGEST, type H3PostgisPlacement } from "./h3-postgis-owned-pg.ts";
import { H3_POSTGIS_COMPANIONS } from "./h3-postgis-generated-project.ts";

/** Every reviewed overload runs through the installed adapter and connection codecs, against independent native SQL. */
export async function runH3PostgisPackedMembers(root: string, url: string, placement: H3PostgisPlacement) {
  const { extensions } = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
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
      apiSupport: { status: "verified", digest: H3_POSTGIS_COMPANIONS.h3.digest },
    },
    {
      name: "postgis",
      version: "3.6.4",
      schema: placement.postgis,
      apiSupport: { status: "verified", digest: H3_POSTGIS_COMPANIONS.postgis.digest },
    },
    {
      name: "postgis_raster",
      version: "3.6.4",
      schema: placement.postgis_raster,
      apiSupport: { status: "verified", digest: H3_POSTGIS_COMPANIONS.postgis_raster.digest },
    },
  );
  assert.equal(extensions.h3_postgis.apiSupport.digest, api.apiSupport.digest);
  const captured = JSON.parse(await readFile(new URL("./h3-postgis-members.json", import.meta.url), "utf8"));
  const callable: Array<{ id: string; kind: string; returns?: { name: string }; target?: { name: string } }> =
    captured.contract.members.filter((member: { kind: string }) =>
      ["routine", "cast", "operator"].includes(member.kind),
    );
  assert.equal(captured.digest, api.apiSupport.digest);
  const schema = defineSchema(() => ({}));
  const connection = await connectDatabase({
    schema,
    relations: defineRelations(schema.tables),
    connectionString: url,
  });
  const nativeClient = new pg.Client({ connectionString: url });
  await nativeClient.connect();
  const p = pg.escapeIdentifier(placement.postgis);
  const results: Array<{ id: string; rows: number }> = [];
  try {
    const raster = `${p}.st_addband(${p}.st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),'8BUI'::text,1::float8,0::float8)`;
    const hex = (await nativeClient.query<{ value: string }>(`SELECT ${raster}::text AS value`)).rows[0]!.value;
    const expressions = h3PostgisMemberExpressions(api, hex);
    assert.deepEqual(Object.keys(expressions).sort(), callable.map((member) => member.id).sort());
    assert.equal(callable.length, 56);
    for (const [id, expression] of Object.entries(expressions)) {
      const key = Object.keys(h3PostgisNativeWitnesses).find((key) => key === id);
      assert(key);
      // SAFETY: literal key equality above proves this is an exact witnessed overload.
      let native: string = h3PostgisNativeWitnesses[key as keyof typeof h3PostgisNativeWitnesses];
      for (const [original, selected] of [
        ["custom H3", placement.h3],
        ["postgis 地", placement.postgis],
        ["h3 Pg", placement.h3_postgis],
      ] as const)
        native = native.replaceAll(pg.escapeIdentifier(original), pg.escapeIdentifier(selected));
      native = native.replace(/^\(SELECT t FROM (.*) t LIMIT 1\)$/, "$1");
      const decoded = (
        await connection.transaction((db) => db.select({ value: expression }).from(sql`(VALUES (1)) witness(id)`))
      ).map((row) => row.value);
      const member = callable.find((member) => member.id === id);
      assert(member);
      const type =
        member.kind === "routine" ? member.returns?.name : member.kind === "cast" ? member.target?.name : "h3index";
      const spatial = (value: string, kind: "geometry" | "geography") => {
        const geometry = kind === "geometry" ? value : `(${value})::${p}.geometry`;
        return `jsonb_build_object('kind','${kind}','format','ewkb','hex',(${value})::text,'srid',${p}.st_srid(${geometry}),'dimensions','XY','geometryType',CASE ${p}.geometrytype(${geometry}) WHEN 'POINT' THEN 1 WHEN 'POLYGON' THEN 3 WHEN 'MULTIPOLYGON' THEN 6 END)`;
      };
      let projection = "to_jsonb(v)";
      if (type === "geometry" || type === "geography") projection = spatial("v", type);
      else if (type === "bytea") projection = "jsonb_build_object('hex',encode(v,'hex'))";
      else if (type === "jsonb") projection = "jsonb_build_object('type','jsonb','text',v::text)";
      else if (id.includes(".__h3_raster_polygon_to_cell_boundaries_intersects("))
        projection = `jsonb_build_object('h3',(v).h3::text,'geom',${spatial("(v).geom", "geometry")})`;
      else if (id.includes(".__h3_raster_polygon_to_cell_parts("))
        projection =
          "jsonb_build_object('h3',(v).h3::text,'part',jsonb_build_object('kind','raster','format','wkb','hex',(v).part::text))";
      const expected = (
        await nativeClient.query<{ value: unknown }>(`SELECT ${projection} AS value FROM (SELECT ${native} AS v) q`)
      ).rows.map((row) => row.value);
      const ordered = (values: unknown[]) =>
        values.toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      assert.deepEqual(ordered(decoded), ordered(expected), id);
      results.push({ id, rows: decoded.length });
    }
    const h = pg.escapeIdentifier(placement.h3_postgis);
    const rasterValue = rasterHex(hex);
    const defaultCases = [
      [api.getResolutionFromTileZoom(10), `${h}.h3_get_resolution_from_tile_zoom(10)`, []],
      [
        api.polygonToCellsExperimental(geometryEwkt(H3_POSTGIS_POLYGON), 9),
        `${h}.h3_polygon_to_cells_experimental($1::${p}.geometry,9)`,
        [H3_POSTGIS_POLYGON],
      ],
      [
        api.polygonToCellsExperimental(geographyEwkt(H3_POSTGIS_POLYGON), 9),
        `${h}.h3_polygon_to_cells_experimental($1::${p}.geography,9)`,
        [H3_POSTGIS_POLYGON],
      ],
      [api.rasterClassSummary(rasterValue, 8), `${h}.h3_raster_class_summary($1::${p}.raster,8)`, [hex]],
      [
        api.rasterClassSummaryCentroids(rasterValue, 8),
        `${h}.h3_raster_class_summary_centroids($1::${p}.raster,8)`,
        [hex],
      ],
      [api.rasterClassSummaryClip(rasterValue, 8), `${h}.h3_raster_class_summary_clip($1::${p}.raster,8)`, [hex]],
      [
        api.rasterClassSummarySubpixel(rasterValue, 8),
        `${h}.h3_raster_class_summary_subpixel($1::${p}.raster,8)`,
        [hex],
      ],
      [api.rasterSummary(rasterValue, 8), `${h}.h3_raster_summary($1::${p}.raster,8)`, [hex]],
      [api.rasterSummaryCentroids(rasterValue, 8), `${h}.h3_raster_summary_centroids($1::${p}.raster,8)`, [hex]],
      [api.rasterSummaryClip(rasterValue, 8), `${h}.h3_raster_summary_clip($1::${p}.raster,8)`, [hex]],
      [api.rasterSummarySubpixel(rasterValue, 8), `${h}.h3_raster_summary_subpixel($1::${p}.raster,8)`, [hex]],
    ] satisfies Array<[SQL, string, string[]]>;
    for (const [expression, native, parameters] of defaultCases) {
      const actual = (
        await connection.transaction((db) => db.select({ value: expression }).from(sql`(VALUES (1)) witness(id)`))
      ).map((row) => row.value);
      const expected = (
        await nativeClient.query<{ value: unknown }>(
          `SELECT to_jsonb(v) AS value FROM (SELECT ${native} AS v) q`,
          parameters,
        )
      ).rows.map((row) => row.value);
      const ordered = (values: unknown[]) =>
        values.toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      assert.deepEqual(ordered(actual), ordered(expected), native);
    }
    const generatedSchema = await nativeClient.query<{ schema: string }>(
      "SELECT n.nspname AS schema FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='summaries' AND c.relkind='r'",
    );
    assert.equal(generatedSchema.rowCount, 1);
    const storage = defineSchema(
      () => ({
        summaries: defineTable({
          item: api.field(),
          stats: api.statsField(),
          items: api.arrayField(),
          statistics: api.statsArrayField(),
        }),
      }),
      { namespace: generatedSchema.rows[0]!.schema },
    );
    const store = await connectDatabase({
      schema: storage,
      relations: defineRelations(storage.tables),
      connectionString: url,
    });
    try {
      const item = { val: 1, count: 2, area: 3 };
      const stats = { count: 2, sum: 4, mean: 2, stddev: 0, min: 2, max: 2 };
      const items = { dimensions: [{ lowerBound: -2, length: 2 }], values: [item, null] };
      const statistics = { dimensions: [{ lowerBound: 0, length: 2 }], values: [stats, null] };
      const table = storage.tables.summaries;
      await store.transaction((db) => db.insert(table).values({ item, stats, items, statistics }));
      const stored = await store.transaction((db) =>
        db
          .select({ item: table.item, stats: table.stats, items: table.items, statistics: table.statistics })
          .from(table),
      );
      assert.deepEqual(stored, [{ item, stats, items, statistics }]);
    } finally {
      await store.close();
    }
  } finally {
    await connection.close();
    await nativeClient.end();
  }
  await writeFile(
    join(root, "packed-native-members.json"),
    JSON.stringify(
      {
        results,
        callableMembers: results.length,
        defaultMembers: 11,
        fourFieldStorage: true,
        fullFamilyAcceptance: false,
      },
      null,
      2,
    ),
  );
  console.log("cold Node24 installed h3_postgis 56/56 adapter/native decoded outputs PASS");
}
