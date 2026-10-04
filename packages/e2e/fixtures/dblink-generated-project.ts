import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const dblinkGeneratedDigest = "b713a9ca7a0e00853d0346b44e021c8c48372b5164b4b3f533c2b5022e37eba6";

/** The caller supplies public package tooling; this fixture never imports a source adapter. */
export async function writeDblinkSelectedProject(root: string, schema?: string): Promise<string> {
  const placement = schema ?? "extensions";
  const component = join(root, "kello/components/remote");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"));
  const selected = schema ? { version: "1.2", schema } : { version: "1.2" };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { dblink: ${JSON.stringify(selected)} } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import remote from "./components/remote/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(remote); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "remote", extensions: { dblink: { versions: ["1.2"] } }, rpc: ({ os }) => ({ os }) });',
  );
  const schemaSource = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.dblink;
if (Object.keys(extensions).join(",") !== "dblink") throw new Error("Incorrect selection");
if (api.schema !== ${JSON.stringify(placement)} || api.version !== "1.2" || api.connect.authority !== "session")
  throw new Error("Incorrect first-load dblink binding");
if (typeof api.connections !== "function" || api.sql.functions.dblink_get_connections === undefined)
  throw new Error("Incorrect first-load connections surface");
api.connections();
api.currentQuery();
api.getPkey("local_items");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });`;
  await writeFile(join(root, "kello/schema.ts"), schemaSource);
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "dblink" || extensions.dblink.schema !== ${JSON.stringify(placement)})
  throw new Error("Wrong virtual child selection");
extensions.dblink.connections();
export default defineSchema(() => ({}));`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(v.literal("1.2")) });',
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ version: v.literal("1.2"), placement: v.literal(${JSON.stringify(placement)}), child: v.literal("1.2") })) });`,
  );
  const handler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Public generated RPC and Effect bindings differ");
const version: "1.2" = binding.dblink.version;
const placement: ${JSON.stringify(placement)} = context.extensions.dblink.schema;
binding.dblink.connections();
binding.dblink.currentQuery();
if (binding.dblink.connect.authority !== "session") throw new Error("Connect must stay session authority");
if (binding.dblink.exec.authority !== "session") throw new Error("Exec must stay session authority");`;
  await writeFile(
    join(component, "functions/status.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect";
export default os.status.router({ run: os.status.run.handler(async ({ context }) => {
${handler}
// @ts-expect-error Unselected families remain absent in the mounted facade.
void context.extensions.postgres_fdw;
return version; }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${handler}
return { version, placement, child: await context.components.remote.rpc.status.run() }; }) });`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { extensions } from "./_generated/extensions";
const version: "1.2" = extensions.dblink.version;
const placement: ${JSON.stringify(placement)} = extensions.dblink.schema;
const session: "session" = extensions.dblink.connect.authority;
extensions.dblink.connections();
extensions.dblink.currentQuery();
function compileOnly() {
// @ts-expect-error Connect is explicit session tooling, not application SQL.
extensions.dblink.sql.functions.dblink_connect("named", "host=local");
// @ts-expect-error Remote query is explicit session tooling, not application SQL.
extensions.dblink.sql.functions.dblink("SELECT 1");
// @ts-expect-error Unselected families remain absent.
void extensions.postgres_fdw;
void session;
}
void [version, placement, compileOnly];`,
  );
  return placement;
}

export async function writeDblinkFutureProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { dblink: { version: "future" } } } });',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
if (extensions.dblink.apiSupport.status !== "unverified") throw new Error("Future dblink must stay unverified");
if ("connections" in extensions.dblink) throw new Error("Unverified dblink must not invent query methods");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });`,
  );
}

export async function writeDblinkEmptyProject(root: string): Promise<void> {
  await writeFile(join(root, "kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig({});');
}

/** Read actual generated files and import them from disk after the virtual first load. */
export async function checkDblinkDiskBindings(root: string, placement: string): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('import { createDblink_1_2 } from "kello/extensions/dblink";'));
  for (const forbidden of ["kello/extensions/postgres-fdw", "kello/tooling", "./schema", "./server", "kello.config"])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["dblink"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.dblink;
  assert.deepEqual([api.name, api.version, api.schema], ["dblink", "1.2", placement]);
  assert.deepEqual(api.apiSupport, { status: "verified", digest: dblinkGeneratedDigest });
  assert.deepEqual(Object.keys(api.sql.functions).sort(), [
    "dblink_build_sql_delete",
    "dblink_build_sql_insert",
    "dblink_build_sql_update",
    "dblink_current_query",
    "dblink_get_connections",
    "dblink_get_pkey",
  ]);
  assert.equal(api.connect.authority, "session");
  assert.equal(api.exec.authority, "session");
  assert.equal(api.query.authority, "session");
}
