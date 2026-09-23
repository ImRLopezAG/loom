import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FunctionKind, FunctionVisibility } from "../../client/reference";
import type { JsonValue } from "../../schema/fields";
import { prepareFunction } from "./execution";
import type { InvocationContext } from "../auth/context";

import type { FunctionScheduler } from "../jobs/scheduler";

export interface FunctionContext extends InvocationContext {
  readonly db: NodePgDatabase;
  readonly scheduler: FunctionScheduler;
}
export type ActionContext = InvocationContext;
export interface ExecutableFunction<Kind extends FunctionKind, Context> extends FunctionMetadata {
  readonly kind: Kind;
  prepare(input: JsonValue): Promise<(context: Context) => Promise<JsonValue>>;
}
export type RuntimeFunction =
  | ExecutableFunction<"query", FunctionContext>
  | ExecutableFunction<"mutation", FunctionContext>
  | ExecutableFunction<"action", ActionContext>;
export interface FunctionOptions<Args extends StandardSchemaV1, Returns extends StandardSchemaV1, Context> {
  readonly args: Args;
  readonly returns: Returns;
  readonly handler: (
    context: Context,
    args: StandardSchemaV1.InferOutput<Args>,
  ) => StandardSchemaV1.InferInput<Returns> | Promise<StandardSchemaV1.InferInput<Returns>>;
}
export interface FunctionMetadata {
  readonly kind: FunctionKind;
  readonly visibility: FunctionVisibility;
  readonly args: StandardSchemaV1;
  readonly returns: StandardSchemaV1;
}

export class RegisteredFunction<
  Kind extends FunctionKind,
  Visibility extends FunctionVisibility,
  Args extends StandardSchemaV1,
  Returns extends StandardSchemaV1,
  Context,
> implements FunctionMetadata {
  readonly args: Args;
  readonly returns: Returns;
  readonly handler: FunctionOptions<Args, Returns, Context>["handler"];
  constructor(
    readonly kind: Kind,
    readonly visibility: Visibility,
    options: FunctionOptions<Args, Returns, Context>,
  ) {
    this.args = options.args;
    this.returns = options.returns;
    this.handler = options.handler;
    Object.freeze(this);
  }
  prepare(input: JsonValue): Promise<(context: Context) => Promise<JsonValue>> {
    return prepareFunction(this, input);
  }
}

function registration<Kind extends FunctionKind, Visibility extends FunctionVisibility>(
  kind: Kind,
  visibility: Visibility,
) {
  return <Args extends StandardSchemaV1, Returns extends StandardSchemaV1>(
    options: FunctionOptions<Args, Returns, Kind extends "action" ? ActionContext : FunctionContext>,
  ) => new RegisteredFunction(kind, visibility, options);
}
export const query = registration("query", "public");
export const mutation = registration("mutation", "public");
export const action = registration("action", "public");
export const internalQuery = registration("query", "internal");
export const internalMutation = registration("mutation", "internal");
export const internalAction = registration("action", "internal");

export function isRegisteredFunction(value: unknown): value is RuntimeFunction {
  return value instanceof RegisteredFunction;
}
