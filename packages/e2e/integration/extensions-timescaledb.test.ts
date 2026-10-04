import assert from "node:assert/strict";
import pg from "pg";
import { sql, type SQL } from "drizzle-orm";
import { doublePrecision, integer, pgTable, timestamp as timestampColumn } from "drizzle-orm/pg-core";
import { createTimescaledb_2_24_0 } from "../../../apps/loom/src/core/extensions/adapters/timescaledb";
import { floatCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import {
  timestamp,
  timestamptz,
  timestamptzCodec,
  timestamptzColumn,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import * as v from "valibot";
import { serializeRpcValue, deserializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import {
  timescaledbApacheRestrictedMembers,
  withTimescaledb,
} from "../../../apps/loom/src/tooling/extensions/operations/timescaledb";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { timescaledbDescriptor, timescaledbInstall, timescaledbSchema } from "../fixtures/timescaledb";
import { timescaledbNativeProofCase, timescaledbToolingProofCase } from "../fixtures/timescaledb-proof-cases";
import { characterizeTimescaledb, timescaledbNativeReceiptValidator } from "../fixtures/timescaledb-native";
import reviewed from "../fixtures/timescaledb-native-characterization.json";
import source from "../../../apps/loom/src/tooling/extensions/manifests/timescaledb.json";

const expected = v.parse(timescaledbNativeReceiptValidator, reviewed).members;
const restricted = new Set(timescaledbApacheRestrictedMembers);
const metrics = pgTable("metrics", {
  time: timestampColumn("time", { withTimezone: true, mode: "string" }).notNull(),
  device: integer("device").notNull(),
  value: doublePrecision("value"),
});
const metricsName = { schema: "public", name: "metrics" } as const;

extensionProofTest(
  timescaledbNativeProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      const schema = defineSchema(() => ({}), { namespace: "timescaledb_app" });
      const connection = await connectDatabase({ schema, relations: {}, connectionString: url });
      const prove = async (member: string, assertion: () => void | Promise<void>) => {
        const claim = timescaledbNativeProofCase.claims.find((entry) => entry.member === member);
        assert(claim, `Undeclared timescaledb member: ${member}`);
        await extensionProofWitness({ ...claim, schema: timescaledbSchema }, assertion);
      };
      try {
        assert.equal(
          Math.floor(Number((await oracle.query("SHOW server_version_num")).rows[0].server_version_num) / 10000),
          18,
        );
        const suffix = crypto.randomUUID().replaceAll("-", "");
        const live = await characterizeTimescaledb(oracle, timescaledbSchema, suffix);
        await observeExtensionProofDatabase(url, timescaledbNativeProofCase.id, "timescaledb");
        assert.equal(live.settings.license, "apache");
        assert.equal(live.capture.digestMatches, true);
        assert.equal(live.capture.contractEqual, true);
        // A fresh session: the characterization's search_path must not change catalogue identity text.
        const observer = new pg.Client({ connectionString: url });
        await observer.connect();
        const captured = await captureExtensionContract(observer, {
          name: "timescaledb",
          provider: "neon",
          fixture: "timescaledb-integration",
        }).finally(() => observer.end());
        assert.equal(captured.digest, source.digest);
        const liveMembers = new Map(captured.contract.members.map((member) => [member.id, member]));
        const api = createTimescaledb_2_24_0(timescaledbDescriptor);

        // Typed query API: concrete native results through checked codecs and the RPC boundary.
        const instant = timestamptz("2024-01-01T10:00:00Z");
        const civil = timestamp("2024-01-01 10:00:00");
        const boundary = String(
          (
            await oracle.query(
              `SELECT ${pg.escapeIdentifier(timescaledbSchema)}.to_uuidv7_boundary('2024-01-01 10:00:00+00')::text AS u`,
            )
          ).rows[0].u,
        );
        const [buckets] = await connection.transaction(async (db) =>
          db
            .select({
              int2: api.timeBucket.int2(10, 15),
              int2Offset: api.timeBucket.int2Offset(10, 15, 5),
              int4: api.timeBucket.int4(10, 15),
              int4Offset: api.timeBucket.int4Offset(10, 15, 5),
              int8: api.timeBucket.int8(10n, 15n),
              int8Offset: api.timeBucket.int8Offset(10n, 15n, 5n),
              date: api.timeBucket.date("7 days", "2024-01-10"),
              dateOrigin: api.timeBucket.dateOrigin("7 days", "2024-01-10", "2024-01-01"),
              dateOffset: api.timeBucket.dateOffset("7 days", "2024-01-10", "1 day"),
              timestamp: api.timeBucket.timestamp("1 day", civil),
              timestampOrigin: api.timeBucket.timestampOrigin("1 day", civil, timestamp("2024-01-01 06:00:00")),
              timestampOffset: api.timeBucket.timestampOffset("1 day", civil, "02:00:00"),
              timestamptz: api.timeBucket.timestamptz("1 day", instant),
              timestamptzOrigin: api.timeBucket.timestamptzOrigin(
                "1 day",
                instant,
                timestamptz("2024-01-01T06:00:00Z"),
              ),
              timestamptzOffset: api.timeBucket.timestamptzOffset("1 day", instant, "02:00:00"),
              timestamptzTimezone: api.timeBucket.timestamptzTimezone("1 day", instant, "Europe/Berlin"),
              uuid: api.timeBucket.uuid("1 day", boundary),
              uuidOrigin: api.timeBucket.uuidOrigin("1 day", boundary, timestamptz("2024-01-01T06:00:00Z")),
              uuidOffset: api.timeBucket.uuidOffset("1 day", boundary, "02:00:00"),
              uuidTimezone: api.timeBucket.uuidTimezone("1 day", boundary, "Europe/Berlin"),
              ngDate: api.timeBucketNg.date("1 mon", "2024-02-10"),
              ngDateOrigin: api.timeBucketNg.dateOrigin("1 mon", "2024-02-10", "2023-12-01"),
              ngTimestamp: api.timeBucketNg.timestamp("1 day", civil),
              ngTimestampOrigin: api.timeBucketNg.timestampOrigin("1 day", civil, timestamp("2024-01-01 06:00:00")),
              ngTimestamptz: api.timeBucketNg.timestamptz("1 day", instant),
              ngTimestamptzOrigin: api.timeBucketNg.timestamptzOrigin(
                "1 day",
                instant,
                timestamptz("2024-01-01T06:00:00Z"),
              ),
              ngTimestamptzTimezone: api.timeBucketNg.timestamptzTimezone("1 day", instant, "Europe/Berlin"),
              ngTimestamptzOriginTimezone: api.timeBucketNg.timestamptzOriginTimezone(
                "1 day",
                instant,
                timestamptz("2024-01-01T06:00:00Z"),
                "UTC",
              ),
              nullBucket: api.timeBucket.timestamptz("1 day", null),
            })
            .from(metrics)
            .limit(1),
        );
        const day = timestamptz("2024-01-01T00:00:00Z");
        const berlin = timestamptz("2023-12-31T23:00:00Z");
        const sixAm = timestamptz("2024-01-01T06:00:00Z");
        const twoAm = timestamptz("2024-01-01T02:00:00Z");
        assert.deepEqual(buckets, {
          int2: 10,
          int2Offset: 15,
          int4: 10,
          int4Offset: 15,
          int8: 10n,
          int8Offset: 15n,
          date: "2024-01-08",
          dateOrigin: "2024-01-08",
          dateOffset: "2024-01-09",
          timestamp: timestamp("2024-01-01 00:00:00"),
          timestampOrigin: timestamp("2024-01-01 06:00:00"),
          timestampOffset: timestamp("2024-01-01 02:00:00"),
          timestamptz: day,
          timestamptzOrigin: sixAm,
          timestamptzOffset: twoAm,
          timestamptzTimezone: berlin,
          uuid: day,
          uuidOrigin: sixAm,
          uuidOffset: twoAm,
          uuidTimezone: berlin,
          // Native time_bucket_ng keeps day-aligned buckets for a 06:00 origin, unlike time_bucket.
          ngDate: "2024-02-01",
          ngDateOrigin: "2024-02-01",
          ngTimestamp: timestamp("2024-01-01 00:00:00"),
          ngTimestampOrigin: timestamp("2024-01-01 00:00:00"),
          ngTimestamptz: day,
          ngTimestamptzOrigin: day,
          ngTimestamptzTimezone: berlin,
          ngTimestamptzOriginTimezone: day,
          nullBucket: null,
        });
        assert.deepEqual(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, buckets))), buckets);
        const aggregates = await connection.transaction(async (db) =>
          db
            .select({
              first: api.first(floatCodec, timestamptzCodec)(sql`${metrics.value}`, timestamptzColumn(metrics.time)),
              last: api.last(floatCodec, timestamptzCodec)(sql`${metrics.value}`, timestamptzColumn(metrics.time)),
              lastDevice: api.last(int4Codec, timestamptzCodec)(
                sql`${metrics.device}`,
                timestamptzColumn(metrics.time),
              ),
              histogram: api.histogram(sql`${metrics.value}`, 0, 20, 4),
            })
            .from(metrics),
        );
        assert.deepEqual(aggregates, [{ first: 0, last: 19, lastDevice: 1, histogram: [0, 5, 5, 5, 5, 0] }]);
        const [uuids] = await connection.transaction(async (db) =>
          db
            .select({
              version: api.uuidVersion(api.toUuidv7Boundary(instant)),
              generated: api.uuidVersion(api.generateUuidv7()),
              randomized: api.uuidVersion(api.toUuidv7(instant)),
              at: api.uuidTimestamp(api.toUuidv7(instant)),
              micros: api.uuidTimestampMicros(api.toUuidv7(timestamptz("2024-01-01T10:00:00.123456Z"))),
              nullVersion: api.uuidVersion(null),
            })
            .from(metrics)
            .limit(1),
        );
        assert.deepEqual(uuids, {
          version: 7,
          generated: 7,
          randomized: 7,
          at: instant,
          micros: timestamptz("2024-01-01T10:00:00.123456Z"),
          nullVersion: null,
        });
        const [sizes] = await connection.transaction(async (db) =>
          db
            .select({
              rows: api.approximateRowCount(metrics),
              size: api.hypertableSize(metrics),
              approximate: api.hypertableApproximateSize(metricsName),
              index: api.hypertableIndexSize({ schema: "public", name: "metrics_device_time" }),
            })
            .from(metrics)
            .limit(1),
        );
        assert(sizes);
        assert.equal(sizes.rows, 20n);
        const positive = v.pipe(v.bigint(), v.minValue(1n));
        v.parse(v.object({ size: positive, approximate: v.bigint(), index: positive }), sizes);
        const rows = <Columns extends Record<string, SQL>>(source: { readonly from: SQL; readonly columns: Columns }) =>
          connection.transaction(async (db) => db.select(source.columns).from(source.from));
        const chunks = await rows(api.showChunks(metrics, "c"));
        assert.equal(chunks.length, 5);
        assert.equal(
          (
            await rows(
              api.showChunks(metrics, "c", { olderThan: { timestamptz: timestamptz("2024-01-03T00:00:00Z") } }),
            )
          ).length,
          2,
        );
        assert.equal(
          (await rows(api.sql.functions.show_chunks(metrics, "c", { newerThan: { date: "2024-01-03" } }))).length,
          3,
        );
        v.parse(
          v.array(v.object({ chunk: v.pipe(v.string(), v.startsWith("_timescaledb_internal._hyper_")) })),
          chunks,
        );
        const detailed = await rows(api.hypertableDetailedSize(metrics, "d"));
        assert.equal(detailed.length, 1);
        assert.equal(detailed[0]!.node_name, null);
        assert.equal((await rows(api.hypertableApproximateDetailedSize(metrics, "d"))).length, 1);
        assert.equal((await rows(api.chunksDetailedSize(metrics, "d"))).length, 5);
        assert.deepEqual(await rows(api.showTablespaces(metrics, "t")), []);
        assert.deepEqual(await rows(api.hypertableCompressionStats(metrics, "s")), []);
        assert.deepEqual(await rows(api.chunkCompressionStats(metrics, "s")), []);
        assert.deepEqual(await rows(api.hypertableColumnstoreStats(metrics, "s")), []);
        assert.deepEqual(await rows(api.chunkColumnstoreStats(metrics, "s")), []);
        const hypertables = await rows(api.information("hypertables", "h"));
        const row = hypertables.find((entry) => entry.hypertable_name === "metrics");
        assert(row);
        assert.deepEqual(
          { ...row, owner: undefined },
          {
            hypertable_schema: "public",
            hypertable_name: "metrics",
            owner: undefined,
            num_dimensions: 1,
            num_chunks: 5n,
            compression_enabled: false,
            tablespaces: null,
            primary_dimension: "time",
            primary_dimension_type: "timestamp with time zone",
          },
        );
        const informationChunks = await rows(api.information("chunks", "c"));
        assert(informationChunks.some((entry) => entry.hypertable_name === "metrics" && entry.range_start !== null));
        for (const name of [
          "dimensions",
          "jobs",
          "job_stats",
          "job_errors",
          "job_history",
          "continuous_aggregates",
          "compression_settings",
          "hypertable_compression_settings",
          "chunk_compression_settings",
          "hypertable_columnstore_settings",
          "chunk_columnstore_settings",
        ] as const)
          assert(Array.isArray(await rows(api.information(name, "v"))));
        assert.deepEqual(await rows(api.policies("p")), []);

        // Every captured member: replay its own direct native call, or observe its live catalogue identity.
        for (const member of v.parse(extensionManifestValidator, source).contract.members) {
          await prove(member.id, () => {
            const reviewedEntry = expected[member.id];
            const liveEntry = live.members[member.id];
            if (reviewedEntry && liveEntry) {
              assert.equal(liveEntry.kind, reviewedEntry.kind);
              const want = reviewedEntry.outcome;
              const got = liveEntry.outcome;
              assert.equal(got?.status, want?.status, member.id);
              assert.equal(
                got?.status === "error" ? got.code : undefined,
                want?.status === "error" ? want.code : undefined,
                member.id,
              );
              if (restricted.has(member.id))
                assert.match(
                  got?.status === "error" ? got.message : "",
                  /not supported under the current "apache" license/,
                );
            } else {
              assert.deepEqual(liveMembers.get(member.id), member, `Live catalogue differs for ${member.id}`);
            }
          });
        }
      } finally {
        await connection.close();
        await oracle.end();
      }
    });
  },
  180000,
);

