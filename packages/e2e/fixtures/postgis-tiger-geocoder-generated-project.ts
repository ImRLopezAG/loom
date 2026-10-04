import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const POSTGIS_TIGER_GEOCODER_PUBLIC_DIGEST =
  "8afcc1fb470670f2a40780b473a8e35afe9172eb79cc8bab7391732503bfd966";
export const POSTGIS_PUBLIC_DIGEST = "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29";
export const POSTGIS_TIGER_FIXED_SCHEMA = "tiger";
export const POSTGIS_TIGER_CUSTOM_POSTGIS_SCHEMA = "postgis_custom";
export const POSTGIS_TIGER_QUERY_OVERLOADS = 13;
export const POSTGIS_TIGER_TABLES = [
  "addr",
  "addrfeat",
  "bg",
  "county",
  "county_lookup",
  "countysub_lookup",
  "cousub",
  "direction_lookup",
  "edges",
  "faces",
  "featnames",
  "geocode_settings",
  "geocode_settings_default",
  "loader_lookuptables",
  "loader_platform",
  "loader_variables",
  "pagc_gaz",
  "pagc_lex",
  "pagc_rules",
  "place",
  "place_lookup",
  "secondary_unit_lookup",
  "state",
  "state_lookup",
  "street_type_lookup",
  "tabblock",
  "tabblock20",
  "tract",
  "zcta5",
  "zip_lookup",
  "zip_lookup_all",
  "zip_lookup_base",
  "zip_state",
  "zip_state_loc",
] as const;
export const POSTGIS_TIGER_ADDRESS = "26 Court Street, Boston, MA 02108";
export const POSTGIS_TIGER_POINT = "SRID=4269;POINT(-71.057811 42.358274)";
export const POSTGIS_TIGER_LINE = "SRID=4269;LINESTRING(-71.06 42.35,-71.05 42.35)";
export const POSTGIS_TIGER_NORMALIZED = {
  address: 26,
  predirabbrev: null,
  streetname: "Court",
  streettypeabbrev: "St",
  postdirabbrev: null,
  internal: null,
  location: "Boston",
  stateabbrev: "MA",
  zip: "02108",
  parsed: true,
  zip4: null,
  address_alphanumeric: "26",
} as const;
export const POSTGIS_TIGER_PRETTY = "26 Court St, Boston, MA 02108";
export type PostgisTigerGeocoderSelection = "empty" | "future" | "selected" | "default" | "custom";

const forbiddenFamilies = [
  "address-standardizer",
  "postgis-raster",
  "postgis-topology",
  "postgis-sfcgal",
  "h3",
  "kello/tooling",
  "extensionBindingsSource",
  "kello.config",
  "./schema",
  "./server",
] as const;

const loaderNames = [
  "loader_generate_nation_script",
  "loader_generate_script",
  "loader_generate_census_script",
  "loader_macro_replace",
  "install_missing_indexes",
  "create_census_base_tables",
] as const;

function tigerConfig(selection: PostgisTigerGeocoderSelection) {
  if (selection === "empty") return {};
  if (selection === "future") return { postgis_tiger_geocoder: { version: "future" } };
  if (selection === "default")
    return { postgis: { version: "3.6.4" }, postgis_tiger_geocoder: { version: "3.6.4", schema: POSTGIS_TIGER_FIXED_SCHEMA } };
  if (selection === "custom")
    return {
      postgis: { version: "3.6.4", schema: POSTGIS_TIGER_CUSTOM_POSTGIS_SCHEMA },
      postgis_tiger_geocoder: { version: "3.6.4", schema: POSTGIS_TIGER_FIXED_SCHEMA },
    };
  return {
    postgis: { version: "3.6.4", schema: "public" },
    postgis_tiger_geocoder: { version: "3.6.4", schema: POSTGIS_TIGER_FIXED_SCHEMA },
  };
}

export function postgisTigerGeocoderPostgisSchema(selection: PostgisTigerGeocoderSelection): string | undefined {
  if (selection === "empty" || selection === "future") return undefined;
  if (selection === "custom") return POSTGIS_TIGER_CUSTOM_POSTGIS_SCHEMA;
  if (selection === "selected") return "public";
  return "extensions";
}

