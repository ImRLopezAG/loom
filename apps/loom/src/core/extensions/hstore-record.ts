import { getTableColumns, is, sql, SQL, type AnyColumn, type InferSelectModel, type SQLWrapper } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { isLoomSchema, type SchemaDefinition } from "../schema/define-schema";
import type { StorageKind } from "../schema/fields";
import { bindExtension, type ExtensionDescriptor } from "./bindings";
import { booleanCodec, createExtensionCodec, decodeFailure, nullableCodec, type ExtensionCodec } from "./codecs";
import { createHstoreCodec, hstoreTextSchema, type HstoreValue } from "./hstore-codec";
import { captureTableQueryInvocation } from "./nested-query-private";
import {
  checkedExtensionExpression,
  createSqlFunction,
  createSqlOperator,
  extensionSqlType,
  type ExtensionSqlInput,
} from "./sql";

declare const recordType: unique symbol;
/** Data and SQL live in a private sidecar; this value is not a raw SQL wrapper. */
export interface NamedHstoreRecord<Table extends PgTable = PgTable> {
  readonly kind: "named";
  readonly [recordType]: Table;
}
export interface AnonymousHstoreRecord {
  readonly kind: "anonymous";
  readonly [recordType]: "anonymous";
}
type RecordWitness = NamedHstoreRecord | AnonymousHstoreRecord;
type AnyCodec = ExtensionCodec<never, unknown>;
type AnonymousNativeType = "text" | "bool" | "int2" | "int4" | "int8" | "numeric" | "uuid" | "json" | "jsonb";
// Erased codec metadata is checked at runtime; literal unsupported SQL identities also fail statically.
type ReviewedAnonymousCodec<Codec extends AnyCodec> = Codec extends {
  readonly sqlType: { readonly schema: infer Namespace; readonly name: infer Name };
}
  ? "pg_catalog" extends Namespace
    ? Name extends AnonymousNativeType
      ? Codec
      : string extends Name
        ? Codec
        : never
    : never
  : Codec;
type Columns<Table extends PgTable> = {
  readonly [Key in keyof InferSelectModel<Table>]: SQL<InferSelectModel<Table>[Key] | null>;
};
export interface PopulatedHstoreRecord<Table extends PgTable> {
  readonly isNull: SQL<boolean>;
  readonly fields: Columns<Table>;
  readonly attributes: { readonly [Key in keyof InferSelectModel<Table>]: string };
  readonly record: NamedHstoreRecord<Table>;
}
interface Attribute {
  readonly key: string;
  readonly name: string;
  readonly column: AnyColumn;
  readonly enumValues?: readonly string[] | undefined;
}
type NativeColumnValue = Parameters<AnyColumn["mapFromDriverValue"]>[0];
interface Evidence {
  readonly expression: SQL;
  readonly attributes: readonly Attribute[];
  readonly dependencies: readonly string[];
  readonly observability: "tables" | "session";
  readonly check?: () => void;
}
const records = new WeakMap<RecordWitness, Evidence>();
const digest = "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1";
const memberFromRecord = "routine:$extension:hstore.hstore(pg_catalog.record)";
const memberPopulateRecord =
  "routine:$extension:hstore.populate_record(pg_catalog.anyelement,$extension:hstore.hstore)";
