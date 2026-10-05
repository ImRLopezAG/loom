import { bloomGenerationProofCase } from "../fixtures/bloom-proof-cases";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { fuzzystrmatchGenerationProofCase } from "../fixtures/fuzzystrmatch-proof-cases";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "bun:test";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations, sql } from "drizzle-orm";
import { bootstrapDatabase, generateProject, initializeProject, loadProject } from "kello/tooling";
import {
  createProjectProcedures,
  createProjectServices,
  createRpcRuntime,
  defineRpcAuth,
  defineSchema,
  Invocation,
  connectDatabase,
} from "kello/server";
import pg from "pg";
import { timestamp, timestamptz } from "kello/extensions/timestamps";
import { extensionProofTest } from "../fixtures/extension-proof";
import { unaccentGenerationProofCase } from "../fixtures/unaccent-proof-cases";
import { uuidOsspGenerationProofCase } from "../fixtures/uuid-ossp-proof-cases";
import { pgJsonschemaGenerationProofCase } from "../fixtures/pg-jsonschema-proof-cases";
import { jsonValue, jsonbValue } from "kello/extensions/pg-jsonschema";
import { pgUuidv7GenerationProofCase } from "../fixtures/pg-uuidv7-proof-cases";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { withExtensionDatabase } from "../fixtures/extension-database";

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-selected-adapter-"));
  try {
    await initializeProject(root, "selectedadapter");
    await mkdir(join(root, "node_modules"));
    for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    await writeFile(
      join(root, "kello/app.config.ts"),
      'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
    );
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

async function verifyRuntimePrincipal(connectionString: string, runtimeRole: string) {
  const principal = new pg.Client({ connectionString });
  try {
    await principal.connect();
    assert.deepEqual(
      (
        await principal.query(
          "SELECT current_user AS name, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_catalog.pg_roles WHERE rolname=current_user",
        )
      ).rows,
      [
        {
          name: runtimeRole,
          rolcanlogin: true,
          rolsuper: false,
          rolcreatedb: false,
          rolcreaterole: false,
          rolreplication: false,
          rolbypassrls: false,
        },
      ],
      "Generated RPC must use its independent non-administrative runtime principal",
    );
  } finally {
    await principal.end();
  }
}

async function restrictedRuntimeConnection(
  client: pg.Client,
  preparationConnection: string,
  runtimeRole: string,
  namespaces: readonly string[],
) {
  assert.deepEqual(
    (
      await client.query(
        "SELECT rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls AS administrative FROM pg_catalog.pg_roles WHERE rolname=$1",
        [runtimeRole],
      )
    ).rows,
    [{ administrative: false }],
    "Bootstrap must create a non-administrative runtime role",
  );
  const password = randomBytes(32).toString("hex");
  await client.query(`ALTER ROLE ${pg.escapeIdentifier(runtimeRole)} LOGIN PASSWORD ${pg.escapeLiteral(password)}`);
  for (const namespace of namespaces)
    await client.query(
      `GRANT USAGE ON SCHEMA ${pg.escapeIdentifier(namespace)} TO ${pg.escapeIdentifier(runtimeRole)}`,
    );
  const address = new URL(preparationConnection);
  address.username = runtimeRole;
  address.password = password;
  await verifyRuntimePrincipal(address.href, runtimeRole);
  return address.href;
}

async function withRestrictedExtensionDatabase(
  namespaces: readonly string[],
  prepareSql: string,
  operation: (runtimeConnection: string) => Promise<void>,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    const runtimeRole = `gen_scalar_${crypto.randomUUID().replaceAll("-", "")}`;
    try {
      await client.connect();
      await client.query(prepareSql);
      await bootstrapDatabase({
        connectionString: url,
        metadataNamespace: `loom_scalar_${crypto.randomUUID().replaceAll("-", "")}`,
        runtimeRole,
      });
      await operation(await restrictedRuntimeConnection(client, url, runtimeRole, namespaces));
    } finally {
      try {
        const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
        if (exists.rows.length)
          await client.query(
            `GRANT ${pg.escapeIdentifier(runtimeRole)} TO CURRENT_USER; DROP OWNED BY ${pg.escapeIdentifier(runtimeRole)}; DROP ROLE ${pg.escapeIdentifier(runtimeRole)}`,
          );
      } finally {
        await client.end();
      }
    }
  });
}

