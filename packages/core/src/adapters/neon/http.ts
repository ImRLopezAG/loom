import { Hono } from "hono";
import * as v from "valibot";
import { protocolVersion } from "../../client/protocol";
import { json } from "../../validation/encoding";
import { originPolicy } from "../../server/auth/policy";
import type { VerifiedSession } from "../../server/auth/verify";
import type { createDispatcher, DispatchResponse } from "../../server/dispatch";

export interface PublicHttpOptions {
  readonly dispatcher: Pick<ReturnType<typeof createDispatcher>, "public">;
  readonly verify: (token: string) => Promise<VerifiedSession>;
  readonly origins: readonly string[];
  readonly allowAnonymous?: boolean;
  readonly maxRequestBytes?: number;
  readonly requestTimeoutMs?: number;
}
const envelope = v.strictObject({
  protocol: v.number(),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(512)),
  kind: v.picklist(["query", "mutation", "action"]),
  version: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  args: json,
  idempotencyKey: v.exactOptional(v.pipe(v.string(), v.minLength(1), v.maxLength(128))),
});
const failures = {
  INVALID_REQUEST: { status: 400, message: "Invalid request" },
  UNAUTHENTICATED: { status: 401, message: "Authentication required" },
  ORIGIN_DENIED: { status: 403, message: "Origin is not allowed" },
  NOT_FOUND: { status: 404, message: "Route not found" },
  METHOD_NOT_ALLOWED: { status: 405, message: "Method not allowed" },
  PROTOCOL_MISMATCH: { status: 409, message: "Unsupported protocol version" },
  PAYLOAD_TOO_LARGE: { status: 413, message: "Request body exceeds the limit" },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: "Expected application/json" },
  CANCELLED: { status: 499, message: "Request cancelled" },
  INTERNAL: { status: 500, message: "Request failed" },
  TIMEOUT: { status: 504, message: "Request timed out" },
} as const;
class BoundaryError extends Error {
  constructor(readonly code: keyof typeof failures) {
    super(failures[code].message);
  }
}
const dispatchStatus = {
  NOT_FOUND: 404,
  VERSION_MISMATCH: 409,
  INVALID_ARGUMENTS: 400,
  FORBIDDEN: 403,
  CANCELLED: 499,
  INTERNAL: 500,
  INVALID_IDEMPOTENCY_KEY: 400,
  IDEMPOTENCY_CONFLICT: 409,
  IDEMPOTENCY_EXPIRED: 410,
} as const;
function headers(origin: string | null): Headers {
  const result = new Headers({ "cache-control": "no-store", vary: "Origin" });
  if (origin !== null) result.set("access-control-allow-origin", origin);
  return result;
}
function failure(
  code: keyof typeof failures,
  origin: string | null,
  requestId: string = crypto.randomUUID(),
): Response {
  const { status, message } = failures[code];
  return Response.json(
    { protocol: protocolVersion, ok: false, requestId, error: { code, message } },
    { status, headers: headers(origin) },
  );
}

async function readBody(request: Request, limit: number, signal: AbortSignal): Promise<string> {
  if (!request.body) throw new BoundaryError("INVALID_REQUEST");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    for (;;) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > limit) throw new BoundaryError("PAYLOAD_TOO_LARGE");
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } catch (cause) {
    if (cause instanceof BoundaryError || signal.aborted) throw cause;
    throw new BoundaryError("INVALID_REQUEST");
  } finally {
    signal.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Public routes only. Future WebSocket upgrade routes must not use these response handlers. */
export function createPublicHttpApp(options: PublicHttpOptions): Hono {
  const allows = originPolicy(options.origins);
  const dispatch = options.dispatcher.public;
  const verify = options.verify;
  const anonymous = options.allowAnonymous === true;
  const limit = options.maxRequestBytes ?? 1048576;
  const timeout = options.requestTimeoutMs ?? 30000;
  if (!Number.isInteger(limit) || limit < 1024 || limit > 10485760) throw new Error("Invalid request byte limit");
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 120000) throw new Error("Invalid request timeout");
  const app = new Hono();
  app.onError(() => failure("INTERNAL", null));
  app.notFound(() => failure("NOT_FOUND", null));
  app.all("/api/loom/call", async (context) => {
    const request = context.req.raw;
    const origin = request.headers.get("origin");
    if (!allows(origin)) return failure("ORIGIN_DENIED", null);
    if (request.method === "OPTIONS") {
      const requested = (request.headers.get("access-control-request-headers") ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      if (
        origin === null ||
        request.headers.get("access-control-request-method") !== "POST" ||
        requested.some((name) => !["authorization", "content-type"].includes(name))
      )
        return failure("ORIGIN_DENIED", origin);
      const allowed = headers(origin);
      allowed.set("access-control-allow-methods", "POST");
      allowed.set("access-control-allow-headers", "Authorization, Content-Type");
      return new Response(null, { status: 204, headers: allowed });
    }
    if (request.method !== "POST") return failure("METHOD_NOT_ALLOWED", origin);
    if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json")
      return failure("UNSUPPORTED_MEDIA_TYPE", origin);
    const deadline = AbortSignal.timeout(timeout);
    const signal = AbortSignal.any([request.signal, deadline]);
    try {
      signal.throwIfAborted();
      let session: VerifiedSession | null = null;
      const authorization = request.headers.get("authorization");
      if (authorization !== null) {
        const bearer = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1];
        if (!bearer) throw new BoundaryError("UNAUTHENTICATED");
        try {
          session = await verify(bearer);
        } catch {
          throw new BoundaryError("UNAUTHENTICATED");
        }
        if (session.expiresAt <= Date.now() / 1000) throw new BoundaryError("UNAUTHENTICATED");
      } else if (!anonymous) throw new BoundaryError("UNAUTHENTICATED");
      signal.throwIfAborted();
      const text = await readBody(request, limit, signal);
      let parsed: v.InferOutput<typeof envelope>;
      try {
        parsed = v.parse(envelope, JSON.parse(text));
      } catch {
        throw new BoundaryError("INVALID_REQUEST");
      }
      if (parsed.protocol !== protocolVersion) throw new BoundaryError("PROTOCOL_MISMATCH");
      if (session && session.expiresAt <= Date.now() / 1000) throw new BoundaryError("UNAUTHENTICATED");
      const { protocol: _protocol, ...call } = parsed;
      const result: DispatchResponse = await dispatch(call, session?.identity ?? null, signal);
      if (!result.ok && result.error.code === "CANCELLED" && deadline.aborted)
        return failure("TIMEOUT", origin, result.requestId);
      return Response.json(
        { protocol: protocolVersion, ...result },
        { status: result.ok ? 200 : dispatchStatus[result.error.code], headers: headers(origin) },
      );
    } catch (cause) {
      if (request.signal.aborted) return failure("CANCELLED", origin);
      if (deadline.aborted) return failure("TIMEOUT", origin);
      return failure(cause instanceof BoundaryError ? cause.code : "INTERNAL", origin);
    }
  });
  return app;
}
