import { createHash } from "node:crypto";
import * as v from "valibot";
import baselineEvidence from "../../../../../docs/architecture/evidence/neon-extension-capability-map-2026-10-02.json";
import {
  extensionManifestValidator,
  type ExtensionMember,
  type ExtensionTypeReference,
} from "../../core/extensions/contracts";
import { validateExtensionManifest } from "../../core/extensions/registry";

const token = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => value.trim() === value, "Expected nonblank normalized token"),
);
const sha256 = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
const count = v.pipe(v.number(), v.integer(), v.minValue(0));
const path = v.pipe(
  token,
  v.check(
    (value) =>
      !value.startsWith("/") &&
      !value.includes("\\") &&
      !value.includes(":") &&
      !value.includes("\0") &&
      value.split("/").every((part) => part !== "" && part !== "." && part !== ".."),
    "Expected normalized repository-relative source path",
  ),
);
const gate = v.picklist(["unit", "types", "database", "generation", "consumer"]);
const family = v.strictObject({
  extension: token,
  version: token,
  postgresMajor: v.literal(18),
  provider: v.literal("neon"),
  manifestDigest: sha256,
});
const source = v.strictObject({ file: path, sha256 });
const claim = v.strictObject({ family, member: token, scenario: token });
const witness = v.strictObject({ family, member: token, scenario: token, schema: token });
const definition = v.strictObject({
  id: token,
  file: path,
  title: token,
  gate,
  families: v.pipe(v.array(family), v.minLength(1)),
  claims: v.array(claim),
});
const reference = v.strictObject({ caseId: token, runId: token, receiptDigest: sha256 });
const requirement = v.strictObject({ sources: v.pipe(v.array(path), v.minLength(1)), proofs: v.array(reference) });
const type = v.strictObject({ namespace: token, name: token });
const procedureRow = { left: type, right: type, number: v.pipe(count, v.minValue(1)), procedure: token };
const operatorRow = {
  left: type,
  right: type,
  strategy: v.pipe(count, v.minValue(1)),
  purpose: token,
  operator: token,
  sortFamily: v.nullable(token),
};
const relation = v.variant("kind", [
  v.strictObject({ kind: v.literal("opclass-family") }),
  v.strictObject({ kind: v.literal("opclass-storage") }),
  v.strictObject({ kind: v.literal("array-element") }),
  v.strictObject({
    kind: v.literal("type-routine"),
    slot: v.picklist(["input", "output", "receive", "send", "typmodInput", "typmodOutput"]),
  }),
  v.strictObject({ kind: v.literal("family-procedure"), family: token, ...procedureRow }),
  v.strictObject({ kind: v.literal("family-operator"), family: token, ...operatorRow }),
  v.strictObject({
    kind: v.literal("attachment"),
    family: token,
    row: v.variant("kind", [
      v.strictObject({ kind: v.literal("procedure"), ...procedureRow }),
      v.strictObject({ kind: v.literal("operator"), ...operatorRow }),
    ]),
  }),
]);
const memberProof = v.strictObject({
  id: token,
  disposition: v.picklist(["query", "schema", "tooling", "internal"]),
  reason: token,
  citations: v.pipe(v.array(token), v.minLength(1)),
  cases: v.array(v.strictObject({ caseId: token, scenario: token })),
  transfers: v.array(v.strictObject({ from: token, relation, caseId: token, scenario: token, basis: token })),
});
const reconciliation = v.nullable(
  v.strictObject({
    capturedVersion: token,
    reason: token,
    citations: v.pipe(v.array(token), v.minLength(1)),
    resolution: v.nullable(v.literal("upstream-release-uses-captured-sql-version")),
  }),
);
const declaration = v.variant("state", [
  v.strictObject({ extension: token, state: v.picklist(["pending", "restricted"]), prerequisite: token }),
  v.strictObject({ extension: token, state: v.literal("excluded"), reason: token }),
  v.strictObject({
    extension: token,
    state: v.literal("candidate"),
    family,
    schema: token,
    members: v.array(memberProof),
    gates: v.strictObject({
      unit: requirement,
      types: requirement,
      database: requirement,
      generation: requirement,
      consumer: requirement,
    }),
    catalogueVersionReconciliation: reconciliation,
  }),
]);
const observed = v.strictObject({
  extension: token,
  version: token,
  postgresMajor: count,
  provider: token,
  manifestDigest: sha256,
  schema: token,
});
const result = v.strictObject({
  id: token,
  file: path,
  title: token,
  status: v.picklist(["passed", "failed", "skipped", "todo", "incomplete"]),
  witnessFailures: count,
  witnesses: v.array(witness),
});
const receiptBase = {
  format: v.literal(1),
  runId: token,
  finalizedBy: v.literal("host"),
  runner: v.strictObject({ name: v.picklist(["bun", "vitest", "tsc"]), version: token }),
  command: v.pipe(v.array(token), v.minLength(1)),
  exitCode: v.pipe(v.number(), v.integer()),
  sourcesBefore: v.array(source),
  sourcesAfter: v.array(source),
  definitionsDigest: sha256,
  cases: v.array(result),
  totals: v.strictObject({ passed: count, failed: count, skipped: count, todo: count, incomplete: count }),
};
const receipt = v.variant("gate", [
  v.strictObject({ ...receiptBase, gate: v.picklist(["unit", "types", "generation"]) }),
  v.strictObject({
    ...receiptBase,
    gate: v.literal("database"),
    database: v.strictObject({
      provider: token,
      postgresMajor: count,
      serverVersion: token,
      targetFingerprint: sha256,
      observed: v.array(observed),
      fixtureCleanupCompleted: v.boolean(),
    }),
  }),
  v.strictObject({
    ...receiptBase,
    gate: v.literal("consumer"),
    package: v.strictObject({
      tarballSha256: sha256,
      buildSources: v.pipe(v.array(source), v.minLength(1)),
      nodeVersion: token,
      installation: v.picklist(["isolated", "workspace"]),
      frozenReinstallPassed: v.boolean(),
      declarationsPassed: v.boolean(),
      runtimePassed: v.boolean(),
      selectedBundleChecksPassed: v.boolean(),
    }),
  }),
]);
const artifact = v.strictObject({ tarballSha256: sha256, buildSources: v.pipe(v.array(source), v.minLength(1)) });
const inputValidator = v.strictObject({
  baseline: v.array(
    v.strictObject({
      name: token,
      version: v.nullable(token),
      disposition: v.picklist([
        "eligible",
        "unavailable-pg18",
        "existing-only",
        "deprecated",
        "builtin",
        "decoder-plugin",
      ]),
    }),
  ),
  declarations: v.array(declaration),
  manifests: v.array(extensionManifestValidator),
  cases: v.array(definition),
  receipts: v.array(receipt),
  currentSources: v.array(source),
  artifact: v.nullable(artifact),
});

