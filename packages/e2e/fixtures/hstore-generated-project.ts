import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import * as v from "valibot";
import { hstoreGeneratedHandler } from "./hstore-generated";

export const hstoreGeneratedModes = ["selected", "custom", "omitted", "empty", "future"] as const;
export type HstoreGeneratedMode = (typeof hstoreGeneratedModes)[number];
export const hstoreGeneratedSchema = (mode: HstoreGeneratedMode) =>
  mode === "custom" ? "custom_hstore" : "extensions";
export const hstoreGeneratedSelected = (mode: HstoreGeneratedMode) => mode === "selected" || mode === "custom";

/** Public-tooling fixture; first load must supply virtual bindings before disk generation exists. */
export async function writeHstoreProject(root: string, mode: HstoreGeneratedMode): Promise<void> {
  const selected = hstoreGeneratedSelected(mode);
  const placement = hstoreGeneratedSchema(mode);
  const future = mode === "future";
  const component = join(root, "kello/components/documents");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  const config =
    mode === "omitted"
      ? "{}"
      : mode === "empty"
        ? "{ database: { extensions: {} } }"
        : `{ database: { extensions: { hstore: { version: "${future ? "0.0.0" : "1.8"}", schema: ${JSON.stringify(placement)} } } } }`;
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${config});`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import documents from "./components/documents/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(documents); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "documents", ${selected || future ? `extensions: { hstore: { versions: ["${future ? "0.0.0" : "1.8"}"] } },` : ""} rpc: ({ os }) => ({ os }) });`,
  );
  const selectionAssertion = selected
    ? `if (extensions.hstore.version !== "1.8" || extensions.hstore.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong selected Hstore");`
    : future
      ? 'if (extensions.hstore.apiSupport.status !== "unverified" || Object.keys(extensions.hstore).sort().join() !== "apiSupport,name,schema,version") throw new Error("Unsupported selection acquired helpers");'
      : 'if (extensions !== undefined) throw new Error("Wrong absent selection");';
  const schema = `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
${selectionAssertion}
export default defineSchema(field => ({ records: defineTable({ label: field.text() }, { publicFields: ["_id", "label"] }), ${selected ? "mappings: defineTable({ scalar: extensions.hstore.field(), matrix: extensions.hstore.arrayField() }, { publicFields: [] })," : ""} }), { namespace: "app" });`;
  await writeFile(join(root, "kello/schema.ts"), schema);
  await writeFile(join(component, "schema.ts"), schema);
  const result = selected
    ? `v.strictObject({version:v.literal("1.8"), placement:v.literal(${JSON.stringify(placement)}), members:v.array(v.string()), populated:v.literal("populated"), replaced:v.literal("replaced")})`
    : `v.strictObject({status:v.literal("${future ? "unverified" : "absent"}"),value:v.literal(1),effectSame:v.literal(true)})`;
  const rootContract = `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.strictObject({root:${result},child:${result}})) });`;
  await writeFile(join(root, "kello/contracts/tasks.ts"), rootContract);
  await writeFile(
    join(component, "contracts/mappings.ts"),
    `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({run:oc.output(${result})});`,
  );
  const imports =
    'import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { extensions as selected } from "../_generated/extensions"; import schema from "../schema"; import { Effect } from "effect"; import { sql } from "drizzle-orm";';
  const body = selected
    ? hstoreGeneratedHandler.replace(
        "const placement: 'custom_hstore' = api.schema;",
        `const placement: ${JSON.stringify(placement)} = api.schema;`,
      ) +
      `
if (binding !== selected) throw new Error("Generated module/RPC identity differs");
const [stored] = await context.db.select({scalar:schema.tables.mappings.scalar,matrix:schema.tables.mappings.matrix,subscript:api.subscript.read(schema.tables.mappings.scalar,"stored")}).from(schema.tables.mappings);
if (!stored?.scalar?.entries.some(entry => entry.key === "stored" && entry.value === null) || stored.matrix?.dimensions[0]?.lowerBound !== -2 || stored.matrix?.values[1] !== null || stored.subscript !== null) throw new Error("Private Hstore fields/array bounds differ");
const realWitness = api.record.tableRow(schema,"records");
const [real] = await context.db.select({value:api.fromRecord(realWitness)}).from(schema.tables.records);
if (!real?.value.entries.some(entry => entry.key === "label" && entry.value === "row-witness")) throw new Error("Qualified managed whole row differs");
const output = {version,placement,members,populated:"populated" as const,replaced:"replaced" as const};
`
    : `const binding = Effect.runSync(Effect.provide(Extensions,context["effect/context"]));
if (binding !== selected || binding !== context.extensions) throw new Error("Unselected RPC/Effect/module identity differs");
const [row] = await context.db.select({value:sql<number>\`1\`}).from(sql\`(values(1)) probe(value)\`);
if (row?.value !== 1) throw new Error("Unselected native query failed");
const output = {status:"${future ? "unverified" : "absent"}" as const,value:1 as const,effectSame:true as const};
`;
  const negative = selected
    ? `// @ts-expect-error Unselected families remain absent.
selected.vector;
// @ts-expect-error SQL cannot forge managed record provenance.
selected.hstore.fromRecord(sql.raw("row(1)"));
// @ts-expect-error Internal callbacks are not query helpers.
selected.hstore.sql.functions.hstore_subscript_handler(null);
// @ts-expect-error Arrays cannot become scalar subscript assignment targets.
selected.hstore.subscript.target(schema.tables.mappings.matrix,"key");`
    : `// @ts-expect-error Omitted, empty and future selections have no supported helper.
selected.hstore.get(null,"key");`;
  const contextNegative = `if (false) {
// @ts-expect-error RPC has no unselected vector API.
context.extensions.vector;
// @ts-expect-error Effect has no unselected vector API.
binding.vector;
${!selected ? '// @ts-expect-error Unsupported or absent Hstore has no typed query API.\ncontext.extensions.hstore.get(null,"key");\n// @ts-expect-error Unsupported or absent Effect Hstore has no typed query API.\nbinding.hstore.get(null,"key");' : ""}
}`;
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `${imports} export default os.tasks.router({list:os.tasks.list.handler(async ({context}) => {${body}${contextNegative}return {root:output,child:await context.components.documents.rpc.mappings.run()};})}); function compileOnly(){${negative}} void compileOnly;`,
  );
  await writeFile(
    join(component, "functions/mappings.ts"),
    `${imports} export default os.mappings.router({run:os.mappings.run.handler(async ({context}) => {${body}${contextNegative}return output;})}); function compileOnly(){${negative}} void compileOnly;`,
  );
}

