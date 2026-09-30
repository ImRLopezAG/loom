import type { AnyRelations, TableRelationalConfig } from "drizzle-orm";
import { One, Relation, is } from "drizzle-orm";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { SchemaDefinition } from "../schema/define-schema";
import type { SearchDescriptor, SearchPolicy, SchemaSearchProjector } from "./types";
import type { SearchPublicNode } from "./public";
import { validSearchSelection } from "./public";
import * as v from "valibot";

interface SearchSchema extends SchemaDefinition {
  readonly validators: object;
}
export type SearchTableFactories<Graph extends AnyRelations, Table extends TableRelationalConfig> = {
  readonly search: <const Policy extends SearchPolicy<Graph, Table>>(
    policy: Policy,
  ) => SearchDescriptor<SchemaSearchProjector<Graph, Table, Policy>>;
};
export type SearchValidators<Schema extends { readonly validators: object }, Graph extends AnyRelations> = {
  readonly [Name in keyof Schema["validators"]]: Schema["validators"][Name] &
    (Name extends keyof Graph ? SearchTableFactories<Graph, Graph[Name]> : object);
};
const searchNode = Symbol.for("loom.search.public-node.v1");
const field = v.object({
  kind: v.picklist([
    "text",
    "boolean",
    "integer",
    "bigint",
    "numeric",
    "uuid",
    "timestamp",
    "json",
    "enum",
    "reference",
  ]),
  notNull: v.boolean(),
  unique: v.boolean(),
  enumValues: v.optional(v.array(v.string())),
  precision: v.optional(v.number()),
  scale: v.optional(v.number()),
});
const nodeSchema: v.GenericSchema<SearchPublicNode> = v.lazy(() =>
  v.object({
    columns: v.record(v.string(), v.union([v.literal("_id"), v.literal("_createdAt"), field])),
    relations: v.record(v.string(), v.object({ many: v.boolean(), optional: v.boolean(), node: nodeSchema })),
  }),
);
/** Descriptor metadata survives isolated installs and multiple package copies. */
export function searchPublicNode(schema: StandardSchemaV1 | undefined) {
  if (!schema || !(searchNode in schema)) return undefined;
  return v.parse(nodeSchema, schema[searchNode]);
}
const policySchema = v.object({
  columns: v.array(v.string()),
  scope: v.literal("public"),
  relations: v.optional(v.record(v.string(), v.unknown())),
});
const envelope = v.object({
  rows: v.array(v.object({})),
  nextCursor: v.nullable(v.string()),
  previousCursor: v.nullable(v.string()),
});

/** Bind descriptor factories only after the project's native graph exists. */
export function createSearchValidators<Schema extends SearchSchema, Graph extends AnyRelations>(
  schema: Schema,
  graph: Graph,
): SearchValidators<Schema, Graph> {
  const entries = Object.entries(schema.validators).map(([name, validators]) => [
    name,
    Object.freeze({
      ...validators,
      search(policy: v.InferInput<typeof policySchema>) {
        const node = compileNode(name, policy, 0);
        const input: StandardSchemaV1 = {
          "~standard": {
            version: 1,
            vendor: "loom",
            validate(value) {
              return validSearchSelection(node, value)
                ? { value }
                : { issues: [{ message: "Invalid search selection" }] };
            },
          },
        };
        const output: StandardSchemaV1 = {
          "~standard": {
            version: 1,
            vendor: "loom",
            validate(value) {
              const result = v.safeParse(envelope, value);
              return result.success ? { value } : { issues: [{ message: "Invalid search page" }] };
            },
          },
        };
        Object.defineProperty(input, searchNode, { value: node });
        Object.defineProperty(output, searchNode, { value: node });
        return Object.freeze({ input, output });
      },
    }),
  ]);

  function compileNode(name: string, value: v.InferInput<typeof policySchema>, depth: number): SearchPublicNode {
    if (depth > 4) throw new Error("Search relation depth exceeds four");
    const policy = v.parse(policySchema, value);
    const table = graph[name];
    const entity = schema.metadata.entities.find((entity) => entity.name === name);
    if (!table || !entity || !policy.columns.length || new Set(policy.columns).size !== policy.columns.length)
      throw new Error("Invalid search table or columns");
    const columns: Record<string, SearchPublicNode["columns"][string]> = {};
    for (const name of policy.columns) {
      if (name === "_id" || name === "_createdAt") {
        columns[name] = name;
        continue;
      }
      const field = entity.fields.find((field) => field.name === name);
      if (!field) throw new Error(`Unknown search column: ${name}`);
      columns[name] = {
        kind: field.kind,
        notNull: field.notNull,
        unique: false,
        enumValues: field.enumValues,
        precision: field.precision,
        scale: field.scale,
      };
    }
    const relations: Record<string, SearchPublicNode["relations"][string]> = {};
    for (const [name, child] of Object.entries(policy.relations ?? {})) {
      const relation = table.relations[name];
      if (!is(relation, Relation)) throw new Error(`Unknown search relation: ${name}`);
      relations[name] = {
        many: !is(relation, One),
        optional: is(relation, One) && relation.optional,
        node: compileNode(relation.targetTableName, v.parse(policySchema, child), depth + 1),
      };
    }
    return Object.freeze({ columns: Object.freeze(columns), relations: Object.freeze(relations) });
  }
  // SAFETY: each existing table validator is retained and its factory is bound to
  // that same table's validated graph. Runtime schemas enforce the policy mask.
  return Object.freeze(Object.fromEntries(entries)) as SearchValidators<Schema, Graph>;
}
