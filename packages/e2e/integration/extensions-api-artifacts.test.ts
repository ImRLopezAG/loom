import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  initializeProject,
  prepareProject,
  generateRelease,
  applyProjectMigrations,
  readMigrations,
  writeMigration,
} from "kello/tooling";
import { extensionContractDigest } from "../../../apps/loom/src/core/extensions/registry";
import { migrationHash } from "../../../apps/loom/src/tooling/migrations/planner";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { withMigrationConnection, quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

test("accepted source APIs require a matching committed head before native bootstrap and scoped generation applies normally", async () => {
  await withExtensionDatabase(async (url) => {
    const root = await mkdtemp(join(tmpdir(), "loom-extension-api-head-"));
    const role = `api_runtime_${crypto.randomUUID().replaceAll("-", "")}`;
    const previous = process.env.LOOM_API_ARTIFACT_DATABASE;
    process.env.LOOM_API_ARTIFACT_DATABASE = url;
    async function nativeState() {
      return withMigrationConnection(url, async (client) => {
        const extensions = await client.query(
          "SELECT extname,extversion,extnamespace::regnamespace::text AS schema FROM pg_extension ORDER BY extname",
        );
        const namespaces = await client.query(
          "SELECT nspname FROM pg_namespace WHERE nspname !~ '^pg_' ORDER BY nspname",
        );
        const relations = await client.query(
          "SELECT n.nspname,c.relname,c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname !~ '^pg_' AND n.nspname<>'information_schema' ORDER BY n.nspname,c.relname",
        );
        const roles = await client.query("SELECT rolname FROM pg_roles WHERE rolname=$1", [role]);
        return [extensions.rows, namespaces.rows, relations.rows, roles.rows];
      });
    }
    try {
      await initializeProject(root, "api-head");
      await mkdir(join(root, "node_modules"));
      for (const name of ["kello", "valibot", "drizzle-orm"])
        await symlink(
          await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
          join(root, "node_modules", name),
        );
      await writeFile(
        join(root, "kello.config.ts"),
        `import {defineConfig} from "kello/tooling"; export default defineConfig(${JSON.stringify({ project: "api-head", database: { migrationUrlEnv: "LOOM_API_ARTIFACT_DATABASE", migrations: "migrations", extensions: { pg_trgm: { version: "1.6" }, citext: { version: "1.8" } } } })});`,
      );
      const component = join(root, "kello/components/search");
      await mkdir(component, { recursive: true });
      await writeFile(
        join(component, "setup.ts"),
        'import {defineComponent} from "kello"; export default defineComponent({name:"search",extensions:{pg_trgm:{versions:["1.6"]}}});',
      );
      await writeFile(
        join(component, "schema.ts"),
        'import {defineSchema} from "kello/server"; export default defineSchema((f)=>({items:{title:f.text()}}));',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import {defineApplication} from "kello"; import search from "./components/search/setup"; const app=defineApplication({rpc:({os})=>({os})}); app.use(search); export default app;',
      );
      await prepareProject(root);
      const initial = await generateRelease(root, "initial");
      const app = initial.scopes.find((scope) => scope.mountPath === "")!.artifact.plan;
      const child = initial.scopes.find((scope) => scope.mountPath !== "")!.artifact.plan;
      if (app.format !== 3 || child.format !== 3) throw new Error("Expected scoped extension artifacts");
      expect(app.requiredApi?.apis.map(({ manifest }) => manifest.contract.extension)).toEqual(["citext", "pg_trgm"]);
      expect(child.requiredApi?.apis.map(({ manifest }) => manifest.contract.extension)).toEqual(["pg_trgm"]);
      // An actual historical installation-only head, with otherwise identical physical/install state.
      const { requiredApi: _removed, ...installationOnly } = app;
      await rm(join(root, "migrations", `${app.hash}_initial`), { recursive: true });
      await writeMigration(root, "migrations", "initial", {
        ...installationOnly,
        hash: migrationHash(installationOnly),
      });
      const before = await nativeState();
      await assert.rejects(applyProjectMigrations(root, role), { code: "UNGENERATED_SCHEMA" });
      expect(await nativeState()).toEqual(before);
      // A well-hashed historical API pin may differ from current accepted source with the same installation.
      if (!app.requiredApi) throw new Error("Missing generated API evidence");
      const changedApi = structuredClone(app.requiredApi);
      const manifest = changedApi.apis.find(({ manifest }) => manifest.contract.extension === "pg_trgm")!.manifest;
      const routine = manifest.contract.members.find(
        (member) => member.kind === "routine" && member.name === "similarity",
      );
      if (!routine || routine.kind !== "routine") throw new Error("Missing captured similarity routine");
      routine.returns = { namespace: "pg_catalog", name: "bool" };
      manifest.digest = extensionContractDigest(manifest.contract);
      const changedHead = { ...app, requiredApi: changedApi };
      const historical = (await readMigrations(root, "migrations")).at(-1)!;
      await rm(historical.directory, { recursive: true });
      await writeMigration(root, "migrations", "initial", { ...changedHead, hash: migrationHash(changedHead) });
      await assert.rejects(applyProjectMigrations(root, role), { code: "UNGENERATED_SCHEMA" });
      expect(await nativeState()).toEqual(before);
      const matching = await generateRelease(root, "typed_evidence");
      expect(matching.plan.before).toBe(matching.plan.after);
      expect(matching.plan.statements).toEqual([]);
      expect((await readMigrations(root, "migrations")).at(-1)?.plan).toHaveProperty("requiredApi");
      // A matching head cannot make a never-applied incompatible historical pin executable.
      await assert.rejects(applyProjectMigrations(root, role), /reviewed matching contract/);
      await withMigrationConnection(url, async (client) => {
        expect((await client.query("SELECT to_regclass('app.tasks') AS relation")).rows[0].relation).toBeNull();
      });
      // Restore the genuine installation-only predecessor and regenerate the typed-only step.
      for (const artifact of await readMigrations(root, "migrations"))
        await rm(artifact.directory, { recursive: true });
      await writeMigration(root, "migrations", "initial", {
        ...installationOnly,
        hash: migrationHash(installationOnly),
      });
      const compatible = await generateRelease(root, "typed_evidence");
      expect(compatible.plan.before).toBe(compatible.plan.after);
      expect(compatible.plan.statements).toEqual([]);
      const applied = await applyProjectMigrations(root, role);
      expect(applied.components).toHaveLength(1);
      assert(applied.extensions, "Expected extension installation result");
      expect(applied.extensions.installed.map((entry) => entry.name)).toEqual(["citext", "pg_trgm"]);
      await withMigrationConnection(url, async (client) => {
        expect(
          (await client.query("SELECT extversion FROM pg_extension WHERE extname='pg_trgm'")).rows[0].extversion,
        ).toBe("1.6");
      });
    } finally {
      if (previous === undefined) delete process.env.LOOM_API_ARTIFACT_DATABASE;
      else process.env.LOOM_API_ARTIFACT_DATABASE = previous;
      await withMigrationConnection(url, async (client) => {
        if ((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
          await client.query(`GRANT ${quoteIdentifier(role)} TO CURRENT_USER`);
          await client.query(`DROP OWNED BY ${quoteIdentifier(role)}`);
          await client.query(`DROP ROLE ${quoteIdentifier(role)}`);
        }
      });
      await rm(root, { recursive: true, force: true });
    }
  });
}, 120000);
