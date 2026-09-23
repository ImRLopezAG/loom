import type { AnyRelations, EmptyRelations } from "drizzle-orm";
import { assertDatabaseRelations } from "../database/context";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FunctionKind, FunctionVisibility } from "../../client/reference";
import type { JsonValue } from "../../schema/fields";
import { prepareFunction } from "./execution";
import type { InvocationContext } from "../auth/context";

import type { FunctionScheduler } from "../jobs/scheduler";

export interface FunctionContext<Relations extends AnyRelations = EmptyRelations> extends InvocationContext {
  readonly db: NodePgDatabase<Relations>;
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

function actionRegistration<Visibility extends FunctionVisibility>(visibility: Visibility) {
  return <Args extends StandardSchemaV1, Returns extends StandardSchemaV1>(
    options: FunctionOptions<Args, Returns, ActionContext>,
  ) => new RegisteredFunction("action", visibility, options);
}
function databaseRegistration<Kind extends "query" | "mutation", Visibility extends FunctionVisibility>(
  kind: Kind,
  visibility: Visibility,
) {
  function register<Args extends StandardSchemaV1, Returns extends StandardSchemaV1, Relations extends AnyRelations>(
    options: FunctionOptions<Args, Returns, FunctionContext<Relations>> & { readonly relations: Relations },
  ): RegisteredFunction<Kind, Visibility, Args, Returns, FunctionContext>;
  function register<Args extends StandardSchemaV1, Returns extends StandardSchemaV1>(
    options: FunctionOptions<Args, Returns, FunctionContext>,
  ): RegisteredFunction<Kind, Visibility, Args, Returns, FunctionContext>;
  function register<Args extends StandardSchemaV1, Returns extends StandardSchemaV1, Relations extends AnyRelations>(
    options: FunctionOptions<Args, Returns, FunctionContext<Relations>> & { readonly relations?: Relations },
  ): RegisteredFunction<Kind, Visibility, Args, Returns, FunctionContext> {
    const { relations, handler } = options;
    return new RegisteredFunction(kind, visibility, {
      args: options.args,
      returns: options.returns,
      handler: (context: FunctionContext, args) => {
        if (relations !== undefined) assertDatabaseRelations(context.db, relations);
        // SAFETY: relation-aware registrations verify the exact relation declaration used by the active transaction.
        // The overload without relations only accepts the default unparameterized context.
        return handler(context as FunctionContext<Relations>, args);
      },
    });
  }
  return register;
}
export const query = databaseRegistration("query", "public");
export const mutation = databaseRegistration("mutation", "public");
export const action = actionRegistration("public");
export const internalQuery = databaseRegistration("query", "internal");
export const internalMutation = databaseRegistration("mutation", "internal");
export const internalAction = actionRegistration("internal");

export function isRegisteredFunction(value: unknown): value is RuntimeFunction {
  return value instanceof RegisteredFunction;
}
