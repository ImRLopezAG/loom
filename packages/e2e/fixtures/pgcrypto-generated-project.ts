import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const pgcryptoGeneratedPlacement = "crypto_gen";
export const pgcryptoGeneratedModes = ["selected", "omitted", "empty", "unsupported"] as const;
export type PgcryptoGeneratedMode = (typeof pgcryptoGeneratedModes)[number];
export const pgcryptoGeneratedDigest = "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8";
/** Test-only symmetric PGP passphrase; never a production secret. */
export const pgcryptoGeneratedPassphrase = "kello-generated-fixture";
export const pgcryptoGeneratedPlaintext = "kello pgcrypto generated runtime";

const row = `v.strictObject({
  digestText: v.string(),
  digestBytea: v.string(),
  hmacText: v.string(),
  hmacBytea: v.string(),
  encrypted: v.string(),
  decrypted: v.string(),
  encryptedIv: v.string(),
  decryptedIv: v.string(),
  crypt: v.string(),
  armored: v.string(),
  dearmored: v.string(),
  keyId: v.string(),
  fips: v.boolean(),
  uuidV4: v.literal(true),
  bcryptSalt: v.literal(true),
  randomBytes: v.number(),
  pgpMessage: v.string(),
  pgpRoundTrip: v.string(),
  members: v.number(),
  effectSame: v.literal(true),
})`;

function contract(scope: "root" | "mounted") {
  return scope === "root"
    ? `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
const row = ${row};
export default defineContract({ list: oc.output(v.strictObject({ root: row, mounted: row })) });
`
    : `import { defineContract, oc } from "../_generated/contract";
import * as v from "valibot";
export default defineContract({ run: oc.output(${row}) });
`;
}

function handler(scope: "root" | "mounted") {
  const router = scope === "root" ? "os.tasks.router({ list: os.tasks.list" : "os.query.router({ run: os.query.run";
  const result =
    scope === "root"
      ? "const mounted = await context.components.crypto.rpc.query.run();\n    return { root: result, mounted };"
      : "return result;";
  return `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
function hex(value: { hex: string } | null): string {
  if (value === null) throw new Error("Unexpected SQL NULL bytea");
  return value.hex;
}
function text(value: string | null): string {
  if (value === null) throw new Error("Unexpected SQL NULL text");
  return value;
}
export default ${router}.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
    if (binding !== context.extensions || binding !== selected) throw new Error("${scope} RPC/Effect selection differs");
    const api = binding.pgcrypto;
    const fixture = sql\`(values (1)) as fixture(value)\`;
    const [first] = await context.db
      .select({
        digestText: api.digest("abc", "sha256", "text"),
        digestBytea: api.digest({ hex: "616263" }, "sha256", "bytea"),
        hmacText: api.hmac("Jefe", "what do ya want for nothing?", "sha1", "text"),
        hmacBytea: api.hmac({ hex: "4869205468657265" }, { hex: "${"0b".repeat(16)}" }, "sha1", "bytea"),
        encrypted: api.encrypt({ hex: "00112233445566778899aabbccddeeff" }, { hex: "000102030405060708090a0b0c0d0e0f" }, "aes-ecb/pad:none"),
        decrypted: api.decrypt({ hex: "69c4e0d86a7b0430d8cdb78070b4c55a" }, { hex: "000102030405060708090a0b0c0d0e0f" }, "aes-ecb/pad:none"),
        encryptedIv: api.encryptWithIv({ hex: "6bc1bee22e409f96e93d7e117393172a" }, { hex: "2b7e151628aed2a6abf7158809cf4f3c" }, { hex: "000102030405060708090a0b0c0d0e0f" }, "aes-cbc/pad:none"),
        decryptedIv: api.decryptWithIv({ hex: "7649abac8119b246cee98e9b12e9197d" }, { hex: "2b7e151628aed2a6abf7158809cf4f3c" }, { hex: "000102030405060708090a0b0c0d0e0f" }, "aes-cbc/pad:none"),
        crypt: api.crypt("foox", "$1$Szzz0yzz"),
        armored: api.armor({ hex: "74657374" }),
        fips: api.fipsMode(),
        uuid: api.genRandomUuid(),
        salt: api.genSalt("bf"),
        randomBytes: api.genRandomBytes(16),
        pgpMessage: api.pgpSymEncrypt("${pgcryptoGeneratedPlaintext}", "${pgcryptoGeneratedPassphrase}"),
      })
      .from(fixture);
    if (!first) throw new Error("Missing generated pgcrypto row");
    const message = { hex: hex(first.pgpMessage) };
    const [second] = await context.db
      .select({
        dearmored: api.dearmor(text(first.armored)),
        keyId: api.keyId(message),
        pgpRoundTrip: api.pgpSymDecrypt(message, "${pgcryptoGeneratedPassphrase}"),
      })
      .from(fixture);
    if (!second) throw new Error("Missing generated pgcrypto decoding row");
    const result = {
      digestText: hex(first.digestText),
      digestBytea: hex(first.digestBytea),
      hmacText: hex(first.hmacText),
      hmacBytea: hex(first.hmacBytea),
      encrypted: hex(first.encrypted),
      decrypted: hex(first.decrypted),
      encryptedIv: hex(first.encryptedIv),
      decryptedIv: hex(first.decryptedIv),
      crypt: text(first.crypt),
      armored: text(first.armored),
      dearmored: hex(second.dearmored),
      keyId: text(second.keyId),
      fips: first.fips,
      uuidV4: /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(first.uuid) as true,
      bcryptSalt: /^\\$2a\\$06\\$[./A-Za-z0-9]{22}$/.test(text(first.salt)) as true,
      randomBytes: hex(first.randomBytes).length / 2,
      pgpMessage: message.hex,
      pgpRoundTrip: text(second.pgpRoundTrip),
      members: Object.keys(api.sql.functions).length,
      effectSame: true as const,
    };
    ${result}
  }),
});
function compileOnly() {
  // @ts-expect-error Unselected families remain absent.
  selected.pg_trgm;
  // @ts-expect-error Public canonical overload arity is fixed.
  selected.pgcrypto.sql.functions["pgp_sym_encrypt(text,text)"]("x", "key", "");
  // @ts-expect-error Binary wire data is not Buffer.
  selected.pgcrypto.pgpPubEncryptBytea(Buffer.from([0]), { hex: "00" });
  // @ts-expect-error Native int4 arguments do not accept text.
  selected.pgcrypto.genRandomBytes("16");
}
void compileOnly;
`;
}

