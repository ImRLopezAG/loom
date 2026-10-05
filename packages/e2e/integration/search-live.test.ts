import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgSchema } from "drizzle-orm/pg-core";
import { sql, getTableName } from "drizzle-orm";
import { Context } from "effect";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api-postgres";
import { RPCLink } from "@orpc/client/websocket";
import { RPCHandler } from "@orpc/server/websocket";
import { ORPCError } from "@orpc/server";
import * as v from "valibot";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import type { JsonValue } from "kello/server";
import {
  bootstrapDatabase,
  generateProject,
  initializeProject,
  loadProject,
  installRevisionTracking,
} from "kello/tooling";
import { writeSearchComponent } from "../fixtures/search-component";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
const row = v.strictObject({ title: v.string(), labels: v.array(v.strictObject({ name: v.string() })) });
const windowSchema = v.strictObject({
  pages: v.array(v.array(row)),
  nextCursor: v.nullable(v.string()),
  previousCursor: v.nullable(v.string()),
  count: v.string(),
});
const iteratorSchema = v.custom<AsyncIteratorObject<unknown, unknown>>((value) =>
  v.is(v.object({ next: v.function() }), value),
);

/** Bounded waits report failures instead of leaving database acceptance running indefinitely. */
async function bounded<Value>(value: Promise<Value>, label = "operation"): Promise<Value> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      value,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Live search timed out: ${label}`)), 15000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

test.skipIf(!connectionString)(
  "native search watch publishes coherent windows from Neon snapshots (U7)",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const root = await mkdtemp(join(tmpdir(), "loom-search-live-"));
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_search_live_${suffix}`;
    const role = `search_live_reader_${suffix}`;
    const namespace = `live_${suffix}`;
    const namespaces = new Set([namespace]);
    const owner = new pg.Pool({ connectionString });
    let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
    let server: ReturnType<typeof Bun.serve> | undefined;
    let socket: WebSocket | undefined;
    const streams: AsyncIteratorObject<unknown, unknown>[] = [];
    const controller = new AbortController();
    try {
      await initializeProject(root, "searchlive");
      await mkdir(join(root, "node_modules"));
      for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
        await symlink(
          await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
          join(root, "node_modules", name),
        );
      await writeFile(
        join(root, "kello.config.ts"),
        `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { namespace: "${namespace}", metadataNamespace: "${metadataNamespace}" } });`,
      );
      for (const path of ["contracts", "functions"]) {
        await rm(join(root, "kello", path), { recursive: true });
        await mkdir(join(root, "kello", path));
      }
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema } from "kello/server"; export default defineSchema(() => ({}), { namespace: "${namespace}" });`,
      );
      await writeSearchComponent(join(root, "kello"));
      const schemaFile = join(root, "kello/components/catalog/schema.ts");
      await writeFile(
        schemaFile,
        (await readFile(schemaFile, "utf8")).replace(
          "taskLabels: defineTable",
          "permissions: defineTable({ allowed: s.boolean().notNull() }), taskLabels: defineTable",
        ),
      );
      const contractFile = join(root, "kello/components/catalog/contracts/items.ts");
      await writeFile(
        contractFile,
        ('import { searchErrors } from "kello/contract";\n' + (await readFile(contractFile, "utf8"))).replace(
          "return { list:",
          `const live = validators.tables.tasks.liveSearch({ scope: "public", columns: ["title", "done"], filter: ["title", "done"], order: ["title"], through: { taskLabels: "public" }, relations: { labels: { scope: "public", columns: ["name"] } } }); return { watch: oc.errors({ ...searchErrors, FORBIDDEN: { status: 403, message: "Access revoked" } }).input(live.input).output(live.output), list:`,
        ),
      );
      const functionFile = join(root, "kello/components/catalog/functions/items.ts");
      await writeFile(
        functionFile,
        (await readFile(functionFile, "utf8")).replace(
          "list: os.items.list.handler",
          "watch: os.items.watch.handler(({ context, input }) => context.search.tasks.watch(input)), list: os.items.list.handler",
        ),
      );
      await writeFile(
        join(root, "kello/components/catalog/internal/items.ts"),
        (await readFile(functionFile, "utf8")).replaceAll("os.items", "os.internal.items"),
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        `import { defineApplication } from "kello"; import catalog from "./components/catalog/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(catalog, { name: "${namespace}", public: "store" }); export default app;`,
      );
      await generateProject(root);
      const project = await loadProject(root);
      const scope = project.componentScopes[0];
      assert(scope);
      namespaces.add(scope.namespace);
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole: role });
      const actor = await owner.query<{ name: string }>("SELECT current_user AS name");
      assert(actor.rows[0]);
      await owner.query(`GRANT "${role}" TO "${actor.rows[0].name.replaceAll('"', '""')}"`);
      await owner.query(`ALTER ROLE "${role}" LOGIN PASSWORD 'loom-search-Live-07!'`);
      const empty = await generateDrizzleJson({}, undefined, [scope.namespace]);
      const snapshot = await generateDrizzleJson(
        { namespace: pgSchema(scope.namespace), ...scope.schema.tables },
        empty.id,
        [scope.namespace],
      );
      await owner.query((await generateMigration(empty, snapshot)).join("\n"));
      await owner.query(`INSERT INTO "${scope.namespace}".permissions (allowed) VALUES (true)`);
      const db = drizzle({ client: owner, relations: scope.relations });
      const tasks = scope.schema.tables.tasks;
      const labels = scope.schema.tables.labels;
      const junction = scope.schema.tables.taskLabels;
      assert(tasks && labels && junction);
      const insert = async (title: string) => {
        await db.insert(tasks).values({ title, done: false, at: new Date("2026-01-01"), count: 1n, amount: "1" });
      };
      for (const title of ["A", "B", "C", "D", "E"]) await insert(title);
      const task = (await db.select().from(tasks)).find((row) => row.title === "A");
      const label = (await db.insert(labels).values({ name: "old" }).returning())[0];
      assert(task && label);
      await db.insert(junction).values({ taskId: task._id, labelId: label._id });
      const admin = await owner.connect();
      try {
        await admin.query("BEGIN");
        await installRevisionTracking(
          admin,
          scope.namespace,
          metadataNamespace,
          Object.values(scope.schema.tables).map(getTableName),
        );
        await admin.query("COMMIT");
      } finally {
        admin.release();
      }
      await owner.query(
        `GRANT USAGE ON SCHEMA "${scope.namespace}" TO "${role}"; GRANT SELECT ON ALL TABLES IN SCHEMA "${scope.namespace}" TO "${role}"`,
      );
      const address = new URL(connectionString);
      address.username = role;
      address.password = "loom-search-Live-07!";
      let authorizations = 0;
      runtime = await createRpcRuntime({
        schema: project.schema,
        relations: project.relations,
        connectionString: address.href,
        application: project.application,
        version: project.version,
        deployment: "search-live",
        metadataNamespace,
        branchId: "br-wispy-dew-awdp5g3y",
        environment: { LOOM_SEARCH_CURSOR_KEY: "07".repeat(32) },
        config: { realtime: { pollIntervalMs: 60000 } },
        auth: defineRpcAuth({
          authorize: async ({ db }) => {
            authorizations++;
            if (db) {
              const result = await db.execute<{ transaction_read_only: string }>(sql`SHOW transaction_read_only`);
              assert.equal(result.rows[0]?.transaction_read_only, "on");
              const permission = await db.execute<{ allowed: boolean }>(
                sql`SELECT allowed FROM ${sql.identifier(scope.namespace)}.permissions`,
              );
              if (!permission.rows[0]?.allowed) throw new ORPCError("FORBIDDEN");
            }
          },
        }),
        procedures: scope.procedures.map((entry) => ({
          scope: scope.mountPath,
          path: entry.path,
          visibility: entry.visibility === "internal" ? ("internal" as const) : ("exported" as const),
          procedure: entry.definition,
        })),
        scopes: [
          { name: "", dependencies: {} },
          { name: scope.mountPath, dependencies: {}, schema: scope.schema },
        ],
        exposures: [{ scope: scope.mountPath, prefix: "store" }],
        assertActive: async () => {},
      });
      const invocation = {
        identity: { issuer: "https://auth.test", subject: "reader" },
        requestId: crypto.randomUUID(),
        signal: controller.signal,
      };
      const context = {
        ...invocation,
        expiresAt: Math.floor(Date.now() / 1000) + 120,
        "effect/context": Context.make(Invocation, invocation),
      };
      const handler = new RPCHandler(runtime.router);
      server = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        fetch(request, server) {
          if (server.upgrade(request, { data: undefined })) return;
          return new Response(null, { status: 400 });
        },
        websocket: {
          async message(socket, message) {
            await handler.message(socket, message, { context });
          },
          async close(socket) {
            await handler.close(socket);
          },
        },
      });
      socket = new WebSocket(`ws://127.0.0.1:${server.port}`);
      const link = new RPCLink({ connect: () => socket! });
      const selection = {
        columns: { title: true },
        with: { labels: { columns: { name: true } } },
        orderBy: [{ field: "title", direction: "asc" }],
        limit: 2,
        loadedPages: 2,
        count: true,
      };
      const start = async (input: JsonValue = selection) => {
        const stream = v.parse(
          iteratorSchema,
          await bounded(link.call(["store", "items", "watch"], input, { context: {} })),
        );
        streams.push(stream);
        return stream;
      };
      const stream = await start();
      const next = async (stream: AsyncIteratorObject<unknown, unknown>) => {
        const result = await bounded(stream.next());
        assert(!result.done);
        return v.parse(windowSchema, result.value);
      };
      const first = await next(stream);
      assert.deepEqual(
        first.pages.map((page) => page.map((row) => row.title)),
        [
          ["A", "B"],
          ["C", "D"],
        ],
      );
      assert.equal(first.count, "5");
      assert(first.nextCursor);
      assert.equal(authorizations, 2);
      const check = async (expected: string[], count: string) => {
        await runtime!.realtime.coordinator.poll();
        const value = await next(stream);
        assert.deepEqual(
          value.pages.flat().map((row) => row.title),
          expected,
        );
        assert.equal(new Set(value.pages.flat().map((row) => row.title)).size, expected.length);
        assert.equal(value.count, count);
        return value;
      };
      await insert("AA");
      await check(["A", "AA", "B", "C"], "6");
      await owner.query(`DELETE FROM "${scope.namespace}".tasks WHERE title='B'`);
      await check(["A", "AA", "C", "D"], "5");
      await owner.query(`UPDATE "${scope.namespace}".tasks SET title='AB' WHERE title='E'`);
      await check(["A", "AA", "AB", "C"], "5");
      await owner.query(`UPDATE "${scope.namespace}".labels SET name='new'`);
      const changed = await check(["A", "AA", "AB", "C"], "5");
      assert.equal(changed.pages[0]?.[0]?.labels[0]?.name, "new");
      await db.delete(junction);
      const disconnected = await check(["A", "AA", "AB", "C"], "5");
      assert.deepEqual(disconnected.pages[0]?.[0]?.labels, []);
      const expanded = await start({ ...selection, loadedPages: 3 });
      assert.deepEqual(
        (await next(expanded)).pages.map((page) => page.map((row) => row.title)),
        [["A", "AA"], ["AB", "C"], ["D"]],
      );
      await expanded.return?.();
      const resumed = await start({ ...selection, anchor: changed.nextCursor! });
      assert.deepEqual(
        (await next(resumed)).pages.flat().map((row) => row.title),
        ["D"],
      );
      await resumed.return?.();
      await owner.query(`DELETE FROM "${scope.namespace}".tasks`);
      const emptyValue = await check([], "0");
      assert.deepEqual(emptyValue.pages, []);
      assert.equal(emptyValue.nextCursor, null);
      await insert("Z");
      await check(["Z"], "1");
      await owner.query(`UPDATE "${scope.namespace}".permissions SET allowed=false`);
      await runtime.realtime.coordinator.poll();
      await assert.rejects(() => bounded(stream.next()), { code: "FORBIDDEN" });
      const busy = await owner.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM pg_stat_activity WHERE usename=$1 AND state='idle in transaction'",
        [role],
      );
      assert.equal(busy.rows[0]?.count, 0);
    } finally {
      controller.abort();
      for (const stream of streams) await stream.return?.();
      socket?.close();
      await runtime?.stop();
      await server?.stop(true);
      for (const namespace of namespaces) await owner.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await owner.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await owner.query(`DROP ROLE IF EXISTS "${role}"`);
      await owner.end();
      await rm(root, { recursive: true, force: true });
    }
  },
  120000,
);
