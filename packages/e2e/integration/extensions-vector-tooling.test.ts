import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import {
  withVectorSearchSettings,
  type VectorBitRequest,
  type VectorDenseRequest,
  type VectorNearestRequest,
  type VectorNearestRow,
  type VectorSearchSession,
  type VectorSearchSettings,
  type VectorSettingsSnapshot,
} from "../../../apps/loom/src/tooling/extensions/vector";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { vectorSchema } from "../fixtures/vector-codecs";
import {
  absent,
  bounded,
  descriptor,
  holdRelationLock,
  indexAccessMethod,
  indexScans,
  lists,
  lockedOwners,
  oracleIndexes,
  oracleNearest,
  oracleSettings,
  overlay,
  ownerWitness,
  queryVector,
  recordOwnedBackends,
  settingNames,
  sourceDefaults,
  waitFor,
  withRuntimeRole,
  withVectorTooling,
  type Environment,
  type OracleKind,
  type OracleQuery,
  type OwnerWitness,
  type RecordedEvent,
  type TableNames,
} from "../fixtures/vector-tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
const timeout = 120_000;
const probeText = `[${queryVector.join(",")}]`;
const defaultSnapshot: VectorSettingsSnapshot = {
  "hnsw.ef_search": 40,
  "hnsw.iterative_scan": "off",
  "hnsw.max_scan_tuples": 20000,
  "hnsw.scan_mem_multiplier": 1,
  "ivfflat.probes": 1,
  "ivfflat.iterative_scan": "off",
  "ivfflat.max_probes": 32768,
};
const defaultText = new Map<string, string>(sourceDefaults);

const pairs = (settings: VectorSearchSettings) =>
  settingNames.flatMap((name) => {
    const value = settings[name];
    return value === undefined ? [] : [[name, String(value)] as const];
  });
const snapshotText = (snapshot: VectorSettingsSnapshot) =>
  new Map<string, string>(settingNames.map((name) => [name, String(snapshot[name])] as const));
const plain = (rows: readonly VectorNearestRow[]) => rows.map((row) => ({ id: row.id, distance: row.distance }));

function denseRequest(table: TableNames, limit: number, category?: number): VectorDenseRequest {
  const base = {
    table: table.table,
    idColumn: table.id,
    embeddingColumn: table.embedding,
    limit,
    kind: "vector",
    metric: "l2",
    probe: queryVector,
  } as const;
  return category === undefined ? base : { ...base, int4Filter: { column: table.category, equals: category } };
}
function denseOracle(table: TableNames, limit: number, settings: VectorSearchSettings, category?: number): OracleQuery {
  const base = { table, kind: "vector", metric: "l2", probe: probeText, limit, settings: pairs(settings) } as const;
  return category === undefined ? base : { ...base, filter: category };
}
const owner = <Result>(
  environment: Environment,
  settings: VectorSearchSettings,
  callback: (session: VectorSearchSession) => Promise<Result>,
  signal?: AbortSignal,
  url = environment.url,
) => withVectorSearchSettings(url, descriptor, settings, callback, signal);

/** Run and record the actual SQL and replies of every owned backend, whether the operation settles or rejects. */
async function observe<Value>(work: () => Promise<Value>) {
  const recorder = recordOwnedBackends();
  try {
    const outcome = await work().then(
      (value) => ({ value, error: undefined }),
      (error: Error) => ({ value: undefined, error }),
    );
    return { ...outcome, events: recorder.events };
  } finally {
    recorder.restore();
  }
}
/** Same-backend baseline, applied and native terminal-reset observations around the acknowledged reply. */
function expectReset(
  events: readonly RecordedEvent[],
  requested: readonly (readonly [string, string])[],
  command: "COMMIT" | "ROLLBACK",
  expectedBaseline?: ReadonlyMap<string, string>,
): OwnerWitness {
  const witness = ownerWitness(events);
  expect(witness.terminalCommand).toBe(command);
  expect(witness.baseline.size).toBe(7);
  if (expectedBaseline) expect(witness.baseline).toEqual(expectedBaseline);
  expect(witness.terminal).toEqual(witness.baseline);
  // The production observer compares reset_val too, so a hidden difference there cannot be a quiet cleanup failure.
  expect(witness.terminalResets).toEqual(witness.baselineResets);
  for (const resets of witness.activeResets) expect(resets).toEqual(witness.baselineResets);
  const applied = overlay(witness.baseline, requested);
  expect(witness.active.length).toBeGreaterThanOrEqual(1);
  for (const active of witness.active) expect(active).toEqual(applied);
  return witness;
}
function failed(error: Error | undefined, completion: "rolled-back" | "unknown" = "rolled-back") {
  assert.ok(error instanceof ExtensionOperationError, "Expected an extension operation failure");
  expect(error.completion).toBe(completion);
  // On an ordinary expected rollback the first cause is retained, so an observer failure would only appear here.
  expect(error.cleanupFailures).toEqual([]);
  return error;
}

test.skipIf(!connectionString)(
  "cold backend force-loads pgvector and observes the exact seven-row contract in a quoted Unicode schema",
  async () => {
    await withVectorTooling(async (environment) => {
      expect(vectorSchema).toBe('Vector_"Codec_日本');
      // Independent cold backend: nothing is registered before the C library is loaded.
      const cold = new pg.Client({ connectionString: environment.url });
      await cold.connect();
      try {
        const before = await cold.query(
          "SELECT count(*)::int AS count FROM pg_catalog.pg_settings WHERE name = ANY($1::pg_catalog.text[])",
          [[...settingNames]],
        );
        expect(before.rows).toEqual([{ count: 0 }]);
        await cold.query(
          `SELECT ${pg.escapeIdentifier(vectorSchema)}.vector_dims('[1]'::${pg.escapeIdentifier(vectorSchema)}.vector)`,
        );
        const registered = await cold.query(
          "SELECT name, vartype, context, unit, min_val, max_val, boot_val, enumvals::text AS enumvals FROM pg_catalog.pg_settings WHERE name = ANY($1::pg_catalog.text[]) ORDER BY name",
          [[...settingNames]],
        );
        // Independent copy of the tagged contract. Enum display order is not part of it.
        const contract = [
          ["hnsw.ef_search", "integer", "1", "1000", "40", null],
          ["hnsw.iterative_scan", "enum", null, null, "off", ["off", "relaxed_order", "strict_order"]],
          ["hnsw.max_scan_tuples", "integer", "1", "2147483647", "20000", null],
          ["hnsw.scan_mem_multiplier", "real", "1", "1000", "1", null],
          ["ivfflat.iterative_scan", "enum", null, null, "off", ["off", "relaxed_order"]],
          ["ivfflat.max_probes", "integer", "1", "32768", "32768", null],
          ["ivfflat.probes", "integer", "1", "32768", "1", null],
        ] as const;
        expect(registered.rows).toHaveLength(7);
        for (const [position, row] of registered.rows.entries()) {
          const [name, vartype, min, max, boot, enums] = contract[position]!;
          expect(row.name).toBe(name);
          expect(row.vartype).toBe(vartype);
          expect(row.context).toBe("user");
          expect(row.unit).toBeNull();
          expect(row.min_val).toBe(min);
          expect(row.max_val).toBe(max);
          expect(row.boot_val).toBe(boot);
          if (enums === null) expect(row.enumvals).toBeNull();
          else
            expect(v.parse(v.string(), row.enumvals).slice(1, -1).split(",").toSorted()).toEqual([...enums].toSorted());
        }
        const independent = new Map(
          (
            await cold.query(
              "SELECT name, current_setting(name) AS setting FROM pg_catalog.pg_settings WHERE name = ANY($1::pg_catalog.text[])",
              [[...settingNames]],
            )
          ).rows.map((row: { name: string; setting: string }) => [row.name, row.setting] as const),
        );
        expect(independent).toEqual(defaultText);
      } finally {
        await cold.end();
      }
      // A cold owner loads the library itself before reading and applying settings.
      const recorded = await observe(() => owner(environment, {}, (session) => session.inspectSettings()));
      expect(recorded.error).toBeUndefined();
      expect(recorded.value).toEqual({ completion: "committed", value: defaultSnapshot });
      const witness = expectReset(recorded.events, [], "COMMIT", defaultText);
      // The first owned statements force the load, before any pg_settings observation.
      const load = witness.events.findIndex((event) => event.sql.includes(".vector_dims("));
      const firstRead = witness.events.findIndex((event) => event.sql.includes("FROM pg_catalog.pg_settings"));
      expect(load).toBeGreaterThanOrEqual(0);
      expect(load).toBeLessThan(firstRead);
    });
  },
  timeout,
);

