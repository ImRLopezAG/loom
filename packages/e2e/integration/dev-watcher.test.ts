import { expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, readlink, realpath, symlink, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import { watchDevelopment, initializeProject, prepareProject, activateProject } from "@loom/tooling";

async function until(check: () => boolean): Promise<void> {
  const deadline = Date.now() + 3000;
  while (!check()) {
    if (Date.now() >= deadline) throw new Error("Watcher did not observe the source update");
    await setTimeout(10);
  }
}

test("development watcher observes edits, ignores its artifacts, and stops and restarts cleanly", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-watch-"));
  const source = join(root, "schema.ts");
  const output = join(root, "backend", "_generated");
  await mkdir(output, { recursive: true });
  await writeFile(source, "first");
  const activated: string[] = [];
  const update = async () => {
    const value = await readFile(source, "utf8");
    await writeFile(join(output, "manifest.json"), value);
    activated.push(value);
  };
  const watcher = await watchDevelopment(root, update, { debounceMs: 20 });
  try {
    await watcher.flush();
    expect(activated).toEqual(["first"]);
    await writeFile(source, "second");
    await until(() => activated.includes("second"));
    await watcher.settled();
    const count = activated.length;
    await writeFile(join(output, "manifest.json"), "ignored");
    await setTimeout(100);
    expect(activated).toHaveLength(count);
    await watcher.stop();
    await writeFile(source, "third");
    await setTimeout(100);
    expect(activated).toHaveLength(count);
    const restarted = await watchDevelopment(root, update, { debounceMs: 20 });
    try {
      await restarted.flush();
      expect(activated.at(-1)).toBe("third");
      expect(restarted.watchError).toBeNull();
    } finally {
      await restarted.stop();
    }
  } finally {
    await watcher.stop();
    await rm(root, { recursive: true, force: true });
  }
});

test("watching a consumer preserves generated contracts through a failed edit and recovers on save", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-watch-consumer-"));
  await initializeProject(root, "tasks");
  await mkdir(join(root, "node_modules/@loom"), { recursive: true });
  for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"]) {
    await symlink(
      await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
      join(root, "node_modules", name),
    );
  }
  let activeVersion = "";
  const watcher = await watchDevelopment(
    root,
    async (revision) => {
      const candidate = await prepareProject(root);
      revision.assertCurrent();
      await activateProject(root, candidate.version, revision.signal, () => {
        activeVersion = candidate.version;
      });
    },
    { debounceMs: 20 },
  );
  try {
    await watcher.flush();
    expect(activeVersion).toMatch(/^[a-f0-9]{64}$/);
    const previous = activeVersion;
    const source = join(root, "backend/schema.ts");
    const content = await readFile(source, "utf8");
    await writeFile(source, "export default {");
    await until(() => watcher.failure !== null);
    expect(await readlink(join(root, "backend/_generated/current"))).toBe(previous);
    await writeFile(
      source,
      content.replace("title: s.text().notNull()", "title: s.text().notNull(), description: s.text()"),
    );
    await until(() => activeVersion !== previous);
    await watcher.settled();
    expect(watcher.failure).toBeNull();
    expect(await readlink(join(root, "backend/_generated/current"))).toBe(activeVersion);
  } finally {
    await watcher.stop();
    await rm(root, { recursive: true, force: true });
  }
});
