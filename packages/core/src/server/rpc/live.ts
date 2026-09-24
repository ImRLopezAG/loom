import { AsyncIteratorClass, call, ORPCError, os, Procedure, type as schemaType } from "@orpc/server";
import type { AnySchema, ErrorMap, InferSchemaInput, InferSchemaOutput } from "@orpc/server";
import type { createRevisionCoordinator } from "../realtime/coordinator";
import { Context } from "effect";
import { Invocation } from "../effect/runtime";
import type { ProcedureContext } from "./procedure";
import { getClientMode } from "./procedure";
import { getDatabasePolicy } from "./database";
import { evaluateSnapshot } from "./snapshot";

export type LiveProcedure<T> =
  T extends Procedure<ProcedureContext, infer Injected, infer Input, infer Output, infer Errors>
    ? ReturnType<typeof createLiveProcedure<Injected, Input, Output, Errors>>
    : never;

/** A live route owns one bounded latest-snapshot slot. Every reevaluation uses
 * the original finite procedure and its full authorization/transaction boundary. */
export function createLiveProcedure<
  Injected extends object,
  Input extends AnySchema,
  Output extends AnySchema,
  Errors extends ErrorMap,
>(
  procedure: Procedure<ProcedureContext, Injected, Input, Output, Errors>,
  coordinator: ReturnType<typeof createRevisionCoordinator>,
) {
  if (getClientMode(procedure) !== "live" || getDatabasePolicy(procedure) !== "read")
    throw new Error("Live procedures require live presentation and database-read authority");
  // SAFETY: equal input/output parameters select the native zero-argument overload.
  const typeArguments = [] as Parameters<typeof schemaType<InferSchemaInput<Input>>>;
  const outer = os
    .$context<ProcedureContext>()
    .input(schemaType<InferSchemaInput<Input>>(...typeArguments))
    .errors(procedure["~orpc"].errorMap)
    .handler(({ input, context, signal: callerSignal, path }) => {
      const signal = callerSignal ? AbortSignal.any([callerSignal, context.signal]) : context.signal;
      signal.throwIfAborted();
      if (!context.expiresAt) throw new ORPCError("UNAUTHORIZED");
      const capturedInput = structuredClone(input);
      let pending: { value: InferSchemaOutput<Output> } | undefined;
      let failure: unknown;
      let closed = false;
      let wake: (() => void) | undefined;
      const subscription = coordinator.subscribe(
        { expiresAt: context.expiresAt },
        {
          evaluate: (evaluationSignal) =>
            evaluateSnapshot(() =>
              call(procedure, structuredClone(capturedInput), {
                context: {
                  ...context,
                  signal: evaluationSignal,
                  "effect/context": Context.add(context["effect/context"], Invocation, {
                    ...context,
                    signal: evaluationSignal,
                  }),
                },
                signal: evaluationSignal,
                path,
              }),
            ),
          publish(value) {
            if (closed || signal.aborted) return false;
            pending = { value };
            wake?.();
            return true;
          },
          close(reason, error) {
            closed = true;
            pending = undefined;
            if (reason !== "UNSUBSCRIBED" && reason !== "STOPPED")
              failure =
                error instanceof ORPCError
                  ? error
                  : new ORPCError(reason === "AUTH_EXPIRED" ? "UNAUTHORIZED" : "INTERNAL_SERVER_ERROR");
            wake?.();
          },
        },
      );
      const abort = () => {
        void subscription.unsubscribe();
      };
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
      return new AsyncIteratorClass<InferSchemaOutput<Output>, void, void>(
        async () => {
          while (!closed && !pending)
            await new Promise<void>((resolve) => {
              wake = resolve;
            });
          wake = undefined;
          if (failure) throw failure;
          if (closed || signal.aborted) return { done: true, value: undefined };
          const next = pending;
          pending = undefined;
          if (!next) throw new Error("Missing live snapshot");
          return { done: false, value: next.value };
        },
        async () => {
          signal.removeEventListener("abort", abort);
          await subscription.unsubscribe();
        },
      );
    });
  // Preserve contract input schemas for tooling. The inner procedure validates
  // and transforms raw input exactly once per authorized evaluation.
  return new Procedure({
    ...outer["~orpc"],
    inputSchemas: procedure["~orpc"].inputSchemas,
    disableInputValidation: true,
    meta: procedure["~orpc"].meta,
    metaPlugins: procedure["~orpc"].metaPlugins,
  });
}
