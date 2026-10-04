import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { checkNeonDiskBindings, writeNeonProject, writeNeonSelectionProject } from "../fixtures/neon-generated-project";

test("Neon actual first load, disk generation, RPC/Effect types and exact selection", async () => {
  for (const selection of ["default", "custom", "empty", "unsupported"] as const) {
    const root = await mkdtemp(join(tmpdir(), "loom-neon-generation-"));
    try {
      await initializeProject(root, "neonproof");
      await mkdir(join(root, "node_modules"));
      for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
        await symlink(
          await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
          join(root, "node_modules", name),
        );
      const placement = selection === "custom" ? "neon_custom" : "extensions";
      if (selection === "empty" || selection === "unsupported") await writeNeonSelectionProject(root, selection);
      else await writeNeonProject(root, selection === "custom" ? placement : undefined);
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await loadProject(root);
      const generated = await generateProject(root);
      if (selection === "default" || selection === "custom") await checkNeonDiskBindings(root, placement);
      else {
        const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
        assert(!source.includes("kello/extensions/neon"));
        const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
        if (selection === "empty") assert.equal(disk.extensions, undefined);
        else {
          assert.equal(disk.extensions.neon.version, "0.0.0");
          assert(!("pgClusterSize" in disk.extensions.neon));
        }
      }
      assert.equal((await generateProject(root)).version, generated.version);
      const child = Bun.spawn(
        [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
        { stdout: "pipe", stderr: "pipe" },
      );
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      assert.equal(code, 0, stdout + stderr);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
}, 180000);