export async function checkHstoreDiskBindings(root: string, mode: HstoreGeneratedMode): Promise<void> {
  for (const relative of ["kello", "kello/components/documents"]) {
    const file = join(root, relative, "_generated/extensions.ts");
    const source = await readFile(file, "utf8");
    const disk = await import(pathToFileURL(file).href);
    const server = await import(pathToFileURL(join(root, relative, "_generated/server.ts")).href);
    assert.equal(server.extensions, disk.extensions);
    if (hstoreGeneratedSelected(mode)) {
      assert.deepEqual(Object.keys(disk.extensions), ["hstore"]);
      assert.equal(disk.extensions.hstore.schema, hstoreGeneratedSchema(mode));
      assert.equal(Object.keys(disk.extensions.hstore.sql.overloads).length, 66);
      assert(source.includes('from "kello/extensions/hstore"'));
      v.parse(v.function(), disk.extensions.hstore.subscript.read);
      assert.deepEqual(Object.keys(disk.extensions.hstore.indexes).sort(), ["btree", "gin", "gist", "hash"]);
    } else {
      assert(!source.includes("createHstore_1_8"));
      if (mode === "future")
        assert.deepEqual(disk.extensions, {
          hstore: {
            name: "hstore",
            version: "0.0.0",
            schema: hstoreGeneratedSchema(mode),
            apiSupport: {
              status: "unverified",
              reason: "No verified SQL contract for the configured extension version and provider",
            },
          },
        });
      else assert.equal(disk.extensions, undefined);
    }
    for (const forbidden of ["kello.config", "kello/extensions/vector", "kello/extensions/pgcrypto"])
      assert(!source.includes(forbidden));
  }
}
