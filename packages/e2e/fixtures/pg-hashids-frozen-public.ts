import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "./proof-artifact";
import {
  linkPreparedDependencies,
  pgHashidsPublicBypassSource,
  pgHashidsSelections,
  writePgHashidsSelectionSetup,
} from "./pg-hashids-consumer-project";

/** Bun prepares the real generator; a separate cold Node 24 process executes selected runtime bundles. */
export async function runPgHashidsFrozenPublic(consumer: string, archive: string, evidenceRoot: string, node: string) {
  const bytes = readFileSync(archive);
  const artifactSha256 = sha256(bytes);
  const lockSha256 = await consumerLockfileSha256(consumer);
  const installedFiles = await assertInstalledPackageMatchesTarball(consumer, bytes);
  const directory = join(evidenceRoot, `frozen-${randomUUID()}`);
  mkdirSync(directory, { mode: 0o700 });
  const modules = realpathSync(join(consumer, "node_modules"));
  const packageRoot = realpathSync(join(modules, "kello"));
  const require = createRequire(join(consumer, "package.json"));
  const {
    build,
  }: Pick<typeof import("../../../apps/loom/node_modules/esbuild/lib/main.js"), "build"> = require("esbuild");
  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  const before = { artifactSha256, lockSha256, installedFiles };
  writeFileSync(join(directory, "before.json"), JSON.stringify(before, null, 2));
  function execute(command: string[], cwd: string, label: string) {
    const child = spawnSync(command[0]!, command.slice(1), { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    writeFileSync(join(directory, `${label}.log`), (child.stdout ?? "") + (child.stderr ?? ""));
    if (child.error) throw child.error;
    assert.equal(child.status, 0, `${label} failed; evidence at ${directory}`);
    return child.stdout;
  }
  try {
    assert.equal(execute([node, "-p", "process.versions.node.split('.')[0]"], directory, "node-version").trim(), "24");
    writeFileSync(join(directory, "public-bypass.mjs"), pgHashidsPublicBypassSource());
    symlinkSync(modules, join(directory, "node_modules"), "dir");
    execute(["bun", join(directory, "public-bypass.mjs"), packageRoot], directory, "public-bypass");
    for (const selection of pgHashidsSelections) {
      const project = join(directory, selection);
      linkPreparedDependencies(project, packageRoot, modules);
      writePgHashidsSelectionSetup(project, selection);
      execute(["bun", join(project, "setup.mjs")], project, `${selection}-generation`);
      const config = join(directory, `${selection}-tsconfig.json`);
      writeFileSync(
        config,
        JSON.stringify(
          {
            compilerOptions: {
              target: "ES2023",
              module: "Preserve",
              moduleResolution: "Bundler",
              strict: true,
              noEmit: true,
              incremental: false,
              skipLibCheck: true,
              typeRoots: [join(modules, "@types")],
            },
            files: [join(project, "probe.ts"), join(project, "kello.config.ts")].filter((file) => {
              try {
                readFileSync(file);
                return true;
              } catch {
                return false;
              }
            }),
          },
          null,
          2,
        ),
      );
      execute(
        ["bun", join(modules, "typescript/bin/tsc"), "-p", config, "--pretty", "false"],
        project,
        `${selection}-types`,
      );
      execute(
        ["bun", join(modules, "typescript/bin/tsc"), "-p", join(project, "tsconfig.json"), "--pretty", "false"],
        project,
        `${selection}-project-types`,
      );
      const entries: [string, string][] = [[join(project, "probe.ts"), `${selection}-generated-runtime`]];
      if (selection === "default" || selection === "custom")
        entries.push([join(project, "rpc-probe.mjs"), `${selection}-generated-rpc-runtime`]);
      for (const [entry, label] of entries) {
        const output = join(directory, `${label}.mjs`);
        const built = await build({
          entryPoints: [entry],
          bundle: true,
          platform: "node",
          format: "esm",
          target: "node24",
          outfile: output,
          metafile: true,
          external: Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies }),
        });
        const inputs = Object.keys(built.metafile!.inputs);
        assert(!inputs.some((path) => path.includes("/tooling/")), `${label} imported tooling`);
        if (selection === "default" || selection === "custom")
          assert(
            inputs.some((path) => path.endsWith("/adapters/pg-hashids.js")),
            `${label} omitted the compiled pg_hashids adapter`,
          );
        else
          assert(
            !inputs.some((path) => path.endsWith("/adapters/pg-hashids.js")),
            `${label} bundled a callable pg_hashids adapter`,
          );
        writeFileSync(join(directory, `${label}-inputs.json`), JSON.stringify(inputs, null, 2));
        execute([node, output], project, label);
      }
    }
    writeFileSync(
      join(directory, "observation.json"),
      JSON.stringify(
        {
          ...before,
          selections: pgHashidsSelections,
          generationRuntime: "Bun",
          executionRuntime: "cold Node 24",
          nativeSqlExecuted: false,
          nativeAcceptance: "pending",
          canonicalReceipt: false,
        },
        null,
        2,
      ),
    );
  } catch (cause) {
    writeFileSync(
      join(directory, "pending.json"),
      JSON.stringify({ ...before, error: String(cause), nativeSqlExecuted: false, canonicalReceipt: false }, null, 2),
    );
    throw cause;
  } finally {
    assert.equal(sha256(readFileSync(archive)), artifactSha256);
    assert.equal(await consumerLockfileSha256(consumer), lockSha256);
    assert.equal(await assertInstalledPackageMatchesTarball(consumer, bytes), installedFiles);
  }
  return { directory, ...before };
}
