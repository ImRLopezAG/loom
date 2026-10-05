import { expect, test } from "bun:test";
import { asc, defineRelations, sql } from "drizzle-orm";
import * as v from "valibot";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createExtensionField } from "../../../apps/loom/src/core/extensions/fields";
import {
  jsonCodec,
  jsonbCodec,
  jsonDocument,
  jsonbDocument,
} from "../../../apps/loom/src/core/extensions/native-json-codecs";
import { json } from "../../../apps/loom/src/core/validation/encoding";
import type { JsonValue } from "../../../apps/loom/src/core/schema/fields";
import { withExtensionDatabase } from "../fixtures/extension-database";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
const identityContract = { schema: "public", dependencies: [], observability: "tables", authority: "query" } as const;
const identityJson = createSqlFunction({
  ...identityContract,
  name: "identity_json",
  member: "fixture:identity_json",
  arguments: [nullableCodec(jsonCodec)] as const,
  result: nullableCodec(jsonCodec),
});
const identityJsonb = createSqlFunction({
  ...identityContract,
  name: "identity_jsonb",
  member: "fixture:identity_jsonb",
  arguments: [nullableCodec(jsonbCodec)] as const,
  result: nullableCodec(jsonbCodec),
});
const installIdentityFunctions = sql`create function public.identity_json(value json) returns json language sql immutable strict as 'select value'; create function public.identity_jsonb(value jsonb) returns jsonb language sql immutable strict as 'select value'`;

test.skipIf(!connectionString)("JSON transport preserves ordinary selected, raw and custom mapped values", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema((fields) => ({ documents: { label: fields.text().notNull(), body: fields.json() } }));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const fixtures = [
      { label: "a-object", text: '{"nested":[1,true,null]}', value: { nested: [1, true, null] } },
      { label: "b-array", text: '[1,"two",false]', value: [1, "two", false] },
      { label: "c-string", text: '"{\\"nested\\":[1]}"', value: '{"nested":[1]}' },
      { label: "d-number", text: "42.5", value: 42.5 },
      { label: "e-boolean", text: "true", value: true },
      { label: "f-json-null", text: "null", value: null },
      { label: "g-sql-null", text: null, value: null },
    ];
    try {
      await connection.db.execute(
        sql`create table public.documents ("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, label text not null, body jsonb)`,
      );
      await connection.db.execute(installIdentityFunctions);
      for (const fixture of fixtures)
        await connection.db.execute(
          sql`insert into public.documents(label, body) values (${fixture.label}, ${fixture.text}::jsonb)`,
        );
      const expected = fixtures.map(({ label, value }) => ({ label, body: value }));
      await connection.transaction(async (db) => {
        expect(
          await db
            .select({ label: schema.tables.documents.label, body: schema.tables.documents.body })
            .from(schema.tables.documents)
            .orderBy(asc(schema.tables.documents.label)),
        ).toEqual(expected);
        expect(
          await db
            .select({ label: schema.tables.documents.label, body: sql`${schema.tables.documents.body}` })
            .from(schema.tables.documents)
            .orderBy(asc(schema.tables.documents.label)),
        ).toEqual(expected);
        expect(
          await db
            .select({
              label: schema.tables.documents.label,
              body: sql`${schema.tables.documents.body}`.mapWith((value) => v.parse(json, value)),
            })
            .from(schema.tables.documents)
            .orderBy(asc(schema.tables.documents.label)),
        ).toEqual(expected);
        expect((await db.execute(sql`select label, body from public.documents order by label`)).rows).toEqual(expected);
        expect(
          await db._.session.arrays<[string, JsonValue | null]>(
            sql`select label, body from public.documents order by label`,
          ),
        ).toEqual(fixtures.map(({ label, value }) => [label, value]));
        const custom = db._.session.prepareQuery(
          { sql: "select body from public.documents order by label", params: [] },
          "arrays",
          false,
          // oxlint-disable-next-line anti-slop/no-unknown-parameters -- A custom Drizzle mapper validates the actual untrusted driver row boundary.
          (rows: unknown[]) => v.parse(v.array(v.array(json)), rows),
        );
        expect(await custom.execute()).toEqual(fixtures.map(({ value }) => [value]));
      });
      const exact = jsonDocument('{ "number": 9223372036854775807.123456789 }');
      // Shared-pool calls run outside an owned transaction and overlap across actual driver awaits.
      for (let iteration = 0; iteration < 3; iteration++) {
        const [mapped, raw, custom] = await Promise.all([
          (async () => {
            await Promise.resolve();
            return connection.db
              .select({
                label: schema.tables.documents.label,
                body: schema.tables.documents.body,
                exact: identityJson(exact),
              })
              .from(schema.tables.documents)
              .innerJoin(sql`(select pg_sleep(0.01)) delay`, sql`true`)
              .orderBy(asc(schema.tables.documents.label));
          })(),
          (async () => {
            await Promise.resolve();
            return connection.db.execute(
              sql`select label, body from public.documents cross join lateral (select pg_sleep(0.01)) delay order by label`,
            );
          })(),
          (async () => {
            await Promise.resolve();
            return connection.db._.session
              .prepareQuery(
                {
                  sql: "select body from public.documents cross join lateral (select pg_sleep(0.01)) delay order by label",
                  params: [],
                },
                "arrays",
                false,
                // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Concurrent custom mapper validates parsed driver values and rejects private transport envelopes.
                (rows: unknown[]) => v.parse(v.array(v.array(json)), rows),
              )
              .execute();
          })(),
        ]);
        expect(mapped).toEqual(expected.map((row) => ({ ...row, exact })));
        expect(raw.rows).toEqual(expected);
        expect(custom).toEqual(fixtures.map(({ value }) => [value]));
      }
    } finally {
      await connection.close();
    }
  });
});