test.skipIf(!connectionString)(
  "wrong placement fails before the callback and a different runtime role proves native privileges and baselines",
  async () => {
    await withVectorTooling(async (environment) => {
      let entered = false;
      const wrongPlacement = await withVectorSearchSettings(
        environment.url,
        { ...descriptor, schema: "public" },
        {},
        async () => {
          entered = true;
        },
      ).then(
        () => undefined,
        (error: Error) => error,
      );
      expect(failed(wrongPlacement).cause).toMatchObject({ message: expect.stringMatching(/namespace mismatch/) });
      expect(entered).toBe(false);

      const roleBaseline = [
        ["hnsw.ef_search", "123"],
        ["hnsw.iterative_scan", "relaxed_order"],
        ["hnsw.scan_mem_multiplier", "2.5"],
        ["ivfflat.probes", "4"],
        ["ivfflat.iterative_scan", "relaxed_order"],
      ] as const;
      await withRuntimeRole(environment, roleBaseline, async (roleUrl, denied) => {
        // The role's actual native baseline is neither the compiled default nor assumed by the leaf.
        const expectedBaseline = overlay(defaultText, roleBaseline);
        const requested: VectorSearchSettings = { "hnsw.ef_search": 77, "ivfflat.max_probes": 9 };
        const request = denseRequest(environment.hnsw, 8);
        const ran = await observe(() =>
          owner(
            environment,
            requested,
            async (session) => ({ settings: await session.inspectSettings(), rows: await session.nearest(request) }),
            undefined,
            roleUrl,
          ),
        );
        expect(ran.error).toBeUndefined();
        assert.ok(ran.value);
        expect(ran.value.value.settings).toEqual({
          ...defaultSnapshot,
          "hnsw.ef_search": 77,
          "hnsw.iterative_scan": "relaxed_order",
          "hnsw.scan_mem_multiplier": 2.5,
          "ivfflat.probes": 4,
          "ivfflat.iterative_scan": "relaxed_order",
          "ivfflat.max_probes": 9,
        });
        const witness = expectReset(ran.events, pairs(requested), "COMMIT", expectedBaseline);
        // The actual native role baseline is restored exactly, with another independent role session as oracle.
        expect(witness.terminal).toEqual(expectedBaseline);
        expect(await oracleSettings(roleUrl, pairs(requested))).toEqual(overlay(expectedBaseline, pairs(requested)));
        expect(plain(ran.value.value.rows)).toEqual(
          await oracleNearest(roleUrl, denseOracle(environment.hnsw, 8, requested)),
        );

        // Catalogue equality passed at admission; the missing table privilege is a distinct native denial.
        const denial = await observe(() =>
          owner(environment, requested, (session) => session.nearest(denseRequest(denied, 3)), undefined, roleUrl),
        );
        const error = failed(denial.error);
        expect(error.cause).toBeInstanceOf(pg.DatabaseError);
        expect(error.cause).toMatchObject({ code: "42501" });
        expectReset(denial.events, pairs(requested), "ROLLBACK", expectedBaseline);
      });
    });
  },
  timeout,
);

const matrix: readonly (readonly [string, VectorSearchSettings])[] = [
  [
    "all seven non-default",
    {
      "hnsw.ef_search": 80,
      "hnsw.iterative_scan": "strict_order",
      "hnsw.max_scan_tuples": 5000,
      "hnsw.scan_mem_multiplier": 1.5,
      "ivfflat.probes": 3,
      "ivfflat.iterative_scan": "relaxed_order",
      "ivfflat.max_probes": 7,
    },
  ],
  [
    "all minimums",
    {
      "hnsw.ef_search": 1,
      "hnsw.iterative_scan": "off",
      "hnsw.max_scan_tuples": 1,
      "hnsw.scan_mem_multiplier": 1,
      "ivfflat.probes": 1,
      "ivfflat.iterative_scan": "off",
      "ivfflat.max_probes": 1,
    },
  ],
  [
    // Set and read only: the maximum tuple cap is never used to run a billion-tuple search.
    "all maximums",
    {
      "hnsw.ef_search": 1000,
      "hnsw.iterative_scan": "strict_order",
      "hnsw.max_scan_tuples": 2147483647,
      "hnsw.scan_mem_multiplier": 1000,
      "ivfflat.probes": 32768,
      "ivfflat.iterative_scan": "relaxed_order",
      "ivfflat.max_probes": 32768,
    },
  ],
  ["hnsw relaxed_order", { "hnsw.iterative_scan": "relaxed_order" }],
  ["hnsw strict_order", { "hnsw.iterative_scan": "strict_order" }],
  ["hnsw off", { "hnsw.iterative_scan": "off" }],
  ["ivfflat relaxed_order", { "ivfflat.iterative_scan": "relaxed_order" }],
  ["ivfflat off", { "ivfflat.iterative_scan": "off" }],
  ["fractional real", { "hnsw.scan_mem_multiplier": 1.5 }],
  ["real near maximum", { "hnsw.scan_mem_multiplier": 999.5 }],
  ["max_probes below probes", { "ivfflat.probes": 50, "ivfflat.max_probes": 5 }],
  ["probes above lists", { "ivfflat.probes": lists * 2 }],
  ["empty settings leave the baseline", {}],
];