extensionProofTest(
  unaccentGenerationProofCase,
  async () => {
    for (const placement of ["extensions", "project_accents"] as const) {
      const root = await projectFixture();
      try {
        const directory = join(root, "kello/components/normalize");
        await mkdir(join(directory, "contracts"), { recursive: true });
        await mkdir(join(directory, "functions"));
        const selected = placement === "extensions" ? { version: "1.1" } : { version: "1.1", schema: placement };
        await writeFile(
          join(root, "kello.config.ts"),
          `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { unaccent: ${JSON.stringify(selected)}, pg_trgm: { version: "1.6", schema: "host_text" } } } });`,
        );
        await writeFile(
          join(root, "kello/schema.ts"),
          `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
import type { SQL } from "drizzle-orm";
const nullable: SQL<string | null> = extensions.unaccent.unaccent(null);
if (extensions.unaccent.version !== "1.1" || extensions.unaccent.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual Unaccent binding");
void nullable;
export default defineSchema(() => ({}), { namespace: "app" });`,
        );
        await writeFile(
          join(directory, "setup.ts"),
          'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "normalize", extensions: { unaccent: { versions: ["1.1"] } }, rpc: ({ os }) => ({ os }) });',
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import { defineApplication } from "kello/server"; import normalize from "./components/normalize/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(normalize); export default app;',
        );
        await writeFile(
          join(directory, "schema.ts"),
          `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
extensions.unaccent.unaccent(extensions.unaccent.dictionary, null);
if (Object.keys(extensions).join(",") !== "unaccent" || extensions.unaccent.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual component subset");
export default defineSchema(() => ({}));`,
        );
        const normalizationOutput = `v.object({ implicit: v.nullable(v.string()), explicit: v.nullable(v.string()), missing: v.nullable(v.string()), version: v.literal("1.1"), placement: v.literal(${JSON.stringify(placement)}) })`;
        await writeFile(
          join(directory, "contracts/normalization.ts"),
          `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${normalizationOutput}) });`,
        );
        await writeFile(
          join(root, "kello/contracts/tasks.ts"),
          `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; const result = ${normalizationOutput}; export default defineContract({ list: oc.output(v.object({ root: result, child: result })) });`,
        );
        const nativeHandler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Generated RPC and Effect Unaccent differ");
const version: "1.1" = binding.unaccent.version;
const placement: ${JSON.stringify(placement)} = context.extensions.unaccent.schema;
const nullable: SQL<string | null> = binding.unaccent.unaccent(null);
const [row] = await context.db.select({ implicit: context.extensions.unaccent.unaccent("Æther Hôtel"), explicit: binding.unaccent.sql.functions.unaccent(binding.unaccent.dictionary, "Æther Hôtel"), missing: nullable }).from(sql.raw("(values (1)) fixture(id)"));
if (!row) throw new Error("Missing native Unaccent result");
const result = { ...row, version, placement };`;
        await writeFile(
          join(directory, "functions/normalization.ts"),
          `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { Effect } from "effect"; import { sql, type SQL } from "drizzle-orm";
export default os.normalization.router({ run: os.normalization.run.handler(async ({ context }) => {
${nativeHandler}
// @ts-expect-error The mounted component receives only its declared host subset.
void context.extensions.pg_trgm;
return result; }) });`,
        );
        await writeFile(
          join(root, "kello/functions/tasks.ts"),
          `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { extensions } from "../_generated/extensions";
import { Effect } from "effect"; import { sql, type SQL } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${nativeHandler}
return { root: result, child: await context.components.normalize.rpc.normalization.run() }; }) });
function compileOnly() {
// @ts-expect-error Unselected adapters remain absent from the generated root selection.
void import("../_generated/extensions").then(({ extensions }) => extensions.citext);
// @ts-expect-error SQL NULL is part of the public result contract.
const required: SQL<string> = extensions.unaccent.unaccent(null);
void required;
}
void compileOnly;`,
        );
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await assert.rejects(readFile(join(directory, "_generated/extensions.ts")), { code: "ENOENT" });
        const first = await loadProject(root);
        expect(first.config.database.extensions?.unaccent).toEqual({ version: "1.1", schema: placement });
        const virtual = projectRuntimeGraph(first).scopes.find((scope) => scope.name === "normalize");
        assert(virtual && "extensions" in virtual);
        expect(Object.keys(virtual.extensions!)).toEqual(["unaccent"]);
        const generated = await generateProject(root);
        const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
        const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
        expect(server.extensions).toBe(disk.extensions);
        expect(Object.keys(disk.extensions)).toEqual(["pg_trgm", "unaccent"]);
        expect(disk.extensions.unaccent.version).toBe("1.1");
        expect(disk.extensions.unaccent.schema).toBe(placement);
        expect(disk.extensions.unaccent.unaccent).toBe(disk.extensions.unaccent.sql.functions.unaccent);
        const childSource = await readFile(join(directory, "_generated/extensions.ts"), "utf8");
        expect(childSource).toContain('from "kello/extensions/unaccent"');
        expect(childSource).not.toContain("pg_trgm");
        expect(childSource).not.toContain("tooling/extensions");
        await checkFixtureTypes(root);
        expect((await generateProject(root)).version).toBe(generated.version);
        const { runtimeOptions } = await import(
          pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
        );
        const options = runtimeOptions();
        const mounted = options.scopes.find((scope: { name: string }) => scope.name === "normalize");
        expect(Object.keys(mounted.extensions)).toEqual(["unaccent"]);
        expect(mounted.extensions.unaccent.schema).toBe(placement);
        await withExtensionDatabase(async (url) => {
          const client = new pg.Client({ connectionString: url });
          await client.connect();
          const runtimeRole = `gen_unaccent_${crypto.randomUUID().replaceAll("-", "")}`;
          let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
          try {
            const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
            assert.match((await client.query("SHOW server_version_num")).rows[0]!.server_version_num, /^18\d{4}$/);
            await client.query(
              `CREATE SCHEMA ${quote(placement)}; CREATE EXTENSION unaccent WITH SCHEMA ${quote(placement)} VERSION '1.1'; CREATE SCHEMA host_text; CREATE EXTENSION pg_trgm WITH SCHEMA host_text VERSION '1.6'`,
            );
            await bootstrapDatabase({
              connectionString: url,
              metadataNamespace: options.metadataNamespace,
              runtimeRole,
            });
            const runtimeConnectionString = await restrictedRuntimeConnection(client, url, runtimeRole, [
              placement,
              "host_text",
            ]);
            runtime = await createRpcRuntime({
              ...options,
              connectionString: runtimeConnectionString,
              deployment: "generated-unaccent",
              auth: defineRpcAuth({ authorize: async () => {} }),
              assertActive: async (signal) => signal.throwIfAborted(),
            });
            const route = getRouter(runtime.router, ["tasks", "list"]);
            assert(route instanceof Procedure);
            const invocation = {
              requestId: "generated-unaccent",
              identity: null,
              signal: new AbortController().signal,
            };
            const actual = await call(route, undefined, {
              context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
              path: ["tasks", "list"],
            });
            const native = await client.query(
              `SELECT ${quote(placement)}.unaccent($1::text) AS implicit, ${quote(placement)}.unaccent(pg_catalog.format('%I.%I',$2::text,'unaccent')::pg_catalog.regdictionary,$1::text) AS explicit, ${quote(placement)}.unaccent(NULL::text) AS missing`,
              ["Æther Hôtel", placement],
            );
            expect(native.rows).toEqual([{ implicit: "AEther Hotel", explicit: "AEther Hotel", missing: null }]);
            const expected = { ...native.rows[0], version: "1.1", placement };
            expect(actual).toEqual({ root: expected, child: expected });
          } finally {
            try {
              await runtime?.stop();
            } finally {
              try {
                const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
                if (exists.rows.length)
                  await client.query(
                    `GRANT "${runtimeRole}" TO CURRENT_USER; DROP OWNED BY "${runtimeRole}"; DROP ROLE "${runtimeRole}"`,
                  );
              } finally {
                await client.end();
              }
            }
          }
        });
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  240000,
);

extensionProofTest(
  pgUuidv7GenerationProofCase,
  async () => {
    const root = await projectFixture();
    try {
      await writeFile(
        join(root, "kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_uuidv7: { version: "1.6", schema: "identifiers_v7" } } } });',
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
extensions.pg_uuidv7.v7();
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc";
import { timestamp, timestamptz } from "kello/extensions/timestamps";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "1.6" = context.extensions.pg_uuidv7.version;
context.extensions.pg_uuidv7.fromTimestamp(timestamp("1970-01-01 00:00:00.123456"), true);
// @ts-expect-error Only the selected underscore extension key exists.
void context.extensions["pg-uuidv7"];
// @ts-expect-error Civil and instant input identities remain distinct.
context.extensions.pg_uuidv7.fromTimestamp(timestamptz("1970-01-01 00:00:00Z"), true);
return [version]; }) });`,
      );
      const component = join(root, "kello/components/temporal");
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(component, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "temporal", extensions: { pg_uuidv7: { versions: ["1.6"] } }, rpc: ({ os }) => ({ os }) });',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import temporal from "./components/temporal/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(temporal); export default app;',
      );
      await writeFile(
        join(component, "schema.ts"),
        'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.pg_uuidv7.schema !== "identifiers_v7") throw new Error("Wrong mounted selection"); extensions.pg_uuidv7.v7(); export default defineSchema(() => ({}));',
      );
      await loadProject(root);
      const generated = await generateProject(root);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["pg_uuidv7"]);
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      expect(Object.keys(child.extensions)).toEqual(["pg_uuidv7"]);
      expect(child.extensions.pg_uuidv7.schema).toBe("identifiers_v7");
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      await withRestrictedExtensionDatabase(
        ["identifiers_v7"],
        "CREATE SCHEMA identifiers_v7; CREATE EXTENSION pg_uuidv7 WITH SCHEMA identifiers_v7 VERSION '1.6'",
        async (url) => {
          const schema = defineSchema(() => ({}));
          const relations = defineRelations(schema.tables);
          const connection = await connectDatabase({ schema, relations, connectionString: url });
          try {
            const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
            const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
            const handler = procedure.handler(async ({ context }) => {
              const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
              expect(effectBinding).toBe(context.extensions);
              return connection.transaction((db) =>
                db
                  .select({
                    generated: effectBinding.pg_uuidv7.v7(),
                    civil: effectBinding.pg_uuidv7.toTimestamp("00000000-007b-7000-8000-000000000000"),
                    instant: effectBinding.pg_uuidv7.toTimestamptz("00000000-007b-7000-8000-000000000000"),
                    fromCivil: effectBinding.pg_uuidv7.fromTimestamp(timestamp("1970-01-01 00:00:00.123456"), true),
                    fromInstant: effectBinding.pg_uuidv7.fromTimestamptz(
                      timestamptz("1970-01-01 05:30:00.123456+05:30"),
                      true,
                    ),
                  })
                  .from(sql`(values (1)) fixture(id)`),
              );
            });
            const invocation = { requestId: "selected-v7", identity: null, signal: new AbortController().signal };
            const [row] = await call(handler, undefined, {
              context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
            });
            expect(row!.generated).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
            expect(row!.civil).toEqual({ type: "timestamp", text: "1970-01-01 00:00:00.123000" });
            expect(row!.instant).toEqual({ type: "timestamptz", text: "1970-01-01 00:00:00.123000+00" });
            expect(row!.fromCivil).toBe("00000000-007b-7000-8000-000000000000");
            expect(row!.fromInstant).toBe("00000000-007b-7000-8000-000000000000");
          } finally {
            await connection.close();
          }
        },
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  30000,
);

