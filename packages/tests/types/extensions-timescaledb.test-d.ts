import type { SQL } from "drizzle-orm";
import { expectTypeOf } from "vite-plus/test";
import {
  createTimescaledb_2_24_0,
  type Timestamp,
  type Timestamptz,
  type TimescaledbHypertable,
} from "../../../apps/loom/src/core/extensions/adapters/timescaledb";
import { floatCodec } from "../../../apps/loom/src/core/extensions/codecs";
import {
  timestamp,
  timestamptz,
  timestamptzCodec,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import {
  withTimescaledb,
  type TimescaledbSession,
  type TimescaledbRestrictions,
} from "../../../apps/loom/src/tooling/extensions/operations/timescaledb";
import { timescaledbDescriptor } from "../../e2e/fixtures/timescaledb";

const api = createTimescaledb_2_24_0(timescaledbDescriptor);
const instant = timestamptz("2024-01-01T10:00:00Z");
expectTypeOf(api.version).toEqualTypeOf<"2.24.0">();
expectTypeOf(api.schema).toEqualTypeOf<"ts ext">();
expectTypeOf(api.timeBucket.timestamptz("1 day", instant)).toExtend<SQL<Timestamptz | null>>();
expectTypeOf(api.timeBucket.timestamp("1 day", timestamp("2024-01-01 10:00:00"))).toExtend<SQL<Timestamp | null>>();
expectTypeOf(api.timeBucket.int8(10n, 15n)).toExtend<SQL<bigint | null>>();
expectTypeOf(api.timeBucket.int4(10, 15)).toExtend<SQL<number | null>>();
expectTypeOf(api.timeBucket.date("7 days", "2024-01-01")).toExtend<SQL<string | null>>();
expectTypeOf(api.timeBucket.uuid("1 day", "0190163d-8694-739b-aea5-966c26f8ad91")).toExtend<SQL<Timestamptz | null>>();
expectTypeOf(api.timeBucket.timestamptzTimezone("1 day", instant, "UTC")).toExtend<SQL<Timestamptz | null>>();
expectTypeOf(api.timeBucketNg.timestamptzOriginTimezone("1 day", instant, instant, "UTC")).toExtend<
  SQL<Timestamptz | null>
>();
expectTypeOf(api.first(floatCodec, timestamptzCodec)(1.5, instant)).toExtend<
  SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null>
>();
expectTypeOf(api.histogram(1.5, 0, 10, 5)).toExtend<SQL<number[] | null>>();
expectTypeOf(api.uuidVersion(null)).toExtend<SQL<number | null>>();
expectTypeOf(api.hypertableSize({ schema: "app", name: "metrics" })).toExtend<SQL<bigint | null>>();
expectTypeOf(api.information("hypertables", "h").columns.num_chunks).toEqualTypeOf<SQL<bigint | null>>();
expectTypeOf(api.information("hypertables", "h").columns.tablespaces).toExtend<SQL<unknown>>();
expectTypeOf(api.information("chunks", "c").columns.range_start).toEqualTypeOf<SQL<Timestamptz | null>>();
expectTypeOf(api.showChunks({ schema: "app", name: "metrics" }, "c").columns.chunk).toEqualTypeOf<SQL<string>>();
expectTypeOf<TimescaledbHypertable["num_dimensions"]>().toEqualTypeOf<number | null>();
expectTypeOf<TimescaledbSession["dropChunks"]>().returns.toEqualTypeOf<Promise<readonly string[]>>();
expectTypeOf<TimescaledbSession["restrictions"]>().returns.toEqualTypeOf<Promise<TimescaledbRestrictions>>();
expectTypeOf<TimescaledbSession>().not.toHaveProperty("client");
expectTypeOf<TimescaledbSession>().not.toHaveProperty("addJob");
expectTypeOf<TimescaledbSession>().not.toHaveProperty("compressChunk");
function compileOnly() {
  // @ts-expect-error Interval width is canonical PostgreSQL text, not a number.
  api.timeBucket.timestamptz(86400, instant);
  // @ts-expect-error A JS Date is not an exact native timestamptz.
  api.timeBucket.timestamptz("1 day", new Date());
  // @ts-expect-error int8 buckets are bigint.
  api.timeBucket.int8(10, 15);
  // @ts-expect-error TSL gapfill is not advertised under Apache.
  void api.timeBucketGapfill;
  // @ts-expect-error Operator DDL is a descriptor, not callable SQL.
  api.createHypertable({ schema: "app", name: "metrics" });
  // @ts-expect-error Unknown information view.
  api.information("compressed_chunk_stats", "x");
  // @ts-expect-error Exact version only.
  createTimescaledb_2_24_0({ ...timescaledbDescriptor, version: "2.23.0" });
  void withTimescaledb("postgresql://operator@localhost/fixture", timescaledbDescriptor, async (session) => {
    expectTypeOf(
      await session.createHypertable(
        { schema: "app", name: "metrics" },
        { kind: "range", column: "time", interval: { interval: "1 day" } },
      ),
    ).toEqualTypeOf<{ readonly hypertable_id: number | null; readonly created: boolean | null }>();
    await session.createHypertableLegacy({ schema: "app", name: "metrics" }, "time", {
      associatedSchemaName: "chunks",
      associatedTablePrefix: "series",
      partitioningColumn: "device",
      numberPartitions: 2,
      partitioningFunc: { schema: "app", name: "device_hash" },
      chunkSizingFunc: { schema: "app", name: "chunk_size" },
    });
    // @ts-expect-error Hash dimensions require a partition count.
    await session.addDimension({ schema: "app", name: "metrics" }, { kind: "hash", column: "device" });
    // @ts-expect-error Time values carry their native type tag.
    await session.dropChunks({ schema: "app", name: "metrics" }, { olderThan: "1 day" });
  });
}
void compileOnly;
