import { createHash } from "node:crypto";
import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import baselineEvidence from "../../../docs/architecture/evidence/neon-extension-capability-map-2026-10-02.json";
import uuidEvidence from "../../../apps/loom/src/tooling/extensions/manifests/pg_uuidv7.json";
import citextEvidence from "../../../apps/loom/src/tooling/extensions/manifests/citext.json";
import unaccentEvidence from "../../../apps/loom/src/tooling/extensions/manifests/unaccent.json";
import hstoreEvidence from "../../../apps/loom/src/tooling/extensions/manifests/hstore.json";
import { createExtensionSubscriptCapture } from "../../../apps/loom/src/tooling/extensions/subscript-capture";
import { createExtensionTextSearchCapture } from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import trgmEvidence from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import {
  extensionManifestValidator,
  type ExtensionManifest,
  type ExtensionMember,
} from "../../../apps/loom/src/core/extensions/contracts";
import { createExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  validateExtensionSemanticProof,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

const uuid = v.parse(extensionManifestValidator, uuidEvidence);
const citext = v.parse(extensionManifestValidator, citextEvidence);
const trgm = v.parse(extensionManifestValidator, trgmEvidence);
const gates: ExtensionProofGate[] = ["unit", "types", "database", "generation", "consumer"];
const sha = "a".repeat(64);

// All receipts here are fabricated unit data. They cannot establish actual provider acceptance.
function fixture(manifest: ExtensionManifest = uuid): ExtensionSemanticProofInput {
  const family = {
    extension: manifest.contract.extension,
    version: manifest.contract.version,
    postgresMajor: 18 as const,
    provider: "neon" as const,
    manifestDigest: manifest.digest,
  };
  const baseline = baselineEvidence.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist([
        "eligible",
        "unavailable-pg18",
        "existing-only",
        "deprecated",
        "builtin",
        "decoder-plugin",
      ]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const cases = gates.map((gate) => ({
    id: `${family.extension}.${gate}`,
    gate,
    file: `packages/tests/unit/${gate}-proof.test.ts`,
    title: `${gate} fixture only`,
    families: [family],
    claims:
      gate === "database"
        ? manifest.contract.members.map((member) => ({
            family,
            member: member.id,
            scenario: "roundtrip",
          }))
        : [],
  }));
  const currentSources = gates.flatMap((gate) => [
    { file: `apps/loom/src/core/extensions/${gate}-fixture.ts`, sha256: sha },
    { file: `packages/tests/unit/${gate}-proof.test.ts`, sha256: sha },
  ]);
  const buildSources = currentSources.filter((source) => source.file.includes("consumer"));
  const artifact = { tarballSha256: "b".repeat(64), buildSources };
  const receipts: ExtensionProofReceipt[] = cases.map((definition) => {
    const sources = currentSources.filter((source) => source.file.includes(definition.gate));
    const common = {
      format: 1 as const,
      runId: `run-${definition.gate}`,
      finalizedBy: "host" as const,
      runner: {
        name: definition.gate === "types" ? ("tsc" as const) : ("vitest" as const),
        version: "4.0.0",
      },
      command: ["unit-fixture-only", definition.id],
      exitCode: 0,
      sourcesBefore: sources.map((source) => ({ ...source })),
      sourcesAfter: sources.map((source) => ({ ...source })),
      definitionsDigest: extensionProofCasesDigest([definition]),
      cases: [
        {
          id: definition.id,
          file: definition.file,
          title: definition.title,
          status: "passed" as const,
          witnessFailures: 0,
          witnesses: definition.claims.map((claim) => ({ ...claim, schema: "fixture_extensions" })),
        },
      ],
      totals: { passed: 1, failed: 0, skipped: 0, todo: 0, incomplete: 0 },
    };
    if (definition.gate === "database")
      return {
        ...common,
        gate: "database",
        database: {
          provider: "neon",
          postgresMajor: 18,
          serverVersion: "180006",
          targetFingerprint: sha,
          observed: [{ ...family, schema: "fixture_extensions" }],
          fixtureCleanupCompleted: true,
        },
      };
    if (definition.gate === "consumer")
      return {
        ...common,
        gate: "consumer",
        package: {
          ...artifact,
          nodeVersion: "24.0.0",
          installation: "isolated",
          frozenReinstallPassed: true,
          declarationsPassed: true,
          runtimePassed: true,
          selectedBundleChecksPassed: true,
        },
      };
    return { ...common, gate: definition.gate };
  });
  const requirement = (gate: ExtensionProofGate) => {
    const receipt = receipts.find((item) => item.gate === gate)!;
    return {
      sources: receipt.sourcesBefore.map((source) => source.file),
      proofs: [
        {
          caseId: `${family.extension}.${gate}`,
          runId: receipt.runId,
          receiptDigest: extensionProofReceiptDigest(receipt),
        },
      ],
    };
  };
  const declarations = baseline.map((entry) =>
    entry.disposition === "eligible"
      ? {
          extension: entry.name,
          state: "pending" as const,
          prerequisite: "Not implemented or accepted",
        }
      : { extension: entry.name, state: "excluded" as const, reason: entry.disposition },
  );
  const input: ExtensionSemanticProofInput = {
    baseline,
    manifests: [manifest],
    cases,
    receipts,
    currentSources,
    artifact,
    declarations,
  };
  input.declarations = input.declarations.map((entry) =>
    entry.extension !== family.extension
      ? entry
      : {
          extension: family.extension,
          state: "candidate",
          family,
          schema: "fixture_extensions",
          catalogueVersionReconciliation:
            baseline.find((entry) => entry.name === family.extension)!.version === family.version
              ? null
              : {
                  capturedVersion: family.version,
                  reason: "Fixture reconciles SQL control version",
                  citations: ["fixture-only"],
                  resolution: "upstream-release-uses-captured-sql-version",
                },
          members: manifest.contract.members.map((member) => ({
            id: member.id,
            disposition: "query",
            reason: "Unit fixture only",
            citations: ["fixture-only"],
            cases: [{ caseId: `${family.extension}.database`, scenario: "roundtrip" }],
            transfers: [],
          })),
          gates: {
            unit: requirement("unit"),
            types: requirement("types"),
            database: requirement("database"),
            generation: requirement("generation"),
            consumer: requirement("consumer"),
          },
        },
  );
  return input;
}

function candidate(input: ExtensionSemanticProofInput) {
  const result = input.declarations.find((entry) => entry.state === "candidate");
  if (!result || result.state !== "candidate") throw new Error("Missing fixture candidate");
  return result;
}

function updateReceipt(input: ExtensionSemanticProofInput, receipt: ExtensionProofReceipt) {
  input.receipts = input.receipts.map((entry) => (entry.runId === receipt.runId ? receipt : entry));
  for (const gate of gates)
    for (const reference of candidate(input).gates[gate].proofs)
      if (reference.runId === receipt.runId)
        reference.receiptDigest = extensionProofReceiptDigest(receipt);
}

function pending(input: ExtensionSemanticProofInput) {
  const result = validateExtensionSemanticProof(input);
  expect(result.counts.accepted).toBe(0);
  expect(result.complete).toBe(false);
  expect(
    result.families.find((entry) => entry.extension === candidate(input).extension)?.state,
  ).toBe("pending");
  return result;
}

test("one exact unit candidate leaves all other eligible families pending and full completion false", () => {
  const result = validateExtensionSemanticProof(fixture());
  expect(result.counts).toEqual({ accepted: 1, pending: 72, restricted: 0, excluded: 12 });
  expect(result.families).toHaveLength(85);
  expect(result.complete).toBe(false);
});

test("arbitrary citations and missing consumer/type/database proof cannot accept a family", () => {
  for (const gate of gates) {
    const input = fixture();
    candidate(input).gates[gate].proofs = [];
    pending(input);
  }
  const input = fixture();
  candidate(input).members[0]!.cases = [];
  pending(input);
  input.artifact = null;
  pending(input);
});

test("source changes invalidate only their relevant gate and unrelated docs do not invalidate evidence", () => {
  const input = fixture();
  input.currentSources.push({ file: "apps/docs/content/unrelated.mdx", sha256: "c".repeat(64) });
  expect(validateExtensionSemanticProof(input).counts.accepted).toBe(1);
  input.currentSources[0]!.sha256 = "c".repeat(64);
  expect(pending(input).blockers.join(" ")).toContain("source");
});

test("missing member witness, stale case definition and stale run/digest remain pending", () => {
  for (const mutation of ["witness", "case", "run", "digest"] as const) {
    const input = fixture();
    const receipt = input.receipts.find((entry) => entry.gate === "database")!;
    if (mutation === "witness") {
      receipt.cases[0]!.witnesses.shift();
      updateReceipt(input, receipt);
    } else if (mutation === "case")
      input.cases.find((entry) => entry.gate === "database")!.title = "renamed real case";
    else if (mutation === "run")
      input.receipts = input.receipts.filter((entry) => entry !== receipt);
    else candidate(input).gates.database.proofs[0]!.receiptDigest = "d".repeat(64);
    pending(input);
  }
});

test("provider profile, observed exact tuple/schema, source stability and cleanup are required", () => {
  for (const mutation of [
    "provider",
    "major",
    "version",
    "schema",
    "digest",
    "cleanup",
    "source",
  ] as const) {
    const input = fixture();
    const receipt = input.receipts.find((entry) => entry.gate === "database");
    if (!receipt || receipt.gate !== "database") throw new Error("Missing database fixture");
    if (mutation === "provider") receipt.database.provider = "local";
    else if (mutation === "major") receipt.database.postgresMajor = 17;
    else if (mutation === "version") receipt.database.observed[0]!.version = "future";
    else if (mutation === "schema") receipt.database.observed[0]!.schema = "other_schema";
    else if (mutation === "digest") receipt.database.observed[0]!.manifestDigest = "d".repeat(64);
    else if (mutation === "cleanup") receipt.database.fixtureCleanupCompleted = false;
    else
      receipt.sourcesAfter = receipt.sourcesAfter.map((source) => ({
        ...source,
        sha256: "d".repeat(64),
      }));
    updateReceipt(input, receipt);
    pending(input);
  }
});

test("a recorded member witness from another schema cannot borrow an observed target contract", () => {
  const input = fixture();
  const receipt = input.receipts.find((entry) => entry.gate === "database")!;
  receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.map((witness) => ({
    ...witness,
    schema: "other_schema",
  }));
  updateReceipt(input, receipt);
  pending(input);
});

test("child failure, skipped or incomplete cases and caught witness failures cannot be finalized as acceptance", () => {
  for (const status of ["failed", "skipped", "todo", "incomplete"] as const) {
    const input = fixture();
    const receipt = input.receipts[0]!;
    receipt.cases[0]!.status = status;
    receipt.totals.passed = 0;
    receipt.totals[status] = 1;
    updateReceipt(input, receipt);
    pending(input);
  }
  for (const mutation of ["exit", "caught"] as const) {
    const input = fixture();
    const receipt = input.receipts[0]!;
    if (mutation === "exit") receipt.exitCode = 1;
    else receipt.cases[0]!.witnessFailures = 1;
    updateReceipt(input, receipt);
    pending(input);
  }
});

test("consumer proof requires the current packed artifact, build sources and every isolated gate", () => {
  for (const mutation of [
    "artifact",
    "build",
    "workspace",
    "frozen",
    "types",
    "runtime",
    "bundle",
  ] as const) {
    const input = fixture();
    const receipt = input.receipts.find((entry) => entry.gate === "consumer");
    if (!receipt || receipt.gate !== "consumer") throw new Error("Missing consumer fixture");
    if (mutation === "artifact") receipt.package.tarballSha256 = "d".repeat(64);
    else if (mutation === "build")
      receipt.package.buildSources = receipt.package.buildSources.map((source) => ({
        ...source,
        sha256: "d".repeat(64),
      }));
    else if (mutation === "workspace") receipt.package.installation = "workspace";
    else if (mutation === "frozen") receipt.package.frozenReinstallPassed = false;
    else if (mutation === "types") receipt.package.declarationsPassed = false;
    else if (mutation === "runtime") receipt.package.runtimePassed = false;
    else receipt.package.selectedBundleChecksPassed = false;
    updateReceipt(input, receipt);
    pending(input);
  }
});

test("consumer case source is bound to its run without becoming an artificial package build input", () => {
  const input = fixture();
  const receipt = input.receipts.find((entry) => entry.gate === "consumer");
  if (!receipt || receipt.gate !== "consumer" || !input.artifact)
    throw new Error("Missing consumer fixture");
  receipt.package.buildSources = receipt.package.buildSources.filter((source) =>
    source.file.startsWith("apps/loom/"),
  );
  input.artifact.buildSources = input.artifact.buildSources.filter((source) =>
    source.file.startsWith("apps/loom/"),
  );
  updateReceipt(input, receipt);
  expect(validateExtensionSemanticProof(input).counts.accepted).toBe(1);
});

test("malformed catalogue, member, file/case/run identities and receipt gate branches fail structurally", () => {
  const truncated = fixture();
  truncated.baseline.pop();
  expect(() => validateExtensionSemanticProof(truncated)).toThrow("85/73");
  const changed = fixture();
  changed.baseline[0]!.version = "future";
  expect(() => validateExtensionSemanticProof(changed)).toThrow("85/73");
  const duplicate = fixture();
  duplicate.declarations.push(duplicate.declarations[0]!);
  expect(() => validateExtensionSemanticProof(duplicate)).toThrow("Duplicate");
  const missing = fixture();
  missing.declarations.pop();
  expect(() => validateExtensionSemanticProof(missing)).toThrow("Missing");
  const unknownMember = fixture();
  candidate(unknownMember).members[0]!.id = "routine:invented";
  expect(() => validateExtensionSemanticProof(unknownMember)).toThrow("member");
  const unknownCase = fixture();
  candidate(unknownCase).gates.unit.proofs[0]!.caseId = "invented-case";
  expect(() => validateExtensionSemanticProof(unknownCase)).toThrow("case");
  const duplicateRun = fixture();
  duplicateRun.receipts.push(duplicateRun.receipts[0]!);
  expect(() => validateExtensionSemanticProof(duplicateRun)).toThrow("Duplicate");
  const path = fixture();
  path.currentSources[0]!.file = "../outside.ts";
  expect(() => validateExtensionSemanticProof(path)).toThrow();
  const branch = fixture();
  const database = branch.receipts.find((entry) => entry.gate === "database")!;
  expect(() =>
    validateExtensionSemanticProof({ ...branch, receipts: [{ ...database, gate: "unit" }] }),
  ).toThrow();
});

test("restricted and unsupported baseline entries keep their explicit dispositions", () => {
  const input = fixture();
  input.declarations = input.declarations.map((entry) =>
    entry.extension === "vector"
      ? { extension: entry.extension, state: "restricted", prerequisite: "Fixture unavailable" }
      : entry,
  );
  expect(validateExtensionSemanticProof(input).counts).toEqual({
    accepted: 1,
    pending: 71,
    restricted: 1,
    excluded: 12,
  });
  input.declarations = input.declarations.map((entry) =>
    entry.extension === "plpgsql"
      ? { extension: entry.extension, state: "pending", prerequisite: "Wrong disposition" }
      : entry,
  );
  expect(() => validateExtensionSemanticProof(input)).toThrow("excluded");
});

function classFixture() {
  const opclass = citext.contract.members.find(
    (member) => member.kind === "opclass" && member.accessMethod === "btree",
  )!;
  if (opclass.kind !== "opclass") throw new Error("Missing captured class");
  const family = citext.contract.members.find(
    (member) => member.kind === "opfamily" && `opfamily:${opclass.family}` === member.id,
  )!;
  if (family.kind !== "opfamily") throw new Error("Missing captured family");
  const attachment = citext.contract.members.find(
    (member) =>
      member.kind === "other" &&
      member.objectType === "operator of access method" &&
      member.identity.endsWith("citext_ops USING btree"),
  )!;
  if (attachment.kind !== "other") throw new Error("Missing captured attachment");
  const input = fixture(
    createExtensionManifest(
      { ...citext.contract, members: [opclass, family, attachment] },
      citext.provenance,
    ),
  );
  const declaration = candidate(input);
  const internalFamily = declaration.members.find((entry) => entry.id === family.id)!;
  internalFamily.disposition = "internal";
  internalFamily.cases = [];
  internalFamily.transfers = [
    {
      from: opclass.id,
      relation: { kind: "opclass-family" },
      caseId: `${declaration.extension}.database`,
      scenario: "roundtrip",
      basis: "Actual captured family belongs to class",
    },
  ];
  const internalAttachment = declaration.members.find((entry) => entry.id === attachment.id)!;
  internalAttachment.disposition = "internal";
  internalAttachment.cases = [];
  const row = family.operators.find((entry) =>
    attachment.identity.startsWith(`operator ${entry.strategy} (`),
  )!;
  internalAttachment.transfers = [
    {
      from: family.id,
      relation: { kind: "attachment", family: family.id, row: { kind: "operator", ...row } },
      caseId: `${declaration.extension}.database`,
      scenario: "roundtrip",
      basis: "Exact captured strategy attachment",
    },
  ];
  return { input, opclass, family, attachment };
}

test("exact internal family and captured strategy attachment may transfer to a directly witnessed class", () => {
  expect(validateExtensionSemanticProof(classFixture().input).counts.accepted).toBe(1);
  const { input, opclass } = classFixture();
  const receipt = input.receipts.find((entry) => entry.gate === "database")!;
  receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
    (witness) => witness.member !== opclass.id,
  );
  updateReceipt(input, receipt);
  expect(pending(input).blockers.join(" ")).toContain("executed root");
});

test("captured input callback transfers only through its exact type slot", () => {
  const type = citext.contract.members.find(
    (member) => member.kind === "type" && member.name === "citext",
  )!;
  const routine = citext.contract.members.find(
    (member) => member.id === "routine:$extension:citext.citextin(pg_catalog.cstring)",
  )!;
  const input = fixture(
    createExtensionManifest({ ...citext.contract, members: [type, routine] }, citext.provenance),
  );
  const proof = candidate(input).members.find((member) => member.id === routine.id)!;
  proof.disposition = "internal";
  proof.cases = [];
  proof.transfers = [
    {
      from: type.id,
      relation: { kind: "type-routine", slot: "input" },
      caseId: "citext.database",
      scenario: "roundtrip",
      basis: "Exact captured input callback",
    },
  ];
  expect(validateExtensionSemanticProof(input).counts.accepted).toBe(1);
  proof.transfers[0]!.relation = { kind: "type-routine", slot: "output" };
  expect(() => validateExtensionSemanticProof(input)).toThrow("captured transfer");
});

test("public transfers, self/cyclic/arbitrary parents and wrong attachment strategy fail structurally", () => {
  for (const mutation of ["public", "self", "cycle", "parent", "strategy"] as const) {
    const { input, opclass, family, attachment } = classFixture();
    const declaration = candidate(input);
    const familyProof = declaration.members.find((entry) => entry.id === family.id)!;
    if (mutation === "public") familyProof.disposition = "schema";
    else if (mutation === "self") familyProof.transfers[0]!.from = family.id;
    else if (mutation === "parent") familyProof.transfers[0]!.from = attachment.id;
    else if (mutation === "strategy") {
      const relation = declaration.members.find((entry) => entry.id === attachment.id)!
        .transfers[0]!.relation;
      if (relation.kind !== "attachment" || relation.row.kind !== "operator")
        throw new Error("Wrong fixture relation");
      relation.row.strategy = 99;
    } else {
      const classProof = declaration.members.find((entry) => entry.id === opclass.id)!;
      classProof.disposition = "internal";
      classProof.cases = [];
      classProof.transfers = [{ ...familyProof.transfers[0]!, from: family.id }];
    }
    expect(() => validateExtensionSemanticProof(input)).toThrow();
  }
});

test("every captured Citext and trigram support attachment reconciles to its exact structured family row", () => {
  for (const manifest of [citext, trgm]) {
    const input = fixture(manifest);
    const declaration = candidate(input);
    let attachmentCount = 0;
    for (const member of manifest.contract.members) {
      if (member.kind === "opfamily") {
        const parent = manifest.contract.members.find(
          (entry) => entry.kind === "opclass" && member.id === `opfamily:${entry.family}`,
        )!;
        const annotation = declaration.members.find((entry) => entry.id === member.id)!;
        annotation.disposition = "internal";
        annotation.cases = [];
        annotation.transfers = [
          {
            from: parent.id,
            relation: { kind: "opclass-family" },
            caseId: `${declaration.extension}.database`,
            scenario: "roundtrip",
            basis: "Captured class owns exact family",
          },
        ];
      }
      if (
        member.kind !== "other" ||
        !["function of access method", "operator of access method"].includes(member.objectType)
      )
        continue;
      attachmentCount++;
      const family = manifest.contract.members.find(
        (entry) =>
          entry.kind === "opfamily" &&
          member.identity.endsWith(`${entry.name} USING ${entry.accessMethod}`),
      )!;
      if (family.kind !== "opfamily") throw new Error("Captured attachment lacks family");
      const row =
        member.objectType === "function of access method"
          ? family.procedures.find((entry) =>
              member.identity.startsWith(`function ${entry.number} (`),
            )
          : family.operators.find((entry) =>
              member.identity.startsWith(`operator ${entry.strategy} (`),
            );
      if (!row) throw new Error("Captured attachment lacks row");
      const annotation = declaration.members.find((entry) => entry.id === member.id)!;
      annotation.disposition = "internal";
      annotation.cases = [];
      annotation.transfers = [
        {
          from: family.id,
          relation: {
            kind: "attachment",
            family: family.id,
            row: "procedure" in row ? { kind: "procedure", ...row } : { kind: "operator", ...row },
          },
          caseId: `${declaration.extension}.database`,
          scenario: "roundtrip",
          basis: "Exact captured access-method attachment",
        },
      ];
    }
    expect(attachmentCount).toBe(manifest === citext ? 15 : 33);
    expect(validateExtensionSemanticProof(input).counts.accepted).toBe(1);
  }
});

test("public Citext arrays cannot borrow their element proof after their direct witness is removed", () => {
  const input = fixture(citext);
  const declaration = candidate(input);
  const array = citext.contract.members.find(
    (member) => member.kind === "type" && member.name === "_citext",
  )!;
  const element = citext.contract.members.find(
    (member) => member.kind === "type" && member.name === "citext",
  )!;
  const arrayProof = declaration.members.find((member) => member.id === array.id)!;
  arrayProof.disposition = "internal";
  arrayProof.cases = [];
  arrayProof.transfers = [
    {
      from: element.id,
      relation: { kind: "array-element" },
      caseId: "citext.database",
      scenario: "roundtrip",
      basis: "Captured array element",
    },
  ];
  const receipt = input.receipts.find((entry) => entry.gate === "database")!;
  receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
    (witness) => witness.member !== array.id,
  );
  updateReceipt(input, receipt);
  expect(() => validateExtensionSemanticProof(input)).toThrow("Public type");
});

