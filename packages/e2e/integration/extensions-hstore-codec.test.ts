import { test } from "bun:test";
import assert from "node:assert/strict";
import { defineRelations, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context } from "effect";
import * as v from "valibot";
import {
  hstoreEntries,
  hstoreFunction,
  hstoreSchema,
  hstoreType,
  nativeHstoreConstructor,
  nativeHstoreParameters,
  observeNativeHstore,
  observeNativeHstoreArray,
  orderedHstoreEntries,
  withNativeHstore,
  type NativeHstoreEntry,
} from "../fixtures/hstore-codec";
import {
  createHstoreCodec,
  createHstoreArrayCodec,
  type HstoreValue,
} from "../../../apps/loom/src/core/extensions/hstore-codec";
import { nullableCodec, textCodec, type ArrayValues } from "../../../apps/loom/src/core/extensions/codecs";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";

// Native constructors, each, and send provide independent codec oracles.
const nativeHstoreCorpus: readonly { readonly name: string; readonly entries: readonly NativeHstoreEntry[] }[] = [
  { name: "empty-native-constructor", entries: [] },
  {
    name: "stored-null-empty-value-null-looking",
    entries: [
      { key: "stored", value: null },
      { key: "empty", value: "" },
      { key: "NULL", value: "NULL" },
      { key: "null", value: "null" },
      { key: "NuLl", value: "NuLl" },
    ],
  },
  { name: "empty-key", entries: [{ key: "", value: "" }] },
  {
    name: "ascii-delimiters-sql-prototypes",
    entries: [
      { key: "space key", value: " space value " },
      { key: "a,b=>{}[]", value: "{x},=>[y]" },
      { key: "apostrophe'", value: "O'Reilly" },
      { key: 'quote"key', value: 'quote"value' },
      { key: "back\\slash\\\\", value: "\\\\path\\file" },
      { key: "drop;--", value: "'); DROP TABLE evidence; -- $$ select" },
      { key: "__proto__", value: "data" },
      { key: "constructor", value: null },
      { key: "toString", value: "text" },
      { key: "0", value: "01" },
      { key: "true", value: "false" },
    ],
  },
  {
    name: "unicode-no-normalization",
    entries: [
      { key: "árbol😀", value: "日本語𐐀" },
      { key: "é", value: "composed" },
      { key: "e\u0301", value: "decomposed" },
      { key: "\u00a0", value: "NBSP\u00a0" },
      { key: "\ufeff", value: "BOM\ufeff" },
      { key: "🚀", value: "😀" },
    ],
  },
  ...[" ", "\t", "\n", "\r", "\v", "\f"].map((space, index) => ({
    name: `ascii-whitespace-${index}`,
    entries: [{ key: `left${space}right`, value: `${space}value${space}` }],
  })),
];

test("hstore.codecNativeCharacterization.scalarConstructorsEachBinaryAndNullDistinctions", async () => {
  await withNativeHstore(async (client) => {
    for (const example of nativeHstoreCorpus) {
      const native = await observeNativeHstore(
        client,
        nativeHstoreConstructor,
        nativeHstoreParameters(example.entries),
      );
      assert.deepEqual(orderedHstoreEntries(native.entries), orderedHstoreEntries(example.entries), example.name);
      assert.ok(native.binary);
      assert.equal(native.binary.consumed, native.binary.byteLength);
      for (let index = 0; index < native.binary.entries.length; index++) {
        const entry: NativeHstoreEntry = native.binary.entries[index]!;
        assert.equal(native.binary.lengths[index]!.key, Buffer.byteLength(entry.key));
        assert.equal(native.binary.lengths[index]!.value, entry.value === null ? -1 : Buffer.byteLength(entry.value));
      }
    }
    const missing = await observeNativeHstore(client, `NULL::${hstoreType}`);
    assert.equal(missing.text, null);
    assert.equal(missing.binary, null);
    assert.deepEqual(missing.entries, []);
    const probes = await client.query(
      `with input as (select ${nativeHstoreConstructor} value) select key,${hstoreFunction("exist")}(value,key) present,${hstoreFunction("defined")}(value,key) defined from input cross join pg_catalog.unnest($3::text[]) key order by key`,
      [
        ["stored", "string"],
        [null, "NULL"],
        ["absent", "stored", "string"],
      ],
    );
    assert.deepEqual(probes.rows, [
      { key: "absent", present: false, defined: false },
      { key: "stored", present: true, defined: false },
      { key: "string", present: true, defined: true },
    ]);
    const duplicate = await observeNativeHstore(client, nativeHstoreConstructor, [
      ["same", "same"],
      ["first", "last"],
    ]);
    assert.equal(duplicate.entries.length, 1);
    assert.equal(duplicate.entries[0]!.key, "same");
    assert.ok(["first", "last"].includes(duplicate.entries[0]!.value ?? ""));
  });
});

