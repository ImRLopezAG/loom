import { expect, test } from "vite-plus/test";
import { createJwtVerifier, AuthenticationError } from "@loom/core/server";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

test("JWT verification requires trusted signature, issuer, audience, expiration and tenant claims", async () => {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const key = { ...(await exportJWK(publicKey)), kid: "current" };
  const issuer = "https://identity.example.test";
  const now = Math.floor(Date.now() / 1000);
  const config = {
    issuer,
    audience: "loom",
    tenantClaim: "tenant",
    keys: { type: "local" as const, jwks: { keys: [key] } },
  };
  const verify = createJwtVerifier([config]);
  const claims = { iss: issuer, sub: "alice", aud: "loom", exp: now + 60, tenant: "one" };
  const sign = (payload: ConstructorParameters<typeof SignJWT>[0]) =>
    new SignJWT(payload).setProtectedHeader({ alg: "ES256", kid: "current" }).sign(privateKey);
  const token = await sign(claims);
  expect(await verify(token)).toEqual({ identity: { issuer, subject: "alice", tenantId: "one" }, expiresAt: now + 60 });
  config.issuer = "https://changed.example.test";
  config.keys.jwks.keys.length = 0;
  expect((await verify(token)).identity.subject).toBe("alice");
  for (const payload of [
    { ...claims, exp: now - 1 },
    { ...claims, iss: "https://attacker.example.test" },
    { ...claims, aud: "different" },
    { ...claims, nbf: now + 60 },
    { ...claims, sub: "" },
    { ...claims, tenant: 42 },
    { iss: issuer, sub: "alice", aud: "loom", tenant: "one" },
    { iss: issuer, sub: "alice", aud: "loom", exp: now + 60 },
  ])
    await expect(verify(await sign(payload))).rejects.toThrow(AuthenticationError);
  const other = await generateKeyPair("ES256");
  const forged = await new SignJWT(claims).setProtectedHeader({ alg: "ES256", kid: "current" }).sign(other.privateKey);
  await expect(verify(forged)).rejects.toThrow("Authentication failed");
  const symmetric = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .sign(crypto.getRandomValues(new Uint8Array(32)));
  await expect(verify(symmetric)).rejects.toThrow("Authentication failed");
  await expect(verify("not-a-token")).rejects.toThrow("Authentication failed");
  await expect(verify("x".repeat(16385))).rejects.toThrow("Authentication failed");
});

test("JWT configuration rejects ambiguous issuers and unsafe JWKS locations", () => {
  const config = {
    issuer: "https://identity.example.test",
    keys: { type: "remote" as const, url: "https://identity.example.test/jwks" },
  };
  expect(() => createJwtVerifier([config])).not.toThrow();
  expect(() => createJwtVerifier([])).toThrow();
  expect(() => createJwtVerifier([config, config])).toThrow("Duplicate");
  for (const url of [
    "http://identity.example.test/jwks",
    "https://user:password@identity.example.test/jwks",
    "https://identity.example.test/jwks#fragment",
  ]) {
    expect(() => createJwtVerifier([{ ...config, keys: { type: "remote", url } }])).toThrow("HTTPS");
  }
});
