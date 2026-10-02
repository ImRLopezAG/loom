import * as v from "valibot";
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";
import type { PgCustomColumnBuilder } from "drizzle-orm/pg-core";
import { Field } from "../schema/fields";
import type { FieldMetadata } from "../schema/fields";
import type { ExtensionCodec } from "./codecs";
import { decodeFailure } from "./codecs";
import type { ExtensionDescriptor } from "./bindings";
import type { ExtensionManifest, ExtensionTypeReference } from "./contracts";
import { validateExtensionManifest } from "./registry";

import { extensionValueParser, freezeExtensionValue, registerExtensionStorageCheck } from "./values";
import type {
  ExtensionValueSchema,
  ExtensionFieldMetadata,
  ExtensionFieldEvidence,
  ExtensionSchemaRequirement,
  ExtensionFieldSearch,
  ExtensionStorageIdentity,
} from "./values";
import type { ExtensionSearchOperator, ExtensionSearchOperation } from "./values";
export type {
  ExtensionValueSchema,
  ExtensionFieldMetadata,
  ExtensionFieldEvidence,
  ExtensionSchemaRequirement,
  ExtensionFieldSearch,
  ExtensionStorageIdentity,
} from "./values";

function quote(value: string): string {
  if (!value || value.includes("\0")) throw new Error("Invalid extension SQL identifier");
  return `"${value.replaceAll('"', '""')}"`;
}
export function extensionFieldSqlType(
  field: Pick<ExtensionFieldMetadata, "schema" | "type" | "typmods" | "array" | "storage">,
): string {
  const modifier = field.typmods.length
    ? `(${field.typmods.map((value) => (v.is(v.number(), value) ? String(value) : quote(value))).join(",")})`
    : "";
  return `${quote(field.storage?.schema ?? field.schema)}.${quote(field.storage?.type ?? field.type)}${modifier}${field.array ? "[]" : ""}`;
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
interface ExtensionFieldDefinition<Value, Search extends ExtensionFieldSearch> {
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
}
export function createExtensionField<Value, const Search extends ExtensionFieldSearch>(
  definition: ExtensionFieldDefinition<Value, Search>,
) {
  return extensionField(definition);
}
function extensionField<Value, const Search extends ExtensionFieldSearch>(
  definition: ExtensionFieldDefinition<Value, Search>,
  storage?: ExtensionStorageIdentity,
) {
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
    ...(storage && { storage }),
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

function selectedManifest(extension: ExtensionDescriptor, manifest: ExtensionManifest): ExtensionManifest {
  const checked = validateExtensionManifest(manifest);
  const owner = requirement(extension, "capture");
  if (
    checked.contract.extension !== owner.name ||
    checked.contract.version !== owner.version ||
    checked.digest !== owner.digest ||
    checked.contract.postgresMajor !== 18 ||
    checked.contract.provider !== "neon"
  )
    throw new Error("Selected extension disagrees with its captured storage contract");
  return checked;
}

/** PostgreSQL native array names are reviewed individually, never inferred from underscores. */
function capturedStorage(
  extension: ExtensionDescriptor,
  manifest: ExtensionManifest,
  input: ExtensionTypeReference,
): ExtensionStorageIdentity {
  if (input.namespace === "pg_catalog") {
    const native = {
      text: { type: "text", dimensions: 0 },
      int4: { type: "int4", dimensions: 0 },
      _int4: { type: "int4", dimensions: 1 },
    };
    if (!Object.hasOwn(native, input.name))
      throw new Error(`Unsupported captured native storage: ${input.namespace}.${input.name}`);
    // SAFETY: the own-key check restricts the symbolic type to the reviewed native identities above.
    return Object.freeze({ schema: "pg_catalog", ...native[input.name as keyof typeof native] });
  }
  const member = manifest.contract.members.find(
    (member) => member.kind === "type" && member.namespace === input.namespace && member.name === input.name,
  );
  if (!member || member.kind !== "type")
    throw new Error(`Missing captured type identity: ${input.namespace}.${input.name}`);
  const element = member.element;
  const leaf = element ?? input;
  if (leaf.namespace !== `$extension:${extension.name}`)
    throw new Error("Captured storage requires its selected extension namespace");
  if (
    element &&
    !manifest.contract.members.some(
      (member) => member.kind === "type" && member.namespace === element.namespace && member.name === element.name,
    )
  )
    throw new Error("Missing captured array element identity");
  return Object.freeze({ schema: extension.schema, type: leaf.name, dimensions: element ? 1 : 0 });
}

/** Selected adapters bind a native field to a real captured routine, class or type requirement. */
export function createNativeExtensionField<Value, const Search extends ExtensionFieldSearch>(
  definition: Omit<ExtensionFieldDefinition<Value, Search>, "type" | "array" | "typmods"> & {
    readonly manifest: ExtensionManifest;
    readonly input: ExtensionTypeReference;
  },
) {
  const manifest = selectedManifest(definition.extension, definition.manifest);
  const member = manifest.contract.members.find((member) => member.id === definition.member);
  const same = (type: ExtensionTypeReference) =>
    type.namespace === definition.input.namespace && type.name === definition.input.name;
  if (
    !member ||
    !(
      (member.kind === "opclass" && same(member.input)) ||
      (member.kind === "routine" &&
        (same(member.returns) || member.arguments.some((argument) => same(argument.type)))) ||
      (member.kind === "type" && same({ namespace: member.namespace ?? "", name: member.name }))
    )
  )
    throw new Error("Native extension fields require an explicit captured input identity");
  const storage = capturedStorage(definition.extension, manifest, definition.input);
  if (storage.schema !== "pg_catalog") throw new Error("Native extension fields require reviewed pg_catalog storage");
  const codec = definition.codec.sqlType;
  if (
    !codec ||
    codec.schema !== storage.schema ||
    codec.name !== storage.type ||
    Boolean(codec.array) !== Boolean(storage.dimensions)
  )
    throw new Error("Native extension field codec disagrees with captured storage");
  return extensionField({ ...definition, type: storage.type, array: Boolean(storage.dimensions) }, storage);
}

export interface ExtensionIndexContract extends ExtensionSchemaRequirement {
  readonly method: string;
  readonly opclass: string;
  readonly type: string;
  readonly default?: boolean;
  readonly input?: ExtensionStorageIdentity;
  readonly nullFreeElements?: boolean;
}
export function createExtensionIndex(definition: {
  readonly extension: ExtensionDescriptor;
  readonly member: string;
  readonly method: string;
  readonly opclass: string;
  readonly type: string;
  readonly default?: boolean;
  readonly manifest?: ExtensionManifest;
}): ExtensionIndexContract {
  quote(definition.method);
  quote(definition.opclass);
  quote(definition.type);
  const manifest = definition.manifest && selectedManifest(definition.extension, definition.manifest);
  const member = manifest?.contract.members.find((member) => member.id === definition.member);
  if (
    manifest &&
    (!member ||
      member.kind !== "opclass" ||
      member.name !== definition.opclass ||
      member.accessMethod !== definition.method ||
      member.namespace !== `$extension:${definition.extension.name}`)
  )
    throw new Error("Extension index disagrees with its captured operator class");
  const input =
    manifest && member?.kind === "opclass" ? capturedStorage(definition.extension, manifest, member.input) : undefined;
  if (
    input &&
    (input.type !== definition.type ||
      (definition.default !== undefined && definition.default !== (member?.kind === "opclass" && member.isDefault)))
  )
    throw new Error("Extension index input or default disagrees with its captured operator class");
  const isDefault = member?.kind === "opclass" ? member.isDefault : definition.default;
  return Object.freeze({
    ...requirement(definition.extension, definition.member),
    method: definition.method,
    opclass: definition.opclass,
    type: definition.type,
    ...(isDefault && { default: true }),
    ...(input && { input }),
    ...(input &&
      definition.extension.name === "intarray" &&
      input.type === "int4" &&
      input.dimensions === 1 && { nullFreeElements: true }),
  });
}
function containsNull(value: ExtensionValueSchema): boolean {
  switch (value.kind) {
    case "null":
      return true;
    case "union":
      return value.variants.some(containsNull);
    case "array":
      return containsNull(value.items);
    case "object":
      return Object.values(value.properties).some(containsNull);
    default:
      return false;
  }
}
/** Captured class inputs compare actual SQL storage, while legacy contracts keep owner matching. */
export function extensionIndexAcceptsField(index: ExtensionIndexContract, field: FieldMetadata): boolean {
  const extension = field.extension;
  if (!index.input)
    return Boolean(
      extension &&
      extension.name === index.name &&
      extension.version === index.version &&
      extension.schema === index.schema &&
      extension.digest === index.digest &&
      extension.type === index.type &&
      !extension.array,
    );
  const nativeType =
    field.kind === "text" || field.kind === "enum" ? "text" : field.kind === "integer" ? "int4" : undefined;
  const storage = extension
    ? (extension.storage ?? { schema: extension.schema, type: extension.type, dimensions: extension.array ? 1 : 0 })
    : nativeType
      ? { schema: "pg_catalog", type: nativeType, dimensions: 0 }
      : undefined;
  if (
    !storage ||
    storage.schema !== index.input.schema ||
    storage.type !== index.input.type ||
    storage.dimensions !== index.input.dimensions
  )
    return false;
  if (
    storage.schema !== "pg_catalog" &&
    (!extension ||
      extension.name !== index.name ||
      extension.version !== index.version ||
      extension.digest !== index.digest)
  )
    return false;
  return !index.nullFreeElements || Boolean(extension && !containsNull(extension.value));
}
export function extensionIndexOpclass(index: ExtensionIndexContract): string {
  return `${quote(index.schema)}.${quote(index.opclass)}`;
}
