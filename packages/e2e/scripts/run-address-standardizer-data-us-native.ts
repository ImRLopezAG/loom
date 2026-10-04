import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/address_standardizer_data_us.json";
import { createAddressStandardizerDataUs_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/address-standardizer-data-us";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as v from "valibot";
import type { ExtensionCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { addressStandardizerDataUsNativeSeeds } from "../fixtures/address-standardizer-data-us-proof-cases";

const roundTrip =
  <Value>(codec: ExtensionCodec<Value, Value>) =>
  (value: string) =>
    codec.encode(codec.decode(value));

// Own UUID container only. Layer the exact data-only package onto the existing core artifact;
// no compiler, dependency install, base routines, shared database, or Neon access.
const source = "/tmp/loom-postgis-3.6.4-source";
const archive = await readFile(join(source, "postgis-3.6.4.tar.gz"));
assert.equal(
  createHash("sha256").update(archive).digest("hex"),
  "ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6",
);
const nativeFiles = [
  "us_lex.sql",
  "us_gaz.sql",
  "us_rules.sql",
  "sql_bits/address_standardizer_data_us_mark_editable_objects.sql.in",
];
const directory = await mkdtemp(join(tmpdir(), "loom-data-us-"));
const container = `loom-data-us-${randomUUID()}`;
const docker = (...args: string[]) =>
  execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
let client: pg.Client | undefined;
try {
  const packaged = nativeFiles.map((name) =>
    execFileSync("tar", [
      "-xOf",
      join(source, "postgis-3.6.4.tar.gz"),
      `postgis-3.6.4/extensions/address_standardizer/${name}`,
    ]),
  );
  await writeFile(join(directory, "address_standardizer_data_us--3.6.4.sql"), Buffer.concat(packaged));
  const control = execFileSync(
    "tar",
    [
      "-xOf",
      join(source, "postgis-3.6.4.tar.gz"),
      "postgis-3.6.4/extensions/address_standardizer/address_standardizer_data_us.control.in",
    ],
    { encoding: "utf8" },
  );
  await writeFile(join(directory, "address_standardizer_data_us.control"), control.replaceAll("@EXTVERSION@", "3.6.4"));
  docker(
    "run",
    "--detach",
    "--name",
    container,
    "-e",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "-p",
    "127.0.0.1::5432",
    "loom-postgis-core-3.6.4-pg18:local",
  );
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      // Docker's initialization server accepts only Unix sockets; wait for the final TCP server.
      docker("exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres");
      break;
    } catch {
      if (attempt === 59) throw new Error("Own data_us PostgreSQL fixture did not start");
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  for (const name of ["address_standardizer_data_us--3.6.4.sql", "address_standardizer_data_us.control"])
    docker("cp", join(directory, name), `${container}:/usr/share/postgresql/18/extension/${name}`);
  const port = Number(docker("port", container, "5432/tcp").split(":").at(-1));
  client = new pg.Client({ host: "127.0.0.1", port, user: "postgres", database: "postgres" });
  await client.connect();
  const schema = 'Data"US日本';
  const ns = pg.escapeIdentifier(schema);
  await client.query(
    `CREATE SCHEMA ${ns}; CREATE EXTENSION address_standardizer_data_us WITH SCHEMA ${ns} VERSION '3.6.4'`,
  );
  const observed = await captureExtensionContract(client, {
    name: "address_standardizer_data_us",
    provider: "neon",
    fixture: "owned-local-pg18-data-us-3.6.4",
  });
  assert.equal(observed.digest, manifest.digest);
  assert.deepEqual(observed.contract, manifest.contract);
  const api = createAddressStandardizerDataUs_3_6_4({
    name: "address_standardizer_data_us",
    version: "3.6.4",
    schema,
    apiSupport: { status: "verified", digest: manifest.digest },
  });
  const dialect = extensionSqlDialect(nodePgCodecs);
  const seed = [];
  for (const name of ["us_lex", "us_gaz", "us_rules"] as const) {
    const relation = `${ns}.${pg.escapeIdentifier(name)}`;
    const result: { count: number; custom: number; hash: string } = (
      await client.query(
        `SELECT count(*)::int count, count(*) FILTER (WHERE is_custom)::int custom, md5(string_agg(row_to_json(t)::text, E'\\n' ORDER BY id)) hash FROM ${relation} t`,
      )
    ).rows[0];
    seed.push({ name, ...result });
    assert.equal(result.custom, 0);
    assert(result.count > 0);
    const value: { composite_text: string; array_text: string } = (
      await client.query(
        `SELECT t::text AS composite_text, ARRAY[t,NULL]::text AS array_text FROM ${relation} t ORDER BY id LIMIT 1`,
      )
    ).rows[0];
    assert.equal(
      (
        await client.query(
          `SELECT ($1::${relation})::text AS composite_text, ($2::${relation}[])::text AS array_text`,
          [value.composite_text, value.array_text],
        )
      ).rows[0].composite_text,
      value.composite_text,
    );
    const table = api.tables[name];
    const records: { value: string }[] = (
      await client.query<{ value: string }>(`SELECT t::text value FROM ${relation} t ORDER BY id`)
    ).rows;
    const encodeComposite =
      name === "us_rules" ? roundTrip(api.tables.us_rules.codec) : roundTrip(api.tables.us_lex.codec);
    const encodeArray =
      name === "us_rules" ? roundTrip(api.tables.us_rules.arrayCodec) : roundTrip(api.tables.us_lex.arrayCodec);
    for (const record of records) {
      const encoded = encodeComposite(record.value);
      assert.equal((await client.query(`SELECT ($1::${relation})::text value`, [encoded])).rows[0].value, record.value);
    }
    assert.equal(
      (await client.query(`SELECT ($1::${relation}[])::text value`, [encodeArray(value.array_text)])).rows[0].value,
      value.array_text,
    );
    const nullComposite = name === "us_rules" ? "(,,)" : "(,,,,,)";
    assert.equal(
      (await client.query(`SELECT ($1::${relation})::text value`, [encodeComposite(nullComposite)])).rows[0].value,
      nullComposite,
    );
    const rows = table.rows("t");
    const compiled = dialect.sqlToQuery(
      sql`select ${rows.columns.id}, ${rows.columns.is_custom} from ${rows.from} order by ${rows.columns.id} limit 1`,
    );
    const typed: { id: number; is_custom: boolean } = (await client.query(compiled.sql, compiled.params)).rows[0];
    assert.equal(typed.id, 1);
    assert.equal(typed.is_custom, false);
    const unicode = name === "us_rules" ? '(7,"東京, \\"",t)' : '(7,,"東京, \\"","",,t)';
    const unicodeNative: { value: string } = (
      await client.query(`SELECT ($1::${relation})::text value`, [encodeComposite(unicode)])
    ).rows[0];
    assert.equal(encodeComposite(unicodeNative.value), encodeComposite(unicode));
    const multidimensional = `[0:1][-2:-1]={{${JSON.stringify(unicodeNative.value)},NULL},{NULL,${JSON.stringify(unicodeNative.value)}}}`;
    const multi: { value: string } = (
      await client.query(`SELECT ($1::${relation}[])::text value`, [encodeArray(multidimensional)])
    ).rows[0];
    assert.equal(encodeArray(multi.value), encodeArray(multidimensional));
    const binary: { record_bytes: Buffer; array_bytes: Buffer } = (
      await client.query(
        `SELECT record_send($1::${relation}) AS record_bytes, array_send($2::${relation}[]) AS array_bytes`,
        [unicodeNative.value, multi.value],
      )
    ).rows[0];
    assert(binary.record_bytes.byteLength > 0);
    assert(binary.array_bytes.byteLength > binary.record_bytes.byteLength);
    const received: { record_text: string; array_text: string } = (
      await client.query(`SELECT ($1::${relation})::text AS record_text, ($2::${relation}[])::text AS array_text`, [
        binary.record_bytes,
        binary.array_bytes,
      ])
    ).rows[0];
    assert.equal(received.record_text, unicodeNative.value);
    assert.equal(received.array_text, multi.value);
  }
  assert.deepEqual(seed, addressStandardizerDataUsNativeSeeds);
  const config = (
    await client.query(
      `SELECT c.relname name, x.condition FROM pg_extension e CROSS JOIN LATERAL unnest(e.extconfig,e.extcondition) x(oid,condition) JOIN pg_class c ON c.oid=x.oid WHERE e.extname='address_standardizer_data_us' ORDER BY name`,
    )
  ).rows;
  assert.deepEqual(
    config,
    ["us_gaz", "us_lex", "us_rules"].map((name) => ({ name, condition: "WHERE is_custom" })),
  );
  await client.query("BEGIN");
  for (const name of ["us_lex", "us_gaz", "us_rules"] as const) {
    const result: { id: number; is_custom: boolean } = (
      await client.query(`INSERT INTO ${ns}.${pg.escapeIdentifier(name)} DEFAULT VALUES RETURNING id,is_custom`)
    ).rows[0];
    assert.equal(result.is_custom, true);
    assert.equal(result.id, seed.find((entry) => entry.name === name)!.count + 1);
    await assert.rejects(client.query(`INSERT INTO ${ns}.${pg.escapeIdentifier(name)} (id) VALUES ($1)`, [result.id]), {
      code: "23505",
    });
    await client.query("ROLLBACK; BEGIN");
  }
  await client.query("ROLLBACK");
  await client.query(
    `CREATE ROLE data_us_reader; GRANT USAGE ON SCHEMA ${ns} TO data_us_reader; GRANT SELECT ON ALL TABLES IN SCHEMA ${ns} TO data_us_reader; SET ROLE data_us_reader`,
  );
  for (const name of ["us_lex", "us_gaz", "us_rules"]) {
    await client.query(`SELECT * FROM ${ns}.${pg.escapeIdentifier(name)} ORDER BY id LIMIT 1`);
    await assert.rejects(client.query(`INSERT INTO ${ns}.${pg.escapeIdentifier(name)} DEFAULT VALUES`), {
      code: "42501",
    });
  }
  for (const name of ["us_lex_id_seq", "us_gaz_id_seq", "us_rules_id_seq"])
    await assert.rejects(client.query(`SELECT * FROM ${ns}.${pg.escapeIdentifier(name)}`), { code: "42501" });
  await client.query("RESET ROLE");
  await client.query(`GRANT SELECT ON ALL SEQUENCES IN SCHEMA ${ns} TO data_us_reader; SET ROLE data_us_reader`);
  for (const sequence of Object.values(api.sequences)) {
    const rows = sequence.rows("s");
    for (const name of ["last_value", "log_cnt", "is_called"] as const) {
      const column = rows.columns[name];
      const compiled = dialect.sqlToQuery(sql`select ${column} as value from ${rows.from}`);
      const value: unknown = (await client.query(compiled.sql, compiled.params)).rows[0].value;
      const decoded: bigint | boolean = sequence.fields[name].decode(value);
      if (name === "is_called") v.parse(v.boolean(), decoded);
      else v.parse(v.bigint(), decoded);
    }
  }
  const receipt = {
    extension: "address_standardizer_data_us",
    version: "3.6.4",
    postgresMajor: 18,
    digest: observed.digest,
    members: observed.contract.members.length,
    memberIds: observed.contract.members.map((member) => member.id),
    exactContract: true,
    seed,
    config,
    restrictedReads: true,
    restrictedWritesDenied: true,
    restrictedSequencePrivileges: true,
    nativeCompositeArrayIo: true,
    unicodeNullMultidimensionalArrays: true,
    nativeBinarySend: true,
    nativeBinaryReceive: true,
    allSeedCodecs: 8383,
    nativeDefaultsAndPrimaryKeys: true,
    providerAcceptance: "pending",
    generationAcceptance: "pending",
    tarballAcceptance: "pending",
  };
  await writeFile("/tmp/loom-address-standardizer-data-us-native-receipt.json", JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt, null, 2));
} finally {
  await client?.end();
  try {
    docker("rm", "--force", container);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
