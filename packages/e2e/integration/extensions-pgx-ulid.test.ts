import { expect } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { asc, defineRelations, eq, sql } from "drizzle-orm";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  pgxUlidNativeProofCase,
  pgxUlidNativeProofClaims as claims,
  pgxUlidStorageProofCase,
  pgxUlidMonotonicProofCase,
  pgxUlidLiveProofCase,
  pgxUlidProofSchema,
} from "../fixtures/pgx-ulid-proof-cases";
import { createPgxUlid_0_2_2, ulid, type Ulid } from "../../../apps/loom/src/core/extensions/adapters/pgx-ulid";
import {
  timestamp,
  timestamptz,
  type Timestamp,
  type Timestamptz,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { evaluateSnapshot, captureSnapshotRevisions } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";

const extension = createPgxUlid_0_2_2({
  name: "pgx_ulid",
  version: "0.2.2",
  schema: pgxUlidProofSchema,
  apiSupport: { status: "verified", digest: "e2e491782b819b700106736a81ffa9922f24226e1d18ec02ce90931dcef0a60d" },
});
const install = sql`create schema "custom""ulid"; create extension pgx_ulid with schema "custom""ulid" version '0.2.2'`;
const fixture = sql`(values(1)) fixture(value)`;
const witness = { schema: extension.schema };
// Independent vectors: upstream pgx_ulid tests, Crockford/BigInt arithmetic and IEEE-754 epoch * 1000 truncation.
// ulid_to_timestamptz computes (ms as f64) / 1000.0 and calls to_timestamp(float8), which rounds to microseconds.
// For the 48-bit maximum, 281474976710655 / 1000 is the double 281474976710.6550292969 (ulp 2^-14 s), so the
// admitted native civil value is .655040, not the exact millisecond .655000.
const sample = ulid("01GV5PA9EQG7D82Q3Y4PKBZSYV");
const nil = ulid("00000000000000000000000000");
const maximum = ulid("7ZZZZZZZZZZZZZZZZZZZZZZZZZ");
const vectors = [
  [sample, "0186cb65-25d7-81da-815c-7e25a6bfe7db", "0186cb6525d781da815c7e25a6bfe7db", "2023-03-10 12:00:49.111000"],
  [nil, "00000000-0000-0000-0000-000000000000", "00000000000000000000000000000000", "1970-01-01 00:00:00.000000"],
  [maximum, "ffffffff-ffff-ffff-ffff-ffffffffffff", "ffffffffffffffffffffffffffffffff", "10889-08-02 05:31:50.655040"],
] as const;
const conversions = [
  ["1970-01-01 00:00:00", "00000000000000000000000000"],
  ["1970-01-01 00:00:00.123456", "000000003V0000000000000000"],
  ["1969-12-31 23:59:59.999999", "00000000000000000000000000"],
  ["2023-03-10 12:00:49.111", "01GV5PA9EQ0000000000000000"],
  ["10000-01-01 00:00:00.123456", "76EZ91ZQ3V0000000000000000"],
  ["294276-12-31 23:59:59.999999", "65EZKA74000000000000000000"],
].map(([source, expected]) => [source!, ulid(expected!)] as const);
const crockford = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function bits(value: string) {
  let total = 0n;
  for (let index = 0; index < value.length; index++)
    total = total * 32n + BigInt(crockford.indexOf(value.charAt(index)));
  return total;
}
const reversed = (hex: string) => hex.match(/../g)!.reverse().join("");
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Validate actual decoded values at the public RPC boundary.
const rpcRoundTrip = (value: unknown) => deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, value)));

async function plainConnection(url: string) {
  const schema = defineSchema(() => ({}));
  return connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
}

