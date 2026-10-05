import { expect, test } from "vite-plus/test";
import {
  bitLimits,
  createBitArrayCodec,
  createBitCodec,
  createVarbitArrayCodec,
  createVarbitCodec,
  type BitStringValue,
} from "../../../apps/loom/src/core/extensions/bit-codec";
import {
  nullableCodec,
  type ArrayValues,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";

const bit = createBitCodec();
const varbit = createVarbitCodec();

test("bit.codecs.postgresqlLimitsAndLengthFingerprint", () => {
  // MaxAttrSize * BITS_PER_BYTE and VARBITMAXLEN in PostgreSQL 18.
  expect(bitLimits).toEqual({ typmod: 10 * 1024 * 1024 * 8, bits: 2147483647 - 8 + 1 });
  expect(Object.isFrozen(bitLimits)).toBe(true);
  for (const create of [createBitCodec, createVarbitCodec, createBitArrayCodec, createVarbitArrayCodec]) {
    expect(create(1).id).toMatch(/:(?:length|maxLength):1$/);
    expect(create(83_886_080).id).toContain(":83886080");
    expect(create(3).id).not.toBe(create().id);
    for (const invalid of [0, -1, 1.5, 83_886_081, Number.NaN, Infinity]) expect(() => create(invalid)).toThrow();
  }
  expect(createBitCodec(3).id).not.toBe(createVarbitCodec(3).id);
});

test("bit.codecs.qualifiedCatalogTypesAndTextTransport", () => {
  expect(bit.sqlType).toEqual({ schema: "pg_catalog", name: "bit" });
  expect(varbit.sqlType).toEqual({ schema: "pg_catalog", name: "varbit" });
  expect(createBitArrayCodec(2).sqlType).toEqual({ schema: "pg_catalog", name: "bit", array: true });
  expect(createVarbitArrayCodec().sqlType).toEqual({ schema: "pg_catalog", name: "varbit", array: true });
  for (const codec of [bit, varbit, createBitArrayCodec(), createVarbitArrayCodec()])
    expect(codec.transport).toBe("text");
  expect(Object.isFrozen(bit)).toBe(true);
  expect(Object.isFrozen(createBitArrayCodec())).toBe(true);
});

test("bit.codecs.bitStringsPreserveZerosAndZeroLength", () => {
  for (const bits of ["", "0", "1", "000", "0010100", "10000000", "000000001", "1".repeat(64)]) {
    for (const codec of [bit, varbit]) {
      expect(codec.encode({ bits })).toBe(bits);
      expect(codec.decode(bits)).toEqual({ bits });
    }
  }
  const frozen: BitStringValue = Object.freeze({ bits: "0100" });
  expect(bit.decode(bit.encode(frozen))).toEqual(frozen);
  expect(nullableCodec(bit).encode(null)).toBeNull();
  expect(nullableCodec(varbit).decode(null)).toBeNull();
});

test("bit.codecs.lengthIsRuntimeExactForBitAndMaximumForVarbit", () => {
  const fixed = createBitCodec(3);
  expect(fixed.encode({ bits: "010" })).toBe("010");
  expect(fixed.decode("100")).toEqual({ bits: "100" });
  for (const bits of ["", "01", "0100"]) {
    expect(() => fixed.encode({ bits })).toThrow();
    expect(() => fixed.decode(bits)).toThrow();
  }
  const bounded = createVarbitCodec(3);
  for (const bits of ["", "0", "01", "010"]) {
    expect(bounded.encode({ bits })).toBe(bits);
    expect(bounded.decode(bits)).toEqual({ bits });
  }
  expect(() => bounded.encode({ bits: "0000" })).toThrow();
  expect(() => bounded.decode("0000")).toThrow();
});

test("bit.codecs.rejectsNonBinaryInputSyntaxAndWrappers", () => {
  const invalid = [
    null,
    "0101",
    {},
    { bits: 101 },
    { bits: "0101", extra: true },
    { bits: "B0101" },
    { bits: "b1" },
    { bits: "X0F" },
    { bits: "x" },
    { bits: "012" },
    { bits: " 01" },
    { bits: "01 " },
    { bits: "0\0" },
    { bits: "\0" },
    { bits: "０１" },
    { bits: "0,1" },
    { hex: "0f" },
    [0, 1],
  ];
  for (const input of invalid) {
    // @ts-expect-error Exercise invalid runtime inputs through the typed public encoders.
    expect(() => bit.encode(input)).toThrow();
    // @ts-expect-error Exercise invalid runtime inputs through the typed public encoders.
    expect(() => varbit.encode(input)).toThrow();
  }
});

test("bit.codecs.decodeAcceptsOnlyNativeOutputGrammar", () => {
  for (const source of ["B0101", "b", "X0F", "x", "0x1", " 0", "0 ", "0\n", "2", "01a", "0\0", "\0", "１", "NULL"]) {
    expect(() => bit.decode(source)).toThrow();
    expect(() => varbit.decode(source)).toThrow();
  }
  for (const input of [null, undefined, 1, true, ["0"], { bits: "0" }, Buffer.from("01"), new Uint8Array([1])]) {
    expect(() => bit.decode(input)).toThrow();
    expect(() => varbit.decode(input)).toThrow();
  }
});

test("bit.codecs.arraysRanksBoundsZeroLengthLeavesAndLength", () => {
  const roundTripRanks = (
    codec: ExtensionCodec<PostgreSqlArray<BitStringValue>, PostgreSqlArray<BitStringValue>>,
    leaf: BitStringValue,
  ) => {
    expect(codec.encode({ dimensions: [], values: [] })).toBe("{}");
    expect(codec.decode("{}")).toEqual({ dimensions: [], values: [] });
    for (let rank = 1; rank <= 6; rank++) {
      let values: ArrayValues<BitStringValue> = [leaf, null];
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
  roundTripRanks(createBitArrayCodec(), { bits: "0010" });
  roundTripRanks(createBitArrayCodec(), { bits: "" });
  roundTripRanks(createVarbitArrayCodec(4), { bits: "" });
  const array = createVarbitArrayCodec();
  expect(
    array.encode({
      dimensions: [{ lowerBound: -1, length: 3 }],
      values: [{ bits: "" }, null, { bits: "010" }],
    }),
  ).toBe('[-1:1]={"",NULL,"010"}');
  // array_out quotes the empty string and leaves binary digits bare.
  expect(array.decode('[0:2]={"",NULL,0010}')).toEqual({
    dimensions: [{ lowerBound: 0, length: 3 }],
    values: [{ bits: "" }, null, { bits: "0010" }],
  });
  expect(array.decode("{{1,0},{01,10}}")).toEqual({
    dimensions: [
      { lowerBound: 1, length: 2 },
      { lowerBound: 1, length: 2 },
    ],
    values: [
      [{ bits: "1" }, { bits: "0" }],
      [{ bits: "01" }, { bits: "10" }],
    ],
  });
  const fixed = createBitArrayCodec(2);
  expect(fixed.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [{ bits: "01" }] })).toBe('[1:1]={"01"}');
  expect(() => fixed.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [{ bits: "1" }] })).toThrow();
  expect(() => fixed.decode("{1}")).toThrow();
  expect(() => fixed.decode('{""}')).toThrow();
  expect(() => createVarbitArrayCodec(1).decode("{01}")).toThrow();
});

