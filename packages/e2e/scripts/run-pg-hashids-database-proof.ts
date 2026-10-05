import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const pinned = {
  "hashids.c": "b9ec39c8e279bc912556ff7877b741a4848c140bfc0e7e7a36745cd9263c30c9",
  "hashids.h": "f1ab31282ce9c1771e00c682319caa0ec1bdc44e7dffd3efc545a0b707940bf7",
  "pg_hashids.c": "75dbf2fdbf24230af6ef3f2b8fce7e5b9390a490f7fbcd8c737ec00f30ef6486",
  "pg_hashids.control": "6b5ad0dec635eb2a6f12cb6fae9d4fb76170e12518cc40f211781c7522842fbe",
  Makefile: "739ec70d72674fd88814fb261dc8e1b296706efc118ac8433b0582434bdc0391",
  "pg_hashids--1.2.1.sql": "966899d7f89e602a54219bf8de651970eb04e906c7c44af4b048e2bef07bf102",
  "pg_hashids--1.2.sql": "4379b17b43fa273b7cecac31886bd2f20abe654b3f4430b348bb2f38971473d0",
  "pg_hashids--1.1--1.2.sql": "4379b17b43fa273b7cecac31886bd2f20abe654b3f4430b348bb2f38971473d0",
  "pg_hashids--1.0--1.1.sql": "4379b17b43fa273b7cecac31886bd2f20abe654b3f4430b348bb2f38971473d0",
} as const;

function execute(command: string[], cwd?: string, env?: NodeJS.ProcessEnv) {
  const child = spawnSync(command[0]!, command.slice(1), {
    cwd,
    env: env ?? process.env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (child.error) throw child.error;
  return child;
}

async function fetchPinned(directory: string) {
  for (const [name, expected] of Object.entries(pinned)) {
    const response = await fetch(`https://raw.githubusercontent.com/iCyberon/pg_hashids/v1.2.1/${name}`);
    assert.equal(response.ok, true, `Failed to fetch ${name}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected, `${name} digest drifted from v1.2.1`);
    writeFileSync(join(directory, name), bytes);
  }
}

function dockerAvailable() {
  return execute(["docker", "image", "inspect", "postgres:18"]).status === 0;
}

const bakedImage = "loom-pg-hashids-pg18:1.2.1";

async function provisionDisposable(): Promise<{ url: string; cleanup: () => void }> {
  assert(dockerAvailable(), "Local postgres:18 image is required to compile disposable pg_hashids 1.2.1");
  const name = `loom-hashids-pg18-${process.pid}`;
  const image = execute(["docker", "image", "inspect", bakedImage]).status === 0 ? bakedImage : "postgres:18";
  const started = execute([
    "docker",
    "run",
    "-d",
    "--name",
    name,
    "-e",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "-e",
    "POSTGRES_USER=loom",
    "-e",
    "POSTGRES_PASSWORD=loom",
    "-e",
    "POSTGRES_DB=loom",
    "-p",
    "127.0.0.1::5432",
    image,
  ]);
  assert.equal(started.status, 0, started.stderr);
  const cleanup = () => {
    execute(["docker", "rm", "-f", name]);
  };
  try {
    for (let attempt = 0; attempt < 60; attempt++) {
      const ready = execute(["docker", "exec", name, "pg_isready", "-U", "loom"]);
      if (ready.status === 0) break;
      if (attempt === 59) throw new Error("Disposable PostgreSQL 18 did not become ready");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    }
    if (image === "postgres:18") {
      const source = mkdtempSync(join(tmpdir(), "loom-pg-hashids-src-"));
      await fetchPinned(source);
      const copied = execute(["docker", "cp", source, `${name}:/tmp/pg_hashids`]);
      assert.equal(copied.status, 0, copied.stderr);
      const build = execute([
        "docker",
        "exec",
        "-u",
        "root",
        name,
        "bash",
        "-lc",
        "apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends build-essential postgresql-server-dev-18 && cd /tmp/pg_hashids && make && make install",
      ]);
      writeFileSync(join(source, "build.log"), build.stdout + build.stderr, { mode: 0o600 });
      assert.equal(build.status, 0, `pg_hashids 1.2.1 failed to compile; diagnostic retained in ${source}`);
      const commit = execute(["docker", "commit", name, bakedImage]);
      assert.equal(commit.status, 0, commit.stderr);
    }
    const port = execute(["docker", "port", name, "5432/tcp"]);
    assert.equal(port.status, 0, port.stderr);
    const match = /127\.0\.0\.1:(\d+)/.exec(port.stdout);
    assert(match, `Could not parse published port: ${port.stdout}`);
    return { url: `postgres://loom@127.0.0.1:${match[1]}/loom`, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}

const supplied = process.env.LOOM_TEST_DATABASE_URL;
const disposable = supplied ? null : await provisionDisposable();
const url = supplied ?? disposable!.url;
const child = execute(
  ["bun", "test", "--timeout", "180000", "packages/e2e/integration/extensions-pg-hashids.test.ts"],
  root,
  { ...process.env, CI: "1", LOOM_TEST_DATABASE_URL: url },
);
process.stdout.write(child.stdout);
process.stderr.write(child.stderr);
disposable?.cleanup();
assert.equal(child.status, 0, "pg_hashids native oracle failed");