extensionProofTest(pgxUlidNativeProofCase, async () => {
  await withExtensionDatabase(async (url) => {
    const connection = await plainConnection(url);
    try {
      await connection.db.execute(install);
      await observeExtensionProofDatabase(url, pgxUlidNativeProofCase.id, "pgx_ulid");
      const installed = await connection.db.execute(
        sql`select e.extversion,n.nspname from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pgx_ulid'`,
      );
      expect(installed.rows).toEqual([{ extversion: "0.2.2", nspname: 'custom"ulid' }]);
      await connection.transaction(async (db) => {
        await db.execute(sql`select set_config('DateStyle','ISO,YMD',true),set_config('TimeZone','UTC',true)`);
        const bridge = (value: string, uuid: string) =>
          db
            .select({
              lower: extension.toUuid(value.toLowerCase()),
              fromUuid: extension.fromUuid(uuid.toUpperCase()),
              toUuid: extension.toUuid(value),
              bytes: extension.toBytes(value),
              sent: extension.send(value),
              instant: extension.toTimestamptz(value),
              civil: extension.toTimestamp(value),
              castBytes: extension.sql.casts.ulid_to_bytea(value),
              castCivil: extension.sql.casts.ulid_to_timestamp(value),
              castInstant: extension.sql.casts.ulid_to_timestamptz(value),
              castUuid: extension.sql.casts.ulid_to_uuid(value),
              castFromUuid: extension.sql.casts.uuid_to_ulid(uuid),
            })
            .from(fixture);
        const rows: Awaited<ReturnType<typeof bridge>> = [];
        for (const [value, uuid, hex, civil] of vectors) {
          const [row] = await bridge(value, uuid);
          assert(row);
          expect(row).toEqual({
            lower: uuid,
            fromUuid: value,
            toUuid: uuid,
            bytes: { hex },
            sent: { hex: reversed(hex) },
            instant: { type: "timestamptz", text: `${civil}+00` },
            civil: { type: "timestamp", text: civil },
            castBytes: { hex },
            castCivil: { type: "timestamp", text: civil },
            castInstant: { type: "timestamptz", text: `${civil}+00` },
            castUuid: uuid,
            castFromUuid: value,
          });
          assert.deepEqual(rpcRoundTrip([row]), [row]);
          rows.push(row);
        }
        await extensionProofWitness({ ...claims.textVectors, ...witness }, () => {
          expect(rows.map((row) => row.fromUuid)).toEqual(vectors.map(([value]) => value));
          expect(rows.map((row) => row.lower)).toEqual(vectors.map(([, uuid]) => uuid));
        });
        await extensionProofWitness({ ...claims.uuidBridge, ...witness }, () =>
          expect(rows.map((row) => row.toUuid)).toEqual(vectors.map(([, uuid]) => uuid)),
        );
        await extensionProofWitness({ ...claims.uuidReverse, ...witness }, () =>
          expect(rows.map((row) => row.fromUuid)).toEqual(vectors.map(([value]) => value)),
        );
        await extensionProofWitness({ ...claims.bytes, ...witness }, () =>
          expect(rows.map((row) => row.bytes)).toEqual(vectors.map(([, , hex]) => ({ hex }))),
        );
        await extensionProofWitness({ ...claims.send, ...witness }, () =>
          expect(rows.map((row) => row.sent)).toEqual(vectors.map(([, , hex]) => ({ hex: reversed(hex) }))),
        );
        await extensionProofWitness({ ...claims.toTimestamptz, ...witness }, () =>
          expect(rows.map((row) => row.instant?.text)).toEqual(vectors.map(([, , , civil]) => `${civil}+00`)),
        );
        await extensionProofWitness({ ...claims.castToBytes, ...witness }, () =>
          expect(rows.map((row) => row.castBytes)).toEqual(rows.map((row) => row.bytes)),
        );
        await extensionProofWitness({ ...claims.castToTimestamptz, ...witness }, () =>
          expect(rows.map((row) => row.castInstant)).toEqual(rows.map((row) => row.instant)),
        );
        await extensionProofWitness({ ...claims.castToUuid, ...witness }, () =>
          expect(rows.map((row) => row.castUuid)).toEqual(rows.map((row) => row.toUuid)),
        );
        await extensionProofWitness({ ...claims.castFromUuid, ...witness }, () =>
          expect(rows.map((row) => row.castFromUuid)).toEqual(vectors.map(([value]) => value)),
        );
        const convert = (source: string) =>
          db
            .select({
              civil: extension.fromTimestamp(timestamp(source)),
              instant: extension.fromTimestamptz(timestamptz(`${source}Z`)),
              castCivil: extension.sql.casts.timestamp_to_ulid(timestamp(source)),
              castInstant: extension.sql.casts.timestamptz_to_ulid(timestamptz(`${source}Z`)),
            })
            .from(fixture);
        const converted: Awaited<ReturnType<typeof convert>> = [];
        for (const [source, expected] of conversions) {
          const [row] = await convert(source);
          assert(row);
          expect(row).toEqual({ civil: expected, instant: expected, castCivil: expected, castInstant: expected });
          converted.push(row);
        }
        await extensionProofWitness({ ...claims.fromTimestamp, ...witness }, () =>
          expect(converted.map((row) => row.civil)).toEqual(conversions.map(([, expected]) => expected)),
        );
        await extensionProofWitness({ ...claims.castFromTimestamp, ...witness }, () =>
          expect(converted.map((row) => row.castCivil)).toEqual(conversions.map(([, expected]) => expected)),
        );
        await extensionProofWitness({ ...claims.castFromTimestamptz, ...witness }, () =>
          expect(converted.map((row) => row.castInstant)).toEqual(conversions.map(([, expected]) => expected)),
        );
        const ordering = await db
          .select({
            below: extension.compare(nil, sample),
            same: extension.compare(sample, sample),
            above: extension.compare(maximum, sample),
            hash: extension.hash(sample),
            hashFromUuid: extension.hash(extension.fromUuid("0186cb65-25d7-81da-815c-7e25a6bfe7db")),
            missingCompare: extension.compare(null, sample),
            missingHash: extension.hash(null),
            eq: extension.sql.functions.ulid_eq(sample, sample),
            ne: extension.sql.functions.ulid_ne(sample, nil),
            lt: extension.sql.functions.ulid_lt(nil, sample),
            le: extension.sql.functions.ulid_le(sample, sample),
            gt: extension.sql.functions.ulid_gt(maximum, sample),
            ge: extension.sql.functions.ulid_ge(sample, maximum),
            eqNull: extension.sql.functions.ulid_eq(null, sample),
            neNull: extension.sql.functions.ulid_ne(sample, null),
            ltNull: extension.sql.functions.ulid_lt(null, null),
            leNull: extension.sql.functions.ulid_le(null, sample),
            gtNull: extension.sql.functions.ulid_gt(sample, null),
            geNull: extension.sql.functions.ulid_ge(null, sample),
            equal: extension.equal(sample, sample),
            notEqual: extension.notEqual(sample, sample),
            lessThan: extension.lessThan(sample, maximum),
            lessOrEqual: extension.lessOrEqual(maximum, sample),
            greaterThan: extension.greaterThan(sample, nil),
            greaterOrEqual: extension.greaterOrEqual(nil, nil),
          })
          .from(fixture);
        const [result] = ordering;
        assert(result);
        expect(result).toMatchObject({ below: -1, same: 0, above: 1, missingCompare: null, missingHash: null });
        expect(Number.isSafeInteger(result.hash)).toBe(true);
        await extensionProofWitness({ ...claims.compare, ...witness }, () =>
          expect([result.below, result.same, result.above, result.missingCompare]).toEqual([-1, 0, 1, null]),
        );
        await extensionProofWitness({ ...claims.hash, ...witness }, () => {
          expect(result.hash).toBe(result.hashFromUuid);
          expect(result.missingHash).toBeNull();
        });
        for (const [claim, value, missing] of [
          [claims.eq, result.eq, result.eqNull],
          [claims.ne, result.ne, result.neNull],
          [claims.lt, result.lt, result.ltNull],
          [claims.le, result.le, result.leNull],
          [claims.gt, result.gt, result.gtNull],
        ] as const)
          await extensionProofWitness({ ...claim, ...witness }, () => expect([value, missing]).toEqual([true, null]));
        await extensionProofWitness({ ...claims.ge, ...witness }, () =>
          expect([result.ge, result.geNull]).toEqual([false, null]),
        );
        for (const [claim, value, expected] of [
          [claims.equal, result.equal, true],
          [claims.notEqual, result.notEqual, false],
          [claims.lessThan, result.lessThan, true],
          [claims.lessOrEqual, result.lessOrEqual, false],
          [claims.greaterThan, result.greaterThan, true],
          [claims.greaterOrEqual, result.greaterOrEqual, true],
        ] as const)
          await extensionProofWitness({ ...claim, ...witness }, () => expect(value).toBe(expected));
      });
      // The civil value follows the session TimeZone; the instant and the reverse conversion do not.
      const zones = [
        ["UTC", "2023-03-10 12:00:49.111000"],
        ["Asia/Kathmandu", "2023-03-10 17:45:49.111000"],
        ["America/St_Johns", "2023-03-10 08:30:49.111000"],
      ] as const;
      const civil: {
        civil: Timestamp | null;
        cast: Timestamp | null;
        instant: Timestamptz | null;
        local: Ulid | null;
      }[] = [];
      for (const [zone, expected] of zones)
        await connection.transaction(async (db) => {
          await db.execute(sql`select set_config('TimeZone',${zone},true),set_config('DateStyle','ISO,YMD',true)`);
          const [row] = await db
            .select({
              civil: extension.toTimestamp(sample),
              cast: extension.sql.casts.ulid_to_timestamp(sample),
              instant: extension.toTimestamptz(sample),
              local: extension.fromTimestamptz(timestamptz("2023-03-10 17:45:49.111+05:45")),
            })
            .from(fixture);
          assert(row);
          expect(row).toEqual({
            civil: { type: "timestamp", text: expected },
            cast: { type: "timestamp", text: expected },
            instant: { type: "timestamptz", text: "2023-03-10 12:00:49.111000+00" },
            local: ulid("01GV5PA9EQ0000000000000000"),
          });
          civil.push(row);
        });
      await extensionProofWitness({ ...claims.toTimestamp, ...witness }, () =>
        expect(civil.map((row) => row.civil?.text)).toEqual(zones.map(([, expected]) => expected)),
      );
      await extensionProofWitness({ ...claims.castToTimestamp, ...witness }, () =>
        expect(civil.map((row) => row.cast)).toEqual(civil.map((row) => row.civil)),
      );
      await extensionProofWitness({ ...claims.fromTimestamptz, ...witness }, () =>
        expect(new Set(civil.map((row) => row.local))).toEqual(new Set([ulid("01GV5PA9EQ0000000000000000")])),
      );
      const nulls = await connection.db
        .select({
          fromTimestamp: extension.fromTimestamp(null),
          fromTimestamptz: extension.fromTimestamptz(null),
          fromUuid: extension.fromUuid(null),
          toTimestamptz: extension.toTimestamptz(null),
          toUuid: extension.toUuid(null),
          toBytes: extension.toBytes(null),
          send: extension.send(null),
          cast: extension.sql.casts.ulid_to_uuid(null),
        })
        .from(fixture);
      expect(nulls).toEqual([
        {
          fromTimestamp: null,
          fromTimestamptz: null,
          fromUuid: null,
          toTimestamptz: null,
          toUuid: null,
          toBytes: null,
          send: null,
          cast: null,
        },
      ]);
      // node-postgres sends Buffer parameters in binary format, which reaches ulid_recv. pgrx CBOR-decodes a u128.
      const raw = new pg.Client({ connectionString: url });
      await raw.connect();
      try {
        const receive = async (bytes: string) => {
          try {
            const { rows } = await raw.query<{ value: string }>(`select $1::"custom""ulid".ulid::text as value`, [
              Buffer.from(bytes, "hex"),
            ]);
            return rows[0]!.value;
          } catch (error) {
            return v.parse(v.object({ message: v.string() }), error).message;
          }
        };
        const outcomes: string[] = [];
        for (const bytes of [reversed(vectors[0][2]), vectors[0][2], "c250" + vectors[0][2], "00", "1bffffffffffffffff"])
          outcomes.push(await receive(bytes));
        await extensionProofWitness({ ...claims.receive, ...witness }, () =>
          expect(outcomes).toEqual([
            'failed to decode CBOR: ErrorImpl { code: Message("invalid type: sequence, expected u128"), offset: 0 }',
            "failed to decode CBOR: ErrorImpl { code: TrailingData, offset: 2 }",
            'failed to decode CBOR: ErrorImpl { code: Message("invalid type: byte array, expected u128"), offset: 0 }',
            nil,
            "0000000000000FZZZZZZZZZZZZ",
          ]),
        );
      } finally {
        await raw.end();
      }
    } finally {
      await connection.close();
    }
  });
});

