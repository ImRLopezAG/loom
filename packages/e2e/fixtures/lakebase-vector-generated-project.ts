import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const lakebaseVectorGeneratedDigest = "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20";
export const lakebaseVectorCompanionDigest = "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4";
export type LakebaseVectorSelection = "omitted" | "empty" | "future" | "selected";

/** Public tooling initializes the project; schema imports test the first virtual load. */
export async function writeLakebaseVectorProject(
  root: string,
  selection: LakebaseVectorSelection,
  schema?: string,
  vectorSchema?: string,
): Promise<void> {
  const placement = schema ?? "extensions";
  const companionPlacement = vectorSchema ?? "extensions";
  const namespace = `lakebase_gen_${randomUUID().replaceAll("-", "")}`;
  const absent = selection === "omitted" || selection === "empty";
  const selected = selection === "selected";
  const database = {
    namespace,
    ...(selection !== "omitted" && {
      extensions: absent
        ? {}
        : {
            lakebase_vector: { version: selected ? "1.1.1" : "future", ...(schema && { schema }) },
            ...(selected && { vector: { version: "0.8.6", ...(vectorSchema && { schema: vectorSchema }) } }),
          },
    }),
  };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: ${JSON.stringify(database)} });\n`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });\n',
  );
  const firstLoad = absent
    ? 'if (extensions !== undefined) throw Error("Empty virtual binding must be undefined");'
    : selected
      ? `if (Object.keys(extensions).sort().join(",") !== "lakebase_vector,vector") throw Error("Wrong virtual keys");
const api = extensions.lakebase_vector;
if (api.version !== "1.1.1" || api.schema !== ${JSON.stringify(placement)} || api.apiSupport.status !== "verified" || api.apiSupport.digest !== ${JSON.stringify(lakebaseVectorGeneratedDigest)}) throw Error("Wrong virtual identity");
if (api.companion.version !== "0.8.6" || api.companion.schema !== ${JSON.stringify(companionPlacement)} || api.companion.apiSupport.digest !== ${JSON.stringify(lakebaseVectorCompanionDigest)}) throw Error("Wrong virtual companion");
if (Object.keys(api.sql.overloads).length !== 64) throw Error("Incomplete virtual overloads");
api.quantize.rabitq4.fromVector([3, 1, 2]);`
      : 'if (extensions.lakebase_vector.apiSupport.status !== "unverified" || "quantize" in extensions.lakebase_vector) throw Error("Future binding invented an API");';
  const fields = selected
    ? `const fields = {
      q4: api.field.rabitq4(), q8: api.field.rabitq8(),
      sv: api.field.sphereVector(), sh: api.field.sphereHalfvec(),
      s4: api.field.sphereRabitq4(), s8: api.field.sphereRabitq8(),
      a4: api.arrayField.rabitq4(), a8: api.arrayField.rabitq8(),
      av: api.arrayField.sphereVector(), ah: api.arrayField.sphereHalfvec(),
      as4: api.arrayField.sphereRabitq4(), as8: api.arrayField.sphereRabitq8(),
    };
export default defineSchema(() => ({ values: defineTable(fields, { indexes: [{ fields: ["q4"], extension: api.indexes.ann.rabitq4.l2() }] }) }), { namespace: ${JSON.stringify(namespace)} });`
    : `export default defineSchema(() => ({}), { namespace: ${JSON.stringify(namespace)} });`;
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
${firstLoad}
${fields}\n`,
  );
  await mkdir(join(root, "kello/contracts"), { recursive: true });
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.unknown()) });\n`,
  );
  const handler = absent
    ? `const exact: undefined = context.extensions;
const effectExact: undefined = binding;
return { selection: ${JSON.stringify(selection)}, undefinedContext: exact === undefined && effectExact === undefined };`
    : !selected
      ? `const exact: "future" = context.extensions.lakebase_vector.version;
function compileOnly() {
// @ts-expect-error An unknown version has no native quantization helpers.
context.extensions.lakebase_vector.quantize;
// @ts-expect-error Effect exposes the same descriptor-only API.
binding.lakebase_vector.sql;
}
void compileOnly;
return { version: exact, unverified: binding.lakebase_vector.apiSupport.status === "unverified" };`
      : `const api = binding.lakebase_vector;