async function writeShell(root: string, config: string, componentExtensions: string) {
  await writeFile(
    join(root, "kello.config.ts"),
    `import { defineConfig } from "kello/tooling"; export default defineConfig(${config});`,
  );
  await writeFile(
    join(root, "kello/app.config.ts"),
    'import { defineApplication } from "kello/server"; import crypto from "./components/crypto/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(crypto); export default app;',
  );
  const component = join(root, "kello/components/crypto");
  await mkdir(join(component, "contracts"), { recursive: true });
  await mkdir(join(component, "functions"), { recursive: true });
  await writeFile(
    join(component, "setup.ts"),
    `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "crypto", ${componentExtensions} rpc: ({ os }) => ({ os }) });`,
  );
  return component;
}

/** Caller supplies public package tooling. This fixture never imports a source adapter. */
export async function writePgcryptoProject(root: string, mode: PgcryptoGeneratedMode): Promise<void> {
  if (mode !== "selected") {
    await writeUnselectedProject(root, mode);
    return;
  }
  const component = await writeShell(
    root,
    `{ database: { extensions: { pgcrypto: { version: "1.4", schema: "${pgcryptoGeneratedPlacement}" } } } }`,
    'extensions: { pgcrypto: { versions: ["1.4"] } },',
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.pgcrypto;
if (api.schema !== "${pgcryptoGeneratedPlacement}" || api.version !== "1.4" || Object.keys(api.sql.functions).length !== 37)
  throw new Error("Wrong first-load pgcrypto binding");
export default defineSchema((s) => ({
  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),
}), { namespace: "app" });
`,
  );
  await writeFile(join(root, "kello/contracts/tasks.ts"), contract("root"));
  await writeFile(join(root, "kello/functions/tasks.ts"), handler("root"));
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (Object.keys(extensions).join(",") !== "pgcrypto" || extensions.pgcrypto.schema !== "${pgcryptoGeneratedPlacement}") throw new Error("Wrong mounted selection"); export default defineSchema(() => ({}));`,
  );
  await writeFile(join(component, "contracts/query.ts"), contract("mounted"));
  await writeFile(join(component, "functions/query.ts"), handler("mounted"));
}

