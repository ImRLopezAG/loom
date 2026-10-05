import { recordPackedConsumerObservation } from "../fixtures/packed-consumer-observation";
import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { xml2ConsumerProofCase } from "../fixtures/xml2-consumer-proof-cases";
import { xml2Members } from "../fixtures/xml2-proof-cases";

// Native installation placement is quoted on purpose; defineConfig accepts only canonical lowercase ASCII names.
const descriptor = {
  name: "xml2",
  version: "1.2",
  schema: 'xml"2',
  apiSupport: {
    status: "verified",
    digest: "0353f94ca9d2e1f73f4a490e2a210a6412e88dd516028b44e9b81a59ff3fb03c",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  xml2ConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-xml2-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_XML2_DATABASE_URL = databaseUrl;
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
      for (const [file, selection] of Object.entries({
        selected: { xml2: { version: "1.2", schema: descriptor.schema } },
        future: { xml2: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createXml2_1_2, textCodec } from "kello/extensions/xml2";
const api = createXml2_1_2(${JSON.stringify(descriptor)});
assert.deepEqual(Object.keys(api.sql.overloads).toSorted(), ${JSON.stringify([...xml2Members].toSorted())});
assert.equal(api.schema, ${JSON.stringify(descriptor.schema)});
assert.throws(() => api.xpathTable({ relation: { schema: "s", name: "t" }, key: "k", document: "d", xpaths: [], fields: { k: textCodec }, alias: "x" }));
assert.throws(() => api.xpathTable({ source: Object.freeze({}), key: "k", document: "d", xpaths: ["/a"], fields: { k: textCodec, a: textCodec }, alias: "x" }), /managed provenance/);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createXml2_1_2({ ...api, apiSupport: support }), /exact verified contract/);
assert.throws(() => createXml2_1_2({ ...${JSON.stringify(descriptor)}, version: "1.1" }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import { textCodec, type NonfiniteNumber } from "kello/extensions/xml2";
import type { SQL } from "drizzle-orm";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.xml2;
const placement: 'xml"2' = api.schema;
const version: "1.2" = api.version;
const text: SQL<string | null> = api.xpathString("<a/>", "/a");
const flag: SQL<boolean | null> = api.valid("<a/>");
const number: SQL<number | NonfiniteNumber | null> = api.xpathNumber("<a/>", "/a");
const transformed: SQL<string | null> = api.xsltProcess("<a/>", "<x/>", "p=1");
const rows = api.xpathTable({ relation: { schema: "app", name: "docs" }, key: "id", document: "body", xpaths: ["/a"], fields: { id: textCodec, a: textCodec }, alias: "t" });
const column: SQL<string | null> = rows.columns.a;
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error Documents are text, not booleans.
api.valid(true);
// @ts-expect-error xpath_table accepts no raw WHERE text.
api.xpathTable({ relation: { schema: "app", name: "docs" }, key: "id", document: "body", xpaths: ["/a"], fields: { id: textCodec, a: textCodec }, alias: "t", where: "true" });
// @ts-expect-error Unselected families remain absent.
void custom.bloom;
// @ts-expect-error Future versions expose descriptors only.
void future.xml2.xpathString;
void [placement, version, text, flag, number, transformed, column, missing, noSelection];
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
      await run(["node", "imports.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
      await writeFile(join(root, "runtime.ts"), `export { extensions } from "./selected";`);
      await writeFile(
        join(root, "verify.mjs"),
        String.raw`import assert from "node:assert/strict";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const root = await realpath("node_modules/kello");
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/xml2")));
assert(entry.startsWith(root + "/dist/"));
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const dependencies = new Set([...Object.keys(manifest.dependencies), ...Object.keys(manifest.devDependencies)]);
async function bundle(name) {
  const result = await build({ entryPoints: [name + ".ts"], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: EXTERNALS });
  for (const output of Object.values(result.metafile.outputs)) for (const item of output.imports) {
    if (!item.external || item.path.startsWith("node:") || item.path.startsWith(".")) continue;
    const packageName = item.path.startsWith("@") ? item.path.split("/").slice(0, 2).join("/") : item.path.split("/")[0];
    assert(builtinModules.includes(packageName) || dependencies.has(packageName));
  }
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some(path => path.includes("/tooling/")));
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/xml2.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/xml2.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["xml2"]); assert.equal(Object.keys(extensions.xml2.sql.overloads).length, 13); }
  else if (name === "future") { assert.equal(extensions.xml2.apiSupport.status, "unverified"); assert.equal(extensions.xml2.xpathString, undefined); }
  else assert.equal(extensions, undefined);
}
for (const name of ["runtime", "future", "absent", "empty"]) await bundle(name);
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      // Migration DDL is generated by packed tooling, outside the runtime bundle checked above.
      await writeFile(
        join(root, "schema.mjs"),
        `import { defineSchema } from "kello/server";
export const schema = defineSchema((fields) => ({ docs: { key: fields.text().notNull(), body: fields.text().notNull() } }), { namespace: "packed_app" });
`,
      );
      await writeFile(
        join(root, "migrate.mjs"),
        `import { writeFile } from "node:fs/promises";
import { createSnapshot, emptySnapshot, migrationStatements } from "kello/tooling";
import { schema } from "./schema.bundle.mjs";
await writeFile("migration.json", JSON.stringify(await migrationStatements(await emptySnapshot("packed_app"), await createSnapshot(schema))));
`,
      );
      await writeFile(
        join(root, "project-native.mjs"),
        String.raw`import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { connectDatabase } from "kello/server";
import { textCodec } from "kello/extensions/xml2";
import { schema } from "./schema.mjs";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_XML2_DATABASE_URL;
assert(url);
const api = extensions.xml2;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const literal = value => "'" + value.replaceAll("'", "''") + "'";
const ns = quote(api.schema);
const doc = "<article><title>O'Brien &amp; Co</title><pages>12</pages><tag>a</tag><tag>b</tag></article>";
const xsl = '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:output method="text"/>'
  + '<xsl:param name="p" select="' + "'none'" + '"/><xsl:template match="/"><xsl:value-of select="concat(/article/title, '
  + "':'" + ', $p)"/></xsl:template></xsl:stylesheet>';
const encodedInput = '<t a="1">' + "&'</t>";
const client = new pg.Client({ connectionString: url });
await client.connect();
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + ns + "; CREATE EXTENSION xml2 WITH SCHEMA " + ns + " VERSION '1.2'");
  assert.deepEqual((await client.query("select extversion, extnamespace::regnamespace::text ns from pg_extension where extname='xml2'")).rows, [{ extversion: "1.2", ns }]);
  for (const statement of JSON.parse(await readFile("migration.json", "utf8"))) await client.query(statement);
  await client.query("insert into packed_app.docs (key, body) values ('a1', $1)", [doc]);
  connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
  const fn = api.sql.functions;
  const d = literal(doc);
  const cases = {
    encoded: [api.encodeSpecialChars(encodedInput), "xml_encode_special_chars(" + literal(encodedInput) + ")"],
    valid: [api.valid(doc), "xml_valid(" + d + ")"],
    invalid: [fn.xml_valid("<"), "xml_valid('<')"],
    bool: [api.xpathBool(doc, "/article/pages"), "xpath_bool(" + d + ", '/article/pages')"],
    list3: [api.xpathList(doc, "/article/tag", "|"), "xpath_list(" + d + ", '/article/tag', '|')"],
    list2: [fn.xpath_list(doc, "/article/tag"), "xpath_list(" + d + ", '/article/tag')"],
    nodes4: [api.xpathNodeset(doc, "/article/tag", "set", "item"), "xpath_nodeset(" + d + ", '/article/tag', 'set', 'item')"],
    nodes3: [api.xpathNodeset(doc, "/article/tag", "set"), "xpath_nodeset(" + d + ", '/article/tag', 'set')"],
    nodes2: [fn.xpath_nodeset(doc, "/article/tag"), "xpath_nodeset(" + d + ", '/article/tag')"],
    number: [api.xpathNumber(doc, "/article/pages"), "xpath_number(" + d + ", '/article/pages')"],
    nan: [api.xpathNumber("<a>no</a>", "/a"), "xpath_number('<a>no</a>', '/a')"],
    string: [fn.xpath_string(doc, "/article/title"), "xpath_string(" + d + ", '/article/title')"],
    xslt3: [api.xsltProcess(doc, xsl, "p='v'"), "xslt_process(" + d + ", " + literal(xsl) + ", " + literal("p='v'") + ")"],
    xslt2: [fn.xslt_process(doc, xsl), "xslt_process(" + d + ", " + literal(xsl) + ")"],
    strict: [api.xsltProcess(null, xsl, "p=1"), "xslt_process(NULL, " + literal(xsl) + ", 'p=1')"],
  };
  const projection = Object.fromEntries(Object.entries(cases).map(([key, [expression]]) => [key, expression]));
  const actual = await connection.transaction(db => db.select(projection).from(sql.raw("(values (1)) fixture(id)")));
  const native = (await client.query("select " + Object.entries(cases).map(([key, [, call]]) => ns + "." + call + " " + key).join(", "))).rows;
  assert.deepEqual(actual, native);
  const { number, nan, xslt3, xslt2, strict } = actual[0];
  assert.deepEqual({ number, nan, xslt3, xslt2, strict }, { number: 12, nan: null, xslt3: "O'Brien & Co:v", xslt2: "O'Brien & Co:none", strict: null });
  const nonfinite = await connection.transaction(db => db.select({ infinity: api.xpathNumber("<a/>", "1 div 0"), negative: fn.xpath_number("<a/>", "-1 div 0"), overflow: api.xpathNumber("<a>1e40</a>", "/a"), fraction: api.xpathNumber("<a>0.1</a>", "/a") }).from(sql.raw("(values (1)) fixture(id)")));
  assert.deepEqual((await client.query("select " + ns + ".xpath_number('<a/>', '1 div 0')::text infinity, " + ns + ".xpath_number('<a/>', '-1 div 0')::text negative, " + ns + ".xpath_number('<a>1e40</a>', '/a')::text overflow")).rows, [{ infinity: "Infinity", negative: "-Infinity", overflow: "Infinity" }]);
  assert.deepEqual(nonfinite, [{ infinity: { nonfinite: "Infinity" }, negative: { nonfinite: "-Infinity" }, overflow: { nonfinite: "Infinity" }, fraction: Math.fround(0.1) }]);
  const table = api.xpathTable({ relation: { schema: "packed_app", name: "docs" }, key: "key", document: "body", xpaths: ["/article/title", "/article/pages"], fields: { key: textCodec, title: textCodec, pages: textCodec }, alias: "extracted" });
  const rows = await connection.transaction(db => db.select({ key: table.columns.key, title: table.columns.title, pages: table.columns.pages }).from(table.from));
  const nativeRows = (await client.query("select * from " + ns + ".xpath_table('key', 'body', 'packed_app.docs', '/article/title|/article/pages', 'true') as extracted(key text, title text, pages text)")).rows;
  assert.deepEqual(rows, nativeRows);
  assert.deepEqual(rows, [{ key: "a1", title: "O'Brien & Co", pages: "12" }]);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed xml2 13-member native, quoted placement and xpath_table contracts passed");
`,
      );
      // Bundle the complete application graph: adapters and the database share invocation-local SQL state.
      await writeFile(
        join(root, "compile-native.mjs"),
        `import assert from "node:assert/strict";
import { build } from "esbuild";
const external = ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])};
const result = await build({ entryPoints: ["project-native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-native-bundle.mjs", metafile: true, external });
const inputs = Object.keys(result.metafile.inputs);
assert(inputs.some(path => path.endsWith("/adapters/xml2.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/xml2.js")));
await build({ entryPoints: ["schema.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "schema.bundle.mjs", external: [...external, "kello", "kello/*"] });
`,
      );
      await run(["node", "compile-native.mjs"]);
      await run(["node", "migrate.mjs"]);
      await withExtensionDatabase((url) => run(["node", "project-native-bundle.mjs"], root, url));
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      await recordPackedConsumerObservation(root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