test("hstore.codecNativeCharacterization.permissiveInputNormalizationIsSeparateFromOutputGrammar", async () => {
  await withNativeHstore(async (client) => {
    const accepted: readonly { readonly text: string; readonly key: string; readonly value: string | null }[] = [
      { text: "a=>b", key: "a", value: "b" },
      { text: '""=>""', key: "", value: "" },
      ...["NULL", "null", "NuLl", "N\\ULL"].map((value) => ({ text: `a=>${value}`, key: "a", value: null })),
      { text: 'a=>"NULL"', key: "a", value: "NULL" },
      { text: "a=>b=>c", key: "a", value: "b=>c" },
      { text: "a=>b=c", key: "a", value: "b=c" },
      { text: "a=>b,", key: "a", value: "b" },
      { text: "a=>b, \t\n", key: "a", value: "b" },
      { text: "\t\n\r\v\f a \t=>\nb \r", key: "a", value: "b" },
      ...["\u00a0", "\ufeff"].flatMap((space) => [
        { text: `${space}a=>b`, key: `${space}a`, value: "b" },
        { text: `a${space}=>b`, key: `a${space}`, value: "b" },
        { text: `a=>${space}NULL`, key: "a", value: `${space}NULL` },
      ]),
      { text: '"a\\"b"=>"c\\"d"', key: 'a"b', value: 'c"d' },
      { text: '"a\\q"=>"b"', key: "aq", value: "b" },
      { text: '"a"=>"b\\q"', key: "a", value: "bq" },
      { text: '"a"=>"\\NULL"', key: "a", value: "NULL" },
    ];
    for (const example of accepted) {
      const native = await observeNativeHstore(client, `$1::${hstoreType}`, [example.text]);
      assert.deepEqual(native.entries, [{ key: example.key, value: example.value }], example.text);
    }
    assert.equal((await observeNativeHstore(client, `$1::${hstoreType}`, [""])).text, "");
    const duplicate = await observeNativeHstore(client, `$1::${hstoreType}`, ["a=>first,a=>last"]);
    assert.equal(duplicate.entries.length, 1);
    assert.equal(duplicate.entries[0]!.key, "a");
    assert.ok(["first", "last"].includes(duplicate.entries[0]!.value ?? ""));
    for (const text of [
      '"a""b"=>"c"',
      "a\\",
      "a=>b\\",
      "a>b",
      "a=b",
      '"a=>b',
      'a=>"b',
      "a=>",
      "a=>b c=>d",
      'a=>"b" trailing',
    ]) {
      await assert.rejects(client.query(`select $1::${hstoreType}`, [text]), { code: "42601" });
    }
    for (const text of ['"a\0"=>b', 'a=>"b\0"']) {
      await assert.rejects(client.query(`select $1::${hstoreType}`, [text]), { code: "22021" });
    }
  });
});

test("hstore.codecNativeCharacterization.utf8DriverReplacementNeedsLosslessCodecValidation", async () => {
  await withNativeHstore(async (client) => {
    for (const [input, expected] of [
      ["\ud800", "�"],
      ["\udc00", "�"],
      ["a\ud800b\udc00c", "a�b�c"],
      ["😀", "😀"],
    ]) {
      const text = await client.query(
        "select $1::text value,pg_catalog.encode(pg_catalog.convert_to($1::text,'UTF8'),'hex') hex",
        [input],
      );
      assert.deepEqual(text.rows, [{ value: expected, hex: Buffer.from(expected!).toString("hex") }]);
      const native = await observeNativeHstore(client, nativeHstoreConstructor, [[input], [input]]);
      assert.deepEqual(native.entries, [{ key: expected, value: expected }]);
    }
  });
});

