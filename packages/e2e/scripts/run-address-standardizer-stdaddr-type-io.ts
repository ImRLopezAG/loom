import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createAddressStandardizer_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/address-standardizer";
import { ADDRESS_STANDARDIZER_DIGEST } from "../fixtures/address-standardizer-proof-cases";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const suffix = crypto.randomUUID().replaceAll("-", "");
const container = `loom-addrstd-pg18-${suffix}`;
const user = `loom_${suffix.slice(0, 12)}`;
const password = crypto.randomUUID();
const database = `loom_${suffix.slice(0, 12)}`;

function execute(command: string[]) {
  return spawnSync(command[0]!, command.slice(1), {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

const inspected = execute(["docker", "image", "inspect", "postgres:18"]);
assert.equal(inspected.status, 0, "Local postgres:18 image is required for disposable stdaddr type IO");
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
  "postgres:18",
]);
assert.equal(started.status, 0, started.stderr);

const descriptor = {
  name: "address_standardizer" as const,
  version: "3.6.4" as const,
  schema: "addr_std",
  apiSupport: { status: "verified" as const, digest: ADDRESS_STANDARDIZER_DIGEST },
};
const api = createAddressStandardizer_3_6_4(descriptor);
const unicode = {
  building: null,
  house_num: "123",
  predir: null,
  qual: null,
  pretype: null,
  name: 'Main "通り"',
  suftype: "ST",
  sufdir: null,
  ruralroute: null,
  extra: "a\\b",
  city: "東京",
  state: null,
  country: null,
  postcode: null,
  box: null,
  unit: "",
};

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    const ready = execute(["docker", "exec", container, "pg_isready", "-U", user, "-d", database]);
    if (ready.status === 0) break;
    if (attempt === 59) throw new Error("Disposable address_standardizer PostgreSQL 18 did not become ready");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  const port = execute(["docker", "port", container, "5432/tcp"]);
  assert.equal(port.status, 0, port.stderr);
  const match = /127\.0\.0\.1:(\d+)/.exec(port.stdout);
  assert(match, `Could not parse published port: ${port.stdout}`);
  const url = new URL(`postgresql://127.0.0.1:${match[1]}/${database}`);
  url.username = user;
  url.password = password;
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  try {
    await client.query("CREATE SCHEMA addr_std");
    await client.query(
      `CREATE TYPE addr_std.stdaddr AS (building text, house_num text, predir text, qual text, pretype text, name text, suftype text, sufdir text, ruralroute text, extra text, city text, state text, country text, postcode text, box text, unit text)`,
    );
    const encoded = api.codec.encode(unicode);
    const native = await client.query<{ value: string }>("SELECT $1::addr_std.stdaddr::text AS value", [encoded]);
    assert.deepEqual(api.codec.decode(native.rows[0]!.value), unicode);
    const array = await client.query<{ value: string }>("SELECT $1::addr_std.stdaddr[]::text AS value", [
      api.arrayCodec.encode({ dimensions: [{ lowerBound: 1, length: 2 }], values: [unicode, null] }),
    ]);
    assert.deepEqual(api.arrayCodec.decode(array.rows[0]!.value), {
      dimensions: [{ lowerBound: 1, length: 2 }],
      values: [unicode, null],
    });
    console.log("address_standardizer stdaddr type IO: passed");
  } finally {
    await client.end();
  }
} finally {
  execute(["docker", "rm", "-f", container]);
}
