import { test } from "bun:test";
import assert from "node:assert/strict";
import { defineRelations, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context } from "effect";
import * as v from "valibot";
import {
  bitFunction,
  bitSchema,
  bitType,
  nativeBitConstructor,
  observeNativeBit,
  observeNativeBitArray,
  withNativeBit,
  type NativeBitKind,
} from "../fixtures/bit-codec";
import {
  createBitArrayCodec,
  createBitCodec,
  createVarbitArrayCodec,
  createVarbitCodec,
  type BitStringValue,
} from "../../../apps/loom/src/core/extensions/bit-codec";
import {
  nullableCodec,
  textCodec,
  type ArrayValues,
  type ExtensionCodec,
} from "../../../apps/loom/src/core/extensions/codecs";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";

const kinds: readonly NativeBitKind[] = ["bit", "varbit"];
// Leading, trailing, byte-boundary and multi-chunk zeros; constructors never use bit_in text.
const corpus = [
  "",
  "0",
  "1",
  "00000000",
  "10000000",
  "00000001",
  "000000000",
  "1".repeat(64),
  `1${"0".repeat(70)}1`,
  `${"0".repeat(65)}1`,
  "0101".repeat(33),
];

test("bit.codecNativeCharacterization.constructorsLengthGetBitAndBinaryAgree", async () => {
  await withNativeBit(async (client) => {
    for (const kind of kinds) {
      for (const bits of corpus) {
        const constructor = nativeBitConstructor(kind, bits);
        const native = await observeNativeBit(client, kind, constructor.expression, constructor.parameters);
        assert.equal(native.text, bits, `${kind}:${bits}`);
        assert.equal(native.binary!.bits, bits);
        assert.equal(native.binary!.length, bits.length);
      }
      assert.deepEqual(await observeNativeBit(client, kind, `NULL::${bitType(kind)}`), { text: null, binary: null });
    }
  });
});

test("bit.codecNativeCharacterization.qualifiedTypesKeepLengthWhileKeywordBitMeansBitOne", async () => {
  await withNativeBit(async (client) => {
    for (const kind of kinds) {
      for (const bits of ["", "101", "0010"])
        assert.equal((await observeNativeBit(client, kind, `$1::${bitType(kind)}`, [bits])).text, bits);
    }
    // SQL keyword bit is bit(1); an explicit cast silently truncates, so codecs use pg_catalog."bit".
    const keyword = await client.query("select $1::bit::text value,pg_catalog.pg_typeof($1::bit)::text type", ["101"]);
    assert.deepEqual(keyword.rows, [{ value: "1", type: "bit" }]);
    await client.query("create table keyword_bit(value bit)");
    await assert.rejects(client.query(`insert into keyword_bit values ($1::${bitType("bit")})`, ["101"]), {
      code: "22026",
    });
  });
});

test("bit.codecNativeCharacterization.inputSyntaxIsWiderThanNativeOutput", async () => {
  await withNativeBit(async (client) => {
    for (const kind of kinds) {
      for (const [input, output] of [
        ["B0101", "0101"],
        ["b", ""],
        ["X0F", "00001111"],
        ["xa", "1010"],
        ["X", ""],
      ])
        assert.equal((await observeNativeBit(client, kind, `$1::${bitType(kind)}`, [input])).text, output, input);
      for (const input of ["012", " 01", "01 ", "B2", "XG", "0x1", "１"])
        await assert.rejects(client.query(`select $1::${bitType(kind)}`, [input]), { code: "22P02" }, input);
      await assert.rejects(client.query(`select $1::${bitType(kind)}`, ["0\0"]), { code: "22021" });
    }
  });
});

test("bit.codecNativeCharacterization.typmodExplicitCastsPadOrTruncateAndAssignmentRefuses", async () => {
  await withNativeBit(async (client) => {
    const cast = async (expression: string, input: string) =>
      (await client.query(`select (${expression})::text value`, [input])).rows[0]?.value;
    // Literal and bound input reach bit_in with typmod -1; explicit length coercion then applies.
    assert.equal(await cast(`$1::${bitType("bit")}(5)`, "101"), "10100");
    assert.equal(await cast(`$1::${bitType("bit")}(3)`, "1010101"), "101");
    assert.equal(await cast(`($1::${bitType("bit")})::${bitType("bit")}(5)`, "011"), "01100");
    assert.equal(await cast(`$1::${bitType("varbit")}(3)`, "00101"), "001");
    assert.equal(await cast(`$1::${bitType("varbit")}(5)`, "01"), "01");
    assert.equal((await client.query("select (B'10'::bit(3))::text value")).rows[0]?.value, "100");
    await client.query(`create table typmod_bits(fixed ${bitType("bit")}(5), bounded ${bitType("varbit")}(2))`);
    await assert.rejects(client.query(`insert into typmod_bits(fixed) values ($1::${bitType("bit")})`, ["101"]), {
      code: "22026",
    });
    await assert.rejects(client.query(`insert into typmod_bits(bounded) values ($1::${bitType("varbit")})`, ["101"]), {
      code: "22001",
    });
    await client.query(`insert into typmod_bits values ($1::${bitType("bit")},$2::${bitType("varbit")})`, [
      "00100",
      "",
    ]);
    assert.deepEqual((await client.query("select fixed::text,bounded::text from typmod_bits")).rows, [
      { fixed: "00100", bounded: "" },
    ]);
    for (const typmod of ["0", "83886081"])
      await assert.rejects(client.query(`select ''::${bitType("varbit")}(${typmod})`), { code: "22023" });
    assert.equal(await cast(`$1::${bitType("varbit")}(83886080)`, "1"), "1");
  });
});

