import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";

test("packed selected adapters preserve precise declarations and independent Node runtime bundles", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-packed-adapters-"));
  const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
  const manifest = await Bun.file(join(source, "package.json")).json();
  async function run(command: string[], cwd = root) {
    const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 120000 });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(code, 0, `${command.join(" ")}\n${stdout}\n${stderr}`);
  }
  try {
    await run(["bun", "pm", "pack", "--filename", join(root, "loom.tgz"), "--ignore-scripts"], source);
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: {
          loom: "file:./loom.tgz",
          "drizzle-orm": manifest.devDependencies["drizzle-orm"],
          effect: manifest.dependencies.effect,
          valibot: manifest.dependencies.valibot,
          esbuild: manifest.dependencies.esbuild,
        },
        devDependencies: {
          typescript: manifest.devDependencies.typescript,
          "@types/node": manifest.devDependencies["@types/node"],
        },
      }),
    );
    await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
    await run(["bun", "install", "--ignore-scripts", "--frozen-lockfile"]);
    await writeFile(
      join(root, "selected.ts"),
      extensionBindingsSource({ pg_trgm: { version: "1.6", schema: "search" } }),
    );
    await writeFile(
      join(root, "unsupported.ts"),
      extensionBindingsSource({ pg_trgm: { version: "future-version", schema: "search" } }),
    );
    await writeFile(join(root, "absent.ts"), extensionBindingsSource(undefined));
    await writeFile(join(root, "empty.ts"), extensionBindingsSource({}));
    await writeFile(
      join(root, "uuid.ts"),
      extensionBindingsSource({ "uuid-ossp": { version: "1.1", schema: "identifiers" } }),
    );
    await writeFile(
      join(root, "jsonschema.ts"),
      extensionBindingsSource({
        pg_jsonschema: { version: "0.3.4", schema: "json_validation" },
      }),
    );
    await writeFile(
      join(root, "citext.ts"),
      extensionBindingsSource({ citext: { version: "1.8", schema: "case_text" } }),
    );
    await writeFile(
      join(root, "uuidv7.ts"),
      extensionBindingsSource({ pg_uuidv7: { version: "1.6", schema: "identifiers_v7" } }),
    );
    await writeFile(
      join(root, "probe.ts"),
      `import type { SQL } from "drizzle-orm";
import { extensions } from "./selected";
import { extensions as unsupported } from "./unsupported";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as jsonSchemaExtensions } from "./jsonschema";
import { extensions as uuidExtensions } from "./uuid";
import { extensions as citextExtensions } from "./citext";
import { extensions as uuidv7Extensions } from "./uuidv7";
import { citext, type Citext } from "loom/extensions/citext";
import { jsonValue, jsonbValue } from "loom/extensions/pg-jsonschema";
import { timestamp, timestamptz, timestampColumn, timestamptzColumn, type Timestamp, type Timestamptz } from "loom/extensions/timestamps";
import { pgTable, timestamp as pgTimestamp } from "drizzle-orm/pg-core";
import { createExtensionBindings, createProjectContext, createProjectServices, defineSchema } from "loom/server";
import { createFuzzystrmatch_1_2 } from "loom/extensions/fuzzystrmatch";
import { createPgTiktoken_0_0_1 } from "loom/extensions/pg-tiktoken";
import { withPgTrgmThresholds } from "loom/tooling/extensions/pg-trgm";
import { defineRelations } from "drizzle-orm";
import { Effect } from "effect";
const schema = defineSchema(() => ({}));
const relations = defineRelations(schema.tables);
const context = createProjectContext(schema, relations, extensions);
const score: SQL<number> = context.extensions.pg_trgm.similarity("word", "words");
const nullable: SQL<number | null> = context.extensions.pg_trgm.similarity(null, "words");
const version: "1.6" = context.extensions.pg_trgm.version;
const placement: "search" = context.extensions.pg_trgm.schema;
const services = createProjectServices<typeof schema, typeof relations, typeof extensions>(schema);
const serviceScore = Effect.map(services.Extensions, selected => selected.pg_trgm.similarity("word", "words"));
const unknownVersion: "future-version" = unsupported.pg_trgm.version;
const none: undefined = absent;
const emptyNone: undefined = empty;
const descriptors = createExtensionBindings({ fuzzystrmatch: {version:"1.2"}, pg_tiktoken:{version:"0.0.1"} });
const fuzzy = createFuzzystrmatch_1_2(descriptors.fuzzystrmatch);
const token = createPgTiktoken_0_0_1(descriptors.pg_tiktoken);
const edit: SQL<number | null> = fuzzy.levenshtein("a", "b", 1, 1, 1);
const tokens: SQL<bigint | null> = token.count("cl100k_base", "hello");
const valid: SQL<boolean | null> = jsonSchemaExtensions.pg_jsonschema.jsonbMatchesSchema(jsonValue({type:"string"}), jsonbValue("hello"));
const uuidContext = createProjectContext(schema, relations, uuidExtensions);
const identifier: SQL<string | null> = uuidContext.extensions["uuid-ossp"].v5(uuidContext.extensions["uuid-ossp"].namespaceDns(), "name");
const temporal = pgTable("temporal", { civil: pgTimestamp(), instant: pgTimestamp({withTimezone:true,mode:"string"}) });
const civil: SQL<Timestamp | null> = timestampColumn(temporal.civil);
const instant: SQL<Timestamptz | null> = timestamptzColumn(temporal.instant);
const civilValue: Timestamp = timestamp("2024-01-01 00:00:00.123456");
const instantValue: Timestamptz = timestamptz("2024-01-01 00:00:00.123457Z");
const caseContext = createProjectContext(schema, relations, citextExtensions);
const same: SQL<boolean | null> = caseContext.extensions.citext.equal("MiXeD", "mixed");
const spelling: Citext = citext("MiXeD");
const caseSchema = defineSchema(() => ({ records: { title: citextExtensions.citext.field().notNull(), tags: citextExtensions.citext.arrayField() } }));
caseContext.extensions.citext.equal(caseSchema.tables.records.title, "mixed");
const v7Context = createProjectContext(schema, relations, uuidv7Extensions);
const v7Version: "1.6" = v7Context.extensions.pg_uuidv7.version;
const v7Placement: "identifiers_v7" = v7Context.extensions.pg_uuidv7.schema;
const generatedV7: SQL<string> = v7Context.extensions.pg_uuidv7.v7();
const convertedV7: SQL<string | null> = v7Context.extensions.pg_uuidv7.fromTimestamp(civilValue, true);
const decodedV7: SQL<Timestamptz | null> = v7Context.extensions.pg_uuidv7.toTimestamptz(generatedV7);
if (false) {
  // @ts-expect-error Selected context cannot access undeclared extensions.
  context.extensions.vector;
  // @ts-expect-error Unverified versions have no invented query helpers.
  unsupported.pg_trgm.similarity("a", "b");
  // @ts-expect-error Trigram arguments are text expressions.
  context.extensions.pg_trgm.similarity(3, "word");
  // @ts-expect-error Canonical signatures do not accept caller-selected result types.
  context.extensions.pg_trgm.similarity<string>("word", "words");
  // @ts-expect-error Administrative session methods are absent from RPC bindings.
  context.extensions.pg_trgm.setLimit(0.1);
  // @ts-expect-error Exact edit-distance overload arity.
  fuzzy.levenshtein("a", "b", 1);
  // @ts-expect-error Token counts preserve bigint precision.
  const wrong: SQL<number> = token.count("cl100k_base", "hello");
  // @ts-expect-error JSON and JSONB documents retain distinct argument types.
  jsonSchemaExtensions.pg_jsonschema.jsonbMatchesSchema(jsonbValue({type:"string"}), jsonValue("hello"));
  // @ts-expect-error UUID namespace inputs reject unrelated literal types.
  uuidContext.extensions["uuid-ossp"].v5(5, "name");
  // @ts-expect-error UUID bindings expose exactly their selected family.
  uuidContext.extensions.pg_trgm;
  // @ts-expect-error Civil and instant values retain distinct types in published declarations.
  const wrongInstant: Timestamptz = civilValue;
  // @ts-expect-error A Date cannot supply exact checked timestamp text.
  timestamp(new Date());
  // @ts-expect-error Native column bridge results are fixed by their codecs.
  timestampColumn<string>(temporal.civil);
  // @ts-expect-error Case-insensitive equality rejects unrelated boolean expressions.
  caseContext.extensions.citext.equal(true, "mixed");
  // @ts-expect-error Only the selected case-insensitive extension is present.
  caseContext.extensions.pg_trgm;
  // @ts-expect-error Case-preserving field results retain their native brand.
  const wrongSpelling: Citext = "MiXeD";
  // @ts-expect-error V7 bindings expose exactly the selected underscore key.
  v7Context.extensions["pg-uuidv7"];
  // @ts-expect-error Native temporal arguments retain civil/instant identity.
  v7Context.extensions.pg_uuidv7.fromTimestamp(instantValue, true);
  // @ts-expect-error UUID extraction has a fixed native decoder.
  v7Context.extensions.pg_uuidv7.toTimestamptz<Date>(generatedV7);
}
void [score, nullable, version, placement, serviceScore, unknownVersion, none, emptyNone, edit, tokens, valid, identifier, civil, instant, civilValue, instantValue, same, spelling, v7Version, v7Placement, generatedV7, convertedV7, decodedV7, withPgTrgmThresholds];
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
    await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
    await writeFile(
      join(root, "verify.mjs"),
      `import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { createPgTrgm_1_6 } from "loom/extensions/pg-trgm";
import { createFuzzystrmatch_1_2 } from "loom/extensions/fuzzystrmatch";
import { createPgTiktoken_0_0_1 } from "loom/extensions/pg-tiktoken";
import { withPgTrgmThresholds } from "loom/tooling/extensions/pg-trgm";
import { createPgJsonschema_0_3_4, jsonDocument } from "loom/extensions/pg-jsonschema";
import { createUuidOssp_1_1, uuidCodec } from "loom/extensions/uuid-ossp";
import { timestamp, timestamptz, timestampCodec, timestamptzCodec } from "loom/extensions/timestamps";
import { createCitext_1_8, citext } from "loom/extensions/citext";
import { createPgUuidv7_1_6 } from "loom/extensions/pg-uuidv7";
assert.equal(typeof createPgTrgm_1_6, "function");
assert.equal(typeof createFuzzystrmatch_1_2, "function");
assert.equal(typeof createPgTiktoken_0_0_1, "function");
assert.equal(typeof withPgTrgmThresholds, "function");
assert.equal(typeof createPgJsonschema_0_3_4, "function");
assert.equal(typeof createUuidOssp_1_1, "function");
assert.equal(uuidCodec.decode("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"), "ffffffff-ffff-ffff-ffff-ffffffffffff");
assert.equal(jsonDocument("9223372036854775807.123456789").text, "9223372036854775807.123456789");
assert.equal(timestamp("2024-01-01 00:00:00.123456").text, "2024-01-01 00:00:00.123456");
assert.equal(timestamptz("2024-01-01 00:00:00.123457+00:00:01").text, "2023-12-31 23:59:59.123457+00");
assert.equal(timestampCodec.id, "pg:timestamp:1");
assert.equal(timestamptzCodec.id, "pg:timestamptz:1");
assert.equal(typeof createCitext_1_8, "function");
assert.equal(citext("MiXeD"), "MiXeD");
assert.equal(typeof createPgUuidv7_1_6, "function");
const v7 = createPgUuidv7_1_6({ name:"pg_uuidv7",version:"1.6",schema:"identifiers_v7",apiSupport:{status:"verified"} });
v7.toTimestamptz(v7.fromTimestamp(timestamp("1970-01-01 00:00:00.123456"), true));
const dependencyNames = ${JSON.stringify(Object.keys(manifest.dependencies))};
const result = await build({ entryPoints:["selected.ts"], bundle:true, platform:"node", format:"esm", target:"node22", write:false, metafile:true, external:dependencyNames });
const inputs = Object.keys(result.metafile.inputs);
assert(inputs.some(name => name.endsWith("/core/extensions/adapters/pg-trgm.js")));
assert(!inputs.some(name => /fuzzystrmatch|pg-tiktoken|pg-jsonschema|uuid-ossp/.test(name) || name.includes("/tooling/")));
assert(!inputs.some(name => name.includes("manifests/") || name.includes("annotations/")));
assert(!inputs.some(name => name.endsWith("/native-timestamp-codecs.js")));
assert(!inputs.some(name => name.endsWith("/adapters/citext.js")));
assert(!inputs.some(name => name.endsWith("/adapters/pg-uuidv7.js")));
const bundle = result.outputFiles[0].text;
assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(bundle));
await writeFile("selected.mjs", bundle);
const {extensions} = await import("./selected.mjs");
assert.deepEqual(Object.keys(extensions), ["pg_trgm"]);
assert.equal(extensions.pg_trgm.schema, "search");
assert.equal(typeof extensions.pg_trgm.similarity, "function");
assert.equal(extensions.pg_trgm.setLimit, undefined);
assert.equal(extensions.pg_trgm.similarity("word", "words").getSQL().queryChunks.length > 0, true);
const v7Result = await build({ entryPoints:["uuidv7.ts"], bundle:true, platform:"node", format:"esm", target:"node22", write:false, metafile:true, external:dependencyNames });
const v7Inputs = Object.keys(v7Result.metafile.inputs);
assert(v7Inputs.some(name => name.endsWith("/core/extensions/adapters/pg-uuidv7.js")));
assert(!v7Inputs.some(name => /fuzzystrmatch|pg-tiktoken|pg-jsonschema|uuid-ossp|citext|pg-trgm/.test(name) || name.includes("/tooling/")));
assert(!v7Inputs.some(name => name.includes("manifests/") || name.includes("annotations/")));
const v7Bundle = v7Result.outputFiles[0].text;
assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(v7Bundle));
await writeFile("uuidv7.mjs", v7Bundle);
const {extensions: bundledV7} = await import("./uuidv7.mjs");
assert.deepEqual(Object.keys(bundledV7), ["pg_uuidv7"]);
assert.equal(bundledV7.pg_uuidv7.version, "1.6");
assert.equal(bundledV7.pg_uuidv7.schema, "identifiers_v7");
bundledV7.pg_uuidv7.toTimestamptz(bundledV7.pg_uuidv7.v7());
`,
    );
    await run(["node", "verify.mjs"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 120000);
