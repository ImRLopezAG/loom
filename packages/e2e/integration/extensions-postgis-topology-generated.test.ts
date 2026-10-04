import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import {
  postgisTopologyGeneratedSchema,
  postgisTopologyGeneratedTypeProof,
} from "../fixtures/postgis-topology-generated-project";
import { extensionProofTest } from "../fixtures/extension-proof";
import { postgisTopologyGenerationProofCase } from "../fixtures/postgis-topology-proof-cases";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_topology.json";

extensionProofTest(
  postgisTopologyGenerationProofCase,
  async () => {
    for (const placement of ["extensions", "spatial"]) {
      const root = await mkdtemp(join(tmpdir(), "loom-topology-generation-"));
      try {
        await initializeProject(root, "topologyproof");
        await rm(join(root, "kello/functions/tasks.ts"));
        await rm(join(root, "kello/contracts/tasks.ts"));
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        await writeFile(
          join(root, "kello.config.ts"),
          `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { postgis: { version: "3.6.4", schema: ${JSON.stringify(placement)} }, postgis_topology: { version: "3.6.4", schema: "topology" } } } });`,
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
        );
        await writeFile(join(root, "kello/schema.ts"), postgisTopologyGeneratedSchema(placement));
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        assert(await loadProject(root));
        const first = await generateProject(root);
        const generated = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
        assert.deepEqual(Object.keys(generated.extensions), ["postgis", "postgis_topology"]);
        assert.equal(generated.extensions.postgis_topology.apiSupport.digest, manifest.digest);
        assert.equal(Object.keys(generated.extensions.postgis_topology.sql.overloads).length, 41);
        assert.equal(Object.keys(generated.extensions.postgis_topology.sql.casts).length, 2);
        assert.equal((await generateProject(root)).version, first.version);
        const disk = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
        assert(disk.includes('from "kello/extensions/postgis-topology"'));
        assert(!disk.includes("/tooling/") && !disk.includes("postgis-sfcgal"));
        await writeFile(join(root, "kello/topology-types.ts"), postgisTopologyGeneratedTypeProof);
        const child = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(root, "tsconfig.json"),
          ],
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
  },
  120000,
);
