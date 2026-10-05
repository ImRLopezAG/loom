import assert from "node:assert/strict";
import { test } from "bun:test";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("documented authoring examples compile and validate through a packed public API", async () => {
  const examples = fileURLToPath(new URL("../../../apps/docs/examples/", import.meta.url));
  assert.ok((await readFile(join(examples, "kello/schema.ts"), "utf8")).includes("defineSchema"));
  const root = await mkdtemp(join(tmpdir(), "loom-docs-consumer-"));
  async function run(command: string[], cwd = root) {
    const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 60000 });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(code, 0, `${command.join(" ")}\n${stdout}\n${stderr}`);
  }
  try {
    await run(
      ["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"],
      fileURLToPath(new URL("../../../apps/loom/", import.meta.url)),
    );
    await cp(examples, join(root, "examples"), {
      recursive: true,
      filter: (path) => !["_generated", ".loom"].includes(path.split("/").at(-1) ?? ""),
    });
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: {
          kello: "file:./kello.tgz",
          "drizzle-orm": "1.0.0-rc.4",
          "@orpc/server": "2.0.0-beta.41",
          effect: "4.0.0",
          valibot: "1.5.0",
          typescript: "7.0.2",
          "@types/node": "24.13.6",
        },
      }),
    );
    await writeFile(
      join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          types: ["node"],
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
        },
        include: ["examples/**/*.ts", "verify.ts"],
      }),
    );
    await run(["bun", "install", "--ignore-scripts"]);
    await writeFile(
      join(root, "generate.ts"),
      'import { generateProject } from "kello/tooling"; await generateProject("./examples");',
    );
    await run(["bun", "generate.ts"]);
    await writeFile(
      join(root, "verify.ts"),
      `
import assert from "node:assert/strict";
import { createRouterClient, implement } from "@orpc/server";
import { defineConfig } from "kello/tooling";
import { contract } from "./examples/kello/_generated/contract-registry";
import schema from "./examples/kello/schema";
import relations from "./examples/kello/relations";
import auth from "./examples/kello/auth.config";
import tasks from "./examples/kello/functions/tasks";
assert.equal(schema.metadata.namespace, "app");
const capabilities = defineConfig({ database: { extensions: { vector: { version: "0.8.6" }, pg_trgm: { version: "1.6", schema: "text_search" } } } });
assert.equal(capabilities.database.extensions?.vector?.schema, "extensions");
assert.equal(capabilities.database.extensions?.pg_trgm?.schema, "text_search");
if (false) {
  // @ts-expect-error unsupported names are rejected by the packed tooling type
  defineConfig({ database: { extensions: { invented_extension: { version: "1" } } } });
}
const insert = schema.validators.tasks.insert["~standard"];
assert.deepEqual(await insert.validate({ title: "  Ship docs  " }), { value: { title: "Ship docs" } });
assert.ok((await insert.validate({ title: " " })).issues);
assert.ok((await insert.validate({ title: "Valid", ownerId: "forged" })).issues);
assert.ok((await schema.validators.tasks.patch["~standard"].validate({ title: undefined })).issues);
const projected = await schema.validators.tasks.public["~standard"].validate({ _id: "00000000-0000-4000-8000-000000000001", title: "Ship", done: false, ownerId: "private-owner" });
assert.deepEqual(projected, { value: { _id: "00000000-0000-4000-8000-000000000001", title: "Ship", done: false } });
assert.ok(relations);
const invocation = { identity: null, requestId: "docs", signal: new AbortController().signal };
await assert.rejects(auth.authorize({ ...invocation, path: ["tasks", "greeting"], input: { name: "Ada" } }));
assert.ok(tasks.greeting);
const client = createRouterClient({ greeting: implement(contract.tasks.greeting).handler(({ input }) => "Hello, " + input.name) });
assert.equal(await client.greeting({ name: "Ada" }), "Hello, Ada");
`,
    );
    await run(["bun", "run", "tsc", "-p", "tsconfig.json"]);
    await run(["bun", "verify.ts"]);
    const extensionPage = await readFile(
      fileURLToPath(new URL("../../../apps/docs/content/docs/integrations/postgres-extensions.mdx", import.meta.url)),
      "utf8",
    );
    const extensionExamples = Object.fromEntries(
      [
        "kello.config.ts",
        "kello/schema.ts",
        "kello/contracts/tasks.ts",
        "kello/functions/tasks.ts",
        "kello/pgp-example.ts",
      ].map((file) => {
        const marker = '```ts title="typed/' + file + '"\n';
        const start = extensionPage.indexOf(marker);
        assert.notEqual(start, -1, `Missing checked extension example: ${file}`);
        const end = extensionPage.indexOf("\n```", start + marker.length);
        assert.notEqual(end, -1, `Unclosed extension example: ${file}`);
        return [file, extensionPage.slice(start + marker.length, end) + "\n"];
      }),
    );
    await writeFile(
      join(root, "generate-extensions.ts"),
      `import { initializeProject, generateProject } from "kello/tooling";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
await initializeProject("./typed", "typeddocs");
for (const [file, source] of Object.entries(${JSON.stringify(extensionExamples)})) {
  await writeFile(join("typed", file), source);
}
await generateProject("./typed");
`,
    );
    await run(["bun", "generate-extensions.ts"]);
    await writeFile(
      join(root, "typed/kello/extension-docs-verification.ts"),
      `import type { SQL } from "drizzle-orm";
import { createPgcrypto_1_4 } from "kello/extensions/pgcrypto";
import { extensions } from "./_generated/extensions";
import schema from "./schema";
const digest = extensions.pgcrypto.digest(schema.tables.tasks.title, "sha256", "text");
const typedDigest: SQL<{ hex: string } | null> = digest;
const ciphertext: SQL<{ hex: string } | null> = extensions.pgcrypto.pgpSymEncrypt(schema.tables.tasks.title, "fixture-passphrase");
type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Condition extends true> = Condition;
export type DigestResult = Assert<Equal<typeof digest._.type, { hex: string } | null>>;
export type SelectedVersion = Assert<Equal<typeof extensions.pgcrypto.version, "1.4">>;
export type DefaultPlacement = Assert<Equal<typeof extensions.pgcrypto.schema, "extensions">>;
// @ts-expect-error A checked digest is not a nullable string expression.
const stringDigest: SQL<string | null> = digest;
// @ts-expect-error Text columns cannot select the bytea overload.
extensions.pgcrypto.digest(schema.tables.tasks.title, "sha256", "bytea");
// @ts-expect-error The fixed native return type cannot be replaced by a caller generic.
extensions.pgcrypto.digest<string>(schema.tables.tasks.title, "sha256", "text");
void [createPgcrypto_1_4, typedDigest, ciphertext, stringDigest];
`,
    );
    await run(["bun", "run", "tsc", "-p", "typed/tsconfig.json"]);
    await writeFile(
      join(root, "verify-extensions.ts"),
      `import assert from "node:assert/strict";
import { extensions } from "./typed/kello/_generated/extensions";
import { Extensions } from "./typed/kello/_generated/server";
import { createPgcrypto_1_4 } from "kello/extensions/pgcrypto";
import schema from "./typed/kello/schema";
import tasks from "./typed/kello/functions/tasks";
import { encryptTitles } from "./typed/kello/pgp-example";
assert.deepEqual(Object.keys(extensions).sort(), ["citext", "pg_trgm", "pg_uuidv7", "pgcrypto"]);
assert.equal(extensions.pg_trgm.schema, "text_search");
assert.equal(extensions.citext.schema, "extensions");
assert.equal(extensions.pg_uuidv7.version, "1.6");
assert.equal(extensions.pgcrypto.version, "1.4");
assert.equal(extensions.pgcrypto.schema, "extensions");
assert.equal(typeof createPgcrypto_1_4, "function");
assert.equal(schema.tables.tasks.label.getSQLType(), '"extensions"."citext"');
assert.equal(extensions.pg_trgm.similarity(schema.tables.tasks.title, "kello").getSQL().queryChunks.length > 0, true);
assert.equal(extensions.citext.equal(schema.tables.tasks.label, "Kello").getSQL().queryChunks.length > 0, true);
assert.equal(extensions.pg_uuidv7.v7().getSQL().queryChunks.length > 0, true);
assert.equal(extensions.pgcrypto.digest(schema.tables.tasks.title, "sha256", "text").getSQL().queryChunks.length > 0, true);
assert.equal(Object.keys(extensions.pgcrypto.sql.functions).length, 37);
assert.ok(Extensions);
assert.ok(tasks.search);
assert.ok(tasks.effectSearch);
assert.equal(typeof encryptTitles, "function");
`,
    );
    await run(["bun", "verify-extensions.ts"]);
    const triggerExamples = Object.fromEntries(
      ["kello.config.ts", "kello/schema.ts"].map((file) => {
        const marker = '```ts title="triggers/' + file + '"\n';
        const start = extensionPage.indexOf(marker);
        assert.notEqual(start, -1, `Missing checked trigger example: ${file}`);
        const end = extensionPage.indexOf("\n```", start + marker.length);
        assert.notEqual(end, -1, `Unclosed trigger example: ${file}`);
        return [file, extensionPage.slice(start + marker.length, end) + "\n"];
      }),
    );
    await writeFile(
      join(root, "generate-triggers.ts"),
      `import { initializeProject, generateProject } from "kello/tooling";
import { writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
await initializeProject("./triggers", "triggerdocs");
await rm("triggers/kello/functions/tasks.ts");
await rm("triggers/kello/contracts/tasks.ts");
for (const [file, source] of Object.entries(${JSON.stringify(triggerExamples)})) {
  await writeFile(join("triggers", file), source);
}
await generateProject("./triggers");
`,
    );
    await run(["bun", "generate-triggers.ts"]);
    await run(["bun", "run", "tsc", "-p", "triggers/tsconfig.json"]);
    await writeFile(
      join(root, "verify-triggers.ts"),
      `import assert from "node:assert/strict";
import schema from "./triggers/kello/schema";
assert.deepEqual(schema.metadata.extensionRequirements.map(entry => entry.name).sort(), ["autoinc", "moddatetime"]);
assert.deepEqual(schema.metadata.extensionTriggers.map(entry => entry.name).sort(), ["assign_number", "touch"]);
assert.equal(schema.metadata.extensionTriggers.every(entry => entry.table.schema === "app" && entry.table.name === "tickets"), true);
`,
    );
    await run(["bun", "verify-triggers.ts"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 120000);
