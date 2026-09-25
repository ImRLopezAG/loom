import { useMutation, useQuery, useSuspenseQuery } from "@loom/core/react";
import { QueryClient, skipToken } from "@tanstack/react-query";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { Client } from "@orpc/client";
const queryClient = new QueryClient();
declare const read: Client<Record<never, never>, { id: string }, { at: Date; count: bigint }, Error>;
declare const live: Client<
  Record<never, never>,
  { id: string },
  AsyncIteratorObject<{ at: Date; count: bigint }, void, void>,
  Error
>;
declare const write: Client<Record<never, never>, { value: number }, bigint, Error>;
const api = createTanstackQueryUtils({ read, live, write });
export function useRpcFixture() {
  const options = api.read.queryOptions({
    input: { id: "one" },
    staleTime: 50,
    retry: 1,
    placeholderData: { at: new Date(), count: 1n },
  });
  const output: { at: Date; count: bigint } | undefined = useQuery(options).data;
  const selected: number | undefined = useQuery(
    api.live.liveOptions({ input: { id: "one" }, select: (row) => row.at.getTime(), enabled: true }),
  ).data;
  const seeded: bigint = useQuery(
    api.live.liveOptions({ input: { id: "one" }, initialData: { at: new Date(), count: 1n } }),
  ).data.count;
  const cached: typeof output = queryClient.getQueryData(options.queryKey);
  const suspense: Date = useSuspenseQuery(options).data.at;
  useQuery(api.live.liveOptions({ input: skipToken }));
  const mutation = useMutation(
    api.write.mutationOptions({
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
  api.read.queryOptions({ input: { id: 1 } });
  api.read.queryOptions({ input: { id: "one" }, queryFn: async () => ({ at: new Date(), count: 1n }) });
  api.write.mutationOptions({ mutationFn: async () => 1n });
  // @ts-expect-error mutation input is retained
  mutation.mutate({ value: "bad" });
}

// Native serialization preserves branded IDs through raw calls and query results.
declare const identified: Client<
  Record<never, never>,
  undefined,
  { id: import("@loom/core/server").Id<"projects"> },
  Error
>;
const identifiedRead = createTanstackQueryUtils({ identified }).identified;
const identifiedCall: Promise<{ id: import("@loom/core/server").Id<"projects"> }> = identified();
const identifiedCache: { id: import("@loom/core/server").Id<"projects"> } | undefined = queryClient.getQueryData(
  identifiedRead.queryOptions().queryKey,
);
void [identifiedCall, identifiedCache];
