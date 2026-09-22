import { expect, test } from "vite-plus/test";
import { mkdtemp, mkdir, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, resolveProjectPath } from "@loom/tooling";

test("configuration has bounded defaults and rejects unknown settings and protected namespaces", () => {
  expect(defineConfig({ project: "tasks" }).database.postgresVersion).toBe(18);
  expect(defineConfig({ project: "tasks" }).realtime.pollIntervalMs).toBeGreaterThan(0);
  expect(() => defineConfig({ project: "tasks", database: { namespace: "pg_catalog" } })).toThrow();
  expect(() => defineConfig({ project: "tasks", realtime: { pollIntervalMs: 0 } })).toThrow();
  expect(() =>
    defineConfig({ project: "tasks", database: { runtimeUrlEnv: "DATABASE_URL", migrationUrlEnv: "DATABASE_URL" } }),
  ).toThrow("separate");
  const config = { project: "tasks" };
  Object.defineProperty(config, "unexpected", { value: true, enumerable: true });
  expect(() => defineConfig(config)).toThrow();
});

test("project paths reject traversal and symlink escapes without requiring the output to exist", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-config-"));
  const outside = await mkdtemp(join(tmpdir(), "loom-outside-"));
  try {
    await mkdir(join(root, "backend"));
    await symlink(outside, join(root, "linked"));
    expect(await resolveProjectPath(root, "backend/new/file.ts")).toBe(
      join(await realpath(root), "backend/new/file.ts"),
    );
    await expect(resolveProjectPath(root, "../outside")).rejects.toThrow("escape");
    await expect(resolveProjectPath(root, "linked/new/file.ts")).rejects.toThrow("escape");
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
