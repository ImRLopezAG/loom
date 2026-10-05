import { expect, test } from "vite-plus/test";
import { createBtreeGin_1_3 } from "../../../apps/loom/src/core/extensions/adapters/btree_gin";
import { extensionIndexOpclass } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { btreeGinAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/btree_gin";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/btree_gin.json";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import * as v from "valibot";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { btreeGinNativeSchema } from "../../e2e/fixtures/btree_gin-schema";
import { registerBtreeGinSemanticProof, btreeGinMemberProofs } from "../../e2e/fixtures/btree_gin-semantic-proof";
import { validateExtensionSemanticProof } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import { appendFileSync } from "node:fs";
import { btreeGinUnitProofCase } from "../../e2e/fixtures/btree_gin-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";
import { pgSchema } from "drizzle-orm/pg-core";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const descriptor = {
  name: "btree_gin",
  version: "1.3",
  schema: 'Btree"花',
  apiSupport: { status: "verified", digest: "c3c8db3d98f5b687408fa9feac34338a9ad5fc0308c713b709008cd5889b709e" },
} as const;

function unitProof(work: () => void) {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  expect(Boolean(runId)).toBe(Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: btreeGinUnitProofCase });
  record({ runId: identity, kind: "started", caseId: btreeGinUnitProofCase.id });
  let passed = false;
  try {
    work();
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: btreeGinUnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
}

test(btreeGinUnitProofCase.title, () =>
  unitProof(() => {
    const checked = validateExtensionManifest(v.parse(extensionManifestValidator, manifest));
    expect(checked.digest).toBe(descriptor.apiSupport.digest);
    const binding = createBtreeGin_1_3(descriptor);
    const classes = checked.contract.members.filter((member) => member.kind === "opclass");
    expect(classes).toHaveLength(29);
    expect(Object.keys(binding).sort()).toEqual([
      "apiSupport",
      "ginEnumCmp",
      "ginNumericCmp",
      "indexes",
      "name",
      "schema",
      "sql",
      "version",
    ]);
    expect(Object.keys(binding.indexes).sort()).toEqual(
      classes.map((member) => (member.name === "enum_ops" ? "enum" : member.input.name)).sort(),
    );
    expect(Object.values(binding.indexes).map((declare) => declare())).toEqual(
      classes
        .map((member) => ({
          ...descriptor,
          apiSupport: undefined,
          digest: checked.digest,
          member: member.id,
          method: "gin",
          opclass: member.name,
          type: member.input.name,
          default: member.isDefault,
          input: { schema: "pg_catalog", type: member.input.name, dimensions: 0 },
        }))
        .map(({ apiSupport: _support, ...contract }) => contract),
    );
    for (const declare of Object.values(binding.indexes)) {
      const contract = declare();
      expect(Object.isFrozen(contract)).toBe(true);
      expect(Object.isFrozen(contract.input)).toBe(true);
      expect(extensionIndexOpclass(contract)).toBe(`"Btree""花"."${contract.opclass}"`);
    }
  }),
);

test("btree_gin rejects mismatched family, version and manifest admission", () => {
  for (const invalid of [
    { ...descriptor, name: "btree_gist" },
    { ...descriptor, version: "1.2" },
    { ...descriptor, apiSupport: { status: "unverified" } },
    { ...descriptor, apiSupport: { status: "verified", digest: "wrong" } },
  ]) {
    // SAFETY: malformed runtime input deliberately bypasses the literal factory signature.
    expect(() => createBtreeGin_1_3(invalid as never)).toThrow("btree_gin 1.3 requires its exact verified contract");
  }
});

test("btree_gin declarations survive Loom schema and default-class migration snapshots", async () => {
  const binding = createBtreeGin_1_3(descriptor);
  const schema = defineSchema(
    (fields) => ({
      entries: defineTable(
        { number: fields.integer(), label: fields.text() },
        {
          indexes: [
            { fields: ["number"], extension: binding.indexes.int4() },
            { fields: ["label"], extension: binding.indexes.text() },
          ],
        },
      ),
    }),
    { namespace: "app" },
  );
  expect(schema.metadata.extensionRequirements?.map((member) => member.member)).toEqual([
    "opclass:$extension:btree_gin.int4_ops/gin",
    "opclass:$extension:btree_gin.text_ops/gin",
  ]);
  const snapshot = await createSnapshot(schema);
  expect(snapshot.ddl.filter((entity) => entity.entityType === "indexes").map((entity) => entity.method)).toEqual([
    "gin",
    "gin",
  ]);
  const ddl = (await migrationStatements(await emptySnapshot("app"), snapshot)).join("\n");
  expect(ddl).toContain("USING gin");
  // The pinned inspector omits default classes; the exact identities remain in schema requirements.
  expect(ddl).not.toContain("btree_gist");
});

test("btree_gin accounts for all 435 captured members with two callable routines and 404 internal dispositions", () => {
  expect(btreeGinAnnotations.map((member) => member.id)).toEqual(manifest.contract.members.map((member) => member.id));
  expect(btreeGinAnnotations.filter((member) => member.disposition === "schema")).toHaveLength(29);
  expect(btreeGinAnnotations.filter((member) => member.disposition === "query")).toHaveLength(2);
  expect(btreeGinAnnotations.filter((member) => member.disposition === "internal")).toHaveLength(404);
  for (const annotation of btreeGinAnnotations) {
    expect(annotation.reason.length).toBeGreaterThan(30);
    expect(annotation.semantics.providerAcceptance).toBe("pending");
    expect(annotation.semantics.publicExportAcceptance).toBe("pending");
  }
});

test("btree_gin callable comparisons parameterize native numeric and concrete enum types", () => {
  const api = createBtreeGin_1_3(descriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const ordered = pgSchema('Enums"花').enum('Priority"花', ["low", "middle", "high"]);
  expect(Object.keys(api.sql.functions).sort()).toEqual(["gin_enum_cmp", "gin_numeric_cmp"]);
  expect(api.sql.functions.gin_numeric_cmp).toBe(api.ginNumericCmp);
  expect(api.sql.functions.gin_enum_cmp).toBe(api.ginEnumCmp);
  expect(Object.keys(api.sql.operators)).toEqual([]);
  expect(Object.keys(api.sql.overloads).sort()).toEqual([
    "routine:$extension:btree_gin.gin_enum_cmp(pg_catalog.anyenum,pg_catalog.anyenum)",
    "routine:$extension:btree_gin.gin_numeric_cmp(pg_catalog.numeric,pg_catalog.numeric)",
  ]);
  const numeric = api.ginNumericCmp("9007199254740992.0001", "9007199254740992.0002");
  expect(dialect.sqlToQuery(numeric)).toMatchObject({
    sql: '"Btree""花"."gin_numeric_cmp"($1::"pg_catalog"."numeric", $2::"pg_catalog"."numeric")',
    params: ["9007199254740992.0001", "9007199254740992.0002"],
  });
  expect(extensionExpressionContract(numeric)).toMatchObject({
    member: "routine:$extension:btree_gin.gin_numeric_cmp(pg_catalog.numeric,pg_catalog.numeric)",
    codec: "pg:int4:1:nullable",
    observability: "tables",
  });
  expect(dialect.sqlToQuery(api.ginEnumCmp(ordered, "low", "high"))).toMatchObject({
    sql: '"Btree""花"."gin_enum_cmp"($1::"Enums""花"."Priority""花", $2::"Enums""花"."Priority""花")',
    params: ["low", "high"],
  });
  expect(dialect.sqlToQuery(api.ginNumericCmp(null, { nonfinite: "NaN" })).params).toEqual([null, "NaN"]);
  expect(dialect.sqlToQuery(api.ginEnumCmp(ordered, null, "high")).params).toEqual([null, "high"]);
});

test("btree_gin all 29 declarations generate qualified native schema migration DDL", async () => {
  const schema = btreeGinNativeSchema(descriptor.schema);
  const snapshot = await createSnapshot(schema);
  const ddl = (await migrationStatements(await emptySnapshot("app"), snapshot)).join("\n");
  for (const member of manifest.contract.members.filter((member) => member.kind === "opclass")) {
    expect(ddl).toContain(`"Btree""花"."${member.name}"`);
  }
  expect(snapshot.ddl.filter((entity) => entity.entityType === "indexes")).toHaveLength(29);
});

test("btree_gin exact per-member proof graph validates and remains pending without parent receipts", () => {
  expect(btreeGinMemberProofs).toHaveLength(435);
  const entries = baseline.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const input = registerBtreeGinSemanticProof({
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
  const checked = validateExtensionSemanticProof(input);
  expect(checked.families.find((entry) => entry.extension === "btree_gin")?.state).toBe("pending");
});
