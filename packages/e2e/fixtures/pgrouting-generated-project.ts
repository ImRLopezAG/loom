import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type PgroutingProjectSelection = "empty" | "explicit-empty" | "future" | "selected" | "default" | "custom";

/** Consumer inputs only. First-load schema checks must execute through public tooling. */
export async function writePgroutingProject(root: string, selection: PgroutingProjectSelection): Promise<void> {
  const selected = selection === "selected" || selection === "default" || selection === "custom";
  const routingSchema = selection === "custom" ? 'route"日本' : selection === "selected" ? "routing" : "extensions";
  const spatialSchema = selection === "custom" ? 'spatial"日本' : selection === "selected" ? "spatial" : "extensions";
  const extensions = selected
    ? selection === "default"
      ? { pgrouting: { version: "3.8.0" }, postgis: { version: "3.6.4" } }
      : { pgrouting: { version: "3.8.0", schema: routingSchema }, postgis: { version: "3.6.4", schema: spatialSchema } }
    : selection === "future"
      ? { pgrouting: { version: "future" } }
      : {};
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { namespace: "pgrouting_fixture", ${selection === "empty" ? "" : `extensions: ${JSON.stringify(extensions)}`} } });\n`,
  );
  const check = selected
    ? `if (Object.keys(extensions).sort().join(",") !== "pgrouting,postgis") throw new Error("Wrong selected keys");
const api = extensions.pgrouting;
if (api.version !== "3.8.0" || api.schema !== ${JSON.stringify(routingSchema)} || extensions.postgis.schema !== ${JSON.stringify(spatialSchema)}) throw new Error("Wrong dependency schemas");
if (Object.keys(api.sql.overloads).length !== 223 || Object.keys(api.sql.rows).length !== 208) throw new Error("Incomplete captured public surface");
if ("pgr_createtopology" in api.sql.functions || "_pgr_alphashape" in api.sql.functions) throw new Error("Privileged/internal member leaked");
api.pgrVersion();
let rejected = false;
try { api.pgrAlphashape(null); } catch (error) { rejected = error instanceof Error && /verified native repair/.test(error.message); }
if (!rejected) throw new Error("Unsafe alpha-shape call reachable");`
    : selection === "future"
      ? `if (extensions.pgrouting.apiSupport.status !== "unverified" || "sql" in extensions.pgrouting) throw new Error("Future version must be descriptor-only");`
      : `const absent: undefined = extensions; if (absent !== undefined) throw new Error("Empty selection must be undefined");`;
  const schema = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
${check}
export default defineSchema((s) => ({ tasks: defineTable({ title: s.text().notNull() }) }), { namespace: "pgrouting_fixture" });\n`;
  await writeFile(join(root, "kello/schema.ts"), schema);
  await writeFile(
    join(root, "kello/selection-types.ts"),
    selected
      ? `import type { SQL } from "drizzle-orm";
import type { NestedQuery } from "kello/server";
import type { PgroutingCostEdges, PgroutingResult1 } from "kello/extensions/pgrouting";
import { extensions } from "./_generated/extensions";
const version: "3.8.0" = extensions.pgrouting.version;
const schema: ${JSON.stringify(routingSchema)} = extensions.pgrouting.schema;
declare const edges: NestedQuery<PgroutingCostEdges>;
const query: SQL<PgroutingResult1 | null> = extensions.pgrouting.sql.overloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"](edges, 1n, 3n);
function compileOnly() {
// @ts-expect-error no unselected companion family
extensions.postgis_sfcgal;
// @ts-expect-error administrative routines are absent from application bindings
extensions.pgrouting.sql.functions.pgr_createtopology;
// @ts-expect-error native internal support is private
extensions.pgrouting.sql.functions._pgr_alphashape;
// @ts-expect-error graph SQL cannot be unreviewed strings
extensions.pgrouting.sql.overloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]("SELECT * FROM edges", 1n, 3n);
// @ts-expect-error int8 requires bigint
extensions.pgrouting.sql.overloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"](edges, 1, 3n);
}
void [version, schema, query, compileOnly];\n`
      : selection === "future"
        ? `import { extensions } from "./_generated/extensions";
const version: "future" = extensions.pgrouting.version;
// @ts-expect-error unverified versions have no query helpers
extensions.pgrouting.pgrVersion;
void version;\n`
        : `import { extensions } from "./_generated/extensions"; const absent: undefined = extensions; void absent;\n`,
  );
  if (!selected) return;
  const child = join(root, "kello/components/routing");
  await mkdir(join(child, "contracts"), { recursive: true });
  await mkdir(join(child, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello/app.config.ts"),
    `import { defineApplication } from "kello/server";
import routing from "./components/routing/setup";
const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(routing); export default app;\n`,
  );
  await writeFile(
    join(child, "setup.ts"),
    `import { defineComponent } from "./_generated/setup";
export default defineComponent({ name: "routing", extensions: { pgrouting: { versions: ["3.8.0"] }, postgis: { versions: ["3.6.4"] } }, rpc: ({ os }) => ({ os }) });\n`,
  );
  await writeFile(
    join(child, "schema.ts"),
    schema.replace('namespace: "pgrouting_fixture"', 'namespace: "routing_fixture"'),
  );
  const output =
    "v.strictObject({ nativeVersion: v.string(), effectSame: v.literal(true), safetyRejected: v.literal(true) })";
  await writeFile(
    join(child, "contracts/status.ts"),
    `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${output}) });\n`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.strictObject({ host: ${output}, child: ${output} })) });\n`,
  );
  const handler = `const bindings = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (bindings !== context.extensions || bindings !== selected) throw new Error("RPC and Effect selection differ");
let rejected = false; try { bindings.pgrouting.pgrAlphashape(null); } catch (error) { rejected = error instanceof Error && /verified native repair/.test(error.message); }
if (!rejected) throw new Error("Unsafe alpha-shape reachable through RPC");
const [row] = await context.db.select({ nativeVersion: bindings.pgrouting.pgrVersion() }).from(sql.raw("(SELECT 1) AS fixture"));
if (!row?.nativeVersion) throw new Error("Missing native version");
return { nativeVersion: row.nativeVersion, effectSame: true as const, safetyRejected: true as const };`;
  const imports =
    'import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { extensions as selected } from "../_generated/extensions"; import { Effect } from "effect"; import { sql } from "drizzle-orm";\n';
  await writeFile(
    join(child, "functions/status.ts"),
    imports +
      `export default os.status.router({ run: os.status.run.handler(async ({ context }) => { ${handler} }) });\n`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    imports +
      `export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => { const host = await (async () => { ${handler} })(); return { host, child: await context.components.routing.rpc.status.run() }; }) });\n`,
  );
}

export function assertPgroutingGeneratedSource(source: string, selection: PgroutingProjectSelection): void {
  if (selection === "empty" || selection === "explicit-empty") {
    assert(!source.includes("createPgrouting"));
    return;
  }
  if (selection === "future") {
    assert(!source.includes("createPgrouting"));
    return;
  }
  assert.match(source, /from "kello\/extensions\/pgrouting"/);
  assert.match(source, /createPgrouting_3_8_0\(descriptors\["pgrouting"\], descriptors\["postgis"\]\)/);
  assert(!/kello\/tooling|postgis-sfcgal|postgis-raster|from ["']\.\/schema/.test(source));
}
