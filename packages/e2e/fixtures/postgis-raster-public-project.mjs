import assert from "node:assert/strict";
import { mkdir, readFile, symlink, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { initializeProject, loadProject, generateProject } from "kello/tooling";

export const RASTER_DIGEST = "8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2";
export const RASTER_UNSAFE_MEMBERS = [
  "routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)",
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
];
export function assertRasterNativeSafety(api) {
  const calls = [
    () => api.sql.functions.st_setgeotransform(null, 1, 1, 0, Math.PI / 2, 10, 20),
    () => api.sql.overloads[RASTER_UNSAFE_MEMBERS[1]](null, null),
    () =>
      api.sql.functions.st_approxquantile["($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"](
        null,
        true,
      ),
  ];
  for (const [index, call] of calls.entries()) {
    assert.throws(call, {
      name: "PostgisRasterNativeSafetyError",
      code: "POSTGIS_RASTER_NATIVE_REPAIR_REQUIRED",
      member: RASTER_UNSAFE_MEMBERS[index],
      disposition: "safety-rejected",
    });
  }
  assert.throws(() => api.sql.rows[RASTER_UNSAFE_MEMBERS[1]]("quantiles", null, null), {
    name: "PostgisRasterNativeSafetyError",
    member: RASTER_UNSAFE_MEMBERS[1],
  });
}
const hex =
  "0100000000000000000000f03f000000000000f0bf0000000000002440000000000000344000000000000000000000000000000000e610000002000300";
const output = `v.strictObject({width:v.number(),height:v.number(),srid:v.number(),pixel:v.number(),effectSame:v.literal(true),schema:v.string(),raster:v.strictObject({kind:v.literal("raster"),format:v.literal("wkb"),hex:v.string(),srid:v.number(),width:v.number(),height:v.number(),numBands:v.number(),scaleX:v.number(),scaleY:v.number(),ipX:v.number(),ipY:v.number()})})`;
const handler = `const selected=Effect.runSync(Effect.provide(Extensions,context["effect/context"]));
if(selected!==context.extensions) throw new Error("RPC and Effect differ");
const api=selected.postgis_raster;
const raster=api.sql.functions.st_addband["($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)"](api.raster.wkb(${JSON.stringify(hex)}),"8BUI",7,0);
const rows=await context.db.select({width:api.sql.functions.st_width(raster),height:api.sql.functions.st_height(raster),srid:api.sql.functions.st_srid(raster),pixel:api.sql.functions.st_value["($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"](raster,1,1),raster}).from(sql.raw("(VALUES(1)) fixture(id)"));
return v.parse(${output},{...rows[0]!,effectSame:true as const,schema:api.schema});`;

/** Public first-load and real disk generation; this file is copied into the supplied consumer. */
export async function generateRasterProjects(workspace, nodeModules, tsc) {
  const projects = [];
  for (const selection of ["omitted", "empty", "future", "selected", "custom"]) {
    const root = join(workspace, selection);
    await mkdir(root, { recursive: true });
    await initializeProject(root, "raster-" + selection);
    await unlink(join(root, "kello/functions/tasks.ts"));
    await unlink(join(root, "kello/contracts/tasks.ts"));
    await symlink(nodeModules, join(root, "node_modules"));
    const placement = selection === "custom" ? "raster_custom" : "extensions";
    const selected = ["selected", "custom"].includes(selection);
    const extensions =
      selection === "omitted"
        ? undefined
        : selection === "empty"
          ? {}
          : selection === "future"
            ? { postgis_raster: { version: "future" } }
            : {
                postgis: { version: "3.6.4", schema: placement },
                postgis_raster: { version: "3.6.4", schema: placement },
              };
    const database = { namespace: "raster_app" };
    if (extensions !== undefined) database.extensions = extensions;
    await writeFile(
      join(root, "kello.config.ts"),
      `import {defineConfig} from "kello/tooling";export default defineConfig(${JSON.stringify({ database })});`,
    );
    const schema = selected
      ? `import {defineSchema,defineTable} from "kello/server";import {extensions} from "./_generated/extensions";const api=extensions.postgis_raster;
if(api.apiSupport.digest!==${JSON.stringify(RASTER_DIGEST)}||api.schema!==${JSON.stringify(placement)})throw new Error("First-load selection mismatch");
export default defineSchema(()=>({tiles:defineTable({rast:api.raster.field({srid:4326,width:2,height:3,numBands:1})})}),{namespace:"raster_app"});`
      : `import {defineSchema,defineTable} from "kello/server";import {extensions} from "./_generated/extensions";
${selection === "future" ? `if(extensions.postgis_raster.apiSupport.status!=="unverified"||"raster" in extensions.postgis_raster)throw new Error("Future API invented");` : `const absent:undefined=extensions;if(absent!==undefined)throw new Error("Empty API");`}
export default defineSchema(s=>({tiles:defineTable({title:s.text()})}),{namespace:"raster_app"});`;
    await writeFile(join(root, "kello/schema.ts"), schema);
    if (selected) {
      const component = join(root, "kello/components/raster");
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(root, "kello/app.config.ts"),
        `import {defineApplication} from "kello/server";import raster from "./components/raster/setup";const app=defineApplication({rpc:({os})=>({os})});app.use(raster);export default app;`,
      );
      await writeFile(
        join(component, "setup.ts"),
        `import {defineComponent} from "./_generated/setup";export default defineComponent({name:"raster",extensions:{postgis:{versions:["3.6.4"]},postgis_raster:{versions:["3.6.4"]}},rpc:({os})=>({os})});`,
      );
      await writeFile(join(component, "schema.ts"), schema);
      await writeFile(
        join(component, "contracts/status.ts"),
        `import {defineContract,oc} from "../_generated/contract";import * as v from "valibot";export default defineContract({run:oc.output(${output})});`,
      );
      await writeFile(
        join(root, "kello/contracts/tasks.ts"),
        `import {defineContract,oc} from "kello/contract";import * as v from "valibot";export default defineContract({list:oc.output(v.strictObject({host:${output},child:${output}}))});`,
      );
      const imports = `import {os} from "../_generated/rpc";import {Extensions} from "../_generated/server";import {Effect} from "effect";import {sql} from "drizzle-orm";import * as v from "valibot";`;
      await writeFile(
        join(component, "functions/status.ts"),
        `${imports}export default os.status.router({run:os.status.run.handler(async({context})=>{${handler}})});`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `${imports}export default os.tasks.router({list:os.tasks.list.handler(async({context})=>{const host=await(async()=>{${handler}})();return {host,child:await context.components.raster.rpc.status.run()};})});`,
      );
      await writeFile(
        join(root, "kello/raster-types.ts"),
        `import {extensions} from "./_generated/extensions";import type {SQL} from "drizzle-orm";const api=extensions.postgis_raster;const version:"3.6.4"=api.version;const schema:${JSON.stringify(placement)}=api.schema;const width:SQL<number|null>=api.sql.functions.st_width(api.raster.wkb(${JSON.stringify(hex)}));function errors(){
// @ts-expect-error raster must be the captured value
api.sql.functions.st_width("text");
// @ts-expect-error tooling stays out of application APIs
api.sql.functions.addrasterconstraints;
// @ts-expect-error unselected extension remains absent
extensions.h3;}void [version,schema,width,errors];`,
      );
    }
    await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const first = await loadProject(root);
    if (selected)
      assert.deepEqual(Object.keys(first.componentScopes[0].boundExtensions).sort(), ["postgis", "postgis_raster"]);
    const generated = await generateProject(root);
    const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
    if (selection === "omitted" || selection === "empty") assert.equal(disk.extensions, undefined);
    else if (selection === "future") {
      assert.equal(disk.extensions.postgis_raster.version, "future");
      assert.equal("raster" in disk.extensions.postgis_raster, false);
    } else {
      assert.deepEqual(Object.keys(disk.extensions).sort(), ["postgis", "postgis_raster"]);
      assert.equal(disk.extensions.postgis_raster.apiSupport.digest, RASTER_DIGEST);
      assert.equal(Object.keys(disk.extensions.postgis_raster.sql.overloads).length, 397);
      assertRasterNativeSafety(disk.extensions.postgis_raster);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      assert.equal(server.extensions, disk.extensions);
      const child = await import(pathToFileURL(join(root, "kello/components/raster/_generated/extensions.ts")).href);
      assert.equal(child.extensions.postgis_raster.schema, placement);
      assertRasterNativeSafety(child.extensions.postgis_raster);
      const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
      assert(source.includes('from "kello/extensions/postgis-raster"'));
      assert(!source.includes("kello/tooling"));
    }
    const checked = spawnSync(tsc[0], [...tsc.slice(1), "-p", join(root, "tsconfig.json")], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(checked.status, 0, checked.stdout + checked.stderr);
    assert.equal((await generateProject(root)).version, generated.version);
    projects.push({
      root,
      selection,
      placement: selected ? placement : undefined,
      version: generated.version,
      nativeSafetyMembers: selected ? RASTER_UNSAFE_MEMBERS : [],
    });
  }
  return projects;
}
