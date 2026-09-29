import { betterAuth } from "better-auth";
import { bearer, jwt, organization } from "better-auth/plugins";
import type { resolveBetterAuthSchema } from "loom/better-auth";

// Keep native configuration identical during schema discovery and deployed runtime initialization.
export function nativeAuth(
  database: Parameters<Parameters<typeof resolveBetterAuthSchema>[0]>[0],
  baseURL: string,
  secret: string,
) {
  return betterAuth({
    database,
    baseURL,
    secret,
    emailAndPassword: { enabled: true },
    plugins: [
      bearer({ requireSignature: true }),
      jwt({
        jwt: { issuer: baseURL, audience: "loom-test", expirationTime: "5m" },
        jwks: { keyPairConfig: { alg: "EdDSA" } },
      }),
      organization({ teams: { enabled: true } }),
    ],
  });
}
