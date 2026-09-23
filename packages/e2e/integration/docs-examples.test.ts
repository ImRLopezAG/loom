import assert from "node:assert/strict";
import { test } from "bun:test";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("documented authoring examples compile and validate through a packed public API", async () => {
  const examples = fileURLToPath(new URL("../../../apps/docs/examples/", import.meta.url));
  assert.ok((await readFile(join(examples, "schema.ts"), "utf8")).includes("defineSchema"));
  const root = await mkdtemp(join(tmpdir(), "loom-docs-consumer-"));
  async function run(command: string[], cwd = root) {
    const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 60000 });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(code, 0, `${command.join(" ")}\n${stdout}\n${stderr}`);
  }
  try {
    await run(
      ["bun", "pm", "pack", "--filename", join(root, "core.tgz"), "--ignore-scripts"],
      fileURLToPath(new URL("../../core/", import.meta.url)),
    );
    await cp(examples, join(root, "examples"), { recursive: true });
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: {
          "@loom/core": "file:./core.tgz",
          "drizzle-orm": "1.0.0-rc.4",
          valibot: "1.5.0",
          typescript: "7.0.2",
          "@types/node": "24.13.6",
        },
      }),
    );
    await writeFile(
      join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
        },
        include: ["examples/**/*.ts"],
      }),
    );
    await run(["bun", "install", "--ignore-scripts"]);
    await run(["bun", "run", "tsc", "-p", "tsconfig.json"]);
    await writeFile(
      join(root, "verify.ts"),
      `
import assert from "node:assert/strict";
import { schema } from "./examples/schema";
import { relations } from "./examples/relations";
import { auth } from "./examples/auth";
import { greeting } from "./examples/functions";
const insert = schema.validators.tasks.insert["~standard"];
assert.deepEqual(await insert.validate({ title: "  Ship docs  " }), { value: { title: "Ship docs" } });
assert.ok((await insert.validate({ title: " " })).issues);
assert.ok((await insert.validate({ title: "Valid", ownerId: "forged" })).issues);
assert.ok((await schema.validators.tasks.patch["~standard"].validate({ title: undefined })).issues);
const projected = await schema.validators.tasks.public["~standard"].validate({ _id: "00000000-0000-4000-8000-000000000001", title: "Ship", done: false, ownerId: "private-owner" });
assert.deepEqual(projected, { value: { _id: "00000000-0000-4000-8000-000000000001", title: "Ship", done: false } });
assert.ok(relations);
await assert.rejects(auth.authorize({ identity: null, name: "tasks:list", kind: "query", requestId: "docs" }));
const execute = await greeting.prepare({ name: "Ada" });
assert.equal(await execute({ identity: null, requestId: "docs", signal: new AbortController().signal }), "Hello, Ada");
`,
    );
    await run(["bun", "verify.ts"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 120000);
