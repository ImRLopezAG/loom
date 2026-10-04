import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { hstorePortableProofCase, hstoreProofFamily, hstoreScenario } from "../fixtures/hstore-proof-cases";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { test } from "bun:test";
import assert from "node:assert/strict";
import { sql, defineRelations } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context } from "effect";
import * as v from "valibot";
import { mapping, portableHstoreCases, withHstoreApi } from "../fixtures/hstore-api";
import {
  hstoreFunction,
  nativeHstoreParameters,
  observeNativeHstore,
  orderedHstoreEntries,
  readNativeHstoreSend,
} from "../fixtures/hstore-codec";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import { checkedExtensionExpression, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { createDatabaseMiddleware, bindRpcDatabaseProcedure } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import type { HstoreValue } from "../../../apps/loom/src/core/extensions/adapters/hstore";

const entriesSchema = v.array(v.strictObject({ key: v.string(), value: v.nullable(v.string()) }));
const dimensionsSchema = v.array(v.strictObject({ lowerBound: v.number(), length: v.number() }));
function nativeDimensions(bounds: string | null) {
  if (bounds === null) return [];
  return [...bounds.matchAll(/\[(-?\d+):(-?\d+)\]/g)].map((match) => ({
    lowerBound: Number(match[1]),
    length: Number(match[2]) - Number(match[1]) + 1,
  }));
}

// Every literal member executes, including ordinary callable support routines and distinct casts.
extensionProofTest(hstorePortableProofCase, async () => {
  await withHstoreApi(async ({ client, connection, api, url }) => {
    await observeExtensionProofDatabase(url, hstorePortableProofCase.id, "hstore");
    const cases = portableHstoreCases(api);
    assert.equal(cases.length, 63);
    assert.equal(new Set(cases.map(({ member }) => member)).size, 63);
    assert.deepEqual(
      cases.map(({ member }) => member).sort(),
      Object.keys(api.sql.overloads)
        .filter((id) => !id.includes("pg_catalog.anyelement") && !id.includes("pg_catalog.record"))
        .sort(),
    );
    assert.equal(cases.filter(({ member }) => member.startsWith("routine:")).length, 41);
    assert.equal(cases.filter(({ member }) => member.startsWith("operator:")).length, 19);
    assert.equal(cases.filter(({ member }) => member.startsWith("cast:")).length, 3);
    for (const item of cases) {
      await extensionProofWitness(
        { family: hstoreProofFamily, member: item.member, scenario: hstoreScenario(item.member), schema: api.schema },
        async () => {
          assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
          const actual = await connection.transaction((db) =>
            db.select({ value: item.expression }).from(sql`portable_native_inputs`),
          );
          if (item.kind === "each") {
            const native = v.parse(
              entriesSchema,
              (
                await client.query(
                  `select pair.* from portable_native_inputs cross join lateral ${hstoreFunction("each")}(lhs) pair`,
                )
              ).rows,
            );
            assert.deepEqual(
              orderedHstoreEntries(
                v.parse(
                  entriesSchema,
                  actual.map(({ value }) => value),
                ),
              ),
              orderedHstoreEntries(native),
              item.member,
            );
          } else if (item.kind === "textSet") {
            const native = v.parse(
              v.array(v.object({ value: v.nullable(v.string()) })),
              (await client.query(`select ${item.native} value from portable_native_inputs`)).rows,
            );
            assert.deepEqual(actual, native, item.member);
          } else {
            assert.equal(actual.length, 1, item.member);
            const value = actual[0]!.value;
            if (item.kind === "hstore") {
              const native = await observeNativeHstore(client, `(select ${item.native} from portable_native_inputs)`);
              if (native.binary === null) assert.equal(value, null, item.member);
              else {
                const decoded = v.parse(v.strictObject({ entries: entriesSchema }), value);
                assert.deepEqual(
                  orderedHstoreEntries(decoded.entries),
                  orderedHstoreEntries(native.entries),
                  item.member,
                );
                assert.deepEqual(
                  orderedHstoreEntries(decoded.entries),
                  orderedHstoreEntries(native.binary.entries),
                  item.member,
                );
              }
            } else if (item.kind === "array") {
              const native = v.parse(
                v.array(v.object({ bounds: v.nullable(v.string()), json: v.nullable(v.string()) })),
                (
                  await client.query(
                    `with input as (select ${item.native} value from portable_native_inputs) select pg_catalog.array_dims(value) bounds,pg_catalog.to_json(value)::text json from input`,
                  )
                ).rows,
              )[0]!;
              if (native.json === null) assert.equal(value, null, item.member);
              else {
                const decoded = v.parse(v.strictObject({ dimensions: dimensionsSchema, values: v.unknown() }), value);
                assert.deepEqual(decoded.dimensions, nativeDimensions(native.bounds), item.member);
                // Native JSON is only a text-array oracle; numeric JSON never passes through JS parsing.
                assert.deepEqual(decoded.values, JSON.parse(native.json), item.member);
              }
            } else if (item.kind === "json" || item.kind === "jsonb") {
              const native = v.parse(
                v.array(v.object({ text: v.nullable(v.string()) })),
                (await client.query(`select (${item.native})::text text from portable_native_inputs`)).rows,
              )[0]!;
              assert.deepEqual(
                value,
                native.text === null ? null : { type: item.kind, text: native.text },
                item.member,
              );
            } else if (item.kind === "binary") {
              const native = v.parse(
                v.array(v.object({ hex: v.nullable(v.string()) })),
                (await client.query(`select pg_catalog.encode(${item.native},'hex') hex from portable_native_inputs`))
                  .rows,
              )[0]!;
              assert.deepEqual(value, native.hex === null ? null : { hex: native.hex }, item.member);
              assert.ok(native.hex);
              assert.deepEqual(
                orderedHstoreEntries(readNativeHstoreSend(native.hex).entries),
                orderedHstoreEntries(mapping.entries),
              );
            } else if (item.kind === "bigint") {
              const native = v.parse(
                v.array(v.object({ value: v.nullable(v.string()) })),
                (await client.query(`select (${item.native})::text value from portable_native_inputs`)).rows,
              )[0]!;
              assert.equal(value, native.value === null ? null : BigInt(native.value), item.member);
            } else {
              const native = v.parse(
                v.array(v.object({ value: v.nullable(v.union([v.string(), v.number(), v.boolean()])) })),
                (await client.query(`select ${item.native} value from portable_native_inputs`)).rows,
              );
              assert.deepEqual(actual, native, item.member);
            }
          }
        },
      );
    }
    for (const seed of [-9223372036854775808n, 9223372036854775807n]) {
      const actual = await connection.transaction((db) =>
        db.select({ value: api.hashExtended(mapping, seed) }).from(sql`(values (1)) fixture(id)`),
      );
      const native = v.parse(
        v.array(v.object({ value: v.string() })),
        (
          await client.query(
            `select ${hstoreFunction("hstore_hash_extended")}(${hstoreFunction("hstore")}($1::text[],$2::text[]),$3::bigint)::text value`,
            [...nativeHstoreParameters(mapping.entries), seed.toString()],
          )
        ).rows,
      )[0]!;
      assert.equal(actual[0]!.value, BigInt(native.value));
    }
  });
});

test("hstore.nullMissingDefinedConcatenationAndNamedOutRows", async () => {
  await withHstoreApi(async ({ client, connection, api }) => {
    const selected = await connection.transaction((db) =>
      db
        .select({
          stored: api.get(mapping, "stored"),
          string: api.get(mapping, "string"),
          missing: api.get(mapping, "absent"),
          storedExists: api.hasKey(mapping, "stored"),
          storedDefined: api.isDefined(mapping, "stored"),
          missingExists: api.hasKey(mapping, "absent"),
          missingDefined: api.isDefined(mapping, "absent"),
          nullMap: api.fromPair(null, "value"),
          nullValue: api.fromPair("stored", null),
          emptyAll: api.hasAllKeys(mapping, { dimensions: [], values: [] }),
          emptyAny: api.hasAnyKey(mapping, { dimensions: [], values: [] }),
          nullConcatenation: api.concat(mapping, null),
          nullHashSeed: api.hashExtended(mapping, null),
          overwritten: api.concat(mapping, api.value([{ key: "stored", value: "right" }])),
        })
        .from(sql`(values (1)) fixture(id)`),
    );
    const row = selected[0]!;
    assert.equal(row.stored, null);
    assert.equal(row.string, "NULL");
    assert.equal(row.missing, null);
    assert.equal(row.storedExists, true);
    assert.equal(row.storedDefined, false);
    assert.equal(row.missingExists, false);
    assert.equal(row.missingDefined, false);
    assert.equal(row.nullMap, null);
    assert.deepEqual(row.nullValue?.entries, [{ key: "stored", value: null }]);
    assert.equal(row.emptyAll, true);
    assert.equal(row.emptyAny, false);
    assert.equal(row.nullConcatenation, null);
    assert.equal(row.nullHashSeed, null);
    assert.equal(row.overwritten?.entries.find(({ key }) => key === "stored")?.value, "right");
    const nullKeys: PostgreSqlArray<string> = {
      dimensions: [{ lowerBound: -4, length: 3 }],
      values: ["stored", "string", null],
    };
    const actualNulls = await connection.transaction((db) =>
      db
        .select({
          all: api.hasAllKeys(mapping, nullKeys),
          any: api.hasAnyKey(mapping, nullKeys),
          values: api.getMany(mapping, nullKeys),
        })
        .from(sql`(values (1)) fixture(id)`),
    );
    const nativeNulls = v.parse(
      v.array(v.object({ all: v.boolean(), any: v.boolean(), bounds: v.nullable(v.string()), values: v.string() })),
      (
        await client.query(
          `with input as (select ${hstoreFunction("hstore")}($1::text[],$2::text[]) value,$3::text[] keys) select ${hstoreFunction("exists_all")}(value,keys) all,${hstoreFunction("exists_any")}(value,keys) any,pg_catalog.array_dims(${hstoreFunction("slice_array")}(value,keys)) bounds,pg_catalog.to_json(${hstoreFunction("slice_array")}(value,keys))::text values from input`,
          [...nativeHstoreParameters(mapping.entries), '[-4:-2]={"stored","string",NULL}'],
        )
      ).rows,
    )[0]!;
    assert.equal(actualNulls[0]!.all, nativeNulls.all);
    assert.equal(actualNulls[0]!.any, nativeNulls.any);
    assert.deepEqual(actualNulls[0]!.values?.dimensions, nativeDimensions(nativeNulls.bounds));
    assert.deepEqual(actualNulls[0]!.values?.values, JSON.parse(nativeNulls.values));
    const pairs = api.each(mapping, 'pairs"日本');
    const keys = api.keysRows(mapping, 'keys"日本');
    const values = api.valuesRows(mapping, 'values"日本');
    const actualPairs = await connection.transaction((db) => db.select(pairs.columns).from(pairs.from));
    const actualKeys = await connection.transaction((db) => db.select(keys.columns).from(keys.from));
    const actualValues = await connection.transaction((db) => db.select(values.columns).from(values.from));
    const native = await observeNativeHstore(
      client,
      `${hstoreFunction("hstore")}($1::text[],$2::text[])`,
      nativeHstoreParameters(mapping.entries),
    );
    assert.deepEqual(orderedHstoreEntries(actualPairs), orderedHstoreEntries(native.entries));
    assert.deepEqual(actualKeys.map(({ key }) => key).sort(), native.entries.map(({ key }) => key).sort());
    assert.deepEqual(
      actualValues.map(({ value }) => value),
      native.entries.map(({ value }) => value),
    );
    assert.deepEqual(
      await connection.transaction((db) => db.select(api.each(null).columns).from(api.each(null).from)),
      [],
    );
  });
});

test("hstore.nativeConstructorErrorsArraysAndDuplicateNormalization", async () => {
  await withHstoreApi(async ({ client, connection, api }) => {
    const arrays: readonly PostgreSqlArray<string>[] = [
      { dimensions: [{ lowerBound: 8, length: 2 }], values: ["dup", "one"] },
      { dimensions: [{ lowerBound: -3, length: 4 }], values: ["dup", "one", "dup", "two"] },
      {
        dimensions: [
          { lowerBound: 4, length: 2 },
          { lowerBound: -5, length: 2 },
        ],
        values: [
          ["key", "value"],
          ["stored", null],
        ],
      },
      { dimensions: [], values: [] },
    ];
    const nativeArrays = [
      '[8:9]={"dup","one"}',
      '[-3:0]={"dup","one","dup","two"}',
      '[4:5][-5:-4]={{"key","value"},{"stored",NULL}}',
      "{}",
    ];
    for (let index = 0; index < arrays.length; index++) {
      const actual = await connection.transaction((db) =>
        db.select({ value: api.fromArray(arrays[index]!) }).from(sql`(values (1)) fixture(id)`),
      );
      const native = await observeNativeHstore(client, `${hstoreFunction("hstore")}($1::text[])`, [
        nativeArrays[index],
      ]);
      assert.ok(actual[0]!.value);
      assert.deepEqual(orderedHstoreEntries(actual[0]!.value.entries), orderedHstoreEntries(native.entries));
      assert.equal(new Set(actual[0]!.value.entries.map(({ key }) => key)).size, actual[0]!.value.entries.length);
    }
    for (const bad of [
      { dimensions: [{ lowerBound: 1, length: 1 }], values: ["odd"] },
      { dimensions: [{ lowerBound: 1, length: 2 }], values: [null, "value"] },
      {
        dimensions: [
          { lowerBound: 1, length: 1 },
          { lowerBound: 1, length: 3 },
        ],
        values: [["key", "value", "extra"]],
      },
    ])
      await assert.rejects(
        connection.transaction((db) => db.select({ value: api.fromArray(bad) }).from(sql`(values (1)) fixture(id)`)),
      );
    await assert.rejects(
      connection.transaction((db) =>
        db
          .select({
            value: api.fromArrays(
              { dimensions: [{ lowerBound: 1, length: 2 }], values: ["one", "two"] },
              { dimensions: [{ lowerBound: 1, length: 1 }], values: ["one"] },
            ),
          })
          .from(sql`(values (1)) fixture(id)`),
      ),
    );
    const nullValues = await connection.transaction((db) =>
      db
        .select({
          value: api.fromArrays({ dimensions: [{ lowerBound: -4, length: 2 }], values: ["one", "two"] }, null),
        })
        .from(sql`(values (1)) fixture(id)`),
    );
    assert.deepEqual(orderedHstoreEntries(nullValues[0]!.value!.entries), [
      { key: "one", value: null },
      { key: "two", value: null },
    ]);
    const unicodeKey = "key😀𐐀",
      unicodeValue = "value🚀日本";
    await assert.rejects(
      connection.transaction((db) =>
        db
          .select({
            value: api.fromArrays(
              { dimensions: [{ lowerBound: 7, length: 1 }], values: [unicodeKey] },
              { dimensions: [{ lowerBound: -8, length: 1 }], values: [unicodeValue] },
            ),
          })
          .from(sql`(values (1)) fixture(id)`),
      ),
      (error: Error) =>
        "cause" in error && error.cause instanceof Error && "code" in error.cause && error.cause.code === "2202E",
    );
    const unicode = await connection.transaction((db) =>
      db
        .select({
          pair: api.fromPair(unicodeKey, unicodeValue),
          fetched: api.get(api.fromPair(unicodeKey, unicodeValue), unicodeKey),
          deleted: api.delete.byKey(api.fromPair(unicodeKey, unicodeValue), unicodeKey),
          array: api.fromArray({ dimensions: [{ lowerBound: -3, length: 2 }], values: [unicodeKey, unicodeValue] }),
          arrays: api.fromArrays(
            { dimensions: [{ lowerBound: 7, length: 1 }], values: [unicodeKey] },
            { dimensions: [{ lowerBound: 7, length: 1 }], values: [unicodeValue] },
          ),
        })
        .from(sql`(values (1)) fixture(id)`),
    );
    const unicodeNative = await observeNativeHstore(client, `${hstoreFunction("hstore")}($1::text,$2::text)`, [
      unicodeKey,
      unicodeValue,
    ]);
    assert.deepEqual(unicode[0]!.pair?.entries, unicodeNative.entries);
    assert.equal(unicode[0]!.fetched, unicodeValue);
    assert.deepEqual(unicode[0]!.deleted?.entries, []);
    assert.deepEqual(unicode[0]!.array?.entries, unicodeNative.entries);
    assert.deepEqual(unicode[0]!.arrays?.entries, unicodeNative.entries);
    assert.deepEqual((await client.query("select 1 value")).rows, [{ value: 1 }]);
  });
});

test("hstore.looseJsonKeepsNativePrecisionAndStringConversionDifferences", async () => {
  await withHstoreApi(async ({ client, connection, api }) => {
    const entries = [
      { key: "large", value: "9007199254740993" },
      { key: "true", value: "t" },
      { key: "false", value: "f" },
      { key: "decimal", value: "1.2345678901234567890123456789" },
      { key: "stored", value: null },
      { key: "nullString", value: "NULL" },
      { key: "leading", value: "01" },
      { key: "unicode", value: "日本" },
    ];
    const value = api.value(entries);
    const result = await connection.transaction((db) =>
      db
        .select({
          json: api.toJson(value),
          jsonb: api.toJsonb(value),
          loose: api.toJsonLoose(value),
          looseb: api.toJsonbLoose(value),
        })
        .from(sql`(values (1)) fixture(id)`),
    );
    for (const [key, name] of [
      ["json", "hstore_to_json"],
      ["jsonb", "hstore_to_jsonb"],
      ["loose", "hstore_to_json_loose"],
      ["looseb", "hstore_to_jsonb_loose"],
    ] as const) {
      const native = v.parse(
        v.array(v.object({ text: v.string() })),
        (
          await client.query(
            `select ${hstoreFunction(name)}(${hstoreFunction("hstore")}($1::text[],$2::text[]))::text text`,
            nativeHstoreParameters(entries),
          )
        ).rows,
      )[0]!;
      assert.equal(result[0]![key]?.text, native.text);
    }
    assert.match(result[0]!.json!.text, /"large"\s*:\s*"9007199254740993"/);
    assert.match(result[0]!.loose!.text, /"large"\s*:\s*9007199254740993/);
    assert.match(result[0]!.loose!.text, /"true"\s*:\s*true/);
    assert.match(result[0]!.loose!.text, /"false"\s*:\s*false/);
    assert.match(result[0]!.loose!.text, /"stored"\s*:\s*null/);
    assert.match(result[0]!.loose!.text, /"nullString"\s*:\s*"NULL"/);
    assert.ok(result[0]!.looseb!.text.includes("1.2345678901234567890123456789"));
  });
});

test("hstore.sqlColumnsAliasesCastsAndNestedSubqueriesRetainTypes", async () => {
  await withHstoreApi(async ({ connection, api }) => {
    const original = sql<HstoreValue>`lhs`;
    const tags = sql<PostgreSqlArray<string>>`tags`;
    const key = sql<string>`keyarg`;
    const alias = api.fromPair("key", "value").as('mapping"日本');
    const selected = await connection.transaction((db) =>
      db
        .select({
          fetched: api.get(original, key),
          deleted: api.delete.byKeys(original, tags),
          cast: api.sql.casts.hstore_to_jsonb(original),
          nested: api.get(alias, key),
        })
        .from(sql`portable_native_inputs`),
    );
    assert.equal(selected[0]!.fetched, mapping.entries.find(({ key }) => key === "key")!.value);
    assert.equal(selected[0]!.nested, "value");
    assert.ok(selected[0]!.cast);
    assert.equal(
      selected[0]!.deleted?.entries.some(({ key }) => key === "key"),
      false,
    );
    const rows = await connection.transaction(async (db) => {
      const subquery = db
        .select({ mapping: alias })
        .from(sql`portable_native_inputs`)
        .as('subquery"日本');
      return db.select({ fetched: api.get(subquery.mapping, "key") }).from(subquery);
    });
    assert.deepEqual(rows, [{ fetched: "value" }]);
    const nulls = await connection.transaction((db) =>
      db
        .select({ value: api.sql.casts.text_array_to_hstore(null), json: api.toJson(null) })
        .from(sql`(values (1)) fixture(id)`),
    );
    assert.deepEqual(nulls, [{ value: null, json: null }]);
  });
});

test("hstore.caughtDriverDecodeFailureStillPoisonsMutationInvocation", async () => {
  await withHstoreApi(async ({ client, connection, api }) => {
    await client.query("create table hstore_api_writes(value text)");
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    let caught = 0;
    const route = bindRpcDatabaseProcedure(
      createProjectProcedures(schema)
        .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
        .input(v.picklist(["malformed", "valid"]))
        .handler(async ({ context, input }) => {
          await context.db.execute(sql`insert into hstore_api_writes values (${input})`);
          if (input === "malformed") {
            // Controlled driver-text fault, not a claim that a native routine emits malformed hstore.
            const malformed = checkedExtensionExpression(
              sql`'"key"=>"unterminated'::text`,
              api.codec,
              [],
              undefined,
              "fixture:hstore.driver-text-fault",
            );
            try {
              await context.db.select({ value: malformed }).from(sql`(values (1)) fixture(id)`);
            } catch {
              caught++;
            }
            assert.deepEqual((await context.db.execute(sql`select 1 value`)).rows, [{ value: 1 }]);
            await context.db.execute(sql`insert into hstore_api_writes values (${"after"})`);
          } else await context.db.select({ value: api.get(mapping, "string") }).from(sql`(values (1)) fixture(id)`);
          return "done";
        }),
      {
        connection,
        replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
        authorize: async () => {},
      },
    );
    const contextFor = () => {
      const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
      return { ...invocation, operation: "mutation" as const, "effect/context": Context.make(Invocation, invocation) };
    };
    await assert.rejects(call(route, "malformed", { context: contextFor() }));
    assert.equal(caught, 1);
    assert.deepEqual((await client.query("select value from hstore_api_writes")).rows, []);
    assert.equal(await call(route, "valid", { context: contextFor() }), "done");
    assert.deepEqual((await client.query("select value from hstore_api_writes")).rows, [{ value: "valid" }]);
  });
});
