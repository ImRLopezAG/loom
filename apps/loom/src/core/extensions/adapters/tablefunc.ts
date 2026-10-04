import * as v from "valibot";
import { sql, type SQL } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  compositeCodec,
  floatCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type ExtensionCodec,
  type NonfiniteNumber,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { nestedQueryText, type NestedQuery } from "../nested-query";
import { extensionRows, type ExtensionRows } from "../rows";
import { createSqlFunction, extensionExpressionContract, type ExtensionSqlInput } from "../sql";

export type { NonfiniteNumber };
// Crosstab value columns are NULL for absent categories, so consumers need the nullable wrapper.
export { floatCodec, int4Codec, nullableCodec, textCodec };

const digest = "08f54e73281a2592eddf0ac6f555ba1a0b3c0961fb7ab6eab05be90ab74b66d4";
const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0"), "Invalid PostgreSQL identifier"),
);
type AnyCodec = ExtensionCodec<never, unknown>;
type Fields = Readonly<Record<string, AnyCodec>>;
type NullableText = ReturnType<typeof nullableCodec<string, string>>;
type NullableInt4 = ReturnType<typeof nullableCodec<number, number>>;
type NullableFloat = ReturnType<typeof nullableCodec<number | NonfiniteNumber, number | NonfiniteNumber>>;
export type TablefuncRelationName = { readonly schema: string; readonly name: string };

const member = {
  crosstab1: "routine:$extension:tablefunc.crosstab(pg_catalog.text)",
  crosstabCount: "routine:$extension:tablefunc.crosstab(pg_catalog.text,pg_catalog.int4)",
  crosstabHash: "routine:$extension:tablefunc.crosstab(pg_catalog.text,pg_catalog.text)",
  crosstab2: "routine:$extension:tablefunc.crosstab2(pg_catalog.text)",
  crosstab3: "routine:$extension:tablefunc.crosstab3(pg_catalog.text)",
  crosstab4: "routine:$extension:tablefunc.crosstab4(pg_catalog.text)",
  connectby5:
    "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
  connectby6:
    "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
  connectbySerial6:
    "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
  connectbySerial7:
    "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
  normalRand: "routine:$extension:tablefunc.normal_rand(pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
} as const;

function quoteIdent(value: string): string {
  return `"${v.parse(identifier, value).replaceAll('"', '""')}"`;
}
/** Managed query text is cast so unknown-typed parameters cannot pick a different crosstab overload. */
function managedText(query: NestedQuery<object>): SQL<string> {
  return sql<string>`${nestedQueryText(query)}::pg_catalog.text`;
}
function managedDependencies(...queries: readonly NestedQuery<object>[]): string[] {
  return queries.flatMap((query) => [...(extensionExpressionContract(nestedQueryText(query))?.dependencies ?? [])]);
}

type CrosstabRow<Width extends 2 | 3 | 4> = { readonly row_name: NullableText } & {
  readonly [
    Index in Width extends 2 ? 1 | 2 : Width extends 3 ? 1 | 2 | 3 : 1 | 2 | 3 | 4 as `category_${Index}`
  ]: NullableText;
};
export type CrosstabInput<Row extends Fields> = {
  readonly source: NestedQuery<object>;
  readonly fields: Row;
  readonly alias: string;
} & (
  | { readonly categories?: never; readonly count?: never }
  | { readonly categories: NestedQuery<object>; readonly count?: never }
  | { readonly count: ExtensionSqlInput<NullableInt4>; readonly categories?: never }
);
export type CrosstabNInput = { readonly source: NestedQuery<object>; readonly alias: string };
type ConnectbySource =
  | { readonly relation: TablefuncRelationName; readonly source?: never }
  | { readonly source: NestedQuery<object>; readonly relation?: never };