const memberReplaceRecord = "operator:$extension:hstore.#=(pg_catalog.anyelement,$extension:hstore.hstore)";
const safeKinds: ReadonlySet<StorageKind> = new Set([
  "text",
  "boolean",
  "integer",
  "bigint",
  "numeric",
  "uuid",
  "json",
  "enum",
  "reference",
]);
const safeAnonymousTypes = new Set(["text", "bool", "int2", "int4", "int8", "numeric", "uuid", "json", "jsonb"]);
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));
const internalRecordCodec = createExtensionCodec({
  id: "hstore:record-witness:1",
  input: v.never(),
  output: v.never(),
  transport: "native",
  encode: () => {
    throw new Error("Record witnesses cannot be bound as values");
  },
  decode: () => {
    throw new Error("Record witnesses require checked attribute projections");
  },
});
function evidence(witness: RecordWitness): Evidence {
  const proof = records.get(witness);
  if (!proof) throw new Error("Hstore record has no managed provenance");
  proof.check?.();
  return proof;
}
function sealNamed<Table extends PgTable>(proof: Evidence): NamedHstoreRecord<Table> {
  // SAFETY: the validated real table supplies Table; its SQL and column identities stay private.
  const witness = Object.freeze({ kind: "named" as const }) as NamedHstoreRecord<Table>;
  records.set(witness, proof);
  return witness;
}
function tableEvidence(schema: SchemaDefinition, entity: string, wholeRow: boolean): Evidence {
  if (!isLoomSchema(schema) || !Object.hasOwn(schema.tables, entity)) throw new Error("Expected a Loom schema entity");
  const table = schema.tables[entity]!;
  const metadata = schema.metadata.entities.find((candidate) => candidate.name === entity);
  if (!metadata) throw new Error("Missing Loom entity metadata");
  const columns = getTableColumns(table);
  const config = getTableConfig(table);
  if ((config.schema ?? "public") !== schema.metadata.namespace || config.name !== metadata.sqlName)
    throw new Error("Record witness table identity differs from Loom metadata");
  const attributes: Attribute[] = [
    { key: "_id", name: "_id", column: columns._id! },
    { key: "_createdAt", name: "_createdAt", column: columns._createdAt! },
    ...metadata.fields.map((field) => ({
      key: field.name,
      name: field.sqlName,
      column: columns[field.name]!,
      enumValues: field.enumValues,
    })),
  ];
  if (
    Object.keys(columns).length !== attributes.length ||
    attributes.some((attribute) => !attribute.column || attribute.column.name !== attribute.name)
  )
    throw new Error("Record witness columns differ from Loom metadata");
  // Other extension type I/O dependencies need required-API transfer before this seam can expose them.
  if (metadata.fields.some((field) => field.kind === "extension"))
    throw new Error("Record witness extension attributes require type I/O authority");
  const current = captureTableQueryInvocation(schema, entity);
  const check = () =>
    decodeFailure(() => {
      current();
      const next = getTableConfig(table);
      const nextColumns = getTableColumns(table);
      if (
        next.name !== config.name ||
        next.schema !== config.schema ||
        Object.keys(nextColumns).length !== attributes.length ||
        attributes.some(({ key, column, name }) => nextColumns[key] !== column || column.name !== name)
      )
        throw new Error("Record witness table changed after capture");
    });
  check();
  return Object.freeze({
    expression: wholeRow
      ? sql`${sql.identifier(schema.metadata.namespace)}.${sql.identifier(metadata.sqlName)}.*`
      : sql`null::${extensionSqlType(schema.metadata.namespace, metadata.sqlName)}`,
    attributes: Object.freeze(attributes.map((attribute) => Object.freeze(attribute))),
    dependencies: Object.freeze(wholeRow ? [`${schema.metadata.namespace}.${metadata.sqlName}`] : []),
    observability: metadata.fields.every((field) => safeKinds.has(field.kind)) ? "tables" : "session",
    check,
  });
}
function rowArgument(proof: Evidence): SQL<never> {
  return checkedExtensionExpression(
    proof.expression,
    internalRecordCodec,
    proof.dependencies,
    proof.check,
    "managed:hstore-record",
  );
}
function project<Table extends PgTable>(expression: SQL, proof: Evidence): PopulatedHstoreRecord<Table> {
  const fields = Object.fromEntries(
    proof.attributes.map(({ key, name, column, enumValues }) => {
      const field = sql`(${expression}).${sql.identifier(name)}`;
      // Keep a native Column decoder so Drizzle retains its cast/type/JSON projection metadata.
      const decoder = new Proxy(column, {
        get(target, property) {
          // SAFETY: property access preserves the real column metadata; only its existing decode hooks are wrapped.
          const value = target[property as keyof AnyColumn];
          if ((property === "mapFromDriverValue" || property === "mapFromJsonValue") && v.is(v.function(), value)) {
            return (driverValue: NativeColumnValue) =>
              decodeFailure(() => {
                const decoded = value.call(target, driverValue);
                return enumValues
                  ? v.parse(
                      v.pipe(
                        v.string(),
                        v.check((entry) => enumValues.includes(entry), "Expected a declared enum value"),
                      ),
                      decoded,
                    )
                  : decoded;
              });
          }
          return value;
        },
      });
      const mapped = field.mapWith(decoder);
      return [key, mapped];
    }),
  );
  // SAFETY: checked real table attributes determine each key and decoder; composite values may NULL every field.
  const selected = Object.freeze(fields) as Columns<Table>;
  const attributes = Object.freeze(Object.fromEntries(proof.attributes.map(({ key, name }) => [key, name])));
  return Object.freeze({
    isNull: checkedExtensionExpression(
      sql`(${expression}) is not distinct from null`,
      booleanCodec,
      proof.dependencies,
      proof.check,
      "managed:hstore-record-null",
    ),
    fields: selected,
    // SAFETY: the same checked attribute list determines both maps.
    attributes: attributes as PopulatedHstoreRecord<Table>["attributes"],
    record: sealNamed<Table>({ ...proof, expression }),
  });
}
/** Private, exact-version seam. Named witnesses require their real managed RPC table graph. */
export function createHstoreRecord_1_8<
  const Descriptor extends ExtensionDescriptor<"hstore", { readonly version: "1.8"; readonly schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "hstore" ||
    descriptor.version !== "1.8" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("Hstore record witness requires the exact verified contract");
  const codec = createHstoreCodec(descriptor.schema);
  const nullableHstore = nullableCodec(codec);
  function tableRow<
    const Schema extends SchemaDefinition,
    const Entity extends Extract<keyof Schema["tables"], string>,
  >(schema: Schema, entity: Entity): NamedHstoreRecord<Schema["tables"][Entity]> {
    return sealNamed(tableEvidence(schema, entity, true));
  }
  function tableType<
    const Schema extends SchemaDefinition,
    const Entity extends Extract<keyof Schema["tables"], string>,
  >(schema: Schema, entity: Entity): NamedHstoreRecord<Schema["tables"][Entity]> {
    return sealNamed(tableEvidence(schema, entity, false));
  }
  function anonymousRow<const Codecs extends readonly AnyCodec[]>(entries: {
    readonly [Index in keyof Codecs]: readonly [
      Codecs[Index] & ReviewedAnonymousCodec<NoInfer<Codecs[Index]>>,
      ExtensionSqlInput<Codecs[Index]>,
    ];
  }): AnonymousHstoreRecord {
    if (entries.length < 1 || entries.length > 1600) throw new Error("Anonymous record requires 1..1600 attributes");
    const expressions = entries.map(([fieldCodec, value]) => {
      const type = fieldCodec.sqlType;
      if (!type) throw new Error("Anonymous record codec requires a captured SQL type");
      if (type.schema !== "pg_catalog" || !safeAnonymousTypes.has(type.name))
        throw new Error("Anonymous record requires a reviewed pg_catalog SQL type");
      const expression =
        is(value, SQL.Aliased) && !v.is(v.object({ isSelectionField: v.literal(true) }), value) ? value.sql : value;
      const parameter = v.is(sqlWrapper, expression)
        ? sql`${expression}`
        : sql`${sql.param(
            decodeFailure(() => {
              // SAFETY: every tuple position pairs its value with this exact codec; encode validates the input.
              const encoded = fieldCodec.encode(value as never);
              if (v.is(v.string(), encoded) && !v.is(hstoreTextSchema, encoded))
                throw new Error("Anonymous record requires lossless PostgreSQL UTF8 text");
              return encoded;
            }),
          )}`;
      return sql`(${parameter})::${extensionSqlType(type.schema, type.name)}${type.array ? sql`[]` : sql.empty()}`;
    });
    // SAFETY: an anonymous witness is constructed solely from the checked, explicitly cast element list.
    const witness = Object.freeze({ kind: "anonymous" as const }) as AnonymousHstoreRecord;
    records.set(
      witness,
      Object.freeze({
        expression: sql`row(${sql.join(expressions, sql`, `)})`,
        attributes: [],
        dependencies: [],
        observability: entries.every(
          ([fieldCodec]) =>
            fieldCodec.sqlType?.schema === "pg_catalog" &&
            !fieldCodec.sqlType.array &&
            safeAnonymousTypes.has(fieldCodec.sqlType.name),
        )
          ? "tables"
          : "session",
      }),
    );
    return witness;
  }
  function fromRecord(witness: RecordWitness): SQL<HstoreValue> {
    const proof = evidence(witness);
    return createSqlFunction({
      schema: descriptor.schema,
      name: "hstore",
      member: memberFromRecord,
      arguments: [internalRecordCodec] as const,
      result: codec,
      dependencies: proof.dependencies,
      observability: proof.observability,
      authority: "query",
    })(rowArgument(proof));
  }
  function populateRecord<Table extends PgTable>(
    witness: NamedHstoreRecord<Table>,
    mapping: ExtensionSqlInput<typeof nullableHstore>,
  ): PopulatedHstoreRecord<Table> {
    const proof = evidence(witness);
    if (witness.kind !== "named") throw new Error("populate_record requires a named table witness");
    const expression = createSqlFunction({
      schema: descriptor.schema,
      name: "populate_record",
      member: memberPopulateRecord,
      arguments: [internalRecordCodec, nullableHstore] as const,
      result: internalRecordCodec,
      dependencies: proof.dependencies,
      observability: proof.observability,
      authority: "query",
    })(rowArgument(proof), mapping);
    return project<Table>(expression, proof);
  }
  function replaceRecord<Table extends PgTable>(
    witness: NamedHstoreRecord<Table>,
    mapping: ExtensionSqlInput<typeof nullableHstore>,
  ): PopulatedHstoreRecord<Table> {
    const proof = evidence(witness);
    if (witness.kind !== "named") throw new Error("#= requires a named table witness");
    const expression = createSqlOperator({
      schema: descriptor.schema,
      name: "#=",
      member: memberReplaceRecord,
      left: internalRecordCodec,
      right: nullableHstore,
      result: internalRecordCodec,
      dependencies: proof.dependencies,
      observability: proof.observability,
      authority: "query",
    })(rowArgument(proof), mapping);
    return project<Table>(expression, proof);
  }
  return bindExtension(descriptor, {
    codec,
    record: Object.freeze({ tableRow, tableType, anonymousRow }),
    fromRecord,
    populateRecord,
    sql: Object.freeze({
      operators: Object.freeze({ "#=": replaceRecord }),
      overloads: Object.freeze({
        [memberFromRecord]: fromRecord,
        [memberPopulateRecord]: populateRecord,
        [memberReplaceRecord]: replaceRecord,
      }),
    }),
  });
}