test("bit.codecs.arraysValidateRuntimeWrapperAndNativeShape", () => {
  const array = createBitArrayCodec();
  const leaf = { bits: "1" };
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
    { dimensions: [{ lowerBound: 1, length: 1 }], values: ["1"] },
    { dimensions: [{ lowerBound: 1, length: 1 }], values: [{ bits: "B1" }] },
    { dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [leaf] },
    { dimensions: [{ lowerBound: -2147483649, length: 1 }], values: [leaf] },
    { dimensions: Array.from({ length: 7 }, () => ({ lowerBound: 1, length: 1 })), values: [[[[[[[leaf]]]]]]] },
  ];
  for (const input of invalid) {
    // @ts-expect-error Exercise invalid runtime inputs through the typed public encoder.
    expect(() => array.encode(input)).toThrow();
  }
  for (const source of [
    "{{}}",
    "[1:0]={}",
    "[2147483647:2147483647]={NULL}",
    "{{{{{{{NULL}}}}}}}",
    "{{NULL},{NULL,NULL}}",
    "[0:2]={NULL}",
    "{B1}",
    "{X0}",
    '{"0 "}',
    "{2}",
    "{,}",
    "{NULL} trailing",
  ])
    expect(() => array.decode(source)).toThrow();
  expect(() => array.decode(["1"])).toThrow();
});