test.skipIf(!connectionString)(
  "every setting value is observed natively inside the callback and matches an independent session",
  async () => {
    await withVectorTooling(async (environment) => {
      for (const [label, settings] of matrix) {
        const ran = await observe(() => owner(environment, settings, (session) => session.inspectSettings()));
        expect(ran.error, label).toBeUndefined();
        assert.ok(ran.value, label);
        expect(ran.value.completion).toBe("committed");
        expect(ran.value.value, label).toEqual({ ...defaultSnapshot, ...settings });
        expect(snapshotText(ran.value.value), label).toEqual(await oracleSettings(environment.url, pairs(settings)));
        // Same-backend native reset after the acknowledged COMMIT, not a fresh-session check.
        expectReset(ran.events, pairs(settings), "COMMIT", defaultText);
      }
      // pg_settings renders reals with %g, so a many-digit real is observed at six significant digits.
      const precise = await owner(environment, { "hnsw.scan_mem_multiplier": 1.23456789 }, (session) =>
        session.inspectSettings(),
      );
      expect(precise.value["hnsw.scan_mem_multiplier"]).toBeCloseTo(1.23456789, 5);
      expect(snapshotText(precise.value)).toEqual(
        await oracleSettings(environment.url, [["hnsw.scan_mem_multiplier", "1.23456789"]]),
      );
    });
  },
  timeout,
);

for (const [method, index, settings, filtered] of [
  ["hnsw", "hnsw", { "hnsw.ef_search": 60 }, { "hnsw.ef_search": 20, "hnsw.max_scan_tuples": 20000 }],
  ["ivfflat", "ivfflat", { "ivfflat.probes": 5 }, { "ivfflat.probes": 2, "ivfflat.max_probes": 10 }],
] as const) {
  test.skipIf(!connectionString)(
    `${method} ANN explain names the intended index and nearest executes it like an independent raw query`,
    async () => {
      await withVectorTooling(async (environment) => {
        const table = environment[index];
        assert.ok(table.index);
        expect(await indexAccessMethod(environment.admin, table.table.schema, table.index)).toBe(method);
        for (const [limit, selected] of [
          [10, {}],
          [10, settings],
          [25, settings],
        ] as const) {
          const request = denseRequest(table, limit);
          const oracle = denseOracle(table, limit, selected);
          const plan = await owner(environment, selected, (session) => session.explain(request));
          expect(plan.completion).toBe("committed");
          expect(plan.value.length).toBeGreaterThan(0);
          expect(plan.value.some((line) => line.includes(`Index Scan using ${table.index}`))).toBe(true);
          expect(await oracleIndexes(environment.url, oracle)).toContain(table.index);
          // A planned index scan is not executed-query evidence: nearest must actually scan the index.
          const scansBefore = await indexScans(environment.admin, table.table.schema, table.index);
          const ran = await owner(environment, selected, (session) => session.nearest(request));
          await waitFor(
            async () => (await indexScans(environment.admin, table.table.schema, table.index!)) > scansBefore,
            "The executed nearest query never scanned the intended index",
          );
          expect(ran.value.length).toBeGreaterThan(0);
          expect(ran.value.length).toBeLessThanOrEqual(limit);
          // Approximate output is compared with the same raw query, not with exact nearest-neighbor recall.
          expect(plain(ran.value)).toEqual(await oracleNearest(environment.url, oracle));
          // The leaf never reorders: native order, including any relaxed order, is returned unchanged.
        }
        // Filtered category query under every iterative mode.
        const modes =
          method === "hnsw"
            ? (["off", "relaxed_order", "strict_order"] as const).map((mode): VectorSearchSettings => ({
                ...filtered,
                "hnsw.iterative_scan": mode,
              }))
            : (["off", "relaxed_order"] as const).map((mode): VectorSearchSettings => ({
                ...filtered,
                "ivfflat.iterative_scan": mode,
              }));
        for (const selected of modes) {
          const request = denseRequest(table, 12, 3);
          const ran = await owner(environment, selected, async (session) => ({
            rows: await session.nearest(request),
            plan: await session.explain(request),
          }));
          expect(ran.value.plan.some((line) => line.includes(table.index!))).toBe(true);
          expect(plain(ran.value.rows)).toEqual(
            await oracleNearest(environment.url, denseOracle(table, 12, selected, 3)),
          );
          if (selected["hnsw.iterative_scan"] === "strict_order") {
            const distances = ran.value.rows.map((row) => Number(row.distance));
            expect(distances).toEqual(distances.toSorted((left, right) => left - right));
          }
        }
        // Unfiltered query remains valid beside the filtered one.
        expect((await owner(environment, {}, (session) => session.nearest(denseRequest(table, 5)))).value).toHaveLength(
          5,
        );
      });
    },
    timeout,
  );
}

test.skipIf(!connectionString)(
  "IVFFlat probes above the list count and max_probes below probes remain valid native settings",
  async () => {
    await withVectorTooling(async (environment) => {
      const table = environment.ivfflat;
      for (const settings of [
        { "ivfflat.probes": lists * 3 },
        { "ivfflat.probes": 32768 },
        { "ivfflat.probes": 50, "ivfflat.max_probes": 5 },
        { "ivfflat.iterative_scan": "relaxed_order", "ivfflat.probes": 50, "ivfflat.max_probes": 5 },
      ] as const satisfies readonly VectorSearchSettings[]) {
        const request = denseRequest(table, 10, 4);
        const ran = await owner(environment, settings, async (session) => ({
          settings: await session.inspectSettings(),
          rows: await session.nearest(request),
          plan: await session.explain(request),
        }));
        expect(ran.value.settings).toMatchObject(settings);
        // Either the intended index or a truthful planner choice is observed; the query itself always executes.
        expect(ran.value.plan.length).toBeGreaterThan(0);
        expect(plain(ran.value.rows)).toEqual(
          await oracleNearest(environment.url, denseOracle(table, 10, settings, 4)),
        );
      }
    });
  },
  timeout,
);

const metrics = [
  ["vector", ["l2", "negativeInnerProduct", "cosine", "l1"]],
  ["halfvec", ["l2", "negativeInnerProduct", "cosine", "l1"]],
  ["sparsevec", ["l2", "negativeInnerProduct", "cosine", "l1"]],
  ["bit", ["hamming", "jaccard"]],
] as const;
interface NativeVariantRequest {
  readonly request: VectorNearestRequest;
  readonly probe: string;
}
function variantRequest(
  environment: Environment,
  kind: OracleKind,
  metric: string,
): NativeVariantRequest {
  const table = environment.small[kind];
  const base = { table: table.table, idColumn: table.id, embeddingColumn: table.embedding, limit: 6 } as const;
  switch (kind) {
    case "vector":
    case "halfvec":
      return {
        request: {
          ...base,
          kind,
          metric: v.parse(v.picklist(["l2", "negativeInnerProduct", "cosine", "l1"]), metric),
          probe: [1, 2, 0.5],
        },
        probe: "[1,2,0.5]",
      };
    case "sparsevec":
      return {
        request: {
          ...base,
          kind,
          metric: v.parse(v.picklist(["l2", "negativeInnerProduct", "cosine", "l1"]), metric),
          probe: {
            dimensions: 4,
            entries: [
              { index: 1, value: 1 },
              { index: 3, value: 2 },
            ],
          },
        },
        probe: "{1:1,3:2}/4",
      };
    case "bit":
      return {
        request: {
          ...base,
          kind,
          metric: v.parse(v.picklist(["hamming", "jaccard"]), metric),
          probe: { bits: "0101" },
        },
        probe: "0101",
      };
  }
}
const distanceKey = (distance: VectorNearestRow["distance"]) => String(Number(distance));
/** Preserve the native distance order; sort ids only inside runs of equal distance (ties are unspecified). */
function tieNormalized<Row extends { readonly id: string; readonly distance: VectorNearestRow["distance"] }>(
  rows: readonly Row[],
): Row[] {
  const normalized: Row[] = [];
  let group: Row[] = [];
  const flush = () => {
    normalized.push(...group.toSorted((left, right) => left.id.localeCompare(right.id)));
    group = [];
  };
  for (const row of rows) {
    if (group.length > 0 && distanceKey(group[0]!.distance) !== distanceKey(row.distance)) flush();
    group.push(row);
  }
  flush();
  return normalized;
}
const nativeDistance = (value: number): VectorNearestRow["distance"] =>
  Number.isNaN(value)
    ? { nonfinite: "NaN" }
    : value === Number.POSITIVE_INFINITY
      ? { nonfinite: "Infinity" }
      : value === Number.NEGATIVE_INFINITY
        ? { nonfinite: "-Infinity" }
        : value;

