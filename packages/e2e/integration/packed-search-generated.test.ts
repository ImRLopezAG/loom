import { writeSearchComponent } from "../fixtures/search-component";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "bun:test";

test("packed generated search infers selected results through native options", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-search-generated-"));
  async function run(command: string[], cwd = root) {
    const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 120_000 });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { code, output: `${stdout}${stderr}` };
  }
  async function succeed(command: string[], cwd = root) {
    const result = await run(command, cwd);
    assert.equal(result.code, 0, `${command.join(" ")}\n${result.output}`);
    return result.output;
  }
  try {
    await succeed(
      ["bun", "pm", "pack", "--filename", join(root, "loom.tgz"), "--ignore-scripts"],
      fileURLToPath(new URL("../../../apps/loom/", import.meta.url)),
    );
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: {
          loom: "file:./loom.tgz",
          "@orpc/client": "2.0.0-beta.40",
          "@orpc/tanstack-query": "2.0.0-beta.40",
          "@tanstack/react-query": "5.103.2",
          "drizzle-orm": "1.0.0-rc.4",
          valibot: "1.5.0",
          react: "19.3.0",
          effect: "4.0.0-rc.117",
        },
        devDependencies: { typescript: "7.0.2", "@types/react": "19.3.0" },
      }),
    );
    await succeed(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
    await writeFile(
      join(root, "initialize.mjs"),
      `import { initializeProject, saveResolvedProject } from "loom/tooling";
await initializeProject("./app", "search-generated");
await saveResolvedProject("./app", { format: 1, projectId: "fixture", branchId: "br-fixture", branchName: "dev", protected: false, isDefault: false, databaseName: "neondb", migrationRole: "neondb_owner", public: { serviceUrl: "https://search.example.test" } });`,
    );
    await succeed(["bun", "initialize.mjs"]);
    const fixture = await readFile(new URL("../../tests/fixtures/search-schema.ts", import.meta.url), "utf8");
    await writeFile(join(root, "app/loom/fixture.ts"), fixture);
    await writeFile(join(root, "app/loom/schema.ts"), 'export { searchSchema as default } from "./fixture";');
    await writeFile(join(root, "app/loom/relations.ts"), 'export { searchRelations as default } from "./fixture";');
    const source = await readFile(new URL("../../tests/types/search-generated.test-d.ts", import.meta.url), "utf8");
    const factory = source.slice(source.indexOf("const policy ="), source.indexOf("type Native ="));
    assert.match(factory, /validators\.tables\.tasks\.search/);
    await writeFile(
      join(root, "app/loom/contracts/tasks.ts"),
      `import { defineContract, oc } from "loom/contract";
import * as v from "valibot";
export default defineContract(({ validators }) => { ${factory} return { ...contract, effectList: contract.list }; });`,
    );
    await writeFile(
      join(root, "app/loom/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
import { Search } from "../_generated/server";
import { Effect } from "effect";
export default os.tasks.router({
  list: os.tasks.list.handler(({ context, input }) => context.search.tasks.paginate(input)),
  effectList: os.tasks.effectList.effect(function* ({ input }) { const search = yield* Search; return yield* Effect.promise(() => search.tasks.paginate(input)); }),
  watch: os.tasks.watch.handler(async function* () { yield { pages: [], nextCursor: null, previousCursor: null }; }),
  ordinary: os.tasks.ordinary.handler(() => "native"),
});`,
    );
    await writeSearchComponent(join(root, "app/loom"));
    await writeFile(
      join(root, "app/loom/app.config.ts"),
      `import { defineApplication } from "loom";
import catalog from "./components/catalog/setup";
import reader from "./components/reader/setup";
const app = defineApplication({ rpc: ({ os }) => ({ os }) });
const store = app.use(catalog, { public: "store" });
const staff = app.use(catalog, { name: "staff" });
app.use(reader, { dependencies: { catalog: store }, public: "reader" });
app.use(reader, { name: "staffReader", dependencies: { catalog: staff } });
export default app;`,
    );
    await writeFile(
      join(root, "generate.mjs"),
      'import { generateProject } from "loom/tooling"; await generateProject("./app");',
    );
    await succeed(["bun", "generate.mjs"]);
    await succeed([join(root, "node_modules/.bin/loom"), "generate", "--cwd", join(root, "app")]);
    // Check emitted declarations as source, so skipLibCheck cannot hide generator
    // errors while upstream declarations keep their consumer compatibility setting.
    const declaration = join(root, "app/loom/_generated/current/api.d.ts");
    await writeFile(join(root, "app/loom/_generated/current/checked-api.ts"), await readFile(declaration));
    const copy = join(dirname(await realpath(join(root, "node_modules/loom"))), "loom-copy/dist");
    await cp(join(root, "node_modules/loom/dist"), copy, { recursive: true });
    await writeFile(
      join(root, "copies.mjs"),
      `import assert from "node:assert/strict";
import { createProjectContext } from ${JSON.stringify(join(copy, "core/server/index.js"))};
import { searchPublicNode } from "loom/server";
import { searchSchema, searchRelations } from "./app/loom/fixture.ts";
const { validators } = createProjectContext(searchSchema, searchRelations);
const descriptor = validators.tables.tasks.search({ scope: "public", columns: ["title"] });
assert.deepEqual(Object.keys(searchPublicNode(descriptor.input).columns), ["title"]);
assert.deepEqual(searchPublicNode(descriptor.input), searchPublicNode(descriptor.output));`,
    );
    await succeed(["bun", "copies.mjs"]);
    const probe = source
      .replace('from "../fixtures/search-schema"', 'from "./app/loom/fixture"')
      .replace(
        "declare const client: SearchRouterClient<Native>;",
        `import { createClient } from "./app/loom/_generated/api";
const connection = createClient({ getToken: async () => null });
const client = connection.client.tasks;`,
      )
      .replace("declare const rpc: SearchRouterUtils<Native>;", "const rpc = connection.rpc.tasks;");
    assert.doesNotMatch(probe, /@ts-expect-error|@ts-ignore/);
    await writeFile(
      join(root, "probe.ts"),
      probe +
        `
async function components() {
  const page = await connection.client.store.items.list({ columns: { title: true }, with: { labels: { columns: { name: true } } } });
  const title: string = page.rows[0]!.title;
  const label: string = page.rows[0]!.labels[0]!.name;
  const effect = await connection.client.store.items.effectList({ columns: { done: true } });
  const done: boolean = effect.rows[0]!.done;
  void [title, label, done];
}
import { os } from "./app/loom/_generated/rpc";
os.tasks.ordinary.handler(async ({ context }) => {
  const page = await context.components.catalog.rpc.items.list({ columns: { title: true } });
  const staff = await context.components.staff.rpc.items.list({ columns: { done: true } });
  const title: string = page.rows[0]!.title;
  const done: boolean = staff.rows[0]!.done;
  return title + done;
});
`,
    );
    const compilerOptions = {
      target: "ES2023",
      module: "Preserve",
      moduleResolution: "Bundler",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      lib: ["ES2023", "DOM", "DOM.Iterable"],
    };
    const compiler = join(root, "node_modules/.bin/tsc");
    for (const exactOptionalPropertyTypes of [true, false]) {
      await writeFile(
        join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: { ...compilerOptions, exactOptionalPropertyTypes },
          include: ["probe.ts", "app/loom/**/*.ts"],
        }),
      );
      const start = performance.now();
      await succeed([compiler, "-p", "tsconfig.json"]);
      console.info(
        JSON.stringify({
          proof: "search-four-edge-types",
          exactOptionalPropertyTypes,
          elapsedMs: Math.round(performance.now() - start),
          declarationBytes: (await readFile(join(root, "app/loom/_generated/current/api.d.ts"))).byteLength,
        }),
      );
    }
    await writeFile(
      join(root, "negative.ts"),
      `import { createClient } from "./app/loom/_generated/api";
import { keepPreviousData } from "@tanstack/react-query";
const { client, rpc } = createClient({ getToken: async () => null });
const forbidden = { columns: { title: true, projectId: true } } as const;
client.tasks.list(forbidden);
rpc.tasks.list.queryOptions({ input: forbidden });
rpc.tasks.list.queryOptions({ input: { columns: { title: true } }, initialData: { rows: [{ title: 42 }], nextCursor: null, previousCursor: null } });
rpc.tasks.list.queryOptions({ input: { columns: { done: true } }, placeholderData: keepPreviousData });
rpc.tasks.list.queryOptions({ input: { columns: { title: true } }, queryFn: async () => ({ rows: [{ done: true }], nextCursor: null, previousCursor: null }) });
const nested = { with: { labels: { columns: { name: true, _id: true } } } } as const;
client.tasks.list(nested);
async function fields() { const result = await client.tasks.list({ columns: { title: true } }); result.rows[0]!.done; }
rpc.tasks.list.queryKey({ input: forbidden });
rpc.tasks.list.infiniteKey({ input: () => forbidden, initialPageParam: null });
rpc.tasks.watch.liveKey({ input: forbidden });
client.store.items.list({ columns: { title: true, projectId: true } });
client.staff;
client.store.internal;
client.store.items.list({ with: { taskLabels: {} } });
async function componentFields() { const page = await client.store.items.list({ columns: { title: true } }); page.rows[0]!.done; }

`,
    );
    await writeFile(join(root, "negative.json"), JSON.stringify({ compilerOptions, include: ["negative.ts"] }));
    const negative = await run([compiler, "-p", "negative.json"]);
    assert.notEqual(negative.code, 0);
    for (const line of [5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
      assert.match(negative.output, new RegExp(`negative\\.ts\\(${line},`));
    await writeFile(
      join(root, "browser.mjs"),
      `import assert from "node:assert/strict";
const result = await Bun.build({ entrypoints: ["./app/loom/_generated/api.js"], target: "browser" });
assert.equal(result.success, true, String(result.logs));
const output = (await Promise.all(result.outputs.map(file => file.text()))).join("\\n");
assert.match(output, /loom-search-projections/);
assert.doesNotMatch(output, /taskLabels|projectId|organizationId|DATABASE_URL|node:fs|node:crypto|pg-protocol|loom.search.descriptor/);
console.info(JSON.stringify({ proof: "search-browser-bundle", bytes: Buffer.byteLength(output) }));
`,
    );
    console.info((await succeed(["bun", "browser.mjs"])).trim());
    await writeFile(
      join(root, "watch.mjs"),
      `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { watchDevelopment, generateProject } from "loom/tooling";
let generations = 0;
const watcher = await watchDevelopment("./app", async () => { await generateProject("./app"); generations++; }, { debounceMs: 100 });
try {
  await watcher.flush();
  const before = generations;
  for (const name of ["schema.ts", "contracts/items.ts"]) {
    const path = "./app/loom/components/catalog/" + name;
    await writeFile(path, (await readFile(path, "utf8")).replaceAll("title", "caption"));
  }
  for (const name of ["relations.ts", "contracts/items.ts"]) {
    const path = "./app/loom/components/catalog/" + name;
    await writeFile(path, (await readFile(path, "utf8")).replace("labels:", "tags:"));
  }
  const reader = "./app/loom/components/reader/functions/items.ts";
  await writeFile(reader, (await readFile(reader, "utf8")).replace("{ title: true }", "{ caption: true }").replace("page.rows[0]!.title", "page.rows[0]!.caption"));
  const deadline = Date.now() + 30000;
  while (generations === before && !watcher.failure && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
  await watcher.settled();
  assert.equal(watcher.failure, null);
  assert.ok(generations > before, "schema edits must trigger generation without CLI generate");
} finally { await watcher.stop(); }
`,
    );
    await succeed(["bun", "watch.mjs"]);
    await writeFile(join(root, "app/loom/_generated/current/checked-api.ts"), await readFile(declaration));
    await writeFile(
      join(root, "regenerated.ts"),
      `import { createClient } from "./app/loom/_generated/api";
const { client } = createClient({ getToken: async () => null });
async function current() {
  const page = await client.store.items.list({ columns: { caption: true }, with: { tags: { columns: { name: true } } } });
  const caption: string = page.rows[0]!.caption;
  const tag: string = page.rows[0]!.tags[0]!.name;
  return caption + tag;
}
`,
    );
    await writeFile(
      join(root, "regenerated.json"),
      JSON.stringify({ compilerOptions, include: ["regenerated.ts", "app/loom/**/*.ts"] }),
    );
    await succeed([compiler, "-p", "regenerated.json"]);
    await writeFile(
      join(root, "removed.ts"),
      `import { createClient } from "./app/loom/_generated/api";
const { client } = createClient({ getToken: async () => null });
client.store.items.list({ columns: { title: true } });
client.store.items.list({ with: { labels: {} } });
`,
    );
    await writeFile(join(root, "removed.json"), JSON.stringify({ compilerOptions, include: ["removed.ts"] }));
    const removed = await run([compiler, "-p", "removed.json"]);
    assert.notEqual(removed.code, 0);
    assert.match(removed.output, /removed\.ts\(3,/);
    assert.match(removed.output, /removed\.ts\(4,/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 180_000);
