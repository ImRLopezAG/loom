import { expect, test } from "bun:test";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeProject } from "@loom/tooling";
import pg from "pg";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)("CLI generates, applies and diagnoses migration artifacts without exposing credentials", async () => {
  const suffix = crypto.randomUUID().replaceAll("-", "");
  const namespace = `app_${suffix}`;
  const metadataNamespace = `loom_meta_${suffix}`;
  const runtimeRole = `loom_runtime_${suffix}`;
  const root = await mkdtemp(join(tmpdir(), "loom-migration-cli-"));
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
  async function run(args: string[], exitCode = 0) {
    const child = Bun.spawn([process.execPath, cli, ...args, "--cwd", root, "--json"], { stdout: "pipe", stderr: "pipe" });
    const stdout = await new Response(child.stdout).text();
    const stderr = await new Response(child.stderr).text();
    expect(await child.exited).toBe(exitCode);
    expect(stdout + stderr).not.toContain("loom-local-only");
    if (exitCode === 0) expect(stderr).toBe("");
    return stdout + stderr;
  }
  try {
    await initializeProject(root, "migration-fixture");
    await mkdir(join(root, "node_modules/@loom"), { recursive: true });
    for (const name of ["@loom/core", "@loom/tooling", "valibot"]) {
      await symlink(await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))), join(root, "node_modules", name));
    }
    await writeFile(join(root, "loom.config.ts"), `import { defineConfig } from "@loom/tooling"; export default defineConfig(${JSON.stringify({ project: "migration-fixture", database: { namespace, metadataNamespace, migrationUrlEnv: "LOOM_TEST_DATABASE_URL" } })});`);
    const schemaFile = join(root, "backend/schema.ts");
    await writeFile(schemaFile, (await readFile(schemaFile, "utf8")).replace('namespace: "app"', `namespace: "${namespace}"`));
    expect(await run(["migrations", "apply"], 2)).toContain("MISSING_VALUE");
    expect(await run(["migrations", "apply", "--runtime-role", runtimeRole], 4)).toContain("UNGENERATED_SCHEMA");
    expect(await run(["migrations", "generate", "--name", "initial"])).toContain('"ok":true');
    expect(await run(["migrations", "status"])).toContain('"initialized":false');
    expect(await run(["migrations", "apply", "--runtime-role", runtimeRole])).toContain('"database":"postgres"');
    expect(await run(["migrations", "status"])).toContain('"pending":[]');
    await admin.query(`ALTER TABLE "${namespace}".tasks ADD COLUMN external_change text`);
    expect(await run(["migrations", "status"], 4)).toContain("LIVE_DRIFT");
    expect(await run(["migrations", "apply", "--runtime-role", runtimeRole], 4)).toContain("INCONSISTENT_DATABASE");
  } finally {
    await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
    await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
    await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
    await admin.end();
    await rm(root, { recursive: true, force: true });
  }
});