const schema = defineSchema(
  (fields) => ({
    entries: defineTable(
      {
        label: fields.text().notNull(),
        value: extension.field().notNull(),
        lookup: extension.field(),
        history: extension.arrayField(),
      },
      {
        indexes: [
          { fields: ["value"], extension: extension.indexes.btree() },
          { fields: ["lookup"], extension: extension.indexes.hash() },
        ],
      },
    ),
  }),
  { namespace: "app" },
);

extensionProofTest(pgxUlidStorageProofCase, async () => {
  await withExtensionDatabase(async (url) => {
    const admin = new pg.Client({ connectionString: url });
    await admin.connect();
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await admin.query(
        `create schema "custom""ulid"; create extension pgx_ulid with schema "custom""ulid" version '0.2.2'`,
      );
      await observeExtensionProofDatabase(url, pgxUlidStorageProofCase.id, "pgx_ulid");
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
        await admin.query(statement);
      const entries = schema.tables.entries;
      const history = {
        dimensions: [
          { lowerBound: -1, length: 2 },
          { lowerBound: 4, length: 2 },
        ],
        values: [
          [sample, null],
          [nil, maximum],
        ],
      };
      const before = await connection.db.execute(
        sql`select floor(extract(epoch from clock_timestamp())*1000)::text as ms`,
      );
      const inserted = await connection.db
        .insert(entries)
        .values([
          { label: "sample", value: sample, lookup: sample, history },
          { label: "nil", value: nil, lookup: nil },
          { label: "maximum", value: maximum, lookup: maximum },
          { label: "generated", value: extension.generate(), lookup: null },
        ])
        .returning({ label: entries.label, value: entries.value, history: entries.history });
      const after = await connection.db.execute(
        sql`select floor(extract(epoch from clock_timestamp())*1000)::text as ms`,
      );
      expect(inserted.slice(0, 3)).toEqual([
        { label: "sample", value: sample, history },
        { label: "nil", value: nil, history: null },
        { label: "maximum", value: maximum, history: null },
      ]);
      assert.deepEqual(rpcRoundTrip(inserted), inserted);
      const generated = inserted[3]!.value;
      const milliseconds = bits(generated) >> 80n;
      await extensionProofWitness({ ...claims.generation, ...witness }, () => {
        expect(generated).toMatch(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
        expect(milliseconds >= BigInt(v.parse(v.string(), before.rows[0]!.ms))).toBe(true);
        expect(milliseconds <= BigInt(v.parse(v.string(), after.rows[0]!.ms))).toBe(true);
      });
      await extensionProofWitness({ ...claims.array, ...witness }, async () => {
        const [row] = await connection.db
          .select({ history: entries.history })
          .from(entries)
          .where(eq(entries.label, "sample"));
        expect(row?.history).toEqual(history);
      });
      const ordered = await connection.db
        .select({ label: entries.label })
        .from(entries)
        .where(extension.lessThan(entries.value, maximum))
        .orderBy(asc(entries.value));
      expect(ordered.map((row) => row.label)).toEqual(["nil", "sample", "generated"]);
      const indexes = await admin.query(
        `select i.relname as name, am.amname as method, opc.opcname as opclass from pg_index x join pg_class i on i.oid=x.indexrelid join pg_am am on am.oid=i.relam join pg_opclass opc on opc.oid=x.indclass[0] join pg_class t on t.oid=x.indrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='app' and t.relname='entries' and am.amname in ('btree','hash') and opc.opcname like 'ulid_%' order by am.amname`,
      );
      expect(indexes.rows.map((row) => [row.method, row.opclass])).toEqual([
        ["btree", "ulid_btree_ops"],
        ["hash", "ulid_hash_ops"],
      ]);
      await admin.query(
        `insert into app.entries(label,value,lookup) select 'bulk', "custom""ulid".gen_ulid(), "custom""ulid".gen_ulid() from generate_series(1,200)`,
      );
      await admin.query("analyze app.entries");
      await admin.query("set enable_seqscan=off");
      const strategies = [
        ["value", "<", "btree"],
        ["value", "<=", "btree"],
        ["value", "=", "btree"],
        ["value", ">=", "btree"],
        ["value", ">", "btree"],
        ["lookup", "=", "hash"],
      ] as const;
      for (const [column, operator, method] of strategies) {
        const query = `select label from app.entries where ${column} operator("custom""ulid".${operator}) '${sample}'::"custom""ulid".ulid`;
        const plan = JSON.stringify((await admin.query(`explain (format json) ${query}`)).rows);
        const name = indexes.rows.find((row) => row.method === method)?.name;
        expect(plan).toContain(String(name));
        const indexed = (await admin.query(query)).rows.map((row) => String(row.label)).sort();
        await admin.query("set enable_indexscan=off;set enable_bitmapscan=off;set enable_seqscan=on");
        const sequential = (await admin.query(query)).rows.map((row) => String(row.label)).sort();
        await admin.query("set enable_indexscan=on;set enable_bitmapscan=on;set enable_seqscan=off");
        expect(indexed).toEqual(sequential);
      }
      await extensionProofWitness({ ...claims.btree, ...witness }, () =>
        expect(indexes.rows[0]?.opclass).toBe("ulid_btree_ops"),
      );
      await extensionProofWitness({ ...claims.hashIndex, ...witness }, () =>
        expect(indexes.rows[1]?.opclass).toBe("ulid_hash_ops"),
      );
    } finally {
      await connection.close();
      await admin.end();
    }
  });
});

