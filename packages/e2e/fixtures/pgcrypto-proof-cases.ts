import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const pgcryptoProofFamily = {
  extension: "pgcrypto",
  version: "1.4",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8",
} as const satisfies ExtensionProofFamily;

const member = (signature: string) => `routine:$extension:pgcrypto.${signature}`;

/** Exact captured members grouped by the direct native test that witnesses each one. */
export const pgcryptoNativeGroups = {
  hash: {
    id: "pgcrypto.native-hash",
    file: "packages/e2e/integration/extension-pgcrypto-hash.test.ts",
    title: "PG18 pgcrypto four exact hash overloads match independent vectors and strict NULLs",
    scenario: "native-hash-independent-vectors-and-strict-nulls",
    members: [
      member("digest(pg_catalog.text,pg_catalog.text)"),
      member("digest(pg_catalog.bytea,pg_catalog.text)"),
      member("hmac(pg_catalog.text,pg_catalog.text,pg_catalog.text)"),
      member("hmac(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)"),
    ],
  },
  cipher: {
    id: "pgcrypto.native-cipher",
    file: "packages/e2e/integration/extension-pgcrypto-cipher.test.ts",
    title: "PG18 four pgcrypto raw cipher members match independent AES vectors and strict NULLs",
    scenario: "native-raw-cipher-independent-aes-vectors-and-strict-nulls",
    members: [
      member("encrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)"),
      member("decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)"),
      member("encrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)"),
      member("decrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)"),
    ],
  },
  primitives: {
    id: "pgcrypto.native-primitives",
    file: "packages/e2e/integration/extension-pgcrypto-primitives.test.ts",
    title: "PG18 pgcrypto six primitive root expressions decode exact native members and independent password vectors",
    scenario: "native-primitives-independent-password-vectors-and-native-shapes",
    members: [
      member("crypt(pg_catalog.text,pg_catalog.text)"),
      member("gen_salt(pg_catalog.text)"),
      member("gen_salt(pg_catalog.text,pg_catalog.int4)"),
      member("gen_random_bytes(pg_catalog.int4)"),
      member("gen_random_uuid()"),
      member("fips_mode()"),
    ],
  },
  formatting: {
    id: "pgcrypto.native-formatting",
    file: "packages/e2e/integration/extension-pgcrypto-formatting.test.ts",
    title: "all five exact members execute on actual PG18 including old backends against independent public vectors",
    scenario: "native-formatting-independent-public-vectors",
    members: [
      member("armor(pg_catalog.bytea)"),
      member("armor(pg_catalog.bytea,pg_catalog._text,pg_catalog._text)"),
      member("dearmor(pg_catalog.text)"),
      member("pgp_armor_headers(pg_catalog.text)"),
      member("pgp_key_id(pg_catalog.bytea)"),
    ],
  },
  pgp: {
    id: "pgcrypto.native-pgp",
    file: "packages/e2e/integration/extension-pgcrypto-pgp.test.ts",
    title:
      "all eighteen public PGP canonical overloads have successful independent outputs and strict NULL per argument",
    scenario: "native-pgp-independent-gnupg-oracle-and-strict-nulls",
    members: [
      member("pgp_sym_encrypt(pg_catalog.text,pg_catalog.text)"),
      member("pgp_sym_encrypt(pg_catalog.text,pg_catalog.text,pg_catalog.text)"),
      member("pgp_sym_encrypt_bytea(pg_catalog.bytea,pg_catalog.text)"),
      member("pgp_sym_encrypt_bytea(pg_catalog.bytea,pg_catalog.text,pg_catalog.text)"),
      member("pgp_sym_decrypt(pg_catalog.bytea,pg_catalog.text)"),
      member("pgp_sym_decrypt(pg_catalog.bytea,pg_catalog.text,pg_catalog.text)"),
      member("pgp_sym_decrypt_bytea(pg_catalog.bytea,pg_catalog.text)"),
      member("pgp_sym_decrypt_bytea(pg_catalog.bytea,pg_catalog.text,pg_catalog.text)"),
      member("pgp_pub_encrypt(pg_catalog.text,pg_catalog.bytea)"),
      member("pgp_pub_encrypt(pg_catalog.text,pg_catalog.bytea,pg_catalog.text)"),
      member("pgp_pub_encrypt_bytea(pg_catalog.bytea,pg_catalog.bytea)"),
      member("pgp_pub_encrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)"),
      member("pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea)"),
      member("pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)"),
      member("pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text,pg_catalog.text)"),
      member("pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea)"),
      member("pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)"),
      member("pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text,pg_catalog.text)"),
    ],
  },
} as const;

type NativeGroup = (typeof pgcryptoNativeGroups)[keyof typeof pgcryptoNativeGroups];
const nativeGroups: readonly NativeGroup[] = Object.values(pgcryptoNativeGroups);

