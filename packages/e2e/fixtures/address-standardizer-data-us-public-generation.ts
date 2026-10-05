import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import {
  checkDataUsDiskBindings,
  DATA_US_DIGEST,
  writeDataUsProject,
  type DataUsSelection,
} from "./address-standardizer-data-us-generated-project.ts";

export type DataUsGeneratedProject = { root: string; selection: DataUsSelection; version: string; placement?: string };

/** Actual public initialization, virtual first-load, disk generation and consumer typechecking. No source emitter imports. */
export async function generateDataUsProjects(
  workspace: string,
  nodeModules: string,
  tsc: readonly string[],
): Promise<DataUsGeneratedProject[]> {
  await mkdir(workspace, { recursive: true });
  const results: DataUsGeneratedProject[] = [];
  for (const selection of ["omitted", "empty", "future", "selected", "custom"] as const) {
    const root = join(workspace, selection);
    await initializeProject(root, `dataus-${selection}`);
    await symlink(nodeModules, join(root, "node_modules"));
    const placement = await writeDataUsProject(root, selection);
    await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    if (placement)
      await assert.rejects(readFile(join(root, "kello/components/dataus/_generated/extensions.ts")), {
        code: "ENOENT",
      });
    const first = await loadProject(root);
    if (placement) {
      assert.deepEqual(Object.keys(first.config.database.extensions ?? {}), ["address_standardizer_data_us"]);
      assert.deepEqual(first.config.database.extensions?.address_standardizer_data_us, {
        version: "3.6.4",
        schema: placement,
      });
      assert.equal(first.componentScopes.length, 1);
      assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}), ["address_standardizer_data_us"]);
    }
    const generated = await generateProject(root);
    await checkDataUsDiskBindings(root, placement);
    const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
    if (selection === "omitted" || selection === "empty") {
      assert.equal(disk.extensions, undefined);
      assert.equal(disk.selection, undefined);
    }
    if (selection === "future") {
      assert.deepEqual(Object.keys(disk.extensions), ["address_standardizer_data_us"]);
      assert.equal(disk.extensions.address_standardizer_data_us.version, "future");
      assert.equal(disk.extensions.address_standardizer_data_us.apiSupport.status, "unverified");
      assert.equal("tables" in disk.extensions.address_standardizer_data_us, false);
      const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
      assert(!source.includes("createAddressStandardizerDataUs_3_6_4"));
      assert(!source.includes(DATA_US_DIGEST));
    }
    const checked = spawnSync(tsc[0]!, [...tsc.slice(1), "-p", join(root, "tsconfig.json")], {
      encoding: "utf8",
      cwd: root,
    });
    assert.equal(checked.status, 0, checked.stdout + checked.stderr);
    assert.equal((await generateProject(root)).version, generated.version);
    const project: DataUsGeneratedProject = { root, selection, version: generated.version };
    if (placement !== undefined) project.placement = placement;
    results.push(project);
  }
  return results;
}
