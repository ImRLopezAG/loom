import { fileURLToPath } from "node:url";
import { applyMigrations, loadProject, startDevelopmentServer } from "@loom/tooling";
import { createJwtVerifier, createRpcRuntime } from "@loom/core/server";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import pg from "pg";

/** Test-only identity issuer and disposable PostgreSQL database. Apps themselves
 * use the same generated clients and deployment config with real Neon. */
export async function startIntegrationBackend(connectionString: string, origins: string[]) {
  const root = fileURLToPath(new URL("../../examples/integrations/", import.meta.url));
  const address = new URL(connectionString);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(address.hostname)) throw new Error("Local test database required");
  const project = await loadProject(root);
  if (project.protocol !== "loom-orpc-2") throw new Error("Expected native contracts");
  const database = `loom_integrations_${crypto.randomUUID().replaceAll("-", "")}`;
  const role = `${database}_runtime`;
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  let backend: Awaited<ReturnType<typeof startDevelopmentServer>> | undefined;
  let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
  async function stop() {
    try {
      if (backend) await backend.stop();
      else await runtime?.stop();
    } finally {
      try {
        await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
        await admin.query(`DROP ROLE IF EXISTS "${role}"`);
      } finally {
        await admin.end();
      }
    }
  }
  try {
    await admin.query(`CREATE DATABASE "${database}"`);
    address.pathname = `/${database}`;
    await applyMigrations({
      connectionString: address.href,
      root,
      migrations: project.config.database.migrations,
      namespace: project.config.database.namespace,
      metadataNamespace: project.config.database.metadataNamespace,
      runtimeRole: role,
    });
    const password = crypto.randomUUID();
    await admin.query(`ALTER ROLE "${role}" LOGIN PASSWORD '${password}'`);
    address.username = role;
    address.password = password;
    const keys = await generateKeyPair("ES256");
    const issuer = "https://integration.loom.test";
    const verify = createJwtVerifier([
      { issuer, keys: { type: "local", jwks: { keys: [await exportJWK(keys.publicKey)] } } },
    ]);
    runtime = await createRpcRuntime({
      application: project.application,
      schema: project.schema,
      relations: project.relations,
      version: project.version,
      connectionString: address.href,
      metadataNamespace: project.config.database.metadataNamespace,
      deployment: "integration-examples",
      procedures: project.procedures.map((entry) => ({ ...entry, procedure: entry.definition })),
      auth: project.auth,
      config: { auth: { origins }, realtime: { pollIntervalMs: 100 } },
      assertActive: async (signal) => signal.throwIfAborted(),
    });
    backend = await startDevelopmentServer({ ...runtime, auth: { ...runtime.auth, verify } }, { port: 0 });
    return {
      version: project.version,
      url: backend.url.origin,
      stop,
      token: (subject: string) =>
        new SignJWT({})
          .setProtectedHeader({ alg: "ES256" })
          .setIssuer(issuer)
          .setSubject(subject)
          .setIssuedAt()
          .setExpirationTime("1h")
          .sign(keys.privateKey),
    };
  } catch (cause) {
    await stop();
    throw cause;
  }
}
