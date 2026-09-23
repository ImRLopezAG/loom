import { Hono } from "hono";
import { parseTriggerDelivery } from "@neon/functions/triggers";
import * as v from "valibot";
import type { createCronDispatcher } from "../../server/jobs/crons";
import type { createJobWorker } from "../../server/jobs/worker";
import type { createStorageCleanup } from "../../server/storage/cleanup";
import type { createStorageEventDispatcher } from "../../server/storage/events";
import { storageUploadValidator } from "../../server/storage/contracts";
import { readRequestBody, RequestBodyError } from "./request-body";

const identifier = v.pipe(v.string(), v.minLength(1), v.maxLength(256));
export const neonTriggerBindingValidator = v.variant("kind", [
  v.strictObject({ kind: v.literal("wake"), name: identifier }),
  v.strictObject({ kind: v.literal("cron"), name: identifier, cron: identifier }),
  v.strictObject({ kind: v.literal("storage"), name: identifier, bucket: storageUploadValidator.entries.bucket }),
]);
export type NeonTriggerBinding = v.InferOutput<typeof neonTriggerBindingValidator>;
export interface NeonTriggersOptions {
  readonly bindings: Readonly<Record<string, NeonTriggerBinding>>;
  readonly crons: Pick<ReturnType<typeof createCronDispatcher>, "dispatch" | "recordWake">;
  readonly worker: Pick<ReturnType<typeof createJobWorker>, "run">;
  readonly cleanup?: Pick<ReturnType<typeof createStorageCleanup>, "run"> | undefined;
  readonly storage?: Pick<ReturnType<typeof createStorageEventDispatcher>, "receive"> | undefined;
}

/** Neon edge only: it strips client-supplied X-Neon-* headers. Never mount behind an arbitrary HTTP proxy. */
export function createNeonTriggers(options: NeonTriggersOptions): Hono {
  const bindings = new Map(
    Object.entries(v.parse(v.record(identifier, neonTriggerBindingValidator), structuredClone(options.bindings))),
  );
  const crons = options.crons;
  const worker = options.worker;
  const storage = options.storage;
  const cleanup = options.cleanup;
  if ([...bindings.values()].some((binding) => binding.kind === "storage") && !storage)
    throw new Error("Storage trigger dispatcher missing");
  const app = new Hono();
  const failure = (status: 400 | 403 | 404 | 405 | 413 | 415 | 499 | 503 | 504) =>
    Response.json(
      { ok: false, error: "Trigger delivery refused" },
      { status, headers: { "cache-control": "no-store" } },
    );
  app.onError(() => failure(503));
  app.notFound(() => failure(404));
  app.all("/api/loom/triggers", async (context) => {
    const request = context.req.raw;
    if (request.method !== "POST") return failure(405);
    if (!request.headers.get("x-neon-trigger-invocation-id")?.trim()) return failure(403);
    if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json")
      return failure(415);
    const deadline = AbortSignal.timeout(30000);
    const signal = AbortSignal.any([request.signal, deadline]);
    try {
      const text = await readRequestBody(request, 65536, signal);
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        return failure(400);
      }
      const parsed = parseTriggerDelivery({ headers: request.headers, body });
      if (!parsed.ok) return failure(400);
      const occurrence = parsed.invocation;
      const configured = bindings.get(occurrence.trigger.id);
      if (!configured || configured.name !== occurrence.trigger.name) return failure(403);
      if (occurrence.type === "storage_object_created") {
        if (configured.kind !== "storage" || configured.bucket !== occurrence.data.bucketName || !storage)
          return failure(403);
        await storage.receive(
          {
            invocationId: occurrence.invocationId,
            triggerId: occurrence.trigger.id,
            triggerName: occurrence.trigger.name,
            bucket: occurrence.data.bucketName,
            key: occurrence.data.objectKey,
          },
          signal,
        );
        signal.throwIfAborted();
        return Response.json({ ok: true }, { status: 202, headers: { "cache-control": "no-store" } });
      }
      if (configured.kind === "storage") return failure(403);
      const at = v.safeParse(v.pipe(v.string(), v.isoTimestamp()), occurrence.data.scheduledAt);
      if (!at.success) return failure(400);
      const scheduledAt = new Date(at.output);
      if (!v.is(v.date(), scheduledAt)) return failure(400);
      signal.throwIfAborted();
      const delivery = {
        invocationId: occurrence.invocationId,
        triggerId: occurrence.trigger.id,
        triggerName: occurrence.trigger.name,
      };
      if (configured.kind === "cron") await crons.dispatch(configured.cron, scheduledAt, signal, delivery);
      else await crons.recordWake(delivery, scheduledAt, signal);
      signal.throwIfAborted();
      // Await durable work in the invocation. Worker shutdown owns cancellation of its shared execution slot.
      const result = await worker.run();
      await cleanup?.run(25, signal);
      return Response.json({ ok: true, ...result }, { headers: { "cache-control": "no-store" } });
    } catch (cause) {
      if (request.signal.aborted) return failure(499);
      if (deadline.aborted) return failure(504);
      if (cause instanceof RequestBodyError) return failure(cause.code === "PAYLOAD_TOO_LARGE" ? 413 : 400);
      return failure(503);
    }
  });
  return app;
}
