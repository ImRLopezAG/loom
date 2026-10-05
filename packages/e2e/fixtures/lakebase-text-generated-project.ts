import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const lakebaseTextGeneratedDigest = "d565a607c3901c0b31f02d59f300ae0b3cf3b5c77bcdf7d06822489fc2d9f6fb";
export type LakebaseTextSelection = "empty" | "future" | "selected";

/** The caller supplies public package tooling; this fixture never imports a source adapter. */
export async function writeLakebaseTextProject(
  root: string,
  selection: LakebaseTextSelection,
  schema?: string,
): Promise<void> {
  const placement = schema ?? "extensions";
  if (selection === "empty") {
    await writeFile(
      join(root, "kello.config.ts"),
      'import { defineConfig } from "kello/tooling";\nexport default defineConfig({});\n',
    );
    await writeFile(
      join(root, "kello/app.config.ts"),
      'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });\n',
    );
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (extensions !== undefined) throw Error("Empty virtual binding must be undefined");
export default defineSchema(() => ({}), { namespace: "app" });\n`,
    );
    await writeFile(
      join(root, "kello/contracts/tasks.ts"),
      `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.strictObject({ selection: v.literal("empty"), undefinedContext: v.literal(true) })) });\n`,
    );
    await writeFile(
      join(root, "kello/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== context.extensions || binding !== selected) throw Error("Generated RPC/Effect/disk identity differs");
  const exact: undefined = context.extensions;
  const effectExact: undefined = binding;
  if (exact !== undefined || effectExact !== undefined) throw Error("Empty runtime context differs");
  return { selection: "empty" as const, undefinedContext: true as const };
}) });\n`,
    );
    return;
  }
  if (selection === "future") {
    await writeFile(
      join(root, "kello.config.ts"),
      'import { defineConfig } from "kello/tooling";\nexport default defineConfig({ database: { extensions: { lakebase_text: { version: "future" } } } });\n',
    );
    await writeFile(
      join(root, "kello/app.config.ts"),
      'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });\n',
    );
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
if (extensions.lakebase_text.apiSupport.status !== "unverified") throw Error("Future lakebase_text must stay unverified");
if ("toBm25Query" in extensions.lakebase_text) throw Error("Unverified lakebase_text must not invent query methods");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });\n`,
    );
    await writeFile(
      join(root, "kello/contracts/tasks.ts"),
      `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.strictObject({ version: v.literal("future"), unverified: v.literal(true) })) });\n`,
    );
    await writeFile(
      join(root, "kello/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== context.extensions || binding !== selected) throw Error("Generated RPC/Effect/disk identity differs");
  const exact: "future" = context.extensions.lakebase_text.version;
  function compileOnly() {
    // @ts-expect-error An unknown version has no BM25 query helpers.
    context.extensions.lakebase_text.toBm25Query;
    // @ts-expect-error Effect exposes the same descriptor-only API.
    binding.lakebase_text.sql;
  }
  void compileOnly;
  if (binding.lakebase_text.apiSupport.status !== "unverified") throw Error("Future descriptor became verified");
  return { version: exact, unverified: true as const };
}) });\n`,
    );
    return;
  }
  const component = join(root, "kello/components/bm25");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  const selected = schema ? `{ version: "0.1.3", schema: ${JSON.stringify(schema)} }` : '{ version: "0.1.3" }';
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { lakebase_text: ${selected} } } });\n`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import bm25 from "./components/bm25/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(bm25); export default app;\n',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "bm25", extensions: { lakebase_text: { versions: ["0.1.3"] } }, rpc: ({ os }) => ({ os }) });\n',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "lakebase_text") throw Error("Incorrect selection");
const api = extensions.lakebase_text;
if (api.schema !== ${JSON.stringify(placement)} || api.version !== "0.1.3" || typeof api.toBm25Query !== "function") throw Error("Incorrect first-load binding");
if (api.toBm25Query !== api.sql.functions.to_bm25query) throw Error("Incorrect canonical alias");
if (api.rank !== api.sql.operators["<@>"]) throw Error("Incorrect rank alias");
api.toBm25Query("'postgresql':1", "documents_passage_bm25");
api.indexes.tsvector();
api.storage({ k1: 1.2 });
export default defineSchema(() => ({}), { namespace: "app" });\n`,
  );
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "lakebase_text" || extensions.lakebase_text.schema !== ${JSON.stringify(placement)})
  throw Error("Wrong virtual child selection");
extensions.lakebase_text.toBm25Query("'postgresql':1", "documents_passage_bm25");
export default defineSchema(() => ({}));\n`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(v.literal("0.1.3")) });\n',
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.strictObject({
  sql: v.string(),
  params: v.array(v.unknown()),
  version: v.literal("0.1.3"),
  schema: v.string(),
  score: v.nullable(v.union([v.number(), v.strictObject({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) })])),
  effectSame: v.literal(true),
  child: v.literal("0.1.3"),
})) });\n`,
  );
  const handler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw Error("Generated RPC/Effect binding differs");
