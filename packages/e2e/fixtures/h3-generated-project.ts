import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const H3_PUBLIC_DIGEST = "0402a89cff2876378a25b680936da0841125dc5d194c2dad6f006092914ffbaf";
export const H3_CUSTOM_SCHEMA = 'custom"h3';
export const H3_FUNCTION_COUNT = 68;
export const H3_OVERLOAD_COUNT = 87;
export const H3_INDEX_CELL = "8928308280fffff";
export const H3_EDGE = "11928308280fffff";
export const H3_PARENT = "85283083fffffff";
export const H3_POINT = { lng: -122.4089866999972, lat: 37.81331899998324 } as const;
export const H3_CENTER = { lng: -122.41845932318309, lat: 37.776702349435695 } as const;
export const H3_EDGE_BOUNDARY = [
  { lng: -122.41971895414808, lat: 37.77820687262237 },
  { lng: -122.42079024541879, lat: 37.776524206993216 },
] as const;
export const H3_INT8 = 617700169958293503n;

export type H3GenerationSelection = "empty" | "future" | "selected" | "custom";

/** The caller supplies public package tooling; this fixture never imports a source adapter or emitter. */
export async function writeH3SelectedProject(root: string, schema?: string): Promise<string> {
  const placement = schema ?? "extensions";
  const namespace = `h3_gen_${randomUUID().replaceAll("-", "")}`;
  const component = join(root, "kello/components/geo");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  const selected = schema ? { version: "4.2.3", schema } : { version: "4.2.3" };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { namespace: ${JSON.stringify(namespace)}, extensions: { h3: ${JSON.stringify(selected)} } } });
`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import geo from "./components/geo/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(geo); export default app;\n',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "geo", extensions: { h3: { versions: ["4.2.3"] } }, rpc: ({ os }) => ({ os }) });\n',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.h3;
if (Object.keys(extensions).join(",") !== "h3") throw new Error("Incorrect virtual h3 selection");
if (api.version !== "4.2.3" || api.schema !== ${JSON.stringify(placement)} || api.apiSupport.digest !== ${JSON.stringify(H3_PUBLIC_DIGEST)})
  throw new Error("Incorrect first-load h3 identity");
if (typeof api.latLngToCell !== "function" || Object.keys(api.sql.overloads).length !== ${H3_OVERLOAD_COUNT})
  throw new Error("Incomplete first-load h3 surface");
api.field();
api.arrayField();
export default defineSchema((s) => ({
  places: defineTable({ name: s.text().notNull(), cell: api.field(), ring: api.arrayField() }, {
    indexes: [
      { fields: ["cell"], extension: api.indexes.btree() },
      { fields: ["cell"], extension: api.indexes.spgist() },
    ],
  }),
}), { namespace: ${JSON.stringify(namespace)} });
`,
  );
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "h3" || extensions.h3.schema !== ${JSON.stringify(placement)})
  throw new Error("Wrong mounted virtual h3 selection");
extensions.h3.getRes0Cells();
export default defineSchema(() => ({}));
`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(v.literal("4.2.3")) });\n',
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.strictObject({
  version: v.literal("4.2.3"),
  placement: v.literal(${JSON.stringify(placement)}),
  child: v.literal("4.2.3"),
  effectSame: v.literal(true),
  cell: v.literal(${JSON.stringify(H3_INDEX_CELL)}),
  center: v.strictObject({ lng: v.number(), lat: v.number() }),
  edge: v.array(v.strictObject({ lng: v.number(), lat: v.number() })),
  parent: v.literal(${JSON.stringify(H3_PARENT)}),
  contains: v.literal(true),
  area: v.number(),
  int8: v.bigint(),
  unsigned: v.literal(true),
  nullParent: v.null(),
})) });
`,
  );
  const handler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Generated RPC and Effect bindings differ");
