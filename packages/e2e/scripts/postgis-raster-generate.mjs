import assert from "node:assert/strict";
import { copyFile, mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const [workspace, nodeModules, compiler] = process.argv.slice(2);
assert(workspace && nodeModules && compiler, "usage: <owned-workspace> <installed-node-modules> <compiler>");
await mkdir(workspace, { recursive: true });
await symlink(nodeModules, join(workspace, "node_modules"));
const fixture = join(workspace, "public-project.mjs");
await copyFile(new URL("../fixtures/postgis-raster-public-project.mjs", import.meta.url), fixture);
const { generateRasterProjects } = await import(pathToFileURL(fixture).href);
const projects = await generateRasterProjects(join(workspace, "projects"), nodeModules, ["bun", compiler]);
await writeFile(join(workspace, "generation.json"), JSON.stringify(projects, null, 2));
console.log(JSON.stringify({ contexts: projects.length, firstLoadAndDiskGeneration: true }));