test("public Citext scalar types cannot borrow an opclass input proof after their direct witness is removed", () => {
  const input = fixture(citext);
  const type = citext.contract.members.find(
    (member) => member.kind === "type" && member.name === "citext",
  )!;
  const opclass = citext.contract.members.find(
    (member) =>
      member.kind === "opclass" && member.accessMethod === "btree" && member.name === "citext_ops",
  )!;
  if (opclass.kind !== "opclass") throw new Error("Missing captured Citext class");
  expect(opclass.storage).toBeNull();
  const proof = candidate(input).members.find((member) => member.id === type.id)!;
  proof.disposition = "internal";
  proof.cases = [];
  proof.transfers = [
    {
      from: opclass.id,
      relation: { kind: "opclass-storage" },
      caseId: "citext.database",
      scenario: "roundtrip",
      basis: "Attempt to hide public field behind class input",
    },
  ];
  const receipt = input.receipts.find((entry) => entry.gate === "database")!;
  receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
    (witness) => witness.member !== type.id,
  );
  updateReceipt(input, receipt);
  expect(() => validateExtensionSemanticProof(input)).toThrow("Public type");
});

test("genuine distinct trigram storage and its internal array transfer without direct witnesses", () => {
  const input = fixture(trgm);
  const storage = trgm.contract.members.find(
    (member) => member.kind === "type" && member.name === "gtrgm",
  )!;
  const array = trgm.contract.members.find(
    (member) => member.kind === "type" && member.name === "_gtrgm",
  )!;
  const opclass = trgm.contract.members.find(
    (member) => member.kind === "opclass" && member.accessMethod === "gist",
  )!;
  const declaration = candidate(input);
  for (const [member, parent, relation] of [
    [storage, opclass, { kind: "opclass-storage" }],
    [array, storage, { kind: "array-element" }],
  ] as const) {
    const proof = declaration.members.find((entry) => entry.id === member.id)!;
    proof.disposition = "internal";
    proof.cases = [];
    proof.transfers = [
      {
        from: parent.id,
        relation,
        caseId: "pg_trgm.database",
        scenario: "roundtrip",
        basis: "Exact captured distinct internal storage role",
      },
    ];
  }
  const receipt = input.receipts.find((entry) => entry.gate === "database")!;
  receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
    (witness) => witness.member !== storage.id && witness.member !== array.id,
  );
  updateReceipt(input, receipt);
  expect(validateExtensionSemanticProof(input).counts.accepted).toBe(1);
  declaration.members.find((member) => member.id === array.id)!.transfers[0]!.from = opclass.id;
  expect(() => validateExtensionSemanticProof(input)).toThrow("captured transfer");
});

