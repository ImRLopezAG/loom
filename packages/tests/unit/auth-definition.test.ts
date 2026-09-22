import { expect, test, vi } from "vite-plus/test";
import { createAuthentication, defineAuth, isAuthDefinition, FunctionAccessDenied } from "@loom/core/server";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

test("auth declarations capture explicit policy and deny when omitted", async () => {
  const options = { allowAnonymous: true, authorize: () => {} };
  const definition = defineAuth(options);
  options.allowAnonymous = false;
  options.authorize = () => {
    throw new Error("changed");
  };
  expect(isAuthDefinition(definition)).toBe(true);
  expect(isAuthDefinition({ ...definition })).toBe(false);
  expect(Object.isFrozen(definition)).toBe(true);
  expect(() => createAuthentication({}, { ...definition })).toThrow("defineAuth");
  const auth = createAuthentication({}, definition);
  expect(auth.allowAnonymous).toBe(true);
  const context = { name: "tasks:list", kind: "query" as const, requestId: "request", identity: null };
  await expect(auth.authorize(context)).resolves.toBeUndefined();
  await expect(auth.verify("not-a-token")).rejects.toThrow("Authentication failed");
  const denied = createAuthentication({});
  expect(denied.allowAnonymous).toBe(false);
  await expect(denied.authorize(context)).rejects.toThrow(FunctionAccessDenied);
});

test("configured authentication binds JWKS, audience and tenant verification without fetching at construction", async () => {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const jwks = { keys: [{ ...(await exportJWK(publicKey)), kid: "auth-definition" }] };
  const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json(jwks));
  try {
    const config = {
      issuers: [
        {
          issuer: "https://identity.example.test",
          jwksUrl: "https://identity.example.test/jwks",
          tenantClaim: "tenant",
        },
      ],
      audience: "loom",
      origins: ["https://app.example.test"],
    };
    const auth = createAuthentication(
      config,
      defineAuth({
        authorize: ({ identity }) => {
          if (identity?.tenantId !== "one") throw new FunctionAccessDenied();
        },
      }),
    );
    expect(fetcher).not.toHaveBeenCalled();
    config.issuers.length = 0;
    config.audience = "changed";
    config.origins.length = 0;
    const claims = {
      iss: "https://identity.example.test",
      sub: "alice",
      aud: "loom",
      tenant: "one",
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    const sign = (payload: ConstructorParameters<typeof SignJWT>[0]) =>
      new SignJWT(payload).setProtectedHeader({ alg: "ES256", kid: "auth-definition" }).sign(privateKey);
    const session = await auth.verify(await sign(claims));
    expect(session.identity.tenantId).toBe("one");
    expect(auth.origins).toEqual(["https://app.example.test"]);
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://identity.example.test/jwks");
    await expect(auth.verify(await sign({ ...claims, aud: "other" }))).rejects.toThrow("Authentication failed");
    await expect(auth.verify(await sign({ ...claims, tenant: "" }))).rejects.toThrow("Authentication failed");
    await expect(
      auth.authorize({ name: "tasks:list", kind: "query", requestId: "request", identity: null }),
    ).rejects.toThrow(FunctionAccessDenied);
  } finally {
    fetcher.mockRestore();
  }
});
