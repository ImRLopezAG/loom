import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionProofTest } from "../fixtures/extension-proof";
import { neonUtilsConsumerProofCase, neonUtilsProofFamily } from "../fixtures/neon_utils-proof-cases";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
  verifyPackedBuildSources,
} from "../fixtures/proof-artifact";
import { withExtensionDatabase } from "../fixtures/extension-database";

extensionProofTest(
  neonUtilsConsumerProofCase,
  async () => {
    // Parent owns build/pack. Require its real artifact instead of rebuilding or substituting source imports.
    const artifact = process.env.LOOM_NEON_UTILS_TARBALL;
    assert(artifact, "LOOM_NEON_UTILS_TARBALL must name the parent's freshly built kello tarball");
    const root = await mkdtemp(join(tmpdir(), "loom-packed-neon_utils-"));
    async function run(command: string[], env = process.env, cwd = root) {
      const child = Bun.spawn(command, { cwd, env, stdout: "pipe", stderr: "pipe", timeout: 120000 });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      assert.equal(code, 0, `${command.join(" ")}\n${stdout}${stderr}`);
      return stdout;
    }
    try {
      await run(["node", "-e", "if(process.versions.node.split('.')[0]!=='24')throw Error('Node 24 required')"]);
      const bytes = await readFile(artifact);
      const digest = sha256(bytes);
      const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
      const paths = [
        "core/extensions/adapters/neon_utils.js",
        "core/extensions/adapters/neon_utils.d.ts",
        "tooling/index.js",
        "tooling/index.d.ts",
      ];
      verifyPackedBuildSources(
        bytes,
        await Promise.all(
          paths.map(async (path) => ({
            file: `apps/loom/dist/${path}`,
            sha256: sha256(await readFile(join(source, "dist", path))),
          })),
        ),
      );
      await copyFile(artifact, join(root, "kello.tgz"));
      const retained = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
      if (retained) await copyFile(artifact, retained, constants.COPYFILE_EXCL);
      const pkg = JSON.parse(await readFile(join(source, "package.json"), "utf8"));
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          dependencies: {
            ...pkg.dependencies,
            kello: "file:./kello.tgz",
            "drizzle-orm": pkg.devDependencies["drizzle-orm"],
          },
          devDependencies: {
            typescript: pkg.devDependencies.typescript,
            "@types/node": pkg.devDependencies["@types/node"],
            "@types/pg": pkg.devDependencies["@types/pg"],
          },
        }),
      );
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      const lock = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lock);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      // Copy only test fixture text. All product code below resolves through installed compiled public exports.
      await writeFile(
        join(root, "project-fixture.ts"),
        await readFile(fileURLToPath(new URL("../fixtures/neon_utils-generated-project.ts", import.meta.url)), "utf8"),
      );
      await writeFile(
        join(root, "generate.ts"),
        `import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writeNeonUtilsProject, checkNeonUtilsDiskBindings } from "./project-fixture";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const project = join(process.cwd(), "project");
await initializeProject(project, "packedcpu");
await writeNeonUtilsProject(project, "packed_cpu");
await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
await loadProject(project);
const generated = await generateProject(project);
await checkNeonUtilsDiskBindings(project, "packed_cpu");
assert.equal((await generateProject(project)).version, generated.version);
await writeFile(join(project, "generation.json"), JSON.stringify({ version: generated.version, schema: "packed_cpu" }));`,
      );
      await run(["bun", "generate.ts"]);
      await copyFile(
        new URL("../fixtures/generated-runtime-bundle.mjs.fixture", import.meta.url),
        join(root, "project/bundle-runtime.mjs"),
      );
      await run(["bun", "bundle-runtime.mjs", "neon_utils"], process.env, join(root, "project"));
      await run(["node", "check-bindings.mjs"], process.env, join(root, "project"));
      await writeFile(
        join(root, "unselected.ts"),
        `import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
for (const selection of ["empty", "future"]) {
 const project = join(process.cwd(), selection);
 await initializeProject(project, "cpu");
 await writeFile(join(project, "kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig(' + (selection === "empty" ? '{}' : '{ database: { extensions: { neon_utils: { version: "future" } } } }') + ');');
 await writeFile(join(project, "kello/schema.ts"), 'import { defineSchema } from "kello/server"; export default defineSchema(() => ({}), { namespace: "app" });');
 await loadProject(project); const generated = await generateProject(project);
 await writeFile(join(project, "generation.json"), JSON.stringify({ version: generated.version, selection }));
 await copyFile("project/bundle-runtime.mjs", join(project, "bundle-runtime.mjs"));
}`,
      );
      await run(["bun", "unselected.ts"]);
      for (const selection of ["empty", "future"]) {
        await run(["bun", "bundle-runtime.mjs", "neon_utils"], process.env, join(root, selection));
        await run(["node", "check-bindings.mjs"], process.env, join(root, selection));
      }
      await copyFile(
        fileURLToPath(new URL("../fixtures/neon_utils-public-types.ts.fixture", import.meta.url)),
        join(root, "project/kello/neon-utils-public-types.ts"),
      );
      await run(["bun", "node_modules/typescript/bin/tsc", "-p", "project/tsconfig.json"]);
      await copyFile(
        fileURLToPath(new URL("../fixtures/neon_utils-generated-rpc.mjs.fixture", import.meta.url)),
        join(root, "project/generated-rpc.mjs"),
      );
      await copyFile(
        new URL("../fixtures/generated-runtime-prepare.mjs.fixture", import.meta.url),
        join(root, "project/prepare-runtime.mjs"),
      );
      await withExtensionDatabase(async (url) => {
        await run(
          ["bun", "prepare-runtime.mjs", "neon_utils"],
          { ...process.env, LOOM_GENERATED_RUNTIME_DATABASE_URL: url },
          join(root, "project"),
        );
        await run(
          ["node", "generated-rpc.mjs"],
          { ...process.env, LOOM_NEON_UTILS_CONSUMER_DATABASE_URL: url },
          join(root, "project"),
        );
      });
      console.info(
        "neon_utils packed frozen install, public types, disk generation and cold Node 24 RPC/Effect passed",
      );
      await writeFile(
        join(root, "runtime.mjs"),
        `import assert from "node:assert/strict";
import { createNeonUtils_1_1 } from "kello/extensions/neon-utils";
import { sql, defineRelations } from "drizzle-orm";
import { defineSchema, connectDatabase } from "kello/server";
import pg from "pg";
const api = createNeonUtils_1_1({ name: "neon_utils", version: "1.1", schema: 'packed"cpu', apiSupport: { status: "verified", digest: ${JSON.stringify(neonUtilsProofFamily.manifestDigest)} } });
assert.equal(api.numCpus, api.sql.functions.num_cpus);
const url = process.env.LOOM_NEON_UTILS_CONSUMER_DATABASE_URL;
assert(url, "Packed native proof requires the parent's disposable local PG18 fixture");
const client = new pg.Client({ connectionString: url });
const schema = defineSchema(() => ({}));
let connection;
try {
  await client.connect();
  assert.equal((await client.query("SELECT current_setting('server_version_num')::integer/10000 major")).rows[0].major, 18);
  await client.query(${JSON.stringify('CREATE SCHEMA "packed""cpu"; CREATE EXTENSION neon_utils WITH SCHEMA "packed""cpu" VERSION \'1.1\'')});
  connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
  await connection.transaction(async db => {
    const query = db.select({ cpus: api.numCpus() }).from(sql\`(values (1)) cpu_fixture(n)\`).toSQL();
    assert.equal(query.sql, 'select "packed""cpu"."num_cpus"() from (values (1)) cpu_fixture(n)');
    assert.deepEqual(query.params, []);
  });
  const native = (await client.query('SELECT "packed""cpu".num_cpus() cpus, pg_typeof("packed""cpu".num_cpus())::text type')).rows[0];
  assert.equal(native.type, "integer");
  const rows = await connection.transaction(async db => db.select({ cpus: api.numCpus(), canonical: api.sql.functions.num_cpus() }).from(sql\`(values (1)) cpu_fixture(n)\`));
  assert.equal(rows.length, 1);
  for (const cpus of Object.values(rows[0])) assert(Number.isInteger(cpus) && cpus >= -2147483648 && cpus <= 2147483647);
} finally { try { await connection?.close(); } finally { await client.end(); } }
`,
      );
      await withExtensionDatabase(async (url) => {
        await run(["node", "runtime.mjs"], { ...process.env, LOOM_NEON_UTILS_CONSUMER_DATABASE_URL: url });
      });
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), digest);
      assert.equal(sha256(await readFile(artifact)), digest);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      assert.equal(await consumerLockfileSha256(root), lock);
      const nodeVersion = (await run(["node", "--version"])).trim();
      const output = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      assert(output);
      await writeFile(
        join(output, "consumer.json"),
        JSON.stringify({
          runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
          nodeVersion,
          installation: "isolated",
          frozenReinstallPassed: true,
          declarationsPassed: true,
          runtimePassed: true,
          selectedBundleChecksPassed: true,
          tarballSha256: digest,
        }),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
