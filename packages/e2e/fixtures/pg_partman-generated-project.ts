import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const pgPartmanGeneratedDigest = "f7833b872d553ea877f41e6e15834e9e3bfb4a2cfd84f43e3ac4710188193555";

/** The caller supplies public package tooling; this fixture never imports a source adapter. */
export async function writePgPartmanSelectedProject(root: string, schema?: string): Promise<string> {
  const placement = schema ?? "extensions";
  const namespace = `partman_gen_${randomUUID().replaceAll("-", "")}`;
  const component = join(root, "kello/components/remote");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"));
  const selected = schema ? { version: "5.1.0", schema } : { version: "5.1.0" };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { namespace: ${JSON.stringify(namespace)}, extensions: { pg_partman: ${JSON.stringify(selected)} } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import remote from "./components/remote/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(remote); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "remote", extensions: { pg_partman: { versions: ["5.1.0"] } }, rpc: ({ os }) => ({ os }) });',
  );
  const schemaSource = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.pg_partman;
if (Object.keys(extensions).join(",") !== "pg_partman") throw new Error("Incorrect selection");
if (api.schema !== ${JSON.stringify(placement)} || api.version !== "5.1.0")
  throw new Error("Incorrect first-load pg_partman binding");
if (typeof api.check_name_length !== "function" || api.sql.functions.show_partitions === undefined)
  throw new Error("Incorrect first-load pg_partman surface");
api.check_name_length("probe");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull(), report: api.check_default_tableField(), reports: api.check_default_tableArrayField(), config: api.part_configField(), configs: api.part_configArrayField(), subconfig: api.part_config_subField(), subconfigs: api.part_config_subArrayField(), privileges: api.table_privsField(), privilegesArray: api.table_privsArrayField() }, { publicFields: ["_id", "title"] }),
}), { namespace: ${JSON.stringify(namespace)} });`;
  await writeFile(join(root, "kello/schema.ts"), schemaSource);
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "pg_partman" || extensions.pg_partman.schema !== ${JSON.stringify(placement)})
  throw new Error("Wrong virtual child selection");
extensions.pg_partman.check_name_length("probe");
export default defineSchema(() => ({}));`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(v.literal("5.1.0")) });',
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ version: v.literal("5.1.0"), placement: v.literal(${JSON.stringify(placement)}), child: v.literal("5.1.0") })) });`,
  );
  const handler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Public generated RPC and Effect bindings differ");
const version: "5.1.0" = binding.pg_partman.version;
const placement: ${JSON.stringify(placement)} = context.extensions.pg_partman.schema;
binding.pg_partman.check_name_length("probe");
const [row] = await context.db.select({ valid: binding.pg_partman.check_partition_type("range"), missing: binding.pg_partman.check_epoch_type(null), name: binding.pg_partman.check_name_length("probe", "tail", true) }).from(sql.raw("(VALUES (1)) AS probe(id)"));
if (!row || row.valid !== true || row.missing !== null || row.name !== "probe_ptail") throw new Error("Generated RPC did not execute native pg_partman");`;
  await writeFile(
    join(component, "functions/status.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.status.router({ run: os.status.run.handler(async ({ context }) => {
${handler}
// @ts-expect-error Unselected families remain absent in the mounted facade.
void context.extensions.dblink;
return version; }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${handler}
return { version, placement, child: await context.components.remote.rpc.status.run() }; }) });`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { extensions } from "./_generated/extensions";
const version: "5.1.0" = extensions.pg_partman.version;
const placement: ${JSON.stringify(placement)} = extensions.pg_partman.schema;

extensions.pg_partman.check_name_length("probe");
function compileOnly() {
// @ts-expect-error Partition DDL stays explicit operator tooling.
extensions.pg_partman.sql.functions.create_parent("parent", "id", "10");
// @ts-expect-error Unselected families remain absent.
void extensions.dblink;

}
void [version, placement, compileOnly];`,
  );
  return placement;
}

export async function writePgPartmanFutureProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_partman: { version: "future" } } } });',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
if (extensions.pg_partman.apiSupport.status !== "unverified") throw new Error("Future pg_partman must stay unverified");
if ("check_name_length" in extensions.pg_partman) throw new Error("Unverified pg_partman must not invent query methods");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });`,
  );
}

export async function writePgPartmanEmptyProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({});',
  );
}

/** Read actual generated files and import them from disk after the virtual first load. */
export async function checkPgPartmanDiskBindings(root: string, placement: string): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('import { createPgPartman_5_1_0 } from "kello/extensions/pg-partman";'));
  for (const forbidden of ["kello/extensions/dblink", "kello/tooling", "./schema", "./server", "kello.config"])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["pg_partman"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.pg_partman;
  assert.deepEqual([api.name, api.version, api.schema], ["pg_partman", "5.1.0", placement]);
  assert.deepEqual(api.apiSupport, { status: "verified", digest: pgPartmanGeneratedDigest });
  assert.equal(Object.keys(api.sql.functions).length, 13);
  assert.equal("create_parent" in api.sql.functions, false);
  for (const name of ["check_default_table", "part_config", "part_config_sub", "table_privs"]) {
    assert.equal(api[`${name}Field`]().metadata.extension?.type, name);
    assert(api[`${name}ArrayField`]().metadata);
  }
}
