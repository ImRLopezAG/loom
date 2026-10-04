import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const DATA_US_DIGEST = "063cb37742a0baf3dd885cb96255db38daf06b13d3b75fd7232b81822a7f01d0";
export const DATA_US_CUSTOM_SCHEMA = 'Data"US日本';
export const DATA_US_GENERATED_CUSTOM_SCHEMA = "data_us_custom";
export const DATA_US_TABLES = ["us_lex", "us_gaz", "us_rules"] as const;
export const DATA_US_SEEDS = [
  { name: "us_lex", count: 2940, hash: "bc4bf0ee235cefc05112bdba1ff17b51" },
  { name: "us_gaz", count: 1074, hash: "bf30d6ac003de7b027bad341002e1c26" },
  { name: "us_rules", count: 4369, hash: "9388e43a86c3b26ea1eaca6f698d1d14" },
] as const;
export type DataUsSelection = "omitted" | "empty" | "future" | "selected" | "custom";

const lexicalValidator = `v.strictObject({ id: v.number(), seq: v.nullable(v.number()), word: v.nullable(v.string()), stdword: v.nullable(v.string()), token: v.nullable(v.number()), is_custom: v.boolean() })`;
const rulesValidator = `v.strictObject({ id: v.number(), rule: v.nullable(v.string()), is_custom: v.boolean() })`;
const output = `v.strictObject({ version: v.literal("3.6.4"), placement: v.string(), effectSame: v.literal(true), lex: v.array(${lexicalValidator}), gaz: v.array(${lexicalValidator}), rules: v.array(${rulesValidator}) })`;
const handler = `const bindings = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (bindings !== context.extensions) throw new Error("RPC and Effect selection differ");
const api = bindings.address_standardizer_data_us;
const lex = api.tables.us_lex.rows("lex");
const gaz = api.tables.us_gaz.rows("gaz");
const rules = api.tables.us_rules.rows("rules");
const lexRows = await context.db.select(lex.columns).from(lex.from).orderBy(lex.columns.id);
const gazRows = await context.db.select(gaz.columns).from(gaz.from).orderBy(gaz.columns.id);
const rulesRows = await context.db.select(rules.columns).from(rules.from).orderBy(rules.columns.id);
const typedId: number = lexRows[0]!.id;
const typedNullable: string | null = lexRows[0]!.word;
const typedFlag: boolean = rulesRows[0]!.is_custom;
void [typedId, typedNullable, typedFlag];
// @ts-expect-error The data-only selection does not select the address engine.
void context.extensions.address_standardizer;
return { version: api.version, placement: api.schema, effectSame: true as const, lex: lexRows, gaz: gazRows, rules: rulesRows };`;

/** Writes real consumer inputs. All extension access is through generated/public modules. */
export async function writeDataUsProject(root: string, selection: DataUsSelection): Promise<string | undefined> {
  const selected = selection === "selected" || selection === "custom";
  const placement = selection === "custom" ? DATA_US_GENERATED_CUSTOM_SCHEMA : "extensions";
  const namespace = selected ? `dataus_${randomUUID().replaceAll("-", "")}` : "app";
  const extensionConfig =
    selection === "omitted"
      ? undefined
      : selection === "empty"
        ? {}
        : selection === "custom"
          ? { address_standardizer_data_us: { version: "3.6.4", schema: placement } }
          : {
              address_standardizer_data_us: {
                version: selection === "future" ? "future" : "3.6.4",
              },
            };
  const database = extensionConfig === undefined ? { namespace } : { namespace, extensions: extensionConfig };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${JSON.stringify({ database })});`,
  );
  if (!selected) {
    const check =
      selection === "future"
        ? `if (extensions.address_standardizer_data_us.apiSupport.status !== "unverified" || "tables" in extensions.address_standardizer_data_us) throw new Error("Future descriptor invented members");`
        : `const absent: undefined = extensions; if (absent !== undefined) throw new Error("Empty selection must be undefined");`;
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
${check}
export default defineSchema((s) => ({ tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }) }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "kello/selection-types.ts"),
      selection === "future"
        ? `import { extensions } from "./_generated/extensions"; const version: "future" = extensions.address_standardizer_data_us.version;
