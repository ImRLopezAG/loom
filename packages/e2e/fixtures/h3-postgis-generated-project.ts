import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { H3_POSTGIS_DIGEST, H3_POSTGIS_DEFAULT_PLACEMENT, type H3PostgisPlacement } from "./h3-postgis-owned-pg.ts";

export type H3PostgisGenerationSelection = "absent" | "empty" | "future" | "selected" | "custom";
export const H3_POSTGIS_KEYS = ["h3", "h3_postgis", "postgis", "postgis_raster"];
export const H3_POSTGIS_COMPANIONS = {
  h3: { version: "4.2.3", digest: "0402a89cff2876378a25b680936da0841125dc5d194c2dad6f006092914ffbaf" },
  postgis: { version: "3.6.4", digest: "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29" },
  postgis_raster: { version: "3.6.4", digest: "8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2" },
} as const;

/** Exercises actual first-load and disk generation. No source adapter or emitter is imported by the project. */
export async function writeH3PostgisProject(
  root: string,
  selection: H3PostgisGenerationSelection,
  placement: H3PostgisPlacement = H3_POSTGIS_DEFAULT_PLACEMENT,
) {
  const namespace = `h3pg_${randomUUID().replaceAll("-", "")}`;
  const selected =
    selection === "custom"
      ? {
          h3: { version: "4.2.3", schema: placement.h3 },
          postgis: { version: "3.6.4", schema: placement.postgis },
          postgis_raster: { version: "3.6.4", schema: placement.postgis_raster },
          h3_postgis: { version: "4.2.3", schema: placement.h3_postgis },
        }
      : {
          h3: { version: "4.2.3" },
          postgis: { version: "3.6.4" },
          postgis_raster: { version: "3.6.4" },
          h3_postgis: { version: "4.2.3" },
        };
  const config =
    selection === "absent"
      ? {}
      : {
          database: {
            namespace,
            extensions:
              selection === "empty" ? {} : selection === "future" ? { h3_postgis: { version: "future" } } : selected,
          },
        };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${JSON.stringify(config)});\n`,
  );
  if (selection === "absent" || selection === "empty") {
    if (selection === "empty")
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema,defineTable } from "kello/server"; export default defineSchema(s=>({tasks:defineTable({title:s.text().notNull()},{publicFields:["_id","title"]})}),{namespace:${JSON.stringify(namespace)}});\n`,
      );
    await writeFile(
      join(root, "kello/selection-types.ts"),
      'import { extensions } from "./_generated/extensions"; const value: undefined = extensions; void value;\n',
    );
    return;
  }
  if (selection === "future") {
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema,defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
if (extensions.h3_postgis.apiSupport.status !== "unverified" || "sql" in extensions.h3_postgis || "latLngToCell" in extensions.h3_postgis) throw new Error("Future h3_postgis invented an API");
export default defineSchema(s=>({tasks:defineTable({title:s.text().notNull()},{publicFields:["_id","title"]})}),{namespace:${JSON.stringify(namespace)}});\n`,
    );
    await writeFile(
      join(root, "kello/selection-types.ts"),
      `import { extensions } from "./_generated/extensions";
function compileOnly() { // @ts-expect-error Future descriptors do not expose reviewed routines.
extensions.h3_postgis.latLngToCell(null,9); } void compileOnly;\n`,
    );
    return;
  }
  const component = join(root, "kello/components/geo");
  for (const directory of ["contracts", "functions"]) await mkdir(join(component, directory), { recursive: true });
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import geo from "./components/geo/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(geo); export default app;\n',
  );
  const requirements = {
    h3: { versions: ["4.2.3"] },
    h3_postgis: { versions: ["4.2.3"] },
    postgis: { versions: ["3.6.4"] },
    postgis_raster: { versions: ["3.6.4"] },
  };
  await writeFile(
    join(component, "setup.ts"),
    `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name:"geo",extensions:${JSON.stringify(requirements)},rpc:({os})=>({os}) });\n`,
  );
  const identity = `const api = extensions.h3_postgis;
