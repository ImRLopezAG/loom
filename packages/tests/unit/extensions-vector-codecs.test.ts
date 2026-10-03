import { expect, test } from "vite-plus/test";
import {
  createHalfvecArrayCodec,
  createHalfvecCodec,
  createSparsevecArrayCodec,
  createSparsevecCodec,
  createVectorArrayCodec,
  createVectorCodec,
  vectorLimits,
  type SparseVectorValue,
} from "../../../apps/loom/src/core/extensions/vector-codecs";
import {
  nullableCodec,
  type ArrayValues,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";

const schema = 'Vector_"Codec_日本';
const vector = createVectorCodec(schema);
const halfvec = createHalfvecCodec(schema);
const sparsevec = createSparsevecCodec(schema);
const float32Max = 3.4028234663852886e38;
const float32MinSubnormal = 2 ** -149;
const halfMinSubnormal = 2 ** -24;

test("vector.codecs.pgvectorHeaderLimits", () => {
  // VECTOR_MAX_DIM, HALFVEC_MAX_DIM, SPARSEVEC_MAX_DIM and SPARSEVEC_MAX_NNZ in pgvector v0.8.6.
  expect(vectorLimits).toEqual({
    vectorDimensions: 16000,
    halfvecDimensions: 16000,
    sparsevecDimensions: 1_000_000_000,
    sparsevecNonzero: 16000,
  });
  expect(Object.isFrozen(vectorLimits)).toBe(true);
  for (const create of [createVectorCodec, createHalfvecCodec, createVectorArrayCodec, createHalfvecArrayCodec]) {
    expect(create(schema, 1).id).toContain(":dimensions:1");
    expect(create(schema, 16000).id).toContain(":dimensions:16000");
    for (const invalid of [0, 16001, 1.5, -1, Number.NaN]) expect(() => create(schema, invalid)).toThrow();
  }
  for (const create of [createSparsevecCodec, createSparsevecArrayCodec]) {
    expect(create(schema, 1_000_000_000).id).toContain(":dimensions:1000000000");
    for (const invalid of [0, 1_000_000_001, 2.5]) expect(() => create(schema, invalid)).toThrow();
  }
});

test("vector.codecs.sqlTypesTransportAndIdentity", () => {
  expect(vector.sqlType).toEqual({ schema, name: "vector" });
  expect(halfvec.sqlType).toEqual({ schema, name: "halfvec" });
  expect(sparsevec.sqlType).toEqual({ schema, name: "sparsevec" });
  expect(createVectorArrayCodec(schema).sqlType).toEqual({ schema, name: "vector", array: true });
  expect(createHalfvecArrayCodec(schema).sqlType).toEqual({ schema, name: "halfvec", array: true });
  expect(createSparsevecArrayCodec(schema).sqlType).toEqual({ schema, name: "sparsevec", array: true });
  for (const codec of [vector, halfvec, sparsevec]) expect(codec.transport).toBe("text");
  expect(new Set([vector.id, halfvec.id, sparsevec.id]).size).toBe(3);
  expect(createVectorCodec(schema, 3).id).not.toBe(vector.id);
});

test("vector.codecs.denseFloat4EncodingRoundsOnceAndPreservesNegativeZero", () => {
  expect(vector.encode([1, -0, 0, 0.5, -2])).toBe("[1,-0,0,0.5,-2]");
  // A JavaScript number rounds once to float4; the exact float4 decimal makes strtof exact.
  expect(vector.encode([0.1])).toBe(`[${Math.fround(0.1)}]`);
  expect(vector.encode([float32Max, float32MinSubnormal])).toBe(`[${float32Max},${float32MinSubnormal}]`);
  expect(vector.encode([3.4028235e38])).toBe(`[${float32Max}]`);
  expect(vector.encode(Array.from({ length: 16000 }, () => 1))).toHaveLength(2 + 16000 * 2 - 1);
  for (const invalid of [
    [],
    Array.from({ length: 16001 }, () => 1),
    [Number.NaN],
    [Infinity],
    [-Infinity],
    [3.5e38],
    [-3.5e38],
    [1e-50],
    [2 ** -151],
    ["1"],
    [1n],
    [null],
    // oxlint-disable-next-line no-sparse-arrays -- A sparse JavaScript array has no defined dimension.
    [1, , 2],
    { 0: 1, length: 1 },
    "[1]",
    null,
  ]) {
    // @ts-expect-error Exercise invalid runtime inputs through the typed public encoder.
    expect(() => vector.encode(invalid)).toThrow();
  }
  const fixed = createVectorCodec(schema, 3);
  expect(fixed.encode([1, 2, 3])).toBe("[1,2,3]");
  expect(() => fixed.encode([1, 2])).toThrow();
  expect(() => fixed.encode([1, 2, 3, 4])).toThrow();
  expect(nullableCodec(vector).encode(null)).toBeNull();
  expect(nullableCodec(vector).decode(null)).toBeNull();
});

test("vector.codecs.denseNativeShortestOutputDecodesExactFloat4", () => {
  expect(vector.decode("[1,-0,0,0.1,3.4028235e+38,1e-45,-1.5e-07,1e+06,0.0001]")).toEqual([
    1,
    -0,
    0,
    Math.fround(0.1),
    float32Max,
    float32MinSubnormal,
    Math.fround(-1.5e-7),
    1e6,
    Math.fround(0.0001),
  ]);
  expect(Object.is(vector.decode("[-0]")[0], -0)).toBe(true);
  for (const value of [0.1, 1 / 3, Math.PI, -1e-40, 123456.789, float32Max])
    expect(vector.encode([value])).toBe(`[${Math.fround(value)}]`);
  // Bound parameters use JavaScript decimals; results use only vector_out's e±DD grammar.
  expect(() => vector.decode(`[${halfMinSubnormal}]`)).toThrow();
  expect(vector.decode(`[${Array.from({ length: 16000 }, () => "1").join(",")}]`)).toHaveLength(16000);
  expect(() => vector.decode(`[${Array.from({ length: 16001 }, () => "1").join(",")}]`)).toThrow();
  expect(createVectorCodec(schema, 2).decode("[1,2]")).toEqual([1, 2]);
  expect(() => createVectorCodec(schema, 2).decode("[1,2,3]")).toThrow();
});

test("vector.codecs.decimalAtFloat4MidpointUsesExactDecimalRounding", () => {
  // 1 + 2^-24 is the float4 midpoint between 1 and 1 + 2^-23; nearby decimals are the same double.
  const midpoint = "1.000000059604644775390625";
  expect(Number(`${midpoint}0000001`)).toBe(Number(midpoint));
  expect(Math.fround(Number(`${midpoint}0000001`))).toBe(1);
  expect(vector.decode(`[${midpoint}0000001]`)).toEqual([1 + 2 ** -23]);
  expect(vector.decode(`[${midpoint}]`)).toEqual([1]);
  expect(vector.decode("[1.0000000596046447753906249999]")).toEqual([1]);
  expect(vector.decode(`[-${midpoint}0000001]`)).toEqual([-(1 + 2 ** -23)]);
});

test("vector.codecs.denseDecodeAcceptsOnlyNativeOutputGrammar", () => {
  for (const source of [
    "",
    "[]",
    "[1,]",
    "[,1]",
    " [1]",
    "[1] ",
    "[1 ,2]",
    "[ 1]",
    "1",
    "{1}",
    "[NaN]",
    "[Infinity]",
    "[-Infinity]",
    "[+1]",
    "[.5]",
    "[1.]",
    "[1e5]",
    "[1E+05]",
    "[1e+5]",
    "[0x1]",
    "[1e+39]",
    "[-1e+39]",
    "[1e-46]",
    "[1,2",
    "[[1]]",
  ])
    expect(() => vector.decode(source)).toThrow();
  for (const input of [null, 1, [1], Buffer.from("[1]"), { 0: 1 }]) expect(() => vector.decode(input)).toThrow();
});

test("vector.codecs.halfvecRoundsOnceToBinary16WithTiesToEven", () => {
  expect(halfvec.encode([1, -0, 0.5, 65504, -65504])).toBe("[1,-0,0.5,65504,-65504]");
  expect(halfvec.encode([1 / 3])).toBe("[0.333251953125]");
  expect(halfvec.encode([65519.99])).toBe("[65504]");
  expect(halfvec.encode([halfMinSubnormal])).toBe(`[${halfMinSubnormal}]`);
  expect(halfvec.encode([1.5 * 2 ** -25])).toBe(`[${halfMinSubnormal}]`);
  expect(halfvec.encode([3 * 2 ** -25])).toBe(`[${2 * halfMinSubnormal}]`);
  expect(halfvec.encode([2 ** -14 - 2 ** -26])).toBe(`[${2 ** -14}]`);
  // Ties to even: 1 + 2^-11 lies between 1 and 1 + 2^-10; 1 + 3·2^-11 lies between odd and even neighbours.
  expect(halfvec.encode([1 + 2 ** -11])).toBe("[1]");
  expect(halfvec.encode([1 + 3 * 2 ** -11])).toBe(`[${1 + 2 ** -9}]`);
  expect(halfvec.encode([-(1 + 2 ** -11)])).toBe("[-1]");
  // Native strtof then float4-to-half would round this twice; one JavaScript rounding is bound exactly.
  const doubleRounding = 1 + 2 ** -11 + 2 ** -40;
  expect(Math.fround(doubleRounding)).toBe(1 + 2 ** -11);
  expect(halfvec.encode([doubleRounding])).toBe(`[${1 + 2 ** -10}]`);
  for (const invalid of [
    [],
    Array.from({ length: 16001 }, () => 1),
    [65520],
    [-65520],
    [1e5],
    [2 ** -25],
    [-(2 ** -25)],
    [1e-10],
    [Number.NaN],
    [Infinity],
    ["1"],
  ]) {
    // @ts-expect-error Exercise invalid runtime inputs through the typed public encoder.
    expect(() => halfvec.encode(invalid)).toThrow();
  }
  expect(halfvec.encode(Array.from({ length: 16000 }, () => 0))).toHaveLength(2 + 16000 * 2 - 1);
  expect(() => createHalfvecCodec(schema, 2).encode([1])).toThrow();
});

test("vector.codecs.halfvecDecodesFloat4ShortestOfExactHalfOnly", () => {
  expect(halfvec.decode("[0.33325195,-0,65504,-65504,5.9604645e-08,6.1035156e-05,1]")).toEqual([
    0.333251953125,
    -0,
    65504,
    -65504,
    halfMinSubnormal,
    2 ** -14,
    1,
  ]);
  for (const value of [1 / 3, 0.1, -1234.5678, 65519, halfMinSubnormal, 1e-5]) {
    const encoded = String(halfvec.encode([value]));
    const exact = Number(encoded.slice(1, -1));
    expect(Math.fround(exact)).toBe(exact);
    expect(halfvec.encode([exact])).toBe(encoded);
  }
  expect(() => halfvec.decode(`[${halfMinSubnormal}]`)).toThrow();
  for (const source of ["[0.1]", "[65505]", "[65520]", "[1e-45]", "[3e-08]", "[1.0001]", "[]", "[NaN]", "[1e+05]"])
    expect(() => halfvec.decode(source)).toThrow();
});

test("vector.codecs.sparsevecCanonicalOneBasedEntries", () => {
  const value: SparseVectorValue = {
    dimensions: 5,
    entries: [
      { index: 1, value: 1 },
      { index: 3, value: -0.5 },
      { index: 5, value: 0.1 },
    ],
  };
  expect(sparsevec.encode(value)).toBe(`{1:1,3:-0.5,5:${Math.fround(0.1)}}/5`);
  expect(sparsevec.encode({ dimensions: 1, entries: [] })).toBe("{}/1");
  expect(sparsevec.encode({ dimensions: 1_000_000_000, entries: [{ index: 1_000_000_000, value: 2 }] })).toBe(
    "{1000000000:2}/1000000000",
  );
  expect(sparsevec.decode(sparsevec.encode(value))).toEqual({
    dimensions: 5,
    entries: [
      { index: 1, value: 1 },
      { index: 3, value: -0.5 },
      { index: 5, value: Math.fround(0.1) },
    ],
  });
  const full = {
    dimensions: 16000,
    entries: Array.from({ length: 16000 }, (_, index) => ({ index: index + 1, value: 1 })),
  };
  expect(sparsevec.decode(sparsevec.encode(full))).toEqual(full);
  const frozen: SparseVectorValue = Object.freeze({
    dimensions: 2,
    entries: Object.freeze([Object.freeze({ index: 2, value: 3 })]),
  });
  expect(sparsevec.decode(sparsevec.encode(frozen))).toEqual(frozen);
  const invalid = [
    null,
    "{1:1}/5",
    {},
    { dimensions: 5 },
    { entries: [] },
    { dimensions: 5, entries: [], extra: true },
    { dimensions: 0, entries: [] },
    { dimensions: 1_000_000_001, entries: [] },
    { dimensions: 1.5, entries: [] },
    { dimensions: 5, entries: [{ index: 0, value: 1 }] },
    { dimensions: 5, entries: [{ index: 6, value: 1 }] },
    { dimensions: 5, entries: [{ index: 1.5, value: 1 }] },
    { dimensions: 5, entries: [{ index: 1, value: 0 }] },
    { dimensions: 5, entries: [{ index: 1, value: -0 }] },
    { dimensions: 5, entries: [{ index: 1, value: 1e-50 }] },
    { dimensions: 5, entries: [{ index: 1, value: 3.5e38 }] },
    { dimensions: 5, entries: [{ index: 1, value: Number.NaN }] },
    { dimensions: 5, entries: [{ index: 1, value: 1, extra: true }] },
    { dimensions: 5, entries: [{ index: 1 }] },
    {
      dimensions: 5,
      entries: [
        { index: 3, value: 1 },
        { index: 1, value: 1 },
      ],
    },
    {
      dimensions: 5,
      entries: [
        { index: 2, value: 1 },
        { index: 2, value: 2 },
      ],
    },
    {
      dimensions: 16001,
      entries: Array.from({ length: 16001 }, (_, index) => ({ index: index + 1, value: 1 })),
    },
  ];
  for (const input of invalid) {
    // @ts-expect-error Exercise invalid runtime inputs through the typed public encoder.
    expect(() => sparsevec.encode(input)).toThrow();
  }
  const fixed = createSparsevecCodec(schema, 5);
  expect(fixed.encode(value)).toBe(sparsevec.encode(value));
  expect(() => fixed.encode({ dimensions: 4, entries: [] })).toThrow();
  expect(() => fixed.decode("{}/4")).toThrow();
});

test("vector.codecs.sparsevecDecodeAcceptsOnlyCanonicalNativeOutput", () => {
  expect(sparsevec.decode("{}/1000000000")).toEqual({ dimensions: 1_000_000_000, entries: [] });
  expect(sparsevec.decode("{2:1e-45,7:-3.4028235e+38}/7")).toEqual({
    dimensions: 7,
    entries: [
      { index: 2, value: float32MinSubnormal },
      { index: 7, value: -float32Max },
    ],
  });
  for (const source of [
    "",
    "{}",
    "{}/0",
    "{}/01",
    "{}/1000000001",
    "{}/-1",
    "{0:1}/5",
    "{6:1}/5",
    "{01:1}/5",
    "{-1:1}/5",
    "{1:0}/5",
    "{1:-0}/5",
    "{3:1,1:1}/5",
    "{1:1,1:2}/5",
    "{1:1,}/5",
    "{1:1} /5",
    "{1:1}/ 5",
    "{ 1:1}/5",
    "{1 :1}/5",
    "{1:1}/5 ",
    "{1:NaN}/5",
    "{1:1e+39}/5",
    "{1:1e-46}/5",
    "{1:1:1}/5",
    "{1}/5",
    "[1]",
    `{${Array.from({ length: 16001 }, (_, index) => `${index + 1}:1`).join(",")}}/16001`,
  ])
    expect(() => sparsevec.decode(source)).toThrow();
  for (const input of [null, 1, { dimensions: 1, entries: [] }]) expect(() => sparsevec.decode(input)).toThrow();
});

test("vector.codecs.arraysRanksBoundsQuotedLeavesAndTypmod", () => {
  const dense = createVectorArrayCodec(schema);
  const half = createHalfvecArrayCodec(schema);
  const sparse = createSparsevecArrayCodec(schema);
  const sparseLeaf: SparseVectorValue = { dimensions: 3, entries: [{ index: 2, value: -1 }] };
  const roundTripRanks = <Value>(
    codec: ExtensionCodec<PostgreSqlArray<Value>, PostgreSqlArray<Value>>,
    leaf: Value,
  ) => {
    expect(codec.encode({ dimensions: [], values: [] })).toBe("{}");
    expect(codec.decode("{}")).toEqual({ dimensions: [], values: [] });
    for (let rank = 1; rank <= 6; rank++) {
      let values: ArrayValues<Value> = [leaf, null];
      const dimensions = Array.from({ length: rank }, (_, index) => ({
        lowerBound: index - 3,
        length: index === rank - 1 ? 2 : 1,
      }));
      for (let depth = 1; depth < rank; depth++) values = [values];
      const input = { dimensions, values };
      expect(codec.decode(codec.encode(input))).toEqual(input);
    }
    expect(nullableCodec(codec).decode(null)).toBeNull();
  };
  roundTripRanks(dense, [1, -0.5]);
  roundTripRanks(half, [0.5, -0]);
  roundTripRanks(sparse, sparseLeaf);
  expect(dense.encode({ dimensions: [{ lowerBound: 1, length: 2 }], values: [[1, 2], null] })).toBe(
    '[1:2]={"[1,2]",NULL}',
  );
  expect(sparse.encode({ dimensions: [{ lowerBound: -1, length: 1 }], values: [sparseLeaf] })).toBe(
    '[-1:-1]={"{2:-1}/3"}',
  );
  // array_out quotes leaves containing the delimiter or braces and leaves single-element dense vectors bare.
  expect(dense.decode('{"[1,2]",NULL,[3]}')).toEqual({
    dimensions: [{ lowerBound: 1, length: 3 }],
    values: [[1, 2], null, [3]],
  });
  expect(sparse.decode('[0:1]={"{}/2","{1:1,2:2}/2"}')).toEqual({
    dimensions: [{ lowerBound: 0, length: 2 }],
    values: [
      { dimensions: 2, entries: [] },
      {
        dimensions: 2,
        entries: [
          { index: 1, value: 1 },
          { index: 2, value: 2 },
        ],
      },
    ],
  });
  const fixed = createVectorArrayCodec(schema, 2);
  expect(fixed.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [[1, 2]] })).toBe('[1:1]={"[1,2]"}');
  expect(() => fixed.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [[1]] })).toThrow();
  expect(() => fixed.decode("{[1]}")).toThrow();
  expect(() => createSparsevecArrayCodec(schema, 2).decode('{"{}/3"}')).toThrow();
});

