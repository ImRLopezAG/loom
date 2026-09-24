import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type { WebSocketLike } from "@orpc/client/websocket";
import WebSocket from "ws";
import * as v from "valibot";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const setupSchema = v.strictObject({ url: v.string(), version: v.string(), token: v.string(), origin: v.string() });
const resultSchema = v.strictObject({ code: v.number(), reason: v.string(), requestedCalls: v.number() });

/** Node owns the physical ws socket; Bun's compatibility layer cannot pause it. */
export async function verifyCloudSlowPeer(options: v.InferOutput<typeof setupSchema>) {
  const child = Bun.spawn(["node", fileURLToPath(import.meta.url)], { stdin: "pipe", stdout: "pipe", stderr: "pipe" });
  await child.stdin.write(JSON.stringify(options));
  await child.stdin.end();
  const timeout = globalThis.setTimeout(() => child.kill(), 45000);
  try {
    const [output, diagnostics, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(code, 0, `Paused peer failed: ${diagnostics}`);
    return v.parse(resultSchema, JSON.parse(output));
  } finally {
    clearTimeout(timeout);
  }
}

/** Pause the actual receive socket, rather than merely delaying a JS callback. */
async function checkSlowPeer(options: {
  readonly url: string;
  readonly version: string;
  readonly token: string;
  readonly origin: string;
}) {
  const ticketResponse = await fetch(new URL("/api/loom/ticket", options.url), {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.token}`,
      origin: options.origin,
      "content-type": "application/json",
      "x-loom-protocol": "loom-orpc-2",
      "x-loom-version": options.version,
    },
    body: "{}",
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(ticketResponse.status, 200);
  const { ticket } = v.parse(v.object({ ticket: v.string() }), await ticketResponse.json());
  const url = new URL("/api/loom/socket", options.url);
  url.protocol = "wss:";
  const socket = new WebSocket(url, ["loom.orpc.2", `loom.version.${options.version}`, `loom.ticket.${ticket}`], {
    origin: options.origin,
    handshakeTimeout: 15000,
    perMessageDeflate: false,
  });
  socket.binaryType = "arraybuffer";
  let closed: { code: number; reason: string } | undefined;
  socket.on("close", (code, reason) => {
    closed = { code, reason: reason.toString() };
  });
  const pending: Promise<PromiseSettledResult<string>[]>[] = [];
  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("open", resolve);
      socket.on("error", () => reject(new Error("Slow peer connection failed")));
    });
    const client = createORPCClient<{ probe: { large: Client<Record<never, never>, undefined, string, Error> } }>(
      new RPCLink({
        // SAFETY: ws implements the four WHATWG operations oRPC consumes. Its
        // listener-options overload is narrower; oRPC uses no capture options.
        connect: () => socket as WebSocketLike,
      }),
    );
    assert.equal((await client.probe.large()).length, 262144);
    socket.pause();
    assert(socket.isPaused);
    pending.push(
      Promise.allSettled(
        Array.from({ length: 192 }, () => client.probe.large(undefined, { signal: AbortSignal.timeout(15000) })),
      ),
    );
    await setTimeout(1000);
    socket.resume();
    const deadline = performance.now() + 10000;
    while (!closed && performance.now() < deadline) await setTimeout(100);
    assert(closed, "A paused-peer burst must receive a bounded capacity refusal");
    assert([4009, 4013].includes(closed.code), `Unexpected close ${closed.code}: ${closed.reason}`);
    assert(["CAPACITY_EXCEEDED", "RESYNC_REQUIRED"].includes(closed.reason));
    return { code: closed.code, reason: closed.reason, requestedCalls: 192 };
  } finally {
    socket.resume();
    socket.terminate();
    await Promise.all(pending);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkSlowPeer(v.parse(setupSchema, JSON.parse(readFileSync(0, "utf8"))));
    process.stdout.write(JSON.stringify(result));
  } catch (cause) {
    process.stderr.write(cause instanceof assert.AssertionError ? cause.message : "Paused peer transport failed");
    process.exitCode = 1;
  }
}