test("hstore.codecNativeCharacterization.ranksOneToSixBoundsEmptyAndNullableLeaves", async () => {
  await withNativeHstore(async (client) => {
    const entries = nativeHstoreCorpus[3]!.entries;
    const native = await observeNativeHstore(client, nativeHstoreConstructor, nativeHstoreParameters(entries));
    for (let rank = 1; rank <= 6; rank++) {
      const lengths = Array.from({ length: rank }, (_, index) => (index === rank - 1 ? 2 : 1));
      const lowers = Array.from({ length: rank }, (_, index) => index - 3);
      await observeNativeHstoreArray(
        client,
        `pg_catalog.array_fill($1::${hstoreType},$2::integer[],$3::integer[])`,
        [native.text, lengths, lowers],
        lengths.map((length, index) => ({ lowerBound: lowers[index]!, length })),
        [entries, entries],
      );
    }
    const mixed = `ARRAY[${nativeHstoreConstructor},NULL::${hstoreType},${hstoreFunction("hstore")}('{}'::text[],'{}'::text[])]`;
    await observeNativeHstoreArray(
      client,
      mixed,
      nativeHstoreParameters(entries),
      [{ lowerBound: 1, length: 3 }],
      [entries, null, []],
    );
    await observeNativeHstoreArray(client, `ARRAY[]::${hstoreType}[]`, [], [], []);
    await observeNativeHstoreArray(client, `NULL::${hstoreType}[]`, [], null, []);
    for (const lengths of [[0], [1, 0], [0, 2]]) {
      await observeNativeHstoreArray(
        client,
        `pg_catalog.array_fill($1::${hstoreType},$2::integer[],$3::integer[])`,
        [native.text, lengths, lengths.map(() => -2)],
        [],
        [],
      );
    }
    for (const lowerBound of [-2147483648, 0, 2147483646]) {
      await observeNativeHstoreArray(
        client,
        `pg_catalog.array_fill($1::${hstoreType},ARRAY[1],$2::integer[])`,
        [native.text, [lowerBound]],
        [{ lowerBound, length: 1 }],
        [entries],
      );
    }
    const ordinaryTextArray = await client.query(
      "select '[-3:-2]={alpha,beta}'::text[] value,'[-3:-2]={alpha,beta}'::text[]::text text",
    );
    assert.deepEqual(ordinaryTextArray.rows, [{ value: ["alpha", "beta"], text: "[-3:-2]={alpha,beta}" }]);
  });
});

test("hstore.codecNativeCharacterization.nativeRankInt32AndShapeRefusals", async () => {
  await withNativeHstore(async (client) => {
    const fill = `select pg_catalog.array_fill(''::${hstoreType},$1::integer[],$2::integer[])`;
    for (const [lengths, lowers, code] of [
      ["{1,1,1,1,1,1,1}", "{1,1,1,1,1,1,1}", "54000"],
      ["{1}", "{2147483647}", "54000"],
      ["{2}", "{2147483646}", "54000"],
      ["{2147483648}", "{1}", "22003"],
      ["{1}", "{-2147483649}", "22003"],
      ["{1}", "{2147483648}", "22003"],
      ["{-1}", "{1}", "54000"],
    ])
      await assert.rejects(client.query(fill, [lengths, lowers]), { code });
    for (const text of ["[1:1][1:1]={NULL}", "[0:2]={NULL}", "{{NULL},{NULL,NULL}}"])
      await assert.rejects(client.query(`select $1::${hstoreType}[]`, [text]), { code: "22P02" });
    await assert.rejects(client.query(`select $1::${hstoreType}[]`, ["{{{{{{{NULL}}}}}}}"]), { code: "54000" });
  });
});

test("hstore.codecNativeTransport.scalarBoundParametersAndIndependentNativeDecoding", async () => {
  await withNativeHstore(async (client) => {
    const codec = createHstoreCodec(hstoreSchema);
    for (const example of nativeHstoreCorpus) {
      const input: HstoreValue = { entries: example.entries };
      const independent = await observeNativeHstore(
        client,
        nativeHstoreConstructor,
        nativeHstoreParameters(example.entries),
      );
      const decoded = codec.decode(independent.text);
      assert.deepEqual(orderedHstoreEntries(decoded.entries), orderedHstoreEntries(example.entries), example.name);
      const bound = await observeNativeHstore(client, `$1::${hstoreType}`, [codec.encode(input)]);
      assert.deepEqual(orderedHstoreEntries(bound.entries), orderedHstoreEntries(example.entries), example.name);
      assert.deepEqual(bound.binary, independent.binary);
      const reencoded = await observeNativeHstore(client, `$1::${hstoreType}`, [codec.encode(decoded)]);
      assert.deepEqual(reencoded.binary, independent.binary);
    }
    assert.equal(nullableCodec(codec).decode((await observeNativeHstore(client, `NULL::${hstoreType}`)).text), null);
    for (const input of ["\ud800", "\udc00", "a\ud800b\udc00c", "\0"]) {
      assert.throws(() => codec.encode({ entries: [{ key: input, value: "value" }] }));
      assert.throws(() => codec.encode({ entries: [{ key: "key", value: input }] }));
    }
  });
});

