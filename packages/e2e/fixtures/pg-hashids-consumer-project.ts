import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const pgHashidsDigest = "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041";
export const pgHashidsSelections = ["default", "custom", "absent", "empty", "future"] as const;
export type PgHashidsSelection = (typeof pgHashidsSelections)[number];

/** Uses the actual compiled package and generator. No emitted source or adapter is substituted. */
export function preparePgHashidsConsumerProject(
  root: string,
  directory: string,
  packageRoot: string,
  dependencyModules = join(root, "packages/tests/node_modules"),
) {
  const project = join(directory, "project");
  linkPreparedDependencies(project, packageRoot, dependencyModules);
  writePgHashidsSelectionSetup(project, "custom");
  const setup = join(project, "setup.mjs");
  const probe = join(project, "probe.ts");
  const rpcProbe = join(project, "rpc-probe.mjs");
  return { project, setup, probe, rpcProbe };
}

export function linkPreparedDependencies(project: string, packageRoot: string, dependencyModules: string) {
  const modules = join(project, "node_modules");
  mkdirSync(modules, { recursive: true });
  symlinkSync(packageRoot, join(modules, "kello"), "dir");
  // This is a prepared consumer: reuse already-installed pinned dependencies; never install or rebuild.
  for (const name of ["valibot", "drizzle-orm", "@orpc/server", "effect"]) {
    const destination = join(modules, name);
    mkdirSync(join(destination, ".."), { recursive: true });
    symlinkSync(realpathSync(join(dependencyModules, name)), destination, "dir");
  }
}

export function pgHashidsSafetyCallsSource() {
  return `import type { createPgHashids_1_2_1 } from "kello/extensions/pg-hashids";
export function safetyCalls(h: ReturnType<typeof createPgHashids_1_2_1>) {
const a={dimensions:[{lowerBound:1,length:2}],values:[1n,2n]} as const;
const alpha="0123456789abcdef";
const settings=[[],["salt"],["salt",8],["salt",8,alpha]] as const;
const tails=["",",pg_catalog.text",",pg_catalog.text,pg_catalog.int4",",pg_catalog.text,pg_catalog.int4,pg_catalog.text"];
return [false,true].flatMap(canonical=>{
 const encode=canonical?h.sql.functions.id_encode:h.encode;
 const array=canonical?h.sql.functions.id_encode:h.encodeArray;
 const decode=canonical?h.sql.functions.id_decode:h.decode;
 const once=canonical?h.sql.functions.id_decode_once:h.decodeOnce;
 const legacy=canonical?h.sql.functions.hash_encode:h.hashEncode;
 const oldDecode=canonical?h.sql.functions.hash_decode:h.hashDecode;
 return [
 ...settings.map((args,i)=>({member:"routine:$extension:pg_hashids.id_encode(pg_catalog.int8"+tails[i]+")",call:()=>encode(1n,...args)})),
 ...settings.map((args,i)=>({member:"routine:$extension:pg_hashids.id_encode(pg_catalog._int8"+tails[i]+")",call:()=>array(a,...args)})),
 ...settings.map((args,i)=>({member:"routine:$extension:pg_hashids.id_decode(pg_catalog.text"+tails[i]+")",call:()=>decode(i===3?"ab":"jR",...args)})),
 ...settings.map((args,i)=>({member:"routine:$extension:pg_hashids.id_decode_once(pg_catalog.text"+tails[i]+")",call:()=>once(i===3?"ab":"jR",...args)})),
 ...([[],["salt"],["salt",8]] as const).map((args,i)=>({member:"routine:$extension:pg_hashids.hash_encode(pg_catalog.int8"+tails[i]+")",call:()=>legacy(1n,...args)})),
 {member:"routine:$extension:pg_hashids.hash_decode(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",call:()=>oldDecode("jR","salt",8)}
 ];
});
}`;
}

