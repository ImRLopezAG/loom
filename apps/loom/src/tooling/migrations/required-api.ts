import { createHash } from "node:crypto";
import * as v from "valibot";
import { canonical } from "../../core/validation/canonical";
import { json } from "../../core/validation/encoding";
import { createExtensionBindings } from "../../core/extensions/bindings";
import type { ExtensionSelection, ExtensionApiSupport } from "../../core/extensions/bindings";
import type { ExtensionValueSchema, ExtensionSchemaRequirement } from "../../core/extensions/values";
import { validateExtensionManifest } from "../../core/extensions/registry";
import { sqlName } from "../../core/schema/compile";
import type { SchemaMetadata } from "../../core/schema/compile";
import { resolveSelectedExtension } from "../codegen/extensions";
import { extensionApiRequirementValidator, validateExtensionApiRequirement } from "../extensions/verify";
import { assertSchemaExtensionCompatibility } from "./extension-compatibility";
import type { ExtensionPlan } from "./extensions";
import type { MigrationSnapshot } from "./adapter";

const token = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
const number = v.pipe(v.number(), v.finite());
const integer = v.pipe(v.number(), v.safeInteger());
const storage = v.strictObject({ schema: token, type: token, dimensions: v.pipe(integer, v.minValue(0)) });
const primitive = v.union([v.string(), number, v.boolean()]);
const valueSchema: v.GenericSchema<ExtensionValueSchema> = v.lazy(() =>
  v.variant("kind", [
    v.strictObject({
      kind: v.literal("string"),
      pattern: v.optional(v.string()),
      enum: v.optional(v.array(v.string())),
    }),
    v.strictObject({
      kind: v.literal("number"),
      integer: v.optional(v.boolean()),
      minimum: v.optional(number),
      maximum: v.optional(number),
    }),
    v.strictObject({ kind: v.picklist(["boolean", "bigint", "date", "null"]) }),
    v.strictObject({
      kind: v.literal("array"),
      items: valueSchema,
      length: v.optional(v.pipe(integer, v.minValue(0))),
    }),
    v.strictObject({ kind: v.literal("object"), properties: v.record(v.string(), valueSchema) }),
    v.strictObject({ kind: v.literal("union"), variants: v.pipe(v.array(valueSchema), v.minLength(1)) }),
  ]),
);
const requirement = {
  name: token,
  version: token,
  schema: token,
  digest: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  member: token,
};
const fieldMetadata = v.strictObject({
  ...requirement,
  type: token,
  codec: token,
  typmods: v.array(v.union([v.string(), integer])),
  array: v.boolean(),
  storage: v.optional(storage),
  parameters: v.record(v.string(), primitive),
  value: valueSchema,
  search: v.strictObject({ filter: v.boolean(), comparison: v.boolean(), order: v.boolean(), text: v.boolean() }),
  operators: v.optional(
    v.record(
      v.picklist(["eq", "ne", "gt", "gte", "lt", "lte", "like", "ilike"]),
      v.strictObject({
        member: token,
        schema: token,
        name: token,
        operand: v.union([v.literal("field"), v.strictObject({ schema: token, type: token })]),
      }),
    ),
  ),
});
const indexContract = v.strictObject({
  ...requirement,
  method: token,
  opclass: token,
  type: token,
  default: v.optional(v.boolean()),
  input: v.optional(storage),
  nullFreeElements: v.optional(v.boolean()),
  options: v.optional(v.record(v.pipe(v.string(), v.regex(/^[a-z][a-z0-9_]*$/)), integer)),
});
const indexDeclaration = v.strictObject({
  fields: v.pipe(v.array(token), v.minLength(1)),
  unique: v.optional(v.boolean()),
  extension: indexContract,
  with: v.optional(v.record(v.string(), primitive)),
});
export const requiredApiValidator = v.strictObject({
  format: v.literal(1),
  apis: v.array(extensionApiRequirementValidator),
  fields: v.array(v.strictObject({ table: token, field: token, metadata: fieldMetadata })),
  indexes: v.array(v.strictObject({ table: token, declaration: indexDeclaration })),
});
export type RequiredApi = v.InferOutput<typeof requiredApiValidator>;

function serialized<Value>(value: Value): string {
  return canonical(v.parse(json, JSON.parse(JSON.stringify(value))));
}

