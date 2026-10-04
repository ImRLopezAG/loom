import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { cubePoint, cubeBox } from "../../../apps/loom/src/core/extensions/adapters/cube";
import { type EarthValue, type PostgreSqlArray } from "../../../apps/loom/src/core/extensions/adapters/earthdistance";
import { extensionExpressionContract, checkedExtensionExpression } from "../../../apps/loom/src/core/extensions/sql";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createSnapshot, inspectSnapshot } from "../../../apps/loom/src/tooling/migrations/adapter";
import {
  earthdistanceCases,
  earthdistanceManaged,
  earthdistanceNamespace as e,
  earthdistanceCubeNamespace as c,
  earthdistanceType,
  withEarthdistanceApi,
  nativeEarthdistanceCube,
  readEarthdistanceCubeBinary,
} from "../fixtures/earthdistance";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import {
  earthdistanceOrdinaryProofCase,
  earthdistanceDomainProofCase,
  earthdistanceCompositionProofCase,
  earthdistanceProofSchema,
} from "../fixtures/earthdistance-proof-cases";

extensionProofTest(
  earthdistanceOrdinaryProofCase,
  async () => {
    await withEarthdistanceApi(async ({ client, connection, api }) => {
      const cases = earthdistanceCases(api);
      assert.equal(cases.length, 10);
      assert.deepEqual(cases.map((entry) => entry.member).sort(), Object.keys(api.sql.overloads).sort());
      const nullInput = `(select NULL::${earthdistanceType} lhs, NULL::${earthdistanceType} rhs, NULL::point p, NULL::point q, NULL::float8 radius, NULL::float8 lat, NULL::float8 lon) earthdistance_inputs`;
      for (const entry of cases) {
        const claim = earthdistanceOrdinaryProofCase.claims.find((claim) => claim.member === entry.member);
        assert(claim, `Missing exact Earthdistance proof claim: ${entry.member}`);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          assert.equal(extensionExpressionContract(entry.expression)?.member, entry.member);
          const actual = (
            await connection.transaction((db) => db.select({ value: entry.expression }).from(sql`earthdistance_inputs`))
          )[0]!.value;
          const native =
            entry.kind === "cube"
              ? await nativeEarthdistanceCube(client, `(select ${entry.native} from earthdistance_inputs)`)
              : (await client.query(`select ${entry.native} value from earthdistance_inputs`)).rows[0]!.value;
          assert.deepEqual(actual, native, entry.member);
          const nullResult = await connection.transaction((db) =>
            db.select({ value: entry.expression }).from(sql.raw(nullInput)),
          );
          assert.deepEqual(nullResult, [{ value: entry.strict ? null : 6378168 }], entry.member);
        });
      }
      const units = await connection.transaction((db) =>
        db
          .select({
            meters: api.distanceMeters(api.fromDegrees(0, 0), api.fromDegrees(0, 90)),
            miles: api.pointDistanceMiles({ longitude: 0, latitude: 0 }, { longitude: 90, latitude: 0 }),
            degrees: api.latitudeDegrees(api.fromDegrees(18.4, -69.9)),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      assert(Math.abs(Number(units[0]!.meters) - (Math.PI * 6378168) / 2) < 1e-8);
      assert(Math.abs(Number(units[0]!.miles) - (Math.PI * 3958.747716) / 2) < 1e-8);
      assert(Math.abs(Number(units[0]!.degrees) - 18.4) < 1e-12);
      const nested = connection.db
        .select({ place: api.fromDegrees(0, 0).as('place"日本') })
        .from(sql`(values (1)) fixture(id)`)
        .as('query"日本');
      const result = await connection.transaction((db) =>
        db.select({ value: api.distanceMeters(nested.place, api.fromDegrees(0, 90)) }).from(nested),
      );
      assert.equal(result[0]!.value, units[0]!.meters);
      for (const [input, secant, arc] of [
        [-1, 0, 0],
        [0, 0, 0],
        [1e20, 2 * 6378168, Math.PI * 6378168],
      ]) {
        const result = await connection.transaction((db) =>
          db
            .select({ secant: api.greatCircleToSecantMeters(input!), arc: api.secantToGreatCircleMeters(input!) })
            .from(sql`(values (1)) fixture(id)`),
        );
        assert.deepEqual(result, [{ secant, arc }]);
      }
      for (const [lat, lon] of [
        [90, 180],
        [-90, -180],
        [0, 180],
        [0, -180],
        [91, 181],
      ]) {
        const result = await connection.transaction((db) =>
          db.select({ value: api.fromDegrees(lat!, lon!) }).from(sql`(values (1)) fixture(id)`),
        );
        assert.deepEqual(result[0]!.value, await nativeEarthdistanceCube(client, `${e}.ll_to_earth(${lat},${lon})`));
      }
    }, earthdistanceOrdinaryProofCase.id);
  },
  90000,
);

extensionProofTest(
  earthdistanceDomainProofCase,
  async () => {
    const prove = async (index: number): Promise<void> => {
      const claim = earthdistanceDomainProofCase.claims[index];
      if (!claim) return run();
      await extensionProofWitness({ ...claim, schema: earthdistanceProofSchema }, () => prove(index + 1));
    };
    const run = async () => {
      await withEarthdistanceApi(async ({ client, connection, api }) => {
        const table = earthdistanceManaged.tables.entries;
        const point = cubePoint([6378168]);
        const tags: PostgreSqlArray<EarthValue> = {
          dimensions: [
            { lowerBound: -2, length: 2 },
            { lowerBound: 4, length: 2 },
          ],
          values: [
            [point, null],
            [cubePoint([0, 6378168]), cubePoint([0, 0, 6378168])],
          ],
        };
        await connection.transaction((db) =>
          db.insert(table).values([
            { value: point, tags },
            { value: null, tags: null },
            { value: cubeBox([6378168], [6378168]), tags: { dimensions: [], values: [] } },
          ]),
        );
        const rows = await connection.transaction((db) =>
          db.select({ value: table.value, tags: table.tags }).from(table),
        );
        assert(rows.some((row) => JSON.stringify(row.tags) === JSON.stringify(tags)));
        assert(rows.some((row) => row.value === null && row.tags === null));
        assert(
          rows.filter((row) => row.value !== null).every((row) => JSON.stringify(row.value) === JSON.stringify(point)),
        );
        const sixRanks: PostgreSqlArray<EarthValue> = {
          dimensions: Array.from({ length: 6 }, () => ({ lowerBound: -1, length: 1 })),
          values: [[[[[[point]]]]]],
        };
        await connection.transaction((db) => db.insert(table).values({ value: point, tags: sixRanks }));
        const rankSixRow = (
          await connection.transaction((db) =>
            db
              .select({ tags: table.tags })
              .from(table)
              .where(sql`array_ndims(${table.tags})=6`),
          )
        )[0]!;
        assert.deepEqual(rankSixRow.tags, sixRanks);
        const native = (
          await client.query(
            `select array_dims(tags) bounds, cardinality(tags) count from app.entries where cardinality(tags)=4`,
          )
        ).rows[0]!;
        assert.equal(native.bounds, "[-2:-1][4:5]");
        assert.equal(native.count, 4);
        assert.deepEqual(await inspectSnapshot(connection.db, "app"), await createSnapshot(earthdistanceManaged));
        const bytes = (await client.query<{ bytes: Buffer }>(`select ${c}.cube_send(${e}.ll_to_earth(0,0)) bytes`))
          .rows[0]!.bytes;
        // ll_to_earth constructs all three coordinates; the stored one-coordinate
        // point above is a separate valid Cube representation of the same location.
        assert.deepEqual(readEarthdistanceCubeBinary(bytes), cubePoint([6378168, 0, 0]));
        // Binary Bind invokes domain_recv and inherited cube_recv, independently of the production text codec.
        assert.deepEqual(
          (await client.query<{ bytes: Buffer }>(`select ${c}.cube_send($1::${earthdistanceType}) bytes`, [bytes]))
            .rows[0]!.bytes,
          bytes,
        );
        const roundtrip = checkedExtensionExpression(
          sql<EarthValue>`${sql.param(api.codec.encode(point))}::${sql.raw(earthdistanceType)}`,
          nullableCodec(api.codec),
          [],
        );
        assert.deepEqual(
          await connection.transaction((db) => db.select({ value: roundtrip }).from(sql`(values (1)) fixture(id)`)),
          [{ value: point }],
        );
        for (const [bad, constraint] of [
          [cubeBox([6378168], [6378169]), "not_point"],
          [cubePoint([6378168, 0, 0, 0]), "not_3d"],
          [cubePoint([1]), "on_surface"],
          [cubePoint([{ nonfinite: "NaN" }]), "on_surface"],
        ] as const) {
          const count = Number((await client.query("select count(*) count from app.entries")).rows[0]!.count);
          await assert.rejects(
            connection.transaction(async (db) => {
              await db.insert(table).values({ value: point });
              await db.insert(table).values({ value: bad });
            }),
          );
          await assert.rejects(client.query(`select $1::${earthdistanceType}`, [api.codec.encode(bad)]), {
            code: "23514",
            constraint,
          });
          assert.equal(Number((await client.query("select count(*) count from app.entries")).rows[0]!.count), count);
        }
        const domain = (
          await client.query(
            `select t.typtype, b.typname base, t.typinput::regproc::text input, t.typreceive::regproc::text receive, t.typoutput::regproc::text output, t.typsend::regproc::text send from pg_type t join pg_type b on b.oid=t.typbasetype where t.oid=$1::regtype`,
            [earthdistanceType],
          )
        ).rows[0]!;
        assert.equal(domain.typtype, "d");
        assert.equal(domain.base, "cube");
        assert.equal(domain.input, "domain_in");
        assert.equal(domain.receive, "domain_recv");
        assert.match(domain.output, /cube_out$/);
        assert.match(domain.send, /cube_send$/);
        assert.deepEqual(
          (
            await client.query("select conname from pg_constraint where contypid=$1::regtype order by conname", [
              earthdistanceType,
            ])
          ).rows.map((row) => row.conname),
          ["not_3d", "not_point", "on_surface"],
        );
        // Domain arrays inherit the native array send/receive callbacks and retain lower bounds.
        const arrayBytes = (
          await client.query<{ bytes: Buffer }>(
            `select array_send(tags) bytes from app.entries where cardinality(tags)=4`,
          )
        ).rows[0]!.bytes;
        const binaryArray = (
          await client.query<{ text: string }>(`select ($1::${earthdistanceType}[])::text text`, [arrayBytes])
        ).rows[0]!.text;
        assert.deepEqual(api.arrayCodec.decode(binaryArray), tags);
      }, earthdistanceDomainProofCase.id);
    };
    await prove(0);
  },
  90000,
);

extensionProofTest(
  earthdistanceCompositionProofCase,
  async () => {
    await withEarthdistanceApi(async ({ client, connection, api }) => {
      await client.query(
        `create index entries_earth_gist on app.entries using gist (value ${c}.gist_cube_ops); insert into app.entries(_id,value) select gen_random_uuid(),${e}.ll_to_earth(lat,lon) from (values(0.,0.),(0.,0.5),(0.8,0.8),(5.,5.)) places(lat,lon)`,
      );
      const table = earthdistanceManaged.tables.entries;
      const center = api.fromDegrees(0, 0),
        box = api.boxMeters(center, 100000);
      const { createCube_1_5 } = await import("../../../apps/loom/src/core/extensions/adapters/cube");
      const { earthdistanceCubeDescriptor } = await import("../fixtures/earthdistance");
      const cube = createCube_1_5(earthdistanceCubeDescriptor);
      const candidate = await connection.transaction((db) =>
        db.select({ id: table._id }).from(table).where(cube.contains(box, table.value)),
      );
      const exact = await connection.transaction((db) =>
        db
          .select({ id: table._id })
          .from(table)
          .where(sql`${cube.contains(box, table.value)} and ${api.distanceMeters(center, table.value)} <= 100000`),
      );
      const oracle = await client.query(
        `select _id id from app.entries where ${e}.earth_box(${e}.ll_to_earth(0,0),100000) operator(${c}.@>) value and ${e}.earth_distance(${e}.ll_to_earth(0,0),value)<=100000 order by _id`,
      );
      assert(candidate.length > exact.length);
      assert.equal(exact.length, 2);
      assert.deepEqual(
        exact.map((row) => row.id).sort(),
        oracle.rows.map((row) => row.id),
      );
      await client.query("begin; set local enable_seqscan=off");
      try {
        const plan = (
          await client.query(
            `explain select _id from app.entries where value operator(${c}.<@) ${e}.earth_box(${e}.ll_to_earth(0,0),100000)`,
          )
        ).rows
          .map((row) => row["QUERY PLAN"])
          .join("\n");
        assert.match(plan, /Index|Bitmap/);
      } finally {
        await client.query("rollback");
      }
    }, earthdistanceCompositionProofCase.id);
  },
  90000,
);
