import assert from "node:assert/strict";
import { appendFile, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { initializeProject, loadProject, generateProject, bootstrapDatabase } from "kello/tooling";
import {
  writePgroutingProject,
  assertPgroutingGeneratedSource,
  type PgroutingProjectSelection,
} from "./pgrouting-generated-project.ts";

/** Run under Bun in the copied frozen consumer. Tooling statically imports Bun. */
export async function preparePgroutingPublicProjects(
  root: string,
  modules: string,
  oracle: string,
  selections: readonly PgroutingProjectSelection[] = [
    "empty",
    "explicit-empty",
    "future",
    "selected",
    "default",
    "custom",
  ],
) {
  assert.equal(new URL(oracle).hostname, "127.0.0.1");
  const state: {
    root: string;
    selection: string;
    version: string;
    connectionString?: string;
    runtimeConnectionString?: string;
    metadataNamespace?: string;
    runtimeRole?: string;
  }[] = [];
  for (const selection of selections) {
    const project = join(root, selection);
    await initializeProject(project, `pgrouting-${selection}`);
    await symlink(modules, join(project, "node_modules"));
    await writePgroutingProject(project, selection);
    await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const first = await loadProject(project);
    if (selection === "empty") assert.equal(first.config.database.extensions, undefined);
    if (selection === "selected" || selection === "default" || selection === "custom") {
      assert.deepEqual(Object.keys(first.config.database.extensions ?? {}).sort(), ["pgrouting", "postgis"]);
      assert.equal(first.componentScopes.length, 1);
      assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}).sort(), ["pgrouting", "postgis"]);
    }
    const generated = await generateProject(project);
    assertPgroutingGeneratedSource(await readFile(join(project, "kello/_generated/extensions.ts"), "utf8"), selection);
    const types = Bun.spawn([join(modules, ".bin/tsc"), "-p", join(project, "tsconfig.json")], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = (await new Response(types.stdout).text()) + (await new Response(types.stderr).text());
    assert.equal(await types.exited, 0, output);
    assert.equal((await generateProject(project)).version, generated.version);
    const disk = await import(pathToFileURL(join(project, "kello/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(project, "kello/_generated/server.ts")).href);
    assert.equal(server.extensions, disk.extensions);
    const bundleEntry = join(project, "public-bindings.ts");
    await writeFile(
      bundleEntry,
      'export { extensions } from "./kello/_generated/extensions"; export { extensions as serverExtensions } from "./kello/_generated/server";\n',
    );
    const bundle = await Bun.build({
      entrypoints: [bundleEntry],
      outdir: join(project, ".loom-proof"),
      target: "node",
      packages: "external",
    });
    assert.equal(bundle.success, true, JSON.stringify(bundle.logs));
    if (selection === "empty" || selection === "explicit-empty") assert.equal(disk.extensions, undefined);
    if (selection === "future") {
      assert.equal(disk.extensions.pgrouting.version, "future");
      assert.equal(disk.extensions.pgrouting.apiSupport.status, "unverified");
      assert.equal("sql" in disk.extensions.pgrouting, false);
    }
    if (selection === "selected" || selection === "default" || selection === "custom") {
      const child = await import(
        pathToFileURL(join(project, "kello/components/routing/_generated/extensions.ts")).href
      );
      assert.deepEqual(Object.keys(child.extensions).sort(), ["pgrouting", "postgis"]);
      const database = `pgr_${crypto.randomUUID().replaceAll("-", "")}`;
      const runtimeRole = `pgr_${crypto.randomUUID().replaceAll("-", "")}`;
      const metadataNamespace = `loom_pgr_${crypto.randomUUID().replaceAll("-", "")}`;
      await appendFile(
        join(root, "resources.jsonl"),
        JSON.stringify({ event: "database-create-intent", database, runtimeRole, metadataNamespace }) + "\n",
      );
      const admin = new pg.Client({ connectionString: oracle });
      await admin.connect();
      try {
        await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
      } finally {
        await admin.end();
      }
      const url = new URL(oracle);
      url.pathname = `/${database}`;
      const connectionString = url.href;
      const native = new pg.Client({ connectionString });
      await native.connect();
      try {
        for (const name of new Set([disk.extensions.postgis.schema, disk.extensions.pgrouting.schema]))
          await native.query(`CREATE SCHEMA ${pg.escapeIdentifier(name)}`);
        await native.query(
          `CREATE EXTENSION postgis WITH SCHEMA ${pg.escapeIdentifier(disk.extensions.postgis.schema)} VERSION '3.6.4'`,
        );
        await native.query(
          `CREATE EXTENSION pgrouting WITH SCHEMA ${pg.escapeIdentifier(disk.extensions.pgrouting.schema)} VERSION '3.8.0'`,
        );
      } finally {
        await native.end();
      }
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      const authority = new pg.Client({ connectionString });
      await authority.connect();
      try {
        await authority.query(`ALTER ROLE ${pg.escapeIdentifier(runtimeRole)} LOGIN`);
        for (const name of new Set([disk.extensions.postgis.schema, disk.extensions.pgrouting.schema]))
          await authority.query(
            `GRANT USAGE ON SCHEMA ${pg.escapeIdentifier(name)} TO ${pg.escapeIdentifier(runtimeRole)}`,
          );
      } finally {
        await authority.end();
      }
      const runtimeUrl = new URL(connectionString);
      runtimeUrl.username = runtimeRole;
      state.push({
        root: project,
        selection,
        version: generated.version,
        connectionString,
        runtimeConnectionString: runtimeUrl.href,
        metadataNamespace,
        runtimeRole,
      });
    } else state.push({ root: project, selection, version: generated.version });
  }
  for (const [name, dependency] of [
    ["missing-dependency", {}],
    ["wrong-dependency", { postgis: { version: "3.6.3" } }],
  ] as const) {
    const project = join(root, name);
    await initializeProject(project, `pgrouting-${name}`);
    await symlink(modules, join(project, "node_modules"));
    await writeFile(
      join(project, "kello.config.ts"),
      `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: ${JSON.stringify({ pgrouting: { version: "3.8.0" }, ...dependency })} } });\n`,
    );
    await assert.rejects(async () => {
      await loadProject(project);
      await generateProject(project);
    }, /pgRouting 3\.8\.0 requires an explicitly selected verified PostGIS 3\.6\.4 dependency/);
  }
  await writeFile(join(root, "runtime-state.json"), JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
  return state.map(({ root: project, selection, version }) => ({ root: project, selection, version }));
}
