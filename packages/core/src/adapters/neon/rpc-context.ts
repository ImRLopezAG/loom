import { COMMON_ERROR_STATUS_MAP, ORPCError, RPCSerializer } from "@orpc/server";
import { Context } from "effect";
import * as v from "valibot";
import { Invocation } from "../../server/effect/runtime";
import type { ProcedureContext } from "../../server/rpc/procedure";
import type { VerifiedSession } from "../../server/auth/verify";

export const rpcErrorStatusMap = {
  ...COMMON_ERROR_STATUS_MAP,
  RPC_VERSION_MISMATCH: 409,
  INVALID_IDEMPOTENCY_KEY: 400,
  IDEMPOTENCY_CONFLICT: 409,
  IDEMPOTENCY_EXPIRED: 410,
};
export const rpcTransportSerializer = new RPCSerializer({ omitUndefinedProperties: false });

export function rpcFailure(code: string, status: number, headers: Headers = new Headers()): Response {
  return Response.json(rpcTransportSerializer.serialize(new ORPCError(code).toJSON()), { status, headers });
}

export function rpcContext(
  session: VerifiedSession | null,
  signal: AbortSignal,
  idempotencyKey: string | readonly string[] | undefined,
): ProcedureContext {
  signal.throwIfAborted();
  if (session && session.expiresAt <= Date.now() / 1000) throw new ORPCError("UNAUTHORIZED");
  const key = v.safeParse(v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(128))), idempotencyKey);
  if (!key.success) throw new ORPCError("INVALID_IDEMPOTENCY_KEY");
  const invocation = Object.freeze({
    identity: session ? Object.freeze({ ...session.identity }) : null,
    requestId: crypto.randomUUID(),
    signal,
  });
  const context = { ...invocation, "effect/context": Context.make(Invocation, invocation) };
  return key.output === undefined ? context : { ...context, idempotencyKey: key.output };
}
