/** Reviewed public SQL dispositions. Wiring verification is not native/provider semantic acceptance. */
export const pgcryptoAnnotationContract = {
  extension: "pgcrypto",
  postgresMajor: 18,
  version: "1.4",
  provider: "neon",
  digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;

const evidence = [
  "https://www.postgresql.org/docs/18/pgcrypto.html",
  "https://github.com/postgres/postgres/blob/REL_18_6/contrib/pgcrypto/pgcrypto--1.3.sql",
  "https://github.com/postgres/postgres/blob/REL_18_6/contrib/pgcrypto/pgcrypto--1.3--1.4.sql",
  "apps/loom/src/tooling/extensions/manifests/pgcrypto.json: exact Neon PostgreSQL18 / Pgcrypto1.4 SQL contract; capture is not semantic acceptance",
] as const;
const common = {
  authority: "query",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  limitation:
    "Final source-bound host acceptance remains pending; process-FIPS=true and unproved algorithm/options/provider profiles remain prerequisites. SQL crypto values confer no Kello invocation identity or key-management guarantee.",
} as const;
const strict = "STRICT: each explicit SQL NULL input yields NULL; undefined is not a native argument";

const groups = [
  {
    signatures: [
      "digest(pg_catalog.text,pg_catalog.text)",
      "digest(pg_catalog.bytea,pg_catalog.text)",
      "hmac(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      "hmac(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    ],
    reason:
      "Native text and bytea hash overloads preserve their distinct storage identities; algorithm names and algorithm errors belong to PostgreSQL/OpenSSL.",
    result: "{ hex: string } | null",
    codec: "pg:bytea:hex:1:nullable",
    observability: "tables",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-hash.test.ts",
    case: "PG18 pgcrypto four exact hash overloads match independent vectors and strict NULLs",
  },
  {
    signatures: [
      "encrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
      "decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
      "encrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
      "decrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    ],
    reason:
      "Native raw cipher bytea overloads retain explicit key/IV and mode strings; native padding and algorithm errors are preserved. These expressions do not establish authenticated encryption.",
    result: "{ hex: string } | null",
    codec: "pg:bytea:hex:1:nullable",
    observability: "tables",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-cipher.test.ts",
    case: "PG18 four pgcrypto raw cipher members match independent AES vectors and strict NULLs",
  },
  {
    signatures: [
      "crypt(pg_catalog.text,pg_catalog.text)",
      "gen_salt(pg_catalog.text)",
      "gen_salt(pg_catalog.text,pg_catalog.int4)",
    ],
    reason:
      "Native password hashing and salt generation preserve scheme, count, truncation and builtin_crypto_enabled policy; external classification conservatively retains process mode dependencies even for captured immutable crypt.",
    result: "string | null",
    codec: "pg:text:1:nullable",
    observability: "external",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-primitives.test.ts",
    case: "PG18 pgcrypto six primitive root expressions decode exact native members and independent password vectors",
  },
  {
    signatures: ["gen_random_bytes(pg_catalog.int4)"],
    reason:
      "Native random bytes accept int4 storage and return checked binary values; native count restrictions remain PostgreSQL errors and no statistical entropy claim follows from SQL shape.",
    result: "{ hex: string } | null",
    codec: "pg:bytea:hex:1:nullable",
    observability: "external",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-primitives.test.ts",
    case: "PG18 pgcrypto six primitive root expressions decode exact native members and independent password vectors",
  },
  {
    signatures: ["gen_random_uuid()"],
    reason:
      "Captured extension-owned UUID wrapper remains a public member even though native PostgreSQL supplies the generator; random UUID is neither authorization nor secrecy.",
    result: "string",
    codec: "pg:uuid:1",
    observability: "external",
    nulls: "No arguments; native non-NULL UUID",
    file: "packages/e2e/integration/extension-pgcrypto-primitives.test.ts",
    case: "PG18 pgcrypto six primitive root expressions decode exact native members and independent password vectors",
  },
  {
    signatures: ["fips_mode()"],
    reason:
      "Pgcrypto1.4 reports native process FIPS state; SQL setting fips policy does not prove a process running with FIPS enabled.",
    result: "boolean",
    codec: "pg:bool:1",
    observability: "external",
    nulls: "No arguments; native non-NULL boolean",
    file: "packages/e2e/integration/extension-pgcrypto-primitives.test.ts",
    case: "real backend builtin crypto on/off/fips policy, SET permissions and transaction-local reset stay distinct",
  },
  {
    signatures: ["armor(pg_catalog.bytea)", "armor(pg_catalog.bytea,pg_catalog._text,pg_catalog._text)"],
    reason:
      "Native armor text retains payload framing/CRC and explicit PostgreSQL text-array header semantics, dimensions, lower bounds and native rejection behavior.",
    result: "string | null",
    codec: "pg:text:1:nullable",
    observability: "tables",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-formatting.test.ts",
    case: "all five exact members execute on actual PG18 including old backends against independent public vectors",
  },
  {
    signatures: ["dearmor(pg_catalog.text)"],
    reason:
      "Native dearmor validates framing/CRC and returns checked hex bytes; this formatting routine is independent of PGP encryption/decryption backend admission.",
    result: "{ hex: string } | null",
    codec: "pg:bytea:hex:1:nullable",
    observability: "tables",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-formatting.test.ts",
    case: "all five exact members execute on actual PG18 including old backends against independent public vectors",
  },
  {
    signatures: ["pgp_armor_headers(pg_catalog.text)"],
    reason:
      "Public SETOF record has named text OUT columns key/value; checked expression and flat armorHeaders row source preserve rows, duplicates and native parsing without inventing an owned composite type or CRC validation.",
    result: "{ key: string; value: string } per native row",
    codec: "pg:composite:1:pgcrypto:armor-headers:1:key:pg:text:1;value:pg:text:1",
    observability: "tables",
    nulls: "STRICT set-returning function: SQL NULL input yields zero rows",
    file: "packages/e2e/integration/extension-pgcrypto-formatting.test.ts",
    case: "all five exact members execute on actual PG18 including old backends against independent public vectors",
  },
  {
    signatures: ["pgp_key_id(pg_catalog.bytea)"],
    reason:
      "Native key/message identifier parsing uses its fixed checked key-ID result representation; an identifier is not signature verification, trust or invocation identity.",
    result: "string | null",
    codec: "pgcrypto:key-id:1:nullable",
    observability: "tables",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-formatting.test.ts",
    case: "all five exact members execute on actual PG18 including old backends against independent public vectors",
  },
  {
    signatures: [
      "pgp_sym_encrypt(pg_catalog.text,pg_catalog.text)",
      "pgp_sym_encrypt(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      "pgp_sym_encrypt_bytea(pg_catalog.bytea,pg_catalog.text)",
      "pgp_sym_encrypt_bytea(pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
      "pgp_pub_encrypt(pg_catalog.text,pg_catalog.bytea)",
      "pgp_pub_encrypt(pg_catalog.text,pg_catalog.bytea,pg_catalog.text)",
      "pgp_pub_encrypt_bytea(pg_catalog.bytea,pg_catalog.bytea)",
      "pgp_pub_encrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    ],
    reason:
      "Distinct text/bytea plaintext and native default/options overloads return randomized binary PGP messages; checked execution requires PostgreSQL180006 <= server_version_num < 190000 and retains native algorithm/key/option errors.",
    result: "{ hex: string } | null",
    codec: "pg:bytea:hex:1:nullable",
    observability: "external",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-pgp.test.ts",
    case: "all eighteen public PGP canonical overloads have successful independent outputs and strict NULL per argument",
  },
  {
    signatures: [
      "pgp_sym_decrypt(pg_catalog.bytea,pg_catalog.text)",
      "pgp_sym_decrypt(pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
      "pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea)",
      "pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
      "pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
    ],
    reason:
      "Native text PGP decrypt overloads retain positional secret-key password versus options slots, UTF8 and native failures; checked execution requires PostgreSQL180006 <= server_version_num < 190000.",
    result: "string | null",
    codec: "pg:text:1:nullable",
    observability: "tables",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-pgp.test.ts",
    case: "all eighteen public PGP canonical overloads have successful independent outputs and strict NULL per argument",
  },
  {
    signatures: [
      "pgp_sym_decrypt_bytea(pg_catalog.bytea,pg_catalog.text)",
      "pgp_sym_decrypt_bytea(pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
      "pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea)",
      "pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
      "pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
    ],
    reason:
      "Native binary PGP decrypt overloads preserve high bytes/NUL and positional password/options semantics through checked hex decoding; checked execution requires PostgreSQL180006 <= server_version_num < 190000.",
    result: "{ hex: string } | null",
    codec: "pg:bytea:hex:1:nullable",
    observability: "tables",
    nulls: strict,
    file: "packages/e2e/integration/extension-pgcrypto-pgp.test.ts",
    case: "all eighteen public PGP canonical overloads have successful independent outputs and strict NULL per argument",
  },
] as const;

/** Every captured identity is public query SQL; executable cases are references, not finalized gate receipts. */
export const pgcryptoAnnotations = groups.flatMap((group) =>
  group.signatures.map((signature) => ({
    id: `routine:$extension:pgcrypto.${signature}`,
    disposition: "query" as const,
    reason: group.reason,
    evidence: [...evidence, `${group.file}: ${group.case} (source scenario; fresh host execution required)`],
    cases: [{ kind: "database" as const, file: group.file, case: group.case }],
    transfers: [],
    semantics: {
      ...common,
      result: group.result,
      codec: group.codec,
      observability: group.observability,
      nulls: group.nulls,
    },
  })),
);
