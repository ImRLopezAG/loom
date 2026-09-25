import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { createRpcTransport } from "@loom/core/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { readMetrics } from "./cloud-live-metrics";
import * as v from "valibot";

type Task = { _id: string; title: string; done: boolean };
type Router = {
  acceptance: { metrics: Client<Record<never, never>, undefined, ReturnType<typeof readMetrics>, Error> };
  tasks: { list: Client<Record<never, never>, { projectId: string }, AsyncIteratorObject<Task[], void, void>, Error> };
};
export interface LiveBrowserSetup {
  readonly services: readonly { url: string; version: string; token: string }[];
  readonly projects: readonly string[];
}
export interface LiveObservation {
  readonly index: number;
  readonly sequence: number;
}
declare global {
  interface Window {
    loomObserved(observation: LiveObservation): Promise<void>;
    loomLive: {
      start(setup: LiveBrowserSetup): void;
      stop(): void;
      stopSubscriptions(): void;
      metrics(): Promise<ReturnType<typeof readMetrics>[]>;
      status(): { ready: number; errors: number; errorCodes: string[] };
    };
  }
}

const cleanup: (() => void)[] = [];
const unsubscribes: (() => void)[] = [];
const readouts: (() => Promise<ReturnType<typeof readMetrics>>)[] = [];
const ready = new Set<number>();
let errors = 0;
const errorCodes = new Set<string>();
const errorCodeSchema = v.object({ code: v.pipe(v.string(), v.regex(/^[A-Z_]+$/)) });
window.loomLive = {
  start(setup) {
    if (cleanup.length) throw new Error("Live fixture already started");
    const bindings = setup.services.map((service) => {
      const transport = createRpcTransport({ ...service, getToken: async () => service.token });
      const queryClient = new QueryClient();
      const raw = createORPCClient<Router>(transport.link);
      readouts.push(() => raw.acceptance.metrics());
      const rpc = createTanstackQueryUtils(raw);
      cleanup.push(() => {
        queryClient.clear();
        transport.dispose();
      });
      return { queryClient, rpc };
    });
    setup.projects.forEach((projectId, index) => {
      const binding = bindings[index % bindings.length];
      if (!binding) throw new Error("Missing service binding");
      const observer = new QueryObserver(
        binding.queryClient,
        binding.rpc.tasks.list.liveOptions({ input: { projectId }, retry: false }),
      );
      let previous: string | undefined;
      const unsubscribe = observer.subscribe((state) => {
        if (state.isError) {
          errors++;
          const parsed = v.safeParse(errorCodeSchema, state.error);
          if (parsed.success) errorCodes.add(parsed.output.code);
        }
        const title = state.data?.[0]?.title;
        if (!title || title === previous) return;
        previous = title;
        ready.add(index);
        const sequence = Number(title);
        if (Number.isSafeInteger(sequence)) void window.loomObserved({ index, sequence });
      });
      // Remove observers before aborting their owning sessions.
      unsubscribes.push(unsubscribe);
    });
  },
  stop() {
    this.stopSubscriptions();
    for (const stop of cleanup.splice(0)) stop();
  },
  stopSubscriptions() {
    for (const unsubscribe of unsubscribes.splice(0)) unsubscribe();
  },
  metrics() {
    return Promise.all(readouts.map((read) => read()));
  },
  status() {
    return { ready: ready.size, errors, errorCodes: [...errorCodes] };
  },
};
