import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { postgresFdwConsumerProofCase } from "../fixtures/postgres_fdw-proof-cases";
import { postgresFdwGeneratedDigest } from "../fixtures/postgres_fdw-generated-project";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { runPostgresFdwGeneratedRuntime } from "../fixtures/postgres_fdw-generated-runtime";

const descriptor = {
  name: "postgres_fdw",
  version: "1.2",
  schema: 'custom"fdw',
  apiSupport: {
    status: "verified",
    digest: postgresFdwGeneratedDigest,
  },
} as const;

const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
const missingExports = [
  "kello/extensions/postgres-fdw",
  "kello/tooling/extensions/postgres-fdw",
  "apps/loom/vite.config.ts entry src/core/extensions/adapters/postgres_fdw.ts",
  "apps/loom/vite.config.ts entry src/tooling/extensions/operations/postgres_fdw.ts",
  "apps/loom/src/tooling/codegen/extensions.ts adapters createPostgresFdw_1_2",
  "apps/loom/src/tooling/migrations/required-api-verification.ts postgres_fdw annotations",
] as const;

extensionProofTest(
  postgresFdwConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-postgres_fdw-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_POSTGRES_FDW_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 180000, env });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      let output = `${stdout}\n${stderr}`;
      if (databaseUrl) {
        const address = new URL(databaseUrl);
        for (const value of [
          databaseUrl,
          address.username,
          address.password,
          address.hostname,
          address.pathname.slice(1),
        ]) {
          if (value)
            output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
        }
        output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      }
      assert.equal(code, 0, `${command.join(" ")}\n${output}`);
      return stdout;
    }
    try {
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
      const packedBytes = await readFile(join(root, "kello.tgz"));
      const packedSha256 = sha256(packedBytes);
      if (retainedArtifactPath !== undefined) {
        await copyFile(join(root, "kello.tgz"), retainedArtifactPath, constants.COPYFILE_EXCL);
        assert.equal(sha256(await readFile(retainedArtifactPath)), packedSha256);
      }
      await run([
        "node",
        "-e",
        "if (process.versions.node.split('.')[0] !== '24') throw new Error('Isolated consumer requires Node 24, not ' + process.version)",
      ]);
      const consumerDependencies = new Map<string, string>([
        ...Object.entries<string>(manifest.dependencies),
        ["kello", "file:./kello.tgz"],
        ["drizzle-orm", manifest.devDependencies["drizzle-orm"]],
      ]);
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          dependencies: Object.fromEntries(consumerDependencies),
          devDependencies: {
            typescript: manifest.devDependencies.typescript,
            "@types/node": manifest.devDependencies["@types/node"],
            "@types/pg": manifest.devDependencies["@types/pg"],
          },
        }),
      );
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      const lockfileSha256 = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
      const packedManifest = JSON.parse(await readFile(join(root, "node_modules/kello/package.json"), "utf8"));
      assert(
        packedManifest.exports?.["./extensions/postgres-fdw"],
        `Missing packed export ./extensions/postgres-fdw. Parent must apply: ${missingExports.join("; ")}`,
      );
      assert(
        packedManifest.exports?.["./tooling/extensions/postgres-fdw"],
        `Missing packed export ./tooling/extensions/postgres-fdw. Parent must apply: ${missingExports.join("; ")}`,
      );
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createPostgresFdw_1_2 } from "kello/extensions/postgres-fdw";
import { withPostgresFdw } from "kello/tooling/extensions/postgres-fdw";
const api = createPostgresFdw_1_2(${JSON.stringify(descriptor)});
assert.equal(api.foreignDataWrapper.name, "postgres_fdw");
assert.equal(api.disconnect.authority, "session");
assert.equal(api.disconnectAll.authority, "session");
assert.deepEqual(Object.keys(api.sql.functions), ["postgres_fdw_get_connections"]);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }])
  assert.throws(() => createPostgresFdw_1_2({ ...api, apiSupport: support }), /exact verified contract/);