/** All 37 captured members, each assigned to exactly one direct native witness group. */
export const pgcryptoMembers: readonly string[] = nativeGroups.flatMap((group) => group.members);

function nativeCase(group: NativeGroup) {
  return {
    id: group.id,
    file: group.file,
    title: group.title,
    gate: "database",
    families: [pgcryptoProofFamily],
    claims: group.members.map((id) => ({ family: pgcryptoProofFamily, member: id, scenario: group.scenario })),
  } as const satisfies ExtensionProofCase;
}
export const pgcryptoNativeProofCases = {
  hash: nativeCase(pgcryptoNativeGroups.hash),
  cipher: nativeCase(pgcryptoNativeGroups.cipher),
  primitives: nativeCase(pgcryptoNativeGroups.primitives),
  formatting: nativeCase(pgcryptoNativeGroups.formatting),
  pgp: nativeCase(pgcryptoNativeGroups.pgp),
} as const;

export const pgcryptoUnitProofCases = [
  ["hash", "pgcrypto hash prerequisites require the exact verified descriptor"],
  ["cipher", "four raw cipher contracts use fixed nullable binary decoding and exact bound native calls"],
  ["primitives", "six pgcrypto primitive members have exact native identities and intrinsic result codecs"],
  ["formatting", "five formatting members retain exact identities, fixed codecs and intrinsic table observability"],
  ["pgp", "all eighteen PGP identities use their exact admission member, decoder and native observability"],
  ["public", "reviewed Pgcrypto annotations cover every one of the 37 public routines without invented surfaces"],
].map(
  ([name, title]) =>
    ({
      id: `pgcrypto.unit-${name}`,
      file: `packages/tests/unit/extension-pgcrypto-${name}.test.ts`,
      title: title!,
      gate: "unit",
      families: [pgcryptoProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const pgcryptoPgpAdmissionUnitProofCase = {
  id: "pgcrypto.unit-pgp-admission",
  file: "packages/tests/unit/extension-pgp-admission.test.ts",
  title: "PGP admission is exactly the 18 captured encrypt/decrypt signatures",
  gate: "unit",
  families: [pgcryptoProofFamily],
  claims: [],
} as const satisfies ExtensionProofCase;

export const pgcryptoTypesProofCases = [
  ["hash", "pgcrypto exact hash overload, representation and decoder types"],
  ["cipher", "pgcrypto raw cipher bytea-only arguments and nullable binary results"],
  ["primitives", "pgcrypto primitive int4, uuid and boolean result types"],
  ["formatting", "pgcrypto armor arrays, key-ID and header row source types"],
  ["pgp", "pgcrypto PGP overload arity, options and protected-key password types"],
  ["public", "pgcrypto public exact 1.4 selection, descriptor fallback and rejected surfaces"],
].map(
  ([name, title]) =>
    ({
      id: `pgcrypto.types-${name}`,
      file: `packages/tests/types/extension-pgcrypto-${name}.test-d.ts`,
      title: title!,
      gate: "types",
      families: [pgcryptoProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const pgcryptoGenerationProofCase = {
  id: "pgcrypto.generation-contracts",
  file: "packages/e2e/integration/extension-pgcrypto-public.test.ts",
  title:
    "pgcrypto first load, disk generation and cold Node24 root/mounted RPC/Effect across selected, omitted, empty and unsupported",
  gate: "generation",
  families: [pgcryptoProofFamily],
  claims: [],
} as const satisfies ExtensionProofCase;

export const pgcryptoConsumerProofCase = {
  id: "pgcrypto.consumer-contracts",
  file: "packages/e2e/integration/packed-pgcrypto-public.test.ts",
  title:
    "pgcrypto parent-prepared frozen tarball consumer generates and runs cold Node24 root/mounted RPC/Effect natively",
  gate: "consumer",
  families: [pgcryptoProofFamily],
  claims: [],
} as const satisfies ExtensionProofCase;

type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];

/** Proposed family-local dispositions for parent reconciliation. Definitions alone confer no acceptance. */
export const pgcryptoMemberProofs: MemberProof[] = nativeGroups.flatMap((group) =>
  group.members.map((id) => ({
    id,
    disposition: "query" as const,
    reason: "Generated RPC/Effect and checked native SQL expose every captured pgcrypto routine as a query helper.",
    citations: [
      "apps/loom/src/tooling/extensions/manifests/pgcrypto.json",
      "apps/loom/src/tooling/extensions/annotations/pgcrypto.ts",
      group.file,
      pgcryptoGenerationProofCase.file,
      pgcryptoConsumerProofCase.file,
    ],
    cases: [{ caseId: group.id, scenario: group.scenario }],
    transfers: [],
  })),
);
