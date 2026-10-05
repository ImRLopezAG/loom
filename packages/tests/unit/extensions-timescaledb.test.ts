import { expect } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { pgSchema, timestamp as timestampColumn } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  timescaledbUnitProofCases,
  timescaledbMemberProofs,
  timescaledbNativeProofCase,
} from "../../e2e/fixtures/timescaledb-proof-cases";
import { timescaledbDescriptor, timescaledbDigest } from "../../e2e/fixtures/timescaledb";
import characterization from "../../e2e/fixtures/timescaledb-native-characterization.json";
import { timescaledbNativeReceiptValidator } from "../../e2e/fixtures/timescaledb-native";
import { createTimescaledb_2_24_0 } from "../../../apps/loom/src/core/extensions/adapters/timescaledb";
import {
  timescaledbCreateHypertableInfoCodec,
  timescaledbHypertableDetailedSizeCodec,
  timescaledbIntervalCodec,
  timescaledbDateCodec,
} from "../../../apps/loom/src/core/extensions/adapters/timescaledb-codecs";
import { timestamptz } from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { timescaledbAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/timescaledb";
import {
  withTimescaledb,
  timescaledbApacheRestrictedMembers,
  timescaledbApacheUnreachableMembers,
} from "../../../apps/loom/src/tooling/extensions/operations/timescaledb";
import source from "../../../apps/loom/src/tooling/extensions/manifests/timescaledb.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionExpressionContract,
  extensionSqlDialect,
  checkCompiledExtensionQuery,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";

const ids = source.contract.members.map((member) => member.id).sort();
const receipt = v.parse(timescaledbNativeReceiptValidator, characterization);
const native = receipt.members;

extensionProofUnitTest(timescaledbUnitProofCases[0]!, async () => {
  expect(validateExtensionManifest(v.parse(extensionManifestValidator, source)).digest).toBe(timescaledbDigest);
  expect(source.contract.version).toBe("2.24.0");
  expect(ids).toHaveLength(1233);
  expect(timescaledbAnnotations.map((member) => member.id).sort()).toEqual(ids);
  expect(timescaledbMemberProofs.map((member) => member.id).sort()).toEqual(ids);
  expect(timescaledbNativeProofCase.claims.map((claim) => claim.member).sort()).toEqual(ids);
  const dispositions = new Map(timescaledbAnnotations.map((member) => [member.id, member.disposition]));
  // Every advertised restriction is a captured member whose native direct call raised the Apache license error.
  for (const member of timescaledbApacheRestrictedMembers) {
    expect(dispositions.get(member)).toBe("tooling");
    expect(native[member]?.outcome).toMatchObject({ status: "error", code: "0A000" });
    const outcome = native[member]?.outcome;
    expect(outcome?.status === "error" ? outcome.message : "").toMatch(
      /not supported under the current "apache" license/,
    );
  }
  const licensed = Object.entries(native)
    .filter(
      ([id, entry]) =>
        entry.outcome?.status === "error" &&
        /license/.test(entry.outcome.message) &&
        /^routine:(\$extension:timescaledb|timescaledb_experimental)\./.test(id),
    )
    .map(([id]) => id)
    .sort();
  expect([...timescaledbApacheRestrictedMembers]).toEqual(licensed);
  expect(timescaledbApacheUnreachableMembers.every((member) => dispositions.get(member) === "tooling")).toBe(true);
  expect(receipt.capture).toMatchObject({ missing: [], extra: [], digestMatches: true, contractEqual: true });
  expect(receipt.settings).toMatchObject({ license: "apache", version: "2.24.0" });
  const api = createTimescaledb_2_24_0(timescaledbDescriptor);
  expect(api.createHypertable).toEqual({
    member:
      "routine:$extension:timescaledb.create_hypertable(pg_catalog.regclass,_timescaledb_internal.dimension_info,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    authority: "operator",
  });
  expect(Object.keys(api.sql.functions)).not.toContain("time_bucket_gapfill");
  expect(Object.keys(api.sql.functions).sort()).toEqual(
    [
      "approximate_row_count",
      "chunk_columnstore_stats",
      "chunk_compression_stats",
      "chunks_detailed_size",
      "first",
      "generate_uuidv7",
      "histogram",
      "hypertable_approximate_detailed_size",
      "hypertable_approximate_size",
      "hypertable_columnstore_stats",
      "hypertable_compression_stats",
      "hypertable_detailed_size",
      "hypertable_index_size",
      "hypertable_size",
      "last",
      "show_chunks",
      "show_tablespaces",
      "time_bucket",
      "time_bucket_ng",
      "to_uuidv7",
      "to_uuidv7_boundary",
      "uuid_timestamp",
      "uuid_timestamp_micros",
      "uuid_version",
    ].sort(),
  );
  expect(() =>
    createTimescaledb_2_24_0({ ...timescaledbDescriptor, apiSupport: { status: "verified", digest: "wrong" } }),
  ).toThrow(/exact verified contract/);
  await expect(
    withTimescaledb(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...timescaledbDescriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});

extensionProofUnitTest(timescaledbUnitProofCases[1]!, () => {
  const api = createTimescaledb_2_24_0(timescaledbDescriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const metrics = pgSchema("app").table("metrics", { time: timestampColumn("time", { withTimezone: true }) });
  const bucket = api.timeBucket.timestamptz("1 day", timestamptz("2024-01-01T10:00:00Z"));
  expect(extensionExpressionContract(bucket)?.observability).toBe("tables");
  const compiled = dialect.sqlToQuery(
    sql`select ${bucket}, ${api.timeBucket.timestamptzTimezone("1 day", null, "Europe/Berlin")}, ${api.timeBucketNg.date("1 mon", "2024-02-10")}`,
  );
  expect(compiled.sql).toContain('"ts ext"."time_bucket"');
  expect(compiled.sql).toContain('"timescaledb_experimental"."time_bucket_ng"');
  expect(compiled.params).toEqual([
    "1 day",
    "2024-01-01 10:00:00.000000+00",
    "1 day",
    null,
    "Europe/Berlin",
    "1 mon",
    "2024-02-10",
  ]);
  const size = api.hypertableSize(metrics);
  expect(extensionExpressionContract(size)).toMatchObject({ observability: "external", dependencies: ["app.metrics"] });
  expect(dialect.sqlToQuery(sql`select ${size}`).params).toEqual(['"app"."metrics"']);
  const checked: string[] = [];
  withExtensionSqlExecution({ check: (contract) => checked.push(contract.observability) }, () =>
    checkCompiledExtensionQuery(
      dialect.sqlToQuery(sql`select ${size}, ${api.uuidVersion(null)}, ${api.generateUuidv7()}`),
    ),
  );
  expect(new Set(checked)).toEqual(new Set(["external", "tables"]));
  expect(extensionExpressionContract(api.uuidVersion(null))?.observability).toBe("tables");
  expect(extensionExpressionContract(api.generateUuidv7())?.observability).toBe("external");
  for (const rows of [
    api.information("hypertables", "h"),
    api.policies("p"),
    api.showChunks(metrics, "c"),
    api.chunksDetailedSize({ schema: "app", name: "metrics" }, "d"),
  ]) {
    const observed: string[] = [];
    const query = dialect.sqlToQuery(sql`select ${Object.values(rows.columns)[0]} from ${rows.from}`);
    withExtensionSqlExecution({ check: (contract) => observed.push(contract.observability) }, () =>
      checkCompiledExtensionQuery(query),
    );
    expect(observed).toContain("external");
  }
  expect(dialect.sqlToQuery(sql`select 1 from ${api.information("chunks", "c").from}`).sql).toContain(
    '"timescaledb_information"."chunks"',
  );
  const filtered = api.showChunks(metrics, "c", {
    olderThan: { timestamptz: timestamptz("2024-01-03T00:00:00Z") },
    createdAfter: { date: "2024-01-01" },
  });
  const filteredQuery = dialect.sqlToQuery(sql`select ${filtered.columns.chunk} from ${filtered.from}`);
  expect(filteredQuery.params).toEqual(['"app"."metrics"', "2024-01-03 00:00:00.000000+00", "2024-01-01"]);
  expect(filteredQuery.sql).toContain('"older_than" =>');
  expect(filteredQuery.sql).toContain('"created_after" =>');
});

extensionProofUnitTest(timescaledbUnitProofCases[2]!, () => {
  expect(timescaledbIntervalCodec.decode("1 year 2 mons -3 days 04:05:06.000007")).toBe(
    "1 year 2 mons -3 days 04:05:06.000007",
  );
  expect(() => timescaledbIntervalCodec.encode("P1D")).toThrow();
  expect(timescaledbDateCodec.decode("0044-03-15 BC")).toBe("0044-03-15 BC");
  expect(() => timescaledbDateCodec.encode("15/03/2024")).toThrow();
  expect(timescaledbCreateHypertableInfoCodec.decode("(7,t)")).toEqual({ hypertable_id: 7, created: true });
  expect(timescaledbHypertableDetailedSizeCodec.decode("(8192,16384,,24576,)")).toEqual({
    table_bytes: 8192n,
    index_bytes: 16384n,
    toast_bytes: null,
    total_bytes: 24576n,
    node_name: null,
  });
  const api = createTimescaledb_2_24_0(timescaledbDescriptor);
  const rows = api.information("hypertables", "h");
  expect(Object.keys(rows.columns)).toEqual([
    "hypertable_schema",
    "hypertable_name",
    "owner",
    "num_dimensions",
    "num_chunks",
    "compression_enabled",
    "tablespaces",
    "primary_dimension",
    "primary_dimension_type",
  ]);
});
