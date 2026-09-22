import { expect, test } from "bun:test";
import { browserBundle } from "./bundle";
import type { Browser } from "playwright";
import { chromium } from "playwright";
import { createPublicHttpApp } from "@loom/core/neon";
import { createSubscriptionPoller, createWebSocketSession } from "@loom/core/server";
import type { VerifiedSession } from "@loom/core/server";

test("React browser hooks share inline-argument queries, reconnect and clear identity state", async () => {
  const bundle = await browserBundle();
  expect(bundle).not.toContain("node:crypto");
  expect(bundle).not.toContain("DATABASE_URL");
  let count = 0;
  let revision = 1;
  let evaluations = 0;
  const sessions = new Set<ReturnType<typeof createWebSocketSession>>();
  const tickets = new Map<string, VerifiedSession>();
  // These browser tests trust fixture identities; JWT and durable ticket authority have database integration coverage.
  const app = createPublicHttpApp({
    origins: [],
    verify: async (token) => ({
      identity: { issuer: "test", subject: token },
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    }),
    dispatcher: {
      public: async (call) => {
        if (call.kind === "mutation") {
          count++;
          revision++;
        }
        return { ok: true, requestId: "browser", value: call.kind === "action" ? "action-result" : count };
      },
    },
  });
  const poller = createSubscriptionPoller({
    intervalMs: 10,
    readRevisions: async () => ({ tasks: String(revision) }),
    evaluate: async (_call, identity) => {
      evaluations++;
      return {
        ok: true,
        requestId: "browser",
        value: { subject: identity.subject, count },
        revisions: { tasks: String(revision) },
      };
    },
  });
  interface SocketData {
    session: VerifiedSession;
    controller?: ReturnType<typeof createWebSocketSession>;
  }
  const server = Bun.serve<SocketData>({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request, runtime) {
      const url = new URL(request.url);
      if (url.pathname === "/")
        return new Response(
          '<!doctype html><html lang="en"><head><title>Loom fixture</title></head><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>',
          { headers: { "content-type": "text/html" } },
        );
      if (url.pathname === "/client.js")
        return new Response(bundle, { headers: { "content-type": "text/javascript" } });
      if (url.pathname === "/api/loom/ticket") {
        const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
        if (!token) return new Response(null, { status: 401 });
        const ticket = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
        const expiresAt = Math.floor(Date.now() / 1000) + 60;
        tickets.set(ticket, { identity: { issuer: "test", subject: token }, expiresAt });
        return Response.json({ protocol: 1, ok: true, requestId: "browser", value: { ticket, expiresAt } });
      }
      if (url.pathname === "/api/loom/socket") {
        const credential = request.headers
          .get("sec-websocket-protocol")
          ?.split(",")
          .map((value) => value.trim())
          .find((value) => value.startsWith("loom.ticket."))
          ?.slice(12);
        const session = credential ? tickets.get(credential) : undefined;
        if (!session || !credential) return new Response(null, { status: 401 });
        tickets.delete(credential);
        if (runtime.upgrade(request, { data: { session }, headers: { "sec-websocket-protocol": "loom.v1" } })) return;
        return new Response(null, { status: 400 });
      }
      // The real HTTP adapter checks Origin; use the same-origin request without that header in this fixture.
      const headers = new Headers(request.headers);
      headers.delete("origin");
      return app.fetch(new Request(request, { headers }));
    },
    websocket: {
      open(socket) {
        const controller = createWebSocketSession({
          session: socket.data.session,
          poller,
          socket: {
            get readyState() {
              return socket.readyState;
            },
            get bufferedAmount() {
              return socket.getBufferedAmount();
            },
            send(message) {
              socket.send(message);
            },
            close(code, reason) {
              socket.close(code, reason);
            },
          },
          onDispose() {
            sessions.delete(controller);
          },
        });
        socket.data.controller = controller;
        sessions.add(controller);
      },
      message(socket, data) {
        socket.data.controller?.message(data);
      },
      close(socket) {
        socket.data.controller?.dispose();
      },
    },
  });
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(server.url.href);
    await page.getByLabel("first", { exact: true }).filter({ hasText: "alice:0" }).waitFor();
    await page.getByLabel("second", { exact: true }).filter({ hasText: "alice:0" }).waitFor();
    const initial = evaluations;
    await page.getByRole("button", { name: "Render 0", exact: true }).click();
    await page.getByRole("button", { name: "Render 1", exact: true }).waitFor();
    expect(evaluations).toBe(initial);
    expect(sessions.size).toBe(1);
    await page.getByRole("button", { name: "Mutate", exact: true }).click();
    await page.getByLabel("first", { exact: true }).filter({ hasText: "alice:1" }).waitFor();
    const active = [...sessions];
    for (const session of active) session.stop();
    await page.getByLabel("first", { exact: true }).filter({ hasText: "loading" }).waitFor();
    await page.getByLabel("first", { exact: true }).filter({ hasText: "alice:1" }).waitFor();
    await page.getByRole("button", { name: "Run action", exact: true }).click();
    await page.getByLabel("action", { exact: true }).filter({ hasText: "action-result" }).waitFor();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByLabel("first", { exact: true }).filter({ hasText: "signed-out" }).waitFor();
    await page.getByRole("button", { name: "Sign in Bob", exact: true }).click();
    await page.getByLabel("first", { exact: true }).filter({ hasText: "bob:1" }).waitFor();
    await page.getByRole("button", { name: "Toggle queries", exact: true }).click();
    await page.getByLabel("first", { exact: true }).waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Toggle queries", exact: true }).click();
    await page.getByLabel("first", { exact: true }).filter({ hasText: "bob:1" }).waitFor();
    expect(errors).toEqual([]);
  } finally {
    await browser?.close();
    await server.stop(true);
    await poller.stop();
  }
}, 30000);
