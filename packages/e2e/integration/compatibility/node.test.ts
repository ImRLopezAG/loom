import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

test("Node 24 imports compiled Loom and provider exports without Bun globals", async () => {
  const process = Bun.spawn(
    [
      "node",
      "--input-type=module",
      "-e",
      `import assert from "node:assert/strict";
     assert.equal(Number(process.versions.node.split(".")[0]), 24);
     assert.equal("Bun" in globalThis, false);
     await import("./dist/server/index.js");
     await import("./dist/client/index.js");
     await import("./dist/react/index.js");
     await import("@neon/functions/hono");`,
    ],
    { cwd: fileURLToPath(new URL("../../../core/", import.meta.url)), stdout: "pipe", stderr: "pipe" },
  );
  const stderr = await new Response(process.stderr).text();
  expect({ code: await process.exited, stderr }).toEqual({ code: 0, stderr: "" });
});

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "patched introspection initializes independently in Node ESM and CommonJS",
  async () => {
    for (const mode of ["esm", "cjs"]) {
      const child = Bun.spawn(
        [
          "node",
          "--input-type=module",
          "-e",
          `
      import assert from "node:assert/strict";
      import { createRequire } from "node:module";
      import { drizzle } from "drizzle-orm/node-postgres";
      import pg from "pg";
      const api = process.argv[1] === "esm" ? await import("drizzle-kit/api-postgres")
        : createRequire(import.meta.url)("drizzle-kit/api-postgres");
      const namespace = "verify_" + crypto.randomUUID().replaceAll("-", "");
      const client = new pg.Client({ connectionString: process.env.LOOM_TEST_DATABASE_URL });
      await client.connect();
      try {
        await client.query('CREATE SCHEMA "' + namespace + '"');
        await client.query('CREATE TABLE "' + namespace + '".tasks (id integer PRIMARY KEY)');
        await client.query('BEGIN READ ONLY');
        const db = drizzle({ client });
        const snapshot = await api.inspectSchema(db, [namespace]);
        assert(snapshot.ddl.some(entity => entity.entityType === "tables" && entity.name === "tasks"));
        assert(snapshot.ddl.every(entity => !("schema" in entity) || entity.schema === namespace));
        await assert.rejects(api.inspectSchema(db, []), /explicit schema/);
      } finally {
        await client.query('ROLLBACK');
        await client.query('DROP SCHEMA "' + namespace + '" CASCADE');
        await client.end();
      }
    `,
          mode,
        ],
        {
          cwd: fileURLToPath(new URL("../../", import.meta.url)),
          stdout: "pipe",
          stderr: "pipe",
        },
      );
      const stderr = await new Response(child.stderr).text();
      expect({ mode, code: await child.exited, stderr }).toEqual({ mode, code: 0, stderr: "" });
    }
  },
);
