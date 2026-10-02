import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { defineRelations, sql, asc, lte } from "drizzle-orm";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createFuzzystrmatch_1_2 } from "../../../apps/loom/src/core/extensions/adapters/fuzzystrmatch";
import { createPgTiktoken_0_0_1 } from "../../../apps/loom/src/core/extensions/adapters/pg-tiktoken";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Exercise the runtime RPC boundary: PostgreSqlArray's readonly public shape must be validated before wire serialization.
function rpcRoundTrip(value: unknown) {
  return deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, value)));
}

test("fuzzy all eleven signatures decode and compose inside a Loom transaction", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema((fields) => ({ documents: { title: fields.text().notNull() } }), { namespace: "app" });
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const fuzzy = createFuzzystrmatch_1_2({
      name: "fuzzystrmatch",
      version: "1.2",
      schema: "custom",
      apiSupport: { status: "verified" },
    });
    try {
      await connection.db.execute(
        sql`create schema custom; create extension fuzzystrmatch with schema custom; create schema app; create table app.documents(title text not null)`,
      );
      await connection.db.execute(sql`insert into app.documents values ('Robert'), ('Rupert'), ('Alice')`);
      const rows = await connection.transaction(async (db) =>
        db
          .select({
            title: schema.tables.documents.title,
            soundex: fuzzy.soundex(schema.tables.documents.title),
            textSoundex: fuzzy.sql.functions.text_soundex(schema.tables.documents.title),
            difference: fuzzy.difference(schema.tables.documents.title, "Robert"),
            distance: fuzzy.levenshtein(schema.tables.documents.title, "Robert"),
          })
          .from(schema.tables.documents)
          .where(lte(fuzzy.levenshtein(schema.tables.documents.title, "Robert"), 2))
          .orderBy(asc(fuzzy.levenshtein(schema.tables.documents.title, "Robert"))),
      );
      expect(rows).toEqual([
        { title: "Robert", soundex: "R163", textSoundex: "R163", difference: 4, distance: 0 },
        { title: "Rupert", soundex: "R163", textSoundex: "R163", difference: 4, distance: 2 },
      ]);
      const values = await connection.transaction(async (db) =>
        db
          .select({
            codes: fuzzy.daitchMokotoff("Bierschbach"),
            metaphone: fuzzy.metaphone("GUMBO", 4),
            primary: fuzzy.dmetaphone("Smith"),
            alternate: fuzzy.dmetaphoneAlt("Smith"),
            cost: fuzzy.levenshtein("a", "", 2, 3, 4),
            insertion: fuzzy.levenshtein("", "a", 2, 3, 4),
            substitution: fuzzy.levenshtein("a", "b", 2, 3, 4),
            bounded: fuzzy.levenshteinLessEqual("GUMBO", "GAMBOL", 2),
            boundedCosts: fuzzy.sql.functions.levenshtein_less_equal("a", "", 2, 3, 4, 4),
            unicode: fuzzy.levenshtein("é", "e"),
            unicodeCodes: fuzzy.daitchMokotoff("élève"),
            shortMetaphone: fuzzy.metaphone("GUMBO", 1),
            negativeThreshold: fuzzy.levenshteinLessEqual("GUMBO", "GAMBOL", -1),
            maximum: fuzzy.levenshtein("é".repeat(255), "é".repeat(255)),
            above: fuzzy.levenshteinLessEqual("extensive", "a", 2),
            noCodes: fuzzy.daitchMokotoff(""),
          })
          .from(sql`(values (1)) as fixture(value)`),
      );
      expect(values).toEqual([
        {
          codes: {
            dimensions: [{ lowerBound: 1, length: 8 }],
            values: ["794575", "794574", "794750", "794740", "745750", "745740", "747500", "747400"],
          },
          metaphone: "KM",
          primary: "SM0",
          alternate: "XMT",
          cost: 3,
          insertion: 2,
          substitution: 4,
          bounded: 2,
          boundedCosts: 3,
          unicode: 1,
          unicodeCodes: { dimensions: [{ lowerBound: 1, length: 1 }], values: ["087000"] },
          shortMetaphone: "K",
          negativeThreshold: 2,
          maximum: 0,
          above: expect.any(Number),
          noCodes: null,
        },
      ]);
      expect(values[0]!.above).toBeGreaterThan(2);
      assert.deepEqual(rpcRoundTrip(values), values);
      const nulls = await connection.db
        .select({
          soundex: fuzzy.soundex(null),
          textSoundex: fuzzy.textSoundex(null),
          difference: fuzzy.difference(null, "a"),
          codes: fuzzy.daitchMokotoff(null),
          metaphone: fuzzy.metaphone("a", null),
          primary: fuzzy.dmetaphone(null),
          alternate: fuzzy.dmetaphoneAlt(null),
          distance: fuzzy.levenshtein(null, "a"),
          cost: fuzzy.levenshtein("a", "b", null, 1, 1),
          bounded: fuzzy.levenshteinLessEqual("a", "b", null),
          boundedCosts: fuzzy.levenshteinLessEqual("a", "b", 1, 1, null, 2),
        })
        .from(sql`(values (1)) as fixture(value)`);
      expect(Object.values(nulls[0]!)).toEqual(Array(11).fill(null));
      for (const expression of [
        fuzzy.levenshtein("é".repeat(256), "a"),
        fuzzy.levenshtein("a", "é".repeat(256), 1, 1, 1),
        fuzzy.levenshteinLessEqual("é".repeat(256), "a", 2),
        fuzzy.levenshteinLessEqual("a", "é".repeat(256), 1, 1, 1, 2),
      ]) {
        await expect(
          connection.db
            .select({ distance: expression })
            .from(sql`(values (1)) as fixture(value)`)
            .execute(),
        ).rejects.toMatchObject({
          cause: { message: "levenshtein argument exceeds maximum length of 255 characters" },
        });
      }
      const metaphoneLimits = await connection.db
        .select({ maximumBytes: fuzzy.metaphone("é".repeat(127), 255), emptyWithZero: fuzzy.metaphone("", 0) })
        .from(sql`(values (1)) as fixture(value)`);
      expect(metaphoneLimits).toEqual([{ maximumBytes: "", emptyWithZero: "" }]);
      for (const [expression, message] of [
        [fuzzy.metaphone("é".repeat(128), 4), "argument exceeds the maximum length of 255 bytes"],
        [fuzzy.metaphone("a", 256), "output exceeds the maximum length of 255 bytes"],
        [fuzzy.metaphone("a", 0), "output cannot be empty string"],
      ] as const) {
        await expect(
          connection.db
            .select({ value: expression })
            .from(sql`(values (1)) as fixture(value)`)
            .execute(),
        ).rejects.toMatchObject({ cause: { message } });
      }
    } finally {
      await connection.close();
    }
  });
});

