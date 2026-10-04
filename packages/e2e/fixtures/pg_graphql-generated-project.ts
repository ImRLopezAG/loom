import type { createPgGraphql_1_5_12 } from "kello/extensions/pg-graphql";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const pgGraphqlGeneratedPlacement = "graphql";
export const pgGraphqlGeneratedModes = ["selected", "omitted", "empty", "future"] as const;
export type PgGraphqlGeneratedMode = (typeof pgGraphqlGeneratedModes)[number];
export const pgGraphqlGeneratedDigest = "a64a8bd702ab1dad6e9b171e6f5cc61ec54c2e31411da5d7c6aec86933538d5f";
export const pgGraphqlGeneratedQueryMembers = [
  "routine:$extension:pg_graphql._internal_resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
  "routine:$extension:pg_graphql.exception(pg_catalog.text)",
  "routine:$extension:pg_graphql.comment_directive(pg_catalog.text)",
  "routine:$extension:pg_graphql.get_schema_version()",
  "routine:$extension:pg_graphql.resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
] as const;

const contract = `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({
  list: oc.output(v.strictObject({
    document: v.string(),
    internalDocument: v.string(),
    directive: v.string(),
    version: v.number(),
    members: v.array(v.string()),
    effectSame: v.literal(true),
  })),
});
`;

const handler = `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.tasks.router({
  list: os.tasks.list.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
    if (binding !== context.extensions) throw new Error("Root RPC/Effect selection differs");
    if (binding !== selected) throw new Error("Generated extensions differ from RPC context");
    const api = binding.pg_graphql;
    const [row] = await context.db
      .select({
        document: api.resolve("{ __typename }"),
        internalDocument: api.internalResolve("{ __typename }"),
        directive: api.commentDirective('@graphql({"name":"Acct"})'),
        version: api.getSchemaVersion(),
      })
      .from(sql\`(values (1)) as fixture(value)\`);
    if (!row) throw new Error("Missing generated pg_graphql row");
    const result = {
      document: row.document.text,
      internalDocument: row.internalDocument.text,
      directive: row.directive.text,
      version: row.version,
      members: Object.keys(api.sql.overloads).sort(),
      effectSame: true as const,
    };
    const child = await context.components.queries.rpc.query.run();
    if (JSON.stringify(child) !== JSON.stringify(result)) throw new Error("Mounted GraphQL query differs");
    return result;
  }),
});
function compileOnly() {
  // @ts-expect-error Unselected families remain absent.
  selected.vector;
  // @ts-expect-error Internal C resolve is not an application helper.
  selected.pg_graphql._internal_resolve("{ __typename }");
  // @ts-expect-error Trigger-only increment is not an RPC SQL helper.
  selected.pg_graphql.incrementSchemaVersion();
  selected.pg_graphql.exception("boom");
  selected.pg_graphql.sql.functions._internal_resolve("{ __typename }");
  selected.pg_graphql.resolve("query Q { __typename }", undefined, "Q");
}
void compileOnly;
`;

/** Caller supplies public package tooling. This fixture never imports a source adapter. */
export async function writePgGraphqlProject(root: string, mode: PgGraphqlGeneratedMode = "selected"): Promise<void> {
  if (mode !== "selected") {
    await writeUnselectedProject(root, mode);
    return;
  }
  await writeFile(
    join(root, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_graphql: { version: "1.5.12", schema: "graphql" } } } });',
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import queries from "./components/queries/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(queries); export default app;',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.pg_graphql;
if (api.schema !== "graphql" || api.version !== "1.5.12" || Object.keys(api.sql.overloads).length !== 5)
  throw new Error("Wrong first-load pg_graphql binding");
