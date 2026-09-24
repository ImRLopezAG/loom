import { RPCLink } from "@orpc/client/fetch";
import { ORPCError, RPCSerializer } from "@orpc/client";
import { createRpcHttpApp } from "@loom/core/neon";
import type { createRpcRuntime, InvocationIdentity, JsonValue } from "@loom/core/server";

/** Exercises native serialization, ingress and runtime authorization without a listening HTTP server. */
export async function callExample(
  runtime: Awaited<ReturnType<typeof createRpcRuntime>>,
  path: readonly string[],
  input: JsonValue,
  identity: InvocationIdentity | null,
) {
  const app = createRpcHttpApp({
    router: runtime.snapshots,
    version: runtime.version,
    origins: [],
    allowAnonymous: true,
    verify: async () => {
      if (!identity) throw new Error("Missing identity");
      return { identity, expiresAt: Date.now() / 1000 + 60 };
    },
  });
  const headers = new Headers({
    "x-loom-protocol": "loom-orpc-2",
    "x-loom-version": runtime.version,
    "idempotency-key": crypto.randomUUID(),
  });
  if (identity) headers.set("authorization", "Bearer fixture");
  const link = new RPCLink({
    origin: "https://example.test",
    url: "/api/loom/rpc",
    headers,
    serializer: new RPCSerializer({ omitUndefinedProperties: false }),
    fetch: (url, init) => app.fetch(new Request(url, init)),
  });
  try {
    return { ok: true as const, value: await link.call([...path], input, { context: {} }) };
  } catch (error) {
    if (!(error instanceof ORPCError)) throw error;
    return { ok: false as const, error: { code: error.code } };
  }
}
