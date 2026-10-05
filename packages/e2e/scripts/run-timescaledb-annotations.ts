import { writeFileSync } from "node:fs";
import * as v from "valibot";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/timescaledb.json";
import characterization from "../fixtures/timescaledb-native-characterization.json";
import { timescaledbNativeReceiptValidator } from "../fixtures/timescaledb-native";
import {
  timescaledbApacheRestrictedMembers,
  timescaledbApacheUnreachableMembers,
} from "../../../apps/loom/src/tooling/extensions/operations/timescaledb";

/**
 * Emits the reviewed TimescaleDB 2.24.0 member dispositions from the pinned capture and the native characterization
 * receipt. Every captured member is classified individually; nothing is omitted by namespace.
 *
 *   bun packages/e2e/scripts/run-timescaledb-annotations.ts
 */
type Member = (typeof manifest.contract.members)[number];
const native = v.parse(timescaledbNativeReceiptValidator, characterization).members;
const restricted = new Set(timescaledbApacheRestrictedMembers);
const unreachable = new Set(timescaledbApacheUnreachableMembers);
const base = (member: Member) => member.name;

const query = new Set([
  "time_bucket",
  "time_bucket_ng",
  "first",
  "last",
  "histogram",
  "generate_uuidv7",
  "to_uuidv7",
  "to_uuidv7_boundary",
  "uuid_timestamp",
  "uuid_timestamp_micros",
  "uuid_version",
  "approximate_row_count",
  "hypertable_size",
  "hypertable_approximate_size",
  "hypertable_index_size",
  "hypertable_detailed_size",
  "hypertable_approximate_detailed_size",
  "chunks_detailed_size",
  "hypertable_compression_stats",
  "chunk_compression_stats",
  "hypertable_columnstore_stats",
  "chunk_columnstore_stats",
  "show_chunks",
  "show_tablespaces",
]);
const tooling = {
  create_hypertable:
    "withTimescaledb.createHypertable (dimension_info) / createHypertableLegacy (captured deprecated signature)",
  add_dimension: "withTimescaledb.addDimension (dimension_info) / addDimensionLegacy (captured deprecated signature)",
  by_range: 'withTimescaledb dimension builder { kind: "range" } for createHypertable/addDimension',
  by_hash: 'withTimescaledb dimension builder { kind: "hash" } for createHypertable/addDimension',
  set_chunk_time_interval: "withTimescaledb.setChunkTimeInterval",
  set_partitioning_interval: "withTimescaledb.setPartitioningInterval",
  set_number_partitions: "withTimescaledb.setNumberPartitions",
  set_integer_now_func: "withTimescaledb.setIntegerNowFunc",
  set_adaptive_chunking: "withTimescaledb.setAdaptiveChunking",
  drop_chunks: "withTimescaledb.dropChunks",
  attach_tablespace: "withTimescaledb.attachTablespace",
  detach_tablespace: "withTimescaledb.detachTablespace",
  detach_tablespaces: "withTimescaledb.detachTablespaces",
  enable_chunk_skipping: "withTimescaledb.enableChunkSkipping",
  disable_chunk_skipping: "withTimescaledb.disableChunkSkipping",
  timescaledb_pre_restore: "withTimescaledb.preRestore",
  timescaledb_post_restore: "withTimescaledb.postRestore",
};
const publicViews = new Set([
  ...Object.keys({
    hypertables: 0,
    dimensions: 0,
    chunks: 0,
    jobs: 0,
    job_stats: 0,
    job_errors: 0,
    job_history: 0,
    continuous_aggregates: 0,
    compression_settings: 0,
    hypertable_compression_settings: 0,
    chunk_compression_settings: 0,
    hypertable_columnstore_settings: 0,
    chunk_columnstore_settings: 0,
  }).map((name) => `timescaledb_information.${name}`),
  "timescaledb_experimental.policies",
]);

function outcome(member: Member): string {
  const observed = native[member.id];
  if (!observed) return "no direct SQL call (subordinate catalogue object)";
  if (observed.kind === "native-callback") return "cstring/internal signature: no direct SQL call";
  const result = observed.outcome!;
  if (result.status === "ok") return "native direct call returned";
  if (result.status === "not-selectable") return "index/TOAST relation, not selectable";
  return `native direct call raised ${result.code}: ${result.message!.split("\n")[0]!.slice(0, 120)}`;
}