const api = binding.h3;
const version: "4.2.3" = api.version;
const placement: ${JSON.stringify(placement)} = context.extensions.h3.schema;
const cell = h3Index(${JSON.stringify(H3_INDEX_CELL)});
const [row] = await context.db.select({
  cell: api.latLngToCell({ lng: ${H3_POINT.lng}, lat: ${H3_POINT.lat} }, 9),
  center: api.cellToLatLng(cell),
  edge: api.directedEdgeToBoundary(h3Index(${JSON.stringify(H3_EDGE)})),
  parent: api.cellToParent(cell, 5),
  contains: api.contains(${JSON.stringify(H3_PARENT)}, cell),
  area: api.cellArea(cell, "m^2"),
  int8: api.sql.casts.h3index_to_int8(cell),
  unsigned: api.lessThan(cell, h3Index("ffffffffffffffff")),
  nullParent: api.cellToParent(null),
}).from(sql.raw("(values (1)) fixture(id)"));
if (!row || row.cell !== cell || row.parent !== ${JSON.stringify(H3_PARENT)} || row.contains !== true || row.unsigned !== true || row.nullParent !== null)
  throw new Error("Generated RPC did not execute native h3");`;
  await writeFile(
    join(component, "functions/status.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
import { h3Index } from "kello/extensions/h3";
export default os.status.router({ run: os.status.run.handler(async ({ context }) => {
${handler}
// @ts-expect-error Unselected families remain absent in the mounted facade.
void context.extensions.h3_postgis;
return version; }) });
`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
import { h3Index } from "kello/extensions/h3";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${handler}
if (binding !== selected) throw new Error("Host selected binding differs from RPC/Effect");
return { version, placement, child: await context.components.geo.rpc.status.run(), effectSame: true as const, ...row }; }) });
`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { type SQL } from "drizzle-orm";
import { h3Index, type H3Index, type H3LatLng, type H3Polygon } from "kello/extensions/h3";
import { extensions } from "./_generated/extensions";
const api = extensions.h3;
const version: "4.2.3" = api.version;
const placement: ${JSON.stringify(placement)} = api.schema;
const cell = h3Index(${JSON.stringify(H3_INDEX_CELL)});
const indexed: SQL<H3Index | null> = api.latLngToCell({ lng: ${H3_POINT.lng}, lat: ${H3_POINT.lat} }, 9);
const center: SQL<H3LatLng | null> = api.cellToLatLng(cell);
const edge: SQL<H3Polygon | null> = api.directedEdgeToBoundary(h3Index(${JSON.stringify(H3_EDGE)}));
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.h3_postgis;
// @ts-expect-error cell area uses squared units.
api.cellArea(cell, "km");
// @ts-expect-error Unbranded text is not a checked h3index.
const unbranded: H3Index = ${JSON.stringify(H3_INDEX_CELL)};
void unbranded;
}
void [version, placement, indexed, center, edge, compileOnly];
`,
  );
  return placement;
}

export async function writeH3FutureProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { h3: { version: "future" } } } });\n',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
if (extensions.h3.apiSupport.status !== "unverified") throw new Error("Future h3 must stay unverified");
if ("latLngToCell" in extensions.h3 || "sql" in extensions.h3) throw new Error("Unverified h3 must not invent a query API");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });
`,
  );
}

export async function writeH3EmptyProject(root: string): Promise<void> {
  await writeFile(join(root, "kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig({});\n');
}

/** Inspect and import the files written by generateProject. Source emitters do not qualify. */
export async function checkH3DiskBindings(root: string, placement: string): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('import { createH3_4_2_3 } from "kello/extensions/h3";'));
  assert(source.includes(H3_PUBLIC_DIGEST));
  for (const forbidden of [
    "kello/tooling",
    "kello/extensions/h3-postgis",
    "./schema",
    "./server",
    "kello.config",
    "extensionBindingsSource",
  ])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  const rpc = await readFile(join(root, "kello/_generated/rpc.ts"), "utf8");
  assert(rpc.includes("createApplicationRpc") && rpc.includes("extensions"));
  assert.deepEqual(Object.keys(disk.extensions), ["h3"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.h3;
  assert.deepEqual([api.name, api.version, api.schema], ["h3", "4.2.3", placement]);
  assert.deepEqual(api.apiSupport, { status: "verified", digest: H3_PUBLIC_DIGEST });
  assert.equal(Object.keys(api.sql.functions).length, H3_FUNCTION_COUNT);
  assert.equal(Object.keys(api.sql.overloads).length, H3_OVERLOAD_COUNT);
  assert.equal(api.field().metadata.extension?.type, "h3index");
  assert.equal(api.arrayField().metadata.extension?.array, true);
  assert.equal(api.indexes.btree().method, "btree");
  assert.equal(api.indexes.spgist().method, "spgist");
}
