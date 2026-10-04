import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import * as v from "valibot";
import type { AnyRelations } from "drizzle-orm";
import type { RpcRuntimeOptions } from "kello/server";

export type PgCronSelection = "selected" | "empty" | "unsupported";
export const pgCronRpcResultValidator = v.strictObject({
  mode: v.picklist(["selected", "empty", "unsupported"]),
  ids: v.array(v.string()),
  active: v.array(v.boolean()),
  effectSame: v.literal(true),
});
export type PgCronRpcResult = v.InferOutput<typeof pgCronRpcResultValidator>;
export const pgCronGeneratedDigest = "a5b37c25b617856dbc5afb7a7e1d409e362baf9a809ae384920cbe5b18acff4c";

/** Only public package imports appear in the project, including first-load virtual extensions. */
export async function writePgCronProject(root: string, mode: PgCronSelection, namespace: string) {
  const extensions =
    mode === "empty" ? {} : { pg_cron: { version: mode === "selected" ? "1.6" : "0.0.0", schema: "pg_catalog" } };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig({project:${JSON.stringify(namespace)},database:{namespace:${JSON.stringify(namespace)},metadataNamespace:${JSON.stringify("loom_" + namespace)},extensions:${JSON.stringify(extensions)}}});`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; export default defineApplication({rpc:({os})=>({os})});',
  );
  const checks =
    mode === "selected"
      ? `if(extensions.pg_cron.version!=="1.6" || extensions.pg_cron.schema!=="pg_catalog" || extensions.pg_cron.apiSupport.digest!=="${pgCronGeneratedDigest}" || typeof extensions.pg_cron.jobRows!=="function") throw new Error("Wrong first-load selection");`
      : mode === "empty"
        ? `if(extensions!==undefined) throw new Error("Empty selection leaked");`
        : `if(extensions.pg_cron.apiSupport.status!=="unverified" || "jobRows" in extensions.pg_cron) throw new Error("Unsupported selection leaked API");`;
  await writeFile(
    join(root, "kello/schema.ts"),
    `import {defineSchema,defineTable} from "kello/server";
import {extensions} from "./_generated/extensions";
${checks}
export default defineSchema(s=>({tasks:defineTable({title:s.text().notNull()},{publicFields:["_id","title"]})}),{namespace:${JSON.stringify(namespace)}});`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import {defineContract,oc} from "kello/contract";
import * as v from "valibot";
export default defineContract({list:oc.output(v.strictObject({mode:v.string(),ids:v.array(v.string()),active:v.array(v.boolean()),effectSame:v.literal(true)}))});`,
  );
  const query =
    mode === "selected"
      ? `const table=binding.pg_cron.jobRows("j");
const rows=await context.db.select({id:table.columns.jobid,active:table.columns.active}).from(table.from);
rows.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
return {mode:"selected",ids:rows.map(r=>r.id.toString()),active:rows.map(r=>r.active),effectSame:true as const};`
      : `return {mode:${JSON.stringify(mode)},ids:[],active:[],effectSame:true as const};`;
  const typeChecks =
    mode === "selected"
      ? `// @ts-expect-error Application binding has no operator scheduling.
selected.pg_cron.schedule("1 second","SELECT 1");
// @ts-expect-error Canonical application SQL has no mutation functions.
selected.pg_cron.sql.functions.schedule("1 second","SELECT 1");`
      : mode === "empty"
        ? `// @ts-expect-error No family was selected.
selected.pg_cron;`
        : `// @ts-expect-error Unsupported exact version has descriptor metadata only.
selected.pg_cron.jobRows("j");`;
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import {os} from "../_generated/rpc";
import {Extensions} from "../_generated/server";
import {extensions as selected} from "../_generated/extensions";
import {Effect} from "effect";
export default os.tasks.router({list:os.tasks.list.handler(async ({context})=>{
const binding=Effect.runSync(Effect.provide(Extensions,context["effect/context"]));
if(binding!==context.extensions || binding!==selected) throw new Error("Selected RPC/Effect context differs");
${query}
})});
function compileOnly(){
${typeChecks}
// @ts-expect-error Unselected families remain absent.
selected.vector;
}
void compileOnly;`,
  );
}

export async function checkPgCronDiskBindings(root: string, mode: PgCronSelection) {
  const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
  const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  assert(Object.isFrozen(disk.extensions));
  if (mode === "empty") assert.equal(disk.extensions, undefined);
  else assert.deepEqual(Object.keys(disk.extensions), ["pg_cron"]);
  if (mode === "selected") {
    assert(source.includes('from "kello/extensions/pg-cron"'));
    assert(source.includes(pgCronGeneratedDigest));
    assert.equal(disk.extensions.pg_cron.apiSupport.digest, pgCronGeneratedDigest);
    assert("jobRows" in disk.extensions.pg_cron);
    assert.deepEqual(Object.keys(disk.extensions.pg_cron.sql.functions), []);
  } else {
    assert(!source.includes("createPgCron_1_6"));
    if (mode === "unsupported") {
      assert.equal(disk.extensions.pg_cron.apiSupport.status, "unverified");
      assert(!("jobRows" in disk.extensions.pg_cron));
    }
  }
  for (const forbidden of [
    "kello/tooling/extensions/pg-cron",
    "kello/extensions/vector",
    "./schema",
    "./server",
    "kello.config",
  ])
    assert(!source.includes(forbidden), forbidden);
  return disk.extensions;
}

/** Native RPC execution uses an ordinary UUID runtime role, never the operator connection. */
export async function exercisePgCronRpc(
  runtimeOptions: () => Omit<RpcRuntimeOptions<AnyRelations>, "connectionString" | "deployment" | "assertActive">,
  url: string,
  mode: PgCronSelection,
  coldConsumer?: (ordinaryUrl: string) => Promise<PgCronRpcResult>,
): Promise<PgCronRpcResult> {
  const { bootstrapDatabase } = await import("kello/tooling");
  const { createRpcRuntime, defineRpcAuth, Invocation } = await import("kello/server");
  const { call, getRouter, Procedure } = await import("@orpc/server");
  const { Context } = await import("effect");
  const options = runtimeOptions();
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const role = "cron_rpc_" + crypto.randomUUID().replaceAll("-", "");
  let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
  let id: string | undefined;
  try {
    const journal = process.env.LOOM_PG_CRON_RESOURCE_JOURNAL;
    if (journal)
      appendFileSync(journal, JSON.stringify({ role, schema: options.metadataNamespace }) + "\n");
    await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole: role });
    await client.query(
      `ALTER ROLE ${pg.escapeIdentifier(role)} LOGIN; GRANT USAGE ON SCHEMA cron TO ${pg.escapeIdentifier(role)}`,
    );
    // The exact native job identity belongs to this UUID role; active=false prevents background mutation.
    if (mode === "selected")
      id = (
        await client.query(
          "SELECT cron.schedule_in_database($1,'0 0 1 1 *','SELECT 1','postgres',$2,false)::text AS id",
          [role, role],
        )
      ).rows[0].id;
    const restricted = new URL(url);
    restricted.username = role;
    let actual: PgCronRpcResult;
    if (coldConsumer) actual = await coldConsumer(restricted.href);
    else {
      runtime = await createRpcRuntime({
        ...options,
        connectionString: restricted.href,
        deployment: "pg-cron-generated-" + mode,
        auth: defineRpcAuth({ authorize: async () => {} }),
        assertActive: async (signal) => signal.throwIfAborted(),
      });
      const route = getRouter(runtime.router, ["tasks", "list"]);
      assert(route instanceof Procedure);
      const invocation = { requestId: "pg-cron-" + mode, identity: null, signal: new AbortController().signal };
      actual = v.parse(
        pgCronRpcResultValidator,
        await call(route, undefined, {
          context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
          path: ["tasks", "list"],
        }),
      );
    }
    assert.deepEqual(actual, { mode, ids: id ? [id] : [], active: id ? [false] : [], effectSame: true });
    const native = await client.query(
      "SELECT jobid::text AS id,active FROM cron.job WHERE username=$1 ORDER BY jobid",
      [role],
    );
    assert.deepEqual(native.rows, id ? [{ id, active: false }] : []);
    return actual;
  } finally {
    try {
      await runtime?.stop();
    } finally {
      try {
        if (id) {
          await client.query("SELECT cron.unschedule($1::int8)", [id]);
          await client.query("DELETE FROM cron.job_run_details WHERE jobid=$1::int8", [id]);
        }
        const exists = (await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount;
        if (exists)
          await client.query(`DROP OWNED BY ${pg.escapeIdentifier(role)}; DROP ROLE ${pg.escapeIdentifier(role)}`);
        await client.query(`DROP SCHEMA IF EXISTS ${pg.escapeIdentifier(options.metadataNamespace)} CASCADE`);
      } finally {
        await client.end();
      }
    }
  }
}
