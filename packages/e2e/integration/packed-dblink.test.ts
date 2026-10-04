import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
import { dblinkConsumerProofCase } from "../fixtures/dblink-proof-cases";
import { dblinkGeneratedDigest } from "../fixtures/dblink-generated-project";
import { withExtensionDatabase } from "../fixtures/extension-database";

const descriptor = {
  name: "dblink",
  version: "1.2",
  schema: 'custom"dblink',
  apiSupport: {
    status: "verified",
    digest: dblinkGeneratedDigest,
  },
} as const;

const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
const missingExports = [
  "kello/extensions/dblink",
  "kello/tooling/extensions/dblink",
  "apps/loom/vite.config.ts entry src/core/extensions/adapters/dblink.ts",
  "apps/loom/vite.config.ts entry src/tooling/extensions/operations/dblink.ts",
  "apps/loom/src/tooling/codegen/extensions.ts adapters createDblink_1_2",
  "apps/loom/src/tooling/migrations/required-api-verification.ts dblink annotations",
] as const;

extensionProofTest(
  dblinkConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-dblink-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_DBLINK_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 180000, env });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      let output = `${stdout}\n${stderr}`;
      if (databaseUrl) {
        const address = new URL(databaseUrl);
        for (const value of [databaseUrl, address.username, address.password, address.hostname, address.pathname.slice(1)]) {
          if (value) output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
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
        packedManifest.exports?.["./extensions/dblink"],
        `Missing packed export ./extensions/dblink. Parent must apply: ${missingExports.join("; ")}`,
      );
      assert(
        packedManifest.exports?.["./tooling/extensions/dblink"],
        `Missing packed export ./tooling/extensions/dblink. Parent must apply: ${missingExports.join("; ")}`,
      );
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createDblink_1_2 } from "kello/extensions/dblink";
import { withDblink } from "kello/tooling/extensions/dblink";
const api = createDblink_1_2(${JSON.stringify(descriptor)});
assert.equal(api.foreignDataWrapper.name, "dblink_fdw");
assert.equal(api.foreignDataWrapper.handler, null);
assert.equal(api.connect.authority, "session");
assert.equal(api.exec.authority, "session");
assert.deepEqual(Object.keys(api.sql.functions).sort(), [
  "dblink_build_sql_delete",
  "dblink_build_sql_insert",
  "dblink_build_sql_update",
  "dblink_current_query",
  "dblink_get_connections",
  "dblink_get_pkey",
]);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }])
  assert.throws(() => createDblink_1_2({ ...api, apiSupport: support }), /exact verified contract/);
await assert.rejects(withDblink("postgresql://operator@127.0.0.1:1/fixture", { ...api, apiSupport: { status: "unverified" } }, async () => undefined), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import { createDblink_1_2 } from "kello/extensions/dblink";
import { withDblink, type DblinkSession } from "kello/tooling/extensions/dblink";
const api = createDblink_1_2(${JSON.stringify(descriptor)});
const schema: 'custom"dblink' = api.schema;
const version: "1.2" = api.version;
const sessionAuthority: "session" = api.connect.authority;
api.sql.functions.dblink_get_connections();
// @ts-expect-error Connect is not application SQL.
api.sql.functions.dblink_connect("named", "host=local");
void withDblink("postgresql://operator/fixture", api, async (session: DblinkSession) => {
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
      await writeFile(join(root, "selected.ts"), `export { createDblink_1_2 } from "kello/extensions/dblink";`);
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
  assert.doesNotMatch(bundled, /Bun\\.|createPostgresFdw|createDblink_9/);
  if (name === "selected") assert.match(bundled, /dblink_get_connections/);
  else assert.doesNotMatch(bundled, /dblink/);
  await writeFile(name + ".mjs", bundled);
}
const { createDblink_1_2 } = await import("./selected.mjs");
const api = createDblink_1_2(${JSON.stringify(descriptor)});
assert.deepEqual(Object.keys(api.sql.functions).sort(), [
  "dblink_build_sql_delete",
  "dblink_build_sql_insert",
  "dblink_build_sql_update",
  "dblink_current_query",
  "dblink_get_connections",
  "dblink_get_pkey",
]);
const { extensions } = await import("./empty.mjs");
assert.equal(extensions, undefined);
`,
      );
      await run(["node", "verify-bundles.mjs"]);
      await writeFile(
        join(root, "project-native.mjs"),
        `import assert from "node:assert/strict";
import { createDblink_1_2 } from "kello/extensions/dblink";
import { DblinkOperationError, withDblink } from "kello/tooling/extensions/dblink";
const url = process.env.LOOM_PACKED_DBLINK_DATABASE_URL;
assert(url);
const api = createDblink_1_2(${JSON.stringify({ ...descriptor, schema: "extensions" })});
const failed = await withDblink(url, api, async (session) => {
  assert.equal(await session.connections(), null);
  throw new Error("after idle connections acknowledgement");
}).then(
  () => {
    throw new Error("Expected callback failure");
  },
  (error) => error,
);
assert(failed instanceof DblinkOperationError);
assert.equal(failed.completion, "rolled-back");
assert.equal(failed.effects.some((effect) => effect.operation === "cleanup" && effect.state === "acknowledged"), true);
const reset = await withDblink(url, api, (session) => session.connections());
assert.equal(reset.completion, "committed");
assert.equal(reset.value, null);
assert.equal(reset.effects.some((effect) => effect.operation === "cleanup" && effect.state === "acknowledged"), true);
console.log("packed dblink consumer contracts passed");
`,
      );
      await withExtensionDatabase(async (databaseUrl) => {
        const client = new pg.Client({ connectionString: databaseUrl });
        await client.connect();
        try {
          await client.query("CREATE SCHEMA extensions; CREATE EXTENSION dblink WITH SCHEMA extensions VERSION '1.2'");
        } finally {
          await client.end();
        }
        await run(["node", "project-native.mjs"], root, databaseUrl);
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
