import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const pgTrgmGeneratedModes = ["omitted", "empty", "future", "selected", "custom"] as const;
export type PgTrgmGeneratedMode = (typeof pgTrgmGeneratedModes)[number];
export const pgTrgmGeneratedDigest = "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66";
export const pgTrgmFutureVersion = "9.9";
export function pgTrgmGeneratedPlacement(mode: PgTrgmGeneratedMode): string {
  return mode === "custom" ? "text_search" : "extensions";
}
export function pgTrgmGeneratedSelected(mode: PgTrgmGeneratedMode): boolean {
  return mode === "selected" || mode === "custom";
}
/** Exact native pairs evaluated by the generated handlers and independently by the runtime oracle. */
export const pgTrgmGeneratedInputs = { left: "word", right: "two words", trigrams: "cat" } as const;

const selectedContract = `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({
  list: oc.output(v.strictObject({
    schema: v.string(),
    version: v.literal("1.6"),
    similarity: v.number(),
    wordSimilarity: v.number(),
    strictWordSimilarity: v.number(),
    distance: v.number(),
    similar: v.boolean(),
    missing: v.null(),
    trigrams: v.array(v.string()),
    members: v.array(v.string()),
    effectSame: v.literal(true),
  })),
});
`;

function selectedHandler(schema: string) {
  return `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.tasks.router({
  list: os.tasks.list.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
    if (binding !== context.extensions) throw new Error("Root RPC/Effect selection differs");
    if (binding !== selected) throw new Error("Generated extensions differ from RPC context");
    const api = binding.pg_trgm;
    const [row] = await context.db
      .select({
        similarity: api.similarity(${JSON.stringify(pgTrgmGeneratedInputs.left)}, ${JSON.stringify(pgTrgmGeneratedInputs.right)}),
        wordSimilarity: api.wordSimilarity(${JSON.stringify(pgTrgmGeneratedInputs.left)}, ${JSON.stringify(pgTrgmGeneratedInputs.right)}),
        strictWordSimilarity: api.strictWordSimilarity(${JSON.stringify(pgTrgmGeneratedInputs.left)}, ${JSON.stringify(pgTrgmGeneratedInputs.right)}),
        distance: api.distance(${JSON.stringify(pgTrgmGeneratedInputs.left)}, ${JSON.stringify(pgTrgmGeneratedInputs.right)}),
        similar: api.similar(${JSON.stringify(pgTrgmGeneratedInputs.left)}, ${JSON.stringify(pgTrgmGeneratedInputs.right)}),
        missing: api.similarity(null, ${JSON.stringify(pgTrgmGeneratedInputs.right)}),
        trigrams: api.showTrigrams(${JSON.stringify(pgTrgmGeneratedInputs.trigrams)}),
      })
      .from(sql\`(values (1)) as fixture(value)\`);
    if (!row) throw new Error("Missing generated pg_trgm row");
    if (row.missing !== null) throw new Error("Native strict similarity did not preserve SQL NULL");
    const result = {
      schema: api.schema,
      version: api.version,
      ...row,
      missing: row.missing,
      members: Object.keys(api.sql.overloads).sort(),
      effectSame: true as const,
    };
    if (result.schema !== ${JSON.stringify(schema)}) throw new Error("Wrong generated placement");
    const child = await context.components.search.rpc.query.run();
    if (JSON.stringify(child) !== JSON.stringify(result)) throw new Error("Mounted pg_trgm query differs");
    return result;
  }),
});
function compileOnly() {
  // @ts-expect-error Unselected families remain absent.
  selected.vector;
  // @ts-expect-error Legacy set_limit is operator tooling, never an application helper.
  selected.pg_trgm.sql.functions.set_limit(0.5);
  // @ts-expect-error Captured text arguments reject booleans.
  selected.pg_trgm.similarity(true, "word");
  const nullable: import("drizzle-orm").SQL<number | null> = selected.pg_trgm.similarity(null, "word");
  const score: import("drizzle-orm").SQL<number> = selected.pg_trgm.sql.overloads["routine:$extension:pg_trgm.similarity(pg_catalog.text,pg_catalog.text)"]("left", "right");
  const trigrams: import("drizzle-orm").SQL<string[]> = selected.pg_trgm.sql.overloads["routine:$extension:pg_trgm.show_trgm(pg_catalog.text)"]("text");
  const limit: import("drizzle-orm").SQL<number> = selected.pg_trgm.sql.overloads["routine:$extension:pg_trgm.show_limit()"]();
  // @ts-expect-error Canonical overload keys exclude uncaptured members.
  selected.pg_trgm.sql.overloads["routine:$extension:pg_trgm.missing()"]();
  void [score, trigrams, limit];
  void nullable;
}
void compileOnly;
`;
}

