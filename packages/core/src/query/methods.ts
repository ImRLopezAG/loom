import { experimental_streamedQuery, mutationOptions, queryOptions } from "@tanstack/react-query";
import type {
  DefinedInitialDataOptions,
  UnusedSkipTokenOptions,
  UseMutationOptions,
  QueryKeyWithDataTag,
  MutationFunctionContext,
} from "@tanstack/react-query";
import type { FunctionReference } from "../client/reference";
import { LoomClientError } from "../client/transport";
import type { CallOptions, WireValue } from "../client/transport";
import { canonical } from "../validation/canonical";
import { wire } from "../validation/encoding";
import * as v from "valibot";
import { runtimeFor } from "./runtime";
import { snapshots } from "./stream";

type Key = readonly ["loom", string, string, string, "live" | "finite"];
type Options<Input, Output, Selected, Defined extends boolean> = Omit<
  Defined extends true
    ? DefinedInitialDataOptions<WireValue<Output>, LoomClientError, Selected, Key>
    : UnusedSkipTokenOptions<WireValue<Output>, LoomClientError, Selected, Key>,
  "queryKey" | "queryFn"
> & { readonly input: Input; readonly live?: boolean };
type Result<Output, Selected, Defined extends boolean> = (Defined extends true
  ? DefinedInitialDataOptions<WireValue<Output>, LoomClientError, Selected, Key>
  : UnusedSkipTokenOptions<WireValue<Output>, LoomClientError, Selected, Key>) &
  QueryKeyWithDataTag<Key, WireValue<Output>, LoomClientError>;
export interface QueryMethod<Input, Output> extends FunctionReference<"query", "public", Input, Output> {
  <Selected = WireValue<Output>>(options: Options<Input, Output, Selected, true>): Result<Output, Selected, true>;
  <Selected = WireValue<Output>>(options: Options<Input, Output, Selected, false>): Result<Output, Selected, false>;
}
export function createQueryMethod<Input, Output>(
  reference: FunctionReference<"query", "public", Input, Output>,
): QueryMethod<Input, Output> {
  function method<Selected = WireValue<Output>>(
    options: Options<Input, Output, Selected, true>,
  ): Result<Output, Selected, true>;
  function method<Selected = WireValue<Output>>(
    options: Options<Input, Output, Selected, false>,
  ): Result<Output, Selected, false>;
  function method<Selected = WireValue<Output>>({
    input,
    live = true,
    ...options
  }: Options<Input, Output, Selected, false>): Result<Output, Selected, true> | Result<Output, Selected, false> {
    const encoded = v.safeParse(wire, input);
    if (!encoded.success) throw new LoomClientError("INVALID_ARGUMENTS", "Arguments must use supported wire values");
    const captured = structuredClone(input);
    const queryKey: Key = [
      "loom",
      reference.version,
      reference.name,
      canonical(encoded.output),
      live ? "live" : "finite",
    ];
    return queryOptions<WireValue<Output>, LoomClientError, Selected, Key>({
      staleTime: live ? Infinity : 0,
      refetchOnMount: live ? "always" : true,
      retry: false,
      ...options,
      queryKey,
      queryFn: async (context) => {
        const runtime = runtimeFor(context.client);
        const signal = AbortSignal.any([context.signal, runtime.signal]);
        if (!live) return runtime.client.call(reference, captured, { signal, identityKey: runtime.identity });
        const stream = experimental_streamedQuery({
          streamFn: () => snapshots(runtime.live.query(reference, captured), signal),
          reducer: (_previous: WireValue<Output> | undefined, value: WireValue<Output>) => value,
          // The stream never publishes this seed: its first snapshot replaces it before success.
          initialValue: undefined,
        });
        const value = await stream(context);
        if (value === undefined) throw new LoomClientError("EMPTY_STREAM", "The live query ended without a result");
        return value;
      },
    });
  }
  return attachReference(method, reference);
}
export type MutationMethod<
  Input,
  Output,
  Kind extends "mutation" | "action" = "mutation" | "action",
> = FunctionReference<Kind, "public", Input, Output> & {
  <Context = unknown>(
    options?: Omit<
      UseMutationOptions<WireValue<Output>, LoomClientError, Input, Context>,
      "mutationFn" | "mutationKey"
    >,
  ): ReturnType<typeof mutationOptions<WireValue<Output>, LoomClientError, Input, Context>>;
};
export function createMutationMethod<Input, Output>(
  reference: FunctionReference<"mutation" | "action", "public", Input, Output>,
): MutationMethod<Input, Output> {
  const keys = new WeakMap<MutationFunctionContext, string>();
  function method<Context = unknown>(
    options: Omit<
      UseMutationOptions<WireValue<Output>, LoomClientError, Input, Context>,
      "mutationFn" | "mutationKey"
    > = {},
  ) {
    return mutationOptions<WireValue<Output>, LoomClientError, Input, Context>({
      retry: false,
      ...options,
      mutationKey: ["loom", reference.version, reference.name],
      mutationFn: async (input, context) => {
        const runtime = runtimeFor(context.client);
        let idempotencyKey = keys.get(context);
        if (reference.kind === "mutation" && !idempotencyKey) {
          idempotencyKey = crypto.randomUUID();
          keys.set(context, idempotencyKey);
        }
        const callOptions: CallOptions = { signal: runtime.signal, identityKey: runtime.identity };
        const value = await runtime.client.call(
          reference,
          input,
          idempotencyKey === undefined ? callOptions : { ...callOptions, idempotencyKey },
        );
        runtimeFor(context.client);
        return value;
      },
    });
  }
  return attachReference(method, reference);
}

function attachReference<Method extends object, Reference extends { readonly name: string }>(
  method: Method,
  reference: Reference,
): Method & Reference {
  // Function.name needs to become writable before assigning generated reference metadata.
  Object.defineProperty(method, "name", { writable: true, enumerable: true, configurable: true });
  return Object.freeze(Object.assign(method, reference));
}