await assert.rejects(withPostgresFdw("postgresql://operator@127.0.0.1:1/fixture", { ...api, apiSupport: { status: "unverified" } }, async () => undefined), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import { createPostgresFdw_1_2 } from "kello/extensions/postgres-fdw";
import { withPostgresFdw, type PostgresFdwSession } from "kello/tooling/extensions/postgres-fdw";
const api = createPostgresFdw_1_2(${JSON.stringify(descriptor)});
const schema: 'custom"fdw' = api.schema;
const version: "1.2" = api.version;
const sessionAuthority: "session" = api.disconnect.authority;
api.sql.functions.postgres_fdw_get_connections();
// @ts-expect-error Disconnect is not application SQL.
api.sql.functions.postgres_fdw_disconnect("loopback");
void withPostgresFdw("postgresql://operator/fixture", api, async (session: PostgresFdwSession) => {
  // @ts-expect-error No raw operator client crosses into callback.
  session.client;
  return session.connections();
});
void [schema, version, sessionAuthority];
`,
      );
      await writeFile(
        join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2023",
            module: "Preserve",
            moduleResolution: "Bundler",
            strict: true,
            noEmit: true,
            skipLibCheck: true,
            exactOptionalPropertyTypes: true,
            types: ["node"],
          },
          include: ["probe.ts"],
        }),
      );
      await run(["node", "imports.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
      await writeFile(
        join(root, "selected.ts"),
        `export { createPostgresFdw_1_2 } from "kello/extensions/postgres-fdw";`,
      );
      await writeFile(join(root, "empty.ts"), "export const extensions = undefined;");
      await writeFile(
        join(root, "verify-bundles.mjs"),
        `import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import { build } from "esbuild";
const installed = await realpath("node_modules/kello");
const externals = ${JSON.stringify([...consumerDependencies.keys()].filter((name) => name !== "kello"))};
for (const name of ["selected", "empty"]) {
  const result = await build({
    entryPoints: [name + ".ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    write: false,
    metafile: true,
    external: externals,
  });
  for (const [file] of Object.entries(result.metafile.inputs))
    if (file.includes("/kello/")) assert((await realpath(file)).startsWith(installed + "/dist/"), file);
  const bundled = result.outputFiles[0].text;
  assert.doesNotMatch(bundled, /Bun\\.|createDblink|createPostgresFdw_9/);
  if (name === "selected") assert.match(bundled, /postgres_fdw_get_connections/);
  else assert.doesNotMatch(bundled, /postgres_fdw/);
  await writeFile(name + ".mjs", bundled);
}
const { createPostgresFdw_1_2 } = await import("./selected.mjs");
const api = createPostgresFdw_1_2(${JSON.stringify(descriptor)});
assert.deepEqual(Object.keys(api.sql.functions), ["postgres_fdw_get_connections"]);
const { extensions } = await import("./empty.mjs");
assert.equal(extensions, undefined);
`,
      );
      await run(["node", "verify-bundles.mjs"]);
      await writeFile(
        join(root, "project-native.mjs"),
        `import assert from "node:assert/strict";
import { createPostgresFdw_1_2 } from "kello/extensions/postgres-fdw";
import { PostgresFdwOperationError, withPostgresFdw } from "kello/tooling/extensions/postgres-fdw";
const url = process.env.LOOM_PACKED_POSTGRES_FDW_DATABASE_URL;
assert(url);
const api = createPostgresFdw_1_2(${JSON.stringify({ ...descriptor, schema: "extensions" })});
const failed = await withPostgresFdw(url, api, async (session) => {
  assert.deepEqual(await session.connections(), []);
  assert.deepEqual(await session.disconnectAll(), { disconnected: false, rollback: "not-transactional" });
  throw new Error("after idle disconnect acknowledgement");
}).then(
  () => {
    throw new Error("Expected callback failure");
  },
  (error) => error,
);
assert(failed instanceof PostgresFdwOperationError);
assert.equal(failed.completion, "rolled-back");
assert.equal(failed.effects.some((effect) => effect.operation === "disconnect-all" && effect.state === "acknowledged"), true);
const reset = await withPostgresFdw(url, api, (session) => session.connections());
assert.equal(reset.completion, "committed");
assert.deepEqual(reset.value, []);
assert.equal(reset.effects.some((effect) => effect.operation === "cleanup" && effect.state === "acknowledged"), true);
console.log("packed postgres_fdw consumer contracts passed");
`,
      );
      await withExtensionDatabase(async (databaseUrl) => {
        const client = new pg.Client({ connectionString: databaseUrl });
        await client.connect();
        try {
          await client.query(
            "CREATE SCHEMA extensions; CREATE EXTENSION postgres_fdw WITH SCHEMA extensions VERSION '1.2'",
          );
        } finally {
          await client.end();
        }
        await run(["node", "project-native.mjs"], root, databaseUrl);
      });
      for (const mode of ["empty", "future", "selected", "custom"]) {
        const project = await mkdtemp(join(root, "project-"));
        await symlink(join(root, "node_modules"), join(project, "node_modules"));
        await copyFile(
          new URL("../fixtures/postgres_fdw-generated-project.ts", import.meta.url),
          join(project, "project-writer.ts"),
        );
        await copyFile(
          new URL("../fixtures/postgres_fdw-packed-generation.mjs.fixture", import.meta.url),
          join(project, "generate-public.mjs"),
        );
        await run(["bun", "generate-public.mjs", mode], project);
        if (mode === "selected" || mode === "custom") {
          const generated = JSON.parse(await readFile(join(project, "generation.json"), "utf8"));
          await withExtensionDatabase((url) =>
            runPostgresFdwGeneratedRuntime(project, generated.version, generated.schema, url),
          );
        }
      }
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      const observationRoot = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      if (observationRoot) {
        const nodeVersion = (await run(["node", "--version"])).trim();
        await writeFile(
          join(observationRoot, "consumer.json"),
          JSON.stringify({
            runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
            nodeVersion,
            installation: "isolated",
            frozenReinstallPassed: true,
            declarationsPassed: true,
            runtimePassed: true,
            selectedBundleChecksPassed: true,
            tarballSha256: packedSha256,
          }),
        );
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
