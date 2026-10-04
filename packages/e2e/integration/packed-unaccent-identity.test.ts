import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { withMigrationConnection } from "../../../apps/loom/src/tooling/migrations/connection";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { unaccentConsumerProofCase } from "../fixtures/unaccent-proof-cases";

const descriptor = {
  name: "unaccent",
  version: "1.1",
  schema: 'accent"schema',
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  unaccentConsumerProofCase,
  async () => {
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
          if (value)
            output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
        }
        output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      }
      assert.equal(code, 0, `${command.join(" ")}\n${output}`);
    }
    try {
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
      const packedBytes = await readFile(join(root, "kello.tgz"));
      const packedSha256 = sha256(packedBytes);
      if (retainedArtifactPath !== undefined) {
        // COPYFILE_EXCL: an existing file at the host path is an error, never silently replaced.
        await copyFile(join(root, "kello.tgz"), retainedArtifactPath, constants.COPYFILE_EXCL);
        assert.equal(
          sha256(await readFile(retainedArtifactPath)),
          packedSha256,
          "Retained tarball bytes differ from the pack",
        );
      }
      // The consumer's scripts run under whichever `node` is on PATH; the isolated profile requires Node 24.
      await run([
        "node",
        "-e",
        "if (process.versions.node.split('.')[0] !== '24') throw new Error('Isolated consumer requires Node 24, not ' + process.version)",
      ]);
      // Relocated bundles resolve their external imports from the consumer root.
      // Declare the packed runtime dependencies there; the bundle metafile below
      // verifies that every external import has an explicit consumer dependency.
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
      // The first install is compared with the retained archive, then ONLY this disposable consumer's node_modules is
      // removed (the lockfile is kept byte-for-byte) so the frozen install is a genuine cold reinstall, and the result is
      // compared with the same archive again.
      assert.equal(
        sha256(await readFile(join(root, "kello.tgz"))),
        packedSha256,
        "The tarball changed during installation",
      );
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      const lockfileSha256 = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256, "Removing node_modules changed the lockfile");
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256, "The frozen reinstall changed the lockfile");
      assert.equal(
        sha256(await readFile(join(root, "kello.tgz"))),
        packedSha256,
        "The tarball changed during reinstall",
      );
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      // Authored project inputs cross the installed public generator boundary here.
      // Parent-emitted source controls below remain independent and retain their assertions.
      await writeFile(
        join(root, "generate-projects.mjs"),
        String.raw`import assert from "node:assert/strict";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
const packageRoot = await realpath("node_modules/kello");
assert((await realpath(fileURLToPath(import.meta.resolve("kello/tooling")))).startsWith(packageRoot + "/"));
const generations = [];
for (const placement of ["extensions", "project_accents"]) {
  const project = resolve("project-" + placement);
  await initializeProject(project, "packedunaccent");
  const component = resolve(project, "kello/components/normalize");
  await mkdir(resolve(component, "contracts"), { recursive: true });
  await mkdir(resolve(component, "functions"));
  const selected = placement === "extensions" ? { version: "1.1" } : { version: "1.1", schema: placement };
  await writeFile(resolve(project, "kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { unaccent: ' + JSON.stringify(selected) + ' } } });');
  await writeFile(resolve(project, "kello/schema.ts"), [
    'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";',
    'import type { SQL } from "drizzle-orm";',
    'const nullable: SQL<string | null> = extensions.unaccent.unaccent(null);',
    'if (extensions.unaccent.version !== "1.1" || extensions.unaccent.schema !== ' + JSON.stringify(placement) + ') throw new Error("Wrong first-load public selection");',
    'void nullable; export default defineSchema(() => ({}), { namespace: "app" });',
  ].join("\n"));
  await writeFile(resolve(component, "setup.ts"), 'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "normalize", extensions: { unaccent: { versions: ["1.1"] } }, rpc: ({ os }) => ({ os }) });');
  await writeFile(resolve(project, "kello/app.config.ts"), 'import { defineApplication } from "kello/server"; import normalize from "./components/normalize/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(normalize); export default app;');
  await writeFile(resolve(component, "schema.ts"), [
    'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";',
    'extensions.unaccent.unaccent(extensions.unaccent.dictionary, null);',
    'if (Object.keys(extensions).join(",") !== "unaccent" || extensions.unaccent.schema !== ' + JSON.stringify(placement) + ') throw new Error("Wrong virtual child selection");',
    'export default defineSchema(() => ({}));',
  ].join("\n"));
  const result = 'v.object({ implicit: v.nullable(v.string()), explicit: v.nullable(v.string()), missing: v.nullable(v.string()), version: v.literal("1.1"), placement: v.literal(' + JSON.stringify(placement) + ') })';
  await writeFile(resolve(component, "contracts/normalization.ts"), 'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(' + result + ') });');
  await writeFile(resolve(project, "kello/contracts/tasks.ts"), 'import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; const result = ' + result + '; export default defineContract({ list: oc.output(v.object({ root: result, child: result })) });');
  const handler = [
    'const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));',
    'if (binding !== context.extensions) throw new Error("Public generated RPC and Effect bindings differ");',
    'const version: "1.1" = binding.unaccent.version;',
    'const placement: ' + JSON.stringify(placement) + ' = context.extensions.unaccent.schema;',
    'const nullable: SQL<string | null> = binding.unaccent.unaccent(null);',
    'const [row] = await context.db.select({ implicit: context.extensions.unaccent.unaccent("Æther Hôtel"), explicit: binding.unaccent.sql.functions.unaccent(binding.unaccent.dictionary, "Æther Hôtel"), missing: nullable }).from(sql.raw("(values (1)) fixture(id)"));',
    'if (!row) throw new Error("Missing native generated row"); const result = { ...row, version, placement };',
  ].join("\n");
  const imports = 'import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql, type SQL } from "drizzle-orm";';
  await writeFile(resolve(component, "functions/normalization.ts"), imports + '\nexport default os.normalization.router({ run: os.normalization.run.handler(async ({ context }) => {\n' + handler + '\n// @ts-expect-error Unselected families remain absent in the mounted facade.\nvoid context.extensions.pg_trgm;\nreturn result; }) });');
  await writeFile(resolve(project, "kello/functions/tasks.ts"), imports + '\nexport default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {\n' + handler + '\nreturn { root: result, child: await context.components.normalize.rpc.normalization.run() }; }) });');
  await writeFile(resolve(project, "kello/selection-types.ts"), [
    'import { extensions } from "./_generated/extensions"; import type { SQL } from "drizzle-orm";',
    'const version: "1.1" = extensions.unaccent.version;',
    'const placement: ' + JSON.stringify(placement) + ' = extensions.unaccent.schema;',
    'const nullable: SQL<string | null> = extensions.unaccent.unaccent(null);',
    'function compileOnly() {',
    '// @ts-expect-error SQL NULL remains in the emitted public result type.',
    'const required: SQL<string> = extensions.unaccent.unaccent(null);',
    '// @ts-expect-error Unselected keys are absent.',
    'void extensions.pg_trgm;',
    '// @ts-expect-error Generated query bindings do not expose dictionary maintenance.',
    'extensions.unaccent.createDictionary;',
    'void required; } void [version, placement, nullable, compileOnly];',
  ].join("\n"));
  await assert.rejects(readFile(resolve(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
  await assert.rejects(readFile(resolve(component, "_generated/extensions.ts")), { code: "ENOENT" });
  const first = await loadProject(project);
  assert.deepEqual(first.config.database.extensions.unaccent, { version: "1.1", schema: placement });
  assert.equal(first.componentScopes.length, 1);
  assert.deepEqual(Object.keys(first.componentScopes[0].boundExtensions), ["unaccent"]);
  const generated = await generateProject(project);
  assert.equal((await generateProject(project)).version, generated.version);
  const disk = await import(pathToFileURL(resolve(project, "kello/_generated/extensions.ts")));
  const server = await import(pathToFileURL(resolve(project, "kello/_generated/server.ts")));
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["unaccent"]);
  assert.equal(disk.extensions.unaccent.version, "1.1");
  assert.equal(disk.extensions.unaccent.schema, placement);
  const extensionSource = await readFile(resolve(project, "kello/_generated/extensions.ts"), "utf8");
  const childSource = await readFile(resolve(component, "_generated/extensions.ts"), "utf8");
  for (const source of [extensionSource, childSource]) {
    assert(source.includes('from "kello/extensions/unaccent"'));
    assert(!source.includes("tooling/extensions") && !source.includes("pg-trgm"));
  }
  const { runtimeOptions } = await import(pathToFileURL(resolve(project, ".loom/generations", generated.version, "runtime.js")));
  const options = runtimeOptions();
  const mounted = options.scopes.find(scope => scope.name === "normalize");
  assert.deepEqual(Object.keys(mounted.extensions), ["unaccent"]);
  assert.equal(mounted.extensions.unaccent.schema, placement);
  generations.push({ project, placement, version: generated.version });
}
await writeFile("project-generations.json", JSON.stringify(generations));
console.log("isolated published first-load and disk generation completed");
`,
      );
      await run(["bun", "generate-projects.mjs"]);
      for (const placement of ["extensions", "project_accents"])
        await run([join(root, "node_modules/.bin/tsc"), "-p", join(root, "project-" + placement, "tsconfig.json")]);
      await writeFile(
        join(root, "pending.ts"),
        extensionBindingsSource({ unaccent: { version: "future", schema: descriptor.schema } }),
      );
      await writeFile(
        join(root, "selected.ts"),
        extensionBindingsSource({ unaccent: { version: "1.1", schema: descriptor.schema } }),
      );
      await writeFile(join(root, "absent.ts"), extensionBindingsSource(undefined));
      await writeFile(join(root, "empty.ts"), extensionBindingsSource({}));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createUnaccent_1_1, dictionaryReference } from "kello/extensions/unaccent";
