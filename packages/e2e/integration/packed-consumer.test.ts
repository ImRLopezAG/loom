import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("packed tooling preserves migration and bucket privacy patches without consumer configuration", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-packed-consumer-"));
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
    for (const name of ["core", "tooling"])
      await run(
        ["bun", "pm", "pack", "--filename", join(root, `${name}.tgz`), "--ignore-scripts"],
        fileURLToPath(new URL(`../../${name}/`, import.meta.url)),
      );
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        overrides: { "@loom/core": "file:./core.tgz" },
        dependencies: { "@loom/core": "file:./core.tgz", "@loom/tooling": "file:./tooling.tgz" },
      }),
    );
    await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
    await run(["bun", "install", "--ignore-scripts", "--frozen-lockfile"]);
    for (const name of [
      "README.md",
      "neon-config.LICENSE",
      "neon-config-runtime.LICENSE",
      "drizzle-kit@1.0.0-rc.4.patch",
      "@neon%2Fconfig@1.7.3.patch",
    ]) {
      assert((await readFile(join(root, "node_modules/@loom/tooling/dist/third-party", name), "utf8")).length > 0);
    }
    await writeFile(
      join(root, "verify.mjs"),
      `import assert from "node:assert/strict";
import { defineSchema, defineTable } from "@loom/core/server";
import { createSnapshot, planMigration, defineConfig, prepareNeonStorageBuckets } from "@loom/tooling";
if (!("Bun" in globalThis)) assert.equal(process.versions.node.split(".")[0], "24");
const before = await createSnapshot(defineSchema(s => ({ notes: defineTable({ title: s.text().notNull() }) }), { namespace: "app" }));
const after = defineSchema(s => ({ notes: defineTable({ heading: s.text().notNull() }) }), { namespace: "app" });
await assert.rejects(planMigration(before, after));
const renamed = await planMigration(before, after, [{type:"rename",kind:"column",from:["app","notes","title"],to:["app","notes","heading"]}]);
assert.match(renamed.statements.join("\\n"), /RENAME COLUMN/);
assert.doesNotMatch(renamed.statements.join("\\n"), /DROP COLUMN/);
const originalFetch = globalThis.fetch;
let access = "private";
let reads = 0;
process.env.NEON_API_KEY = "packed-fixture-only";
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  assert.equal(request.method, "GET");
  assert.equal(request.headers.get("authorization"), "Bearer packed-fixture-only");
  const path = new URL(request.url).pathname;
  if (path.endsWith("/buckets")) { reads += 1; return Response.json({ buckets: [{ name: "uploads", ...(access === "missing" ? {} : { access_level: access }) }] }); }
  if (path.endsWith("/branches")) return Response.json({ branches: [{ id:"br-preview",name:"preview",default:false,protected:false }] });
  if (path.endsWith("/endpoints")) return Response.json({ endpoints: [{ id:"ep-preview",branch_id:"br-preview",type:"read_write",suspend_timeout_seconds:300 }] });
  if (path.endsWith("/projects/project")) return Response.json({ project: { id:"project",name:"example",region_id:"aws-us-east-1",pg_version:18 } });
  throw new Error("Unexpected fixture request");
};
try {
  const config = defineConfig({ project:"example", provider:{projectId:"project",targets:{preview:{branchId:"br-preview",protected:false}}} });
  const options = { config, environment:"preview", buckets:["uploads"] };
  assert.equal((await prepareNeonStorageBuckets(options)).buckets[0].accessLevel, "private");
  for (access of ["public_write", "missing", "public_read"]) {
    const before = reads;
    await assert.rejects(prepareNeonStorageBuckets(options));
    assert(reads > before);
  }
} finally { globalThis.fetch = originalFetch; delete process.env.NEON_API_KEY; }

`,
    );
    await run(["bun", "verify.mjs"]);
    await run(["node", "verify.mjs"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 120000);
