import assert from "node:assert/strict";
import { test } from "bun:test";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, readFile, readlink, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import pg from "pg";
import * as v from "valibot";
import { createLoomNeonApi } from "loom/tooling";
import { prepareCloudComponents } from "../fixtures/cloud-components";
import { createCloudIssuer } from "../fixtures/cloud-issuer";

const readySchema = v.object({ event: v.literal("ready"), version: v.string(), url: v.string() });

/** Real Neon database and packaged CLI; saves, never manual generation/synchronization, drive every update. */
test.skipIf(process.env.LOOM_CLOUD_DEV_COMPONENT_WATCH !== "1")(
  "running loom dev discovers a newly mounted component and synchronizes its schema, client and functions",
  async () => {
    const projectId = v.parse(v.string(), process.env.LOOM_CLOUD_PROJECT_ID);
    const api = createLoomNeonApi();
    const main = (await api.listBranches(projectId)).find((branch) => branch.isDefault);
    assert(main);
    const branchName = `loom-acceptance-dev-watch-${crypto.randomUUID()}`;
    const root = await mkdtemp(join(tmpdir(), "loom-cloud-dev-watch-"));
    const cli = createRequire(import.meta.resolve("loom/tooling")).resolve("neon/dist/index.js");
    const checks: string[] = [];
    const cleanupFailures: string[] = [];
    let branchId: string | undefined;
    let admin: pg.Client | undefined;
    let child: Bun.Subprocess<"ignore", "pipe", "pipe"> | undefined;
    let drain: Promise<unknown>[] = [];
    let stdout = "";
    let stderr = "";
    let stage = "create branch";
    let passed = false;
    let failure: unknown;
    async function run(command: string[], env = process.env) {
      const subprocess = Bun.spawn(command, {
        cwd: root,
        env,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120000,
      });
      const [out, err, code] = await Promise.all([
        new Response(subprocess.stdout).text(),
        new Response(subprocess.stderr).text(),
        subprocess.exited,
      ]);
      // Provider output can contain credentials; retain neither it nor its stderr in assertions.
      assert.equal(code, 0, `Acceptance subprocess failed at ${stage} (${command[0]}, stderr bytes ${err.length})`);
      return out.trim();
    }
    async function neon(args: string[], json = true) {
      return run(["node", cli, ...args, "--project-id", projectId, ...(json ? ["--output", "json"] : [])]);
    }
    async function write(path: string, contents: string) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), contents);
    }
    function events() {
      return stdout
        .split("\n")
        .filter(Boolean)
        .flatMap((line) => {
          try {
            const parsed = v.safeParse(readySchema, JSON.parse(line));
            return parsed.success ? [parsed.output] : [];
          } catch {
            return [];
          }
        });
    }
    async function nextReady(previous?: string) {
      const deadline = Date.now() + 180000;
      while (Date.now() < deadline) {
        const event = events().at(-1);
        if (event && event.version !== previous) return event;
        assert(child?.exitCode === null, `loom dev exited during ${stage}`);
        await setTimeout(100);
      }
      throw new Error(
        `loom dev did not become ready during ${stage}; update failure: ${stderr.includes("DEVELOPMENT_UPDATE_FAILED")}`,
      );
    }
    const app = (mounted: boolean) => `import { defineApplication } from "loom/server";
${mounted ? 'import notes from "./components/notes/setup";' : ""}
const app=defineApplication({rpc:({os})=>({os})});
${mounted ? 'app.use(notes,{name:"notes",public:"notes"});' : ""}
export default app;`;
    const schema = (extra = "") =>
      `import {defineSchema} from "loom/server"; export default defineSchema(s=>({records:{title:s.text().notNull()${extra}}}));`;
    const functions = (prefix: string) => `import {os} from "../_generated/rpc";
export default os.records.router({add:os.records.add.handler(async({input,context})=>{
const [row]=await context.db.insert(context.tables.records).values({title:${JSON.stringify(prefix)}+input.title}).returning({title:context.tables.records.title});
if(!row) throw new Error("Insert failed"); return row;
})});`;
    try {
      const branch = v.object({ id: v.string(), name: v.string() });
      const result = v.parse(
        v.union([branch, v.object({ branch })]),
        JSON.parse(await neon(["branches", "create", "--parent", main.id, "--name", branchName, "--no-secrets"])),
      );
      const created = "branch" in result ? result.branch : result;
      assert.equal(created.name, branchName);
      assert.notEqual(created.id, main.id);
      branchId = created.id;
      const uri = await neon(
        ["connection-string", branchId, "--role-name", "neondb_owner", "--ssl", "verify-full"],
        false,
      );
      admin = new pg.Client({ connectionString: uri, connectionTimeoutMillis: 15000 });
      await admin.connect();
      const suffix = crypto.randomUUID().replaceAll("-", "");
      const runtimeRole = `runtime_${suffix}`;
      const namespace = `watch_${suffix}`;
      const metadata = `loom_watch_${suffix}`;
      // Neon resolves this isolated runtime role's URI through its actual control plane.
      await admin.query(`CREATE ROLE "${runtimeRole}" LOGIN NOINHERIT PASSWORD '${crypto.randomUUID()}'`);
      stage = "prepare packed consumer";
      console.info("[dev-watch] prepare packed consumer");
      await prepareCloudComponents(root);
      await rm(join(root, "loom"), { recursive: true, force: true });
      await write(
        "loom/schema.ts",
        `import {defineSchema} from "loom/server"; export default defineSchema(s=>({rootRecords:{title:s.text()}}),{namespace:"${namespace}"});`,
      );
      await write("loom/app.config.ts", app(false));
      await write(
        "loom/auth.config.ts",
        'import {defineRpcAuth} from "loom/server"; export default defineRpcAuth({authorize:({identity})=>{if(!identity) throw new Error("Authentication required");}});',
      );
      await write(
        "loom/contracts/health.ts",
        'import {defineContract,oc} from "loom/contract"; import * as v from "valibot"; export default defineContract({get:oc.output(v.string())});',
      );
      await write(
        "loom/functions/health.ts",
        'import {os} from "../_generated/rpc"; export default os.health.router({get:os.health.get.handler(()=>"ready")});',
      );
      const issuer = await createCloudIssuer(root, projectId, branchId);
      const token = await issuer.token("dev-watch-owner", "loom-acceptance", "15m");
      await write(
        "loom.config.ts",
        `import {defineConfig} from "loom/tooling"; export default defineConfig(${JSON.stringify({ project: "dev-watch", database: { namespace, metadataNamespace: metadata }, provider: { projectId, targets: { development: { branchId } } }, auth: { audience: "loom-acceptance", issuers: [{ issuer: issuer.issuer, jwksUrl: issuer.jwksUrl }] } })});`,
      );
      const address = new URL(uri);
      await write(
        "loom.dev.json",
        JSON.stringify({
          format: 1,
          databaseName: decodeURIComponent(address.pathname.slice(1)),
          migrationRole: decodeURIComponent(address.username),
          runtimeRole,
          deployment: "dev-watch",
          activationTokenEnv: "LOOM_WATCH_ACTIVATION",
          port: 0,
          debounceMs: 100,
          jobPollMs: 1000,
        }),
      );
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        LOOM_WATCH_ACTIVATION: crypto.randomUUID().replaceAll("-", "").repeat(2),
      };
      delete env.NEON_API_KEY;
      stage = "initial CLI startup";
      console.info("[dev-watch] initial CLI startup");
      child = Bun.spawn(
        [
          process.execPath,
          join(root, "node_modules/loom/dist/cli.js"),
          "dev",
          "--development",
          "loom.dev.json",
          "--cwd",
          root,
          "--json",
        ],
        { cwd: root, env, stdin: "ignore", stdout: "pipe", stderr: "pipe" },
      );
      const running = child;
      const outputStream = running.stdout;
      const errorStream = running.stderr;
      drain = [
        (async () => {
          for await (const chunk of outputStream) stdout += new TextDecoder().decode(chunk);
        })(),
        (async () => {
          for await (const chunk of errorStream) stderr += new TextDecoder().decode(chunk);
        })(),
      ];
      const initial = await nextReady();
      assert.equal((await admin.query(`SELECT count(*)::int n FROM "${metadata}".component_namespaces`)).rows[0].n, 0);
      checks.push("packaged-cli-starts-without-component");
      await symlink(
        fileURLToPath(new URL("../../../apps/loom/node_modules/@types", import.meta.url)),
        join(root, "node_modules/@types"),
      );
      await write(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: {
            target: "ES2023",
            module: "ESNext",
            moduleResolution: "Bundler",
            strict: true,
            skipLibCheck: true,
            noEmit: true,
            types: ["node"],
          },
          files: ["types.ts"],
        }),
      );
      await write(
        "types.ts",
        `import {createServerClient} from "./loom/_generated/api";
const api=createServerClient({url:"http://localhost",getToken:async()=>null});
const result:Promise<string>=api.client.health.get(); void result;
// @ts-expect-error An unmounted component has no generated client endpoint.
api.client.notes.records.add({title:"absent"});`,
      );
      await run([
        fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
        "-p",
        join(root, "tsconfig.json"),
      ]);
      checks.push("unmounted-component-absent-from-generated-types");
      stage = "mount component while watcher runs";
      console.info("[dev-watch] mount component while watcher runs");
      await write(
        "loom/components/notes/setup.ts",
        'import {defineComponent} from "./_generated/setup"; export default defineComponent({name:"notes"});',
      );
      await write("loom/components/notes/schema.ts", schema());
      await write(
        "loom/components/notes/contracts/records.ts",
        'import {defineContract,oc} from "../_generated/contract"; import * as v from "valibot"; export default defineContract({add:oc.input(v.object({title:v.string()})).output(v.object({title:v.string()}))});',
      );
      await write("loom/components/notes/functions/records.ts", functions("v1:"));
      await write("loom/app.config.ts", app(true));
      const mounted = await nextReady(initial.version);
      const scopes = await admin.query<{ namespace: string }>(
        `SELECT namespace FROM "${metadata}".component_namespaces WHERE mount_path='notes' AND state='mounted'`,
      );
      assert.equal(scopes.rows.length, 1);
      const componentNamespace = scopes.rows[0]!.namespace;
      assert.match(componentNamespace, /^[a-z0-9_]+$/);
      await admin.query(`SELECT title FROM "${componentNamespace}".records`);
      checks.push("active-watcher-mount-creates-real-schema-and-table");
      async function invoke(url: string, expected: string) {
        await write(
          "invoke.ts",
          `import assert from "node:assert/strict"; import {createServerClient} from "./loom/_generated/api";
const api=createServerClient({url:${JSON.stringify(url)},getToken:async()=>process.env.LOOM_WATCH_TOKEN ?? null});
assert.deepEqual(await api.client.notes.records.add({title:"accepted"}),{title:${JSON.stringify(expected)}}); api.dispose();`,
        );
        await run([process.execPath, join(root, "invoke.ts")], { ...process.env, LOOM_WATCH_TOKEN: token });
      }
      await invoke(mounted.url, "v1:accepted");
      assert.equal(
        (await admin.query(`SELECT title FROM "${componentNamespace}".records`)).rows[0].title,
        "v1:accepted",
      );
      checks.push("generated-native-client-inserts-component-row");
      stage = "generated TypeScript 7 client checks";
      console.info("[dev-watch] generated TypeScript 7 client checks");
      await write(
        "types.ts",
        `import {createServerClient} from "./loom/_generated/api";
const api=createServerClient({url:"http://localhost",getToken:async()=>null});
const result:Promise<{title:string}>=api.client.notes.records.add({title:"typed"}); void result;
// @ts-expect-error The generated component input rejects numbers.
api.client.notes.records.add({title:123});
// @ts-expect-error Missing procedures are not exposed by the generated client.
api.client.notes.records.missing();
// @ts-expect-error The output is inferred as string, not number.
const wrong:Promise<{title:number}>=api.client.notes.records.add({title:"typed"}); void wrong;
`,
      );
      await run([
        fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
        "-p",
        join(root, "tsconfig.json"),
      ]);
      checks.push("ts7-positive-and-negative-generated-client-types");
      stage = "schema edit synchronization";
      console.info("[dev-watch] schema edit synchronization");
      await write("loom/components/notes/schema.ts", schema(",description:s.text()"));
      const expanded = await nextReady(mounted.version);
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::int n FROM information_schema.columns WHERE table_schema=$1 AND table_name='records' AND column_name='description'",
            [componentNamespace],
          )
        ).rows[0].n,
        1,
      );
      assert.equal((await admin.query(`SELECT count(*)::int n FROM "${componentNamespace}".records`)).rows[0].n, 1);
      checks.push("schema-save-adds-column-and-preserves-row");
      stage = "function edit synchronization";
      console.info("[dev-watch] function edit synchronization");
      await write("loom/components/notes/functions/records.ts", functions("v2:"));
      const updated = await nextReady(expanded.version);
      await invoke(updated.url, "v2:accepted");
      checks.push("function-save-updates-generated-version-and-runtime");
      stage = "stopped watcher";
      console.info("[dev-watch] stopped watcher");
      running.kill("SIGINT");
      assert.equal(await running.exited, 0);
      await Promise.all(drain);
      const generated = await readlink(join(root, "loom/_generated/current"));
      const apiDeclaration = await readFile(join(root, "loom/_generated/current/api.d.ts"), "utf8");
      await write("loom/components/notes/schema.ts", schema(",description:s.text(),stopped:s.text()"));
      await write("loom/components/notes/functions/records.ts", functions("v3:"));
      await setTimeout(1500);
      assert.equal(await readlink(join(root, "loom/_generated/current")), generated);
      assert.equal(await readFile(join(root, "loom/_generated/current/api.d.ts"), "utf8"), apiDeclaration);
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::int n FROM information_schema.columns WHERE table_schema=$1 AND column_name='stopped'",
            [componentNamespace],
          )
        ).rows[0].n,
        0,
      );
      await assert.rejects(fetch(updated.url));
      checks.push("stopped-dev-does-not-migrate-or-generate-and-listener-closes");
      assert(!`${stdout}${stderr}`.includes(env.LOOM_WATCH_ACTIVATION!));
      assert(!`${stdout}${stderr}`.includes(token));
      passed = true;
    } catch (cause) {
      failure = cause;
    } finally {
      if (child?.exitCode === null) {
        child.kill("SIGKILL");
        await child.exited;
      }
      await Promise.all(drain);
      try {
        await admin?.end();
      } catch {
        cleanupFailures.push("database connection");
      }
      try {
        const matches = (await api.listBranches(projectId)).filter((branch) => branch.name === branchName);
        assert(matches.length <= 1);
        for (const branch of matches) {
          assert(!branch.isDefault && !branch.protected && branch.id !== main.id);
          assert.equal(branch.parentId, main.id);
          branchId ??= branch.id;
          await neon(["branches", "delete", branch.id]);
        }
      } catch {
        cleanupFailures.push("disposable branch");
      }
      await rm(root, { recursive: true, force: true });
      if (process.env.LOOM_CLOUD_DEV_WATCH_RECEIPT)
        await writeFile(
          process.env.LOOM_CLOUD_DEV_WATCH_RECEIPT,
          JSON.stringify(
            {
              projectId,
              branchId,
              branchName,
              passed,
              stage,
              checks,
              cleanup: cleanupFailures.length === 0,
              cleanupFailures,
            },
            null,
            2,
          ),
        );
    }
    assert.deepEqual(cleanupFailures, [], "Acceptance cleanup failed");
    if (failure !== undefined) throw failure;
  },
  600000,
);