export function writePgHashidsAuthoredFiles(project: string, selection: PgHashidsSelection) {
  const placement = selection === "custom" ? "hashids_custom" : "extensions";
  if (selection === "default" || selection === "custom") writePgHashidsConfiguredFiles(project, placement);
  else if (selection === "empty" || selection === "future") {
    writeFileSync(
      join(project, "kello.config.ts"),
      `import { defineConfig } from "kello/tooling"; export default defineConfig({ project: ${JSON.stringify(`pg-hashids-${selection}`)}, database: { extensions: ${
        selection === "empty" ? "{}" : '{ pg_hashids: { version: "future" } }'
      } } });\n`,
    );
  }
  writeFileSync(join(project, "probe.ts"), pgHashidsProbeSource(selection, placement));
  if (selection === "default" || selection === "custom")
    writeFileSync(join(project, "rpc-probe.mjs"), pgHashidsRpcProbeSource());
}

export function writePgHashidsSelectionSetup(project: string, selection: PgHashidsSelection) {
  writeFileSync(
    join(project, "setup.mjs"),
    `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
const project = process.cwd();
const selection = ${JSON.stringify(selection)};
await initializeProject(project, "pg-hashids-" + selection);
const { writePgHashidsAuthoredFiles } = await import(${JSON.stringify(new URL("./pg-hashids-consumer-project.ts", import.meta.url).href)});
writePgHashidsAuthoredFiles(project, selection);
const generatedFile = join(project, "kello/_generated/extensions.ts");
await assert.rejects(readFile(generatedFile), { code: "ENOENT" });
await loadProject(project);
const result = await generateProject(project);
const binding = await readFile(generatedFile, "utf8");
assert.doesNotMatch(binding, /tooling\\/extensions|kello\\.config|\\.\\.\\/schema/);
if (selection === "default" || selection === "custom") {
  assert.match(binding, /createPgHashids_1_2_1/);
  assert(binding.includes("kello/extensions/pg-hashids"));
  assert.match(binding, /${pgHashidsDigest}/);
  assert(result.procedures.some((procedure) => procedure.path.join(".") === "tasks.list"));
} else if (selection === "absent" || selection === "empty") {
  assert.match(binding, /export const extensions = undefined/);
} else {
  assert.doesNotMatch(binding, /createPgHashids_1_2_1/);
  assert.match(binding, /"status":"unverified"/);
}
await writeFile(join(project, "generation-observation.json"), JSON.stringify({ selection, version: result.version, binding }, null, 2));
`,
  );
}