test("an explicit index storage role cannot hide a type also used by an ordinary SQL contract", () => {
  const storage = trgm.contract.members.find(
    (member) => member.kind === "type" && member.name === "gtrgm",
  )!;
  const opclass = trgm.contract.members.find(
    (member) => member.kind === "opclass" && member.accessMethod === "gist",
  )!;
  if (storage.kind !== "type") throw new Error("Missing captured storage type");
  const value = { namespace: storage.namespace!, name: storage.name };
  const routine = trgm.contract.members.find(
    (member) => member.kind === "routine" && member.name === "similarity",
  )!;
  const operator = trgm.contract.members.find((member) => member.kind === "operator")!;
  if (routine.kind !== "routine" || operator.kind !== "operator")
    throw new Error("Missing captured SQL fixtures");
  for (const role of [
    "routine-input",
    "routine-output",
    "operator",
    "cast",
    "class-input",
    "column",
  ] as const) {
    let publicMember: ExtensionMember;
    if (role === "routine-input")
      publicMember = {
        ...routine,
        id: `routine:$extension:pg_trgm.fixture_input($extension:pg_trgm.gtrgm)`,
        name: "fixture_input",
        arguments: [{ name: null, type: value, mode: "in", hasDefault: false }],
      };
    else if (role === "routine-output")
      publicMember = {
        ...routine,
        id: "routine:$extension:pg_trgm.fixture_output()",
        name: "fixture_output",
        arguments: [],
        returns: value,
      };
    else if (role === "operator")
      publicMember = {
        ...operator,
        id: "operator:$extension:pg_trgm.fixture($extension:pg_trgm.gtrgm,$extension:pg_trgm.gtrgm)",
        name: "fixture",
        left: value,
        right: value,
      };
    else if (role === "cast")
      publicMember = {
        id: "cast:$extension:pg_trgm.gtrgm->pg_catalog.text",
        name: "fixture cast",
        namespace: null,
        ownership: "direct",
        kind: "cast",
        source: value,
        target: { namespace: "pg_catalog", name: "text" },
        context: "explicit",
        method: "inout",
        procedure: null,
      };
    else if (role === "class-input") {
      if (opclass.kind !== "opclass") throw new Error("Missing captured class");
      publicMember = {
        ...opclass,
        id: "opclass:$extension:pg_trgm.fixture_ops/gist",
        name: "fixture_ops",
        input: value,
      };
    } else
      publicMember = {
        id: "relation:$extension:pg_trgm.fixture",
        name: "fixture",
        namespace: "$extension:pg_trgm",
        ownership: "direct",
        kind: "relation",
        relationKind: "r",
        columns: [
          { name: "value", type: value, nullable: true, ordinal: 1, modifier: -1, collation: null },
        ],
        definition: null,
      };
    // Synthetic contract variants exercise conflicting roles; these are never provider acceptance evidence.
    const manifest = createExtensionManifest(
      { ...trgm.contract, members: [...trgm.contract.members, publicMember] },
      trgm.provenance,
    );
    const input = fixture(manifest);
    const proof = candidate(input).members.find((member) => member.id === storage.id)!;
    proof.disposition = "internal";
    proof.cases = [];
    proof.transfers = [
      {
        from: opclass.id,
        relation: { kind: "opclass-storage" },
        caseId: "pg_trgm.database",
        scenario: "roundtrip",
        basis: "Attempt to hide a public type behind additional storage role",
      },
    ];
    const receipt = input.receipts.find((entry) => entry.gate === "database")!;
    receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
      (witness) => witness.member !== storage.id,
    );
    updateReceipt(input, receipt);
    expect(() => validateExtensionSemanticProof(input), role).toThrow("Public type");
  }
});

