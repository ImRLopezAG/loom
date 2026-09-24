import { expect, it } from "vite-plus/test";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { MutationObserver, QueryObserver } from "@tanstack/react-query";
import {
  createRpcQuerySession,
  createRpcLiveMethod,
  createRpcMutationMethod,
  optimisticMutation,
} from "@loom/core/query";

type Router = {
  read: Client<Record<never, never>, undefined, AsyncIteratorObject<number, void, void>, Error>;
  write: Client<Record<never, never>, number, number, Error>;
};
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 10));
function fixture() {
  let reads = 0;
  let value = 0;
  const writes: ReturnType<typeof Promise.withResolvers<number>>[] = [];
  const emissions: (() => void)[] = [];
  const session = createRpcQuerySession({
    deployment: "test",
    version: "v1",
    identity: null,
    link: {
      call: async (path, _input, { signal }) => {
        if (path[0] === "write") {
          const write = Promise.withResolvers<number>();
          writes.push(write);
          value = await write.promise;
          return value;
        }
        reads++;
        return (async function* () {
          yield value;
          await new Promise<void>((resolve) => {
            emissions.push(resolve);
            signal?.addEventListener("abort", () => resolve(), { once: true });
          });
          yield -100; // An old queued emission must never overwrite optimistic data.
        })();
      },
    },
  });
  const raw = createORPCClient<Router>(session.link);
  const api = {
    read: createRpcLiveMethod(raw.read, session, ["read"]),
    write: createRpcMutationMethod(raw.write, session, ["write"]),
  };
  const options = api.read({ retry: false });
  const observer = new QueryObserver(session.queryClient, options);
  const unsubscribe = observer.subscribe(() => {});
  return {
    session,
    api,
    options,
    observer,
    writes,
    emissions,
    reads: () => reads,
    stop: () => {
      unsubscribe();
      session.dispose();
    },
  };
}

it("pauses every restart path and resumes only after overlapping optimistic mutations settle", async () => {
  const f = fixture();
  try {
    await tick();
    const options = optimisticMutation(
      f.session,
      () => [f.options.queryKey],
      f.api.write({
        onMutate: (input) => {
          f.session.queryClient.setQueryData(f.options.queryKey, input);
        },
      }),
    );
    const first = new MutationObserver(f.session.queryClient, options);
    const second = new MutationObserver(f.session.queryClient, options);
    const one = first.mutate(1);
    const two = second.mutate(2);
    await tick();
    expect(f.observer.getCurrentResult().data).toBe(2);
    void f.observer.refetch();
    void f.session.queryClient.invalidateQueries({ queryKey: f.options.queryKey });
    f.emissions[0]?.();
    await tick();
    expect(f.reads()).toBe(1);
    expect(f.observer.getCurrentResult().data).toBe(2);
    f.writes[0]!.resolve(1);
    await one;
    await tick();
    expect(f.reads()).toBe(1);
    f.writes[1]!.resolve(2);
    await two;
    await tick();
    expect(f.reads()).toBe(2);
    expect(f.observer.getCurrentResult().data).toBe(2);
  } finally {
    f.stop();
  }
});

it("reports a success callback failure without rolling back the committed write", async () => {
  const f = fixture();
  let rollbacks = 0;
  let settlements = 0;
  try {
    await tick();
    const options = optimisticMutation(
      f.session,
      () => [f.options.queryKey],
      f.api.write({
        onMutate: () => {
          f.session.queryClient.setQueryData(f.options.queryKey, 9);
        },
        onSuccess: () => {
          throw new Error("callback failed");
        },
        onError: () => {
          rollbacks++;
        },
        onSettled: (data, error) => {
          expect(data).toBe(9);
          expect(error).toBeNull();
          settlements++;
        },
      }),
    );
    const mutation = new MutationObserver(f.session.queryClient, options);
    const result = mutation.mutate(9);
    const rejected = expect(result).rejects.toThrow("callback failed");
    await tick();
    // React's useMutation replaces options after pending-state renders.
    mutation.setOptions(
      optimisticMutation(
        f.session,
        () => [f.options.queryKey],
        f.api.write<void>({
          onSuccess: () => {
            throw new Error("callback failed");
          },
          onError: () => {
            rollbacks++;
          },
          onSettled: (data, error) => {
            expect(data).toBe(9);
            expect(error).toBeNull();
            settlements++;
          },
        }),
      ),
    );
    f.writes[0]!.resolve(9);
    await rejected;
    await tick();
    expect(rollbacks).toBe(0);
    expect(settlements).toBe(1);
    expect(f.reads()).toBe(2);
    expect(f.observer.getCurrentResult().data).toBe(9);
  } finally {
    f.stop();
  }
});

it("does not run cache callbacks after the owning identity is disposed", async () => {
  const f = fixture();
  let callbacks = 0;
  try {
    await tick();
    const options = optimisticMutation(
      f.session,
      () => [f.options.queryKey],
      f.api.write({
        onSuccess: () => {
          callbacks++;
        },
        onError: () => {
          callbacks++;
        },
        onSettled: () => {
          callbacks++;
        },
      }),
    );
    const result = new MutationObserver(f.session.queryClient, options).mutate(1);
    const rejected = expect(result).rejects.toThrow();
    await tick();
    f.session.dispose();
    f.writes[0]!.resolve(1);
    await rejected;
    expect(callbacks).toBe(0);
    expect(f.session.queryClient.getQueryCache().getAll()).toHaveLength(0);
  } finally {
    f.stop();
  }
});

it("releases a pause when onMutate or onSettled throws, and reconciles failed writes", async () => {
  for (const phase of ["mutate", "write", "settled"] as const) {
    const f = fixture();
    try {
      await tick();
      const options = optimisticMutation(
        f.session,
        () => [f.options.queryKey],
        f.api.write({
          onMutate: () => {
            if (phase === "mutate") throw new Error(phase);
          },
          onSettled: () => {
            if (phase === "settled") throw new Error(phase);
          },
        }),
      );
      const result = new MutationObserver(f.session.queryClient, options).mutate(1);
      const rejected = expect(result).rejects.toThrow(phase);
      await tick();
      if (phase === "write") f.writes[0]!.reject(new Error("write"));
      if (phase === "settled") f.writes[0]!.resolve(1);
      await rejected;
      await tick();
      expect(f.reads()).toBe(2);
    } finally {
      f.stop();
    }
  }
});
