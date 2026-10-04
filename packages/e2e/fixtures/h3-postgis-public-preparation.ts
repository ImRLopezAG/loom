import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { appendFile, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import {
  bootstrapDatabase,
  createSnapshot,
  emptySnapshot,
  generateProject,
  initializeProject,
  loadProject,
  migrationStatements,
} from "kello/tooling";
import {
  checkH3PostgisDisk,
  writeH3PostgisProject,
  H3_POSTGIS_KEYS,
  type H3PostgisGenerationSelection,
} from "./h3-postgis-generated-project.ts";
import {
  startH3PostgisOwnedPg,
  H3_POSTGIS_CONFIGURED_PLACEMENT,
  H3_POSTGIS_DEFAULT_PLACEMENT,
} from "./h3-postgis-owned-pg.ts";

const root = process.cwd();
const run = async (binary: string, args: string[], env = process.env) => {
  const child = Bun.spawn([binary, ...args], { cwd: root, env, stdout: "pipe", stderr: "pipe", timeout: 240000 });
  const outputs = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
  assert.equal(await child.exited, 0, outputs.join(""));
  console.log(outputs.join("").trim());
};
const results: Array<{ selection: H3PostgisGenerationSelection; version: string; types: true; runtime: boolean }> = [];
const fixture = await startH3PostgisOwnedPg(root);
const ownership = join(root, "runtime-ownership.jsonl");
try {
  const companions = {
    h3: { version: "4.2.3" },
    postgis: { version: "3.6.4" },
    postgis_raster: { version: "3.6.4" },
    h3_postgis: { version: "4.2.3" },
  };
  const prerequisites = [
    {
      name: "missing-h3",
      extensions: {
        postgis: companions.postgis,
        postgis_raster: companions.postgis_raster,
        h3_postgis: companions.h3_postgis,
      },
      error: /exact selected h3 4\.2\.3 companion contract/,
    },
    {
      name: "unreviewed-h3",
      extensions: { ...companions, h3: { version: "future" } },
      error: /exact selected h3 4\.2\.3 companion contract/,
    },
    {
      name: "unreviewed-postgis",
      extensions: { ...companions, postgis: { version: "future" } },
      error:
        /exact selected postgis 3\.6\.4 companion contract|postgis_raster 3\.6\.4 requires an explicitly selected PostGIS 3\.6\.4 dependency/,
    },
    {
      name: "unreviewed-raster",
      extensions: { ...companions, postgis_raster: { version: "future" } },
      error: /exact selected postgis_raster 3\.6\.4 companion contract/,
    },
    {
      name: "separate-raster",
      extensions: { ...companions, postgis_raster: { version: "3.6.4", schema: "invalid_separate_raster" } },
      error:
        /postgis_raster and postgis to share the installation schema|postgis_raster 3\.6\.4 must share the PostGIS installation schema/,
    },
  ];
  for (const test of prerequisites) {
    const project = join(root, test.name);
    await initializeProject(project, test.name);
    await symlink(join(root, "node_modules"), join(project, "node_modules"));
    await writeFile(
      join(project, "kello.config.ts"),
      `import { defineConfig } from "kello/tooling"; export default defineConfig(${JSON.stringify({ database: { extensions: test.extensions } })});\n`,
    );
    await assert.rejects(loadProject(project), test.error);
  }
  console.log("Bun public exact companion adapter/version and native schema prerequisites PASS");
  for (const selection of ["absent", "empty", "future", "selected", "custom"] as const) {
    const project = join(root, selection);
    const placement = selection === "custom" ? H3_POSTGIS_CONFIGURED_PLACEMENT : H3_POSTGIS_DEFAULT_PLACEMENT;
    await initializeProject(project, `h3pg${selection}`);
    await symlink(join(root, "node_modules"), join(project, "node_modules"));
    await writeH3PostgisProject(project, selection, placement);
    await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const first = await loadProject(project);
    if (selection === "absent" || selection === "empty") assert.equal(first.config.database.extensions, undefined);
    if (selection === "selected" || selection === "custom") {
      assert.deepEqual(Object.keys(first.config.database.extensions ?? {}).sort(), H3_POSTGIS_KEYS);
      assert.equal(first.componentScopes.length, 1);
      assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}).sort(), H3_POSTGIS_KEYS);
    }
    const generated = await generateProject(project);
    await checkH3PostgisDisk(project, selection, placement);
    await run("bun", ["node_modules/typescript/bin/tsc", "-p", join(project, "tsconfig.json")]);
    assert.equal((await generateProject(project)).version, generated.version);
    if (selection === "selected" || selection === "custom") {
      const connectionString = await fixture.provision(placement);
      const runtimeRole = `h3pg_runtime_${randomUUID().replaceAll("-", "")}`;
      const metadataNamespace = `loom_h3pg_${randomUUID().replaceAll("-", "")}`;
      const journal = (event: string) =>
        appendFile(ownership, JSON.stringify({ event, runtimeRole, metadataNamespace }) + "\n", { mode: 0o600 });
      const admin = new pg.Client({ connectionString });
      await admin.connect();
      try {
        for (const statement of await migrationStatements(
          await emptySnapshot(first.schema.metadata.namespace),
          await createSnapshot(first.schema),
        ))
          await admin.query(statement);
        await journal("attempted");
        await bootstrapDatabase({ connectionString, runtimeRole, metadataNamespace });
        await journal("created");
        // Administrative credentials only prepare the local fixture; the query handler has no admin surface.
        await run(
          process.env.H3_POSTGIS_NODE24 ?? "node",
          ["h3-postgis-cold-runtime.ts", project, selection, generated.version],
          {
            ...process.env,
            H3_POSTGIS_LOCAL_URL: connectionString,
            H3_POSTGIS_RUNTIME_ROLE: runtimeRole,
            H3_POSTGIS_METADATA_SCHEMA: metadataNamespace,
          },
        );
      } finally {
        try {
          if ((await admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [runtimeRole])).rowCount)
            await admin.query(
              `GRANT ${pg.escapeIdentifier(runtimeRole)} TO CURRENT_USER; DROP OWNED BY ${pg.escapeIdentifier(runtimeRole)}; DROP ROLE ${pg.escapeIdentifier(runtimeRole)}`,
            );
          await admin.query(`DROP SCHEMA IF EXISTS ${pg.escapeIdentifier(metadataNamespace)} CASCADE`);
          assert.equal((await admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [runtimeRole])).rowCount, 0);
          assert.equal(
            (await admin.query("SELECT 1 FROM pg_namespace WHERE nspname=$1", [metadataNamespace])).rowCount,
            0,
          );
          await journal("independently-absent");
        } finally {
          await admin.end();
        }
      }
    }
    results.push({
      selection,
      version: generated.version,
      types: true,
      runtime: selection === "selected" || selection === "custom",
    });
    console.log(`Bun public ${selection} first-load/disk/determinism/types PASS`);
  }
} finally {
  await fixture.stop();
  await fixture.proveAbsent();
}
await writeFile(
  join(root, "public-generation.json"),
  JSON.stringify({ results, fullFamilyAcceptance: false }, null, 2),
);
