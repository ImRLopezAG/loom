import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { dblinkConsumerProofCase } from "../fixtures/dblink-proof-cases";
import { dblinkGeneratedDigest } from "../fixtures/dblink-generated-project";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { withExtensionDatabase } from "../fixtures/extension-database";

const descriptor = {
  name: "dblink",
  version: "1.2",
  schema: 'custom"dblink',
  apiSupport: {
    status: "verified",
    digest: dblinkGeneratedDigest,
  },
} as const;

const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
const missingExports = [
  "kello/extensions/dblink",
  "kello/tooling/extensions/dblink",
  "apps/loom/vite.config.ts entry src/core/extensions/adapters/dblink.ts",
  "apps/loom/vite.config.ts entry src/tooling/extensions/operations/dblink.ts",
  "apps/loom/src/tooling/codegen/extensions.ts adapters createDblink_1_2",
  "apps/loom/src/tooling/migrations/required-api-verification.ts dblink annotations",
] as const;

extensionProofTest(
  dblinkConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-dblink-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_DBLINK_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 180000, env });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      let output = `${stdout}\n${stderr}`;
      if (databaseUrl) {
        const address = new URL(databaseUrl);
        for (const value of [
          databaseUrl,
          address.username,
          address.password,
          address.hostname,
          address.pathname.slice(1),
        ]) {
          if (value)
            output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
        }
        output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      }
      assert.equal(code, 0, `${command.join(" ")}\n${output}`);
      return stdout;
    }
    try {
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
      const packedBytes = await readFile(join(root, "kello.tgz"));
      const packedSha256 = sha256(packedBytes);
      if (retainedArtifactPath !== undefined) {
        await copyFile(join(root, "kello.tgz"), retainedArtifactPath, constants.COPYFILE_EXCL);
        assert.equal(sha256(await readFile(retainedArtifactPath)), packedSha256);
      }
      await run([
        "node",
        "-e",
        "if (process.versions.node.split('.')[0] !== '24') throw new Error('Isolated consumer requires Node 24, not ' + process.version)",
      ]);
      const consumerDependencies = new Map<string, string>([
        ...Object.entries<string>(manifest.dependencies),
        ["kello", "file:./kello.tgz"],
        ["drizzle-orm", manifest.devDependencies["drizzle-orm"]],
      ]);
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          dependencies: Object.fromEntries(consumerDependencies),
          devDependencies: {
            typescript: manifest.devDependencies.typescript,
            "@types/node": manifest.devDependencies["@types/node"],
            "@types/pg": manifest.devDependencies["@types/pg"],
          },
        }),
      );
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      const lockfileSha256 = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
      const packedManifest = JSON.parse(await readFile(join(root, "node_modules/kello/package.json"), "utf8"));
      assert(
        packedManifest.exports?.["./extensions/dblink"],
        `Missing packed export ./extensions/dblink. Parent must apply: ${missingExports.join("; ")}`,
      );
      assert(
        packedManifest.exports?.["./tooling/extensions/dblink"],
        `Missing packed export ./tooling/extensions/dblink. Parent must apply: ${missingExports.join("; ")}`,
      );
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createDblink_1_2 } from "kello/extensions/dblink";
import { withDblink } from "kello/tooling/extensions/dblink";
const api = createDblink_1_2(${JSON.stringify(descriptor)});
assert.equal(api.foreignDataWrapper.name, "dblink_fdw");
assert.equal(api.foreignDataWrapper.handler, null);
assert.equal(api.connect.authority, "session");
assert.equal(api.exec.authority, "session");
assert.deepEqual(Object.keys(api.sql.functions).sort(), [
  "dblink_build_sql_delete",
  "dblink_build_sql_insert",
  "dblink_build_sql_update",
  "dblink_current_query",
  "dblink_get_connections",
  "dblink_get_pkey",
]);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }])
  assert.throws(() => createDblink_1_2({ ...api, apiSupport: support }), /exact verified contract/);
