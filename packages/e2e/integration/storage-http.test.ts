import assert from "node:assert/strict";
import { test } from "bun:test";
import pg from "pg";
import { defineRelations } from "drizzle-orm";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { bootstrapDatabase } from "@loom/tooling";
import { createRuntime, createJwtVerifier, defineSchema, defineStorage } from "@loom/core/server";
import { createNeonApplication } from "@loom/core/neon";
import { createClient, LoomClientError } from "@loom/core/client";
import { storageProviderFixture } from "../fixtures/storage-provider";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "storage HTTP verifies tenant JWTs and preserves intents across lost client responses",
  async () => {
    if (!connectionString) throw new Error("Missing database");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    const provider = storageProviderFixture();
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      const address = new URL(connectionString);
      address.username = runtimeRole;
      address.password = "loom-test-only";
      const schema = defineSchema(() => ({}));
      let permitted = true;
      const runtime = await createRuntime({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: address.href,
        metadataNamespace,
        deployment: "storage-http",
        version: "a".repeat(64),
        functions: {},
        assertActive: async () => {},
        storage: defineStorage({
          buckets: { uploads: {} },
          authorize: ({ identity }) => {
            assert.equal(identity.subject, "alice");
            if (!permitted) throw new Error("private-policy-secret");
          },
        }),
        storageBackend: { projectId: "project", branchId: "br-preview", connect: provider.connect },
      });
      const { publicKey, privateKey } = await generateKeyPair("ES256");
      const issuer = "https://identity.test";
      const tokenFor = (tenant: string) =>
        new SignJWT({ tenant })
          .setProtectedHeader({ alg: "ES256" })
          .setIssuer(issuer)
          .setSubject("alice")
          .setAudience("loom")
          .setExpirationTime("1m")
          .sign(privateKey);
      const token = await tokenFor("one");
      const otherToken = await tokenFor("two");
      const verify = createJwtVerifier([
        {
          issuer,
          audience: "loom",
          tenantClaim: "tenant",
          keys: { type: "local", jwks: { keys: [await exportJWK(publicKey)] } },
        },
      ]);
      const app = createNeonApplication({
        dispatcher: runtime.dispatcher,
        storage: runtime.storage?.intents,
        verify,
        origins: ["https://app.test"],
        allowAnonymous: true,
      });
      const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: app.fetch });
      try {
        let lost = false;
        const client = createClient({
          url: server.url.href,
          getAuth: async () => ({ token, identityKey: "alice-one" }),
          fetch: async (url, init) => {
            const response = await fetch(url, init);
            if (!lost && response.ok) {
              lost = true;
              await response.body?.cancel();
              throw new Error("lost response");
            }
            return response;
          },
        });
        const other = createClient({
          url: server.url.href,
          getAuth: async () => ({ token: otherToken, identityKey: "alice-two" }),
        });
        const { id: _id, ...upload } = provider.intent;
        const anonymous = createClient({ url: server.url.href });
        await assert.rejects(
          anonymous.storage.create(upload),
          (cause) => cause instanceof LoomClientError && cause.code === "UNAUTHENTICATED",
        );
        const saved = await client.storage.create(upload, { idempotencyKey: "once" });
        assert.equal(lost, true);
        assert.equal(
          (await admin.query(`SELECT count(*)::int AS count FROM "${metadataNamespace}".storage_intents`)).rows[0]
            .count,
          1,
        );
        assert.deepEqual(await client.storage.create(upload, { idempotencyKey: "once" }), saved);
        await assert.rejects(
          client.storage.create({ ...upload, size: upload.size + 1 }, { idempotencyKey: "once" }),
          (cause) => cause instanceof LoomClientError && cause.code === "IDEMPOTENCY_CONFLICT",
        );
        await assert.rejects(
          other.storage.status(saved.id),
          (cause) => cause instanceof LoomClientError && cause.code === "FORBIDDEN",
        );
        await assert.rejects(
          other.storage.signUpload(saved.id),
          (cause) => cause instanceof LoomClientError && cause.code === "FORBIDDEN",
        );
        await assert.rejects(
          client.storage.signDownload(saved.id),
          (cause) => cause instanceof LoomClientError && cause.code === "STORAGE_UNAVAILABLE",
        );
        const signed = await client.storage.signUpload(saved.id);
        assert.equal(
          (await fetch(signed.url, { method: signed.method, headers: signed.headers, body: provider.body })).status,
          200,
        );
        assert.equal((await client.storage.finalize(saved.id)).state, "ready");
        assert.equal((await client.storage.finalize(saved.id)).state, "ready");
        assert.equal((await client.storage.status(saved.id)).state, "ready");
        const download = await client.storage.signDownload(saved.id);
        assert.equal(await (await fetch(download.url)).text(), provider.body.toString());
        await assert.rejects(
          other.storage.signDownload(saved.id),
          (cause) => cause instanceof LoomClientError && cause.code === "FORBIDDEN",
        );
        permitted = false;
        await assert.rejects(
          client.storage.signDownload(saved.id),
          (cause) =>
            cause instanceof LoomClientError &&
            cause.code === "FORBIDDEN" &&
            !cause.message.includes("private-policy-secret"),
        );
        permitted = true;
        const url = new URL("/api/loom/storage", server.url);
        const headers = {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          origin: "https://app.test",
        };
        assert.equal(
          (
            await fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify({ protocol: 1, operation: "status", id: saved.id, identity: { subject: "alice" } }),
            })
          ).status,
          400,
        );
        assert.equal(
          (await fetch(url, { method: "POST", headers: { ...headers, origin: "https://attacker.test" }, body: "{}" }))
            .status,
          403,
        );
        assert.equal((await fetch(url, { method: "POST", headers, body: "x".repeat(16385) })).status, 413);
        const preflight = await fetch(url, {
          method: "OPTIONS",
          headers: {
            origin: "https://app.test",
            "access-control-request-method": "POST",
            "access-control-request-headers": "authorization,content-type",
          },
        });
        assert.equal(preflight.status, 204);
        assert.equal(preflight.headers.get("access-control-allow-origin"), "https://app.test");
        assert.equal(preflight.headers.has("access-control-allow-credentials"), false);
        const bad = await client.storage.create({ ...upload, sha256: "0".repeat(64) }, { idempotencyKey: "bad" });
        const badSigned = await client.storage.signUpload(bad.id);
        await fetch(badSigned.url, { method: badSigned.method, headers: badSigned.headers, body: provider.body });
        await assert.rejects(
          client.storage.finalize(bad.id),
          (cause) => cause instanceof LoomClientError && cause.code === "STORAGE_VERIFICATION_FAILED",
        );
        assert.deepEqual(await client.storage.status(bad.id), {
          id: bad.id,
          state: "failed",
          errorCode: "VERIFICATION_FAILED",
        });
      } finally {
        await app.stop();
        await runtime.stop();
        await server.stop(true);
      }
    } finally {
      await provider.cleanup();
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);
