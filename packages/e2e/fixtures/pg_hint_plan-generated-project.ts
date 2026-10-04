import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** These project files import only public package exports and real generated modules. */
export async function writePgHintPlanProjectFiles(root: string) {
  const child = join(root, "kello/components/planner");
  await mkdir(join(child, "contracts"), { recursive: true });
  await mkdir(join(child, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { pg_hint_plan: { version: "1.8.0", schema: "hint_plan" }, pg_trgm: { version: "1.6", schema: "host_text" } } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    `import { defineApplication } from "kello/server";
import planner from "./components/planner/setup";
const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(planner); export default app;`,
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema } from "kello/server";
import type { SQL } from "drizzle-orm";
import { extensions } from "./_generated/extensions";
const api = extensions.pg_hint_plan;
const version: "1.8.0" = api.version;
const placement: "hint_plan" = api.schema;
const queryId: SQL<bigint> = api.hintRows("h").columns.query_id;
const application: SQL<string> = api.hintRows("h").columns.application_name;
if (api.version !== version || api.schema !== placement || Object.keys(api.sql.functions).length !== 0) throw new Error("Wrong virtual pg_hint_plan binding");
function compileOnly() {
  // @ts-expect-error Unselected family is absent.
  void extensions.vector;
  // @ts-expect-error Hint writes are operator metadata, not callable query SQL.
  api.upsertHint({ queryId: 1n, applicationName: "", hints: "SeqScan(t)" });
}
void [queryId, application, compileOnly];
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
  );
  await writeFile(
    join(child, "setup.ts"),
    `import { defineComponent } from "./_generated/setup";
export default defineComponent({ name: "planner", extensions: { pg_hint_plan: { versions: ["1.8.0"] } }, rpc: ({ os }) => ({ os }) });`,
  );
  await writeFile(
    join(child, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "pg_hint_plan" || extensions.pg_hint_plan.schema !== "hint_plan") throw new Error("Wrong component pg_hint_plan subset");
function compileOnly() {
  // @ts-expect-error The component receives only its declared family.
  void extensions.pg_trgm;
}
void compileOnly;
export default defineSchema(() => ({}));`,
  );
  await writeFile(
    join(child, "contracts/status.ts"),
    `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot";
export default defineContract({ get: oc.output(v.literal("1.8.0")) });`,
  );
  await writeFile(
    join(child, "functions/status.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect";
export default os.status.router({ get: os.status.get.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC/Effect binding identity mismatch");
const version: "1.8.0" = context.extensions.pg_hint_plan.version;
return version;
}) });`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot";
export default defineContract({ list: oc.output(v.array(v.string())) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC/Effect binding identity mismatch");
const version: "1.8.0" = binding.pg_hint_plan.version;
const placement: "hint_plan" = context.extensions.pg_hint_plan.schema;
const child: "1.8.0" = await context.components.planner.rpc.status.get();
return [version, placement, child];
}) });`,
  );
}
