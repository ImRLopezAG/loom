import { sql, type SQL } from "drizzle-orm";
import type { CodecOutput, ExtensionCodec } from "./codecs";
import { checkedExtensionExpression, extensionSqlType } from "./sql";
type AnyCodec = ExtensionCodec<never, unknown>;
interface ExtensionRows<Fields extends Readonly<Record<string, AnyCodec>>> {
  readonly from: SQL;
  readonly columns: { readonly [Key in keyof Fields]: SQL<CodecOutput<Fields[Key]>> };
}
/** Anonymous-record FROM shape is declared by named SQL types and checked codecs. */
export function extensionRows<const Fields extends Readonly<Record<string, AnyCodec>>>(
  expression: SQL,
  alias: string,
  fields: Fields,
): ExtensionRows<Fields> {
  const entries = Object.entries(fields);
  if (!alias || !entries.length) throw new Error("Anonymous record requires an alias and named columns");
  const declarations = entries.map(([name, codec]) => {
    if (!codec.sqlType) throw new Error("Anonymous record column requires its captured SQL type");
    return sql`${sql.identifier(name)} ${extensionSqlType(codec.sqlType.schema, codec.sqlType.name)}${codec.sqlType.array ? sql`[]` : sql.empty()}`;
  });
  const columns = Object.fromEntries(
    entries.map(([name, codec]) => [
      name,
      checkedExtensionExpression(sql`${sql.identifier(alias)}.${sql.identifier(name)}`, codec, []),
    ]),
  );
  return {
    from: sql`${expression} as ${sql.identifier(alias)}(${sql.join(declarations, sql`, `)})`,
    // SAFETY: each exact field key is paired with the codec that determines its SQL output.
    columns: columns as { readonly [Key in keyof Fields]: SQL<CodecOutput<Fields[Key]>> },
  };
}