import { withUnaccentDictionaries, restoreUnaccentDictionary } from "kello/tooling/extensions/unaccent";
for (const value of [createUnaccent_1_1, dictionaryReference, withUnaccentDictionaries, restoreUnaccentDictionary]) assert.equal(typeof value, "function");
console.log("public ESM imports ready");
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import { createUnaccent_1_1, dictionaryReference, type DictionaryReference } from "kello/extensions/unaccent";
import { withUnaccentDictionaries, restoreUnaccentDictionary } from "kello/tooling/extensions/unaccent";
import { extensions as pending } from "./pending";
import { extensions as selected } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
const descriptor = ${JSON.stringify(descriptor)} as const;
const api = createUnaccent_1_1(descriptor);
const generatedImplicit: SQL<string | null> = selected.unaccent.unaccent("Hôtel");
const generatedExplicit: SQL<string | null> = selected.unaccent.unaccent(selected.unaccent.dictionary, "Æther Hôtel");
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
  // @ts-expect-error Unknown Unaccent versions remain descriptor-only.
  pending.unaccent.unaccent("é");
}
const pendingStatus: "verified" | "unverified" = pending.unaccent.apiSupport.status;
const noExtensions: undefined = absent;
const emptyExtensions: undefined = empty;
void [compileOnly, generatedImplicit, generatedExplicit, pendingStatus, noExtensions, emptyExtensions];
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
        `import { dictionaryReference } from "kello/extensions/unaccent";
import { connectDatabase, defineSchema } from "kello/server";
import { defineRelations, sql } from "drizzle-orm";
import { extensions } from "./selected";
export const api = extensions.unaccent;
export const reference = dictionaryReference({ schema: 'custom"dictionaries', name: "bundle_dictionary" });
export const expression = api.unaccent(reference, "Æther Hôtel");
export async function runGenerated(connectionString: string) {
  const schema = defineSchema(() => ({}));
  const connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString });
  try {
    return await connection.db.select({
      implicit: api.unaccent("Æther Hôtel"),
      explicit: api.unaccent(api.dictionary, "Æther Hôtel"),
    }).from(sql.raw("(values (1)) fixture(id)"));
  } finally { await connection.close(); }
}
`,
      );
      await writeFile(
        join(root, "verify.mjs"),
        String.raw`import assert from "node:assert/strict";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { builtinModules } from "node:module";
import { LanguageVariant, SyntaxKind } from "typescript/unstable/ast";
import { createScanner } from "typescript/unstable/ast/scanner";
const runtimeEntry = fileURLToPath(import.meta.resolve("kello/extensions/unaccent"));
const toolingEntry = fileURLToPath(import.meta.resolve("kello/tooling/extensions/unaccent"));
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
const consumerManifest = JSON.parse(await readFile("package.json", "utf8"));
const declaredPackages = new Set([...Object.keys(consumerManifest.dependencies), ...Object.keys(consumerManifest.devDependencies ?? {})]);
function assertDeclaredExternals(result, label) {
  for (const output of Object.values(result.metafile.outputs)) {
    for (const item of output.imports) {
      if (!item.external || item.path.startsWith("node:") || item.path.startsWith(".")) continue;
      const name = item.path.startsWith("@") ? item.path.split("/").slice(0, 2).join("/") : item.path.split("/")[0];
      if (builtinModules.includes(name)) continue;
      assert(declaredPackages.has(name), label + " imports " + name + ", which the isolated consumer does not declare");
    }
  }
}
async function bundle(entry) {
  const result = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", target: "node22", write: false, metafile: true, external: dependencyNames });
  assertDeclaredExternals(result, entry);
  return result;
}
const runtime = await bundle("runtime.ts");
const inputs = Object.keys(runtime.metafile.inputs);
assert(inputs.some(name => name.endsWith("/core/extensions/adapters/unaccent.js")));
assert(!inputs.some(name => name.includes("/tooling/") || (name.includes("/core/extensions/adapters/") && !name.endsWith("/adapters/unaccent.js"))));
const output = runtime.outputFiles[0].text;
assert.match(output, /loom:unaccent:dictionary/);
assert(!/\bBun\b|from ["']bun(?:["':])/.test(output));
assert(!/withUnaccentDictionaries|restoreUnaccentDictionary|createDictionary|setRules|reloadRules|unaccent-template-inspection|unaccent-dictionary-restoration/.test(output));
assert(!/createCitext_|createPgTrgm_|createPgTiktoken_|createFuzzystrmatch_|createPgJsonschema_|createUuidOssp_|createPgUuidv7_|createPgcrypto_/.test(output));
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
import { connectDatabase, defineSchema } from "kello/server";
import { createUnaccent_1_1, dictionaryReference } from "kello/extensions/unaccent";
import { withUnaccentDictionaries } from "kello/tooling/extensions/unaccent";
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
const { runGenerated } = await import("./runtime.mjs");
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
assert.deepEqual(await runGenerated(url), [{ implicit: "AEther Hotel", explicit: "AEther Hotel" }]);
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
        await withMigrationConnection(url, async (client) => {
          const required = buildRequiredApi({ unaccent: { version: "1.1", schema: descriptor.schema } });
          assert(required?.apis[0]?.textSearch);
          const role = (await client.query<{ role: string }>("SELECT current_user AS role")).rows[0]!.role;
          await verifyRequiredApiOnTarget(client, required, role);
        });
      });
      await writeFile(
        join(root, "project-native.mjs"),
        String.raw`import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { call, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { bootstrapDatabase } from "kello/tooling";
const placement = process.argv[2];
const records = JSON.parse(await readFile("project-generations.json", "utf8"));
const generated = records.find(record => record.placement === placement);
assert(generated);
const { runtimeOptions } = await import(pathToFileURL(resolve(generated.project, ".loom/generations", generated.version, "runtime.js")));
const options = runtimeOptions();
const url = process.env.LOOM_PACKED_UNACCENT_DATABASE_URL;
assert(url);
const client = new pg.Client({ connectionString: url });
await client.connect();
const role = "packed_unaccent_" + randomUUID().replaceAll("-", "");
const quote = value => '"' + value.replaceAll('"', '""') + '"';
let runtime;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(placement) + "; CREATE EXTENSION unaccent WITH SCHEMA " + quote(placement) + " VERSION '1.1'");
  await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole: role });
  runtime = await createRpcRuntime({ ...options, connectionString: url, deployment: "packed-generated-unaccent", auth: defineRpcAuth({ authorize: async () => {} }), assertActive: async signal => signal.throwIfAborted() });
  const routes = runtime.router.tasks;
  assert(routes && !(routes instanceof Procedure));
  const route = routes.list;
  assert(route instanceof Procedure);
  const invocation = { requestId: "packed-generated-unaccent", identity: null, signal: new AbortController().signal };
  const actual = await call(route, undefined, { context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) }, path: ["tasks", "list"] });
  const native = await client.query("SELECT " + quote(placement) + ".unaccent($1::text) AS implicit, " + quote(placement) + ".unaccent(pg_catalog.format('%I.%I',$2::text,'unaccent')::pg_catalog.regdictionary,$1::text) AS explicit, " + quote(placement) + ".unaccent(NULL::text) AS missing", ["Æther Hôtel", placement]);
  assert.deepEqual(native.rows, [{ implicit: "AEther Hotel", explicit: "AEther Hotel", missing: null }]);
  const expected = { ...native.rows[0], version: "1.1", placement };
  assert.deepEqual(actual, { root: expected, child: expected });
} finally {
  try { await runtime?.stop(); } finally {
    try {
      const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [role]);
      if (exists.rows.length) await client.query("GRANT " + quote(role) + " TO CURRENT_USER; DROP OWNED BY " + quote(role) + "; DROP ROLE " + quote(role));
    } finally { await client.end(); }
  }
}
console.log("published generated root and mounted RPC/Effect native results agree");
`,
      );
      for (const placement of ["extensions", "project_accents"])
        await withExtensionDatabase((url) => run(["node", "project-native.mjs", placement], root, url));
      assert.equal(
        sha256(await readFile(join(root, "kello.tgz"))),
        packedSha256,
        "The tarball changed during verification",
      );
      // After every native run, immediately before cleanup: the package they used is still the retained archive's bytes.
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
