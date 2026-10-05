import { test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { sql } from "drizzle-orm";
import {
  withEarthdistanceApi,
  earthdistanceNamespace as e,
  readEarthdistanceCubeBinary,
} from "../fixtures/earthdistance";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import { withExtensionDatabase } from "../fixtures/extension-database";
import earthdistanceManifest from "../../../apps/loom/src/tooling/extensions/manifests/earthdistance.json";

// Separate native characterization verifies the pinned contract also survives dependency relocation.
test("Earthdistance 1.2 native split-schema dependency, domain and result transport", async () => {
  const cubeSchema = "Cube日本",
    c = pg.escapeIdentifier(cubeSchema);
  await withEarthdistanceApi(
    async ({ client, connection, api }) => {
      assert.equal(api.cubeCodec.sqlType?.schema, cubeSchema);
      const result = await connection.transaction((db) =>
        db
          .select({
            meters: api.distanceMeters(api.fromDegrees(0, 0), api.fromDegrees(0, 90)),
            location: api.fromDegrees(0, 0),
            box: api.boxMeters(api.fromDegrees(0, 0), 1000),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      const native = (
        await client.query(
          `select ${e}.earth_distance(${e}.ll_to_earth(0,0),${e}.ll_to_earth(0,90)) meters, ${c}.cube_send(${e}.ll_to_earth(0,0)) bytes, ${c}.cube_send(${e}.earth_box(${e}.ll_to_earth(0,0),1000)) box`,
        )
      ).rows[0]!;
      assert.equal(result[0]!.meters, native.meters);
      assert.deepEqual(result[0]!.location, { kind: "point", coordinates: [6378168, 0, 0] });
      assert.deepEqual(result[0]!.box, readEarthdistanceCubeBinary(native.box));
      const observed = await captureExtensionContract(client, {
        name: "earthdistance",
        provider: "neon",
        fixture: "split-schema-earthdistance-characterization",
      });
      assert.equal(observed.contract.members.length, 15);
      assert.deepEqual(observed.contract.requires, ["cube"]);
      const domain = observed.contract.members.find((member) => member.kind === "type" && member.name === "earth");
      assert(domain?.kind === "type");
      assert.deepEqual(domain.base, { namespace: "$extension:cube", name: "cube" });
      assert.equal(observed.digest, earthdistanceManifest.digest);
      assert.deepEqual(observed.contract, earthdistanceManifest.contract);
    },
    undefined,
    cubeSchema,
  );
}, 90000);

test("Earthdistance install rejects PostgreSQL dependency-substitution characters without leaving an extension", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const earthSchema = pg.escapeIdentifier("Earth日本");
      await client.query(`create schema ${earthSchema}`);
      for (const character of ['"', "$", "'", "\\"]) {
        const cubeSchema = pg.escapeIdentifier(`Cube${character}日本`);
        await client.query(
          `create schema ${cubeSchema}; create extension cube with schema ${cubeSchema} version '1.5'`,
        );
        await assert.rejects(client.query(`create extension earthdistance with schema ${earthSchema} version '1.2'`), {
          code: "22P02",
        });
        assert.equal(
          (await client.query("select count(*)::int count from pg_extension where extname='earthdistance'")).rows[0]!
            .count,
          0,
        );
        assert.equal(
          (await client.query("select count(*)::int count from pg_extension where extname='cube'")).rows[0]!.count,
          1,
        );
        await client.query(`drop extension cube; drop schema ${cubeSchema}`);
      }
    } finally {
      await client.end();
    }
  });
}, 90000);
