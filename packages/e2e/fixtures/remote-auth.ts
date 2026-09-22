import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:https";
import { mock } from "node:test";
import { createNeonAuthVerifier } from "@loom/core/neon";
import { AuthenticationError } from "@loom/core/server";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import * as v from "valibot";

assert.equal(Number(process.versions.node.split(".")[0]), 24);
assert.equal("Bun" in globalThis, false);

const [certificate, privateKeyPath, mode] = process.argv.slice(2);
if (!certificate || !privateKeyPath) throw new Error("Missing fixture certificate paths");
const first = await generateKeyPair("EdDSA");
const second = await generateKeyPair("EdDSA");
let keys = [{ ...(await exportJWK(first.publicKey)), kid: "first" }];
let behavior: "keys" | "outage" | "malformed" | "redirect" | "stall" = "keys";
let requests = 0;
let redirects = 0;
const server = createServer(
  { cert: await readFile(certificate), key: await readFile(privateKeyPath) },
  (request, response) => {
    requests++;
    assert.equal(request.headers.authorization, undefined, "User bearer tokens must not reach the JWKS endpoint");
    assert.equal(request.headers.cookie, undefined);
    if (request.url === "/redirect-target") {
      redirects++;
      response.end(JSON.stringify({ keys }));
      return;
    }
    if (behavior === "stall") {
      response.writeHead(200, { "content-type": "application/json" });
      response.write('{"keys":');
      return;
    }
    if (behavior === "outage") {
      response.writeHead(503);
      response.end("private-provider-error");
      return;
    }
    if (behavior === "malformed") {
      response.end("private-invalid-json");
      return;
    }
    if (behavior === "redirect") {
      response.writeHead(302, { location: "/redirect-target" });
      response.end();
      return;
    }
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ keys }));
  },
);
await new Promise<void>((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    server.off("error", reject);
    resolve();
  });
});
try {
  const address = v.parse(v.object({ port: v.number() }), server.address());
  const issuer = `https://127.0.0.1:${address.port}`;
  const options = {
    baseUrl: `${issuer}/neondb/auth`,
    jwksUrl: `${issuer}/jwks`,
    audience: "loom",
    tenantClaim: "tenant",
  };
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const sign = (key: CryptoKey, kid: string, tokenIssuer = issuer) =>
    new SignJWT({ tenant: "one" })
      .setProtectedHeader({ alg: "EdDSA", kid })
      .setIssuer(tokenIssuer)
      .setSubject("alice")
      .setAudience("loom")
      .setExpirationTime(expiresAt)
      .sign(key);
  const firstToken = await sign(first.privateKey, "first");
  const verify = createNeonAuthVerifier(options);
  if (mode === "untrusted") {
    await assert.rejects(verify(firstToken), AuthenticationError);
    assert.equal(requests, 0, "TLS trust must fail before HTTP delivery");
  } else {
    mock.timers.enable({ apis: ["Date"], now: Date.now() });
    const sessions = await Promise.all(Array.from({ length: 4 }, () => verify(firstToken)));
    for (const session of sessions)
      assert.deepEqual(session, { identity: { issuer, subject: "alice", tenantId: "one" }, expiresAt });
    assert.equal(requests, 1, "Concurrent verification must share one key request");
    keys = [{ ...(await exportJWK(second.publicKey)), kid: "second" }];
    const secondToken = await sign(second.privateKey, "second");
    await assert.rejects(verify(secondToken), AuthenticationError);
    assert.equal(requests, 1, "Unknown keys cannot bypass the cooldown");
    mock.timers.tick(30001);
    assert.equal((await verify(secondToken)).identity.subject, "alice");
    assert.equal(requests, 2, "Unknown keys refresh after the cooldown");
    await assert.rejects(verify(firstToken), AuthenticationError);
    await assert.rejects(verify(await sign(first.privateKey, "second")), AuthenticationError);
    await assert.rejects(
      verify(await sign(second.privateKey, "second", "https://untrusted.example.test")),
      AuthenticationError,
    );
    assert.equal(requests, 2);
    behavior = "outage";
    assert.equal((await verify(secondToken)).identity.subject, "alice");
    assert.equal(requests, 2, "A fresh cached key does not require the provider");
    mock.timers.tick(600001);
    await assert.rejects(verify(secondToken), { name: "Error", message: "Authentication failed" });
    assert.equal(requests, 3, "Expired cache must fail closed during an outage");
    behavior = "keys";
    assert.equal((await verify(secondToken)).identity.subject, "alice");
    assert.equal(requests, 4);
    behavior = "malformed";
    await assert.rejects(createNeonAuthVerifier(options)(secondToken), AuthenticationError);
    behavior = "redirect";
    await assert.rejects(createNeonAuthVerifier(options)(secondToken), AuthenticationError);
    assert.equal(redirects, 0, "JWKS redirects must not be followed");
    behavior = "stall";
    const started = performance.now();
    await assert.rejects(createNeonAuthVerifier(options)(secondToken), AuthenticationError);
    assert.ok(performance.now() - started >= 4500, "The configured five-second timeout must be exercised");
    assert.ok(performance.now() - started < 10000, "Stalled JWKS requests must be bounded");
    assert.equal(requests, 7);
  }
} finally {
  mock.timers.reset();
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
