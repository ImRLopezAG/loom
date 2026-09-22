import { Hono } from "hono";
import { parseTriggerDelivery } from "@neon/functions/triggers";
import * as v from "valibot";
import type { createCronDispatcher } from "../../server/jobs/crons";
import type { createJobWorker } from "../../server/jobs/worker";
import { readRequestBody, RequestBodyError } from "./request-body";

const identifier = v.pipe(v.string(), v.minLength(1), v.maxLength(256));
const binding = v.variant("kind", [
  v.strictObject({ kind: v.literal("wake"), name: identifier }),
  v.strictObject({ kind: v.literal("cron"), name: identifier, cron: identifier }),
]);
export type NeonTriggerBinding = v.InferOutput<typeof binding>;
export interface NeonTriggersOptions {
  readonly bindings: Readonly<Record<string, NeonTriggerBinding>>;
  readonly crons: Pick<ReturnType<typeof createCronDispatcher>, "dispatch">;
  readonly worker: Pick<ReturnType<typeof createJobWorker>, "run">;
}

/** Neon edge only: it strips client-supplied X-Neon-* headers. Never mount behind an arbitrary HTTP proxy. */
export function createNeonTriggers(options: NeonTriggersOptions): Hono {
  const bindings = new Map(Object.entries(v.parse(v.record(identifier, binding), structuredClone(options.bindings))));
  const crons = options.crons;
  const worker = options.worker;
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
      if (!parsed.ok || parsed.invocation.type !== "schedule") return failure(400);
      const occurrence = parsed.invocation;
      const configured = bindings.get(occurrence.trigger.id);
      if (!configured || configured.name !== occurrence.trigger.name) return failure(403);
      const at = v.safeParse(v.pipe(v.string(), v.isoTimestamp()), occurrence.data.scheduledAt);
      if (!at.success) return failure(400);
      const scheduledAt = new Date(at.output);
      if (!v.is(v.date(), scheduledAt)) return failure(400);
      signal.throwIfAborted();
      if (configured.kind === "cron") await crons.dispatch(configured.cron, scheduledAt, signal);
      signal.throwIfAborted();
      // Await durable work in the invocation. Worker shutdown owns cancellation of its shared execution slot.
      const result = await worker.run();
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
