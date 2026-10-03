import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { withExtensionDatabase } from "./extension-database";

export type NativeBitKind = "bit" | "varbit";
export interface NativeBitDimension {
  readonly lowerBound: number;
  readonly length: number;
}
export const bitSchema = 'Bit_"Codec_日本';
// Fixed fixture identifiers use native quoted-identifier escaping, including quotes and Unicode.
const quoteIdentifier = pg.escapeIdentifier;
/** Symbolic pg_catalog types carry no typmod, unlike the SQL keyword bit, which means bit(1). */
export const bitType = (kind: NativeBitKind) => `pg_catalog.${quoteIdentifier(kind)}`;
export const bitFunction = (name: string) => `${quoteIdentifier(bitSchema)}.${quoteIdentifier(name)}`;

/**
 * Build a bit string from int8 two's-complement chunks, substring and concatenation, independent
 * of bit_in's text grammar. Parameters are bound int8 values, chunk lengths and the result kind.
 */
export function nativeBitConstructor(kind: NativeBitKind, bits: string, offset = 0) {
  const chunks = bits.match(/[01]{1,64}/g) ?? [];
  const parameters: unknown[] = [];
  const pieces = chunks.map((chunk) => {
    parameters.push(BigInt.asIntN(64, BigInt(`0b${chunk.padEnd(64, "0")}`)).toString(), chunk.length);
    const value = offset + parameters.length - 1;
    return `pg_catalog.substring(($${value}::pg_catalog.int8)::pg_catalog.bit(64),1,$${value + 1}::integer)`;
  });
  const empty = "pg_catalog.substring((0::pg_catalog.int8)::pg_catalog.bit(64),1,0)";
  return {
    expression: `(${pieces.length ? pieces.join(" operator(pg_catalog.||) ") : empty})::${bitType(kind)}`,
    parameters,
  };
}

/** Test oracle for bit_send/varbit_send: int32 bit length then zero-padded big-endian bytes. */
export function readNativeBitSend(hex: string) {
  assert.match(hex, /^(?:[0-9a-f]{2})*$/);
  const bytes = Buffer.from(hex, "hex");
  assert.ok(bytes.length >= 4, "Truncated native bit length");
  const length = bytes.readInt32BE(0);
  assert.ok(length >= 0);
  assert.equal(bytes.length, 4 + Math.ceil(length / 8), "Native bit binary witness must be fully consumed");
  let bits = "";
  for (let index = 0; index < length; index++) bits += (bytes[4 + (index >> 3)]! >> (7 - (index & 7))) & 1;
  const padding = length % 8 === 0 ? 0 : bytes.at(-1)! & ((1 << (8 - (length % 8))) - 1);
  assert.equal(padding, 0, "Native bit padding must be zero");
  return { length, bits, byteLength: bytes.length };
}

export async function withNativeBit(operation: (client: pg.Client, url: string) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const profile = v.parse(
        v.array(v.strictObject({ version: v.string() })),
        (await client.query("select current_setting('server_version_num') version")).rows,
      );
      assert.equal(profile.length, 1);
      assert.equal(Math.floor(Number(profile[0]!.version) / 10000), 18);
      await client.query(`create schema ${quoteIdentifier(bitSchema)}`);
      const parsers = [1560, 1561, 1562, 1563].map((oid) => ({ oid, parser: pg.types.getTypeParser(oid) }));
      try {
        await operation(client, url);
      } finally {
        for (const { oid, parser } of parsers) assert.equal(pg.types.getTypeParser(oid), parser);
      }
    } finally {
      await client.end();
    }
  });
}

const observation = v.strictObject({
  native: v.nullable(v.string()),
  text: v.nullable(v.string()),
  type: v.string(),
  length: v.nullable(v.number()),
  octets: v.nullable(v.number()),
  digits: v.nullable(v.array(v.number())),
  hex: v.nullable(v.string()),
});
/** Observe text output beside bit_length, get_bit and the binary send witness. */
export async function observeNativeBit(
  client: pg.Client,
  kind: NativeBitKind,
  expression: string,
  parameters: readonly unknown[] = [],
) {
  const rows = v.parse(
    v.array(observation),
    (
      await client.query(
        `with input as (select ${expression} value) select value native,value::text text,pg_catalog.format_type(pg_catalog.pg_typeof(value),NULL) type,pg_catalog.bit_length(value) length,pg_catalog.octet_length(value) octets,case when value is null then null else ARRAY(select pg_catalog.get_bit(value,i) from pg_catalog.generate_series(0,pg_catalog.bit_length(value)-1) i order by i) end digits,pg_catalog.encode(pg_catalog.${kind}_send(value),'hex') hex from input`,
        [...parameters],
      )
    ).rows,
  );
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.type, kind === "bit" ? "bit" : "bit varying");
  assert.equal(row.native, row.text, "Unregistered native bit agrees with its text projection");
  if (row.text === null) {
    assert.equal(row.hex, null);
    assert.equal(row.length, null);
    return { text: null, binary: null };
  }
  const binary = readNativeBitSend(row.hex!);
  assert.equal(row.length, binary.length);
  assert.equal(row.octets, Math.ceil(binary.length / 8));
  assert.equal(row.digits!.join(""), binary.bits);
  return { text: row.text, binary };
}

export async function observeNativeBitArray(
  client: pg.Client,
  kind: NativeBitKind,
  expression: string,
  parameters: readonly unknown[],
  dimensions: readonly NativeBitDimension[] | null,
  expectedLeaves: readonly (string | null)[],
) {
  const rows = v.parse(
    v.array(
      v.strictObject({
        native: v.nullable(v.string()),
        text: v.nullable(v.string()),
        rank: v.nullable(v.number()),
        bounds: v.nullable(v.string()),
        cardinality: v.nullable(v.number()),
      }),
    ),
    (
      await client.query(
        `with input as (select ${expression} value) select value native,value::text text,pg_catalog.array_ndims(value) rank,pg_catalog.array_dims(value) bounds,pg_catalog.cardinality(value) cardinality from input`,
        [...parameters],
      )
    ).rows,
  );
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.native, row.text, "Unregistered native bit array agrees with its text projection");
  if (dimensions === null)
    assert.deepEqual(row, { native: null, text: null, rank: null, bounds: null, cardinality: null });
  else if (dimensions.length === 0)
    assert.deepEqual(row, { native: "{}", text: "{}", rank: null, bounds: null, cardinality: 0 });
  else {
    assert.equal(row.rank, dimensions.length);
    assert.equal(
      row.cardinality,
      dimensions.reduce((count, dimension) => count * dimension.length, 1),
    );
    assert.equal(
      row.bounds,
      dimensions.map(({ lowerBound, length }) => `[${lowerBound}:${lowerBound + length - 1}]`).join(""),
    );
  }
  const leaves = v.parse(
    v.array(v.strictObject({ ordinal: v.number(), hex: v.nullable(v.string()) })),
    (
      await client.query(
        `with input as (select ${expression} value) select ordinal::integer ordinal,pg_catalog.encode(pg_catalog.${kind}_send(leaf),'hex') hex from input cross join lateral pg_catalog.unnest(value) with ordinality element(leaf,ordinal) order by ordinal`,
        [...parameters],
      )
    ).rows,
  );
  assert.deepEqual(
    leaves.map((leaf) => (leaf.hex === null ? null : readNativeBitSend(leaf.hex).bits)),
    expectedLeaves,
  );
  return { text: row.text, leaves };
}
