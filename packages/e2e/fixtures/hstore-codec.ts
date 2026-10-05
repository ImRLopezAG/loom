import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { withExtensionDatabase } from "./extension-database";

export interface NativeHstoreEntry {
  readonly key: string;
  readonly value: string | null;
}
export interface NativeHstoreDimension {
  readonly lowerBound: number;
  readonly length: number;
}
export const hstoreSchema = 'Hstore_"Codec_日本';
// Fixed fixture identifiers use native quoted-identifier escaping, including quotes and Unicode.
const quoteIdentifier = pg.escapeIdentifier;
export const hstoreType = `${quoteIdentifier(hstoreSchema)}.hstore`;
export const hstoreFunction = (name: string) => `${quoteIdentifier(hstoreSchema)}.${quoteIdentifier(name)}`;
export const nativeHstoreConstructor = `${hstoreFunction("hstore")}($1::text[],$2::text[])`;
export const hstoreEntries = v.array(v.strictObject({ key: v.string(), value: v.nullable(v.string()) }));
export const orderedHstoreEntries = (entries: readonly NativeHstoreEntry[]) =>
  [...entries].sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0));
export const nativeHstoreParameters = (entries: readonly NativeHstoreEntry[]) => [
  entries.map((entry) => entry.key),
  entries.map((entry) => entry.value),
];

/** Test oracle for hstore_send, independent of hstore's text grammar. */
export function readNativeHstoreSend(hex: string) {
  assert.match(hex, /^(?:[0-9a-f]{2})*$/);
  const bytes = Buffer.from(hex, "hex");
  let cursor = 0;
  const int32 = () => {
    assert.ok(cursor + 4 <= bytes.length, "Truncated native hstore int32");
    const result = bytes.readInt32BE(cursor);
    cursor += 4;
    return result;
  };
  const text = (length: number) => {
    assert.ok(length >= 0 && cursor + length <= bytes.length, "Invalid native hstore text length");
    const slice = bytes.subarray(cursor, cursor + length);
    cursor += length;
    const result = slice.toString("utf8");
    assert.deepEqual(Buffer.from(result), slice, "Native hstore bytes must be lossless UTF8");
    return result;
  };
  const count = int32();
  assert.ok(count >= 0 && count <= Math.floor((bytes.length - 4) / 8));
  const entries: NativeHstoreEntry[] = [];
  const lengths: { key: number; value: number }[] = [];
  for (let index = 0; index < count; index++) {
    const keyLength = int32();
    const key = text(keyLength);
    const valueLength = int32();
    assert.ok(valueLength === -1 || valueLength >= 0);
    entries.push({ key, value: valueLength === -1 ? null : text(valueLength) });
    lengths.push({ key: keyLength, value: valueLength });
  }
  assert.equal(cursor, bytes.length, "Native hstore binary witness must be fully consumed");
  assert.equal(new Set(entries.map((entry) => entry.key)).size, count);
  return { entries, lengths, byteLength: bytes.length, consumed: cursor };
}

export async function withNativeHstore(operation: (client: pg.Client, url: string) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const profile = v.parse(
        v.array(v.strictObject({ version: v.string(), server: v.string(), client: v.string() })),
        (
          await client.query(
            "select current_setting('server_version_num') version, current_setting('server_encoding') server, current_setting('client_encoding') client",
          )
        ).rows,
      );
      assert.equal(profile.length, 1);
      assert.equal(Math.floor(Number(profile[0]!.version) / 10000), 18);
      assert.equal(profile[0]!.server, "UTF8");
      assert.equal(profile[0]!.client, "UTF8");
      await client.query(`create schema ${quoteIdentifier(hstoreSchema)}`);
      await client.query(`create extension hstore with schema ${quoteIdentifier(hstoreSchema)} version '1.8'`);
      const installed = await client.query(
        "select e.extversion version,n.nspname schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='hstore'",
      );
      assert.deepEqual(installed.rows, [{ version: "1.8", schema: hstoreSchema }]);
      const identities = v.parse(
        v.array(v.strictObject({ oid: v.number() })),
        (
          await client.query(
            "select oid from pg_type where typnamespace=$1::regnamespace and typname in ('hstore','_hstore') order by oid",
            [quoteIdentifier(hstoreSchema)],
          )
        ).rows,
      );
      assert.equal(identities.length, 2);
      const parsers = identities.map(({ oid }) => ({ oid, parser: pg.types.getTypeParser(oid) }));
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

export async function observeNativeHstore(client: pg.Client, expression: string, parameters: readonly unknown[] = []) {
  const rows = v.parse(
    v.array(
      v.strictObject({ native: v.nullable(v.string()), text: v.nullable(v.string()), hex: v.nullable(v.string()) }),
    ),
    (
      await client.query(
        `with input as (select ${expression} value) select value native,value::text text,pg_catalog.encode(${hstoreFunction("hstore_send")}(value),'hex') hex from input`,
        [...parameters],
      )
    ).rows,
  );
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.native, row.text, "Unregistered native hstore agrees with its text projection");
  const entries = v.parse(
    hstoreEntries,
    (
      await client.query(
        `with input as (select ${expression} value) select pair.key,pair.value from input cross join lateral ${hstoreFunction("each")}(value) pair`,
        [...parameters],
      )
    ).rows,
  );
  const binary = row.hex === null ? null : readNativeHstoreSend(row.hex);
  if (row.text === null) {
    assert.equal(binary, null);
    assert.deepEqual(entries, []);
  } else {
    assert.ok(binary);
    assert.deepEqual(orderedHstoreEntries(binary.entries), orderedHstoreEntries(entries));
  }
  return { text: row.text, entries, binary };
}

