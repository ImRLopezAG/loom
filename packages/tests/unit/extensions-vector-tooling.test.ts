import { expect, test } from "vite-plus/test";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/vector.json";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import {
  decodeVectorSettingRows,
  withVectorSearchSettings,
  type ExactVector086Descriptor,
  type VectorSearchSettings,
  type VectorSettingRow,
} from "../../../apps/loom/src/tooling/extensions/vector";

const unreachable = "postgresql://operator@127.0.0.1:1/fixture";
const descriptor = {
  name: "vector",
  version: "0.8.6",
  schema: "extensions",
  apiSupport: { status: "verified", digest: capture.digest },
} as const;

/** Resolve with the rejection, or fail: admission errors must never be a connection attempt. */
async function admission(settings: VectorSearchSettings, candidate: ExactVector086Descriptor = descriptor) {
  let entered = false;
  const error = await withVectorSearchSettings(unreachable, candidate, settings, async () => {
    entered = true;
    return 1;
  }).then(
    () => undefined,
    (cause: Error) => cause,
  );
  expect(entered).toBe(false);
  return error;
}

test("the pinned manifest is the exact captured vector 0.8.6 digest", () => {
  expect(capture.digest).toBe("4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4");
  expect(capture.contract.version).toBe("0.8.6");
});

test("invalid settings fail before connection acquisition or callback admission", async () => {
  const rejected: readonly (readonly [string, VectorSearchSettings])[] = [
    ["string number", JSON.parse('{"hnsw.ef_search":"40"}')],
    ["NaN", { "hnsw.scan_mem_multiplier": Number.NaN }],
    ["Infinity", { "hnsw.scan_mem_multiplier": Number.POSITIVE_INFINITY }],
    ["negative Infinity", { "hnsw.scan_mem_multiplier": Number.NEGATIVE_INFINITY }],
    ["fractional integer setting", { "hnsw.ef_search": 1.5 }],
    ["fractional probes", { "ivfflat.probes": 2.5 }],
    ["fractional max_scan_tuples", { "hnsw.max_scan_tuples": 1000.25 }],
    ["zero ef_search", { "hnsw.ef_search": 0 }],
    ["ef_search above 1000", { "hnsw.ef_search": 1001 }],
    ["zero max_scan_tuples", { "hnsw.max_scan_tuples": 0 }],
    ["max_scan_tuples above int4", { "hnsw.max_scan_tuples": 2147483648 }],
    ["multiplier below 1", { "hnsw.scan_mem_multiplier": 0.99 }],
    ["multiplier above 1000", { "hnsw.scan_mem_multiplier": 1000.01 }],
    ["zero probes", { "ivfflat.probes": 0 }],
    ["probes above 32768", { "ivfflat.probes": 32769 }],
    ["zero max_probes", { "ivfflat.max_probes": 0 }],
    ["max_probes above 32768", { "ivfflat.max_probes": 32769 }],
    ["negative ef_search", { "hnsw.ef_search": -1 }],
    ["unknown enum value", JSON.parse('{"hnsw.iterative_scan":"strict"}')],
    ["ivfflat strict_order", JSON.parse('{"ivfflat.iterative_scan":"strict_order"}')],
    ["boolean enum", JSON.parse('{"hnsw.iterative_scan":true}')],
    ["unknown key", JSON.parse('{"hnsw.unknown":1}')],
    ["work_mem is a PostgreSQL setting, not a vector setting", JSON.parse('{"work_mem":"64MB"}')],
    ["enable_seqscan", JSON.parse('{"enable_seqscan":false}')],
    ["null value", JSON.parse('{"hnsw.ef_search":null}')],
    // An empty array has no excess keys and no required entries, so only an explicit refusal rejects it.
    ["empty array", JSON.parse("[]")],
    ["nested array", JSON.parse("[[]]")],
    ["array of settings", JSON.parse('[{"hnsw.ef_search":40}]')],
    ["null settings", JSON.parse("null")],
    ["string settings", JSON.parse('"hnsw.ef_search"')],
  ];
  for (const [label, settings] of rejected) {
    const error = await admission(settings);
    expect(error, label).toBeInstanceOf(Error);
    expect(error, label).not.toBeInstanceOf(ExtensionOperationError);
  }
});

