import pg from "pg";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

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

function connectionValue(value: string): string {
  return "'" + value.replaceAll("\\", "\\\\").replaceAll("'", "\\'") + "'";
}

/** Own disposable remote database on the supplied fixture branch; never a shared or protected catalog. */
export async function withDblinkRemote(
  adminUrl: string,
  work: (remote: {
    readonly name: string;
    readonly connstr: (user: string, password: string) => string;
  }) => Promise<void>,
): Promise<void> {
  const admin = new pg.Client({ connectionString: adminUrl });
  const name = `loom_ext_${crypto.randomUUID().replaceAll("-", "")}`;
  try {
    await admin.connect();
    let attempted = false;
    try {
      recordFixture("attempted", name);
      attempted = true;
      await admin.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
      recordFixture("created", name);
      const remoteUrl = new URL(adminUrl);
      remoteUrl.pathname = `/${name}`;
      const remote = new pg.Client({ connectionString: remoteUrl.href });
      try {
        await remote.connect();
        await remote.query("CREATE TABLE items(id integer PRIMARY KEY, label text NOT NULL)");
        await remote.query("INSERT INTO items VALUES (1, 'alpha'), (2, 'beta')");
      } finally {
        await remote.end();
      }
      const local = ["127.0.0.1", "localhost"].includes(remoteUrl.hostname);
      await work({
        name,
        connstr: (user, password) =>
          Object.entries({
            host: local ? "127.0.0.1" : remoteUrl.hostname,
            port: local ? "5432" : remoteUrl.port || "5432",
            dbname: name,
            user,
            password,
            sslmode: local ? "prefer" : "require",
          })
            .map(([key, value]) => `${key}=${connectionValue(value)}`)
            .join(" "),
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
