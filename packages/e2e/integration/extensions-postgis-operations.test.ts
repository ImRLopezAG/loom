import { test } from "bun:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import pg from "pg";
import { sql } from "drizzle-orm";
import { binaryCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { withPostgisOperations } from "../../../apps/loom/src/tooling/extensions/operations/postgis";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
import { postgisAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgis";

test("PostGIS all 16 exact DDL operator contracts perform owned native mutations", async () => {
  const fixture = JSON.parse(
    await readFile(process.env.POSTGIS_FIXTURE_PATH ?? "/tmp/loom-postgis-fixture.json", "utf8"),
  );
  const client = new pg.Client({ connectionString: fixture.url });
  await client.connect();
  const selected = "postgis日本",
    ns = pg.escapeIdentifier(selected);
  const owned = `postgis_ops_${crypto.randomUUID().replaceAll("-", "")}`,
    schema = pg.escapeIdentifier(owned);
  const defaultTable = `${owned}_default`;
  const descriptor = {
    name: "postgis",
    version: "3.6.4",
    schema: selected,
    apiSupport: { status: "verified", digest: manifest.digest },
  } as const;
  const observations: Array<{ member: string; result: string | number | null }> = [];
  try {
    await client.query(
      `CREATE SCHEMA ${schema}; CREATE TABLE ${schema}.explicit(id integer); CREATE TABLE ${schema}.catalog(id integer); CREATE TABLE ${ns}.${pg.escapeIdentifier(defaultTable)}(id integer)`,
    );
    const payload = (
      await client.query(
        `SELECT ${ns}.st_asflatgeobuf(f,false,'geom') data FROM (SELECT ${ns}.st_geomfromewkt('SRID=4326;POINT(1 2)') geom) f`,
      )
    ).rows[0].data;
    await withPostgisOperations(fixture.url, descriptor, async (session) => {
      assert.deepEqual(
        Object.keys(session).sort(),
        postgisAnnotations
          .filter(
            (row) => row.disposition === "tooling" && row.id !== "routine:$extension:postgis.postgis_cache_bbox()",
          )
          .map((row) => row.id)
          .sort(),
      );
      const invoke = async (member: keyof typeof session, work: () => Promise<string | number | null>) => {
        observations.push({ member, result: await work() });
      };
      await invoke(
        "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)",
        () =>
          session[
            "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)"
          ](defaultTable, "geom", 4326, "POINT", 2),
      );
      await invoke(
        "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)",
        () =>
          session[
            "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)"
          ](owned, "explicit", "geom", 4326, "POINT", 2, false),
      );
      await invoke(
        "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)",
        () =>
          session[
            "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)"
          ]("", owned, "catalog", "geom", 4326, "POINT", 2),
      );
      await invoke(
        "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)",
        () =>
          session[
            "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)"
          ](defaultTable, "geom", 3857),
      );
      await invoke(
        "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)",
        () =>
          session[
            "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)"
          ](owned, "explicit", "geom", 3857),
      );
      await invoke(
        "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)",
        () =>
          session[
            "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)"
          ]("", owned, "catalog", "geom", 3857),
      );
      await invoke("routine:$extension:postgis.populate_geometry_columns(pg_catalog.bool)", () =>
        session["routine:$extension:postgis.populate_geometry_columns(pg_catalog.bool)"](),
      );
      const oid = (await client.query("SELECT $1::regclass::oid::int value", [`${schema}.explicit`])).rows[0].value;
      await invoke("routine:$extension:postgis.populate_geometry_columns(pg_catalog.oid,pg_catalog.bool)", () =>
        session["routine:$extension:postgis.populate_geometry_columns(pg_catalog.oid,pg_catalog.bool)"](oid, false),
      );
      await invoke(
        "routine:$extension:postgis.st_fromflatgeobuftotable(pg_catalog.text,pg_catalog.text,pg_catalog.bytea)",
        () =>
          session[
            "routine:$extension:postgis.st_fromflatgeobuftotable(pg_catalog.text,pg_catalog.text,pg_catalog.bytea)"
          ](owned, "fgb", binaryCodec.decode(payload)),
      );
      await invoke("routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar)", () =>
        session["routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar)"](
          defaultTable,
          "geom",
        ),
      );
      await invoke(
        "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)",
        () =>
          session[
            "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)"
          ](owned, "explicit", "geom"),
      );
      await invoke(
        "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)",
        () =>
          session[
            "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)"
          ]("", owned, "catalog", "geom"),
      );
      await invoke("routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar)", () =>
        session["routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar)"](defaultTable),
      );
      await invoke("routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar,pg_catalog.varchar)", () =>
        session["routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar,pg_catalog.varchar)"](
          owned,
          "explicit",
        ),
      );
      await invoke(
        "routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)",
        () =>
          session[
            "routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)"
          ]("", owned, "catalog"),
      );
    });
    for (const table of [`${ns}.${pg.escapeIdentifier(defaultTable)}`, `${schema}.explicit`, `${schema}.catalog`])
      assert.equal((await client.query("SELECT to_regclass($1) value", [table])).rows[0].value, null);
    assert.equal((await client.query(`SELECT count(*)::int count FROM ${schema}.fgb`)).rows[0].count, 0);
    // The retained native implementation returns before reading bytes when either name is NULL.
    // Characterize that safe branch using valid bytes; never re-probe the known unsafe byte reader.
    assert.equal(
      (await client.query(`SELECT ${ns}.st_fromflatgeobuftotable(NULL::text,'ignored',$1::bytea) value`, [payload]))
        .rows[0].value,
      null,
    );
    await withPostgisOperations(fixture.url, descriptor, async (session) => {
      const importTable =
        session[
          "routine:$extension:postgis.st_fromflatgeobuftotable(pg_catalog.text,pg_catalog.text,pg_catalog.bytea)"
        ];
      for (const schemaName of [null, sql<null>`NULL::text`]) {
        assert.equal(await importTable(schemaName, "ignored", null), null);
        assert.equal(await importTable(owned, schemaName, sql<null>`NULL::bytea`), null);
      }
    });
    await assert.rejects(
      withPostgisOperations(fixture.url, descriptor, (session) =>
        session[
          "routine:$extension:postgis.st_fromflatgeobuftotable(pg_catalog.text,pg_catalog.text,pg_catalog.bytea)"
        ](owned, "unsafe", null),
      ),
      (error: Error) => {
        assert(error instanceof ExtensionOperationError);
        assert.equal(error.completion, "rolled-back");
        assert(error.cause instanceof Error);
        assert.match(error.cause.message, /PostGIS 3.6.4 ST_FromFlatGeobufToTable rejects NULL bytea/);
        return true;
      },
    );
    assert.equal((await client.query("SELECT to_regclass($1) value", [`${schema}.unsafe`])).rows[0].value, null);
    await assert.rejects(
      withPostgisOperations(fixture.url, descriptor, (session) =>
        session[
          "routine:$extension:postgis.st_fromflatgeobuftotable(pg_catalog.text,pg_catalog.text,pg_catalog.bytea)"
        ](sql<string>`${owned}::text`, sql<string>`'unsafe_sql'::text`, null),
      ),
      (error: Error) => {
        assert(error instanceof ExtensionOperationError);
        assert.equal(error.completion, "rolled-back");
        assert(error.cause instanceof Error && "code" in error.cause);
        assert.equal(error.cause.code, "22023");
        return true;
      },
    );
    assert.equal((await client.query("SELECT to_regclass($1) value", [`${schema}.unsafe_sql`])).rows[0].value, null);
    const upgrade = "routine:$extension:postgis.postgis_extensions_upgrade(pg_catalog.text)";
    const outcome = await withPostgisOperations(fixture.url, descriptor, (session) => session[upgrade]());
    assert.equal(outcome.completion, "committed");
    const result = outcome.value;
    assert.match(result ?? "", /Upgrade to version 3\.6\.4 completed/);
    observations.push({ member: upgrade, result });
    assert.equal(
      (await client.query("SELECT extversion FROM pg_extension WHERE extname='postgis'")).rows[0].extversion,
      "3.6.4",
    );
    assert.equal(observations.length, 16);
    await writeFile(
      `${process.env.POSTGIS_EVIDENCE_DIR ?? "/tmp"}/loom-postgis-operations-native.json`,
      JSON.stringify(
        { digest: manifest.digest, observations, unsafeNullRejected: true, safeNullNamesPreserved: true },
        null,
        2,
      ),
    );
  } finally {
    await client.query(
      `DROP TABLE IF EXISTS ${ns}.${pg.escapeIdentifier(defaultTable)}; DROP SCHEMA IF EXISTS ${schema} CASCADE`,
    );
    await client.end();
  }
}, 120000);
