import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const ADDRESS_STANDARDIZER_PUBLIC_DIGEST =
  "f59d9c3801428f5360f8279dd04c64d7a8c74ed9c58afb733d95399aacdc5cc1";
export const ADDRESS_STANDARDIZER_CUSTOM_SCHEMA = "addr_std_custom";
export const ADDRESS_STANDARDIZER_STDADDR_FIELDS = [
  "building",
  "house_num",
  "predir",
  "qual",
  "pretype",
  "name",
  "suftype",
  "sufdir",
  "ruralroute",
  "extra",
  "city",
  "state",
  "country",
  "postcode",
  "box",
  "unit",
] as const;
export const ADDRESS_STANDARDIZER_PARSE_FIELDS = [
  "num",
  "street",
  "street2",
  "address1",
  "city",
  "state",
  "zip",
  "zipplus",
  "country",
] as const;

export const addressStandardizerFiveExpected = {
  building: null,
  house_num: "123",
  predir: null,
  qual: null,
  pretype: null,
  name: "MAIN",
  suftype: "STREET",
  sufdir: null,
  ruralroute: null,
  extra: null,
  city: "KANSAS CITY",
  state: "MISSOURI",
  country: null,
  postcode: "45678",
  box: null,
  unit: null,
} as const;

export const addressStandardizerFourExpected = {
  building: null,
  house_num: "1566",
  predir: null,
  qual: null,
  pretype: null,
  name: "NEW STATE HIGHWAY",
  suftype: null,
  sufdir: null,
  ruralroute: null,
  extra: null,
  city: "RAYNHAM",
  state: "MASSACHUSETTS",
  country: "USA",
  postcode: null,
  box: null,
  unit: null,
} as const;

export const addressStandardizerParsedExpected = {
  num: "123",
  street: "Main Street",
  street2: null,
  address1: "123 Main Street",
  city: "Kansas City",
  state: "MO",
  zip: "45678",
  zipplus: "",
  country: "US",
} as const;

const nullableText = "v.nullable(v.string())";
const stdaddrValidator = `v.strictObject({ ${ADDRESS_STANDARDIZER_STDADDR_FIELDS.map((field) => `${field}: ${nullableText}`).join(", ")} })`;
const parseValidator = `v.strictObject({ ${ADDRESS_STANDARDIZER_PARSE_FIELDS.map((field) => `${field}: ${nullableText}`).join(", ")} })`;