const outputValidator = `v.strictObject({
  version: v.literal("3.6.4"),
  tigerSchema: v.literal(${JSON.stringify(POSTGIS_TIGER_FIXED_SCHEMA)}),
  postgisSchema: v.string(),
  effectSame: v.literal(true),
  normalized: v.nullable(v.strictObject({
    address: v.nullable(v.number()),
    predirabbrev: v.nullable(v.string()),
    streetname: v.nullable(v.string()),
    streettypeabbrev: v.nullable(v.string()),
    postdirabbrev: v.nullable(v.string()),
    internal: v.nullable(v.string()),
    location: v.nullable(v.string()),
    stateabbrev: v.nullable(v.string()),
    zip: v.nullable(v.string()),
    parsed: v.nullable(v.boolean()),
    zip4: v.nullable(v.string()),
    address_alphanumeric: v.nullable(v.string()),
  })),
  pretty: v.nullable(v.string()),
  debugSetting: v.nullable(v.string()),
  utmzone: v.nullable(v.number()),
  interpolate: v.nullable(v.string()),
  geocodeCount: v.number(),
  reverse: v.strictObject({ intpt: v.nullable(v.unknown()), addy: v.nullable(v.unknown()), street: v.nullable(v.unknown()) }),
  stateLookupCount: v.number(),
  emptyAddrCount: v.number(),
})`;

const handler = `const bindings = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (bindings !== context.extensions) throw new Error("RPC and Effect selection differ");
if (typeof selected !== "undefined" && bindings !== selected) throw new Error("Host selected binding differs from RPC/Effect");
const api = bindings.postgis_tiger_geocoder;
const postgis = bindings.postgis;
if (api.schema !== ${JSON.stringify(POSTGIS_TIGER_FIXED_SCHEMA)} || api.version !== "3.6.4") throw new Error("Generated tiger identity differs");
if ("loader_generate_nation_script" in api.sql.functions) throw new Error("Loader tooling leaked into query functions");
const [row] = await context.db.select({
  normalized: api.normalizeAddress(${JSON.stringify(POSTGIS_TIGER_ADDRESS)}),
  pretty: api.prettyAddress(api.normalizeAddress(${JSON.stringify(POSTGIS_TIGER_ADDRESS)})),
  debugSetting: api.getGeocodeSetting("debug_geocode_address"),
  utmzone: api.utmZone(${JSON.stringify(POSTGIS_TIGER_POINT)}),
  interpolate: api.interpolateFromAddress(15, "10", "20", ${JSON.stringify(POSTGIS_TIGER_LINE)}),
}).from(sql.raw("(values (1)) fixture(id)"));
const geocode = api.geocodeRows("g", ${JSON.stringify(POSTGIS_TIGER_ADDRESS)});
const geocodeRows = await context.db.select(geocode.columns).from(geocode.from);
const reverse = api.reverseGeocodeRows("r", ${JSON.stringify(POSTGIS_TIGER_POINT)});
const [reverseRow] = await context.db.select(reverse.columns).from(reverse.from);
const states = api.state_lookupRows("states");
const stateRows = await context.db.select(states.columns).from(states.from);
const addrs = api.addrRows("addr");
const addrRows = await context.db.select(addrs.columns).from(addrs.from);
if (!row) throw new Error("Generated tiger query returned no fixture row");
// @ts-expect-error Loader scripts stay on operator tooling.
void api.sql.functions.loader_generate_nation_script;
return {
  version: api.version,
  tigerSchema: api.schema,
  postgisSchema: postgis.schema,
  effectSame: true as const,
  normalized: row.normalized,
  pretty: row.pretty,
  debugSetting: row.debugSetting,
  utmzone: row.utmzone,
  interpolate: row.interpolate,
  geocodeCount: geocodeRows.length,
  reverse: reverseRow ?? { intpt: null, addy: null, street: null },
  stateLookupCount: stateRows.length,
  emptyAddrCount: addrRows.length,
};`;

