import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgJwtAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgjwt";

export const pgJwtProofFamily = {
  extension: "pgjwt",
  version: "0.2.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "a2d8b3ee4c390dd05716585a14c23acfebdb05bb3800a06cd72a48578dcabadd",
} as const satisfies ExtensionProofFamily;
export const pgJwtRoutineProofCase: ExtensionProofCase = {
  id: "pgjwt.native-routines",
  gate: "database",
  families: [pgJwtProofFamily],
  file: "packages/e2e/integration/extensions-pgjwt.test.ts",
  title: "all six JWT routines match independent byte, HMAC, JSON, NULL and double oracles",
  claims: pgJwtAnnotations.map((member) => ({
    family: pgJwtProofFamily,
    member: member.id,
    scenario: "independent-native-oracles-and-nulls",
  })),
};
export const pgJwtTimeProofCase: ExtensionProofCase = {
  id: "pgjwt.native-time",
  gate: "database",
  families: [pgJwtProofFamily],
  file: "packages/e2e/integration/extensions-pgjwt.test.ts",
  title: "JWT verification preserves transaction time and caller algorithm semantics without granting identity",
  claims: [
    {
      family: pgJwtProofFamily,
      member: "routine:$extension:pgjwt.verify(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      scenario: "caller-algorithm-time-signature-and-malformed-json",
    },
  ],
};
export const pgJwtMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  pgJwtAnnotations.map((member) => ({
    id: member.id,
    disposition: member.disposition,
    reason: member.reason,
    citations: [...member.evidence],
    cases: [{ caseId: pgJwtRoutineProofCase.id, scenario: "independent-native-oracles-and-nulls" }],
    transfers: [],
  }));
export const pgJwtDatabaseFixtureCount = 2;
export const pgJwtUnitProofCases: ExtensionProofCase[] = [
  "six exact JWT members keep native signatures, defaults, codecs and verification time dependency",
  "JWT parameters and native columns compose without loss of JSON precision or bytea transport",
  "verification named rows preserve source leases, relation checks and session observability",
  "fixed result decoders retain JSON documents, nullable verification and nonfinite doubles",
  "JWT requires its exact captured manifest",
  "JWT rejects PostgreSQL script namespace restrictions before expressions are created",
].map((title, index) => ({
  id: `pgjwt.unit-${index + 1}`,
  gate: "unit",
  families: [pgJwtProofFamily],
  claims: [],
  file: "packages/tests/unit/extension-pgjwt.test.ts",
  title,
}));
export const pgJwtTypesProofCase: ExtensionProofCase = {
  id: "pgjwt.types",
  gate: "types",
  families: [pgJwtProofFamily],
  claims: [],
  file: "packages/tests/types/extension-pgjwt.test-d.ts",
  title: "exact pgjwt result, nullable input, algorithm and row contracts",
};
