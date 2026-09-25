import { useMutation, useQuery, useSuspenseQuery } from "@loom/core/react";
import { skipToken } from "@tanstack/react-query";
import { createRpcQueryMethod, createRpcLiveMethod, createRpcMutationMethod } from "@loom/core/query";
import type { RpcQueryBinding } from "@loom/core/query";
import type { Client } from "@orpc/client";
declare const binding: RpcQueryBinding;
declare const read: Client<Record<never, never>, { id: string }, { at: Date; count: bigint }, Error>;
declare const live: Client<
  Record<never, never>,
  { id: string },
  AsyncIteratorObject<{ at: Date; count: bigint }, void, void>,
  Error
>;
declare const write: Client<Record<never, never>, { value: number }, bigint, Error>;
const api = {
  read: createRpcQueryMethod(read, binding, ["read"]),
  live: createRpcLiveMethod(live, binding, ["live"]),
  write: createRpcMutationMethod(write, binding, ["write"]),
};
export function useRpcFixture() {
  const options = api.read({
    input: { id: "one" },
    staleTime: 50,
    retry: 1,
    placeholderData: { at: new Date(), count: 1n },
  });
  const output: { at: Date; count: bigint } | undefined = useQuery(options).data;
  const selected: number | undefined = useQuery(
    api.live({ input: { id: "one" }, select: (row) => row.at.getTime(), enabled: true }),
  ).data;
  const seeded: bigint = useQuery(api.live({ input: { id: "one" }, initialData: { at: new Date(), count: 1n } })).data
    .count;
  const cached: typeof output = binding.queryClient.getQueryData(options.queryKey);
  const suspense: Date = useSuspenseQuery(options).data.at;
  useQuery(api.live({ input: skipToken }));
  const mutation = useMutation(
    api.write({
      onMutate: (input) => ({ previous: input.value }),
      onSuccess: (result, input, context) => {
        const r: bigint = result;
        const i: number = input.value;
        const c: number = context.previous;
        void [r, i, c];
      },
    }),
  );
  const result: Promise<bigint> = mutation.mutateAsync({ value: 1 });
  void [output, selected, seeded, cached, suspense, result];
  // @ts-expect-error native input type is retained
  api.read({ input: { id: 1 } });
  // @ts-expect-error convenience transport cannot be replaced
  api.read({ input: { id: "one" }, queryFn: async () => ({ at: new Date(), count: 1n }) });
  // @ts-expect-error convenience mutation transport cannot be replaced
  api.write({ mutationFn: async () => 1n });
  // @ts-expect-error mutation input is retained
  mutation.mutate({ value: "bad" });
}
