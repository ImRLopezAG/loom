import { generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_session_jwt.json";
import { createPgSessionJwt_0_5_0 } from "../../../apps/loom/src/core/extensions/adapters/pg_session_jwt";

export const pgSessionJwtInstallSchema = "jwt_install";
export const pgSessionJwtDescriptor = {
  name: "pg_session_jwt",
  version: "0.5.0",
  schema: pgSessionJwtInstallSchema,
  apiSupport: { status: "verified", digest: source.digest },
} as const;
export const pgSessionJwtApi = createPgSessionJwt_0_5_0(pgSessionJwtDescriptor);
export const pgSessionJwtInstall = `CREATE SCHEMA ${pgSessionJwtInstallSchema}; CREATE EXTENSION pg_session_jwt WITH SCHEMA ${pgSessionJwtInstallSchema} VERSION '0.5.0'`;

/** Claims-only readers need the extension binary. JWK writes also need a startup JWK. */
export function requireSessionJwtExtension(available: boolean): void {
  if (!available)
    throw new Error(
      "pg_session_jwt native acceptance requires the Neon/provider extension binary; local PostgreSQL 18 contrib does not ship it",
    );
}
/** Synthetic per-run Ed25519 keys. The private key never leaves this process. */
export function createSessionJwtSigner() {
  const pair = generateKeyPairSync("ed25519");
  const other = generateKeyPairSync("ed25519");
  const jwk = JSON.stringify(pair.publicKey.export({ format: "jwk" }));
  function signWith(key: KeyObject, claims: Readonly<Record<string, unknown>>): string {
    const header = Buffer.from(JSON.stringify({ alg: "EdDSA", typ: "JWT" })).toString("base64url");
    const body = `${header}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
    return `${body}.${sign(null, Buffer.from(body), key).toString("base64url")}`;
  }
  return {
    jwk,
    sign: (claims: Readonly<Record<string, unknown>>) => signWith(pair.privateKey, claims),
    signWithOtherKey: (claims: Readonly<Record<string, unknown>>) => signWith(other.privateKey, claims),
    startupUrl(url: string): string {
      const startup = new URL(url);
      startup.searchParams.set("options", `-c pg_session_jwt.jwk=${jwk}`);
      return startup.href;
    },
  };
}
