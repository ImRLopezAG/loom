import { expect, test } from "bun:test";
import { mkdtemp, mkdir, realpath, symlink, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeProject, prepareProject, planRelease, applyProjectMigrations } from "kello/tooling";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { withMigrationConnection, quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import assert from "node:assert/strict";

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "CLI and direct tooling agree on extension operations, refuse config drift and redact target failures",
  async () => {
    await withExtensionDatabase(async (url) => {
      const root = await mkdtemp(join(tmpdir(), "loom-extension-cli-"));
      const suffix = crypto.randomUUID().replaceAll("-", "");
      const runtimeRole = `extension_runtime_${suffix}`;
      const limitedRole = `extension_limited_${suffix}`;
      const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
      const previous = process.env.LOOM_EXTENSION_CLI_DATABASE;
      process.env.LOOM_EXTENSION_CLI_DATABASE = url;
      async function configure(version: string) {
        await writeFile(
          join(root, "kello.config.ts"),
          `import {defineConfig} from "kello/tooling"; export default defineConfig(${JSON.stringify({
            project: "extension-cli",
            database: { migrationUrlEnv: "LOOM_EXTENSION_CLI_DATABASE", extensions: { pg_trgm: { version } } },
          })});`,
        );
      }
      async function run(args: string[], exitCode = 0, connection = url) {
        const child = Bun.spawn([process.execPath, cli, ...args, "--cwd", root, "--json"], {
          env: { ...process.env, LOOM_EXTENSION_CLI_DATABASE: connection },
          stdout: "pipe",
          stderr: "pipe",
        });
        const output = await new Response(child.stdout).text();
        const error = await new Response(child.stderr).text();
        expect(await child.exited).toBe(exitCode);
        expect(output + error).not.toContain(url);
        expect(output + error).not.toContain("credential-sentinel");
        return JSON.parse(output || error);
      }
      try {
        await initializeProject(root, "extension-cli");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm"])
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        const component = join(root, "kello/components/catalog");
        await mkdir(component, { recursive: true });
        await writeFile(
          join(component, "setup.ts"),
          'import {defineComponent} from "kello"; export default defineComponent({name:"catalog"});',
        );
        await writeFile(
          join(component, "schema.ts"),
          'import {defineSchema} from "kello/server"; export default defineSchema((f)=>({products:{title:f.text()}}));',
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import {defineApplication} from "kello"; import catalog from "./components/catalog/setup"; const app=defineApplication({rpc:({os})=>({os})}); app.use(catalog); app.use(catalog,{name:"second"}); export default app;',
        );
        await configure("unavailable-credential-sentinel");
        expect((await run(["schema", "diff"], 4)).error.code).toBe("EXTENSION_UNAVAILABLE");
        await configure("1.3");
        await prepareProject(root);
        const direct = await planRelease(root);
        const planned = await run(["schema", "diff"]);
        expect(planned.plan.hash).toBe(direct.hash);
        expect(planned.plan.extensions.operations.map((operation: { kind: string }) => operation.kind)).toEqual([
          "install",
        ]);
        await withMigrationConnection(url, async (client) => {
          await client.query(`CREATE ROLE ${quoteIdentifier(limitedRole)} LOGIN PASSWORD 'credential-sentinel'`);
        });
        const limitedUrl = new URL(url);
        limitedUrl.username = limitedRole;
        limitedUrl.password = "credential-sentinel";
        expect((await run(["schema", "diff"], 4, limitedUrl.href)).error.code).toBe("EXTENSION_PRIVILEGE");
        const initial = await run(["migrations", "generate", "--name", "initial"]);
        expect(initial.artifact.scopes).toHaveLength(3);
        for (const scope of initial.artifact.scopes.filter((scope: { mountPath: string }) => scope.mountPath)) {
          expect(scope.artifact.plan.extensionScope).toBe("component");
          expect(scope.artifact.plan.extensions.operations).toEqual([]);
        }
        const { status: before } = await run(["migrations", "status"]);
        expect(before.extensions.required[0]).toMatchObject({ name: "pg_trgm", version: "1.3", schema: "extensions" });
        expect(
          before.extensions.available.some(
            (entry: { name: string; version: string }) => entry.name === "pg_trgm" && entry.version === "1.3",
          ),
        ).toBe(true);
        expect(before.extensions.pending).toHaveLength(1);
        const applied = await run(["migrations", "apply", "--runtime-role", runtimeRole]);
        expect(applied.receipt.components).toHaveLength(2);
        expect(applied.receipt.extensions.installed[0].version).toBe("1.3");
        await configure("1.6");
        await prepareProject(root);
        await assert.rejects(applyProjectMigrations(root, runtimeRole), { code: "UNGENERATED_SCHEMA" });
        expect((await run(["migrations", "apply", "--runtime-role", runtimeRole], 4)).error.code).toBe(
          "UNGENERATED_SCHEMA",
        );
        const generated = await run(["migrations", "generate", "--name", "update"]);
        expect(generated.artifact.plan.extensions.operations[0].kind).toBe("update");
        expect((await run(["migrations", "apply", "--runtime-role", runtimeRole], 4)).error.code).toBe(
          "REVIEW_REQUIRED",
        );
        await run([
          "migrations",
          "apply",
          "--runtime-role",
          runtimeRole,
          "--reviewed-hash",
          generated.artifact.plan.hash,
        ]);
        const doctor = await run(["doctor"]);
        expect(doctor.extensions.plan.operations).toEqual([]);
        expect(
          doctor.extensions.status.installed.find((entry: { name: string }) => entry.name === "pg_trgm").version,
        ).toBe("1.6");
      } finally {
        if (previous === undefined) delete process.env.LOOM_EXTENSION_CLI_DATABASE;
        else process.env.LOOM_EXTENSION_CLI_DATABASE = previous;
        await withMigrationConnection(url, async (client) => {
          for (const role of [runtimeRole, limitedRole]) {
            if ((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
              await client.query(`DROP OWNED BY ${quoteIdentifier(role)}`);
              await client.query(`DROP ROLE ${quoteIdentifier(role)}`);
            }
          }
        });
        await rm(root, { recursive: true, force: true });
      }
    });
  },
  30000,
);
