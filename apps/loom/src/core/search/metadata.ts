import { getAsyncIteratorObjectSchemaDetails } from "@orpc/contract";
import type { AnySchema, AnyProcedureContract } from "@orpc/contract";
import type { AnyRelations, TableRelationalConfig, SQL } from "drizzle-orm";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { InvocationIdentity } from "../server/auth/context";
import type { SearchPublicNode } from "./public";
import type { SearchBudgets } from "./types";
import * as v from "valibot";

export interface RuntimeSearchScope {
  readonly name: string;
  readonly version: string;
  readonly where: (context: {
    readonly table: TableRelationalConfig["table"];
    readonly identity: InvocationIdentity | null;
  }) => SQL;
}
export interface SearchRuntimeNode {
  readonly entity: string;
  readonly public: SearchPublicNode;
  readonly scope: "public" | RuntimeSearchScope;
  readonly through: Readonly<Record<string, "public" | RuntimeSearchScope>>;
  readonly relations: Readonly<Record<string, SearchRuntimeNode>>;
}
/** Private server identity shared by a descriptor's matching schemas. */
export interface SearchRuntimeDescriptor {
  readonly id: symbol;
  readonly entity: string;
  readonly graph: AnyRelations;
  readonly schemaFingerprint: string;
  readonly fingerprint: string;
  readonly node: SearchRuntimeNode;
  readonly budgets: SearchBudgets;
  readonly mode: "finite" | "live";
}
interface SearchSchemaMetadata {
  readonly descriptor: SearchRuntimeDescriptor;
  readonly role: "input" | "output";
}
const key = Symbol.for("loom.search.descriptor.v1");
const metadataParser = v.custom<SearchSchemaMetadata>((value) =>
  v.is(
    v.object({
      role: v.picklist(["input", "output"]),
      descriptor: v.object({
        id: v.symbol(),
        entity: v.string(),
        graph: v.object({}),
        schemaFingerprint: v.string(),
        fingerprint: v.string(),
        node: v.object({}),
        budgets: v.object({}),
        mode: v.picklist(["finite", "live"]),
      }),
    }),
    value,
  ),
);
export function attachSearchMetadata(
  schema: StandardSchemaV1,
  descriptor: SearchRuntimeDescriptor,
  role: SearchSchemaMetadata["role"],
) {
  Object.defineProperty(schema, key, { value: Object.freeze({ descriptor, role }) });
}
export function searchSchemaMetadata(schema: AnySchema | undefined) {
  if (!schema || !(key in schema)) return undefined;
  return v.parse(metadataParser, schema[key]);
}
/** Resolve native iterator schemas without inspecting third-party validator ASTs. */
export function searchContractDescriptor(
  procedure: Pick<AnyProcedureContract, "~orpc">,
): SearchRuntimeDescriptor | undefined {
  const inputs = procedure["~orpc"].inputSchemas ?? [];
  const outputs = procedure["~orpc"].outputSchemas ?? [];
  const inputMetadata = inputs.map(searchSchemaMetadata).filter((value) => value !== undefined);
  const outputMetadata = outputs.map((schema) => {
    const iterator = getAsyncIteratorObjectSchemaDetails(schema);
    return { metadata: searchSchemaMetadata(iterator?.yieldSchema ?? schema), streaming: iterator !== undefined };
  });
  if (!inputMetadata.length && !outputMetadata.some(({ metadata }) => metadata)) return undefined;
  const input = inputMetadata[0];
  const output = outputMetadata[0];
  if (
    inputs.length !== 1 ||
    outputs.length !== 1 ||
    inputMetadata.length !== 1 ||
    !input ||
    !output?.metadata ||
    input.role !== "input" ||
    output.metadata.role !== "output" ||
    input.descriptor !== output.metadata.descriptor ||
    output.streaming !== (input.descriptor.mode === "live")
  )
    throw new Error("Search contract requires matching input/output descriptor identity and mode");
  return input.descriptor;
}
