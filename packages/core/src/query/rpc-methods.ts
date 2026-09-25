import type { Client, ClientContext, MaybeOptionalOptions } from "@orpc/client";
import { ProcedureUtils, generateOperationKey } from "@orpc/tanstack-query";
import type { MutationOptionsIn, MutationOptionsOut, QueryOptionsIn, QueryOptionsOut } from "@orpc/tanstack-query";
import type { RpcQueryBinding } from "./rpc-session";

export type RpcQueryMethod<T> =
  T extends Client<infer C, infer I, infer O, infer E> ? ReturnType<typeof createRpcQueryMethod<C, I, O, E>> : never;
export type RpcMutationMethod<T> =
  T extends Client<infer C, infer I, infer O, infer E> ? ReturnType<typeof createRpcMutationMethod<C, I, O, E>> : never;
export type RpcLiveMethod<T> =
  T extends Client<infer C, infer I, AsyncIteratorObject<infer O, void, void>, infer E>
    ? ReturnType<typeof createRpcLiveMethod<C, I, O, E>>
    : never;

export interface RpcLiveCallable<C extends ClientContext, I, O, E> {
  <Select = O, Initial = undefined>(
    ...rest: MaybeOptionalOptions<QueryOptionsIn<C, I, O, E, Select, Initial> & { queryFn?: never }>
  ): NoInfer<QueryOptionsOut<O, E, Select, Initial>>;
  readonly native: ProcedureUtils<C, I, AsyncIteratorObject<O, void, void>, E>;
  readonly call: Client<C, I, AsyncIteratorObject<O, void, void>, E>;
  readonly snapshot: ReturnType<typeof createRpcQueryMethod<C, I, O, E>>;
}

/** Keep upstream inference and caller options. Only transport replacement is
 * reserved for the explicit native-utils escape hatch. */
export function createRpcQueryMethod<C extends ClientContext, I, O, E>(
  client: Client<C, I, O, E>,
  binding: RpcQueryBinding,
  path: string[],
) {
  const native = new ProcedureUtils(path, client, {
    queryInterceptors: [
      (options) => {
        binding.signal.throwIfAborted();
        if (options.fnContext.client !== binding.queryClient)
          throw new Error("Options belong to a different Loom QueryClient");
        return options.next();
      },
    ],
    queryKey: (options) => ({
      ...options,
      queryKey: binding.key(
        "finite",
        "queryKey" in options && options.queryKey
          ? options.queryKey
          : generateOperationKey<"query", unknown>(path, { type: "query", ...options }),
      ),
    }),
  });
  type Method = <Select = O, Initial = undefined>(
    ...rest: MaybeOptionalOptions<QueryOptionsIn<C, I, O, E, Select, Initial> & { queryFn?: never }>
  ) => NoInfer<QueryOptionsOut<O, E, Select, Initial>>;
  // SAFETY: this narrows one optional transport property; all remaining types are upstream.
  const method = ((...rest: Parameters<typeof native.queryOptions>) => {
    if (rest[0]?.queryFn !== undefined) throw new Error("Use native options to replace the transport");
    return native.queryOptions<unknown, unknown>(...rest);
  }) as Method;
  return Object.assign(method, { native, call: client });
}

export function createRpcLiveMethod<C extends ClientContext, I, O, E>(
  client: Client<C, I, AsyncIteratorObject<O, void, void>, E>,
  binding: RpcQueryBinding,
  path: string[],
): RpcLiveCallable<C, I, O, E> {
  const finite: Client<C, I, O, E> = async (...args) => {
    const stream = await client(...args);
    try {
      const first = await stream.next();
      if (first.done) throw new Error("Live query did not yield a snapshot");
      return first.value;
    } finally {
      await stream.return?.();
    }
  };
  const snapshot = createRpcQueryMethod(finite, binding, path);
  const native = new ProcedureUtils(path, client, {
    liveOptions: (options) => ({
      initialData: () =>
        binding.queryClient.getQueryData<O>(
          binding.key(
            "finite",
            options.queryKey ?? generateOperationKey<"query", unknown>(path, { type: "query", input: options.input }),
          ),
        ),
      ...options,
    }),
    liveInterceptors: [
      async (options) => {
        binding.signal.throwIfAborted();
        if (options.fnContext.client !== binding.queryClient)
          throw new Error("Options belong to a different Loom QueryClient");
        await binding.live.wait(options.fnContext.queryKey, options.fnContext.signal);
        options.fnContext.signal.throwIfAborted();
        return options.next();
      },
    ],
    liveKey: (options) => ({
      ...options,
      queryKey: binding.key(
        "live",
        "queryKey" in options && options.queryKey
          ? options.queryKey
          : generateOperationKey<"live", unknown>(path, { type: "live", ...options }),
      ),
    }),
  });
  // SAFETY: the callable narrows only transport replacement; attached helpers retain their upstream types.
  return Object.assign(
    (...rest: Parameters<typeof native.liveOptions>) => {
      if (rest[0]?.queryFn !== undefined) throw new Error("Use native options to replace the transport");
      return native.liveOptions<unknown, unknown>(...rest);
    },
    { native, call: client, snapshot },
  ) as RpcLiveCallable<C, I, O, E>;
}

export function createRpcMutationMethod<C extends ClientContext, I, O, E>(
  client: Client<C, I, O, E>,
  binding: RpcQueryBinding,
  path: string[],
) {
  const native = new ProcedureUtils(path, client, {
    mutationInterceptors: [
      (options) => {
        binding.signal.throwIfAborted();
        if (options.fnContext.client !== binding.queryClient)
          throw new Error("Options belong to a different Loom QueryClient");
        let key = binding.mutationKeys.get(options.fnContext);
        if (!key) {
          key = crypto.randomUUID();
          binding.mutationKeys.set(options.fnContext, key);
        }
        return options.next({ ...options, context: { ...options.context, idempotencyKey: key } });
      },
    ],
    mutationKey: (options) => ({
      ...options,
      mutationKey: binding.key("mutation", options.mutationKey ?? generateOperationKey(path, { type: "mutation" })),
    }),
    mutationOptions: (options) => ({ retry: false, ...options }),
  });
  type Method = <MutationContext = unknown>(
    ...rest: MaybeOptionalOptions<MutationOptionsIn<C, I, O, E, MutationContext> & { mutationFn?: never }>
  ) => NoInfer<MutationOptionsOut<I, O, E, MutationContext>>;
  // SAFETY: this narrows one optional transport property; all remaining types are upstream.
  const method = ((...rest: Parameters<typeof native.mutationOptions>) => {
    if (rest[0]?.mutationFn !== undefined) throw new Error("Use native options to replace the transport");
    return native.mutationOptions(...rest);
  }) as Method;
  return Object.assign(method, { native, call: client });
}
