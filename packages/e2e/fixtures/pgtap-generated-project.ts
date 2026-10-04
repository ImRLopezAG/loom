import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const pgtapGeneratedDigest = "523551d08abe2fbfe43134af4271d798a324146a4a9765a20fc28cd2399f3344";
export const pgtapGeneratedQueryCount = 102;
export const PGTAP_DEFAULT_SCHEMA = "extensions";
export const PGTAP_CUSTOM_SCHEMA = "tap";
export const pgtapGeneratedTypeNames = [
  "_time_trial_type",
  "__time_trial_type",
  "pg_all_foreign_keys",
  "_pg_all_foreign_keys",
  "tap_funky",
  "_tap_funky",
] as const;
export type PgtapGenerationSelection = "selected" | "default" | "custom" | "empty" | "future";
export const pgtapGenerationSelections = ["empty", "future", "selected", "default", "custom"] as const;

/** Caller supplies public package tooling. This fixture never imports a source adapter. */
export function pgtapPlacement(selection: PgtapGenerationSelection): string | undefined {
  if (selection === "empty" || selection === "future") return undefined;
  return selection === "custom" ? PGTAP_CUSTOM_SCHEMA : PGTAP_DEFAULT_SCHEMA;
}

export function pgtapDeclaration(selection: PgtapGenerationSelection) {
  if (selection === "empty") return {};
  if (selection === "future") return { pgtap: { version: "future" } };
  if (selection === "default") return { pgtap: { version: "1.3.3" } };
  if (selection === "custom") return { pgtap: { version: "1.3.3", schema: PGTAP_CUSTOM_SCHEMA } };
  return { pgtap: { version: "1.3.3", schema: PGTAP_DEFAULT_SCHEMA } };
}

function selectedConfig(placement: string, explicitSchema: boolean) {
  return explicitSchema ? { version: "1.3.3", schema: placement } : { version: "1.3.3" };
}

export async function writePgtapSelectedProject(root: string, schema?: string): Promise<string> {
  const placement = schema ?? PGTAP_DEFAULT_SCHEMA;
  const component = join(root, "kello/components/suite");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { pgtap: ${JSON.stringify(selectedConfig(placement, schema !== undefined))} } } });
