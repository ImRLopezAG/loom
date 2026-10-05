import { expect, test } from "bun:test";
import pg from "pg";
import assert from "node:assert/strict";
import { defineRelations, sql, asc } from "drizzle-orm";
import * as v from "valibot";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import {
  jsonCodec,
  jsonbCodec,
  jsonDocument,
  jsonbDocument,
  jsonValue,
  jsonbValue,
} from "../../../apps/loom/src/core/extensions/native-json-codecs";
import { createPgJsonschema_0_3_4 } from "../../../apps/loom/src/core/extensions/adapters/pg-jsonschema";
import { rpcValue, serializeRpcValue, deserializeRpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  pgJsonschemaNativeProofCase,
  pgJsonschemaNativeProofClaims,
  pgJsonschemaProofSchema,
} from "../fixtures/pg-jsonschema-proof-cases";
import { evaluateSnapshot, captureSnapshotRevisions } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { withExtensionDatabase } from "../fixtures/extension-database";

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Validate the public readonly codec shape at the runtime RPC boundary.
function rpcRoundTrip(value: unknown) {
  return deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, value)));
}

test("native JSON text characterizes precision, duplicate keys, order and SQL NULL", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const document = '{ "z": 1, "a": 9223372036854775807.123456789, "z": 2 }';
      const result = await client.query(
        "select $1::pg_catalog.json::pg_catalog.text as json, $1::pg_catalog.jsonb::pg_catalog.text as jsonb, 'null'::pg_catalog.json::pg_catalog.text as json_null, NULL::pg_catalog.json::pg_catalog.text as sql_null",
        [document],
      );
      expect(result.rows).toEqual([
        {
          json: document,
          jsonb: '{"a": 9223372036854775807.123456789, "z": 2}',
          json_null: "null",
          sql_null: null,
        },
      ]);
    } finally {
      await client.end();
    }
  });
});

test("lossless JSON codecs project text through Kello transactions and RPC", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const base = { schema: "public", dependencies: [], observability: "tables", authority: "query" } as const;
    const identityJson = createSqlFunction({
      ...base,
      name: "identity_json",
      member: "fixture:identity_json",
      arguments: [nullableCodec(jsonCodec)] as const,
      result: nullableCodec(jsonCodec),
    });
    const identityJsonb = createSqlFunction({
      ...base,
      name: "identity_jsonb",
      member: "fixture:identity_jsonb",
      arguments: [nullableCodec(jsonbCodec)] as const,
      result: nullableCodec(jsonbCodec),
    });
    try {
      await connection.db.execute(
        sql`create function identity_json(value json) returns json language sql immutable strict as 'select value'; create function identity_jsonb(value jsonb) returns jsonb language sql immutable strict as 'select value'`,
      );
      const document = '{ "z": 1, "a": 9223372036854775807.123456789, "z": 2 }';
      const values = await connection.transaction((db) =>
        db
          .select({
            json: identityJson(jsonDocument(document)),
            jsonb: identityJsonb(jsonbDocument(document)),
            jsonNull: identityJson(jsonValue(null)),
            sqlNull: identityJson(null),
            string: identityJson(jsonValue('{"number":1}')),
            overflow: identityJson(jsonDocument("1e309")),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      expect(values).toEqual([
        {
          json: jsonDocument(document),
          jsonb: jsonbDocument('{"a": 9223372036854775807.123456789, "z": 2}'),
          jsonNull: jsonDocument("null"),
          sqlNull: null,
          string: jsonDocument('"{\\"number\\":1}"'),
          overflow: jsonDocument("1e309"),
        },
      ]);
      assert.deepEqual(rpcRoundTrip(values), values);
      for (const text of ['"\\u0000"', '"\\ud800"', "1e999999"]) {
        await assert.rejects(
          connection.transaction((db) =>
            db.select({ value: identityJsonb(jsonbDocument(text)) }).from(sql`(values (1)) fixture(id)`),
          ),
        );
      }
    } finally {
      await connection.close();
    }
  });
});