/** Host-owned provider execution requires an already-installed captured 0.0.1 fixture. */
export async function verifyPgTiktoken_0_0_1(connectionString: string, namespace: string) {
  const schema = defineSchema(() => ({}));
  const connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString });
  const token = createPgTiktoken_0_0_1({
    name: "pg_tiktoken",
    version: "0.0.1",
    schema: namespace,
    apiSupport: { status: "verified" },
  });
  try {
    const version = await connection.db.execute(
      sql`select extversion from pg_catalog.pg_extension where extname='pg_tiktoken'`,
    );
    expect(version.rows).toEqual([{ extversion: "0.0.1" }]);
    const sourceText = "This is a test         with a lot of spaces<|endoftext|>";
    const cases = [
      ["cl100k_base", [2028n, 374n, 264n, 1296n, 260n, 449n, 264n, 2763n, 315n, 12908n, 100257n]],
      ["p50k_base", [1212n, 318n, 257n, 1332n, 50263n, 351n, 257n, 1256n, 286n, 9029n, 50256n]],
      ["p50k_edit", [1212n, 318n, 257n, 1332n, 50263n, 351n, 257n, 1256n, 286n, 9029n, 50256n]],
      [
        "r50k_base",
        [
          1212n,
          318n,
          257n,
          1332n,
          220n,
          220n,
          220n,
          220n,
          220n,
          220n,
          220n,
          220n,
          351n,
          257n,
          1256n,
          286n,
          9029n,
          50256n,
        ],
      ],
    ] as const;
    for (const [selector, expected] of cases) {
      const rows = await connection.transaction(async (db) =>
        db
          .select({ count: token.count(selector, sourceText), tokens: token.encode(selector, sourceText) })
          .from(sql`(values (1)) as fixture(value)`),
      );
      expect(rows).toEqual([
        {
          count: BigInt(expected.length),
          tokens: { dimensions: [{ lowerBound: 1, length: expected.length }], values: [...expected] },
        },
      ]);
      assert.deepEqual(rpcRoundTrip(rows), rows);
    }
    for (const [alias, encoding] of [
      ["gpt2", "r50k_base"],
      ["text-davinci-002", "p50k_base"],
      ["gpt-3.5-turbo", "cl100k_base"],
      ["code-davinci-edit-001", "p50k_edit"],
    ]) {
      const rows = await connection.db
        .select({
          alias: token.encode(alias!, "é你好🙂"),
          encoding: token.encode(encoding!, "é你好🙂"),
          count: token.count(alias!, "é你好🙂"),
        })
        .from(sql`(values (1)) as fixture(value)`);
      expect(rows[0]!.alias).toEqual(rows[0]!.encoding);
      expect(rows[0]!.count).toBe(BigInt(rows[0]!.alias!.values.length));
    }
    const empty = await connection.db
      .select({
        count: token.count("cl100k_base", ""),
        tokens: token.encode("cl100k_base", ""),
        nullCount: token.count(null, "a"),
        nullText: token.encode("cl100k_base", null),
      })
      .from(sql`(values (1)) as fixture(value)`);
    expect(empty).toEqual([{ count: 0n, tokens: { dimensions: [], values: [] }, nullCount: null, nullText: null }]);
    for (const selector of ["unknown-encoder", "unknown-model"]) {
      await expect(
        connection.db
          .select({ tokens: token.encode(selector, "hello") })
          .from(sql`(values (1)) as fixture(value)`)
          .execute(),
      ).rejects.toMatchObject({ cause: { message: `'${selector}': unknown model or encoder` } });
    }
  } finally {
    await connection.close();
  }
}

test.skipIf(!process.env.LOOM_TEST_TIKTOKEN_DATABASE_URL)(
  "provider pg_tiktoken selector, special token, Unicode, NULL, empty and bigint wire acceptance",
  async () => {
    const url = process.env.LOOM_TEST_TIKTOKEN_DATABASE_URL;
    if (!url) throw new Error("pg_tiktoken 0.0.1 provider prerequisite: LOOM_TEST_TIKTOKEN_DATABASE_URL");
    await verifyPgTiktoken_0_0_1(url, process.env.LOOM_TEST_TIKTOKEN_SCHEMA ?? "extensions");
  },
);