const api = binding.lakebase_text;
if (api.toBm25Query !== api.sql.functions.to_bm25query) throw Error("Generated RPC alias differs");
if (api.rank !== api.sql.operators["<@>"]) throw Error("Generated rank alias differs");
const version: "0.1.3" = api.version;
const placement: ${JSON.stringify(placement)} = api.schema;
const builder = context.db.select({
  score: api.rank("'postgresql':1", api.toBm25Query("'postgresql':1", "documents_passage_bm25")),
}).from(sql\`(values (1)) bm25_fixture(n)\`);
const query = builder.toSQL();
const [nativeRow] = await builder.catch((error: unknown) => {
  if (error instanceof Error) console.error("Native BM25 handler failure", error.cause instanceof Error ? error.cause.message : error.message);
  throw error;
});
if (!nativeRow) throw Error("Native BM25 query returned no row");`;
  await writeFile(
    join(component, "functions/status.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.status.router({ run: os.status.run.handler(async ({ context }) => {
${handler}
// @ts-expect-error Unselected families remain absent in the mounted facade.
void context.extensions.lakebase_vector;
return version;
}) });\n`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${handler}
if (binding !== selected) throw Error("Host selected binding differs from RPC/Effect");
function compileOnly() {
  // @ts-expect-error No invented BM25 client scoring helper exists.
  void api.scoreDocuments;
  // @ts-expect-error Unselected families remain absent.
  void context.extensions.lakebase_vector;
}
void compileOnly;
return { sql: query.sql, params: query.params, score: nativeRow.score, version, schema: placement, effectSame: true as const, child: await context.components.bm25.rpc.status.run() };
}) });\n`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { type SQL } from "drizzle-orm";
import { extensions } from "./_generated/extensions";
const version: "0.1.3" = extensions.lakebase_text.version;
const placement: ${JSON.stringify(placement)} = extensions.lakebase_text.schema;
const query: SQL<{ readonly query: string | null; readonly index: string | null }> = extensions.lakebase_text.toBm25Query(
  "'postgresql':1",
  "documents_passage_bm25",
);
const score: SQL<number | { readonly nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = extensions.lakebase_text.rank(
  "'postgresql':1",
  query,
);
function compileOnly() {
  // @ts-expect-error Captured to_bm25query needs both arguments.
  extensions.lakebase_text.toBm25Query("'postgresql':1");
  // @ts-expect-error No invented BM25 client scoring helper exists.
  void extensions.lakebase_text.scoreDocuments;
  // @ts-expect-error Unselected families remain absent.
  void extensions.lakebase_vector;
}
void [version, placement, score, compileOnly];\n`,
  );
}

/** Read actual generated files and import them from disk after the virtual first load. */
export async function checkLakebaseTextDiskBindings(
  root: string,
  selection: LakebaseTextSelection,
  placement = "extensions",
): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  for (const forbidden of [
    "kello/tooling",
    "./schema",
    "./server",
    "kello.config",
    "kello/extensions/lakebase-vector",
    "kello/extensions/vector",
    "scoreDocuments",
  ])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  const rpcSource = await readFile(join(root, "kello/_generated/rpc.ts"), "utf8");
  assert(rpcSource.includes("createApplicationRpc"));
  assert(rpcSource.includes("extensions"));
  assert.equal(server.extensions, disk.extensions);
  if (selection === "empty") {
    assert.equal(disk.extensions, undefined);
    assert(!source.includes("kello/extensions/"));
    return;
  }
  assert.deepEqual(Object.keys(disk.extensions), ["lakebase_text"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.lakebase_text;
  if (selection === "future") {
    assert.equal(api.version, "future");
    assert.equal(api.apiSupport.status, "unverified");
    assert.equal("toBm25Query" in api, false);
    assert.equal("sql" in api, false);
    assert(!source.includes("kello/extensions/lakebase-text"));
    return;
  }
  assert(source.includes('import { createLakebaseText_0_1_3 } from "kello/extensions/lakebase-text";'));
  assert.deepEqual([api.name, api.version, api.schema], ["lakebase_text", "0.1.3", placement]);
  assert.deepEqual(api.apiSupport, {
    status: "verified",
    digest: lakebaseTextGeneratedDigest,
  });
  assert.deepEqual(Object.keys(api.sql.functions).sort(), [
    "_lakebase_bm25_evaluate_tsvector",
    "_lakebase_bm25_support_tsvector_bm25_ops",
    "lakebase_bm25_index_info",
    "to_bm25query",
  ]);
  assert.equal(api.toBm25Query, api.sql.functions.to_bm25query);
  assert.equal(api.rank, api.sql.operators["<@>"]);
  const childFile = join(root, "kello/components/bm25/_generated/extensions.ts");
  const child = await import(pathToFileURL(childFile).href);
  assert.deepEqual(Object.keys(child.extensions), ["lakebase_text"]);
  assert.equal(child.extensions.lakebase_text.schema, placement);
  assert.equal(child.extensions.lakebase_text.version, "0.1.3");
}