function writePgHashidsConfiguredFiles(project: string, placement: string) {
  const child = join(project, "kello/components/ids");
  mkdirSync(join(child, "contracts"), { recursive: true });
  mkdirSync(join(child, "functions"), { recursive: true });
  writeFileSync(
    join(project, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling";
export default defineConfig({ project: "pg-hashids-proof", database: { extensions: { pg_hashids: { version: "1.2.1"${
      placement === "extensions" ? "" : `, schema: ${JSON.stringify(placement)}`
    } }, pg_trgm: { version: "1.6", schema: "host_text" } } } });
`,
  );
  writeFileSync(
    join(project, "kello/app.config.ts"),
    `import { defineApplication } from "kello/server";
import ids from "./components/ids/setup";
const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(ids); export default app;
`,
  );
  writeFileSync(
    join(project, "kello/auth.config.ts"),
    `import { defineRpcAuth } from "kello/server";
export default defineRpcAuth({ authorize: async () => {}, allowAnonymous: true });
`,
  );
  writeFileSync(join(project, "kello/safety-calls.ts"), pgHashidsSafetyCallsSource());
  writeFileSync(
    join(project, "kello/schema.ts"),
    `import assert from "node:assert/strict";
import type { SQL } from "drizzle-orm";
import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
import { safetyCalls } from "./safety-calls";
const h = extensions.pg_hashids;
const version: "1.2.1" = h.version;
const placement: ${JSON.stringify(placement)} = h.schema;
assert.deepEqual(Object.keys(extensions), ["pg_hashids", "pg_trgm"]);
assert.equal(h.apiSupport.digest, ${JSON.stringify(pgHashidsDigest)});
for (const { member, call } of safetyCalls(h)) assert.throws(call, { name: "PgHashidsNativeSafetyError", code: "PG_HASHIDS_NATIVE_REPAIR_REQUIRED", member });
function compileOnly() {
  // @ts-expect-error Only the selected extensions exist.
  void extensions.vector;
  // @ts-expect-error Exact int8 inputs require bigint.
  h.encode(1);
  // @ts-expect-error Captured legacy decode has three required arguments.
  h.hashDecode("jNl");
  // @ts-expect-error Version identity cannot widen.
  const wrongVersion: "1.2" = h.version;
  // @ts-expect-error The scalar result has the captured bigint codec.
  const wrongResult: SQL<number> = h.decodeOnce("jNl");
  void [wrongVersion, wrongResult];
}
void [version, placement, compileOnly];
export default defineSchema((s) => ({ tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }) }), { namespace: "app" });
`,
  );
  writeFileSync(
    join(child, "setup.ts"),
    `import { defineComponent } from "./_generated/setup";
export default defineComponent({ name: "ids", extensions: { pg_hashids: { versions: ["1.2.1"] } }, rpc: ({ os }) => ({ os }) });
`,
  );
  writeFileSync(
    join(child, "schema.ts"),
    `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "pg_hashids" || extensions.pg_hashids.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong component pg_hashids subset");
function compileOnly() {
  // @ts-expect-error The component receives only its declared family.
  void extensions.pg_trgm;
}
void compileOnly;
export default defineSchema(() => ({}));
`,
  );
  writeFileSync(
    join(child, "contracts/status.ts"),
    `import { defineContract, oc } from "../_generated/contract";
import * as v from "valibot";
export default defineContract({ get: oc.output(v.literal("1.2.1")) });
`,
  );
  writeFileSync(
    join(child, "functions/status.ts"),
    `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { Effect } from "effect";
export default os.status.router({ get: os.status.get.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== context.extensions) throw new Error("RPC/Effect binding identity mismatch");
  const version: "1.2.1" = context.extensions.pg_hashids.version;
  return version;
}) });
`,
  );
  writeFileSync(
    join(project, "kello/contracts/tasks.ts"),
    `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.array(v.string())) });
`,
  );
  writeFileSync(
    join(project, "kello/functions/tasks.ts"),
    `import assert from "node:assert/strict";
import { os } from "../_generated/rpc";
import { safetyCalls } from "../safety-calls";
import { PgHashidsNativeSafetyError } from "kello/extensions/pg-hashids";
export const safetyObservation = { nativeInvocations: 0, rejectedMembers: [] as string[] };
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
  const entry = safetyCalls(context.extensions.pg_hashids)[Number(context.requestId)];
  assert(entry);
  try { entry.call(); safetyObservation.nativeInvocations += 1; }
  catch (cause) {
    assert(cause instanceof PgHashidsNativeSafetyError);
    assert.equal(cause.member, entry.member);
    safetyObservation.rejectedMembers.push(cause.member);
    throw cause;
  }
  return [];
}) });
`,
  );
}

function pgHashidsProbeSource(selection: PgHashidsSelection, placement: string) {
  if (selection === "absent" || selection === "empty") {
    return `import { extensions } from "./kello/_generated/extensions";
const missing: undefined = extensions;
if (false) {
  // @ts-expect-error No configured extensions exist.
  void extensions.pg_hashids;
}
void missing;
console.log("generated pg_hashids selection " + ${JSON.stringify(selection)} + " is undefined");
`;
  }
  if (selection === "future") {
    return `import assert from "node:assert/strict";
import { extensions } from "./kello/_generated/extensions";
const name: "pg_hashids" = extensions.pg_hashids.name;
const version: "future" = extensions.pg_hashids.version;
assert.equal(extensions.pg_hashids.apiSupport.status, "unverified");
assert.equal("sql" in extensions.pg_hashids, false);
assert.equal("encode" in extensions.pg_hashids, false);
// @ts-expect-error Unverified descriptors do not receive query factories.
void extensions.pg_hashids.encode;
// @ts-expect-error Unverified descriptors do not receive a sql surface.
void extensions.pg_hashids.sql;
void [name, version];
console.log("generated future pg_hashids is descriptor-only");
`;
  }
  return `import assert from "node:assert/strict";
