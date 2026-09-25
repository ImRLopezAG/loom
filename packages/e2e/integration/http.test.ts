import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { createRpcHttpApp } from "@loom/core/neon";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ORPCError } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import {
  connectDatabase,
  bindRpcDatabaseProcedure,
  createDatabaseMiddleware,
  createProjectProcedures,
  createConnectionTickets,
  createJwtVerifier,
  defineSchema,
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
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({
      schema,
      relations,
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
      const { procedure } = createProjectProcedures(schema);
      const authorize = async ({ identity }: { identity: { subject: string } | null }) => {
        if (!allowed || !identity) throw new ORPCError("FORBIDDEN");
      };
      const trusted = procedure.use(async ({ context, next }) => {
        await authorize(context);
        return next();
      });
      const router = {
        tasks: {
          identity: trusted.handler(({ context }) => context.identity!.subject),
          write: bindRpcDatabaseProcedure(
            procedure
              .use(createDatabaseMiddleware(relations, "write", schema))
              .input(v.object({ owner: v.string() }))
              .handler(async ({ context }) => {
                await context.db.execute(
                  sql`INSERT INTO ${sql.identifier(metadataNamespace)}.writes VALUES (${context.identity!.subject})`,
                );
                return context.identity!.subject;
              }),
            { connection, replay: { deployment: "http-test", metadataNamespace }, authorize },
          ),
          fail: trusted.handler(() => {
            throw new Error("secret-password");
          }),
        },
      };
      const tickets = createConnectionTickets({
        db: connection.db,
        metadataNamespace,
        namespace: schema.metadata.namespace,
        version,
        deployment: "http-test",
      });
      const app = createRpcHttpApp({ router, version, verify, tickets, origins: ["https://app.example.test"] });
      const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: (request) => app.fetch(request) });
      try {
        const key = crypto.randomUUID();
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          origin: "https://app.example.test",
          "x-loom-protocol": "loom-orpc-2",
          "x-loom-version": version,
          "idempotency-key": key,
        };
        const ticketUrl = new URL("/api/loom/ticket", server.url);
        const credentials = new Set<string>();
        for (let index = 0; index < 3; index++) {
          const minted = await fetch(ticketUrl, { method: "POST", headers, body: "{}" });
          expect(minted.status).toBe(200);
          expect(minted.headers.get("cache-control")).toBe("no-store");
          const credential = v.parse(v.object({ ticket: v.string(), expiresAt: v.number() }), await minted.json());
          credentials.add(credential.ticket);
          expect((await tickets.redeem(credential.ticket, headers.origin)).identity).toEqual({
            issuer,
            subject: "alice",
            tenantId: "one",
          });
          await assert.rejects(tickets.redeem(credential.ticket, headers.origin), /Authentication failed/);
        }
        expect(credentials.size).toBe(3);
        const { authorization: _authorization, ...noAuth } = headers;
        const { origin: _origin, ...noOrigin } = headers;
        for (const ticketHeaders of [
          { ...headers, authorization: "Bearer forged" },
          noAuth,
          { ...headers, origin: "https://attacker.example.test" },
          noOrigin,
        ]) {
          const denied = await fetch(ticketUrl, { method: "POST", headers: ticketHeaders, body: "{}" });
          expect([401, 403]).toContain(denied.status);
          await denied.body?.cancel();
        }
        const forged = await fetch(ticketUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ identity: { subject: "bob" } }),
        });
        expect(forged.status).toBe(400);
        await forged.body?.cancel();
        const url = new URL("/api/loom/rpc/tasks/write", server.url);
        const payload = JSON.stringify({ json: { owner: "forged-bob" } });
        const first = await fetch(url, { method: "POST", headers, body: payload });
        expect(first.status).toBe(200);
        expect(first.headers.get("cache-control")).toBe("no-store");
        expect(first.headers.get("access-control-allow-origin")).toBe(headers.origin);
        await first.arrayBuffer();
        const client = createORPCClient<RouterClient<typeof router>>(
          new RPCLink({ origin: server.url.origin, url: "/api/loom/rpc", headers }),
        );
        expect(await client.tasks.write({ owner: "forged-bob" })).toBe("alice");
        expect((await admin.query(`SELECT owner FROM "${metadataNamespace}".writes`)).rows).toEqual([
          { owner: "alice" },
        ]);
        allowed = false;
        await assert.rejects(client.tasks.write({ owner: "forged-bob" }), { code: "FORBIDDEN" });
        allowed = true;
        for (const requestHeaders of [{ ...headers, authorization: "Bearer forged" }, noAuth]) {
          const denied = await fetch(url, { method: "POST", headers: requestHeaders, body: payload });
          expect(denied.status).toBe(401);
          await denied.body?.cancel();
        }
        const privateCall = await fetch(new URL("/api/loom/rpc/tasks/private", server.url), {
          method: "POST",
          headers,
          body: JSON.stringify({ json: null }),
        });
        expect(privateCall.status).toBe(404);
        await privateCall.body?.cancel();
        await assert.rejects(client.tasks.fail(), { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
        let clientAttempts = 0;
        const retryHeaders = { ...headers, "idempotency-key": crypto.randomUUID() };
        const uncertain = createORPCClient<RouterClient<typeof router>>(
          new RPCLink({
            origin: server.url.origin,
            url: "/api/loom/rpc",
            headers: retryHeaders,
            fetch: async (input, init) => {
              const response = await fetch(input, init);
              if (++clientAttempts === 1) {
                await response.arrayBuffer();
                throw new TypeError("Simulated lost response after server commit");
              }
              return response;
            },
          }),
        );
        await assert.rejects(uncertain.tasks.write({ owner: "forged-bob" }));
        expect(clientAttempts).toBe(1);
        expect(await uncertain.tasks.write({ owner: "forged-bob" })).toBe("alice");
        expect(clientAttempts).toBe(2);
        expect(await client.tasks.identity()).toBe("alice");
        allowed = false;
        await assert.rejects(client.tasks.identity(), { code: "FORBIDDEN" });
        allowed = true;
        expect(await client.tasks.identity()).toBe("alice");
        expect((await admin.query(`SELECT owner FROM "${metadataNamespace}".writes`)).rows).toEqual([
          { owner: "alice" },
          { owner: "alice" },
        ]);
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
