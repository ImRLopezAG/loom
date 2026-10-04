import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const anonGeneratedDigest = "93a826ea74c64096e00ad172603b6b4d5ada6a842d50caa3cb4cc76374029878";

/** The caller supplies public package tooling; this fixture never imports a source adapter. */
export async function writeAnonSelectedProject(root: string, schema?: string): Promise<string> {
  const placement = schema ?? "extensions";
  const namespace = `anon_gen_${randomUUID().replaceAll("-", "")}`;
  const component = join(root, "kello/components/remote");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"));
  const selected = schema ? { version: "2.5.1", schema } : { version: "2.5.1" };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { namespace: ${JSON.stringify(namespace)}, extensions: { anon: ${JSON.stringify(selected)} } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import remote from "./components/remote/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(remote); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "remote", extensions: { anon: { versions: ["2.5.1"] } }, rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.anon;
if (Object.keys(extensions).join(",") !== "anon") throw new Error("Incorrect selection");
if (api.schema !== ${JSON.stringify(placement)} || api.version !== "2.5.1")
  throw new Error("Incorrect first-load anon binding");
if (typeof api.sql.functions.partial_email !== "function" || typeof api.sql.functions.version !== "function")
  throw new Error("Incorrect first-load anon surface");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
  records: defineTable({ city: api.fields.city(), cities: api.fields._city() }),
}), { namespace: ${JSON.stringify(namespace)} });`,
  );
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "anon" || extensions.anon.schema !== ${JSON.stringify(placement)})
  throw new Error("Wrong virtual child selection");
extensions.anon.sql.functions.version();
export default defineSchema(() => ({}));`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(v.literal("2.5.1")) });',
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ version: v.literal("2.5.1"), placement: v.literal(${JSON.stringify(placement)}), email: v.string(), child: v.literal("2.5.1") })) });`,
  );
  const handler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Public generated RPC and Effect bindings differ");
const version: "2.5.1" = binding.anon.version;
const placement: ${JSON.stringify(placement)} = context.extensions.anon.schema;
// @ts-expect-error An unselected family cannot enter the generated host or component context.
void context.extensions.vector;
const [row] = await context.db.select({
  version: binding.anon.sql.functions.version(),
  email: binding.anon.sql.functions.partial_email("daamien@gmail.com"),
}).from(sql.raw("(VALUES (1)) AS probe(id)"));
if (!row || row.version !== "2.5.1" || row.email !== "da******@gm******.com")
  throw new Error("Generated RPC did not execute native anon query members");`;
  await writeFile(
    join(component, "functions/status.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.status.router({ run: os.status.run.handler(async ({ context }) => {
${handler}
// @ts-expect-error Unselected families remain absent in the mounted facade.
void context.extensions.dblink;
// @ts-expect-error Operator dynamic masking never enters application SQL.
void context.extensions.anon.sql.functions.start_dynamic_masking;
return version; }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${handler}
return { version, placement, email: "da******@gm******.com", child: await context.components.remote.rpc.status.run() }; }) });`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { extensions } from "./_generated/extensions";
const version: "2.5.1" = extensions.anon.version;
const placement: ${JSON.stringify(placement)} = extensions.anon.schema;
extensions.anon.sql.functions.partial_email("a@x.io");
extensions.anon.fields.city().default({oid:1,val:"Paris"});
extensions.anon.fields._city();
extensions.anon.sql.overloads["routine:anon.projection_to_oid(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)"];
function compileOnly() {
// @ts-expect-error Upstream int8 projection is not the Neon contract.
extensions.anon.sql.overloads["routine:anon.projection_to_oid(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int8)"];
// @ts-expect-error Operator dynamic masking never enters application SQL.
extensions.anon.sql.functions.start_dynamic_masking;
// @ts-expect-error Unselected families remain absent.
void extensions.vector;
}
void [version, placement, compileOnly];`,
  );
  return placement;
}