import { type SQL } from "drizzle-orm";
import { createPgHashids_1_2_1, PgHashidsNativeSafetyError } from "kello/extensions/pg-hashids";
import { extensions } from "./kello/_generated/extensions";
import { safetyCalls } from "./kello/safety-calls";
const h = extensions.pg_hashids;
const name: "pg_hashids" = h.name;
const version: "1.2.1" = h.version;
const schema: ${JSON.stringify(placement)} = h.schema;
assert.deepEqual(Object.keys(extensions), ["pg_hashids", "pg_trgm"]);
assert.equal(h.apiSupport.digest, ${JSON.stringify(pgHashidsDigest)});
const calls = safetyCalls(h);
assert.equal(calls.length, 40);
assert.equal(new Set(calls.map(({ member }) => member)).size, 20);
const direct = createPgHashids_1_2_1({
  ...h,
  encode: () => { throw new Error("descriptor override escaped"); },
  sql: { functions: { id_encode: () => { throw new Error("descriptor override escaped"); } } },
});
for (const { member, call } of [...calls, ...safetyCalls(direct)]) assert.throws(call, (cause: unknown) => {
  assert(cause instanceof PgHashidsNativeSafetyError);
  assert.equal(cause.code, "PG_HASHIDS_NATIVE_REPAIR_REQUIRED");
  assert.equal(cause.disposition, "safety-rejected");
  assert.equal(cause.member, member);
  assert.equal(cause.manifestDigest, h.apiSupport.digest);
  return true;
});
assert.equal(typeof createPgHashids_1_2_1, "function");
if (false) {
  const encoded: SQL<string> = h.encode(9223372036854775807n);
  const once: SQL<bigint> = h.decodeOnce("jNl");
  const legacy: SQL<number> = h.hashDecode("jNl", "", 0);
  void [encoded, once, legacy];
}
if (false) {
  // @ts-expect-error Only the selected extensions exist.
  extensions.vector;
  // @ts-expect-error Exact int8 inputs require bigint.
  h.encode(1);
  // @ts-expect-error Captured legacy decode has three required arguments.
  h.hashDecode("jNl");
  // @ts-expect-error Version identity cannot widen.
  const wrongVersion: "1.2" = h.version;
  // @ts-expect-error The scalar result has the captured bigint codec.
  const wrongResult: SQL<number> = h.decodeOnce("jNl");
  void [wrongVersion, wrongResult];
}
void [name, version, schema];
console.log("generated pg_hashids public package rejected all 20 exact overloads through friendly and canonical aliases; native acceptance remains pending");
`;
}

function pgHashidsRpcProbeSource() {
  return `import assert from "node:assert/strict";
import { defineRelations } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { createProjectProcedures, createProjectServices, defineSchema, Invocation } from "kello/server";
import { PgHashidsNativeSafetyError } from "kello/extensions/pg-hashids";
import { extensions } from "./kello/_generated/extensions";
import { Extensions } from "./kello/_generated/server.ts";
import { safetyCalls } from "./kello/safety-calls";
const generated = Effect.runSync(Effect.provide(Extensions, Context.make(Extensions, extensions)));
assert.equal(generated, extensions);
const schema = defineSchema(() => ({}));
const relations = defineRelations(schema.tables);
const services = createProjectServices(schema);
const { procedure } = createProjectProcedures(schema, relations, extensions);
const observation = { nativeInvocations: 0, rejectedMembers: [] };
const handler = procedure.handler(({ context }) => {
  const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
  assert.equal(binding, context.extensions);
  const entry = safetyCalls(context.extensions.pg_hashids)[Number(context.requestId)];
  assert(entry);
  try { entry.call(); observation.nativeInvocations += 1; }
  catch (cause) {
    assert(cause instanceof PgHashidsNativeSafetyError);
    assert.equal(cause.member, entry.member);
    observation.rejectedMembers.push(cause.member);
    throw cause;
  }
  return [];
});
for (let index = 0; index < 40; index++) {
  const invocation = { identity: null, requestId: String(index), signal: new AbortController().signal };
  await assert.rejects(call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } }), { code: "INTERNAL_SERVER_ERROR" });
}
assert.equal(observation.nativeInvocations, 0);
assert.equal(observation.rejectedMembers.length, 40);
assert.equal(new Set(observation.rejectedMembers).size, 20);
console.log("real generated RPC/Effect rejected all twenty members through friendly/canonical aliases before native invocation");
`;
}

export function pgHashidsPublicBypassSource() {
  return `import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createPgHashids_1_2_1, PgHashidsNativeSafetyError } from "kello/extensions/pg-hashids";
