import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as v from "valibot";
import { createAddressStandardizer_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/address-standardizer";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { addressStandardizerRoutineProofCase } from "../fixtures/address-standardizer-proof-cases";
import { ADDRESS_STANDARDIZER_DIGEST } from "../fixtures/address-standardizer-proof-cases";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const tarball = "/tmp/loom-postgis-3.6.4-source/postgis-3.6.4.tar.gz";
const expectedTarball = "ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6";
const image = "loom-address-standardizer-3.6.4-pg18:local";
const dockerfile = "packages/e2e/scripts/address-standardizer-native.Dockerfile";
const members = addressStandardizerRoutineProofCase.claims.map((claim) => claim.member);
assert.equal(members.length, 4, "All four address_standardizer routines must be claimed individually");

function execute(command: string[], cwd = root) {
  return spawnSync(command[0]!, command.slice(1), {
    cwd,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function requireSuccess(child: ReturnType<typeof execute>, label: string) {
  assert.equal(child.status, 0, `${label}\n${child.stdout}\n${child.stderr}`);
  return child;
}

const observedTarball = createHash("sha256").update(readFileSync(tarball)).digest("hex");
assert.equal(
  observedTarball,
  expectedTarball,
  "address_standardizer native image requires the exact PostGIS 3.6.4 tarball",
);

if (execute(["docker", "image", "inspect", image]).status !== 0) {
  requireSuccess(
    execute(["docker", "build", "-f", dockerfile, "-t", image, "/tmp/loom-postgis-3.6.4-source"]),
    "family address_standardizer image build",
  );
}

const suffix = crypto.randomUUID().replaceAll("-", "");
const container = `loom-addrstd-native-pg18-${suffix}`;
const user = `loom_${suffix.slice(0, 12)}`;
const password = crypto.randomUUID();
const database = `loom_${suffix.slice(0, 12)}`;
const started = execute([
  "docker",
  "run",
  "-d",
  "--name",
  container,
  "-e",
  `POSTGRES_USER=${user}`,
  "-e",
  `POSTGRES_PASSWORD=${password}`,
  "-e",
  `POSTGRES_DB=${database}`,
  "-p",
  "127.0.0.1::5432",
  image,
]);
assert.equal(started.status, 0, started.stderr);

const descriptor = {
  name: "address_standardizer" as const,
  version: "3.6.4" as const,
  schema: 'Addr"日本',
  apiSupport: { status: "verified" as const, digest: ADDRESS_STANDARDIZER_DIGEST },
};
const api = createAddressStandardizer_3_6_4(descriptor);
const dialect = extensionSqlDialect(nodePgCodecs);
const qualified = {
  lex: { schema: "lex_schema", name: "us_lex" },
  gaz: { schema: "lex_schema", name: "us_gaz" },
  rules: { schema: "lex_schema", name: "us_rules" },
} as const;
const searchPath = {
  lex: { name: "us_lex" },
  gaz: { name: "us_gaz" },
  rules: { name: "us_rules" },
} as const;
const fiveExpected = {
  building: null,
  house_num: "123",
  predir: null,
  qual: null,
  pretype: null,
  name: "MAIN",
  suftype: "STREET",
  sufdir: null,
  ruralroute: null,
  extra: null,
  city: "KANSAS CITY",
  state: "MISSOURI",
  country: null,
  postcode: "45678",
  box: null,
  unit: null,
};
const fourExpected = {
  building: null,
  house_num: "1566",
  predir: null,
  qual: null,
  pretype: null,
  name: "NEW STATE HIGHWAY",
  suftype: null,
  sufdir: null,
  ruralroute: null,
  extra: null,
  city: "RAYNHAM",
  state: "MASSACHUSETTS",
  country: "USA",
  postcode: null,
  box: null,
  unit: null,
};
const parsedExpected = {
  num: "123",
  street: "Main Street",
  street2: null,
  address1: "123 Main Street",
  city: "Kansas City",
  state: "MO",
  zip: "45678",
  zipplus: "",
  country: "US",
};

function extractSql(name: string) {
  const listed = requireSuccess(
    execute(["tar", "-xOf", tarball, `postgis-3.6.4/extensions/address_standardizer/${name}`]),
    name,
  );
  return listed.stdout;
}

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    const ready = execute(["docker", "exec", container, "pg_isready", "-U", user, "-d", database]);
    if (ready.status === 0) break;
    if (attempt === 59) throw new Error("Disposable address_standardizer PostgreSQL 18 did not become ready");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  const port = requireSuccess(execute(["docker", "port", container, "5432/tcp"]), "docker port");
  const match = /127\.0\.0\.1:(\d+)/.exec(port.stdout);
  assert(match, `Could not parse published port: ${port.stdout}`);
  const url = new URL(`postgresql://127.0.0.1:${match[1]}/${database}`);
  url.username = user;
  url.password = password;
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  try {
    const schema = pg.escapeIdentifier(descriptor.schema);
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`CREATE EXTENSION address_standardizer WITH SCHEMA ${schema} VERSION '3.6.4'`);
    const installed = await client.query<{ extversion: string; nspname: string }>(
      `SELECT e.extversion, n.nspname
       FROM pg_extension e
       JOIN pg_namespace n ON n.oid = e.extnamespace
       WHERE e.extname = 'address_standardizer'`,
    );
    assert.equal(installed.rows[0]?.extversion, "3.6.4");
    assert.equal(installed.rows[0]?.nspname, descriptor.schema);
    const companion = await client.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM pg_extension WHERE extname = 'address_standardizer_data_us'",
    );
    assert.equal(companion.rows[0]?.count, "0");
    await client.query("CREATE SCHEMA lex_schema");
    await client.query("SET search_path TO lex_schema, pg_catalog");
    await client.query(extractSql("us_lex.sql"));
    await client.query(extractSql("us_gaz.sql"));
    await client.query(extractSql("us_rules.sql"));

    const witnessed = new Set<string>();
    async function witness(member: string, run: () => Promise<void>) {
      assert(
        members.some((identity) => identity === member),
        `Undeclared native member ${member}`,
      );
      await run();
      witnessed.add(member);
    }

    await witness(members[2]!, async () => {
      const expression = api.standardizeAddress(qualified, "123 Main Street", "Kansas City, MO 45678");
      assert.equal(extensionExpressionContract(expression)?.member, members[2]);
      assert.deepEqual(extensionExpressionContract(expression)?.dependencies, [
        "lex_schema.us_lex",
        "lex_schema.us_gaz",
        "lex_schema.us_rules",
      ]);
      const compiled = dialect.sqlToQuery(sql`SELECT ${expression}::text AS value`);
      const native = await client.query<{ value: string }>(compiled.sql, compiled.params);
      assert.deepEqual(api.codec.decode(native.rows[0]!.value), fiveExpected);
      const raw = await client.query<{ value: string }>(
        `SELECT ${schema}.standardize_address($1::text,$2::text,$3::text,$4::text,$5::text)::text AS value`,
        [
          '"lex_schema"."us_lex"',
          '"lex_schema"."us_gaz"',
          '"lex_schema"."us_rules"',
          "123 Main Street",
          "Kansas City, MO 45678",
        ],
      );
      assert.deepEqual(api.codec.decode(raw.rows[0]!.value), fiveExpected);
      const missing = await client.query<{ value: string | null }>(
        `SELECT ${schema}.standardize_address($1::text,$2::text,$3::text,$4::text,$5::text)::text AS value`,
        [null, '"lex_schema"."us_lex"', '"lex_schema"."us_rules"', "123 Main Street", "Kansas City, MO 45678"],
      );
      assert.equal(missing.rows[0]!.value, null);
    });

    await witness(members[3]!, async () => {
      const expression = api.standardizeAddress(qualified, "1566 NEW STATE HWY, RAYNHAM, MA");
      assert.equal(extensionExpressionContract(expression)?.member, members[3]);
      const compiled = dialect.sqlToQuery(sql`SELECT ${expression}::text AS value`);
      const native = await client.query<{ value: string }>(compiled.sql, compiled.params);
      assert.deepEqual(api.codec.decode(native.rows[0]!.value), fourExpected);
      const search = api.standardizeAddress(searchPath, "1566 NEW STATE HWY, RAYNHAM, MA");
      assert.equal(extensionExpressionContract(search)?.observability, "session");
      assert.deepEqual(extensionExpressionContract(search)?.dependencies, []);
      const searchQuery = dialect.sqlToQuery(sql`SELECT ${search}::text AS value`);
      const searched = await client.query<{ value: string }>(searchQuery.sql, searchQuery.params);
      assert.deepEqual(api.codec.decode(searched.rows[0]!.value), fourExpected);
    });

    await witness(members[1]!, async () => {
      const expression = api.parseAddress("123 Main Street, Kansas City, MO 45678");
      assert.equal(extensionExpressionContract(expression)?.member, members[1]);
      const compiled = dialect.sqlToQuery(sql`SELECT ${expression}::text AS value`);
      const native = await client.query<{ value: string }>(compiled.sql, compiled.params);
      assert.deepEqual(api.parseCodec.decode(native.rows[0]!.value), parsedExpected);
      const missing = await client.query<{ value: string | null }>(
        `SELECT ${schema}.parse_address($1::text)::text AS value`,
        [null],
      );
      assert.equal(missing.rows[0]!.value, null);
    });

    await witness(members[0]!, async () => {
      const expression = api.sql.functions.debug_standardize_address(
        "us_lex",
        "us_gaz",
        "us_rules",
        "123 Main Street",
        "Kansas City, MO 45678",
      );
      assert.equal(extensionExpressionContract(expression)?.member, members[0]);
      const compiled = dialect.sqlToQuery(sql`SELECT ${expression} AS value`);
      const native = await client.query<{ value: string }>(compiled.sql, compiled.params);
      assert.match(native.rows[0]!.value, /HOUSE|STREET|MAIN/);
      const tokens = await client.query<{ input_word: string; output_token: string }>(
        `SELECT je->>'input-word' AS input_word, je->>'output-token' AS output_token
         FROM jsonb(${schema}.debug_standardize_address($1::text,$2::text,$3::text,$4::text,$5::text)) AS d,
              jsonb_array_elements(d->'rules'->0->'rule_tokens') AS je`,
        ["us_lex", "us_gaz", "us_rules", "123 Main Street", "Kansas City, MO 45678"],
      );
      assert.deepEqual(
        tokens.rows.map((row) => [row.input_word, row.output_token]),
        [
          ["123", "HOUSE"],
          ["MAIN", "STREET"],
          ["STREET", "SUFTYP"],
        ],
      );
      const fourArg = api.sql.functions.debug_standardize_address("us_lex", "us_gaz", "us_rules", "123 Main Street");
      const fourQuery = dialect.sqlToQuery(sql`SELECT ${fourArg} AS value`);
      const four = await client.query<{ value: string }>(fourQuery.sql, fourQuery.params);
      assert(v.parse(v.string(), four.rows[0]!.value).length > 0);
    });

    assert.deepEqual([...witnessed].sort(), [...members].sort());
    console.log("address_standardizer native routines: passed");
  } finally {
    await client.end();
  }
} finally {
  execute(["docker", "rm", "-f", container]);
}
