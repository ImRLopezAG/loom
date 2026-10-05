import { expect, test } from "vite-plus/test";
import {
  createHstoreCodec,
  createHstoreArrayCodec,
  type HstoreValue,
} from "../../../apps/loom/src/core/extensions/hstore-codec";
import { nullableCodec, type ArrayValues } from "../../../apps/loom/src/core/extensions/codecs";

const codec = createHstoreCodec('Hstore_"Codec_日本');
const array = createHstoreArrayCodec('Hstore_"Codec_日本');
const empty: HstoreValue = { entries: [] };
const mapping: HstoreValue = {
  entries: [
    { key: "", value: "" },
    { key: 'quote"\\key', value: 'a,=>{}[]"\\b' },
    { key: "stored", value: null },
    { key: "NULL", value: "NULL" },
    { key: "__proto__", value: "data" },
    { key: "constructor", value: null },
    { key: "toString", value: "text" },
    { key: "日本語😀", value: "é e\u0301 \ufeff \u00a0" },
  ],
};

test("hstore.codec.fixedEntriesParameterTextAndSqlType", () => {
  expect(codec.sqlType).toEqual({ schema: 'Hstore_"Codec_日本', name: "hstore" });
  expect(codec.transport).toBe("text");
  expect(
    codec.encode({
      entries: [
        { key: 'a"\\b', value: 'c"\\d' },
        { key: "stored", value: null },
        { key: "string", value: "NULL" },
      ],
    }),
  ).toBe('"a\\"\\\\b"=>"c\\"\\\\d", "stored"=>NULL, "string"=>"NULL"');
  expect(codec.encode(empty)).toBe("");
  expect(codec.decode("")).toEqual(empty);
  expect(codec.decode('"stored"=>NULL, "string"=>"NULL", "empty"=>""')).toEqual({
    entries: [
      { key: "stored", value: null },
      { key: "string", value: "NULL" },
      { key: "empty", value: "" },
    ],
  });
  expect(codec.decode(' \t"key" \r=>\n "value" \f,\v"null"=>NULL ')).toEqual({
    entries: [
      { key: "key", value: "value" },
      { key: "null", value: null },
    ],
  });
  expect(codec.decode(codec.encode(mapping))).toEqual(mapping);
  expect(nullableCodec(codec).encode(null)).toBeNull();
  expect(nullableCodec(codec).decode(null)).toBeNull();
  expect(() => codec.decode(null)).toThrow();
});

test("hstore.codec.strictWrapperUniquenessAndLosslessUtf8", () => {
  const invalid = [
    null,
    undefined,
    "a=>b",
    [],
    new Map([["a", "b"]]),
    { a: "b" },
    {},
    { entries: [], extra: true },
    { entries: {} },
    { entries: [null] },
    { entries: [{ key: "a" }] },
    { entries: [{ key: 1, value: "b" }] },
    { entries: [{ key: "a", value: 1 }] },
    { entries: [{ key: "a", value: undefined }] },
    { entries: [{ key: "a", value: "b", extra: true }] },
    {
      entries: [
        { key: "same", value: "first" },
        { key: "same", value: "last" },
      ],
    },
  ];
  for (const input of invalid) {
    // @ts-expect-error Exercise invalid runtime inputs through the typed public encoder.
    expect(() => codec.encode(input)).toThrow();
  }
  for (const invalidText of ["\0", "\ud800", "\udc00", "a\ud800b\udc00c", "\ud800\ud800"]) {
    expect(() => codec.encode({ entries: [{ key: invalidText, value: "value" }] })).toThrow();
    expect(() => codec.encode({ entries: [{ key: "key", value: invalidText }] })).toThrow();
    expect(() => codec.decode(`"${invalidText}"=>"value"`)).toThrow();
    expect(() => codec.decode(`"key"=>"${invalidText}"`)).toThrow();
  }
  const unicode = { entries: [{ key: "😀𐐀\ufeff", value: "日本語\u00a0é e\u0301" }] };
  expect(codec.decode(codec.encode(unicode))).toEqual(unicode);
  const frozen: HstoreValue = Object.freeze({ entries: Object.freeze([Object.freeze({ key: "a", value: "b" })]) });
  expect(codec.decode(codec.encode(frozen))).toEqual(frozen);
});

test("hstore.codec.nativeOutputScannerRejectsMalformedAndDuplicateOutput", () => {
  expect(codec.decode('"a\\"b"=>"c\\\\d"')).toEqual({ entries: [{ key: 'a"b', value: "c\\d" }] });
  for (const source of [
    " ",
    '"a"',
    '"a"= "b"',
    '"a"=>',
    '"a"=>"b',
    '"a"=>"b\\',
    '"a"=>"b" trailing',
    '"a"=>"b",',
    '"a"=>NULLx',
    '"a"=>NULL "b"=>NULL',
    '"a""b"=>"c"',
    '"a"=>"b""c"',
    '"a"=>"x", "a"=>NULL',
    '\u00a0"a"=>"b"',
  ])
    expect(() => codec.decode(source)).toThrow();
  for (const input of [1, true, {}, [], Buffer.from('"a"=>"b"')]) expect(() => codec.decode(input)).toThrow();
});

