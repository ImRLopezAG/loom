import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const suffix = crypto.randomUUID().replaceAll("-", "");
const container = `loom-dblink-pg18-${suffix}`;
const user = `loom_${suffix.slice(0, 12)}`;
const password = crypto.randomUUID();
const database = `loom_${suffix.slice(0, 12)}`;

function execute(command: string[]) {
  return spawnSync(command[0]!, command.slice(1), {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

const inspected = execute(["docker", "image", "inspect", "postgres:18"]);
assert.equal(inspected.status, 0, "Local postgres:18 image is required for disposable dblink 1.2 native proof");
const started = execute([
  "docker",
  "run",
  "-d",
  "--name",
  container,
  "-e",
  `POSTGRES_USER=${user}`,
  "-e",
  `POSTGRES_PASSWORD=${password}`,
  "-e",
  `POSTGRES_DB=${database}`,
  "-p",
  "127.0.0.1::5432",
  "postgres:18",
]);
assert.equal(started.status, 0, started.stderr);

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    const ready = execute(["docker", "exec", container, "pg_isready", "-U", user, "-d", database]);
    if (ready.status === 0) break;
    if (attempt === 59) throw new Error("Disposable dblink PostgreSQL 18 did not become ready");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  const port = execute(["docker", "port", container, "5432/tcp"]);
  assert.equal(port.status, 0, port.stderr);
  const match = /127\.0\.0\.1:(\d+)/.exec(port.stdout);
  assert(match, `Could not parse published port: ${port.stdout}`);
  const url = new URL(`postgresql://127.0.0.1:${match[1]}/${database}`);
  url.username = user;
  url.password = password;
  const child = spawnSync("bun", ["test", "--timeout", "180000", "packages/e2e/integration/extensions-dblink.test.ts"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1", LOOM_TEST_DATABASE_URL: url.href },
    maxBuffer: 64 * 1024 * 1024,
  });
  if (child.stdout) process.stdout.write(child.stdout.replaceAll(url.href, "[redacted]").replaceAll(password, "[redacted]"));
  if (child.stderr) process.stderr.write(child.stderr.replaceAll(url.href, "[redacted]").replaceAll(password, "[redacted]"));
  assert.equal(child.status, 0, "dblink native oracle failed");
} finally {
  execute(["docker", "rm", "-f", container]);
}
