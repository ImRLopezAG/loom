import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import { plpgsqlCheckInstall, plpgsqlCheckSchema } from "../fixtures/plpgsql_check";
import { plpgsqlCheckConsumerProofCase } from "../fixtures/plpgsql_check-proof-cases";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";

// Host-supplied retention path: the exact pack output is copied there exclusively before installation.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  plpgsqlCheckConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-plpgsql_check-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_PLPGSQL_CHECK_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 120000, env });
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
        ])
          if (value)
            output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
        output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      }
      assert.equal(code, 0, `${command.join(" ")}\n${output}`);
    }
    try {
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
      const packedBytes = await readFile(join(root, "kello.tgz"));
      const packedSha256 = sha256(packedBytes);
      if (retainedArtifactPath !== undefined) {
        await copyFile(join(root, "kello.tgz"), retainedArtifactPath, constants.COPYFILE_EXCL);
        assert.equal(sha256(await readFile(retainedArtifactPath)), packedSha256, "Retained tarball bytes differ");
      }
      await run([
        "node",
        "-e",
        "if (process.versions.node.split('.')[0] !== '24') throw new Error('Isolated consumer requires Node 24, not ' + process.version)",
      ]);
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          dependencies: {
            ...manifest.dependencies,
            kello: "file:./kello.tgz",
            "drizzle-orm": manifest.devDependencies["drizzle-orm"],
          },
          devDependencies: {
            typescript: manifest.devDependencies.typescript,
            "@types/node": manifest.devDependencies["@types/node"],
            "@types/pg": manifest.devDependencies["@types/pg"],
          },
        }),
      );
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256, "The tarball changed during install");
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      const lockfileSha256 = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256, "The frozen reinstall changed the lockfile");
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      await writeFile(
        join(root, "selected.ts"),
        extensionBindingsSource({ plpgsql_check: { version: "2.8", schema: plpgsqlCheckSchema } }),
      );
      await writeFile(
        join(root, "probe.ts"),
        `import { createPlpgsqlCheck_2_8 } from "kello/extensions/plpgsql-check";
import { withPlpgsqlCheck, type PlpgsqlCheckIssue, type PlpgsqlCheckSession } from "kello/tooling/extensions/plpgsql-check";
import { extensions } from "./selected";
const descriptor = extensions.plpgsql_check;
const placement: ${JSON.stringify(plpgsqlCheckSchema)} = descriptor.schema;
createPlpgsqlCheck_2_8(descriptor);
// @ts-expect-error Operator analysis is absent from application SQL.
descriptor.sql.functions.plpgsql_check_function;
void withPlpgsqlCheck("postgresql://operator/fixture", descriptor, async (session: PlpgsqlCheckSession) => {
  const issues: readonly PlpgsqlCheckIssue[] = await session.checkTable({ name: "public.f" });
  // @ts-expect-error A routine is a signature or a name, never both.
  await session.check({ name: "public.f", signature: "public.f()" });
  return issues;
});
void placement;
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
          include: ["*.ts"],
        }),
      );
      await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
      await writeFile(
        join(root, "operator.mjs"),
        `import assert from "node:assert/strict";
import { realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { withPlpgsqlCheck, PlpgsqlCheckOperationError } from "kello/tooling/extensions/plpgsql-check";
const kello = await realpath("node_modules/kello");
for (const entry of ["kello/tooling/extensions/plpgsql-check", "kello/extensions/plpgsql-check"])
  assert((await realpath(fileURLToPath(import.meta.resolve(entry)))).startsWith(kello + "/dist/"));
const url = process.env.LOOM_PACKED_PLPGSQL_CHECK_DATABASE_URL;
assert(url);
const descriptor = ${JSON.stringify({ name: "plpgsql_check", version: "2.8", schema: plpgsqlCheckSchema, apiSupport: { status: "verified", digest: "ef00befd1f61c832689dc4d4b3ee3c21f03585eda686474bb5ec8efd8696e74a" } })};
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(${JSON.stringify(plpgsqlCheckInstall)});
  const result = await withPlpgsqlCheck(url, descriptor, async (session) => ({
    issues: await session.checkTable({ signature: "public.check_broken(integer)" }),
    dependencies: await session.dependencies({ name: "public.check_broken" }),
    profiled: await session.profiledFunctions(),
  }));
  assert.equal(result.completion, "committed");
  assert.deepEqual(result.effects, []);
  assert.deepEqual(result.value.issues.map((issue) => [issue.functionid, issue.lineno, issue.sqlstate]), [["public.check_broken", 1, "42703"]]);
  assert.deepEqual(result.value.dependencies.map((row) => [row.type, row.schema, row.name]), [["RELATION", "public", "check_items"]]);
  assert.deepEqual(result.value.profiled, []);
  const failure = await withPlpgsqlCheck(url, descriptor, (session) => session.check({ signature: "public.check_sql()" })).catch((error) => error);
  assert(failure instanceof PlpgsqlCheckOperationError);
  assert.equal(failure.completion, "rolled-back");
} finally {
  await client.end();
}
console.log("packed plpgsql_check operator diagnostics passed");
`,
      );
      await withExtensionDatabase((url) => run(["node", "operator.mjs"], root, url));
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