test("hstore.codec.noncanonicalNativeInputIsNotTheNativeOutputContract", () => {
  // PostgreSQL accepts these spellings; decoding its normalized output is a different operation.
  for (const source of [
    "a=>b",
    "a=>NULL",
    '"a"=>null',
    '"a"=>NuLl',
    "a=>N\\ULL",
    "a=>b=>c",
    '"a"=>"b",',
    '"a\\q"=>"b"',
    '"a"=>"b\\q"',
    '"a"=>"\\NULL"',
  ])
    expect(() => codec.decode(source)).toThrow();
});

test("hstore.codec.arrayRanksBoundsAndTwoGrammarLayers", () => {
  expect(array.sqlType).toEqual({ schema: 'Hstore_"Codec_日本', name: "hstore", array: true });
  expect(array.encode({ dimensions: [], values: [] })).toBe("{}");
  expect(array.decode("{}")).toEqual({ dimensions: [], values: [] });
  for (let rank = 1; rank <= 6; rank++) {
    let values: ArrayValues<HstoreValue> = [mapping, null, empty];
    const dimensions = Array.from({ length: rank }, (_, index) => ({
      lowerBound: index - 3,
      length: index === rank - 1 ? 3 : 1,
    }));
    for (let depth = 1; depth < rank; depth++) values = [values];
    const input = { dimensions, values };
    expect(array.decode(array.encode(input))).toEqual(input);
  }
  for (const lowerBound of [-2147483648, 0, 2147483646]) {
    const input = { dimensions: [{ lowerBound, length: 1 }], values: [mapping] };
    expect(array.decode(array.encode(input))).toEqual(input);
  }
  expect(
    array.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [{ entries: [{ key: 'a"', value: "b\\" }] }] }),
  ).toBe('[1:1]={"\\"a\\\\\\"\\"=>\\"b\\\\\\\\\\""}');
  expect(array.decode('{"",NULL,"\\"stored\\"=>NULL","\\"string\\"=>\\"NULL\\""}')).toEqual({
    dimensions: [{ lowerBound: 1, length: 4 }],
    values: [
      empty,
      null,
      { entries: [{ key: "stored", value: null }] },
      { entries: [{ key: "string", value: "NULL" }] },
    ],
  });
  expect(nullableCodec(array).decode(null)).toBeNull();
  expect(nullableCodec(array).encode(null)).toBeNull();
});

test("hstore.codec.arrayValidatesFullRuntimeWrapperBeforeGenericEncoding", () => {
  const invalid = [
    null,
    [],
    {},
    { dimensions: [], values: [], extra: true },
    { dimensions: [], values: [empty] },
    { dimensions: [], values: [[]] },
    { dimensions: [], values: [[], []] },
    { dimensions: [{ lowerBound: 1, length: 0 }], values: [] },
    { dimensions: [{ lowerBound: 1, length: 1, extra: true }], values: [empty] },
    { dimensions: [{ lowerBound: 1.5, length: 1 }], values: [empty] },
    { dimensions: [{ lowerBound: 1, length: 1.5 }], values: [empty] },
    { dimensions: [{ lowerBound: 1, length: 2 }], values: [empty] },
    { dimensions: [{ lowerBound: 1, length: 1 }], values: [[empty]] },
    {
      dimensions: [
        { lowerBound: 1, length: 1 },
        { lowerBound: 1, length: 1 },
      ],
      values: [null],
    },
    {
      dimensions: [
        { lowerBound: 1, length: 1 },
        { lowerBound: 1, length: 1 },
      ],
      values: [empty],
    },
    {
      dimensions: [
        { lowerBound: 1, length: 2 },
        { lowerBound: 1, length: 1 },
      ],
      values: [[empty], [empty, empty]],
    },
    { dimensions: [{ lowerBound: 1, length: 1 }], values: [{ entries: [{ key: "a", value: 1 }] }] },
    { dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [empty] },
    { dimensions: [{ lowerBound: 2147483646, length: 2 }], values: [empty, empty] },
    { dimensions: [{ lowerBound: -2147483649, length: 1 }], values: [empty] },
    { dimensions: [{ lowerBound: 2147483648, length: 1 }], values: [empty] },
    { dimensions: [{ lowerBound: 1, length: 2147483648 }], values: [empty] },
    { dimensions: Array.from({ length: 7 }, () => ({ lowerBound: 1, length: 1 })), values: [[[[[[[empty]]]]]]] },
  ];
  for (const input of invalid) {
    // @ts-expect-error Exercise invalid runtime inputs through the typed public encoder.
    expect(() => array.encode(input)).toThrow();
  }
  for (const source of [
    "{{}}",
    "[1:0]={}",
    "[2147483647:2147483647]={NULL}",
    "[2147483646:2147483647]={NULL,NULL}",
    "[-2147483649:-2147483649]={NULL}",
    "{{{{{{{NULL}}}}}}}",
    "{{NULL},{NULL,NULL}}",
    "[1:1][1:1]={NULL}",
    "[0:2]={NULL}",
    "{NULL} trailing",
    '{"a=>b"}',
  ])
    expect(() => array.decode(source)).toThrow();
  expect(() => array.decode(["", null])).toThrow();
  expect(() => array.decode(null)).toThrow();
});
