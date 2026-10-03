import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "bun:test";
import pg from "pg";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations, sql } from "drizzle-orm";
import { connectDatabase, createProjectProcedures, createProjectServices, defineSchema, Invocation } from "loom/server";
import { generateProject, initializeProject, loadProject } from "loom/tooling";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { readGenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";

const placement = "crypto_public";
const digest = "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8";
const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-pgcrypto-public-"));
  try {
    await initializeProject(root, "cryptopublic");
    await mkdir(join(root, "node_modules"));
    for (const name of ["loom", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    await writeFile(
      join(root, "loom.config.ts"),
      `import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { pgcrypto: { version: "1.4", schema: ${JSON.stringify(placement)} }, pg_trgm: { version: "1.6" } } } });`,
    );
    await writeFile(
      join(root, "loom/schema.ts"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
extensions.pgcrypto.digest("abc", "sha256", "text");
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "loom/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "1.4" = context.extensions.pgcrypto.version;
const namespace: ${JSON.stringify(placement)} = context.extensions.pgcrypto.schema;
context.extensions.pgcrypto.digest(context.tables.tasks.title, "sha256", "text");
// @ts-expect-error Selected APIs keep exact native argument types.
context.extensions.pgcrypto.genRandomBytes(context.tables.tasks.title);
return [version, namespace]; }) });`,
    );
    const directory = join(root, "loom/components/crypto");
    await mkdir(join(directory, "contracts"), { recursive: true });
    await mkdir(join(directory, "functions"));
    await writeFile(
      join(directory, "setup.ts"),
      'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "crypto", extensions: { pgcrypto: { versions: ["1.4"] } }, rpc: ({ os }) => ({ os }) });',
    );
    await writeFile(
      join(root, "loom/app.config.ts"),
      'import { defineApplication } from "loom/server"; import crypto from "./components/crypto/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(crypto); export default app;',
    );
    await writeFile(
      join(directory, "schema.ts"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
extensions.pgcrypto.digest("abc", "sha256", "text");
if (Object.keys(extensions).join(",") !== "pgcrypto" || extensions.pgcrypto.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong component selection");
export default defineSchema(() => ({}));`,
    );
    await writeFile(
      join(directory, "contracts/description.ts"),
      'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ get: oc.output(v.string()) });',
    );
    await writeFile(
      join(directory, "functions/description.ts"),
      `import { os } from "../_generated/rpc"; export default os.description.router({ get: os.description.get.handler(({ context }) => {
context.extensions.pgcrypto.armor({ hex: "00ff" });
const namespace: ${JSON.stringify(placement)} = context.extensions.pgcrypto.schema;
// @ts-expect-error Component receives only its declared subset.
void context.extensions.pg_trgm;
return namespace; }) });`,
    );
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

test("fresh public Pgcrypto first load and disk generation preserve exact root/component contracts", async () => {
  const root = await fixture();
  try {
    await assert.rejects(readFile(join(root, "loom/_generated/extensions.ts")), { code: "ENOENT" });
    const loaded = await loadProject(root);
    const scope = projectRuntimeGraph(loaded).scopes.find((entry) => entry.name === "crypto");
    assert(scope && "extensions" in scope);
    expect(Object.keys(scope.extensions!)).toEqual(["pgcrypto"]);
    const generated = await generateProject(root);
    const disk = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(root, "loom/_generated/server.ts")).href);
    expect(server.extensions).toBe(disk.extensions);
    expect(Object.keys(disk.extensions).sort()).toEqual(["pg_trgm", "pgcrypto"]);
    expect(Object.keys(disk.extensions.pgcrypto.sql.functions)).toHaveLength(37);
    expect(Object.keys(disk.extensions.pgcrypto.sql.operators)).toEqual([]);
    const component = await readFile(join(root, "loom/components/crypto/_generated/extensions.ts"), "utf8");
    expect(component).toContain('from "loom/extensions/pgcrypto"');
    expect(component).not.toContain("pg_trgm");
    const required = await readGenerationRequiredApi(join(root, ".loom/generations", generated.version));
    assert(required);
    const cryptoApis = required.scopes.flatMap((entry) =>
      entry.requiredApi.apis.filter((api) => api.manifest.contract.extension === "pgcrypto"),
    );
    expect(cryptoApis).toHaveLength(2);
    for (const api of cryptoApis) {
      expect(api.schema).toBe(placement);
      expect(api.manifest.digest).toBe(digest);
      expect(api.manifest.contract.version).toBe("1.4");
      expect(api.manifest.contract.members).toHaveLength(37);
    }
    const child = Bun.spawn(
      [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
      { stdout: "pipe", stderr: "pipe" },
    );
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(exitCode, 0, stdout + stderr);
    expect((await generateProject(root)).version).toBe(generated.version);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60000);

test("public Pgcrypto generation rejects missing or incompatible component requirements", async () => {
  const root = await fixture();
  try {
    for (const extensions of [{}, { pgcrypto: { version: "1.3", schema: placement } }]) {
      await writeFile(
        join(root, "loom.config.ts"),
        `import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: ${JSON.stringify(extensions)} } });`,
      );
      await assert.rejects(generateProject(root), /pgcrypto/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60000);

test("public generated Pgcrypto uses named-role catalogue verification and native checked RPC/Effect", async () => {
  const root = await fixture();
  try {
    await generateProject(root);
    const { extensions } = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
    await withExtensionDatabase(async (url) => {
      const role = `crypto_${crypto.randomUUID().replaceAll("-", "")}`;
      const group = `crypto_${crypto.randomUUID().replaceAll("-", "")}`;
      const admin = new pg.Client({ connectionString: url });
      await admin.connect();
      const schema = defineSchema(() => ({}));
      const relations = defineRelations(schema.tables);
      let connection: Awaited<ReturnType<typeof connectDatabase>> | undefined;
      try {
        await admin.query(
          `CREATE ROLE ${quote(role)} NOLOGIN; CREATE ROLE ${quote(group)} NOLOGIN; GRANT ${quote(role)} TO CURRENT_USER; GRANT ${quote(group)} TO CURRENT_USER; GRANT ${quote(group)} TO ${quote(role)}; CREATE SCHEMA ${quote(placement)}; CREATE EXTENSION pgcrypto SCHEMA ${quote(placement)} VERSION '1.4'; GRANT USAGE ON SCHEMA ${quote(placement)} TO ${quote(group)}; GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ${quote(placement)} TO ${quote(group)}`,
        );
        const api = buildRequiredApi({ pgcrypto: { version: "1.4", schema: placement } });
        assert(api && api.apis[0]);
        expect(api.apis[0].manifest.contract.members).toHaveLength(37);
        await verifyRequiredApiOnTarget(admin, api, role);
        const privileges = await admin.query<{ id: string; allowed: boolean }>(
          `SELECT p.oid::regprocedure::text AS id, pg_catalog.has_function_privilege($1::name,p.oid,'EXECUTE') AS allowed FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_depend d ON d.classid='pg_catalog.pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e' JOIN pg_catalog.pg_extension e ON e.oid=d.refobjid WHERE e.extname='pgcrypto' AND n.nspname=$2`,
          [role, placement],
        );
        expect(privileges.rows).toHaveLength(37);
        expect(new Set(privileges.rows.map((entry) => entry.id)).size).toBe(37);
        expect(privileges.rows.every((entry) => entry.allowed)).toBe(true);
        const overload = `${quote(placement)}.digest(text,text)`;
        const grant = await admin.query<{ grantable: boolean }>(
          "SELECT pg_catalog.has_function_privilege(CURRENT_USER,pg_catalog.to_regprocedure($1),'EXECUTE WITH GRANT OPTION') AS grantable",
          [overload],
        );
        if (grant.rows[0]?.grantable) {
          await admin.query(`REVOKE EXECUTE ON FUNCTION ${overload} FROM PUBLIC, ${quote(group)}`);
          const denied = await admin.query<{ allowed: boolean }>(
            "SELECT pg_catalog.has_function_privilege($1::name,pg_catalog.to_regprocedure($2),'EXECUTE') AS allowed",
            [role, overload],
          );
          expect(denied.rows).toEqual([{ allowed: false }]);
          // PUBLIC EXECUTE is part of the published digest: structural verification rejects this drift first.
          await assert.rejects(
            verifyRequiredApiOnTarget(admin, api, role),
            /Extension SQL contract mismatch: pgcrypto/,
          );
          await admin.query(`GRANT EXECUTE ON FUNCTION ${overload} TO ${quote(group)}`);
          const inherited = await admin.query<{ allowed: boolean }>(
            "SELECT pg_catalog.has_function_privilege($1::name,pg_catalog.to_regprocedure($2),'EXECUTE') AS allowed",
            [role, overload],
          );
          expect(inherited.rows).toEqual([{ allowed: true }]);
          await admin.query(`GRANT EXECUTE ON FUNCTION ${overload} TO PUBLIC`);
          await verifyRequiredApiOnTarget(admin, api, role);
        } else {
          // Provider-owned PUBLIC grants cannot be mutated: this branch is not EXECUTE-denial evidence.
          expect(grant.rows[0]?.grantable).toBe(false);
        }
        console.info(
          JSON.stringify({
            pgcryptoPrivilegeEvidence: {
              members: privileges.rows.length,
              inheritedGrants: true,
              nativeExecuteDenialObserved: grant.rows[0]?.grantable === true,
              publishedContractDriftRejected: grant.rows[0]?.grantable === true,
              verifierExecuteDenialBranchExercised: false,
              executeDenialUnavailable: grant.rows[0]?.grantable === false,
            },
          }),
        );
        await admin.query(`REVOKE USAGE ON SCHEMA ${quote(placement)} FROM ${quote(group)}`);
        await assert.rejects(verifyRequiredApiOnTarget(admin, api, role), /USAGE denied/);
        await admin.query(`GRANT USAGE ON SCHEMA ${quote(placement)} TO ${quote(group)}`);
        connection = await connectDatabase({ schema, relations, connectionString: url });
        const services = createProjectServices<typeof schema, typeof relations, typeof extensions>(schema);
        const { procedure } = createProjectProcedures(schema, relations, extensions);
        const handler = procedure.handler(async ({ context }) => {
          const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
          expect(binding).toBe(context.extensions);
          assert(connection);
          return connection.transaction(async (db) => {
            await db.execute(sql.raw(`SET LOCAL ROLE ${quote(role)}`));
            return db
              .select({ hash: binding.pgcrypto.digest("abc", "sha256", "text") })
              .from(sql`(values (1)) fixture(id)`);
          });
        });
        const invocation = { requestId: "public-crypto", identity: null, signal: new AbortController().signal };
        expect(
          await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          }),
        ).toEqual([{ hash: { hex: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" } }]);
      } finally {
        try {
          await connection?.close();
          await admin.query(
            `DROP OWNED BY ${quote(role)}, ${quote(group)}; DROP ROLE IF EXISTS ${quote(role)}, ${quote(group)}`,
          );
        } finally {
          await admin.end();
        }
      }
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60000);
