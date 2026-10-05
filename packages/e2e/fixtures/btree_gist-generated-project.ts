import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Executed during virtual first load, then typechecked against disk or packed declarations. */
export function btreeGistGeneratedSchema(placement: string) {
  return `import { defineSchema, defineTable } from "kello/server";
import type { SQL } from "drizzle-orm";
import { timestamptz } from "kello/extensions/timestamps";
import { extensions } from "./_generated/extensions";
const api = extensions.btree_gist;
const placement: ${JSON.stringify(placement)} = api.schema;
const version: "1.8" = api.version;
if (Object.keys(api.indexes).length !== 26 || Object.keys(api.sql.functions).length !== 13 || Object.keys(api.sql.operators).length !== 12 || Object.keys(api.distance).length !== 12 || api.schema !== placement) throw new Error("Wrong virtual BTREE_GIST contract");
const money: SQL<string | null> = api.distance.money("1.50", "-3");
const days: SQL<number | null> = api.sql.functions.date_dist("2000-01-01", "2000-01-03");
const exact: SQL<bigint | null> = api.distance.int8(9007199254740993n, 0n);
const elapsed: SQL<string | null> = api.distance.timestamptz(timestamptz("2000-01-01 00:00:00+00"), null);
const strategy: SQL<number | null> = api.sql.functions.gist_translate_cmptype_btree(3);
function typesOnly() {
  // @ts-expect-error Native-pointer routines are absent from application SQL.
  api.sql.functions.gbt_int4_consistent(null, null);
  // @ts-expect-error Exact int8 distance cannot take JavaScript numbers.
  api.distance.int8(1, 2n);
  // @ts-expect-error Money is exact decimal text.
  api.distance.money(1.5, "2");
  // @ts-expect-error Uncaptured class cannot be selected.
  api.indexes.jsonb();
  // @ts-expect-error Only the selected family is present.
  void extensions.btree_gin;
}
void [version, typesOnly, money, days, exact, elapsed, strategy];
export default defineSchema((fields) => ({ entries: defineTable({ code: fields.integer(), label: fields.text() }, {
  indexes: [{ fields: ["code"], extension: api.indexes.int4() }, { fields: ["label"], extension: api.indexes.text() }],
}) }), { namespace: "app" });`;
}

/** RPC body reading the generated binding from invocation context and through the Effect Extensions service. */
export const btreeGistGeneratedFunctions = `import { Effect } from "effect";
import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== context.extensions) throw new Error("Effect and RPC bindings differ");
  return (await context.db.select({ label: context.tables.entries.label, gap: binding.btree_gist.distance.int4(context.tables.entries.code, 0) }).from(context.tables.entries).limit(100)).map((row) => row.label ?? "");
}) });`;

/** These handlers are loaded by the generated application, including its mounted scope. */
export async function writeBtreeGistRpc(root: string) {
  const component = join(root, "kello/components/comparisons");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import comparisons from "./components/comparisons/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(comparisons); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "comparisons", extensions: { btree_gist: { versions: ["1.8"] } }, rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(component, "schema.ts"),
    'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.btree_gist.version !== "1.8") throw new Error("Wrong mounted selection"); export default defineSchema(() => ({}));',
  );
  const result =
    'v.object({ exact: v.literal("9007199254740993"), money: v.literal("4.50"), nullDistance: v.null(), strategy: v.literal(3) })';
  await writeFile(
    join(component, "contracts/comparison.ts"),
    `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${result}) });`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ host: ${result}, child: ${result} })) });`,
  );
  const execute = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("BTREE_GIST RPC/Effect identity differs");
const api = binding.btree_gist;
const rows = await context.db.select({ exact: api.distance.int8(9007199254740993n, 0n), money: api.distance.money("1.50", "-3"), nullDistance: api.distance.int4(null, 1), strategy: api.sql.functions.gist_translate_cmptype_btree(3) }).from(sql\`(SELECT 1) AS gist_input\`);
if (rows.length !== 1 || rows[0]?.exact !== 9007199254740993n || rows[0]?.money !== "4.50" || rows[0]?.nullDistance !== null || rows[0]?.strategy !== 3) throw new Error("Native BTREE_GIST result differs");
const observed = { exact: "9007199254740993", money: "4.50", nullDistance: null, strategy: 3 } as const;`;
  const imports = 'import { Effect } from "effect"; import { sql } from "drizzle-orm";';
  await writeFile(
    join(component, "functions/comparison.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; ${imports} export default os.comparison.router({ run: os.comparison.run.handler(async ({ context }) => { ${execute}\nreturn observed; }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; ${imports} export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => { ${execute}\nreturn { host: observed, child: await context.components.comparisons.rpc.comparison.run() }; }) });`,
  );
}