`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import suite from "./components/suite/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(suite); export default app;\n',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "suite", extensions: { pgtap: { versions: ["1.3.3"] } }, rpc: ({ os }) => ({ os }) });\n',
  );
  const firstLoad = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.pgtap;
if (Object.keys(extensions).join(",") !== "pgtap") throw new Error("Incorrect pgTAP selection");
if (api.version !== "1.3.3" || api.schema !== ${JSON.stringify(placement)} || Object.keys(api.sql.overloads).length !== ${pgtapGeneratedQueryCount})
  throw new Error("Wrong first-load pgTAP binding");
if (Object.keys(api.fields).length !== 6 || Object.keys(api.sql.types).length !== 6) throw new Error("Missing captured pgTAP custom type");
if (api.diag !== api.sql.overloads["routine:$extension:pgtap.diag(pg_catalog.text)"]) throw new Error("Wrong canonical diag alias");
if (api.pgVersionNum !== api.sql.functions.pg_version_num) throw new Error("Wrong canonical pg_version_num alias");
`;
  await writeFile(
    join(root, "kello/schema.ts"),
    `${firstLoad}export default defineSchema((s) => ({ tasks: defineTable({ title: s.text().notNull(), trial: api.fields._time_trial_type() }, { publicFields: ["_id", "title", "trial"] }) }), { namespace: "app" });
`,
  );
  await writeFile(
    join(component, "schema.ts"),
    `${firstLoad}if (Object.keys(extensions).join(",") !== "pgtap" || extensions.pgtap.schema !== ${JSON.stringify(placement)})
  throw new Error("Wrong mounted virtual pgTAP selection");
export default defineSchema(() => ({}));
`,
  );
  const result = `v.strictObject({
  diagnostic: v.nullable(v.string()),
  empty: v.nullable(v.string()),
  pgVersion: v.number(),
  members: v.array(v.string()),
  effectSame: v.literal(true),
  version: v.literal("1.3.3"),
  schema: v.literal(${JSON.stringify(placement)}),
})`;
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.strictObject({ host: ${result}, mounted: ${result} })) });
`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    `import { defineContract, oc } from "../_generated/contract";
import * as v from "valibot";
export default defineContract({ run: oc.output(${result}) });
`,
  );
  const handler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions || binding !== selected) throw new Error("RPC/Effect selected context differs");
const api = binding.pgtap;
const [row] = await context.db.select({ diagnostic: api.diag("native\\nTAP result data"), empty: api.diag(null), pgVersion: api.pgVersionNum() }).from(sql\`(values (1)) as fixture(value)\`);
if (!row || row.pgVersion === null) throw new Error("Missing native pgTAP result");
const result = { ...row, pgVersion: row.pgVersion, members: Object.keys(api.sql.overloads).sort(), effectSame: true as const, version: api.version, schema: api.schema };
`;
  await writeFile(
    join(component, "functions/status.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.status.router({ run: os.status.run.handler(async ({ context }) => {
${handler}
// @ts-expect-error Unselected families remain absent in the mounted facade.
void context.extensions.vector;
return result; }) });
`,
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
return { host: result, mounted: await context.components.suite.rpc.status.run() }; }) });
function compileOnly() {
  // @ts-expect-error Unselected families are absent.
  selected.vector;
  // @ts-expect-error Native test-state calls belong to an operator session.
  selected.pgtap.sql.overloads["routine:$extension:pgtap.ok(pg_catalog.bool)"];
  // @ts-expect-error Exact query argument types, no untyped SQL strings as booleans.
  selected.pgtap.pgVersionNum(42);
}
void compileOnly;
`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { extensions } from "./_generated/extensions";
const version: "1.3.3" = extensions.pgtap.version;
const placement: ${JSON.stringify(placement)} = extensions.pgtap.schema;
const count: ${pgtapGeneratedQueryCount} = Object.keys(extensions.pgtap.sql.overloads).length as ${pgtapGeneratedQueryCount};
function compileOnly() {
  // @ts-expect-error Unselected families remain absent.
  void extensions.vector;
  // @ts-expect-error Test-state mutation never enters application SQL.
  void extensions.pgtap.sql.overloads["routine:$extension:pgtap.ok(pg_catalog.bool)"];
}
void [version, placement, count, compileOnly];
`,
  );
  return placement;
}

export async function writePgtapDescriptorProject(root: string, selection: "empty" | "future"): Promise<void> {
  const component = join(root, "kello/components/suite");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  const empty = selection === "empty";
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${empty ? "{}" : '{ database: { extensions: { pgtap: { version: "future" } } } }'});
`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import suite from "./components/suite/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(suite); export default app;\n',
  );
  await writeFile(
    join(component, "setup.ts"),
    `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "suite", ${empty ? "" : 'extensions: { pgtap: { versions: ["future"] } },'} rpc: ({ os }) => ({ os }) });
`,
  );
  const schemaCheck = empty
    ? 'if (extensions !== undefined) throw new Error("Empty context acquired an extension API");'
    : 'if (Object.keys(extensions).join(",") !== "pgtap" || extensions.pgtap.apiSupport.status !== "unverified" || "diag" in extensions.pgtap || "sql" in extensions.pgtap) throw new Error("Unsupported context acquired a callable API");';
  const handlerCheck = empty
    ? 'if (selected !== undefined) throw new Error("Empty context acquired an extension API");'
    : 'if (Object.keys(selected).join(",") !== "pgtap" || selected.pgtap.apiSupport.status !== "unverified" || "diag" in selected.pgtap || "sql" in selected.pgtap) throw new Error("Unsupported context acquired a callable API");';
  const schema = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