test("vector.codecs.arraysValidateRuntimeWrapperBeforeGenericEncoding", () => {
  const dense = createVectorArrayCodec(schema);
  const leaf = [1];
  const invalid = [
    null,
    [],
    {},
    { dimensions: [], values: [], extra: true },
    { dimensions: [], values: [leaf] },
    { dimensions: [{ lowerBound: 1, length: 0 }], values: [] },
    { dimensions: [{ lowerBound: 1, length: 1, extra: true }], values: [leaf] },
    { dimensions: [{ lowerBound: 1.5, length: 1 }], values: [leaf] },
    { dimensions: [{ lowerBound: 1, length: 2 }], values: [leaf] },
    {
      dimensions: [
        { lowerBound: 1, length: 1 },
        { lowerBound: 1, length: 1 },
      ],
      values: [leaf],
    },
    { dimensions: [{ lowerBound: 1, length: 1 }], values: [[Number.NaN]] },
    { dimensions: [{ lowerBound: 1, length: 1 }], values: [[]] },
    { dimensions: [{ lowerBound: 1, length: 1 }], values: ["[1]"] },
    { dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [leaf] },
    { dimensions: [{ lowerBound: -2147483649, length: 1 }], values: [leaf] },
    { dimensions: Array.from({ length: 7 }, () => ({ lowerBound: 1, length: 1 })), values: [[[[[[[leaf]]]]]]] },
  ];
  for (const input of invalid) {
    // @ts-expect-error Exercise invalid runtime inputs through the typed public encoder.
    expect(() => dense.encode(input)).toThrow();
  }
  for (const source of [
    "{{}}",
    "[1:0]={}",
    "[2147483647:2147483647]={NULL}",
    "{{{{{{{NULL}}}}}}}",
    "{{NULL},{NULL,NULL}}",
    "[0:2]={NULL}",
    '{"[]"}',
    '{"[NaN]"}',
    '{"[1, 2]"}',
    "{NULL} trailing",
  ])
    expect(() => dense.decode(source)).toThrow();
  expect(() => createHalfvecArrayCodec(schema).decode('{"[0.1]"}')).toThrow();
  expect(() => createSparsevecArrayCodec(schema).decode('{"{1:0}/2"}')).toThrow();
  expect(() => dense.decode(["[1]"])).toThrow();
});

