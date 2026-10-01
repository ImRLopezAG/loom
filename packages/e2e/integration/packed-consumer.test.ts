import assert from "node:assert/strict";
import { test } from "bun:test";
import { access, cp, mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("fresh workspace installation links the CLI before compiled output exists", async () => {
  const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
  const manifest = await Bun.file(join(source, "package.json")).json();
  const root = await mkdtemp(join(tmpdir(), "loom-workspace-bin-"));
  try {
    await mkdir(join(root, "apps/loom"), { recursive: true });
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ private: true, workspaces: ["apps/*"], dependencies: { loom: "workspace:*" } }),
    );
    await writeFile(
      join(root, "apps/loom/package.json"),
      JSON.stringify({ name: manifest.name, version: manifest.version, bin: manifest.bin, type: "module" }),
    );
    // Copy committed package files, with no prebuilt dist output.
    if (manifest.bin.loom.startsWith("./bin/") && (await Bun.file(join(source, manifest.bin.loom)).exists())) {
      await mkdir(join(root, "apps/loom/bin"), { recursive: true });
      await cp(join(source, manifest.bin.loom), join(root, "apps/loom", manifest.bin.loom));
    }
    const child = Bun.spawn(["bun", "install", "--ignore-scripts"], {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 60000,
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(code, 0, `${stdout}\n${stderr}`);
    await access(join(root, "node_modules/.bin/loom"));
    assert.equal(await Bun.file(join(root, "apps/loom/dist/cli.js")).exists(), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("packed tooling preserves migration and bucket privacy patches without consumer configuration", async () => {
  const publicManifest = await Bun.file(new URL("../../../apps/loom/package.json", import.meta.url)).json();
  assert.equal(publicManifest.name, "loom");
  assert.equal(publicManifest.version, "0.0.0");
  assert.equal(publicManifest.bin.loom, "./bin/loom.js");
  assert(!Object.keys(publicManifest.dependencies).some((name) => name.startsWith("@loom/")));
  const root = await mkdtemp(join(tmpdir(), "loom-packed-consumer-"));
  async function run(command: string[], cwd = root) {
    const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 60000 });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(code, 0, `${command.join(" ")}\n${stdout}\n${stderr}`);
    return stdout;
  }
  try {
    await run(
      ["bun", "pm", "pack", "--filename", join(root, "loom.tgz"), "--ignore-scripts"],
      fileURLToPath(new URL("../../../apps/loom/", import.meta.url)),
    );
    const entries = (await run(["tar", "-tzf", join(root, "loom.tgz")])).trim().split("\n");
    assert(
      entries.every(
        (path) => path === "package/package.json" || path.startsWith("package/dist/") || path === "package/bin/loom.js",
      ),
    );
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: { loom: "file:./loom.tgz" },
        devDependencies: { "@types/node": "24.13.6" },
      }),
    );
    await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
    await run(["bun", "install", "--ignore-scripts", "--frozen-lockfile"]);
    const frontend = join(root, "frontend");
    await mkdir(frontend);
    await writeFile(join(frontend, "package.json"), '{"name":"existing-next","private":true}\n');
    const executable = join(root, "node_modules/.bin/loom");
    const preview = JSON.parse(await run([executable, "integrate", "--cwd", frontend, "--json"]));
    assert.equal(preview.applied, false);
    assert(preview.files.includes("loom/app.config.ts"));
    const integrated = JSON.parse(await run([executable, "integrate", "--cwd", frontend, "--apply", "--json"]));
    assert.equal(integrated.applied, true);
    assert.equal(await readFile(join(frontend, "package.json"), "utf8"), '{"name":"existing-next","private":true}\n');
    assert.deepEqual(
      JSON.parse(await run([executable, "integrate", "--cwd", frontend, "--apply", "--json"])).files,
      [],
    );
    await run([executable, "generate", "--cwd", frontend]);
    const proposed = JSON.parse(
      await run([
        executable,
        "create",
        "--cwd",
        root,
        "--name",
        "preview",
        "--region",
        "aws-us-east-1",
        "--dry-run",
        "--json",
      ]),
    );
    assert.equal(proposed.dryRun, true);
    assert.match(await readFile(join(root, "node_modules/loom/dist/cli.js"), "utf8"), /^#!\/usr\/bin\/env bun/);
    assert.match(await readFile(join(root, "node_modules/loom/dist/core/react/index.js"), "utf8"), /^"use client";/);
    await writeFile(
      join(root, "without-react.mjs"),
      `
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { realpathSync, rmSync } from "node:fs";
import { dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
// Neon SDK peers can install React; remove it to prove backend exports work without it.
try {
  const react = dirname(realpathSync(require.resolve("react/package.json")));
  assert(react.startsWith(dirname(fileURLToPath(import.meta.url)) + sep));
  rmSync(react, { recursive: true });
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") throw error;
}
assert.throws(() => import.meta.resolve("react"));
await import("loom/client");
await import("loom/contract");
await import("loom/server");
`,
    );
    await run(["node", "without-react.mjs"]);
    for (const name of [
      "README.md",
      "neon-config.LICENSE",
      "neon-config-runtime.LICENSE",
      "drizzle-kit@1.0.0-rc.4.patch",
      "@neon%2Fconfig@1.7.3.patch",
    ]) {
      assert((await readFile(join(root, "node_modules/loom/dist/third-party", name), "utf8")).length > 0);
    }
    await writeFile(
      join(root, "verify.mjs"),
      `import assert from "node:assert/strict";
import { defineSchema, defineTable } from "loom/server";
import { createEffectRuntime, Invocation } from "loom/server";
import { defineContract, resolveContract, oc } from "loom/contract";
import { call, implement } from "@orpc/server";
import { Effect, Layer } from "effect";
import { z } from "zod";
import * as v from "valibot";
import { createSnapshot, planMigration, defineConfig, prepareNeonStorageBuckets } from "loom/tooling";
if (!("Bun" in globalThis)) assert.equal(process.versions.node.split(".")[0], "24");
const contract = resolveContract(defineContract({ hello: oc.input(z.object({ name: z.string() })).output(v.string()) }), { validators: { tables: {}, id: () => v.string() } });
const hello = implement(contract).hello.handler(({ input }) => input.name);
assert.equal(await call(hello, { name: "Loom" }), "Loom");
await assert.rejects(call(hello, { name: 42 }), { code: "BAD_REQUEST" });
await assert.rejects(call(implement(contract).hello.handler(() => 42), { name: "Loom" }), { code: "INTERNAL_SERVER_ERROR" });
const runtime = createEffectRuntime(Layer.empty);
try {
  const owners = await Promise.all(["alice", "bob"].map(subject => runtime.run({ identity: { issuer: "packed", subject }, requestId: subject }, Effect.gen(function* () { return (yield* Invocation).identity.subject; }))));
  assert.deepEqual(owners, ["alice", "bob"]);
} finally { await runtime.stop(); }
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
    await run([join(root, "node_modules/.bin/loom"), "--help"]);
    const login = Bun.spawn([join(root, "node_modules/.bin/loom"), "login", "--json"], {
      cwd: root,
      env: { ...process.env, CI: "true" },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });
    assert.equal(await login.exited, 6);
    assert.equal(JSON.parse(await new Response(login.stderr).text()).error.code, "NEON_LOGIN_REQUIRED");
    const worker = Bun.spawn(["bun", join(root, "node_modules/loom/dist/tooling/neon/credential-worker.js")], {
      cwd: root,
      env: {
        ...process.env,
        CI: "true",
        DEBUG: "",
        LOOM_NEON_CREDENTIAL_REQUEST: JSON.stringify({
          profile: "DEFAULT",
          configDir: join(root, "empty-neon-profile"),
        }),
      },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });
    assert.equal(await worker.exited, 0);
    assert.deepEqual(JSON.parse(await new Response(worker.stdout).text()), { code: "NEON_LOGIN_REQUIRED" });
    await writeFile(
      join(root, "generate-native.mjs"),
      `import assert from "node:assert/strict";
import { initializeProject, generateProject, saveResolvedProject } from "loom/tooling";
await initializeProject("./native", "native");
await saveResolvedProject("./native", {
  format: 1, projectId: "project-fixture", branchId: "br-fixture", branchName: "dev", protected: false, isDefault: false,
  databaseName: "neondb", migrationRole: "neondb_owner", public: { serviceUrl: "https://functions.example.test/service", authUrl: "https://auth.example.test/auth" },
});
const result = await generateProject("./native");
assert.equal(result.protocol, "loom-orpc-2");
const { configuration } = await import("./native/loom/_generated/api.js");
assert.deepEqual(configuration, { serviceUrl: "https://functions.example.test/service", authUrl: "https://auth.example.test/auth" });
await saveResolvedProject("./native", {
  format: 1, projectId: "project-fixture", branchId: "br-fixture", branchName: "dev", protected: false, isDefault: false,
  databaseName: "neondb", migrationRole: "neondb_owner", public: { serviceUrl: "https://functions.example.test/updated" },
});
assert.equal((await generateProject("./native")).version, result.version);
assert.deepEqual(result.procedures, [{path:["tasks","list"],visibility:"public"}]);
const browser = await Bun.build({entrypoints:["./native/loom/_generated/api.js"],target:"browser"});
assert.equal(browser.success, true);
`,
    );
    await run(["bun", "generate-native.mjs"]);
    await run([join(root, "node_modules/.bin/loom"), "generate", "--cwd", join(root, "native")]);
    await run([
      fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
      "-p",
      join(root, "native/tsconfig.json"),
    ]);
    const variants = join(root, "variants");
    await cp(fileURLToPath(new URL("../../examples/integrations/", import.meta.url)), variants, {
      recursive: true,
      filter: (path) =>
        !["node_modules", "_generated", ".loom", ".turbo", "dist", "package.json", "tsconfig.json"].includes(
          path.split("/").at(-1) ?? "",
        ),
    });
    await writeFile(
      join(variants, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ESNext",
          module: "Preserve",
          moduleResolution: "Bundler",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: ["node"],
          exactOptionalPropertyTypes: true,
        },
        include: ["loom/**/*.ts", "types/**/*.ts", "loom.config.ts"],
      }),
    );
    await writeFile(
      join(root, "generate-variants.mjs"),
      'import { generateProject } from "loom/tooling"; await generateProject("./variants");',
    );
    await run(["bun", "generate-variants.mjs"]);
    await run([
      fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
      "-p",
      join(variants, "tsconfig.json"),
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 120000);
