import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** These project files import only public package exports and real generated modules. */
export async function writePgRepackProjectFiles(root: string, placement: string) {
  const child = join(root, "kello/components/planner");
  await mkdir(join(child, "contracts"), { recursive: true });
  await mkdir(join(child, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { pg_repack: { version: "1.5.2"${placement === "extensions" ? "" : `, schema: ${JSON.stringify(placement)}`} } } } });`,
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
const api = extensions.pg_repack;
const version: "1.5.2" = api.version;
const placement: ${JSON.stringify(placement)} = api.schema;
const library: SQL<string> = api.libraryVersion();
const text: SQL<string> = api.oid2text(1);
if (api.version !== version || api.schema !== placement || Object.keys(api.sql.functions).length !== 17) throw new Error("Wrong virtual pg_repack binding");
function compileOnly() {
  // @ts-expect-error Unselected family is absent.
  void extensions.vector;
  // @ts-expect-error Stateful operation is not callable query SQL.
  api.createTable(1, "pg_default");
  // @ts-expect-error Wrong oid argument.
  api.oid2text("1");
}
void [library, text, compileOnly];
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() }, snapshots: { keys: api.primaryKeyField(), tables: api.tableField(), keyLists: api.primaryKeyArrayField(), tableLists: api.tableArrayField() } }), { namespace: "app" });`,
  );
  await writeFile(
    join(child, "setup.ts"),
    `import { defineComponent } from "./_generated/setup";
export default defineComponent({ name: "planner", extensions: { pg_repack: { versions: ["1.5.2"] } }, rpc: ({ os }) => ({ os }) });`,
  );
  await writeFile(
    join(child, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "pg_repack" || extensions.pg_repack.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong component pg_repack subset");
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
export default defineContract({ get: oc.output(v.literal("1.5.2")) });`,
  );
  await writeFile(
    join(child, "functions/status.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect";
export default os.status.router({ get: os.status.get.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC/Effect binding identity mismatch");
const version: "1.5.2" = context.extensions.pg_repack.version;
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
const version: "1.5.2" = binding.pg_repack.version;
const placement: ${JSON.stringify(placement)} = context.extensions.pg_repack.schema;
const child: "1.5.2" = await context.components.planner.rpc.status.get();
return [version, placement, child];
}) });`,
  );
}
