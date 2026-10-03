import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { withExtensionDatabase } from "./extension-database";

export type NativeVectorKind = "vector" | "halfvec" | "sparsevec";
export interface NativeVectorDimension {
  readonly lowerBound: number;
  readonly length: number;
}
export interface NativeDenseBinary {
  readonly kind: "vector" | "halfvec";
  readonly dimensions: number;
  readonly unused: number;
  readonly values: readonly number[];
  /** binary16 bit patterns for halfvec, float4 bit patterns for vector. */
  readonly bits: readonly number[];
}
export interface NativeSparseBinary {
  readonly kind: "sparsevec";
  readonly dimensions: number;
  readonly unused: number;
  /** 1-based indices, converted from the 0-based wire indices below. */
  readonly entries: readonly { readonly index: number; readonly value: number }[];
  readonly zeroBasedIndices: readonly number[];
  readonly bits: readonly number[];
}
export type NativeVectorBinary = NativeDenseBinary | NativeSparseBinary;

export const vectorSchema = 'Vector_"Codec_日本';
export const vectorVersion = "0.8.6";
// Fixed fixture identifiers use native quoted-identifier escaping, including quotes and Unicode.
const quoteIdentifier = pg.escapeIdentifier;
export const vectorType = (kind: NativeVectorKind, dimensions?: number) =>
  `${quoteIdentifier(vectorSchema)}.${kind}${dimensions === undefined ? "" : `(${dimensions})`}`;
export const vectorFunction = (name: string) => `${quoteIdentifier(vectorSchema)}.${quoteIdentifier(name)}`;

/** IEEE binary16 from its bit pattern, independent of pgvector text and the codec's rounding. */
export function binary16FromBits(bits: number): number {
  const sign = bits & 0x8000 ? -1 : 1;
  const exponent = (bits >> 10) & 0x1f;
  const fraction = bits & 0x3ff;
  if (exponent === 0x1f) return fraction ? Number.NaN : sign * Infinity;
  return sign * (exponent === 0 ? fraction * 2 ** -24 : (1 + fraction / 1024) * 2 ** (exponent - 15));
}

/** Test oracle for vector_send, halfvec_send and sparsevec_send (pgvector v0.8.6 wire formats). */
export function readNativeVectorSend(kind: NativeVectorKind, hex: string): NativeVectorBinary {
  assert.match(hex, /^(?:[0-9a-f]{2})*$/);
  const bytes = Buffer.from(hex, "hex");
  let cursor = 0;
  const take = (length: number) => {
    assert.ok(cursor + length <= bytes.length, `Truncated native ${kind} binary`);
    const start = cursor;
    cursor += length;
    return start;
  };
  if (kind === "sparsevec") {
    const dimensions = bytes.readInt32BE(take(4));
    const nonzero = bytes.readInt32BE(take(4));
    const unused = bytes.readInt32BE(take(4));
    assert.ok(nonzero >= 0 && nonzero <= 16000 && nonzero <= dimensions);
    const zeroBasedIndices = Array.from({ length: nonzero }, () => bytes.readInt32BE(take(4)));
    const bits: number[] = [];
    const values: number[] = [];
    for (let index = 0; index < nonzero; index++) {
      bits.push(bytes.readUInt32BE(cursor));
      values.push(bytes.readFloatBE(take(4)));
    }
    assert.equal(cursor, bytes.length, "Native sparsevec binary witness must be fully consumed");
    for (let index = 0; index < nonzero; index++) {
      assert.ok(zeroBasedIndices[index]! >= 0 && zeroBasedIndices[index]! < dimensions);
      if (index) assert.ok(zeroBasedIndices[index - 1]! < zeroBasedIndices[index]!);
      assert.ok(Number.isFinite(values[index]!) && values[index] !== 0);
    }
    return {
      kind,
      dimensions,
      unused,
      zeroBasedIndices,
      bits,
      entries: zeroBasedIndices.map((index, position) => ({ index: index + 1, value: values[position]! })),
    };
  }
  const dimensions = bytes.readInt16BE(take(2));
  const unused = bytes.readInt16BE(take(2));
  assert.ok(dimensions >= 1 && dimensions <= 16000);
  const bits: number[] = [];
  const values: number[] = [];
  for (let index = 0; index < dimensions; index++) {
    if (kind === "halfvec") {
      const pattern = bytes.readUInt16BE(take(2));
      bits.push(pattern);
      values.push(binary16FromBits(pattern));
    } else {
      bits.push(bytes.readUInt32BE(cursor));
      values.push(bytes.readFloatBE(take(4)));
    }
    assert.ok(Number.isFinite(values.at(-1)!));
  }
  assert.equal(cursor, bytes.length, `Native ${kind} binary witness must be fully consumed`);
  return { kind, dimensions, unused, values, bits };
}

