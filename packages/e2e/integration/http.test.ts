import { expect, test } from "bun:test";
import { createPublicHttpApp } from "@loom/core/neon";
import {
  action,
  connectDatabase,
  createDispatcher,
  createJwtVerifier,
  defineSchema,
  FunctionAccessDenied,
  internalQuery,
  mutation,
} from "@loom/core/server";
import { bootstrapDatabase } from "@loom/tooling";
import { defineRelations, sql } from "drizzle-orm";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import pg from "pg";
import * as v from "valibot";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)("public HTTP verifies JWTs before atomic mutation dispatch and replay", async () => {
  if (!connectionString) throw new Error("Missing database URL");
  const suffix = crypto.randomUUID().replaceAll("-", "");
  const metadataNamespace = `loom_http_${suffix}`;
  const runtimeRole = `loom_runtime_${suffix}`;
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  try {
    await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
    await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
    await admin.query(`CREATE TABLE "${metadataNamespace}".writes (owner text NOT NULL)`);
    await admin.query(`GRANT INSERT ON "${metadataNamespace}".writes TO "${runtimeRole}"`);
    const address = new URL(connectionString);
    address.username = runtimeRole;
    address.password = "loom-test-only";
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: address.href,
    });
    try {
      const { publicKey, privateKey } = await generateKeyPair("ES256");
      const issuer = "https://identity.example.test";
      const token = await new SignJWT({ tenant: "one" })
        .setProtectedHeader({ alg: "ES256" })
        .setIssuer(issuer)
        .setSubject("alice")
        .setAudience("loom")
        .setExpirationTime("1m")
        .sign(privateKey);
      const verify = createJwtVerifier([
        {
          issuer,
          audience: "loom",
          tenantClaim: "tenant",
          keys: { type: "local", jwks: { keys: [await exportJWK(publicKey)] } },
        },
      ]);
      let allowed = true;
      const version = "d".repeat(64);
      const dispatcher = createDispatcher({
        connection,
        version,
        idempotency: { deployment: "http-test", metadataNamespace },
        functions: {
          "tasks:write": mutation({
            args: v.object({ owner: v.string() }),
            returns: v.string(),
            handler: async (context) => {
              if (!context.identity) throw new FunctionAccessDenied();
              await context.db.execute(
                sql`INSERT INTO ${sql.identifier(metadataNamespace)}.writes VALUES (${context.identity.subject})`,
              );
              return context.identity.subject;
            },
          }),
          "tasks:private": internalQuery({ args: v.null(), returns: v.null(), handler: () => null }),
          "tasks:fail": action({
            args: v.null(),
            returns: v.null(),
            handler: () => {
              throw new Error("secret-password");
            },
          }),
        },
        authorize: async (context) => {
          if (!allowed || !context.identity) throw new FunctionAccessDenied();
        },
      });
      const app = createPublicHttpApp({ dispatcher, verify, origins: ["https://app.example.test"] });
      const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: app.fetch });
      try {
        const url = new URL("/api/loom/call", server.url);
        const payload = {
          protocol: 1,
          name: "tasks:write",
          kind: "mutation",
          version,
          args: { owner: "forged-bob" },
          idempotencyKey: "once",
        };
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          origin: "https://app.example.test",
        };
        const first = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
        expect(first.status).toBe(200);
        expect(first.headers.get("cache-control")).toBe("no-store");
        expect(first.headers.get("access-control-allow-origin")).toBe(headers.origin);
        await first.arrayBuffer();
        const retry = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
        expect(await retry.json()).toMatchObject({ protocol: 1, ok: true, value: "alice" });
        expect((await admin.query(`SELECT owner FROM "${metadataNamespace}".writes`)).rows).toEqual([
          { owner: "alice" },
        ]);
        allowed = false;
        expect((await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })).status).toBe(403);
        allowed = true;
        expect(
          (
            await fetch(url, {
              method: "POST",
              headers: { ...headers, authorization: "Bearer forged" },
              body: JSON.stringify(payload),
            })
          ).status,
        ).toBe(401);
        expect(
          (
            await fetch(url, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            })
          ).status,
        ).toBe(401);
        const privateCall = { protocol: 1, name: "tasks:private", kind: "query", version, args: null };
        expect((await fetch(url, { method: "POST", headers, body: JSON.stringify(privateCall) })).status).toBe(404);
        const failed = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ ...privateCall, name: "tasks:fail", kind: "action" }),
        });
        expect(failed.status).toBe(500);
        expect(await failed.text()).not.toContain("secret-password");
        expect(connection.pool.idleCount).toBe(connection.pool.totalCount);
      } finally {
        await server.stop(true);
      }
    } finally {
      await connection.close();
    }
  } finally {
    await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
    await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
    await admin.end();
  }
});
