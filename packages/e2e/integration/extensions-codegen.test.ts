import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import * as v from "valibot";
import assert from "node:assert/strict";
import { join } from "node:path";
import { expect, test } from "bun:test";
import { Context, Effect, Layer, Option } from "effect";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createEffectRuntime } from "../../../apps/loom/src/core/server/effect/runtime";
import { createRevisionCoordinator } from "../../../apps/loom/src/core/server/realtime/coordinator";
import { bindRuntimeGraph } from "../../../apps/loom/src/core/server/rpc/runtime-graph";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { createComponentEnvironmentAccess } from "../../../apps/loom/src/core/server/components/environment";
import { defineComponent } from "../../../apps/loom/src/core/server/components/definition";
import {
  createApplicationEnvironmentAccess,
  defineApplication,
  prepareApplicationEnvironment,
} from "../../../apps/loom/src/core/server/application/definition";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { defineRelations } from "drizzle-orm";
import { createExtensionBindings, resolveComponentExtensions } from "../../../apps/loom/src/core/extensions/bindings";
import { createProjectContext, createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { createProjectServices } from "../../../apps/loom/src/core/server/effect/services";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { defineConfig } from "../../../apps/loom/src/tooling/config/define-config";

test("empty selections are undefined and configured selections preserve exact descriptors", () => {
  for (const input of [undefined, {}, { pg_trgm: undefined }]) {
    expect(createExtensionBindings(input)).toBeUndefined();
    expect(extensionBindingsSource(input)).toContain("export const extensions = undefined");
  }
  const config = defineConfig({ database: { extensions: { pg_trgm: { version: "unknown" } } } });
  const extensions = createExtensionBindings(config.database.extensions);
  expect(Object.keys(extensions!)).toEqual(["pg_trgm"]);
  expect(extensions!.pg_trgm).toMatchObject({ name: "pg_trgm", version: "unknown", schema: "extensions" });
  expect(extensions!.pg_trgm).not.toHaveProperty("similarity");
  expect(createExtensionBindings({ pg_trgm: undefined, vector: { version: "0.8.2" } })).toHaveProperty(
    "vector.version",
    "0.8.2",
  );
});

test("deferred server environment facades keep declared keys and read each validated invocation", async () => {
  const app = defineApplication({ env: { FIRST: v.string(), SECOND: v.string() }, rpc: ({ os }) => ({ os }) });
  const component = defineComponent({ name: "child", env: { KEY: v.string() } });
  const applicationEnv = createApplicationEnvironmentAccess(() => app);
  const componentEnv = createComponentEnvironmentAccess(() => component);
  app.use(component, { env: { KEY: app.env.FIRST } });
  app.use(component, { name: "other", env: { KEY: app.env.SECOND } });
  expect(Object.keys(applicationEnv)).toEqual(["FIRST", "SECOND"]);
  expect(Object.keys(componentEnv)).toEqual(["KEY"]);
  assert.throws(() => componentEnv.KEY, /unavailable/);
  const runtime = await prepareApplicationEnvironment(app, { FIRST: "one", SECOND: "two" });
  expect(runtime.run(() => applicationEnv.FIRST)).toBe("one");
  expect(runtime.runComponent("child", () => componentEnv.KEY)).toBe("one");
  expect(runtime.runComponent("other", () => componentEnv.KEY)).toBe("two");
  expect(Reflect.set(componentEnv, "KEY", "wrong")).toBe(false);
});

test("component requirements fail early and bind only the declared host subset", () => {
  const host = { pg_trgm: { version: "1.6", schema: "text_search" }, vector: { version: "0.8.2", schema: "vectors" } };
  const requirements = { pg_trgm: { versions: ["1.6"] } };
  assert.throws(() => resolveComponentExtensions(undefined, requirements), /Missing.*pg_trgm/);
  assert.throws(() => resolveComponentExtensions(host, { pg_trgm: { versions: ["1.5"] } }), /Incompatible.*pg_trgm/);
  expect(resolveComponentExtensions(host, requirements)).toEqual({ pg_trgm: host.pg_trgm });
  expect(resolveComponentExtensions(host, undefined)).toBeUndefined();
});

test("RPC invocation and distinct Effect service use the same selected binding", async () => {
  const schema = defineSchema(() => ({}));
  const otherSchema = defineSchema(() => ({}));
  const relations = defineRelations(schema.tables);
  const extensions = createExtensionBindings({ pg_trgm: { version: "1.6", schema: "text_search" } });
  const binding = createProjectContext(schema, relations, extensions);
  const services = createProjectServices<typeof schema, typeof relations, typeof extensions>(schema);
  const other = createProjectServices<typeof otherSchema, typeof relations, typeof extensions>(otherSchema);
  expect(services.Extensions.key).not.toBe(services.Database.key);
  expect(services.Extensions.key).not.toBe(other.Extensions.key);
  expect(binding.extensions).toBe(extensions);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const { call } = await import("@orpc/server");
  const handler = procedure.handler(({ context }) => {
    expect(context.extensions).toBe(extensions);
    const value = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    expect(value).toBe(extensions);
    return value;
  });
  const value = await call(handler, undefined, {
    context: {
      requestId: "extensions",
      identity: null,
      signal: new AbortController().signal,
      "effect/context": Context.make(Invocation, {
        identity: null,
        requestId: "extensions",
        signal: new AbortController().signal,
      }),
    },
  });
  expect(value).toEqual(extensions);
  const effect = procedure.effect(function* () {
    const value = yield* services.Extensions;
    expect(value).toBe(extensions);
    return value.pg_trgm.schema;
  });
  expect(
    await call(effect, undefined, {
      context: {
        requestId: "effect-extensions",
        identity: null,
        signal: new AbortController().signal,
        "effect/context": Context.make(Invocation, {
          identity: null,
          requestId: "extensions",
          signal: new AbortController().signal,
        }),
      },
    }),
  ).toBe("text_search");
});

test("legacy no-argument Extensions service resolves the undefined binding", async () => {
  const schema = defineSchema(() => ({}));
  const relations = defineRelations(schema.tables);
  const services = createProjectServices<typeof schema, typeof relations>();
  const { procedure } = createProjectProcedures(schema, relations);
  const handler = procedure.handler(({ context }) => {
    expect(Option.getOrThrow(Context.getOption(context["effect/context"], services.Extensions))).toBeUndefined();
  });
  const { call } = await import("@orpc/server");
  const invocation = { identity: null, requestId: "legacy-extensions", signal: new AbortController().signal };
  await call(handler, undefined, {
    context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
  });
});

test("direct component HTTP binds its selected extensions and scoped Effect service", async () => {
  const schema = defineSchema(() => ({}));
  const instanceSchema = defineSchema(() => ({}));
  const unrelatedSchema = defineSchema(() => ({}));
  const relations = defineRelations(schema.tables);
  const host = { pg_trgm: { version: "1.6", schema: "host_text" }, vector: { version: "0.8.2", schema: "vectors" } };
  const extensions = createExtensionBindings(resolveComponentExtensions(host, { pg_trgm: { versions: ["1.6"] } }));
  const services = createProjectServices<typeof schema, typeof relations, typeof extensions>(schema);
  const instanceServices = createProjectServices<typeof instanceSchema, typeof relations, typeof extensions>(
    instanceSchema,
  );
  const unrelatedServices = createProjectServices<typeof unrelatedSchema, typeof relations, typeof extensions>(
    unrelatedSchema,
  );
  const packageSchema = defineSchema(() => ({}));
  const packageServices = createProjectServices<typeof packageSchema, typeof relations, typeof extensions>(
    packageSchema,
  );
  const effects = createEffectRuntime(Layer.empty);
  const coordinator = createRevisionCoordinator({ readRevisions: async () => ({}) });
  // HTTP extension binding must not open a database connection.
  const pool = new pg.Pool({ connectionString: "postgresql://unused:unused@127.0.0.1:1/unused" });
  const db = drizzle({ client: pool });
  const graph = bindRuntimeGraph({
    entries: [],
    scopes: [
      { name: "", dependencies: {} },
      {
        name: "child",
        dependencies: {},
        schema: instanceSchema,
        extensionServiceSchema: schema,
        extensionService: packageServices.Extensions,
        extensions,
      },
    ],
    application: { run: (work) => work(), runComponent: (_scope, work) => work() },
    effects,
    coordinator,
    activate: async () => {},
    authorize: async () => {},
    database: {
      connection: { db, pool, transaction: db.transaction.bind(db), close: () => pool.end() },
      replay: { metadataNamespace: "loom", deployment: "test" },
      authorize: async () => {},
    },
  });
  try {
    await graph.invokeComponentHttp(
      "child",
      { request: new Request("https://example.test"), signal: new AbortController().signal, session: null },
      async (context) => {
        expect(context).toHaveProperty("extensions", extensions);
        expect(Option.getOrThrow(Context.getOption(context["effect/context"], services.Extensions))).toBe(extensions);
        expect(Option.getOrThrow(Context.getOption(context["effect/context"], instanceServices.Extensions))).toBe(
          extensions,
        );
        expect(Option.getOrThrow(Context.getOption(context["effect/context"], packageServices.Extensions))).toBe(
          extensions,
        );
        expect(Option.isNone(Context.getOption(context["effect/context"], unrelatedServices.Extensions))).toBe(true);
        const legacy = createProjectServices<typeof schema, typeof relations>();
        expect(Option.getOrThrow(Context.getOption(context["effect/context"], legacy.Extensions))).toBeUndefined();
        expect(Object.keys(extensions!)).toEqual(["pg_trgm"]);
        expect(extensions!.pg_trgm?.schema).toBe("host_text");
      },
    );
  } finally {
    await graph.stop();
    await effects.stop();
    await coordinator.stop();
    await pool.end();
  }
});

test("pg_cron alone accepts the provider control placement without weakening reserved namespaces", async () => {
  const config = defineConfig({ database: { extensions: { pg_cron: { version: "1.6", schema: "pg_catalog" } } } });
  expect(config.database.extensions.pg_cron.schema).toBe("pg_catalog");
  expect(extensionBindingsSource(config.database.extensions)).toContain('"schema":"pg_catalog"');
  assert.throws(() =>
    defineConfig({ database: { extensions: { pg_trgm: { version: "1.6", schema: "pg_catalog" } } } }),
  );
  assert.throws(() => defineConfig({ database: { extensions: { pg_cron: { version: "1.6", schema: "pg_other" } } } }));
  const { extensionStateValidator } = await import("../../../apps/loom/src/tooling/migrations/extensions");
  const state = { name: "pg_cron" as const, version: "1.6", schema: "pg_catalog", requires: [] };
  expect(v.parse(extensionStateValidator, state)).toEqual(state);
  expect(v.safeParse(extensionStateValidator, { ...state, name: "pg_trgm" }).success).toBe(false);
  expect(v.safeParse(extensionStateValidator, { ...state, schema: "pg_other" }).success).toBe(false);
});

test("verified fixed-schema contracts require their explicit installation namespace", () => {
  assert.throws(
    () => extensionBindingsSource({ pg_graphql: { version: "1.5.12", schema: "extensions" } }),
    /requires fixed installation schema graphql/,
  );
  assert.throws(
    () => extensionBindingsSource({ pg_cron: { version: "1.6", schema: "extensions" } }),
    /requires fixed installation schema pg_catalog/,
  );
  const source = extensionBindingsSource({ pg_graphql: { version: "1.5.12", schema: "graphql" } });
  expect(source).toContain('"schema":"graphql"');
  expect(source).toContain('"status":"verified"');
});

async function projectFixture() {
  const { mkdtemp, mkdir, realpath, symlink } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { fileURLToPath } = await import("node:url");
  const tooling = await import("loom/tooling");
  const root = await mkdtemp(join(tmpdir(), "loom-extension-bindings-"));
  await tooling.initializeProject(root, "extensionbindings");
  await mkdir(join(root, "node_modules"));
  for (const name of ["loom", "valibot", "drizzle-orm", "effect"]) {
    await symlink(
      await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
      join(root, "node_modules", name),
    );
  }
  return root;
}

async function checkFixtureTypes(root: string) {
  const { fileURLToPath } = await import("node:url");
  const process = Bun.spawn(
    [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
    { stdout: "pipe", stderr: "pipe" },
  );
  const output = (await new Response(process.stdout).text()) + (await new Response(process.stderr).text());
  assert.equal(await process.exited, 0, output);
}

test("first-load schema imports share independent exact bindings with disk generation", async () => {
  const { writeFile, readFile, rm } = await import("node:fs/promises");
  const { pathToFileURL } = await import("node:url");
  const tooling = await import("loom/tooling");
  for (const selection of [undefined, {}, { pg_trgm: { version: "unverified" } }] as const) {
    const root = await projectFixture();
    try {
      const expected =
        selection && "pg_trgm" in selection
          ? { pg_trgm: { name: "pg_trgm", version: "unverified", schema: "extensions" } }
          : undefined;
      await writeFile(
        join(root, "loom.config.ts"),
        `import { defineConfig } from "loom/tooling"; export default defineConfig(${JSON.stringify(selection === undefined ? {} : { database: { extensions: selection } })});`,
      );
      await writeFile(
        join(root, "loom/app.config.ts"),
        `import { defineApplication } from "loom/server"; import { Extensions } from "./_generated/server"; export default defineApplication({ rpc: ({ os }) => { void Extensions; return { os }; } });`,
      );
      await writeFile(
        join(root, "loom/schema.ts"),
        `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
${expected ? 'if (!extensions || Object.keys(extensions).join(",") !== "pg_trgm" || extensions.pg_trgm.schema !== "extensions" || extensions.pg_trgm.version !== "unverified") throw new Error("Wrong first-load extension bindings");' : 'if (extensions !== undefined) throw new Error("Wrong first-load empty bindings");'}
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
      );
      await writeFile(
        join(root, "loom/functions/tasks.ts"),
        `import { os } from "../_generated/rpc";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
${expected ? 'const version: "unverified" = context.extensions.pg_trgm.version; const schema: "extensions" = context.extensions.pg_trgm.schema;\n// @ts-expect-error Only selected keys exist.\ncontext.extensions.vector;\n// @ts-expect-error Unsupported versions expose no invented helpers.\ncontext.extensions.pg_trgm.similarity;\nreturn [version, schema];' : "const extensions: undefined = context.extensions; return [];"}
}) });`,
      );
      await tooling.loadProject(root);
      const first = await tooling.generateProject(root);
      const source = await readFile(join(root, "loom/_generated/extensions.ts"), "utf8");
      expect(source).not.toContain("../schema");
      expect(source).not.toContain("./server");
      expect(source).not.toContain("loom.config");
      const disk = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
      if (expected) {
        expect(Object.keys(disk.extensions)).toEqual(["pg_trgm"]);
        expect(disk.extensions.pg_trgm).toMatchObject(expected.pg_trgm);
        expect(disk.extensions.pg_trgm.apiSupport.status).toBe("unverified");
      } else expect(disk.extensions).toBeUndefined();
      await checkFixtureTypes(root);
      expect((await tooling.generateProject(root)).version).toBe(first.version);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
}, 30000);

test("mounted component generation validates requirements and shares host namespaces with its exact subset", async () => {
  const { writeFile, readFile, mkdir, rm } = await import("node:fs/promises");
  const tooling = await import("loom/tooling");
  const root = await projectFixture();
  try {
    const directory = join(root, "loom/components/search");
    await mkdir(join(directory, "contracts"), { recursive: true });
    await mkdir(join(directory, "functions"));
    await writeFile(
      join(directory, "setup.ts"),
      `import { defineComponent } from "./_generated/setup";
export default defineComponent({ name: "search", extensions: { pg_trgm: { versions: ["1.6"] } }, rpc: ({ os }) => ({ os }) });`,
    );
    await writeFile(
      join(root, "loom/app.config.ts"),
      `import { defineApplication } from "loom/server"; import search from "./components/search/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(search); export default app;`,
    );
    await assert.rejects(tooling.generateProject(root), /Missing component extension requirement: pg_trgm/);
    await writeFile(
      join(root, "loom.config.ts"),
      `import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "1.5" } } } });`,
    );
    await assert.rejects(tooling.generateProject(root), /Incompatible component extension requirement: pg_trgm/);
    await writeFile(
      join(root, "loom.config.ts"),
      `import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "1.6", schema: "host_search" }, vector: { version: "0.8.2", schema: "host_vectors" } } } });`,
    );
    await writeFile(
      join(directory, "schema.ts"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions"; if (extensions.pg_trgm.schema !== "host_search" || Object.keys(extensions).join(",") !== "pg_trgm") throw new Error("Wrong component extension subset"); export default defineSchema(() => ({}));`,
    );
    await writeFile(
      join(directory, "contracts/description.ts"),
      `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ get: oc.output(v.string()) });`,
    );
    await writeFile(
      join(directory, "functions/description.ts"),
      `import { os } from "../_generated/rpc"; export default os.description.router({ get: os.description.get.handler(({ context }) => { const namespace: "host_search" = context.extensions.pg_trgm.schema; const version: "1.6" = context.extensions.pg_trgm.version;
// @ts-expect-error A component cannot inherit undeclared host extensions.
context.extensions.vector;
return namespace + version; }) });`,
    );
    await writeFile(
      join(directory, "setup.ts"),
      `import { defineComponent } from "./_generated/setup";
import { Extensions, env } from "./_generated/server"; import { Effect } from "effect"; import * as v from "valibot";
// Break the existing circular setup/env type inference with the HTTP response contract.
export default defineComponent({ name: "search", env: { KEY: v.optional(v.string(), "default") }, extensions: { pg_trgm: { versions: ["1.6"] } }, rpc: ({ os }) => ({ os }), http: [{ method: "GET", path: "/describe", access: { kind: "anonymous" }, handle: ({ context }): Response => {
const namespace: "host_search" = context.extensions.pg_trgm.schema;
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
const version: "1.6" = binding.pg_trgm.version;
// @ts-expect-error HTTP receives only declared extensions.
void context.extensions.vector;
return new Response(env.KEY + namespace + version); } }] });`,
    );
    const generated = await tooling.generateProject(root);
    const { pathToFileURL } = await import("node:url");
    const runtime = await import(pathToFileURL(join(root, ".loom/generations", generated.version, "router.js")).href);
    const child = runtime.scopes.find((scope: { name: string }) => scope.name === "search");
    expect(Object.keys(child.extensions)).toEqual(["pg_trgm"]);
    expect(child.extensions.pg_trgm.schema).toBe("host_search");
    const source = await readFile(join(directory, "_generated/extensions.ts"), "utf8");
    expect(source).toContain('"schema":"host_search"');
    expect(source).not.toContain('"vector"');
    const loaded = await tooling.loadProject(root);
    const development = projectRuntimeGraph(loaded).scopes.find((scope) => scope.name === "search");
    expect(development).toHaveProperty("extensions.pg_trgm.schema", "host_search");
    expect(development).toHaveProperty("extensions.pg_trgm.name", "pg_trgm");
    await checkFixtureTypes(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("published component extension facades resolve portable requirements against host selection", async () => {
  const { writeFile, mkdir, rm } = await import("node:fs/promises");
  const tooling = await import("loom/tooling");
  const root = await projectFixture();
  try {
    const directory = join(root, "node_modules/portable-extension-component");
    await mkdir(directory);
    await writeFile(
      join(directory, "package.json"),
      JSON.stringify({
        name: "portable-extension-component",
        type: "module",
        exports: {
          ".": "./runtime.js",
          "./schema": "./schema.js",
          "./server": "./server.js",
          "./contracts": "./contracts.js",
          "./registry": "./registry.js",
          "./procedures": "./procedures.js",
          "./rpc": "./rpc.js",
          "./extensions": "./extensions.js",
        },
      }),
    );
    await writeFile(
      join(directory, "runtime.js"),
      `import { defineComponent, defineComponentPackage } from "loom/server";
export default defineComponentPackage(defineComponent({ name: "portable", extensions: { pg_trgm: { versions: ["1.6"] } } }), { formatVersion: 1, definitionVersion: "1", entry: "portable-extension-component", schema: "portable-extension-component/schema", contractRegistry: "portable-extension-component/registry", contracts: [{ path: "describe.js", entry: "portable-extension-component/contracts" }], procedures: [{ path: "describe.js", entry: "portable-extension-component/procedures", visibility: "public" }], bindings: { server: "portable-extension-component/server", rpc: "portable-extension-component/rpc", extensions: "portable-extension-component/extensions" } });`,
    );
    await writeFile(
      join(directory, "server.js"),
      `import schema from "./schema.js"; import { createProjectServices } from "loom/server"; export const { Extensions } = createProjectServices(schema);`,
    );
    await writeFile(join(directory, "extensions.js"), "export const extensions = undefined;");
    await writeFile(join(directory, "rpc.js"), "export const os = {};");
    await writeFile(join(directory, "registry.js"), "export const contract = {};");
    await writeFile(
      join(directory, "schema.js"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./extensions.js"; if (extensions.pg_trgm.schema !== "portable_host" || Object.keys(extensions).join(",") !== "pg_trgm") throw new Error("Portable component did not bind host extensions"); export default defineSchema(() => ({}));`,
    );
    await writeFile(
      join(directory, "contracts.js"),
      `import { defineContract, oc } from "loom/contract"; import * as v from "valibot"; export default defineContract({ get: oc.output(v.string()) });`,
    );
    await writeFile(
      join(directory, "procedures.js"),
      `import { os } from "./rpc.js"; export default os.describe.router({ get: os.describe.get.handler(({ context }) => context.extensions.pg_trgm.schema) });`,
    );
    await writeFile(
      join(root, "loom/app.config.ts"),
      `import { defineApplication } from "loom/server"; import component from "portable-extension-component"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(component); export default app;`,
    );
    await writeFile(
      join(root, "loom.config.ts"),
      `import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "1.6", schema: "portable_host" }, vector: { version: "0.8.2" } } } });`,
    );
    const loaded = await tooling.loadProject(root);
    expect(loaded.componentScopes[0]?.extensions).toEqual({ pg_trgm: { version: "1.6", schema: "portable_host" } });
    await tooling.generateProject(root);
    expect(loaded.componentScopes[0]?.procedures).toHaveLength(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

for (const definition of ["source", "published", "published lazy literal"] as const) {
  const packaged = definition !== "source";
  const lazy = definition === "published lazy literal";
  test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
    `${definition} repeated component mounts resolve setup-imported Extensions for HTTP and RPC in dev and generated runtimes`,
    async () => {
      await withExtensionDatabase(async (connectionString) => {
        const { writeFile, mkdir, rm } = await import("node:fs/promises");
        const { pathToFileURL } = await import("node:url");
        const tooling = await import("loom/tooling");
        const server = await import("loom/server");
        const { call, getRouter, unlazyRouter, Procedure } = await import("@orpc/server");
        const root = await projectFixture();
        const runtimeRole = `binding_${crypto.randomUUID().replaceAll("-", "")}`;
        const admin = new pg.Client({ connectionString });
        await admin.connect();
        try {
          await tooling.bootstrapDatabase({ connectionString, metadataNamespace: "loom_bindings", runtimeRole });
          await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
          const runtimeUrl = new URL(connectionString);
          runtimeUrl.username = runtimeRole;
          runtimeUrl.password = "loom-test-only";
          const directory = join(
            root,
            packaged ? "node_modules/portable-extension-services" : "loom/components/shared",
          );
          await mkdir(join(directory, "contracts"), { recursive: true });
          await mkdir(join(directory, "functions"));
          await writeFile(
            join(root, "loom.config.ts"),
            `import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "1.6", schema: "host_text" }, vector: { version: "0.8.2" } } } });`,
          );
          const setup = `import { defineComponent } from "${packaged ? "loom/server" : "./_generated/setup"}"; ${lazy ? "" : `import { Extensions, env } from "${packaged ? "./server.js" : "./_generated/server"}";`} import { Effect } from "effect"; import * as v from "valibot";
${lazy ? "async " : ""}function selected(context) { ${lazy ? 'const { Extensions } = await import("./server.js");' : ""} const value = Effect.runSync(Effect.provide(Extensions, context["effect/context"])); if (Object.keys(value).join(",") !== "pg_trgm") throw new Error("Sibling extensions leaked"); return value.pg_trgm.schema; }
const component = defineComponent({ name: "shared", env: { KEY: v.string() }, extensions: { pg_trgm: { versions: ["1.6"] } }, rpc: ({ os }) => ({ os: os.use(${lazy ? "async " : ""}({ context, next }) => { ${lazy ? "await " : ""}selected(context); return next(); }) }), http: [{ method: "GET", path: "/describe", access: { kind: "anonymous" }, handle: ${lazy ? 'async ({ context }) => { const { env } = await import("./server.js"); return new Response(env.KEY + ":" + await selected(context)); }' : '({ context }) => new Response(env.KEY + ":" + selected(context))'} }] });`;
          if (packaged) {
            const entry = "portable-extension-services";
            await writeFile(
              join(directory, "package.json"),
              JSON.stringify({
                name: entry,
                type: "module",
                exports: {
                  ".": "./runtime.js",
                  "./schema": "./schema.js",
                  "./server": "./server.js",
                  "./contracts": "./contracts/description.ts",
                  "./registry": "./registry.js",
                  "./procedures": "./functions/description.ts",
                  "./rpc": "./rpc.js",
                  "./extensions": "./extensions.js",
                },
              }),
            );
            await writeFile(
              join(directory, "runtime.js"),
              `${setup}\nimport { defineComponentPackage } from "loom/server"; export default defineComponentPackage(component, { formatVersion: 1, definitionVersion: "1", entry: "${entry}", schema: "${entry}/schema", contractRegistry: "${entry}/registry", contracts: [{ path: "description.js", entry: "${entry}/contracts" }], procedures: [{ path: "description.js", entry: "${entry}/procedures", visibility: "public" }], bindings: { server: "${entry}/server", rpc: "${entry}/rpc", extensions: "${entry}/extensions" } });`,
            );
            await writeFile(
              join(directory, "schema.js"),
              `import { defineSchema } from "loom/server"; export default defineSchema(() => ({}));`,
            );
            await writeFile(
              join(directory, "server.js"),
              `import schema from "./schema.js"; import component from "./runtime.js"; import { createProjectServices, createComponentEnvironmentAccess } from "loom/server"; export const { Database, Tables, Validators, Search, Extensions } = createProjectServices(schema); export const env = createComponentEnvironmentAccess(() => component);`,
            );
            await writeFile(join(directory, "registry.js"), "export const contract = {};");
            await writeFile(join(directory, "rpc.js"), "export const os = {};");
            await writeFile(join(directory, "extensions.js"), "export const extensions = undefined;");
          } else await writeFile(join(directory, "setup.ts"), `${setup}\nexport default component;`);
          await writeFile(
            join(directory, "contracts/description.ts"),
            `import { defineContract, oc } from "${packaged ? "loom/contract" : "../_generated/contract"}"; import * as v from "valibot"; export default defineContract({ get: oc.output(v.string()) });`,
          );
          await writeFile(
            join(directory, "functions/description.ts"),
            `import { os } from "${packaged ? "../rpc.js" : "../_generated/rpc"}"; export default os.description.router({ get: os.description.get.handler(({ context }) => context.env.KEY + ":" + context.extensions.pg_trgm.schema) });`,
          );
          await writeFile(
            join(root, "loom/app.config.ts"),
            `import { defineApplication } from "loom/server"; import shared from "${packaged ? "portable-extension-services" : "./components/shared/setup"}"; import * as v from "valibot"; const app = defineApplication({ env: { LEFT: v.string(), RIGHT: v.string() }, rpc: ({ os }) => ({ os }) }); app.use(shared, { name: "left", public: "left", env: { KEY: app.env.LEFT } }); app.use(shared, { name: "right", public: "right", env: { KEY: app.env.RIGHT } }); export default app;`,
          );
          const loaded = await tooling.loadProject(root);
          const generated = await tooling.generateProject(root);
          const artifact = await import(
            pathToFileURL(join(root, ".loom/generations", generated.version, "router.js")).href
          );
          for (const [mode, options] of [
            {
              ...tooling.projectRuntimeGraph(loaded),
              schema: loaded.schema,
              relations: loaded.relations,
              application: loaded.application,
            },
            {
              scopes: artifact.scopes,
              procedures: artifact.procedures,
              exposures: artifact.exposures,
              schema: artifact.schema,
              relations: artifact.relations,
              application: artifact.application,
            },
          ].entries()) {
            const runtime = await server.createRpcRuntime({
              ...options,
              connectionString: runtimeUrl.href,
              metadataNamespace: "loom_bindings",
              deployment: "binding-test",
              version: generated.version,
              auth: server.defineRpcAuth({ authorize: () => {}, allowAnonymous: true }),
              environment: { LEFT: "one", RIGHT: "two" },
              assertActive: async () => {},
            });
            try {
              for (const [name, value] of [
                ["left", "one"],
                ["right", "two"],
              ]) {
                const mount = runtime.componentHttp.find((entry) => entry.prefix === `/api/components/${name}`);
                const route = mount?.routes[0];
                assert(mount?.invoke && route?.handle);
                const invocation = {
                  request: new Request(`https://example.test/api/components/${name}/describe`),
                  signal: new AbortController().signal,
                  session: null,
                };
                const response = await mount
                  .invoke(invocation, (context) => Promise.resolve(route.handle!({ ...invocation, context })))
                  .catch((cause: unknown) => {
                    throw new Error(`${mode === 0 ? "dev" : "generated"} ${name} HTTP failed`, { cause });
                  });
                expect(await response.text()).toBe(`${value}:host_text`);
              }
              for (const [name, value] of [
                ["left", "one"],
                ["right", "two"],
              ]) {
                const procedure = getRouter(await unlazyRouter(runtime.router), [name!, "description", "get"]);
                assert(procedure instanceof Procedure);
                const input = { identity: null, requestId: name!, signal: new AbortController().signal };
                expect(
                  await call(procedure, undefined, {
                    context: { ...input, "effect/context": Context.make(server.Invocation, input) },
                  }),
                ).toBe(`${value}:host_text`);
              }
            } finally {
              await runtime.stop();
            }
          }
        } finally {
          await admin.query(`DROP OWNED BY "${runtimeRole}"`).catch(() => {});
          await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
          await admin.end();
          await rm(root, { recursive: true, force: true });
        }
      });
    },
    30000,
  );
}
