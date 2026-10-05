import { expect, test } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { xml2UnitProofCases } from "../../e2e/fixtures/xml2-proof-cases";
import { createXml2_1_2 } from "../../../apps/loom/src/core/extensions/adapters/xml2";
import { xml2Annotations } from "../../../apps/loom/src/tooling/extensions/annotations/xml2";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/xml2.json";
import { resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import {
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
} from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import type { NestedQuery } from "../../../apps/loom/src/core/extensions/nested-query";

const descriptor = {
  name: "xml2",
  version: "1.2",
  schema: 'xml"2',
  apiSupport: {
    status: "verified",
    digest: "0353f94ca9d2e1f73f4a490e2a210a6412e88dd516028b44e9b81a59ff3fb03c",
  },
} as const;

extensionProofUnitTest(xml2UnitProofCases[0]!, () => {
  const api = createXml2_1_2(descriptor);
  expect(xml2Annotations.map((row) => row.id).sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
  expect(new Set(xml2Annotations.map((row) => row.id)).size).toBe(13);
  expect(Object.keys(api.sql.overloads).sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
  expect(() => createXml2_1_2({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow(
    /exact verified contract/,
  );
  expect(() => createXml2_1_2({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow(
    /exact verified contract/,
  );
  for (const row of xml2Annotations) {
    // xslt_proc.c forbids libxslt file and network IO for both arities, so no member observes outside tables.
    expect(row.semantics.observability).toBe("tables");
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
    expect(row.semantics.nativeAcceptance).toBe("pending");
  }
});

extensionProofUnitTest(xml2UnitProofCases[1]!, () => {
  const api = createXml2_1_2(descriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const encoded = api.encodeSpecialChars(`<tag a="1">O'Brien & co</tag>`);
  expect(extensionExpressionContract(encoded)?.member).toBe(
    "routine:$extension:xml2.xml_encode_special_chars(pg_catalog.text)",
  );
  const encodedQuery = dialect.sqlToQuery(encoded);
  expect(encodedQuery.sql).toContain('"xml""2"."xml_encode_special_chars"');
  expect(encodedQuery.params).toEqual([`<tag a="1">O'Brien & co</tag>`]);
  expect(dialect.sqlToQuery(api.valid(null)).params).toEqual([null]);
  expect(extensionExpressionContract(api.xpathNumber("<a>1</a>", "/a"))?.codec).toBe("pg:float4:1:nullable");
  expect(extensionExpressionContract(api.xsltProcess("<a/>", "<b/>", "name=value"))?.observability).toBe("tables");
  expect(extensionExpressionContract(api.xsltProcess("<a/>", "<b/>"))?.observability).toBe("tables");
  const rows = api.xpathTable({
    relation: { schema: 'docs"jp', name: 'articles"1' },
    key: 'id"k',
    document: 'body"x',
    xpaths: ["/article/title", "/article/pages"],
    fields: { id: textCodec, title: textCodec, pages: textCodec },
    alias: 'out"t',
  });
  const tableQuery = dialect.sqlToQuery(rows.from);
  expect(tableQuery.sql).toContain('"xml""2"."xpath_table"');
  expect(tableQuery.params).toEqual([
    `"id""k"`,
    `"body""x"`,
    `"docs""jp"."articles""1"`,
    "/article/title|/article/pages",
    "true",
  ]);
  expect(
    checkCompiledExtensionQuery(tableQuery).some(
      (contract) =>
        contract.member ===
        "routine:$extension:xml2.xpath_table(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    ),
  ).toBe(true);
  const injected = dialect.sqlToQuery(
    api.xpathTable({
      relation: { schema: "public", name: "articles; drop table t" },
      key: "id",
      document: "body",
      xpaths: ["/a"],
      fields: { id: textCodec, title: textCodec },
      alias: "t",
    }).from,
  );
  expect(injected.params).toEqual(['"id"', '"body"', '"public"."articles; drop table t"', "/a", "true"]);
  expect(() =>
    api.xpathTable({
      relation: { schema: "public", name: "articles" },
      key: "id",
      document: "body",
      xpaths: [],
      fields: { id: textCodec },
      alias: "t",
    }),
  ).toThrow(/xpath/i);
  expect(() =>
    api.xpathTable({
      // SAFETY: empty object has no nested-query evidence; xpathTable must reject it at runtime.
      source: Object.freeze({}) as NestedQuery<{ id: string; body: string }>,
      key: "id",
      document: "body",
      xpaths: ["/a"],
      fields: { id: textCodec, title: textCodec },
      alias: "t",
    }),
  ).toThrow(/managed provenance/);
});

test("xml2 shared codegen selects its exact public adapter", () => {
  const resolution = resolveSelectedExtension("xml2", { version: "1.2", schema: "extensions" });
  expect(resolution.support.status).toBe("verified");
  expect(resolution.adapter).toEqual({
    name: "xml2",
    version: "1.2",
    digest: descriptor.apiSupport.digest,
    factory: "createXml2_1_2",
    module: "kello/extensions/xml2",
  });
});