test("vector.codecs.halfvecRoundingMatchesExhaustiveBinary16Oracle", () => {
  // Independent IEEE binary16 decoding from bit patterns, not the codec's rounding arithmetic.
  const half = (bits: number) => {
    const exponent = (bits >> 10) & 0x1f;
    const fraction = bits & 0x3ff;
    return exponent === 0 ? fraction * 2 ** -24 : (1 + fraction / 1024) * 2 ** (exponent - 15);
  };
  const encodeOne = (value: number) => Number(String(halfvec.encode([value])).slice(1, -1));
  for (let bits = 1; bits < 0x7c00; bits++) {
    const value = half(bits);
    expect(encodeOne(value)).toBe(value);
    expect(encodeOne(-value)).toBe(-value);
    if (bits + 1 < 0x7c00) {
      const next = half(bits + 1);
      const midpoint = (value + next) / 2;
      expect(encodeOne(midpoint)).toBe(bits % 2 === 0 ? value : next);
      expect(encodeOne(midpoint - midpoint * 2 ** -40)).toBe(value);
      expect(encodeOne(midpoint + midpoint * 2 ** -40)).toBe(next);
    }
  }
  expect(encodeOne(half(1) / 2 + 2 ** -40)).toBe(half(1));
  expect(() => halfvec.encode([(half(0x7bff) + 65536) / 2])).toThrow();
  expect(encodeOne((half(0x7bff) + 65536) / 2 - 2 ** -30)).toBe(65504);
});