/** Writes consumer inputs only. Callers supply public kello; this file never imports a source adapter or emitter. */
export async function writePostgisTigerGeocoderProject(
  root: string,
  selection: PostgisTigerGeocoderSelection,
): Promise<string | undefined> {
  const namespace = `tiger_${selection}_${randomUUID().replaceAll("-", "")}`;
  const selected = selection === "selected" || selection === "default" || selection === "custom";
  const postgisSchema = postgisTigerGeocoderPostgisSchema(selection);
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { namespace: ${JSON.stringify(namespace)}, extensions: ${JSON.stringify(tigerConfig(selection))} } });
`,
  );
  if (!selected) {
    const check =
      selection === "future"
        ? `if (extensions.postgis_tiger_geocoder.apiSupport.status !== "unverified" || "normalizeAddress" in extensions.postgis_tiger_geocoder || "sql" in extensions.postgis_tiger_geocoder)
  throw new Error("Future postgis_tiger_geocoder must stay descriptor-only");`
        : `const absent: undefined = extensions; if (absent !== undefined) throw new Error("Empty selection must be undefined");`;
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
${check}
export default defineSchema((s) => ({ tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }) }), { namespace: ${JSON.stringify(namespace)} });
`,
    );
    await writeFile(
      join(root, "kello/selection-types.ts"),
      selection === "future"
        ? `import { extensions } from "./_generated/extensions";
const version: "future" = extensions.postgis_tiger_geocoder.version;
// @ts-expect-error Unverified tiger exposes a descriptor only.
extensions.postgis_tiger_geocoder.normalizeAddress;
void version;
`
        : `import { extensions } from "./_generated/extensions";
const absent: undefined = extensions;
void absent;
`,
    );
    return undefined;
  }
  const component = join(root, "kello/components/tiger");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import tiger from "./components/tiger/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(tiger); export default app;\n',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "tiger", extensions: { postgis: { versions: ["3.6.4"] }, postgis_tiger_geocoder: { versions: ["3.6.4"] } }, rpc: ({ os }) => ({ os }) });\n',
  );
  const firstLoad = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.postgis_tiger_geocoder;
if (Object.keys(extensions).sort().join(",") !== "postgis,postgis_tiger_geocoder") throw new Error("Incorrect virtual tiger selection");
if (api.version !== "3.6.4" || api.schema !== ${JSON.stringify(POSTGIS_TIGER_FIXED_SCHEMA)} || api.apiSupport.digest !== ${JSON.stringify(POSTGIS_TIGER_GEOCODER_PUBLIC_DIGEST)})
  throw new Error("Incorrect first-load tiger identity");
if (extensions.postgis.schema !== ${JSON.stringify(postgisSchema)} || Object.keys(api.sql.overloads).length !== ${POSTGIS_TIGER_QUERY_OVERLOADS})
  throw new Error("Incomplete first-load tiger surface");
${loaderNames.map((name) => `if (${JSON.stringify(name)} in api.sql.functions) throw new Error(${JSON.stringify(name)} + " leaked into query functions");`).join("\n")}
api.field();
api.state_lookupField();
export default defineSchema((s) => ({
  places: defineTable({ name: s.text().notNull(), addy: api.field(), state: api.state_lookupField() }),
}), { namespace: ${JSON.stringify(namespace)} });
`;
  await writeFile(join(root, "kello/schema.ts"), firstLoad);
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).sort().join(",") !== "postgis,postgis_tiger_geocoder" || extensions.postgis_tiger_geocoder.schema !== ${JSON.stringify(POSTGIS_TIGER_FIXED_SCHEMA)} || extensions.postgis.schema !== ${JSON.stringify(postgisSchema)})
  throw new Error("Wrong mounted virtual tiger selection");
extensions.postgis_tiger_geocoder.normalizeAddress(${JSON.stringify(POSTGIS_TIGER_ADDRESS)});
export default defineSchema(() => ({}));
`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${outputValidator}) });\n`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.strictObject({ host: ${outputValidator}, child: ${outputValidator} })) });\n`,
  );
  await writeFile(
    join(component, "functions/status.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.status.router({ run: os.status.run.handler(async ({ context }) => { ${handler} }) });
`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
const host = await (async () => { ${handler} })();
return { host, child: await context.components.tiger.rpc.status.run() };
}) });
`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import type { SQL } from "drizzle-orm";
import { extensions } from "./_generated/extensions";
import type { PostgisTigerGeocoderNormAddy } from "kello/extensions/postgis-tiger-geocoder";
const api = extensions.postgis_tiger_geocoder;
const version: "3.6.4" = api.version;
const schema: ${JSON.stringify(POSTGIS_TIGER_FIXED_SCHEMA)} = api.schema;
const postgis: ${JSON.stringify(postgisSchema)} = extensions.postgis.schema;
const normalized: SQL<PostgisTigerGeocoderNormAddy | null> = api.normalizeAddress(${JSON.stringify(POSTGIS_TIGER_ADDRESS)});
const pretty: SQL<string | null> = api.prettyAddress(null);
const zone: SQL<number | null> = api.utmZone(${JSON.stringify(POSTGIS_TIGER_POINT)});
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.postgis_sfcgal;
// @ts-expect-error Loader scripts are operator tooling, not query helpers.
api.sql.functions.loader_generate_nation_script;
// @ts-expect-error A caller cannot select a result type.
api.normalizeAddress<string>(${JSON.stringify(POSTGIS_TIGER_ADDRESS)});
}
void [version, schema, postgis, normalized, pretty, zone, compileOnly];
`,
  );
  return postgisSchema;
}

export async function writePostgisTigerGeocoderOrphanProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { postgis_tiger_geocoder: { version: "3.6.4", schema: "tiger" } } } });
`,
  );
}

