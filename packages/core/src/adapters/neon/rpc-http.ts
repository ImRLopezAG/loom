import { RPCHandler, BodyLimitPlugin } from "@orpc/server/fetch";
import type { FetchHandler } from "@orpc/server/fetch";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import type { OpenAPIDocument } from "@orpc/openapi";
import * as v from "valibot";
import { ORPCError } from "@orpc/server";
import type { Router } from "@orpc/server";
import { originPolicy } from "../../server/auth/policy";
import type { VerifiedSession } from "../../server/auth/verify";
import type { createConnectionTickets } from "../../server/auth/tickets";
import type { ProcedureContext } from "../../server/rpc/procedure";
import { rpcProtocolVersion } from "../../server/rpc/serialization";
import { rpcContext, rpcErrorStatusMap, rpcFailure, rpcTransportSerializer } from "./rpc-context";
import { readRequestBody, RequestBodyError } from "./request-body";
import { abortable } from "./abortable";
import { generateRpcOpenAPI } from "../../server/rpc/openapi";

export interface RpcHttpOptions {
  readonly router: Router<ProcedureContext>;
  readonly version: string;
  readonly origins: readonly string[];
  readonly verify: (token: string) => Promise<VerifiedSession>;
  readonly tickets?: Pick<ReturnType<typeof createConnectionTickets>, "issue">;
  readonly allowAnonymous?: boolean;
  readonly maxRequestBytes?: number;
  readonly requestTimeoutMs?: number;
}

/** Fetch-only RPC and ticket ingress. Never pass provider upgrade responses
 * through this boundary or its CORS response handling. */
export function createRpcHttpApp(options: RpcHttpOptions) {
  const handler = new RPCHandler(options.router, {
    serializer: rpcTransportSerializer,
    allowMethods: ["POST"],
    errorStatusMap: rpcErrorStatusMap,
    plugins: [new BodyLimitPlugin({ maxBodySize: options.maxRequestBytes ?? 1_048_576 })],
  });
  return createHttpIngress(options, handler, "/api/loom/rpc", ["POST"]);
}

/** Validate the public contract before exposing its REST adapter. */
export async function createRpcOpenApiApp(options: Omit<RpcHttpOptions, "tickets">): Promise<{
  fetch(request: Request): Promise<Response>;
  document: OpenAPIDocument<"3.2.0">;
}> {
  const document = await generateRpcOpenAPI(options.router);
  const handler = new OpenAPIHandler(options.router, {
    errorStatusMap: rpcErrorStatusMap,
    plugins: [new BodyLimitPlugin({ maxBodySize: options.maxRequestBytes ?? 1_048_576 })],
  });
  return {
    ...createHttpIngress(options, handler, "/api/loom/openapi", ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]),
    document,
  };
}