extensionProofTest(pgxUlidMonotonicProofCase, async () => {
  await withExtensionDatabase(async (url) => {
    const connection = await plainConnection(url);
    try {
      const preload = await connection.db.execute(sql`select current_setting('shared_preload_libraries') as libraries`);
      const libraries = v
        .parse(v.string(), preload.rows[0]!.libraries)
        .split(",")
        .map((entry) => entry.trim());
      // Without the preload, pgx_ulid shared memory is never initialized; this is a provider prerequisite, not a pass.
      assert(
        libraries.includes("pgx_ulid"),
        `pgx_ulid monotonic generation requires shared_preload_libraries: ${libraries.join(",")}`,
      );
      await connection.db.execute(install);
      await observeExtensionProofDatabase(url, pgxUlidMonotonicProofCase.id, "pgx_ulid");
      const rows = await connection.db
        .select({ value: extension.generateMonotonic() })
        .from(sql`generate_series(1,1000) series(position)`)
        .orderBy(sql`series.position`);
      const values = rows.map((row) => bits(row.value));
      await extensionProofWitness({ ...claims.monotonic, ...witness }, () => {
        for (let index = 1; index < values.length; index++) {
          expect(values[index]! > values[index - 1]!).toBe(true);
          if (values[index]! >> 80n === values[index - 1]! >> 80n) expect(values[index]! - values[index - 1]!).toBe(1n);
        }
        expect(values.some((value, index) => index > 0 && value - values[index - 1]! === 1n)).toBe(true);
      });
    } finally {
      await connection.close();
    }
  });
});