export async function writePostgisTigerGeocoderWrongSchemaProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { postgis: { version: "3.6.4" }, postgis_tiger_geocoder: { version: "3.6.4", schema: "extensions" } } } });
`,
  );
}

export async function checkPostgisTigerGeocoderDiskBindings(
  root: string,
  selection: PostgisTigerGeocoderSelection,
): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  if (selection === "empty") {
    assert.equal(disk.extensions, undefined);
    assert(!source.includes("postgis_tiger_geocoder"));
    assert(!source.includes("createPostgisTigerGeocoder_3_6_4"));
    return;
  }
  if (selection === "future") {
    assert.deepEqual(Object.keys(disk.extensions), ["postgis_tiger_geocoder"]);
    assert(!source.includes("createPostgisTigerGeocoder_3_6_4"));
    assert(!source.includes(POSTGIS_TIGER_GEOCODER_PUBLIC_DIGEST));
    assert.equal(disk.extensions.postgis_tiger_geocoder.apiSupport.status, "unverified");
    assert.equal(disk.extensions.postgis_tiger_geocoder.version, "future");
    assert.equal("normalizeAddress" in disk.extensions.postgis_tiger_geocoder, false);
    assert.equal("sql" in disk.extensions.postgis_tiger_geocoder, false);
    return;
  }
  assert.match(source, /import \{ createPostgisTigerGeocoder_3_6_4 \} from "kello\/extensions\/postgis-tiger-geocoder";/);
  assert.match(source, /import \{ createPostgis_3_6_4 \} from "kello\/extensions\/postgis";/);
  assert.match(source, /createPostgisTigerGeocoder_3_6_4\(descriptors\["postgis_tiger_geocoder"\], descriptors\["postgis"\]\)/);
  assert(source.includes(POSTGIS_TIGER_GEOCODER_PUBLIC_DIGEST) && source.includes(POSTGIS_PUBLIC_DIGEST));
  for (const forbidden of forbiddenFamilies) assert(!source.includes(forbidden), forbidden);
  assert.deepEqual(Object.keys(disk.extensions).sort(), ["postgis", "postgis_tiger_geocoder"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.postgis_tiger_geocoder;
  const postgisSchema = postgisTigerGeocoderPostgisSchema(selection);
  assert.deepEqual(
    [api.name, api.version, api.schema, api.apiSupport.digest],
    ["postgis_tiger_geocoder", "3.6.4", POSTGIS_TIGER_FIXED_SCHEMA, POSTGIS_TIGER_GEOCODER_PUBLIC_DIGEST],
  );
  assert.equal(disk.extensions.postgis.schema, postgisSchema);
  assert.equal(Object.keys(api.sql.overloads).length, POSTGIS_TIGER_QUERY_OVERLOADS);
  for (const name of loaderNames) assert.equal(name in api.sql.functions, false, name);
  for (const table of POSTGIS_TIGER_TABLES) assert.equal(typeof api[`${table}Rows`], "function", table);
  const child = await import(pathToFileURL(join(root, "kello/components/tiger/_generated/extensions.ts")).href);
  assert.deepEqual(Object.keys(child.extensions).sort(), ["postgis", "postgis_tiger_geocoder"]);
  assert.equal(child.extensions.postgis_tiger_geocoder.schema, POSTGIS_TIGER_FIXED_SCHEMA);
  assert.equal(child.extensions.postgis.schema, postgisSchema);
  assert.equal(child.extensions.postgis_tiger_geocoder.apiSupport.digest, POSTGIS_TIGER_GEOCODER_PUBLIC_DIGEST);
}
