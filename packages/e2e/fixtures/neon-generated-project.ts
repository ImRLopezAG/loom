import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** The caller supplies public package tooling; this fixture never imports a source adapter. */
export async function writeNeonProject(root: string, schema?: string): Promise<void> {
  await rm(join(root, "kello/functions/tasks.ts"));
  await rm(join(root, "kello/contracts/tasks.ts"));
  await mkdir(join(root, "kello/functions"), { recursive: true });
  const placement = schema ?? "extensions";
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { neon: { version: "1.25"${schema ? `, schema: ${JSON.stringify(schema)}` : ""} } } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "neon") throw Error("Incorrect selection");
const api = extensions.neon;
if (api.schema !== ${JSON.stringify(placement)} || api.version !== "1.25" || typeof api.pgClusterSize !== "function") throw Error("Incorrect first-load binding");
if (api.pgClusterSize !== api.sql.functions.pg_cluster_size) throw Error("Incorrect canonical alias");
api.pgClusterSize();
export default defineSchema(() => ({ neon_values: {
${["local_cache", "neon_backend_perf_counters", "neon_backpressure_status", "neon_lfc_stats", "neon_lwlsn_cache_stats", "neon_perf_counters", "neon_relperst_cache_stats", "neon_relsize_cache_stats", "neon_stat_file_cache", "neon_wait_event_snapshot"].map((name) => `${name}: api.fields.${name}(), ${name}_array: api.arrayFields.${name}(),`).join("\n")}
} }), { namespace: "app" });`,
  );
  await writeFile(
    join(root, "kello/contracts/cpu.ts"),
    `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ describe: oc.output(v.strictObject({ sql: v.string(), params: v.array(v.unknown()), version: v.literal("1.25"), schema: v.string(), effectSame: v.literal(true) })) });`,
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
  const api = binding.neon;
  if (api.pgClusterSize !== api.sql.functions.pg_cluster_size) throw Error("Generated RPC alias differs");
  const query = context.db.select({ size: api.pgClusterSize() }).from(sql\`(values (1)) fixture(n)\`).toSQL();
  return { sql: query.sql, params: query.params, version: api.version, schema: api.schema, effectSame: true as const };
}) });`,
  );
  await writeFile(
    join(root, "kello/neon-types.ts"),
    `import { defineRelations, type SQL } from "drizzle-orm";
import { createProjectProcedures, defineSchema } from "kello/server";
import { Effect } from "effect";
import { extensions } from "./_generated/extensions";
import { Extensions, extensions as serverExtensions } from "./_generated/server";
const version: "1.25" = extensions.neon.version;
const schema: ${JSON.stringify(placement)} = extensions.neon.schema;
const cpus: SQL<bigint> = extensions.neon.pgClusterSize();
const canonical: SQL<bigint> = extensions.neon.sql.functions.pg_cluster_size();
type PrewarmInfo = { total_pages: number | null; prewarmed_pages: number | null; skipped_pages: number | null; active_workers: number | null };
const prewarm: SQL<PrewarmInfo | null> = extensions.neon.getPrewarmInfo();
const canonicalPrewarm: SQL<PrewarmInfo | null> = extensions.neon.sql.functions.get_prewarm_info();
void [version, schema, cpus, canonical, prewarm, canonicalPrewarm, Extensions, serverExtensions];
const projectSchema = defineSchema(() => ({}));
const { procedure } = createProjectProcedures(projectSchema, defineRelations(projectSchema.tables), extensions);
const handler = procedure.handler(async ({ context }) => {
  const query: SQL<bigint> = context.extensions.neon.pgClusterSize();
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  const effectQuery: SQL<bigint> = binding.neon.sql.functions.pg_cluster_size();
  void [query, effectQuery];
  return [];
});
void handler;
function compileOnly() {
// @ts-expect-error Exact native absence is whole-composite SQL NULL.
const nonnullPrewarm: SQL<PrewarmInfo> = extensions.neon.getPrewarmInfo();
// @ts-expect-error The canonical public alias preserves whole-composite SQL NULL.
const nonnullCanonicalPrewarm: SQL<PrewarmInfo> = extensions.neon.sql.functions.get_prewarm_info();
void [nonnullPrewarm, nonnullCanonicalPrewarm];
// @ts-expect-error No unselected extension appears in generated context.
extensions.neon_utils;
// @ts-expect-error No captured arguments exist.
extensions.neon.pgClusterSize(null);
// @ts-expect-error Unknown schema type is absent.
extensions.neon.fields.cpu;
}

void compileOnly;`,
  );
}

