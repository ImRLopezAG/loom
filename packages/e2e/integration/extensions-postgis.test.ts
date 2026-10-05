import { test } from "bun:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { defineRelations, sql } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";
import { postgisNullableWitnesses } from "../fixtures/postgis-nullable-query-witnesses";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import {
  createPostgis_3_6_4,
  geometryEwkb,
  geometryEwkt,
  geographyEwkt,
} from "../../../apps/loom/src/core/extensions/adapters/postgis";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";

// Only the worker's already-created UUID container. Missing native fixture is a failure, never a skip.
test("PostGIS exact native codec/composition and every callable nullable/set/aggregate/window shape", async () => {
  const fixture = JSON.parse(
    await readFile(process.env.POSTGIS_FIXTURE_PATH ?? "/tmp/loom-postgis-fixture.json", "utf8"),
  );
  const client = new pg.Client({ connectionString: fixture.url });
  await client.connect();
  const schema = "postgis日本",
    ns = pg.escapeIdentifier(schema);
  const api = createPostgis_3_6_4({
    name: "postgis",
    version: "3.6.4",
    schema,
    apiSupport: { status: "verified", digest: manifest.digest },
  });
  const declaration = defineSchema(
    () => ({
      entries: {
        geom: api.geometry.field({ srid: 3857, type: "Point", dimensions: "XY" }),
        geog: api.geography.field({ srid: 4326, type: "Point", dimensions: "XY" }),
      },
    }),
    { namespace: "postgis_app" },
  );
  const nativeUrl = new URL(fixture.url);
  nativeUrl.searchParams.set("options", '-c search_path="postgis日本",pg_catalog');
  const connection = await connectDatabase({
    connectionString: nativeUrl.href,
    schema: declaration,
    relations: defineRelations(declaration.tables),
  });
  const observations: Array<{
    member: string;
    status: string;
    rows?: number;
    code?: string | undefined;
    message?: string | undefined;
  }> = [];
  try {
    const raw = (await client.query(`select ${ns}.st_geomfromewkt('SRID=4326;POINT ZM(1 2 3 4)')::text value`)).rows[0]
      .value;
    const returned = await connection.transaction((db) =>
      db
        .select({ value: api.sql.functions.st_geomfromewkt("SRID=4326;POINT ZM(1 2 3 4)") })
        .from(sql`(values(1)) fixture(id)`),
    );
    assert.deepEqual(returned[0]?.value, geometryEwkb(raw));
    const distance = await connection.transaction((db) =>
      db
        .select({
          planar: api.geometry.distance(geometryEwkt("SRID=3857;POINT(0 0)"), geometryEwkt("SRID=3857;POINT(3 4)")),
          meters: api.geography.distance(geographyEwkt("SRID=4326;POINT(0 0)"), geographyEwkt("SRID=4326;POINT(0 1)")),
        })
        .from(sql`(values(1)) fixture(id)`),
    );
    assert.equal(distance[0]?.planar, 5);
    assert.equal(distance[0]?.meters, 110574.3885578);
    const nullableWitnesses = postgisNullableWitnesses(api);
    const unsafeMember = "routine:$extension:postgis.st_fromflatgeobuf(pg_catalog.anyelement,pg_catalog.bytea)";
    assert.deepEqual(
      [...nullableWitnesses.map((entry) => entry.member), unsafeMember].sort(),
      Object.keys(api.sql.overloads).sort(),
    );
    assert.throws(
      () => api.sql.functions.st_fromflatgeobuf(api.codecs.geometry_dump)(null, null),
      /PostGIS 3.6.4 ST_FromFlatGeobuf rejects NULL bytea/,
    );
    observations.push({
      member: unsafeMember,
      status: "observed-unsafe-null-rejection",
      message:
        "NULL bytea rejected before native invocation; valid native payload is covered by the schema fixture. Known native crash is never reprobed.",
    });
    const capturedManifest = v.parse(extensionManifestValidator, manifest);
    for (const { member, expression } of nullableWitnesses) {
      const captured = capturedManifest.contract.members.find((row) => row.id === member)!;
      try {
        assert.equal(extensionExpressionContract(expression)?.member, member);
        const rows = await connection.transaction((db) =>
          db.select({ value: expression }).from(sql`(values(1)) fixture(id)`),
        );
        observations.push({ member, status: "observed-nullable-native-shape", rows: rows.length });
      } catch (error) {
        const e = v.parse(
          v.object({
            code: v.optional(v.string()),
            message: v.string(),
            cause: v.optional(v.object({ code: v.optional(v.string()), message: v.string() })),
          }),
          error,
        );
        if (captured.kind === "routine" && captured.name === "st_letters") {
          // Native PL/pgSQL rejects NULL letters at FOREACH; preserve and compare its error, not an invented NULL result.
          await client.query(`SET search_path=${ns},pg_catalog`);
          await assert.rejects(client.query(`SELECT ${ns}.st_letters(NULL::text,NULL::json)`), {
            code: e.cause?.code ?? e.code,
            message: e.cause?.message ?? e.message,
          });
          observations.push({ member, status: "observed-native-null-error", code: e.cause?.code ?? e.code });
          continue;
        }
        observations.push({
          member,
          status: "unresolved-native-invocation",
          code: e.code ?? e.cause?.code,
          message: e.message ?? e.cause?.message,
        });
      }
    }
    await writeFile(
      `${process.env.POSTGIS_EVIDENCE_DIR ?? "/tmp"}/loom-postgis-callable-native.json`,
      JSON.stringify({ digest: manifest.digest, observations }, null, 2),
    );
    const unresolved = observations.filter((row) => row.status === "unresolved-native-invocation");
    console.log(
      JSON.stringify(
        { nativeCallableMembers: observations.length, observed: observations.length - unresolved.length, unresolved },
        null,
        2,
      ),
    );
    assert.equal(
      unresolved.length,
      0,
      "Every captured SQL-callable nullable shape must resolve or remain an explicit blocker",
    );
  } finally {
    await connection.close();
    await client.end();
  }
}, 120000);