test.skipIf(!connectionString)(
  "every kind and metric executes its exact native operator, plus hostile identifiers stay data",
  async () => {
    await withVectorTooling(async (environment) => {
      for (const [kind, kindMetrics] of metrics) {
        for (const metric of kindMetrics) {
          const { request, probe } = variantRequest(environment, kind, metric);
          const ran = await owner(environment, {}, (session) => session.nearest(request));
          const oracle = await oracleNearest(environment.url, {
            table: environment.small[kind],
            kind,
            metric,
            probe,
            limit: 6,
            settings: [],
          });
          expect(ran.value, `${kind} ${metric}`).toHaveLength(6);
          // Exact native distance order first; only equal-distance ids are then normalised.
          expect(
            ran.value.map((row) => row.distance),
            `${kind} ${metric} distance order`,
          ).toEqual(oracle.map((row) => nativeDistance(row.distance)));
          expect(tieNormalized(plain(ran.value)), `${kind} ${metric}`).toEqual(tieNormalized(oracle));
        }
      }
      // Negative inner product remains the native negative value, not a converted similarity.
      const inner = await owner(environment, {}, (session) =>
        session.nearest(variantRequest(environment, "vector", "negativeInnerProduct").request),
      );
      expect(inner.value.some((row) => Number(row.distance) < 0)).toBe(true);
      // Filtered query on a small relation, and the explain of a non-indexed kind is a truthful exact scan.
      const small = environment.small.vector;
      const base = variantRequest(environment, "vector", "l2").request;
      const filtered = await owner(environment, {}, (session) =>
        session.nearest({ ...base, int4Filter: { column: small.category, equals: 1 } }),
      );
      expect(filtered.value).toHaveLength(3);
      const exact = await owner(environment, {}, (session) => session.explain(base));
      expect(exact.value.some((line) => line.includes("Seq Scan"))).toBe(true);

      // Hostile identifiers are bound %I data. No injected statement can run or change anything.
      const { admin } = environment;
      const hostile = {
        schema: 'evil"; DROP TABLE victim; --',
        table: 'docs"); DROP SCHEMA public CASCADE; --',
        id: 'id\\"; select 1; --',
        embedding: "embeddingé日本",
      };
      const q = pg.escapeIdentifier;
      await admin.query("CREATE TABLE public.victim (id int)");
      await admin.query("INSERT INTO public.victim VALUES (1)");
      await admin.query(`CREATE SCHEMA ${q(hostile.schema)}`);
      await admin.query(
        `CREATE TABLE ${q(hostile.schema)}.${q(hostile.table)} (${q(hostile.id)} int8, ${q(hostile.embedding)} ${q(vectorSchema)}.vector(3))`,
      );
      await admin.query(
        `INSERT INTO ${q(hostile.schema)}.${q(hostile.table)} VALUES (1,'[1,2,3]'),(2,'[3,2,1]'),(3,NULL)`,
      );
      const hostileRequest: VectorNearestRequest = {
        table: { schema: hostile.schema, name: hostile.table },
        idColumn: hostile.id,
        embeddingColumn: hostile.embedding,
        limit: 10,
        kind: "vector",
        metric: "l2",
        probe: [1, 2, 3],
      };
      const found = await owner(environment, {}, (session) => session.nearest(hostileRequest));
      // NULL embeddings are excluded; the first row is the exact match.
      expect(plain(found.value)).toEqual([
        { id: "1", distance: 0 },
        { id: "2", distance: Math.sqrt(8) },
      ]);
      expect((await admin.query("SELECT id FROM public.victim")).rows).toEqual([{ id: 1 }]);
      expect(
        (await admin.query("SELECT count(*)::int AS count FROM pg_catalog.pg_namespace WHERE nspname = 'public'")).rows,
      ).toEqual([{ count: 1 }]);
    });
  },
  timeout,
);