if (Object.keys(extensions).sort().join(",") !== ${JSON.stringify(H3_POSTGIS_KEYS.join(","))}) throw new Error("Wrong configured membership");
if (api.schema !== ${JSON.stringify(placement.h3_postgis)} || api.apiSupport.digest !== ${JSON.stringify(H3_POSTGIS_DIGEST)} || Object.keys(api.sql.overloads).length !== 56) throw new Error("Wrong first-load contract");
api.field();api.statsField();api.arrayField();api.statsArrayField();`;
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema,defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
${identity}
export default defineSchema(()=>({summaries:defineTable({item:api.field(),stats:api.statsField(),items:api.arrayField(),statistics:api.statsArrayField()})}),{namespace:${JSON.stringify(namespace)}});\n`,
  );
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
${identity}
export default defineSchema(()=>({}));\n`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract,oc } from "kello/contract"; import * as v from "valibot";
export default defineContract({list:oc.output(v.strictObject({version:v.literal("4.2.3"),placement:v.literal(${JSON.stringify(placement.h3_postgis)}),child:v.literal("4.2.3"),effectSame:v.literal(true),cell:v.string(),srid:v.literal(4326),nullBoundary:v.null()}))});\n`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    'import { defineContract,oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({run:oc.output(v.literal("4.2.3"))});\n',
  );
  const handler = `const binding=Effect.runSync(Effect.provide(Extensions,context["effect/context"]));
if(binding!==context.extensions)throw new Error("RPC/Effect identity differs");
const api=binding.h3_postgis;
const version:"4.2.3"=api.version;
const placement:${JSON.stringify(placement.h3_postgis)}=api.schema;
const [row]=await context.db.select({cell:api.latLngToCell(geographyEwkt("SRID=4326;POINT(-122.4089866999972 37.81331899998324)"),9),boundary:api.cellToBoundaryGeometry(h3Index("8928308280fffff")),nullBoundary:api.cellToBoundaryGeometry(null)}).from(sql.raw("(values (1)) witness(id)"));
if(!row || row.cell!=="89283080dcbffff" || row.boundary?.srid!==4326 || row.nullBoundary!==null)throw new Error("Native RPC decode differs");`;
  const imports = `import { Effect } from "effect"; import { sql } from "drizzle-orm"; import { h3Index } from "kello/extensions/h3-postgis"; import { geographyEwkt } from "kello/extensions/postgis"; import { Extensions } from "../_generated/server"; import { os } from "../_generated/rpc";`;
  await writeFile(
    join(component, "functions/status.ts"),
    `${imports}
export default os.status.router({run:os.status.run.handler(async({context})=>{${handler}
return version;})});\n`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `${imports}
import { extensions as selected } from "../_generated/extensions";
export default os.tasks.router({list:os.tasks.list.handler(async({context})=>{${handler}
if(binding!==selected)throw new Error("Disk/RPC identity differs");
return {version,placement,child:await context.components.geo.rpc.status.run(),effectSame:true as const,cell:row.cell,srid:4326 as const,nullBoundary:row.nullBoundary};})});\n`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { type SQL } from "drizzle-orm"; import { createH3Postgis_4_2_3,h3Index,type H3Index,type Geometry } from "kello/extensions/h3-postgis"; import { geographyEwkt } from "kello/extensions/postgis"; import { extensions } from "./_generated/extensions";
const api=extensions.h3_postgis; const placement:${JSON.stringify(placement.h3_postgis)}=api.schema;
const cell:SQL<H3Index|null>=api.latLngToCell(geographyEwkt("SRID=4326;POINT(-122.4 37.8)"),9);
const boundary:SQL<Geometry|null>=api.cellToBoundaryGeometry(h3Index("8928308280fffff"),true);
function compileOnly(){
// @ts-expect-error Unselected family remains absent.
void extensions.vector;
// @ts-expect-error Credentials and maintenance are absent from the query adapter.
void api.maintenance;
// @ts-expect-error Native companion descriptors are mandatory.
createH3Postgis_4_2_3(api);
// @ts-expect-error h3_postgis requires PostGIS values, not a plain coordinate object.
api.latLngToCell({lng:1,lat:2},9);
// @ts-expect-error Captured containment names only.
api.polygonToCellsExperimental(null,9,"bbox");
} void [placement,cell,boundary,compileOnly];\n`,
  );
}

export async function checkH3PostgisDisk(
  root: string,
  selection: H3PostgisGenerationSelection,
  placement: H3PostgisPlacement,
) {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  const disk = await import(pathToFileURL(file).href);
  if (selection === "absent" || selection === "empty") {
    assert.equal(disk.extensions, undefined);
    return;
  }
  if (selection === "future") {
    assert.deepEqual(Object.keys(disk.extensions), ["h3_postgis"]);
    assert.equal(disk.extensions.h3_postgis.apiSupport.status, "unverified");
    assert.equal("sql" in disk.extensions.h3_postgis, false);
    return;
  }
  assert(source.includes('import { createH3Postgis_4_2_3 } from "kello/extensions/h3-postgis";'));
  assert(source.includes(H3_POSTGIS_DIGEST));
  for (const forbidden of ["kello/tooling", "./schema", "./server", "kello.config", "extensionBindingsSource"])
    assert(!source.includes(forbidden), forbidden);
  assert.deepEqual(Object.keys(disk.extensions).sort(), H3_POSTGIS_KEYS);
  assert.equal(disk.extensions.h3_postgis.schema, placement.h3_postgis);
  assert.equal(Object.keys(disk.extensions.h3_postgis.sql.overloads).length, 56);
  for (const [name, companion] of Object.entries(H3_POSTGIS_COMPANIONS))
    assert.deepEqual(disk.extensions[name].apiSupport, { status: "verified", digest: companion.digest });
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  const child = await import(pathToFileURL(join(root, "kello/components/geo/_generated/extensions.ts")).href);
  assert.deepEqual(Object.keys(child.extensions).sort(), H3_POSTGIS_KEYS);
  assert.equal(child.extensions.h3_postgis.schema, placement.h3_postgis);
}