test("every registered boundary and real value is admitted and reaches only the connection attempt", async () => {
  const accepted: readonly VectorSearchSettings[] = [
    {},
    { "hnsw.ef_search": 1 },
    { "hnsw.ef_search": 1000 },
    { "hnsw.max_scan_tuples": 1 },
    { "hnsw.max_scan_tuples": 2147483647 },
    { "hnsw.scan_mem_multiplier": 1 },
    { "hnsw.scan_mem_multiplier": 1.5 },
    { "hnsw.scan_mem_multiplier": 1000 },
    { "ivfflat.probes": 1 },
    { "ivfflat.probes": 32768 },
    { "ivfflat.max_probes": 1 },
    { "ivfflat.max_probes": 32768 },
    // max_probes below probes is registered-valid; the native scan resolves it.
    { "ivfflat.probes": 100, "ivfflat.max_probes": 5 },
    { "hnsw.iterative_scan": "off" },
    { "hnsw.iterative_scan": "relaxed_order" },
    { "hnsw.iterative_scan": "strict_order" },
    { "ivfflat.iterative_scan": "off" },
    { "ivfflat.iterative_scan": "relaxed_order" },
    {
      "hnsw.ef_search": 80,
      "hnsw.iterative_scan": "strict_order",
      "hnsw.max_scan_tuples": 5000,
      "hnsw.scan_mem_multiplier": 1.5,
      "ivfflat.probes": 3,
      "ivfflat.iterative_scan": "relaxed_order",
      "ivfflat.max_probes": 7,
    },
  ];
  for (const settings of accepted) {
    const error = await admission(settings);
    expect(error, JSON.stringify(settings)).toBeInstanceOf(ExtensionOperationError);
    expect(error).toMatchObject({ completion: "not-started" });
  }
});

test("only the exact verified vector 0.8.6 descriptor with a valid schema is admitted", async () => {
  const foreign: readonly [string, ExactVector086Descriptor][] = [
    ["unverified", { ...descriptor, apiSupport: { status: "unverified" } }],
    ["missing digest", { ...descriptor, apiSupport: { status: "verified" } }],
    ["wrong digest", { ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } }],
    ["other extension's digest", { ...descriptor, apiSupport: { status: "verified", digest: "f".repeat(64) } }],
    ["wrong name", JSON.parse(JSON.stringify({ ...descriptor, name: "pg_trgm" }))],
    ["wrong version", JSON.parse(JSON.stringify({ ...descriptor, version: "0.8.5" }))],
    ["newer version", JSON.parse(JSON.stringify({ ...descriptor, version: "0.8.7" }))],
    ["empty schema", { ...descriptor, schema: "" }],
    ["NUL schema", { ...descriptor, schema: "bad\u0000schema" }],
    ["lone surrogate schema", { ...descriptor, schema: "bad\ud800schema" }],
    ["64-byte schema", { ...descriptor, schema: "é".repeat(32) }],
  ];
  for (const [label, candidate] of foreign) {
    const error = await admission({}, candidate);
    expect(error, label).toBeInstanceOf(Error);
    expect(error, label).not.toBeInstanceOf(ExtensionOperationError);
  }
  // Boundary and Unicode schemas pass admission and fail only at the unreachable connection.
  for (const schema of ["é".repeat(31), 'Vector_"Codec_日本', "a".repeat(63)]) {
    expect(await admission({}, { ...descriptor, schema }), schema).toMatchObject({ completion: "not-started" });
  }
});

test("known Neon transaction poolers are refused before acquisition and no callback is admitted", async () => {
  let entered = false;
  await expect(
    withVectorSearchSettings(
      "postgresql://operator@example-pooler.us-east-2.aws.neon.tech/fixture",
      descriptor,
      {},
      async () => {
        entered = true;
        return 1;
      },
    ),
  ).rejects.toThrow(/direct credentials/);
  expect(entered).toBe(false);
  const controller = new AbortController();
  const reason = new Error("before acquisition");
  controller.abort(reason);
  await expect(withVectorSearchSettings(unreachable, descriptor, {}, async () => 1, controller.signal)).rejects.toBe(
    reason,
  );
});