test.skipIf(!connectionString)(
  "prepared lossless JSON expressions retain native JSONB alias ordering and composition",
  async () => {
    await withExtensionDatabase(async (url) => {
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      const document = '{ "z": 1, "a": 9223372036854775807.123456789, "z": 2 }';
      try {
        await connection.db.execute(installIdentityFunctions);
        await connection.transaction(async (db) => {
          const prepared = db
            .select({
              exact: identityJson(jsonDocument(document)),
              normalized: identityJsonb(jsonbDocument(document)),
              jsonNull: identityJson(jsonDocument("null")),
              sqlNull: identityJson(null),
            })
            .from(sql`(values (1)) fixture(id)`)
            .prepare("lossless_json_identity");
          const expected = [
            {
              exact: jsonDocument(document),
              normalized: jsonbDocument('{"a": 9223372036854775807.123456789, "z": 2}'),
              jsonNull: jsonDocument("null"),
              sqlNull: null,
            },
          ];
          expect(await prepared.execute()).toEqual(expected);
          expect(await prepared.execute()).toEqual(expected);
          const value = identityJsonb(sql`fixture.value`).as("document");
          const ordered = db
            .select({ value })
            .from(sql`(values ('2'::jsonb), ('10'::jsonb)) fixture(value)`)
            .orderBy(asc(value));
          expect(await ordered).toEqual([{ value: jsonbDocument("2") }, { value: jsonbDocument("10") }]);
          const selected = ordered.as("selected");
          expect(await db.select({ value: identityJsonb(sql`${selected.value}`) }).from(selected)).toEqual([
            { value: jsonbDocument("2") },
            { value: jsonbDocument("10") },
          ]);
        });
      } finally {
        await connection.close();
      }
    });
  },
);

