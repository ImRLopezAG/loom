import type { StandardSchemaV1 } from "@standard-schema/spec";
import * as v from "valibot";
import type { FunctionKind, FunctionVisibility } from "../../client/reference";
import type { JsonValue } from "../../schema/fields";
import { wire } from "../../validation/encoding";
import type { RegisteredFunction } from "./definition";
import type { FunctionContext } from "./definition";
import type { AnyRelations } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { runFunctionTransaction } from "../transactions";
import type { TransactionOptions } from "../transactions";

export class FunctionValidationError extends Error {
  constructor(
    readonly phase: "arguments" | "result",
    options?: ErrorOptions,
  ) {
    super(`Invalid function ${phase}`, options);
  }
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
export async function executeDatabaseFunction<
  Relations extends AnyRelations,
  Kind extends "query" | "mutation",
  Visibility extends FunctionVisibility,
  Args extends StandardSchemaV1,
  Returns extends StandardSchemaV1,
>(
  db: NodePgDatabase<Relations>,
  definition: RegisteredFunction<Kind, Visibility, Args, Returns, FunctionContext>,
  input: JsonValue,
  options: TransactionOptions = {},
): Promise<JsonValue> {
  options.signal?.throwIfAborted();
  const invoke = await prepareFunction(definition, input);
  return runFunctionTransaction(db, definition.kind, (tx) => invoke({ db: tx }), options);
}
