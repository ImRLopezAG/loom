import * as v from "valibot";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import {
  cubePoint,
  cubeBox,
  type CubeValue,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/cube";
import {
  cubeCases,
  cubeManaged,
  cubeNamespace,
  cubeType,
  withCubeApi,
  nativeCube,
  readCubeBinary,
} from "../fixtures/cube-api";
import { extensionExpressionContract, checkedExtensionExpression } from "../../../apps/loom/src/core/extensions/sql";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import {
  cubeOrdinaryProofCase,
  cubeBinaryProofCase,
  cubeSchemaIndexProofCase,
  cubeCompositionProofCase,
  cubeProofSchema,
} from "../fixtures/cube-proof-cases";
import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createSnapshot, inspectSnapshot, snapshotHash } from "../../../apps/loom/src/tooling/migrations/adapter";

extensionProofTest(
  cubeOrdinaryProofCase,
  async () => {
    await withCubeApi(async ({ client, connection, api }) => {
      const cases = cubeCases(api);
      assert.equal(cases.length, 45);
      assert.deepEqual(cases.map((item) => item.member).sort(), Object.keys(api.sql.overloads).sort());
      for (const item of cases) {
        const claim = cubeOrdinaryProofCase.claims.find((claim) => claim.member === item.member);
        assert(claim, `Missing Cube oracle claim: ${item.member}`);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
          const rows = await connection.transaction((db) =>
            db.select({ value: item.expression }).from(sql`portable_cube_inputs`),
          );
          assert.equal(rows.length, 1);
          const actual = rows[0]!.value;
          if (item.kind === "cube")
            assert.deepEqual(
              actual,
              await nativeCube(client, `(select ${item.native} from portable_cube_inputs)`),
              item.member,
            );
          else {
            const native = (await client.query(`select ${item.native} value from portable_cube_inputs`)).rows[0]!.value;
            assert.deepEqual(actual, item.kind === "bytea" ? { hex: native.toString("hex") } : native, item.member);
          }
          const nullInput = `(select NULL::${cubeType} lhs,NULL::${cubeType} rhs,NULL::float8[] fs,NULL::int4[] indices,NULL::int4 idx,NULL::float8 radius) portable_cube_inputs`;
          const nullRows = await connection.transaction((db) =>
            db.select({ value: item.expression }).from(sql.raw(nullInput)),
          );
          assert.deepEqual(nullRows, [{ value: null }], item.member);
          assert.deepEqual((await client.query(`select ${item.native} value from ${nullInput}`)).rows, [
            { value: null },
          ]);
        });
      }
      await client.query("update portable_cube_inputs set lhs=NULL,rhs=NULL,fs=NULL,indices=NULL,idx=NULL,radius=NULL");
      for (const item of cases) {
        const rows = await connection.transaction((db) =>
          db.select({ value: item.expression }).from(sql`portable_cube_inputs`),
        );
        assert.deepEqual(rows, [{ value: null }], item.member);
        assert.deepEqual((await client.query(`select ${item.native} value from portable_cube_inputs`)).rows, [
          { value: null },
        ]);
      }
    }, cubeOrdinaryProofCase.id);
  },
  90000,
);