// Independent copy of the read-only tagged source contract, as pg_settings reports it.
const tagged = [
  { name: "hnsw.ef_search", vartype: "integer", min: "1", max: "1000", boot: "40", enums: null },
  {
    name: "hnsw.iterative_scan",
    vartype: "enum",
    min: null,
    max: null,
    boot: "off",
    enums: '["off","relaxed_order","strict_order"]',
  },
  { name: "hnsw.max_scan_tuples", vartype: "integer", min: "1", max: "2147483647", boot: "20000", enums: null },
  { name: "hnsw.scan_mem_multiplier", vartype: "real", min: "1", max: "1000", boot: "1", enums: null },
  { name: "ivfflat.probes", vartype: "integer", min: "1", max: "32768", boot: "1", enums: null },
  {
    name: "ivfflat.iterative_scan",
    vartype: "enum",
    min: null,
    max: null,
    boot: "off",
    enums: '["off","relaxed_order"]',
  },
  { name: "ivfflat.max_probes", vartype: "integer", min: "1", max: "32768", boot: "32768", enums: null },
] as const;
const rows = (): VectorSettingRow[] =>
  tagged.map((entry) => ({
    name: entry.name,
    setting: entry.boot,
    unit: null,
    context: "user",
    vartype: entry.vartype,
    source: "default",
    min_val: entry.min,
    max_val: entry.max,
    boot_val: entry.boot,
    reset_val: entry.boot,
    enumvals: entry.enums,
  }));
const defaults = {
  "hnsw.ef_search": 40,
  "hnsw.iterative_scan": "off",
  "hnsw.max_scan_tuples": 20000,
  "hnsw.scan_mem_multiplier": 1,
  "ivfflat.probes": 1,
  "ivfflat.iterative_scan": "off",
  "ivfflat.max_probes": 32768,
} as const;
function withRow(name: string, changes: Partial<VectorSettingRow>): VectorSettingRow[] {
  return rows().map((row) => (row.name === name ? { ...row, ...changes } : row));
}

// DELIBERATE EXCEPTION. The seven registrations are an immutable property of the installed C library binary: no
// real owner entry can be driven into a different range, enum set, context or unit, so each semantic mismatch can
// only be exercised on the pure decoder (the single non-type export besides the owner entry). These synthetic rows
// test decoder logic only and are NOT native evidence; native pg_settings evidence is in the e2e suite.
test("the settings decoder accepts the exact registered contract and records baseline facts, not source defaults", () => {
  const observed = decodeVectorSettingRows(rows());
  expect(observed.values).toEqual(defaults);
  expect(observed.resets).toEqual(defaults);
  expect(Object.isFrozen(observed)).toBe(true);
  expect(Object.isFrozen(observed.values)).toBe(true);
  // Row order and enum display order are not part of the contract.
  expect(decodeVectorSettingRows(rows().reverse()).values).toEqual(defaults);
  expect(
    decodeVectorSettingRows(withRow("hnsw.iterative_scan", { enumvals: '["strict_order","off","relaxed_order"]' }))
      .values,
  ).toEqual(defaults);
  // A role baseline differs from the compiled defaults and from the reset value; both are observed as given.
  const baseline = decodeVectorSettingRows(
    rows().map((row) => {
      if (row.name === "hnsw.ef_search") return { ...row, setting: "123", reset_val: "99", source: "user" };
      if (row.name === "hnsw.scan_mem_multiplier") return { ...row, setting: "2.5", reset_val: "2.5" };
      if (row.name === "ivfflat.iterative_scan") return { ...row, setting: "relaxed_order" };
      return row;
    }),
  );
  expect(baseline.values).toEqual({
    ...defaults,
    "hnsw.ef_search": 123,
    "hnsw.scan_mem_multiplier": 2.5,
    "ivfflat.iterative_scan": "relaxed_order",
  });
  expect(baseline.resets["hnsw.ef_search"]).toBe(99);
  // Registered extremes are valid observations.
  expect(decodeVectorSettingRows(withRow("hnsw.max_scan_tuples", { setting: "2147483647" })).values).toMatchObject({
    "hnsw.max_scan_tuples": 2147483647,
  });
  expect(decodeVectorSettingRows(withRow("hnsw.scan_mem_multiplier", { setting: "1000" })).values).toMatchObject({
    "hnsw.scan_mem_multiplier": 1000,
  });
});