await assert.rejects(withDblink("postgresql://operator@127.0.0.1:1/fixture", { ...api, apiSupport: { status: "unverified" } }, async () => undefined), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import { createDblink_1_2 } from "kello/extensions/dblink";
import { withDblink, type DblinkSession } from "kello/tooling/extensions/dblink";
const api = createDblink_1_2(${JSON.stringify(descriptor)});
const schema: 'custom"dblink' = api.schema;
const version: "1.2" = api.version;
const sessionAuthority: "session" = api.connect.authority;
api.sql.functions.dblink_get_connections();
// @ts-expect-error Connect is not application SQL.
api.sql.functions.dblink_connect("named", "host=local");
void withDblink("postgresql://operator/fixture", api, async (session: DblinkSession) => {
  // @ts-expect-error No raw operator client crosses into callback.
  session.client;
  return session.connections();
});
import { extensions as generated } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const generatedPlacement: "extensions" = generated.dblink.schema;
generated.dblink.connections();
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error Future versions expose descriptors only.
void future.dblink.connections;
// @ts-expect-error Unselected families remain absent.
void generated.postgres_fdw;
void [schema, version, sessionAuthority, generatedPlacement, missing, noSelection];
`,
      );
      await writeFile(
        join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2023",
            module: "Preserve",
            moduleResolution: "Bundler",
            strict: true,
            noEmit: true,
            skipLibCheck: true,
            exactOptionalPropertyTypes: true,
            types: ["node"],
          },
          include: ["*.ts"],
        }),
      );
      for (const [file, selection] of Object.entries({
        selected: { dblink: { version: "1.2", schema: "extensions" } },
        future: { dblink: { version: "future", schema: "extensions" } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(join(root, "runtime.ts"), `export { extensions } from "./selected";`);
      await run(["node", "imports.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
      await writeFile(
        join(root, "verify-bundles.mjs"),
        `import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import { build } from "esbuild";
const installed = await realpath("node_modules/kello");
const externals = ${JSON.stringify([...consumerDependencies.keys()].filter((name) => name !== "kello"))};
for (const name of ["runtime", "future", "absent", "empty"]) {
  const result = await build({ entryPoints: [name + ".ts"], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: externals });
  const inputs = Object.keys(result.metafile.inputs);
  for (const file of inputs) if (file.includes("/kello/")) assert((await realpath(file)).startsWith(installed + "/dist/"), file);
  assert(!inputs.some((path) => path.includes("/tooling/")), "Runtime bundle must exclude admin tooling");
  assert(!inputs.some((path) => path.includes("/core/extensions/adapters/") && !/\\/adapters\\/dblink(?:-codecs)?\\.js$/.test(path)));
  const selected = name === "runtime";
  assert.equal(inputs.some((path) => path.endsWith("/adapters/dblink.js")), selected);
  const bundled = result.outputFiles[0].text;
  assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(bundled));
  assert.doesNotMatch(bundled, /withDblink|DblinkOperationError|bootstrapDatabase/);
  await writeFile(name + ".mjs", bundled);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) {
    assert.deepEqual(Object.keys(extensions), ["dblink"]);
    assert.deepEqual(Object.keys(extensions.dblink.sql.functions).sort(), ["dblink_build_sql_delete", "dblink_build_sql_insert", "dblink_build_sql_update", "dblink_current_query", "dblink_get_connections", "dblink_get_pkey"]);
  } else if (name === "future") {
    assert.equal(extensions.dblink.apiSupport.status, "unverified");
    assert.equal(extensions.dblink.connections, undefined);
  } else assert.equal(extensions, undefined);
}
`,
      );
      await run(["node", "verify-bundles.mjs"]);
      await writeFile(
        join(root, "project-rpc.mjs"),
        String.raw`import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { connectDatabase, createProjectProcedures, createProjectServices, defineSchema, Invocation } from "kello/server";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_DBLINK_DATABASE_URL;