${schemaCheck}
export default defineSchema((s) => ({ tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }) }), { namespace: "app" });
`;
  await writeFile(join(root, "kello/schema.ts"), schema);
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
${schemaCheck}
export default defineSchema(() => ({}));
`,
  );
  const contract = (entry: string, mounted: boolean) =>
    `import { defineContract, oc } from ${JSON.stringify(entry)}; import * as v from "valibot"; export default defineContract({ ${mounted ? "list" : "run"}: oc.output(${mounted ? `v.strictObject({ host: v.literal(${JSON.stringify(selection)}), mounted: v.literal(${JSON.stringify(selection)}) })` : `v.literal(${JSON.stringify(selection)})`}) });
`;
  await writeFile(join(root, "kello/contracts/tasks.ts"), contract("kello/contract", true));
  await writeFile(join(component, "contracts/status.ts"), contract("../_generated/contract", false));
  const handler = `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
`;
  await writeFile(
    join(component, "functions/status.ts"),
    `${handler}export default os.status.router({ run: os.status.run.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions || binding !== selected) throw new Error("RPC/Effect selected context differs");
${handlerCheck}
return ${JSON.stringify(selection)} as const; }) });
`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `${handler}export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions || binding !== selected) throw new Error("RPC/Effect selected context differs");
${handlerCheck}
return { host: ${JSON.stringify(selection)} as const, mounted: await context.components.suite.rpc.status.run() }; }) });
function compileOnly() {
${
  empty
    ? `  // @ts-expect-error No family was selected.
  selected.pgtap;`
    : `  // @ts-expect-error Unsupported exact version has descriptor metadata only.
  selected.pgtap.diag("native");`
}
  // @ts-expect-error Unselected families remain absent.
  selected.vector;
}
void compileOnly;
`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    empty
      ? 'import { extensions } from "./_generated/extensions"; const absent: undefined = extensions; void absent;\n'
      : `import { extensions } from "./_generated/extensions";
const version: "future" = extensions.pgtap.version;
function compileOnly() {
  // @ts-expect-error Unverified descriptors do not expose a SQL API.
  extensions.pgtap.diag;
  // @ts-expect-error Unselected family remains absent.
  extensions.vector;
}
void [version, compileOnly];
`,
  );
}

export async function writePgtapGenerationProject(
  root: string,
  selection: PgtapGenerationSelection,
): Promise<string | undefined> {
  if (selection === "empty" || selection === "future") {
    await writePgtapDescriptorProject(root, selection);
    return undefined;
  }
  if (selection === "custom") return writePgtapSelectedProject(root, PGTAP_CUSTOM_SCHEMA);
  if (selection === "selected") return writePgtapSelectedProject(root, PGTAP_DEFAULT_SCHEMA);
  return writePgtapSelectedProject(root);
}

/** All project imports use the installed public package, including first-load virtual bindings. */
export async function writePgtapProject(root: string) {
  await writePgtapSelectedProject(root, PGTAP_CUSTOM_SCHEMA);
}

type PgtapQueryHelper = (...args: never[]) => object;

export function assertPgtapStrictGeneratedApi(api: {
  name: string;
  version: string;
  schema: string;
  apiSupport: { status: string; digest?: string };
  sql: {
    overloads: { readonly [member: string]: PgtapQueryHelper };
    functions: { readonly pg_version_num: PgtapQueryHelper };
    types: object;
  };
  fields: object;
  diag: PgtapQueryHelper;
  pgVersionNum: PgtapQueryHelper;
}): void {
  assert.equal(api.name, "pgtap");
  assert.equal(api.version, "1.3.3");
  assert.deepEqual(api.apiSupport, { status: "verified", digest: pgtapGeneratedDigest });
  assert.equal(Object.keys(api.sql.overloads).length, pgtapGeneratedQueryCount);
  assert.deepEqual(Object.keys(api.fields).sort(), [...pgtapGeneratedTypeNames].sort());
  assert.deepEqual(Object.keys(api.sql.types).sort(), [...pgtapGeneratedTypeNames].sort());
  assert.equal(api.diag, api.sql.overloads["routine:$extension:pgtap.diag(pg_catalog.text)"]);
  assert.equal(api.pgVersionNum, api.sql.functions.pg_version_num);
  assert.equal("ok" in api.sql.functions, false);
  assert.equal("routine:$extension:pgtap.ok(pg_catalog.bool)" in api.sql.overloads, false);
}

