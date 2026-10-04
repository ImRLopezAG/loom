import { test } from "bun:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { defineRelations, sql } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import {
  createPostgis_3_6_4,
  geometryEwkb,
  geometryEwkt,
} from "../../../apps/loom/src/core/extensions/adapters/postgis";
import {
  compositeCodec,
  withCodecSqlType,
  integerCodec,
  nullableCodec,
  binaryCodec,
} from "../../../apps/loom/src/core/extensions/codecs";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withPostgisOperations } from "../../../apps/loom/src/tooling/extensions/operations/postgis";
import { postgisFlatGeobufBytes } from "../../../apps/loom/src/core/extensions/adapters/postgis-flat-geobuf";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";

// Source/native characterization is distinct from generated-public and tarball acceptance.
test("PostGIS native nullable schema, bounded arrays, composite values, trigger, 14 index classes and valid FlatGeobuf", async () => {
  const fixture = JSON.parse(
    await readFile(process.env.POSTGIS_FIXTURE_PATH ?? "/tmp/loom-postgis-fixture.json", "utf8"),
  );
  const client = new pg.Client({ connectionString: fixture.url });
  await client.connect();
  const namespace = `postgis_schema_${crypto.randomUUID().replaceAll("-", "")}`,
    owned = pg.escapeIdentifier(namespace),
    selected = pg.escapeIdentifier("postgis日本");
  const descriptor = {
    name: "postgis",
    version: "3.6.4",
    schema: "postgis日本",
    apiSupport: { status: "verified", digest: manifest.digest },
  } as const;
  const api = createPostgis_3_6_4(descriptor);
  const fields = {
    box2d_array: api.arrayFields["box2d"](),
    box2df_array: api.arrayFields["box2df"](),
    box3d_array: api.arrayFields["box3d"](),
    geography_array: api.arrayFields["geography"](),
    geography_columns_array: api.arrayFields["geography_columns"](),
    geometry_array: api.arrayFields["geometry"](),
    geometry_columns_array: api.arrayFields["geometry_columns"](),
    geometry_dump_array: api.arrayFields["geometry_dump"](),
    gidx_array: api.arrayFields["gidx"](),
    spatial_ref_sys_array: api.arrayFields["spatial_ref_sys"](),
    spheroid_array: api.arrayFields["spheroid"](),
    valid_detail_array: api.arrayFields["valid_detail"](),
    box2d: api.fields["box2d"](),
    box2df: api.fields["box2df"](),
    box3d: api.fields["box3d"](),
    geography: api.fields["geography"](),
    geography_columns: api.fields["geography_columns"](),
    geometry: api.fields["geometry"](),
    geometry_columns: api.fields["geometry_columns"](),
    geometry_dump: api.fields["geometry_dump"](),
    gidx: api.fields["gidx"](),
    spatial_ref_sys: api.fields["spatial_ref_sys"](),
    spheroid: api.fields["spheroid"](),
    valid_detail: api.fields["valid_detail"](),
  };
  const declared = defineSchema(() => ({ records: fields }), {
    namespace,
    triggers: (tables) => [
      api.triggers.cacheBbox({ name: "cache_geometry", table: tables.records, column: tables.records.geometry! }),
    ],
  });
  let closeConnection: (() => Promise<void>) | undefined;
  const indexes: Array<{ member: string; statement: string; plan: unknown }> = [];
  try {
    for (const statement of await migrationStatements(await emptySnapshot(namespace), await createSnapshot(declared)))
      await client.query(statement);
    await client.query(`INSERT INTO ${owned}.records (_id,"_createdAt") VALUES ($1,1)`, [crypto.randomUUID()]);
    const connection = await connectDatabase({
      connectionString: fixture.url,
      schema: declared,
      relations: defineRelations(declared.tables),
    });
    closeConnection = connection.close;
    const nullRows = await connection.transaction((db) => db.select().from(declared.tables.records));
    assert(nullRows[0]);
    const nativeFields = Object.entries(nullRows[0]).filter(([name]) => !["_id", "_createdAt"].includes(name));
    assert.deepEqual(nativeFields.map(([name]) => name).sort(), Object.keys(fields).sort());
    for (const [name, value] of nativeFields) assert.equal(value, null, `${name} native SQL NULL`);
    const ewkt = "SRID=4326;POINT ZM(1 2 3 4)";
    await client.query(
      `INSERT INTO ${owned}.records (_id,"_createdAt",geometry,geography,geometry_dump,valid_detail,geometry_array,geometry_dump_array) VALUES ($1,2,$2::${selected}.geometry,${selected}.st_geogfromtext('SRID=4326;POINT(1 2)'),ROW(ARRAY[1,2],$2::${selected}.geometry)::${selected}.geometry_dump,ROW(true,'native',$2::${selected}.geometry)::${selected}.valid_detail,('[0:1]={"'||($2::${selected}.geometry)::text||'":NULL}')::${selected}.geometry[],ARRAY[ROW(ARRAY[1,2],$2::${selected}.geometry)::${selected}.geometry_dump,NULL])`,
      [crypto.randomUUID(), ewkt],
    );
    const decoded = await connection.transaction((db) =>
      db.select().from(declared.tables.records).orderBy(declared.tables.records._createdAt),
    );
    const native = (
      await client.query(
        `SELECT geometry::text geom,geometry_array::text ga,geometry_dump::text gd,geometry_dump_array::text gda FROM ${owned}.records WHERE "_createdAt"=2`,
      )
    ).rows[0];
    assert.deepEqual(decoded[1]?.geometry, geometryEwkb(native.geom));
    assert.deepEqual(decoded[1]?.geometry_array, api.codecs._geometry.decode(native.ga));
    assert.deepEqual(decoded[1]?.geometry_dump, api.codecs.geometry_dump.decode(native.gd));
    assert.deepEqual(decoded[1]?.geometry_dump_array, api.codecs._geometry_dump.decode(native.gda));
    assert(decoded[1]?.geometry_array);
    assert.equal(decoded[1].geometry_array.dimensions[0]?.lowerBound, 0);
    await client.query(
      `UPDATE ${owned}.records SET geometry=${selected}.st_geomfromewkt('SRID=4326;LINESTRING(0 0,1 1)') WHERE "_createdAt"=2`,
    );
    const trigger = (
      await client.query(
        `SELECT tgname,tgtype,encode(tgargs,'escape') arguments FROM pg_catalog.pg_trigger WHERE tgrelid=$1::regclass AND NOT tgisinternal`,
        [`${owned}.records`],
      )
    ).rows[0];
    assert.equal(trigger.tgname, "cache_geometry");
    assert.equal(trigger.tgtype, 23);
    assert.equal(trigger.arguments, "geometry\\000");
    const cache = (
      await client.query(
        `SELECT ${selected}.postgis_hasbbox(geometry) cached FROM ${owned}.records WHERE "_createdAt"=2`,
      )
    ).rows[0];
    assert.equal(cache.cached, true);
    await client.query(
      `CREATE TABLE ${owned}.index_values (geometry ${selected}.geometry, geography ${selected}.geography); INSERT INTO ${owned}.index_values SELECT ${selected}.st_geomfromewkt('SRID=4326;POINT ZM('||g::text||' 0 1 2)'),${selected}.st_geogfromtext('SRID=4326;POINT('||g::text||' 0)') FROM generate_series(1,90) g`,
    );
    for (const member of v
      .parse(extensionManifestValidator, manifest)
      .contract.members.filter((row) => row.kind === "opclass")) {
      const name = `postgis_index_${indexes.length}`,
        column = member.input.name;
      const statement = `CREATE INDEX ${pg.escapeIdentifier(name)} ON ${owned}.index_values USING ${member.accessMethod} (${pg.escapeIdentifier(column)} ${selected}.${pg.escapeIdentifier(member.name)})`;
      await client.query(statement);
      await client.query("SET enable_seqscan=off");
      const family = v
        .parse(extensionManifestValidator, manifest)
        .contract.members.find((row) => row.kind === "opfamily" && row.id === `opfamily:${member.family}`);
      assert(family?.kind === "opfamily");
      const suffix = `($extension:postgis.${column},$extension:postgis.${column})`;
      const target =
        family.operators.find(
          (row) =>
            row.operator.endsWith(suffix) &&
            row.operator.startsWith(
              "$extension:postgis." +
                (member.accessMethod === "btree" || member.accessMethod === "hash" ? "=" : "&&") +
                "(",
            ),
        ) ?? family.operators.find((row) => row.operator.endsWith(suffix) && row.strategy === 3);
      assert(target, `${member.id}: exact captured search operator`);
      const symbol = target.operator.slice("$extension:postgis.".length, target.operator.indexOf("("));
      const predicate = `OPERATOR(${selected}.${symbol})`;
      const literal =
        column === "geography"
          ? `${selected}.st_geogfromtext('SRID=4326;POINT(1 0)')`
          : `${selected}.st_geomfromewkt('SRID=4326;POINT ZM(1 0 1 2)')`;
      const query = `SELECT count(*) FROM ${owned}.index_values WHERE ${pg.escapeIdentifier(column)} ${predicate} ${literal}`;
      const plan = (await client.query(`EXPLAIN (ANALYZE,FORMAT JSON) ${query}`)).rows[0]["QUERY PLAN"];
      const check = (
        await client.query(
          "SELECT c.opcname,m.amname FROM pg_catalog.pg_index i JOIN pg_catalog.pg_opclass c ON c.oid=i.indclass[0] JOIN pg_catalog.pg_am m ON m.oid=c.opcmethod WHERE i.indexrelid=$1::regclass",
          [`${owned}.${pg.escapeIdentifier(name)}`],
        )
      ).rows[0];
      assert.equal(check.opcname, member.name);
      assert.equal(check.amname, member.accessMethod);
      assert(JSON.stringify(plan).includes(name), `${member.id}: native planner must select the created class`);
      indexes.push({ member: member.id, statement, plan });
      await client.query(`DROP INDEX ${owned}.${pg.escapeIdentifier(name)}`);
    }
    await client.query(`CREATE TYPE ${owned}.fgb_row AS (fid bigint,geom ${selected}.geometry)`);
    const payload = (
      await client.query(
        `SELECT ${selected}.st_asflatgeobuf(f,false,'geom') data FROM (SELECT ${selected}.st_geomfromewkt('SRID=4326;POINT(1 2)') geom) f`,
      )
    ).rows[0].data;
    // Prove rejection in built-in bytea SQL only; never reprobe the known NULL native crash.
    for (const routine of ["ST_FromFlatGeobuf", "ST_FromFlatGeobufToTable"] as const) {
      for (const bytes of [sql<null>`NULL::bytea`, sql<null>`${null}::bytea`, sql<null>`(SELECT NULL::bytea)`]) {
        const guarded = extensionSqlDialect(nodePgCodecs).sqlToQuery(
          sql`SELECT ${postgisFlatGeobufBytes(bytes, routine)}`,
        );
        await assert.rejects(client.query(guarded.sql, guarded.params), { code: "22023" });
      }
      const guarded = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`SELECT ${postgisFlatGeobufBytes(sql<ReturnType<typeof binaryCodec.decode>>`${binaryCodec.encode(binaryCodec.decode(payload))}::bytea`, routine)} value`,
      );
      assert.deepEqual((await client.query(guarded.sql, guarded.params)).rows[0].value, payload);
    }
    const concrete = withCodecSqlType(
      compositeCodec("postgis:owned-fgb-row", { fid: integerCodec, geom: nullableCodec(api.codecs.geometry) }),
      { schema: namespace, name: "fgb_row" },
    );
    const returned = await connection.transaction((db) =>
      db
        .select({
          value: api.sql.functions.st_fromflatgeobuf(concrete)(
            sql<null>`NULL::${sql.identifier(namespace)}.fgb_row`,
            binaryCodec.decode(payload),
          ),
        })
        .from(sql`(values(1)) fixture(id)`),
    );
    const nativeFgb = (
      await client.query(`SELECT r::text value FROM ${selected}.st_fromflatgeobuf(NULL::${owned}.fgb_row,$1) r`, [
        payload,
      ])
    ).rows;
    assert.deepEqual(
      returned.map((row) => row.value),
      nativeFgb.map((row) => concrete.decode(row.value)),
    );
    const sqlReturned = await connection.transaction((db) =>
      db
        .select({
          value: api.sql.functions.st_fromflatgeobuf(concrete)(
            sql<null>`NULL::${sql.identifier(namespace)}.fgb_row`,
            sql<ReturnType<typeof binaryCodec.decode>>`${binaryCodec.encode(binaryCodec.decode(payload))}::bytea`,
          ),
        })
        .from(sql`(values(1)) fixture(id)`),
    );
    assert.deepEqual(sqlReturned, returned);
    const lettersUrl = new URL(fixture.url);
    lettersUrl.searchParams.set("options", '-c search_path="postgis日本",pg_catalog');
    const lettersConnection = await connectDatabase({
      connectionString: lettersUrl.href,
      schema: declared,
      relations: defineRelations(declared.tables),
    });
    try {
      const letters = await lettersConnection.transaction((db) =>
        db.select({ value: api.sql.functions.st_letters("L") }).from(sql`(values(1)) fixture(id)`),
      );
      assert(letters[0]?.value && letters[0].value.format === "ewkb");
    } finally {
      await lettersConnection.close();
    }
    await withPostgisOperations(fixture.url, descriptor, (session) =>
      session["routine:$extension:postgis.st_fromflatgeobuftotable(pg_catalog.text,pg_catalog.text,pg_catalog.bytea)"](
        namespace,
        "fgb_created",
        binaryCodec.decode(payload),
      ),
    );
    assert.equal((await client.query(`SELECT count(*)::int count FROM ${owned}.fgb_created`)).rows[0].count, 0);
    const fgbColumns = (
      await client.query(
        "SELECT a.attname,t.typname FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_type t ON t.oid=a.atttypid WHERE a.attrelid=$1::regclass AND a.attnum>0 ORDER BY a.attnum",
        [`${owned}.fgb_created`],
      )
    ).rows;
    assert.deepEqual(fgbColumns, [
      { attname: "id", typname: "int4" },
      { attname: "geom", typname: "geometry" },
    ]);
    const geometryView = api.views.geometry_columns("geom_catalog");
    const geographyView = api.views.geography_columns("geog_catalog");
    const srsTable = api.tables.spatial_ref_sys("srs_catalog");
    const geometryRows = await connection.transaction((db) =>
      db.select(geometryView.columns).from(geometryView.from).limit(1),
    );
    const geographyRows = await connection.transaction((db) =>
      db.select(geographyView.columns).from(geographyView.from).limit(1),
    );
    const srsRows = await connection.transaction((db) => db.select(srsTable.columns).from(srsTable.from).limit(1));
    for (const rows of [geometryRows, geographyRows, srsRows]) assert.equal(rows.length, 1);
    await writeFile(
      `${process.env.POSTGIS_EVIDENCE_DIR ?? "/tmp"}/loom-postgis-schema-native.json`,
      JSON.stringify(
        {
          digest: manifest.digest,
          nullableFields: Object.keys(fields),
          boundedArray: true,
          composite: true,
          trigger,
          indexes,
          validFlatGeobuf: returned,
          sqlFlatGeobufBytesPreserved: true,
          unsafeNullByteaRejected: true,
          validLetters: true,
          flatGeobufToTable: true,
          views: true,
        },
        (_key, value) => (v.is(v.bigint(), value) ? value.toString() : value),
        2,
      ),
    );
  } finally {
    await closeConnection?.();
    await client.query(`DROP SCHEMA IF EXISTS ${owned} CASCADE`);
    await client.end();
  }
}, 120000);