const catalogueDisposition = v.picklist([
  "eligible",
  "unavailable-pg18",
  "existing-only",
  "deprecated",
  "builtin",
  "decoder-plugin",
]);
const datedBaseline = baselineEvidence.entries.map((entry) => ({
  name: entry.name,
  version: entry.postgres18ListedVersion,
  disposition: v.parse(
    catalogueDisposition,
    entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
  ),
}));

export type ExtensionProofGate = v.InferOutput<typeof gate>;
export type ExtensionProofFamily = v.InferOutput<typeof family>;
export type ExtensionProofSource = v.InferOutput<typeof source>;
export type ExtensionProofClaim = v.InferOutput<typeof claim>;
export type ExtensionProofWitness = v.InferOutput<typeof witness>;
export type ExtensionProofCase = v.InferOutput<typeof definition>;
export type ExtensionProofReference = v.InferOutput<typeof reference>;
export type ExtensionProofRequirement = v.InferOutput<typeof requirement>;
export type ExtensionProofRelation = v.InferOutput<typeof relation>;
export type ExtensionMemberProof = v.InferOutput<typeof memberProof>;
export type ExtensionProofDeclaration = v.InferOutput<typeof declaration>;
export type ExtensionProofReceipt = v.InferOutput<typeof receipt>;
export type ExtensionProofArtifact = v.InferOutput<typeof artifact>;
export type ExtensionSemanticProofInput = v.InferOutput<typeof inputValidator>;

