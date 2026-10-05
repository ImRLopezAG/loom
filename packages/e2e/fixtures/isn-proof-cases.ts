import * as v from "valibot";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import source from "../../../apps/loom/src/tooling/extensions/manifests/isn.json";
import { isnNativeCases, isnCastCases } from "./isn-api";

const manifest = v.parse(extensionManifestValidator, source);
export const isnProofFamily = {
  extension: "isn",
  version: "1.3",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: source.digest,
} as const;
export const isnOrdinaryProofCase: ExtensionProofCase = {
  id: "isn.native-ordinary",
  file: "packages/e2e/integration/extensions-isn.test.ts",
  title: "isn.all395OrdinaryAnd20CastIdentitiesWithStrictNull",
  gate: "database",
  families: [isnProofFamily],
  claims: [...isnNativeCases(), ...isnCastCases()].map((row) => ({
    family: isnProofFamily,
    member: row.member,
    scenario: "independent-native-sql-and-strict-null",
  })),
};
export const isnSchemaProofCase: ExtensionProofCase = {
  id: "isn.native-schema",
  file: "packages/e2e/integration/extensions-isn.test.ts",
  title: "isn.allEightTypesArraysAndSixteenIndexClasses",
  gate: "database",
  families: [isnProofFamily],
  claims: manifest.contract.members
    .filter((row) => row.kind === "type" || row.kind === "opclass")
    .map((row) => ({
      family: isnProofFamily,
      member: row.id,
      scenario: "stored-type-array-bounds-and-indexed-versus-sequential-oracle",
    })),
};
export const isnSessionProofCase: ExtensionProofCase = {
  id: "isn.native-session",
  file: "packages/e2e/integration/extensions-isn.test.ts",
  title: "isn.weakModeCorrectionStrictNullAndClosedLease",
  gate: "database",
  families: [isnProofFamily],
  claims: manifest.contract.members
    .filter((row) => row.kind === "routine" && row.name === "isn_weak")
    .map((row) => ({
      family: isnProofFamily,
      member: row.id,
      scenario: "dedicated-backend-session-state-and-lease-revocation",
    })),
};
export const isnUnitProofCases: ExtensionProofCase[] = [
  "isn preserves typed text, invalid markers, and native array bounds",
  "isn canonical public identities equal the captured callable and cast contracts",
  "isn scalar/array fields and all sixteen index classes retain schema and member identity",
  "isn operator admission rejects wrong manifests and pooled sessions before database access",
].map((title, index) => ({
  id: `isn.unit-${index}`,
  file: "packages/tests/unit/extensions-isn.test.ts",
  title,
  gate: "unit",
  families: [isnProofFamily],
  claims: [],
}));
export const isnTypesProofCase: ExtensionProofCase = {
  id: "isn.types",
  file: "packages/tests/types/extensions-isn.test-d.ts",
  title: "isn.all415SignaturesAndNegativeContracts",
  gate: "types",
  families: [isnProofFamily],
  claims: [],
};
export const isnGenerationProofCase: ExtensionProofCase = {
  id: "isn.generation",
  file: "packages/e2e/integration/extensions-isn-generated.test.ts",
  title: "isn first-load and disk generation preserve the exact selected adapter",
  gate: "generation",
  families: [isnProofFamily],
  claims: [],
};
export const isnDatabaseProofCases = [isnOrdinaryProofCase, isnSchemaProofCase, isnSessionProofCase];
export const isnConsumerProofCase: ExtensionProofCase = {
  id: "isn.consumer",
  file: "packages/e2e/integration/packed-isn.test.ts",
  title: "packed isn compiles all 415 callable identities and executes native public APIs",
  gate: "consumer",
  families: [isnProofFamily],
  claims: [],
};
export const isnProofCases = [
  ...isnUnitProofCases,
  isnTypesProofCase,
  ...isnDatabaseProofCases,
  isnGenerationProofCase,
  isnConsumerProofCase,
];
type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
/** Proposed family-local dispositions for parent reconciliation. Definitions alone confer no acceptance. */
export const isnMemberProofs: MemberProof[] = manifest.contract.members.map((member) => {
  const cases = isnDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === member.id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
  const common = {
    id: member.id,
    citations: [
      "apps/loom/src/tooling/extensions/manifests/isn.json",
      "https://www.postgresql.org/docs/18/isn.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/isn/isn.c",
      "packages/e2e/integration/extensions-isn.test.ts",
    ],
    cases,
  };
  if (cases.length)
    return {
      ...common,
      disposition:
        member.kind === "type" || member.kind === "opclass"
          ? "schema"
          : member.kind === "routine" && member.name === "isn_weak"
            ? "tooling"
            : "query",
      reason: "Exact typed capability with an executable native oracle; all acceptance receipts remain parent-owned.",
      transfers: [],
    };
  let from: string;
  let relation: MemberProof["transfers"][number]["relation"];
  if (member.kind === "routine") {
    const parent = manifest.contract.members.find(
      (row) => row.kind === "type" && (row.input === member.id.slice(8) || row.output === member.id.slice(8)),
    );
    if (!parent || parent.kind !== "type") throw new Error(`Unowned isn type callback: ${member.id}`);
    from = parent.id;
    relation = { kind: "type-routine", slot: parent.input === member.id.slice(8) ? "input" : "output" };
  } else if (member.kind === "opfamily") {
    from = `opclass:$extension:isn.ean13_ops/${member.accessMethod}`;
    relation = { kind: "opclass-family" };
  } else if (member.kind === "other") {
    const match =
      /^(function|operator) (\d+) \("\$extension:isn"\.([a-z0-9]+), "\$extension:isn"\.([a-z0-9]+)\) of "\$extension:isn"\.isn_ops USING (btree|hash)$/.exec(
        member.identity,
      );
    if (!match) throw new Error(`Unknown isn access-method attachment: ${member.id}`);
    const [, kind, number, left, right, method] = match;
    const family = manifest.contract.members.find((row) => row.kind === "opfamily" && row.accessMethod === method);
    if (!family || family.kind !== "opfamily") throw new Error("Missing captured isn operator family");
    from = `opclass:$extension:isn.${left}_ops/${method}`;
    if (kind === "function") {
      const row = family.procedures.find(
        (row) => row.number === Number(number) && row.left.name === left && row.right.name === right,
      );
      if (!row) throw new Error("Missing exact isn support procedure row");
      relation = { kind: "attachment", family: family.id, row: { kind: "procedure", ...row } };
    } else {
      const row = family.operators.find(
        (row) => row.strategy === Number(number) && row.left.name === left && row.right.name === right,
      );
      if (!row) throw new Error("Missing exact isn support operator row");
      relation = { kind: "attachment", family: family.id, row: { kind: "operator", ...row } };
    }
  } else throw new Error(`Unimplemented isn member: ${member.id}`);
  const parent = isnDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === from)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
  if (parent.length !== 1) throw new Error(`Ambiguous isn proof parent: ${member.id}`);
  return {
    ...common,
    disposition: "internal",
    reason: "Captured backend type or access-method wiring is exercised through its owning native capability.",
    transfers: parent.map((proof) => ({
      from,
      relation,
      ...proof,
      basis:
        "Exact captured type/callback or class/family/attachment edge; requires successful native type and index parent oracle.",
    })),
  };
});
