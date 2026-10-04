import capture from "../../../apps/loom/src/tooling/extensions/manifests/hstore.json";
import { hstoreAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/hstore";
import type {
  ExtensionProofCase,
  ExtensionProofFamily,
  ExtensionMemberProof,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const hstoreProofFamily = {
  extension: "hstore",
  version: "1.8",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1",
} as const satisfies ExtensionProofFamily;
export const hstoreProofSchema = 'Hstore_"Codec_日本';
export const hstoreMembers: string[] = hstoreAnnotations.map(({ id }) => id);
export const hstoreQueryMembers: string[] = hstoreAnnotations
  .filter(({ disposition }) => disposition === "query")
  .map(({ id }) => id);
export const hstoreRecordMembers = hstoreQueryMembers.filter(
  (id) => id.includes("pg_catalog.record") || id.includes("pg_catalog.anyelement"),
);
export const hstoreGraphMembers = hstoreMembers.filter((id) => !hstoreQueryMembers.includes(id));

export function hstoreScenario(id: string): string {
  if (hstoreRecordMembers.includes(id)) return "qualified-managed-record-native-oracle";
  if (hstoreQueryMembers.includes(id)) return "independent-native-query-oracle";
  const member = capture.contract.members.find((entry) => entry.id === id);
  if (!member) throw new Error(`Unknown captured Hstore member: ${id}`);
  if (member.kind === "opclass" || member.kind === "opfamily" || member.kind === "other")
    return "exact-index-slot-live-graph-and-strategy-scan";
  if (id.includes("hstore_subscript_handler")) return "native-single-key-fetch-assignment-and-handler-linkage";

  if (member.kind === "type" || id.includes("hstore_in(") || id.includes("hstore_out(") || id.includes("hstore_recv("))
    return "native-text-binary-type-io-and-array-linkage";
  const methods = capture.contract.members.flatMap((entry) =>
    entry.kind === "opfamily" &&
    entry.accessMethod &&
    entry.procedures?.some((slot) => `routine:${slot.procedure}` === id)
      ? [entry.accessMethod]
      : [],
  );
  if (id.includes("ghstore") && !methods.length) return "gist-storage-callback-linkage-and-unpublished-boundary";
  if (!methods.length) throw new Error(`Hstore internal member has no exact native scenario: ${id}`);
  return `${methods.toSorted((left, right) => left.localeCompare(right)).join("-")}-callback-slot-and-native-index-scan`;
}
function proof(
  id: string,
  file: string,
  title: string,
  gate: ExtensionProofCase["gate"],
  members: readonly string[] = [],
): ExtensionProofCase {
  return {
    id,
    file,
    title,
    gate,
    families: [hstoreProofFamily],
    claims: members.map((member) => ({ family: hstoreProofFamily, member, scenario: hstoreScenario(member) })),
  };
}
export const hstoreUnitProofCases = [
  proof(
    "hstore.unit-indexes",
    "packages/tests/unit/extensions-hstore-members.test.ts",
    "hstore.exactFourIndexClassesAndSignatureOptions",
    "unit",
  ),
  proof(
    "hstore.unit-subscripts",
    "packages/tests/unit/extensions-hstore-members.test.ts",
    "hstore.nativeSubscriptSyntaxBindsAndChecksOperands",
    "unit",
  ),
  proof(
    "hstore.unit-roster",
    "packages/tests/unit/extensions-hstore-members.test.ts",
    "hstore.sourceBound124MemberFiveGateRoster",
    "unit",
  ),
];
export const hstoreTypesProofCase = proof(
  "hstore.types-contracts",
  "packages/tests/types/extensions-hstore.test-d.ts",
  "Hstore exact callable, schema, index, subscript and sealed-record types",
  "types",
);
export const hstorePortableProofCase = proof(
  "hstore.native-portable",
  "packages/e2e/integration/extensions-hstore.test.ts",
  "hstore.portableQueriesAll63NativeIdentities",
  "database",
  hstoreQueryMembers.filter((id) => !hstoreRecordMembers.includes(id)),
);
export const hstoreRecordProofCase = proof(
  "hstore.native-record",
  "packages/e2e/integration/extensions-hstore-record.test.ts",
  "hstore.record.allThreeNamedMembersUseRealComponentScopeAndNativeAttributeNames",
  "database",
  hstoreRecordMembers,
);
export const hstoreGraphProofCase = proof(
  "hstore.native-graph",
  "packages/e2e/integration/extensions-hstore-members.test.ts",
  "Hstore exact 58-member native index, storage, type-I/O and subscript graph",
  "database",
  hstoreGraphMembers,
);
export const hstoreGenerationProofCase = proof(
  "hstore.generation-contracts",
  "packages/e2e/integration/extensions-hstore-generated.test.ts",
  "Hstore genuine first-load, disk, types, idempotence and cold generated RPC/Effect",
  "generation",
);
export const hstoreConsumerProofCase = proof(
  "hstore.consumer-contracts",
  "packages/e2e/integration/packed-hstore.test.ts",
  "Hstore parent-prepared frozen Node24 consumer, native generated RPC/Effect and bundle selection",
  "consumer",
);
export const hstoreProofCases = [
  ...hstoreUnitProofCases,
  hstoreTypesProofCase,
  hstorePortableProofCase,
  hstoreRecordProofCase,
  hstoreGraphProofCase,
  hstoreGenerationProofCase,
  hstoreConsumerProofCase,
];
export const hstoreMemberProofs: ExtensionMemberProof[] = hstoreAnnotations.map((annotation) => ({
  id: annotation.id,
  disposition: annotation.disposition,
  reason: annotation.reason,
  citations: [...annotation.evidence, "packages/e2e/fixtures/hstore-proof-cases.ts"],
  cases: [
    {
      caseId: hstoreRecordMembers.includes(annotation.id)
        ? hstoreRecordProofCase.id
        : hstoreQueryMembers.includes(annotation.id)
          ? hstorePortableProofCase.id
          : hstoreGraphProofCase.id,
      scenario: hstoreScenario(annotation.id),
    },
  ],
  transfers: [],
}));