const exact: "1.1.1" = context.extensions.lakebase_vector.version;
const placement: ${JSON.stringify(placement)} = api.schema;
const companionPlacement: ${JSON.stringify(companionPlacement)} = api.companion.schema;
const companionVersion: "0.8.6" = context.extensions.vector.version;
void companionVersion;
function compileOnly() {
// @ts-expect-error Unselected families are absent in the RPC context.
context.extensions.pgcrypto;
// @ts-expect-error Unselected families are absent in the Effect context.
binding.pg_trgm;
// @ts-expect-error Quantization takes a vector, not arbitrary text.
api.quantize.rabitq4.fromVector("[3,1,2]");
}
void compileOnly;
const vector = [3, 1, 2];
const rows = await context.db.select({
  q4: api.quantize.rabitq4.fromVector(vector),
  q8: api.quantize.rabitq8.fromHalfvec(vector),
  dequantized: api.dequantize.toVector.rabitq4(api.quantize.rabitq4.fromVector(vector)),
  sphere: api.sphere.vector(vector, 0.5),
  within: api.withinCosine(vector, api.sphere.vector(vector, 0.5)),
  missing: api.quantize.rabitq4.fromVector(null),
}).from(sql.raw("(VALUES (1)) AS native_probe(id)"));
return { version: exact, placement, companionPlacement, effectSame: true, rows };`;
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions || binding !== selected) throw Error("Generated RPC/Effect/disk identity differs");
${handler}
}) });\n`,
  );
}

/** No emitter imports: inspect and execute the files written by generateProject. */
export async function checkLakebaseVectorDiskBindings(
  root: string,
  selection: LakebaseVectorSelection,
  placement = "extensions",
  companionPlacement = "extensions",
) {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  for (const forbidden of ["kello/tooling", "./schema", "./server", "kello.config", "kello/extensions/pgcrypto"])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  const rpc = await readFile(join(root, "kello/_generated/rpc.ts"), "utf8");
  assert(rpc.includes("createApplicationRpc") && rpc.includes("extensions"));
  if (selection === "empty" || selection === "omitted") {
    assert.equal(disk.extensions, undefined);
    assert(!source.includes("kello/extensions/"));
    return;
  }
  assert.deepEqual(
    Object.keys(disk.extensions).sort(),
    selection === "selected" ? ["lakebase_vector", "vector"] : ["lakebase_vector"],
  );
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.lakebase_vector;
  assert.equal(api.schema, placement);
  if (selection === "future") {
    assert.equal(api.version, "future");
    assert.equal(api.apiSupport.status, "unverified");
    assert.equal("quantize" in api, false);
    assert.equal("sql" in api, false);
    assert(!source.includes("kello/extensions/lakebase-vector"));
    return;
  }
  assert(source.includes('import { createLakebaseVector_1_1_1 } from "kello/extensions/lakebase-vector";'));
  assert(source.includes('createLakebaseVector_1_1_1(descriptors["lakebase_vector"], descriptors["vector"])'));
  assert.deepEqual(api.companion, {
    name: "vector",
    version: "0.8.6",
    schema: companionPlacement,
    apiSupport: { status: "verified", digest: lakebaseVectorCompanionDigest },
  });
  assert.deepEqual(
    [api.name, api.version, api.apiSupport],
    ["lakebase_vector", "1.1.1", { status: "verified", digest: lakebaseVectorGeneratedDigest }],
  );
  assert.equal(Object.keys(api.sql.overloads).length, 64);
  assert.equal(
    api.quantize.rabitq4.fromVector,
    api.sql.overloads["routine:$extension:lakebase_vector.quantize_to_rabitq4($extension:vector.vector)"],
  );
  assert.equal(Object.keys(api.field).length, 6);
  assert.equal(Object.keys(api.arrayField).length, 6);
  for (const family of ["ann", "annv0"])
    for (const type of ["vector", "halfvec", "rabitq4", "rabitq8"])
      for (const metric of ["l2", "ip", "cosine"]) {
        const index = api.indexes[family][type][metric]();
        assert.equal(index.method, family === "ann" ? "lakebase_ann" : "lakebase_annv0");
        assert.equal(index.schema, placement);
        assert.equal(index.input.schema, type === "vector" || type === "halfvec" ? companionPlacement : placement);
      }
}
