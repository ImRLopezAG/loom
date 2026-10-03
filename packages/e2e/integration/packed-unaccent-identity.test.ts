import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { withExtensionDatabase } from "../fixtures/extension-database";

const descriptor = {
  name: "unaccent",
  version: "1.1",
  schema: 'accent"schema',
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
} as const;

test("packed Unaccent public entries share nominal declarations and native dictionary identity", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-packed-unaccent-"));
  const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
  const manifest = await Bun.file(join(source, "package.json")).json();
  async function run(command: string[], cwd = root, databaseUrl?: string) {
    const env = { ...process.env };
    if (databaseUrl) env.LOOM_PACKED_UNACCENT_DATABASE_URL = databaseUrl;
    const child = Bun.spawn(command, {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 120000,
      env,
    });
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
        if (value) output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
      }
      output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
    }
    assert.equal(code, 0, `${command.join(" ")}\n${output}`);
  }
  try {
    await run(["bun", "pm", "pack", "--filename", join(root, "loom.tgz"), "--ignore-scripts"], source);
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: {
          loom: "file:./loom.tgz",
          "drizzle-orm": manifest.devDependencies["drizzle-orm"],
          effect: manifest.dependencies.effect,
          valibot: manifest.dependencies.valibot,
          esbuild: manifest.dependencies.esbuild,
          pg: manifest.dependencies.pg,
        },
        devDependencies: {
          typescript: manifest.devDependencies.typescript,
          "@types/node": manifest.devDependencies["@types/node"],
          "@types/pg": manifest.devDependencies["@types/pg"],
        },
      }),
    );
    await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
    await run(["bun", "install", "--ignore-scripts", "--frozen-lockfile"]);
    await writeFile(
      join(root, "pending.ts"),
      extensionBindingsSource({ unaccent: { version: "1.1", schema: descriptor.schema } }),
    );
    await writeFile(join(root, "absent.ts"), extensionBindingsSource(undefined));
    await writeFile(join(root, "empty.ts"), extensionBindingsSource({}));
    await writeFile(
      join(root, "imports.mjs"),
      `import assert from "node:assert/strict";
import { createUnaccent_1_1, dictionaryReference } from "loom/extensions/unaccent";
import { withUnaccentDictionaries, restoreUnaccentDictionary } from "loom/tooling/extensions/unaccent";
for (const value of [createUnaccent_1_1, dictionaryReference, withUnaccentDictionaries, restoreUnaccentDictionary]) assert.equal(typeof value, "function");
console.log("public ESM imports ready");
`,
    );
    await writeFile(
      join(root, "probe.ts"),
      `import type { SQL } from "drizzle-orm";
import { createUnaccent_1_1, dictionaryReference, type DictionaryReference } from "loom/extensions/unaccent";
import { withUnaccentDictionaries, restoreUnaccentDictionary } from "loom/tooling/extensions/unaccent";
import { extensions as pending } from "./pending";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
const descriptor = ${JSON.stringify(descriptor)} as const;
const api = createUnaccent_1_1(descriptor);
const reference = dictionaryReference({ schema: 'custom"dictionaries', name: "dictionary" });
function compileOnly() {
  void withUnaccentDictionaries("postgresql://operator/fixture", descriptor, async dictionaries => {
    const facts = await dictionaries.createDictionary(reference);
    const nominal: DictionaryReference = facts.reference;
    const expression: SQL<string | null> = api.unaccent(nominal, "Æther Hôtel");
    const installed = await dictionaries.inspectDictionary();
    const toolingNominal: DictionaryReference = installed.reference;
    const defaultExpression: SQL<string | null> = api.unaccent(toolingNominal, "Æther Hôtel");
    await dictionaries.inspectDictionary(reference);
    await dictionaries.setRules(reference, "unaccent");
    await dictionaries.reloadRules(reference);
    // @ts-expect-error Facts remain immutable across public entries.
    facts.owner = "other";
    // @ts-expect-error Nested template facts remain immutable.
    facts.template.name = "other";
    // @ts-expect-error Structural copies cannot mint nominal references.
    await dictionaries.createDictionary({ schema: "custom", name: "dictionary" });
    // @ts-expect-error Rules are installed basenames represented by text.
    await dictionaries.setRules(reference, 1);
    // @ts-expect-error Tooling does not expose its native client.
    dictionaries.client;
    // @ts-expect-error Tooling does not expose its tracked generic runner.
    dictionaries.run;
    // @ts-expect-error Tooling does not expose an arbitrary SQL executor.
    dictionaries.query;
    // @ts-expect-error Tooling result types are fixed.
    await dictionaries.inspectDictionary<number>();
    void [expression, defaultExpression];
  });
  void restoreUnaccentDictionary("postgresql://operator/fixture", descriptor);
  // @ts-expect-error Restoration has a fixed default dictionary target.
  void restoreUnaccentDictionary("postgresql://operator/fixture", descriptor, reference);
  // @ts-expect-error Restoration has no alternate rules argument.
  void restoreUnaccentDictionary("postgresql://operator/fixture", descriptor, undefined, "alternate");
  // @ts-expect-error Raw OIDs are not dictionary references.
  api.unaccent(123, "é");
  // @ts-expect-error Text names are not dictionary references.
  api.unaccent("custom.dictionary", "é");
  // @ts-expect-error Qualified objects must come from the nominal factory.
  api.unaccent({ schema: "custom", name: "dictionary" }, "é");
  // @ts-expect-error Result codecs cannot be selected with a generic argument.
  api.unaccent<number>("é");
  // @ts-expect-error Dictionary maintenance is absent from application bindings.
  api.createDictionary;
  // @ts-expect-error Restoration is absent from application bindings.
  api.restoreUnaccentDictionary;
  // @ts-expect-error Captured but unaccepted Unaccent remains descriptor-only.
  pending.unaccent.unaccent("é");
}
const pendingStatus: "verified" | "unverified" = pending.unaccent.apiSupport.status;
const noExtensions: undefined = absent;
const emptyExtensions: undefined = empty;
void [compileOnly, pendingStatus, noExtensions, emptyExtensions];
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
    const readiness = await Promise.allSettled([
      run(["node", "imports.mjs"]),
      run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]),
    ]);
    const failures = readiness.flatMap((result) => (result.status === "rejected" ? [result.reason] : []));
    if (failures.length) throw new AggregateError(failures, "Packed public ESM/declaration probes failed");
    await writeFile(
      join(root, "runtime.ts"),
      `import { createUnaccent_1_1, dictionaryReference } from "loom/extensions/unaccent";
export const api = createUnaccent_1_1(${JSON.stringify(descriptor)} as const);
export const reference = dictionaryReference({ schema: 'custom"dictionaries', name: "bundle_dictionary" });
export const expression = api.unaccent(reference, "Æther Hôtel");
`,
    );
    await writeFile(
      join(root, "verify.mjs"),
      String.raw`import assert from "node:assert/strict";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { LanguageVariant, SyntaxKind } from "typescript/unstable/ast";
import { createScanner } from "typescript/unstable/ast/scanner";
const runtimeEntry = fileURLToPath(import.meta.resolve("loom/extensions/unaccent"));
const toolingEntry = fileURLToPath(import.meta.resolve("loom/tooling/extensions/unaccent"));
function moduleSpecifiers(text) {
  const scanner = createScanner(true, LanguageVariant.Standard, text);
  const tokens = [];
  const templates = [];
  let braces = 0;
  const regexStarts = new Set([
    SyntaxKind.OpenParenToken, SyntaxKind.OpenBracketToken, SyntaxKind.OpenBraceToken,
    SyntaxKind.CommaToken, SyntaxKind.ColonToken, SyntaxKind.SemicolonToken,
    SyntaxKind.EqualsToken, SyntaxKind.EqualsGreaterThanToken, SyntaxKind.ReturnKeyword,
    SyntaxKind.ExclamationToken, SyntaxKind.AmpersandAmpersandToken, SyntaxKind.BarBarToken,
    SyntaxKind.QuestionToken, SyntaxKind.QuestionQuestionToken,
  ]);
  for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFile; kind = scanner.scan()) {
    if ((kind === SyntaxKind.SlashToken || kind === SyntaxKind.SlashEqualsToken) &&
        (!tokens.length || regexStarts.has(tokens.at(-1).kind))) kind = scanner.reScanSlashToken();
    if (kind === SyntaxKind.CloseBraceToken && templates.at(-1) === braces) {
      kind = scanner.reScanTemplateToken(false);
      if (kind === SyntaxKind.TemplateTail) templates.pop();
    } else if (kind === SyntaxKind.OpenBraceToken) braces++;
    else if (kind === SyntaxKind.CloseBraceToken) braces--;
    if (kind === SyntaxKind.TemplateHead) templates.push(braces);
    tokens.push({ kind, value: scanner.getTokenValue() });
  }
  const imports = new Set();
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const next = tokens[index + 1];
    if (token.kind === SyntaxKind.FromKeyword && next?.kind === SyntaxKind.StringLiteral) imports.add(next.value);
    if (token.kind !== SyntaxKind.ImportKeyword) continue;
    if (next?.kind === SyntaxKind.StringLiteral) imports.add(next.value);
    if (next?.kind === SyntaxKind.OpenParenToken && tokens[index + 2]?.kind === SyntaxKind.StringLiteral)
      imports.add(tokens[index + 2].value);
  }
  return imports;
}
assert.deepEqual([...moduleSpecifiers('import "./side.js"; import { value } from "./value.js"; export { value } from "./export.js"; type Value = import("./type.js").Value;')], ["./side.js", "./value.js", "./export.js", "./type.js"]);
assert.equal(moduleSpecifiers('// import "./comment.js";\nconst text = "import \\\"./string.js\\\"";').size, 0);
assert.deepEqual([...moduleSpecifiers('const pattern = /import "ignored"/; import "./after-regex.js";')], ["./after-regex.js"]);
const tick = String.fromCharCode(96);
assert.equal(moduleSpecifiers('const text = ' + tick + 'import "./template-text.js"' + tick + ';').size, 0);
const interpolated = 'const text = ' + tick + 'import "./outer-text.js" \${ { nested: ' + tick + 'import "./inner-text.js" \${import("./interpolation.js")}' + tick + ' } }' + tick + '; import "./after-template.js";';
assert.deepEqual([...moduleSpecifiers(interpolated)], ["./interpolation.js", "./after-template.js"]);
async function graph(entry, declarations = false) {
  const modules = new Map();
  async function visit(path) {
    const canonical = await realpath(path);
    if (modules.has(canonical)) return;
    const text = await readFile(canonical, "utf8");
    modules.set(canonical, text);
    for (let specifier of moduleSpecifiers(text)) {
      if (!specifier.startsWith(".")) continue;
      if (declarations) specifier = specifier.replace(/\.js$/, ".d.ts");
      await visit(resolve(dirname(canonical), specifier));
    }
  }
  await visit(entry);
  return modules;
}
const runtimeGraph = await graph(runtimeEntry);
const toolingGraph = await graph(toolingEntry);
const union = new Map([...runtimeGraph, ...toolingGraph]);
const leaves = [...union].filter(([, text]) => /Symbol\(["']loom:unaccent:dictionary["']\)/.test(text));
assert.equal(leaves.length, 1, "Both public JS graphs must share one physical dictionary identity leaf");
const [leaf, leafSource] = leaves[0];
assert(runtimeGraph.has(leaf) && toolingGraph.has(leaf));
assert.match(leafSource, /new WeakSet/);
assert.match(leafSource, /\.has\(/);
assert.match(leafSource, /\.add\(/);
assert.match(leafSource, /Object\.freeze\(/);
const runtimeTypes = await graph(runtimeEntry.replace(/\.js$/, ".d.ts"), true);
const toolingTypes = await graph(toolingEntry.replace(/\.js$/, ".d.ts"), true);
const nominalLeaves = [...new Map([...runtimeTypes, ...toolingTypes])].filter(([, text]) => /interface DictionaryReference\b/.test(text) && /unique symbol/.test(text));
assert.equal(nominalLeaves.length, 1, "Published declarations must share one nominal dictionary identity");
assert(runtimeTypes.has(nominalLeaves[0][0]) && toolingTypes.has(nominalLeaves[0][0]));
const dependencyNames = DEPENDENCY_NAMES;
async function bundle(entry) {
  return build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", target: "node22", write: false, metafile: true, external: dependencyNames });
}
const runtime = await bundle("runtime.ts");
const inputs = Object.keys(runtime.metafile.inputs);
assert(inputs.some(name => name.endsWith("/core/extensions/adapters/unaccent.js")));
assert(!inputs.some(name => name.includes("/tooling/") || /\/adapters\/(?:citext|pg-trgm|pg-tiktoken|fuzzystrmatch|pg-jsonschema|uuid-ossp|pg-uuidv7)\.js$/.test(name)));
const output = runtime.outputFiles[0].text;
assert.match(output, /loom:unaccent:dictionary/);
assert(!/\bBun\b|from ["']bun(?:["':])/.test(output));
assert(!/withUnaccentDictionaries|restoreUnaccentDictionary|createDictionary|setRules|reloadRules|unaccent-template-inspection|unaccent-dictionary-restoration/.test(output));
assert(!/createCitext_|createPgTrgm_|createPgTiktoken_|createFuzzystrmatch_|createPgJsonschema_|createUuidOssp_|createPgUuidv7_/.test(output));
await writeFile("runtime.mjs", output);
const { api, expression } = await import("./runtime.mjs");
assert.equal(typeof api.unaccent, "function");
assert(expression.getSQL().queryChunks.length > 0);
for (const method of ["createDictionary", "setRules", "reloadRules", "restoreUnaccentDictionary"]) assert.equal(api[method], undefined);
for (const entry of ["pending", "absent", "empty"]) {
  const result = await bundle(entry + ".ts");
  const retained = result.outputFiles[0].text;
  assert(!/loom:unaccent:dictionary|unaccent-template-inspection|unaccent-dictionary-restoration|withUnaccentDictionaries/.test(retained));
  assert(!Object.keys(result.metafile.inputs).some(name => name.endsWith("/adapters/unaccent.js") || name.endsWith("/tooling/extensions/unaccent.js")));
  await writeFile(entry + ".mjs", retained);
  const { extensions } = await import("./" + entry + ".mjs");
  if (entry === "pending") {
    assert.equal(extensions.unaccent.apiSupport.status, "unverified");
    assert.equal(extensions.unaccent.unaccent, undefined);
  } else assert.equal(extensions, undefined);
}
console.log("shared JS/declaration leaf and selected/pending bundle controls passed");
`.replace("DEPENDENCY_NAMES", JSON.stringify(Object.keys(manifest.dependencies))),
    );
    await run(["node", "verify.mjs"]);
    await writeFile(
      join(root, "native.mjs"),
      String.raw`import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { connectDatabase, defineSchema } from "loom/server";
import { createUnaccent_1_1, dictionaryReference } from "loom/extensions/unaccent";
import { withUnaccentDictionaries } from "loom/tooling/extensions/unaccent";
const descriptor = FIXTURE_DESCRIPTOR;
const url = process.env.LOOM_PACKED_UNACCENT_DATABASE_URL;
assert(url);
async function observe(work) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try { return await work(client); } finally { await client.end(); }
}
await observe(async client => {
  const version = await client.query("SHOW server_version_num");
  assert.equal(Math.floor(Number(version.rows[0].server_version_num) / 10000), 18);
  await client.query('CREATE SCHEMA "accent""schema"; CREATE EXTENSION unaccent WITH SCHEMA "accent""schema"; CREATE SCHEMA "custom""dictionaries"; CREATE SCHEMA conflicting; CREATE TEXT SEARCH DICTIONARY conflicting.unaccent(TEMPLATE=pg_catalog.simple)');
});
const api = createUnaccent_1_1(descriptor);
const reference = dictionaryReference({ schema: 'custom"dictionaries', name: 'dict"; drop schema public;--' });
const result = await withUnaccentDictionaries(url, descriptor, async dictionaries => {
  const installed = await dictionaries.inspectDictionary();
  assert.deepEqual({ schema: installed.reference.schema, name: installed.reference.name }, { schema: descriptor.schema, name: "unaccent" });
  assert.equal(installed.options, "rules = 'unaccent'");
  const template = await dictionaries.inspectTemplate();
  assert.equal(template.schema, descriptor.schema);
  assert.equal(template.name, "unaccent");
  const created = await dictionaries.createDictionary(reference);
  assert.deepEqual(created.template, { schema: descriptor.schema, name: "unaccent" });
  assert(Object.isFrozen(created) && Object.isFrozen(created.template));
  assert.deepEqual(await dictionaries.setRules(reference, "unaccent"), created);
  assert.deepEqual(await dictionaries.reloadRules(reference), created);
  return { created, installed };
});
assert.equal(result.completion, "committed");
await observe(async client => {
  await client.query("SET search_path=conflicting,pg_catalog");
  const lexemes = await client.query("SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,'Hôtel') AS lexemes", [result.value.created.reference.schema, result.value.created.reference.name]);
  assert.deepEqual(lexemes.rows, [{ lexemes: ["Hotel"] }]);
  const actual = await client.query('SELECT tn.nspname AS schema,t.tmplname AS name FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate JOIN pg_catalog.pg_namespace tn ON tn.oid=t.tmplnamespace WHERE n.nspname=$1 AND d.dictname=$2', [reference.schema, reference.name]);
  assert.deepEqual(actual.rows, [{ schema: descriptor.schema, name: "unaccent" }]);
});
const schema = defineSchema(() => ({}));
const connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
try {
  const rows = await connection.db.select({
    value: api.unaccent(result.value.created.reference, "Æther Hôtel"),
    defaultValue: api.unaccent(result.value.installed.reference, "Æther Hôtel"),
  }).from(sql.raw("(values (1)) fixture(id)"));
  assert.deepEqual(rows, [{ value: "AEther Hotel", defaultValue: "AEther Hotel" }]);
} finally { await connection.close(); }
const copy = { ...result.value.created.reference };
assert.deepEqual(Object.getOwnPropertySymbols(copy), Object.getOwnPropertySymbols(result.value.created.reference));
assert(Object.getOwnPropertySymbols(copy).length > 0);
assert.throws(() => api.unaccent(copy, "é"), /factory-created qualified dictionary reference/);
assert.throws(() => api.unaccent({ schema: reference.schema, name: reference.name }, "é"), /factory-created qualified dictionary reference/);
const rollbackReference = dictionaryReference({ schema: reference.schema, name: "nominal_rollback" });
await assert.rejects(withUnaccentDictionaries(url, descriptor, async dictionaries => {
  await dictionaries.createDictionary(rollbackReference);
  await assert.rejects(dictionaries.inspectDictionary({ ...rollbackReference }), /factory-created qualified dictionary reference/);
}), error => error instanceof Error && error.completion === "rolled-back");
await observe(async client => {
  const dictionaries = await client.query("SELECT d.dictname FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace WHERE n.nspname=$1 AND d.dictname=$2", [rollbackReference.schema, rollbackReference.name]);
  assert.equal(dictionaries.rows.length, 0);
  const lexemes = await client.query("SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,'Hôtel') AS lexemes", [reference.schema, reference.name]);
  assert.deepEqual(lexemes.rows, [{ lexemes: ["Hotel"] }]);
});
const fresh = await withUnaccentDictionaries(url, descriptor, dictionaries => dictionaries.inspectDictionary(reference));
assert.equal(fresh.completion, "committed");
api.unaccent(fresh.value.reference, "é");
console.log("native mutual reference transfers, copy rejection, sticky rollback and fresh owner passed");
`.replace("FIXTURE_DESCRIPTOR", JSON.stringify(descriptor)),
    );
    await withExtensionDatabase(async (url) => {
      await run(["node", "native.mjs"], root, url);
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 240000);