assert(url);
const role = "packed_dblink_" + crypto.randomUUID().replaceAll("-", "");
const password = crypto.randomUUID();
const operator = new pg.Client({ connectionString: url });
await operator.connect();
const schema = defineSchema(() => ({}), { namespace: "packed_app" });
let connection;
try {
  assert.equal(Math.floor(Number((await operator.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await operator.query("CREATE TABLE public.packed_dblink_items(id integer PRIMARY KEY, label text NOT NULL); INSERT INTO public.packed_dblink_items VALUES (1, 'alpha')");
  await operator.query('CREATE ROLE "' + role + '" LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD ' + "'" + password + "'");
  await operator.query('GRANT USAGE ON SCHEMA extensions TO "' + role + '"; GRANT SELECT ON public.packed_dblink_items TO "' + role + '"');
  const runtimeUrl = new URL(url);
  runtimeUrl.username = role;
  runtimeUrl.password = password;
  connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: runtimeUrl.href });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, defineRelations(schema.tables), extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.dblink;
    return connection.transaction((db) => db.select({
      user: sql.raw("current_user"),
      connections: api.connections(),
      current: api.currentQuery(),
      insert: api.buildSqlInsert("packed_dblink_items", "1", 1, { values: ["1"], dimensions: [{ lowerBound: 1, length: 1 }] }, { values: ["9"], dimensions: [{ lowerBound: 1, length: 1 }] }),
    }).from(sql.raw("(values(1)) fixture(id)")));
  });
  const invocation = { requestId: "packed-dblink", identity: null, signal: new AbortController().signal };
  const [row] = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.equal(row.user, role);
  assert.equal(row.connections, null);
  assert.equal(typeof row.current, "string");
  assert.equal(row.insert, "INSERT INTO packed_dblink_items(id,label) VALUES('9','alpha')");
} finally {
  try { await connection?.close(); } finally {
    try { await operator.query('DROP OWNED BY "' + role + '"; DROP ROLE IF EXISTS "' + role + '"'); } finally { await operator.end(); }
  }
}
console.log("packed dblink runtime-role RPC/Effect contracts passed");
`,
      );
      // Bundle the complete application graph so adapters and the database share one Kello instance.
      await writeFile(
        join(root, "compile-rpc.mjs"),
        `import assert from "node:assert/strict";
import { build } from "esbuild";
const result = await build({ entryPoints: ["project-rpc.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-rpc-bundle.mjs", metafile: true, external: ${JSON.stringify([...consumerDependencies.keys()].filter((name) => name !== "kello"))} });
const inputs = Object.keys(result.metafile.inputs);
assert(inputs.some((path) => path.endsWith("/adapters/dblink.js")));
assert(!inputs.some((path) => path.includes("/tooling/")));
assert(!inputs.some((path) => path.includes("/core/extensions/adapters/") && !/\\/adapters\\/dblink(?:-codecs)?\\.js$/.test(path)));
`,
      );
      await run(["node", "compile-rpc.mjs"]);
      await writeFile(
        join(root, "project-native.mjs"),
        `import assert from "node:assert/strict";
import { createDblink_1_2 } from "kello/extensions/dblink";
import { DblinkOperationError, withDblink } from "kello/tooling/extensions/dblink";
const url = process.env.LOOM_PACKED_DBLINK_DATABASE_URL;
assert(url);
const api = createDblink_1_2(${JSON.stringify({ ...descriptor, schema: "extensions" })});
const failed = await withDblink(url, api, async (session) => {
  assert.equal(await session.connections(), null);
  throw new Error("after idle connections acknowledgement");
}).then(
  () => {
    throw new Error("Expected callback failure");
  },
  (error) => error,
);
assert(failed instanceof DblinkOperationError);
assert.equal(failed.completion, "rolled-back");
assert.equal(failed.effects.some((effect) => effect.operation === "cleanup" && effect.state === "acknowledged"), true);
const reset = await withDblink(url, api, (session) => session.connections());
assert.equal(reset.completion, "committed");
assert.equal(reset.value, null);
assert.equal(reset.effects.some((effect) => effect.operation === "cleanup" && effect.state === "acknowledged"), true);
console.log("packed dblink consumer contracts passed");
`,
      );
      await withExtensionDatabase(async (databaseUrl) => {
        const client = new pg.Client({ connectionString: databaseUrl });
        await client.connect();
        try {
          await client.query("CREATE SCHEMA extensions; CREATE EXTENSION dblink WITH SCHEMA extensions VERSION '1.2'");
        } finally {
          await client.end();
        }
        await run(["node", "project-native.mjs"], root, databaseUrl);
        await run(["node", "project-rpc-bundle.mjs"], root, databaseUrl);
      });
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
