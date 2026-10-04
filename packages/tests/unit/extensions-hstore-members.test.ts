import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  hstoreUnitProofCases,
  hstoreMembers,
  hstoreMemberProofs,
  hstoreProofCases,
} from "../../e2e/fixtures/hstore-proof-cases";
const test = (title: string, work: () => void) => {
  const definition = hstoreUnitProofCases.find((entry) => entry.title === title);
  if (!definition) throw new Error(`Unregistered Hstore unit case: ${title}`);
  extensionProofUnitTest(definition, work);
};
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres/codecs";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/hstore.json";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import * as v from "valibot";
import { registerHstoreSemanticProof } from "../../e2e/fixtures/hstore-semantic-proof";
import {
  validateExtensionSemanticProof,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { createHstore_1_8 } from "../../../apps/loom/src/core/extensions/adapters/hstore";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { extensionIndexAcceptsField } from "../../../apps/loom/src/core/extensions/fields";

const api = createHstore_1_8({
  name: "hstore",
  version: "1.8",
  schema: 'Hstore_"日本',
  apiSupport: { status: "verified", digest: capture.digest },
});
test("hstore.exactFourIndexClassesAndSignatureOptions", () => {
  for (const method of ["btree", "hash", "gin", "gist"] as const) {
    const contract = api.indexes[method]();
    expect(contract.member).toBe(`opclass:$extension:hstore.${method}_hstore_ops/${method}`);
    expect(contract.input).toEqual({ schema: api.schema, type: "hstore", dimensions: 0 });
    expect(extensionIndexAcceptsField(contract, api.field().metadata)).toBe(true);
    expect(extensionIndexAcceptsField(contract, api.arrayField().metadata)).toBe(false);
  }
  expect(api.indexes.gist({ siglen: 2024 }).options).toEqual({ siglen: 2024 });
  for (const siglen of [0, 2025, 1.5, NaN]) expect(() => api.indexes.gist({ siglen })).toThrow();
});
test("hstore.nativeSubscriptSyntaxBindsAndChecksOperands", () => {
  const dialect = extensionSqlDialect(nodePgCodecs);
  const value = api.value([{ key: "stored", value: null }]);
  const read = api.subscript.read(value, 'key";--日本');
  const compiled = dialect.sqlToQuery(read);
  expect(compiled.params).toEqual([api.codec.encode(value), 'key";--日本']);
  expect(compiled.sql).toContain('::"Hstore_""日本"."hstore")[');
  expect(compiled.sql).not.toContain("fetchval");
  expect(extensionExpressionContract(read)?.member).toBe(
    "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal)",
  );
  const schema = defineSchema(() => ({ mappings: { scalar: api.field(), matrix: api.arrayField() } }));
  const target = api.subscript.target(schema.tables.mappings!.scalar, "new");
  expect(dialect.sqlToQuery(target).sql).toBe('"scalar"[$1::pg_catalog.text]');
  expect(dialect.sqlToQuery(sql`${target} = ${"assigned"}`).params).toEqual(["new", "assigned"]);
  expect(() => api.subscript.read(value, "\0")).toThrow();
  // SAFETY: Deliberately bypass the compile-time scalar requirement to prove the runtime array refusal.
  expect(() => api.subscript.target(schema.tables.mappings!.matrix as never, "new")).toThrow();
});

test("hstore.sourceBound124MemberFiveGateRoster", () => {
  expect(hstoreMembers.toSorted()).toEqual(capture.contract.members.map(({ id }) => id).toSorted());
  expect(hstoreMembers).toHaveLength(124);
  expect(new Set(hstoreMembers).size).toBe(124);
  expect(hstoreMemberProofs).toHaveLength(124);
  for (const member of hstoreMemberProofs) {
    expect(member.transfers).toEqual([]);
    const definition = hstoreProofCases.find(({ id }) => id === member.cases[0]!.caseId)!;
    expect(definition.gate).toBe("database");
    expect(
      definition.claims.some((claim) => claim.member === member.id && claim.scenario === member.cases[0]!.scenario),
    ).toBe(true);
  }
  expect(new Set(hstoreProofCases.map(({ gate }) => gate))).toEqual(
    new Set(["unit", "types", "database", "generation", "consumer"]),
  );
  const catalogue: ExtensionSemanticProofInput["baseline"] = baseline.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const candidate = registerHstoreSemanticProof({
    baseline: catalogue,
    declarations: catalogue.map((entry) =>
      entry.disposition === "eligible"
        ? { extension: entry.name, state: "pending", prerequisite: "Parent gates pending" }
        : { extension: entry.name, state: "excluded", reason: entry.disposition },
    ),
    manifests: [],
    cases: [],
    receipts: [],
    currentSources: [],
    artifact: null,
  });
  const family = validateExtensionSemanticProof(candidate).families.find((entry) => entry.extension === "hstore");
  expect(family?.state).toBe("pending");
  for (const gate of ["unit", "types", "database", "generation", "consumer"])
    expect(family?.blockers).toContain(`${gate}: missing required proof`);
  expect(() => registerHstoreSemanticProof(candidate)).toThrow(/existing pending/);
});
