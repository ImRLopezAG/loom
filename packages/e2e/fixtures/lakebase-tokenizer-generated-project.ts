import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const lakebaseTokenizerPublicDigest = "b57e5d3240d67c933ba1a2665c2fd347f72df94f159f16a4d6c7ebeb8e7d7ef8";
export type LakebaseTokenizerGenerationSelection = "selected" | "empty" | "future";

async function writeUnselectedComponent(root: string): Promise<void> {
  const component = join(root, "kello/components/unselected");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "unselected", rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(component, "schema.ts"),
    'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions !== undefined) throw Error("Unselected component inherited host extensions"); export default defineSchema(() => ({}));',
  );
  await writeFile(
    join(component, "contracts/tokenizer.ts"),
    'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ state: oc.output(v.literal("empty")) });',
  );
  await writeFile(
    join(component, "functions/tokenizer.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { extensions } from "../_generated/extensions"; import { Effect } from "effect";
export default os.tokenizer.router({ state: os.tokenizer.state.handler(async ({ context }) => {
const absent: undefined = context.extensions;
if (extensions !== absent || Effect.runSync(Effect.provide(Extensions, context["effect/context"])) !== absent) throw Error("Unselected RPC/Effect must be undefined");
return "empty" as const;
}) });`,
  );
}

/** The caller supplies compiled public tooling and dependencies. Only application fixture text is written. */
export async function writeLakebaseTokenizerProject(root: string, schema?: string): Promise<void> {
  await rm(join(root, "kello/functions/tasks.ts"));
  await rm(join(root, "kello/contracts/tasks.ts"));
  await mkdir(join(root, "kello/functions"), { recursive: true });
  const component = join(root, "kello/components/tokenizer");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeUnselectedComponent(root);
  const placement = schema ?? "extensions";
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { lakebase_tokenizer: { version: "0.1.1"${schema ? `, schema: ${JSON.stringify(schema)}` : ""} } } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import tokenizer from "./components/tokenizer/setup"; import unselected from "./components/unselected/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(tokenizer); app.use(unselected); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "tokenizer", extensions: { lakebase_tokenizer: { versions: ["0.1.1"] } }, rpc: ({ os }) => ({ os }) });',
  );
  const schemaSource = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "lakebase_tokenizer") throw Error("Incorrect selection");
const api = extensions.lakebase_tokenizer;
if (api.schema !== ${JSON.stringify(placement)} || api.version !== "0.1.1" || api.apiSupport.digest !== ${JSON.stringify(lakebaseTokenizerPublicDigest)} || api.lexize !== api.sql.functions.ts_lexize) throw Error("Incorrect first-load binding");
export default defineSchema(() => ({ values: defineTable({ stopword: api.fields.stopword().notNull(), synonym: api.fields.synonym().notNull(), stopwordArray: api.fields.stopwordArray().notNull(), synonymArray: api.fields.synonymArray().notNull() }) })`;
  await writeFile(join(root, "kello/schema.ts"), schemaSource + ', { namespace: "app" });');
  await writeFile(join(component, "schema.ts"), schemaSource + ");");
  const outputValidator = `import type { PostgreSqlArray } from "kello/extensions/lakebase-tokenizer";
const stopword = v.strictObject({ name: v.nullable(v.string()), word: v.nullable(v.string()) });
const synonym = v.strictObject({ name: v.nullable(v.string()), word: v.nullable(v.string()), synonym: v.nullable(v.string()) });
function array<Value>(element: v.GenericSchema<Value>): v.GenericSchema<PostgreSqlArray<Value>> {
  const values: v.GenericSchema<PostgreSqlArray<Value>["values"]> = v.lazy(() => v.array(v.union([element, v.null(), values])));
  return v.strictObject({ dimensions: v.array(v.strictObject({ lowerBound: v.number(), length: v.number() })), values });
}
const result = v.strictObject({ value: v.nullable(array(v.string())), stopword, synonym, stopwordArray: array(stopword), synonymArray: array(synonym), version: v.literal("0.1.1"), schema: v.string(), effectSame: v.literal(true) });`;
  await writeFile(
    join(root, "kello/contracts/tokenizer.ts"),
    `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
${outputValidator}
export default defineContract({ lexize: oc.input(v.strictObject({ word: v.nullable(v.string()) })).output(v.strictObject({ host: result, mounted: result, unselected: v.literal("empty") })) });`,
  );
  await writeFile(
    join(component, "contracts/tokenizer.ts"),
    `import { defineContract, oc } from "../_generated/contract";
import * as v from "valibot";
${outputValidator}
export default defineContract({ lexize: oc.input(v.strictObject({ word: v.nullable(v.string()) })).output(result) });`,
  );
  const handler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions || binding !== selected) throw Error("Generated RPC/Effect binding differs");
const api = binding.lakebase_tokenizer;
const dictionary = dictionaryReference({ schema: "tokenizer_fixture", name: "words" });
const [row] = await context.db.select({ value: api.lexize(dictionary, input.word), stopword: tables.values.stopword, synonym: tables.values.synonym, stopwordArray: tables.values.stopwordArray, synonymArray: tables.values.synonymArray }).from(tables.values);
if (!row) throw Error("Missing native tokenizer storage fixture");
const result = { ...row, version: api.version, schema: api.schema, effectSame: true as const };`;
  const handlerImports = `import { os } from "../_generated/rpc";
import { Extensions, tables } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { dictionaryReference } from "kello/extensions/lakebase-tokenizer";
import { Effect } from "effect";`;
  await writeFile(
    join(root, "kello/functions/tokenizer.ts"),
    `${handlerImports}
export default os.tokenizer.router({ lexize: os.tokenizer.lexize.handler(async ({ input, context }) => {
${handler}
return { host: result, mounted: await context.components.tokenizer.rpc.tokenizer.lexize(input), unselected: await context.components.unselected.rpc.tokenizer.state() };
}) });`,
  );
  await writeFile(
    join(component, "functions/tokenizer.ts"),
    `${handlerImports}
export default os.tokenizer.router({ lexize: os.tokenizer.lexize.handler(async ({ input, context }) => {
${handler}
return result;
}) });`,
  );
  await writeFile(
    join(root, "kello/tokenizer-types.ts"),
    `import { type SQL } from "drizzle-orm";
import { dictionaryReference, type PostgreSqlArray, type LakebaseTokenizerStopword, type LakebaseTokenizerSynonym } from "kello/extensions/lakebase-tokenizer";
import { extensions } from "./_generated/extensions";
const api = extensions.lakebase_tokenizer;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Exact<T extends true> = T;
const exactKeys: Exact<Equal<keyof typeof extensions, "lakebase_tokenizer">> = true;
const exactLexemes: Exact<Equal<ReturnType<typeof api.lexize>, SQL<PostgreSqlArray<string> | null>>> = true;
const exactStopword: Exact<Equal<ReturnType<typeof api.codecs.stopword.decode>, LakebaseTokenizerStopword>> = true;
const exactSynonymArray: Exact<Equal<ReturnType<typeof api.codecs.synonymArray.decode>, PostgreSqlArray<LakebaseTokenizerSynonym>>> = true;
const version: "0.1.1" = api.version;
const schema: ${JSON.stringify(placement)} = api.schema;
const lexemes: SQL<PostgreSqlArray<string> | null> = api.lexize(dictionaryReference({ schema: "tokenizer_fixture", name: "words" }), "Running");
const row: LakebaseTokenizerStopword = api.codecs.stopword.decode("(a,b)");
const synonyms: PostgreSqlArray<LakebaseTokenizerSynonym> = api.codecs.synonymArray.decode("{}");
const stopwords: PostgreSqlArray<LakebaseTokenizerStopword> = api.codecs.stopwordArray.decode("{}");
const synonym: LakebaseTokenizerSynonym = api.codecs.synonym.decode("(a,b,c)");
const stopwordColumn: SQL<string> = api.stopwords("sw").columns.word;
const synonymColumn: SQL<string> = api.synonyms("syn").columns.synonym;
void [version, schema, lexemes, row, synonyms, stopwords, synonym, stopwordColumn, synonymColumn, exactKeys, exactLexemes, exactStopword, exactSynonymArray];
function compileOnly() {
// @ts-expect-error No unselected extension appears in generated context.
extensions.lakebase_text;
// @ts-expect-error Pointer callbacks cannot be called by application code.
api.sql.functions.lakebase_tokenizer_wholeword_init(null);
// @ts-expect-error Operator DDL does not enter query bindings.
api.createDictionary({ schema: "app", name: "words" });
// @ts-expect-error Wrong native input type.
api.lexize(dictionaryReference({ schema: "app", name: "words" }), 123);
}
void compileOnly;`,
  );
}

export async function checkLakebaseTokenizerDiskBindings(root: string, placement: string): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('import { createLakebaseTokenizer_0_1_1 } from "kello/extensions/lakebase-tokenizer";'));
  for (const forbidden of [
    "kello/extensions/lakebase-text",
    "kello/extensions/lakebase-vector",
    "./schema",
    "./server",
    "kello.config",
  ])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["lakebase_tokenizer"]);
  const api = disk.extensions.lakebase_tokenizer;
  assert.equal(api.version, "0.1.1");
  assert.equal(api.schema, placement);
  assert.deepEqual(api.apiSupport, {
    status: "verified",
    digest: lakebaseTokenizerPublicDigest,
  });
  assert.equal(api.lexize, api.sql.functions.ts_lexize);
  assert.deepEqual(Object.keys(api.sql.types), [
    "lakebase_tokenizer_stopwords",
    "lakebase_tokenizer_synonyms",
    "_lakebase_tokenizer_stopwords",
    "_lakebase_tokenizer_synonyms",
  ]);
}

/** Empty and unknown versions exercise the same host and mounted entry points without inventing a callable API. */
export async function writeLakebaseTokenizerDescriptorProject(
  root: string,
  selection: "empty" | "future",
  explicitEmpty = false,
): Promise<void> {
  await writeLakebaseTokenizerProject(root);
  const component = join(root, "kello/components/tokenizer");
  const empty = selection === "empty";
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${empty ? (explicitEmpty ? "{ database: { extensions: {} } }" : "{}") : '{ database: { extensions: { lakebase_tokenizer: { version: "future" } } } }'});`,
  );
  await writeFile(
    join(component, "setup.ts"),
    `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "tokenizer", ${empty ? "" : 'extensions: { lakebase_tokenizer: { versions: ["future"] } },'} rpc: ({ os }) => ({ os }) });`,
  );
  const check = empty
    ? 'if (extensions !== undefined) throw Error("Empty extensions must be undefined");'
    : 'if (Object.keys(extensions).join(",") !== "lakebase_tokenizer" || extensions.lakebase_tokenizer.version !== "future" || extensions.lakebase_tokenizer.apiSupport.status !== "unverified" || "lexize" in extensions.lakebase_tokenizer || "sql" in extensions.lakebase_tokenizer) throw Error("Future version must be descriptor-only");';
  const schema = `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; ${check} export default defineSchema(() => ({}));`;
  await writeFile(
    join(root, "kello/schema.ts"),
    schema.replace("defineSchema(() => ({}));", 'defineSchema(() => ({}), { namespace: "app" });'),
  );
  await writeFile(join(component, "schema.ts"), schema);
  const contract = (entry: string, mounted: boolean) =>
    `import { defineContract, oc } from ${JSON.stringify(entry)}; import * as v from "valibot"; export default defineContract({ state: oc.output(${mounted ? `v.strictObject({ host: v.literal(${JSON.stringify(selection)}), mounted: v.literal(${JSON.stringify(selection)}), unselected: v.literal("empty") })` : `v.literal(${JSON.stringify(selection)})`}) });`;
  await writeFile(join(root, "kello/contracts/tokenizer.ts"), contract("kello/contract", true));
  await writeFile(join(component, "contracts/tokenizer.ts"), contract("../_generated/contract", false));
  const handler = `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { extensions } from "../_generated/extensions"; import { Effect } from "effect";
export default os.tokenizer.router({ state: os.tokenizer.state.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== extensions || binding !== context.extensions) throw Error("RPC/Effect descriptor identity differs");
${check}
`;
  await writeFile(
    join(root, "kello/functions/tokenizer.ts"),
    handler +
      `return { host: ${JSON.stringify(selection)} as const, mounted: await context.components.tokenizer.rpc.tokenizer.state(), unselected: await context.components.unselected.rpc.tokenizer.state() }; }) });`,
  );
  await writeFile(
    join(component, "functions/tokenizer.ts"),
    handler + `return ${JSON.stringify(selection)} as const; }) });`,
  );
  await writeFile(
    join(root, "kello/tokenizer-types.ts"),
    empty
      ? 'import { extensions } from "./_generated/extensions"; const absent: undefined = extensions; void absent;'
      : 'import { extensions } from "./_generated/extensions"; const version: "future" = extensions.lakebase_tokenizer.version; function compileOnly() {\n// @ts-expect-error Unverified descriptors do not expose a SQL API.\nextensions.lakebase_tokenizer.lexize;\n// @ts-expect-error Unselected family remains absent.\nextensions.lakebase_text;\n} void [version, compileOnly];',
  );
}

