import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, mkdir, realpath, symlink, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import pg from "pg";
import {
  initializeProject,
  prepareProject,
  synchronizeDevelopment,
  watchDevelopment,
  componentNamespace,
} from "kello/tooling";

/** Real control-plane checks and PostgreSQL; source saves drive compiled development synchronization. */
test.skipIf(process.env.LOOM_CLOUD_AUTH_DEV_WATCH !== "1")(
  "auth plugin saves synchronize once and preserve data on a real Neon development branch",
  async () => {
    const projectId = process.env.LOOM_CLOUD_PROJECT_ID;
    const branchId = process.env.LOOM_CLOUD_BRANCH_ID;
    const connectionString = process.env.LOOM_TEST_DATABASE_URL;
    assert(projectId && branchId && connectionString);
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const namespace = `authwatch_${suffix}`;
    const metadataNamespace = `loom_authwatch_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const mount = `identity_${suffix}`;
    const authNamespace = componentNamespace(mount);
    const root = await mkdtemp(join(tmpdir(), "loom-auth-watch-"));
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    let watcher: Awaited<ReturnType<typeof watchDevelopment>> | undefined;
    let updates = 0;
    async function write(path: string, contents: string) {
      await writeFile(join(root, path), contents);
    }
    async function waitForUpdate(previous: number) {
      const deadline = Date.now() + 60000;
      while (updates === previous && Date.now() < deadline) {
        if (watcher?.failure) throw new Error("Auth development synchronization failed", { cause: watcher.failure });
        await setTimeout(100);
      }
      assert(updates > previous, "Watcher did not synchronize source change");
      await watcher?.settled();
    }
    try {
      await initializeProject(root, "authwatch");
      await mkdir(join(root, "node_modules"));
      for (const name of ["kello", "valibot", "zod", "drizzle-orm", "better-auth"])
        await symlink(
          await realpath(fileURLToPath(new URL(`../node_modules/${name}`, import.meta.url))),
          join(root, "node_modules", name),
        );
      await mkdir(join(root, "kello/components/identity"), { recursive: true });
      await write(
        "kello/schema.ts",
        `import {defineSchema} from "kello/server"; export default defineSchema(f=>({records:{title:f.text()}}),{namespace:"${namespace}"});`,
      );
      await rm(join(root, "kello/functions/tasks.ts"));
      await rm(join(root, "kello/contracts/tasks.ts"));
      await write(
        "kello.config.ts",
        `import {defineConfig} from "kello/tooling"; export default defineConfig(${JSON.stringify({ project: "authwatch", database: { namespace, metadataNamespace }, provider: { projectId, targets: { development: { branchId } } } })});`,
      );
      const auth = (plugins: string) =>
        write(
          "kello/components/identity/setup.ts",
          `import {defineBetterAuth} from "kello/better-auth"; import {betterAuth} from "better-auth"; import {organization} from "better-auth/plugins"; export default defineBetterAuth({name:"identity",env:{},create:({database})=>betterAuth({database,baseURL:"https://auth.example.test",secret:"test-only-auth-watch-secret-at-least-32-characters",plugins:${plugins}})});`,
        );
      await auth("[]");
      await write(
        "kello/app.config.ts",
        `import {defineApplication} from "kello"; import identity from "./components/identity/setup"; const app=defineApplication({rpc:({os})=>({os})}); app.use(identity,{name:"${mount}"}); export default app;`,
      );
      const address = new URL(connectionString);
      watcher = await watchDevelopment(
        root,
        async () => {
          const candidate = await prepareProject(root);
          await synchronizeDevelopment({
            root,
            sourceVersion: candidate.version,
            databaseName: decodeURIComponent(address.pathname.slice(1)),
            migrationRole: decodeURIComponent(address.username),
            runtimeRole,
          });
          updates++;
        },
        { debounceMs: 100 },
      );
      await watcher.flush();
      assert(updates >= 1);
      const initialUpdates = updates;
      await setTimeout(400);
      assert.equal(updates, initialUpdates, "Ownership writes must not retrigger synchronization");
      assert.equal(
        (
          await admin.query(
            `SELECT count(*)::int AS n FROM "${metadataNamespace}".development_history WHERE namespace=$1`,
            [authNamespace],
          )
        ).rows[0].n,
        1,
      );
      let previous = updates;
      await auth("[organization()]");
      await waitForUpdate(previous);
      await admin.query(
        `INSERT INTO "${authNamespace}".organization(id,name,slug,"createdAt") VALUES('preserved','Retained','retained',now())`,
      );
      const history = await admin.query(
        `SELECT count(*)::int AS n FROM "${metadataNamespace}".development_history WHERE namespace=$1`,
        [authNamespace],
      );
      assert.equal(history.rows[0].n, 2);
      previous = updates;
      await auth("[]");
      await waitForUpdate(previous);
      assert.equal(
        (await admin.query(`SELECT name FROM "${authNamespace}".organization WHERE id='preserved'`)).rows[0].name,
        "Retained",
      );
      previous = updates;
      await auth("[organization()]");
      await waitForUpdate(previous);
      assert.equal((await admin.query(`SELECT count(*)::int AS n FROM "${authNamespace}".organization`)).rows[0].n, 1);
      previous = updates;
      await auth(
        '[organization(), {id:"external",schema:{externalLog:{disableMigration:true,fields:{value:{type:"string"}}}}}]',
      );
      await setTimeout(200);
      await watcher.flush();
      assert(watcher.failure, "Missing external table must reject the candidate");
      assert.equal(updates, previous);
      assert.equal((await admin.query(`SELECT count(*)::int AS n FROM "${authNamespace}".organization`)).rows[0].n, 1);
      await auth("[organization()]");
      await setTimeout(200);
      await watcher.flush();
      assert.equal(watcher.failure, null);
      await watcher.stop();
      previous = updates;
      await auth("[organization({teams:{enabled:true}})]");
      await setTimeout(400);
      assert.equal(updates, previous);
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema=$1 AND table_name='team'",
            [authNamespace],
          )
        ).rows[0].n,
        0,
      );
    } finally {
      await watcher?.stop();
      for (const schema of [authNamespace, namespace, metadataNamespace])
        await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
      await rm(root, { recursive: true, force: true });
    }
  },
  180_000,
);