/** Validate stored pins, not today's acceptance list: history remains an immutable contract. */
export function validateRequiredApi<Input>(
  input: Input,
  installation?: ExtensionPlan,
  snapshot?: MigrationSnapshot,
): RequiredApi {
  const payload = v.parse(requiredApiValidator, input);
  if (!payload.apis.length && !payload.fields.length && !payload.indexes.length)
    throw new Error("Empty required API payload must be omitted");
  const apis = payload.apis.map((input) => {
    const api = validateExtensionApiRequirement(input);
    return { ...api, manifest: validateExtensionManifest(api.manifest) };
  });
  const owners = new Map(apis.map((api) => [api.manifest.contract.extension, api]));
  const members = new Map(
    apis.map((api) => [
      api.manifest.contract.extension,
      new Map(api.manifest.contract.members.map((member) => [member.id, member])),
    ]),
  );
  const columns = snapshot
    ? new Set(
        snapshot.ddl.flatMap((entry) =>
          entry.entityType === "columns" ? [serialized([entry.table, entry.name])] : [],
        ),
      )
    : undefined;
  if (owners.size !== apis.length) throw new Error("Duplicate extension API requirement");
  for (const api of apis) {
    const contract = api.manifest.contract;
    if (contract.postgresMajor !== 18 || contract.provider !== "neon")
      throw new Error("Required API contract profile mismatch");
    if (installation) {
      for (const state of [installation.after, installation.requirements]) {
        const selected = state.find((entry) => entry.name === contract.extension);
        if (!selected || selected.version !== contract.version || selected.schema !== api.schema)
          throw new Error(`Required API installation placement mismatch: ${contract.extension}`);
      }
    }
  }
  function member(required: ExtensionSchemaRequirement) {
    const api = owners.get(required.name);
    if (
      !api ||
      api.schema !== required.schema ||
      api.manifest.contract.version !== required.version ||
      api.manifest.digest !== required.digest
    )
      throw new Error(`Required schema API owner mismatch: ${required.name}:${required.member}`);
    const found = members.get(required.name)?.get(required.member);
    if (!found) throw new Error(`Missing required extension member: ${required.member}`);
    return found;
  }
  function column(table: string, field: string) {
    if (columns && !columns.has(serialized([sqlName(table), sqlName(field)])))
      throw new Error(`Required API schema placement mismatch: ${table}.${field}`);
  }
  const fieldNames = new Set<string>();
  for (const field of payload.fields) {
    const key = serialized([field.table, field.field]);
    if (fieldNames.has(key)) throw new Error(`Duplicate required extension field: ${field.table}.${field.field}`);
    fieldNames.add(key);
    column(field.table, field.field);
    const captured = member(field.metadata);
    if (
      captured.kind !== "type" ||
      (captured.name !== field.metadata.type && captured.element?.name !== field.metadata.type)
    )
      throw new Error(`Required field type disagrees with captured member: ${field.metadata.member}`);
    for (const operator of Object.values(field.metadata.operators ?? {})) {
      const captured = member({ ...field.metadata, member: operator.member });
      if (captured.kind !== "operator" || captured.name !== operator.name || operator.schema !== field.metadata.schema)
        throw new Error(`Required field operator disagrees with captured member: ${operator.member}`);
    }
  }
  for (const { table, declaration } of payload.indexes) {
    for (const field of declaration.fields) column(table, field);
    const index = declaration.extension;
    const captured = member(index);
    if (
      captured.kind !== "opclass" ||
      captured.name !== index.opclass ||
      captured.accessMethod !== index.method ||
      captured.namespace !== `$extension:${index.name}` ||
      (index.default !== undefined && index.default !== captured.isDefault)
    )
      throw new Error(`Required index disagrees with captured member: ${index.member}`);
    if (index.input) {
      const expectedSchema =
        captured.input.namespace === `$extension:${index.name}` ? index.schema : captured.input.namespace;
      const expectedType =
        captured.input.name === "_int4" && expectedSchema === "pg_catalog" ? "int4" : captured.input.name;
      if (index.input.schema !== expectedSchema || index.input.type !== expectedType || index.input.type !== index.type)
        throw new Error(`Required index storage disagrees with captured member: ${index.member}`);
    }
  }
  // Records are stable; member/native argument/value/index-field lists retain their order.
  const normalized = {
    format: payload.format,
    apis: apis.sort((a, b) => a.manifest.contract.extension.localeCompare(b.manifest.contract.extension)),
    fields: payload.fields
      .map((value) => ({ value, key: serialized([value.table, value.field]) }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ value }) => value),
    // Full declaration identity is a multiset: duplicate declarations retain their multiplicity.
    indexes: payload.indexes
      .map((value) => ({ value, key: serialized(value) }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ value }) => value),
  };
  return v.parse(requiredApiValidator, JSON.parse(serialized(normalized)));
}

export function requiredApiHash(input: RequiredApi | undefined): string | undefined {
  return input === undefined
    ? undefined
    : createHash("sha256")
        .update(serialized(validateRequiredApi(input)))
        .digest("hex");
}

/** Application uses normalized configuration; components supply only their resolved requirements. */
export function buildRequiredApi(selection: ExtensionSelection, metadata?: SchemaMetadata): RequiredApi | undefined {
  const support: Record<string, ExtensionApiSupport> = {};
  const apis = Object.entries(selection ?? {}).flatMap(([name, entry]) => {
    if (!entry) return [];
    const resolved = resolveSelectedExtension(name, entry);
    support[name] = resolved.support;
    return resolved.manifest ? [{ schema: entry.schema, manifest: resolved.manifest }] : [];
  });
  if (metadata) assertSchemaExtensionCompatibility(metadata, createExtensionBindings(selection, support));
  const fields = (metadata?.entities ?? []).flatMap((entity) =>
    entity.fields.flatMap((field) =>
      field.extension ? [{ table: entity.name, field: field.name, metadata: field.extension }] : [],
    ),
  );
  const indexes = (metadata?.entities ?? []).flatMap((entity) =>
    (entity.options.indexes ?? []).flatMap((declaration) =>
      declaration.extension ? [{ table: entity.name, declaration }] : [],
    ),
  );
  if (!apis.length && !fields.length && !indexes.length) return undefined;
  return validateRequiredApi({ format: 1, apis, fields, indexes });
}