test("an element reference alone does not establish an internal array storage role", () => {
  const arrayId = "type:$extension:pg_trgm._gtrgm";
  const storageId = "type:$extension:pg_trgm.gtrgm";
  for (const mutation of ["category", "array-link"] as const) {
    const manifest = createExtensionManifest(
      {
        ...trgm.contract,
        members: trgm.contract.members.map((member) => {
          if (member.kind !== "type") return member;
          if (mutation === "category" && member.id === arrayId) return { ...member, category: "U" };
          if (mutation === "array-link" && member.id === storageId)
            return { ...member, array: null };
          return member;
        }),
      },
      trgm.provenance,
    );
    const input = fixture(manifest);
    const proof = candidate(input).members.find((member) => member.id === arrayId)!;
    proof.disposition = "internal";
    proof.cases = [];
    proof.transfers = [
      {
        from: storageId,
        relation: { kind: "array-element" },
        caseId: "pg_trgm.database",
        scenario: "roundtrip",
        basis: "Attempt to infer array role from element reference alone",
      },
    ];
    const receipt = input.receipts.find((entry) => entry.gate === "database")!;
    receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
      (witness) => witness.member !== arrayId,
    );
    updateReceipt(input, receipt);
    expect(() => validateExtensionSemanticProof(input), mutation).toThrow("Public type");
  }
});