async function writeUnselectedProject(root: string, mode: Exclude<PgcryptoGeneratedMode, "selected">): Promise<void> {
  const unsupported = mode === "unsupported";
  const status = unsupported ? "unverified" : "absent";
  const config =
    mode === "omitted"
      ? "{}"
      : unsupported
        ? `{ database: { extensions: { pgcrypto: { version: "1.3", schema: "${pgcryptoGeneratedPlacement}" } } } }`
        : "{ database: { extensions: {} } }";
  const assertion = unsupported
    ? 'if (selected.pgcrypto.apiSupport.status !== "unverified" || selected.pgcrypto.version !== "1.3" || "sql" in selected.pgcrypto || "digest" in selected.pgcrypto) throw new Error("Wrong unsupported descriptor");'
    : 'if (selected !== undefined) throw new Error("Unselected extensions must be undefined");';
  const negative = unsupported ? 'selected.pgcrypto.digest("abc", "sha256", "text");' : "selected.pgcrypto;";
  const fields = `status: v.literal("${status}"), value: v.literal(1), effectSame: v.literal(true)`;
  const output = (scope: "root" | "mounted") =>
    scope === "root"
      ? `import { defineContract, oc } from "kello/contract";
import * as v from "valibot";
export default defineContract({ list: oc.output(v.strictObject({ ${fields}, mounted: v.strictObject({ ${fields} }) })) });`
      : `import { defineContract, oc } from "../_generated/contract";
import * as v from "valibot";
export default defineContract({ run: oc.output(v.strictObject({ ${fields} })) });`;
  const query = (scope: "root" | "mounted") => `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default ${scope === "root" ? "os.tasks.router({ list: os.tasks.list" : "os.query.router({ run: os.query.run"}.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== selected || binding !== context.extensions) throw new Error("Unselected RPC/Effect identity differs");
  ${assertion}
  const [row] = await context.db.select({ value: sql<number>\`1\` }).from(sql\`(values(1)) as probe(value)\`);
  if (row?.value !== 1) throw new Error("Native query did not execute");
  const result = { status: "${status}" as const, value: 1 as const, effectSame: true as const };
  ${scope === "root" ? "return { ...result, mounted: await context.components.crypto.rpc.query.run() };" : "return result;"}
}) });
function compileOnly() {
  // @ts-expect-error Missing or unsupported versions do not expose a query helper.
  ${negative}
}
void compileOnly;`;
  const component = await writeShell(
    root,
    config,
    unsupported ? 'extensions: { pgcrypto: { versions: ["1.3"] } },' : "",
  );
  await writeFile(
    join(root, "kello/schema.ts"),
    `import { defineSchema, defineTable } from "kello/server"; import { extensions as selected } from "./_generated/extensions"; ${assertion} export default defineSchema(s => ({ tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }) }), { namespace: "app" });`,
  );
  await writeFile(join(root, "kello/contracts/tasks.ts"), output("root"));
  await writeFile(join(root, "kello/functions/tasks.ts"), query("root"));
  await writeFile(
    join(component, "schema.ts"),
    `import { defineSchema } from "kello/server"; import { extensions as selected } from "./_generated/extensions"; ${assertion} export default defineSchema(() => ({}));`,
  );
  await writeFile(join(component, "contracts/query.ts"), output("mounted"));
  await writeFile(join(component, "functions/query.ts"), query("mounted"));
}

/** Read actual generated files after first-load virtual bindings. */
export async function checkPgcryptoDiskBindings(root: string, mode: PgcryptoGeneratedMode) {
  const file = join(root, "kello/_generated/extensions.ts");
  const source = await readFile(file, "utf8");
  const disk = await import(pathToFileURL(file).href);
  const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
  assert.equal(server.extensions, disk.extensions);
  const component = await readFile(join(root, "kello/components/crypto/_generated/extensions.ts"), "utf8");
  if (mode !== "selected") {
    assert(!source.includes("createPgcrypto_1_4"));
    assert(!component.includes("createPgcrypto_1_4"));
    if (mode === "unsupported") {
      assert.deepEqual(Object.keys(disk.extensions), ["pgcrypto"]);
      assert.equal(disk.extensions.pgcrypto.version, "1.3");
      assert.equal(disk.extensions.pgcrypto.apiSupport.status, "unverified");
      assert.equal("sql" in disk.extensions.pgcrypto, false);
    } else assert.equal(disk.extensions, undefined);
    return { extensions: disk.extensions };
  }
  assert(source.includes('import { createPgcrypto_1_4 } from "kello/extensions/pgcrypto";'));
  assert(source.includes('"pgcrypto": createPgcrypto_1_4(descriptors["pgcrypto"])'));
  assert(source.includes(pgcryptoGeneratedDigest));
  assert(component.includes('from "kello/extensions/pgcrypto"'));
  for (const forbidden of [
    "kello/extensions/pg-trgm",
    "kello/extensions/pg-graphql",
    "./schema",
    "./server",
    "kello.config",
  ])
    assert(!source.includes(forbidden), forbidden);
  assert.deepEqual(Object.keys(disk.extensions), ["pgcrypto"]);
  assert(Object.isFrozen(disk.extensions));
  const api = disk.extensions.pgcrypto;
  assert.equal(api.name, "pgcrypto");
  assert.equal(api.version, "1.4");
  assert.equal(api.schema, pgcryptoGeneratedPlacement);
  assert.deepEqual(api.apiSupport, { status: "verified", digest: pgcryptoGeneratedDigest });
  assert.equal(Object.keys(api.sql.functions).length, 37);
  assert.deepEqual(Object.keys(api.sql.operators), []);
  const serverSource = await readFile(join(root, "kello/_generated/server.ts"), "utf8");
  assert(serverSource.includes("createProjectServices"));
  assert((await readFile(join(root, "kello/_generated/rpc.ts"), "utf8")).includes("createApplicationRpc"));
  return { extensions: disk.extensions };
}
