import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const kinds = ["ip4", "ip4r", "ip6", "ip6r", "ipaddress", "iprange"] as const;

/** Use public generated bindings during the first virtual load and subsequent disk loads. */
export async function writeIp4rProject(root: string, mode: "omitted" | "empty" | "future" | "selected" | "custom") {
  const schema = mode === "custom" ? "ip4r_custom" : "extensions";
  const selected = mode === "selected" || mode === "custom";
  const version = mode === "future" ? "future" : "2.4";
  const descriptor = mode === "custom" ? { version, schema } : { version };
  const extensions = mode === "omitted" ? undefined : mode === "empty" ? {} : { ip4r: descriptor };
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${JSON.stringify(extensions === undefined ? {} : { database: { extensions } })});`,
  );
  if (!selected) {
    await writeFile(
      join(root, "kello/schema.ts"),
      'import { defineSchema, defineTable } from "kello/server"; export default defineSchema((fields) => ({ tasks: defineTable({ title: fields.text().notNull() }, { publicFields: ["_id", "title"] }) }), { namespace: "app" });',
    );
    await writeFile(
      join(root, "kello/selection-types.ts"),
      mode === "future"
        ? 'import { extensions } from "./_generated/extensions"; const future: "future" = extensions.ip4r.version;\n// @ts-expect-error An unverified descriptor has no invented SQL.\nextensions.ip4r.sql; void future;'
        : 'import { extensions } from "./_generated/extensions"; const absent: undefined = extensions; void absent;',
    );
    return { schema, selected };
  }
  const component = join(root, "kello/components/addresses");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"));
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import addresses from "./components/addresses/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(addresses); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "addresses", extensions: { ip4r: { versions: ["2.4"] } }, rpc: ({ os }) => ({ os }) });',
  );
  const schemaSource = `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.ip4r;
if (api.version !== "2.4" || api.schema !== ${JSON.stringify(schema)} || Object.keys(api.sql.overloads).length !== 341) throw new Error("Incorrect IP4R selection");
export default defineSchema(() => ({ entries: defineTable({
${kinds.flatMap((kind) => [`  ${kind}: api.${kind}.field(),`, `  ${kind}s: api.${kind}.arrayField(),`]).join("\n")}
}) }), { namespace: "app" });`;
  await writeFile(join(root, "kello/schema.ts"), schemaSource);
  await writeFile(join(component, "schema.ts"), schemaSource.replace(', { namespace: "app" }', ""));
  const result =
    'v.object({ version: v.literal("2.4"), schema: v.literal(' +
    JSON.stringify(schema) +
    "), equal: v.literal(true), comparison: v.literal(-1) })";
  await writeFile(
    join(component, "contracts/address.ts"),
    `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${result}) });`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ host: ${result}, child: ${result} })) });`,
  );
  const execute = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("IP4R RPC/Effect identity differs");
const api = binding.ip4r;
const rows = await context.db.select({ equal: api.ip4.equal(api.ip4.value("192.0.2.10"), api.ip4.value("192.0.2.10")), comparison: api.sql.functions.ip4_cmp.ip4_ip4(api.ip4.value("192.0.2.10"), api.ip4.value("192.0.2.20")) }).from(sql\`(SELECT 1) AS ip4r_input\`);
if (rows.length !== 1 || rows[0]?.equal !== true || rows[0]?.comparison !== -1) throw new Error("Native IP4R result differs");
const observed = { version: api.version, schema: ${JSON.stringify(schema)}, equal: true, comparison: -1 } as const;`;
  await writeFile(
    join(component, "functions/address.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql } from "drizzle-orm"; export default os.address.router({ run: os.address.run.handler(async ({ context }) => { ${execute}\nreturn observed; }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql } from "drizzle-orm"; export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => { ${execute}\nreturn { host: observed, child: await context.components.addresses.rpc.address.run() }; }) });`,
  );
  await writeFile(
    join(root, "kello/selection-types.ts"),
    `import { extensions } from "./_generated/extensions";
const version: "2.4" = extensions.ip4r.version;
const schema: ${JSON.stringify(schema)} = extensions.ip4r.schema;
function negativeTypes() {
// @ts-expect-error A differently typed address cannot enter an IPv4 comparison.
extensions.ip4r.ip4.equal(extensions.ip4r.ip6.value("2001:db8::1"), extensions.ip4r.ip4.value("192.0.2.1"));
// @ts-expect-error Unselected families remain absent.
extensions.vector;
}
void [version, schema, negativeTypes];`,
  );
  return { schema, selected };
}

export async function checkIp4rDisk(root: string, schema: string) {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  assert(source.includes('from "kello/extensions/ip4r"'));
  assert(!source.includes("kello/tooling"));
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["ip4r"]);
  assert.equal(disk.extensions.ip4r.schema, schema);
  assert.equal(Object.keys(disk.extensions.ip4r.sql.overloads).length, 341);
  const hostSchema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
  const required = hostSchema.metadata.extensionRequirements.map((item: { member: string }) => item.member);
  assert.deepEqual(
    required.sort(),
    kinds
      .flatMap((kind) => [
        `type:$extension:ip4r.${kind}`,
        `type:$extension:ip4r._${kind}`,
        `operator:$extension:ip4r.=($extension:ip4r.${kind},$extension:ip4r.${kind})`,
        `operator:$extension:ip4r.<>($extension:ip4r.${kind},$extension:ip4r.${kind})`,
      ])
      .sort(),
  );
  const child = await import(pathToFileURL(join(root, "kello/components/addresses/_generated/extensions.ts")).href);
  assert.equal(child.extensions.ip4r.schema, schema);
}
