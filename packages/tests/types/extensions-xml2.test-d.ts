import type { SQL } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { createXml2_1_2 } from "../../../apps/loom/src/core/extensions/adapters/xml2";
import { textCodec, type NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";

const descriptor = {
  name: "xml2",
  version: "1.2",
  schema: 'xml"2',
  apiSupport: {
    status: "verified",
    digest: "0353f94ca9d2e1f73f4a490e2a210a6412e88dd516028b44e9b81a59ff3fb03c",
  },
} as const;
const api = createXml2_1_2(descriptor);
const articles = pgTable("articles", { body: text() });
const encoded: SQL<string | null> = api.encodeSpecialChars("<a>");
const valid: SQL<boolean | null> = api.valid(articles.body);
const flag: SQL<boolean | null> = api.xpathBool("<a/>", "/a");
const listed: SQL<string | null> = api.xpathList("<a><b>1</b><b>2</b></a>", "/a/b", "|");
const listedDefault: SQL<string | null> = api.xpathList("<a><b>1</b></a>", "/a/b");
const nodes: SQL<string | null> = api.xpathNodeset("<a><b/></a>", "/a/b", "set", "item");
const number: SQL<number | NonfiniteNumber | null> = api.xpathNumber("<a>1</a>", "/a");
const extracted: SQL<string | null> = api.xpathString(articles.body, "/article/title");
const transformed: SQL<string | null> = api.xsltProcess("<a/>", "<b/>");
const parameterized: SQL<string | null> = api.xsltProcess("<a/>", "<b/>", "name=value");
const schema: 'xml"2' = api.schema;
const version: "1.2" = api.version;
const overload: SQL<string | null> =
  api.sql.overloads["routine:$extension:xml2.xml_encode_special_chars(pg_catalog.text)"]("<a>");
const rows = api.xpathTable({
  relation: { schema: "public", name: "articles" },
  key: "id",
  document: "body",
  xpaths: ["/article/title"],
  fields: { id: textCodec, title: textCodec },
  alias: "t",
});
const title: SQL<string> = rows.columns.title;
// @ts-expect-error Exact factory only accepts 1.2.
createXml2_1_2({ ...descriptor, version: "1.1" });
// @ts-expect-error Boolean columns are not XML text.
api.valid(true);
// @ts-expect-error Number is not document text.
api.xpathString(1, "/a");
api.xpathTable({
  relation: { schema: "public", name: "articles" },
  key: "id",
  document: "body",
  xpaths: ["/a"],
  fields: { id: textCodec, title: textCodec },
  alias: "t",
  // @ts-expect-error Raw WHERE text is not a typed xpath_table contract.
  condition: "id = 1",
});
void [
  encoded,
  valid,
  flag,
  listed,
  listedDefault,
  nodes,
  number,
  extracted,
  transformed,
  parameterized,
  schema,
  version,
  overload,
  title,
];
