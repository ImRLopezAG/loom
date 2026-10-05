import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "bun:test";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations, sql } from "drizzle-orm";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import {
  createProjectProcedures,
  createProjectServices,
  defineSchema,
  Invocation,
  connectDatabase,
} from "kello/server";
import { timestamp, timestamptz } from "kello/extensions/timestamps";
import { extensionProofTest } from "../fixtures/extension-proof";
import { pgxUlidGenerationProofCase } from "../fixtures/pgx-ulid-proof-cases";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { writePgxUlidRpc } from "../fixtures/pgx-ulid-generated-project";
import { runPgxUlidGeneratedRuntime } from "../fixtures/pgx-ulid-generated-runtime";

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-selected-pgx-ulid-"));
  try {
    await initializeProject(root, "selectedulid");
    await mkdir(join(root, "node_modules"));
    for (const name of ["kello", "valibot", "drizzle-orm", "effect", "@orpc/server", "pg"]) {
      await mkdir(join(root, "node_modules", name, ".."), { recursive: true });
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    }
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

async function checkFixtureTypes(root: string) {
  const process = Bun.spawn(
    [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
    { stdout: "pipe", stderr: "pipe" },
  );
  const output = (await new Response(process.stdout).text()) + (await new Response(process.stderr).text());
  assert.equal(await process.exited, 0, output);
}

extensionProofTest(
  pgxUlidGenerationProofCase,
  async () => {
    const root = await projectFixture();
    try {
      await writeFile(
        join(root, "kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pgx_ulid: { version: "0.2.2", schema: "identifiers_ulid" } } } });',
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
const ulid = extensions.pgx_ulid;
export default defineSchema((s) => ({ tasks: defineTable({ title: s.text().notNull(), key: ulid.field() }, { indexes: [{ fields: ["key"], extension: ulid.indexes.btree() }] }) }), { namespace: "app" });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc";
import { timestamp, timestamptz } from "kello/extensions/timestamps";
import { ulid, type Ulid } from "kello/extensions/pgx-ulid";
import type { SQL } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "0.2.2" = context.extensions.pgx_ulid.version;
const converted: SQL<Ulid | null> = context.extensions.pgx_ulid.fromTimestamp(timestamp("2023-03-10 12:00:49.111"));
context.extensions.pgx_ulid.toUuid(ulid("01GV5PA9EQG7D82Q3Y4PKBZSYV"));
// @ts-expect-error Only the selected underscore extension key exists.
void context.extensions["pgx-ulid"];
// @ts-expect-error Civil and instant input identities remain distinct.
context.extensions.pgx_ulid.fromTimestamp(timestamptz("1970-01-01 00:00:00Z"));
void converted;
return [version]; }) });`,
      );
      const component = join(root, "kello/components/identifiers");
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(component, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "identifiers", extensions: { pgx_ulid: { versions: ["0.2.2"] } }, rpc: ({ os }) => ({ os }) });',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import identifiers from "./components/identifiers/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(identifiers); export default app;',
      );
      await writeFile(
        join(component, "schema.ts"),
        'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.pgx_ulid.schema !== "identifiers_ulid") throw new Error("Wrong mounted selection"); extensions.pgx_ulid.generate(); export default defineSchema(() => ({}));',
      );
      await writePgxUlidRpc(root);
      await loadProject(root);
      const generated = await generateProject(root);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["pgx_ulid"]);
      expect(Object.keys(disk.extensions.pgx_ulid.sql.functions)).toHaveLength(18);
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      expect(Object.keys(child.extensions)).toEqual(["pgx_ulid"]);
      expect(child.extensions.pgx_ulid.schema).toBe("identifiers_ulid");
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      await withExtensionDatabase(async (url) => {
        const schema = defineSchema(() => ({}));
        const relations = defineRelations(schema.tables);
        const connection = await connectDatabase({ schema, relations, connectionString: url });
        try {
          await connection.db.execute(
            sql`create schema identifiers_ulid; create extension pgx_ulid with schema identifiers_ulid version '0.2.2'`,
          );
          const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
          const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
          const handler = procedure.handler(async ({ context }) => {
            const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
            expect(effectBinding).toBe(context.extensions);
            const api = effectBinding.pgx_ulid;
            return connection.transaction(async (db) => {
              await db.execute(sql`select set_config('TimeZone','UTC',true),set_config('DateStyle','ISO,YMD',true)`);
              return db
                .select({
                  generated: api.generate(),
                  civil: api.toTimestamp("01GV5PA9EQG7D82Q3Y4PKBZSYV"),
                  instant: api.toTimestamptz("01GV5PA9EQG7D82Q3Y4PKBZSYV"),
                  fromCivil: api.fromTimestamp(timestamp("2023-03-10 12:00:49.111")),
                  fromInstant: api.fromTimestamptz(timestamptz("2023-03-10 17:45:49.111+05:45")),
                  uuid: api.toUuid("01gv5pa9eqg7d82q3y4pkbzsyv"),
                })
                .from(sql`(values (1)) fixture(id)`);
            });
          });
          const invocation = { requestId: "selected-ulid", identity: null, signal: new AbortController().signal };
          const [row] = await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          });
          expect(row!.generated).toMatch(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
          expect(row!.civil).toEqual({ type: "timestamp", text: "2023-03-10 12:00:49.111000" });
          expect(row!.instant).toEqual({ type: "timestamptz", text: "2023-03-10 12:00:49.111000+00" });
          expect(row!.fromCivil).toBe("01GV5PA9EQ0000000000000000");
          expect(row!.fromInstant).toBe("01GV5PA9EQ0000000000000000");
          expect(row!.uuid).toBe("0186cb65-25d7-81da-815c-7e25a6bfe7db");
        } finally {
          await connection.close();
        }
        await runPgxUlidGeneratedRuntime(root, generated.version, "identifiers_ulid", url);
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