function createHttpIngress(
  options: RpcHttpOptions,
  handler: FetchHandler<ProcedureContext>,
  prefix: `/api/loom/${string}`,
  methods: readonly string[],
) {
  const allowed = originPolicy(options.origins);
  const limit = options.maxRequestBytes ?? 1_048_576;
  const timeout = options.requestTimeoutMs ?? 30_000;
  if (!/^[a-f0-9]{64}$/.test(options.version)) throw new Error("Invalid RPC deployment version");
  if (!Number.isInteger(limit) || limit < 1024 || limit > 10_485_760) throw new Error("Invalid request byte limit");
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 120_000) throw new Error("Invalid request timeout");
  const permittedHeaders = ["authorization", "content-type", "x-loom-protocol", "x-loom-version", "idempotency-key"];
  return {
    async fetch(request: Request): Promise<Response> {
      const pathname = new URL(request.url).pathname;
      const ticket = pathname === "/api/loom/ticket";
      const retired = pathname === "/api/loom/call" || (ticket && !request.headers.has("x-loom-protocol"));
      const headers = new Headers({ "cache-control": "no-store", vary: "Origin" });
      const fail = (code: string, status: number) => {
        // A bounded refusal is the only retained legacy transport behavior. Do
        // not decode arguments or dispatch historical procedure references.
        if (retired)
          return Response.json(
            { protocol: 1, ok: false, requestId: crypto.randomUUID(), error: { code, message: code } },
            { status, headers },
          );
        return prefix === "/api/loom/openapi"
          ? Response.json(new ORPCError(code).toJSON(), { status, headers })
          : rpcFailure(code, status, headers);
      };
      if (!retired && !ticket && !pathname.startsWith(`${prefix}/`)) return fail("NOT_FOUND", 404);
      if (ticket && !options.tickets) return fail("NOT_FOUND", 404);
      const origin = request.headers.get("origin");
      if (!allowed(origin) || (ticket && !origin)) return fail("FORBIDDEN", 403);
      if (origin) headers.set("access-control-allow-origin", origin);
      if (request.method === "OPTIONS") {
        const requested = (request.headers.get("access-control-request-headers") ?? "")
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        if (
          !origin ||
          !(ticket ? ["POST"] : methods).includes(request.headers.get("access-control-request-method") ?? "") ||
          requested.some((name) => !permittedHeaders.includes(name))
        )
          return fail("FORBIDDEN", 403);
        headers.set("access-control-allow-methods", ticket ? "POST" : methods.join(", "));
        headers.set("access-control-allow-headers", permittedHeaders.join(", "));
        return new Response(null, { status: 204, headers });
      }
      if (!(ticket ? ["POST"] : methods).includes(request.method)) return fail("METHOD_NOT_SUPPORTED", 405);
      if (retired) return fail("VERSION_MISMATCH", 409);
      if (
        request.headers.get("x-loom-protocol") !== rpcProtocolVersion ||
        request.headers.get("x-loom-version") !== options.version
      )
        return fail("RPC_VERSION_MISMATCH", 409);
      const deadline = AbortSignal.timeout(timeout);
      let signal = AbortSignal.any([request.signal, deadline]);
      try {
        signal.throwIfAborted();
        const authorization = request.headers.get("authorization");
        let session: VerifiedSession | null = null;
        if (authorization !== null) {
          const token = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1];
          if (!token) return fail("UNAUTHORIZED", 401);
          try {
            session = await abortable(options.verify(token), signal);
          } catch {
            signal.throwIfAborted();
            return fail("UNAUTHORIZED", 401);
          }
          if (!Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now() / 1000)
            return fail("UNAUTHORIZED", 401);
          signal = AbortSignal.any([
            signal,
            AbortSignal.timeout(Math.min(timeout, Math.max(1, Math.ceil(session.expiresAt * 1000 - Date.now())))),
          ]);
        } else if (!options.allowAnonymous || ticket) return fail("UNAUTHORIZED", 401);
        signal.throwIfAborted();
        if (ticket) {
          if (!session || !origin || !options.tickets) return fail("UNAUTHORIZED", 401);
          const body = await readRequestBody(request, 1024, signal);
          try {
            const parsed: unknown = JSON.parse(body);
            if (Array.isArray(parsed) || !v.is(v.strictObject({}), parsed)) return fail("BAD_REQUEST", 400);
          } catch {
            return fail("BAD_REQUEST", 400);
          }
          const issued = await options.tickets.issue(session, origin);
          signal.throwIfAborted();
          if (issued.expiresAt <= Date.now() / 1000) return fail("UNAUTHORIZED", 401);
          return Response.json(issued, { headers });
        }
        // A Fetch Request signal does not cancel a custom body stream. Finish
        // bounded reading before oRPC can invoke a handler with an expired session.
        const body = request.body ? await readRequestBody(request, limit, signal) : undefined;
        signal.throwIfAborted();
        const init: RequestInit = { signal };
        if (body !== undefined) init.body = body;
        const result = await handler.handle(new Request(request, init), {
          prefix,
          context: () => rpcContext(session, signal, request.headers.get("idempotency-key") ?? undefined),
        });
        signal.throwIfAborted();
        if (!result.matched) return fail("NOT_FOUND", 404);
        const response = result.response;
        for (const [name, value] of headers) response.headers.set(name, value);
        return response;
      } catch (cause) {
        if (request.signal.aborted) return fail("CANCELLED", 499);
        if (deadline.aborted) return fail("TIMEOUT", 504);
        if (signal.aborted) return fail("UNAUTHORIZED", 401);
        if (cause instanceof RequestBodyError) return fail(cause.code, cause.code === "PAYLOAD_TOO_LARGE" ? 413 : 400);
        if (cause instanceof ORPCError && ["UNAUTHORIZED", "INVALID_IDEMPOTENCY_KEY"].includes(cause.code))
          return fail(cause.code, cause.code === "UNAUTHORIZED" ? 401 : 400);
        return fail("INTERNAL_SERVER_ERROR", 500);
      }
    },
  };
}
