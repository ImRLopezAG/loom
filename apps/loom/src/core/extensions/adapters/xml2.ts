import * as v from "valibot";
import { sql, type SQL } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec, nullableCodec, textCodec, type ExtensionCodec, type NonfiniteNumber } from "../codecs";
import { float4Codec } from "../primitive-number-codecs";
import { nestedQueryText, type NestedQuery } from "../nested-query";
import { extensionRows, type ExtensionRows } from "../rows";
import { createSqlFunction, extensionExpressionContract, type ExtensionSqlInput } from "../sql";

export type { NonfiniteNumber };
export { booleanCodec, textCodec, float4Codec };

const digest = "0353f94ca9d2e1f73f4a490e2a210a6412e88dd516028b44e9b81a59ff3fb03c";
const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0"), "Invalid PostgreSQL identifier"),
);
const xpath = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0"), "XPath cannot contain NUL"),
);
type AnyCodec = ExtensionCodec<never, unknown>;
type TextInput = ExtensionSqlInput<ReturnType<typeof nullableCodec<string, string>>>;
export type Xml2RelationName = { readonly schema: string; readonly name: string };

function quoteIdent(value: string): string {
  return `"${v.parse(identifier, value).replaceAll('"', '""')}"`;
}
function qualifiedRelation(relation: Xml2RelationName): string {
  return `${quoteIdent(relation.schema)}.${quoteIdent(relation.name)}`;
}
function joinXpaths(values: readonly string[]): string {
  if (!values.length) throw new Error("xpath_table requires at least one XPath expression");
  return values.map((value) => v.parse(xpath, value)).join("|");
}

type XpathTableBase<Fields extends Readonly<Record<string, AnyCodec>>> = {
  readonly key: string;
  readonly document: string;
  readonly xpaths: readonly string[];
  readonly fields: Fields;
  readonly alias: string;
};
export type XpathTableInput<Fields extends Readonly<Record<string, AnyCodec>>> = XpathTableBase<Fields> &
  (
    | { readonly relation: Xml2RelationName; readonly source?: never }
    | { readonly source: NestedQuery<object>; readonly relation?: never }
  );

