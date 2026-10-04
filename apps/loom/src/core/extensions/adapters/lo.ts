import { getColumnTable } from "drizzle-orm";
import { getTableConfig, type AnyPgColumn, type PgTable } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { arrayCodec, nullableCodec, withCodecSqlType } from "../codecs";
import { createExtensionField } from "../fields";
import type { ExtensionValueSchema } from "../values";
import { createSqlFunction } from "../sql";
import { triggerArgument } from "../triggers";
import { loOidCodec } from "./lo-codecs";

const digest = "84324b728d596a8bdef3088c411f769edab611e4a4a776070372f5e890d96ba1";
export type LoEvent = "update" | "delete";
export interface LoTriggerOptions<Table extends PgTable> {
  readonly name: string;
  readonly table: Table;
  readonly column: AnyPgColumn<{ data: number }>;
  readonly events?: readonly [LoEvent, ...LoEvent[]];
}
function quote(value: string): string {
  if (!value || value.includes("\0") || new TextEncoder().encode(value).length > 63)
    throw new Error("Invalid PostgreSQL identifier");
  return `"${value.replaceAll('"', '""')}"`;
}
/** Each trigger-managed value must have one database reference; DROP/TRUNCATE do not unlink objects. */
export function createLo_1_2<const Descriptor extends ExtensionDescriptor<"lo", { version: "1.2"; schema: string }>>(
  descriptor: Descriptor,
) {
  if (
    descriptor.name !== "lo" ||
    descriptor.version !== "1.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("lo 1.2 requires its exact verified contract");
  const type = { schema: descriptor.schema, name: "lo" } as const;
  quote(type.schema);
  const codec = withCodecSqlType(loOidCodec, type);
  const arrays = arrayCodec(codec);
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  const value = { kind: "number", integer: true, minimum: 0, maximum: 4294967295 } as const;
  const field = () =>
    createExtensionField({ extension: descriptor, member: "type:$extension:lo.lo", type: "lo", codec, value, search });
  let nested: ExtensionValueSchema = { kind: "union", variants: [value, { kind: "null" }] };
  const depths: ExtensionValueSchema[] = [];
  for (let rank = 0; rank < 6; rank++) {
    nested = { kind: "array", items: nested };
    depths.push(nested);
  }
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:lo._lo",
      type: "lo",
      array: true,
      codec: arrays,
      search,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: { kind: "union", variants: depths },
        },
      },
    });
  const oid = createSqlFunction({
    schema: descriptor.schema,
    name: "lo_oid",
    member: "routine:$extension:lo.lo_oid($extension:lo.lo)",
    arguments: [nullableCodec(codec)] as const,
    result: nullableCodec(loOidCodec),
    dependencies: [],
    observability: "tables",
    authority: "query",
  });
  function trigger<Table extends PgTable>(options: LoTriggerOptions<Table>) {
    if (getColumnTable(options.column) !== options.table)
      throw new Error("lo_manage column must belong to the trigger table");
    if (![`${quote(descriptor.schema)}.${quote("lo")}`, "oid"].includes(options.column.getSQLType()))
      throw new Error("lo_manage requires an oid or selected lo domain column");
    const selected = options.events ?? ["update", "delete"];
    if (!selected.length || selected.some((event) => event !== "update" && event !== "delete"))
      throw new Error("lo_manage requires UPDATE and/or DELETE");
    const events = Object.freeze((["update", "delete"] as const).filter((event) => selected.includes(event)));
    const config = getTableConfig(options.table),
      schema = config.schema ?? "public";
    const table = `${quote(schema)}.${quote(config.name)}`,
      name = quote(options.name);
    return Object.freeze({
      kind: "trigger",
      extension: Object.freeze({ name: "lo", version: "1.2", digest }),
      member: "routine:$extension:lo.lo_manage()",
      name: options.name,
      timing: "before",
      level: "row",
      events,
      table: Object.freeze({ schema, name: config.name }),
      function: Object.freeze({ schema: descriptor.schema, name: "lo_manage" }),
      arguments: Object.freeze([options.column.name]),
      create: `CREATE TRIGGER ${name} BEFORE ${events.map((event) => event.toUpperCase()).join(" OR ")} ON ${table} FOR EACH ROW EXECUTE FUNCTION ${quote(descriptor.schema)}."lo_manage"(${triggerArgument(options.column.name)})`,
      drop: `DROP TRIGGER ${name} ON ${table}`,
    } as const);
  }
  return bindExtension(descriptor, {
    field,
    arrayField,
    codec,
    arrayCodec: arrays,
    oid,
    trigger,
    sql: Object.freeze({ functions: Object.freeze({ lo_oid: oid }), operators: Object.freeze({}) }),
  });
}