if (api.resolve !== api.sql.functions.resolve) throw new Error("Wrong canonical resolve alias");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });
`,
  );
  await writeFile(join(root, "kello/contracts/tasks.ts"), contract);
  await writeFile(join(root, "kello/functions/tasks.ts"), handler);
  const component = join(root, "kello/components/queries");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(component, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "queries", extensions: { pg_graphql: { versions: ["1.5.12"] } }, rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(component, "schema.ts"),
    'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.pg_graphql.schema !== "graphql") throw new Error("Wrong mounted schema"); export default defineSchema(() => ({}));',
  );
  await writeFile(
    join(component, "contracts/query.ts"),
    contract
      .replace('from "kello/contract"', 'from "../_generated/contract"')
      .replace("list: oc.output", "run: oc.output"),
  );
  await writeFile(
    join(component, "functions/query.ts"),
    handler
      .replace("os.tasks.router", "os.query.router")
      .replace("list: os.tasks.list.handler", "run: os.query.run.handler")
      .replace(
        '    const child = await context.components.queries.rpc.query.run();\n    if (JSON.stringify(child) !== JSON.stringify(result)) throw new Error("Mounted GraphQL query differs");\n',
        "",
      ),
  );
}

async function writeUnselectedProject(root: string, mode: Exclude<PgGraphqlGeneratedMode, "selected">): Promise<void> {
  const future = mode === "future";
  const database =
    mode === "omitted"
      ? "{}"
      : future
        ? '{ database: { extensions: { pg_graphql: { version: "0.0.0", schema: "graphql" } } } }'
        : "{ database: { extensions: {} } }";
  const assertion = future
    ? 'if (selected.pg_graphql.apiSupport.status !== "unverified" || selected.pg_graphql.version !== "0.0.0" || "sql" in selected.pg_graphql) throw new Error("Wrong unsupported descriptor");'
    : 'if (selected !== undefined) throw new Error("Unselected extensions must be undefined");';
  const negative = future ? 'selected.pg_graphql.resolve("{ __typename }");' : "selected.pg_graphql;";
  const output = `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.strictObject({ status: v.literal("${future ? "unverified" : "absent"}"), value: v.literal(1), effectSame: v.literal(true) })) });`;
  const query = `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== selected || binding !== context.extensions) throw new Error("Unselected RPC/Effect identity differs");
  ${assertion}
  const [row] = await context.db.select({ value: sql<number>\`1\` }).from(sql\`(values(1)) as probe(value)\`);
  if (row?.value !== 1) throw new Error("Native query did not execute");
  const result = { status: "${future ? "unverified" : "absent"}" as const, value: 1 as const, effectSame: true as const };
  const child = await context.components.queries.rpc.query.run();
  if (JSON.stringify(child) !== JSON.stringify(result)) throw new Error("Mounted unselected query differs");
  return result;
}) });
function compileOnly() {
  // @ts-expect-error Missing or unsupported versions do not expose a query helper.
  ${negative}
}
void compileOnly;`;
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${database});`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import queries from "./components/queries/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(queries); export default app;',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server"; import { extensions as selected } from "./_generated/extensions"; ${assertion} export default defineSchema(s => ({ tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }) }), { namespace: "app" });`,
  );
  await writeFile(join(root, "kello/contracts/tasks.ts"), output);
  await writeFile(join(root, "kello/functions/tasks.ts"), query);
  const component = join(root, "kello/components/queries");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(component, "setup.ts"),
    `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "queries", ${future ? 'extensions: { pg_graphql: { versions: ["0.0.0"] } },' : ""} rpc: ({ os }) => ({ os }) });`,
  );
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server"; import { extensions as selected } from "./_generated/extensions"; ${assertion} export default defineSchema(() => ({}));`,
  );
  await writeFile(
    join(component, "contracts/query.ts"),
    output
      .replace('from "kello/contract"', 'from "../_generated/contract"')
      .replace("list: oc.output", "run: oc.output"),
  );
  await writeFile(
    join(component, "functions/query.ts"),
    query
      .replace("os.tasks.router", "os.query.router")
      .replace("list: os.tasks.list.handler", "run: os.query.run.handler")
      .replace(
        '  const child = await context.components.queries.rpc.query.run();\n  if (JSON.stringify(child) !== JSON.stringify(result)) throw new Error("Mounted unselected query differs");\n',
        "",
      ),
  );
}