export type ConnectbyInput<Key extends AnyCodec> = ConnectbySource & {
  readonly key: string;
  readonly parent: string;
  readonly orderBy?: string;
  readonly start: ExtensionSqlInput<NullableText>;
  readonly maxDepth: ExtensionSqlInput<NullableInt4>;
  readonly branchDelimiter?: ExtensionSqlInput<NullableText>;
  /** Must carry the source key's exact SQL type; PostgreSQL rejects a mismatched return key type. */
  readonly keyCodec: Key;
  readonly alias: string;
};
export type ConnectbyFields<Key extends AnyCodec, Input> = {
  readonly keyid: Key;
  readonly parent_keyid: ExtensionCodec<never, ReturnType<Key["decode"]> | null>;
  readonly level: typeof int4Codec;
} & (Input extends { readonly branchDelimiter: unknown } ? { readonly branch: typeof textCodec } : unknown) &
  (Input extends { readonly orderBy: string } ? { readonly pos: typeof int4Codec } : unknown);

type ConnectbyRuntimeFields = {
  keyid: AnyCodec;
  parent_keyid: AnyCodec;
  level: typeof int4Codec;
  branch?: typeof textCodec;
  pos?: typeof int4Codec;
};

/** Exact tablefunc 1.0 query helpers. SQL-text slots accept only managed nested queries or quoted identities. */
export function createTablefunc_1_0<
  const Descriptor extends ExtensionDescriptor<"tablefunc", { version: "1.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "tablefunc" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("tablefunc 1.0 requires its exact verified contract");
  const text = nullableCodec(textCodec);
  const int4 = nullableCodec(int4Codec);
  const float8 = nullableCodec(floatCodec);
  const query = { schema: descriptor.schema, authority: "query" } as const;
  const row = <const Width extends 2 | 3 | 4>(width: Width) => {
    const fields = Object.fromEntries([
      ["row_name", text],
      ...Array.from({ length: width }, (_, index) => [`category_${index + 1}`, text] as const),
    ]);
    const type = { schema: descriptor.schema, name: `tablefunc_crosstab_${width}` } as const;
    // SAFETY: the entries above are exactly row_name plus category_1..category_Width in captured attribute order.
    const composite = withCodecSqlType(compositeCodec(type.name, fields as CrosstabRow<Width>), type);
    return { composite, array: withCodecSqlType(arrayCodec(composite), { ...type, array: true }) } as const;
  };
  const rows2 = row(2);
  const rows3 = row(3);
  const rows4 = row(4);
  const codecs = Object.freeze({
    crosstab2: rows2.composite,
    crosstab3: rows3.composite,
    crosstab4: rows4.composite,
    crosstab2Array: rows2.array,
    crosstab3Array: rows3.array,
    crosstab4Array: rows4.array,
  });

  const normal_rand = createSqlFunction({
    ...query,
    // Each call draws fresh pseudo-random values that setseed() does not control.
    observability: "external",
    dependencies: [],
    name: "normal_rand",
    member: member.normalRand,
    arguments: [int4, float8, float8] as const,
    result: floatCodec,
  });
  function normalRand(
    count: ExtensionSqlInput<NullableInt4>,
    mean: ExtensionSqlInput<NullableFloat>,
    stddev: ExtensionSqlInput<NullableFloat>,
    alias: string,
  ): ExtensionRows<{ readonly value: typeof floatCodec }> {
    return extensionRows(normal_rand(count, mean, stddev), alias, { value: floatCodec }, "named");
  }

  function crosstab<const Row extends Fields>(input: CrosstabInput<Row>): ExtensionRows<Row> {
    const source = managedText(input.source);
    if (input.categories !== undefined) {
      const hash = createSqlFunction({
        ...query,
        observability: "tables",
        dependencies: managedDependencies(input.source, input.categories),
        name: "crosstab",
        member: member.crosstabHash,
        arguments: [textCodec, textCodec] as const,
        result: compositeCodec("record", input.fields),
      })(source, managedText(input.categories));
      return extensionRows(hash, input.alias, input.fields);
    }
    if (input.count !== undefined) {
      const count = createSqlFunction({
        ...query,
        observability: "tables",
        dependencies: managedDependencies(input.source),
        name: "crosstab",
        member: member.crosstabCount,
        arguments: [textCodec, int4] as const,
        result: compositeCodec("record", input.fields),
      })(source, input.count);
      return extensionRows(count, input.alias, input.fields);
    }
    const call = createSqlFunction({
      ...query,
      observability: "tables",
      dependencies: managedDependencies(input.source),
      name: "crosstab",
      member: member.crosstab1,
      arguments: [textCodec] as const,
      result: compositeCodec("record", input.fields),
    })(source);
    return extensionRows(call, input.alias, input.fields);
  }
  function fixedCrosstab<const Width extends 2 | 3 | 4>(
    width: Width,
    composite: ExtensionCodec<never, unknown>,
    fields: CrosstabRow<Width>,
  ) {
    const name = `crosstab${width}` as const;
    return (input: CrosstabNInput): ExtensionRows<CrosstabRow<Width>> => {
      const call = createSqlFunction({
        ...query,
        observability: "tables",
        dependencies: managedDependencies(input.source),
        name,
        member: member[name],
        arguments: [textCodec] as const,
        result: composite,
      })(managedText(input.source));
      return extensionRows(call, input.alias, fields, "named");
    };
  }
  const rowFields = <const Width extends 2 | 3 | 4>(width: Width) =>
    // SAFETY: these are the captured composite attribute names, each decoded as nullable text.
    Object.fromEntries([
      ["row_name", text],
      ...Array.from({ length: width }, (_, index) => [`category_${index + 1}`, text] as const),
    ]) as CrosstabRow<Width>;
  const crosstab2 = fixedCrosstab(2, rows2.composite, rowFields(2));
  const crosstab3 = fixedCrosstab(3, rows3.composite, rowFields(3));
  const crosstab4 = fixedCrosstab(4, rows4.composite, rowFields(4));

  function connectby<const Key extends AnyCodec, const Input extends ConnectbyInput<Key>>(
    input: Input & ConnectbyInput<Key>,
  ): ExtensionRows<ConnectbyFields<Key, Input>> {
    let relation: SQL<string> | string;
    let dependencies: string[];
    if (input.source) {
      relation = sql<string>`'(' || ${managedText(input.source)} || ') AS tablefunc_source'`;
      dependencies = managedDependencies(input.source);
    } else {
      relation = `${quoteIdent(input.relation.schema)}.${quoteIdent(input.relation.name)}`;
      dependencies = [`${input.relation.schema}.${input.relation.name}`];
    }
    if (!input.keyCodec.sqlType) throw new Error("connectby keyCodec requires the source key's SQL type");
    const key = quoteIdent(input.key);
    const parent = quoteIdent(input.parent);
    const branch = input.branchDelimiter !== undefined;
    // Captured OUT order: keyid, parent_keyid, level, then branch and pos only for their overloads.
    const fields: ConnectbyRuntimeFields = {
      keyid: input.keyCodec,
      parent_keyid: nullableCodec(input.keyCodec),
      level: int4Codec,
    };
    if (branch) fields.branch = textCodec;
    if (input.orderBy !== undefined) fields.pos = int4Codec;
    const base = { ...query, observability: "tables", dependencies, name: "connectby" } as const;
    let call: SQL;
    if (input.orderBy !== undefined) {
      const order = quoteIdent(input.orderBy);
      call = branch
        ? createSqlFunction({
            ...base,
            member: member.connectbySerial7,
            arguments: [text, text, text, text, text, int4, text] as const,
            result: compositeCodec("record", fields),
          })(relation, key, parent, order, input.start, input.maxDepth, input.branchDelimiter!)
        : createSqlFunction({
            ...base,
            member: member.connectbySerial6,
            arguments: [text, text, text, text, text, int4] as const,
            result: compositeCodec("record", fields),
          })(relation, key, parent, order, input.start, input.maxDepth);
    } else
      call = branch
        ? createSqlFunction({
            ...base,
            member: member.connectby6,
            arguments: [text, text, text, text, int4, text] as const,
            result: compositeCodec("record", fields),
          })(relation, key, parent, input.start, input.maxDepth, input.branchDelimiter!)
        : createSqlFunction({
            ...base,
            member: member.connectby5,
            arguments: [text, text, text, text, int4] as const,
            result: compositeCodec("record", fields),
          })(relation, key, parent, input.start, input.maxDepth);
    // SAFETY: fields were assembled in captured OUT order from the same optional inputs ConnectbyFields inspects.
    return extensionRows(call, input.alias, fields as ConnectbyFields<Key, Input>);
  }

  const functions = Object.freeze({ connectby, crosstab, crosstab2, crosstab3, crosstab4, normal_rand: normalRand });
  return bindExtension(descriptor, {
    connectby,
    crosstab,
    crosstab2,
    crosstab3,
    crosstab4,
    normalRand,
    codecs,
    sql: Object.freeze({
      functions,
      operators: Object.freeze({}),
      overloads: Object.freeze({
        [member.crosstab1]: (input: Omit<CrosstabInput<Fields>, "categories" | "count">) =>
          crosstab({ source: input.source, fields: input.fields, alias: input.alias }),
        [member.crosstabCount]: (input: CrosstabInput<Fields> & { readonly count: ExtensionSqlInput<NullableInt4> }) =>
          crosstab({ source: input.source, fields: input.fields, alias: input.alias, count: input.count }),
        [member.crosstabHash]: (input: CrosstabInput<Fields> & { readonly categories: NestedQuery<object> }) =>
          crosstab({ source: input.source, fields: input.fields, alias: input.alias, categories: input.categories }),
        [member.crosstab2]: crosstab2,
        [member.crosstab3]: crosstab3,
        [member.crosstab4]: crosstab4,
        [member.connectby5]: <const Key extends AnyCodec>(
          input: ConnectbyInput<Key> & { readonly orderBy?: never; readonly branchDelimiter?: never },
        ) => connectby(input),
        [member.connectby6]: <const Key extends AnyCodec>(
          input: ConnectbyInput<Key> & {
            readonly orderBy?: never;
            readonly branchDelimiter: ExtensionSqlInput<NullableText>;
          },
        ) => connectby(input),
        [member.connectbySerial6]: <const Key extends AnyCodec>(
          input: ConnectbyInput<Key> & { readonly orderBy: string; readonly branchDelimiter?: never },
        ) => connectby(input),
        [member.connectbySerial7]: <const Key extends AnyCodec>(
          input: ConnectbyInput<Key> & {
            readonly orderBy: string;
            readonly branchDelimiter: ExtensionSqlInput<NullableText>;
          },
        ) => connectby(input),
        [member.normalRand]: normalRand,
      }),
      types: Object.freeze({
        'composite type:"$extension:tablefunc".tablefunc_crosstab_2': rows2.composite,
        'composite type:"$extension:tablefunc".tablefunc_crosstab_3': rows3.composite,
        'composite type:"$extension:tablefunc".tablefunc_crosstab_4': rows4.composite,
        "type:$extension:tablefunc.tablefunc_crosstab_2": rows2.composite,
        "type:$extension:tablefunc.tablefunc_crosstab_3": rows3.composite,
        "type:$extension:tablefunc.tablefunc_crosstab_4": rows4.composite,
        "type:$extension:tablefunc._tablefunc_crosstab_2": rows2.array,
        "type:$extension:tablefunc._tablefunc_crosstab_3": rows3.array,
        "type:$extension:tablefunc._tablefunc_crosstab_4": rows4.array,
      }),
    }),
  });
}
