import * as v from "valibot";
import type { StorageValue } from "../validation/encoding";
import type { SearchJsonSchema } from "../search/json-schema";

/** Portable storage and wire projection; semantic SQL operations are declared separately. */
export type ExtensionValueSchema =
  | { readonly kind: "string"; readonly pattern?: string | undefined; readonly enum?: readonly string[] | undefined }
  | {
      readonly kind: "number";
      readonly integer?: boolean | undefined;
      readonly minimum?: number | undefined;
      readonly maximum?: number | undefined;
    }
  | { readonly kind: "boolean" | "bigint" | "date" | "null" }
  | { readonly kind: "array"; readonly items: ExtensionValueSchema; readonly length?: number | undefined }
  | { readonly kind: "object"; readonly properties: Readonly<Record<string, ExtensionValueSchema>> }
  | { readonly kind: "union"; readonly variants: readonly ExtensionValueSchema[] };
export interface ExtensionFieldSearch {
  readonly filter: boolean;
  readonly comparison: boolean;
  readonly order: boolean;
  readonly text: boolean;
}
export type ExtensionSearchOperation = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike";
export interface ExtensionSearchOperator {
  readonly member: string;
  readonly schema: string;
  readonly name: string;
  readonly operand: "field" | { readonly schema: string; readonly type: string };
}
declare const fieldEvidence: unique symbol;
/** Carried by the native driver-parameter config; selected values retain their ordinary type. */
export interface ExtensionFieldEvidence<Search extends ExtensionFieldSearch = ExtensionFieldSearch> {
  readonly [fieldEvidence]: Search;
}
export interface ExtensionSchemaRequirement {
  readonly name: string;
  readonly version: string;
  readonly schema: string;
  readonly digest: string;
  readonly member: string;
}
/** SQL storage identity is independent of the selected capability that requires it. */
export interface ExtensionStorageIdentity {
  readonly schema: string;
  readonly type: string;
  readonly dimensions: number;
}
export interface ExtensionFieldMetadata extends ExtensionSchemaRequirement {
  readonly type: string;
  readonly codec: string;
  readonly typmods: readonly (string | number)[];
  readonly array: boolean;
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
  readonly value: ExtensionValueSchema;
  readonly search: ExtensionFieldSearch;
  readonly operators?: Readonly<Partial<Record<ExtensionSearchOperation, ExtensionSearchOperator>>> | undefined;
  readonly storage?: ExtensionStorageIdentity | undefined;
}
const valueSchema: v.GenericSchema<ExtensionValueSchema> = v.lazy(() =>
  v.variant("kind", [
    v.object({ kind: v.literal("string"), pattern: v.optional(v.string()), enum: v.optional(v.array(v.string())) }),
    v.object({
      kind: v.literal("number"),
      integer: v.optional(v.boolean()),
      minimum: v.optional(v.number()),
      maximum: v.optional(v.number()),
    }),
    v.object({ kind: v.picklist(["boolean", "bigint", "date", "null"]) }),
    v.object({
      kind: v.literal("array"),
      items: valueSchema,
      length: v.optional(v.pipe(v.number(), v.safeInteger(), v.minValue(0))),
    }),
    v.object({ kind: v.literal("object"), properties: v.record(v.string(), valueSchema) }),
    v.object({ kind: v.literal("union"), variants: v.pipe(v.array(valueSchema), v.minLength(1)) }),
  ]),
);
export const extensionFieldMetadataValidator = v.object({
  name: v.string(),
  version: v.string(),
  schema: v.string(),
  digest: v.string(),
  member: v.string(),
  type: v.string(),
  codec: v.string(),
  typmods: v.array(v.union([v.string(), v.number()])),
  array: v.boolean(),
  storage: v.optional(
    v.object({ schema: v.string(), type: v.string(), dimensions: v.pipe(v.number(), v.integer(), v.minValue(0)) }),
  ),
  parameters: v.record(v.string(), v.union([v.string(), v.number(), v.boolean()])),
  value: valueSchema,
  search: v.object({ filter: v.boolean(), comparison: v.boolean(), order: v.boolean(), text: v.boolean() }),
  operators: v.optional(
    v.record(
      v.picklist(["eq", "ne", "gt", "gte", "lt", "lte", "like", "ilike"]),
      v.object({
        member: v.string(),
        schema: v.string(),
        name: v.string(),
        operand: v.union([v.literal("field"), v.object({ schema: v.string(), type: v.string() })]),
      }),
    ),
  ),
});
const storageChecks = new WeakMap<ExtensionFieldMetadata, (value: StorageValue) => void>();
export function extensionValueParser(value: ExtensionValueSchema): v.GenericSchema<StorageValue> {
  switch (value.kind) {
    case "null":
      return v.null();
    case "boolean":
      return v.boolean();
    case "bigint":
      return v.bigint();
    case "date":
      return v.date();
    case "string": {
      let pattern: RegExp | undefined;
      return v.pipe(
        v.string(),
        v.check((item) => {
          if (value.pattern) pattern ??= new RegExp(value.pattern);
          return (!pattern || pattern.test(item)) && (!value.enum || value.enum.includes(item));
        }),
      );
    }
    case "number":
      return v.pipe(
        v.number(),
        v.finite(),
        v.check(
          (item) =>
            (!value.integer || Number.isSafeInteger(item)) &&
            (value.minimum === undefined || item >= value.minimum) &&
            (value.maximum === undefined || item <= value.maximum),
        ),
      );
    case "array":
      return v.pipe(
        v.array(extensionValueParser(value.items)),
        v.check((items) => value.length === undefined || items.length === value.length),
      );
    case "object":
      return v.strictObject(
        Object.fromEntries(Object.entries(value.properties).map(([key, item]) => [key, extensionValueParser(item)])),
      );
    case "union":
      return v.union(value.variants.map(extensionValueParser));
  }
}
/** Codec validation supplements the portable projection on server-owned schema metadata. */
export function extensionStorageParser(field: ExtensionFieldMetadata): v.GenericSchema<StorageValue> {
  return v.pipe(
    extensionValueParser(field.value),
    v.check((value) => {
      try {
        storageChecks.get(field)?.(value);
        return true;
      } catch {
        return false;
      }
    }, "Invalid extension storage value"),
  );
}
export function extensionValueJsonSchema(value: ExtensionValueSchema): SearchJsonSchema {
  switch (value.kind) {
    case "null":
    case "boolean":
      return { type: value.kind };
    case "date":
      return { type: "string", format: "date-time", "x-native-type": "date" };
    case "bigint":
      return { type: "string", pattern: "^-?\\d+$", "x-native-type": "bigint" };
    case "string":
      return {
        type: "string",
        ...(value.pattern && { pattern: value.pattern }),
        ...(value.enum && { enum: value.enum }),
      };
    case "number":
      return {
        type: value.integer ? "integer" : "number",
        ...(value.minimum !== undefined && { minimum: value.minimum }),
        ...(value.maximum !== undefined && { maximum: value.maximum }),
      };
    case "array":
      return {
        type: "array",
        items: extensionValueJsonSchema(value.items),
        ...(value.length !== undefined && { minItems: value.length, maxItems: value.length }),
      };
    case "object":
      return {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(value.properties).map(([key, item]) => [key, extensionValueJsonSchema(item)]),
        ),
        required: Object.keys(value.properties),
        additionalProperties: false,
      };
    case "union":
      return { anyOf: value.variants.map(extensionValueJsonSchema) };
  }
}
export function freezeExtensionValue(value: ExtensionValueSchema): ExtensionValueSchema {
  switch (value.kind) {
    case "array":
      return Object.freeze({ ...value, items: freezeExtensionValue(value.items) });
    case "object":
      return Object.freeze({
        ...value,
        properties: Object.freeze(
          Object.fromEntries(Object.entries(value.properties).map(([key, item]) => [key, freezeExtensionValue(item)])),
        ),
      });
    case "union":
      return Object.freeze({ ...value, variants: Object.freeze(value.variants.map(freezeExtensionValue)) });
    case "string":
      return Object.freeze({ ...value, ...(value.enum && { enum: Object.freeze([...value.enum]) }) });
    default:
      return Object.freeze({ ...value });
  }
}

export function registerExtensionStorageCheck(
  field: ExtensionFieldMetadata,
  check: (value: StorageValue) => void,
): void {
  storageChecks.set(field, check);
}
