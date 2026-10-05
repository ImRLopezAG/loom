import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Executed during virtual first load, then typechecked against disk or packed declarations. */
export function btreeGinGeneratedSchema(placement: string) {
  return `import { defineSchema, defineTable } from "kello/server";
import { pgSchema } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { extensions } from "./_generated/extensions";
const api = extensions.btree_gin;
const placement: ${JSON.stringify(placement)} = api.schema;
const version: "1.3" = api.version;
if (Object.keys(api.indexes).length !== 29 || Object.keys(api.sql.functions).length !== 2 || api.schema !== placement) throw new Error("Wrong virtual BTREE_GIN contract");
const ordered = pgSchema('Native"Enums').enum("ordered", ["low", "middle", "high"]);
const numeric: SQL<number | null> = api.ginNumericCmp("9007199254740992.0001", "9007199254740992.0002");
const enumeration: SQL<number | null> = api.ginEnumCmp(ordered, "low", "high");
function typesOnly() {
  // @ts-expect-error Native-pointer routines are absent from application SQL.
  api.sql.functions.gin_extract_value_numeric("1", null);
  // @ts-expect-error Numeric values require exact decimals, not JavaScript numbers.
  api.ginNumericCmp(1, "2");
  // @ts-expect-error An enum argument cannot widen the native enum's label type.
  api.ginEnumCmp(ordered, "absent", "high");
  // @ts-expect-error Uncaptured class cannot be selected.
  api.indexes.jsonb();
  // @ts-expect-error Only the selected family is present.
  void extensions.btree_gist;
}


void [version, typesOnly, numeric, enumeration];
export default defineSchema((fields) => ({ entries: defineTable({ code: fields.integer(), label: fields.text() }, {
  indexes: [{ fields: ["code"], extension: api.indexes.int4() }, { fields: ["label"], extension: api.indexes.text() }],
}) }), { namespace: "app" });`;
}

/** These handlers are loaded by the generated application, including its mounted scope. */
export async function writeBtreeGinRpc(root: string) {
  const component = join(root, "kello/components/comparisons");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import comparisons from "./components/comparisons/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(comparisons); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "comparisons", extensions: { btree_gin: { versions: ["1.3"] } }, rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(component, "schema.ts"),
    'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.btree_gin.version !== "1.3") throw new Error("Wrong mounted selection"); export default defineSchema(() => ({}));',
  );
  const result =
    "v.object({ numeric: v.literal(-1), enumeration: v.literal(-1), nullNumeric: v.null(), nullEnum: v.null() })";
  await writeFile(
    join(component, "contracts/comparison.ts"),
    `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${result}) });`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ host: ${result}, child: ${result} })) });`,
  );
  const execute = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("BTREE_GIN RPC/Effect identity differs");
const api = binding.btree_gin;
const ordered = pgSchema("generated_gin_enums").enum("ordered", ["low", "middle", "high"]);
const rows = await context.db.select({ numeric: api.ginNumericCmp("9007199254740992.0001", "9007199254740992.0002"), enumeration: api.ginEnumCmp(ordered, "low", "high"), nullNumeric: api.ginNumericCmp(null, "1"), nullEnum: api.ginEnumCmp(ordered, null, "high") }).from(sql\`(SELECT 1) AS gin_input\`);
if (rows.length !== 1 || rows[0]?.numeric !== -1 || rows[0]?.enumeration !== -1 || rows[0]?.nullNumeric !== null || rows[0]?.nullEnum !== null) throw new Error("Native BTREE_GIN result differs");
const observed = { numeric: -1, enumeration: -1, nullNumeric: null, nullEnum: null } as const;`;
  const imports =
    'import { Effect } from "effect"; import { sql } from "drizzle-orm"; import { pgSchema } from "drizzle-orm/pg-core";';
  await writeFile(
    join(component, "functions/comparison.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; ${imports} export default os.comparison.router({ run: os.comparison.run.handler(async ({ context }) => { ${execute}\nreturn observed; }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; ${imports} export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => { ${execute}\nreturn { host: observed, child: await context.components.comparisons.rpc.comparison.run() }; }) });`,
  );
}
