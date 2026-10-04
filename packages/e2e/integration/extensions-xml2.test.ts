import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { createXml2_1_2 } from "../../../apps/loom/src/core/extensions/adapters/xml2";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { xml2Descriptor, xml2Install } from "../fixtures/xml2";
import { xml2NativeProofCase } from "../fixtures/xml2-proof-cases";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";

import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";

const ns = `"xml""2"`;
const document = "<article><title>O'Brien &amp; Co</title><pages>12</pages></article>";
const stylesheet = `<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="text"/>
  <xsl:template match="/"><xsl:value-of select="/article/title"/></xsl:template>
</xsl:stylesheet>`;

extensionProofTest(xml2NativeProofCase, async () => {
  await withExtensionDatabase(async (url) => {
    const api = createXml2_1_2(xml2Descriptor);
    const schema = defineSchema((fields) => ({
      articles: { id: fields.text().notNull(), body: fields.text().notNull() },
    }));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const oracle = new pg.Client({ connectionString: url });
    await oracle.connect();
    try {
      await connection.db.execute(sql.raw(xml2Install));
      await observeExtensionProofDatabase(url, xml2NativeProofCase.id, "xml2");
      for (const statement of await migrationStatements(await emptySnapshot("public"), await createSnapshot(schema)))
        await connection.db.execute(sql.raw(statement));
      await connection.db.insert(schema.tables.articles).values({ id: "a1", body: document });
      const cases = [
        {
          member: "routine:$extension:xml2.xml_encode_special_chars(pg_catalog.text)",
          expression: api.encodeSpecialChars(`<tag a="1">O'Brien & co</tag>`),
          native: `${ns}.xml_encode_special_chars('<tag a="1">O''Brien & co</tag>')`,
        },
        {
          member: "routine:$extension:xml2.xml_valid(pg_catalog.text)",
          expression: api.valid(document),
          native: `${ns}.xml_valid($doc)`,
        },
        {
          member: "routine:$extension:xml2.xpath_bool(pg_catalog.text,pg_catalog.text)",
          expression: api.xpathBool(document, "/article/pages"),
          native: `${ns}.xpath_bool($doc, '/article/pages')`,
        },
        {
          member: "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
          expression: api.xpathList(document, "/article/*", "|"),
          native: `${ns}.xpath_list($doc, '/article/*', '|')`,
        },
        {
          member: "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text)",
          expression: api.xpathList(document, "/article/*"),
          native: `${ns}.xpath_list($doc, '/article/*')`,
        },
        {
          member:
            "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
          expression: api.xpathNodeset(document, "/article/title", "set", "item"),
          native: `${ns}.xpath_nodeset($doc, '/article/title', 'set', 'item')`,
        },
        {
          member: "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
          expression: api.xpathNodeset(document, "/article/title", "set"),
          native: `${ns}.xpath_nodeset($doc, '/article/title', 'set')`,
        },
        {
          member: "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text)",
          expression: api.xpathNodeset(document, "/article/title"),
          native: `${ns}.xpath_nodeset($doc, '/article/title')`,
        },
        {
          member: "routine:$extension:xml2.xpath_number(pg_catalog.text,pg_catalog.text)",
          expression: api.xpathNumber(document, "/article/pages"),
          native: `${ns}.xpath_number($doc, '/article/pages')`,
        },
        {
          member: "routine:$extension:xml2.xpath_string(pg_catalog.text,pg_catalog.text)",
          expression: api.xpathString(document, "/article/title"),
          native: `${ns}.xpath_string($doc, '/article/title')`,
        },
        {
          member: "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
          expression: api.xsltProcess(document, stylesheet, "unused=1"),
          native: `${ns}.xslt_process($doc, $xsl, 'unused=1')`,
        },
        {
          member: "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text)",
          expression: api.xsltProcess(document, stylesheet),
          native: `${ns}.xslt_process($doc, $xsl)`,
        },
      ] as const;
      const expectedMembers: string[] = Object.keys(api.sql.overloads)
        .filter((id) => !id.includes("xpath_table"))
        .sort();
      const actualMembers: string[] = cases.map((entry) => entry.member).toSorted();
      expect(actualMembers).toEqual(expectedMembers);
      for (const entry of cases) {
        const claim = xml2NativeProofCase.claims.find((row) => row.member === entry.member);
        if (!claim) throw new Error(`Missing xml2 native claim: ${entry.member}`);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          expect(extensionExpressionContract(entry.expression)?.member).toBe(entry.member);
          const actual = (
            await connection.transaction((db) =>
              db.select({ value: entry.expression }).from(sql`(values (1)) fixture(id)`),
            )
          )[0]!.value;
          const replaced = entry.native
            .replaceAll("$doc", `'${document.replaceAll("'", "''")}'`)
            .replaceAll("$xsl", `'${stylesheet.replaceAll("'", "''")}'`);
          const oracleValue = (await oracle.query(`SELECT ${replaced} AS value`)).rows[0]!.value;
          expect(actual).toEqual(oracleValue);
        });
      }
      const tableClaim = xml2NativeProofCase.claims.find((claim) => claim.member.includes("xpath_table"));
      if (!tableClaim) throw new Error("Missing xml2 xpath_table native claim");
      await extensionProofWitness({ ...tableClaim, schema: api.schema }, async () => {
        const rows = api.xpathTable({
          relation: { schema: "public", name: "articles" },
          key: "id",
          document: "body",
          xpaths: ["/article/title", "/article/pages"],
          fields: { id: textCodec, title: textCodec, pages: textCodec },
          alias: "extracted",
        });
        const actual = await connection.transaction((db) =>
          db.select({ id: rows.columns.id, title: rows.columns.title, pages: rows.columns.pages }).from(rows.from),
        );
        const native = await oracle.query(
          `SELECT * FROM ${ns}.xpath_table('id', 'body', 'articles', '/article/title|/article/pages', 'true') AS extracted(id text, title text, pages text)`,
        );
        expect(actual).toEqual(native.rows);
        const invalid = await connection.transaction((db) =>
          db.select({ value: api.valid("<") }).from(sql`(values (1)) fixture(id)`),
        );
        const invalidOracle = await oracle.query(`SELECT ${ns}.xml_valid('<') AS value`);
        expect(invalid).toEqual(invalidOracle.rows);
        const nan = await connection.transaction((db) =>
          db.select({ value: api.xpathNumber("<a>no</a>", "/a") }).from(sql`(values (1)) fixture(id)`),
        );
        // PostgreSQL xpath_number converts libxml's NaN to SQL NULL (xpath.c).
        const nanOracle = await oracle.query(`SELECT ${ns}.xpath_number('<a>no</a>', '/a') AS value`);
        expect(nanOracle.rows).toEqual([{ value: null }]);
        expect(nan).toEqual(nanOracle.rows);
        const nulls = await connection.transaction((db) =>
          db
            .select({
              encoded: api.encodeSpecialChars(null),
              valid: api.valid(null),
              flag: api.xpathBool(null, null),
              listed: api.xpathList(null, null),
              nodes: api.xpathNodeset(null, null),
              number: api.xpathNumber(null, null),
              extracted: api.xpathString(null, null),
              transformed: api.xsltProcess(null, null),
              parameterized: api.xsltProcess(null, null, null),
            })
            .from(sql`(values (1)) fixture(id)`),
        );
        // xslt_proc.c installs libxslt security prefs forbidding file and network IO; both arities share that
        // surface, including XPath parameter values. The prefs refuse before any load is attempted, so an absent
        // target fails the transform, whereas unrestricted libxslt only warns and yields an empty node-set. The
        // readable-file positive control needs server filesystem privileges and lives in the local-only
        // characterization script (packages/e2e/scripts/characterize-xml2-local.ts).
        const targets = [
          `file:///loom_xml2_${crypto.randomUUID().replaceAll("-", "")}.xml`,
          "PG_VERSION",
          "http://127.0.0.1:1/loom",
        ];
        const reader = (select: string) =>
          `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:param name="p"/><xsl:template match="/"><o><xsl:value-of select="${select}"/></o></xsl:template></xsl:stylesheet>`;
        for (const target of targets) {
          const denied = [
            {
              expression: api.xsltProcess("<r/>", reader(`count(document('${target}'))`)),
              args: [reader(`count(document('${target}'))`)],
            },
            {
              expression: api.xsltProcess("<r/>", reader(`count(document('${target}'))`), "p=1"),
              args: [reader(`count(document('${target}'))`), "p=1"],
            },
            {
              expression: api.xsltProcess("<r/>", reader("count($p)"), `p=document('${target}')`),
              args: [reader("count($p)"), `p=document('${target}')`],
            },
          ];
          for (const entry of denied) {
            await assert.rejects(
              connection.transaction((db) =>
                db.select({ value: entry.expression }).from(sql`(values (1)) fixture(id)`),
              ),
              (error: Error) => error.cause instanceof Error && error.cause.message === "failed to apply stylesheet",
            );
            const placeholders = entry.args.map((_, index) => `$${index + 1}`).join(", ");
            await assert.rejects(
              oracle.query(`SELECT ${ns}.xslt_process('<r/>', ${placeholders})`, entry.args),
              /failed to apply stylesheet/,
            );
          }
        }
        const parameter = await connection.transaction((db) =>
          db.select({ value: api.xsltProcess("<r/>", reader("$p"), "p='ok'") }).from(sql`(values (1)) fixture(id)`),
        );
        const parameterOracle = await oracle.query(`SELECT ${ns}.xslt_process('<r/>', $1, 'p=''ok''') AS value`, [
          reader("$p"),
        ]);
        expect(parameter).toEqual(parameterOracle.rows);
        expect(parameter[0]!.value).toContain("<o>ok</o>");
        expect(nulls).toEqual([
          {
            encoded: null,
            valid: null,
            flag: null,
            listed: null,
            nodes: null,
            number: null,
            extracted: null,
            transformed: null,
            parameterized: null,
          },
        ]);
      });
      await oracle.query("BEGIN");
      await oracle.query(`INSERT INTO articles (id, body) VALUES ('rollback', '<n>9</n>')`);
      const before = await oracle.query(
        `SELECT ${ns}.xpath_string(body, '/n') AS value FROM articles WHERE id = 'rollback'`,
      );
      expect(before.rows).toEqual([{ value: "9" }]);
      await oracle.query("ROLLBACK");
      const after = await oracle.query(
        `SELECT ${ns}.xpath_string(body, '/n') AS value FROM articles WHERE id = 'rollback'`,
      );
      expect(after.rows).toEqual([]);
    } finally {
      await oracle.end();
      await connection.close();
    }
  });
});

test("xml2.xpathTableRejectsUnprovenNestedQuery", () => {
  const api = createXml2_1_2(xml2Descriptor);
  expect(() =>
    api.xpathTable({
      // SAFETY: empty object has no nested-query evidence; xpathTable must reject it at runtime.
      source: Object.freeze({}) as never,
      key: "id",
      document: "body",
      xpaths: ["/a"],
      fields: { id: textCodec, title: textCodec },
      alias: "t",
    }),
  ).toThrow(/managed provenance/);
});