test.skipIf(!connectionString)(
  "same-backend terminal reset is observed after COMMIT and ROLLBACK for every ordinary failure shape",
  async () => {
    await withVectorTooling(async (environment) => {
      const requested: VectorSearchSettings = {
        "hnsw.ef_search": 77,
        "hnsw.iterative_scan": "strict_order",
        "ivfflat.probes": 3,
      };
      const selected = pairs(requested);
      const good = denseRequest(environment.hnsw, 5);
      const reset = (events: readonly RecordedEvent[], command: "COMMIT" | "ROLLBACK") =>
        expectReset(events, selected, command, defaultText);

      // Successful COMMIT.
      const success = await observe(() =>
        owner(environment, requested, async (session) => ({
          settings: await session.inspectSettings(),
          rows: await session.nearest(good),
        })),
      );
      expect(success.error).toBeUndefined();
      expect(success.value?.completion).toBe("committed");
      expect(success.value?.value.settings["hnsw.ef_search"]).toBe(77);
      expect(success.value?.value.rows).toHaveLength(5);
      reset(success.events, "COMMIT");

      // Callback throw after executing SQL.
      const cause = new Error("exact callback cause");
      const thrown = await observe(() =>
        owner(environment, requested, async (session) => {
          await session.nearest(good);
          throw cause;
        }),
      );
      expect(failed(thrown.error).cause).toBe(cause);
      reset(thrown.events, "ROLLBACK");

      // Genuinely failing SQL: dimension mismatch, then a missing relation.
      const mismatch = await observe(() =>
        owner(environment, requested, (session) => session.nearest({ ...good, probe: [1, 2, 3] })),
      );
      const mismatchError = failed(mismatch.error);
      expect(mismatchError.cause).toBeInstanceOf(pg.DatabaseError);
      expect(mismatchError.cause).toMatchObject({ message: expect.stringMatching(/dimension/i) });
      reset(mismatch.events, "ROLLBACK");
      const missing = await observe(() =>
        owner(environment, requested, (session) =>
          session.nearest({ ...good, table: { schema: environment.annSchema, name: "no such table" } }),
        ),
      );
      expect(failed(missing.error).cause).toMatchObject({ code: "42P01" });
      reset(missing.events, "ROLLBACK");

      // A caught method failure still poisons the owner and retains the exact first cause.
      let caught: Error | undefined;
      const swallowed = await observe(() =>
        owner(environment, requested, async (session) => {
          try {
            await session.nearest({ ...good, probe: [1, 2, 3] });
          } catch (error) {
            caught = error instanceof Error ? error : undefined;
          }
          return "caught";
        }),
      );
      expect(caught).toBeInstanceOf(pg.DatabaseError);
      expect(failed(swallowed.error).cause).toBe(caught);
      reset(swallowed.events, "ROLLBACK");

      // An unawaited failing pipeline is accepted, drained, and fails the operation.
      const unawaitedFailure = await observe(() =>
        owner(environment, requested, async (session) => {
          void session.nearest({ ...good, probe: [1, 2, 3] }).catch(() => undefined);
          return "returned before the failure";
        }),
      );
      expect(failed(unawaitedFailure.error).cause).toBeInstanceOf(pg.DatabaseError);
      reset(unawaitedFailure.events, "ROLLBACK");

      // An unawaited successful pipeline drains before the native COMMIT and before the terminal observation.
      let drained: readonly VectorNearestRow[] | undefined;
      const unawaited = await observe(() =>
        owner(environment, requested, async (session) => {
          void session.nearest(good).then((rows) => {
            drained = rows;
          });
          return "returned before the query";
        }),
      );
      expect(unawaited.value?.completion).toBe("committed");
      expect(drained).toHaveLength(5);
      const witness = reset(unawaited.events, "COMMIT");
      const executed = witness.events.findIndex((event) => event.sql.includes("AS distance") && !event.failed);
      const committed = witness.events.findIndex((event) => event.command === "COMMIT");
      expect(executed).toBeGreaterThanOrEqual(0);
      expect(executed).toBeLessThan(committed);

      // Validation failures never reach SQL, yet still poison the owner when caught.
      const invalid = await observe(() =>
        owner(environment, requested, async (session) => {
          let failure: Error | undefined;
          try {
            await session.nearest({ ...good, limit: 0 });
          } catch (error) {
            failure = error instanceof Error ? error : undefined;
          }
          expect(failure).toBeDefined();
          await expect(session.inspectSettings()).rejects.toBe(failure);
          return failure;
        }),
      );
      const invalidError = failed(invalid.error);
      expect(invalidError.cause).toBeInstanceOf(Error);
      expect(invalid.events.some((event) => event.sql.includes("AS distance"))).toBe(false);
      // Only the library-load format statement ran; the request was never formatted.
      expect(
        invalid.events.filter((event) => event.sql.startsWith("SELECT pg_catalog.format($1::pg_catalog.text,")).length,
      ).toBe(1);
      reset(invalid.events, "ROLLBACK");

      // Initialization failure before a baseline exists makes no restoration claim and issues no reads.
      const noBaseline = await observe(() =>
        withVectorSearchSettings(
          environment.url,
          { ...descriptor, schema: "public" },
          requested,
          async () => "forbidden",
        ),
      );
      failed(noBaseline.error);
      expect(noBaseline.events.some((event) => event.sql.includes("FROM pg_catalog.pg_settings"))).toBe(false);
    });
  },
  timeout,
);

test.skipIf(!connectionString)(
  "owners are isolated, late tasks are refused while accepted work drains, and role state never leaks between owners",
  async () => {
    await withVectorTooling(async (first) => {
      await withVectorTooling(async (second) => {
        // Advisory extension locks are per database, so concurrent owners use independent databases.
        const entered = Promise.withResolvers<void>();
        const resume = Promise.withResolvers<void>();
        let retained: VectorSearchSession | undefined;
        const firstOwner = owner(first, { "hnsw.ef_search": 11 }, async (session) => {
          retained = session;
          entered.resolve();
          await resume.promise;
          return (await session.inspectSettings())["hnsw.ef_search"];
        });
        void firstOwner.catch(() => undefined);
        try {
          await bounded(entered.promise);
          const result = await owner(second, { "hnsw.ef_search": 22 }, async (session) => {
            assert.ok(retained);
            await assert.rejects(retained.inspectSettings(), /different owner/);
            await assert.rejects(retained.nearest(denseRequest(first.hnsw, 3)), /different owner/);
            return (await session.inspectSettings())["hnsw.ef_search"];
          });
          expect(result.value).toBe(22);
        } finally {
          resume.resolve();
        }
        expect((await bounded(firstOwner)).value).toBe(11);
        // Saved facades are refused after both owners have ended.
        assert.ok(retained);
        await assert.rejects(retained.inspectSettings(), /inactive|owner/);
        // The next independent owner sees only its native baseline, never either owner's settings.
        expect((await owner(second, {}, (session) => session.inspectSettings())).value).toEqual(defaultSnapshot);
      });

      // Late descendant task while accepted native work drains: a real relation lock keeps the query pending.
      const lock = await holdRelationLock(first.url, first.hnsw);
      const attempt = Promise.withResolvers<void>();
      const attempted = Promise.withResolvers<boolean>();
      const admitted = Promise.withResolvers<void>();
      let late: VectorSearchSession | undefined;
      let rows: readonly VectorNearestRow[] | undefined;
      let settled = false;
      const pending = owner(first, { "hnsw.ef_search": 33 }, async (session) => {
        late = session;
        void session.nearest(denseRequest(first.hnsw, 4)).then((result) => {
          rows = result;
        });
        admitted.resolve();
        // This continuation inherits the exact callback owner but first enters after callback settlement.
        void attempt.promise
          .then(() => session.inspectSettings())
          .then(
            () => attempted.resolve(false),
            () => attempted.resolve(true),
          );
        return "drained";
      });
      const outcome = pending.then(
        (value) => {
          settled = true;
          return value;
        },
        (error: Error) => {
          settled = true;
          throw error;
        },
      );
      void outcome.catch(() => undefined);
      try {
        // Begin the short native lock-observation window after actual callback admission,
        // rather than while the provider is still acquiring/verifying the owner connection.
        await bounded(admitted.promise, 120_000);
        await waitFor(
          async () => (await lockedOwners(first.admin)).length === 1,
          "Accepted query never reached the lock",
        );
        expect(settled).toBe(false);
        attempt.resolve();
        expect(await bounded(attempted.promise)).toBe(true);
        assert.ok(late);
        await assert.rejects(late.inspectSettings(), /inactive|owner/);
        await assert.rejects(late.nearest(denseRequest(first.hnsw, 4)), /inactive|owner/);
        expect(rows).toBeUndefined();
      } finally {
        attempt.resolve();
        await lock.release();
      }
      expect((await bounded(outcome)).value).toBe("drained");
      expect(rows).toHaveLength(4);
    });
  },
  timeout,
);