test("captured family callbacks require their exact slot and strategy identities", () => {
  {
    const input = fixture(trgm);
    const declaration = candidate(input);
    const family = trgm.contract.members.find(
      (member) => member.kind === "opfamily" && member.accessMethod === "gist",
    )!;
    if (family.kind !== "opfamily") throw new Error("Captured family missing");
    const row = family.procedures.find((row) =>
      row.procedure.startsWith("$extension:pg_trgm.gtrgm_consistent("),
    )!;
    const childId = `routine:${row.procedure}`;
    const proof = declaration.members.find((member) => member.id === childId)!;
    proof.disposition = "internal";
    proof.cases = [];
    proof.transfers = [
      {
        from: family.id,
        relation: { kind: "family-procedure", family: family.id, ...row },
        caseId: "pg_trgm.database",
        scenario: "roundtrip",
        basis: "Exact captured support row",
      },
    ];
    expect(validateExtensionSemanticProof(input).counts.accepted).toBe(1);
    const relation = proof.transfers[0]!.relation;
    if (relation.kind === "family-procedure") relation.number = 99;
    expect(() => validateExtensionSemanticProof(input)).toThrow("captured transfer");
  }
});

test("duplicate or conflicting witness/case/member/manifest identities fail instead of being counted", () => {
  const duplicateMember = fixture();
  candidate(duplicateMember).members.push(candidate(duplicateMember).members[0]!);
  expect(() => validateExtensionSemanticProof(duplicateMember)).toThrow("Duplicate member");
  const missingMember = fixture();
  candidate(missingMember).members.pop();
  missingMember.cases.find((entry) => entry.gate === "database")!.claims.pop();
  missingMember.receipts = missingMember.receipts.filter((entry) => entry.gate !== "database");
  expect(() => validateExtensionSemanticProof(missingMember)).toThrow("Missing member");
  const duplicateCase = fixture();
  duplicateCase.cases.push(duplicateCase.cases[0]!);
  expect(() => validateExtensionSemanticProof(duplicateCase)).toThrow("Duplicate case");
  const inconsistent = fixture();
  inconsistent.receipts[0]!.totals.passed = 100;
  expect(() => validateExtensionSemanticProof(inconsistent)).toThrow("totals");
  const duplicateWitness = fixture();
  const receipt = duplicateWitness.receipts.find((entry) => entry.gate === "database")!;
  receipt.cases[0]!.witnesses.push(receipt.cases[0]!.witnesses[0]!);
  expect(() => validateExtensionSemanticProof(duplicateWitness)).toThrow(
    "Duplicate receipt witness",
  );
  const duplicateManifest = fixture();
  duplicateManifest.manifests.push(
    createExtensionManifest(
      { ...uuid.contract, installation: { relocatable: false, fixedSchema: null } },
      uuid.provenance,
    ),
  );
  expect(() => validateExtensionSemanticProof(duplicateManifest)).toThrow("Duplicate manifest");
});

