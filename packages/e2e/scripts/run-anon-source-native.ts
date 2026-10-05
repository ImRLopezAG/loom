import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { anonLocalFixture } from "../fixtures/anon-local-fixture";

// Uses the existing image and parent-built public package, creates UUID databases, and drops only those databases.
const inspected = Bun.spawnSync(["docker", "inspect", anonLocalFixture.container], { stdout: "pipe", stderr: "pipe" });
assert.equal(inspected.exitCode, 0, "Existing anon fixture container is unavailable");
const container = JSON.parse(inspected.stdout.toString())[0];
const port = container.NetworkSettings.Ports["5432/tcp"][0].HostPort;
const password = container.Config.Env.find((entry: string) => entry.startsWith("POSTGRES_PASSWORD="))?.slice(
  "POSTGRES_PASSWORD=".length,
);
const connection = new URL(`postgresql://postgres@127.0.0.1:${port}/postgres`);
if (password) connection.password = password;
const admin = new pg.Client({ connectionString: connection.href });
await admin.connect();
const databases: string[] = [];
try {
  const urls: string[] = [];
  for (const placement of ["extensions", "anon_cache"]) {
    const database = `anon_proof_${randomUUID().replaceAll("-", "")}`;
    await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(database)} TEMPLATE template0`);
    databases.push(database);
    const url = new URL(connection);
    url.pathname = `/${database}`;
    const client = new pg.Client({ connectionString: url.href });
    await client.connect();
    try {
      await client.query(
        `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION anon WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '2.5.1'`,
      );
    } finally {
      await client.end();
    }
    urls.push(url.href);
  }
  const env = { ...process.env, ANON_LOCAL_URL: urls[0]!, ANON_CUSTOM_LOCAL_URL: urls[1]! };
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const child = Bun.spawn(
    [
      "bun",
      "test",
      "packages/e2e/integration/extensions-anon-source-native.test.ts",
      "packages/e2e/integration/extensions-anon.test.ts",
      "packages/e2e/integration/extensions-anon-generated.test.ts",
    ],
    { cwd: root, env, stdout: "pipe", stderr: "pipe" },
  );
  const output = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
  for (const part of output)
    console.log(urls.reduce((text, url) => text.replaceAll(url, "[owned local fixture]"), part));
  assert.equal(await child.exited, 0, "Focused anon native checks failed");
} finally {
  for (const database of databases) await admin.query(`DROP DATABASE ${pg.escapeIdentifier(database)} WITH (FORCE)`);
  await admin.end();
}