/** Digests identify validated artifacts; they do not attest that a process executed. */
export function extensionProofSourcesDigest(sources: readonly ExtensionProofSource[]): string {
  const parsed = v.parse(v.array(source), sources);
  unique(
    parsed.map((entry) => entry.file),
    "source",
  );
  return createHash("sha256")
    .update(JSON.stringify(parsed.sort((left, right) => left.file.localeCompare(right.file))))
    .digest("hex");
}
export function extensionProofCasesDigest(cases: readonly ExtensionProofCase[]): string {
  const parsed = v.parse(v.array(definition), cases);
  unique(
    parsed.map((entry) => entry.id),
    "case",
  );
  return createHash("sha256")
    .update(JSON.stringify(parsed.sort((left, right) => left.id.localeCompare(right.id))))
    .digest("hex");
}
export function extensionProofReceiptDigest(input: ExtensionProofReceipt): string {
  return createHash("sha256")
    .update(JSON.stringify(v.parse(receipt, input)))
    .digest("hex");
}
function unique(values: readonly string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}

function familyIdentity(value: ExtensionProofFamily): string {
  return JSON.stringify([value.extension, value.version, value.postgresMajor, value.provider, value.manifestDigest]);
}
function claimIdentity(value: ExtensionProofClaim): string {
  return JSON.stringify([familyIdentity(value.family), value.member, value.scenario]);
}
function sourcesMap(sources: readonly ExtensionProofSource[]) {
  unique(
    sources.map((entry) => entry.file),
    "source",
  );
  return new Map(sources.map((entry) => [entry.file, entry.sha256]));
}
function sameType(left: ExtensionTypeReference | null, right: ExtensionTypeReference): boolean {
  return left?.namespace === right.namespace && left.name === right.name;
}
function memberType(member: ExtensionMember, value: ExtensionTypeReference | null): boolean {
  return member.kind === "type" && value !== null && member.namespace === value.namespace && member.name === value.name;
}
function sameFamily(member: ExtensionMember, parent: ExtensionMember): boolean {
  return (
    member.kind === "opfamily" &&
    parent.kind === "opclass" &&
    member.id === `opfamily:${parent.family}` &&
    member.accessMethod === parent.accessMethod
  );
}
/** PostgreSQL identify-object spelling, then capture.ts's symbolic namespace replacement.
 * Exact equality below deliberately refuses unsupported spellings rather than guessing a relation. */
function capturedIdentifier(value: string): string {
  return /^[a-z_][a-z_0-9$]*$/.test(value) ? value : `"${value.replaceAll('"', '""')}"`;
}
function capturedType(value: ExtensionTypeReference): string {
  return `${capturedIdentifier(value.namespace)}.${capturedIdentifier(value.name)}`;
}
function relationMatches(
  child: ExtensionMember,
  parent: ExtensionMember,
  edge: ExtensionProofRelation,
  members: ReadonlyMap<string, ExtensionMember>,
): boolean {
  if (edge.kind === "opclass-family") return sameFamily(child, parent) || sameFamily(parent, child);
  if (edge.kind === "opclass-storage")
    return (
      parent.kind === "opclass" &&
      parent.storage !== null &&
      !sameType(parent.storage, parent.input) &&
      memberType(child, parent.storage)
    );
  if (edge.kind === "array-element") return child.kind === "type" && memberType(parent, child.element);
  if (edge.kind === "type-routine")
    return parent.kind === "type" && child.kind === "routine" && child.id === `routine:${parent[edge.slot]}`;
  const owner = members.get(edge.family);
  if (!owner || owner.kind !== "opfamily" || !(parent.id === owner.id || sameFamily(owner, parent))) return false;
  if (edge.kind === "family-procedure")
    return (
      child.kind === "routine" &&
      child.id === `routine:${edge.procedure}` &&
      owner.procedures.some(
        (row) =>
          sameType(row.left, edge.left) &&
          sameType(row.right, edge.right) &&
          row.number === edge.number &&
          row.procedure === edge.procedure,
      )
    );
  if (edge.kind === "family-operator")
    return (
      child.kind === "operator" &&
      child.id === `operator:${edge.operator}` &&
      owner.operators.some(
        (row) =>
          sameType(row.left, edge.left) &&
          sameType(row.right, edge.right) &&
          row.strategy === edge.strategy &&
          row.purpose === edge.purpose &&
          row.operator === edge.operator &&
          row.sortFamily === edge.sortFamily,
      )
    );
  if (child.kind !== "other" || child.ownership !== "subordinate" || owner.namespace === null) return false;
  const row = edge.row;
  const matches =
    row.kind === "procedure"
      ? owner.procedures.some(
          (value) =>
            sameType(value.left, row.left) &&
            sameType(value.right, row.right) &&
            value.number === row.number &&
            value.procedure === row.procedure,
        )
      : owner.operators.some(
          (value) =>
            sameType(value.left, row.left) &&
            sameType(value.right, row.right) &&
            value.strategy === row.strategy &&
            value.purpose === row.purpose &&
            value.operator === row.operator &&
            value.sortFamily === row.sortFamily,
        );
  const label = row.kind === "procedure" ? "function" : "operator";
  const number = row.kind === "procedure" ? row.number : row.strategy;
  const identity = `${label} ${number} (${capturedType(row.left)}, ${capturedType(row.right)}) of ${capturedIdentifier(owner.namespace)}.${capturedIdentifier(owner.name)} USING ${capturedIdentifier(owner.accessMethod)}`;
  return (
    matches &&
    child.objectType === `${label} of access method` &&
    child.identity === identity &&
    child.id === `${child.objectType}:${identity}`
  );
}

