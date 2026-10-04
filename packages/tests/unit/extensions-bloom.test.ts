import { expect, test } from "vite-plus/test";
import assert from "node:assert/strict";
import * as v from "valibot";
import { appendFileSync } from "node:fs";
import { createBloom_1_0 } from "../../../apps/loom/src/core/extensions/adapters/bloom";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { bloomAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/bloom";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/bloom.json";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import baselineEvidence from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import { validateExtensionSemanticProof } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { bloomMemberProofs, registerBloomSemanticProof } from "../../e2e/fixtures/bloom-semantic-proof";
import { bloomUnitProofCase } from "../../e2e/fixtures/bloom-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";

const verified = {
  name: "bloom",
  version: "1.0",
  schema: 'unit"bloom',
  apiSupport: { status: "verified", digest: "e35e04e263d75f19673d2b1282a75b7975b74f201c7cd5dc8040188f54b06cc3" },
} as const;
const bloom = createBloom_1_0(verified);

// The host corroborates this callback's terminal event against Vitest's independent JSON result.
test(bloomUnitProofCase.title, () => {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: bloomUnitProofCase });
  record({ runId: identity, kind: "started", caseId: bloomUnitProofCase.id });
  let passed = false;
  try {
    expect(manifest.digest).toBe(verified.apiSupport.digest);
    const selection = { bloom: { version: "1.0", schema: 'unit"bloom' } } as const;
    const resolved = resolveSelectedExtension("bloom", selection.bloom);
    assert(resolved.manifest);
    expect(resolved.adapter).toBeDefined();
    const required = buildRequiredApi(selection);
    expect(validateRequiredApiForTarget(required)).toEqual(required);
    expect(required?.apis[0]?.manifest.digest).toBe(resolved.manifest.digest);
    const generated = extensionBindingsSource(selection);
    expect(generated).toContain(JSON.stringify(resolved.manifest.digest));
    expect(generated).toContain('from "kello/extensions/bloom"');
    expect(generated).not.toContain("kello/tooling");
    expect(resolveSelectedExtension("bloom", { version: "future", schema: "extensions" }).adapter).toBeUndefined();
    expect(extensionBindingsSource(undefined)).not.toContain("kello/extensions/bloom");
    expect(extensionBindingsSource({})).not.toContain("kello/extensions/bloom");
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: bloomUnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
});

test("bloom admits only its exact verified 1.0 contract", () => {
  for (const descriptor of [
    { ...verified, name: "bloom_other" },
    { ...verified, version: "1.1" },
    { ...verified, apiSupport: { status: "unverified" } },
    { ...verified, apiSupport: { status: "verified", digest: "wrong" } },
  ])
    // SAFETY: invalid JavaScript descriptors exercise admission beyond the static signature.
    expect(() => createBloom_1_0(descriptor as never)).toThrow("bloom 1.0 requires its exact verified contract");
});

test("bloom index classes match the captured default int4 and text classes", () => {
  const classes = manifest.contract.members.filter((member) => member.kind === "opclass");
  expect([bloom.indexes.int4(), bloom.indexes.text()]).toEqual(
    classes.map((member) => ({
      name: "bloom",
      version: "1.0",
      schema: 'unit"bloom',
      digest: verified.apiSupport.digest,
      member: member.id,
      method: member.accessMethod,
      opclass: member.name,
      type: member.input!.name,
      default: member.isDefault,
      input: { schema: member.input!.namespace, type: member.input!.name, dimensions: 0 },
    })),
  );
  expect(Object.isFrozen(bloom.indexes.int4())).toBe(true);
  const method = manifest.contract.members.find((member) => member.kind === "access-method")!;
  expect(bloom.accessMethod).toMatchObject({ member: method.id, name: method.name, unique: false, strategies: ["="] });
  expect(`routine:${method.handler}`).toBe(bloom.accessMethod.handler);
});