extensionProofTest(cubeBinaryProofCase, async () => {
  await proveCubeCaseMembers(cubeBinaryProofCase, async () => {
    await withCubeApi(async ({ client, connection, api }) => {
      const values: readonly CubeValue[] = [
        cubePoint([]),
        cubePoint([1]),
        cubePoint([1, 2]),
        cubeBox([1, 2], [3, 4]),
        cubeBox([2], [2]),
        cubePoint([-0, { nonfinite: "NaN" }, { nonfinite: "Infinity" }, { nonfinite: "-Infinity" }]),
        cubePoint(Array.from({ length: 100 }, (_, i) => i)),
      ];
      for (const value of values) {
        // Separate native arrays construct the oracle. The production cube text encoder never feeds this SQL.
        const input = value.kind === "point" ? value.coordinates : value.lower;
        const floats = (coords: typeof input) =>
          coords.map((x) => (v.is(v.number(), x) ? (Object.is(x, -0) ? "-0" : x) : x.nonfinite));
        const expression =
          value.kind === "point"
            ? `${cubeNamespace}.cube($1::float8[])`
            : `${cubeNamespace}.cube($1::float8[],$2::float8[])`;
        const params = value.kind === "point" ? [floats(input)] : [floats(input), floats(value.upper)];
        const expected = await nativeCube(client, expression, params);
        const nativeValue = sql<CubeValue>`${sql.param(api.codec.encode(value))}::${sql.raw(cubeType)}`;
        const kept = checkedExtensionExpression(nativeValue, nullableCodec(api.codec), []);
        const actual = await connection.transaction((db) =>
          db.select({ kept, sent: api.send(nativeValue) }).from(sql`(values (1)) fixture(id)`),
        );
        assert.deepEqual(actual[0]!.kept, expected);
        const nativeBytes = (
          await client.query<{ bytes: Buffer }>(`select ${cubeNamespace}.cube_send(${expression}) bytes`, params)
        ).rows[0]!.bytes;
        assert.deepEqual(actual[0]!.sent, { hex: nativeBytes.toString("hex") });
        const received = (
          await client.query<{ bytes: Buffer }>(`select ${cubeNamespace}.cube_send($1::${cubeType}) bytes`, [
            nativeBytes,
          ])
        ).rows[0]!.bytes;
        assert.deepEqual(
          received,
          nativeBytes,
          "PostgreSQL binary Bind must invoke the captured cube receive callback",
        );
        assert.equal(readCubeBinary(nativeBytes).dimension, input.length);
      }
      const nativeArray: PostgreSqlArray<number> = {
        dimensions: [
          { lowerBound: -1, length: 2 },
          { lowerBound: 2, length: 2 },
        ],
        values: [
          [1, 2],
          [3, 4],
        ],
      };
      const actual = await connection.transaction((db) =>
        db.select({ value: api.fromArray(nativeArray) }).from(sql`(values (1)) fixture(id)`),
      );
      assert.deepEqual(
        actual[0]!.value,
        await nativeCube(client, `${cubeNamespace}.cube(array[[1,2],[3,4]]::float8[])`),
      );
      const reverse = await connection.transaction((db) =>
        db
          .select({
            value: api.fromArrays(
              { dimensions: [{ lowerBound: 1, length: 2 }], values: [3, 4] },
              { dimensions: [{ lowerBound: 1, length: 2 }], values: [1, 2] },
            ),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      assert.deepEqual(
        reverse[0]!.value,
        await nativeCube(client, `${cubeNamespace}.cube(array[3,4]::float8[],array[1,2]::float8[])`),
      );
    }, cubeBinaryProofCase.id);
  });
});

extensionProofTest(
  cubeSchemaIndexProofCase,
  async () => {
    await proveCubeCaseMembers(cubeSchemaIndexProofCase, async () => {
      await withCubeApi(async ({ client, connection, api }) => {
        const table = cubeManaged.tables.entries;
        const array: PostgreSqlArray<CubeValue> = {
          dimensions: [
            { lowerBound: -2, length: 2 },
            { lowerBound: 3, length: 2 },
          ],
          values: [
            [cubePoint([1, 2]), null],
            [cubeBox([1], [3]), cubePoint([])],
          ],
        };
        await connection.transaction((db) =>
          db.insert(table).values([
            { value: cubePoint([1, 2]), tags: array },
            { value: null, tags: null },
          ]),
        );
        const rows = await connection.transaction((db) =>
          db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table).orderBy(table._id),
        );
        assert.deepEqual(rows.find((row) => row.value !== null)?.tags, array);
        assert.deepEqual(rows.find((row) => row.value === null)?.tags, null);
        assert(rows.every((row) => JSON.stringify(row.fallback) === JSON.stringify(cubePoint([7]))));
        const native = (
          await client.query(
            `select pg_catalog.array_dims(tags) bounds,pg_catalog.cardinality(tags) cardinality,${cubeNamespace}.cube_send(value) bytes from app.entries where value is not null`,
          )
        ).rows[0]!;
        assert.equal(native.bounds, "[-2:-1][3:4]");
        assert.equal(native.cardinality, 4);
        assert.deepEqual(readCubeBinary(native.bytes).lower, [1, 2]);
        const desired = await createSnapshot(cubeManaged);
        const observed = await inspectSnapshot(connection.db, "app");
        assert.deepEqual(observed, desired);
        assert.equal(snapshotHash(observed), snapshotHash(desired));
        const classes = await client.query(
          `select am.amname,c.opcname,n.nspname from pg_index i join pg_class t on t.oid=i.indrelid join pg_opclass c on c.oid=i.indclass[0] join pg_namespace n on n.oid=c.opcnamespace join pg_am am on am.oid=c.opcmethod where t.oid='app.entries'::regclass and n.nspname=$1 order by am.amname`,
          [api.schema],
        );
        assert.deepEqual(classes.rows, [
          { amname: "btree", opcname: "cube_ops", nspname: api.schema },
          { amname: "gist", opcname: "gist_cube_ops", nspname: api.schema },
        ]);
        // Enough rows cause GiST split/union/penalty callbacks, including KNN distance strategies.
        await client.query(
          `insert into app.entries(_id,value) select pg_catalog.gen_random_uuid(),${cubeNamespace}.cube(array[x,x+1]::float8[]) from generate_series(1,1500) x`,
        );
        await client.query("analyze app.entries");
        for (const operator of ["=", "&&", "@>", "<@", "<", "<=", ">", ">="]) {
          const query = `select _id from app.entries where value operator(${cubeNamespace}.${operator}) ${cubeNamespace}.cube(array[1,2]::float8[]) order by _id`;
          await client.query("begin; set local enable_seqscan=off");
          try {
            assert.match(
              (await client.query(`explain ${query}`)).rows.map((row) => row["QUERY PLAN"]).join("\n"),
              /Index|Bitmap/,
            );
            const indexed = (await client.query(query)).rows;
            await client.query(
              "set local enable_indexscan=off; set local enable_bitmapscan=off; set local enable_seqscan=on",
            );
            assert.deepEqual(indexed, (await client.query(query)).rows, operator);
          } finally {
            await client.query("rollback");
          }
        }
        for (const operator of ["<->", "<#>", "<=>", "~>"]) {
          const right = operator === "~>" ? "1" : `${cubeNamespace}.cube(array[0,0]::float8[])`;
          const query = `select value operator(${cubeNamespace}.${operator}) ${right} distance from app.entries where value is not null order by distance limit 10`;
          // A bitmap scan followed by a sort does not exercise the GiST KNN callback.
          await client.query("begin; set local enable_seqscan=off; set local enable_bitmapscan=off");
          try {
            assert.match(
              (await client.query(`explain ${query}`)).rows.map((row) => row["QUERY PLAN"]).join("\n"),
              /Order By:/,
            );
            const indexed = (await client.query(query)).rows;
            await client.query(
              "set local enable_indexscan=off; set local enable_bitmapscan=off; set local enable_seqscan=on",
            );
            assert.deepEqual(indexed, (await client.query(query)).rows, operator);
          } finally {
            await client.query("rollback");
          }
        }
      }, cubeSchemaIndexProofCase.id);
    });
  },
  120000,
);

extensionProofTest(cubeCompositionProofCase, async () => {
  await withCubeApi(async ({ client, connection, api }) => {
    const table = cubeManaged.tables.entries;
    const dims = [{ lowerBound: 1, length: 1 }];
    for (const bad of [
      api.fromArray({ dimensions: dims, values: [null] }),
      api.fromArrays({ dimensions: dims, values: [1] }, { dimensions: [{ lowerBound: 1, length: 2 }], values: [1, 2] }),
      api.subset(cubePoint([1]), { dimensions: dims, values: [2] }),
    ]) {
      await assert.rejects(
        connection.transaction(async (db) => {
          await db.insert(table).values({ value: cubePoint([99]) });
          await db.select({ value: bad }).from(sql`(values (1)) fixture(id)`);
        }),
      );
      assert.equal((await client.query("select count(*)::int count from app.entries")).rows[0]!.count, 0);
    }
    await assert.rejects(client.query(`select ${cubeNamespace}.cube(array[NULL]::float8[])`), {
      code: "2202E",
    });
    const subquery = connection.db
      .select({ value: api.fromInterval(3, 1).as('cube"alias') })
      .from(sql`(values (1)) fixture(id)`)
      .as('subquery"日本');
    const composed = await connection.transaction((db) =>
      db
        .select({
          distance: api.distance(subquery.value, cubePoint([2])),
          point: api.isPoint(api.fromNumber(1).as('point"alias')),
        })
        .from(subquery),
    );
    assert.deepEqual(composed, [{ distance: 0, point: true }]);
  }, cubeCompositionProofCase.id);
});

async function proveCubeCaseMembers(definition: ExtensionProofCase, work: () => Promise<void>): Promise<void> {
  const prove = async (index: number): Promise<void> => {
    const claim = definition.claims[index];
    if (!claim) return work();
    await extensionProofWitness({ ...claim, schema: cubeProofSchema }, () => prove(index + 1));
  };
  await prove(0);
}
