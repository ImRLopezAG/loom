import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const postgresFdwGeneratedDigest = "39b3195d0b34c96f9e424299e84a599dc7abb6f21bd48eccfcce08f3071db717";

/** The caller supplies public package tooling; this fixture never imports a source adapter. */
export async function writePostgresFdwSelectedProject(root: string, schema?: string): Promise<string> {
  const placement = schema ?? "extensions";
  const component = join(root, "kello/components/remote");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"));
  const selected = schema ? { version: "1.2", schema } : { version: "1.2" };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { postgres_fdw: ${JSON.stringify(selected)} } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import remote from "./components/remote/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(remote); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "remote", extensions: { postgres_fdw: { versions: ["1.2"] } }, rpc: ({ os }) => ({ os }) });',
  );
  const schemaSource = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.postgres_fdw;
if (Object.keys(extensions).join(",") !== "postgres_fdw") throw new Error("Incorrect selection");
if (api.schema !== ${JSON.stringify(placement)} || api.version !== "1.2" || api.disconnect.authority !== "session")
  throw new Error("Incorrect first-load postgres_fdw binding");
if (typeof api.connections !== "function" || api.sql.functions.postgres_fdw_get_connections === undefined)
  throw new Error("Incorrect first-load connections surface");
api.connections();
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });`;
  await writeFile(join(root, "kello/schema.ts"), schemaSource);
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "postgres_fdw" || extensions.postgres_fdw.schema !== ${JSON.stringify(placement)})
  throw new Error("Wrong virtual child selection");
extensions.postgres_fdw.connections();
export default defineSchema(() => ({}));`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(v.object({ version: v.literal("1.2"), connections: v.literal(0) })) });',
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ version: v.literal("1.2"), placement: v.literal(${JSON.stringify(placement)}), connections: v.literal(0), child: v.object({ version: v.literal("1.2"), connections: v.literal(0) }) })) });`,
  );
  const handler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Public generated RPC and Effect bindings differ");
const version: "1.2" = binding.postgres_fdw.version;
const placement: ${JSON.stringify(placement)} = context.extensions.postgres_fdw.schema;
const rows = binding.postgres_fdw.connections(false, "fdw_rpc");
const observed = await context.db.select(rows.columns).from(rows.from);
if (observed.length !== 0) throw new Error("A fresh RPC session must have no cached FDW connections");
const connections = 0 as const;
if (binding.postgres_fdw.disconnect.authority !== "session") throw new Error("Disconnect must stay session authority");`;
  await writeFile(
    join(component, "functions/status.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect";
export default os.status.router({ run: os.status.run.handler(async ({ context }) => {
${handler}
// @ts-expect-error Unselected families remain absent in the mounted facade.
void context.extensions.dblink;
return { version, connections }; }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${handler}
return { version, placement, connections, child: await context.components.remote.rpc.status.run() }; }) });`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { extensions } from "./_generated/extensions";
const version: "1.2" = extensions.postgres_fdw.version;
const placement: ${JSON.stringify(placement)} = extensions.postgres_fdw.schema;
const session: "session" = extensions.postgres_fdw.disconnect.authority;
extensions.postgres_fdw.connections();
function compileOnly() {
// @ts-expect-error Disconnect is explicit session tooling, not application SQL.
extensions.postgres_fdw.sql.functions.postgres_fdw_disconnect("loopback");
// @ts-expect-error Unselected families remain absent.
void extensions.dblink;
void session;
}
void [version, placement, compileOnly];`,
  );
  return placement;
}

export async function writePostgresFdwFutureProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { postgres_fdw: { version: "future" } } } });',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
if (extensions.postgres_fdw.apiSupport.status !== "unverified") throw new Error("Future postgres_fdw must stay unverified");
if ("connections" in extensions.postgres_fdw) throw new Error("Unverified postgres_fdw must not invent query methods");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });`,
  );
}

export async function writePostgresFdwEmptyProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({});',
  );
}

/** Read actual generated files and import them from disk after the virtual first load. */
export async function checkPostgresFdwDiskBindings(root: string, placement: string): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('import { createPostgresFdw_1_2 } from "kello/extensions/postgres-fdw";'));
  for (const forbidden of ["kello/extensions/dblink", "kello/tooling", "./schema", "./server", "kello.config"])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["postgres_fdw"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.postgres_fdw;
  assert.deepEqual([api.name, api.version, api.schema], ["postgres_fdw", "1.2", placement]);
  assert.deepEqual(api.apiSupport, { status: "verified", digest: postgresFdwGeneratedDigest });
  assert.deepEqual(Object.keys(api.sql.functions), ["postgres_fdw_get_connections"]);
  assert.equal(api.disconnect.authority, "session");
  assert.equal(api.disconnectAll.authority, "session");
}