export function assertPgGraphqlStrictGeneratedApi(
  api: Pick<ReturnType<typeof createPgGraphql_1_5_12>, "name" | "version" | "schema" | "apiSupport" | "sql">,
): void {
  assert.equal(api.name, "pg_graphql");
  assert.equal(api.version, "1.5.12");
  assert.equal(api.schema, pgGraphqlGeneratedPlacement);
  assert.deepEqual(api.apiSupport, { status: "verified", digest: pgGraphqlGeneratedDigest });
  assert.deepEqual(Object.keys(api.sql.overloads).sort(), [...pgGraphqlGeneratedQueryMembers].sort());
  assert.deepEqual(Object.keys(api.sql.functions).sort(), [
    "_internal_resolve",
    "comment_directive",
    "exception",
    "get_schema_version",
    "resolve",
  ]);
  assert.equal(api.sql.functions.resolve, api.sql.overloads[pgGraphqlGeneratedQueryMembers[4]]);
  assert.equal(api.sql.functions.comment_directive, api.sql.overloads[pgGraphqlGeneratedQueryMembers[2]]);
  assert.equal(api.sql.functions.get_schema_version, api.sql.overloads[pgGraphqlGeneratedQueryMembers[3]]);
  for (const forbidden of ["increment_schema_version"]) assert.equal(forbidden in api.sql.functions, false, forbidden);
}

/** Read actual generated files after first-load virtual bindings. */
export async function checkPgGraphqlDiskBindings(root: string, mode: PgGraphqlGeneratedMode = "selected") {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  if (mode !== "selected") {
    assert(!source.includes("createPgGraphql_1_5_12"));
    const disk = await import(pathToFileURL(file).href);
    const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
    assert.equal(server.extensions, disk.extensions);
    if (mode === "future") {
      assert.deepEqual(Object.keys(disk.extensions), ["pg_graphql"]);
      assert.equal(disk.extensions.pg_graphql.version, "0.0.0");
      assert.deepEqual(disk.extensions.pg_graphql.apiSupport, { status: "unverified" });
      assert.equal("sql" in disk.extensions.pg_graphql, false);
    } else assert.equal(disk.extensions, undefined);
    return { api: disk.extensions?.pg_graphql, extensions: disk.extensions, server };
  }
  assert(source.includes('import { createPgGraphql_1_5_12 } from "kello/extensions/pg-graphql";'));
  assert(source.includes('"pg_graphql": createPgGraphql_1_5_12(descriptors["pg_graphql"])'));
  assert(source.includes(pgGraphqlGeneratedDigest));
  for (const forbidden of ["kello/extensions/pg-trgm", "kello/extensions/xml2", "./schema", "./server", "kello.config"])
    assert(!source.includes(forbidden), forbidden);
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  const rpc = await readFile(join(root, "kello/_generated/rpc.ts"), "utf8");
  const serverSource = await readFile(join(root, "kello/_generated/server.ts"), "utf8");
  assert.equal(server.extensions, disk.extensions);
  assert.deepEqual(Object.keys(disk.extensions), ["pg_graphql"]);
  assert(Object.isFrozen(disk.extensions));
  assertPgGraphqlStrictGeneratedApi(disk.extensions.pg_graphql);
  assert(serverSource.includes("export const { Database, Tables, Validators, Search, Extensions }"));
  assert(serverSource.includes("createProjectServices"));
  assert(rpc.includes("createApplicationRpc"));
  assert(rpc.includes("extensions"));
  const tasks = await readFile(join(root, "kello/functions/tasks.ts"), "utf8");
  assert(tasks.includes('Effect.provide(Extensions, context["effect/context"])'));
  assert(tasks.includes("api.resolve"));
  assert(tasks.includes("api.commentDirective"));
  assert(tasks.includes("api.getSchemaVersion"));
  return { api: disk.extensions.pg_graphql, extensions: disk.extensions, server };
}
