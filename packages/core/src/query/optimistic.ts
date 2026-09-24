import type { MutationObserverOptions, QueryKey } from "@tanstack/react-query";
import type { RpcQueryBinding } from "./rpc-session";
import type { OptimisticAttempt } from "./live-pause";

/** Mutation-cache observers can distinguish callback failures from failed writes. */
export class OptimisticCallbackError extends Error {
  constructor(
    readonly phase: "mutate" | "success" | "error" | "settled",
    readonly committed: boolean,
    cause: Error,
  ) {
    super(`Optimistic ${phase} callback failed: ${cause.message}`, { cause });
    this.name = "OptimisticCallbackError";
  }
}

/** Supply optimistic writes/rollback through native callbacks. For overlapping
 * edits prefer a mutation overlay; whole-cache rollback is application-owned. */
export function optimisticMutation<O, E, I, M>(
  binding: RpcQueryBinding,
  queries: (input: I) => readonly QueryKey[],
  options: MutationObserverOptions<O, E, I, M>,
): MutationObserverOptions<O, E, I, M> {
  // Native hooks replace options on render. Attempt ownership must survive that
  // replacement and remain local to the QueryClient's authenticated session.
  const attempts = binding.live.attempts;
  const mutationFn = options.mutationFn;
  const onMutate = options.onMutate;
  if (!mutationFn) throw new Error("Optimistic mutation requires native mutation options");
  const wrapped: MutationObserverOptions<O, E, I, M> = {
    ...options,
    async mutationFn(input, context) {
      if (context.client !== binding.queryClient) throw new Error("Options belong to a different Loom QueryClient");
      // Restored mutations skip onMutate; reacquire the pause before dispatch.
      let attempt = attempts.get(context);
      if (!attempt) {
        attempt = { settled: false, release: await binding.live.pause(queries(input)) };
        attempts.set(context, attempt);
      }
      const data = await mutationFn(input, context);
      attempt.committed = { data };
      return data;
    },
    async onSuccess(data, input, optimistic, context) {
      binding.signal.throwIfAborted();
      try {
        await options.onSuccess?.(data, input, optimistic, context);
      } catch (error) {
        throw new OptimisticCallbackError(
          "success",
          true,
          error instanceof Error ? error : new Error("Callback threw a non-error value"),
        );
      }
    },
    async onError(error, input, optimistic, context) {
      // TanStack also enters onError when a success callback throws. That is
      // not a failed server write and must not run an application rollback.
      if (!binding.signal.aborted && !attempts.get(context)?.committed) {
        try {
          await options.onError?.(error, input, optimistic, context);
        } catch (cause) {
          throw new OptimisticCallbackError(
            "error",
            false,
            cause instanceof Error ? cause : new Error("Callback threw a non-error value"),
          );
        }
      }
    },
    async onSettled(data, error, input, optimistic, context) {
      const attempt = attempts.get(context);
      if (attempt?.settled) return;
      if (attempt) attempt.settled = true;
      try {
        if (binding.signal.aborted) return;
        // SAFETY: TanStack's context object identifies this mutation invocation;
        // its result was recorded only after this typed mutation function succeeded.
        const committed = attempt?.committed?.data as O | undefined;
        await options.onSettled?.(
          attempt?.committed ? committed : data,
          attempt?.committed ? null : error,
          input,
          optimistic,
          context,
        );
      } catch (cause) {
        throw new OptimisticCallbackError(
          "settled",
          !!attempt?.committed,
          cause instanceof Error ? cause : new Error("Callback threw a non-error value"),
        );
      } finally {
        attempt?.release?.();
      }
    },
  };
  if (onMutate)
    wrapped.onMutate = async (input, context) => {
      if (context.client !== binding.queryClient) throw new Error("Options belong to a different Loom QueryClient");
      const attempt: OptimisticAttempt = { settled: false };
      attempts.set(context, attempt);
      attempt.release = await binding.live.pause(queries(input));
      try {
        return await onMutate(input, context);
      } catch (error) {
        attempt.release();
        throw new OptimisticCallbackError(
          "mutate",
          false,
          error instanceof Error ? error : new Error("Callback threw a non-error value"),
        );
      }
    };
  return wrapped;
}
