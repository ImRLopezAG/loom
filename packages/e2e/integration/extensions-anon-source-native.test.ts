import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "bun:test";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import { pgSchema } from "drizzle-orm/pg-core";
import pg from "pg";
import * as v from "valibot";
import {
  createAnon_2_5_1,
  anonParameter,
  anonRoutineSpecs,
  ANON_DIGEST,
} from "../../../apps/loom/src/core/extensions/adapters/anon";
import { anonCompositeFields } from "../../../apps/loom/src/core/extensions/adapters/anon-codecs";
import { extensionFieldSqlType } from "../../../apps/loom/src/core/extensions/fields";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";

// Native common-member characterization through source adapters. This is neither exact Neon acceptance nor a generation/pack gate.
const url = process.env.ANON_LOCAL_URL;
const local = url && /@127\.0\.0\.1:\d+\//.test(url) ? url : undefined;
const api = createAnon_2_5_1({
  name: "anon",
  version: "2.5.1",
  schema: "extensions",
  apiSupport: { status: "verified", digest: ANON_DIGEST },
});
const stamp = { type: "timestamp", text: "2020-01-02 12:30:00.123456" } as const;
const instant = { type: "timestamptz", text: "2020-01-02 12:30:00.123456+00" } as const;
const defaults = {
  text: "x",
  int4: 2,
  int8: 42n,
  float4: 0.5,
  float8: 0.5,
  numeric: "42.5",
  date: "2020-01-02",
  time: "12:30:00",
  timestamp: stamp,
  timestamptz: instant,
  interval: "1 day",
  anyelement: anonParameter(api.codecs.text, "alice"),
  int4range: "[1,3)",
  int8range: "[1,3)",
  numrange: "[1,3)",
  daterange: "[2020-01-01,2020-01-03)",
  tsrange: '["2020-01-01 00:00:00","2020-01-03 00:00:00")',
  tstzrange: '["2020-01-01 00:00:00+00","2020-01-03 00:00:00+00")',
  bytea: {
    hex: "424d3a0000000000000036000000280000000100000001000000010018000000000004000000000000000000000000000000000000000000ff0000",
  },
};
function argumentsFor(spec: { name: string; args: readonly string[] }) {
  // SAFETY: common query specs consume only these explicit valid native input fixtures; missing input makes the native call fail.
  const args = spec.args.map((type) => defaults[type.replace(/^\?/, "") as keyof typeof defaults]);
  if (spec.name.endsWith("_locale")) args[0] = "en_US";
  if (spec.name.startsWith("pseudo_") && spec.args[0] === "anyelement") args[1] = "salt";
  if (spec.name === "random_real" || spec.name === "random_double_precision") return [0.25, 0.75];
  if (spec.name.startsWith("generalize_"))
    args[1] = spec.args[1] === "?text" ? "day" : spec.args[1] === "?int8" ? 10n : 10;
  if (spec.name === "date_part" || spec.name === "date_trunc") args[0] = "day";
  if (spec.name === "digest") return ["x", "salt", "sha256"];
  if (spec.name === "hex_to_int") return ["ff"];
  if (spec.name === "partial_email") return ["daamien@gmail.com"];
  if (spec.name === "partial") return ["abcdef", 1, "xxxx", 1];
  if (spec.name === "make_date") return [2020, 1, 2];
  if (spec.name === "make_time") return [12, 30, 1.25];
  if (spec.name === "lorem_ipsum") return [1, 0, 0];
  if (spec.name === "regexp_replace") return spec.args.length === 4 ? ["abc", "b", "x", "g"] : ["abc", "b", "x"];
  if (spec.name === "to_date") return ["2020-01-02", "YYYY-MM-DD"];
  if (spec.name === "to_timestamp") return ["2020-01-02 12:30:00", "YYYY-MM-DD HH24:MI:SS"];
  if (spec.name === "to_number") return ["42.5", "99D9"];
  if (spec.name === "to_char") args[1] = spec.args[0] === "numeric" ? "999D99" : "HH24:MI:SS";
  if (spec.name === "random_number_with_format" || spec.name === "random_phone_with_format") return ["###-###"];
  if (spec.name === "random_phone" && args.length) return ["+1"];
  return args;
}