test("hstore.codecNativeTransport.fullArraysNativeBoundsLeavesAndEscaping", async () => {
  await withNativeHstore(async (client) => {
    const array = createHstoreArrayCodec(hstoreSchema);
    const mapping: HstoreValue = { entries: [...nativeHstoreCorpus[3]!.entries, ...nativeHstoreCorpus[4]!.entries] };
    const independentScalar = await observeNativeHstore(
      client,
      nativeHstoreConstructor,
      nativeHstoreParameters(mapping.entries),
    );
    for (let rank = 1; rank <= 6; rank++) {
      const dimensions = Array.from({ length: rank }, (_, index) => ({
        lowerBound: index - 3,
        length: index === rank - 1 ? 2 : 1,
      }));
      let values: ArrayValues<HstoreValue> = [mapping, mapping];
      for (let depth = 1; depth < rank; depth++) values = [values];
      const input = { dimensions, values };
      const native = await observeNativeHstoreArray(
        client,
        `pg_catalog.array_fill($1::${hstoreType},$2::integer[],$3::integer[])`,
        [
          independentScalar.text,
          dimensions.map((dimension) => dimension.length),
          dimensions.map((dimension) => dimension.lowerBound),
        ],
        dimensions,
        [mapping.entries, mapping.entries],
      );
      const decoded = array.decode(native.text);
      assert.deepEqual(decoded.dimensions, dimensions);
      for (const leaf of decoded.values.flat(6)) {
        const checked = v.parse(v.strictObject({ entries: hstoreEntries }), leaf);
        assert.deepEqual(orderedHstoreEntries(checked.entries), orderedHstoreEntries(mapping.entries));
      }
      const bound = await observeNativeHstoreArray(client, `$1::${hstoreType}[]`, [array.encode(input)], dimensions, [
        mapping.entries,
        mapping.entries,
      ]);
      assert.deepEqual(bound.leaves, native.leaves);
    }
    const mixed = {
      dimensions: [
        { lowerBound: -2, length: 2 },
        { lowerBound: 3, length: 2 },
      ],
      values: [
        [mapping, null],
        [
          { entries: [] },
          {
            entries: [
              { key: "stored", value: null },
              { key: "string", value: "NULL" },
            ],
          },
        ],
      ],
    };
    const native = await observeNativeHstoreArray(
      client,
      `$1::${hstoreType}[]`,
      [array.encode(mixed)],
      mixed.dimensions,
      [mapping.entries, null, [], mixed.values[1]![1]!.entries],
    );
    const decoded = array.decode(native.text);
    assert.deepEqual(decoded.dimensions, mixed.dimensions);
    const leaves = decoded.values.flat(6);
    assert.equal(leaves[1], null);
    assert.deepEqual(v.parse(v.strictObject({ entries: hstoreEntries }), leaves[2]), { entries: [] });
    assert.deepEqual(
      orderedHstoreEntries(v.parse(v.strictObject({ entries: hstoreEntries }), leaves[3]).entries),
      orderedHstoreEntries(mixed.values[1]![1]!.entries),
    );
    const empty = await observeNativeHstoreArray(client, `ARRAY[]::${hstoreType}[]`, [], [], []);
    assert.deepEqual(array.decode(empty.text), { dimensions: [], values: [] });
    const boundEmpty = await observeNativeHstoreArray(
      client,
      `$1::${hstoreType}[]`,
      [array.encode({ dimensions: [], values: [] })],
      [],
      [],
    );
    assert.equal(boundEmpty.text, empty.text);
    assert.equal(
      nullableCodec(array).decode((await observeNativeHstoreArray(client, `NULL::${hstoreType}[]`, [], null, [])).text),
      null,
    );
    for (const lowerBound of [-2147483648, 0, 2147483646]) {
      const input = { dimensions: [{ lowerBound, length: 1 }], values: [mapping] };
      const bound = await observeNativeHstoreArray(
        client,
        `$1::${hstoreType}[]`,
        [array.encode(input)],
        input.dimensions,
        [mapping.entries],
      );
      assert.deepEqual(array.decode(bound.text).dimensions, input.dimensions);
    }
  });
});