export async function verifyPgJsonschema_0_3_4(url: string, installationSchema: string) {
  const namespace = `jsonschema_proof_${crypto.randomUUID().replaceAll("-", "")}`;
  const schema = defineSchema((fields) => ({ documents: { title: fields.text().notNull(), body: fields.json() } }), {
    namespace,
  });
  const connection = await connectDatabase({
    schema,
    relations: defineRelations(schema.tables),
    connectionString: url,
  });
  const adapter = createPgJsonschema_0_3_4({
    name: "pg_jsonschema",
    version: "0.3.4",
    schema: installationSchema,
    apiSupport: { status: "verified", digest: "7a61cf1dd9bcb37e3704e5cb9c5cc92258815f6dddf6a869bd9c6434a66da138" },
  });
  const run = async () => {
    const stringSchema = jsonValue({ type: "string", maxLength: 4 });
    const result = await connection.transaction((db) =>
      db
        .select({
          jsonMatch: adapter.jsonMatchesSchema(stringSchema, jsonValue("foo")),
          jsonMismatch: adapter.jsonMatchesSchema(stringSchema, jsonValue("123456789")),
          jsonbMatch: adapter.sql.functions.jsonb_matches_schema(stringSchema, jsonbValue("foo")),
          jsonbMismatch: adapter.jsonbMatchesSchema(stringSchema, jsonbValue(3)),
          schemaValid: adapter.sql.functions.jsonschema_is_valid(stringSchema),
          noErrors: adapter.validationErrors(stringSchema, jsonValue("foo")),
          errors: adapter.sql.functions.jsonschema_validation_errors(stringSchema, jsonValue("123456789")),
          jsonNull: adapter.jsonMatchesSchema(jsonValue({ type: "null" }), jsonValue(null)),
          jsonbNull: adapter.jsonbMatchesSchema(jsonValue({ type: "null" }), jsonbValue(null)),
          schemaNull: adapter.isValid(null),
          instanceNull: adapter.jsonMatchesSchema(stringSchema, null),
          binaryNull: adapter.jsonbMatchesSchema(null, jsonbValue("foo")),
          errorsNull: adapter.validationErrors(null, jsonValue("foo")),
          precise: adapter.jsonMatchesSchema(
            jsonDocument('{"const":9223372036854775807.123456789}'),
            jsonDocument("9223372036854775807.123456789"),
          ),
          distinct: adapter.jsonMatchesSchema(
            jsonDocument('{"const":9223372036854775807.123456789}'),
            jsonDocument("9223372036854775807.123456788"),
          ),
        })
        .from(sql`(values (1)) fixture(id)`),
    );
    expect(result).toEqual([
      {
        jsonMatch: true,
        jsonMismatch: false,
        jsonbMatch: true,
        jsonbMismatch: false,
        schemaValid: true,
        noErrors: { dimensions: [], values: [] },
        errors: { dimensions: [{ lowerBound: 1, length: 1 }], values: ['"123456789" is longer than 4 characters'] },
        jsonNull: true,
        jsonbNull: true,
        schemaNull: null,
        instanceNull: null,
        binaryNull: null,
        errorsNull: null,
        precise: true,
        distinct: false,
      },
    ]);
    await extensionProofWitness({ ...pgJsonschemaNativeProofClaims.json, schema: installationSchema }, () => {
      expect(result[0]?.jsonMatch).toBe(true);
      expect(result[0]?.jsonMismatch).toBe(false);
      expect(result[0]?.jsonNull).toBe(true);
      expect(result[0]?.instanceNull).toBeNull();
      expect(result[0]?.precise).toBe(true);
      expect(result[0]?.distinct).toBe(false);
    });
    await extensionProofWitness({ ...pgJsonschemaNativeProofClaims.jsonb, schema: installationSchema }, () => {
      expect(result[0]?.jsonbMatch).toBe(true);
      expect(result[0]?.jsonbMismatch).toBe(false);
      expect(result[0]?.jsonbNull).toBe(true);
      expect(result[0]?.binaryNull).toBeNull();
    });
    await extensionProofWitness({ ...pgJsonschemaNativeProofClaims.valid, schema: installationSchema }, () => {
      expect(result[0]?.schemaValid).toBe(true);
      expect(result[0]?.schemaNull).toBeNull();
    });
    await extensionProofWitness({ ...pgJsonschemaNativeProofClaims.errors, schema: installationSchema }, () => {
      expect(result[0]?.noErrors).toEqual({ dimensions: [], values: [] });
      expect(result[0]?.errors).toEqual({
        dimensions: [{ lowerBound: 1, length: 1 }],
        values: ['"123456789" is longer than 4 characters'],
      });
      expect(result[0]?.errorsNull).toBeNull();
    });
    assert.deepEqual(rpcRoundTrip(result), result);
  };
  try {
    expect(
      (await connection.db.execute(sql`select extversion from pg_catalog.pg_extension where extname = 'pg_jsonschema'`))
        .rows,
    ).toEqual([{ extversion: "0.3.4" }]);
    await connection.db.execute(
      sql`create schema ${sql.identifier(namespace)}; create table ${sql.identifier(namespace)}.documents ("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, title text not null, body jsonb)`,
    );
    await connection.db.execute(
      sql`insert into ${sql.identifier(namespace)}.documents(title, body) values ('match', '{"value":9223372036854775807.123456789}'::jsonb), ('other', '{"value":9223372036854775807.123456788}'::jsonb), ('null', NULL)`,
    );
    const tableSchema = jsonDocument(
      '{"type":"object","properties":{"value":{"const":9223372036854775807.123456789}}}',
    );
    expect(
      await connection.transaction((db) =>
        db
          .select({
            title: schema.tables.documents.title,
            matches: adapter.jsonbMatchesSchema(tableSchema, schema.tables.documents.body),
          })
          .from(schema.tables.documents)
          .where(adapter.jsonbMatchesSchema(tableSchema, schema.tables.documents.body))
          .orderBy(asc(schema.tables.documents.title)),
      ),
    ).toEqual([{ title: "match", matches: true }]);
    expect(
      await connection.transaction((db) =>
        db.query.documents.findMany({
          columns: { title: true },
          orderBy: { title: "asc" },
          extras: {
            jsonMatches: (table) => adapter.jsonMatchesSchema(tableSchema, table.body),
            errors: (table) => adapter.validationErrors(tableSchema, table.body),
          },
        }),
      ),
    ).toEqual([
      { title: "match", jsonMatches: true, errors: { dimensions: [], values: [] } },
      { title: "null", jsonMatches: null, errors: null },
      {
        title: "other",
        jsonMatches: false,
        errors: { dimensions: [{ lowerBound: 1, length: 1 }], values: [expect.any(String)] },
      },
    ]);
    const live = await connection.transaction(async (db) =>
      evaluateSnapshot(async () => {
        const rows = await db
          .select({ matches: adapter.jsonbMatchesSchema(jsonValue({ type: "string" }), jsonbValue("foo")) })
          .from(sql`(values (1)) fixture(id)`);
        await captureSnapshotRevisions(db, async () => ({}));
        return rows;
      }),
    );
    expect(live.value).toEqual([{ matches: true }]);
    await assert.rejects(
      connection.transaction(async (db) => {
        await db.insert(schema.tables.documents).values({ title: "must roll back", body: {} });
        await db
          .select({
            invalid: adapter.isValid(jsonValue({})).mapWith(() => {
              throw new Error("decode failure");
            }),
          })
          .from(sql`(values (1)) fixture(id)`);
      }),
      /decode failure/,
    );
    expect(
      (
        await connection.db.execute(
          sql`select title from ${sql.identifier(namespace)}.documents where title = 'must roll back'`,
        )
      ).rows,
    ).toEqual([]);
    await run();
    for (const invalid of [jsonValue({ type: "obj" }), jsonValue({ $schema: "invalid-uri", type: "string" })]) {
      expect(
        await connection.transaction((db) =>
          db
            .select({ valid: adapter.isValid(invalid), errors: adapter.validationErrors(invalid, jsonValue("foo")) })
            .from(sql`(values (1)) fixture(id)`),
        ),
      ).toEqual([
        { valid: false, errors: { dimensions: [{ lowerBound: 1, length: 1 }], values: [expect.any(String)] } },
      ]);
      await assert.rejects(
        connection.transaction((db) =>
          db
            .select({ match: adapter.jsonMatchesSchema(invalid, jsonValue("foo")) })
            .from(sql`(values (1)) fixture(id)`),
        ),
      );
      await assert.rejects(
        connection.transaction((db) =>
          db
            .select({ match: adapter.jsonbMatchesSchema(invalid, jsonbValue("foo")) })
            .from(sql`(values (1)) fixture(id)`),
        ),
      );
    }
    for (const dialect of [
      "http://json-schema.org/draft-04/schema#",
      "http://json-schema.org/draft-06/schema#",
      "http://json-schema.org/draft-07/schema#",
      "https://json-schema.org/draft/2019-09/schema",
      "https://json-schema.org/draft/2020-12/schema",
    ]) {
      expect(
        await connection.transaction((db) =>
          db
            .select({
              valid: adapter.isValid(jsonValue({ $schema: dialect, type: "string" })),
              match: adapter.jsonMatchesSchema(jsonValue({ $schema: dialect, type: "string" }), jsonValue("foo")),
            })
            .from(sql`(values (1)) fixture(id)`),
        ),
      ).toEqual([{ valid: true, match: true }]);
    }
    const reference = jsonValue({ $defs: { name: { type: "string" } }, $ref: "#/$defs/name" });
    expect(
      await connection.transaction((db) =>
        db
          .select({
            local: adapter.jsonMatchesSchema(reference, jsonValue("foo")),
            trueSchema: adapter.jsonMatchesSchema(jsonValue(true), jsonValue(1)),
            falseSchema: adapter.jsonMatchesSchema(jsonValue(false), jsonValue(1)),
          })
          .from(sql`(values (1)) fixture(id)`),
      ),
    ).toEqual([{ local: true, trueSchema: true, falseSchema: false }]);
    for (const reference of [
      "https://example.invalid/loom-json-schema.json",
      "file:///loom-nonexistent-json-schema.json",
    ]) {
      const external = jsonValue({ $ref: reference });
      const errors = await connection.transaction((db) =>
        db.select({ errors: adapter.validationErrors(external, jsonValue("foo")) }).from(sql`(values (1)) fixture(id)`),
      );
      expect(errors[0]!.errors?.values).toHaveLength(1);
      expect(String(errors[0]!.errors?.values[0])).toContain(
        reference.startsWith("file:") ? "resolve-file" : "resolve-http",
      );
      await assert.rejects(
        connection.transaction((db) =>
          db
            .select({ match: adapter.jsonMatchesSchema(external, jsonValue("foo")) })
            .from(sql`(values (1)) fixture(id)`),
        ),
      );
    }
  } finally {
    try {
      await connection.db.execute(sql`drop schema if exists ${sql.identifier(namespace)} cascade`);
    } finally {
      await connection.close();
    }
  }
}

extensionProofTest(pgJsonschemaNativeProofCase, async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const quoted = '"' + pgJsonschemaProofSchema.replaceAll('"', '""') + '"';
      await client.query(
        `CREATE SCHEMA ${quoted}; CREATE EXTENSION pg_jsonschema WITH SCHEMA ${quoted} VERSION '0.3.4'`,
      );
      await observeExtensionProofDatabase(url, pgJsonschemaNativeProofCase.id, "pg_jsonschema");
      await verifyPgJsonschema_0_3_4(url, pgJsonschemaProofSchema);
    } finally {
      await client.end();
    }
  });
});