test("the settings decoder rejects every missing, extra or semantically different registration", () => {
  const mutations: readonly (readonly [string, VectorSettingRow[]])[] = [
    ["missing row", rows().slice(1)],
    ["no rows", []],
    ["duplicate row", [...rows().slice(1), ...rows().slice(1, 2)]],
    ["extra row", [...rows(), { ...rows()[0]!, name: "hnsw.ef_search" }]],
    ["integer as real", withRow("hnsw.ef_search", { vartype: "real" })],
    ["real as integer", withRow("hnsw.scan_mem_multiplier", { vartype: "integer" })],
    ["enum as string", withRow("hnsw.iterative_scan", { vartype: "string", enumvals: null })],
    ["superuser context", withRow("hnsw.ef_search", { context: "superuser" })],
    ["backend context", withRow("ivfflat.probes", { context: "backend" })],
    ["postmaster context", withRow("ivfflat.max_probes", { context: "postmaster" })],
    ["unit present", withRow("hnsw.max_scan_tuples", { unit: "ms" })],
    ["wrong integer boot", withRow("hnsw.ef_search", { boot_val: "41" })],
    ["wrong real boot", withRow("hnsw.scan_mem_multiplier", { boot_val: "2" })],
    ["wrong enum boot", withRow("hnsw.iterative_scan", { boot_val: "strict_order" })],
    ["wrong minimum", withRow("ivfflat.probes", { min_val: "0" })],
    ["wrong maximum", withRow("ivfflat.max_probes", { max_val: "32767" })],
    ["wider maximum", withRow("hnsw.ef_search", { max_val: "2000" })],
    ["wrong real maximum", withRow("hnsw.scan_mem_multiplier", { max_val: "100" })],
    ["missing minimum", withRow("hnsw.ef_search", { min_val: null })],
    ["missing maximum", withRow("hnsw.max_scan_tuples", { max_val: null })],
    ["range on enum", withRow("hnsw.iterative_scan", { min_val: "0" })],
    ["enum list on integer", withRow("hnsw.ef_search", { enumvals: '["a"]' })],
    ["missing enum list", withRow("hnsw.iterative_scan", { enumvals: null })],
    ["missing enum value", withRow("hnsw.iterative_scan", { enumvals: '["off","relaxed_order"]' })],
    ["extra enum value", withRow("ivfflat.iterative_scan", { enumvals: '["off","relaxed_order","strict_order"]' })],
    ["substituted enum value", withRow("ivfflat.iterative_scan", { enumvals: '["off","strict_order"]' })],
    ["duplicate enum value", withRow("ivfflat.iterative_scan", { enumvals: '["off","off"]' })],
    ["malformed enum list", withRow("hnsw.iterative_scan", { enumvals: "{off,relaxed_order,strict_order}" })],
    ["non-string enum value", withRow("ivfflat.iterative_scan", { enumvals: "[1,2]" })],
    ["integer below range", withRow("hnsw.ef_search", { setting: "0" })],
    ["integer above range", withRow("hnsw.ef_search", { setting: "1001" })],
    ["fractional integer", withRow("ivfflat.probes", { setting: "1.5" })],
    ["non-numeric", withRow("hnsw.ef_search", { setting: "abc" })],
    ["empty numeric", withRow("hnsw.ef_search", { setting: "" })],
    ["real below range", withRow("hnsw.scan_mem_multiplier", { setting: "0.5" })],
    ["real NaN", withRow("hnsw.scan_mem_multiplier", { setting: "NaN" })],
    ["real above range", withRow("hnsw.scan_mem_multiplier", { setting: "1001" })],
    ["enum outside domain", withRow("hnsw.iterative_scan", { setting: "on" })],
    ["ivfflat strict_order observed", withRow("ivfflat.iterative_scan", { setting: "strict_order" })],
    ["reset outside domain", withRow("ivfflat.max_probes", { reset_val: "40000" })],
    ["empty source", withRow("hnsw.ef_search", { source: "" })],
    ["unknown setting name", withRow("hnsw.ef_search", { name: JSON.parse('"work_mem"') })],
  ];
  for (const [label, candidate] of mutations) expect(() => decodeVectorSettingRows(candidate), label).toThrow();
});