test("ordinary Citext routines/operators cannot be relabeled internal to borrow index or type proof", () => {
  for (const id of [
    "routine:$extension:citext.citext_cmp($extension:citext.citext,$extension:citext.citext)",
    "routine:$extension:citext.citext_hash($extension:citext.citext)",
    "operator:$extension:citext.=($extension:citext.citext,$extension:citext.citext)",
    "routine:$extension:citext.citextsend($extension:citext.citext)",
  ]) {
    const input = fixture(citext);
    const proof = candidate(input).members.find((member) => member.id === id)!;
    proof.disposition = "internal";
    proof.cases = [];
    const family = citext.contract.members.find(
      (member) =>
        member.kind === "opfamily" &&
        (member.procedures.some((row) => `routine:${row.procedure}` === id) ||
          member.operators.some((row) => `operator:${row.operator}` === id)),
    );
    if (id.includes("citextsend")) {
      proof.transfers = [
        {
          from: "type:$extension:citext.citext",
          relation: { kind: "type-routine", slot: "send" },
          caseId: "citext.database",
          scenario: "roundtrip",
          basis: "Attempt to hide a portable bytea function behind SEND role",
        },
      ];
    } else {
      if (!family || family.kind !== "opfamily")
        throw new Error("Actual Citext support row missing");
      const procedure = family.procedures.find((row) => `routine:${row.procedure}` === id);
      const operator = family.operators.find((row) => `operator:${row.operator}` === id);
      if (!procedure && !operator) throw new Error("Actual Citext callback missing");
      const relation = procedure
        ? { kind: "family-procedure" as const, family: family.id, ...procedure }
        : { kind: "family-operator" as const, family: family.id, ...operator! };
      proof.transfers = [
        {
          from: family.id,
          relation,
          caseId: "citext.database",
          scenario: "roundtrip",
          basis: "Attempt to hide SQL-callable member behind index role",
        },
      ];
    }
    const receipt = input.receipts.find((entry) => entry.gate === "database")!;
    receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
      (witness) => witness.member !== id,
    );
    updateReceipt(input, receipt);
    expect(() => validateExtensionSemanticProof(input)).toThrow("SQL-callable");
  }
});

test("genuine captured cstring/internal callbacks retain parent transfer despite PUBLIC execute", () => {
  const input = fixture(citext);
  for (const [id, slot] of [
    ["routine:$extension:citext.citextin(pg_catalog.cstring)", "input"],
    ["routine:$extension:citext.citextout($extension:citext.citext)", "output"],
    ["routine:$extension:citext.citextrecv(pg_catalog.internal)", "receive"],
  ] as const) {
    const captured = citext.contract.members.find((member) => member.id === id)!;
    if (captured.kind !== "routine") throw new Error("Missing native callback");
    expect(captured.publicExecute).toBe(true);
    const proof = candidate(input).members.find((member) => member.id === id)!;
    proof.disposition = "internal";
    proof.cases = [];
    proof.transfers = [
      {
        from: "type:$extension:citext.citext",
        relation: { kind: "type-routine", slot },
        caseId: "citext.database",
        scenario: "roundtrip",
        basis: "Exact native nonportable I/O callback",
      },
    ];
    const receipt = input.receipts.find((entry) => entry.gate === "database")!;
    receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
      (witness) => witness.member !== id,
    );
    updateReceipt(input, receipt);
  }
  expect(validateExtensionSemanticProof(input).counts.accepted).toBe(1);
});

test("record/void results or a private PUBLIC ACL do not establish an internal callback role", () => {
  const original = citext.contract.members.find(
    (member) =>
      member.id ===
      "routine:$extension:citext.citext_cmp($extension:citext.citext,$extension:citext.citext)",
  )!;
  if (original.kind !== "routine") throw new Error("Missing captured callable routine");
  for (const returns of ["record", "void", "int4"]) {
    const routine = {
      ...original,
      returns: { namespace: "pg_catalog", name: returns },
      publicExecute: false,
    };
    const manifest = createExtensionManifest(
      {
        ...citext.contract,
        members: citext.contract.members.map((member) =>
          member.id === routine.id ? routine : member,
        ),
      },
      citext.provenance,
    );
    const input = fixture(manifest);
    const proof = candidate(input).members.find((member) => member.id === routine.id)!;
    proof.disposition = "internal";
    expect(() => validateExtensionSemanticProof(input)).toThrow("SQL-callable");
  }
});

const unaccent = v.parse(extensionManifestValidator, unaccentEvidence);
const textSearchFile = "docs/architecture/evidence/fixture-text-search.json";
const dictionaryId = 'text search dictionary:"$extension:unaccent".unaccent';
const templateId = 'text search template:"$extension:unaccent".unaccent';
const initId = "routine:$extension:unaccent.unaccent_init(pg_catalog.internal)";
const lexizeId =
  "routine:$extension:unaccent.unaccent_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)";

// Fabricated structural fixture only; never retained as an actual native receipt.
function textSearchFixture() {
  const input = fixture(unaccent);
  const entry = candidate(input);
  const capture = createExtensionTextSearchCapture(
    unaccent,
    {
      extension: "unaccent",
      version: "1.1",
      postgresMajor: 18,
      provider: "neon",
      manifestDigest: unaccent.digest,
      dictionaries: [{ id: dictionaryId, template: templateId, options: "rules = 'unaccent'" }],
      templates: [{ id: templateId, init: initId, lexize: lexizeId }],
    },
    {
      capturedAt: "fixture-only",
      fixture: "unit-only",
      source: "pg_catalog",
      collector: "loom:text-search-capture:1",
      serverVersion: "18.6",
      installationSchema: entry.schema,
      dictionaryOwners: [{ id: dictionaryId, owner: "fixture-only" }],
    },
  );
  Object.assign(entry, { textSearch: { file: textSearchFile, capture } });
  input.currentSources.push({ file: textSearchFile, sha256: sha });
  for (const gate of gates) entry.gates[gate].sources.push(textSearchFile);
  const callbackIds = new Set([initId, lexizeId]);
  const databaseCase = input.cases.find((value) => value.gate === "database")!;
  databaseCase.claims = databaseCase.claims.filter((value) => !callbackIds.has(value.member));
  entry.members = entry.members.map((member) =>
    callbackIds.has(member.id)
      ? {
          ...member,
          disposition: "internal",
          cases: [],
          transfers: [
            {
              from: templateId,
              relation: {
                kind: "text-search-callback",
                slot: member.id === initId ? "init" : "lexize",
              },
              caseId: databaseCase.id,
              scenario: "roundtrip",
              basis: "Exact captured template slot exercised through native dictionary",
            },
          ],
        }
      : member,
  );
  for (const receipt of input.receipts) {
    receipt.sourcesBefore.push({ file: textSearchFile, sha256: sha });
    receipt.sourcesAfter.push({ file: textSearchFile, sha256: sha });
    if (receipt.gate === "database") {
      Object.assign(receipt, { format: 2 });
      receipt.database.observed = receipt.database.observed.map((value) => ({
        ...value,
        textSearchDigest: capture.digest,
      }));
      receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
        (value) => !callbackIds.has(value.member),
      );
      receipt.definitionsDigest = extensionProofCasesDigest([databaseCase]);
    }
    updateReceipt(input, receipt);
  }
  return input;
}