async function writeComponent(root: string, contract: string, setup: string, handler: string, schema: string) {
  const component = join(root, "kello/components/search");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(join(component, "setup.ts"), setup);
  await writeFile(join(component, "schema.ts"), schema);
  await writeFile(
    join(component, "contracts/query.ts"),
    contract
      .replace('from "kello/contract"', 'from "../_generated/contract"')
      .replace("list: oc.output", "run: oc.output"),
  );
  await writeFile(
    join(component, "functions/query.ts"),
    handler
      .replace("os.tasks.router", "os.query.router")
      .replace("list: os.tasks.list.handler", "run: os.query.run.handler")
      .replace(/\n\s*const child = await context\.components\.search\.rpc\.query\.run\(\);\n.*\n/, "\n"),
  );
}

/** Caller supplies public package tooling. This fixture never imports a source adapter. */
export async function writePgTrgmProject(root: string, mode: PgTrgmGeneratedMode): Promise<void> {
  const app =
    'import { defineApplication } from "kello/server"; import search from "./components/search/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(search); export default app;';
  await writeFile(join(root, "kello/app.config.ts"), app);
  if (mode === "omitted" || mode === "empty" || mode === "future") return writeUnselectedProject(root, mode);
  const schema = pgTrgmGeneratedPlacement(mode);
  const descriptor = mode === "custom" ? { version: "1.6", schema } : { version: "1.6" };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${JSON.stringify({ database: { extensions: { pg_trgm: descriptor } } })});`,
  );
  const schemaSource = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.pg_trgm;
if (api.schema !== ${JSON.stringify(schema)} || api.version !== "1.6" || Object.keys(api.sql.overloads).length !== 25)
  throw new Error("Wrong first-load pg_trgm binding");
if (api.similarity !== api.sql.functions.similarity || api.distance !== api.sql.operators["<->"])
  throw new Error("Wrong canonical pg_trgm aliases");
export default defineSchema((s) => ({
  tasks: defineTable(
    { title: s.text().notNull() },
    {
      publicFields: ["_id", "title"],
      indexes: [
        { fields: ["title"], extension: api.indexes.gin() },
        { fields: ["title"], extension: api.indexes.gist({ siglen: 32 }) },
      ],
    },
  ),
}), { namespace: "app" });
`;
  await writeFile(join(root, "kello/schema.ts"), schemaSource);
  await writeFile(join(root, "kello/contracts/tasks.ts"), selectedContract);
  const handler = selectedHandler(schema);
  await writeFile(join(root, "kello/functions/tasks.ts"), handler);
  await writeComponent(
    root,
    selectedContract,
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "search", extensions: { pg_trgm: { versions: ["1.6"] } }, rpc: ({ os }) => ({ os }) });',
    handler,
    `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.pg_trgm.schema !== ${JSON.stringify(schema)}) throw new Error("Wrong mounted placement"); export default defineSchema(() => ({}));`,
  );
}

async function writeUnselectedProject(root: string, mode: "omitted" | "empty" | "future"): Promise<void> {
  const future = mode === "future";
  const config =
    mode === "omitted" ? {} : { database: { extensions: future ? { pg_trgm: { version: pgTrgmFutureVersion } } : {} } };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${JSON.stringify(config)});`,
  );
  const assertion = future
    ? `if (selected.pg_trgm.apiSupport.status !== "unverified" || selected.pg_trgm.version !== ${JSON.stringify(pgTrgmFutureVersion)} || "sql" in selected.pg_trgm) throw new Error("Wrong unsupported descriptor");`
    : 'if (selected !== undefined) throw new Error("Unselected extensions must be undefined");';
  const negative = future ? 'selected.pg_trgm.similarity("word", "word");' : "selected.pg_trgm;";
  const status = future ? "unverified" : "absent";
  const contract = `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.strictObject({ status: v.literal("${status}"), value: v.literal(1), effectSame: v.literal(true) })) });
