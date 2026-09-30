import assert from "node:assert/strict";
import { test } from "bun:test";
import { os, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { defineRelations } from "drizzle-orm";
import { createProjectContext, defineSchema, searchPublicNode } from "loom/server";
import { browserBundle } from "./bundle";
import { chromium } from "playwright";
const schema = defineSchema((s) => ({ tasks: { title: s.text().notNull(), done: s.boolean().notNull() } }), {
  namespace: "app",
});
const { validators } = createProjectContext(schema, defineRelations(schema.tables));
const search = validators.tables.tasks.search({ scope: "public", columns: ["title", "done"] });
test("packed finite options run browser previous/next, retry, suspense and projection changes", async () => {
  const bundle = await browserBundle("search-finite.tsx");
  const delayed = Promise.withResolvers<void>();
  let retries = 0;
  let calls = 0;
  const handler = new RPCHandler({
    list: os
      .input(search.input)
      .output(search.output)
      .handler(async ({ input }) => {
        calls++;
        if (input.columns?.done) await delayed.promise;
        if (input.cursor === "3" && retries++ === 0) throw new ORPCError("SERVICE_UNAVAILABLE");
        const limit = input.limit ?? 2,
          boundary = Number(input.cursor ?? 0);
        const start = input.direction === "backward" ? Math.max(0, boundary - limit) : boundary;
        const end = input.direction === "backward" ? boundary : Math.min(5, start + limit);
        return {
          rows: Array.from({ length: end - start }, (_, index) =>
            input.columns?.done ? { done: true } : { title: `T${start + index}` },
          ),
          previousCursor: start === 0 ? null : String(start),
          nextCursor: end === 5 ? null : String(end),
        };
      }),
  });
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path.startsWith("/api/loom/rpc/")) {
        assert.equal(request.headers.get("authorization"), "Bearer alice");
        const result = await handler.handle(request, { prefix: "/api/loom/rpc" });
        return result.response ?? new Response(null, { status: 404 });
      }
      if (path === "/client.js") return new Response(bundle, { headers: { "content-type": "text/javascript" } });
      return new Response(
        `<html><body><div id="root"></div><script id="search-policy" type="application/json">${JSON.stringify(searchPublicNode(search.input))}</script><script type="module" src="/client.js"></script></body></html>`,
        { headers: { "content-type": "text/html" } },
      );
    },
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage(),
      errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(server.url.href);
    await page.getByTestId("finite").filter({ hasText: "T1" }).waitFor();
    await page.getByTestId("suspense").filter({ hasText: "T0" }).waitFor();
    await page.getByTestId("pages").filter({ hasText: "T2" }).waitFor();
    await page.getByRole("button", { name: "Load previous", exact: true }).click();
    await page.getByTestId("pages").filter({ hasText: "T0" }).waitFor();
    await page.getByRole("button", { name: "Load next", exact: true }).click();
    await page.getByTestId("pages").filter({ hasText: "T4" }).waitFor();
    assert.equal(retries, 2);
    assert.deepEqual(
      JSON.parse((await page.getByTestId("pages").textContent()) ?? "null"),
      Array.from({ length: 5 }, (_, index) => ({ title: `T${index}` })),
    );
    assert(await page.getByRole("button", { name: "Load next", exact: true }).isDisabled());
    assert(await page.getByRole("button", { name: "Load previous", exact: true }).isDisabled());
    await page.getByRole("button", { name: "Done projection", exact: true }).click();
    await page.getByTestId("finite").filter({ hasText: "loading" }).waitFor();
    delayed.resolve();
    await page.getByTestId("finite").filter({ hasText: '"done":true' }).waitFor();
    assert(!(await page.getByTestId("finite").textContent())?.includes("title"));
    assert(calls >= 6);
    assert.deepEqual(errors, []);
  } finally {
    delayed.resolve();
    await browser.close();
    await server.stop(true);
  }
}, 30000);