test.skipIf(!connectionString)(
  "nested JSON relations preserve ordinary values and lossless extension fields and extras",
  async () => {
    await withExtensionDatabase(async (url) => {
      // Synthetic domains characterize storage transport only; they do not claim a Neon extension contract.
      const descriptor = {
        name: "pg_jsonschema",
        version: "0.3.4",
        schema: "fixture_json",
        apiSupport: { status: "verified", digest: "local-domain-codec-fixture" },
      } as const;
      const documentValue = {
        kind: "object",
        properties: { type: { kind: "string" }, text: { kind: "string" } },
      } as const;
      const search = { filter: false, comparison: false, order: false, text: false } as const;
      const jsonField = createExtensionField({
        extension: descriptor,
        member: "fixture:json_document",
        type: "json_document",
        codec: jsonCodec,
        value: documentValue,
        search,
      });
      const jsonbField = createExtensionField({
        extension: descriptor,
        member: "fixture:jsonb_document",
        type: "jsonb_document",
        codec: jsonbCodec,
        value: documentValue,
        search,
      });
      const schema = defineSchema((fields) => ({
        parents: { label: fields.text().notNull(), body: fields.json() },
        children: {
          label: fields.text().notNull(),
          parentId: fields.reference("parents").notNull(),
          body: fields.json(),
          exact: jsonField,
          normalized: jsonbField,
        },
      }));
      const relations = defineRelations(schema.tables, (r) => ({
        parents: { children: r.many.children({ from: r.parents._id, to: r.children.parentId }) },
      }));
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      const document = '{ "z": 1, "a": 9223372036854775807.123456789, "z": 2 }';
      try {
        await connection.db.execute(installIdentityFunctions);
        await connection.db.execute(
          sql`create schema fixture_json; create domain fixture_json.json_document as json; create domain fixture_json.jsonb_document as jsonb; create table public.parents ("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, label text not null, body jsonb); create table public.children ("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, label text not null, parent_id uuid not null, body jsonb, exact fixture_json.json_document, normalized fixture_json.jsonb_document)`,
        );
        const [parent] = await connection.db
          .insert(schema.tables.parents)
          .values({ label: "parent", body: "parent string" })
          .returning();
        if (!parent) throw new Error("Missing JSON relation parent");
        await connection.db.insert(schema.tables.children).values([
          {
            label: "object",
            parentId: parent._id,
            body: { array: [1, false, null] },
            exact: jsonDocument(document),
            normalized: jsonbDocument(document),
          },
          {
            label: "string",
            parentId: parent._id,
            body: '{"looks":"like JSON"}',
            exact: jsonDocument('"text"'),
            normalized: jsonbDocument('"text"'),
          },
          {
            label: "null",
            parentId: parent._id,
            body: null,
            exact: jsonDocument("null"),
            normalized: jsonbDocument("null"),
          },
          { label: "sql-null", parentId: parent._id },
        ]);
        await connection.transaction(async (db) => {
          expect(
            await db
              .select({ exact: schema.tables.children.exact, normalized: schema.tables.children.normalized })
              .from(schema.tables.children)
              .where(sql`${schema.tables.children.label} = 'object'`),
          ).toEqual([
            {
              exact: jsonDocument(document),
              normalized: jsonbDocument('{"a": 9223372036854775807.123456789, "z": 2}'),
            },
          ]);
          expect(
            await db.query.parents.findMany({
              columns: { label: true, body: true },
              extras: { exact: () => identityJson(jsonDocument(document)) },
              with: {
                children: {
                  columns: { label: true, body: true, exact: true, normalized: true },
                  orderBy: { label: "asc" },
                  extras: {
                    document: () => identityJson(jsonDocument(document)),
                    binary: () => identityJsonb(jsonbDocument(document)),
                  },
                },
              },
            }),
          ).toEqual([
            {
              label: "parent",
              body: "parent string",
              exact: jsonDocument(document),
              children: [
                { label: "null", body: null, exact: jsonDocument("null"), normalized: jsonbDocument("null") },
                {
                  label: "object",
                  body: { array: [1, false, null] },
                  exact: jsonDocument(document),
                  normalized: jsonbDocument('{"a": 9223372036854775807.123456789, "z": 2}'),
                },
                { label: "sql-null", body: null, exact: null, normalized: null },
                {
                  label: "string",
                  body: '{"looks":"like JSON"}',
                  exact: jsonDocument('"text"'),
                  normalized: jsonbDocument('"text"'),
                },
              ].map((child) => ({
                ...child,
                document: jsonDocument(document),
                binary: jsonbDocument('{"a": 9223372036854775807.123456789, "z": 2}'),
              })),
            },
          ]);
        });
      } finally {
        await connection.close();
      }
    });
  },
);
