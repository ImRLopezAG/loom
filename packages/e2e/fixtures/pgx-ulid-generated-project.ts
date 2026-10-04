import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Invoke ULID conversions through the generated host and mounted runtime. */
export async function writePgxUlidRpc(root: string) {
  const component = join(root, "kello/components/identifiers");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import identifiers from "./components/identifiers/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(identifiers); export default app;',
  );
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "identifiers", extensions: { pgx_ulid: { versions: ["0.2.2"] } }, rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(component, "schema.ts"),
    'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.pgx_ulid.version !== "0.2.2") throw new Error("Wrong mounted selection"); export default defineSchema(() => ({}));',
  );
  const result =
    'v.object({ generated: v.literal(true), uuid: v.literal("0186cb65-25d7-81da-815c-7e25a6bfe7db"), civil: v.literal("01GV5PA9EQ0000000000000000"), nullUuid: v.null() })';
  await writeFile(
    join(component, "contracts/identifier.ts"),
    `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${result}) });`,
  );
  await writeFile(
    join(root, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ host: ${result}, child: ${result} })) });`,
  );
  const execute = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("PGX_ULID RPC/Effect identity differs");
const api = binding.pgx_ulid;
const rows = await context.db.select({ generated: api.generate(), uuid: api.toUuid(ulid("01GV5PA9EQG7D82Q3Y4PKBZSYV")), civil: api.fromTimestamp(timestamp("2023-03-10 12:00:49.111")), nullUuid: api.toUuid(null) }).from(sql\`(SELECT 1) AS ulid_input\`);
if (rows.length !== 1 || !/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/.test(rows[0]?.generated ?? "") || rows[0]?.uuid !== "0186cb65-25d7-81da-815c-7e25a6bfe7db" || rows[0]?.civil !== "01GV5PA9EQ0000000000000000" || rows[0]?.nullUuid !== null) throw new Error("Native PGX_ULID result differs");
const observed = { generated: true, uuid: "0186cb65-25d7-81da-815c-7e25a6bfe7db", civil: "01GV5PA9EQ0000000000000000", nullUuid: null } as const;`;
  const imports =
    'import { Effect } from "effect"; import { sql } from "drizzle-orm"; import { ulid } from "kello/extensions/pgx-ulid"; import { timestamp } from "kello/extensions/timestamps";';
  await writeFile(
    join(component, "functions/identifier.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; ${imports} export default os.identifier.router({ run: os.identifier.run.handler(async ({ context }) => { ${execute}\nreturn observed; }) });`,
  );
  await writeFile(
    join(root, "kello/functions/tasks.ts"),
    `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; ${imports} export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => { ${execute}\nreturn { host: observed, child: await context.components.identifiers.rpc.identifier.run() }; }) });`,
  );
  await writeFile(
    join(root, "kello/ulid-types.ts"),
    'import { extensions } from "./_generated/extensions"; import { timestamp, timestamptz } from "kello/extensions/timestamps"; import type { SQL } from "drizzle-orm"; import type { Ulid } from "kello/extensions/pgx-ulid"; const converted: SQL<Ulid | null> = extensions.pgx_ulid.fromTimestamp(timestamp("2023-03-10 12:00:49.111")); function negatives() {\n// @ts-expect-error Only the selected underscore key exists.\nvoid extensions["pgx-ulid"];\n// @ts-expect-error Civil and instant identities remain distinct.\nextensions.pgx_ulid.fromTimestamp(timestamptz("1970-01-01 00:00:00Z")); } void [converted, negatives];',
  );
}