extensionProofTest(
  timescaledbToolingProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      try {
        await oracle.query(timescaledbInstall);
        // Chunk skipping is gated by a user GUC; new sessions, including the operator backend, inherit it.
        await oracle.query("DO $$ BEGIN EXECUTE format('ALTER DATABASE %I SET timescaledb.enable_chunk_skipping = on', current_database()); END $$");
        await oracle.query(
          "CREATE TABLE public.readings(time timestamptz NOT NULL, device int NOT NULL, value float8)",
        );
        await oracle.query(`
        CREATE SCHEMA chunks;
        CREATE TABLE public.legacy(time timestamptz NOT NULL, device int NOT NULL, value float8);
        CREATE TABLE public.ticks(time bigint NOT NULL, device int NOT NULL);
        CREATE TABLE public.partitioned(time timestamptz NOT NULL, device int NOT NULL);
        CREATE TABLE public.ranged(time timestamptz NOT NULL);
        CREATE FUNCTION public.time_identity(timestamptz) RETURNS timestamptz LANGUAGE sql IMMUTABLE AS 'SELECT $1';
        CREATE FUNCTION public.device_hash(integer) RETURNS integer LANGUAGE sql IMMUTABLE AS 'SELECT $1';
        CREATE FUNCTION public.ticks_now() RETURNS bigint LANGUAGE sql STABLE AS 'SELECT 1000::bigint';
        CREATE FUNCTION public.chunk_size(integer,bigint,bigint) RETURNS bigint LANGUAGE sql IMMUTABLE AS 'SELECT 86400000000::bigint';
      `);
        const result = await withTimescaledb(url, timescaledbDescriptor, async (session) => {
          const created = await session.createHypertable(
            { schema: "public", name: "readings" },
            { kind: "range", column: "time", interval: { interval: "1 day" } },
          );
          const added = await session.addDimension(
            { schema: "public", name: "readings" },
            { kind: "hash", column: "device", partitions: 2 },
          );
          await session.setChunkTimeInterval({ schema: "public", name: "readings" }, { interval: "12:00:00" });
          await session.setPartitioningInterval(
            { schema: "public", name: "readings" },
            { interval: "06:00:00" },
            "time",
          );
          await session.setNumberPartitions({ schema: "public", name: "readings" }, 3, "device");
          const ranged = await session.createHypertable(
            { schema: "public", name: "ranged" },
            {
              kind: "range",
              column: "time",
              partitionFunc: { schema: "public", name: "time_identity" },
            },
          );
          assert.equal(ranged.created, true);
          const legacy = await session.createHypertableLegacy({ schema: "public", name: "legacy" }, "time", {
            partitioningColumn: "device",
            numberPartitions: 2,
            associatedSchemaName: "chunks",
            associatedTablePrefix: "series",
            chunkTimeInterval: { interval: "1 day" },
            createDefaultIndexes: true,
            ifNotExists: true,
            migrateData: false,
            partitioningFunc: { schema: "public", name: "device_hash" },
            timePartitioningFunc: { schema: "public", name: "time_identity" },
            chunkTargetSize: "1MB",
            chunkSizingFunc: { schema: "public", name: "chunk_size" },
          });
          assert.deepEqual(legacy, { hypertable_id: 3, schema_name: "public", table_name: "legacy", created: true });
          await session.createHypertable(
            { schema: "public", name: "ticks" },
            { kind: "range", column: "time", interval: { integer: 100n } },
          );
          await session.setIntegerNowFunc(
            { schema: "public", name: "ticks" },
            { schema: "public", name: "ticks_now" },
            true,
          );
          await session.createHypertable(
            { schema: "public", name: "partitioned" },
            { kind: "range", column: "time", interval: { interval: "1 day" } },
          );
          const legacyDimension = await session.addDimensionLegacy(
            { schema: "public", name: "partitioned" },
            "device",
            {
              numberPartitions: 2,
              partitioningFunc: { schema: "public", name: "device_hash" },
              ifNotExists: true,
            },
          );
          assert.equal(legacyDimension.created, true);
          const adaptive = await session.setAdaptiveChunking({ schema: "public", name: "partitioned" }, "1MB", {
            schema: "public",
            name: "chunk_size",
          });
          assert.equal(adaptive.chunk_target_size, 1048576n);
          await session.attachTablespace("pg_default", { schema: "public", name: "readings" }, true);
          assert.deepEqual(await session.showTablespaces({ schema: "public", name: "readings" }), ["pg_default"]);
          assert.equal(await session.detachTablespace("pg_default", { schema: "public", name: "readings" }, true), 1);
          await session.attachTablespace("pg_default", { schema: "public", name: "readings" });
          assert.equal(await session.detachTablespaces({ schema: "public", name: "readings" }), 1);
          assert.equal(
            (await session.enableChunkSkipping({ schema: "public", name: "readings" }, "time", true)).enabled,
            true,
          );
          assert.equal(
            (await session.disableChunkSkipping({ schema: "public", name: "readings" }, "time", true)).disabled,
            true,
          );
          const restrictions = await session.restrictions();
          return { created, added, restrictions };
        });
        assert.equal(result.completion, "committed");
        assert.deepEqual(result.value.created, { hypertable_id: 1, created: true });
        assert.equal(result.value.added.created, true);
        assert.equal(result.value.restrictions.license, "apache");
        assert.deepEqual(result.value.restrictions.restricted, timescaledbApacheRestrictedMembers);
        const interval = await oracle.query(
          "SELECT time_interval::text AS value FROM timescaledb_information.dimensions WHERE hypertable_name='readings' AND column_name='time'",
        );
        assert.equal(interval.rows[0].value, "06:00:00");
        await oracle.query(
          "INSERT INTO public.readings VALUES ('2024-01-01 00:00:00+00', 1, 1), ('2024-01-02 00:00:00+00', 1, 2)",
        );
        await withTimescaledb(url, timescaledbDescriptor, async (session) => {
          const old = await session.showChunks(
            { schema: "public", name: "readings" },
            { olderThan: { date: "2024-01-02" } },
          );
          assert.equal(old.length, 1);
          assert.deepEqual(
            await session.dropChunks(
              { schema: "public", name: "readings" },
              { olderThan: { date: "2024-01-02" }, verbose: false },
            ),
            old,
          );
          assert.equal((await session.showChunks({ schema: "public", name: "readings" })).length, 1);
          assert.equal(await session.preRestore(), true);
          assert.equal(await session.postRestore(), true);
        });
        assert.equal((await oracle.query("SELECT count(*)::int AS n FROM public.readings")).rows[0].n, 1);
      } finally {
        await oracle.end();
      }
    });
  },
  120000,
);
