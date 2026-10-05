import { expect } from "bun:test";
import assert from "node:assert/strict";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";
import {
  createH3_4_2_3,
  h3Index,
  type H3LatLng,
  type H3Polygon,
} from "../../../apps/loom/src/core/extensions/adapters/h3";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { evaluateSnapshot, captureSnapshotRevisions } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  h3GeometryProofCase,
  h3GeometryProofClaims,
  h3LiveProofCase,
  h3ProofFamily,
  h3ProofSchema,
  h3SearchPathProofCase,
  h3SearchPathProofClaims,
  h3StorageProofCase,
  h3StorageProofClaims,
  h3ValueProofCase,
  h3ValueProofClaims,
} from "../fixtures/h3-proof-cases";

const api = createH3_4_2_3({
  name: "h3",
  version: "4.2.3",
  schema: h3ProofSchema,
  apiSupport: { status: "verified", digest: h3ProofFamily.manifestDigest },
});
const ns = pg.escapeIdentifier(h3ProofSchema);
const managed = defineSchema(
  () => ({
    cells: defineTable(
      { b: api.field(), h: api.field(), r: api.field(), s: api.field(), ring: api.arrayField() },
      {
        indexes: [
          { fields: ["b"], extension: api.indexes.btree() },
          { fields: ["h"], extension: api.indexes.hash() },
          { fields: ["r"], extension: api.indexes.brin() },
          { fields: ["s"], extension: api.indexes.spgist() },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
const relations = defineRelations(managed.tables);
type Connection = DatabaseConnection<typeof relations>;

const cell = h3Index("8928308280fffff");
const neighbor = h3Index("8928308280bffff");
const parent5 = h3Index("85283083fffffff");
const pentagon = h3Index("8009fffffffffff");
const point = { lng: -122.4089866999972, lat: 37.81331899998324 };
const farPoint = { lng: 2.3522, lat: 48.8566 };
const square: H3Polygon = [
  { lng: -122.4089, lat: 37.8133 },
  { lng: -122.4089, lat: 37.8033 },
  { lng: -122.3989, lat: 37.8033 },
  { lng: -122.3989, lat: 37.8133 },
];
const hole: H3Polygon = [
  { lng: -122.405, lat: 37.81 },
  { lng: -122.405, lat: 37.806 },
  { lng: -122.401, lat: 37.806 },
];
const cells = { dimensions: [{ lowerBound: 1, length: 2 }], values: [cell, neighbor] };
const literal = (value: string) => `${ns}.h3index '${value}'`;
const C = literal(cell),
  N = literal(neighbor),
  P5 = literal(parent5);
const pointSql = (value: { readonly lng: number; readonly lat: number }) => `point(${value.lng},${value.lat})`;
const squareSql = `polygon '((-122.4089,37.8133),(-122.4089,37.8033),(-122.3989,37.8033),(-122.3989,37.8133))'`;
const holesSql = `array[polygon '((-122.405,37.81),(-122.405,37.806),(-122.401,37.806))']`;
const cellsSql = `array[${C},${N}]`;

// Independent readers of PostgreSQL's own ::text output; they share nothing with the adapter's codecs.
type NativeValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | readonly NativeValue[]
  | { readonly [key: string]: NativeValue };
type Reader = (text: string) => NativeValue;
const float: Reader = (text) =>
  text === "NaN" || text === "Infinity" || text === "-Infinity" ? { nonfinite: text } : Number(text);
const pairs = (text: string) =>
  [...text.matchAll(/\(([^(),]+),([^(),]+)\)/g)].map((match): [string, string] => [match[1] ?? "", match[2] ?? ""]);
const read = {
  h3: (text: string) => text,
  bool: (text: string) => text === "true",
  int4: (text: string) => Number(text),
  int8: (text: string) => BigInt(text),
  float8: float,
  text: (text: string) => text,
  bytea: (text: string) => ({ hex: text.slice(2) }),
  latLng: (text: string) => pairs(text).map(([x, y]) => ({ lng: float(x), lat: float(y) }))[0],
  ij: (text: string) => pairs(text).map(([x, y]) => ({ i: Number(x), j: Number(y) }))[0],
  polygon: (text: string) => pairs(text).map(([x, y]) => ({ lng: float(x), lat: float(y) })),
  latFirst: (text: string) => pairs(text).map(([x, y]) => ({ lng: float(y), lat: float(x) })),
  faces: (text: string) => {
    const values = text.slice(1, -1).split(",").filter(Boolean).map(Number);
    return { dimensions: values.length ? [{ lowerBound: 1, length: values.length }] : [], values };
  },
  diskDistance: (text: string) => {
    const [index, distance] = text.slice(1, -1).split(",");
    return { index, distance: Number(distance) };
  },
  edgeCells: (text: string) => {
    const [origin, destination] = text.slice(1, -1).split(",");
    return { origin, destination };
  },
} satisfies Record<string, Reader>;
const nullable = (reader: Reader) => (text: string | null) => (text === null ? null : reader(text));

interface Check {
  readonly expression: SQL;
  readonly native: string;
  readonly read: Reader;
  readonly member?: string;
}
async function compare(connection: Connection, client: pg.Client, check: Check) {
  if (check.member) assert.equal(extensionExpressionContract(check.expression)?.member, check.member);
  const actual = (await connection.transaction((db) => db.select({ value: check.expression }).from(sql`h3_one`))).map(
    (row) => row.value,
  );
  const native = (
    await client.query<{ value: string | null }>(`select (${check.native})::text as value from h3_one`)
  ).rows.map((row) => nullable(check.read)(row.value));
  assert.deepEqual(actual, native, check.native);
  return actual;
}

async function withH3(
  caseId: string,
  work: (fixture: { client: pg.Client; connection: Connection }) => Promise<void>,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const server = await client.query("select current_setting('server_version_num')::int version");
      assert.equal(Math.floor(server.rows[0].version / 10000), 18);
      const available = await client.query(
        "select 1 from pg_available_extension_versions where name='h3' and version='4.2.3'",
      );
      assert.notEqual(available.rowCount, 0, "The PostgreSQL 18 fixture must include the h3 4.2.3 binary");
      await client.query(`create schema ${ns}; create extension h3 with schema ${ns} version '4.2.3'`);
      // Exact selected identity: the fixture's live catalog must hash to the pinned manifest.
      const captured = await captureExtensionContract(client, {
        name: "h3",
        provider: "neon",
        fixture: "extension-semantic-proof",
      });
      assert.equal(captured.digest, h3ProofFamily.manifestDigest);
      assert.equal(captured.contract.members.length, 134);
      await observeExtensionProofDatabase(url, caseId, "h3");
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(managed)))
        await client.query(statement);
      await client.query("create table h3_one(id int primary key); insert into h3_one values (1)");
      const connection = await connectDatabase({ schema: managed, relations, connectionString: url });
      try {
        await work({ client, connection });
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
}

const ops = ["=", "<>", "<", "<=", ">", ">=", "<->", "&&", "@>", "<@"] as const;
const opClaims = {
  "=": "equal",
  "<>": "notEqual",
  "<": "lessThan",
  "<=": "lessOrEqual",
  ">": "greaterThan",
  ">=": "greaterOrEqual",
  "<->": "distance",
  "&&": "overlaps",
  "@>": "contains",
  "<@": "containedBy",
} as const;
// The sign bit is set (high value), so signed int8 order and the unsigned operators disagree on this pair.
const high = h3Index("ffffffffffffffff");
const operandPairs = [
  [cell, neighbor],
  [cell, cell],
  [parent5, cell],
  [cell, parent5],
  [cell, high],
] as const;

extensionProofTest(
  h3ValueProofCase,
  async () => {
    await withH3(h3ValueProofCase.id, async ({ client, connection }) => {
      const f = api.sql.functions;
      const witness = async (claim: (typeof h3ValueProofClaims)[keyof typeof h3ValueProofClaims], checks: Check[], extra?: () => Promise<void>) =>
        extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          for (const check of checks) await compare(connection, client, check);
          await extra?.();
        });
      await witness(h3ValueProofClaims.scalar, [], async () => {
        // Native h3index_in/h3index_out: case, leading zeros and the full unsigned range normalize identically.
        for (const text of ["8928308280FFFFF", "08928308280fffff", "0", "ffffffffffffffff", "2222597fffffffff"]) {
          const native = await client.query<{ value: string }>(`select $1::${ns}.h3index::text as value`, [text]);
          assert.equal(h3Index(text), native.rows[0]!.value);
          const [row] = await connection.transaction((db) =>
            db.select({ value: api.sql.casts.int8_to_h3index(api.sql.casts.h3index_to_int8(text)) }).from(sql`h3_one`),
          );
          assert.equal(row!.value, native.rows[0]!.value);
        }
      });
      await witness(h3ValueProofClaims.send, [
        { expression: f.h3index_send(cell), native: `${ns}.h3index_send(${C})`, read: read.bytea },
      ]);
      await witness(h3ValueProofClaims.receive, [], async () => {
        // node-postgres sends Buffer parameters in binary format, so PostgreSQL decodes this through h3index_recv.
        const bytes = Buffer.from("08928308280fffff", "hex");
        const received = await client.query<{ value: string }>(`select $1::${ns}.h3index::text as value`, [bytes]);
        assert.equal(received.rows[0]!.value, cell);
      });
      await witness(h3ValueProofClaims.toBigint, [
        { expression: f.h3index_to_bigint(cell), native: `${ns}.h3index_to_bigint(${C})`, read: read.int8 },
        { expression: f.h3index_to_bigint(high), native: `${ns}.h3index_to_bigint(${literal(high)})`, read: read.int8 },
      ]);
      await witness(h3ValueProofClaims.fromBigint, [
        { expression: f.bigint_to_h3index(-1n), native: `${ns}.bigint_to_h3index(-1)`, read: read.h3 },
        { expression: f.bigint_to_h3index(617700169958293503n), native: `${ns}.bigint_to_h3index(617700169958293503)`, read: read.h3 },
      ]);
      await witness(h3ValueProofClaims.castToBigint, [
        { expression: api.sql.casts.h3index_to_int8(cell), native: `(${C})::int8`, read: read.int8, member: `cast:$extension:h3.h3index->pg_catalog.int8` },
      ]);
      await witness(h3ValueProofClaims.castFromBigint, [
        { expression: api.sql.casts.int8_to_h3index(-2n), native: `(-2::int8)::${ns}.h3index`, read: read.h3 },
      ]);
      await witness(h3ValueProofClaims.castToPoint, [
        { expression: api.sql.casts.h3index_to_point(cell), native: `(${C})::point`, read: read.latLng },
      ]);
      const pairChecks = (name: string, reader: Reader, call: (a: string | null, b: string) => SQL) =>
        operandPairs.map(([a, b]) => ({
          expression: call(a, b),
          native: `${ns}.${name}(${literal(a)},${literal(b)})`,
          read: reader,
        }));
      await witness(h3ValueProofClaims.compare, pairChecks("h3index_cmp", read.int4, f.h3index_cmp));
      // h3-pg hashes the 8 address bytes with hash_any; it is not hashint8-compatible.
      await witness(h3ValueProofClaims.hashFunction, [
        { expression: f.h3index_hash(cell), native: `${ns}.h3index_hash(${C})`, read: read.int4 },
        { expression: f.h3index_hash(high), native: `${ns}.h3index_hash(${literal(high)})`, read: read.int4 },
      ]);
      await witness(h3ValueProofClaims.hashExtended, [
        { expression: f.h3index_hash_extended(cell, 42n), native: `${ns}.h3index_hash_extended(${C}, 42)`, read: read.int8 },
      ]);
      const pairRoutines = [
        ["eq", "h3index_eq", f.h3index_eq],
        ["ne", "h3index_ne", f.h3index_ne],
        ["lt", "h3index_lt", f.h3index_lt],
        ["le", "h3index_le", f.h3index_le],
        ["gt", "h3index_gt", f.h3index_gt],
        ["ge", "h3index_ge", f.h3index_ge],
        ["distanceRoutine", "h3index_distance", f.h3index_distance],
        ["overlapsRoutine", "h3index_overlaps", f.h3index_overlaps],
        ["containsRoutine", "h3index_contains", f.h3index_contains],
        ["containedByRoutine", "h3index_contained_by", f.h3index_contained_by],
      ] as const;
      for (const [claim, routine, call] of pairRoutines)
        await witness(h3ValueProofClaims[claim], [
          ...pairChecks(routine, claim === "distanceRoutine" ? nullable(read.int8) : read.bool, call),
          { expression: call(null, cell), native: `${ns}.${routine}(null, ${C})`, read: read.bool },
        ]);
      for (const name of ops)
        await witness(
          h3ValueProofClaims[opClaims[name]],
          operandPairs.map(([a, b]) => ({
            expression: api.sql.operators[name](a, b),
            native: `${literal(a)} operator(${ns}.${name}) ${literal(b)}`,
            read: name === "<->" ? read.int8 : read.bool,
            member: `operator:$extension:h3.${name}($extension:h3.h3index,$extension:h3.h3index)`,
          })),
        );
      await witness(h3ValueProofClaims.extensionVersion, [
        { expression: api.extensionVersion(), native: `${ns}.h3_get_extension_version()`, read: read.text },
      ]);
      await witness(h3ValueProofClaims.migratePassByReference, [], async () => {
        // Captured, but deliberately not a query helper: it reinterprets its argument as a pointer during upgrades.
        assert.equal("h3_pg_migrate_pass_by_reference" in api.sql.functions, false);
        const routine = await client.query(
          `select 1 from pg_proc where pronamespace = $1::regnamespace and proname = 'h3_pg_migrate_pass_by_reference'`,
          [ns],
        );
        assert.equal(routine.rowCount, 1);
      });
    });
  },
  180000,
);

extensionProofTest(
  h3GeometryProofCase,
  async () => {
    await withH3(h3GeometryProofCase.id, async ({ client, connection }) => {
      const f = api.sql.functions;
      const witness = async (claim: (typeof h3GeometryProofClaims)[keyof typeof h3GeometryProofClaims], checks: Check[], extra?: () => Promise<void>) =>
        extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          for (const check of checks) await compare(connection, client, check);
          await extra?.();
        });
      const strictError = async (expression: SQL) => {
        await Promise.resolve(
          expect(
            connection.transaction(async (db) => {
              await db.execute(sql`select set_config('h3.strict', 'on', true)`);
              await db.select({ value: expression }).from(sql`h3_one`);
            }),
          ).rejects.toThrow(),
        );
      };
      const outside: H3LatLng = { lng: 200, lat: 95 };
      await witness(
        h3GeometryProofClaims.latlngToCell,
        [{ expression: api.latLngToCell(point, 9), native: `${ns}.h3_latlng_to_cell(${pointSql(point)}, 9)`, read: read.h3 }],
        () => strictError(api.latLngToCell(outside, 9)),
      );
      await witness(
        h3GeometryProofClaims.latLngToCell,
        [{ expression: f.h3_lat_lng_to_cell(point, 9), native: `${ns}.h3_lat_lng_to_cell(${pointSql(point)}, 9)`, read: read.h3 }],
        () => strictError(f.h3_lat_lng_to_cell(outside, 9)),
      );
      await witness(h3GeometryProofClaims.cellToLatlng, [
        { expression: api.cellToLatLng(cell), native: `${ns}.h3_cell_to_latlng(${C})`, read: read.latLng },
      ]);
      await witness(h3GeometryProofClaims.cellToLatLng, [
        { expression: f.h3_cell_to_lat_lng(cell), native: `${ns}.h3_cell_to_lat_lng(${C})`, read: read.latLng },
      ]);
      const antimeridian = h3Index("827eb7fffffffff");
      const A = literal(antimeridian);
      await witness(
        h3GeometryProofClaims.cellToBoundary,
        [{ expression: api.cellToBoundary(cell), native: `${ns}.h3_cell_to_boundary(${C})`, read: read.polygon }],
        async () => {
          // h3.extend_antimeridian changes the native output of the GUC-dependent overload within the same session.
          for (const setting of ["off", "on"]) {
            const [row] = await connection.transaction(async (db) => {
              await db.execute(sql`select set_config('h3.extend_antimeridian', ${setting}, true)`);
              return db.select({ value: api.cellToBoundary(antimeridian) }).from(sql`h3_one`);
            });
            await client.query("select set_config('h3.extend_antimeridian', $1, false)", [setting]);
            const native = await client.query<{ value: string }>(`select ${ns}.h3_cell_to_boundary(${A})::text as value`);
            await client.query("reset h3.extend_antimeridian");
            assert.deepEqual(row!.value, read.polygon(native.rows[0]!.value));
            const longitudes = (row?.value ?? []).map((vertex) => vertex.lng);
            assert.equal(longitudes.some((lng) => v.is(v.pipe(v.number(), v.minValue(180.000001)), lng)), setting === "on");
          }
        },
      );
      await witness(h3GeometryProofClaims.cellToBoundaryFlag, [
        { expression: api.cellToBoundary(antimeridian, true), native: `${ns}.h3_cell_to_boundary(${A}, true)`, read: read.polygon },
        { expression: api.cellToBoundary(antimeridian, false), native: `${ns}.h3_cell_to_boundary(${A}, false)`, read: read.polygon },
      ]);
      const unary = (name: string, reader: Reader, call: (value: string | null) => SQL, values = [cell, pentagon]) => [
        ...values.map((value) => ({ expression: call(value), native: `${ns}.${name}(${literal(value)})`, read: reader })),
        { expression: call(null), native: `${ns}.${name}(null)`, read: reader },
      ];
      await witness(h3GeometryProofClaims.getResolution, unary("h3_get_resolution", read.int4, f.h3_get_resolution));
      await witness(h3GeometryProofClaims.getBaseCellNumber, unary("h3_get_base_cell_number", read.int4, f.h3_get_base_cell_number));
      await witness(h3GeometryProofClaims.isValidCell, unary("h3_is_valid_cell", read.bool, f.h3_is_valid_cell, [cell, high]));
      await witness(h3GeometryProofClaims.isResClassIii, unary("h3_is_res_class_iii", read.bool, f.h3_is_res_class_iii));
      await witness(h3GeometryProofClaims.isPentagon, unary("h3_is_pentagon", read.bool, f.h3_is_pentagon));
      await witness(h3GeometryProofClaims.getIcosahedronFaces, unary("h3_get_icosahedron_faces", read.faces, f.h3_get_icosahedron_faces));
      await witness(h3GeometryProofClaims.gridDisk, [
        { expression: api.gridDisk(cell), native: `${ns}.h3_grid_disk(${C})`, read: read.h3 },
        { expression: api.gridDisk(cell, 2), native: `${ns}.h3_grid_disk(${C}, 2)`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.gridDiskDistances, [
        { expression: api.gridDiskDistances(cell), native: `${ns}.h3_grid_disk_distances(${C})`, read: read.diskDistance },
        { expression: api.gridDiskDistances(cell, 2), native: `${ns}.h3_grid_disk_distances(${C}, 2)`, read: read.diskDistance },
      ]);
      await witness(h3GeometryProofClaims.gridRingUnsafe, [
        { expression: api.gridRingUnsafe(cell), native: `${ns}.h3_grid_ring_unsafe(${C})`, read: read.h3 },
        { expression: api.gridRingUnsafe(cell, 2), native: `${ns}.h3_grid_ring_unsafe(${C}, 2)`, read: read.h3 },
      ]);
      const far = h3Index("8928308287bffff");
      await witness(h3GeometryProofClaims.gridPathCells, [
        { expression: api.gridPathCells(cell, far), native: `${ns}.h3_grid_path_cells(${C}, ${literal(far)})`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.gridDistance, [
        { expression: api.gridDistance(cell, far), native: `${ns}.h3_grid_distance(${C}, ${literal(far)})`, read: read.int8 },
      ]);
      await witness(h3GeometryProofClaims.cellToLocalIj, [
        { expression: api.cellToLocalIj(cell, neighbor), native: `${ns}.h3_cell_to_local_ij(${C}, ${N})`, read: read.ij },
      ]);
      const [ij] = await connection.transaction((db) =>
        db.select({ value: api.cellToLocalIj(cell, neighbor) }).from(sql`h3_one`),
      );
      await witness(h3GeometryProofClaims.localIjToCell, [
        { expression: api.localIjToCell(cell, ij!.value!), native: `${ns}.h3_local_ij_to_cell(${C}, point(${ij!.value!.i},${ij!.value!.j}))`, read: read.h3 },
      ], async () => {
        const [row] = await connection.transaction((db) =>
          db.select({ value: api.localIjToCell(cell, ij!.value!) }).from(sql`h3_one`),
        );
        assert.equal(row!.value, neighbor);
      });
      await witness(h3GeometryProofClaims.cellToParent, [
        { expression: api.cellToParent(cell), native: `${ns}.h3_cell_to_parent(${C})`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.cellToParentResolution, [
        { expression: api.cellToParent(cell, 5), native: `${ns}.h3_cell_to_parent(${C}, 5)`, read: read.h3 },
      ], async () => {
        // A finer "parent" resolution is H3 error 12 (E_RES_MISMATCH), raised natively rather than returned as NULL.
        await assert.rejects(client.query(`select ${ns}.h3_cell_to_parent(${C}, 10)`), /error code: 12/);
        await assert.rejects(connection.transaction((db) => db.select({ value: api.cellToParent(cell, 10) }).from(sql`h3_one`)));
      });
      await witness(h3GeometryProofClaims.cellToChildren, [
        { expression: api.cellToChildren(cell), native: `${ns}.h3_cell_to_children(${C})`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.cellToChildrenResolution, [
        { expression: api.cellToChildren(cell, 11), native: `${ns}.h3_cell_to_children(${C}, 11)`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.cellToCenterChild, [
        { expression: api.cellToCenterChild(cell), native: `${ns}.h3_cell_to_center_child(${C})`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.cellToCenterChildResolution, [
        { expression: api.cellToCenterChild(cell, 12), native: `${ns}.h3_cell_to_center_child(${C}, 12)`, read: read.h3 },
      ]);
      const children = { dimensions: [{ lowerBound: 1, length: 1 }], values: [cell] };
      await witness(h3GeometryProofClaims.compactCells, [
        { expression: api.compactCells(cells), native: `${ns}.h3_compact_cells(${cellsSql})`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.uncompactCells, [
        { expression: api.uncompactCells(children), native: `${ns}.h3_uncompact_cells(array[${C}])`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.uncompactCellsResolution, [
        { expression: api.uncompactCells(children, 10), native: `${ns}.h3_uncompact_cells(array[${C}], 10)`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.cellToChildPos, [
        { expression: api.cellToChildPos(cell, 5), native: `${ns}.h3_cell_to_child_pos(${C}, 5)`, read: read.int8 },
      ]);
      await witness(h3GeometryProofClaims.childPosToCell, [
        { expression: api.childPosToCell(1234n, parent5, 9), native: `${ns}.h3_child_pos_to_cell(1234, ${P5}, 9)`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.polygonToCells, [
        { expression: api.polygonToCells(square, null, 9), native: `${ns}.h3_polygon_to_cells(${squareSql}, null, 9)`, read: read.h3 },
        { expression: api.polygonToCells(square, { dimensions: [{ lowerBound: 1, length: 1 }], values: [hole] }, 10), native: `${ns}.h3_polygon_to_cells(${squareSql}, ${holesSql}, 10)`, read: read.h3 },
        { expression: api.polygonToCells(square, null), native: `${ns}.h3_polygon_to_cells(${squareSql}, null)`, read: read.h3 },
      ], async () => {
        // Not strict, but a NULL exterior is rejected by the C binding rather than yielding no rows.
        await assert.rejects(client.query(`select ${ns}.h3_polygon_to_cells(null, null, 9)`), /No polygon given to polyfill/);
        await assert.rejects(
          connection.transaction((db) => db.select({ value: api.polygonToCells(null, null, 9) }).from(sql`h3_one`)),
        );
      });
      await witness(h3GeometryProofClaims.polygonToCellsExperimental, [
        ...(["center", "full", "overlapping", "overlapping_bbox"] as const).map((mode) => ({
          expression: api.polygonToCellsExperimental(square, null, 9, mode),
          native: `${ns}.h3_polygon_to_cells_experimental(${squareSql}, null, 9, '${mode}')`,
          read: read.h3,
        })),
        { expression: api.polygonToCellsExperimental(square, null, 9), native: `${ns}.h3_polygon_to_cells_experimental(${squareSql}, null, 9)`, read: read.h3 },
        { expression: api.polygonToCellsExperimental(square, null), native: `${ns}.h3_polygon_to_cells_experimental(${squareSql}, null)`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.cellsToMultiPolygon, [], async () => {
        const actual = await connection.transaction((db) =>
          db.select({ value: api.cellsToMultiPolygon(cells) }).from(sql`h3_one`),
        );
        const native = await client.query<{ exterior: string; holes: string }>(
          `select (r).exterior::text exterior, (r).holes::text holes from (select ${ns}.h3_cells_to_multi_polygon(${cellsSql}) r) s`,
        );
        assert.deepEqual(
          actual.map((row) => row.value),
          native.rows.map((row) => {
            const loops = [...row.holes.matchAll(/"([^"]*)"/g)].map((match) => read.polygon(match[1]!));
            return {
              exterior: read.polygon(row.exterior),
              holes: { dimensions: loops.length ? [{ lowerBound: 1, length: loops.length }] : [], values: loops },
            };
          }),
        );
      });
      const edge = h3Index("11928308280fffff");
      const E = literal(edge);
      await witness(h3GeometryProofClaims.areNeighborCells, [
        { expression: api.areNeighborCells(cell, neighbor), native: `${ns}.h3_are_neighbor_cells(${C}, ${N})`, read: read.bool },
        { expression: api.areNeighborCells(cell, far), native: `${ns}.h3_are_neighbor_cells(${C}, ${literal(far)})`, read: read.bool },
      ]);
      await witness(h3GeometryProofClaims.cellsToDirectedEdge, [
        { expression: api.cellsToDirectedEdge(cell, neighbor), native: `${ns}.h3_cells_to_directed_edge(${C}, ${N})`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.isValidDirectedEdge, [
        { expression: api.isValidDirectedEdge(edge), native: `${ns}.h3_is_valid_directed_edge(${E})`, read: read.bool },
        { expression: api.isValidDirectedEdge(cell), native: `${ns}.h3_is_valid_directed_edge(${C})`, read: read.bool },
      ]);
      await witness(h3GeometryProofClaims.getDirectedEdgeOrigin, [
        { expression: api.getDirectedEdgeOrigin(edge), native: `${ns}.h3_get_directed_edge_origin(${E})`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.getDirectedEdgeDestination, [
        { expression: api.getDirectedEdgeDestination(edge), native: `${ns}.h3_get_directed_edge_destination(${E})`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.directedEdgeToCells, [
        { expression: api.directedEdgeToCells(edge), native: `${ns}.h3_directed_edge_to_cells(${E})`, read: read.edgeCells },
      ]);
      await witness(h3GeometryProofClaims.originToDirectedEdges, [
        { expression: api.originToDirectedEdges(cell), native: `${ns}.h3_origin_to_directed_edges(${C})`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.directedEdgeToBoundary, [
        { expression: api.directedEdgeToBoundary(edge), native: `${ns}.h3_directed_edge_to_boundary(${E})`, read: read.latFirst },
      ], async () => {
        // Same edge vertexes as the origin's cell boundary, proving the native x/y swap is read back as {lng, lat}.
        const [row] = await connection.transaction((db) =>
          db.select({ edge: api.directedEdgeToBoundary(edge), cell: api.cellToBoundary(cell, false) }).from(sql`h3_one`),
        );
        for (const vertex of row!.edge!) assert(row!.cell!.some((corner) => corner.lng === vertex.lng && corner.lat === vertex.lat));
      });
      await witness(h3GeometryProofClaims.cellToVertex, [
        { expression: api.cellToVertex(cell, 0), native: `${ns}.h3_cell_to_vertex(${C}, 0)`, read: read.h3 },
      ]);
      await witness(h3GeometryProofClaims.cellToVertexes, [
        { expression: api.cellToVertexes(cell), native: `${ns}.h3_cell_to_vertexes(${C})`, read: read.h3 },
      ]);
      const vertex = `${ns}.h3_cell_to_vertex(${C}, 0)`;
      const [vertexRow] = await connection.transaction((db) =>
        db.select({ value: api.cellToVertex(cell, 0) }).from(sql`h3_one`),
      );
      const V = vertexRow!.value!;
      await witness(h3GeometryProofClaims.vertexToLatlng, [
        { expression: api.vertexToLatLng(V), native: `${ns}.h3_vertex_to_latlng(${vertex})`, read: read.latLng },
      ]);
      await witness(h3GeometryProofClaims.vertexToLatLng, [
        { expression: f.h3_vertex_to_lat_lng(V), native: `${ns}.h3_vertex_to_lat_lng(${vertex})`, read: read.latLng },
      ]);
      await witness(h3GeometryProofClaims.isValidVertex, [
        { expression: api.isValidVertex(V), native: `${ns}.h3_is_valid_vertex(${vertex})`, read: read.bool },
        { expression: api.isValidVertex(cell), native: `${ns}.h3_is_valid_vertex(${C})`, read: read.bool },
      ]);
      const units = <Unit extends string>(units: readonly Unit[], call: (unit?: Unit) => SQL, native: (unit?: string) => string) => [
        { expression: call(), native: native(), read: read.float8 },
        ...units.map((unit) => ({ expression: call(unit), native: native(unit), read: read.float8 })),
      ];
      const u = (unit?: string) => (unit ? `, '${unit}'` : "");
      await witness(h3GeometryProofClaims.greatCircleDistance, units(["km", "m", "rads"] as const, (unit) => api.greatCircleDistance(point, farPoint, unit), (unit) => `${ns}.h3_great_circle_distance(${pointSql(point)}, ${pointSql(farPoint)}${u(unit)})`));
      await witness(h3GeometryProofClaims.getHexagonAreaAvg, units(["km", "m"] as const, (unit) => api.getHexagonAreaAvg(9, unit), (unit) => `${ns}.h3_get_hexagon_area_avg(9${u(unit)})`));
      await witness(h3GeometryProofClaims.cellArea, units(["km^2", "m^2", "rads^2"] as const, (unit) => api.cellArea(cell, unit), (unit) => `${ns}.h3_cell_area(${C}${u(unit)})`));
      await witness(h3GeometryProofClaims.getHexagonEdgeLengthAvg, units(["km", "m"] as const, (unit) => api.getHexagonEdgeLengthAvg(9, unit), (unit) => `${ns}.h3_get_hexagon_edge_length_avg(9${u(unit)})`));
      await witness(h3GeometryProofClaims.edgeLength, units(["km", "m", "rads"] as const, (unit) => api.edgeLength(edge, unit), (unit) => `${ns}.h3_edge_length(${E}${u(unit)})`));
      await witness(h3GeometryProofClaims.getNumCells, [
        { expression: api.getNumCells(15), native: `${ns}.h3_get_num_cells(15)`, read: read.int8 },
      ]);
      await witness(h3GeometryProofClaims.getRes0Cells, [
        { expression: api.getRes0Cells(), native: `${ns}.h3_get_res_0_cells()`, read: read.h3 },
      ], async () => {
        const rows = await connection.transaction((db) => db.select({ value: api.getRes0Cells() }).from(sql`h3_one`));
        assert.equal(rows.length, 122);
      });
      await witness(h3GeometryProofClaims.getPentagons, [
        { expression: api.getPentagons(5), native: `${ns}.h3_get_pentagons(5)`, read: read.h3 },
      ], async () => {
        const rows = await connection.transaction((db) => db.select({ value: api.getPentagons(5) }).from(sql`h3_one`));
        assert.equal(rows.length, 12);
      });
    });
  },
  180000,
);

extensionProofTest(
  h3SearchPathProofCase,
  async () => {
    await withH3(h3SearchPathProofCase.id, async ({ client, connection }) => {
      const f = api.sql.functions;
      const checks = {
        cellToChildrenSlow: [{ expression: f.h3_cell_to_children_slow.adjacent(cell), native: `${ns}.h3_cell_to_children_slow(${C})`, fast: `${ns}.h3_cell_to_children(${C})` }],
        cellToChildrenSlowResolution: [{ expression: f.h3_cell_to_children_slow.resolution(cell, 11), native: `${ns}.h3_cell_to_children_slow(${C}, 11)`, fast: `${ns}.h3_cell_to_children(${C}, 11)` }],
        childrenAux: [{ expression: f.__h3_cell_to_children_aux(cell, 10, -1), native: `${ns}.__h3_cell_to_children_aux(${C}, 10, -1)`, fast: `${ns}.h3_cell_to_children(${C}, 10)` }],
      } as const;
      for (const key of ["cellToChildrenSlow", "cellToChildrenSlowResolution", "childrenAux"] as const) {
        const list = checks[key];
        await extensionProofWitness({ ...h3SearchPathProofClaims[key], schema: api.schema }, async () => {
          for (const check of list) {
            // Without the extension schema on search_path the SQL/PL wrappers cannot resolve their helper.
            await client.query("set search_path to public");
            await assert.rejects(client.query(`select (${check.native})::text from h3_one`));
            await Promise.resolve(
              expect(
                connection.transaction(async (db) => {
                  await db.execute(sql`select set_config('search_path', 'public', true)`);
                  await db.select({ value: check.expression }).from(sql`h3_one`);
                }),
              ).rejects.toThrow(),
            );
            await client.query(`set search_path to ${ns}, public`);
            const native = (await client.query<{ value: string }>(`select (${check.native})::text as value from h3_one`)).rows.map((row) => row.value ?? "").sort((a, b) => a.localeCompare(b));
            const fast = (await client.query<{ value: string }>(`select (${check.fast})::text as value`)).rows.map((row) => row.value ?? "").sort((a, b) => a.localeCompare(b));
            await client.query("reset search_path");
            const actual = await connection.transaction(async (db) => {
              await db.execute(sql`select set_config('search_path', ${`${ns}, public`}, true)`);
              return db.select({ value: check.expression }).from(sql`h3_one`);
            });
            assert.deepEqual(actual.map((row) => row.value ?? "").sort((a, b) => a.localeCompare(b)), native);
            assert.deepEqual(native, fast);
          }
        });
      }
    });
  },
  180000,
);

extensionProofTest(
  h3StorageProofCase,
  async () => {
    await withH3(h3StorageProofCase.id, async ({ client, connection }) => {
      const table = managed.tables.cells;
      const rows = (
        await client.query<{ value: string }>(`select (${ns}.h3_cell_to_children(${P5}, 7))::text as value`)
      ).rows.map((row) => h3Index(row.value));
      await connection.transaction((db) => db.insert(table).values(rows.map((value) => ({ b: value, h: value, r: value, s: value }))));
      await extensionProofWitness({ ...h3StorageProofClaims.array, schema: api.schema }, async () => {
        const ring = { dimensions: [{ lowerBound: -2, length: 3 }], values: [cell, null, high] };
        await connection.transaction((db) => db.insert(table).values({ ring }));
        const native = await client.query<{ value: string }>("select ring::text as value from app.cells where ring is not null");
        assert.equal(native.rows[0]!.value, `[-2:0]={${cell},NULL,${high}}`);
        const [row] = await connection.transaction((db) =>
          db.select({ ring: table.ring }).from(table).where(sql`${table.ring} is not null`),
        );
        assert.deepEqual(row!.ring, ring);
      });
      const plan = async (query: string) => {
        await client.query("set enable_seqscan = off");
        const explained = (await client.query<{ "QUERY PLAN": string }>(`explain ${query}`)).rows.map((row) => row["QUERY PLAN"]).join("\n");
        await client.query("reset enable_seqscan");
        return explained;
      };
      const indexName = async (method: string, column: string) => {
        const found = await client.query<{ name: string }>(
          `select c.relname as name from pg_index i join pg_class c on c.oid = i.indexrelid join pg_am a on a.oid = c.relam
           join pg_attribute t on t.attrelid = i.indrelid and t.attnum = i.indkey[0]
           where i.indrelid = 'app.cells'::regclass and a.amname = $1 and t.attname = $2`,
          [method, column],
        );
        assert.equal(found.rowCount, 1);
        return found.rows[0]!.name;
      };
      const scan = async (claim: (typeof h3StorageProofClaims)[keyof typeof h3StorageProofClaims], method: string, column: "b" | "h" | "r" | "s", where: (column: typeof table.b) => SQL, native: string) =>
        extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          const name = await indexName(method, column);
          const explained = await plan(`select ${column} from app.cells where ${native}`);
          assert(explained.includes(name), explained);
          const actual = await connection.transaction((db) => db.select({ value: table[column] }).from(table).where(where(table[column])));
          const expected = await client.query<{ value: string }>(`select ${column}::text as value from app.cells where ${native}`);
          assert.deepEqual(actual.map((row) => row.value ?? "").sort((a, b) => a.localeCompare(b)), expected.rows.map((row) => row.value ?? "").sort((a, b) => a.localeCompare(b)));
          assert(actual.length > 0);
        });
      const first = rows[0]!;
      await scan(h3StorageProofClaims.btree, "btree", "b", (column) => api.lessOrEqual(column, first), `b operator(${ns}.<=) ${literal(first)}`);
      await scan(h3StorageProofClaims.hash, "hash", "h", (column) => api.equal(column, first), `h operator(${ns}.=) ${literal(first)}`);
      await scan(h3StorageProofClaims.brin, "brin", "r", (column) => api.greaterOrEqual(column, first), `r operator(${ns}.>=) ${literal(first)}`);
      await scan(h3StorageProofClaims.spgist, "spgist", "s", (column) => api.containedBy(column, parent5), `s operator(${ns}.<@) ${P5}`);
    });
  },
  180000,
);

extensionProofTest(
  h3LiveProofCase,
  async () => {
    await withH3(h3LiveProofCase.id, async ({ client, connection }) => {
      const deterministic = connection.db
        .select({ center: api.cellToLatLng(cell), parent: api.cellToParent(cell, 5), disk: api.gridDistance(cell, neighbor) })
        .from(sql`h3_one`);
      const live = await connection.transaction(async () => {
        const ordinary = await evaluateSnapshot(async () => {
          const rows = await deterministic.execute();
          await captureSnapshotRevisions(connection.db, async () => ({}));
          return rows;
        });
        return ordinary;
      });
      expect(live.value).toHaveLength(1);
      expect(live.value[0]!.parent).toBe(parent5);
      for (const expression of [
        api.latLngToCell(point, 9),
        api.cellToBoundary(cell),
        api.sql.functions.h3_cell_to_children_slow.adjacent(cell),
      ]) {
        const query = connection.db.select({ value: expression }).from(sql`h3_one`);
        await Promise.resolve(
          expect(evaluateSnapshot(() => query.execute())).rejects.toThrow(
            "Automatic live query cannot observe session extension dependency",
          ),
        );
      }
      await client.query("create table public.h3_writes(label text not null)");
      let caught = false;
      await Promise.resolve(
        expect(
          connection.transaction(async (db) => {
            await db.execute(sql`insert into public.h3_writes values('before'); select set_config('h3.strict', 'on', true)`);
            try {
              await db.select({ value: api.latLngToCell({ lng: 200, lat: 95 }, 9) }).from(sql`h3_one`);
            } catch {
              caught = true;
            }
            await db.execute(sql`insert into public.h3_writes values('caught')`);
          }),
        ).rejects.toThrow(),
      );
      expect(caught).toBe(true);
      expect((await client.query("select count(*)::text as count from public.h3_writes")).rows).toEqual([{ count: "0" }]);
    });
  },
  180000,
);