test("bloom storage maps signature bits to native reloptions within native bounds", () => {
  expect(bloom.storage({})).toEqual({});
  expect(bloom.storage({ length: 80, bits: [2, 4] })).toEqual({ length: 80, col1: 2, col2: 4 });
  expect(bloom.storage({ length: 4096, bits: Array.from({ length: 32 }, () => 4095) })).toMatchObject({
    length: 4096,
    col32: 4095,
  });
  for (const options of [
    { length: 0 },
    { length: 4097 },
    { length: 1.5 },
    { bits: [] },
    { bits: [0] },
    { bits: [4096] },
    { bits: Array.from({ length: 33 }, () => 1) },
    { fillfactor: 50 },
  ])
    // SAFETY: invalid JavaScript options exercise runtime validation beyond the static signature.
    expect(() => bloom.storage(options as never)).toThrow();
});

test("bloom schemas migrate to quoted bloom classes with storage parameters", async () => {
  const schema = defineSchema(
    (fields) => ({
      entries: defineTable(
        { code: fields.integer(), label: fields.text(), region: fields.text() },
        {
          indexes: [
            { fields: ["code"], extension: bloom.indexes.int4(), with: bloom.storage({ length: 80, bits: [3] }) },
            { fields: ["label", "region"], extension: bloom.indexes.text() },
          ],
        },
      ),
    }),
    { namespace: "app" },
  );
  expect(schema.metadata.extensionRequirements?.map((entry) => entry.member)).toEqual([
    "opclass:$extension:bloom.int4_ops/bloom",
    "opclass:$extension:bloom.text_ops/bloom",
  ]);
  const statements = (await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema))).join("\n");
  // Captured default classes are the only bloom classes for their types, so DDL uses the default-class form.
  expect(statements).toContain('ON "app"."entries" USING bloom ("code") WITH (length=80, col1=3);');
  expect(statements).toContain('ON "app"."entries" USING bloom ("label","region");');
  // bigint storage has no captured bloom class.
  expect(() =>
    defineSchema(
      (fields) => ({
        entries: defineTable(
          { wide: fields.bigint() },
          { indexes: [{ fields: ["wide"], extension: bloom.indexes.int4() }] },
        ),
      }),
      { namespace: "app" },
    ),
  ).toThrow("Extension index incompatible with field entries.wide");
});

test("bloom accounts for every captured member with direct or transferred native proof", () => {
  expect(bloomAnnotations.map((entry) => entry.id).sort()).toEqual(
    manifest.contract.members.map((member) => member.id).sort(),
  );
  for (const proof of bloomMemberProofs) {
    if (proof.disposition === "internal") {
      expect(proof.cases).toEqual([]);
      expect(proof.transfers).toHaveLength(1);
    } else {
      expect(proof.cases).toEqual([
        { caseId: "bloom.native-indexes", scenario: expect.stringContaining("bloom-scan-equals-sequential") },
      ]);
      expect(proof.transfers).toEqual([]);
    }
  }
  expect(bloomMemberProofs.filter((proof) => proof.disposition !== "internal").map((proof) => proof.id)).toEqual([
    "access method:bloom",
    "opclass:$extension:bloom.int4_ops/bloom",
    "opclass:$extension:bloom.text_ops/bloom",
    "routine:$extension:bloom.blhandler(pg_catalog.internal)",
  ]);
});

test("bloom registration passes semantic-proof structure and stays pending without host receipts", () => {
  const baseline = baselineEvidence.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const input = registerBloomSemanticProof({
    baseline,
    manifests: [],
    cases: [],
    receipts: [],
    currentSources: [],
    artifact: null,
    declarations: baseline.map((entry) =>
      entry.disposition === "eligible"
        ? { extension: entry.name, state: "pending" as const, prerequisite: "Not implemented or accepted" }
        : { extension: entry.name, state: "excluded" as const, reason: entry.disposition },
    ),
  });
  // Throws on any transfer whose captured parent edge disagrees with the pinned manifest.
  const result = validateExtensionSemanticProof(input);
  const family = result.families.find((entry) => entry.extension === "bloom")!;
  expect(family.state).toBe("pending");
  expect(family.blockers.length).toBeGreaterThan(0);
});
