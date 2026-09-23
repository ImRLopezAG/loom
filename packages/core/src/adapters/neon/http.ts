import { readRequestBody, RequestBodyError } from "./request-body";
import { Hono } from "hono";
import * as v from "valibot";
import { protocolVersion } from "../../client/protocol";
import { json } from "../../validation/encoding";
import { originPolicy } from "../../server/auth/policy";
import type { VerifiedSession } from "../../server/auth/verify";
import { AuthenticationError } from "../../server/auth/verify";
import type { createConnectionTickets } from "../../server/auth/tickets";
import type { createDispatcher, DispatchResponse } from "../../server/dispatch";
import type { createStorageIntents } from "../../server/storage/intents";
import { StorageIntentError, StorageVerificationError } from "../../server/storage/contracts";
import { storageRequestValidator } from "../../validation/storage";

export interface PublicHttpOptions {
  readonly dispatcher: Pick<ReturnType<typeof createDispatcher>, "public">;
  readonly verify: (token: string) => Promise<VerifiedSession>;
  readonly tickets?: Pick<ReturnType<typeof createConnectionTickets>, "issue">;
  readonly storage?: ReturnType<typeof createStorageIntents> | undefined;
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
const ticketEnvelope = v.strictObject({ protocol: v.number() });
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
  FORBIDDEN: { status: 403, message: "Storage access denied" },
  IDEMPOTENCY_CONFLICT: { status: 409, message: "Storage request conflict" },
  STORAGE_UNAVAILABLE: { status: 409, message: "Storage object or upload unavailable" },
  STORAGE_VERIFICATION_FAILED: { status: 422, message: "Storage verification failed" },
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

/** Public routes only. Future WebSocket upgrade routes must not use these response handlers. */
export function createPublicHttpApp(options: PublicHttpOptions): Hono {
  const allows = originPolicy(options.origins);
  const dispatch = options.dispatcher.public;
  const verify = options.verify;
  const issueTicket = options.tickets?.issue;
  const storage = options.storage;
  const anonymous = options.allowAnonymous === true;
  const limit = options.maxRequestBytes ?? 1048576;
  const timeout = options.requestTimeoutMs ?? 30000;
  if (!Number.isInteger(limit) || limit < 1024 || limit > 10485760) throw new Error("Invalid request byte limit");
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 120000) throw new Error("Invalid request timeout");
  const app = new Hono();
  app.onError(() => failure("INTERNAL", null));
  app.notFound(() => failure("NOT_FOUND", null));
  app.on("ALL", ["/api/loom/call", "/api/loom/ticket", "/api/loom/storage"], async (context) => {
    const ticketRequest = context.req.path === "/api/loom/ticket";
    const storageRequest = context.req.path === "/api/loom/storage";
    if (ticketRequest && !issueTicket) return failure("NOT_FOUND", null);
    if (storageRequest && !storage) return failure("NOT_FOUND", null);
    const request = context.req.raw;
    const origin = request.headers.get("origin");
    if (!allows(origin)) return failure("ORIGIN_DENIED", null);
    if (ticketRequest && origin === null) return failure("ORIGIN_DENIED", null);
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
      } else if (!anonymous || ticketRequest || storageRequest) throw new BoundaryError("UNAUTHENTICATED");
      signal.throwIfAborted();
      const text = await readRequestBody(request, storageRequest ? Math.min(limit, 16384) : limit, signal);
      let parsed: v.InferOutput<typeof envelope | typeof ticketEnvelope | typeof storageRequestValidator>;
      try {
        const validator = storageRequest ? storageRequestValidator : ticketRequest ? ticketEnvelope : envelope;
        parsed = v.parse(validator, JSON.parse(text));
      } catch {
        throw new BoundaryError("INVALID_REQUEST");
      }
      if (parsed.protocol !== protocolVersion) throw new BoundaryError("PROTOCOL_MISMATCH");
      if (session && session.expiresAt <= Date.now() / 1000) throw new BoundaryError("UNAUTHENTICATED");
      if ("operation" in parsed) {
        if (!storage || !session) throw new BoundaryError("UNAUTHENTICATED");
        const value =
          parsed.operation === "create"
            ? await storage.create(session.identity, parsed.upload, parsed.requestKey, signal)
            : await storage[parsed.operation](session.identity, parsed.id, signal);
        signal.throwIfAborted();
        if (session.expiresAt <= Date.now() / 1000) throw new BoundaryError("UNAUTHENTICATED");
        return Response.json(
          { protocol: protocolVersion, ok: true, requestId: crypto.randomUUID(), value },
          { headers: headers(origin) },
        );
      }
      if (!("name" in parsed)) {
        if (!issueTicket || !session || origin === null) throw new BoundaryError("UNAUTHENTICATED");
        const value = await issueTicket(session, origin);
        signal.throwIfAborted();
        if (value.expiresAt <= Date.now() / 1000) throw new BoundaryError("UNAUTHENTICATED");
        return Response.json(
          { protocol: protocolVersion, ok: true, requestId: crypto.randomUUID(), value },
          { headers: headers(origin) },
        );
      }
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
      if (cause instanceof AuthenticationError) return failure("UNAUTHENTICATED", origin);
      if (cause instanceof StorageIntentError) return failure(cause.code, origin);
      if (cause instanceof StorageVerificationError) return failure("STORAGE_VERIFICATION_FAILED", origin);
      return failure(
        cause instanceof BoundaryError || cause instanceof RequestBodyError ? cause.code : "INTERNAL",
        origin,
      );
    }
  });
  return app;
}
