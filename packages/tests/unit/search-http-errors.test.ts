import { expect, test } from "vite-plus/test";
import { ORPCError } from "@orpc/server";
import { createRpcHttpApp, createRpcOpenApiApp } from "kello/neon";
import { createProjectProcedures, defineSchema } from "kello/server";
import { searchErrors } from "kello/contract";
import * as v from "valibot";

test("search errors retain codes and HTTP 400 in RPC, REST and OpenAPI", async () => {
  const { procedure } = createProjectProcedures(defineSchema(() => ({})));
  const codes = ["INVALID_SELECTION", "INVALID_CURSOR", "QUERY_BUDGET_EXCEEDED"] as const;
  const router = Object.fromEntries(
    codes.map((code) => [
      code,
      procedure
        .errors(searchErrors)
        .output(v.null())
        .handler(() => {
          if (code === "INVALID_CURSOR") throw new ORPCError(code, { data: { restart: true } });
          throw new ORPCError(code);
        }),
    ]),
  );
  const version = "a".repeat(64);
  const options = {
    router,
    version,
    origins: [],
    allowAnonymous: true,
    verify: async () => {
      throw new Error("Anonymous fixture must not verify");
    },
  };
  const rpc = createRpcHttpApp(options);
  const rest = await createRpcOpenApiApp(options);
  for (const code of codes) {
    expect(rest.document.paths?.[`/${code}`]?.post?.responses?.["400"]).toBeDefined();
    for (const [prefix, app, body] of [
      ["rpc", rpc, '{"json":null}'],
      ["openapi", rest, "null"],
    ] as const) {
      const response = await app.fetch(
        new Request(`https://service.test/api/kello/${prefix}/${code}`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-loom-version": version, "x-loom-protocol": "loom-orpc-2" },
          body,
        }),
      );
      expect(response.status).toBe(400);
      const payload =
        prefix === "rpc"
          ? v.parse(v.object({ json: v.object({ code: v.string() }) }), await response.json()).json
          : v.parse(v.object({ code: v.string() }), await response.json());
      expect(payload.code).toBe(code);
    }
  }
});
