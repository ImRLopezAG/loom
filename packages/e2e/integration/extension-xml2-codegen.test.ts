import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "bun:test";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations, sql } from "drizzle-orm";
import pg from "pg";
import { defineConfig, generateProject, initializeProject, loadProject } from "kello/tooling";
import {
  connectDatabase,
  createProjectProcedures,
  createProjectServices,
  defineSchema,
  Invocation,
} from "kello/server";
import { textCodec } from "kello/extensions/xml2";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import { xml2GenerationProofCase, xml2Members } from "../fixtures/xml2-proof-cases";

const placement = "xml2_docs";
const document = "<article><title>O'Brien &amp; Co</title><pages>12</pages><tag>a</tag><tag>b</tag></article>";
const stylesheet = `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:output method="text"/><xsl:param name="p" select="'none'"/><xsl:template match="/"><xsl:value-of select="concat(/article/title, ':', $p)"/></xsl:template></xsl:stylesheet>`;

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-xml2-codegen-"));
  try {
    await initializeProject(root, "xmlselected");
    await mkdir(join(root, "node_modules"));
    for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    await writeFile(
      join(root, "kello/app.config.ts"),
      'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
    );
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

async function checkFixtureTypes(root: string) {
  const child = Bun.spawn(
    [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
    { stdout: "pipe", stderr: "pipe" },
  );
  const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
  assert.equal(await child.exited, 0, output);
}

extensionProofTest(
  xml2GenerationProofCase,
  async () => {
    expect(
      defineConfig({ database: { extensions: { xml2: { version: "1.2", schema: 'xml"2' } } } }).database.extensions.xml2
        ?.schema,
    ).toBe('xml"2');
    const root = await projectFixture();
    try {
      await writeFile(
        join(root, "kello.config.ts"),
        `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { xml2: { version: "1.2", schema: ${JSON.stringify(placement)} } } } });`,
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
// This executes at first load, while generated bindings exist only virtually.
const xml2 = extensions.xml2;
if (Object.keys(extensions).join(",") !== "xml2") throw new Error("Wrong selected keys");
if (Object.keys(xml2.sql.overloads).length !== 13) throw new Error("Wrong xml2 member count");
xml2.xpathString("<a>1</a>", "/a");
xml2.xsltProcess("<a/>", "<x/>", "p=1");
const placement: ${JSON.stringify(placement)} = xml2.schema;
const version: "1.2" = xml2.version;
void [placement, version];
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.bloom;
// @ts-expect-error Documents are text, not booleans.
xml2.valid(true);
}
void compileOnly;
export default defineSchema((fields) => ({ articles: { key: fields.text().notNull(), body: fields.text().notNull() } }), { namespace: "app" });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { Effect } from "effect";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC and Effect extensions differ");
const title = context.extensions.xml2.xpathString(context.tables.articles.body, "/article/title");
const rows = await context.db.select({ title }).from(context.tables.articles);
// @ts-expect-error xpath_table accepts no raw WHERE text.
binding.xml2.xpathTable({ relation: { schema: "app", name: "articles" }, key: "key", document: "body", xpaths: ["/a"], fields: {}, alias: "t", where: "true" });
return rows.map((row) => row.title ?? "");
}) });`,
      );
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await loadProject(root);
      const generated = await generateProject(root);
      const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
      expect(source).toContain('import { createXml2_1_2 } from "kello/extensions/xml2";');
      for (const forbidden of ["bloom", "../schema", "./server", "kello.config"])
        expect(source).not.toContain(forbidden);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["xml2"]);
      expect(Object.isFrozen(disk.extensions)).toBe(true);
      const xml2 = disk.extensions.xml2;
      expect([xml2.name, xml2.version, xml2.schema]).toEqual(["xml2", "1.2", placement]);
      expect(xml2.apiSupport).toEqual({
        status: "verified",
        digest: "0353f94ca9d2e1f73f4a490e2a210a6412e88dd516028b44e9b81a59ff3fb03c",
      });
      expect(Object.keys(xml2.sql.overloads).toSorted()).toEqual([...xml2Members].toSorted());
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      const project = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
      const schema = defineSchema(
        (fields) => ({ articles: { key: fields.text().notNull(), body: fields.text().notNull() } }),
        { namespace: "app" },
      );
      expect(await migrationStatements(await emptySnapshot("app"), await createSnapshot(project))).toEqual(
        await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)),
      );
      const relations = defineRelations(schema.tables);
      await withExtensionDatabase(async (url) => {
        const oracle = new pg.Client({ connectionString: url });
        await oracle.connect();
        const connection = await connectDatabase({ schema, relations, connectionString: url });
        try {
          await oracle.query(
            `CREATE SCHEMA ${placement}; CREATE EXTENSION xml2 WITH SCHEMA ${placement} VERSION '1.2'`,
          );
          for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
            await oracle.query(statement);
          await oracle.query("INSERT INTO app.articles (key, body) VALUES ('a1', $1)", [document]);
          const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
          const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
          const handler = procedure.handler(async ({ context }) => {
            const effect = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
            expect(effect).toBe(disk.extensions);
            expect(context.extensions).toBe(effect);
            const api = context.extensions.xml2;
            const fn = effect.xml2.sql.functions;
            const values = await connection.transaction((db) =>
              db
                .select({
                  encoded: api.encodeSpecialChars(`<t a="1">&'</t>`),
                  valid: api.valid(document),
                  invalid: fn.xml_valid("<"),
                  bool: api.xpathBool(document, "/article/pages"),
                  list3: api.xpathList(document, "/article/tag", "|"),
                  list2: fn.xpath_list(document, "/article/tag"),
                  nodes4: api.xpathNodeset(document, "/article/tag", "set", "item"),
                  nodes3: api.xpathNodeset(document, "/article/tag", "set"),
                  nodes2: fn.xpath_nodeset(document, "/article/tag"),
                  number: api.xpathNumber(document, "/article/pages"),
                  nan: api.xpathNumber("<a>no</a>", "/a"),
                  string: fn.xpath_string(document, "/article/title"),
                  xslt3: api.xsltProcess(document, stylesheet, "p='v'"),
                  xslt2: fn.xslt_process(document, stylesheet),
                  strict: api.xsltProcess(null, stylesheet, "p=1"),
                })
                .from(sql`(values (1)) fixture(id)`),
            );
            const table = api.xpathTable({
              relation: { schema: "app", name: "articles" },
              key: "key",
              document: "body",
              xpaths: ["/article/title", "/article/pages"],
              fields: { key: textCodec, title: textCodec, pages: textCodec },
              alias: "extracted",
            });
            const rows = await connection.transaction((db) =>
              db
                .select({ key: table.columns.key, title: table.columns.title, pages: table.columns.pages })
                .from(table.from),
            );
            const nonfinite = await connection.transaction((db) =>
              db
                .select({
                  infinity: api.xpathNumber("<a/>", "1 div 0"),
                  negative: fn.xpath_number("<a/>", "-1 div 0"),
                  overflow: api.xpathNumber("<a>1e40</a>", "/a"),
                  fraction: api.xpathNumber("<a>0.1</a>", "/a"),
                })
                .from(sql`(values (1)) fixture(id)`),
            );
            return { values, rows, nonfinite };
          });
          const invocation = { requestId: "xml2-generation", identity: null, signal: new AbortController().signal };
          const result = await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          });
          const q = (value: string) => `'${value.replaceAll("'", "''")}'`;
          const native = (
            await oracle.query(`SELECT
              ${placement}.xml_encode_special_chars(${q(`<t a="1">&'</t>`)}) encoded,
              ${placement}.xml_valid(${q(document)}) valid, ${placement}.xml_valid('<') invalid,
              ${placement}.xpath_bool(${q(document)}, '/article/pages') bool,
              ${placement}.xpath_list(${q(document)}, '/article/tag', '|') list3,
              ${placement}.xpath_list(${q(document)}, '/article/tag') list2,
              ${placement}.xpath_nodeset(${q(document)}, '/article/tag', 'set', 'item') nodes4,
              ${placement}.xpath_nodeset(${q(document)}, '/article/tag', 'set') nodes3,
              ${placement}.xpath_nodeset(${q(document)}, '/article/tag') nodes2,
              ${placement}.xpath_number(${q(document)}, '/article/pages') number,
              ${placement}.xpath_number('<a>no</a>', '/a') nan,
              ${placement}.xpath_string(${q(document)}, '/article/title') string,
              ${placement}.xslt_process(${q(document)}, ${q(stylesheet)}, 'p=''v''') xslt3,
              ${placement}.xslt_process(${q(document)}, ${q(stylesheet)}) xslt2,
              ${placement}.xslt_process(NULL, ${q(stylesheet)}, 'p=1') strict`)
          ).rows;
          expect(result.values).toEqual(native);
          expect(result.values[0]).toMatchObject({
            number: 12,
            nan: null,
            xslt3: "O'Brien & Co:v",
            xslt2: "O'Brien & Co:none",
            strict: null,
          });
          const nativeRows = await oracle.query(
            `SELECT * FROM ${placement}.xpath_table('key', 'body', 'app.articles', '/article/title|/article/pages', 'true') AS extracted(key text, title text, pages text)`,
          );
          expect(result.rows).toEqual(nativeRows.rows);
          expect(result.rows).toEqual([{ key: "a1", title: "O'Brien & Co", pages: "12" }]);
          // float4 overflow and division by zero stay distinguishable; libxml NaN is native SQL NULL.
          const nativeNonfinite = await oracle.query(
            `SELECT ${placement}.xpath_number('<a/>', '1 div 0')::text infinity, ${placement}.xpath_number('<a/>', '-1 div 0')::text negative, ${placement}.xpath_number('<a>1e40</a>', '/a')::text overflow, ${placement}.xpath_number('<a>0.1</a>', '/a') fraction`,
          );
          expect(nativeNonfinite.rows).toEqual([
            { infinity: "Infinity", negative: "-Infinity", overflow: "Infinity", fraction: 0.1 },
          ]);
          expect(result.nonfinite).toEqual([
            {
              infinity: { nonfinite: "Infinity" },
              negative: { nonfinite: "-Infinity" },
              overflow: { nonfinite: "Infinity" },
              fraction: Math.fround(0.1),
            },
          ]);
        } finally {
          try {
            await connection.close();
          } finally {
            await oracle.end();
          }
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  90000,
);