const packageRoot = process.argv[2];
for (const name of ["kello/extensions/pg-hashids", "kello/tooling"])
  assert(fileURLToPath(import.meta.resolve(name)).startsWith(packageRoot + "/dist/"));
assert.throws(() => import.meta.resolve("kello/tooling/extensions/pg-hashids"));
const verified = {
  name: "pg_hashids",
  version: "1.2.1",
  schema: "hashids_custom",
  apiSupport: { status: "verified", digest: ${JSON.stringify(pgHashidsDigest)} },
};
for (const descriptor of [
  { ...verified, name: "pg-hashids" },
  { ...verified, version: "1.2" },
  { ...verified, apiSupport: { status: "unverified" } },
  { ...verified, apiSupport: { status: "verified" } },
  { ...verified, apiSupport: { status: "verified", digest: "wrong" } },
])
  assert.throws(() => createPgHashids_1_2_1(descriptor), { message: "pg_hashids 1.2.1 requires its exact verified contract" });
const forged = createPgHashids_1_2_1({
  ...verified,
  encode: () => { throw new Error("descriptor override escaped"); },
  sql: { functions: { id_encode: () => { throw new Error("descriptor override escaped"); } } },
});
assert.throws(() => forged.encode(1n), (cause) => {
  assert(cause instanceof PgHashidsNativeSafetyError);
  assert.equal(cause.code, "PG_HASHIDS_NATIVE_REPAIR_REQUIRED");
  assert.equal(cause.member, "routine:$extension:pg_hashids.id_encode(pg_catalog.int8)");
  return true;
});
console.log("public compiled pg_hashids entry rejected bypass attempts; tooling operator path is absent");
`;
}

/** Logs and temporary output belong to the family scratch directory, not the shared checkout. */
export function runPgHashidsConsumerProject(root: string, directory: string, packageRoot: string) {
  const { project, setup, probe, rpcProbe } = preparePgHashidsConsumerProject(root, directory, packageRoot);
  function execute(command: string[], label: string) {
    const child = spawnSync(command[0]!, command.slice(1), {
      cwd: project,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    writeFileSync(join(directory, `${label}.log`), (child.stdout ?? "") + (child.stderr ?? ""), { mode: 0o600 });
    if (child.error) throw child.error;
    assert.equal(child.status, 0, `${label} failed; evidence retained at ${directory}`);
  }
  execute(["bun", setup], "real-generation");
  const config = join(directory, "tsconfig.json");
  writeFileSync(
    config,
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2023",
          module: "Preserve",
          moduleResolution: "Bundler",
          strict: true,
          noEmit: true,
          incremental: false,
          skipLibCheck: true,
          typeRoots: [join(root, "packages/tests/node_modules/@types")],
        },
        files: [probe],
      },
      null,
      2,
    ),
  );
  execute([join(root, "packages/tests/node_modules/.bin/tsc"), "-p", config, "--pretty", "false"], "generated-types");
  execute(["bun", probe], "generated-runtime");
  execute(["bun", rpcProbe], "generated-rpc-runtime");
  const bindingPath = join(project, "kello/_generated/extensions.ts");
  return {
    project,
    bindingSha256: createHash("sha256").update(readFileSync(bindingPath)).digest("hex"),
    preparedDependencies: true,
    databaseExecuted: false,
  };
}
