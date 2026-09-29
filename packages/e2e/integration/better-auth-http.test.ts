import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { betterAuth } from "better-auth";
import { jwt, organization, twoFactor } from "better-auth/plugins";
import { createAuthClient } from "better-auth/client";
import { jwtClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";
import { createLocalJWKSet, jwtVerify } from "jose";
import { defineRelations } from "drizzle-orm";
import { defineApplication } from "loom";
import { defineSchema } from "loom/server";
import { defineBetterAuth, resolveBetterAuthSchema } from "loom/better-auth";
import { createNeonRpcService } from "loom/neon";
import { emptySnapshot, planMigration, writeMigration, applyMigrations } from "loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "native plugin clients and routes use the assembled Loom server and real Neon tables",
  async () => {
    assert(connectionString);
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const namespace = `auth_http_${suffix}`;
    const metadataNamespace = `loom_auth_http_${suffix}`;
    const runtimeRole = `auth_http_role_${suffix}`;
    const root = await mkdtemp(join(tmpdir(), "loom-auth-http-"));
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    let service: Awaited<ReturnType<typeof createNeonRpcService>> | undefined;
    try {
      const create = (database: Parameters<Parameters<typeof resolveBetterAuthSchema>[0]>[0]) =>
        betterAuth({
          database,
          baseURL: "https://api.test",
          secret: "test-only-native-http-secret-at-least-32-characters",
          emailAndPassword: { enabled: true },
          plugins: [
            jwt({
              jwt: { issuer: "https://api.test", audience: "loom-test", expirationTime: "5m" },
              jwks: { keyPairConfig: { alg: "EdDSA" } },
            }),
            organization({ teams: { enabled: true } }),
            twoFactor(),
          ],
        });
      const nativeSchema = await resolveBetterAuthSchema(create, namespace);
      const plan = await planMigration(await emptySnapshot(namespace), { namespace, tables: nativeSchema.ownedTables });
      await writeMigration(root, "migrations", "auth", plan);
      await applyMigrations({
        connectionString,
        root,
        migrations: "migrations",
        namespace,
        metadataNamespace,
        runtimeRole,
      });
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'test-only-auth-http'`);
      const address = new URL(connectionString);
      address.username = runtimeRole;
      address.password = "test-only-auth-http";
      const application = defineApplication({ rpc: ({ os }) => ({ os }) });
      application.use(defineBetterAuth({ name: "identity", env: {}, create: ({ database }) => create(database) }));
      const schema = defineSchema(() => ({}));
      service = await createNeonRpcService({
        application,
        schema,
        relations: defineRelations(schema.tables),
        connectionString: address.href,
        metadataNamespace,
        deployment: "auth-http",
        version: "a".repeat(64),
        procedures: [],
        authScopes: [{ mountPath: "identity", namespace, fingerprint: nativeSchema.fingerprint }],
        config: {
          auth: {
            origins: ["https://api.test"],
            issuers: [
              {
                issuer: "https://api.test",
                jwksUrl: "https://api.test/api/auth/jwks",
                audience: "loom-test",
                algorithms: ["EdDSA"],
              },
            ],
          },
        },
        assertActive: async () => {},
      });
      const running = service;
      const cookies = new Map<string, string>();
      const client = createAuthClient({
        baseURL: "https://api.test",
        plugins: [jwtClient(), organizationClient({ teams: { enabled: true } }), twoFactorClient()],
        fetchOptions: {
          customFetchImpl: async (input, init) => {
            const request = new Request(input, init);
            request.headers.set("origin", "https://api.test");
            request.headers.set("cookie", [...cookies].map(([key, value]) => `${key}=${value}`).join("; "));
            const response = await running.fetch(request);
            for (const cookie of response.headers.getSetCookie()) {
              const pair = cookie.split(";", 1)[0]!;
              const separator = pair.indexOf("=");
              cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
            }
            return response;
          },
        },
      });
      const signup = await client.signUp.email({
        email: "owner@example.test",
        password: "integration-password-1",
        name: "Owner",
      });
      assert.equal(signup.error, null);
      assert(signup.data?.user.id);
      assert.equal((await client.getSession()).data?.user.id, signup.data.user.id);
      const organizationResult = await client.organization.create({ name: "Example", slug: "example" });
      assert.equal(organizationResult.error, null);
      assert(organizationResult.data?.id);
      const team = await client.organization.createTeam({
        name: "Engineering",
        organizationId: organizationResult.data.id,
      });
      assert.equal(team.error, null);
      const token = await client.token();
      assert.equal(token.error, null);
      assert(token.data?.token);
      const keys = await (await running.fetch(new Request("https://api.test/api/auth/jwks"))).json();
      const verified = await jwtVerify(token.data.token, createLocalJWKSet(keys), {
        issuer: "https://api.test",
        audience: "loom-test",
        algorithms: ["EdDSA"],
      });
      assert.equal(verified.payload.sub, signup.data.user.id);
      assert(verified.payload.exp! - verified.payload.iat! <= 300);
      assert.equal(
        (
          await running.fetch(
            new Request("https://api.test/api/auth/signJWT", {
              method: "POST",
              body: "{}",
              headers: { "content-type": "application/json" },
            }),
          )
        ).status,
        404,
      );
      assert.equal((await running.fetch(new Request("https://api.test/api/auth/token"))).status, 401);
      assert.equal(
        (
          await running.fetch(
            new Request("https://api.test/api/auth/get-session", { headers: { origin: "https://evil.test" } }),
          )
        ).status,
        403,
      );
      assert.equal((await client.signOut()).error, null);
      assert.equal((await client.getSession()).data, null);
      assert.equal(
        (await client.signIn.email({ email: "owner@example.test", password: "integration-password-1" })).error,
        null,
      );
      const enabled = await client.twoFactor.enable({ password: "integration-password-1" });
      assert.equal(enabled.error, null);
      assert.equal(enabled.data?.method, "totp");
      assert(enabled.data && "totpURI" in enabled.data && enabled.data.totpURI);
      assert.equal((await admin.query(`SELECT count(*)::int AS n FROM "${namespace}"."twoFactor"`)).rows[0].n, 1);
    } finally {
      await service?.stop();
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
      await rm(root, { recursive: true, force: true });
    }
  },
  90_000,
);
