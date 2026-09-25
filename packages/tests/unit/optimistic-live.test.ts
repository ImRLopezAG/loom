import { expect, it } from "vite-plus/test";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { MutationObserver, QueryClient } from "@tanstack/react-query";

it("native optimistic callbacks reconcile success and roll back a rejected write", async () => {
  let reject = false;
  const client = createORPCClient<{
    write: Client<Record<never, never>, number, number, Error>;
  }>({
    call: async (_path, input) => {
      if (reject) throw new Error("refused");
      return input;
    },
  });
  const rpc = createTanstackQueryUtils(client);
  const cache = new QueryClient();
  const key = ["counter"];
  cache.setQueryData(key, 1);
  const mutation = new MutationObserver(
    cache,
    rpc.write.mutationOptions({
      onMutate: async (value) => {
        await cache.cancelQueries({ queryKey: key });
        const previous = cache.getQueryData<number>(key);
        cache.setQueryData(key, value);
        return { previous };
      },
      onError: (_error, _input, rollback) => {
        cache.setQueryData(key, rollback?.previous);
      },
      onSuccess: (result) => {
        cache.setQueryData(key, result);
      },
      onSettled: () => cache.invalidateQueries({ queryKey: key }),
    }),
  );
  try {
    expect(await mutation.mutate(2)).toBe(2);
    expect(cache.getQueryData(key)).toBe(2);
    reject = true;
    await expect(mutation.mutate(3)).rejects.toThrow("refused");
    expect(cache.getQueryData(key)).toBe(2);
  } finally {
    cache.clear();
  }
});
