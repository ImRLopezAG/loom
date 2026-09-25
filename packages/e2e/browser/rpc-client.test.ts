import { expect, test } from "bun:test";
import { os } from "@orpc/server";
import { RPCHandler } from "@orpc/server/websocket";
import type { ServerWebSocket } from "bun";
import { chromium } from "playwright";
import { browserBundle } from "./bundle";

test("packed native React callables share streams, reconnect once and dispose identity state", async () => {
  const bundle = await browserBundle("rpc-transport.tsx");
  expect(bundle).not.toContain("DATABASE_URL");
  let calls = 0;
  let tickets = 0;
  let stopped = 0;
  let count = 1;
  const router = {
    read: os.handler(async function* ({ signal }) {
      calls++;
      try {
        yield { count };
        await new Promise<void>((resolve) => {
          if (signal?.aborted) resolve();
          else signal?.addEventListener("abort", () => resolve(), { once: true });
        });
      } finally {
        stopped++;
      }
    }),
  };
  const handler = new RPCHandler(router);
  const sockets = new Set<ServerWebSocket<undefined>>();
  const server = Bun.serve<undefined>({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request, runtime) {
      const path = new URL(request.url).pathname;
      if (path === "/api/loom/ticket") {
        expect(request.headers.get("authorization")).toBe("Bearer test-token");
        expect(request.headers.get("x-loom-version")).toBe("a".repeat(64));
        expect(request.headers.get("x-loom-protocol")).toBe("loom-orpc-2");
        tickets++;
        return Response.json({ ticket: String(tickets).repeat(43), expiresAt: Date.now() / 1000 + 60 });
      }
      if (path === "/api/loom/socket") {
        expect(request.headers.get("sec-websocket-protocol")).toContain(`loom.ticket.${String(tickets).repeat(43)}`);
        if (runtime.upgrade(request, { data: undefined, headers: { "sec-websocket-protocol": "loom.orpc.2" } })) return;
      }
      if (path === "/client.js") return new Response(bundle, { headers: { "content-type": "text/javascript" } });
      return new Response(
        '<html><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>',
        { headers: { "content-type": "text/html" } },
      );
    },
    websocket: {
      open(socket) {
        sockets.add(socket);
      },
      async message(socket, message) {
        await handler.message(socket, message);
      },
      async close(socket) {
        sockets.delete(socket);
        await handler.close(socket);
      },
    },
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(server.url.href);
    await page.getByTestId("one").filter({ hasText: "1" }).waitFor();
    expect(await page.getByTestId("two").textContent()).toBe("1");
    expect(calls).toBe(1);
    count = 2;
    for (const socket of sockets) socket.close(1012, "Restart");
    await page.getByTestId("one").filter({ hasText: "2" }).waitFor();
    expect(await page.getByTestId("two").textContent()).toBe("2");
    expect(calls).toBe(2);
    expect(tickets).toBe(2);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByText("Signed out").waitFor();
    expect(await page.getByTestId("one").count()).toBe(0);
    for (let attempt = 0; attempt < 20 && stopped !== 2; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    expect(stopped).toBe(2);
    expect(sockets.size).toBe(0);
  } finally {
    await browser.close();
    await server.stop(true);
  }
}, 20_000);