// @ts-expect-error Unverified versions expose a descriptor only.
extensions.address_standardizer_data_us.tables;
void version;`
        : `import { extensions } from "./_generated/extensions"; const absent: undefined = extensions; void absent;`,
    );
    return undefined;
  }
  const component = join(root, "kello/components/dataus");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"));
  await writeFile(
    join(root, "kello/app.config.ts"),
    `import { defineApplication } from "kello/server"; import dataus from "./components/dataus/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(dataus); export default app;`,
  );
  await writeFile(
    join(component, "setup.ts"),
    `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "dataus", extensions: { address_standardizer_data_us: { versions: ["3.6.4"] } }, rpc: ({ os }) => ({ os }) });`,
  );
  const schema = `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
const api = extensions.address_standardizer_data_us;
if (Object.keys(extensions).join(",") !== "address_standardizer_data_us" || api.schema !== ${JSON.stringify(placement)} || api.apiSupport.digest !== ${JSON.stringify(DATA_US_DIGEST)}) throw new Error("Incorrect first-load data-US contract");
export default defineSchema(() => ({ entries: defineTable({
${DATA_US_TABLES.map((name) => `${name}: api.tables.${name}.field(), ${name}_array: api.tables.${name}.arrayField()`).join(",\n")}
}) }), { namespace: ${JSON.stringify(namespace)} });`;
  await writeFile(join(root, "kello/schema.ts"), schema);
  await writeFile(join(component, "schema.ts"), schema);
  await writeFile(
    join(component, "contracts/status.ts"),
    `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${output}) });`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.strictObject({ host: ${output}, child: ${output} })) });`,
  );
  const imports = `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect";`;
  await writeFile(
    join(component, "functions/status.ts"),
    `${imports} export default os.status.router({ run: os.status.run.handler(async ({ context }) => { ${handler} }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `${imports} export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
const host = await (async () => { ${handler} })();
return { host, child: await context.components.dataus.rpc.status.run() }; }) });`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import type { SQL } from "drizzle-orm"; import { extensions } from "./_generated/extensions";
const api = extensions.address_standardizer_data_us;
const version: "3.6.4" = api.version; const schema: ${JSON.stringify(placement)} = api.schema;
const id: SQL<number> = api.tables.us_lex.rows("l").columns.id;
const word: SQL<string | null> = api.tables.us_gaz.rows("g").columns.word;
const sequence: SQL<bigint> = api.sequences.us_rules_id_seq.rows("s").columns.last_value;
api.tables.us_rules.codec.encode({ id: null, rule: null, is_custom: null });
api.tables.us_lex.arrayCodec.encode({ dimensions: [{ lowerBound: -2, length: 2 }], values: [{ id: null, seq: null, word: "日本", stdword: "", token: null, is_custom: false }, null] });
function compileOnly() {
// @ts-expect-error Unselected address engine.
api.standardizeAddress("123 Main Street");
// @ts-expect-error Only explicitly selected extension keys exist.
extensions.address_standardizer;
// @ts-expect-error int4 composites do not accept bigint ids.
api.tables.us_rules.codec.encode({ id: 1n, rule: null, is_custom: true });
}
void [version, schema, id, word, sequence, compileOnly];`,
  );
  return placement;
}

export async function checkDataUsDiskBindings(root: string, placement?: string): Promise<void> {
  const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
  const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
  if (placement === undefined) return;
  assert(source.includes('from "kello/extensions/address-standardizer-data-us"'));
  assert(source.includes("createAddressStandardizerDataUs_3_6_4"));
  assert(source.includes(DATA_US_DIGEST));
  for (const forbidden of [
    'kello/extensions/address-standardizer"',
    "kello/extensions/postgis",
    "kello/tooling",
    "kello.config",
    "./schema",
    "./server",
  ])
    assert(!source.includes(forbidden), forbidden);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["address_standardizer_data_us"]);
  const api = disk.extensions.address_standardizer_data_us;
  assert(Object.isFrozen(disk.extensions));
  assert.deepEqual(
    [api.name, api.version, api.schema, api.apiSupport.digest],
    ["address_standardizer_data_us", "3.6.4", placement, DATA_US_DIGEST],
  );
  assert.deepEqual(Object.keys(api.tables), DATA_US_TABLES);
  assert.equal(Object.keys(api.sql.types).length, 6);
  assert.deepEqual(Object.keys(api.sql.functions), []);
  for (const name of DATA_US_TABLES) {
    assert.equal(api.tables[name].field().metadata.extension.type, name);
    assert.equal(api.tables[name].arrayField().metadata.extension.array, true);
    const child = await import(pathToFileURL(join(root, "kello/components/dataus/_generated/extensions.ts")).href);
    assert.deepEqual(Object.keys(child.extensions), ["address_standardizer_data_us"]);
    assert.equal(child.extensions.address_standardizer_data_us.schema, placement);
  }
}