export async function withNativeVector(operation: (client: pg.Client, url: string) => Promise<void>) {
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
      const available = await client.query(
        "select 1 from pg_available_extension_versions where name='vector' and version=$1",
        [vectorVersion],
      );
      assert.equal(available.rowCount, 1, `The PostgreSQL 18 fixture must include pgvector ${vectorVersion}`);
      await client.query(`create schema ${quoteIdentifier(vectorSchema)}`);
      await client.query(
        `create extension vector with schema ${quoteIdentifier(vectorSchema)} version '${vectorVersion}'`,
      );
      const installed = await client.query(
        "select e.extversion version,n.nspname schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='vector'",
      );
      assert.deepEqual(installed.rows, [{ version: vectorVersion, schema: vectorSchema }]);
      const identities = v.parse(
        v.array(v.strictObject({ oid: v.number() })),
        (
          await client.query(
            "select oid from pg_type where typnamespace=$1::regnamespace and typname=any($2::name[]) order by oid",
            [quoteIdentifier(vectorSchema), ["vector", "_vector", "halfvec", "_halfvec", "sparsevec", "_sparsevec"]],
          )
        ).rows,
      );
      assert.equal(identities.length, 6);
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

export async function observeNativeVector(
  client: pg.Client,
  kind: NativeVectorKind,
  expression: string,
  parameters: readonly unknown[] = [],
) {
  const rows = v.parse(
    v.array(
      v.strictObject({ native: v.nullable(v.string()), text: v.nullable(v.string()), hex: v.nullable(v.string()) }),
    ),
    (
      await client.query(
        `with input as (select ${expression} value) select value native,value::text text,pg_catalog.encode(${vectorFunction(`${kind}_send`)}(value),'hex') hex from input`,
        [...parameters],
      )
    ).rows,
  );
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.native, row.text, `Unregistered native ${kind} agrees with its text projection`);
  const binary = row.hex === null ? null : readNativeVectorSend(kind, row.hex);
  assert.equal(binary === null, row.text === null);
  if (binary) assert.equal(binary.unused, 0);
  return { text: row.text, binary };
}

export async function observeNativeVectorArray(
  client: pg.Client,
  kind: NativeVectorKind,
  expression: string,
  parameters: readonly unknown[],
  dimensions: readonly NativeVectorDimension[] | null,
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
  assert.equal(row.native, row.text, `Unregistered native ${kind} array agrees with its text projection`);
  if (dimensions === null) {
    assert.equal(row.text, null);
    assert.equal(row.cardinality, null);
  } else if (dimensions.length === 0) {
    assert.equal(row.text, "{}");
    assert.equal(row.rank, null);
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
  const leaves = v.parse(
    v.array(v.strictObject({ ordinal: v.number(), hex: v.nullable(v.string()) })),
    (
      await client.query(
        `with input as (select ${expression} value) select ordinal::integer ordinal,pg_catalog.encode(${vectorFunction(`${kind}_send`)}(leaf),'hex') hex from input cross join lateral pg_catalog.unnest(value) with ordinality element(leaf,ordinal) order by ordinal`,
        [...parameters],
      )
    ).rows,
  );
  leaves.forEach((leaf, index) => assert.equal(leaf.ordinal, index + 1));
  return {
    text: row.text,
    leaves: leaves.map((leaf) => (leaf.hex === null ? null : readNativeVectorSend(kind, leaf.hex))),
  };
}

/** Exact values carried by a binary witness, comparable with decoded codec output. */
export const nativeBinaryValue = (binary: NativeVectorBinary) =>
  binary.kind === "sparsevec" ? { dimensions: binary.dimensions, entries: binary.entries } : binary.values;