test.skipIf(!local)(
  "anon upstream native source: 237 common query overloads execute and decode",
  async () => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: local!,
    });
    const failures: string[] = [];
    let passed = 0;
    try {
      await connection.transaction(async (db) => {
        await db.execute(sql.raw("LOAD 'anon'"));
        await db.execute(sql.raw("SELECT anon.init()"));
      });
      for (const [id, spec] of Object.entries(anonRoutineSpecs)) {
        if (!spec.query || spec.name === "projection_to_oid") continue; // Neon int4 overload has no upstream exact-signature prerequisite.
        try {
          await connection.transaction(async (db) => {
            await db.execute(sql.raw("LOAD 'anon'"));
            // SAFETY: query=true selects exactly the public overload map, and argumentsFor supplies each spec's native fixture inputs.
            const call = api.sql.overloads[id as keyof typeof api.sql.overloads] as (
              ...args: unknown[]
            ) => SQL<unknown>;
            const [row] = await db
              .select({ value: call(...argumentsFor(spec)) })
              .from(sql.raw("(VALUES(1)) AS fixture(id)"));
            assert(row && row.value !== undefined, id);
            if (row.value !== null) {
              if (
                [
                  "text",
                  "date",
                  "time",
                  "interval",
                  "numeric",
                  "daterange",
                  "int4range",
                  "int8range",
                  "numrange",
                  "tsrange",
                  "tstzrange",
                ].includes(spec.result)
              )
                assert(v.is(v.string(), row.value), id);
              if (["int2", "int4", "float4", "float8"].includes(spec.result)) assert(v.is(v.number(), row.value), id);
              if (spec.result === "int8") assert(v.is(v.bigint(), row.value), id);
              if (spec.result === "bool") assert(v.is(v.boolean(), row.value), id);
              if (spec.result === "timestamp" || spec.result === "timestamptz")
                assert.equal(v.parse(v.object({ type: v.string() }), row.value).type, spec.result, id);
              if (spec.result === "bytea")
                assert.match(v.parse(v.object({ hex: v.string() }), row.value).hex, /^(?:[a-f0-9]{2})+$/, id);
            }
            if (id === "routine:anon.version()") assert.equal(row.value, "2.5.1");
            if (id === "routine:anon.partial_email(pg_catalog.text)") assert.equal(row.value, "da******@gm******.com");
            if (id === "routine:anon.generalize_int4range(pg_catalog.int4,pg_catalog.int4)")
              assert.equal(row.value, "[0,10)");
          });
          passed++;
        } catch (cause) {
          const error = cause instanceof Error ? cause : new Error(String(cause));
          failures.push(
            `${id}: ${error.message}${error.cause instanceof Error ? `; native: ${error.cause.message}` : ""}`,
          );
        }
      }
      assert.deepEqual(failures, [], `${passed} passed; native common-member failures:\n${failures.join("\n")}`);
      assert.equal(passed, 237);
      const words = api.sql.overloads["routine:anon.lorem_ipsum(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)"];
      const generalize = api.sql.overloads["routine:anon.generalize_int4range(pg_catalog.int4,pg_catalog.int4)"];
      const defaults = await connection.transaction(async (db) => {
        await db.execute(sql`LOAD 'anon'`);
        return db
          .select({ words: words(undefined, 2), generalized: generalize(42, undefined) })
          .from(sql.raw("(VALUES(1)) AS fixture(id)"));
      });
      assert.equal(defaults[0]?.words?.split(" ").length, 2);
      assert.equal(defaults[0]?.generalized, "[40,50)");
      const pseudo = api.sql.overloads["routine:anon.pseudo_email(pg_catalog.anyelement,pg_catalog.text)"];
      const bound = await connection.transaction((db) =>
        db
          .select({
            column: pseudo(anonParameter(api.codecs.text, sql<string>`fixture.email`), "salt"),
            value: pseudo(anonParameter(api.codecs.text, "alice"), "salt"),
          })
          .from(sql.raw("(VALUES('alice'::text)) AS fixture(email)")),
      );
      assert.match(bound[0]?.column ?? "", /@/);
      assert.equal(bound[0]?.column, bound[0]?.value);
    } finally {
      await connection.close();
    }
  },
  120000,
);

test.skipIf(!local)(
  "anon upstream native source: all 36 row/array fields round-trip fixed anon storage",
  async () => {
    const namespace = `anon_codec_${randomUUID().replaceAll("-", "")}`;
    const client = new pg.Client({ connectionString: local });
    await client.connect();
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: local!,
    });
    try {
      await client.query(`CREATE SCHEMA ${pg.escapeIdentifier(namespace)}`);
      for (const [name, factory] of Object.entries(api.fields)) {
        const field = factory();
        const type = extensionFieldSqlType(field.metadata.extension!);
        // SAFETY: the field map contains exactly the composite keys and their underscore-prefixed array counterparts.
        const rowName = name.replace(/^_/, "") as keyof typeof anonCompositeFields;
        const fields = anonCompositeFields[rowName];
        const row = Object.fromEntries(
          Object.entries(fields).map(([key, codec]) => [
            key,
            codec.id.startsWith("nullable:") ? null : key === "oid" ? 1 : "sample",
          ]),
        );
        // Nullable catalog members are all supplied as NULL; dictionary NOT NULL members retain their native values.
        for (const key of Object.keys(row))
          if (!["oid", "lang", "attname", "name"].includes(key) || rowName.startsWith("pg_")) row[key] = null;
        if ("val" in row) row.val = 'quote,"NULL"\\Ω😀';
        if ("paragraph" in row) row.paragraph = 'paragraph,"NULL"\\Ω😀';
        const value = name.startsWith("_") ? { dimensions: [{ lowerBound: 0, length: 2 }], values: [row, null] } : row;
        // SAFETY: field and input are built from the same composite key; encodeDefault validates the entire native input shape.
        const defaultSql = extensionSqlDialect(nodePgCodecs).sqlToQuery(field.encodeDefault!(value as never).sql);
        assert.deepEqual(defaultSql.params, []);
        await client.query(
          `CREATE TABLE ${pg.escapeIdentifier(namespace)}.${pg.escapeIdentifier(name)} (value ${type} DEFAULT ${defaultSql.sql})`,
        );
        const table = pgSchema(namespace).table(name, { value: field.build("value") });
        await connection.transaction(async (db) => {
          // SAFETY: the table contains this exact field and its corresponding codec-validated composite or array value.
          await db.insert(table).values({ value } as typeof table.$inferInsert);
          await db.execute(
            sql.raw(`INSERT INTO ${pg.escapeIdentifier(namespace)}.${pg.escapeIdentifier(name)} DEFAULT VALUES`),
          );
          const rows = await db.select().from(table);
          assert.deepEqual(rows, [{ value }, { value }], name);
        });
      }
    } finally {
      try {
        await connection.close();
      } finally {
        await client.query(`DROP SCHEMA IF EXISTS ${pg.escapeIdentifier(namespace)} CASCADE`);
        await client.end();
      }
    }
  },
  120000,
);