type Candidate = Extract<ExtensionProofDeclaration, { state: "candidate" }>;
const gates: ExtensionProofGate[] = ["unit", "types", "database", "generation", "consumer"];
function nativeCallback(member: ExtensionMember, members: ReadonlyMap<string, ExtensionMember>): boolean {
  if (member.kind !== "routine" || member.routineKind !== "function") return false;
  const nativeOnly = (value: ExtensionTypeReference) =>
    value.namespace === "pg_catalog" && (value.name === "cstring" || value.name === "internal");
  if (!nativeOnly(member.returns) && !member.arguments.some((argument) => nativeOnly(argument.type))) return false;
  for (const parent of members.values()) {
    if (
      parent.kind === "type" &&
      [parent.input, parent.output, parent.receive, parent.send, parent.typmodInput, parent.typmodOutput].some(
        (routine) => member.id === `routine:${routine}`,
      )
    )
      return true;
    if (parent.kind === "opfamily" && parent.procedures.some((row) => member.id === `routine:${row.procedure}`))
      return true;
  }
  return false;
}
function publicTypeRole(type: ExtensionMember, members: ReadonlyMap<string, ExtensionMember>): boolean {
  for (const member of members.values()) {
    if (
      member.kind === "routine" &&
      !nativeCallback(member, members) &&
      (memberType(type, member.returns) || member.arguments.some((argument) => memberType(type, argument.type)))
    )
      return true;
    if (
      member.kind === "operator" &&
      [member.left, member.right, member.returns].some((value) => memberType(type, value))
    )
      return true;
    if (member.kind === "cast" && [member.source, member.target].some((value) => memberType(type, value))) return true;
    if (member.kind === "opclass" && memberType(type, member.input)) return true;
    if (member.kind === "relation" && member.columns.some((column) => memberType(type, column.type))) return true;
  }
  return false;
}
function internalStorageType(type: ExtensionMember, members: ReadonlyMap<string, ExtensionMember>): boolean {
  if (type.kind !== "type" || type.element !== null || publicTypeRole(type, members)) return false;
  return [...members.values()].some(
    (member) =>
      member.kind === "opclass" &&
      member.storage !== null &&
      !sameType(member.storage, member.input) &&
      memberType(type, member.storage),
  );
}
function internalType(type: ExtensionMember, members: ReadonlyMap<string, ExtensionMember>): boolean {
  if (type.kind !== "type" || publicTypeRole(type, members)) return false;
  if (type.element === null) return internalStorageType(type, members);
  // An array inherits only a proven private storage role, never a public field's proof.
  if (type.category !== "A") return false;
  const element = [...members.values()].find((member) => memberType(member, type.element));
  return element?.kind === "type" && memberType(type, element.array) && internalStorageType(element, members);
}
function validateTransfers(
  candidate: Candidate,
  members: ReadonlyMap<string, ExtensionMember>,
  definitions: ReadonlyMap<string, ExtensionProofCase>,
) {
  const annotations = new Map(candidate.members.map((entry) => [entry.id, entry]));
  for (const annotation of candidate.members) {
    const captured = members.get(annotation.id)!;
    if (annotation.disposition === "internal" && captured.kind === "type" && !internalType(captured, members))
      throw new Error(`Public type cannot be reclassified internal: ${annotation.id}`);
    // Callback registration and PUBLIC ACL alone do not erase an ordinary SQL API.
    // Only captured cstring/internal callbacks lack a portable application contract.
    if (
      annotation.disposition === "internal" &&
      (captured.kind === "operator" || (captured.kind === "routine" && !nativeCallback(captured, members)))
    )
      throw new Error(`SQL-callable member cannot be reclassified internal: ${annotation.id}`);
    if (annotation.disposition !== "internal" && annotation.transfers.length)
      throw new Error(`Public member cannot transfer proof: ${annotation.id}`);
    unique(
      annotation.cases.map((entry) => JSON.stringify([entry.caseId, entry.scenario])),
      "member case",
    );
    unique(
      annotation.transfers.map((entry) => JSON.stringify([entry.from, entry.relation, entry.caseId, entry.scenario])),
      "member transfer",
    );
    for (const proof of annotation.cases) {
      const definition = definitions.get(proof.caseId);
      if (!definition || definition.gate !== "database")
        throw new Error(`Invalid member database case: ${proof.caseId}`);
      if (
        !definition.claims.some(
          (claim) =>
            familyIdentity(claim.family) === familyIdentity(candidate.family) &&
            claim.member === annotation.id &&
            claim.scenario === proof.scenario,
        )
      )
        throw new Error(`Undeclared member case claim: ${annotation.id}`);
    }
    for (const transfer of annotation.transfers) {
      const child = members.get(annotation.id);
      const parent = members.get(transfer.from);
      if (!child || !parent || annotation.id === transfer.from || !annotations.has(transfer.from))
        throw new Error(`Invalid transfer parent: ${annotation.id}`);
      if (!relationMatches(child, parent, transfer.relation, members))
        throw new Error(`Invalid captured transfer relation: ${annotation.id}`);
      const definition = definitions.get(transfer.caseId);
      if (
        !definition ||
        definition.gate !== "database" ||
        !definition.families.some((value) => familyIdentity(value) === familyIdentity(candidate.family))
      )
        throw new Error(`Invalid transfer database case: ${transfer.caseId}`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) throw new Error(`Cyclic member transfer: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const transfer of annotations.get(id)?.transfers ?? []) visit(transfer.from);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of annotations.keys()) visit(id);
}

function receiptBlockers(value: ExtensionProofReceipt, definitions: ReadonlyMap<string, ExtensionProofCase>): string[] {
  sourcesMap(value.sourcesBefore);
  sourcesMap(value.sourcesAfter);
  unique(
    value.cases.map((entry) => entry.id),
    "receipt case",
  );
  const totals = { passed: 0, failed: 0, skipped: 0, todo: 0, incomplete: 0 };
  const cases: ExtensionProofCase[] = [];
  const blockers: string[] = [];
  for (const observed of value.cases) {
    const definition = definitions.get(observed.id);
    if (!definition || definition.gate !== value.gate)
      throw new Error(`Unknown or wrong gate receipt case: ${observed.id}`);
    unique(observed.witnesses.map(claimIdentity), "receipt witness");
    const allowed = new Set(definition.claims.map(claimIdentity));
    for (const witness of observed.witnesses)
      if (!allowed.has(claimIdentity(witness))) throw new Error(`Unknown receipt member witness: ${witness.member}`);
    if (value.gate !== "database" && observed.witnesses.length)
      throw new Error(`Member witnesses require database receipt: ${observed.id}`);
    if (
      value.gate === "database" &&
      observed.witnesses.some(
        (witness) =>
          !value.database.observed.some(
            (contract) =>
              contract.extension === witness.family.extension &&
              contract.version === witness.family.version &&
              contract.postgresMajor === witness.family.postgresMajor &&
              contract.provider === witness.family.provider &&
              contract.manifestDigest === witness.family.manifestDigest &&
              contract.schema === witness.schema,
          ),
      )
    )
      blockers.push(`witness lacks observed schema environment: ${observed.id}`);
    totals[observed.status]++;
    cases.push(definition);
    if (observed.file !== definition.file || observed.title !== definition.title)
      blockers.push(`stale case identity: ${observed.id}`);
    if (observed.status !== "passed" || observed.witnessFailures !== 0)
      blockers.push(`case or witness failed: ${observed.id}`);
  }
  for (const status of ["passed", "failed", "skipped", "todo", "incomplete"] as const)
    if (totals[status] !== value.totals[status]) throw new Error(`Inconsistent receipt totals: ${value.runId}`);
  if (value.exitCode !== 0) blockers.push("child exit was not successful");
  if (extensionProofCasesDigest(cases) !== value.definitionsDigest) blockers.push("stale case definitions digest");
  if (extensionProofSourcesDigest(value.sourcesBefore) !== extensionProofSourcesDigest(value.sourcesAfter))
    blockers.push("source changed during execution");
  if (value.gate === "types" && value.runner.name !== "tsc")
    blockers.push("types gate requires a recorded compiler run");
  if (value.gate === "database") {
    unique(
      value.database.observed.map((entry) =>
        JSON.stringify([entry.extension, entry.version, entry.postgresMajor, entry.provider, entry.schema]),
      ),
      "observed database family",
    );
    if (
      value.database.provider !== "neon" ||
      value.database.postgresMajor !== 18 ||
      !/^18\d{4}$/.test(value.database.serverVersion)
    )
      blockers.push("database profile is not Neon PostgreSQL 18");
    if (!value.database.fixtureCleanupCompleted) blockers.push("database fixture cleanup incomplete");
  }
  if (value.gate === "consumer") {
    sourcesMap(value.package.buildSources);
    if (
      value.package.installation !== "isolated" ||
      !value.package.frozenReinstallPassed ||
      !value.package.declarationsPassed ||
      !value.package.runtimePassed ||
      !value.package.selectedBundleChecksPassed
    )
      blockers.push("isolated consumer gates incomplete");
    const before = sourcesMap(value.sourcesBefore);
    if (value.package.buildSources.some((entry) => before.get(entry.file) !== entry.sha256))
      blockers.push("package build source is not bound to run sources");
  }
  return blockers;
}

/** Reconciles submitted, trusted host artifacts. This validates data, never execution authority.
 * Historical summary receipts and unit fixture receipts are not provider attestations. */
export function validateExtensionSemanticProof(input: ExtensionSemanticProofInput) {
  const parsed = v.parse(inputValidator, input);
  unique(
    parsed.baseline.map((entry) => entry.name),
    "catalogue extension",
  );
  const baselineIdentity = (entries: ExtensionSemanticProofInput["baseline"]) =>
    JSON.stringify([...entries].sort((left, right) => left.name.localeCompare(right.name)));
  if (
    datedBaseline.length !== 85 ||
    datedBaseline.filter((entry) => entry.disposition === "eligible").length !== 73 ||
    baselineIdentity(parsed.baseline) !== baselineIdentity(datedBaseline)
  )
    throw new Error("Baseline does not match immutable dated 85/73 catalogue");
  unique(
    parsed.declarations.map((entry) => entry.extension),
    "extension disposition",
  );
  unique(
    parsed.cases.map((entry) => entry.id),
    "case definition",
  );
  unique(
    parsed.receipts.map((entry) => entry.runId),
    "receipt run",
  );
  const current = sourcesMap(parsed.currentSources);
  if (parsed.artifact) sourcesMap(parsed.artifact.buildSources);
  const baseline = new Map(parsed.baseline.map((entry) => [entry.name, entry]));
  const declarations = new Map(parsed.declarations.map((entry) => [entry.extension, entry]));
  for (const name of baseline.keys())
    if (!declarations.has(name)) throw new Error(`Missing extension disposition: ${name}`);
  for (const name of declarations.keys())
    if (!baseline.has(name)) throw new Error(`Unknown extension disposition: ${name}`);
  const manifests = parsed.manifests.map(validateExtensionManifest);
  const manifestKeys = manifests.map((entry) =>
    JSON.stringify([
      entry.contract.extension,
      entry.contract.version,
      entry.contract.postgresMajor,
      entry.contract.provider,
    ]),
  );
  unique(manifestKeys, "manifest");
  const candidates = new Map<string, Candidate>();
  for (const entry of parsed.declarations)
    if (entry.state === "candidate") candidates.set(familyIdentity(entry.family), entry);
  const definitions = new Map(parsed.cases.map((entry) => [entry.id, entry]));
  for (const definition of parsed.cases) {
    unique(definition.families.map(familyIdentity), "case family");
    unique(definition.claims.map(claimIdentity), "case claim");
    const families = new Set(definition.families.map(familyIdentity));
    for (const key of families) if (!candidates.has(key)) throw new Error(`Unknown case family: ${definition.id}`);
    for (const claim of definition.claims) {
      const candidate = candidates.get(familyIdentity(claim.family));
      if (
        !candidate ||
        !families.has(familyIdentity(claim.family)) ||
        !candidate.members.some((member) => member.id === claim.member)
      )
        throw new Error(`Unknown case member claim: ${claim.member}`);
      if (definition.gate !== "database")
        throw new Error(`Direct member witness requires database case: ${definition.id}`);
    }
  }
  const runs = new Map(parsed.receipts.map((entry) => [entry.runId, entry]));
  const runBlockers = new Map(parsed.receipts.map((entry) => [entry.runId, receiptBlockers(entry, definitions)]));
  const families: {
    extension: string;
    state: "accepted" | "pending" | "restricted" | "excluded";
    blockers: string[];
  }[] = [];
  for (const entry of parsed.declarations) {
    const catalogue = baseline.get(entry.extension)!;
    if (catalogue.disposition !== "eligible") {
      if (entry.state !== "excluded")
        throw new Error(`Noneligible extension requires excluded disposition: ${entry.extension}`);
      families.push({ extension: entry.extension, state: "excluded", blockers: [] });
      continue;
    }
    if (entry.state === "excluded") throw new Error(`Eligible extension cannot be excluded: ${entry.extension}`);
    if (entry.state !== "candidate") {
      families.push({ extension: entry.extension, state: entry.state, blockers: [entry.prerequisite] });
      continue;
    }
    if (entry.extension !== entry.family.extension)
      throw new Error(`Candidate family name mismatch: ${entry.extension}`);
    const manifest = manifests.find(
      (value) =>
        value.digest === entry.family.manifestDigest &&
        value.contract.extension === entry.extension &&
        value.contract.version === entry.family.version &&
        value.contract.postgresMajor === entry.family.postgresMajor &&
        value.contract.provider === entry.family.provider,
    );
    if (!manifest) throw new Error(`Missing exact candidate manifest: ${entry.extension}`);
    const members = new Map(manifest.contract.members.map((member) => [member.id, member]));
    unique(
      entry.members.map((member) => member.id),
      "member annotation",
    );
    for (const member of entry.members)
      if (!members.has(member.id)) throw new Error(`Unknown member annotation: ${member.id}`);
    for (const id of members.keys())
      if (!entry.members.some((member) => member.id === id)) throw new Error(`Missing member annotation: ${id}`);
    validateTransfers(entry, members, definitions);
    const blockers: string[] = [];
    if (catalogue.version !== entry.family.version) {
      const reconciliation = entry.catalogueVersionReconciliation;
      if (!reconciliation || reconciliation.capturedVersion !== entry.family.version)
        throw new Error(`Missing catalogue version reconciliation: ${entry.extension}`);
      if (reconciliation.resolution === null) blockers.push("catalogue SQL version mismatch remains unresolved");
    } else if (entry.catalogueVersionReconciliation)
      throw new Error(`Unexpected catalogue version reconciliation: ${entry.extension}`);
    if (
      manifest.contract.installation.fixedSchema !== null &&
      manifest.contract.installation.fixedSchema !== entry.schema
    )
      throw new Error(`Captured fixed schema mismatch: ${entry.extension}`);
    const passedCases = new Map<string, ExtensionProofReceipt["cases"][number]>();
    for (const gate of gates) {
      const requirement = entry.gates[gate];
      unique(requirement.sources, "required source");
      unique(
        requirement.proofs.map((proof) => proof.caseId),
        "required proof case",
      );
      if (!requirement.proofs.length) blockers.push(`${gate}: missing required proof`);
      for (const proof of requirement.proofs) {
        const definition = definitions.get(proof.caseId);
        if (
          !definition ||
          definition.gate !== gate ||
          !definition.families.some((value) => familyIdentity(value) === familyIdentity(entry.family))
        )
          throw new Error(`Invalid required case: ${proof.caseId}`);
        if (!requirement.sources.includes(definition.file))
          throw new Error(`Required sources omit case file: ${proof.caseId}`);
        const run = runs.get(proof.runId);
        if (!run) {
          blockers.push(`${gate}: missing run ${proof.runId}`);
          continue;
        }
        if (run.gate !== gate) throw new Error(`Required case has wrong run gate: ${proof.caseId}`);
        const before = sourcesMap(run.sourcesBefore);
        const problems = [...runBlockers.get(run.runId)!];
        if (extensionProofReceiptDigest(run) !== proof.receiptDigest) problems.push("stale receipt identity");
        if (
          requirement.sources.some((file) => current.get(file) === undefined || current.get(file) !== before.get(file))
        )
          problems.push("missing or stale relevant source");
        const observedCase = run.cases.find((value) => value.id === proof.caseId);
        if (!observedCase) problems.push(`missing case ${proof.caseId}`);
        if (
          run.gate === "database" &&
          !run.database.observed.some(
            (value) =>
              value.extension === entry.extension &&
              value.version === entry.family.version &&
              value.postgresMajor === entry.family.postgresMajor &&
              value.provider === entry.family.provider &&
              value.manifestDigest === entry.family.manifestDigest &&
              value.schema === entry.schema,
          )
        )
          problems.push("missing exact observed database contract/schema");
        if (run.gate === "consumer") {
          const packed = parsed.artifact;
          if (
            !packed ||
            packed.tarballSha256 !== run.package.tarballSha256 ||
            extensionProofSourcesDigest(packed.buildSources) !==
              extensionProofSourcesDigest(run.package.buildSources) ||
            packed.buildSources.some((source) => current.get(source.file) !== source.sha256)
          )
            problems.push("missing or stale packed artifact/build sources");
        }
        for (const problem of problems) blockers.push(`${gate}: ${problem}`);
        if (!problems.length && observedCase) passedCases.set(proof.caseId, observedCase);
      }
    }
    const annotations = new Map(entry.members.map((member) => [member.id, member]));
    const selectedFamily = familyIdentity(entry.family);
    const selectedSchema = entry.schema;
    function witnessed(id: string, caseId: string, scenario: string): boolean {
      return (
        passedCases
          .get(caseId)
          ?.witnesses.some(
            (claim) =>
              familyIdentity(claim.family) === selectedFamily &&
              claim.schema === selectedSchema &&
              claim.member === id &&
              claim.scenario === scenario,
          ) ?? false
      );
    }
    function provenRoot(id: string, caseId: string, scenario: string): boolean {
      const annotation = annotations.get(id)!;
      if (
        annotation.cases.some(
          (proof) => proof.caseId === caseId && proof.scenario === scenario && witnessed(id, caseId, scenario),
        )
      )
        return true;
      return annotation.transfers.some(
        (transfer) =>
          transfer.caseId === caseId && transfer.scenario === scenario && provenRoot(transfer.from, caseId, scenario),
      );
    }
    for (const member of entry.members) {
      if (!member.cases.length && !member.transfers.length)
        blockers.push(`member missing executable proof: ${member.id}`);
      for (const proof of member.cases)
        if (!witnessed(member.id, proof.caseId, proof.scenario))
          blockers.push(`member missing direct witness: ${member.id}`);
      for (const transfer of member.transfers)
        if (!provenRoot(transfer.from, transfer.caseId, transfer.scenario))
          blockers.push(`member transfer missing executed root: ${member.id}`);
    }
    families.push({
      extension: entry.extension,
      state: blockers.length ? "pending" : "accepted",
      blockers: [...new Set(blockers)].sort(),
    });
  }
  families.sort((left, right) => left.extension.localeCompare(right.extension));
  const counts = { accepted: 0, pending: 0, restricted: 0, excluded: 0 };
  for (const family of families) counts[family.state]++;
  return {
    complete: counts.pending === 0 && counts.restricted === 0,
    counts,
    families,
    blockers: families.flatMap((family) => family.blockers.map((blocker) => `${family.extension}: ${blocker}`)),
  };
}
