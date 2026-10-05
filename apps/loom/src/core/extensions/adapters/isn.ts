import { is, SQL, sql } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec, nullableCodec, decodeFailure, type ExtensionCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createExtensionField, createExtensionIndex } from "../fields";
import {
  checkedExtensionExpression,
  createSqlFunction,
  createSqlOperator,
  extensionSqlType,
  type ExtensionSqlInput,
} from "../sql";
import { createIsnCodec, createIsnArrayCodec, isnValue, isnWireValue, isnArrayWireValue } from "./isn-codecs";
export { isnValue, isnKinds } from "./isn-codecs";
export type { IsnKind, IsnValue } from "./isn-codecs";
export type { PostgreSqlArray } from "../codecs";

type Descriptor = ExtensionDescriptor<"isn", { readonly version: "1.3"; readonly schema: string }>;
const wrapper = v.object({ getSQL: v.function() });
function cast<Input, Output>(
  schema: string,
  member: string,
  source: ExtensionCodec<Input, Input>,
  target: ExtensionCodec<Output, Output>,
) {
  return (value: ExtensionSqlInput<typeof source>) => {
    const input = is(value, SQL.Aliased)
      ? "isSelectionField" in value && value.isSelectionField === true
        ? sql`${value}`
        : value.sql
      : v.is(wrapper, value)
        ? sql`${value}`
        : sql`${sql.param(decodeFailure(() => source.encode(value)))}::${extensionSqlType(schema, source.sqlType!.name)}`;
    return checkedExtensionExpression(
      sql`(${input})::${extensionSqlType(schema, target.sqlType!.name)}`,
      target,
      [],
      undefined,
      member,
    );
  };
}
/** Exact captured overloads. No implicit cross-family overload is invented; weak mode is operator tooling only. */
export function createIsn_1_3<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "isn" ||
    descriptor.version !== "1.3" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "570342dc61cc815ae91896f43c59a79150643b22f540681e6c82d89db6a5e9be"
  )
    throw new Error("isn 1.3 requires its exact verified contract");
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec);

  const ean13Codec = createIsnCodec(descriptor.schema, "ean13"),
    ean13Array = createIsnArrayCodec(descriptor.schema, "ean13"),
    ean13 = nullableCodec(ean13Codec);
  const isbnCodec = createIsnCodec(descriptor.schema, "isbn"),
    isbnArray = createIsnArrayCodec(descriptor.schema, "isbn"),
    isbn = nullableCodec(isbnCodec);
  const isbn13Codec = createIsnCodec(descriptor.schema, "isbn13"),
    isbn13Array = createIsnArrayCodec(descriptor.schema, "isbn13"),
    isbn13 = nullableCodec(isbn13Codec);
  const ismnCodec = createIsnCodec(descriptor.schema, "ismn"),
    ismnArray = createIsnArrayCodec(descriptor.schema, "ismn"),
    ismn = nullableCodec(ismnCodec);
  const ismn13Codec = createIsnCodec(descriptor.schema, "ismn13"),
    ismn13Array = createIsnArrayCodec(descriptor.schema, "ismn13"),
    ismn13 = nullableCodec(ismn13Codec);
  const issnCodec = createIsnCodec(descriptor.schema, "issn"),
    issnArray = createIsnArrayCodec(descriptor.schema, "issn"),
    issn = nullableCodec(issnCodec);
  const issn13Codec = createIsnCodec(descriptor.schema, "issn13"),
    issn13Array = createIsnArrayCodec(descriptor.schema, "issn13"),
    issn13 = nullableCodec(issn13Codec);
  const upcCodec = createIsnCodec(descriptor.schema, "upc"),
    upcArray = createIsnArrayCodec(descriptor.schema, "upc"),
    upc = nullableCodec(upcCodec);
  const member0 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ean13)",
    left: ean13,
    right: ean13,
    result: bool,
  });
  const member1 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn)",
    left: ean13,
    right: isbn,
    result: bool,
  });
  const member2 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn13)",
    left: ean13,
    right: isbn13,
    result: bool,
  });
  const member3 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn)",
    left: ean13,
    right: ismn,
    result: bool,
  });
  const member4 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn13)",
    left: ean13,
    right: ismn13,
    result: bool,
  });
  const member5 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn)",
    left: ean13,
    right: issn,
    result: bool,
  });
  const member6 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn13)",
    left: ean13,
    right: issn13,
    result: bool,
  });
  const member7 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.upc)",
    left: ean13,
    right: upc,
    result: bool,
  });
  const member8 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.isbn,$extension:isn.ean13)",
    left: isbn,
    right: ean13,
    result: bool,
  });
  const member9 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn)",
    left: isbn,
    right: isbn,
    result: bool,
  });
  const member10 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn13)",
    left: isbn,
    right: isbn13,
    result: bool,
  });
  const member11 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.ean13)",
    left: isbn13,
    right: ean13,
    result: bool,
  });
  const member12 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn)",
    left: isbn13,
    right: isbn,
    result: bool,
  });
  const member13 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn13)",
    left: isbn13,
    right: isbn13,
    result: bool,
  });
  const member14 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ean13)",
    left: ismn,
    right: ean13,
    result: bool,
  });
  const member15 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn)",
    left: ismn,
    right: ismn,
    result: bool,
  });
  const member16 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn13)",
    left: ismn,
    right: ismn13,
    result: bool,
  });
  const member17 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ean13)",
    left: ismn13,
    right: ean13,
    result: bool,
  });
  const member18 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn)",
    left: ismn13,
    right: ismn,
    result: bool,
  });
  const member19 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn13)",
    left: ismn13,
    right: ismn13,
    result: bool,
  });
  const member20 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.issn,$extension:isn.ean13)",
    left: issn,
    right: ean13,
    result: bool,
  });
  const member21 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn)",
    left: issn,
    right: issn,
    result: bool,
  });
  const member22 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn13)",
    left: issn,
    right: issn13,
    result: bool,
  });
  const member23 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.issn13,$extension:isn.ean13)",
    left: issn13,
    right: ean13,
    result: bool,
  });
  const member24 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn)",
    left: issn13,
    right: issn,
    result: bool,
  });
  const member25 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn13)",
    left: issn13,
    right: issn13,
    result: bool,
  });
  const member26 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.upc,$extension:isn.ean13)",
    left: upc,
    right: ean13,
    result: bool,
  });
  const member27 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:isn.<($extension:isn.upc,$extension:isn.upc)",
    left: upc,
    right: upc,
    result: bool,
  });
  const member28 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ean13)",
    left: ean13,
    right: ean13,
    result: bool,
  });
  const member29 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn)",
    left: ean13,
    right: isbn,
    result: bool,
  });
  const member30 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn13)",
    left: ean13,
    right: isbn13,
    result: bool,
  });
  const member31 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn)",
    left: ean13,
    right: ismn,
    result: bool,
  });
  const member32 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn13)",
    left: ean13,
    right: ismn13,
    result: bool,
  });
  const member33 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn)",
    left: ean13,
    right: issn,
    result: bool,
  });
  const member34 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn13)",
    left: ean13,
    right: issn13,
    result: bool,
  });
  const member35 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.upc)",
    left: ean13,
    right: upc,
    result: bool,
  });
  const member36 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.ean13)",
    left: isbn,
    right: ean13,
    result: bool,
  });
  const member37 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn)",
    left: isbn,
    right: isbn,
    result: bool,
  });
  const member38 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn13)",
    left: isbn,
    right: isbn13,
    result: bool,
  });
  const member39 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.ean13)",
    left: isbn13,
    right: ean13,
    result: bool,
  });
  const member40 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn)",
    left: isbn13,
    right: isbn,
    result: bool,
  });
  const member41 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn13)",
    left: isbn13,
    right: isbn13,
    result: bool,
  });
  const member42 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ean13)",
    left: ismn,
    right: ean13,
    result: bool,
  });
  const member43 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn)",
    left: ismn,
    right: ismn,
    result: bool,
  });
  const member44 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn13)",
    left: ismn,
    right: ismn13,
    result: bool,
  });
  const member45 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ean13)",
    left: ismn13,
    right: ean13,
    result: bool,
  });
  const member46 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn)",
    left: ismn13,
    right: ismn,
    result: bool,
  });
  const member47 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn13)",
    left: ismn13,
    right: ismn13,
    result: bool,
  });
  const member48 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.issn,$extension:isn.ean13)",
    left: issn,
    right: ean13,
    result: bool,
  });
  const member49 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn)",
    left: issn,
    right: issn,
    result: bool,
  });
  const member50 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn13)",
    left: issn,
    right: issn13,
    result: bool,
  });
  const member51 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.ean13)",
    left: issn13,
    right: ean13,
    result: bool,
  });
  const member52 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn)",
    left: issn13,
    right: issn,
    result: bool,
  });
  const member53 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn13)",
    left: issn13,
    right: issn13,
    result: bool,
  });
  const member54 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.upc,$extension:isn.ean13)",
    left: upc,
    right: ean13,
    result: bool,
  });
  const member55 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:isn.<=($extension:isn.upc,$extension:isn.upc)",
    left: upc,
    right: upc,
    result: bool,
  });
  const member56 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ean13)",
    left: ean13,
    right: ean13,
    result: bool,
  });
  const member57 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn)",
    left: ean13,
    right: isbn,
    result: bool,
  });
  const member58 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn13)",
    left: ean13,
    right: isbn13,
    result: bool,
  });
  const member59 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn)",
    left: ean13,
    right: ismn,
    result: bool,
  });
  const member60 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn13)",
    left: ean13,
    right: ismn13,
    result: bool,
  });
  const member61 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn)",
    left: ean13,
    right: issn,
    result: bool,
  });
  const member62 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn13)",
    left: ean13,
    right: issn13,
    result: bool,
  });
  const member63 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.upc)",
    left: ean13,
    right: upc,
    result: bool,
  });
  const member64 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.ean13)",
    left: isbn,
    right: ean13,
    result: bool,
  });
  const member65 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn)",
    left: isbn,
    right: isbn,
    result: bool,
  });
  const member66 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn13)",
    left: isbn,
    right: isbn13,
    result: bool,
  });
  const member67 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.ean13)",
    left: isbn13,
    right: ean13,
    result: bool,
  });
  const member68 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn)",
    left: isbn13,
    right: isbn,
    result: bool,
  });
  const member69 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn13)",
    left: isbn13,
    right: isbn13,
    result: bool,
  });
  const member70 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ean13)",
    left: ismn,
    right: ean13,
    result: bool,
  });
  const member71 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn)",
    left: ismn,
    right: ismn,
    result: bool,
  });
  const member72 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn13)",
    left: ismn,
    right: ismn13,
    result: bool,
  });
  const member73 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ean13)",
    left: ismn13,
    right: ean13,
    result: bool,
  });
  const member74 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn)",
    left: ismn13,
    right: ismn,
    result: bool,
  });
  const member75 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn13)",
    left: ismn13,
    right: ismn13,
    result: bool,
  });
  const member76 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.issn,$extension:isn.ean13)",
    left: issn,
    right: ean13,
    result: bool,
  });
  const member77 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn)",
    left: issn,
    right: issn,
    result: bool,
  });
  const member78 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn13)",
    left: issn,
    right: issn13,
    result: bool,
  });
  const member79 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.ean13)",
    left: issn13,
    right: ean13,
    result: bool,
  });
  const member80 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn)",
    left: issn13,
    right: issn,
    result: bool,
  });
  const member81 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn13)",
    left: issn13,
    right: issn13,
    result: bool,
  });
  const member82 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.upc,$extension:isn.ean13)",
    left: upc,
    right: ean13,
    result: bool,
  });
  const member83 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:isn.<>($extension:isn.upc,$extension:isn.upc)",
    left: upc,
    right: upc,
    result: bool,
  });
  const member84 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ean13)",
    left: ean13,
    right: ean13,
    result: bool,
  });
  const member85 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn)",
    left: ean13,
    right: isbn,
    result: bool,
  });
  const member86 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn13)",
    left: ean13,
    right: isbn13,
    result: bool,
  });
  const member87 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn)",
    left: ean13,
    right: ismn,
    result: bool,
  });
  const member88 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn13)",
    left: ean13,
    right: ismn13,
    result: bool,
  });
  const member89 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn)",
    left: ean13,
    right: issn,
    result: bool,
  });
  const member90 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn13)",
    left: ean13,
    right: issn13,
    result: bool,
  });
  const member91 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.upc)",
    left: ean13,
    right: upc,
    result: bool,
  });
  const member92 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.isbn,$extension:isn.ean13)",
    left: isbn,
    right: ean13,
    result: bool,
  });
  const member93 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn)",
    left: isbn,
    right: isbn,
    result: bool,
  });
  const member94 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn13)",
    left: isbn,
    right: isbn13,
    result: bool,
  });
  const member95 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.ean13)",
    left: isbn13,
    right: ean13,
    result: bool,
  });
  const member96 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn)",
    left: isbn13,
    right: isbn,
    result: bool,
  });
  const member97 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn13)",
    left: isbn13,
    right: isbn13,
    result: bool,
  });
  const member98 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ean13)",
    left: ismn,
    right: ean13,
    result: bool,
  });
  const member99 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn)",
    left: ismn,
    right: ismn,
    result: bool,
  });
  const member100 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn13)",
    left: ismn,
    right: ismn13,
    result: bool,
  });
  const member101 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ean13)",
    left: ismn13,
    right: ean13,
    result: bool,
  });
  const member102 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn)",
    left: ismn13,
    right: ismn,
    result: bool,
  });
  const member103 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn13)",
    left: ismn13,
    right: ismn13,
    result: bool,
  });
  const member104 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.issn,$extension:isn.ean13)",
    left: issn,
    right: ean13,
    result: bool,
  });
  const member105 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn)",
    left: issn,
    right: issn,
    result: bool,
  });
  const member106 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn13)",
    left: issn,
    right: issn13,
    result: bool,
  });
  const member107 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.issn13,$extension:isn.ean13)",
    left: issn13,
    right: ean13,
    result: bool,
  });
  const member108 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn)",
    left: issn13,
    right: issn,
    result: bool,
  });
  const member109 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn13)",
    left: issn13,
    right: issn13,
    result: bool,
  });
  const member110 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.upc,$extension:isn.ean13)",
    left: upc,
    right: ean13,
    result: bool,
  });
  const member111 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:isn.=($extension:isn.upc,$extension:isn.upc)",
    left: upc,
    right: upc,
    result: bool,
  });
  const member112 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ean13)",
    left: ean13,
    right: ean13,
    result: bool,
  });
  const member113 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn)",
    left: ean13,
    right: isbn,
    result: bool,
  });
  const member114 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn13)",
    left: ean13,
    right: isbn13,
    result: bool,
  });
  const member115 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn)",
    left: ean13,
    right: ismn,
    result: bool,
  });
  const member116 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn13)",
    left: ean13,
    right: ismn13,
    result: bool,
  });
  const member117 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn)",
    left: ean13,
    right: issn,
    result: bool,
  });
  const member118 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn13)",
    left: ean13,
    right: issn13,
    result: bool,
  });
  const member119 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.upc)",
    left: ean13,
    right: upc,
    result: bool,
  });
  const member120 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.isbn,$extension:isn.ean13)",
    left: isbn,
    right: ean13,
    result: bool,
  });
  const member121 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn)",
    left: isbn,
    right: isbn,
    result: bool,
  });
  const member122 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn13)",
    left: isbn,
    right: isbn13,
    result: bool,
  });
  const member123 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.ean13)",
    left: isbn13,
    right: ean13,
    result: bool,
  });
  const member124 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn)",
    left: isbn13,
    right: isbn,
    result: bool,
  });
  const member125 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn13)",
    left: isbn13,
    right: isbn13,
    result: bool,
  });
  const member126 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ean13)",
    left: ismn,
    right: ean13,
    result: bool,
  });
  const member127 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn)",
    left: ismn,
    right: ismn,
    result: bool,
  });
  const member128 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn13)",
    left: ismn,
    right: ismn13,
    result: bool,
  });
  const member129 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ean13)",
    left: ismn13,
    right: ean13,
    result: bool,
  });
  const member130 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn)",
    left: ismn13,
    right: ismn,
    result: bool,
  });
  const member131 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn13)",
    left: ismn13,
    right: ismn13,
    result: bool,
  });
  const member132 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.issn,$extension:isn.ean13)",
    left: issn,
    right: ean13,
    result: bool,
  });
  const member133 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn)",
    left: issn,
    right: issn,
    result: bool,
  });
  const member134 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn13)",
    left: issn,
    right: issn13,
    result: bool,
  });
  const member135 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.issn13,$extension:isn.ean13)",
    left: issn13,
    right: ean13,
    result: bool,
  });
  const member136 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn)",
    left: issn13,
    right: issn,
    result: bool,
  });
  const member137 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn13)",
    left: issn13,
    right: issn13,
    result: bool,
  });
  const member138 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.upc,$extension:isn.ean13)",
    left: upc,
    right: ean13,
    result: bool,
  });
  const member139 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:isn.>($extension:isn.upc,$extension:isn.upc)",
    left: upc,
    right: upc,
    result: bool,
  });
  const member140 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ean13)",
    left: ean13,
    right: ean13,
    result: bool,
  });
  const member141 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn)",
    left: ean13,
    right: isbn,
    result: bool,
  });
  const member142 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn13)",
    left: ean13,
    right: isbn13,
    result: bool,
  });
  const member143 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn)",
    left: ean13,
    right: ismn,
    result: bool,
  });
  const member144 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn13)",
    left: ean13,
    right: ismn13,
    result: bool,
  });
  const member145 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn)",
    left: ean13,
    right: issn,
    result: bool,
  });
  const member146 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn13)",
    left: ean13,
    right: issn13,
    result: bool,
  });
  const member147 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.upc)",
    left: ean13,
    right: upc,
    result: bool,
  });
  const member148 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.ean13)",
    left: isbn,
    right: ean13,
    result: bool,
  });
  const member149 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn)",
    left: isbn,
    right: isbn,
    result: bool,
  });
  const member150 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn13)",
    left: isbn,
    right: isbn13,
    result: bool,
  });
  const member151 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.ean13)",
    left: isbn13,
    right: ean13,
    result: bool,
  });
  const member152 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn)",
    left: isbn13,
    right: isbn,
    result: bool,
  });
  const member153 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn13)",
    left: isbn13,
    right: isbn13,
    result: bool,
  });
  const member154 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ean13)",
    left: ismn,
    right: ean13,
    result: bool,
  });
  const member155 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn)",
    left: ismn,
    right: ismn,
    result: bool,
  });
  const member156 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn13)",
    left: ismn,
    right: ismn13,
    result: bool,
  });
  const member157 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ean13)",
    left: ismn13,
    right: ean13,
    result: bool,
  });
  const member158 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn)",
    left: ismn13,
    right: ismn,
    result: bool,
  });
  const member159 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn13)",
    left: ismn13,
    right: ismn13,
    result: bool,
  });
  const member160 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.issn,$extension:isn.ean13)",
    left: issn,
    right: ean13,
    result: bool,
  });
  const member161 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn)",
    left: issn,
    right: issn,
    result: bool,
  });
  const member162 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn13)",
    left: issn,
    right: issn13,
    result: bool,
  });
  const member163 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.ean13)",
    left: issn13,
    right: ean13,
    result: bool,
  });
  const member164 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn)",
    left: issn13,
    right: issn,
    result: bool,
  });
  const member165 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn13)",
    left: issn13,
    right: issn13,
    result: bool,
  });
  const member166 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.upc,$extension:isn.ean13)",
    left: upc,
    right: ean13,
    result: bool,
  });
  const member167 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:isn.>=($extension:isn.upc,$extension:isn.upc)",
    left: upc,
    right: upc,
    result: bool,
  });
  const member168 = createSqlFunction({
    ...base,
    name: "btean13cmp",
    member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ean13)",
    arguments: [ean13, ean13] as const,
    result: int4,
  });
  const member169 = createSqlFunction({
    ...base,
    name: "btean13cmp",
    member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn)",
    arguments: [ean13, isbn] as const,
    result: int4,
  });
  const member170 = createSqlFunction({
    ...base,
    name: "btean13cmp",
    member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn13)",
    arguments: [ean13, isbn13] as const,
    result: int4,
  });
  const member171 = createSqlFunction({
    ...base,
    name: "btean13cmp",
    member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn)",
    arguments: [ean13, ismn] as const,
    result: int4,
  });
  const member172 = createSqlFunction({
    ...base,
    name: "btean13cmp",
    member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn13)",
    arguments: [ean13, ismn13] as const,
    result: int4,
  });
  const member173 = createSqlFunction({
    ...base,
    name: "btean13cmp",
    member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn)",
    arguments: [ean13, issn] as const,
    result: int4,
  });
  const member174 = createSqlFunction({
    ...base,
    name: "btean13cmp",
    member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn13)",
    arguments: [ean13, issn13] as const,
    result: int4,
  });
  const member175 = createSqlFunction({
    ...base,
    name: "btean13cmp",
    member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.upc)",
    arguments: [ean13, upc] as const,
    result: int4,
  });
  const member176 = createSqlFunction({
    ...base,
    name: "btisbn13cmp",
    member: "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.ean13)",
    arguments: [isbn13, ean13] as const,
    result: int4,
  });
  const member177 = createSqlFunction({
    ...base,
    name: "btisbn13cmp",
    member: "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn)",
    arguments: [isbn13, isbn] as const,
    result: int4,
  });
  const member178 = createSqlFunction({
    ...base,
    name: "btisbn13cmp",
    member: "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn13)",
    arguments: [isbn13, isbn13] as const,
    result: int4,
  });
  const member179 = createSqlFunction({
    ...base,
    name: "btisbncmp",
    member: "routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.ean13)",
    arguments: [isbn, ean13] as const,
    result: int4,
  });
  const member180 = createSqlFunction({
    ...base,
    name: "btisbncmp",
    member: "routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn)",
    arguments: [isbn, isbn] as const,
    result: int4,
  });
  const member181 = createSqlFunction({
    ...base,
    name: "btisbncmp",
    member: "routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn13)",
    arguments: [isbn, isbn13] as const,
    result: int4,
  });
  const member182 = createSqlFunction({
    ...base,
    name: "btismn13cmp",
    member: "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ean13)",
    arguments: [ismn13, ean13] as const,
    result: int4,
  });
  const member183 = createSqlFunction({
    ...base,
    name: "btismn13cmp",
    member: "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn)",
    arguments: [ismn13, ismn] as const,
    result: int4,
  });
  const member184 = createSqlFunction({
    ...base,
    name: "btismn13cmp",
    member: "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn13)",
    arguments: [ismn13, ismn13] as const,
    result: int4,
  });
  const member185 = createSqlFunction({
    ...base,
    name: "btismncmp",
    member: "routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ean13)",
    arguments: [ismn, ean13] as const,
    result: int4,
  });
  const member186 = createSqlFunction({
    ...base,
    name: "btismncmp",
    member: "routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn)",
    arguments: [ismn, ismn] as const,
    result: int4,
  });
  const member187 = createSqlFunction({
    ...base,
    name: "btismncmp",
    member: "routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn13)",
    arguments: [ismn, ismn13] as const,
    result: int4,
  });
  const member188 = createSqlFunction({
    ...base,
    name: "btissn13cmp",
    member: "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.ean13)",
    arguments: [issn13, ean13] as const,
    result: int4,
  });
  const member189 = createSqlFunction({
    ...base,
    name: "btissn13cmp",
    member: "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn)",
    arguments: [issn13, issn] as const,
    result: int4,
  });
  const member190 = createSqlFunction({
    ...base,
    name: "btissn13cmp",
    member: "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn13)",
    arguments: [issn13, issn13] as const,
    result: int4,
  });
  const member191 = createSqlFunction({
    ...base,
    name: "btissncmp",
    member: "routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.ean13)",
    arguments: [issn, ean13] as const,
    result: int4,
  });
  const member192 = createSqlFunction({
    ...base,
    name: "btissncmp",
    member: "routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn)",
    arguments: [issn, issn] as const,
    result: int4,
  });
  const member193 = createSqlFunction({
    ...base,
    name: "btissncmp",
    member: "routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn13)",
    arguments: [issn, issn13] as const,
    result: int4,
  });
  const member194 = createSqlFunction({
    ...base,
    name: "btupccmp",
    member: "routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.ean13)",
    arguments: [upc, ean13] as const,
    result: int4,
  });
  const member195 = createSqlFunction({
    ...base,
    name: "btupccmp",
    member: "routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.upc)",
    arguments: [upc, upc] as const,
    result: int4,
  });
  const member196 = createSqlFunction({
    ...base,
    name: "hashean13",
    member: "routine:$extension:isn.hashean13($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: int4,
  });
  const member197 = createSqlFunction({
    ...base,
    name: "hashisbn",
    member: "routine:$extension:isn.hashisbn($extension:isn.isbn)",
    arguments: [isbn] as const,
    result: int4,
  });
  const member198 = createSqlFunction({
    ...base,
    name: "hashisbn13",
    member: "routine:$extension:isn.hashisbn13($extension:isn.isbn13)",
    arguments: [isbn13] as const,
    result: int4,
  });
  const member199 = createSqlFunction({
    ...base,
    name: "hashismn",
    member: "routine:$extension:isn.hashismn($extension:isn.ismn)",
    arguments: [ismn] as const,
    result: int4,
  });
  const member200 = createSqlFunction({
    ...base,
    name: "hashismn13",
    member: "routine:$extension:isn.hashismn13($extension:isn.ismn13)",
    arguments: [ismn13] as const,
    result: int4,
  });
  const member201 = createSqlFunction({
    ...base,
    name: "hashissn",
    member: "routine:$extension:isn.hashissn($extension:isn.issn)",
    arguments: [issn] as const,
    result: int4,
  });
  const member202 = createSqlFunction({
    ...base,
    name: "hashissn13",
    member: "routine:$extension:isn.hashissn13($extension:isn.issn13)",
    arguments: [issn13] as const,
    result: int4,
  });
  const member203 = createSqlFunction({
    ...base,
    name: "hashupc",
    member: "routine:$extension:isn.hashupc($extension:isn.upc)",
    arguments: [upc] as const,
    result: int4,
  });
  const member204 = createSqlFunction({
    ...base,
    name: "is_valid",
    member: "routine:$extension:isn.is_valid($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: bool,
  });
  const member205 = createSqlFunction({
    ...base,
    name: "is_valid",
    member: "routine:$extension:isn.is_valid($extension:isn.isbn)",
    arguments: [isbn] as const,
    result: bool,
  });
  const member206 = createSqlFunction({
    ...base,
    name: "is_valid",
    member: "routine:$extension:isn.is_valid($extension:isn.isbn13)",
    arguments: [isbn13] as const,
    result: bool,
  });
  const member207 = createSqlFunction({
    ...base,
    name: "is_valid",
    member: "routine:$extension:isn.is_valid($extension:isn.ismn)",
    arguments: [ismn] as const,
    result: bool,
  });
  const member208 = createSqlFunction({
    ...base,
    name: "is_valid",
    member: "routine:$extension:isn.is_valid($extension:isn.ismn13)",
    arguments: [ismn13] as const,
    result: bool,
  });
  const member209 = createSqlFunction({
    ...base,
    name: "is_valid",
    member: "routine:$extension:isn.is_valid($extension:isn.issn)",
    arguments: [issn] as const,
    result: bool,
  });
  const member210 = createSqlFunction({
    ...base,
    name: "is_valid",
    member: "routine:$extension:isn.is_valid($extension:isn.issn13)",
    arguments: [issn13] as const,
    result: bool,
  });
  const member211 = createSqlFunction({
    ...base,
    name: "is_valid",
    member: "routine:$extension:isn.is_valid($extension:isn.upc)",
    arguments: [upc] as const,
    result: bool,
  });
  const member212 = createSqlFunction({
    ...base,
    name: "isbn",
    member: "routine:$extension:isn.isbn($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: isbn,
  });
  const member213 = createSqlFunction({
    ...base,
    name: "isbn13",
    member: "routine:$extension:isn.isbn13($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: isbn13,
  });
  const member214 = createSqlFunction({
    ...base,
    name: "ismn",
    member: "routine:$extension:isn.ismn($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: ismn,
  });
  const member215 = createSqlFunction({
    ...base,
    name: "ismn13",
    member: "routine:$extension:isn.ismn13($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: ismn13,
  });
  const member216 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ean13)",
    arguments: [ean13, ean13] as const,
    result: bool,
  });
  const member217 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn)",
    arguments: [ean13, isbn] as const,
    result: bool,
  });
  const member218 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn13)",
    arguments: [ean13, isbn13] as const,
    result: bool,
  });
  const member219 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn)",
    arguments: [ean13, ismn] as const,
    result: bool,
  });
  const member220 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn13)",
    arguments: [ean13, ismn13] as const,
    result: bool,
  });
  const member221 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn)",
    arguments: [ean13, issn] as const,
    result: bool,
  });
  const member222 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn13)",
    arguments: [ean13, issn13] as const,
    result: bool,
  });
  const member223 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.upc)",
    arguments: [ean13, upc] as const,
    result: bool,
  });
  const member224 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.ean13)",
    arguments: [isbn, ean13] as const,
    result: bool,
  });
  const member225 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn)",
    arguments: [isbn, isbn] as const,
    result: bool,
  });
  const member226 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn13)",
    arguments: [isbn, isbn13] as const,
    result: bool,
  });
  const member227 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.ean13)",
    arguments: [isbn13, ean13] as const,
    result: bool,
  });
  const member228 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn)",
    arguments: [isbn13, isbn] as const,
    result: bool,
  });
  const member229 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn13)",
    arguments: [isbn13, isbn13] as const,
    result: bool,
  });
  const member230 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ean13)",
    arguments: [ismn, ean13] as const,
    result: bool,
  });
  const member231 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn)",
    arguments: [ismn, ismn] as const,
    result: bool,
  });
  const member232 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn13)",
    arguments: [ismn, ismn13] as const,
    result: bool,
  });
  const member233 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ean13)",
    arguments: [ismn13, ean13] as const,
    result: bool,
  });
  const member234 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn)",
    arguments: [ismn13, ismn] as const,
    result: bool,
  });
  const member235 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn13)",
    arguments: [ismn13, ismn13] as const,
    result: bool,
  });
  const member236 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.ean13)",
    arguments: [issn, ean13] as const,
    result: bool,
  });
  const member237 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn)",
    arguments: [issn, issn] as const,
    result: bool,
  });
  const member238 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn13)",
    arguments: [issn, issn13] as const,
    result: bool,
  });
  const member239 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.ean13)",
    arguments: [issn13, ean13] as const,
    result: bool,
  });
  const member240 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn)",
    arguments: [issn13, issn] as const,
    result: bool,
  });
  const member241 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn13)",
    arguments: [issn13, issn13] as const,
    result: bool,
  });
  const member242 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.ean13)",
    arguments: [upc, ean13] as const,
    result: bool,
  });
  const member243 = createSqlFunction({
    ...base,
    name: "isneq",
    member: "routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.upc)",
    arguments: [upc, upc] as const,
    result: bool,
  });
  const member244 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ean13)",
    arguments: [ean13, ean13] as const,
    result: bool,
  });
  const member245 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn)",
    arguments: [ean13, isbn] as const,
    result: bool,
  });
  const member246 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn13)",
    arguments: [ean13, isbn13] as const,
    result: bool,
  });
  const member247 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn)",
    arguments: [ean13, ismn] as const,
    result: bool,
  });
  const member248 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn13)",
    arguments: [ean13, ismn13] as const,
    result: bool,
  });
  const member249 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn)",
    arguments: [ean13, issn] as const,
    result: bool,
  });
  const member250 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn13)",
    arguments: [ean13, issn13] as const,
    result: bool,
  });
  const member251 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.upc)",
    arguments: [ean13, upc] as const,
    result: bool,
  });
  const member252 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.ean13)",
    arguments: [isbn, ean13] as const,
    result: bool,
  });
  const member253 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn)",
    arguments: [isbn, isbn] as const,
    result: bool,
  });
  const member254 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn13)",
    arguments: [isbn, isbn13] as const,
    result: bool,
  });
  const member255 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.ean13)",
    arguments: [isbn13, ean13] as const,
    result: bool,
  });
  const member256 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn)",
    arguments: [isbn13, isbn] as const,
    result: bool,
  });
  const member257 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn13)",
    arguments: [isbn13, isbn13] as const,
    result: bool,
  });
  const member258 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ean13)",
    arguments: [ismn, ean13] as const,
    result: bool,
  });
  const member259 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn)",
    arguments: [ismn, ismn] as const,
    result: bool,
  });
  const member260 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn13)",
    arguments: [ismn, ismn13] as const,
    result: bool,
  });
  const member261 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ean13)",
    arguments: [ismn13, ean13] as const,
    result: bool,
  });
  const member262 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn)",
    arguments: [ismn13, ismn] as const,
    result: bool,
  });
  const member263 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn13)",
    arguments: [ismn13, ismn13] as const,
    result: bool,
  });
  const member264 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.ean13)",
    arguments: [issn, ean13] as const,
    result: bool,
  });
  const member265 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn)",
    arguments: [issn, issn] as const,
    result: bool,
  });
  const member266 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn13)",
    arguments: [issn, issn13] as const,
    result: bool,
  });
  const member267 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.ean13)",
    arguments: [issn13, ean13] as const,
    result: bool,
  });
  const member268 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn)",
    arguments: [issn13, issn] as const,
    result: bool,
  });
  const member269 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn13)",
    arguments: [issn13, issn13] as const,
    result: bool,
  });
  const member270 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.ean13)",
    arguments: [upc, ean13] as const,
    result: bool,
  });
  const member271 = createSqlFunction({
    ...base,
    name: "isnge",
    member: "routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.upc)",
    arguments: [upc, upc] as const,
    result: bool,
  });
  const member272 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ean13)",
    arguments: [ean13, ean13] as const,
    result: bool,
  });
  const member273 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn)",
    arguments: [ean13, isbn] as const,
    result: bool,
  });
  const member274 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn13)",
    arguments: [ean13, isbn13] as const,
    result: bool,
  });
  const member275 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn)",
    arguments: [ean13, ismn] as const,
    result: bool,
  });
  const member276 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn13)",
    arguments: [ean13, ismn13] as const,
    result: bool,
  });
  const member277 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn)",
    arguments: [ean13, issn] as const,
    result: bool,
  });
  const member278 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn13)",
    arguments: [ean13, issn13] as const,
    result: bool,
  });
  const member279 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.upc)",
    arguments: [ean13, upc] as const,
    result: bool,
  });
  const member280 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.ean13)",
    arguments: [isbn, ean13] as const,
    result: bool,
  });
  const member281 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn)",
    arguments: [isbn, isbn] as const,
    result: bool,
  });
  const member282 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn13)",
    arguments: [isbn, isbn13] as const,
    result: bool,
  });
  const member283 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.ean13)",
    arguments: [isbn13, ean13] as const,
    result: bool,
  });
  const member284 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn)",
    arguments: [isbn13, isbn] as const,
    result: bool,
  });
  const member285 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn13)",
    arguments: [isbn13, isbn13] as const,
    result: bool,
  });
  const member286 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ean13)",
    arguments: [ismn, ean13] as const,
    result: bool,
  });
  const member287 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn)",
    arguments: [ismn, ismn] as const,
    result: bool,
  });
  const member288 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn13)",
    arguments: [ismn, ismn13] as const,
    result: bool,
  });
  const member289 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ean13)",
    arguments: [ismn13, ean13] as const,
    result: bool,
  });
  const member290 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn)",
    arguments: [ismn13, ismn] as const,
    result: bool,
  });
  const member291 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn13)",
    arguments: [ismn13, ismn13] as const,
    result: bool,
  });
  const member292 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.ean13)",
    arguments: [issn, ean13] as const,
    result: bool,
  });
  const member293 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn)",
    arguments: [issn, issn] as const,
    result: bool,
  });
  const member294 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn13)",
    arguments: [issn, issn13] as const,
    result: bool,
  });
  const member295 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.ean13)",
    arguments: [issn13, ean13] as const,
    result: bool,
  });
  const member296 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn)",
    arguments: [issn13, issn] as const,
    result: bool,
  });
  const member297 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn13)",
    arguments: [issn13, issn13] as const,
    result: bool,
  });
  const member298 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.ean13)",
    arguments: [upc, ean13] as const,
    result: bool,
  });
  const member299 = createSqlFunction({
    ...base,
    name: "isngt",
    member: "routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.upc)",
    arguments: [upc, upc] as const,
    result: bool,
  });
  const member300 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ean13)",
    arguments: [ean13, ean13] as const,
    result: bool,
  });
  const member301 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn)",
    arguments: [ean13, isbn] as const,
    result: bool,
  });
  const member302 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn13)",
    arguments: [ean13, isbn13] as const,
    result: bool,
  });
  const member303 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn)",
    arguments: [ean13, ismn] as const,
    result: bool,
  });
  const member304 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn13)",
    arguments: [ean13, ismn13] as const,
    result: bool,
  });
  const member305 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn)",
    arguments: [ean13, issn] as const,
    result: bool,
  });
  const member306 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn13)",
    arguments: [ean13, issn13] as const,
    result: bool,
  });
  const member307 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.upc)",
    arguments: [ean13, upc] as const,
    result: bool,
  });
  const member308 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.ean13)",
    arguments: [isbn, ean13] as const,
    result: bool,
  });
  const member309 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn)",
    arguments: [isbn, isbn] as const,
    result: bool,
  });
  const member310 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn13)",
    arguments: [isbn, isbn13] as const,
    result: bool,
  });
  const member311 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.ean13)",
    arguments: [isbn13, ean13] as const,
    result: bool,
  });
  const member312 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn)",
    arguments: [isbn13, isbn] as const,
    result: bool,
  });
  const member313 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn13)",
    arguments: [isbn13, isbn13] as const,
    result: bool,
  });
  const member314 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ean13)",
    arguments: [ismn, ean13] as const,
    result: bool,
  });
  const member315 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn)",
    arguments: [ismn, ismn] as const,
    result: bool,
  });
  const member316 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn13)",
    arguments: [ismn, ismn13] as const,
    result: bool,
  });
  const member317 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ean13)",
    arguments: [ismn13, ean13] as const,
    result: bool,
  });
  const member318 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn)",
    arguments: [ismn13, ismn] as const,
    result: bool,
  });
  const member319 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn13)",
    arguments: [ismn13, ismn13] as const,
    result: bool,
  });
  const member320 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.ean13)",
    arguments: [issn, ean13] as const,
    result: bool,
  });
  const member321 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn)",
    arguments: [issn, issn] as const,
    result: bool,
  });
  const member322 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn13)",
    arguments: [issn, issn13] as const,
    result: bool,
  });
  const member323 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.ean13)",
    arguments: [issn13, ean13] as const,
    result: bool,
  });
  const member324 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn)",
    arguments: [issn13, issn] as const,
    result: bool,
  });
  const member325 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn13)",
    arguments: [issn13, issn13] as const,
    result: bool,
  });
  const member326 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.ean13)",
    arguments: [upc, ean13] as const,
    result: bool,
  });
  const member327 = createSqlFunction({
    ...base,
    name: "isnle",
    member: "routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.upc)",
    arguments: [upc, upc] as const,
    result: bool,
  });
  const member328 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ean13)",
    arguments: [ean13, ean13] as const,
    result: bool,
  });
  const member329 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn)",
    arguments: [ean13, isbn] as const,
    result: bool,
  });
  const member330 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn13)",
    arguments: [ean13, isbn13] as const,
    result: bool,
  });
  const member331 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn)",
    arguments: [ean13, ismn] as const,
    result: bool,
  });
  const member332 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn13)",
    arguments: [ean13, ismn13] as const,
    result: bool,
  });
  const member333 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn)",
    arguments: [ean13, issn] as const,
    result: bool,
  });
  const member334 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn13)",
    arguments: [ean13, issn13] as const,
    result: bool,
  });
  const member335 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.upc)",
    arguments: [ean13, upc] as const,
    result: bool,
  });
  const member336 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.ean13)",
    arguments: [isbn, ean13] as const,
    result: bool,
  });
  const member337 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn)",
    arguments: [isbn, isbn] as const,
    result: bool,
  });
  const member338 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn13)",
    arguments: [isbn, isbn13] as const,
    result: bool,
  });
  const member339 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.ean13)",
    arguments: [isbn13, ean13] as const,
    result: bool,
  });
  const member340 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn)",
    arguments: [isbn13, isbn] as const,
    result: bool,
  });
  const member341 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn13)",
    arguments: [isbn13, isbn13] as const,
    result: bool,
  });
  const member342 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ean13)",
    arguments: [ismn, ean13] as const,
    result: bool,
  });
  const member343 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn)",
    arguments: [ismn, ismn] as const,
    result: bool,
  });
  const member344 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn13)",
    arguments: [ismn, ismn13] as const,
    result: bool,
  });
  const member345 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ean13)",
    arguments: [ismn13, ean13] as const,
    result: bool,
  });
  const member346 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn)",
    arguments: [ismn13, ismn] as const,
    result: bool,
  });
  const member347 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn13)",
    arguments: [ismn13, ismn13] as const,
    result: bool,
  });
  const member348 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.ean13)",
    arguments: [issn, ean13] as const,
    result: bool,
  });
  const member349 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn)",
    arguments: [issn, issn] as const,
    result: bool,
  });
  const member350 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn13)",
    arguments: [issn, issn13] as const,
    result: bool,
  });
  const member351 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.ean13)",
    arguments: [issn13, ean13] as const,
    result: bool,
  });
  const member352 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn)",
    arguments: [issn13, issn] as const,
    result: bool,
  });
  const member353 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn13)",
    arguments: [issn13, issn13] as const,
    result: bool,
  });
  const member354 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.ean13)",
    arguments: [upc, ean13] as const,
    result: bool,
  });
  const member355 = createSqlFunction({
    ...base,
    name: "isnlt",
    member: "routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.upc)",
    arguments: [upc, upc] as const,
    result: bool,
  });
  const member356 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ean13)",
    arguments: [ean13, ean13] as const,
    result: bool,
  });
  const member357 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn)",
    arguments: [ean13, isbn] as const,
    result: bool,
  });
  const member358 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn13)",
    arguments: [ean13, isbn13] as const,
    result: bool,
  });
  const member359 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn)",
    arguments: [ean13, ismn] as const,
    result: bool,
  });
  const member360 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn13)",
    arguments: [ean13, ismn13] as const,
    result: bool,
  });
  const member361 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn)",
    arguments: [ean13, issn] as const,
    result: bool,
  });
  const member362 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn13)",
    arguments: [ean13, issn13] as const,
    result: bool,
  });
  const member363 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.upc)",
    arguments: [ean13, upc] as const,
    result: bool,
  });
  const member364 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.ean13)",
    arguments: [isbn, ean13] as const,
    result: bool,
  });
  const member365 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn)",
    arguments: [isbn, isbn] as const,
    result: bool,
  });
  const member366 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn13)",
    arguments: [isbn, isbn13] as const,
    result: bool,
  });
  const member367 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.ean13)",
    arguments: [isbn13, ean13] as const,
    result: bool,
  });
  const member368 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn)",
    arguments: [isbn13, isbn] as const,
    result: bool,
  });
  const member369 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn13)",
    arguments: [isbn13, isbn13] as const,
    result: bool,
  });
  const member370 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ean13)",
    arguments: [ismn, ean13] as const,
    result: bool,
  });
  const member371 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn)",
    arguments: [ismn, ismn] as const,
    result: bool,
  });
  const member372 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn13)",
    arguments: [ismn, ismn13] as const,
    result: bool,
  });
  const member373 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ean13)",
    arguments: [ismn13, ean13] as const,
    result: bool,
  });
  const member374 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn)",
    arguments: [ismn13, ismn] as const,
    result: bool,
  });
  const member375 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn13)",
    arguments: [ismn13, ismn13] as const,
    result: bool,
  });
  const member376 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.ean13)",
    arguments: [issn, ean13] as const,
    result: bool,
  });
  const member377 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn)",
    arguments: [issn, issn] as const,
    result: bool,
  });
  const member378 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn13)",
    arguments: [issn, issn13] as const,
    result: bool,
  });
  const member379 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.ean13)",
    arguments: [issn13, ean13] as const,
    result: bool,
  });
  const member380 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn)",
    arguments: [issn13, issn] as const,
    result: bool,
  });
  const member381 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn13)",
    arguments: [issn13, issn13] as const,
    result: bool,
  });
  const member382 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.ean13)",
    arguments: [upc, ean13] as const,
    result: bool,
  });
  const member383 = createSqlFunction({
    ...base,
    name: "isnne",
    member: "routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.upc)",
    arguments: [upc, upc] as const,
    result: bool,
  });
  const member384 = createSqlFunction({
    ...base,
    name: "issn",
    member: "routine:$extension:isn.issn($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: issn,
  });
  const member385 = createSqlFunction({
    ...base,
    name: "issn13",
    member: "routine:$extension:isn.issn13($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: issn13,
  });
  const member386 = createSqlFunction({
    ...base,
    name: "make_valid",
    member: "routine:$extension:isn.make_valid($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: ean13,
  });
  const member387 = createSqlFunction({
    ...base,
    name: "make_valid",
    member: "routine:$extension:isn.make_valid($extension:isn.isbn)",
    arguments: [isbn] as const,
    result: isbn,
  });
  const member388 = createSqlFunction({
    ...base,
    name: "make_valid",
    member: "routine:$extension:isn.make_valid($extension:isn.isbn13)",
    arguments: [isbn13] as const,
    result: isbn13,
  });
  const member389 = createSqlFunction({
    ...base,
    name: "make_valid",
    member: "routine:$extension:isn.make_valid($extension:isn.ismn)",
    arguments: [ismn] as const,
    result: ismn,
  });
  const member390 = createSqlFunction({
    ...base,
    name: "make_valid",
    member: "routine:$extension:isn.make_valid($extension:isn.ismn13)",
    arguments: [ismn13] as const,
    result: ismn13,
  });
  const member391 = createSqlFunction({
    ...base,
    name: "make_valid",
    member: "routine:$extension:isn.make_valid($extension:isn.issn)",
    arguments: [issn] as const,
    result: issn,
  });
  const member392 = createSqlFunction({
    ...base,
    name: "make_valid",
    member: "routine:$extension:isn.make_valid($extension:isn.issn13)",
    arguments: [issn13] as const,
    result: issn13,
  });
  const member393 = createSqlFunction({
    ...base,
    name: "make_valid",
    member: "routine:$extension:isn.make_valid($extension:isn.upc)",
    arguments: [upc] as const,
    result: upc,
  });
  const member394 = createSqlFunction({
    ...base,
    name: "upc",
    member: "routine:$extension:isn.upc($extension:isn.ean13)",
    arguments: [ean13] as const,
    result: upc,
  });
  const functions = Object.freeze({
    btean13cmp: Object.freeze({
      ean13_ean13: member168,
      ean13_isbn: member169,
      ean13_isbn13: member170,
      ean13_ismn: member171,
      ean13_ismn13: member172,
      ean13_issn: member173,
      ean13_issn13: member174,
      ean13_upc: member175,
    }),
    btisbn13cmp: Object.freeze({ isbn13_ean13: member176, isbn13_isbn: member177, isbn13_isbn13: member178 }),
    btisbncmp: Object.freeze({ isbn_ean13: member179, isbn_isbn: member180, isbn_isbn13: member181 }),
    btismn13cmp: Object.freeze({ ismn13_ean13: member182, ismn13_ismn: member183, ismn13_ismn13: member184 }),
    btismncmp: Object.freeze({ ismn_ean13: member185, ismn_ismn: member186, ismn_ismn13: member187 }),
    btissn13cmp: Object.freeze({ issn13_ean13: member188, issn13_issn: member189, issn13_issn13: member190 }),
    btissncmp: Object.freeze({ issn_ean13: member191, issn_issn: member192, issn_issn13: member193 }),
    btupccmp: Object.freeze({ upc_ean13: member194, upc_upc: member195 }),
    hashean13: Object.freeze({ ean13: member196 }),
    hashisbn: Object.freeze({ isbn: member197 }),
    hashisbn13: Object.freeze({ isbn13: member198 }),
    hashismn: Object.freeze({ ismn: member199 }),
    hashismn13: Object.freeze({ ismn13: member200 }),
    hashissn: Object.freeze({ issn: member201 }),
    hashissn13: Object.freeze({ issn13: member202 }),
    hashupc: Object.freeze({ upc: member203 }),
    is_valid: Object.freeze({
      ean13: member204,
      isbn: member205,
      isbn13: member206,
      ismn: member207,
      ismn13: member208,
      issn: member209,
      issn13: member210,
      upc: member211,
    }),
    isbn: Object.freeze({ ean13: member212 }),
    isbn13: Object.freeze({ ean13: member213 }),
    ismn: Object.freeze({ ean13: member214 }),
    ismn13: Object.freeze({ ean13: member215 }),
    isneq: Object.freeze({
      ean13_ean13: member216,
      ean13_isbn: member217,
      ean13_isbn13: member218,
      ean13_ismn: member219,
      ean13_ismn13: member220,
      ean13_issn: member221,
      ean13_issn13: member222,
      ean13_upc: member223,
      isbn_ean13: member224,
      isbn_isbn: member225,
      isbn_isbn13: member226,
      isbn13_ean13: member227,
      isbn13_isbn: member228,
      isbn13_isbn13: member229,
      ismn_ean13: member230,
      ismn_ismn: member231,
      ismn_ismn13: member232,
      ismn13_ean13: member233,
      ismn13_ismn: member234,
      ismn13_ismn13: member235,
      issn_ean13: member236,
      issn_issn: member237,
      issn_issn13: member238,
      issn13_ean13: member239,
      issn13_issn: member240,
      issn13_issn13: member241,
      upc_ean13: member242,
      upc_upc: member243,
    }),
    isnge: Object.freeze({
      ean13_ean13: member244,
      ean13_isbn: member245,
      ean13_isbn13: member246,
      ean13_ismn: member247,
      ean13_ismn13: member248,
      ean13_issn: member249,
      ean13_issn13: member250,
      ean13_upc: member251,
      isbn_ean13: member252,
      isbn_isbn: member253,
      isbn_isbn13: member254,
      isbn13_ean13: member255,
      isbn13_isbn: member256,
      isbn13_isbn13: member257,
      ismn_ean13: member258,
      ismn_ismn: member259,
      ismn_ismn13: member260,
      ismn13_ean13: member261,
      ismn13_ismn: member262,
      ismn13_ismn13: member263,
      issn_ean13: member264,
      issn_issn: member265,
      issn_issn13: member266,
      issn13_ean13: member267,
      issn13_issn: member268,
      issn13_issn13: member269,
      upc_ean13: member270,
      upc_upc: member271,
    }),
    isngt: Object.freeze({
      ean13_ean13: member272,
      ean13_isbn: member273,
      ean13_isbn13: member274,
      ean13_ismn: member275,
      ean13_ismn13: member276,
      ean13_issn: member277,
      ean13_issn13: member278,
      ean13_upc: member279,
      isbn_ean13: member280,
      isbn_isbn: member281,
      isbn_isbn13: member282,
      isbn13_ean13: member283,
      isbn13_isbn: member284,
      isbn13_isbn13: member285,
      ismn_ean13: member286,
      ismn_ismn: member287,
      ismn_ismn13: member288,
      ismn13_ean13: member289,
      ismn13_ismn: member290,
      ismn13_ismn13: member291,
      issn_ean13: member292,
      issn_issn: member293,
      issn_issn13: member294,
      issn13_ean13: member295,
      issn13_issn: member296,
      issn13_issn13: member297,
      upc_ean13: member298,
      upc_upc: member299,
    }),
    isnle: Object.freeze({
      ean13_ean13: member300,
      ean13_isbn: member301,
      ean13_isbn13: member302,
      ean13_ismn: member303,
      ean13_ismn13: member304,
      ean13_issn: member305,
      ean13_issn13: member306,
      ean13_upc: member307,
      isbn_ean13: member308,
      isbn_isbn: member309,
      isbn_isbn13: member310,
      isbn13_ean13: member311,
      isbn13_isbn: member312,
      isbn13_isbn13: member313,
      ismn_ean13: member314,
      ismn_ismn: member315,
      ismn_ismn13: member316,
      ismn13_ean13: member317,
      ismn13_ismn: member318,
      ismn13_ismn13: member319,
      issn_ean13: member320,
      issn_issn: member321,
      issn_issn13: member322,
      issn13_ean13: member323,
      issn13_issn: member324,
      issn13_issn13: member325,
      upc_ean13: member326,
      upc_upc: member327,
    }),
    isnlt: Object.freeze({
      ean13_ean13: member328,
      ean13_isbn: member329,
      ean13_isbn13: member330,
      ean13_ismn: member331,
      ean13_ismn13: member332,
      ean13_issn: member333,
      ean13_issn13: member334,
      ean13_upc: member335,
      isbn_ean13: member336,
      isbn_isbn: member337,
      isbn_isbn13: member338,
      isbn13_ean13: member339,
      isbn13_isbn: member340,
      isbn13_isbn13: member341,
      ismn_ean13: member342,
      ismn_ismn: member343,
      ismn_ismn13: member344,
      ismn13_ean13: member345,
      ismn13_ismn: member346,
      ismn13_ismn13: member347,
      issn_ean13: member348,
      issn_issn: member349,
      issn_issn13: member350,
      issn13_ean13: member351,
      issn13_issn: member352,
      issn13_issn13: member353,
      upc_ean13: member354,
      upc_upc: member355,
    }),
    isnne: Object.freeze({
      ean13_ean13: member356,
      ean13_isbn: member357,
      ean13_isbn13: member358,
      ean13_ismn: member359,
      ean13_ismn13: member360,
      ean13_issn: member361,
      ean13_issn13: member362,
      ean13_upc: member363,
      isbn_ean13: member364,
      isbn_isbn: member365,
      isbn_isbn13: member366,
      isbn13_ean13: member367,
      isbn13_isbn: member368,
      isbn13_isbn13: member369,
      ismn_ean13: member370,
      ismn_ismn: member371,
      ismn_ismn13: member372,
      ismn13_ean13: member373,
      ismn13_ismn: member374,
      ismn13_ismn13: member375,
      issn_ean13: member376,
      issn_issn: member377,
      issn_issn13: member378,
      issn13_ean13: member379,
      issn13_issn: member380,
      issn13_issn13: member381,
      upc_ean13: member382,
      upc_upc: member383,
    }),
    issn: Object.freeze({ ean13: member384 }),
    issn13: Object.freeze({ ean13: member385 }),
    make_valid: Object.freeze({
      ean13: member386,
      isbn: member387,
      isbn13: member388,
      ismn: member389,
      ismn13: member390,
      issn: member391,
      issn13: member392,
      upc: member393,
    }),
    upc: Object.freeze({ ean13: member394 }),
  });
  const operators = Object.freeze({
    "<": Object.freeze({
      ean13_ean13: member0,
      ean13_isbn: member1,
      ean13_isbn13: member2,
      ean13_ismn: member3,
      ean13_ismn13: member4,
      ean13_issn: member5,
      ean13_issn13: member6,
      ean13_upc: member7,
      isbn_ean13: member8,
      isbn_isbn: member9,
      isbn_isbn13: member10,
      isbn13_ean13: member11,
      isbn13_isbn: member12,
      isbn13_isbn13: member13,
      ismn_ean13: member14,
      ismn_ismn: member15,
      ismn_ismn13: member16,
      ismn13_ean13: member17,
      ismn13_ismn: member18,
      ismn13_ismn13: member19,
      issn_ean13: member20,
      issn_issn: member21,
      issn_issn13: member22,
      issn13_ean13: member23,
      issn13_issn: member24,
      issn13_issn13: member25,
      upc_ean13: member26,
      upc_upc: member27,
    }),
    "<=": Object.freeze({
      ean13_ean13: member28,
      ean13_isbn: member29,
      ean13_isbn13: member30,
      ean13_ismn: member31,
      ean13_ismn13: member32,
      ean13_issn: member33,
      ean13_issn13: member34,
      ean13_upc: member35,
      isbn_ean13: member36,
      isbn_isbn: member37,
      isbn_isbn13: member38,
      isbn13_ean13: member39,
      isbn13_isbn: member40,
      isbn13_isbn13: member41,
      ismn_ean13: member42,
      ismn_ismn: member43,
      ismn_ismn13: member44,
      ismn13_ean13: member45,
      ismn13_ismn: member46,
      ismn13_ismn13: member47,
      issn_ean13: member48,
      issn_issn: member49,
      issn_issn13: member50,
      issn13_ean13: member51,
      issn13_issn: member52,
      issn13_issn13: member53,
      upc_ean13: member54,
      upc_upc: member55,
    }),
    "<>": Object.freeze({
      ean13_ean13: member56,
      ean13_isbn: member57,
      ean13_isbn13: member58,
      ean13_ismn: member59,
      ean13_ismn13: member60,
      ean13_issn: member61,
      ean13_issn13: member62,
      ean13_upc: member63,
      isbn_ean13: member64,
      isbn_isbn: member65,
      isbn_isbn13: member66,
      isbn13_ean13: member67,
      isbn13_isbn: member68,
      isbn13_isbn13: member69,
      ismn_ean13: member70,
      ismn_ismn: member71,
      ismn_ismn13: member72,
      ismn13_ean13: member73,
      ismn13_ismn: member74,
      ismn13_ismn13: member75,
      issn_ean13: member76,
      issn_issn: member77,
      issn_issn13: member78,
      issn13_ean13: member79,
      issn13_issn: member80,
      issn13_issn13: member81,
      upc_ean13: member82,
      upc_upc: member83,
    }),
    "=": Object.freeze({
      ean13_ean13: member84,
      ean13_isbn: member85,
      ean13_isbn13: member86,
      ean13_ismn: member87,
      ean13_ismn13: member88,
      ean13_issn: member89,
      ean13_issn13: member90,
      ean13_upc: member91,
      isbn_ean13: member92,
      isbn_isbn: member93,
      isbn_isbn13: member94,
      isbn13_ean13: member95,
      isbn13_isbn: member96,
      isbn13_isbn13: member97,
      ismn_ean13: member98,
      ismn_ismn: member99,
      ismn_ismn13: member100,
      ismn13_ean13: member101,
      ismn13_ismn: member102,
      ismn13_ismn13: member103,
      issn_ean13: member104,
      issn_issn: member105,
      issn_issn13: member106,
      issn13_ean13: member107,
      issn13_issn: member108,
      issn13_issn13: member109,
      upc_ean13: member110,
      upc_upc: member111,
    }),
    ">": Object.freeze({
      ean13_ean13: member112,
      ean13_isbn: member113,
      ean13_isbn13: member114,
      ean13_ismn: member115,
      ean13_ismn13: member116,
      ean13_issn: member117,
      ean13_issn13: member118,
      ean13_upc: member119,
      isbn_ean13: member120,
      isbn_isbn: member121,
      isbn_isbn13: member122,
      isbn13_ean13: member123,
      isbn13_isbn: member124,
      isbn13_isbn13: member125,
      ismn_ean13: member126,
      ismn_ismn: member127,
      ismn_ismn13: member128,
      ismn13_ean13: member129,
      ismn13_ismn: member130,
      ismn13_ismn13: member131,
      issn_ean13: member132,
      issn_issn: member133,
      issn_issn13: member134,
      issn13_ean13: member135,
      issn13_issn: member136,
      issn13_issn13: member137,
      upc_ean13: member138,
      upc_upc: member139,
    }),
    ">=": Object.freeze({
      ean13_ean13: member140,
      ean13_isbn: member141,
      ean13_isbn13: member142,
      ean13_ismn: member143,
      ean13_ismn13: member144,
      ean13_issn: member145,
      ean13_issn13: member146,
      ean13_upc: member147,
      isbn_ean13: member148,
      isbn_isbn: member149,
      isbn_isbn13: member150,
      isbn13_ean13: member151,
      isbn13_isbn: member152,
      isbn13_isbn13: member153,
      ismn_ean13: member154,
      ismn_ismn: member155,
      ismn_ismn13: member156,
      ismn13_ean13: member157,
      ismn13_ismn: member158,
      ismn13_ismn13: member159,
      issn_ean13: member160,
      issn_issn: member161,
      issn_issn13: member162,
      issn13_ean13: member163,
      issn13_issn: member164,
      issn13_issn13: member165,
      upc_ean13: member166,
      upc_upc: member167,
    }),
  });
  const overloads = Object.freeze({
    "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ean13)": member0,
    "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn)": member1,
    "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn13)": member2,
    "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn)": member3,
    "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn13)": member4,
    "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn)": member5,
    "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn13)": member6,
    "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.upc)": member7,
    "operator:$extension:isn.<($extension:isn.isbn,$extension:isn.ean13)": member8,
    "operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn)": member9,
    "operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn13)": member10,
    "operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.ean13)": member11,
    "operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn)": member12,
    "operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn13)": member13,
    "operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ean13)": member14,
    "operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn)": member15,
    "operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn13)": member16,
    "operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ean13)": member17,
    "operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn)": member18,
    "operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn13)": member19,
    "operator:$extension:isn.<($extension:isn.issn,$extension:isn.ean13)": member20,
    "operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn)": member21,
    "operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn13)": member22,
    "operator:$extension:isn.<($extension:isn.issn13,$extension:isn.ean13)": member23,
    "operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn)": member24,
    "operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn13)": member25,
    "operator:$extension:isn.<($extension:isn.upc,$extension:isn.ean13)": member26,
    "operator:$extension:isn.<($extension:isn.upc,$extension:isn.upc)": member27,
    "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ean13)": member28,
    "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn)": member29,
    "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn13)": member30,
    "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn)": member31,
    "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn13)": member32,
    "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn)": member33,
    "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn13)": member34,
    "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.upc)": member35,
    "operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.ean13)": member36,
    "operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn)": member37,
    "operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn13)": member38,
    "operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.ean13)": member39,
    "operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn)": member40,
    "operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn13)": member41,
    "operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ean13)": member42,
    "operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn)": member43,
    "operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn13)": member44,
    "operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ean13)": member45,
    "operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn)": member46,
    "operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn13)": member47,
    "operator:$extension:isn.<=($extension:isn.issn,$extension:isn.ean13)": member48,
    "operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn)": member49,
    "operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn13)": member50,
    "operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.ean13)": member51,
    "operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn)": member52,
    "operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn13)": member53,
    "operator:$extension:isn.<=($extension:isn.upc,$extension:isn.ean13)": member54,
    "operator:$extension:isn.<=($extension:isn.upc,$extension:isn.upc)": member55,
    "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ean13)": member56,
    "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn)": member57,
    "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn13)": member58,
    "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn)": member59,
    "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn13)": member60,
    "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn)": member61,
    "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn13)": member62,
    "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.upc)": member63,
    "operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.ean13)": member64,
    "operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn)": member65,
    "operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn13)": member66,
    "operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.ean13)": member67,
    "operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn)": member68,
    "operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn13)": member69,
    "operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ean13)": member70,
    "operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn)": member71,
    "operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn13)": member72,
    "operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ean13)": member73,
    "operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn)": member74,
    "operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn13)": member75,
    "operator:$extension:isn.<>($extension:isn.issn,$extension:isn.ean13)": member76,
    "operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn)": member77,
    "operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn13)": member78,
    "operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.ean13)": member79,
    "operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn)": member80,
    "operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn13)": member81,
    "operator:$extension:isn.<>($extension:isn.upc,$extension:isn.ean13)": member82,
    "operator:$extension:isn.<>($extension:isn.upc,$extension:isn.upc)": member83,
    "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ean13)": member84,
    "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn)": member85,
    "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn13)": member86,
    "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn)": member87,
    "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn13)": member88,
    "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn)": member89,
    "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn13)": member90,
    "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.upc)": member91,
    "operator:$extension:isn.=($extension:isn.isbn,$extension:isn.ean13)": member92,
    "operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn)": member93,
    "operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn13)": member94,
    "operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.ean13)": member95,
    "operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn)": member96,
    "operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn13)": member97,
    "operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ean13)": member98,
    "operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn)": member99,
    "operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn13)": member100,
    "operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ean13)": member101,
    "operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn)": member102,
    "operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn13)": member103,
    "operator:$extension:isn.=($extension:isn.issn,$extension:isn.ean13)": member104,
    "operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn)": member105,
    "operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn13)": member106,
    "operator:$extension:isn.=($extension:isn.issn13,$extension:isn.ean13)": member107,
    "operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn)": member108,
    "operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn13)": member109,
    "operator:$extension:isn.=($extension:isn.upc,$extension:isn.ean13)": member110,
    "operator:$extension:isn.=($extension:isn.upc,$extension:isn.upc)": member111,
    "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ean13)": member112,
    "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn)": member113,
    "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn13)": member114,
    "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn)": member115,
    "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn13)": member116,
    "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn)": member117,
    "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn13)": member118,
    "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.upc)": member119,
    "operator:$extension:isn.>($extension:isn.isbn,$extension:isn.ean13)": member120,
    "operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn)": member121,
    "operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn13)": member122,
    "operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.ean13)": member123,
    "operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn)": member124,
    "operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn13)": member125,
    "operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ean13)": member126,
    "operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn)": member127,
    "operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn13)": member128,
    "operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ean13)": member129,
    "operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn)": member130,
    "operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn13)": member131,
    "operator:$extension:isn.>($extension:isn.issn,$extension:isn.ean13)": member132,
    "operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn)": member133,
    "operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn13)": member134,
    "operator:$extension:isn.>($extension:isn.issn13,$extension:isn.ean13)": member135,
    "operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn)": member136,
    "operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn13)": member137,
    "operator:$extension:isn.>($extension:isn.upc,$extension:isn.ean13)": member138,
    "operator:$extension:isn.>($extension:isn.upc,$extension:isn.upc)": member139,
    "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ean13)": member140,
    "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn)": member141,
    "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn13)": member142,
    "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn)": member143,
    "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn13)": member144,
    "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn)": member145,
    "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn13)": member146,
    "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.upc)": member147,
    "operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.ean13)": member148,
    "operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn)": member149,
    "operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn13)": member150,
    "operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.ean13)": member151,
    "operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn)": member152,
    "operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn13)": member153,
    "operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ean13)": member154,
    "operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn)": member155,
    "operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn13)": member156,
    "operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ean13)": member157,
    "operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn)": member158,
    "operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn13)": member159,
    "operator:$extension:isn.>=($extension:isn.issn,$extension:isn.ean13)": member160,
    "operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn)": member161,
    "operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn13)": member162,
    "operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.ean13)": member163,
    "operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn)": member164,
    "operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn13)": member165,
    "operator:$extension:isn.>=($extension:isn.upc,$extension:isn.ean13)": member166,
    "operator:$extension:isn.>=($extension:isn.upc,$extension:isn.upc)": member167,
    "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ean13)": member168,
    "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn)": member169,
    "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn13)": member170,
    "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn)": member171,
    "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn13)": member172,
    "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn)": member173,
    "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn13)": member174,
    "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.upc)": member175,
    "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.ean13)": member176,
    "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn)": member177,
    "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn13)": member178,
    "routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.ean13)": member179,
    "routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn)": member180,
    "routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn13)": member181,
    "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ean13)": member182,
    "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn)": member183,
    "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn13)": member184,
    "routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ean13)": member185,
    "routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn)": member186,
    "routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn13)": member187,
    "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.ean13)": member188,
    "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn)": member189,
    "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn13)": member190,
    "routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.ean13)": member191,
    "routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn)": member192,
    "routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn13)": member193,
    "routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.ean13)": member194,
    "routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.upc)": member195,
    "routine:$extension:isn.hashean13($extension:isn.ean13)": member196,
    "routine:$extension:isn.hashisbn($extension:isn.isbn)": member197,
    "routine:$extension:isn.hashisbn13($extension:isn.isbn13)": member198,
    "routine:$extension:isn.hashismn($extension:isn.ismn)": member199,
    "routine:$extension:isn.hashismn13($extension:isn.ismn13)": member200,
    "routine:$extension:isn.hashissn($extension:isn.issn)": member201,
    "routine:$extension:isn.hashissn13($extension:isn.issn13)": member202,
    "routine:$extension:isn.hashupc($extension:isn.upc)": member203,
    "routine:$extension:isn.is_valid($extension:isn.ean13)": member204,
    "routine:$extension:isn.is_valid($extension:isn.isbn)": member205,
    "routine:$extension:isn.is_valid($extension:isn.isbn13)": member206,
    "routine:$extension:isn.is_valid($extension:isn.ismn)": member207,
    "routine:$extension:isn.is_valid($extension:isn.ismn13)": member208,
    "routine:$extension:isn.is_valid($extension:isn.issn)": member209,
    "routine:$extension:isn.is_valid($extension:isn.issn13)": member210,
    "routine:$extension:isn.is_valid($extension:isn.upc)": member211,
    "routine:$extension:isn.isbn($extension:isn.ean13)": member212,
    "routine:$extension:isn.isbn13($extension:isn.ean13)": member213,
    "routine:$extension:isn.ismn($extension:isn.ean13)": member214,
    "routine:$extension:isn.ismn13($extension:isn.ean13)": member215,
    "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ean13)": member216,
    "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn)": member217,
    "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn13)": member218,
    "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn)": member219,
    "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn13)": member220,
    "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn)": member221,
    "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn13)": member222,
    "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.upc)": member223,
    "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.ean13)": member224,
    "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn)": member225,
    "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn13)": member226,
    "routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.ean13)": member227,
    "routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn)": member228,
    "routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn13)": member229,
    "routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ean13)": member230,
    "routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn)": member231,
    "routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn13)": member232,
    "routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ean13)": member233,
    "routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn)": member234,
    "routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn13)": member235,
    "routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.ean13)": member236,
    "routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn)": member237,
    "routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn13)": member238,
    "routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.ean13)": member239,
    "routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn)": member240,
    "routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn13)": member241,
    "routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.ean13)": member242,
    "routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.upc)": member243,
    "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ean13)": member244,
    "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn)": member245,
    "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn13)": member246,
    "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn)": member247,
    "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn13)": member248,
    "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn)": member249,
    "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn13)": member250,
    "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.upc)": member251,
    "routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.ean13)": member252,
    "routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn)": member253,
    "routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn13)": member254,
    "routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.ean13)": member255,
    "routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn)": member256,
    "routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn13)": member257,
    "routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ean13)": member258,
    "routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn)": member259,
    "routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn13)": member260,
    "routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ean13)": member261,
    "routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn)": member262,
    "routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn13)": member263,
    "routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.ean13)": member264,
    "routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn)": member265,
    "routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn13)": member266,
    "routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.ean13)": member267,
    "routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn)": member268,
    "routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn13)": member269,
    "routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.ean13)": member270,
    "routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.upc)": member271,
    "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ean13)": member272,
    "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn)": member273,
    "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn13)": member274,
    "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn)": member275,
    "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn13)": member276,
    "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn)": member277,
    "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn13)": member278,
    "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.upc)": member279,
    "routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.ean13)": member280,
    "routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn)": member281,
    "routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn13)": member282,
    "routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.ean13)": member283,
    "routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn)": member284,
    "routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn13)": member285,
    "routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ean13)": member286,
    "routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn)": member287,
    "routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn13)": member288,
    "routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ean13)": member289,
    "routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn)": member290,
    "routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn13)": member291,
    "routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.ean13)": member292,
    "routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn)": member293,
    "routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn13)": member294,
    "routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.ean13)": member295,
    "routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn)": member296,
    "routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn13)": member297,
    "routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.ean13)": member298,
    "routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.upc)": member299,
    "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ean13)": member300,
    "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn)": member301,
    "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn13)": member302,
    "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn)": member303,
    "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn13)": member304,
    "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn)": member305,
    "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn13)": member306,
    "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.upc)": member307,
    "routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.ean13)": member308,
    "routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn)": member309,
    "routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn13)": member310,
    "routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.ean13)": member311,
    "routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn)": member312,
    "routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn13)": member313,
    "routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ean13)": member314,
    "routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn)": member315,
    "routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn13)": member316,
    "routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ean13)": member317,
    "routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn)": member318,
    "routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn13)": member319,
    "routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.ean13)": member320,
    "routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn)": member321,
    "routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn13)": member322,
    "routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.ean13)": member323,
    "routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn)": member324,
    "routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn13)": member325,
    "routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.ean13)": member326,
    "routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.upc)": member327,
    "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ean13)": member328,
    "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn)": member329,
    "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn13)": member330,
    "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn)": member331,
    "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn13)": member332,
    "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn)": member333,
    "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn13)": member334,
    "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.upc)": member335,
    "routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.ean13)": member336,
    "routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn)": member337,
    "routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn13)": member338,
    "routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.ean13)": member339,
    "routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn)": member340,
    "routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn13)": member341,
    "routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ean13)": member342,
    "routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn)": member343,
    "routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn13)": member344,
    "routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ean13)": member345,
    "routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn)": member346,
    "routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn13)": member347,
    "routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.ean13)": member348,
    "routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn)": member349,
    "routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn13)": member350,
    "routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.ean13)": member351,
    "routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn)": member352,
    "routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn13)": member353,
    "routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.ean13)": member354,
    "routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.upc)": member355,
    "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ean13)": member356,
    "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn)": member357,
    "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn13)": member358,
    "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn)": member359,
    "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn13)": member360,
    "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn)": member361,
    "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn13)": member362,
    "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.upc)": member363,
    "routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.ean13)": member364,
    "routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn)": member365,
    "routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn13)": member366,
    "routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.ean13)": member367,
    "routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn)": member368,
    "routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn13)": member369,
    "routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ean13)": member370,
    "routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn)": member371,
    "routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn13)": member372,
    "routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ean13)": member373,
    "routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn)": member374,
    "routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn13)": member375,
    "routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.ean13)": member376,
    "routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn)": member377,
    "routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn13)": member378,
    "routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.ean13)": member379,
    "routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn)": member380,
    "routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn13)": member381,
    "routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.ean13)": member382,
    "routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.upc)": member383,
    "routine:$extension:isn.issn($extension:isn.ean13)": member384,
    "routine:$extension:isn.issn13($extension:isn.ean13)": member385,
    "routine:$extension:isn.make_valid($extension:isn.ean13)": member386,
    "routine:$extension:isn.make_valid($extension:isn.isbn)": member387,
    "routine:$extension:isn.make_valid($extension:isn.isbn13)": member388,
    "routine:$extension:isn.make_valid($extension:isn.ismn)": member389,
    "routine:$extension:isn.make_valid($extension:isn.ismn13)": member390,
    "routine:$extension:isn.make_valid($extension:isn.issn)": member391,
    "routine:$extension:isn.make_valid($extension:isn.issn13)": member392,
    "routine:$extension:isn.make_valid($extension:isn.upc)": member393,
    "routine:$extension:isn.upc($extension:isn.ean13)": member394,
  });
  const casts = Object.freeze({
    "cast:$extension:isn.ean13->$extension:isn.isbn": cast(
      descriptor.schema,
      "cast:$extension:isn.ean13->$extension:isn.isbn",
      ean13,
      isbn,
    ),
    "cast:$extension:isn.ean13->$extension:isn.isbn13": cast(
      descriptor.schema,
      "cast:$extension:isn.ean13->$extension:isn.isbn13",
      ean13,
      isbn13,
    ),
    "cast:$extension:isn.ean13->$extension:isn.ismn": cast(
      descriptor.schema,
      "cast:$extension:isn.ean13->$extension:isn.ismn",
      ean13,
      ismn,
    ),
    "cast:$extension:isn.ean13->$extension:isn.ismn13": cast(
      descriptor.schema,
      "cast:$extension:isn.ean13->$extension:isn.ismn13",
      ean13,
      ismn13,
    ),
    "cast:$extension:isn.ean13->$extension:isn.issn": cast(
      descriptor.schema,
      "cast:$extension:isn.ean13->$extension:isn.issn",
      ean13,
      issn,
    ),
    "cast:$extension:isn.ean13->$extension:isn.issn13": cast(
      descriptor.schema,
      "cast:$extension:isn.ean13->$extension:isn.issn13",
      ean13,
      issn13,
    ),
    "cast:$extension:isn.ean13->$extension:isn.upc": cast(
      descriptor.schema,
      "cast:$extension:isn.ean13->$extension:isn.upc",
      ean13,
      upc,
    ),
    "cast:$extension:isn.isbn->$extension:isn.ean13": cast(
      descriptor.schema,
      "cast:$extension:isn.isbn->$extension:isn.ean13",
      isbn,
      ean13,
    ),
    "cast:$extension:isn.isbn->$extension:isn.isbn13": cast(
      descriptor.schema,
      "cast:$extension:isn.isbn->$extension:isn.isbn13",
      isbn,
      isbn13,
    ),
    "cast:$extension:isn.isbn13->$extension:isn.ean13": cast(
      descriptor.schema,
      "cast:$extension:isn.isbn13->$extension:isn.ean13",
      isbn13,
      ean13,
    ),
    "cast:$extension:isn.isbn13->$extension:isn.isbn": cast(
      descriptor.schema,
      "cast:$extension:isn.isbn13->$extension:isn.isbn",
      isbn13,
      isbn,
    ),
    "cast:$extension:isn.ismn->$extension:isn.ean13": cast(
      descriptor.schema,
      "cast:$extension:isn.ismn->$extension:isn.ean13",
      ismn,
      ean13,
    ),
    "cast:$extension:isn.ismn->$extension:isn.ismn13": cast(
      descriptor.schema,
      "cast:$extension:isn.ismn->$extension:isn.ismn13",
      ismn,
      ismn13,
    ),
    "cast:$extension:isn.ismn13->$extension:isn.ean13": cast(
      descriptor.schema,
      "cast:$extension:isn.ismn13->$extension:isn.ean13",
      ismn13,
      ean13,
    ),
    "cast:$extension:isn.ismn13->$extension:isn.ismn": cast(
      descriptor.schema,
      "cast:$extension:isn.ismn13->$extension:isn.ismn",
      ismn13,
      ismn,
    ),
    "cast:$extension:isn.issn->$extension:isn.ean13": cast(
      descriptor.schema,
      "cast:$extension:isn.issn->$extension:isn.ean13",
      issn,
      ean13,
    ),
    "cast:$extension:isn.issn->$extension:isn.issn13": cast(
      descriptor.schema,
      "cast:$extension:isn.issn->$extension:isn.issn13",
      issn,
      issn13,
    ),
    "cast:$extension:isn.issn13->$extension:isn.ean13": cast(
      descriptor.schema,
      "cast:$extension:isn.issn13->$extension:isn.ean13",
      issn13,
      ean13,
    ),
    "cast:$extension:isn.issn13->$extension:isn.issn": cast(
      descriptor.schema,
      "cast:$extension:isn.issn13->$extension:isn.issn",
      issn13,
      issn,
    ),
    "cast:$extension:isn.upc->$extension:isn.ean13": cast(
      descriptor.schema,
      "cast:$extension:isn.upc->$extension:isn.ean13",
      upc,
      ean13,
    ),
  });
  return bindExtension(descriptor, {
    sql: Object.freeze({ functions, operators, overloads, casts }),
    ean13: Object.freeze({
      value: (text: string) => isnValue("ean13", text),
      codec: ean13Codec,
      arrayCodec: ean13Array,
      isValid: functions.is_valid.ean13,
      makeValid: functions.make_valid.ean13,
      equal: operators["="].ean13_ean13,
      notEqual: operators["<>"].ean13_ean13,
      lessThan: operators["<"].ean13_ean13,
      lessOrEqual: operators["<="].ean13_ean13,
      greaterThan: operators[">"].ean13_ean13,
      greaterOrEqual: operators[">="].ean13_ean13,
      field: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn.ean13",
          type: "ean13",
          codec: ean13Codec,
          value: isnWireValue("ean13"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn._ean13",
          type: "ean13",
          array: true,
          codec: ean13Array,
          value: isnArrayWireValue("ean13"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      indexes: Object.freeze({
        btree: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.ean13_ops/btree",
            method: "btree",
            opclass: "ean13_ops",
            type: "ean13",
            default: true,
          }),
        hash: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.ean13_ops/hash",
            method: "hash",
            opclass: "ean13_ops",
            type: "ean13",
            default: true,
          }),
      }),
    }),
    isbn: Object.freeze({
      value: (text: string) => isnValue("isbn", text),
      codec: isbnCodec,
      arrayCodec: isbnArray,
      isValid: functions.is_valid.isbn,
      makeValid: functions.make_valid.isbn,
      equal: operators["="].isbn_isbn,
      notEqual: operators["<>"].isbn_isbn,
      lessThan: operators["<"].isbn_isbn,
      lessOrEqual: operators["<="].isbn_isbn,
      greaterThan: operators[">"].isbn_isbn,
      greaterOrEqual: operators[">="].isbn_isbn,
      field: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn.isbn",
          type: "isbn",
          codec: isbnCodec,
          value: isnWireValue("isbn"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn._isbn",
          type: "isbn",
          array: true,
          codec: isbnArray,
          value: isnArrayWireValue("isbn"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      indexes: Object.freeze({
        btree: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.isbn_ops/btree",
            method: "btree",
            opclass: "isbn_ops",
            type: "isbn",
            default: true,
          }),
        hash: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.isbn_ops/hash",
            method: "hash",
            opclass: "isbn_ops",
            type: "isbn",
            default: true,
          }),
      }),
    }),
    isbn13: Object.freeze({
      value: (text: string) => isnValue("isbn13", text),
      codec: isbn13Codec,
      arrayCodec: isbn13Array,
      isValid: functions.is_valid.isbn13,
      makeValid: functions.make_valid.isbn13,
      equal: operators["="].isbn13_isbn13,
      notEqual: operators["<>"].isbn13_isbn13,
      lessThan: operators["<"].isbn13_isbn13,
      lessOrEqual: operators["<="].isbn13_isbn13,
      greaterThan: operators[">"].isbn13_isbn13,
      greaterOrEqual: operators[">="].isbn13_isbn13,
      field: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn.isbn13",
          type: "isbn13",
          codec: isbn13Codec,
          value: isnWireValue("isbn13"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn._isbn13",
          type: "isbn13",
          array: true,
          codec: isbn13Array,
          value: isnArrayWireValue("isbn13"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      indexes: Object.freeze({
        btree: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.isbn13_ops/btree",
            method: "btree",
            opclass: "isbn13_ops",
            type: "isbn13",
            default: true,
          }),
        hash: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.isbn13_ops/hash",
            method: "hash",
            opclass: "isbn13_ops",
            type: "isbn13",
            default: true,
          }),
      }),
    }),
    ismn: Object.freeze({
      value: (text: string) => isnValue("ismn", text),
      codec: ismnCodec,
      arrayCodec: ismnArray,
      isValid: functions.is_valid.ismn,
      makeValid: functions.make_valid.ismn,
      equal: operators["="].ismn_ismn,
      notEqual: operators["<>"].ismn_ismn,
      lessThan: operators["<"].ismn_ismn,
      lessOrEqual: operators["<="].ismn_ismn,
      greaterThan: operators[">"].ismn_ismn,
      greaterOrEqual: operators[">="].ismn_ismn,
      field: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn.ismn",
          type: "ismn",
          codec: ismnCodec,
          value: isnWireValue("ismn"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn._ismn",
          type: "ismn",
          array: true,
          codec: ismnArray,
          value: isnArrayWireValue("ismn"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      indexes: Object.freeze({
        btree: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.ismn_ops/btree",
            method: "btree",
            opclass: "ismn_ops",
            type: "ismn",
            default: true,
          }),
        hash: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.ismn_ops/hash",
            method: "hash",
            opclass: "ismn_ops",
            type: "ismn",
            default: true,
          }),
      }),
    }),
    ismn13: Object.freeze({
      value: (text: string) => isnValue("ismn13", text),
      codec: ismn13Codec,
      arrayCodec: ismn13Array,
      isValid: functions.is_valid.ismn13,
      makeValid: functions.make_valid.ismn13,
      equal: operators["="].ismn13_ismn13,
      notEqual: operators["<>"].ismn13_ismn13,
      lessThan: operators["<"].ismn13_ismn13,
      lessOrEqual: operators["<="].ismn13_ismn13,
      greaterThan: operators[">"].ismn13_ismn13,
      greaterOrEqual: operators[">="].ismn13_ismn13,
      field: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn.ismn13",
          type: "ismn13",
          codec: ismn13Codec,
          value: isnWireValue("ismn13"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn._ismn13",
          type: "ismn13",
          array: true,
          codec: ismn13Array,
          value: isnArrayWireValue("ismn13"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      indexes: Object.freeze({
        btree: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.ismn13_ops/btree",
            method: "btree",
            opclass: "ismn13_ops",
            type: "ismn13",
            default: true,
          }),
        hash: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.ismn13_ops/hash",
            method: "hash",
            opclass: "ismn13_ops",
            type: "ismn13",
            default: true,
          }),
      }),
    }),
    issn: Object.freeze({
      value: (text: string) => isnValue("issn", text),
      codec: issnCodec,
      arrayCodec: issnArray,
      isValid: functions.is_valid.issn,
      makeValid: functions.make_valid.issn,
      equal: operators["="].issn_issn,
      notEqual: operators["<>"].issn_issn,
      lessThan: operators["<"].issn_issn,
      lessOrEqual: operators["<="].issn_issn,
      greaterThan: operators[">"].issn_issn,
      greaterOrEqual: operators[">="].issn_issn,
      field: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn.issn",
          type: "issn",
          codec: issnCodec,
          value: isnWireValue("issn"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn._issn",
          type: "issn",
          array: true,
          codec: issnArray,
          value: isnArrayWireValue("issn"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      indexes: Object.freeze({
        btree: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.issn_ops/btree",
            method: "btree",
            opclass: "issn_ops",
            type: "issn",
            default: true,
          }),
        hash: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.issn_ops/hash",
            method: "hash",
            opclass: "issn_ops",
            type: "issn",
            default: true,
          }),
      }),
    }),
    issn13: Object.freeze({
      value: (text: string) => isnValue("issn13", text),
      codec: issn13Codec,
      arrayCodec: issn13Array,
      isValid: functions.is_valid.issn13,
      makeValid: functions.make_valid.issn13,
      equal: operators["="].issn13_issn13,
      notEqual: operators["<>"].issn13_issn13,
      lessThan: operators["<"].issn13_issn13,
      lessOrEqual: operators["<="].issn13_issn13,
      greaterThan: operators[">"].issn13_issn13,
      greaterOrEqual: operators[">="].issn13_issn13,
      field: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn.issn13",
          type: "issn13",
          codec: issn13Codec,
          value: isnWireValue("issn13"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn._issn13",
          type: "issn13",
          array: true,
          codec: issn13Array,
          value: isnArrayWireValue("issn13"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      indexes: Object.freeze({
        btree: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.issn13_ops/btree",
            method: "btree",
            opclass: "issn13_ops",
            type: "issn13",
            default: true,
          }),
        hash: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.issn13_ops/hash",
            method: "hash",
            opclass: "issn13_ops",
            type: "issn13",
            default: true,
          }),
      }),
    }),
    upc: Object.freeze({
      value: (text: string) => isnValue("upc", text),
      codec: upcCodec,
      arrayCodec: upcArray,
      isValid: functions.is_valid.upc,
      makeValid: functions.make_valid.upc,
      equal: operators["="].upc_upc,
      notEqual: operators["<>"].upc_upc,
      lessThan: operators["<"].upc_upc,
      lessOrEqual: operators["<="].upc_upc,
      greaterThan: operators[">"].upc_upc,
      greaterOrEqual: operators[">="].upc_upc,
      field: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn.upc",
          type: "upc",
          codec: upcCodec,
          value: isnWireValue("upc"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:isn._upc",
          type: "upc",
          array: true,
          codec: upcArray,
          value: isnArrayWireValue("upc"),
          search: { filter: false, comparison: false, order: false, text: false } as const,
        }),
      indexes: Object.freeze({
        btree: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.upc_ops/btree",
            method: "btree",
            opclass: "upc_ops",
            type: "upc",
            default: true,
          }),
        hash: () =>
          createExtensionIndex({
            extension: descriptor,
            member: "opclass:$extension:isn.upc_ops/hash",
            method: "hash",
            opclass: "upc_ops",
            type: "upc",
            default: true,
          }),
      }),
    }),
  });
}
