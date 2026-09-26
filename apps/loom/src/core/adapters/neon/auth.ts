import { createJwtVerifier } from "../../server/auth/verify";
import type { VerifiedSession } from "../../server/auth/verify";
import type { AuthConfigInput } from "../../server/auth/config";

export interface NeonAuthOptions {
  /** NEON_AUTH_BASE_URL injected by Neon Functions on the selected branch. */
  readonly baseUrl: string;
  /** NEON_AUTH_JWKS_URL injected by Neon Functions on the selected branch. */
  readonly jwksUrl: string;
  readonly audience?: string;
  readonly tenantClaim?: string;
}

/** Resolve managed trust from the function's own branch, not browser input or token claims. */
export function neonAuth(options: {
  readonly origins: readonly string[];
  readonly baseUrl?: string;
  readonly jwksUrl?: string;
  readonly audience?: string;
  readonly tenantClaim?: string;
}): () => AuthConfigInput {
  const settings = structuredClone(options);
  return () => {
    const baseUrl = settings.baseUrl ?? process.env.NEON_AUTH_BASE_URL;
    const jwksUrl = settings.jwksUrl ?? process.env.NEON_AUTH_JWKS_URL;
    if (!baseUrl || !jwksUrl) throw new Error("Enable Neon Auth on this branch or provide explicit trusted auth URLs");
    const base = new URL(baseUrl);
    if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash)
      throw new Error("Invalid Neon Auth base URL");
    const claims: Partial<Record<"audience" | "tenantClaim", string>> = {};
    if (settings.audience !== undefined) claims.audience = settings.audience;
    if (settings.tenantClaim !== undefined) claims.tenantClaim = settings.tenantClaim;
    return {
      origins: [...settings.origins],
      issuers: [{ issuer: base.origin, jwksUrl, algorithms: ["EdDSA"], ...claims }],
    };
  };
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