export async function checkPgtapDiskBindings(root: string, placement = PGTAP_CUSTOM_SCHEMA) {
  const file = join(root, "kello/_generated/extensions.ts");
  const text = await readFile(file, "utf8");
  assert(text.includes('import { createPgtap_1_3_3 } from "kello/extensions/pgtap";'));
  assert(text.includes(pgtapGeneratedDigest));
  for (const forbidden of [
    "kello/extensions/vector",
    "kello/tooling/extensions/pgtap",
    "./schema",
    "./server",
    "kello.config",
  ])
    assert(!text.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  const rpc = await readFile(join(root, "kello/_generated/rpc.ts"), "utf8");
  const serverSource = await readFile(join(root, "kello/_generated/server.ts"), "utf8");
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["pgtap"]);
  assert(Object.isFrozen(disk.extensions));
  assert.equal(disk.extensions.pgtap.schema, placement);
  assertPgtapStrictGeneratedApi(disk.extensions.pgtap);
  assert(serverSource.includes("export const { Database, Tables, Validators, Search, Extensions }"));
  assert(serverSource.includes("createProjectServices"));
  assert(rpc.includes("createApplicationRpc"));
  assert(rpc.includes("extensions"));
  return { extensions: disk.extensions, server };
}

/** Imports actual emitted host/mounted services, never the source emitter. */
export async function checkPgtapGeneratedProject(
  root: string,
  selection: PgtapGenerationSelection,
  generation?: string,
): Promise<{ extensions: unknown }> {
  const placement = pgtapPlacement(selection);
  const scopes = [join(root, "kello"), join(root, "kello/components/suite")];
  let host: { extensions: unknown } | undefined;
  for (const scope of scopes) {
    const file = join(scope, "_generated/extensions.ts");
    const source = await readFile(file, "utf8");
    const disk = await import(pathToFileURL(file).href);
    const services = await import(pathToFileURL(join(scope, "_generated/server.ts")).href);
    assert.equal(services.extensions, disk.extensions);
    assert(Object.isFrozen(disk.extensions));
    if (selection === "empty") {
      assert.equal(disk.extensions, undefined);
      assert(!source.includes("createPgtap_1_3_3"));
    } else if (selection === "future") {
      assert.deepEqual(Object.keys(disk.extensions), ["pgtap"]);
      assert.equal(disk.extensions.pgtap.version, "future");
      assert.equal(disk.extensions.pgtap.apiSupport.status, "unverified");
      assert.equal("diag" in disk.extensions.pgtap, false);
      assert.equal("sql" in disk.extensions.pgtap, false);
      assert(!source.includes("createPgtap_1_3_3"));
    } else {
      assert(source.includes('from "kello/extensions/pgtap"'));
      assert.deepEqual(Object.keys(disk.extensions), ["pgtap"]);
      assert.equal(disk.extensions.pgtap.schema, placement);
      assertPgtapStrictGeneratedApi(disk.extensions.pgtap);
    }
    if (scope.endsWith("kello")) host = disk;
  }
  if (selection === "selected" || selection === "default" || selection === "custom")
    await checkPgtapDiskBindings(root, placement!);
  if (generation) {
    const { runtimeOptions } = await import(
      pathToFileURL(join(root, ".loom/generations", generation, "runtime.js")).href
    );
    const options = runtimeOptions();
    const mounted = options.scopes.find((scope: { name: string }) => scope.name === "suite");
    assert(mounted, "Mounted pgTAP runtime is missing");
    if (selection === "empty") assert.equal(mounted.extensions, undefined);
    else {
      assert.deepEqual(Object.keys(mounted.extensions), ["pgtap"]);
      assert.equal(mounted.extensions.pgtap.version, selection === "future" ? "future" : "1.3.3");
      if (placement) assert.equal(mounted.extensions.pgtap.schema, placement);
    }
  }
  return host!;
}
