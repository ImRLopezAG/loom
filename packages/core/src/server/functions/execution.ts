import type { StandardSchemaV1 } from "@standard-schema/spec";
import * as v from "valibot";
import type { FunctionKind, FunctionVisibility } from "../../client/reference";
import type { JsonValue } from "../../schema/fields";
import { wire } from "../../validation/encoding";
import type { RegisteredFunction } from "./definition";
import type { FunctionContext, ExecutableFunction } from "./definition";
import type { AnyRelations } from "drizzle-orm";
import type { DatabaseConnection } from "../database/connection";
import { captureInvocationGuard } from "../database/connection";
import { runFunctionTransaction } from "../transactions";
import type { TransactionOptions } from "../transactions";
import { bindDatabaseIdentity, captureJobInvocation } from "../auth/context";
import type { InvocationIdentity, JobInvocation } from "../auth/context";
import type { RevisionReader, TableRevisions } from "../realtime/revisions";

interface ExecutionScope {
  readonly kind: "query" | "mutation";
  readonly assertCurrent: () => void;
  readonly pending: Set<Promise<JsonValue>>;
  active: boolean;
  failure?: Error;
}
const scopes = new WeakMap<FunctionContext, ExecutionScope>();

export class FunctionValidationError extends Error {
  constructor(
    readonly phase: "arguments" | "result",
    options?: ErrorOptions,
  ) {
    super(`Invalid function ${phase}`, options);
  }
}
export interface DatabaseExecutionOptions extends TransactionOptions {
  readonly identity?: InvocationIdentity | null;
  readonly job?: JobInvocation | undefined;
  readonly requestId?: string;
  readonly authorize?: (context: FunctionContext) => Promise<void>;
  readonly replay?: ((db: FunctionContext["db"], invoke: () => Promise<JsonValue>) => Promise<JsonValue>) | undefined;
}

/** Validate arguments before acquiring a transaction; validate and encode results inside its callback. */
export async function prepareFunction<
  Kind extends FunctionKind,
  Visibility extends FunctionVisibility,
  Args extends StandardSchemaV1,
  Returns extends StandardSchemaV1,
  Context,
>(
  definition: RegisteredFunction<Kind, Visibility, Args, Returns, Context>,
  input: JsonValue,
): Promise<(context: Context) => Promise<JsonValue>> {
  const snapshot = structuredClone(input);
  async function validateArguments() {
    try {
      const args = await definition.args["~standard"].validate(structuredClone(snapshot));
      if (args.issues) throw new FunctionValidationError("arguments");
      return args;
    } catch (cause) {
      if (cause instanceof FunctionValidationError) throw cause;
      throw new FunctionValidationError("arguments", { cause });
    }
  }
  let prepared: Awaited<ReturnType<typeof validateArguments>> | undefined = await validateArguments();
  return async (context) => {
    const initial = prepared;
    prepared = undefined;
    const args = initial ?? (await validateArguments());
    // SAFETY: the successful Standard Schema result is the output declared by this exact argument validator.
    const value = args.value as StandardSchemaV1.InferOutput<Args>;
    const result = await definition.handler(context, value);
    try {
      const checked = await definition.returns["~standard"].validate(result);
      if (checked.issues) throw new FunctionValidationError("result");
      const encoded = v.safeParse(wire, checked.value);
      if (!encoded.success) throw new FunctionValidationError("result");
      return encoded.output;
    } catch (cause) {
      if (cause instanceof FunctionValidationError) throw cause;
      throw new FunctionValidationError("result", { cause });
    }
  };
}

/** Trusted server execution. Public route visibility and identity checks belong to the dispatcher. */
export async function executeDatabaseFunction<Relations extends AnyRelations>(
  connection: DatabaseConnection<Relations>,
  definition: ExecutableFunction<"query" | "mutation", FunctionContext>,
  input: JsonValue,
  options: DatabaseExecutionOptions = {},
): Promise<JsonValue> {
  return executeDatabaseOperation(connection, definition, input, options, async (_context, value) => value);
}

export interface QuerySnapshot {
  readonly value: JsonValue;
  readonly revisions: TableRevisions;
}

/** Trusted runtime primitive. Public visibility/version checks belong to the dispatcher. */
export async function evaluateDatabaseQuery<Relations extends AnyRelations>(
  connection: DatabaseConnection<Relations>,
  definition: ExecutableFunction<"query", FunctionContext>,
  input: JsonValue,
  revisions: RevisionReader,
  options: DatabaseExecutionOptions & { readonly authorize: (context: FunctionContext) => Promise<void> },
): Promise<QuerySnapshot> {
  if (definition.kind !== "query" || options.replay) throw new Error("Live evaluation requires a query");
  return executeDatabaseOperation(connection, definition, input, options, async (context, value) => ({
    value,
    revisions: await revisions(context.db),
  }));
}

async function executeDatabaseOperation<Relations extends AnyRelations, Result>(
  connection: DatabaseConnection<Relations>,
  definition: ExecutableFunction<"query" | "mutation", FunctionContext>,
  input: JsonValue,
  options: DatabaseExecutionOptions,
  capture: (context: FunctionContext, value: JsonValue) => Promise<Result>,
): Promise<Result> {
  options.signal?.throwIfAborted();
  const identity = options.identity ? Object.freeze(structuredClone(options.identity)) : null;
  const requestId = options.requestId ?? crypto.randomUUID();
  const job = captureJobInvocation(options.job);
  const signal = options.signal ?? new AbortController().signal;
  const invoke = await definition.prepare(input);
  return runFunctionTransaction(
    connection,
    definition.kind,
    async (tx) => {
      const context = Object.freeze({ db: tx, identity, requestId, signal, job });
      const scope: ExecutionScope = {
        kind: definition.kind,
        assertCurrent: captureInvocationGuard(),
        pending: new Set(),
        active: true,
      };
      scopes.set(context, scope);
      try {
        await bindDatabaseIdentity(tx, identity);
        await options.authorize?.(context);
        options.signal?.throwIfAborted();
        const result = options.replay ? await options.replay(context.db, () => invoke(context)) : await invoke(context);
        if (scope.pending.size) throw new Error("Internal mutations must be awaited");
        if (scope.failure) throw scope.failure;
        return await capture(context, result);
      } finally {
        scope.active = false;
        await Promise.allSettled(scope.pending);
        scopes.delete(context);
      }
    },
    options,
  );
}

/** Internal mutations share their parent's transaction. Any helper failure prevents the parent from committing. */
export function runInternalMutation<Args extends StandardSchemaV1, Returns extends StandardSchemaV1>(
  context: FunctionContext,
  definition: RegisteredFunction<"mutation", "internal", Args, Returns, FunctionContext>,
  input: JsonValue,
): Promise<JsonValue> {
  const scope = scopes.get(context);
  if (!scope?.active) return Promise.reject(new Error("Function invocation is inactive"));
  const operation = (async () => {
    scope.assertCurrent();
    if (scope.kind !== "mutation") throw new Error("Internal mutation requires a mutation invocation");
    if (definition.kind !== "mutation" || definition.visibility !== "internal")
      throw new Error("Expected an internal mutation");
    const invoke = await prepareFunction(definition, input);
    if (!scope.active) throw new Error("Function invocation is inactive");
    scope.assertCurrent();
    return invoke(context);
  })();
  scope.pending.add(operation);
  void operation.then(
    () => {
      scope.pending.delete(operation);
    },
    (cause) => {
      scope.failure ??= cause instanceof Error ? cause : new Error("Internal mutation failed", { cause });
      scope.pending.delete(operation);
    },
  );
  return operation;
}