for (const native of [true, false]) {
  test.skipIf(!connectionString)(
    `${native ? "pending native ANN query" : "never-settling callback"} cancellation removes the backend and refuses escaped facades`,
    async () => {
      await withVectorTooling(async (environment) => {
        const controller = new AbortController();
        const reason = new Error("Exact vector cancellation cause");
        const lock = native ? await holdRelationLock(environment.url, environment.hnsw) : undefined;
        const callbackSettled = Promise.withResolvers<void>();
        const reached = Promise.withResolvers<void>();
        const hold = Promise.withResolvers<void>();
        let retained: VectorSearchSession | undefined;
        let published = false;
        const pending = owner(
          environment,
          { "hnsw.ef_search": 55 },
          async (session) => {
            retained = session;
            try {
              await session.inspectSettings();
              if (native) {
                reached.resolve();
                await session.nearest(denseRequest(environment.hnsw, 5));
              }
              else {
                reached.resolve();
                await hold.promise;
              }
              published = true;
              return "late";
            } finally {
              callbackSettled.resolve();
            }
          },
          controller.signal,
        );
        const outcome = pending.then(
          () => undefined,
          (error: Error) => error,
        );
        try {
          let pid = 0;
          if (native) {
            // Actual pg_stat_activity/lock evidence that the closed ANN query is blocked on the relation.
            await bounded(reached.promise, 120_000);
            await waitFor(async () => (await lockedOwners(environment.admin)).length === 1, "ANN query never blocked");
            pid = (await lockedOwners(environment.admin))[0]!;
            const waiting = await environment.admin.query(
              "SELECT count(*)::int AS count FROM pg_catalog.pg_locks WHERE pid = $1 AND NOT granted",
              [pid],
            );
            expect(waiting.rows).toEqual([{ count: 1 }]);
          } else {
            await bounded(reached.promise);
            const idleOwners = async () => {
              await environment.admin.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
              return (
                await environment.admin.query(
                  "SELECT pid FROM pg_catalog.pg_stat_activity WHERE application_name = 'loom-migrations' AND datname = current_database() AND state = 'idle in transaction'",
                )
              ).rows;
            };
            await waitFor(async () => (await idleOwners()).length === 1, "Owner never idled inside its transaction");
            pid = v.parse(v.number(), (await idleOwners())[0].pid);
          }
          controller.abort(reason);
          const error = await bounded(outcome);
          assert.ok(error instanceof ExtensionOperationError);
          expect(error.cause).toBe(reason);
          expect(error.completion).toBe("rolled-back");
          expect(error.cleanupFailures).toEqual([]);
          expect(await absent(environment.admin, pid)).toBe(true);
          expect(
            (
              await environment.admin.query("SELECT count(*)::int AS count FROM pg_catalog.pg_locks WHERE pid = $1", [
                pid,
              ])
            ).rows[0].count,
          ).toBe(0);
          expect(published).toBe(false);
          assert.ok(retained);
          await assert.rejects(retained.nearest(denseRequest(environment.hnsw, 5)), /inactive|owner/);
          await assert.rejects(retained.inspectSettings(), /inactive|owner/);
          await lock?.release();
          // The terminated backend has no live settings to read; an independent new owner shows the native baseline.
          expect((await owner(environment, {}, (session) => session.inspectSettings())).value).toEqual(defaultSnapshot);
          expect(await oracleSettings(environment.url, [])).toEqual(defaultText);
        } finally {
          hold.resolve();
          await lock?.release().catch(() => undefined);
          await pending.catch(() => undefined);
          await bounded(callbackSettled.promise);
        }
      });
    },
    timeout,
  );
}

/** Same request with deliberately invalid fields; the values are never cloned, so NaN and arrays survive. */
function override(request: VectorNearestRequest, changes: ReturnType<typeof JSON.parse>): VectorNearestRequest {
  return { ...request, ...changes };
}
function denseTable(environment: Environment, kind: "vector" | "halfvec" = "vector"): VectorDenseRequest {
  const table = environment.small[kind];
  return {
    table: table.table,
    idColumn: table.id,
    embeddingColumn: table.embedding,
    limit: 6,
    kind,
    metric: "l2",
    probe: [1, 2, 0.5],
  };
}
function bitTable(environment: Environment, metric: "hamming" | "jaccard"): VectorBitRequest {
  const table = environment.small.bit;
  return {
    table: table.table,
    idColumn: table.id,
    embeddingColumn: table.embedding,
    limit: 6,
    kind: "bit",
    metric,
    probe: { bits: "0101" },
  };
}

test.skipIf(!connectionString)(
  "closed entry rejects every invalid request before SQL and a caught rejection still forces owner rollback",
  async () => {
    await withVectorTooling(async (environment) => {
      const vector = denseTable(environment);
      const halfvec = denseTable(environment, "halfvec");
      const bit = bitTable(environment, "hamming");
      const sparse = variantRequest(environment, "sparsevec", "l2").request;
      const table = environment.small.vector.table;
      const filter = { column: environment.small.vector.category, equals: 1 };
      const invalid: readonly (readonly [string, VectorNearestRequest])[] = [
        ["raw sql key", override(vector, { sql: "select 1" })],
        ["SQLWrapper-like key", override(vector, { getSQL: "x" })],
        ["projection key", override(vector, { select: ["id"] })],
        ["decoder key", override(vector, { decode: "x" })],
        ["operator key", override(vector, { operator: "<->" })],
        ["unknown kind", override(vector, { kind: "varbit" })],
        ["bit metric on vector", override(vector, { metric: "hamming" })],
        ["dense metric on bit", override(bit, { metric: "l2" })],
        ["unknown metric", override(vector, { metric: "chebyshev" })],
        ["zero limit", override(vector, { limit: 0 })],
        ["negative limit", override(vector, { limit: -1 })],
        ["fractional limit", override(vector, { limit: 1.5 })],
        ["limit above int4", override(vector, { limit: 2147483648 })],
        ["string limit", override(vector, { limit: "5" })],
        ["filter above int4", override(vector, { int4Filter: { ...filter, equals: 2147483648 } })],
        ["filter fractional", override(vector, { int4Filter: { ...filter, equals: 0.5 } })],
        ["filter string", override(vector, { int4Filter: { ...filter, equals: "1" } })],
        ["filter extra key", override(vector, { int4Filter: { ...filter, operator: "<>" } })],
        ["filter NUL column", override(vector, { int4Filter: { ...filter, column: "a\u0000b" } })],
        ["filter array", override(vector, { int4Filter: [] })],
        ["table extra key", override(vector, { table: { ...table, alias: "x" } })],
        ["table array", override(vector, { table: [] })],
        ["empty table name", override(vector, { table: { schema: table.schema, name: "" } })],
        ["NUL id column", override(vector, { idColumn: "a\u0000b" })],
        ["64-byte embedding column", override(vector, { embeddingColumn: "é".repeat(32) })],
        ["numeric id column", override(vector, { idColumn: 1 })],
        ["string probe on vector", override(vector, { probe: "[1,2]" })],
        ["empty dense probe", override(vector, { probe: [] })],
        ["sparse probe on vector", override(vector, { probe: { dimensions: 1, entries: [] } })],
        ["dense probe on sparsevec", override(sparse, { probe: [1, 2] })],
        ["dense probe on bit", override(bit, { probe: [0, 1] })],
        ["non-binary bit probe", override(bit, { probe: { bits: "012" } })],
        ["float4 overflow", override(vector, { probe: [1e39, 0, 0] })],
        ["float4 underflow", override(vector, { probe: [1e-50, 0, 0] })],
        ["halfvec overflow", override(halfvec, { probe: [65520, 0, 0] })],
        [
          "unordered sparse probe",
          override(sparse, {
            probe: {
              dimensions: 4,
              entries: [
                { index: 4, value: 1 },
                { index: 2, value: 1 },
              ],
            },
          }),
        ],
        ["too many dimensions", override(vector, { probe: Array.from({ length: 16001 }, () => 1) })],
        ["NaN element", override(vector, { probe: [Number.NaN, 0, 0] })],
        ["Infinity element", override(vector, { probe: [Number.POSITIVE_INFINITY, 0, 0] })],
        ["null request", JSON.parse("null")],
        ["array request", JSON.parse("[]")],
      ];
      for (const [label, request] of invalid) {
        let caught: Error | undefined;
        const ran = await observe(() =>
          owner(environment, {}, async (session) => {
            try {
              await session.nearest(request);
            } catch (error) {
              caught = error instanceof Error ? error : undefined;
            }
            // explain performs the same validation, and the owner is already poisoned with the first cause.
            await expect(session.explain(request)).rejects.toBe(caught);
            return "caught";
          }),
        );
        expect(caught, label).toBeDefined();
        const error = failed(ran.error);
        expect(error.cause, label).toBe(caught);
        // No request statement was formatted or executed; only the library-load format statement ran.
        expect(
          ran.events.some((event) => event.sql.includes("AS distance")),
          label,
        ).toBe(false);
        expect(
          ran.events.filter((event) => event.sql.startsWith("SELECT pg_catalog.format($1::pg_catalog.text,")).length,
          label,
        ).toBe(1);
        expectReset(ran.events, [], "ROLLBACK", defaultText);
      }
    });
  },
  240_000,
);