export async function writeAnonFutureProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { namespace: "app", extensions: { anon: { version: "future" } } } });',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
if (extensions.anon.apiSupport.status !== "unverified") throw new Error("Future anon must stay unverified");
if ("sql" in extensions.anon) throw new Error("Unverified anon must not invent query methods");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });`,
  );
  await writeAnonDescriptorContext(root, "future");
}

export async function writeAnonEmptyProject(root: string, explicit = false): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig({database:{namespace:"app"${explicit ? ",extensions:{}" : ""}}});`,
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import {defineSchema} from "kello/server";
import {extensions} from "./_generated/extensions";
const exact: undefined = extensions;
if(exact !== undefined) throw new Error("Empty virtual binding must be exactly undefined");
export default defineSchema(() => ({}),{namespace:"app"});`,
  );
  await writeAnonDescriptorContext(root, "empty");
}

async function writeAnonDescriptorContext(root: string, mode: "empty" | "future"): Promise<void> {
  const component = join(root, "kello/components/remote");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import {defineApplication} from "kello/server"; import remote from "./components/remote/setup"; const app=defineApplication({rpc:({os})=>({os})}); app.use(remote); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    `import {defineComponent} from "./_generated/setup"; export default defineComponent({name:"remote",${mode === "future" ? 'extensions:{anon:{versions:["future"]}},' : ""}rpc:({os})=>({os})});`,
  );
  const checks =
    mode === "empty"
      ? `const exact: undefined = context.extensions;
if(binding !== undefined || exact !== undefined) throw new Error("Empty RPC/Effect binding leaked");
function compileOnly() {
// @ts-expect-error Empty selection has no anon context.
void context.extensions.anon;
}
void compileOnly;`
      : `const version: "future" = binding.anon.version;
if(binding.anon.apiSupport.status !== "unverified" || "sql" in binding.anon) throw new Error("Future RPC descriptor invented methods");
// @ts-expect-error Future versions have no query methods.
void context.extensions.anon.sql;
void version;`;
  const handler = `const binding=Effect.runSync(Effect.provide(Extensions,context["effect/context"]));
if(binding !== context.extensions) throw new Error("RPC/Effect binding mismatch");
${checks}`;
  await writeFile(
    join(component, "schema.ts"),
    `import {defineSchema} from "kello/server"; import {extensions} from "./_generated/extensions";
${mode === "empty" ? 'const exact:undefined=extensions; if(exact!==undefined) throw new Error("Empty mounted binding leaked");' : 'if(extensions.anon.apiSupport.status!=="unverified" || "sql" in extensions.anon) throw new Error("Future mounted descriptor leaked");'}
export default defineSchema(()=>({}));`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    `import {defineContract,oc} from "../_generated/contract"; import * as v from "valibot"; export default defineContract({run:oc.output(v.literal(${JSON.stringify(mode)}))});`,
  );
  await writeFile(
    join(component, "functions/status.ts"),
    `import {os} from "../_generated/rpc"; import {Extensions} from "../_generated/server"; import {Effect} from "effect"; export default os.status.router({run:os.status.run.handler(async({context})=>{${handler}
return ${JSON.stringify(mode)} as const;})});`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import {defineContract,oc} from "kello/contract"; import * as v from "valibot"; export default defineContract({list:oc.output(v.object({mode:v.literal(${JSON.stringify(mode)}),child:v.literal(${JSON.stringify(mode)})}))});`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import {os} from "../_generated/rpc"; import {Extensions} from "../_generated/server"; import {Effect} from "effect"; export default os.tasks.router({list:os.tasks.list.handler(async({context})=>{${handler}
return {mode:${JSON.stringify(mode)} as const,child:await context.components.remote.rpc.status.run()};})});`,
  );
}

/** Read actual generated files and import them from disk after the virtual first load. */
export async function checkAnonDiskBindings(root: string, placement: string): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('import { createAnon_2_5_1 } from "kello/extensions/anon";'));
  assert(source.includes(anonGeneratedDigest));
  for (const forbidden of ["kello/extensions/dblink", "kello/tooling", "./schema", "./server", "kello.config"])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["anon"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.anon;
  assert.deepEqual([api.name, api.version, api.schema], ["anon", "2.5.1", placement]);
  assert.deepEqual(api.apiSupport, { status: "verified", digest: anonGeneratedDigest });
  assert(api.sql.functions.partial_email instanceof Function);
  assert(api.sql.functions.version instanceof Function);
  assert(api.sql.functions.projection_to_oid instanceof Function);
  assert.equal("start_dynamic_masking" in api.sql.functions, false);
  assert.equal("anonymize_table" in api.sql.functions, false);
  assert.deepEqual(Object.keys(api.sql.operators), []);
}