extensionProofTest(
  pgJsonschemaGenerationProofCase,
  async () => {
    const root = await projectFixture();
    try {
      await writeFile(
        join(root, "kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_jsonschema: { version: "0.3.4", schema: "json_validators" } } } });',
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
extensions.pg_jsonschema.isValid(null);
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc";
import { jsonValue, jsonbValue } from "kello/extensions/pg-jsonschema";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "0.3.4" = context.extensions.pg_jsonschema.version;
context.extensions.pg_jsonschema.jsonMatchesSchema(jsonValue({}), jsonValue(null));
// @ts-expect-error Only the selected underscore extension key exists.
void context.extensions["pg-jsonschema"];
// @ts-expect-error JSON and JSONB instance identities remain distinct.
context.extensions.pg_jsonschema.jsonMatchesSchema(jsonValue({}), jsonbValue(null));
return [version]; }) });`,
      );
      const component = join(root, "kello/components/documents");
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(component, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "documents", extensions: { pg_jsonschema: { versions: ["0.3.4"] } }, rpc: ({ os }) => ({ os }) });',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import documents from "./components/documents/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(documents); export default app;',
      );
      await writeFile(
        join(component, "schema.ts"),
        'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.pg_jsonschema.schema !== "json_validators") throw new Error("Wrong mounted selection"); extensions.pg_jsonschema.isValid(null); export default defineSchema(() => ({}));',
      );
      await loadProject(root);
      const generated = await generateProject(root);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["pg_jsonschema"]);
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      expect(Object.keys(child.extensions)).toEqual(["pg_jsonschema"]);
      expect(child.extensions.pg_jsonschema.schema).toBe("json_validators");
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      await withRestrictedExtensionDatabase(
        ["json_validators"],
        "CREATE SCHEMA json_validators; CREATE EXTENSION pg_jsonschema WITH SCHEMA json_validators VERSION '0.3.4'",
        async (url) => {
          const schema = defineSchema(() => ({}));
          const relations = defineRelations(schema.tables);
          const connection = await connectDatabase({ schema, relations, connectionString: url });
          try {
            const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
            const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
            const handler = procedure.handler(async ({ context }) => {
              const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
              expect(effectBinding).toBe(context.extensions);
              return connection.transaction((db) =>
                db
                  .select({
                    json: effectBinding.pg_jsonschema.jsonMatchesSchema(
                      jsonValue({ type: "string" }),
                      jsonValue("foo"),
                    ),
                    jsonb: effectBinding.pg_jsonschema.jsonbMatchesSchema(
                      jsonValue({ type: "string" }),
                      jsonbValue("foo"),
                    ),
                    valid: effectBinding.pg_jsonschema.isValid(jsonValue({ type: "string" })),
                    errors: effectBinding.pg_jsonschema.validationErrors(
                      jsonValue({ type: "string" }),
                      jsonValue("foo"),
                    ),
                  })
                  .from(sql`(values (1)) fixture(id)`),
              );
            });
            const invocation = {
              requestId: "selected-jsonschema",
              identity: null,
              signal: new AbortController().signal,
            };
            const [row] = await call(handler, undefined, {
              context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
            });
            expect(row).toEqual({ json: true, jsonb: true, valid: true, errors: { dimensions: [], values: [] } });
          } finally {
            await connection.close();
          }
        },
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  30000,
);

extensionProofTest(
  fuzzystrmatchGenerationProofCase,
  async () => {
    const root = await projectFixture();
    const placement = "phonetics";
    const component = join(root, "kello/components/documents");
    try {
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(root, "kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { fuzzystrmatch: { version: "1.2", schema: "phonetics" } } } });',
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; extensions.fuzzystrmatch.soundex(null); export default defineSchema(() => ({}), { namespace: "app" });',
      );
      await writeFile(
        join(component, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "documents", extensions: { fuzzystrmatch: { versions: ["1.2"] } }, rpc: ({ os }) => ({ os }) });',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import documents from "./components/documents/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(documents); export default app;',
      );
      await writeFile(
        join(component, "schema.ts"),
        'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.fuzzystrmatch.schema !== "phonetics") throw new Error("Wrong mounted selection"); extensions.fuzzystrmatch.soundex(null); export default defineSchema(() => ({}));',
      );
      const arraySchema = `type ArrayValues = readonly (string | null | ArrayValues)[];
const values: v.GenericSchema<ArrayValues> = v.lazy(() => v.array(v.union([v.string(), v.null(), values])));
const codes: v.GenericSchema<{ readonly dimensions: readonly { readonly lowerBound: number; readonly length: number }[]; readonly values: ArrayValues }> = v.object({ dimensions: v.array(v.object({ lowerBound: v.number(), length: v.number() })), values });`;
      const output =
        "v.object({ soundex: v.nullable(v.string()), alias: v.nullable(v.string()), score: v.nullable(v.number()), codes: v.nullable(codes), metaphone: v.nullable(v.string()), primary: v.nullable(v.string()), alternate: v.nullable(v.string()), distance: v.nullable(v.number()), costs: v.nullable(v.number()), bounded: v.nullable(v.number()), boundedCosts: v.nullable(v.number()) })";
      await writeFile(
        join(component, "contracts/phonetics.ts"),
        `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; ${arraySchema} export default defineContract({ run: oc.output(${output}) });`,
      );
      await writeFile(
        join(root, "kello/contracts/tasks.ts"),
        `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; ${arraySchema} const result = ${output}; export default defineContract({ list: oc.output(v.object({ root: result, child: result })) });`,
      );
      const nativeHandler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Generated RPC and Effect Fuzzystrmatch differ");
const version: "1.2" = binding.fuzzystrmatch.version;
const placement: "phonetics" = binding.fuzzystrmatch.schema;
const api = binding.fuzzystrmatch;
const [result] = await context.db.select({
 soundex: api.soundex("Robert"), alias: api.sql.functions.text_soundex("Rupert"), score: api.difference("Robert", "Rupert"),
 codes: api.daitchMokotoff("John"), metaphone: api.metaphone("GUMBO", 4), primary: api.dmetaphone("Smith"), alternate: api.dmetaphoneAlt("Smith"),
 distance: api.levenshtein("Robert", "Rupert"), costs: api.sql.functions.levenshtein("a", "", 2, 3, 4),
 bounded: api.levenshteinLessEqual("GUMBO", "GAMBOL", 2), boundedCosts: api.sql.functions.levenshtein_less_equal("a", "", 2, 3, 4, 4),
}).from(sql.raw("(values(1)) fixture(id)"));
if (!result) throw new Error("Missing native Fuzzystrmatch result");
void [version, placement];`;
      await writeFile(
        join(component, "functions/phonetics.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql } from "drizzle-orm"; export default os.phonetics.router({ run: os.phonetics.run.handler(async ({ context }) => { ${nativeHandler} return result; }) });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { extensions } from "../_generated/extensions"; import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => { ${nativeHandler} return { root: result, child: await context.components.documents.rpc.phonetics.run() }; }) });
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.pg_tiktoken;
// @ts-expect-error Only captured two/five-argument overloads exist.
extensions.fuzzystrmatch.levenshtein("a", "b", 1);
}
void compileOnly;`,
      );
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      const virtual = projectRuntimeGraph(first).scopes.find((scope) => scope.name === "documents");
      assert(virtual && "extensions" in virtual);
      expect(Object.keys(virtual.extensions!)).toEqual(["fuzzystrmatch"]);
      const generated = await generateProject(root);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["fuzzystrmatch"]);
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      expect(Object.keys(child.extensions)).toEqual(["fuzzystrmatch"]);
      expect(child.extensions.fuzzystrmatch.schema).toBe(placement);
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      const { runtimeOptions } = await import(
        pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
      );
      const options = runtimeOptions();
      const mounted = options.scopes.find((scope: { name: string }) => scope.name === "documents");
      expect(Object.keys(mounted.extensions)).toEqual(["fuzzystrmatch"]);
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        const runtimeRole = `gen_fuzzy_${crypto.randomUUID().replaceAll("-", "")}`;
        let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
        try {
          await client.query(
            "CREATE SCHEMA phonetics; CREATE EXTENSION fuzzystrmatch WITH SCHEMA phonetics VERSION '1.2'",
          );
          await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole });
          const runtimeConnectionString = await restrictedRuntimeConnection(client, url, runtimeRole, [placement]);
          runtime = await createRpcRuntime({
            ...options,
            connectionString: runtimeConnectionString,
            deployment: "generated-fuzzystrmatch",
            auth: defineRpcAuth({ authorize: async () => {} }),
            assertActive: async (signal) => signal.throwIfAborted(),
          });
          const route = getRouter(runtime.router, ["tasks", "list"]);
          assert(route instanceof Procedure);
          const invocation = {
            requestId: "generated-fuzzystrmatch",
            identity: null,
            signal: new AbortController().signal,
          };
          const actual = await call(route, undefined, {
            context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
            path: ["tasks", "list"],
          });
          const expected = {
            soundex: "R163",
            alias: "R163",
            score: 4,
            codes: { dimensions: [{ lowerBound: 1, length: 2 }], values: ["160000", "460000"] },
            metaphone: "KM",
            primary: "SM0",
            alternate: "XMT",
            distance: 2,
            costs: 3,
            bounded: 2,
            boundedCosts: 3,
          };
          expect(actual).toEqual({ root: expected, child: expected });
        } finally {
          try {
            await runtime?.stop();
          } finally {
            try {
              const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
              if (exists.rows.length)
                await client.query(
                  `GRANT "${runtimeRole}" TO CURRENT_USER; DROP OWNED BY "${runtimeRole}"; DROP ROLE "${runtimeRole}"`,
                );
            } finally {
              await client.end();
            }
          }
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  60000,
);

test("citext first-load fields preserve selected RPC and Effect bindings in a custom namespace", async () => {
  const root = await projectFixture();
  const placement = "custom_citext";
  try {
    await writeFile(
      join(root, "kello.config.ts"),
      `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { citext: { version: "1.8", schema: ${JSON.stringify(placement)} } } } });`,
    );
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
extensions.citext.equal("MiXeD", "mixed");
export default defineSchema(() => ({ tasks: { title: extensions.citext.field().notNull() } }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "kello/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "1.8" = context.extensions.citext.version;
context.extensions.citext.equal(context.tables.tasks.title, "mixed");
// @ts-expect-error Selected bindings do not expose another family.
void context.extensions.pg_trgm;
// @ts-expect-error Case-insensitive equality rejects boolean input.
context.extensions.citext.equal(true, "mixed");
return [version]; }) });`,
    );
    await loadProject(root);
    const generated = await generateProject(root);
    const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
    expect(server.extensions).toBe(disk.extensions);
    expect(Object.keys(disk.extensions)).toEqual(["citext"]);
    await checkFixtureTypes(root);
    expect((await generateProject(root)).version).toBe(generated.version);
    await withExtensionDatabase(async (url) => {
      const schema = defineSchema(() => ({}));
      const relations = defineRelations(schema.tables);
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      try {
        await connection.db.execute(
          sql`create schema ${sql.identifier(placement)}; create extension citext with schema ${sql.identifier(placement)} version '1.8'`,
        );
        const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
        const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
        const handler = procedure.handler(async ({ context }) => {
          const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
          expect(effectBinding).toBe(context.extensions);
          return connection.transaction((db) =>
            db.select({ equal: effectBinding.citext.equal("MiXeD", "mixed") }).from(sql`(values (1)) fixture(id)`),
          );
        });
        const invocation = { requestId: "selected-citext", identity: null, signal: new AbortController().signal };
        expect(
          await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          }),
        ).toEqual([{ equal: true }]);
      } finally {
        await connection.close();
      }
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