test.skipIf(!connectionString)(
  "closed entry encodes probes, int4 bounds and 63-byte names exactly as native input",
  async () => {
    await withVectorTooling(async (environment) => {
      // Float4 probe rounding: the native parse of the plain decimal and the leaf's rounded decimal agree.
      const probes = [
        ["vector", [0.1, 0.2, -0], "[0.1,0.2,-0]"],
        ["vector", [65520, 0, 1], "[65520,0,1]"],
        // Exactly representable halfvec values avoid halfvec_in's strtof-then-half double rounding.
        ["halfvec", [0.5, 0.25, 1.5], "[0.5,0.25,1.5]"],
      ] as const;
      for (const [kind, probe, text] of probes) {
        const request = { ...denseTable(environment, kind), probe };
        const ran = await owner(environment, {}, (session) => session.nearest(request));
        const oracle = await oracleNearest(environment.url, {
          table: environment.small[kind],
          kind,
          metric: "l2",
          probe: text,
          limit: 6,
          settings: [],
        });
        expect(
          ran.value.map((row) => row.distance),
          `${kind} ${text}`,
        ).toEqual(oracle.map((row) => nativeDistance(row.distance)));
        expect(tieNormalized(plain(ran.value)), `${kind} ${text}`).toEqual(tieNormalized(oracle));
      }
      // Bit probes keep every leading zero; the native comparison is against the same literal.
      for (const bits of ["0010", "0000", "1111"]) {
        const request = { ...bitTable(environment, "jaccard"), probe: { bits } };
        const ran = await owner(environment, {}, (session) => session.nearest(request));
        const oracle = await oracleNearest(environment.url, {
          table: environment.small.bit,
          kind: "bit",
          metric: "jaccard",
          probe: bits,
          limit: 6,
          settings: [],
        });
        expect(
          ran.value.map((row) => row.distance),
          bits,
        ).toEqual(oracle.map((row) => nativeDistance(row.distance)));
        expect(tieNormalized(plain(ran.value)), bits).toEqual(tieNormalized(oracle));
      }
      // A zero-length or wrong-length bit probe is a genuine native failure, not leaf-side padding or truncation.
      for (const bits of ["", "01", "010101"]) {
        const request = { ...bitTable(environment, "hamming"), probe: { bits } };
        const ran = await observe(() => owner(environment, {}, (session) => session.nearest(request)));
        const error = failed(ran.error);
        expect(error.cause).toBeInstanceOf(pg.DatabaseError);
        expect(error.cause).toMatchObject({ message: expect.stringMatching(/bit length/i) });
        expect(ran.events.some((event) => event.sql.includes("AS distance") && event.failed)).toBe(true);
        expectReset(ran.events, [], "ROLLBACK", defaultText);
      }
      // int4 extremes are bound natively: smallest filter value and largest limit.
      const small = environment.small.vector;
      const base = denseTable(environment);
      const empty = await owner(environment, {}, (session) =>
        session.nearest({ ...base, int4Filter: { column: small.category, equals: -2147483648 } }),
      );
      expect(empty.value).toEqual([]);
      const wide = await owner(environment, {}, (session) =>
        session.nearest({ ...base, limit: 2147483647, int4Filter: { column: small.category, equals: 1 } }),
      );
      const wideOracle = await oracleNearest(environment.url, {
        table: small,
        kind: "vector",
        metric: "l2",
        probe: "[1,2,0.5]",
        limit: 2147483647,
        filter: 1,
        settings: [],
      });
      expect(wide.value).toHaveLength(3);
      expect(tieNormalized(plain(wide.value))).toEqual(tieNormalized(wideOracle));
      // A relation named with exactly 63 UTF-8 bytes is addressed losslessly; 64 bytes are refused before SQL.
      const boundary = environment.boundary;
      expect(new TextEncoder().encode(boundary.table.name)).toHaveLength(63);
      const found = await owner(environment, {}, (session) =>
        session.nearest({ ...base, table: boundary.table, limit: 5 }),
      );
      const foundOracle = await oracleNearest(environment.url, {
        table: boundary,
        kind: "vector",
        metric: "l2",
        probe: "[1,2,0.5]",
        limit: 5,
        settings: [],
      });
      expect(found.value).toHaveLength(3);
      expect(tieNormalized(plain(found.value))).toEqual(tieNormalized(foundOracle));
      const tooLong = await observe(() =>
        owner(environment, {}, (session) =>
          session.nearest({ ...base, table: { ...boundary.table, name: `${boundary.table.name}x` } }),
        ),
      );
      failed(tooLong.error);
      expect(tooLong.events.some((event) => event.sql.includes("AS distance"))).toBe(false);
    });
  },
  timeout,
);

