import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { extensionProofTest } from "../fixtures/extension-proof";
import { pgCronGenerationProofCase } from "../fixtures/pg_cron-proof-cases";
import { pgCronLocalUrl } from "../fixtures/pg_cron";
import {
  writePgCronProject,
  checkPgCronDiskBindings,
  exercisePgCronRpc,
  type PgCronSelection,
} from "../fixtures/pg_cron-generated-project";

extensionProofTest(
  pgCronGenerationProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-pg-cron-generated-"));
    try {
      await mkdir(join(root, "node_modules"));
      for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
        await symlink(
          await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
          join(root, "node_modules", name),
        );
      for (const mode of ["selected", "empty", "unsupported"] as const satisfies readonly PgCronSelection[]) {
        const project = join(root, mode);
        const name = "cron_" + crypto.randomUUID().replaceAll("-", "").slice(0, 16);
        await initializeProject(project, name);
        await writePgCronProject(project, mode, name);
        await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        assert(await loadProject(project), "Genuine virtual first-load failed");
        const generated = await generateProject(project);
        await checkPgCronDiskBindings(project, mode);
        const child = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(project, "tsconfig.json"),
          ],
          { stdout: "pipe", stderr: "pipe" },
        );
        const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
        assert.equal(await child.exited, 0, out + err);
        assert.equal((await generateProject(project)).version, generated.version);
        const { runtimeOptions } = await import(
          pathToFileURL(join(project, ".loom/generations", generated.version, "runtime.js")).href
        );
        await exercisePgCronRpc(runtimeOptions, pgCronLocalUrl(), mode);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  180000,
);