`;
  const handler = `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== selected || binding !== context.extensions) throw new Error("Unselected RPC/Effect identity differs");
  ${assertion}
  const [row] = await context.db.select({ value: sql<number>\`1\` }).from(sql\`(values(1)) as probe(value)\`);
  if (row?.value !== 1) throw new Error("Native query did not execute");
  const result = { status: "${status}" as const, value: 1 as const, effectSame: true as const };
  const child = await context.components.search.rpc.query.run();
  if (JSON.stringify(child) !== JSON.stringify(result)) throw new Error("Mounted unselected query differs");
  return result;
}) });
function compileOnly() {
  // @ts-expect-error Missing or unsupported versions do not expose a query helper.
  ${negative}
}
void compileOnly;
`;
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server"; import { extensions as selected } from "./_generated/extensions"; ${assertion} export default defineSchema(s => ({ tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }) }), { namespace: "app" });`,
  );
  await writeFile(join(root, "kello/contracts/tasks.ts"), contract);
  await writeFile(join(root, "kello/functions/tasks.ts"), handler);
  await writeComponent(
    root,
    contract,
    `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "search", ${future ? `extensions: { pg_trgm: { versions: [${JSON.stringify(pgTrgmFutureVersion)}] } }, ` : ""}rpc: ({ os }) => ({ os }) });`,
    handler,
    `import { defineSchema } from "kello/server"; import { extensions as selected } from "./_generated/extensions"; ${assertion} export default defineSchema(() => ({}));`,
  );
}

/** Structural view of the installed public binding, read from generated disk modules at runtime. */
interface GeneratedPgTrgmApi {
  readonly name: string;
  readonly version: string;
  readonly schema: string;
  readonly apiSupport: unknown;
  readonly sql: { readonly functions: object; readonly operators: object; readonly overloads: object };
}

export function assertPgTrgmStrictGeneratedApi(
  api: GeneratedPgTrgmApi,
  schema: string,
  queryMembers: readonly string[],
): void {
  assert.equal(api.name, "pg_trgm");
  assert.equal(api.version, "1.6");
  assert.equal(api.schema, schema);
  assert.deepEqual(api.apiSupport, { status: "verified", digest: pgTrgmGeneratedDigest });
  assert.deepEqual(Object.keys(api.sql.overloads).sort(), [...queryMembers].sort());
  assert.equal(Object.keys(api.sql.functions).length, 15);
  assert.equal(Object.keys(api.sql.operators).length, 10);
  for (const forbidden of ["set_limit", "gtrgm_in", "gtrgm_out", "gin_extract_value_trgm"])
    assert.equal(forbidden in api.sql.functions, false, forbidden);
}

/** Read actual generated files after the first virtual load. */
export async function checkPgTrgmDiskBindings(
  root: string,
  mode: PgTrgmGeneratedMode,
  queryMembers: readonly string[],
) {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  const child = await import(pathToFileURL(join(root, "kello/components/search/_generated/extensions.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  for (const forbidden of ["kello/tooling", "kello/tooling/extensions/pg-trgm", "./schema", "kello.config"])
    assert(!source.includes(forbidden), forbidden);
  if (!pgTrgmGeneratedSelected(mode)) {
    assert(!source.includes("createPgTrgm_1_6"));
    if (mode === "future") {
      assert.deepEqual(Object.keys(disk.extensions), ["pg_trgm"]);
      assert.equal(disk.extensions.pg_trgm.version, pgTrgmFutureVersion);
      assert.equal(disk.extensions.pg_trgm.apiSupport.status, "unverified");
      assert.equal("sql" in disk.extensions.pg_trgm, false);
      assert.equal(child.extensions.pg_trgm.apiSupport.status, "unverified");
    } else {
      assert.equal(disk.extensions, undefined);
      assert.equal(child.extensions, undefined);
    }
    return { extensions: disk.extensions };
  }
  const schema = pgTrgmGeneratedPlacement(mode);
  assert(source.includes('import { createPgTrgm_1_6 } from "kello/extensions/pg-trgm";'));
  assert(source.includes('"pg_trgm": createPgTrgm_1_6(descriptors["pg_trgm"])'));
  assert(source.includes(pgTrgmGeneratedDigest));
  for (const forbidden of ["kello/extensions/pg-graphql", "kello/extensions/xml2", "createPostgis"])
    assert(!source.includes(forbidden), forbidden);
  assert.deepEqual(Object.keys(disk.extensions), ["pg_trgm"]);
  assert(Object.isFrozen(disk.extensions));
  assertPgTrgmStrictGeneratedApi(disk.extensions.pg_trgm, schema, queryMembers);
  assertPgTrgmStrictGeneratedApi(child.extensions.pg_trgm, schema, queryMembers);
  const hostSchema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
  const required = hostSchema.metadata.extensionRequirements.map((item: { member: string }) => item.member).sort();
  assert.deepEqual(required, [
    "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
    "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
  ]);
  const serverSource = await readFile(join(root, "kello/_generated/server.ts"), "utf8");
  const rpc = await readFile(join(root, "kello/_generated/rpc.ts"), "utf8");
  assert(serverSource.includes("export const { Database, Tables, Validators, Search, Extensions }"));
  assert(rpc.includes("createApplicationRpc"));
  return { extensions: disk.extensions };
}