test("exact observed Unaccent template slots permit only registered pointer callback transfers", () => {
  const input = textSearchFixture();
  expect(validateExtensionSemanticProof(input).counts.accepted).toBe(1);
  expect(validateExtensionSemanticProof(fixture()).counts.accepted).toBe(1);
});

test("missing graph, wrong callback slot and public helper relabel cannot transfer text-search proof", () => {
  const missing = textSearchFixture();
  delete candidate(missing).textSearch;
  expect(() => validateExtensionSemanticProof(missing)).toThrow("SQL-callable");
  const slot = textSearchFixture();
  candidate(slot).members.find((value) => value.id === initId)!.transfers[0]!.relation = {
    kind: "text-search-callback",
    slot: "lexize",
  };
  expect(() => validateExtensionSemanticProof(slot)).toThrow("transfer relation");
  const publicHelper = textSearchFixture();
  const member = candidate(publicHelper).members.find(
    (value) => value.id === "routine:$extension:unaccent.unaccent(pg_catalog.text)",
  )!;
  member.disposition = "internal";
  expect(() => validateExtensionSemanticProof(publicHelper)).toThrow("SQL-callable");
});

test("text-search graph profile, schema, digest and native callback registration are exact", () => {
  for (const mutation of ["schema", "provider", "digest", "slot", "manifest"] as const) {
    const input = textSearchFixture();
    const graph = candidate(input).textSearch!.capture;
    if (mutation === "schema") graph.provenance.installationSchema = "another_schema";
    else if (mutation === "provider") graph.contract.provider = "local";
    else if (mutation === "digest") graph.digest = "0".repeat(64);
    else if (mutation === "slot") graph.contract.templates[0]!.init = lexizeId;
    else graph.contract.manifestDigest = "0".repeat(64);
    expect(() => validateExtensionSemanticProof(input)).toThrow();
  }
});

test("text-search graph requires observed versioned digest and source freshness in every gate", () => {
  for (const mutation of [
    "observed-missing",
    "observed-wrong",
    "source-stale",
    "source-omitted",
  ] as const) {
    const input = textSearchFixture();
    const receipt = input.receipts.find((value) => value.gate === "database")!;
    if (receipt.gate !== "database") throw new Error("Missing fixture");
    if (mutation === "observed-missing") delete receipt.database.observed[0]!.textSearchDigest;
    else if (mutation === "observed-wrong")
      receipt.database.observed[0]!.textSearchDigest = "0".repeat(64);
    else if (mutation === "source-stale")
      input.currentSources.find((value) => value.file === textSearchFile)!.sha256 = "0".repeat(64);
    else
      candidate(input).gates.types.sources = candidate(input).gates.types.sources.filter(
        (value) => value !== textSearchFile,
      );
    updateReceipt(input, receipt);
    expect(pending(input).blockers.join(" ")).toContain("text-search");
  }
  const input = textSearchFixture();
  const receipt = input.receipts.find((value) => value.gate === "database")!;
  receipt.format = 1;
  updateReceipt(input, receipt);
  expect(() => validateExtensionSemanticProof(input)).toThrow("format 2");
});

const hstore = v.parse(extensionManifestValidator, hstoreEvidence);
const subscriptingFile = "docs/architecture/evidence/fixture-subscripting.json";
const hstoreTypeId = "type:$extension:hstore.hstore";
const subscriptHandlerId =
  "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal)";
const arrayHandlerId = "routine:pg_catalog.array_subscript_handler(pg_catalog.internal)";

// Fabricated structural fixture only; never retained as an actual native receipt.
function subscriptingFixture() {
  const input = fixture(hstore);
  const entry = candidate(input);
  const capture = createExtensionSubscriptCapture(
    hstore,
    {
      extension: "hstore",
      postgresMajor: 18,
      version: "1.8",
      provider: "neon",
      manifestDigest: hstore.digest,
      types: [
        { id: "type:$extension:hstore._ghstore", handler: arrayHandlerId },
        { id: "type:$extension:hstore._hstore", handler: arrayHandlerId },
        { id: "type:$extension:hstore.ghstore", handler: null },
        { id: hstoreTypeId, handler: subscriptHandlerId },
      ],
    },
    {
      capturedAt: "fixture-only",
      fixture: "unit-only",
      source: "pg_catalog",
      collector: "loom:subscript-capture:1",
      serverVersion: "18.6",
      installationSchema: entry.schema,
    },
  );
  entry.subscripting = { file: subscriptingFile, capture };
  input.currentSources.push({ file: subscriptingFile, sha256: sha });
  for (const gate of gates) entry.gates[gate].sources.push(subscriptingFile);
  const databaseCase = input.cases.find((value) => value.gate === "database")!;
  databaseCase.claims = databaseCase.claims.filter((value) => value.member !== subscriptHandlerId);
  entry.members = entry.members.map((member) =>
    member.id === subscriptHandlerId
      ? {
          ...member,
          disposition: "internal",
          cases: [],
          transfers: [
            {
              from: hstoreTypeId,
              relation: { kind: "type-subscript" },
              caseId: databaseCase.id,
              scenario: "roundtrip",
              basis:
                "Exact captured registered subscripting callback exercised through native fetch and assignment",
            },
          ],
        }
      : member,
  );
  for (const receipt of input.receipts) {
    receipt.sourcesBefore.push({ file: subscriptingFile, sha256: sha });
    receipt.sourcesAfter.push({ file: subscriptingFile, sha256: sha });
    if (receipt.gate === "database") {
      receipt.format = 2;
      receipt.database.observed = receipt.database.observed.map((value) => ({
        ...value,
        subscriptingDigest: capture.digest,
      }));
      receipt.cases[0]!.witnesses = receipt.cases[0]!.witnesses.filter(
        (value) => value.member !== subscriptHandlerId,
      );
      receipt.definitionsDigest = extensionProofCasesDigest([databaseCase]);
    }
    updateReceipt(input, receipt);
  }
  return input;
}

test("the exact observed registered hstore callback may transfer from its subscripted type", () => {
  expect(validateExtensionSemanticProof(subscriptingFixture()).counts.accepted).toBe(1);
  expect(validateExtensionSemanticProof(fixture(hstore)).counts.accepted).toBe(1);
});