test("bit.codecNativeCharacterization.arraysRanksBoundsEmptyLeavesAndNulls", async () => {
  await withNativeBit(async (client) => {
    for (const kind of kinds) {
      const type = bitType(kind);
      for (let rank = 1; rank <= 6; rank++) {
        const lengths = Array.from({ length: rank }, (_, index) => (index === rank - 1 ? 2 : 1));
        const lowers = Array.from({ length: rank }, (_, index) => index - 3);
        const native = await observeNativeBitArray(
          client,
          kind,
          `pg_catalog.array_fill($1::${type},$2::integer[],$3::integer[])`,
          ["0010", lengths, lowers],
          lengths.map((length, index) => ({ lowerBound: lowers[index]!, length })),
          ["0010", "0010"],
        );
        assert.match(native.text!, /^\[-3:/);
      }
      const mixed = await observeNativeBitArray(
        client,
        kind,
        `ARRAY[$1::${type},NULL::${type},$2::${type}]`,
        ["", "01"],
        [{ lowerBound: 1, length: 3 }],
        ["", null, "01"],
      );
      assert.equal(mixed.text, '{"",NULL,01}');
      await observeNativeBitArray(client, kind, `ARRAY[]::${type}[]`, [], [], []);
      await observeNativeBitArray(client, kind, `NULL::${type}[]`, [], null, []);
    }
  });
});

test("bit.codecNativeTransport.scalarBindingAndIndependentNativeDecoding", async () => {
  await withNativeBit(async (client) => {
    for (const kind of kinds) {
      const codec = kind === "bit" ? createBitCodec() : createVarbitCodec();
      for (const bits of corpus) {
        const constructor = nativeBitConstructor(kind, bits);
        const independent = await observeNativeBit(client, kind, constructor.expression, constructor.parameters);
        const decoded = codec.decode(independent.text);
        assert.deepEqual(decoded, { bits });
        const bound = await observeNativeBit(client, kind, `$1::${bitType(kind)}`, [codec.encode({ bits })]);
        assert.deepEqual(bound.binary, independent.binary);
        const reencoded = await observeNativeBit(client, kind, `$1::${bitType(kind)}`, [codec.encode(decoded)]);
        assert.deepEqual(reencoded.binary, independent.binary);
      }
      assert.equal(
        nullableCodec(codec).decode((await observeNativeBit(client, kind, `NULL::${bitType(kind)}`)).text),
        null,
      );
    }
    // Runtime lengths are checked rather than delegated to padding or truncating casts.
    const padded = await observeNativeBit(client, "bit", `$1::${bitType("bit")}(5)`, ["101"]);
    assert.equal(padded.text, "10100");
    assert.throws(() => createBitCodec(5).encode({ bits: "101" }));
    assert.deepEqual(createBitCodec(5).decode(padded.text), { bits: "10100" });
    assert.throws(() => createBitCodec(3).decode(padded.text));
    const truncated = await observeNativeBit(client, "varbit", `$1::${bitType("varbit")}(2)`, ["101"]);
    assert.equal(truncated.text, "10");
    assert.throws(() => createVarbitCodec(2).encode({ bits: "101" }));
    assert.deepEqual(createVarbitCodec(2).decode(truncated.text), { bits: "10" });
  });
});

test("bit.codecNativeTransport.fullArraysNativeBoundsAndEmptyLeaves", async () => {
  await withNativeBit(async (client) => {
    for (const kind of kinds) {
      const array = kind === "bit" ? createBitArrayCodec() : createVarbitArrayCodec();
      const type = bitType(kind);
      const leaf: BitStringValue = { bits: "000101" };
      for (let rank = 1; rank <= 6; rank++) {
        const dimensions = Array.from({ length: rank }, (_, index) => ({
          lowerBound: index - 3,
          length: index === rank - 1 ? 2 : 1,
        }));
        let values: ArrayValues<BitStringValue> = [leaf, { bits: "" }];
        for (let depth = 1; depth < rank; depth++) values = [values];
        const input = { dimensions, values };
        const bound = await observeNativeBitArray(client, kind, `$1::${type}[]`, [array.encode(input)], dimensions, [
          leaf.bits,
          "",
        ]);
        assert.deepEqual(array.decode(bound.text), input);
      }
      const mixed = {
        dimensions: [
          { lowerBound: -2, length: 2 },
          { lowerBound: 3, length: 2 },
        ],
        values: [
          [leaf, null],
          [{ bits: "" }, { bits: "1" }],
        ],
      };
      const native = await observeNativeBitArray(
        client,
        kind,
        `$1::${type}[]`,
        [array.encode(mixed)],
        mixed.dimensions,
        [leaf.bits, null, "", "1"],
      );
      assert.deepEqual(array.decode(native.text), mixed);
      const empty = await observeNativeBitArray(
        client,
        kind,
        `$1::${type}[]`,
        [array.encode({ dimensions: [], values: [] })],
        [],
        [],
      );
      assert.deepEqual(array.decode(empty.text), { dimensions: [], values: [] });
      assert.equal(
        nullableCodec(array).decode((await observeNativeBitArray(client, kind, `NULL::${type}[]`, [], null, [])).text),
        null,
      );
      for (const lowerBound of [-2147483648, 0, 2147483646]) {
        const input = { dimensions: [{ lowerBound, length: 1 }], values: [leaf] };
        const bound = await observeNativeBitArray(
          client,
          kind,
          `$1::${type}[]`,
          [array.encode(input)],
          input.dimensions,
          [leaf.bits],
        );
        assert.deepEqual(array.decode(bound.text), input);
      }
    }
  });
});

test("bit.codecNativeTransport.qualifiedSqlBindingsAndCaughtInvocationDecodeRollback", async () => {
  await withNativeBit(async (client, url) => {
    for (const kind of kinds) {
      const type = bitType(kind);
      await client.query(
        `create function ${bitFunction(`${kind}_echo`)}(value ${type}) returns ${type} language sql immutable as 'select $1'`,
      );
      await client.query(
        `create function ${bitFunction(`${kind}_array_echo`)}(value ${type}[]) returns ${type}[] language sql immutable as 'select $1'`,
      );
    }
    // Text output deliberately permits malformed test data without corrupting a native bit value.
    await client.query(
      `create function ${bitFunction("driver_text")}(value text) returns text language sql immutable as 'select $1'`,
    );
    await client.query("create table writes(value text not null)");
    const echo = <Input, Output>(name: string, codec: ExtensionCodec<Input, Output>) =>
      createSqlFunction({
        schema: bitSchema,
        name,
        member: `fixture:bit.${name}`,
        arguments: [nullableCodec(codec)] as const,
        result: nullableCodec(codec),
        dependencies: [],
        authority: "query",
        observability: "tables",
      });
    const driver = <Output>(codec: ExtensionCodec<never, Output>, member: string) =>
      createSqlFunction({
        schema: bitSchema,
        name: "driver_text",
        member: `fixture:bit.${member}`,
        arguments: [textCodec] as const,
        result: codec,
        dependencies: [],
        authority: "query",
        observability: "tables",
      });
    const bitEcho = echo("bit_echo", createBitCodec());
    const varbitEcho = echo("varbit_echo", createVarbitCodec());
    const bitArrayEcho = echo("bit_array_echo", createBitArrayCodec());
    const driverScalar = driver(createBitCodec(), "driver_scalar");
    const driverArray = driver(createBitArrayCodec(), "driver_array");
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      const inputArray = {
        dimensions: [{ lowerBound: -2, length: 3 }],
        values: [{ bits: "0010" }, null, { bits: "" }],
      };
      const selected = await connection.transaction((db) =>
        db
          .select({
            bit: bitEcho({ bits: "00100" }),
            empty: varbitEcho({ bits: "" }),
            missing: bitEcho(null),
            array: bitArrayEcho(inputArray),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      assert.deepEqual(selected, [{ bit: { bits: "00100" }, empty: { bits: "" }, missing: null, array: inputArray }]);
      const contextFor = () => {
        const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
        return {
          ...invocation,
          operation: "mutation" as const,
          "effect/context": Context.make(Invocation, invocation),
        };
      };
      const malformed = {
        prefix: () => driverScalar("B0101"),
        hex: () => driverScalar("X0F"),
        digit: () => driverScalar("012"),
        space: () => driverScalar("01 "),
        array: () => driverArray("{X0}"),
        bounds: () => driverArray("[2147483647:2147483647]={NULL}"),
      };
      let caught = 0;
      const route = bindRpcDatabaseProcedure(
        createProjectProcedures(schema)
          .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
          .input(v.picklist(["prefix", "hex", "digit", "space", "array", "bounds", "valid"]))
          .handler(async ({ context, input }) => {
            await context.db.execute(sql`insert into writes values (${input})`);
            if (input === "valid") {
              await context.db.select({ value: bitEcho({ bits: "1" }) }).from(sql`(values (1)) fixture(id)`);
            } else {
              try {
                await context.db.select({ value: malformed[input]() }).from(sql`(values (1)) fixture(id)`);
              } catch {
                caught++;
              }
              // Decoder failure leaves PostgreSQL usable; Loom still must roll back the invocation.
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
      for (const mode of ["prefix", "hex", "digit", "space", "array", "bounds"] as const)
        await assert.rejects(call(route, mode, { context: contextFor() }));
      assert.equal(caught, Object.keys(malformed).length);
      assert.deepEqual((await client.query("select value from writes")).rows, []);
      assert.equal(await call(route, "valid", { context: contextFor() }), "done");
      assert.deepEqual((await client.query("select value from writes")).rows, [{ value: "valid" }]);
    } finally {
      await connection.close();
    }
  });
});