test("hstore.codecNativeTransport.qualifiedSqlBindingsAndCaughtInvocationDecodeRollback", async () => {
  await withNativeHstore(async (client, url) => {
    await client.query(
      `create function ${hstoreFunction("codec_echo")}(value ${hstoreType}) returns ${hstoreType} language sql immutable as 'select $1'`,
    );
    await client.query(
      `create function ${hstoreFunction("codec_array_echo")}(value ${hstoreType}[]) returns ${hstoreType}[] language sql immutable as 'select $1'`,
    );
    // Text output deliberately permits malformed test data without corrupting a native hstore value.
    await client.query(
      `create function ${hstoreFunction("codec_driver_text")}(value text) returns text language sql immutable as 'select $1'`,
    );
    await client.query("create table writes(value text not null)");
    const codec = createHstoreCodec(hstoreSchema);
    const array = createHstoreArrayCodec(hstoreSchema);
    const echo = createSqlFunction({
      schema: hstoreSchema,
      name: "codec_echo",
      member: "fixture:hstore.codec_echo",
      arguments: [nullableCodec(codec)] as const,
      result: nullableCodec(codec),
      dependencies: [],
      authority: "query",
      observability: "tables",
    });
    const arrayEcho = createSqlFunction({
      schema: hstoreSchema,
      name: "codec_array_echo",
      member: "fixture:hstore.codec_array_echo",
      arguments: [nullableCodec(array)] as const,
      result: nullableCodec(array),
      dependencies: [],
      authority: "query",
      observability: "tables",
    });
    const driverScalar = createSqlFunction({
      schema: hstoreSchema,
      name: "codec_driver_text",
      member: "fixture:hstore.codec_driver_scalar",
      arguments: [textCodec] as const,
      result: codec,
      dependencies: [],
      authority: "query",
      observability: "tables",
    });
    const driverArray = createSqlFunction({
      schema: hstoreSchema,
      name: "codec_driver_text",
      member: "fixture:hstore.codec_driver_array",
      arguments: [textCodec] as const,
      result: array,
      dependencies: [],
      authority: "query",
      observability: "tables",
    });
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      const mapping: HstoreValue = {
        entries: [
          { key: "stored", value: null },
          { key: "string", value: "NULL" },
        ],
      };
      const inputArray = { dimensions: [{ lowerBound: -2, length: 3 }], values: [mapping, null, { entries: [] }] };
      const selected = await connection.transaction((db) =>
        db
          .select({
            scalar: echo(mapping),
            missing: echo(null),
            array: arrayEcho(inputArray),
            missingArray: arrayEcho(null),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      assert.equal(selected[0]!.missing, null);
      assert.equal(selected[0]!.missingArray, null);
      assert.ok(selected[0]!.scalar);
      assert.deepEqual(orderedHstoreEntries(selected[0]!.scalar.entries), orderedHstoreEntries(mapping.entries));
      assert.ok(selected[0]!.array);
      assert.deepEqual(selected[0]!.array.dimensions, inputArray.dimensions);
      const contextFor = () => {
        const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
        return {
          ...invocation,
          operation: "mutation" as const,
          "effect/context": Context.make(Invocation, invocation),
        };
      };
      let caught = 0;
      const route = bindRpcDatabaseProcedure(
        createProjectProcedures(schema)
          .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
          .input(v.picklist(["scalar", "array", "bounds", "valid"]))
          .handler(async ({ context, input }) => {
            await context.db.execute(sql`insert into writes values (${input})`);
            if (input === "valid") {
              await context.db.select({ value: echo(mapping) }).from(sql`(values (1)) fixture(id)`);
            } else {
              try {
                const expression =
                  input === "scalar"
                    ? driverScalar('"key"=>"unterminated')
                    : driverArray(input === "array" ? '{"a=>b"}' : "[2147483647:2147483647]={NULL}");
                await context.db.select({ value: expression }).from(sql`(values (1)) fixture(id)`);
              } catch {
                caught++;
              }
              // Decoder failure leaves PostgreSQL usable; Kello still must roll back the invocation.
              assert.deepEqual((await context.db.execute(sql`select 1 value`)).rows, [{ value: 1 }]);
              await context.db.execute(sql`insert into writes values (${`${input}-after`})`);
            }
            return "done";
          }),
        {
          connection,
          replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
          authorize: async () => {},
        },
      );
      for (const mode of ["scalar", "array", "bounds"] as const)
        await assert.rejects(call(route, mode, { context: contextFor() }));
      assert.equal(caught, 3);
      assert.deepEqual((await client.query("select value from writes")).rows, []);
      assert.equal(await call(route, "valid", { context: contextFor() }), "done");
      assert.deepEqual((await client.query("select value from writes")).rows, [{ value: "valid" }]);
    } finally {
      await connection.close();
    }
  });
});
