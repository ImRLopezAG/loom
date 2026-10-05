import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** The caller supplies public package tooling; this fixture never imports a source adapter. */
export async function writeNeonUtilsProject(root: string, schema?: string): Promise<void> {
  await rm(join(root, "kello/functions/tasks.ts"));
  await rm(join(root, "kello/contracts/tasks.ts"));
  await mkdir(join(root, "kello/functions"), { recursive: true });
  const placement = schema ?? "extensions";
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { neon_utils: { version: "1.1"${schema ? `, schema: ${JSON.stringify(schema)}` : ""} } } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "neon_utils") throw Error("Incorrect selection");
const api = extensions.neon_utils;
if (api.schema !== ${JSON.stringify(placement)} || api.version !== "1.1" || typeof api.numCpus !== "function") throw Error("Incorrect first-load binding");
if (api.numCpus !== api.sql.functions.num_cpus) throw Error("Incorrect canonical alias");
api.numCpus();
export default defineSchema(() => ({}), { namespace: "app" });`,
  );
  await writeFile(
    join(root, "kello/contracts/cpu.ts"),
    `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ describe: oc.output(v.strictObject({ sql: v.string(), params: v.array(v.unknown()), version: v.literal("1.1"), schema: v.string(), cpus: v.number(), effectSame: v.literal(true) })) });`,
  );
  await writeFile(
    join(root, "kello/functions/cpu.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.cpu.router({ describe: os.cpu.describe.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== context.extensions || binding !== selected) throw Error("Generated RPC/Effect binding differs");
  const api = binding.neon_utils;
  if (api.numCpus !== api.sql.functions.num_cpus) throw Error("Generated RPC alias differs");
  const builder = context.db.select({ cpus: api.numCpus() }).from(sql\`(values (1)) cpu_fixture(n)\`);
  const query = builder.toSQL();
  const [row] = await builder;
  if (!row) throw Error("Native CPU query returned no row");
  return { sql: query.sql, params: query.params, version: api.version, schema: api.schema, cpus: row.cpus, effectSame: true as const };
}) });`,
  );
  await writeFile(
    join(root, "kello/neon-utils-types.ts"),
    `import { defineRelations, type SQL } from "drizzle-orm";
import { createProjectProcedures, defineSchema } from "kello/server";
import { Effect } from "effect";
import { extensions } from "./_generated/extensions";
import { Extensions, extensions as serverExtensions } from "./_generated/server";
const version: "1.1" = extensions.neon_utils.version;
const schema: ${JSON.stringify(placement)} = extensions.neon_utils.schema;
const cpus: SQL<number> = extensions.neon_utils.numCpus();
const canonical: SQL<number> = extensions.neon_utils.sql.functions.num_cpus();
void [version, schema, cpus, canonical, Extensions, serverExtensions];
const projectSchema = defineSchema(() => ({}));
const { procedure } = createProjectProcedures(projectSchema, defineRelations(projectSchema.tables), extensions);
const handler = procedure.handler(async ({ context }) => {
  const query: SQL<number> = context.extensions.neon_utils.numCpus();
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  const effectQuery: SQL<number> = binding.neon_utils.sql.functions.num_cpus();
  void [query, effectQuery];
  return [];
});
void handler;
function compileOnly() {
// @ts-expect-error No unselected extension appears in generated context.
extensions.neon;
// @ts-expect-error No captured arguments exist.
extensions.neon_utils.numCpus(null);
// @ts-expect-error No CPU schema type exists.
extensions.neon_utils.fields;
}
void compileOnly;`,
  );
}

/** Read actual generated files and import them from disk after the virtual first load. */
export async function checkNeonUtilsDiskBindings(root: string, placement: string): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('import { createNeonUtils_1_1 } from "kello/extensions/neon-utils";'));
  for (const forbidden of ['kello/extensions/neon"', "kello/extensions/vector", "./schema", "./server", "kello.config"])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  const rpcSource = await readFile(join(root, "kello/_generated/rpc.ts"), "utf8");
  assert(rpcSource.includes("createApplicationRpc"));
  assert(rpcSource.includes("extensions"));
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["neon_utils"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.neon_utils;
  assert.deepEqual([api.name, api.version, api.schema], ["neon_utils", "1.1", placement]);
  assert.deepEqual(api.apiSupport, {
    status: "verified",
    digest: "4ceac79f87c6c16fa8dea371b441d6a150f9d25db3244b9bac4cce0275f74cec",
  });
  assert.deepEqual(Object.keys(api.sql.functions), ["num_cpus"]);
  assert.equal(api.numCpus, api.sql.functions.num_cpus);
}