/** The caller supplies public package tooling; this fixture never imports a source adapter. */
export async function writeAddressStandardizerSelectedProject(root: string, schema?: string): Promise<string> {
  const placement = schema ?? "extensions";
  const namespace = `addrstd_gen_${randomUUID().replaceAll("-", "")}`;
  const component = join(root, "kello/components/standardizer");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"));
  const selected = schema ? { version: "3.6.4", schema } : { version: "3.6.4" };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { namespace: ${JSON.stringify(namespace)}, extensions: { address_standardizer: ${JSON.stringify(selected)} } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import standardizer from "./components/standardizer/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(standardizer); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "standardizer", extensions: { address_standardizer: { versions: ["3.6.4"] } }, rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.address_standardizer;
if (Object.keys(extensions).join(",") !== "address_standardizer") throw new Error("Incorrect selection");
if (api.schema !== ${JSON.stringify(placement)} || api.version !== "3.6.4" || api.apiSupport.digest !== ${JSON.stringify(ADDRESS_STANDARDIZER_PUBLIC_DIGEST)})
  throw new Error("Incorrect first-load address_standardizer binding");
if (typeof api.standardizeAddress !== "function" || api.sql.functions.parse_address === undefined)
  throw new Error("Incorrect first-load address_standardizer surface");
api.parseAddress("123 Main Street");
api.field();
api.arrayField();
export default defineSchema((s) => ({
  entries: defineTable({ title: s.text().notNull(), address: api.field(), tags: api.arrayField() }, { publicFields: ["_id", "title"] }),
}), { namespace: ${JSON.stringify(namespace)} });`,
  );
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "address_standardizer" || extensions.address_standardizer.schema !== ${JSON.stringify(placement)})
  throw new Error("Wrong virtual child selection");
extensions.address_standardizer.parseAddress("123 Main Street");
export default defineSchema(() => ({}));`,
  );
  await writeFile(
    join(component, "contracts/status.ts"),
    'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(v.literal("3.6.4")) });',
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot";
export default defineContract({ list: oc.output(v.strictObject({
  version: v.literal("3.6.4"),
  placement: v.literal(${JSON.stringify(placement)}),
  child: v.literal("3.6.4"),
  effectSame: v.literal(true),
  debugRultab: v.literal("us_rules"),
  five: ${stdaddrValidator},
  four: ${stdaddrValidator},
  parsed: ${parseValidator},
  debug: v.string(),
  missing: v.null(),
})) });`,
  );
  const handler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Public generated RPC and Effect bindings differ");
const version: "3.6.4" = binding.address_standardizer.version;
const placement: ${JSON.stringify(placement)} = context.extensions.address_standardizer.schema;
const sources = { lex: { schema: "lex_schema", name: "us_lex" }, gaz: { schema: "lex_schema", name: "us_gaz" }, rules: { schema: "lex_schema", name: "us_rules" } };
const rultab = "us_rules";
const [row] = await context.db.select({
  five: binding.address_standardizer.standardizeAddress(sources, "123 Main Street", "Kansas City, MO 45678"),
  four: binding.address_standardizer.standardizeAddress(sources, "1566 NEW STATE HWY, RAYNHAM, MA"),
  parsed: binding.address_standardizer.parseAddress("123 Main Street, Kansas City, MO 45678"),
  debug: binding.address_standardizer.sql.functions.debug_standardize_address("us_lex", "us_gaz", rultab, "123 Main Street", "Kansas City, MO 45678"),
  missing: binding.address_standardizer.sql.functions.standardize_address(null, "us_gaz", rultab, "123 Main Street", "Kansas City, MO 45678"),
}).from(sql\`(values(1)) fixture(id)\`);
if (!row || row.five === null || row.four === null || row.parsed === null || row.debug === null || row.missing !== null)
  throw new Error("Generated RPC did not execute native address_standardizer");
if (!/HOUSE|STREET|MAIN/.test(row.debug)) throw new Error("Unquoted rultab debug did not retain native quote_ident tokens");`;
  await writeFile(
    join(component, "functions/status.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.status.router({ run: os.status.run.handler(async ({ context }) => {
${handler}
// @ts-expect-error Unselected families remain absent in the mounted facade.
void context.extensions.address_standardizer_data_us;
return version; }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { extensions as selected } from "../_generated/extensions"; import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${handler}
if (binding !== selected) throw new Error("Host selected binding differs from RPC/Effect");
return { version, placement, child: await context.components.standardizer.rpc.status.run(), effectSame: true as const, debugRultab: rultab, five: row.five, four: row.four, parsed: row.parsed, debug: row.debug, missing: row.missing }; }) });`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { type SQL } from "drizzle-orm";
import { extensions } from "./_generated/extensions";
import type { AddressStandardizerParse, AddressStandardizerStdaddr } from "kello/extensions/address-standardizer";
const version: "3.6.4" = extensions.address_standardizer.version;
const placement: ${JSON.stringify(placement)} = extensions.address_standardizer.schema;
const sources = { lex: { schema: "lex_schema", name: "us_lex" }, gaz: { schema: "lex_schema", name: "us_gaz" }, rules: { schema: "lex_schema", name: "us_rules" } };
const five: SQL<AddressStandardizerStdaddr | null> = extensions.address_standardizer.standardizeAddress(sources, "123 Main Street", "Kansas City, MO 45678");
const four: SQL<AddressStandardizerStdaddr | null> = extensions.address_standardizer.standardizeAddress(sources, "1566 NEW STATE HWY, RAYNHAM, MA");
const parsed: SQL<AddressStandardizerParse | null> = extensions.address_standardizer.parseAddress("123 Main Street");
const debug: SQL<string | null> = extensions.address_standardizer.sql.functions.debug_standardize_address("us_lex", "us_gaz", "us_rules", "123 Main Street", "Kansas City, MO 45678");
extensions.address_standardizer.field();
extensions.address_standardizer.arrayField();
function compileOnly() {
// @ts-expect-error Companion data_us is not selected.
extensions.address_standardizer_data_us;
// @ts-expect-error Raw SQL text is never a typed lex/gaz/rules source.
extensions.address_standardizer.standardizeAddress("us_lex", "123 Main Street");
// @ts-expect-error There is no JavaScript address normalizer.
extensions.address_standardizer.normalizeAddress("123 Main Street");
}
void [version, placement, five, four, parsed, debug, compileOnly];`,
  );
  return placement;
}

export async function writeAddressStandardizerFutureProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { address_standardizer: { version: "future" } } } });',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
if (extensions.address_standardizer.apiSupport.status !== "unverified") throw new Error("Future address_standardizer must stay unverified");
if ("standardizeAddress" in extensions.address_standardizer) throw new Error("Unverified address_standardizer must not invent query methods");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });`,
  );
}

export async function writeAddressStandardizerEmptyProject(root: string): Promise<void> {
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({});',
  );
}

/** Read actual generated files and import them from disk after the virtual first load. */
export async function checkAddressStandardizerDiskBindings(root: string, placement: string): Promise<void> {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('import { createAddressStandardizer_3_6_4 } from "kello/extensions/address-standardizer";'));
  assert(source.includes(ADDRESS_STANDARDIZER_PUBLIC_DIGEST));
  for (const forbidden of [
    "kello/extensions/address-standardizer-data-us",
    "kello/extensions/postgis",
    "kello/tooling",
    "./schema",
    "./server",
    "kello.config",
    "normalizeAddress",
    "parseAddressLocally",
  ])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["address_standardizer"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.address_standardizer;
  assert.deepEqual([api.name, api.version, api.schema], ["address_standardizer", "3.6.4", placement]);
  assert.deepEqual(api.apiSupport, { status: "verified", digest: ADDRESS_STANDARDIZER_PUBLIC_DIGEST });
  assert.deepEqual(Object.keys(api.sql.functions).sort(), [
    "debug_standardize_address",
    "parse_address",
    "standardize_address",
  ]);
  assert.equal(Object.keys(api.sql.overloads).length, 4);
  assert.equal(api.field().metadata.extension?.type, "stdaddr");
  assert.equal(api.arrayField().metadata.extension?.array, true);
}
