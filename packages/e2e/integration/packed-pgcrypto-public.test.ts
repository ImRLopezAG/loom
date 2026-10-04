import assert from "node:assert/strict";
import { test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { withExtensionDatabase } from "../fixtures/extension-database";

test("freshly packed Pgcrypto generates through installed tooling and runs selected public bundles under Node", async () => {
  // Fail at the missing publication seam before packaging: RED is not a native/consumer execution receipt.
  assert.match(
    extensionBindingsSource({ pgcrypto: { version: "1.4", schema: 'packed"crypto' } }),
    /kello\/extensions\/pgcrypto/,
  );
  const root = await realpath(await mkdtemp(join(tmpdir(), "loom-packed-pgcrypto-")));
  const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
  const manifest = await Bun.file(join(source, "package.json")).json();
  async function run(command: string[], cwd = root, databaseUrl?: string) {
    const env = { ...process.env };
    if (databaseUrl) env.LOOM_PACKED_PGCRYPTO_DATABASE_URL = databaseUrl;
    const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 120000, env });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    function redact(output: string) {
      if (!databaseUrl) return output;
      const address = new URL(databaseUrl);
      for (const value of [
        databaseUrl,
        address.username,
        address.password,
        address.hostname,
        address.pathname.slice(1),
      ])
        if (value) output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
      return output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
    }
    assert.equal(code, 0, `${command.join(" ")}\n${redact(stdout)}\n${redact(stderr)}`);
    return redact(stdout);
  }
  try {
    await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
    const tarballSha256 = createHash("sha256")
      .update(await readFile(join(root, "kello.tgz")))
      .digest("hex");
    assert.match(tarballSha256, /^[a-f0-9]{64}$/);
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: {
          kello: "file:./kello.tgz",
          "drizzle-orm": manifest.devDependencies["drizzle-orm"],
          effect: manifest.dependencies.effect,
          valibot: manifest.dependencies.valibot,
          esbuild: manifest.dependencies.esbuild,
          pg: manifest.dependencies.pg,
        },
        devDependencies: {
          typescript: manifest.devDependencies.typescript,
          "@types/node": manifest.devDependencies["@types/node"],
        },
      }),
    );
    await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
    const installed = await realpath(join(root, "node_modules/kello"));
    assert(installed.startsWith(root), "Public package must resolve inside the isolated consumer");
    assert.notEqual(installed, await realpath(source));
    const lock = await readFile(join(root, "bun.lock"));
    await rm(join(root, "node_modules"), { recursive: true, force: true });
    await run(["bun", "install", "--ignore-scripts", "--frozen-lockfile", "--linker", "isolated"]);
    assert.deepEqual(await readFile(join(root, "bun.lock")), lock);
    await writeFile(
      join(root, "generate.mjs"),
      `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
for (const [name, extensions] of [["selected", { pgcrypto: { version: "1.4", schema: "packed_crypto" } }], ["absent", {}], ["other", { pg_trgm: { version: "1.6" } }], ["unsupported", { pgcrypto: { version: "1.3" } }]]) {
  const root = join(process.cwd(), name);
  await initializeProject(root, name);
  await writeFile(join(root, "kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: ' + JSON.stringify(extensions) + ' } });');
  if (name === "selected") {
    await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    await writeFile(join(root, "kello/schema.ts"), 'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; extensions.pgcrypto.digest("abc", "sha256", "text"); export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });');
    await writeFile(join(root, "kello/functions/tasks.ts"), 'import { os } from "../_generated/rpc"; export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => { context.extensions.pgcrypto.digest(context.tables.tasks.title, "sha256", "text"); const version: "1.4" = context.extensions.pgcrypto.version; return [version]; }) });');
  }
  await loadProject(root);
  const generated = await generateProject(root);
  assert.equal((await generateProject(root)).version, generated.version);
  if (name === "selected") {
    const evidence = JSON.parse(await readFile(join(root, ".loom/generations", generated.version, "required-api.json"), "utf8"));
    const api = evidence.scopes[0].requiredApi.apis[0];
    assert.equal(api.manifest.digest, "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8");
    assert.equal(api.schema, "packed_crypto");
    assert.equal(api.manifest.contract.members.length, 37);
  }
}
`,
    );
    await run(["bun", "generate.mjs"]);
    await writeFile(
      join(root, "probe.ts"),
      `import { extensions } from "./selected/kello/_generated/extensions";
import { createPgcrypto_1_4 } from "kello/extensions/pgcrypto";
import { createProjectContext, createProjectProcedures, createProjectServices, defineSchema } from "kello/server";
import { defineRelations, type SQL } from "drizzle-orm";
import type { Effect } from "effect";
import type { ProjectService } from "kello/server";
import { extensions as absent } from "./absent/kello/_generated/extensions";
import { extensions as unsupported } from "./unsupported/kello/_generated/extensions";
const schema = defineSchema(() => ({})); const relations = defineRelations(schema.tables);
const context = createProjectContext(schema, relations, extensions);
const hash: SQL<{hex:string}|null> = context.extensions.pgcrypto.digest("abc", "sha256", "text");
const pgp: SQL<string|null> = context.extensions.pgcrypto.pgpSymDecrypt({hex:"00"}, "fixture");
const namespace: "packed_crypto" = context.extensions.pgcrypto.schema;
const none: undefined = absent;
const services = createProjectServices<typeof schema, typeof relations, typeof extensions>(schema);
const effect: Effect.Effect<typeof extensions, never, ProjectService<"kello/Extensions", typeof extensions>> = services.Extensions;
createProjectProcedures(schema, relations, extensions).procedure.handler(({context}) => {
  context.extensions.pgcrypto.sql.functions["digest(text,text)"]("abc", "sha256");
  // @ts-expect-error Selected public context has no unselected families.
  context.extensions.pg_trgm;
  return "ok";
});
// @ts-expect-error Unsupported public contracts expose only descriptors.
unsupported.pgcrypto.digest("abc", "sha256", "text");
// @ts-expect-error Public canonical overload arity is fixed.
extensions.pgcrypto.sql.functions["pgp_sym_encrypt(text,text)"]("x", "key", "");
// @ts-expect-error Binary wire data is not Buffer.
extensions.pgcrypto.pgpPubEncryptBytea(Buffer.from([0]), {hex:"00"});
// @ts-expect-error Decoder return type cannot be chosen by callers.
extensions.pgcrypto.digest<number>("abc", "sha256", "text");
void [createPgcrypto_1_4, hash, pgp, namespace, none, effect];
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
    await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
    await run([join(root, "node_modules/.bin/tsc"), "-p", "selected/tsconfig.json"]);
    await writeFile(
      join(root, "selected-runtime.ts"),
      'export { extensions } from "./selected/kello/_generated/extensions"; export { connectDatabase, defineSchema } from "kello/server"; export { createPgcrypto_1_4 } from "kello/extensions/pgcrypto";',
    );
    await writeFile(
      join(root, "verify.mjs"),
      `import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { isBuiltin } from "node:module";
import { createPgcrypto_1_4 } from "kello/extensions/pgcrypto";
import { PgDialect } from "drizzle-orm/pg-core";
import { defineRelations, sql } from "drizzle-orm";
assert.equal(typeof globalThis.Bun, "undefined");
assert.equal(typeof createPgcrypto_1_4, "function");
const quoted = createPgcrypto_1_4({ name:"pgcrypto",version:"1.4",schema:'packed"crypto',apiSupport:{status:"verified",digest:"072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8"} });
assert.throws(() => new PgDialect().sqlToQuery(quoted.digest("abc", "sha256", "text")), /Checked extension SQL requires a Kello database connection/);
const consumer = JSON.parse(await readFile("package.json", "utf8"));
const dependencies = Object.keys(consumer.dependencies).filter(name => name !== "kello");
for (const name of ["selected", "absent", "other", "unsupported"]) {
  const result = await build({ entryPoints:[name === "selected" ? "selected-runtime.ts" : name + "/kello/_generated/extensions.ts"], bundle:true, platform:"node", format:"esm", target:"node22", write:false, metafile:true, external:dependencies });
  for (const output of Object.values(result.metafile.outputs)) {
    for (const imported of output.imports) {
      if (imported.external && !isBuiltin(imported.path))
        assert(dependencies.some(dependency => imported.path === dependency || imported.path.startsWith(dependency + "/")), "External dependency must belong to the isolated consumer: " + imported.path);
    }
  }
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some(input => /\\/tooling\\/|\\/manifests\\/|\\/annotations\\/|kello\\.config/.test(input)));
  const adapters = inputs.filter(input => input.includes("/core/extensions/adapters/"));
  if (name === "selected") assert.deepEqual(adapters.map(input => input.split("/").at(-1)), ["pgcrypto.js"]);
  else if (name === "other") assert.deepEqual(adapters.map(input => input.split("/").at(-1)), ["pg-trgm.js"]);
  else assert.deepEqual(adapters, []);
  const bundle = result.outputFiles[0].text;
  assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(bundle));
  await writeFile(name + ".mjs", bundle);
  const runtime = await import("./" + name + ".mjs");
  const {extensions} = runtime;
  if (name === "selected") {
    assert.equal(extensions.pgcrypto.schema, "packed_crypto");
    assert.equal(Object.keys(extensions.pgcrypto.sql.functions).length, 37);
    assert.deepEqual(Object.keys(extensions.pgcrypto.sql.operators), []);
    const url = process.env.LOOM_PACKED_PGCRYPTO_DATABASE_URL;
    assert(url, "Missing disposable PostgreSQL18 checked-compilation fixture");
    const schema = runtime.defineSchema(() => ({}));
    const connection = await runtime.connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
    try {
      const quotedApi = runtime.createPgcrypto_1_4({ name:"pgcrypto",version:"1.4",schema:'packed"crypto',apiSupport:{status:"verified",digest:"072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8"} });
      for (const [api, namespace] of [[extensions.pgcrypto, '"packed_crypto"'], [quotedApi, '"packed""crypto"']]) {
        const query = connection.db.select({ hash: api.digest("abc", "sha256", "text") }).from(sql.raw("(values (1)) fixture(id)")).toSQL();
        assert(query.sql.includes(namespace + '."digest"'));
        assert(query.params.includes("abc"));
        assert(query.params.includes("sha256"));
      }
    } finally { await connection.close(); }
  } else if (name === "absent") assert.equal(extensions, undefined);
  else if (name === "unsupported") assert.equal(extensions.pgcrypto.digest, undefined);
}
console.info(JSON.stringify({ pgcryptoConsumerEvidence: { tarballSha256: ${JSON.stringify(tarballSha256)}, nodeVersion: process.version, isolatedInstall: true, frozenReinstall: true, installedToolingFirstGeneration: true, publicDeclarations: true, nodeRuntimeWithoutBun: true, checkedPublicCompilation: true, nativePgcryptoFunctionExecuted: false, selectedBundleExcludesUnselectedAdaptersAndTooling: true, absentBundleHasNoAdapter: true, otherBundleExcludesPgcrypto: true, unsupportedVersionDescriptor: true } }));
`,
    );
    await withExtensionDatabase(async (url) => {
      console.info((await run(["node", "verify.mjs"], root, url)).trim());
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 180000);
