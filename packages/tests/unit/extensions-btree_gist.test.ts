import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { appendFileSync } from "node:fs";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createBtreeGist_1_8 } from "../../../apps/loom/src/core/extensions/adapters/btree_gist";
import {
  btreeGistDateCodec,
  btreeGistIntervalCodec,
  btreeGistMoneyCodec,
  btreeGistOidCodec,
  btreeGistTimeCodec,
} from "../../../apps/loom/src/core/extensions/adapters/btree_gist-codecs";
import { timestamp, timestamptz } from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { extensionIndexOpclass } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { btreeGistAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/btree_gist";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/btree_gist.json";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { validateExtensionSemanticProof } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import baseline from "../../../docs/architecture/evidence/neon-extension-capability-map-2026-10-02.json";
import { btreeGistNativeSchema } from "../../e2e/fixtures/btree_gist-schema";
import { btreeGistMemberProofs, registerBtreeGistSemanticProof } from "../../e2e/fixtures/btree_gist-semantic-proof";
import { btreeGistUnitProofCase } from "../../e2e/fixtures/btree_gist-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";

const digest = "73fdb4831683ee8042ecbcd0d0639909650d018d6c7ca51bb85c1cb38de96072";
const descriptor = {
  name: "btree_gist",
  version: "1.8",
  schema: 'Gist"花',
  apiSupport: { status: "verified", digest },
} as const;
const checked = validateExtensionManifest(v.parse(extensionManifestValidator, manifest));
const opclasses = checked.contract.members.flatMap((member) => (member.kind === "opclass" ? [member] : []));
const routines = checked.contract.members.flatMap((member) =>
  member.kind === "routine" &&
  !member.arguments.some((argument) => ["internal", "cstring"].includes(argument.type.name)) &&
  member.returns.name !== "cstring"
    ? [member]
    : [],
);
const operators = checked.contract.members.flatMap((member) => (member.kind === "operator" ? [member] : []));

function unitProof(work: () => void) {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  expect(Boolean(runId)).toBe(Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: btreeGistUnitProofCase });
  record({ runId: identity, kind: "started", caseId: btreeGistUnitProofCase.id });
  let passed = false;
  try {
    work();
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: btreeGistUnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
}

test(btreeGistUnitProofCase.title, () =>
  unitProof(() => {
    expect(checked.digest).toBe(digest);
    expect(checked.contract.version).toBe("1.8");
    const api = createBtreeGist_1_8(descriptor);
    expect(opclasses).toHaveLength(26);
    expect(Object.keys(api).sort()).toEqual(["apiSupport", "distance", "indexes", "name", "schema", "sql", "version"]);
    expect(Object.keys(api.indexes).sort()).toEqual(
      opclasses.map((member) => (member.input.name === "anyenum" ? "enum" : member.input.name)).sort(),
    );
    for (const member of opclasses) {
      const key = member.input.name === "anyenum" ? "enum" : member.input.name;
      // SAFETY: keys are asserted equal to the captured class inputs above.
      const contract = api.indexes[key as keyof typeof api.indexes]();
      expect(contract).toEqual({
        name: "btree_gist",
        version: "1.8",
        schema: descriptor.schema,
        digest,
        member: member.id,
        method: "gist",
        opclass: member.name,
        type: member.input.name,
        default: member.isDefault,
        input: { schema: "pg_catalog", type: member.input.name, dimensions: 0 },
      });
      expect(Object.isFrozen(contract)).toBe(true);
      expect(Object.isFrozen(contract.input)).toBe(true);
      expect(extensionIndexOpclass(contract)).toBe(`"Gist""花"."${member.name}"`);
    }
  }),
);

test("btree_gist rejects mismatched family, version and manifest admission", () => {
  for (const invalid of [
    { ...descriptor, name: "btree_gin" },
    { ...descriptor, version: "1.7" },
    { ...descriptor, apiSupport: { status: "unverified" } },
    { ...descriptor, apiSupport: { status: "verified", digest: "wrong" } },
  ]) {
    // SAFETY: malformed runtime input deliberately bypasses the literal factory signature.
    expect(() => createBtreeGist_1_8(invalid as never)).toThrow("btree_gist 1.8 requires its exact verified contract");
  }
});

test("btree_gist exposes every captured SQL-callable routine and operator by exact overload", () => {
  const api = createBtreeGist_1_8(descriptor);
  expect(routines).toHaveLength(13);
  expect(operators).toHaveLength(12);
  expect(Object.keys(api.sql.functions).sort()).toEqual(routines.map((member) => member.name).sort());
  expect(Object.keys(api.sql.overloads).sort()).toEqual([...routines, ...operators].map((member) => member.id).sort());
  expect(Object.keys(api.sql.operators).sort()).toEqual(
    operators.map((member) => `<->(${member.left!.name},${member.right!.name})`).sort(),
  );
  expect(Object.keys(api.distance).sort()).toEqual([
    "date",
    "float4",
    "float8",
    "int2",
    "int4",
    "int8",
    "interval",
    "money",
    "oid",
    "time",
    "timestamp",
    "timestamptz",
  ]);
  const distances = new Map<string, unknown>(Object.entries(api.distance));
  const operatorBindings = new Map<string, unknown>(Object.entries(api.sql.operators));
  const overloads = new Map<string, unknown>(Object.entries(api.sql.overloads));
  const functions = new Map<string, unknown>(Object.entries(api.sql.functions));
  for (const member of operators) {
    const key = member.left!.name;
    expect(distances.get(key)).toBeDefined();
    expect(distances.get(key)).toBe(operatorBindings.get(`<->(${key},${key})`));
    expect(overloads.get(member.id)).toBe(distances.get(key));
  }
  for (const member of routines) {
    expect(functions.get(member.name)).toBeDefined();
    expect(overloads.get(member.id)).toBe(functions.get(member.name));
  }
});

test("btree_gist callable members bind native parameter types and decode native result codecs", () => {
  const api = createBtreeGist_1_8(descriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const prefix = '"Gist""花"';
  const cases = [
    [api.sql.functions.cash_dist("1.5", "-3"), "cash_dist", "money", ["1.5", "-3"], "pg:money:en-us:1:nullable"],
    [
      api.sql.functions.date_dist("2000-01-01", "4713-01-01 BC"),
      "date_dist",
      "date",
      ["2000-01-01", "4713-01-01 BC"],
      "pg:int4:1:nullable",
    ],
    [
      api.sql.functions.float4_dist(1.5, { nonfinite: "NaN" }),
      "float4_dist",
      "float4",
      [1.5, "NaN"],
      "pg:float4:1:nullable",
    ],
    [
      api.sql.functions.float8_dist({ nonfinite: "-Infinity" }, 2),
      "float8_dist",
      "float8",
      ["-Infinity", 2],
      "pg:float8:1:nullable",
    ],
    [api.sql.functions.int2_dist(-1, 3), "int2_dist", "int2", [-1, 3], "pg:int2:1:nullable"],
    [api.sql.functions.int4_dist(-2147483648, 0), "int4_dist", "int4", [-2147483648, 0], "pg:int4:1:nullable"],
    [
      api.sql.functions.int8_dist(9007199254740993n, 0n),
      "int8_dist",
      "int8",
      ["9007199254740993", "0"],
      "pg:int8:1:nullable",
    ],
    [
      api.sql.functions.interval_dist("1 day", "-02:00:00"),
      "interval_dist",
      "interval",
      ["1 day", "-02:00:00"],
      "pg:interval:postgres:1:nullable",
    ],
    [api.sql.functions.oid_dist(1, 4294967295), "oid_dist", "oid", ["1", "4294967295"], "pg:oid:unsigned32:1:nullable"],
    [
      api.sql.functions.time_dist("01:00:00", "24:00:00"),
      "time_dist",
      "time",
      ["01:00:00", "24:00:00"],
      "pg:interval:postgres:1:nullable",
    ],
    [
      api.sql.functions.ts_dist(timestamp("2000-01-01 00:00:00"), null),
      "ts_dist",
      "timestamp",
      ["2000-01-01 00:00:00.000000", null],
      "pg:interval:postgres:1:nullable",
    ],
    [
      api.sql.functions.tstz_dist(timestamptz("2000-01-01 01:00:00+01"), null),
      "tstz_dist",
      "timestamptz",
      ["2000-01-01 00:00:00.000000+00", null],
      "pg:interval:postgres:1:nullable",
    ],
  ] as const;
  for (const [expression, name, type, params, codec] of cases) {
    expect(dialect.sqlToQuery(expression)).toMatchObject({
      sql: `${prefix}."${name}"($1::"pg_catalog"."${type}", $2::"pg_catalog"."${type}")`,
      params,
    });
    expect(extensionExpressionContract(expression)).toMatchObject({
      member: `routine:$extension:btree_gist.${name}(pg_catalog.${type},pg_catalog.${type})`,
      codec,
      observability: "tables",
    });
  }
  const translated = api.sql.functions.gist_translate_cmptype_btree(3);
  expect(dialect.sqlToQuery(translated)).toMatchObject({
    sql: `${prefix}."gist_translate_cmptype_btree"($1::"pg_catalog"."int4")`,
    params: [3],
  });
  expect(extensionExpressionContract(translated)).toMatchObject({ codec: "pg:int2:1:nullable" });
  const knn = api.distance.int4(7, null);
  expect(dialect.sqlToQuery(knn)).toMatchObject({
    sql: `($1::"pg_catalog"."int4" operator(${prefix}.<->) $2::"pg_catalog"."int4")`,
    params: [7, null],
  });
  expect(extensionExpressionContract(knn)).toMatchObject({
    member: "operator:$extension:btree_gist.<->(pg_catalog.int4,pg_catalog.int4)",
    codec: "pg:int4:1:nullable",
  });
});

test("btree_gist native text codecs admit only PostgreSQL's exact default output forms", () => {
  expect(btreeGistMoneyCodec.decode("$1,234,568.89")).toBe("1234568.89");
  expect(btreeGistMoneyCodec.decode("-$92,233,720,368,547,758.08")).toBe("-92233720368547758.08");
  expect(btreeGistMoneyCodec.encode("-0.5")).toBe("-0.5");
  for (const invalid of ["1,00 €", "$1.5", "($1.00)", "1.00"])
    expect(() => btreeGistMoneyCodec.decode(invalid)).toThrow();
  for (const invalid of ["1.005", "1e2", "$1"]) expect(() => btreeGistMoneyCodec.encode(invalid)).toThrow();
  for (const value of [
    "1 day 02:00:00",
    "-1 days +02:00:00",
    "00:00:00",
    "1 year 2 mons 4 days 04:05:06.789",
    "-178000000 years",
    "infinity",
    "-infinity",
  ])
    expect(btreeGistIntervalCodec.decode(value)).toBe(value);
  for (const invalid of ["P1DT2H", "@ 1 day", "1 day ", ""])
    expect(() => btreeGistIntervalCodec.decode(invalid)).toThrow();
  for (const value of ["2000-01-01", "4713-01-01 BC", "5874897-12-31", "infinity", "-infinity"])
    expect(btreeGistDateCodec.decode(value)).toBe(value);
  for (const invalid of ["01/02/2000", "2000-1-1", "today"]) expect(() => btreeGistDateCodec.encode(invalid)).toThrow();
  for (const value of ["22:30:00.5", "24:00:00", "00:00:00.000001"])
    expect(btreeGistTimeCodec.decode(value)).toBe(value);
  for (const invalid of ["1:00", "01:00:00+00", "allballs"]) expect(() => btreeGistTimeCodec.encode(invalid)).toThrow();
  expect(btreeGistOidCodec.decode("4294967294")).toBe(4294967294);
  expect(() => btreeGistOidCodec.encode(-1)).toThrow();
});

test("btree_gist declarations survive Loom schema and default-class migration snapshots", async () => {
  const api = createBtreeGist_1_8(descriptor);
  const schema = defineSchema(
    (fields) => ({
      entries: defineTable(
        { number: fields.integer(), label: fields.text() },
        {
          indexes: [
            { fields: ["number"], extension: api.indexes.int4() },
            { fields: ["label"], extension: api.indexes.text() },
          ],
        },
      ),
    }),
    { namespace: "app" },
  );
  expect(schema.metadata.extensionRequirements?.map((member) => member.member)).toEqual([
    "opclass:$extension:btree_gist.gist_int4_ops/gist",
    "opclass:$extension:btree_gist.gist_text_ops/gist",
  ]);
  const snapshot = await createSnapshot(schema);
  expect(snapshot.ddl.filter((entity) => entity.entityType === "indexes").map((entity) => entity.method)).toEqual([
    "gist",
    "gist",
  ]);
  expect((await migrationStatements(await emptySnapshot("app"), snapshot)).join("\n")).toContain("USING gist");
});

test("btree_gist all 26 declarations generate qualified native schema migration DDL", async () => {
  const snapshot = await createSnapshot(btreeGistNativeSchema(descriptor.schema));
  const ddl = (await migrationStatements(await emptySnapshot("app"), snapshot)).join("\n");
  for (const member of opclasses) expect(ddl).toContain(`"Gist""花"."${member.name}"`);
  expect(snapshot.ddl.filter((entity) => entity.entityType === "indexes")).toHaveLength(26);
});

test("btree_gist accounts for all 725 captured members with 25 callable and 674 internal dispositions", () => {
  expect(btreeGistAnnotations.map((member) => member.id)).toEqual(manifest.contract.members.map((member) => member.id));
  expect(btreeGistAnnotations.filter((member) => member.disposition === "schema")).toHaveLength(26);
  expect(btreeGistAnnotations.filter((member) => member.disposition === "query")).toHaveLength(25);
  expect(btreeGistAnnotations.filter((member) => member.disposition === "internal")).toHaveLength(674);
  for (const annotation of btreeGistAnnotations) {
    expect(annotation.reason.length).toBeGreaterThan(30);
    expect(annotation.semantics.providerAcceptance).toBe("pending");
    expect(annotation.semantics.publicExportAcceptance).toBe("pending");
  }
});

test("btree_gist exact per-member proof graph validates and remains pending without parent receipts", () => {
  expect(btreeGistMemberProofs).toHaveLength(725);
  const entries = baseline.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const input = registerBtreeGistSemanticProof({
    baseline: entries,
    declarations: entries.map((entry) =>
      entry.disposition === "eligible"
        ? { extension: entry.name, state: "pending" as const, prerequisite: "parent acceptance pending" }
        : { extension: entry.name, state: "excluded" as const, reason: entry.disposition },
    ),
    manifests: [],
    cases: [],
    receipts: [],
    currentSources: [],
    artifact: null,
  });
  const result = validateExtensionSemanticProof(input);
  expect(result.families.find((entry) => entry.extension === "btree_gist")?.state).toBe("pending");
});
