import pg from "pg";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

type RemoteOptions = { host: string; port: string; dbname: string; sslmode: string };
function recordFixture(kind: "attempted" | "created" | "dropped" | "drop-failed", name: string) {
  const output = process.env.LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT;
  if (!output) return;
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  assert(runId);
  appendFileSync(
    output,
    JSON.stringify({ runId, kind, name, sha256: createHash("sha256").update(name).digest("hex") }) + "\n",
    { mode: 0o600 },
  );
}

/** Own disposable remote database on the supplied fixture branch; never a shared or protected catalog. */
export async function withPostgresFdwRemote(
  adminUrl: string,
  work: (remote: { readonly name: string; readonly options: RemoteOptions }) => Promise<void>,
): Promise<void> {
  const admin = new pg.Client({ connectionString: adminUrl });
  const name = `loom_fdw_r_${crypto.randomUUID().replaceAll("-", "")}`;
  try {
    await admin.connect();
    const remoteUrl = new URL(adminUrl);
    remoteUrl.pathname = `/${name}`;
    let attempted = false;
    try {
      recordFixture("attempted", name);
      attempted = true;
      await admin.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
      recordFixture("created", name);
      const remote = new pg.Client({ connectionString: remoteUrl.href });
      try {
        await remote.connect();
        await remote.query("CREATE TABLE items(id integer PRIMARY KEY, label text NOT NULL)");
        await remote.query("INSERT INTO items VALUES (1, 'alpha'), (2, 'beta')");
      } finally {
        await remote.end();
      }
      // Local Docker servers reach their own port inside the container. Managed fixtures use the supplied direct
      // endpoint, requesting password authentication over TLS rather than the compute's trusted loopback socket.
      const local = ["127.0.0.1", "localhost"].includes(remoteUrl.hostname);
      await work({
        name,
        options: {
          host: local ? "127.0.0.1" : remoteUrl.hostname,
          port: local ? "5432" : remoteUrl.port || "5432",
          dbname: name,
          sslmode: local ? "prefer" : "require",
        },
      });
    } finally {
      await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`).then(
        () => {
          if (attempted) recordFixture("dropped", name);
        },
        (error) => {
          if (attempted) recordFixture("drop-failed", name);
          throw error;
        },
      );
    }
  } finally {
    await admin.end();
  }
}

export function postgresFdwLoopbackSql(remote: RemoteOptions, user: string, password: string): string {
  const option = (value: string) => value.replaceAll("'", "''");
  return [
    `CREATE SERVER loopback FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host '${option(remote.host)}', port '${option(remote.port)}', dbname '${option(remote.dbname)}', sslmode '${option(remote.sslmode)}')`,
    `CREATE USER MAPPING FOR CURRENT_USER SERVER loopback OPTIONS (user '${option(user)}', password '${option(password)}')`,
    `CREATE FOREIGN TABLE remote_items(id integer, label text) SERVER loopback OPTIONS (schema_name 'public', table_name 'items')`,
  ].join("; ");
}
