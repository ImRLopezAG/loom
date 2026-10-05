import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const gate = process.argv[2];
assert(
  gate === "unit" || gate === "local-types" || gate === "types" || gate === "generation",
  "Usage: bun packages/e2e/scripts/run-lakebase-tokenizer-local-proof.ts unit|local-types|types|generation",
);
if (gate === "unit" || gate === "local-types") {
  const command =
    gate === "unit"
      ? [root + "packages/tests/node_modules/.bin/vp", "test", "run", "unit/extensions-lakebase-tokenizer.test.ts"]
      : [
          root + "node_modules/.bin/tsc",
          "--noEmit",
          "-p",
          root + "packages/tests/types/lakebase_tokenizer.tsconfig.json",
        ];
  const [binary, ...args] = command;
  assert(binary);
  const child = spawnSync(binary, args, { cwd: gate === "unit" ? root + "packages/tests" : root, encoding: "utf8" });
  process.stdout.write(child.stdout);
  process.stderr.write(child.stderr);
  assert.equal(child.error, undefined);
  process.exitCode = child.status ?? 1;
  console.log(
    "Focused source check only; parent canonical receipts and public generation/consumer gates remain pending.",
  );
} else if (gate === "types") {
  const scratch = await mkdtemp(join(tmpdir(), "loom-tokenizer-public-types-"));
  try {
    await symlink(root + "packages/tests/node_modules", join(scratch, "node_modules"));
    await writeFile(
      join(scratch, "probe.ts"),
      await readFile(root + "packages/e2e/fixtures/lakebase-tokenizer-public-types.ts.fixture", "utf8"),
    );
    await writeFile(
      join(scratch, "tsconfig.json"),
      JSON.stringify({
        extends: root + "packages/ts-config/bun.json",
        compilerOptions: {
          noEmit: true,
          typeRoots: [root + "packages/e2e/node_modules/@types", root + "apps/loom/node_modules/@types"],
        },
        files: [join(scratch, "probe.ts")],
      }),
    );
    const child = spawnSync(root + "node_modules/.bin/tsc", ["--noEmit", "-p", join(scratch, "tsconfig.json")], {
      cwd: root,
      encoding: "utf8",
    });
    process.stdout.write(child.stdout);
    process.stderr.write(child.stderr);
    assert.equal(child.error, undefined);
    process.exitCode = child.status ?? 1;
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
} else {
  const { initializeProject, loadProject, generateProject } = await import("kello/tooling");
  const {
    writeLakebaseTokenizerProject,
    writeLakebaseTokenizerDescriptorProject,
    checkLakebaseTokenizerGeneratedProject,
  } = await import("../fixtures/lakebase-tokenizer-generated-project");
  for (const [name, selection, schema, explicitEmpty] of [
    ["empty", "empty", "extensions", false],
    ["explicit-empty", "empty", "extensions", true],
    ["future", "future", "extensions", false],
    ["selected", "selected", "extensions", false],
    ["custom", "selected", "tokenizer_custom", false],
  ] as const) {
    const scratch = await mkdtemp(join(tmpdir(), `loom-tokenizer-public-${name}-`));
    try {
      await initializeProject(scratch, "tokenizerproject");
      await mkdir(join(scratch, "node_modules"));
      for (const pkg of ["kello", "valibot", "drizzle-orm", "effect", "@orpc/server", "pg"]) {
        await mkdir(dirname(join(scratch, "node_modules", pkg)), { recursive: true });
        await symlink(
          await realpath(join(root, "packages/tests/node_modules", pkg)),
          join(scratch, "node_modules", pkg),
        );
      }
      if (selection === "selected") await writeLakebaseTokenizerProject(scratch, schema);
      else await writeLakebaseTokenizerDescriptorProject(scratch, selection, explicitEmpty);
      await assert.rejects(readFile(join(scratch, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(scratch, "kello/components/tokenizer/_generated/extensions.ts")), {
        code: "ENOENT",
      });
      const first = await loadProject(scratch);
      assert.equal(first.componentScopes.length, 2);
      assert.equal(first.componentScopes.find((scope) => scope.mountPath === "unselected")!.boundExtensions, undefined);
      assert.deepEqual(
        Object.keys(first.componentScopes.find((scope) => scope.mountPath === "tokenizer")!.boundExtensions ?? {}),
        selection === "empty" ? [] : ["lakebase_tokenizer"],
      );
      const generated = await generateProject(scratch);
      await checkLakebaseTokenizerGeneratedProject(scratch, selection, schema, generated.version);
      assert.equal((await generateProject(scratch)).version, generated.version);
      const child = spawnSync(join(root, "node_modules/.bin/tsc"), ["--noEmit", "-p", join(scratch, "tsconfig.json")], {
        cwd: scratch,
        encoding: "utf8",
      });
      assert.equal(child.error, undefined);
      assert.equal(child.status, 0, child.stdout + child.stderr);
      console.log(
        `${name}: real public first-load, host/mounted disk bindings, runtime schema, exact types and repeat generation passed (${generated.version})`,
      );
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  }
  console.log(
    "Public generation subcheck only; native RPC/Effect execution, frozen packed consumer and parent canonical receipts remain pending.",
  );
}