extensionProofTest(pgxUlidLiveProofCase, async () => {
  await withExtensionDatabase(async (url) => {
    const connection = await plainConnection(url);
    try {
      await connection.db.execute(install);
      await observeExtensionProofDatabase(url, pgxUlidLiveProofCase.id, "pgx_ulid");
      const live = await connection.transaction(async (db) => {
        const deterministic = db
          .select({
            id: extension.fromTimestamptz(timestamptz("2023-03-10 12:00:49.111Z")),
            uuid: extension.toUuid(sample),
            instant: extension.toTimestamptz(extension.fromUuid("0186cb65-25d7-81da-815c-7e25a6bfe7db")),
            ordered: extension.lessThan(nil, sample),
          })
          .from(fixture);
        const prepared = deterministic.prepare();
        // This constant fixture has no table dependencies; capture the empty revision set on the actual transaction.
        const ordinary = await evaluateSnapshot(async () => {
          const result = await deterministic.execute();
          await captureSnapshotRevisions(db, async () => ({}));
          return result;
        });
        const compiled = await evaluateSnapshot(async () => {
          const result = await prepared.execute();
          await captureSnapshotRevisions(db, async () => ({}));
          return result;
        });
        return { ordinary, compiled };
      });
      const expected = [
        {
          id: ulid("01GV5PA9EQ0000000000000000"),
          uuid: "0186cb65-25d7-81da-815c-7e25a6bfe7db",
          instant: { type: "timestamptz" as const, text: "2023-03-10 12:00:49.111000+00" },
          ordered: true,
        },
      ];
      expect(live.ordinary.value).toEqual(expected);
      expect(live.compiled.value).toEqual(expected);
      for (const [expression, kind] of [
        [extension.generate(), "external"],
        [extension.toUuid(extension.generate().as("random")), "external"],
        [extension.toTimestamptz(extension.generate()), "external"],
        [extension.toTimestamp(sample), "session"],
        [extension.sql.casts.ulid_to_timestamp(sample), "session"],
      ] as const) {
        const query = connection.db.select({ value: expression }).from(fixture);
        const prepared = query.prepare();
        expect(await prepared.execute()).toHaveLength(1);
        for (const run of [() => query.execute(), () => prepared.execute()])
          await Promise.resolve(
            expect(evaluateSnapshot(run)).rejects.toThrow(
              `Automatic live query cannot observe ${kind} extension dependency`,
            ),
          );
      }
      await connection.db.execute(sql`create table public.decoding_writes(label text not null)`);
      let caught = false;
      await Promise.resolve(
        expect(
          connection.transaction(async (db) => {
            await db.execute(
              sql`insert into public.decoding_writes values('before');select set_config('DateStyle','SQL,MDY',true)`,
            );
            try {
              await db.select({ value: extension.toTimestamptz(sample) }).from(fixture);
            } catch {
              caught = true;
            }
            await db.execute(sql`insert into public.decoding_writes values('caught')`);
          }),
        ).rejects.toThrow("Expected exact ISO timestamp text"),
      );
      expect(caught).toBe(true);
      expect(
        (await connection.db.execute(sql`select count(*)::text as count from public.decoding_writes`)).rows,
      ).toEqual([{ count: "0" }]);
    } finally {
      await connection.close();
    }
  });
});
