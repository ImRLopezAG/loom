import { test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import { bootstrapDatabase, generateProject, initializeProject, loadProject } from "kello/tooling";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";

// Actual public compiled exports; native mutations are confined to the worker's UUID container.
test("PostGIS first load, disk generation, strict types and compiled RPC/Effect native invocation", async () => {
  const node24 = process.env.POSTGIS_NODE24;
  assert(node24, "POSTGIS_NODE24 must identify the retained Node 24 binary; no runtime fallback is allowed");
  const versionCheck = Bun.spawnSync([node24, "-p", "process.versions.node"], { stdout: "pipe", stderr: "pipe" });
  assert.equal(versionCheck.exitCode, 0, versionCheck.stderr.toString());
  assert.equal(versionCheck.stdout.toString().trim().split(".")[0], "24");
  const fixture = JSON.parse(
    await readFile(process.env.POSTGIS_FIXTURE_PATH ?? "/tmp/loom-postgis-fixture.json", "utf8"),
  );
  const placement = "postgis_custom";
  const database = `postgis_gen_${crypto.randomUUID().replaceAll("-", "")}`;
  const control = new pg.Client({ connectionString: fixture.url });
  await control.connect();
  await control.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
  const url = new URL(fixture.url);
  url.pathname = `/${database}`;
  const root = await mkdtemp(join(tmpdir(), "loom-postgis-generation-"));
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  await client.query(
    `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION postgis WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '3.6.4'`,
  );
  let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
  const runtimeRole = `postgis_gen_${crypto.randomUUID().replaceAll("-", "")}`;
  try {
    await initializeProject(root, "postgisproof");
    await mkdir(join(root, "node_modules"));
    for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(
          process.env.POSTGIS_CONSUMER_ROOT
            ? join(process.env.POSTGIS_CONSUMER_ROOT, "node_modules", name)
            : fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url)),
        ),
        join(root, "node_modules", name),
      );
    await rm(join(root, "kello/functions/tasks.ts"));
    await rm(join(root, "kello/contracts/tasks.ts"));
    await writeFile(
      join(root, "kello.config.ts"),
      `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { postgis: { version: "3.6.4", schema: ${JSON.stringify(placement)} } } } });`,
    );
    await writeFile(
      join(root, "kello/app.config.ts"),
      'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
    );
    await writeFile(
      join(root, "kello/schema.ts"),
      `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "postgis" || extensions.postgis.version !== "3.6.4" || Object.keys(extensions.postgis.sql.overloads).length !== 721) throw Error("First-load PostGIS binding differs");
extensions.postgis.sql.functions.st_geomfromewkt("SRID=4326;POINT ZM(1 2 3 4)");
for (const factory of [extensions.postgis.sql.functions.st_fromflatgeobuf, extensions.postgis.sql.overloads["routine:$extension:postgis.st_fromflatgeobuf(pg_catalog.anyelement,pg_catalog.bytea)"]]) {
 let rejected = false;
 try { factory(extensions.postgis.codecs.geometry_dump)(null, null); }
 catch (error) { rejected = error instanceof Error && error.message === "PostGIS 3.6.4 ST_FromFlatGeobuf rejects NULL bytea"; }
 if (!rejected) throw Error("First-load PostGIS NULL safety fix requires a new compiled artifact");
}
export default defineSchema(() => ({}), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "kello/contracts/spatial.ts"),
      `import { defineContract, oc } from "kello/contract"; import * as v from "valibot";
export default defineContract({ native: oc.output(v.strictObject({ planar: v.union([v.number(),v.strictObject({nonfinite:v.picklist(["-Infinity","Infinity","NaN"])})]), meters: v.union([v.number(),v.strictObject({nonfinite:v.picklist(["-Infinity","Infinity","NaN"])})]), hex: v.string(), srid: v.number(), dimensions: v.literal("XYZM"), effectSame: v.literal(true) })) });`,
    );
    await writeFile(
      join(root, "kello/functions/spatial.ts"),
      `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { extensions as selected } from "../_generated/extensions"; import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.spatial.router({ native: os.spatial.native.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions || binding !== selected) throw Error("RPC/Effect extension identity differs");
const api = binding.postgis;
for (const factory of [api.sql.functions.st_fromflatgeobuf, api.sql.overloads["routine:$extension:postgis.st_fromflatgeobuf(pg_catalog.anyelement,pg_catalog.bytea)"]]) {
 let rejected = false;
 try { factory(api.codecs.geometry_dump)(null, null); }
 catch (error) { rejected = error instanceof Error && error.message === "PostGIS 3.6.4 ST_FromFlatGeobuf rejects NULL bytea"; }
 if (!rejected) throw Error("Compiled RPC/Effect PostGIS NULL bytea rejection is absent");
 const guarded = context.db.select({ value: factory(api.codecs.geometry_dump)(null, sql<null>\`NULL::bytea\`) }).from(sql\`(values(1)) fixture(id)\`).toSQL();
 if (!guarded.sql.includes('"pg_catalog"."decode"(coalesce("pg_catalog"."encode"(')) throw Error("Compiled RPC/Effect SQL NULL bytea guard is absent");
}
const [row] = await context.db.select({
planar: api.geometry.distance(api.geometry.ewkt("SRID=3857;POINT(0 0)"), api.geometry.ewkt("SRID=3857;POINT(3 4)")),
meters: api.geography.distance(api.geography.ewkt("SRID=4326;POINT(0 0)"), api.geography.ewkt("SRID=4326;POINT(0 1)")),
geometry: api.sql.functions.st_geomfromewkt("SRID=4326;POINT ZM(1 2 3 4)")
}).from(sql\`(values(1)) fixture(id)\`);
if (!row || row.planar === null || row.meters === null || row.geometry === null || row.geometry.format !== "ewkb" || row.geometry.dimensions !== "XYZM") throw Error("Native geometry result differs");
return {planar:row.planar,meters:row.meters,hex:row.geometry.hex,srid:row.geometry.srid,dimensions:row.geometry.dimensions,effectSame:true as const};
}) });`,
    );
    await writeFile(
      join(root, "kello/postgis-types.ts"),
      `import { type SQL } from "drizzle-orm"; import { extensions } from "./_generated/extensions"; import type { Geometry, PostgisOverloads, PostgisAdapter } from "kello/extensions/postgis";
const version: "3.6.4" = extensions.postgis.version; const placement: ${JSON.stringify(placement)} = extensions.postgis.schema;
const result: SQL<Geometry|null> = extensions.postgis.sql.functions.st_geomfromewkt("POINT(1 2)");
const overloads: PostgisOverloads = extensions.postgis.sql.overloads; const adapter: PostgisAdapter = extensions.postgis;
void [version,placement,result,overloads,adapter];
function compileOnly() {
// @ts-expect-error Unselected companion is absent.
extensions.postgis_sfcgal;
// @ts-expect-error The exact signature accepts text, not numbers.
extensions.postgis.sql.functions.st_geomfromewkt(1);
// @ts-expect-error Aggregate-state internal callback is not SQL callable.
extensions.postgis.sql.functions.pgis_geometry_accum_transfn;
}
void compileOnly;`,
    );
    await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    await loadProject(root);
    const generated = await generateProject(root);
    const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
    assert.match(source, /kello\/extensions\/postgis/);
    assert.match(source, /createPostgis_3_6_4/);
    assert.match(source, /640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29/);
    for (const other of ["postgis-sfcgal", "address-standardizer", "postgis-raster", "postgis-topology"])
      assert(!source.includes(other));
    const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
    assert.equal(server.extensions, disk.extensions);
    assert.deepEqual(Object.keys(disk.extensions), ["postgis"]);
    assert.equal(Object.keys(disk.extensions.postgis.sql.overloads).length, 721);
    assert.throws(
      () =>
        disk.extensions.postgis.sql.functions.st_fromflatgeobuf(disk.extensions.postgis.codecs.geometry_dump)(
          null,
          null,
        ),
      /PostGIS 3.6.4 ST_FromFlatGeobuf rejects NULL bytea/,
    );
    assert.equal(disk.extensions.postgis.schema, placement);
    assert.equal((await generateProject(root)).version, generated.version);
    const typecheck = Bun.spawn(
      [
        process.env.POSTGIS_TYPECHECK_BIN ?? fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
        "-p",
        join(root, "tsconfig.json"),
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    const [stdout, stderr, code] = await Promise.all([
      new Response(typecheck.stdout).text(),
      new Response(typecheck.stderr).text(),
      typecheck.exited,
    ]);
    assert.equal(code, 0, stdout + stderr);
    const { runtimeOptions } = await import(
      pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
    );
    const options = runtimeOptions();
    await bootstrapDatabase({ connectionString: url.href, metadataNamespace: options.metadataNamespace, runtimeRole });
    runtime = await createRpcRuntime({
      ...options,
      connectionString: url.href,
      deployment: "postgis-generated",
      auth: defineRpcAuth({ authorize: async () => {} }),
      assertActive: async (signal) => signal.throwIfAborted(),
    });
    const route = getRouter(runtime.router, ["spatial", "native"]);
    assert(route instanceof Procedure);
    const invocation = { requestId: "postgis-generated", identity: null, signal: new AbortController().signal };
    const actual = await call(route, undefined, {
      context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
      path: ["spatial", "native"],
    });
    const ns = pg.escapeIdentifier(placement);
    const native = (
      await client.query(
        `SELECT ${ns}.st_distance(${ns}.st_geomfromewkt('SRID=3857;POINT(0 0)'),${ns}.st_geomfromewkt('SRID=3857;POINT(3 4)')) planar, ${ns}.st_distance(${ns}.st_geogfromtext('SRID=4326;POINT(0 0)'),${ns}.st_geogfromtext('SRID=4326;POINT(0 1)')) meters, ${ns}.st_geomfromewkt('SRID=4326;POINT ZM(1 2 3 4)')::text hex`,
      )
    ).rows[0];
    assert.deepEqual(actual, { ...native, srid: 4326, dimensions: "XYZM", effectSame: true });
    const cold = Bun.spawn(
      [
        node24,
        process.env.POSTGIS_NODE24_DRIVER ??
          fileURLToPath(new URL("../fixtures/postgis-generated-node24.mjs", import.meta.url)),
        root,
        generated.version,
        url.href,
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    const [coldOut, coldError, coldExit] = await Promise.all([
      new Response(cold.stdout).text(),
      new Response(cold.stderr).text(),
      cold.exited,
    ]);
    assert.equal(coldExit, 0, coldOut + coldError);
    const coldReceipt = JSON.parse(coldOut.trim());
    assert.equal(coldReceipt.coldNodeMajor, 24);
    await writeFile(
      `${process.env.POSTGIS_EVIDENCE_DIR ?? "/tmp"}/loom-postgis-generation-observed.json`,
      JSON.stringify(
        {
          publicCompiled: true,
          coldNode24: coldReceipt,
          firstLoad: true,
          diskExtensions: true,
          compiledRpc: true,
          effect: true,
          strictTypes: true,
          native,
          version: generated.version,
          overloads: 721,
        },
        null,
        2,
      ),
    );
  } finally {
    await runtime?.stop();
    const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
    if (exists.rows.length)
      await client.query(
        `GRANT ${pg.escapeIdentifier(runtimeRole)} TO CURRENT_USER; DROP OWNED BY ${pg.escapeIdentifier(runtimeRole)}; DROP ROLE ${pg.escapeIdentifier(runtimeRole)}`,
      );
    await client.end();
    await control.query(`DROP DATABASE ${pg.escapeIdentifier(database)} WITH (FORCE)`);
    await control.end();
    await rm(root, { recursive: true, force: true });
  }
}, 180000);