/** Imports actual emitted host/mounted services and runtime schema, never the source emitter. */
export async function checkLakebaseTokenizerGeneratedProject(
  root: string,
  selection: LakebaseTokenizerGenerationSelection,
  placement: string,
  version: string,
): Promise<void> {
  const scopes = [join(root, "kello"), join(root, "kello/components/tokenizer")];
  for (const scope of scopes) {
    const file = join(scope, "_generated/extensions.ts");
    const source = await readFile(file, "utf8");
    for (const forbidden of [
      "kello/tooling",
      "kello/extensions/lakebase-text",
      "kello/extensions/lakebase-vector",
      "./schema",
      "./server",
      "kello.config",
    ])
      assert(!source.includes(forbidden), forbidden);
    const { extensions } = await import(pathToFileURL(file).href);
    const services = await import(pathToFileURL(join(scope, "_generated/server.ts")).href);
    assert.equal(services.extensions, extensions);
    if (selection === "empty") {
      assert.equal(extensions, undefined);
      assert(!source.includes("createLakebaseTokenizer_0_1_1"));
    } else if (selection === "future") {
      assert.deepEqual(Object.keys(extensions), ["lakebase_tokenizer"]);
      assert.equal(extensions.lakebase_tokenizer.version, "future");
      assert.equal(extensions.lakebase_tokenizer.apiSupport.status, "unverified");
      assert.equal("lexize" in extensions.lakebase_tokenizer, false);
      assert.equal("sql" in extensions.lakebase_tokenizer, false);
      assert(!source.includes("createLakebaseTokenizer_0_1_1"));
    } else {
      assert(source.includes('from "kello/extensions/lakebase-tokenizer"'));
      assert.deepEqual(Object.keys(extensions), ["lakebase_tokenizer"]);
      assert.equal(extensions.lakebase_tokenizer.schema, placement);
      assert.equal(extensions.lakebase_tokenizer.version, "0.1.1");
      assert.equal(extensions.lakebase_tokenizer.apiSupport.digest, lakebaseTokenizerPublicDigest);
    }
  }
  const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", version, "runtime.js")).href);
  const options = runtimeOptions();
  const mounted = options.scopes.find((scope: { name: string }) => scope.name === "tokenizer");
  assert(mounted, "Mounted tokenizer runtime is missing");
  const unselected = options.scopes.find((scope: { name: string }) => scope.name === "unselected");
  assert(unselected, "Unselected mounted runtime is missing");
  assert.equal(unselected.extensions, undefined);
  const absent = await import(pathToFileURL(join(root, "kello/components/unselected/_generated/extensions.ts")).href);
  const absentServices = await import(
    pathToFileURL(join(root, "kello/components/unselected/_generated/server.ts")).href
  );
  assert.equal(absent.extensions, undefined);
  assert.equal(absentServices.extensions, undefined);
  if (selection === "empty") assert.equal(mounted.extensions, undefined);
  else {
    assert.deepEqual(Object.keys(mounted.extensions), ["lakebase_tokenizer"]);
    assert.equal(mounted.extensions.lakebase_tokenizer.version, selection === "future" ? "future" : "0.1.1");
    assert.equal(mounted.extensions.lakebase_tokenizer.schema, placement);
  }
  if (selection === "selected") {
    await checkLakebaseTokenizerDiskBindings(root, placement);
    for (const scope of [options, mounted]) {
      const entity = scope.schema.metadata.entities.find((entity: { name: string }) => entity.name === "values");
      assert(entity, "Generated composite storage table is missing");
      for (const [key, type, array] of [
        ["stopword", "lakebase_tokenizer_stopwords", false],
        ["synonym", "lakebase_tokenizer_synonyms", false],
        ["stopwordArray", "lakebase_tokenizer_stopwords", true],
        ["synonymArray", "lakebase_tokenizer_synonyms", true],
      ] as const) {
        const field = entity.fields.find((field: { name: string }) => field.name === key);
        assert(field?.extension, `Missing generated ${key} extension field`);
        assert.deepEqual(
          {
            schema: field.extension.schema,
            type: field.extension.type,
            array: field.extension.array,
            digest: field.extension.digest,
          },
          { schema: placement, type, array, digest: lakebaseTokenizerPublicDigest },
        );
      }
    }
  }
}
