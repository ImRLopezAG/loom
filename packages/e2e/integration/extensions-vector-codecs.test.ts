import { test } from "bun:test";
import assert from "node:assert/strict";
import { defineRelations, sql } from "drizzle-orm";
import type pg from "pg";
import {
  binary16FromBits,
  nativeBinaryValue,
  observeNativeVector,
  observeNativeVectorArray,
  vectorFunction,
  vectorSchema,
  vectorType,
  withNativeVector,
  type NativeVectorKind,
} from "../fixtures/vector-codecs";
import {
  createHalfvecArrayCodec,
  createHalfvecCodec,
  createSparsevecArrayCodec,
  createSparsevecCodec,
  createVectorArrayCodec,
  createVectorCodec,
  type DenseVectorValue,
  type SparseVectorValue,
} from "../../../apps/loom/src/core/extensions/vector-codecs";
import {
  nullableCodec,
  type ArrayValues,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";

const float32Max = 3.4028234663852886e38;
const realText = (values: readonly number[]) => values.map((value) => (Object.is(value, -0) ? "-0" : String(value)));
const ones = (count: number) => Array.from({ length: count }, () => "1").join(",");

// Exact float4 values; real[] casts use float4in and pgvector's array casts rather than vector_in.
const denseCorpus: readonly DenseVectorValue[] = [
  [1],
  [1, -0, 0, Math.fround(0.1), -Math.fround(2.5e-38), float32Max, 2 ** -149, Math.fround(-1.5e-7), 1e6, 100000],
  Array.from({ length: 16000 }, (_, index) => Math.fround(index / 7 - 1000)),
];
const halfCorpus: readonly DenseVectorValue[] = [
  [1],
  [0.333251953125, -0, 0, 65504, -65504, 2 ** -24, 2 ** -14, 1 + 2 ** -10, -1234],
  Array.from({ length: 16000 }, (_, index) => binary16FromBits(index % 0x7c00)),
];
const sparseCorpus: readonly SparseVectorValue[] = [
  { dimensions: 1, entries: [] },
  {
    dimensions: 5,
    entries: [
      { index: 1, value: 1 },
      { index: 3, value: -0.5 },
      { index: 5, value: Math.fround(0.1) },
    ],
  },
  { dimensions: 7, entries: [{ index: 7, value: -float32Max }] },
  {
    dimensions: 16000,
    entries: Array.from({ length: 16000 }, (_, index) => ({ index: index + 1, value: Math.fround(index + 0.5) })),
  },
];
const sparseDense = (value: SparseVectorValue) => {
  const dense = Array.from({ length: value.dimensions }, () => 0);
  for (const entry of value.entries) dense[entry.index - 1] = entry.value;
  return dense;
};

async function rejects(client: pg.Client, text: string, code: string, values: unknown[] = []) {
  await assert.rejects(client.query(text, values), { code }, `${text} ${JSON.stringify(values).slice(0, 80)}`);
}

test("vector.codecNativeCharacterization.headerLimitsTypmodsAndErrorCodes", async () => {
  await withNativeVector(async (client) => {
    for (const kind of ["vector", "halfvec"] as const) {
      const at16000 = await observeNativeVector(client, kind, `$1::${vectorType(kind, 16000)}`, [`[${ones(16000)}]`]);
      assert.equal(at16000.binary?.kind === "sparsevec" ? null : at16000.binary?.dimensions, 16000);
      await rejects(client, `select $1::${vectorType(kind)}`, "54000", [`[${ones(16001)}]`]);
      await rejects(client, `select $1::${vectorType(kind)}`, "22000", ["[]"]);
      await rejects(client, `select $1::${vectorType(kind, 3)}`, "22000", ["[1,2]"]);
      for (const typmod of [0, 16001]) await rejects(client, `select NULL::${vectorType(kind, typmod)}`, "22023");
    }
    const sparseMaximum = await observeNativeVector(
      client,
      "sparsevec",
      `$1::${vectorType("sparsevec", 1_000_000_000)}`,
      ["{1000000000:1}/1000000000"],
    );
    assert.deepEqual(sparseMaximum.binary && nativeBinaryValue(sparseMaximum.binary), {
      dimensions: 1_000_000_000,
      entries: [{ index: 1_000_000_000, value: 1 }],
    });
    for (const typmod of [0, 1_000_000_001])
      await rejects(client, `select NULL::${vectorType("sparsevec", typmod)}`, "22023");
    const sparse = `select $1::${vectorType("sparsevec")}`;
    await rejects(client, sparse, "54000", ["{}/1000000001"]);
    await rejects(client, sparse, "22000", ["{}/0"]);
    const nonzero = (count: number) =>
      `{${Array.from({ length: count }, (_, index) => `${index + 1}:1`).join(",")}}/${count}`;
    assert.equal(
      (await observeNativeVector(client, "sparsevec", `$1::${vectorType("sparsevec")}`, [nonzero(16000)])).binary
        ?.dimensions,
      16000,
    );
    await rejects(client, sparse, "54000", [nonzero(16001)]);
    await rejects(client, `select $1::${vectorType("sparsevec", 3)}`, "22000", ["{}/4"]);
  });
});

test("vector.codecNativeCharacterization.float4StrtofRangeAndShortestOutput", async () => {
  await withNativeVector(async (client) => {
    const observe = async (text: string) =>
      observeNativeVector(client, "vector", `$1::${vectorType("vector")}`, [text]);
    const shortest = await observe(" [ 1 , -0,0.1,3.4028235e38,1e-45,-1.5e-7,1000000,100000,0.0001,0.00001 ] ");
    assert.equal(shortest.text, "[1,-0,0.1,3.4028235e+38,1e-45,-1.5e-07,1e+06,100000,0.0001,1e-05]");
    assert.ok(shortest.binary);
    assert.deepEqual(nativeBinaryValue(shortest.binary), [
      1,
      -0,
      Math.fround(0.1),
      float32Max,
      2 ** -149,
      Math.fround(-1.5e-7),
      1e6,
      100000,
      Math.fround(0.0001),
      Math.fround(0.00001),
    ]);
    assert.deepEqual(createVectorCodec(vectorSchema).decode(shortest.text), nativeBinaryValue(shortest.binary));
    // vector_in checks only infinite strtof range errors: decimal underflow is stored as zero.
    const underflow = await observe("[1e-50,-1e-50]");
    assert.equal(underflow.text, "[0,-0]");
    assert.deepEqual(underflow.binary?.bits, [0, 0x80000000]);
    for (const text of ["[1e39]", "[-1e39]", "[3.4028236e38]"])
      await rejects(client, `select $1::${vectorType("vector")}`, "22003", [text]);
    for (const text of ["[NaN]", "[Infinity]", "[-inf]"])
      await rejects(client, `select $1::${vectorType("vector")}`, "22000", [text]);
    for (const text of ["1", "[1,]", "[1] x", "[1 2]", "[,1]"])
      await rejects(client, `select $1::${vectorType("vector")}`, "22P02", [text]);
  });
});

test("vector.codecNativeCharacterization.halfvecStrtofThenBinary16RoundsTwice", async () => {
  await withNativeVector(async (client) => {
    const observe = async (text: string) =>
      observeNativeVector(client, "halfvec", `$1::${vectorType("halfvec")}`, [text]);
    const doubleRounding = 1 + 2 ** -11 + 2 ** -40;
    const direct = await observe(`[${doubleRounding}]`);
    assert.deepEqual(direct.binary?.bits, [0x3c00], "strtof rounds to the binary16 tie, which then rounds to even");
    const bound = await observe(String(createHalfvecCodec(vectorSchema).encode([doubleRounding])));
    assert.deepEqual(bound.binary?.bits, [0x3c01], "the codec rounds the JavaScript number once");
    const midpoint = await observe("[-1234.5]");
    assert.ok(midpoint.binary);
    assert.deepEqual(nativeBinaryValue(midpoint.binary), [-1234], "binary16 midpoint rounds to even");
    const boundMidpoint = await observe(String(createHalfvecCodec(vectorSchema).encode([-1234.5])));
    assert.ok(boundMidpoint.binary);
    assert.deepEqual(nativeBinaryValue(boundMidpoint.binary), [-1234]);
    const range = await observe("[65519,-65519,1e-10,-1e-10,0.333333,5.9604645e-08]");
    assert.deepEqual(range.binary?.bits, [0x7bff, 0xfbff, 0x0000, 0x8000, 0x3555, 0x0001]);
    assert.equal(range.text, "[65504,-65504,0,-0,0.33325195,5.9604645e-08]");
    assert.ok(range.binary);
    assert.deepEqual(createHalfvecCodec(vectorSchema).decode(range.text), nativeBinaryValue(range.binary));
    for (const text of ["[65520]", "[-65520]", "[1e39]"])
      await rejects(client, `select $1::${vectorType("halfvec")}`, "22003", [text]);
    for (const text of ["[NaN]", "[Infinity]"])
      await rejects(client, `select $1::${vectorType("halfvec")}`, "22000", [text]);
  });
});

test("vector.codecNativeCharacterization.sparsevecInputNormalizesToCanonicalOutput", async () => {
  await withNativeVector(async (client) => {
    const observe = async (text: string) =>
      observeNativeVector(client, "sparsevec", `$1::${vectorType("sparsevec")}`, [text]);
    const normalized = await observe(" { 3 : 1 , 1:2,2:0, 4:-0 } / 5 ");
    assert.equal(normalized.text, "{1:2,3:1}/5");
    assert.ok(normalized.binary?.kind === "sparsevec");
    assert.deepEqual(normalized.binary.zeroBasedIndices, [0, 2]);
    assert.deepEqual(createSparsevecCodec(vectorSchema).decode(normalized.text), nativeBinaryValue(normalized.binary));
    assert.equal((await observe("{1:1e-45}/2")).text, "{1:1e-45}/2");
    await rejects(client, `select $1::${vectorType("sparsevec")}`, "22003", ["{1:1e-50}/2"]);
    for (const text of ["{1:1,1:2}/5", "{0:1}/5", "{6:1}/5", "{1:NaN}/5", "{1:Infinity}/5"])
      await rejects(client, `select $1::${vectorType("sparsevec")}`, "22000", [text]);
    for (const text of ["{1:1}", "1:1/5", "{1}/5", "{1:1}/5 x"])
      await rejects(client, `select $1::${vectorType("sparsevec")}`, "22P02", [text]);
  });
});

async function scalarTransport<Value>(
  client: pg.Client,
  kind: NativeVectorKind,
  codec: ExtensionCodec<Value, Value>,
  values: readonly Value[],
  constructor: string,
  dense: (value: Value) => readonly number[],
) {
  for (const value of values) {
    const independent = await observeNativeVector(client, kind, constructor, [realText(dense(value))]);
    assert.ok(independent.binary && independent.text);
    assert.deepEqual(nativeBinaryValue(independent.binary), value, kind);
    const bound = await observeNativeVector(client, kind, `$1::${vectorType(kind)}`, [codec.encode(value)]);
    assert.deepEqual(bound.binary, independent.binary, kind);
    const decoded = codec.decode(independent.text);
    assert.deepEqual(decoded, value, kind);
    const reencoded = await observeNativeVector(client, kind, `$1::${vectorType(kind)}`, [codec.encode(decoded)]);
    assert.deepEqual(reencoded.binary, independent.binary, kind);
  }
  const missing = await observeNativeVector(client, kind, `NULL::${vectorType(kind)}`);
  assert.equal(nullableCodec(codec).decode(missing.text), null);
}

test("vector.codecNativeTransport.scalarsMatchIndependentConstructorsAndSendOracles", async () => {
  await withNativeVector(async (client) => {
    // real[] casts reach float4in and pgvector's array casts rather than the vector text grammar.
    await scalarTransport(
      client,
      "vector",
      createVectorCodec(vectorSchema),
      denseCorpus,
      `$1::real[]::${vectorType("vector")}`,
      (value) => value,
    );
    await scalarTransport(
      client,
      "halfvec",
      createHalfvecCodec(vectorSchema),
      halfCorpus,
      `$1::real[]::${vectorType("halfvec")}`,
      (value) => value,
    );
    await scalarTransport(
      client,
      "sparsevec",
      createSparsevecCodec(vectorSchema),
      sparseCorpus,
      `$1::real[]::${vectorType("vector")}::${vectorType("sparsevec")}`,
      sparseDense,
    );
    const fixed = createVectorCodec(vectorSchema, 3);
    const typmod = await observeNativeVector(client, "vector", `$1::${vectorType("vector", 3)}`, [
      fixed.encode([1, 2, 3]),
    ]);
    assert.ok(typmod.text);
    assert.deepEqual(fixed.decode(typmod.text), [1, 2, 3]);
    const sparsevec = createSparsevecCodec(vectorSchema);
    const wide: SparseVectorValue = {
      dimensions: 1_000_000_000,
      entries: [
        { index: 1, value: 1 },
        { index: 1_000_000_000, value: -2 },
      ],
    };
    const sparse = await observeNativeVector(client, "sparsevec", `$1::${vectorType("sparsevec")}`, [
      sparsevec.encode(wide),
    ]);
    assert.ok(sparse.binary && sparse.text);
    assert.deepEqual(nativeBinaryValue(sparse.binary), wide);
    assert.deepEqual(sparsevec.decode(sparse.text), wide);
  });
});

async function arrayTransport<Value>(
  client: pg.Client,
  kind: NativeVectorKind,
  scalar: ExtensionCodec<Value, Value>,
  codec: ExtensionCodec<PostgreSqlArray<Value>, PostgreSqlArray<Value>>,
  leaf: Value,
) {
  const leafText = scalar.encode(leaf);
  for (let rank = 1; rank <= 6; rank++) {
    const dimensions = Array.from({ length: rank }, (_, index) => ({
      lowerBound: index - 3,
      length: index === rank - 1 ? 2 : 1,
    }));
    const native = await observeNativeVectorArray(
      client,
      kind,
      `pg_catalog.array_fill($1::${vectorType(kind)},$2::integer[],$3::integer[])`,
      [leafText, dimensions.map((dimension) => dimension.length), dimensions.map((dimension) => dimension.lowerBound)],
      dimensions,
    );
    assert.equal(native.leaves.length, 2);
    for (const binary of native.leaves) {
      assert.ok(binary);
      assert.deepEqual(nativeBinaryValue(binary), leaf);
    }
    assert.ok(native.text);
    let values: ArrayValues<Value> = [leaf, leaf];
    for (let depth = 1; depth < rank; depth++) values = [values];
    const decoded = codec.decode(native.text);
    assert.deepEqual(decoded, { dimensions, values });
    const bound = await observeNativeVectorArray(
      client,
      kind,
      `$1::${vectorType(kind)}[]`,
      [codec.encode(decoded)],
      dimensions,
    );
    assert.deepEqual(bound.leaves, native.leaves);
  }
  const mixed = { dimensions: [{ lowerBound: -2, length: 3 }], values: [leaf, null, leaf] };
  const native = await observeNativeVectorArray(
    client,
    kind,
    `$1::${vectorType(kind)}[]`,
    [codec.encode(mixed)],
    mixed.dimensions,
  );
  assert.equal(native.leaves[1], null);
  assert.ok(native.text);
  assert.deepEqual(codec.decode(native.text), mixed);
  const empty = await observeNativeVectorArray(client, kind, `ARRAY[]::${vectorType(kind)}[]`, [], []);
  assert.ok(empty.text);
  assert.deepEqual(codec.decode(empty.text), { dimensions: [], values: [] });
  const missing = await observeNativeVectorArray(client, kind, `NULL::${vectorType(kind)}[]`, [], null);
  assert.equal(nullableCodec(codec).decode(missing.text), null);
}

test("vector.codecNativeTransport.arraysRanksBoundsNullLeavesAndQuoting", async () => {
  await withNativeVector(async (client) => {
    const vector = createVectorCodec(vectorSchema);
    const vectorArray = createVectorArrayCodec(vectorSchema);
    await arrayTransport(client, "vector", vector, vectorArray, denseCorpus[1]!);
    // A single-element dense vector has no delimiter, so array_out leaves it unquoted.
    await arrayTransport(client, "vector", vector, vectorArray, [7]);
    await arrayTransport(
      client,
      "halfvec",
      createHalfvecCodec(vectorSchema),
      createHalfvecArrayCodec(vectorSchema),
      halfCorpus[1]!,
    );
    await arrayTransport(
      client,
      "sparsevec",
      createSparsevecCodec(vectorSchema),
      createSparsevecArrayCodec(vectorSchema),
      sparseCorpus[1]!,
    );
    const quoting = await client.query(
      `select ARRAY[$1::${vectorType("vector")},$2::${vectorType("vector")},NULL]::text value,ARRAY[$3::${vectorType("sparsevec")}]::text sparse`,
      ["[1,2]", "[3]", "{1:1}/2"],
    );
    assert.deepEqual(quoting.rows, [{ value: '{"[1,2]",[3],NULL}', sparse: '{"{1:1}/2"}' }]);
    await rejects(client, `select $1::${vectorType("vector", 2)}[]`, "22000", ['{"[1,2]","[1]"}']);
  });
});

function echoBinding<Value>(name: string, codec: ExtensionCodec<Value, Value>) {
  return createSqlFunction({
    schema: vectorSchema,
    name,
    member: `fixture:vector.${name}`,
    arguments: [nullableCodec(codec)] as const,
    result: nullableCodec(codec),
    dependencies: [],
    authority: "query",
    observability: "tables",
  });
}

test("vector.codecNativeTransport.qualifiedSqlFunctionBindingsDecodeSelectedValues", async () => {
  await withNativeVector(async (client, url) => {
    for (const kind of ["vector", "halfvec", "sparsevec"] as const) {
      await client.query(
        `create function ${vectorFunction(`codec_${kind}_echo`)}(value ${vectorType(kind)}) returns ${vectorType(kind)} language sql immutable as 'select $1'`,
      );
      await client.query(
        `create function ${vectorFunction(`codec_${kind}_array_echo`)}(value ${vectorType(kind)}[]) returns ${vectorType(kind)}[] language sql immutable as 'select $1'`,
      );
    }
    const vectorEcho = echoBinding("codec_vector_echo", createVectorCodec(vectorSchema));
    const halfvecEcho = echoBinding("codec_halfvec_echo", createHalfvecCodec(vectorSchema));
    const sparsevecEcho = echoBinding("codec_sparsevec_echo", createSparsevecCodec(vectorSchema));
    const sparsevecArrayEcho = echoBinding("codec_sparsevec_array_echo", createSparsevecArrayCodec(vectorSchema));
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      const arrayValue = { dimensions: [{ lowerBound: 0, length: 2 }], values: [sparseCorpus[1]!, null] };
      const selected = await connection.transaction((db) =>
        db
          .select({
            vector: vectorEcho(denseCorpus[1]!),
            halfvec: halfvecEcho(halfCorpus[1]!),
            sparsevec: sparsevecEcho(sparseCorpus[1]!),
            array: sparsevecArrayEcho(arrayValue),
            missing: vectorEcho(null),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      assert.deepEqual(selected, [
        {
          vector: denseCorpus[1],
          halfvec: halfCorpus[1],
          sparsevec: sparseCorpus[1],
          array: arrayValue,
          missing: null,
        },
      ]);
    } finally {
      await connection.close();
    }
  });
});
