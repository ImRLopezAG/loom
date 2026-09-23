import type { AnyRelations } from "drizzle-orm";
import { createRuntime } from "../../server/runtime";
import type { RuntimeOptions } from "../../server/runtime";
import { createNeonApplication } from "./application";
import type { NeonTriggerBinding } from "./triggers";

export interface NeonWorkerOptions<Relations extends AnyRelations> extends RuntimeOptions<Relations> {
  readonly bindings: Readonly<Record<string, NeonTriggerBinding>>;
}

async function createEntry<Relations extends AnyRelations>(
  options: RuntimeOptions<Relations>,
  assemble: (runtime: Awaited<ReturnType<typeof createRuntime>>) => ReturnType<typeof createNeonApplication>,
  onlyPath?: string,
) {
  const runtime = await createRuntime(options);
  try {
    const application = assemble(runtime);
    let stopping: Promise<void> | undefined;
    return Object.freeze({
      fetch(this: void, request: Request): Promise<Response> {
        if (stopping)
          return Promise.resolve(
            new Response("Application stopping", { status: 503, headers: { "cache-control": "no-store" } }),
          );
        if (onlyPath && new URL(request.url).pathname !== onlyPath)
          return Promise.resolve(new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } }));
        return application.fetch(request);
      },
      stop(): Promise<void> {
        if (stopping) return stopping;
        let applicationStopped: Promise<void> | undefined;
        stopping = Promise.resolve().then(async () => {
          try {
            await applicationStopped;
          } finally {
            await runtime.stop();
          }
        });
        applicationStopped = application.stop();
        return stopping;
      },
    });
  } catch (cause) {
    await runtime.stop();
    throw cause;
  }
}

/** Public HTTP and native WebSocket service. Provider trigger routes are absent. */
export function createNeonService<Relations extends AnyRelations>(options: RuntimeOptions<Relations>) {
  return createEntry(options, (runtime) =>
    createNeonApplication({
      ...runtime.auth,
      dispatcher: runtime.dispatcher,
      tickets: runtime.tickets,
      storage: runtime.storage?.intents,
      realtime: { ...runtime.realtime, tickets: runtime.tickets },
    }),
  );
}

/** Provider triggers only. Mount behind the Neon edge that strips caller-supplied attestation headers. */
export function createNeonWorker<Relations extends AnyRelations>(options: NeonWorkerOptions<Relations>) {
  const bindings = structuredClone(options.bindings);
  return createEntry(
    options,
    (runtime) =>
      createNeonApplication({
        ...runtime.auth,
        dispatcher: runtime.dispatcher,
        triggers: {
          bindings,
          crons: runtime.crons,
          worker: runtime.worker,
          storage: runtime.storage?.events,
          cleanup: runtime.storage?.cleanup,
        },
      }),
    "/api/loom/triggers",
  );
}