test("missing supplement, wrong type parent and ordinary public members cannot borrow subscripting proof", () => {
  const missing = subscriptingFixture();
  delete candidate(missing).subscripting;
  expect(() => validateExtensionSemanticProof(missing)).toThrow("SQL-callable");
  for (const parent of ["type:$extension:hstore.ghstore", "type:$extension:hstore._hstore"]) {
    const input = subscriptingFixture();
    candidate(input).members.find((value) => value.id === subscriptHandlerId)!.transfers[0]!.from =
      parent;
    expect(() => validateExtensionSemanticProof(input)).toThrow("transfer relation");
  }
  const publicIds = [
    "routine:$extension:hstore.akeys($extension:hstore.hstore)",
    hstore.contract.members.find((member) => member.kind === "operator")!.id,
  ];
  for (const id of publicIds) {
    for (const transfer of [false, true]) {
      const input = subscriptingFixture();
      const proof = candidate(input).members.find((value) => value.id === id)!;
      proof.disposition = "internal";
      if (transfer)
        proof.transfers = [
          {
            from: hstoreTypeId,
            relation: { kind: "type-subscript" },
            caseId: "hstore.database",
            scenario: "roundtrip",
            basis: "Attempt to hide an ordinary SQL member behind the subscripting relation",
          },
        ];
      expect(() => validateExtensionSemanticProof(input), id).toThrow("SQL-callable");
    }
  }
});

test("subscripting capture profile, schema, digest, source manifest and callback registration are exact", () => {
  for (const mutation of [
    "schema",
    "provider",
    "digest",
    "callback",
    "manifest",
    "types",
  ] as const) {
    const input = subscriptingFixture();
    const capture = candidate(input).subscripting!.capture;
    if (mutation === "schema") capture.provenance.installationSchema = "another_schema";
    else if (mutation === "provider") capture.contract.provider = "local";
    else if (mutation === "digest") capture.digest = "0".repeat(64);
    else if (mutation === "callback")
      capture.contract.types.find((value) => value.id === hstoreTypeId)!.handler = arrayHandlerId;
    else if (mutation === "manifest") capture.contract.manifestDigest = "0".repeat(64);
    else capture.contract.types.pop();
    expect(() => validateExtensionSemanticProof(input), mutation).toThrow();
  }
  const foreign = fixture(citext);
  candidate(foreign).subscripting = candidate(subscriptingFixture()).subscripting!;
  expect(() => validateExtensionSemanticProof(foreign)).toThrow();
});

test("subscripting capture requires its observed digest and fresh source in every gate", () => {
  for (const mutation of ["observed-missing", "observed-wrong"] as const) {
    const input = subscriptingFixture();
    const receipt = input.receipts.find((value) => value.gate === "database")!;
    if (receipt.gate !== "database") throw new Error("Missing fixture");
    if (mutation === "observed-missing") delete receipt.database.observed[0]!.subscriptingDigest;
    else receipt.database.observed[0]!.subscriptingDigest = "0".repeat(64);
    updateReceipt(input, receipt);
    expect(pending(input).blockers.join(" ")).toContain(
      "database: missing exact observed subscripting digest",
    );
  }
  for (const gate of gates) {
    const omitted = subscriptingFixture();
    const requirement = candidate(omitted).gates[gate];
    requirement.sources = requirement.sources.filter((value) => value !== subscriptingFile);
    expect(pending(omitted).blockers.join(" ")).toContain(
      `${gate}: required sources omit subscripting capture`,
    );

    const stale = subscriptingFixture();
    const receipt = stale.receipts.find((value) => value.gate === gate)!;
    for (const list of [receipt.sourcesBefore, receipt.sourcesAfter])
      list.find((value) => value.file === subscriptingFile)!.sha256 = "0".repeat(64);
    updateReceipt(stale, receipt);
    expect(pending(stale).blockers.join(" ")).toContain(
      `${gate}: missing or stale subscripting capture source`,
    );
  }
  const missing = subscriptingFixture();
  missing.currentSources = missing.currentSources.filter(
    (value) => value.file !== subscriptingFile,
  );
  const blockers = pending(missing).blockers.join(" ");
  for (const gate of gates)
    expect(blockers).toContain(`${gate}: missing current subscripting capture source`);
  const input = subscriptingFixture();
  const receipt = input.receipts.find((value) => value.gate === "database")!;
  receipt.format = 1;
  updateReceipt(input, receipt);
  expect(() => validateExtensionSemanticProof(input)).toThrow("format 2");
});

test("historical format 1 and 2 receipts keep their exact serialization and digest without a subscripting digest", () => {
  for (const input of [fixture(hstore), textSearchFixture()]) {
    const receipt = input.receipts.find((value) => value.gate === "database")!;
    const serialized = JSON.stringify(receipt);
    expect(serialized).not.toContain("subscripting");
    // The fabricated receipts are written in schema order, so the digest is exactly that of the raw bytes.
    expect(extensionProofReceiptDigest(receipt)).toBe(
      createHash("sha256").update(serialized).digest("hex"),
    );
    expect(validateExtensionSemanticProof(input).counts.accepted).toBe(1);
  }
  expect(fixture(hstore).receipts.find((value) => value.gate === "database")!.format).toBe(1);
  expect(textSearchFixture().receipts.find((value) => value.gate === "database")!.format).toBe(2);
});

test("independent family consumers require their own retained artifact and build closure", () => {
  const first = fixture(uuid);
  const second = fixture(trgm);
  if (!first.artifact || !second.artifact) throw new Error("Missing fixture artifacts");
  const firstArtifact = first.artifact;
  const additionalSource = {
    file: "apps/loom/dist/second-consumer-closure.js",
    sha256: "c".repeat(64),
  };
  first.currentSources.push(additionalSource);
  // The same archive can be exercised through different independently bound import closures.
  const secondArtifact = {
    ...second.artifact,
    buildSources: [...second.artifact.buildSources, additionalSource],
  };
  for (const receipt of second.receipts) {
    const oldRun = receipt.runId;
    receipt.runId = "second-" + oldRun;
    for (const gate of gates)
      for (const proof of candidate(second).gates[gate].proofs) {
        if (proof.runId === oldRun) {
          proof.runId = receipt.runId;
          proof.receiptDigest = extensionProofReceiptDigest(receipt);
        }
      }
    if (receipt.gate === "consumer") {
      receipt.package.buildSources = secondArtifact.buildSources;
      receipt.sourcesBefore.push(additionalSource);
      receipt.sourcesAfter.push(additionalSource);
      updateReceipt(second, receipt);
    }
  }
  const input = {
    ...first,
    artifact: null,
    artifacts: [firstArtifact, secondArtifact],
    declarations: first.declarations.map((entry) =>
      entry.extension === trgm.contract.extension ? candidate(second) : entry,
    ),
    manifests: [...first.manifests, ...second.manifests],
    cases: [...first.cases, ...second.cases],
    receipts: [...first.receipts, ...second.receipts],
  };
  expect(validateExtensionSemanticProof(input).counts.accepted).toBe(2);
  input.artifacts = [firstArtifact];
  const missing = validateExtensionSemanticProof(input);
  expect(missing.counts.accepted).toBe(1);
  expect(
    missing.families.find((entry) => entry.extension === trgm.contract.extension)?.blockers,
  ).toContain("consumer: missing or stale packed artifact/build sources");
});
