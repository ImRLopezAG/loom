import { expect, test } from "vite-plus/test";
import {
  assertPgpBackendVersion,
  requiresPgpAdmission,
} from "../../../apps/loom/src/core/extensions/pgcrypto-pgp-admission";

const signatures = [
  "pgp_pub_decrypt_bytea(bytea,bytea,text,text)",
  "pgp_pub_decrypt_bytea(bytea,bytea,text)",
  "pgp_pub_decrypt_bytea(bytea,bytea)",
  "pgp_pub_decrypt(bytea,bytea,text,text)",
  "pgp_pub_decrypt(bytea,bytea,text)",
  "pgp_pub_decrypt(bytea,bytea)",
  "pgp_pub_encrypt_bytea(bytea,bytea,text)",
  "pgp_pub_encrypt_bytea(bytea,bytea)",
  "pgp_pub_encrypt(text,bytea,text)",
  "pgp_pub_encrypt(text,bytea)",
  "pgp_sym_decrypt_bytea(bytea,text,text)",
  "pgp_sym_decrypt_bytea(bytea,text)",
  "pgp_sym_decrypt(bytea,text,text)",
  "pgp_sym_decrypt(bytea,text)",
  "pgp_sym_encrypt_bytea(bytea,text,text)",
  "pgp_sym_encrypt_bytea(bytea,text)",
  "pgp_sym_encrypt(text,text,text)",
  "pgp_sym_encrypt(text,text)",
] as const;
const canonical = (signature: string) =>
  `routine:$extension:pgcrypto.${signature.replace(/\b(bytea|text|int4|_text)\b/g, "pg_catalog.$1")}`;

test("PGP admission is exactly the 18 captured encrypt/decrypt signatures", () => {
  expect(signatures).toHaveLength(18);
  for (const signature of signatures) {
    const member = canonical(signature);
    expect(requiresPgpAdmission(member)).toBe(true);
    for (const unrelated of [member + "suffix", member.replace("pgcrypto", "other"), signature, member.toUpperCase()])
      expect(requiresPgpAdmission(unrelated)).toBe(false);
  }
  for (const signature of [
    "digest(text,text)",
    "digest(bytea,text)",
    "hmac(text,text,text)",
    "hmac(bytea,bytea,text)",
    "encrypt(bytea,bytea,text)",
    "decrypt(bytea,bytea,text)",
    "encrypt_iv(bytea,bytea,bytea,text)",
    "decrypt_iv(bytea,bytea,bytea,text)",
    "crypt(text,text)",
    "gen_salt(text)",
    "gen_salt(text,int4)",
    "gen_random_bytes(int4)",
    "gen_random_uuid()",
    "fips_mode()",
    "armor(bytea)",
    "armor(bytea,_text,_text)",
    "dearmor(text)",
    "pgp_armor_headers(text)",
    "pgp_key_id(bytea)",
    "pgp_sym_encrypt(text,text,int4)",
  ])
    expect(requiresPgpAdmission(canonical(signature))).toBe(false);
});

test("PGP backend release observation fails closed and admits only fixed PG18", () => {
  for (const version of ["180006", "180007", "180099", "189999"])
    expect(() => assertPgpBackendVersion([{ server_version_num: version }])).not.toThrow();
  for (const version of [
    "180000",
    "180005",
    "170099",
    "190000",
    "0",
    "",
    " 180006",
    "180006 ",
    "180006.0",
    "18.6",
    "180006 (build)",
    "180006\n",
    "+180006",
    "0180006",
    180006,
    null,
    undefined,
  ])
    expect(() => assertPgpBackendVersion([{ server_version_num: version }])).toThrow(/PGP.*PostgreSQL 18\.6/i);
  for (const rows of [
    [],
    [{}],
    [null],
    ["180006"],
    [{ server_version_num: "180006", extra: "180006" }],
    [{ server_version_num: "180006" }, { server_version_num: "180006" }],
  ])
    expect(() => assertPgpBackendVersion(rows)).toThrow(/PGP.*PostgreSQL 18\.6/i);
});
