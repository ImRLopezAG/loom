import { expect, test } from "bun:test";
import { initializeProject, generateProject, assertGeneratedVersion, readMigrations, planRelease } from "@loom/tooling";
import { mkdtemp, mkdir, readFile, readlink, rm, symlink, access, writeFile, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("initialization creates a consumer and preserves existing user files", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-init-"));
  try {
    expect(await initializeProject(root, "tasks")).toContain("backend/schema.ts");
    const before = await readFile(join(root, "backend/schema.ts"), "utf8");
    await expect(initializeProject(root, "tasks")).rejects.toThrow("overwrite");
    expect(await readFile(join(root, "backend/schema.ts"), "utf8")).toBe(before);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("initialization refuses a backend symlink outside the project", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-init-"));
  const outside = await mkdtemp(join(tmpdir(), "loom-external-"));
  try {
    await mkdir(join(outside, "functions"));
    await symlink(outside, join(root, "backend"));
    await expect(initializeProject(root, "tasks")).rejects.toThrow("escape");
    await expect(access(join(outside, "schema.ts"))).rejects.toThrow();
  } finally { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); }
});

test("offline generation is deterministic, detects stale contracts and keeps internal references out of the browser API", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-generate-"));
  try {
    await initializeProject(root, "tasks");
    await mkdir(join(root, "node_modules/@loom"), { recursive: true });
    for (const name of ["@loom/core", "@loom/tooling", "valibot"]) {
      await symlink(await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))), join(root, "node_modules", name));
    }
    const tasksFile = join(root, "backend/functions/tasks.ts");
    await writeFile(tasksFile, await readFile(tasksFile, "utf8") + '\nimport { internalAction } from "@loom/core/server";\nexport const secret = internalAction({ args: v.object({}), returns: v.null(), handler: () => null });\nexport const helper = () => "not an endpoint";\n');
    const first = await generateProject(root);
    expect(first.functions.map((entry) => entry.name)).toEqual(["tasks:list", "tasks:secret"]);
    expect((await generateProject(root)).version).toBe(first.version);
    const api = await readFile(join(root, "backend/_generated/current/api.js"), "utf8");
    expect(api).not.toContain("tasks:secret");
    expect(await readFile(join(root, "backend/_generated/current/internal.js"), "utf8")).toContain("tasks:secret");
    await writeFile(join(root, "backend/consumer.ts"), 'import { api } from "./_generated/api.js";\nconst name: string = api["tasks:list"].name;\n// @ts-expect-error internal functions are absent from public references\napi["tasks:secret"];\nvoid name;\n');
    const tsc = Bun.spawn([fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "--project", join(root, "tsconfig.json")], { stdout: "pipe", stderr: "pipe" });
    const diagnostics = await new Response(tsc.stdout).text() + await new Response(tsc.stderr).text();
    expect(diagnostics).toBe("");
    expect(await tsc.exited).toBe(0);
    const browser = await Bun.build({ entrypoints: [join(root, "backend/_generated/api.js")], target: "browser" });
    expect(browser.success).toBe(true);
    const browserCode = await browser.outputs[0]?.text();
    expect(browserCode).toContain("tasks:list");
    expect(browserCode).not.toContain("tasks:secret");
    expect(browserCode).not.toContain("@loom/core/server");
    const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
    const doctor = Bun.spawn([process.execPath, cli, "doctor", "--cwd", root, "--json"], { stdout: "pipe", stderr: "pipe" });
    expect(await new Response(doctor.stdout).text()).toContain('"ok":true');
    expect(await new Response(doctor.stderr).text()).toBe("");
    expect(await doctor.exited).toBe(0);
    for (const args of [["schema", "diff"], ["migrations", "generate", "--name", "initial"]]) {
      const child = Bun.spawn([process.execPath, cli, ...args, "--cwd", root, "--json"], { stdout: "pipe", stderr: "pipe" });
      expect(await new Response(child.stderr).text()).toBe("");
      const output = await new Response(child.stdout).text();
      expect(output.startsWith('{"ok":true')).toBe(true);
      expect(await child.exited).toBe(0);
    }
    expect(await readMigrations(root, "migrations")).toHaveLength(1);
    expect((await planRelease(root)).statements).toEqual([]);
    await assertGeneratedVersion(root, first.version);
    const active = join(root, "backend/_generated/current");
    const beforeFailure = await readlink(active);
    const tasksSource = await readFile(tasksFile, "utf8");
    await writeFile(tasksFile, "export const broken = ;");
    await expect(generateProject(root)).rejects.toThrow();
    expect(await readlink(active)).toBe(beforeFailure);
    await writeFile(tasksFile, tasksSource);
    await writeFile(tasksFile, (await readFile(tasksFile, "utf8")).replace('"not an endpoint"', '"changed helper"'));
    await expect(assertGeneratedVersion(root, first.version)).rejects.toThrow("stale");
    expect((await generateProject(root)).version).not.toBe(first.version);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("CLI produces matching structured/human failures without leaking executable config errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-doctor-"));
  const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
  try {
    await writeFile(join(root, "loom.config.ts"), 'throw new Error("secret-sentinel-do-not-print"); export default {};');
    const outputs = [];
    for (const flags of [[], ["--json"]]) {
      const child = Bun.spawn([process.execPath, cli, "doctor", "--cwd", root, ...flags], { stdout: "pipe", stderr: "pipe" });
      outputs.push(await new Response(child.stderr).text());
      expect(await child.exited).toBe(3);
      expect(await new Response(child.stdout).text()).toBe("");
    }
    expect(outputs[0]).toContain("PROJECT_INVALID");
    expect(outputs[1]).toContain('"code":"PROJECT_INVALID"');
    expect(outputs.join("")).not.toContain("secret-sentinel");
    const missing = Bun.spawn([process.execPath, cli, "init", "--cwd", root, "--json"], { stdout: "pipe", stderr: "pipe" });
    expect(await new Response(missing.stderr).text()).toContain("MISSING_VALUE");
    expect(await missing.exited).toBe(2);
    const extra = Bun.spawn([process.execPath, cli, "doctor", "extra", "unexpected", "--json"], { stdout: "pipe", stderr: "pipe" });
    expect(await new Response(extra.stderr).text()).toContain('"code":"USAGE"');
    expect(await extra.exited).toBe(2);
  } finally { await rm(root, { recursive: true, force: true }); }
});
