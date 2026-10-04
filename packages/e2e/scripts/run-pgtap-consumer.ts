import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";
import {
  pgtapGenerationSelections,
  pgtapGeneratedDigest,
  pgtapGeneratedQueryCount,
} from "../fixtures/pgtap-generated-project";
import { withPgtapDatabase } from "../fixtures/pgtap";

/** Parent supplies the integrated tarball, already frozen-installed isolated consumer and Node 24 binary.
 * No package build, pack, dependency installation, source alias or workspace symlink is performed here.
 */
export async function runPgtapConsumer(consumerRoot: string, tarballPath: string, output: string) {
  const root = resolve(consumerRoot);
  const bytes = await readFile(tarballPath);
  const filesCompared = await assertInstalledPackageMatchesTarball(root, bytes);
  const lockDigest = await consumerLockfileSha256(root);
  const own = join(root, `pgtap-${randomUUID()}`);
  await mkdir(own);
  const nodeBinary = process.env.PGTAP_NODE_BINARY ?? "node";
  async function run(
    command: string[],
    extra: { databaseUrl?: string; selections?: readonly string[]; placement?: "extensions" | "tap" | "none" } = {},
  ) {
    const child = Bun.spawn(command, {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 180_000,
      env: {
        ...process.env,
        ...(extra.databaseUrl && { PGTAP_NATIVE_CONSUMER_URL: extra.databaseUrl }),
        ...(extra.selections && { PGTAP_NATIVE_SELECTIONS: JSON.stringify(extra.selections) }),
        ...(extra.placement && { PGTAP_NATIVE_PLACEMENT: extra.placement }),
      },
    });
    const result = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
    assert.equal(
      await child.exited,
      0,
      `${command[0]} failed:\n${result.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]")}`,
    );
    return result;
  }
  try {
    await run([
      nodeBinary,
      "-e",
      'if (process.versions.node.split(".")[0] !== "24") throw new Error("pgTAP cold consumer requires Node 24; observed " + process.version)',
    ]);
    await writeFile(
      join(own, "project-fixture.ts"),
      await readFile(new URL("../fixtures/pgtap-generated-project.ts", import.meta.url), "utf8"),
    );
    await writeFile(
      join(own, "generate.ts"),
      `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import {
  checkPgtapGeneratedProject,
  pgtapGenerationSelections,
  writePgtapGenerationProject,
} from "./project-fixture.ts";
const generated = {};
for (const selection of pgtapGenerationSelections) {
  const project = join(import.meta.dirname, selection);
  await initializeProject(project, "pgtap" + selection);
  await writePgtapGenerationProject(project, selection);
  await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
  await loadProject(project);
  const result = await generateProject(project);
  await checkPgtapGeneratedProject(project, selection, result.version);
  assert.equal((await generateProject(project)).version, result.version);
  generated[selection] = { project, version: result.version };
}
await writeFile(join(import.meta.dirname, "runtime-state.json"), JSON.stringify(generated));
`,
    );
    await run(["bun", join(own, "generate.ts")]);
    for (const selection of pgtapGenerationSelections)
      await run([join(root, "node_modules/.bin/tsc"), "-p", join(own, selection, "tsconfig.json")]);
    await writeFile(
      join(own, "native.mjs"),
      `import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { bootstrapDatabase } from "kello/tooling";
import { withPgtap } from "kello/tooling/extensions/pgtap";
import { createPgtap_1_3_3, pgtapRoutineSpecs } from "kello/extensions/pgtap";
assert.equal(process.versions.node.split(".")[0], "24");
assert.equal(Object.keys(pgtapRoutineSpecs).length, 1079);
const url = process.env.PGTAP_NATIVE_CONSUMER_URL;
assert(url);
const state = JSON.parse(await readFile(join(import.meta.dirname, "runtime-state.json"), "utf8"));
const quote = (value) => '"' + value.replaceAll('"', '""') + '"';
const selectedApi = createPgtap_1_3_3({
  name: "pgtap",
  version: "1.3.3",
  schema: "extensions",
  apiSupport: { status: "verified", digest: ${JSON.stringify(pgtapGeneratedDigest)} },
});
assert.equal(Object.keys(selectedApi.sql.overloads).length, ${pgtapGeneratedQueryCount});
const selections = JSON.parse(process.env.PGTAP_NATIVE_SELECTIONS);
const placement = process.env.PGTAP_NATIVE_PLACEMENT;
assert(Array.isArray(selections) && (placement === "extensions" || placement === "tap" || placement === "none"));
const client = new pg.Client({ connectionString: url });
await client.connect();
const role = "pgtap_pack_" + crypto.randomUUID().replaceAll("-", "");
let runtime;
try {
  if (placement !== "none")
    await client.query("CREATE SCHEMA " + quote(placement) + "; CREATE EXTENSION pgtap VERSION '1.3.3' SCHEMA " + quote(placement));
  for (const selection of selections) {
    const project = state[selection].project;
    const selected = (await import(pathToFileURL(join(project, "kello/_generated/extensions.ts")))).extensions;
    const names = await readdir(join(project, ".loom/generations"));
    assert.equal(names.length, 1);
    const bundle = join(project, ".loom/generations", names[0], "runtime.js");
    const bundleText = await readFile(bundle, "utf8");
    const callable = selection === "selected" || selection === "default" || selection === "custom";
    assert.equal(bundleText.includes("createPgtap_1_3_3"), callable);
    assert(!bundleText.includes("createVector_") && !bundleText.includes("createPgGraphql_"));
    const { runtimeOptions } = await import(pathToFileURL(bundle));
    const options = runtimeOptions();
    const mounted = options.scopes.find((scope) => scope.name === "suite");
    assert(mounted, "Mounted pgTAP runtime is missing");
    if (selection === "empty") {
      assert.equal(selected, undefined);
      assert.equal(mounted.extensions, undefined);
    } else if (selection === "future") {
      assert.equal(selected.pgtap.apiSupport.status, "unverified");
      assert.equal("diag" in selected.pgtap, false);
      assert.equal(mounted.extensions.pgtap.apiSupport.status, "unverified");
    } else {
      assert.equal(selected.pgtap.schema, ${JSON.stringify({ selected: "extensions", default: "extensions", custom: "tap" })}[selection]);
      assert.equal(Object.keys(selected.pgtap.sql.overloads).length, ${pgtapGeneratedQueryCount});
      assert.equal(mounted.extensions.pgtap.schema, selected.pgtap.schema);
    }
    await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole: role });
    runtime = await createRpcRuntime({ ...options, connectionString: url, deployment: "packed-pgtap-" + selection, auth: defineRpcAuth({ authorize: async () => {} }), assertActive: async (signal) => signal.throwIfAborted() });
    const route = getRouter(runtime.router, ["tasks", "list"]);
    assert(route instanceof Procedure);
    const invocation = { requestId: "packed-pgtap-" + selection, identity: null, signal: new AbortController().signal };
    const actual = await call(route, undefined, { context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) }, path: ["tasks", "list"] });
    if (!callable) assert.deepEqual(actual, { host: selection, mounted: selection });
    else {
      const schema = selected.pgtap.schema;
      const native = (await client.query("SELECT " + quote(schema) + ".diag($1::text) AS diagnostic, " + quote(schema) + ".diag(NULL::text) AS empty, " + quote(schema) + ".pg_version_num() AS pg_version", ["native\\nTAP result data"])).rows[0];
      const expected = { diagnostic: native.diagnostic, empty: native.empty, pgVersion: native.pg_version, members: Object.keys(selected.pgtap.sql.overloads).sort(), effectSame: true, version: "1.3.3", schema };
      assert.deepEqual(actual, { host: expected, mounted: expected });
    }
    await runtime.stop();
    runtime = undefined;
  }
  if (placement === "tap") {
    const tap = await withPgtap(url, { name: "pgtap", version: "1.3.3", schema: "tap", apiSupport: { status: "verified", digest: ${JSON.stringify(pgtapGeneratedDigest)} } }, async (session) => { await session.plan(1); return { tap: await session.ok(false, "packed native failure"), finish: await session.finish() }; });
    assert.equal(tap.completion, "committed");
    assert(tap.value.tap.startsWith("not ok 1 - packed native failure"));
  }
} finally {
  try { await runtime?.stop(); } finally {
    if ((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rows.length) await client.query("GRANT " + pg.escapeIdentifier(role) + " TO CURRENT_USER; DROP OWNED BY " + pg.escapeIdentifier(role) + "; DROP ROLE " + pg.escapeIdentifier(role));
    await client.end();
  }
}
`,
    );
    await withPgtapDatabase(async (url) => {
      await run([nodeBinary, join(own, "native.mjs")], {
        databaseUrl: url,
        selections: ["empty", "future", "selected", "default"],
        placement: "extensions",
      });
    });
    await withPgtapDatabase(async (url) => {
      await run([nodeBinary, join(own, "native.mjs")], { databaseUrl: url, selections: ["custom"], placement: "tap" });
    });
    assert.equal(await consumerLockfileSha256(root), lockDigest);
    assert.equal(sha256(await readFile(tarballPath)), sha256(bytes));
    await assertInstalledPackageMatchesTarball(root, bytes);
    const receipt = {
      family: "pgtap",
      version: "1.3.3",
      tarballSha256: sha256(bytes),
      lockfileSha256: lockDigest,
      filesCompared,
      node: "24",
      generation: "public-first-load-and-disk",
      types: "selected-default-custom-empty-future",
      native: "cold-root-mounted-rpc-effect-bundle-and-operator",
      providerAcceptance: "pending-parent-authorization",
    };
    await writeFile(output, JSON.stringify(receipt, null, 2));
    return receipt;
  } finally {
    await rm(own, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const [root, tarball, output] = process.argv.slice(2);
  assert(root && tarball && output, "Usage: run-pgtap-consumer.ts parent-frozen-consumer parent-tarball receipt.json");
  await mkdir(dirname(resolve(output)), { recursive: true });
  console.log(JSON.stringify(await runPgtapConsumer(root, tarball, output)));
}
