import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const pgRepackTarballDigest = "4516cad42251ed3ad53ff619733004db47d5755acac83f75924cd94d1c4fb681";
export const pgRepackBakedImage = "loom-pg_repack-pg18:1.5.2";
const tarballUrl = "https://github.com/reorg/pg_repack/archive/refs/tags/ver_1.5.2.tar.gz";

function execute(command: string[], cwd?: string) {
  return spawnSync(command[0]!, command.slice(1), {
    cwd,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function requireStatus(child: ReturnType<typeof execute>, message: string) {
  assert.equal(child.status, 0, `${message}\n${child.stdout}\n${child.stderr}`);
  return child;
}

export function resolvePgRepackTarball(): string {
  const cached = "/tmp/loom-pg_repack-src-6I7g/pg_repack-1.5.2.tar.gz";
  const path = existsSync(cached) ? cached : join(tmpdir(), "loom-pg_repack-1.5.2.tar.gz");
  if (!existsSync(path)) {
    const download = execute(["curl", "-fsSL", "-o", path, tarballUrl]);
    requireStatus(download, "Failed to download pinned pg_repack 1.5.2 tarball");
  }
  const digest = createHash("sha256").update(readFileSync(path)).digest("hex");
  assert.equal(digest, pgRepackTarballDigest, "pg_repack 1.5.2 tarball digest drifted");
  return path;
}

export function bakePgRepackImage(): void {
  if (execute(["docker", "image", "inspect", pgRepackBakedImage]).status === 0) return;
  assert.equal(execute(["docker", "image", "inspect", "postgres:18"]).status, 0, "Local postgres:18 image is required");
  const tarball = resolvePgRepackTarball();
  const name = `loom-pg_repack-bake-${crypto.randomUUID().replaceAll("-", "")}`;
  requireStatus(
    execute(["docker", "run", "-d", "--name", name, "--entrypoint", "sleep", "postgres:18", "infinity"]),
    "Failed to start bake container",
  );
  try {
    requireStatus(execute(["docker", "cp", tarball, `${name}:/tmp/pg_repack-1.5.2.tar.gz`]), "Failed to copy tarball");
    const build = execute([
      "docker",
      "exec",
      "-u",
      "root",
      name,
      "bash",
      "-lc",
      [
        "set -euo pipefail",
        "apt-get update",
        "DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends build-essential postgresql-server-dev-18 ca-certificates libzstd-dev liblz4-dev zlib1g-dev libreadline-dev libnuma-dev",
        "mkdir -p /tmp/pg_repack-src",
        "tar -xzf /tmp/pg_repack-1.5.2.tar.gz -C /tmp/pg_repack-src",
        "cd /tmp/pg_repack-src/pg_repack-ver_1.5.2",
        "make",
        "make install",
        "test -x /usr/lib/postgresql/18/bin/pg_repack",
        "/usr/lib/postgresql/18/bin/pg_repack --version",
      ].join(" && "),
    ]);
    requireStatus(build, `pg_repack 1.5.2 failed to compile\n${build.stdout}\n${build.stderr}`);
    requireStatus(execute(["docker", "commit", name, pgRepackBakedImage]), "Failed to commit baked image");
  } finally {
    execute(["docker", "rm", "-f", name]);
  }
}

export function writePgRepackClientWrapper(container: string): string {
  const directory = join(tmpdir(), `loom-pg_repack-client-${container}`);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const binary = join(directory, "pg_repack");
  writeFileSync(
    binary,
    `#!/usr/bin/env node
import { spawnSync } from "node:child_process";
const container = process.env.LOOM_PG_REPACK_CONTAINER;
if (!container) throw new Error("LOOM_PG_REPACK_CONTAINER is required for the aligned client wrapper");
const args = process.argv.slice(2);
const rewritten = [];
for (let index = 0; index < args.length; index++) {
  const arg = args[index];
  if (arg === "-h" || arg === "--host") {
    rewritten.push("-h", "127.0.0.1");
    index += 1;
    continue;
  }
  if (arg === "-p" || arg === "--port") {
    rewritten.push("-p", "5432");
    index += 1;
    continue;
  }
  rewritten.push(arg);
}
const child = spawnSync("docker", ["exec", "-e", "PGPASSWORD=" + (process.env.PGPASSWORD ?? ""), container, "/usr/lib/postgresql/18/bin/pg_repack", ...rewritten], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
process.stdout.write(child.stdout);
process.stderr.write(child.stderr);
process.exit(child.status ?? 1);
`,
    { mode: 0o700 },
  );
  chmodSync(binary, 0o700);
  return binary;
}

export async function withPgRepackDatabase<Result>(
  work: (fixture: { readonly url: string; readonly binary: string; readonly container: string }) => Promise<Result>,
): Promise<Result> {
  bakePgRepackImage();
  const suffix = crypto.randomUUID().replaceAll("-", "");
  const container = `loom-pg_repack-pg18-${suffix}`;
  requireStatus(
    execute([
      "docker",
      "run",
      "-d",
      "--name",
      container,
      "-e",
      "POSTGRES_HOST_AUTH_METHOD=trust",
      "-e",
      "POSTGRES_USER=loom",
      "-e",
      "POSTGRES_DB=loom",
      "-p",
      "127.0.0.1::5432",
      "--entrypoint",
      "docker-entrypoint.sh",
      pgRepackBakedImage,
      "postgres",
    ]),
    "Failed to start pg_repack fixture",
  );
  try {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (execute(["docker", "exec", container, "pg_isready", "-U", "loom", "-d", "loom"]).status === 0) break;
      if (attempt === 59) throw new Error("Disposable pg_repack PostgreSQL 18 did not become ready");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    }
    const port = requireStatus(execute(["docker", "port", container, "5432/tcp"]), "Failed to read published port");
    const match = /127\.0\.0\.1:(\d+)/.exec(port.stdout);
    assert(match, `Could not parse published port: ${port.stdout}`);
    const url = `postgres://loom@127.0.0.1:${match[1]}/loom`;
    const { default: pg } = await import("pg");
    for (let attempt = 0; attempt < 30; attempt++) {
      const probe = new pg.Client({ connectionString: url });
      try {
        await probe.connect();
        await probe.query("SELECT 1");
        await probe.end();
        break;
      } catch (cause) {
        await probe.end().catch(() => undefined);
        if (attempt === 29) throw cause;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
      }
    }
    process.env.LOOM_PG_REPACK_CONTAINER = container;
    return await work({
      url,
      binary: writePgRepackClientWrapper(container),
      container,
    });
  } finally {
    execute(["docker", "rm", "-f", container]);
    if (process.env.LOOM_PG_REPACK_CONTAINER === container) delete process.env.LOOM_PG_REPACK_CONTAINER;
  }
}