type Classification = { disposition: "query" | "schema" | "tooling" | "internal"; reason: string };
function classify(member: Member): Classification {
  const where = member.namespace ?? "";
  const publicRoutine =
    member.kind === "routine" && (where === "$extension:timescaledb" || where === "timescaledb_experimental");
  if (publicRoutine) {
    if (restricted.has(member.id))
      return {
        disposition: "tooling",
        reason: `TSL-licensed; withTimescaledb.restrictions() reports it under Apache and it is not advertised. ${outcome(member)}.`,
      };
    if (unreachable.has(member.id))
      return {
        disposition: "tooling",
        reason: `withTimescaledb.restrictions().unreachable: only accepts continuous aggregates, which Apache cannot create (native 0A000). ${outcome(member)}.`,
      };
    if (query.has(base(member)))
      return {
        disposition: "query",
        reason: `createTimescaledb_2_24_0 typed ${base(member)} expression/rows. ${outcome(member)}.`,
      };
    const tool = Object.entries(tooling).find(([name]) => name === base(member))?.[1];
    if (tool)
      return {
        disposition: "tooling",
        reason: `${tool}; operator transaction after exact contract verification. ${outcome(member)}.`,
      };
    throw new Error(`Unclassified public routine: ${member.id}`);
  }
  if (member.kind === "routine")
    return {
      disposition: "internal",
      reason: `Extension-private ${where} implementation routine called by TimescaleDB DDL, triggers, planner or background workers; not an application or operator contract. ${outcome(member)}.`,
    };
  if (member.kind === "relation") {
    const qualified = `${where}.${member.name}`;
    if (publicViews.has(qualified))
      return {
        disposition: "query",
        reason: `${qualified === "timescaledb_experimental.policies" ? "policies()" : `information("${member.name}")`} nullable catalogue rows (external observability). ${outcome(member)}.`,
      };
    return {
      disposition: "internal",
      reason: `Hidden ${where} metadata relation maintained only by TimescaleDB routines; applications never mutate it. ${outcome(member)}.`,
    };
  }
  if (member.kind === "type") {
    const row = member.name.replace(/^_/, "");
    if (publicViews.has(`${where}.${row}`))
      return {
        disposition: "query",
        reason: `Row/array type of public view ${where}.${row}; decoded through its field codecs.`,
      };
    if (member.name === "_dimension_info")
      return {
        disposition: "tooling",
        reason:
          "Array type of dimension_info; no captured routine accepts or returns it, and withTimescaledb never stores dimension specifications.",
      };
    if (row === "dimension_info")
      return {
        disposition: "tooling",
        reason:
          "by_range/by_hash result consumed only inline by withTimescaledb createHypertable/addDimension; never stored or returned.",
      };
    return {
      disposition: "internal",
      reason: `Hidden ${where} row, cache or compressed-storage type; no application field contract.`,
    };
  }
  const objectType = "objectType" in member ? member.objectType : "other";
  if (objectType === "schema") {
    if (member.name === "timescaledb_information" || member.name === "timescaledb_experimental")
      return {
        disposition: "schema",
        reason: `Fixed catalogue schema ${member.name}; adapter readers qualify it explicitly regardless of installation schema.`,
      };
    return { disposition: "internal", reason: `Fixed extension-private schema ${member.name}.` };
  }
  if (objectType === "view column") {
    const relation = `${where}.${member.name}`;
    if (publicViews.has(relation)) return { disposition: "query", reason: `Nullable field of ${relation} reader.` };
    return { disposition: "internal", reason: `Column of hidden view ${relation}.` };
  }
  if (objectType === "event trigger")
    return {
      disposition: "internal",
      reason: "Fires automatically on DDL to maintain hypertable metadata; no application contract.",
    };
  return {
    disposition: "internal",
    reason: `${objectType} of hidden TimescaleDB metadata; maintained by TimescaleDB, never mutated by applications.`,
  };
}

const evidence = [
  "https://github.com/timescale/timescaledb/tree/2.24.0",
  "https://neon.com/docs/extensions/timescaledb",
  "apps/loom/src/tooling/extensions/manifests/timescaledb.json",
  "packages/e2e/fixtures/timescaledb-native-characterization.json",
];
const rows = manifest.contract.members.map((member) => ({ id: member.id, ...classify(member) }));
const text = `// Generated by packages/e2e/scripts/run-timescaledb-annotations.ts from the pinned capture and native characterization.
/** Exact TimescaleDB 2.24.0 (Apache, Neon PG18) captured member dispositions. Acceptance remains parent-owned. */
const evidence = ${JSON.stringify(evidence)} as const;
const semantics = {
  license: "apache",
  nativeAcceptance: "pending",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
type Disposition = "query" | "schema" | "tooling" | "internal";
const rows: readonly (readonly [id: string, disposition: Disposition, reason: string])[] = [
${rows.map((row) => `  ${JSON.stringify([row.id, row.disposition, row.reason])},`).join("\n")}
];
export const timescaledbAnnotationContract = {
  extension: "timescaledb",
  postgresMajor: 18,
  version: "2.24.0",
  provider: "neon",
  digest: ${JSON.stringify(manifest.digest)},
  providerAcceptance: "pending",
} as const;
export const timescaledbAnnotations = Object.freeze(
  rows.map(([id, disposition, reason]) => Object.freeze({ id, disposition, reason, evidence, semantics })),
);
`;
writeFileSync(new URL("../../../apps/loom/src/tooling/extensions/annotations/timescaledb.ts", import.meta.url), text);
const counts: Record<string, number> = {};
for (const row of rows) counts[row.disposition] = (counts[row.disposition] ?? 0) + 1;
console.log(JSON.stringify({ members: rows.length, counts }));