extensionProofTest(
  uuidOsspGenerationProofCase,
  async () => {
    for (const placement of ["identifiers", "project_uuid"]) {
      const root = await projectFixture();
      try {
        await writeFile(
          join(root, "kello.config.ts"),
          `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { "uuid-ossp": { version: "1.1", schema: ${JSON.stringify(placement)} } } } });`,
        );
        await writeFile(
          join(root, "kello/schema.ts"),
          `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
extensions["uuid-ossp"].v5(extensions["uuid-ossp"].namespaceDns(), "name");
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
        );
        await writeFile(
          join(root, "kello/functions/tasks.ts"),
          `import { os } from "../_generated/rpc";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "1.1" = context.extensions["uuid-ossp"].version;
context.extensions["uuid-ossp"].v5(context.extensions["uuid-ossp"].namespaceDns(), "name");
function compileOnly() {
// @ts-expect-error The dashed extension key is exact.
void context.extensions.uuid_ossp;
// @ts-expect-error UUID names reject numeric arguments.
context.extensions["uuid-ossp"].v3(context.extensions["uuid-ossp"].namespaceDns(), 3);
} void compileOnly;
return [version]; }) });`,
        );
        const component = join(root, "kello/components/identities");
        await mkdir(component, { recursive: true });
        await mkdir(join(component, "contracts"));
        await mkdir(join(component, "functions"));
        await writeFile(
          join(component, "setup.ts"),
          'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "identities", extensions: { "uuid-ossp": { versions: ["1.1"] } }, rpc: ({ os }) => ({ os }) });',
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import { defineApplication } from "kello/server"; import identities from "./components/identities/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(identities); export default app;',
        );
        await writeFile(
          join(component, "schema.ts"),
          `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
const binding = extensions["uuid-ossp"];
if (binding.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong mounted selection");
binding.v3(binding.namespaceDns(), "name");
export default defineSchema(() => ({}));`,
        );
        const loaded = await loadProject(root);
        expect(loaded.componentScopes).toHaveLength(1);
        const mountedExtensions = loaded.componentScopes[0]!.boundExtensions;
        assert(mountedExtensions);
        expect(Object.keys(mountedExtensions)).toEqual(["uuid-ossp"]);

        const generated = await generateProject(root);
        const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
        const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
        expect(server.extensions).toBe(disk.extensions);
        expect(Object.keys(disk.extensions)).toEqual(["uuid-ossp"]);
        const selected = disk.extensions["uuid-ossp"];
        expect(selected.schema).toBe(placement);
        expect(Object.keys(selected.sql.functions)).toHaveLength(10);
        const expressions = [
          selected.nil(),
          selected.namespaceDns(),
          selected.namespaceUrl(),
          selected.namespaceOid(),
          selected.namespaceX500(),
          selected.v1(),
          selected.v1mc(),
          selected.v4(),
          selected.v3(selected.namespaceDns(), "name"),
          selected.v5(selected.namespaceDns(), "name"),
        ];
        expect(expressions).toHaveLength(10);
        for (const expression of expressions) expect(expression.getSQL()).toBeDefined();
        const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
        expect(Object.keys(child.extensions)).toEqual(["uuid-ossp"]);
        expect(child.extensions["uuid-ossp"].schema).toBe(placement);

        await checkFixtureTypes(root);
        expect((await generateProject(root)).version).toBe(generated.version);
        await withRestrictedExtensionDatabase(
          [placement],
          `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION "uuid-ossp" WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '1.1'`,
          async (url) => {
            const schema = defineSchema(() => ({}));
            const relations = defineRelations(schema.tables);
            const connection = await connectDatabase({ schema, relations, connectionString: url });
            try {
              const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
              const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
              const handler = procedure.handler(async ({ context }) => {
                const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
                expect(effectBinding).toBe(context.extensions);
                const uuid = effectBinding["uuid-ossp"];
                return connection.transaction((db) =>
                  db
                    .select({
                      v3: uuid.v3(uuid.namespaceDns(), "www.widgets.com"),
                      v5: uuid.v5(uuid.namespaceDns(), "www.widgets.com"),
                    })
                    .from(sql`(values (1)) fixture(id)`),
                );
              });
              const invocation = { requestId: "selected-uuid", identity: null, signal: new AbortController().signal };
              expect(
                await call(handler, undefined, {
                  context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
                }),
              ).toEqual([{ v3: "3d813cbb-47fb-32ba-91df-831e1593ac29", v5: "21f7f8de-8051-5b89-8680-0195ef798b6a" }]);
            } finally {
              await connection.close();
            }
          },
        );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  120000,
);

test("selected pg_trgm helpers work at first load, on disk, and through RPC and Effect bindings", async () => {
  const root = await projectFixture();
  try {
    await writeFile(
      join(root, "kello.config.ts"),
      'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "1.6", schema: "custom_text" } } } });',
    );
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
// This executes while generated bindings exist only virtually.
extensions.pg_trgm.similarity("word", "words");
extensions.pg_trgm.sql.functions.similarity("word", "words");
if (Object.keys(extensions).join(",") !== "pg_trgm") throw new Error("Wrong selected keys");
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "kello/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { Effect } from "effect";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC and Effect extensions differ");
const namespace: "custom_text" = binding.pg_trgm.schema;
const version: "1.6" = context.extensions.pg_trgm.version;
context.extensions.pg_trgm.similarity(context.tables.tasks.title, "word");
binding.pg_trgm.sql.functions.similarity(context.tables.tasks.title, "word");
// @ts-expect-error Unselected extensions stay absent.
void context.extensions.vector;
// @ts-expect-error Text similarity rejects booleans.
context.extensions.pg_trgm.similarity(true, "word");
return [namespace, version];
}) });`,
    );
    await loadProject(root);
    const generated = await generateProject(root);
    const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
    expect(source).toContain('from "kello/extensions/pg-trgm"');
    for (const forbidden of ["vector", "../schema", "./server", "kello.config"])
      expect(source).not.toContain(forbidden);
    const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
    expect(server.extensions).toBe(disk.extensions);
    expect(Object.keys(disk.extensions)).toEqual(["pg_trgm"]);
    expect(Object.isFrozen(disk.extensions)).toBe(true);
    expect(disk.extensions.pg_trgm.similarity).toBe(disk.extensions.pg_trgm.sql.functions.similarity);
    await checkFixtureTypes(root);
    expect((await generateProject(root)).version).toBe(generated.version);
    await withExtensionDatabase(async (url) => {
      const schema = defineSchema(() => ({}));
      const relations = defineRelations(schema.tables);
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      try {
        await connection.db.execute(
          sql`create schema custom_text; create extension pg_trgm with schema custom_text version '1.6'`,
        );
        const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
        const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
        const handler = procedure.handler(async ({ context }) => {
          const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
          expect(effectBinding).toBe(disk.extensions);
          expect(context.extensions).toBe(effectBinding);
          return connection.transaction((db) =>
            db
              .select({
                direct: context.extensions.pg_trgm.similarity("word", "words"),
                canonical: effectBinding.pg_trgm.sql.functions.similarity("word", "words"),
              })
              .from(sql`(values (1)) fixture(id)`),
          );
        });
        const invocation = { requestId: "selected-adapter", identity: null, signal: new AbortController().signal };
        expect(
          await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          }),
        ).toEqual([{ direct: Math.fround(4 / 7), canonical: Math.fround(4 / 7) }]);
      } finally {
        await connection.close();
      }
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("fuzzy and token helpers are selected at first load and retain exact disk imports", async () => {
  const root = await projectFixture();
  try {
    await writeFile(
      join(root, "kello.config.ts"),
      'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { fuzzystrmatch: { version: "1.2", schema: "phonetics" }, pg_tiktoken: { version: "0.0.1", schema: "tokens" } } } });',
    );
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
extensions.fuzzystrmatch.levenshtein("word", "words");
extensions.pg_tiktoken.count("cl100k_base", "hello");
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
    );
    await loadProject(root);
    await generateProject(root);
    const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
    expect(source).toContain('from "kello/extensions/fuzzystrmatch"');
    expect(source).toContain('from "kello/extensions/pg-tiktoken"');
    expect(source).not.toContain("pg-trgm");
    const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
    expect(Object.keys(disk.extensions)).toEqual(["fuzzystrmatch", "pg_tiktoken"]);
    await withExtensionDatabase(async (url) => {
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      try {
        const fuzzy = connection.db
          .select({ value: disk.extensions.fuzzystrmatch.levenshtein("word", "words") })
          .from(sql`(values (1)) fixture(id)`)
          .toSQL();
        expect(fuzzy.sql).toContain('"phonetics"."levenshtein"');
        expect(fuzzy.params).toEqual(["word", "words"]);
        const token = connection.db
          .select({ value: disk.extensions.pg_tiktoken.count("cl100k_base", "hello") })
          .from(sql`(values (1)) fixture(id)`)
          .toSQL();
        expect(token.sql).toContain('"tokens"."tiktoken_count"');
        expect(token.params).toEqual(["cl100k_base", "hello"]);
      } finally {
        await connection.close();
      }
    });
    expect(disk.extensions.pg_tiktoken.sql.functions.tiktoken_count).toBe(disk.extensions.pg_tiktoken.count);
    await checkFixtureTypes(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("unknown pg_trgm versions generate literal descriptors without callable helpers", async () => {
  const root = await projectFixture();
  try {
    await writeFile(
      join(root, "kello.config.ts"),
      'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "unknown" } } } });',
    );
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
if ("similarity" in extensions.pg_trgm || "sql" in extensions.pg_trgm) throw new Error("Invented unverified API");
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "kello/functions/tasks.ts"),
      `import { os } from "../_generated/rpc"; export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "unknown" = context.extensions.pg_trgm.version;
// @ts-expect-error Unverified versions have no callable similarity.
void context.extensions.pg_trgm.similarity;
// @ts-expect-error Unselected keys stay absent.
void context.extensions.vector;
return [version]; }) });`,
    );
    await loadProject(root);
    await generateProject(root);
    const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
    expect(source).not.toContain('from "kello/extensions/');
    const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
    expect(Object.keys(disk.extensions)).toEqual(["pg_trgm"]);
    expect(disk.extensions.pg_trgm.version).toBe("unknown");
    expect(disk.extensions.pg_trgm.apiSupport.status).toBe("unverified");
    expect(disk.extensions.pg_trgm).not.toHaveProperty("similarity");
    expect(disk.extensions.pg_trgm).not.toHaveProperty("sql");
    await checkFixtureTypes(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("component generation binds its reviewed adapter with only the declared host subset", async () => {
  const root = await projectFixture();
  try {
    const directory = join(root, "kello/components/search");
    await mkdir(join(directory, "contracts"), { recursive: true });
    await mkdir(join(directory, "functions"));
    await writeFile(
      join(root, "kello.config.ts"),
      'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "1.6", schema: "host_text" }, fuzzystrmatch: { version: "1.2", schema: "host_fuzzy" } } } });',
    );
    await writeFile(
      join(directory, "setup.ts"),
      'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "search", extensions: { pg_trgm: { versions: ["1.6"] } }, rpc: ({ os }) => ({ os }) });',
    );
    await writeFile(
      join(root, "kello/app.config.ts"),
      'import { defineApplication } from "kello/server"; import search from "./components/search/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(search); export default app;',
    );
    await writeFile(
      join(directory, "schema.ts"),
      `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
extensions.pg_trgm.similarity("word", "words");
if (Object.keys(extensions).join(",") !== "pg_trgm" || extensions.pg_trgm.schema !== "host_text") throw new Error("Wrong component binding");
export default defineSchema(() => ({}));`,
    );
    await writeFile(
      join(directory, "contracts/description.ts"),
      'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ get: oc.output(v.string()) });',
    );
    await writeFile(
      join(directory, "functions/description.ts"),
      `import { os } from "../_generated/rpc"; export default os.description.router({ get: os.description.get.handler(({ context }) => {
context.extensions.pg_trgm.similarity("word", "words");
const schema: "host_text" = context.extensions.pg_trgm.schema;
// @ts-expect-error Host adapters not declared by the component remain absent.
void context.extensions.fuzzystrmatch;
return schema; }) });`,
    );
    const generated = await generateProject(root);
    const runtime = await import(pathToFileURL(join(root, ".loom/generations", generated.version, "router.js")).href);
    const disk = runtime.scopes.find((scope: { name: string }) => scope.name === "search");
    expect(Object.keys(disk.extensions)).toEqual(["pg_trgm"]);
    expect(disk.extensions.pg_trgm.similarity("word", "words")).toBeDefined();
    const loaded = projectRuntimeGraph(await loadProject(root)).scopes.find((scope) => scope.name === "search");
    assert(loaded && "extensions" in loaded);
    expect(Object.keys(loaded.extensions!)).toEqual(["pg_trgm"]);
    expect(loaded.extensions).toHaveProperty("pg_trgm.similarity");
    const source = await readFile(join(directory, "_generated/extensions.ts"), "utf8");
    expect(source).not.toContain("fuzzystrmatch");
    await checkFixtureTypes(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

extensionProofTest(
  bloomGenerationProofCase,
  async () => {
    const root = await projectFixture();
    const placement = "signatures";
    try {
      await writeFile(
        join(root, "kello.config.ts"),
        `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { bloom: { version: "1.0", schema: ${JSON.stringify(placement)} } } } });`,
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
const bloom = extensions.bloom;
const placement: ${JSON.stringify(placement)} = bloom.schema;
const unique: false = bloom.accessMethod.unique;
void [placement, unique];
function compileOnly() {
// @ts-expect-error Only the captured int4 and text classes exist.
bloom.indexes.int8();
// @ts-expect-error Unselected families remain absent.
void extensions.pg_trgm;
}
void compileOnly;
export default defineSchema((fields) => ({ entries: defineTable({ code: fields.integer().notNull(), label: fields.text().notNull(), region: fields.text().notNull() }, { indexes: [
  { fields: ["code"], extension: bloom.indexes.int4(), with: bloom.storage({ length: 80, bits: [3] }) },
  { fields: ["label", "region"], extension: bloom.indexes.text(), with: bloom.storage({ bits: [2, 4] }) },
] }) }), { namespace: "app" });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
const version: "1.0" = context.extensions.bloom.version;
void version;
const rows = await context.db.select({ label: context.tables.entries.label }).from(context.tables.entries);
return rows.map((row) => row.label);
}) });`,
      );
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await loadProject(root);
      const generated = await generateProject(root);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      expect(Object.keys(disk.extensions)).toEqual(["bloom"]);
      expect(disk.extensions.bloom.indexes.text()).toMatchObject({
        schema: placement,
        member: "opclass:$extension:bloom.text_ops/bloom",
        method: "bloom",
      });
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
      expect(schema.metadata.extensionRequirements.map((entry: { member: string }) => entry.member)).toEqual([
        "opclass:$extension:bloom.int4_ops/bloom",
        "opclass:$extension:bloom.text_ops/bloom",
      ]);
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        try {
          await client.query(
            `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION bloom WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '1.0'`,
          );
          for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
            await client.query(statement);
          const indexes = await client.query(
            `select c.relname, n.nspname, pg_catalog.array_to_string(c.reloptions, ',') options from pg_index i
             join pg_class c on c.oid=i.indexrelid join pg_am am on am.oid=c.relam join pg_opclass o on o.oid=i.indclass[0]
             join pg_namespace n on n.oid=o.opcnamespace where i.indrelid='app.entries'::regclass and am.amname='bloom' order by 1`,
          );
          expect(indexes.rows).toEqual([
            { relname: "entries_0_idx", nspname: placement, options: "length=80,col1=3" },
            { relname: "entries_1_idx", nspname: placement, options: "col1=2,col2=4" },
          ]);
        } finally {
          await client.end();
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  60000,
);

test("postgis_raster preserves public selection and first-load generation", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-postgis-raster-generation-"));
  try {
    const process = Bun.spawn(
      [
        "bun",
        fileURLToPath(new URL("../scripts/postgis-raster-generate.mjs", import.meta.url)),
        root,
        await realpath(fileURLToPath(new URL("../../tests/node_modules", import.meta.url))),
        fileURLToPath(new URL("../../../node_modules/typescript/bin/tsc", import.meta.url)),
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    const output = (await new Response(process.stdout).text()) + (await new Response(process.stderr).text());
    expect(await process.exited, output).toBe(0);
    const results = JSON.parse(await readFile(join(root, "generation.json"), "utf8"));
    expect(results.map((result: { selection: string }) => result.selection)).toEqual([
      "omitted",
      "empty",
      "future",
      "selected",
      "custom",
    ]);
    expect(
      results.map((result: { nativeSafetyMembers: readonly string[] }) => result.nativeSafetyMembers.length),
    ).toEqual([0, 0, 0, 3, 3]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 120000);
