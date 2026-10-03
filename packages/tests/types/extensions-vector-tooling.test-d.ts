import { expectTypeOf } from "vite-plus/test";
import { sql } from "drizzle-orm";
import type { NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
import * as leaf from "../../../apps/loom/src/tooling/extensions/vector";
import {
  withVectorSearchSettings,
  type ExactVector086Descriptor,
  type VectorNearestRequest,
  type VectorNearestRow,
  type VectorSearchSession,
  type VectorSearchSettings,
  type VectorSettingsSnapshot,
} from "../../../apps/loom/src/tooling/extensions/vector";

const descriptor = {
  name: "vector",
  version: "0.8.6",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4" },
} as const satisfies ExactVector086Descriptor;
const url = "postgresql://operator/fixture";
const table = { schema: "public", name: "documents" } as const;
const target = { table, idColumn: "id", embeddingColumn: "embedding", limit: 10 } as const;
const vectorRequest = { ...target, kind: "vector", metric: "l2", probe: [1, 2, 3] } as const;
const bitRequest = { ...target, kind: "bit", metric: "hamming", probe: { bits: "01" } } as const;

// Every known key and value is accepted, including the HNSW-only strict_order and a real multiplier.
const all: VectorSearchSettings = {
  "hnsw.ef_search": 80,
  "hnsw.iterative_scan": "strict_order",
  "hnsw.max_scan_tuples": 5000,
  "hnsw.scan_mem_multiplier": 1.5,
  "ivfflat.probes": 3,
  "ivfflat.iterative_scan": "relaxed_order",
  "ivfflat.max_probes": 7,
};
const empty: VectorSearchSettings = {};
for (const hnsw of ["off", "relaxed_order", "strict_order"] as const) {
  const accepted: VectorSearchSettings = { "hnsw.iterative_scan": hnsw };
  void accepted;
}
for (const ivfflat of ["off", "relaxed_order"] as const) {
  const accepted: VectorSearchSettings = { "ivfflat.iterative_scan": ivfflat };
  void accepted;
}
// @ts-expect-error ivfflat has no strict_order scan mode.
const ivfflatStrict: VectorSearchSettings = { "ivfflat.iterative_scan": "strict_order" };
// @ts-expect-error unknown settings are not part of the closed contract.
const unknownKey: VectorSearchSettings = { "hnsw.unknown": 1 };
// @ts-expect-error work_mem is a PostgreSQL setting, not an owned vector setting.
const workMem: VectorSearchSettings = { work_mem: "64MB" };
// @ts-expect-error numbers are not accepted as strings.
const stringNumber: VectorSearchSettings = { "hnsw.ef_search": "40" };
// @ts-expect-error enum values are not booleans.
const booleanEnum: VectorSearchSettings = { "hnsw.iterative_scan": true };
// @ts-expect-error unknown enum members are rejected.
const unknownEnum: VectorSearchSettings = { "hnsw.iterative_scan": "strict" };
// @ts-expect-error settings cannot be a raw GUC string.
const rawString: VectorSearchSettings = "hnsw.ef_search=40";
// @ts-expect-error readonly settings cannot be mutated after construction.
all["hnsw.ef_search"] = 1;
void [empty, ivfflatStrict, unknownKey, workMem, stringNumber, booleanEnum, unknownEnum, rawString];

const result = withVectorSearchSettings(url, descriptor, all, async (session) => {
  expectTypeOf(session).toEqualTypeOf<VectorSearchSession>();
  expectTypeOf(session.inspectSettings).toEqualTypeOf<() => Promise<VectorSettingsSnapshot>>();
  expectTypeOf(session.nearest).toEqualTypeOf<
    (request: VectorNearestRequest) => Promise<readonly VectorNearestRow[]>
  >();
  expectTypeOf(session.explain).toEqualTypeOf<(request: VectorNearestRequest) => Promise<readonly string[]>>();

  const snapshot = await session.inspectSettings();
  expectTypeOf(snapshot["hnsw.ef_search"]).toEqualTypeOf<number>();
  expectTypeOf(snapshot["hnsw.iterative_scan"]).toEqualTypeOf<"off" | "relaxed_order" | "strict_order">();
  expectTypeOf(snapshot["hnsw.max_scan_tuples"]).toEqualTypeOf<number>();
  expectTypeOf(snapshot["hnsw.scan_mem_multiplier"]).toEqualTypeOf<number>();
  expectTypeOf(snapshot["ivfflat.probes"]).toEqualTypeOf<number>();
  expectTypeOf(snapshot["ivfflat.iterative_scan"]).toEqualTypeOf<"off" | "relaxed_order">();
  expectTypeOf(snapshot["ivfflat.max_probes"]).toEqualTypeOf<number>();
  // @ts-expect-error snapshots are fully populated and closed.
  void snapshot["hnsw.unknown"];
  // @ts-expect-error snapshot values are readonly.
  snapshot["hnsw.ef_search"] = 1;

  const rows = await session.nearest({ ...target, kind: "vector", metric: "l2", probe: [1, 2, 3] });
  expectTypeOf(rows).toEqualTypeOf<readonly VectorNearestRow[]>();
  expectTypeOf(rows[0]!.id).toEqualTypeOf<string>();
  expectTypeOf(rows[0]!.distance).toEqualTypeOf<number | NonfiniteNumber>();
  const plan = await session.explain({ ...target, kind: "vector", metric: "l2", probe: [1, 2, 3] });
  expectTypeOf(plan).toEqualTypeOf<readonly string[]>();

  // Every closed kind and metric pair, with its own probe type and an optional int4 equality filter.
  void session.nearest({ ...target, kind: "halfvec", metric: "negativeInnerProduct", probe: [0.5] });
  void session.nearest({
    ...target,
    kind: "sparsevec",
    metric: "cosine",
    probe: { dimensions: 3, entries: [{ index: 2, value: 1 }] },
  });
  void session.nearest({ ...vectorRequest, metric: "l1", int4Filter: { column: "category_id", equals: 7 } });
  void session.nearest({ ...target, kind: "bit", metric: "hamming", probe: { bits: "0101" } });
  void session.nearest({ ...target, kind: "bit", metric: "jaccard", probe: { bits: "" } });

  // @ts-expect-error bit supports only hamming and jaccard.
  void session.nearest({ ...bitRequest, metric: "l2" });
  // @ts-expect-error dense kinds do not accept bit metrics.
  void session.nearest({ ...vectorRequest, metric: "hamming" });
  // @ts-expect-error sparse probes cannot be used with a dense kind.
  void session.nearest({ ...vectorRequest, probe: { dimensions: 1, entries: [] } });
  // @ts-expect-error dense probes cannot be used with sparsevec.
  void session.nearest({ ...vectorRequest, kind: "sparsevec" });
  // @ts-expect-error a bit probe is wrapped bits, not text.
  void session.nearest({ ...bitRequest, probe: "0101" });
  // @ts-expect-error bit probes cannot be dense numbers.
  void session.nearest({ ...bitRequest, probe: [0, 1] });
  // @ts-expect-error unknown vector kinds are closed out.
  void session.nearest({ ...bitRequest, kind: "varbit" });
  // @ts-expect-error raw SQL is not a request field.
  void session.nearest({ ...vectorRequest, sql: "select 1" });
  // @ts-expect-error SQLWrapper expressions are not requests.
  void session.nearest(sql`select 1`);
  // @ts-expect-error raw SQL text is not a request.
  void session.nearest("select 1");
  // @ts-expect-error callers cannot select projections.
  void session.nearest({ ...vectorRequest, select: ["id"] });
  // @ts-expect-error callers cannot supply a decoder or generic output.
  void session.nearest({ ...vectorRequest, decode: (value: string) => value });
  // @ts-expect-error callers cannot select an operator token.
  void session.nearest({ ...vectorRequest, operator: "<->" });
  // @ts-expect-error the filter value is an int4 number, not text.
  void session.nearest({ ...vectorRequest, int4Filter: { column: "c", equals: "1" } });
  // @ts-expect-error there is no general filter language, only int4 equality.
  void session.nearest({ ...vectorRequest, int4Filter: { column: "c", equals: 1, operator: ">" } });
  // @ts-expect-error the limit is required.
  void session.nearest({ table, idColumn: "id", embeddingColumn: "e", kind: "vector", metric: "l2", probe: [1] });
  // @ts-expect-error nearest accepts no generic output or caller-selected row type.
  void session.nearest<{ readonly id: number }>(vectorRequest);
  // @ts-expect-error explain returns checked plan strings and accepts no generic output.
  void session.explain<readonly number[]>(vectorRequest);

  // The facade is closed: no client, runner, query, transaction or setting mutation capability.
  // @ts-expect-error no raw PostgreSQL client.
  void session.client;
  // @ts-expect-error no tracked generic runner.
  void session.run;
  // @ts-expect-error no SQL executor.
  void session.query;
  // @ts-expect-error no transaction control.
  void session.transaction;
  // @ts-expect-error no setting mutation.
  void session.setConfig;
  // @ts-expect-error no setting mutation by name.
  void session.set;
  // @ts-expect-error the facade is readonly.
  session.nearest = session.nearest;
  // @ts-expect-error no operation context is reachable.
  void session.context;
  // @ts-expect-error inspection takes no arguments, so it cannot select settings.
  void session.inspectSettings("hnsw.ef_search");

  // The callback result is the only generic source.
  return { count: rows.length, ids: rows.map((row) => row.id) };
});
expectTypeOf(result).toEqualTypeOf<
  Promise<{ readonly completion: "committed"; readonly value: { count: number; ids: string[] } }>
>();
void withVectorSearchSettings(url, descriptor, empty, async () => 1, new AbortController().signal);
expectTypeOf(withVectorSearchSettings(url, descriptor, {}, async () => "text")).resolves.toEqualTypeOf<{
  readonly completion: "committed";
  readonly value: string;
}>();

// @ts-expect-error settings are required, so an omitted baseline is spelled {} explicitly.
void withVectorSearchSettings(url, descriptor, async () => 1);
// @ts-expect-error the callback must return a promise.
void withVectorSearchSettings(url, descriptor, {}, () => 1);
// @ts-expect-error only the exact verified 0.8.6 descriptor type is accepted.
void withVectorSearchSettings(url, { ...descriptor, version: "0.8.5" }, {}, async () => 1);
// @ts-expect-error another extension's descriptor is not accepted.
void withVectorSearchSettings(url, { ...descriptor, name: "pg_trgm" }, {}, async () => 1);
// @ts-expect-error there is no mutable settings setter in the owner options.
void withVectorSearchSettings(url, descriptor, {}, async () => 1, undefined, { client: true });
// @ts-expect-error a settings object is not an abort signal.
void withVectorSearchSettings(url, descriptor, {}, async () => 1, {});

// @ts-expect-error the request compiler is private; requests are exercised only through the closed owner entry.
void leaf.compileVectorNearestRequest;
// @ts-expect-error the closed setting-name tuple is private.
void leaf.vectorSearchSettingNames;
// @ts-expect-error there is no raw query, client or run export.
void leaf.query;
