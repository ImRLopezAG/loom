import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { pgGraphqlAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_graphql";
import {
  pgGraphqlConsumerProofCase,
  pgGraphqlMembers,
  pgGraphqlQueryMembers,
} from "../fixtures/pg_graphql-proof-cases";
import { withPgGraphqlApi } from "../fixtures/pg_graphql";

import { runPgGraphqlGeneratedRuntime } from "../fixtures/pg-graphql-generated-runtime";
import { recordPackedConsumerObservation } from "../fixtures/packed-consumer-observation";

const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  pgGraphqlConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-pg-graphql-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_PG_GRAPHQL_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 180000, env });
      let output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
      if (databaseUrl) {
        const address = new URL(databaseUrl);
        for (const value of [databaseUrl, address.password, address.username])
          if (value)
            output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
        output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      }
      assert.equal(await child.exited, 0, `${command.join(" ")}\n${output}`);
      return output;
    }
    try {
      for (const file of [
        "dist/core/extensions/adapters/pg_graphql.js",
        "dist/core/extensions/adapters/pg_graphql.d.ts",
        "dist/tooling/index.js",
      ])
        assert(
          (await readFile(join(source, file))).length > 0,
          "Parent must build public pg_graphql exports before packed proof",
        );
      await run([
        "node",
        "-e",
        "if (process.versions.node.split('.')[0] !== '24') throw new Error('Isolated consumer requires Node 24, not ' + process.version)",
      ]);
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
      const packedBytes = await readFile(join(root, "kello.tgz"));
      const packedSha256 = sha256(packedBytes);
      if (retainedArtifactPath !== undefined) {
        await copyFile(join(root, "kello.tgz"), retainedArtifactPath, constants.COPYFILE_EXCL);
        assert.equal(sha256(await readFile(retainedArtifactPath)), packedSha256);
      }
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
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);

      await writeFile(
        join(root, "project-fixture.ts"),
        await readFile(fileURLToPath(new URL("../fixtures/pg_graphql-generated-project.ts", import.meta.url)), "utf8"),
      );
      await writeFile(
        join(root, "generate.ts"),
        `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writePgGraphqlProject, checkPgGraphqlDiskBindings } from "./project-fixture";
const project = join(process.cwd(), "project");
await initializeProject(project, "packedgql");
await writePgGraphqlProject(project);
await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
await loadProject(project);
const generated = await generateProject(project);
const disk = await checkPgGraphqlDiskBindings(project);
assert.equal(disk.extensions.pg_graphql.schema, "graphql");
assert.equal(Object.keys(disk.extensions.pg_graphql.sql.overloads).length, 5);
assert.equal((await generateProject(project)).version, generated.version);
await import("node:fs/promises").then(fs => fs.writeFile(join(project, "generation.json"), JSON.stringify({ version: generated.version, schema: "graphql" })));
`,
      );
      await run(["bun", "generate.ts"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "project/tsconfig.json"]);

      const disk = await import(pathToFileURL(join(root, "project/kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "project/kello/_generated/server.ts")).href);
      assert.equal(server.extensions, disk.extensions);
      for (const member of pgGraphqlMembers) {
        const annotation = pgGraphqlAnnotations.find((row) => row.id === member);
        assert(annotation);
        {
          const present = Object.hasOwn(disk.extensions.pg_graphql.sql.overloads, member);
          if (pgGraphqlQueryMembers.some((queryMember) => queryMember === member)) {
            assert.equal(annotation.disposition, "query");
            assert.equal(present, true);
            assert(disk.extensions.pg_graphql.sql.overloads[member]);
          } else {
            assert.notEqual(annotation.disposition, "query");
            assert.equal(present, false);
            assert.equal(member in disk.extensions.pg_graphql.sql.functions, false);
          }
        }
      }

      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createPgGraphql_1_5_12, jsonbDocument } from "kello/extensions/pg-graphql";
const api = createPgGraphql_1_5_12({
  name: "pg_graphql",
  version: "1.5.12",
  schema: "graphql",
  apiSupport: { status: "verified", digest: "a64a8bd702ab1dad6e9b171e6f5cc61ec54c2e31411da5d7c6aec86933538d5f" },
});
assert.deepEqual(Object.keys(api.sql.overloads).toSorted(), ${JSON.stringify([...pgGraphqlQueryMembers].toSorted())});
assert.equal(api.schema, "graphql");
assert.throws(() => createPgGraphql_1_5_12({ ...api, apiSupport: { status: "unverified" } }), /exact verified contract/);
assert.throws(() => createPgGraphql_1_5_12({ ...api, schema: "extensions" }), /exact verified contract/);
assert.equal(api.codecs.response.decode('{"data":null}').text, jsonbDocument('{"data":null}').text);
`,
      );
      await run(["node", "imports.mjs"]);

      await writeFile(join(root, "selected.ts"), 'export { extensions } from "./project/kello/_generated/extensions";');
      await writeFile(join(root, "empty.ts"), "export const extensions = undefined;");
      await writeFile(
        join(root, "verify-bundles.mjs"),
        `import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import { build } from "esbuild";
const installed = await realpath("node_modules/kello");
for (const name of ["selected", "empty"]) {
  const result = await build({ entryPoints: [name+".ts"], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
  for (const file of Object.keys(result.metafile.inputs)) if (file.includes("node_modules/kello/")) assert((await realpath(file)).startsWith(installed+"/dist/"));
  const text = result.outputFiles[0].text;
  assert.doesNotMatch(text, /Bun\\.|createPostgis|createPgCrypto/);
  if (name === "selected") assert.match(text, /_internal_resolve/); else assert.doesNotMatch(text, /pg_graphql/);
  await writeFile(name+".mjs", text);
  const { extensions } = await import("./"+name+".mjs");
  if (name === "selected") assert.deepEqual(Object.keys(extensions), ["pg_graphql"]); else assert.equal(extensions, undefined);
}
`,
      );
      await run(["node", "verify-bundles.mjs"]);

      const generation: { version: string } = JSON.parse(await readFile(join(root, "project/generation.json"), "utf8"));
      await withPgGraphqlApi((fixture) =>
        runPgGraphqlGeneratedRuntime(join(root, "project"), generation.version, "graphql", fixture.url),
      );
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      await recordPackedConsumerObservation(root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