export async function writeNeonSelectionProject(root: string, selection: "empty" | "unsupported"): Promise<void> {
  await writeNeonProject(root);
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: ${selection === "empty" ? "{}" : '{ neon: { version: "0.0.0" } }'} } });`,
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
${selection === "empty" ? 'if (extensions !== undefined) throw Error("Empty context is not undefined");' : 'if (extensions.neon.version !== "0.0.0" || extensions.neon.apiSupport.status !== "unverified" || "pgClusterSize" in extensions.neon) throw Error("Unsupported descriptor invented API");'}
export default defineSchema(() => ({}), { namespace: "app" });`,
  );
  await writeFile(
    join(root, "kello/neon-types.ts"),
    `import { extensions } from "./_generated/extensions";
${selection === "empty" ? "const empty: undefined = extensions; void empty;" : 'const version: "0.0.0" = extensions.neon.version; void version;\n// @ts-expect-error unsupported version has descriptor only.\nextensions.neon.pgClusterSize();'}`,
  );
  await writeFile(
    join(root, "kello/contracts/cpu.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ describe: oc.output(v.strictObject({ selection: v.literal(${JSON.stringify(selection)}), effectSame: v.literal(true) })) });`,
  );
  await writeFile(
    join(root, "kello/functions/cpu.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
export default os.cpu.router({ describe: os.cpu.describe.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions || binding !== selected) throw Error("Generated RPC/Effect binding differs");
${selection === "empty" ? 'if (binding !== undefined) throw Error("Empty context acquired extension API");' : 'if (binding.neon.version !== "0.0.0" || "pgClusterSize" in binding.neon) throw Error("Unsupported context acquired extension API");'}
return { selection: ${JSON.stringify(selection)} as const, effectSame: true as const };
}) });`,
  );
}

/** Read actual generated files and import them from disk after the virtual first load. */
export async function checkNeonDiskBindings(root: string, placement: string): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('import { createNeon_1_25 } from "kello/extensions/neon";'));
  for (const forbidden of [
    'kello/extensions/neon-utils"',
    "kello/extensions/vector",
    "./schema",
    "./server",
    "kello.config",
  ])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  const rpcSource = await readFile(join(root, "kello/_generated/rpc.ts"), "utf8");
  assert(rpcSource.includes("createApplicationRpc"));
  assert(rpcSource.includes("extensions"));
  assert.equal(server.extensions, disk.extensions);
  const schema = await import(pathToFileURL(join(root, "kello/schema.ts")).href);
  assert.equal(schema.default.metadata.extensionRequirements.length, 20);
  const effect = await import("effect");
  const selected = effect.Effect.runSync(
    effect.Effect.provide(server.Extensions, effect.Context.make(server.Extensions, disk.extensions)),
  );
  assert.equal(selected, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["neon"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.neon;
  assert.deepEqual([api.name, api.version, api.schema], ["neon", "1.25", placement]);
  assert.deepEqual(api.apiSupport, {
    status: "verified",
    digest: "1f2d339beee9dcc3c93fdc0856fb9c307a04d5937a00ad7174014604be39a09e",
  });
  assert.equal(Object.keys(api.sql.functions).length, 20);
  assert.equal(Object.keys(api.codecs).length, 10);
  assert.equal(Object.keys(api.views).length, 9);
  assert.equal(api.pgClusterSize, api.sql.functions.pg_cluster_size);
}