export async function observeNativeHstoreArray(
  client: pg.Client,
  expression: string,
  parameters: readonly unknown[],
  dimensions: readonly NativeHstoreDimension[] | null,
  expectedLeaves: readonly (readonly NativeHstoreEntry[] | null)[],
) {
  const rows = v.parse(
    v.array(
      v.strictObject({
        native: v.nullable(v.string()),
        text: v.nullable(v.string()),
        rank: v.nullable(v.number()),
        bounds: v.nullable(v.string()),
        cardinality: v.nullable(v.number()),
        lowers: v.array(v.number()),
        uppers: v.array(v.number()),
      }),
    ),
    (
      await client.query(
        `with input as (select ${expression} value) select value native,value::text text,pg_catalog.array_ndims(value) rank,pg_catalog.array_dims(value) bounds,pg_catalog.cardinality(value) cardinality,ARRAY(select pg_catalog.array_lower(value,d) from pg_catalog.generate_series(1,pg_catalog.array_ndims(value)) d) lowers,ARRAY(select pg_catalog.array_upper(value,d) from pg_catalog.generate_series(1,pg_catalog.array_ndims(value)) d) uppers from input`,
        [...parameters],
      )
    ).rows,
  );
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.native, row.text, "Unregistered native hstore array agrees with its text projection");
  if (dimensions === null) {
    assert.equal(row.text, null);
    assert.equal(row.rank, null);
    assert.equal(row.bounds, null);
    assert.equal(row.cardinality, null);
  } else if (dimensions.length === 0) {
    assert.equal(row.text, "{}");
    assert.equal(row.rank, null);
    assert.equal(row.bounds, null);
    assert.equal(row.cardinality, 0);
  } else {
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
  assert.deepEqual(row.lowers, dimensions?.map((dimension) => dimension.lowerBound) ?? []);
  assert.deepEqual(row.uppers, dimensions?.map(({ lowerBound, length }) => lowerBound + length - 1) ?? []);
  const leaves = v.parse(
    v.array(v.strictObject({ ordinal: v.number(), text: v.nullable(v.string()), hex: v.nullable(v.string()) })),
    (
      await client.query(
        `with input as (select ${expression} value) select ordinal::integer ordinal,leaf::text text,pg_catalog.encode(${hstoreFunction("hstore_send")}(leaf),'hex') hex from input cross join lateral pg_catalog.unnest(value) with ordinality element(leaf,ordinal) order by ordinal`,
        [...parameters],
      )
    ).rows,
  );
  assert.equal(leaves.length, expectedLeaves.length);
  for (let index = 0; index < leaves.length; index++) {
    const leaf = leaves[index]!;
    assert.equal(leaf.ordinal, index + 1);
    const entries = leaf.hex === null ? null : orderedHstoreEntries(readNativeHstoreSend(leaf.hex).entries);
    const expected = expectedLeaves[index]!;
    assert.deepEqual(entries, expected === null ? null : orderedHstoreEntries(expected));
    if (expected === null) assert.equal(leaf.text, null);
  }
  return { text: row.text, leaves };
}