/** Exact xml2 1.2 query helpers. xpath_table takes quoted identities or a managed nested query, never raw WHERE SQL. */
export function createXml2_1_2<
  const Descriptor extends ExtensionDescriptor<"xml2", { version: "1.2"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "xml2" ||
    descriptor.version !== "1.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("xml2 1.2 requires its exact verified contract");
  const text = nullableCodec(textCodec);
  const flag = nullableCodec(booleanCodec);
  const number = nullableCodec(float4Codec);
  const query = { schema: descriptor.schema, dependencies: [], authority: "query" } as const;
  const tables = { ...query, observability: "tables" } as const;
  const xml_encode_special_chars = createSqlFunction({
    ...tables,
    name: "xml_encode_special_chars",
    member: "routine:$extension:xml2.xml_encode_special_chars(pg_catalog.text)",
    arguments: [text] as const,
    result: text,
  });
  const xml_valid = createSqlFunction({
    ...tables,
    name: "xml_valid",
    member: "routine:$extension:xml2.xml_valid(pg_catalog.text)",
    arguments: [text] as const,
    result: flag,
  });
  const xpath_bool = createSqlFunction({
    ...tables,
    name: "xpath_bool",
    member: "routine:$extension:xml2.xpath_bool(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: flag,
  });
  const xpath_list3 = createSqlFunction({
    ...tables,
    name: "xpath_list",
    member: "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [text, text, text] as const,
    result: text,
  });
  const xpath_list2 = createSqlFunction({
    ...tables,
    name: "xpath_list",
    member: "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: text,
  });
  const xpath_nodeset4 = createSqlFunction({
    ...tables,
    name: "xpath_nodeset",
    member: "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [text, text, text, text] as const,
    result: text,
  });
  const xpath_nodeset3 = createSqlFunction({
    ...tables,
    name: "xpath_nodeset",
    member: "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [text, text, text] as const,
    result: text,
  });
  const xpath_nodeset2 = createSqlFunction({
    ...tables,
    name: "xpath_nodeset",
    member: "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: text,
  });
  const xpath_number = createSqlFunction({
    ...tables,
    name: "xpath_number",
    member: "routine:$extension:xml2.xpath_number(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: number,
  });
  const xpath_string = createSqlFunction({
    ...tables,
    name: "xpath_string",
    member: "routine:$extension:xml2.xpath_string(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: text,
  });
  const xslt_process3 = createSqlFunction({
    ...tables,
    name: "xslt_process",
    member: "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [text, text, text] as const,
    result: text,
  });
  const xslt_process2 = createSqlFunction({
    ...tables,
    name: "xslt_process",
    member: "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: text,
  });
  function xpathList(document: TextInput, path: TextInput): SQL<string | null>;
  function xpathList(document: TextInput, path: TextInput, separator: TextInput): SQL<string | null>;
  function xpathList(document: TextInput, path: TextInput, separator?: TextInput): SQL<string | null> {
    return separator === undefined ? xpath_list2(document, path) : xpath_list3(document, path, separator);
  }
  function xpathNodeset(document: TextInput, path: TextInput): SQL<string | null>;
  function xpathNodeset(document: TextInput, path: TextInput, toptag: TextInput): SQL<string | null>;
  function xpathNodeset(
    document: TextInput,
    path: TextInput,
    toptag: TextInput,
    itemtag: TextInput,
  ): SQL<string | null>;
  function xpathNodeset(
    document: TextInput,
    path: TextInput,
    toptag?: TextInput,
    itemtag?: TextInput,
  ): SQL<string | null> {
    if (toptag !== undefined && itemtag !== undefined) return xpath_nodeset4(document, path, toptag, itemtag);
    if (toptag !== undefined) return xpath_nodeset3(document, path, toptag);
    return xpath_nodeset2(document, path);
  }
  function xsltProcess(document: TextInput, stylesheet: TextInput): SQL<string | null>;
  function xsltProcess(document: TextInput, stylesheet: TextInput, params: TextInput): SQL<string | null>;
  function xsltProcess(document: TextInput, stylesheet: TextInput, params?: TextInput): SQL<string | null> {
    return params === undefined ? xslt_process2(document, stylesheet) : xslt_process3(document, stylesheet, params);
  }
  function xpathTable<const Fields extends Readonly<Record<string, AnyCodec>>>(
    input: XpathTableInput<Fields>,
  ): ExtensionRows<Fields> {
    const expressions = joinXpaths(input.xpaths);
    if (Object.keys(input.fields).length !== input.xpaths.length + 1)
      throw new Error("xpath_table fields must be the key column plus one codec per XPath");
    const key = quoteIdent(input.key);
    const document = quoteIdent(input.document);
    if (input.source) {
      const select = nestedQueryText(input.source);
      const relation: SQL<string | null> = sql`'(' || ${select} || ') AS xml2_source'`;
      const call = createSqlFunction({
        ...tables,
        name: "xpath_table",
        member:
          "routine:$extension:xml2.xpath_table(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
        arguments: [text, text, text, text, text] as const,
        result: text,
        dependencies: [...(extensionExpressionContract(select)?.dependencies ?? [])],
      })(key, document, relation, expressions, "true");
      return extensionRows(call, input.alias, input.fields);
    }
    const call = createSqlFunction({
      ...tables,
      name: "xpath_table",
      member:
        "routine:$extension:xml2.xpath_table(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      arguments: [text, text, text, text, text] as const,
      result: text,
      dependencies: [`${input.relation.schema}.${input.relation.name}`],
    })(key, document, qualifiedRelation(input.relation), expressions, "true");
    return extensionRows(call, input.alias, input.fields);
  }
  const functions = Object.freeze({
    xml_encode_special_chars,
    xml_valid,
    xpath_bool,
    xpath_list: xpathList,
    xpath_nodeset: xpathNodeset,
    xpath_number,
    xpath_string,
    xpath_table: xpathTable,
    xslt_process: xsltProcess,
  });
  return bindExtension(descriptor, {
    encodeSpecialChars: xml_encode_special_chars,
    valid: xml_valid,
    xpathBool: xpath_bool,
    xpathList,
    xpathNodeset,
    xpathNumber: xpath_number,
    xpathString: xpath_string,
    xpathTable,
    xsltProcess,
    sql: Object.freeze({
      functions,
      operators: Object.freeze({}),
      overloads: Object.freeze({
        "routine:$extension:xml2.xml_encode_special_chars(pg_catalog.text)": xml_encode_special_chars,
        "routine:$extension:xml2.xml_valid(pg_catalog.text)": xml_valid,
        "routine:$extension:xml2.xpath_bool(pg_catalog.text,pg_catalog.text)": xpath_bool,
        "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text,pg_catalog.text)": xpath_list3,
        "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text)": xpath_list2,
        "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)":
          xpath_nodeset4,
        "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text)": xpath_nodeset3,
        "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text)": xpath_nodeset2,
        "routine:$extension:xml2.xpath_number(pg_catalog.text,pg_catalog.text)": xpath_number,
        "routine:$extension:xml2.xpath_string(pg_catalog.text,pg_catalog.text)": xpath_string,
        "routine:$extension:xml2.xpath_table(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)":
          xpathTable,
        "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text,pg_catalog.text)": xslt_process3,
        "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text)": xslt_process2,
      }),
    }),
  });
}
