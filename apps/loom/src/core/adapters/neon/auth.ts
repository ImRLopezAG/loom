import { createJwtVerifier } from "../../server/auth/verify";
import type { VerifiedSession } from "../../server/auth/verify";

export interface NeonAuthOptions {
  /** NEON_AUTH_BASE_URL injected by Neon Functions on the selected branch. */
  readonly baseUrl: string;
  /** NEON_AUTH_JWKS_URL injected by Neon Functions on the selected branch. */
  readonly jwksUrl: string;
  readonly audience?: string;
  readonly tenantClaim?: string;
}

/** Neon Auth uses the auth base URL's origin as its JWT issuer. */
export function createNeonAuthVerifier(options: NeonAuthOptions): (token: string) => Promise<VerifiedSession> {
  const base = new URL(options.baseUrl);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash)
    throw new Error("Neon Auth base URL must use HTTPS without credentials, query or fragment");
  const claims: Partial<Record<"audience" | "tenantClaim", string>> = {};
  if (options.audience !== undefined) claims.audience = options.audience;
  if (options.tenantClaim !== undefined) claims.tenantClaim = options.tenantClaim;
  return createJwtVerifier([
    {
      issuer: base.origin,
      keys: { type: "remote", url: options.jwksUrl },
      ...claims,
    },
  ]);
}
