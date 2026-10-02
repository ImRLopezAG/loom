import * as v from "valibot";
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";
import type { PgCustomColumnBuilder } from "drizzle-orm/pg-core";
import { Field } from "../schema/fields";
import type { ExtensionCodec } from "./codecs";
import { decodeFailure } from "./codecs";
import type { ExtensionDescriptor } from "./bindings";

import { extensionValueParser, freezeExtensionValue, registerExtensionStorageCheck } from "./values";
import type {
  ExtensionValueSchema,
  ExtensionFieldMetadata,
  ExtensionFieldEvidence,
  ExtensionSchemaRequirement,
  ExtensionFieldSearch,
} from "./values";
import type { ExtensionSearchOperator, ExtensionSearchOperation } from "./values";
export type {
  ExtensionValueSchema,
  ExtensionFieldMetadata,
  ExtensionFieldEvidence,
  ExtensionSchemaRequirement,
  ExtensionFieldSearch,
} from "./values";

function quote(value: string): string {
  if (!value || value.includes("\0")) throw new Error("Invalid extension SQL identifier");
  return `"${value.replaceAll('"', '""')}"`;
}
export function extensionFieldSqlType(
  field: Pick<ExtensionFieldMetadata, "schema" | "type" | "typmods" | "array">,
): string {
  const modifier = field.typmods.length
    ? `(${field.typmods.map((value) => (v.is(v.number(), value) ? String(value) : quote(value))).join(",")})`
    : "";
  return `${quote(field.schema)}.${quote(field.type)}${modifier}${field.array ? "[]" : ""}`;
}
function requirement(extension: ExtensionDescriptor, member: string): ExtensionSchemaRequirement {
  if (extension.apiSupport.status !== "verified" || !extension.apiSupport.digest)
    throw new Error(`Extension schema requires a verified contract: ${extension.name}@${extension.version}`);
  if (!member) throw new Error("Extension schema requires a registry member identity");
  return {
    name: extension.name,
    version: extension.version,
    schema: extension.schema,
    digest: extension.apiSupport.digest,
    member,
  };
}
export function createExtensionField<Value, const Search extends ExtensionFieldSearch>(definition: {
  readonly extension: ExtensionDescriptor;
  readonly member: string;
  readonly type: string;
  readonly codec: ExtensionCodec<Value, Value>;
  readonly typmods?: readonly (string | number)[];
  readonly array?: boolean;
  readonly parameters?: Readonly<Record<string, string | number | boolean>>;
  readonly value: ExtensionValueSchema;
  readonly search: Search;
  readonly operators?: Readonly<Partial<Record<ExtensionSearchOperation, ExtensionSearchOperator>>>;
}) {
  const typmods = Object.freeze(
    v.parse(v.array(v.union([v.string(), v.pipe(v.number(), v.safeInteger())])), definition.typmods ?? []),
  );
  const value = freezeExtensionValue(definition.value);
  if (
    (definition.search.order || definition.search.comparison) &&
    !["string", "number", "bigint", "date"].includes(value.kind)
  )
    throw new Error("Extension ordering and comparison require a supported scalar cursor representation");
  if (definition.search.text && (value.kind !== "string" || !definition.search.filter))
    throw new Error("Extension text matching requires a string filter");
  if (definition.search.comparison && !definition.search.filter)
    throw new Error("Extension comparison requires filtering");
  const operators = Object.freeze(
    Object.fromEntries(
      Object.entries(definition.operators ?? {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([operation, operator]) => {
          if (
            !operator.member ||
            operator.schema !== definition.extension.schema ||
            !/^[+\-*/<>=~!@#%^&|`?]+$/.test(operator.name) ||
            operator.name.includes("--") ||
            operator.name.includes("/*")
          )
            throw new Error("Invalid qualified extension search operator");
          if ((operation === "like" || operation === "ilike") !== (operator.operand !== "field"))
            throw new Error("Extension search operator operand disagrees with its operation");
          quote(operator.schema);
          if (
            operator.operand !== "field" &&
            (operator.operand.schema !== "pg_catalog" || operator.operand.type !== "text")
          )
            throw new Error("Extension search operands require the native field codec or PostgreSQL text");
          return [
            operation,
            Object.freeze({
              member: operator.member,
              schema: operator.schema,
              name: operator.name,
              operand: operator.operand === "field" ? "field" : Object.freeze({ ...operator.operand }),
            }),
          ];
        }),
    ),
  );
  const required = [
    ...(definition.search.filter ? ["eq", "ne"] : []),
    ...(definition.search.comparison ? ["gt", "gte", "lt", "lte"] : []),
    ...(definition.search.order ? ["eq", "lt", "gt"] : []),
    ...(definition.search.text ? ["like", "ilike"] : []),
  ];
  if (required.some((operation) => !Object.hasOwn(operators, operation)))
    throw new Error("Approved extension search requires explicit qualified operators");
  const metadata: ExtensionFieldMetadata = Object.freeze({
    ...requirement(definition.extension, definition.member),
    type: definition.type,
    codec: definition.codec.id,
    typmods,
    array: definition.array ?? false,
    parameters: Object.freeze(
      Object.fromEntries(Object.entries(definition.parameters ?? {}).sort(([a], [b]) => a.localeCompare(b))),
    ),
    value,
    search: Object.freeze({ ...definition.search }),
    ...(Object.keys(operators).length && { operators }),
  });
  const sqlType = extensionFieldSqlType(metadata);
  const parse = extensionValueParser(value);
  registerExtensionStorageCheck(metadata, (value) => {
    // SAFETY: the portable projection and the codec validate the same field value; codec validation rejects incompatible input.
    definition.codec.encode(value as Value);
  });
  const column = customType<{ data: Value; driverData: unknown; jsonData: unknown }>({
    dataType: () => sqlType,
    toDriver: (value) => definition.codec.encode(value),
    fromDriver: (value) => decodeFailure(() => definition.codec.decode(value)),
    fromJson: (value) => decodeFailure(() => definition.codec.decode(value)),
    forJsonSelect: (column) => (definition.codec.transport === "text" ? sql`(${column})::text` : column),
  });
  type Builder = PgCustomColumnBuilder<{
    dataType: "custom";
    data: Value;
    driverParam: ExtensionFieldEvidence<Search>;
  }>;
  return new Field<Builder, undefined, Value>(
    (name) => {
      // SAFETY: driverParam retains only phantom search evidence; native runtime encoding remains owned by this exact codec.
      return column(name) as Builder;
    },
    { kind: "extension", notNull: false, unique: false, extension: metadata },
    undefined,
    (value) => {
      v.parse(parse, value);
      const driver = v.parse(
        v.union([v.string(), v.number(), v.boolean(), v.bigint()]),
        definition.codec.encode(value),
      );
      const expression = sql`${driver}::${sql.raw(sqlType)}`.inlineParams();
      return { sql: expression, fingerprint: String(driver) };
    },
  );
}
export interface ExtensionIndexContract extends ExtensionSchemaRequirement {
  readonly method: string;
  readonly opclass: string;
  readonly type: string;
  readonly default?: boolean;
}
export function createExtensionIndex(definition: {
  readonly extension: ExtensionDescriptor;
  readonly member: string;
  readonly method: string;
  readonly opclass: string;
  readonly type: string;
  readonly default?: boolean;
}): ExtensionIndexContract {
  quote(definition.method);
  quote(definition.opclass);
  quote(definition.type);
  return Object.freeze({
    ...requirement(definition.extension, definition.member),
    method: definition.method,
    opclass: definition.opclass,
    type: definition.type,
    ...(definition.default && { default: true }),
  });
}
export function extensionIndexOpclass(index: ExtensionIndexContract): string {
  return `${quote(index.schema)}.${quote(index.opclass)}`;
}
