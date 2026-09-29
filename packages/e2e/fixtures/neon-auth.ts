import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:https";
import { request as proxyRequest } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import * as v from "valibot";

/** Local protocol fixture, not a Neon account or provider certification. */
export async function startTestNeonAuth(options: {
  token: (subject: string) => Promise<string>;
  origins: readonly string[];
  backendUrl?: string;
}) {
  const directory = await mkdtemp(join(tmpdir(), "loom-test-auth-"));
  const caFile = join(directory, "cert.pem");
  const keyFile = join(directory, "key.pem");
  const certificate = Bun.spawn(
    [
      "openssl",
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-days",
      "1",
      "-keyout",
      keyFile,
      "-out",
      caFile,
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost,IP:127.0.0.1",
    ],
    { stdout: "ignore", stderr: "pipe" },
  );
  if ((await certificate.exited) !== 0) {
    await rm(directory, { recursive: true, force: true });
    throw new Error(`Test certificate failed: ${await new Response(certificate.stderr).text()}`);
  }
  const cookieName = "__Secure-neon-auth.session_token";
  const sessions = new Map<string, string>();
  const sockets = new WebSocketServer({ noServer: true });
  const connections = new Set<WebSocket>();
  const server = createServer(
    { key: await readFile(keyFile), cert: await readFile(caFile) },
    async (request, response) => {
      const path = new URL(request.url ?? "/", "https://localhost").pathname.replace(/^\/api\/auth\//, "/auth/");
      if (!path.startsWith("/auth/")) {
        if (!options.backendUrl) {
          response.writeHead(404).end();
          return;
        }
        const upstream = proxyRequest(
          new URL(request.url ?? "/", options.backendUrl),
          {
            method: request.method,
            headers: request.headers,
          },
          (result) => {
            response.writeHead(result.statusCode ?? 502, result.headers);
            result.pipe(response);
          },
        );
        upstream.on("error", () => {
          if (!response.headersSent) response.writeHead(502);
          response.end();
        });
        request.pipe(upstream);
        return;
      }
      const origin = request.headers.origin;
      if (origin && !options.origins.includes(origin)) {
        response.writeHead(403).end();
        return;
      }
      if (origin) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Vary", "Origin");
        response.setHeader("Access-Control-Expose-Headers", "set-auth-jwt");
      }
      response.setHeader(
        "Access-Control-Allow-Headers",
        request.headers["access-control-request-headers"] ?? "content-type, authorization",
      );
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.setHeader("Cache-Control", "no-store");
      if (request.method === "OPTIONS") {
        response.writeHead(204).end();
        return;
      }
      response.setHeader("Content-Type", "application/json");
      const cookie = (request.headers.cookie ?? "")
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${cookieName}=`))
        ?.slice(cookieName.length + 1);
      const subject = cookie ? sessions.get(cookie) : undefined;
      const sessionData = (id: string, sessionToken: string) => {
        const now = new Date().toISOString();
        return {
          user: {
            id,
            name: id,
            email: `${id}@example.test`,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
            image: null,
          },
          session: {
            id: sessionToken,
            token: sessionToken,
            userId: id,
            expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
            createdAt: now,
            updatedAt: now,
          },
        };
      };
      try {
        if (path === "/auth/get-session") {
          if (subject) response.setHeader("set-auth-jwt", await options.token(subject));
          response.end(JSON.stringify(subject && cookie ? sessionData(subject, cookie) : null));
          return;
        }
        if (path === "/auth/token") {
          if (!subject) {
            response.writeHead(401).end(JSON.stringify({ message: "Unauthenticated" }));
            return;
          }
          response.end(JSON.stringify({ token: await options.token(subject) }));
          return;
        }
        if (path === "/auth/sign-out" && request.method === "POST") {
          if (cookie) sessions.delete(cookie);
          response.setHeader("Set-Cookie", `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`);
          response.end(JSON.stringify({ success: true }));
          return;
        }
        if (path === "/auth/sign-in/email" && request.method === "POST") {
          let body = "";
          for await (const chunk of request) {
            body += String(chunk);
            if (body.length > 4096) {
              response.writeHead(413).end();
              return;
            }
          }
          const input = v.safeParse(
            v.object({
              email: v.picklist(["alice@example.test", "bob@example.test"]),
              password: v.literal("fixture-password"),
            }),
            JSON.parse(body),
          );
          if (!input.success) {
            response.writeHead(401).end(JSON.stringify({ message: "Invalid credentials" }));
            return;
          }
          const id = input.output.email.split("@")[0]!;
          const opaque = crypto.randomUUID();
          sessions.set(opaque, id);
          response.setHeader("set-auth-jwt", await options.token(id));
          response.setHeader(
            "Set-Cookie",
            `${cookieName}=${opaque}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600`,
          );
          response.end(JSON.stringify({ ...sessionData(id, opaque), token: opaque, redirect: false }));
          return;
        }
        response.writeHead(404).end(JSON.stringify({ message: "Unknown fixture endpoint" }));
      } catch {
        response.writeHead(500).end(JSON.stringify({ message: "Fixture failure" }));
      }
    },
  );
  server.on("upgrade", (request, socket, head) => {
    if (!options.backendUrl) {
      socket.destroy();
      return;
    }
    const target = new URL(request.url ?? "/", options.backendUrl);
    target.protocol = "ws:";
    sockets.handleUpgrade(request, socket, head, (client) => {
      const protocols = request.headers["sec-websocket-protocol"]?.split(",").map((value) => value.trim());
      const upstream = new WebSocket(target, protocols, { headers: { origin: request.headers.origin ?? "" } });
      connections.add(client);
      connections.add(upstream);
      const pending: Array<{ data: Buffer; binary: boolean }> = [];
      client.on("message", (data, binary) => {
        const buffer = Buffer.isBuffer(data) ? data : Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data);
        if (upstream.readyState === WebSocket.OPEN) upstream.send(buffer, { binary });
        else pending.push({ data: buffer, binary });
      });
      upstream.on("open", () => {
        for (const message of pending) upstream.send(message.data, { binary: message.binary });
        pending.length = 0;
      });
      upstream.on("message", (data, binary) => {
        if (client.readyState === WebSocket.OPEN) client.send(data, { binary });
      });
      client.on("close", () => {
        connections.delete(client);
        if (upstream.readyState === WebSocket.CONNECTING) upstream.terminate();
        else upstream.close();
      });
      upstream.on("close", () => {
        connections.delete(upstream);
        client.close();
      });
      client.on("error", () => upstream.terminate());
      upstream.on("error", () => client.terminate());
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = v.parse(v.object({ port: v.number() }), server.address());
  const origin = `https://localhost:${address.port}`;
  return {
    origin,
    baseUrl: `${origin}/auth`,
    caFile,
    async stop() {
      for (const socket of connections) socket.terminate();
      sockets.close();
      server.closeAllConnections();
      try {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => {
            if (error && !("code" in error && error.code === "ERR_SERVER_NOT_RUNNING")) reject(error);
            else resolve();
          }),
        );
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
  };
}