test.skipIf(!connectionString)(
  "closed entry fails a native NULL id in the decoder after the native query ran, then rolls back",
  async () => {
    await withVectorTooling(async (environment) => {
      const table = environment.nullIds;
      const request = { ...denseTable(environment), table: table.table, limit: 5 };
      const ran = await observe(() => owner(environment, {}, (session) => session.nearest(request)));
      const error = failed(ran.error);
      // A decoder failure, not a native one: PostgreSQL returned the NULL id and the closed row validator refused it.
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause).not.toBeInstanceOf(pg.DatabaseError);
      const executed = ran.events.filter((event) => event.sql.includes("AS distance") && !event.failed);
      expect(executed).toHaveLength(1);
      expect(executed[0]!.rows.some((row: { id: string | null }) => row.id === null)).toBe(true);
      expectReset(ran.events, [], "ROLLBACK", defaultText);
      // The same relation is readable when the filter excludes the NULL id row.
      const filtered = await owner(environment, {}, (session) =>
        session.nearest({ ...request, int4Filter: { column: table.category, equals: 1 } }),
      );
      expect(filtered.value.map((row) => row.id)).toEqual(["2"]);
    });
  },
  timeout,
);

test.skipIf(!connectionString)(
  "closed entry returns native NaN and Infinity distances as explicit nonfinite values in native order",
  async () => {
    await withVectorTooling(async (environment) => {
      const table = environment.nonfinite;
      for (const [metric, probe, text, expected] of [
        // A zero-norm row makes cosine distance NaN.
        ["cosine", [1, 0, 0], "[1,0,0]", "NaN"],
        // Opposite float4 extremes overflow single-precision accumulation to Infinity.
        ["l2", [-3e38, 0, 0], "[-3e38,0,0]", "Infinity"],
      ] as const) {
        const request = { ...denseTable(environment), table: table.table, metric, probe, limit: 4 };
        const ran = await owner(environment, {}, (session) => session.nearest(request));
        const oracle = await oracleNearest(environment.url, {
          table,
          kind: "vector",
          metric,
          probe: text,
          limit: 4,
          settings: [],
        });
        expect(ran.value).toHaveLength(4);
        expect(
          ran.value.map((row) => row.distance),
          metric,
        ).toEqual(oracle.map((row) => nativeDistance(row.distance)));
        expect(tieNormalized(plain(ran.value)).map((row) => row.id)).toEqual(
          tieNormalized(oracle).map((row) => row.id),
        );
        // The authored fixture intends this native outcome; if the server computes otherwise this fails loudly.
        expect(ran.value.some((row) => v.is(v.object({ nonfinite: v.literal(expected) }), row.distance))).toBe(true);
        expect(oracle.some((row) => String(row.distance) === expected)).toBe(true);
      }
    });
  },
  timeout,
);

test.skipIf(!connectionString)(
  "native expression drift of a real setting from the applied 1.23457 to 1.23456 is a latched failure, rounding is not",
  async () => {
    await withVectorTooling(async (environment) => {
      const name = "hnsw.scan_mem_multiplier";
      // 1.2345651 is applied and observed at six significant digits as 1.23457.
      const requested: VectorSearchSettings = { [name]: 1.2345651 };
      const observedText = [[name, "1.23457"]] as const;
      const request = (table: TableNames): VectorNearestRequest => ({
        ...denseTable(environment),
        table: table.table,
        idColumn: table.id,
        embeddingColumn: table.embedding,
      });

      // Control: rounding alone does not trip the exact checkpoints.
      const control = await observe(() =>
        owner(environment, requested, async (session) => ({
          settings: await session.inspectSettings(),
          rows: await session.nearest(request(environment.small.vector)),
        })),
      );
      expect(control.error).toBeUndefined();
      expect(control.value?.value.settings[name]).toBe(1.23457);
      expect(control.value?.value.rows).toHaveLength(6);
      expectReset(control.events, observedText, "COMMIT", defaultText);

      // The native view expression sets the session-level value to 1.23456 while the query reads it.
      let caught: Error | undefined;
      const drifted = await observe(() =>
        owner(environment, requested, async (session) => {
          try {
            await session.nearest(request(environment.drift));
          } catch (error) {
            caught = error instanceof Error ? error : undefined;
          }
          // The owner is poisoned with the first cause even though the callback caught it and returns normally.
          await expect(session.inspectSettings()).rejects.toBe(caught);
          return "caught";
        }),
      );
      expect(caught).toBeInstanceOf(Error);
      expect(caught).toMatchObject({
        message: expect.stringMatching(/hnsw\.scan_mem_multiplier differs from the applied/),
      });
      const error = failed(drifted.error);
      expect(error.cause).toBe(caught);
      const witness = ownerWitness(drifted.events);
      expect(witness.terminalCommand).toBe("ROLLBACK");
      // The native query ran and the drift is visible in the final checkpoint; earlier ones are the applied map.
      expect(drifted.events.some((event) => event.sql.includes("AS distance") && !event.failed)).toBe(true);
      const applied = overlay(witness.baseline, observedText);
      expect(witness.active.length).toBeGreaterThanOrEqual(3);
      for (const active of witness.active.slice(0, -1)) expect(active).toEqual(applied);
      expect(witness.active.at(-1)).toEqual(overlay(witness.baseline, [[name, "1.23456"]]));
      // Session-level drift inside the rolled-back transaction did not leak into the backend's terminal state.
      expect(witness.terminal).toEqual(witness.baseline);
      expect(witness.terminalResets).toEqual(witness.baselineResets);
      // And an independent new owner sees only its native baseline.
      expect((await owner(environment, {}, (session) => session.inspectSettings())).value).toEqual(defaultSnapshot);
    });
  },
  timeout,
);

// ALTERNATE-VERSION: wrong installed catalogue needs an actual second pgvector version on the server. If the
// server offers only 0.8.6 this obligation is UNRESOLVED and the case below is reported as skipped. It is never
// simulated, never passed, and independent of every other case in this file, so an available subset runs honestly.
const alternate = connectionString
  ? await (async () => {
      const client = new pg.Client({ connectionString });
      await client.connect();
      try {
        const rows = await client.query(
          "SELECT version FROM pg_available_extension_versions WHERE name = 'vector' AND version <> '0.8.6' ORDER BY version DESC",
        );
        return v.parse(v.nullable(v.string()), rows.rows[0]?.version ?? null);
      } finally {
        await client.end();
      }
    })()
  : null;
if (connectionString && !alternate)
  console.warn("UNRESOLVED ALTERNATE-VERSION: no pgvector version other than 0.8.6 is available on this server");
test.skipIf(!alternate)(
  "ALTERNATE-VERSION (unresolved when absent): a different installed pgvector catalogue fails before callback admission",
  async () => {
    assert.ok(alternate);
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(`CREATE SCHEMA ${pg.escapeIdentifier(vectorSchema)}`);
        await client.query(
          `CREATE EXTENSION vector WITH SCHEMA ${pg.escapeIdentifier(vectorSchema)} VERSION ${pg.escapeLiteral(alternate)}`,
        );
      } finally {
        await client.end();
      }
      let entered = false;
      const rejected = await withVectorSearchSettings(url, descriptor, {}, async () => {
        entered = true;
      }).then(
        () => undefined,
        (error: Error) => error,
      );
      expect(failed(rejected).cause).toMatchObject({ message: expect.stringMatching(/SQL contract mismatch/) });
      expect(entered).toBe(false);
    });
  },
  timeout,
);
