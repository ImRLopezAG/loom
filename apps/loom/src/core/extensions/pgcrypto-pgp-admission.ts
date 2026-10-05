import * as v from "valibot";

/** Closed policy for the captured PG18 pgcrypto PGP encrypt/decrypt overloads. */
const affected = new Set([
  "routine:$extension:pgcrypto.pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea)",
  "routine:$extension:pgcrypto.pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea)",
  "routine:$extension:pgcrypto.pgp_pub_encrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_pub_encrypt_bytea(pg_catalog.bytea,pg_catalog.bytea)",
  "routine:$extension:pgcrypto.pgp_pub_encrypt(pg_catalog.text,pg_catalog.bytea,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_pub_encrypt(pg_catalog.text,pg_catalog.bytea)",
  "routine:$extension:pgcrypto.pgp_sym_decrypt_bytea(pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_sym_decrypt_bytea(pg_catalog.bytea,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_sym_decrypt(pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_sym_decrypt(pg_catalog.bytea,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_sym_encrypt_bytea(pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_sym_encrypt_bytea(pg_catalog.bytea,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_sym_encrypt(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:pgcrypto.pgp_sym_encrypt(pg_catalog.text,pg_catalog.text)",
]);
export function requiresPgpAdmission(member: string): boolean {
  return affected.has(member);
}
/** Validate one unmodified observation from the executing BEGIN-pinned backend. */
export function assertPgpBackendVersion(rows: readonly unknown[]): void {
  const observation = v.safeParse(
    v.pipe(v.array(v.strictObject({ server_version_num: v.pipe(v.string(), v.regex(/^18[0-9]{4}$/)) })), v.length(1)),
    rows,
  );
  if (!observation.success || Number(observation.output[0]!.server_version_num) < 180006)
    throw new Error("Checked PGP requires PostgreSQL 18.6 or later within PostgreSQL 18");
}
