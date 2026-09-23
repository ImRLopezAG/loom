import * as v from "valibot";

/** Loopback-only test session issuer and static host for the unchanged example frontend. */
export function startCloudFrontend(root: string, token: (subject: string) => Promise<string>) {
  let backend: string | undefined;
  const sessionInput = v.strictObject({ subject: v.picklist(["alice", "bob"]) });
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === "/session") {
        if (request.method !== "POST" || request.headers.get("origin") !== server.url.origin)
          return new Response(null, { status: 403 });
        const input = v.safeParse(sessionInput, await request.json().catch(() => null));
        if (!input.success) return new Response(null, { status: 400 });
        if (!backend) return new Response(null, { status: 503 });
        return Response.json(
          {
            token: await token(input.output.subject),
            identityKey: input.output.subject,
            url: backend,
            deployment: "preview",
          },
          { headers: { "cache-control": "no-store" } },
        );
      }
      if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405 });
      if (path === "/") return new Response(Bun.file(`${root}/dist/index.html`));
      if (/^\/assets\/[a-zA-Z0-9_.-]+$/.test(path)) return new Response(Bun.file(`${root}/dist${path}`));
      return new Response("Not found", { status: 404 });
    },
  });
  return {
    url: server.url,
    bind: (url: string) => {
      backend = url;
    },
    stop: () => server.stop(true),
  };
}
