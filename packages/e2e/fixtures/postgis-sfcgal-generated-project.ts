// Public-tooling postgis_sfcgal 3.6.4 project fixture. Callers supply public `kello` (workspace link or packed
// install); this module never imports a source adapter. The witness module is copied into each project.
import assert from "node:assert/strict";
import { copyFile, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as v from "valibot";

export const POSTGIS_SFCGAL_DIGEST = "a9f128c0489a24e8fa4bb0b35000570c2f8b1e6db26609863b9e4a24a1518c76";
export const POSTGIS_DIGEST = "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29";
/** custom: awkward distinct schemas; default: schema omitted ("extensions"); future: unreviewed 3.7.0 descriptor. */
export type PostgisSfcgalMode = "custom" | "default" | "empty" | "future";
export const postgisSfcgalModes = ["custom", "default", "empty", "future"] as const;
export const postgisSfcgalSchemas = {
  custom: { postgis: "postgis 地", postgis_sfcgal: 'sfcgal"q' },
  default: { postgis: "extensions", postgis_sfcgal: "extensions" },
} as const;
/** The compiled RPC's output, parsed at the process boundary. */
export const postgisSfcgalRpcResultValidator = v.strictObject({
  effectSame: v.literal(true),
  schema: v.string(),
  version: v.literal("3.6.4"),
  results: v.record(v.string(), v.strictObject({ kind: v.picklist(["geometry", "number", "boolean", "text"]), text: v.nullable(v.string()) })),
});

function selection(mode: PostgisSfcgalMode) {
  if (mode === "empty") return {};
  if (mode === "default") return { postgis: { version: "3.6.4" }, postgis_sfcgal: { version: "3.6.4" } };
  if (mode === "future")
    return { postgis: { version: "3.6.4", schema: "postgis 地" }, postgis_sfcgal: { version: "3.7.0", schema: 'sfcgal"q' } };
  return {
    postgis: { version: "3.6.4", schema: postgisSfcgalSchemas.custom.postgis },
    postgis_sfcgal: { version: "3.6.4", schema: postgisSfcgalSchemas.custom.postgis_sfcgal },
  };
}

const typesSource: Record<PostgisSfcgalMode, string> = {
  custom: `import type { SQL } from "drizzle-orm";
import { extensions, selection } from "./_generated/extensions";
import type { Geometry } from "kello/extensions/postgis-sfcgal";
const api = extensions.postgis_sfcgal;
const version: "3.6.4" = api.version;
const schema: 'sfcgal"q' = api.schema;
const dependency: "postgis 地" = selection.postgis.schema;
declare const solid: Geometry;
const volume: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.cgVolume(solid);
const extruded: SQL<Geometry | null> = api.cgExtrude(solid, 0, 0, 1);
const holes: SQL<Geometry | null> = api.cgAlphashape(solid, undefined, true);
const aggregate: SQL<Geometry | null> = api.cgUnion(solid);
const orientation: SQL<number | null> = api.cgOrientation(solid);
const planar: SQL<boolean | null> = api.cgIsplanar(solid);
const library: SQL<string | null> = api.postgisSfcgalVersion();
void [version, schema, dependency, volume, extruded, holes, aggregate, orientation, planar, library];
function compileOnly() {
  // @ts-expect-error Geometry inputs are PostGIS EWKB/EWKT values, never strings.
  api.cgVolume("POINT(0 0)");
  // @ts-expect-error cg_extrude has no defaults; every offset is required.
  api.cgExtrude(solid, 0, 0);
  // @ts-expect-error cg_3dbuffer buffer_type has no default.
  api.cg3dbuffer(solid, 1, 8);
  // @ts-expect-error Results are nullable native values.
  const strict: SQL<number> = api.cgVolume(solid);
  // @ts-expect-error The adapter exposes no hand-written geometry algorithm.
  api.volume;
  void strict;
}
void compileOnly;
`,
  default: `import { extensions } from "./_generated/extensions";
const schema: "extensions" = extensions.postgis_sfcgal.schema;
const dependency: "extensions" = extensions.postgis.schema;
const version: "3.6.4" = extensions.postgis_sfcgal.version;
void [schema, dependency, version];
`,
  empty: `import { extensions } from "./_generated/extensions";
const none: undefined = extensions;
void none;
`,
  future: `import { extensions } from "./_generated/extensions";
const version: "3.7.0" = extensions.postgis_sfcgal.version;
void version;
function compileOnly() {
  // @ts-expect-error An unreviewed future version is a descriptor only; no typed routines are generated.
  extensions.postgis_sfcgal.cgVolume;
}
void compileOnly;
`,
};

const contractSource = `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ native: oc.output(v.strictObject({
  effectSame: v.literal(true),
  schema: v.string(),
  version: v.literal("3.6.4"),
  results: v.record(v.string(), v.strictObject({ kind: v.picklist(["geometry", "number", "boolean", "text"]), text: v.nullable(v.string()) })),
})) });`;

// Every witness runs through the generated binding inside the compiled RPC transaction; geometry results are decoded by
// the public EWKB codec and re-read as native EWKT for comparison with the raw SQL oracle.
const functionSource = `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql, type SQL } from "drizzle-orm";
import { postgisSfcgalApiWitnesses, postgisSfcgalWitnessGeometries } from "../sfcgal-witnesses";
export default os.spatial.router({ native: os.spatial.native.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== context.extensions || binding !== selected) throw new Error("RPC/Effect extension identity differs");
  const api = binding.postgis_sfcgal, postgis = binding.postgis, o = postgis.sql.overloads;
  const fromText = (text: string) => o["routine:$extension:postgis.st_geomfromewkt(pg_catalog.text)"](text);
  const witnesses = postgisSfcgalApiWitnesses(api, {
    geometry: postgis.geometry.ewkt,
    npoints: (value) => o["routine:$extension:postgis.st_npoints($extension:postgis.geometry)"](value),
    geometrytype: (value) => o["routine:$extension:postgis.st_geometrytype($extension:postgis.geometry)"](value),
  });
  const results: Record<string, { kind: "geometry" | "number" | "boolean" | "text"; text: string | null }> = {};
  for (const [key, { expr, from }] of Object.entries(witnesses)) {
    const source: SQL = from
      ? sql\`(VALUES (\${fromText(postgisSfcgalWitnessGeometries[from[0]])}), (\${fromText(postgisSfcgalWitnessGeometries[from[1]])})) v(g)\`
      : sql\`(VALUES (1)) fixture(id)\`;
    const [row] = await context.db.select({ value: expr }).from(source);
    const value: unknown = row?.value;
    if (value !== null && typeof value === "object") {
      const decoded = value as { kind?: string; format?: string; hex?: string };
      if (decoded.kind !== "geometry" || decoded.format !== "ewkb" || typeof decoded.hex !== "string") throw new Error(key + " geometry codec differs");
      const [text] = await context.db.select({ value: o["routine:$extension:postgis.st_asewkt($extension:postgis.geometry)"](expr as never) }).from(source);
      results[key] = { kind: "geometry", text: text?.value ?? null };
    } else if (typeof value === "number") results[key] = { kind: "number", text: String(value) };
    else if (typeof value === "boolean") results[key] = { kind: "boolean", text: String(value) };
    else if (typeof value === "string" || value === null) results[key] = { kind: "text", text: value ?? null };
    else throw new Error(key + " decoded an unexpected " + typeof value);
  }
  return { effectSame: true as const, schema: api.schema, version: api.version, results };
}) });`;

/** Writes config, application, schema, and (for native modes) the RPC that executes all 76 members. */
export async function writePostgisSfcgalProject(root: string, mode: PostgisSfcgalMode, namespace: string) {
  await rm(join(root, "kello/functions/tasks.ts"));
  await rm(join(root, "kello/contracts/tasks.ts"));
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { namespace: ${JSON.stringify(namespace)}, extensions: ${JSON.stringify(selection(mode))} } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
  );
  const firstLoad =
    mode === "empty"
      ? `if (extensions !== undefined) throw new Error("Empty selection generated bindings");`
      : mode === "future"
        ? `if (extensions.postgis_sfcgal.apiSupport.status !== "unverified" || "cgVolume" in extensions.postgis_sfcgal) throw new Error("Future postgis_sfcgal must stay descriptor-only");`
        : `const api = extensions.postgis_sfcgal;
if (Object.keys(extensions).join(",") !== "postgis,postgis_sfcgal" || api.version !== "3.6.4" || api.schema !== ${JSON.stringify(postgisSfcgalSchemas[mode].postgis_sfcgal)} || new Set(Object.values(api.sql.functions).flatMap((call) => call.members)).size !== 76)
  throw new Error("First-load postgis_sfcgal binding differs");`;
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
${firstLoad}
export default defineSchema(() => ({}), { namespace: ${JSON.stringify(namespace)} });`,
  );
  await writeFile(join(root, "kello/sfcgal-types.ts"), typesSource[mode]);
  if (mode === "custom" || mode === "default") {
    await copyFile(fileURLToPath(new URL("./postgis-sfcgal-witnesses.ts", import.meta.url)), join(root, "kello/sfcgal-witnesses.ts"));
    await writeFile(join(root, "kello/contracts/spatial.ts"), contractSource);
    await writeFile(join(root, "kello/functions/spatial.ts"), functionSource);
  }
}

/** Disk-generated module checks after generateProject. */
export async function checkPostgisSfcgalDiskBindings(root: string, mode: PostgisSfcgalMode) {
  const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
  const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  if (mode === "empty") {
    assert.equal(disk.extensions, undefined);
    assert(!source.includes("postgis"));
    return;
  }
  assert.deepEqual(Object.keys(disk.extensions), ["postgis", "postgis_sfcgal"]);
  if (mode === "future") {
    assert(!source.includes("kello/extensions/postgis-sfcgal"));
    assert.equal(disk.extensions.postgis_sfcgal.apiSupport.status, "unverified");
    assert.equal(disk.extensions.postgis_sfcgal.version, "3.7.0");
    assert.equal("cgVolume" in disk.extensions.postgis_sfcgal, false);
    return;
  }
  assert.match(source, /import \{ createPostgisSfcgal_3_6_4 \} from "kello\/extensions\/postgis-sfcgal";/);
  assert.match(source, /createPostgisSfcgal_3_6_4\(descriptors\["postgis_sfcgal"\], descriptors\["postgis"\]\)/);
  assert(source.includes(POSTGIS_SFCGAL_DIGEST) && source.includes(POSTGIS_DIGEST));
  for (const other of ["address-standardizer", "postgis-raster", "postgis-topology", "postgis-tiger-geocoder"]) assert(!source.includes(other));
  const api = disk.extensions.postgis_sfcgal;
  assert.equal(api.schema, postgisSfcgalSchemas[mode].postgis_sfcgal);
  assert.equal(disk.extensions.postgis.schema, postgisSfcgalSchemas[mode].postgis);
  const functions: Record<string, { readonly members: readonly string[] }> = api.sql.functions;
  const members = new Set(Object.values(functions).flatMap((call) => call.members));
  assert.equal(members.size, 76);
}
