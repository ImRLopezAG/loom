import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** These project files import only public package exports and real generated modules. */
export async function writeTimescaledbProjectFiles(root: string, placement: string) {
  const child = join(root, "kello/components/series");
  await mkdir(join(child, "contracts"), { recursive: true });
  await mkdir(join(child, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ database: { extensions: { timescaledb: { version: "2.24.0"${placement === "extensions" ? "" : `, schema: ${JSON.stringify(placement)}`} }, pg_trgm: { version: "1.6", schema: "host_text" } } } });`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    `import { defineApplication } from "kello/server";
import series from "./components/series/setup";
const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(series); export default app;`,
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema } from "kello/server";
import type { SQL } from "drizzle-orm";
import { extensions } from "./_generated/extensions";
const api = extensions.timescaledb;
const version: "2.24.0" = api.version;
const placement: ${JSON.stringify(placement)} = api.schema;
const bucket: SQL<bigint | null> = api.timeBucket.int8(10n, 15n);
const size: SQL<bigint | null> = api.hypertableSize({ schema: "app", name: "tasks" });
if (api.version !== version || api.schema !== placement || Object.keys(api.timeBucket).length !== 20) throw new Error("Wrong virtual TimescaleDB binding");
function compileOnly() {
  // @ts-expect-error Unselected family is absent.
  void extensions.vector;
  // @ts-expect-error Operator DDL is not callable query SQL.
  api.createHypertable({ schema: "app", name: "tasks" });
  // @ts-expect-error TSL gapfill is not advertised under Apache.
  void api.timeBucketGapfill;
  // @ts-expect-error int8 buckets take bigint.
  api.timeBucket.int8(10, 15);
}
void [bucket, size, compileOnly];
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
  );
  await writeFile(
    join(child, "setup.ts"),
    `import { defineComponent } from "./_generated/setup";
export default defineComponent({ name: "series", extensions: { timescaledb: { versions: ["2.24.0"] } }, rpc: ({ os }) => ({ os }) });`,
  );
  await writeFile(
    join(child, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "timescaledb" || extensions.timescaledb.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong component TimescaleDB subset");
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
export default defineContract({ get: oc.output(v.literal("2.24.0")) });`,
  );
  await writeFile(
    join(child, "functions/status.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect";
export default os.status.router({ get: os.status.get.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC/Effect binding identity mismatch");
const version: "2.24.0" = context.extensions.timescaledb.version;
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
const version: "2.24.0" = binding.timescaledb.version;
const placement: ${JSON.stringify(placement)} = context.extensions.timescaledb.schema;
const child: "2.24.0" = await context.components.series.rpc.status.get();
return [version, placement, child];
}) });`,
  );
}
