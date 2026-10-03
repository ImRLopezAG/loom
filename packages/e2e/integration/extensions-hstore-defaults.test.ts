import { test } from "bun:test";
import assert from "node:assert/strict";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { hstoreEntries, orderedHstoreEntries } from "../fixtures/hstore-codec";
import { createExtensionField } from "../../../apps/loom/src/core/extensions/fields";
import type { ExtensionValueSchema } from "../../../apps/loom/src/core/extensions/fields";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import {
  createHstoreArrayCodec,
  createHstoreCodec,
  type HstoreValue,
} from "../../../apps/loom/src/core/extensions/hstore-codec";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";

// Fields come from the private createExtensionField seam. PostgreSQL itself decides what each installed default means.
const unicodeNamespace = 'Hstore_"Codec_日本';
const noSearch = { filter: false, comparison: false, order: false, text: false } as const;
const nullableText: ExtensionValueSchema = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] };
const mappingSchema: ExtensionValueSchema = {
  kind: "object",
  properties: {
    entries: {
      kind: "array",
      items: { kind: "object", properties: { key: { kind: "string" }, value: nullableText } },
    },
  },
};
const arraySchema: ExtensionValueSchema = {
  kind: "object",
  properties: {
    dimensions: {
      kind: "array",
      items: {
        kind: "object",
        properties: { lowerBound: { kind: "number", integer: true }, length: { kind: "number", integer: true } },
      },
    },
    values: { kind: "array", items: { kind: "union", variants: [mappingSchema, { kind: "null" }] } },
  },
};
const descriptor = (schema: string) => ({
  name: "hstore",
  version: "1.8",
  schema,
  apiSupport: {
    status: "verified" as const,
    digest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1",
  },
});
const scalarField = (schema: string) =>
  createExtensionField({
    extension: descriptor(schema),
    member: "type:$extension:hstore.hstore",
    type: "hstore",
    codec: createHstoreCodec(schema),
    value: mappingSchema,
    search: noSearch,
  });
const arrayField = (schema: string) =>
  createExtensionField({
    extension: descriptor(schema),
    member: "type:$extension:hstore._hstore",
    type: "hstore",
    array: true,
    codec: createHstoreArrayCodec(schema),
    value: arraySchema,
    search: noSearch,
  });
const pair = (key: string, value: string | null) => ({ key, value });
const mapping = (...entries: readonly { key: string; value: string | null }[]): HstoreValue => ({ entries });
const list = (lowerBound: number, ...values: (HstoreValue | null)[]): PostgreSqlArray<HstoreValue> =>
  values.length ? { dimensions: [{ lowerBound, length: values.length }], values } : { dimensions: [], values: [] };

// Unsorted keys, stored NULL, empty text, text that spells NULL and a quote, to cover every distinction at once.
const scalarDefault = mapping(pair("empty", ""), pair("default-key", null), pair("NULL", "NULL"), pair("o'k", 'q"\\'));
const arrayDefault = list(
  3,
  mapping(pair("b", "2"), pair("a", null)),
  null,
  mapping(),
  mapping(pair("zz", ""), pair("y", "NULL")),
);
const q = (name: string) => pg.escapeIdentifier(name);

const arrayRows = v.array(
  v.strictObject({
    dims: v.nullable(v.string()),
    ordinal: v.nullable(v.number()),
    missing: v.nullable(v.boolean()),
    key: v.nullable(v.string()),
    value: v.nullable(v.string()),
  }),
);

async function installedDefault(client: pg.Client, table: string, column: string): Promise<string> {
  const rows = v.parse(
    v.array(v.strictObject({ expression: v.string() })),
    (
      await client.query(
        `select pg_catalog.pg_get_expr(d.adbin,d.adrelid) expression from pg_catalog.pg_attrdef d
         join pg_catalog.pg_attribute a on a.attrelid=d.adrelid and a.attnum=d.adnum
         where d.adrelid=$1::regclass and a.attname=$2`,
        [table, column],
      )
    ).rows,
  );
  assert.equal(rows.length, 1);
  return rows[0]!.expression;
}
/** Evaluates the installed default with hstore's own each(), independent of any Loom codec. */
async function nativeMapping(client: pg.Client, schema: string, expression: string) {
  const rows = v.parse(
    hstoreEntries,
    (await client.query(`select key, value from ${q(schema)}.each(${expression}) order by key collate "C"`)).rows,
  );
  return rows;
}
async function nativeArray(client: pg.Client, schema: string, expression: string) {
  const rows = v.parse(
    arrayRows,
    (
      await client.query(
        `with input as (select ${expression} value)
         select pg_catalog.array_dims(input.value) dims, leaf.ordinal::integer ordinal, leaf.element is null missing,
           pair.key, pair.value
         from input cross join lateral pg_catalog.unnest(input.value) with ordinality leaf(element, ordinal)
         left join lateral ${q(schema)}.each(leaf.element) pair on true
         order by leaf.ordinal, pair.key collate "C"`,
      )
    ).rows,
  );
  const leaves = new Map<number, { key: string; value: string | null }[] | null>();
  for (const row of rows) {
    assert.ok(row.ordinal !== null && row.missing !== null);
    const entries = leaves.get(row.ordinal) ?? (row.missing ? null : []);
    if (entries && row.key !== null) entries.push({ key: row.key, value: row.value });
    leaves.set(row.ordinal, entries);
  }
  return { dims: rows[0]?.dims ?? null, leaves: [...leaves.values()] };
}

async function withHstore(
  schema: string,
  version: string,
  work: (client: pg.Client, database: NodePgDatabase) => Promise<void>,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      if (schema !== "public") await client.query(`create schema ${q(schema)}`);
      await client.query(`create extension hstore with schema ${q(schema)} version '${version}'`);
      const installed = await client.query(
        "select e.extversion version, n.nspname schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='hstore'",
      );
      assert.deepEqual(installed.rows, [{ version, schema }]);
      await work(client, drizzle({ client }));
    } finally {
      await client.end();
    }
  });
}

// Quoted Unicode, plain lowercase and search-path-unqualified installation namespaces take different cast spellings.
for (const schema of [unicodeNamespace, "ext", "public"])
  test(`hstoreDefaults.nativeSnapshotRoundTripsScalarAndArrayDefaultsInstalledIn(${schema})`, async () => {
    await withHstore(schema, "1.8", async (client, database) => {
      const fields = defineSchema(
        () => ({
          docs: {
            one: scalarField(schema).notNull().default(scalarDefault),
            none: scalarField(schema),
            blank: scalarField(schema).default(mapping()),
            many: arrayField(schema).notNull().default(list(1)),
            some: arrayField(schema).default(arrayDefault),
            nothing: arrayField(schema),
          },
        }),
        { namespace: "app" },
      );
      const desired = await createSnapshot(fields);
      for (const statement of await migrationStatements(await emptySnapshot("app"), desired))
        await client.query(statement);
      const inspected = await inspectSnapshot(database, "app");
      assert.equal(snapshotHash(inspected), snapshotHash(desired));
      assert.deepEqual(await migrationStatements(inspected, desired), []);

      const one = await installedDefault(client, "app.docs", "one");
      assert.deepEqual(
        await nativeMapping(client, schema, one),
        orderedHstoreEntries(scalarDefault.entries).map((entry) => ({ key: entry.key, value: entry.value })),
      );
      const blank = await installedDefault(client, "app.docs", "blank");
      assert.deepEqual(await nativeMapping(client, schema, blank), []);
      const many = await installedDefault(client, "app.docs", "many");
      assert.deepEqual(await nativeArray(client, schema, many), { dims: null, leaves: [] });
      const some = await installedDefault(client, "app.docs", "some");
      const observed = await nativeArray(client, schema, some);
      assert.equal(observed.dims, "[3:6]");
      assert.deepEqual(observed.leaves, [
        [
          { key: "a", value: null },
          { key: "b", value: "2" },
        ],
        null,
        [],
        [
          { key: "y", value: "NULL" },
          { key: "zz", value: "" },
        ],
      ]);
      for (const absent of ["none", "nothing"])
        assert.equal(
          (
            await client.query(
              "select 1 from pg_attrdef d join pg_attribute a on a.attrelid=d.adrelid and a.attnum=d.adnum where d.adrelid='app.docs'::regclass and a.attname=$1",
              [absent],
            )
          ).rowCount,
          0,
        );
    });
  });

test("hstoreDefaults.nativeAlterReplacesAnEquivalentlyReorderedDefaultOnlyWhenTheMeaningChanges", async () => {
  await withHstore(unicodeNamespace, "1.8", async (client, database) => {
    const build = (value: HstoreValue, items: PostgreSqlArray<HstoreValue>) =>
      createSnapshot(
        defineSchema(
          () => ({
            docs: {
              one: scalarField(unicodeNamespace).notNull().default(value),
              some: arrayField(unicodeNamespace).default(items),
            },
          }),
          { namespace: "app" },
        ),
      );
    const first = await build(
      mapping(pair("empty", ""), pair("a", null)),
      list(1, mapping(pair("b", "2"), pair("a", "1"))),
    );
    for (const statement of await migrationStatements(await emptySnapshot("app"), first)) await client.query(statement);
    // Native storage reorders entries; reordering the declaration changes nothing.
    const reordered = await build(
      mapping(pair("a", null), pair("empty", "")),
      list(1, mapping(pair("a", "1"), pair("b", "2"))),
    );
    assert.deepEqual(await migrationStatements(first, reordered), []);
    assert.deepEqual(await migrationStatements(await inspectSnapshot(database, "app"), reordered), []);
    const changed = await build(
      mapping(pair("empty", ""), pair("a", "")),
      list(1, mapping(pair("b", "2"), pair("a", "2"))),
    );
    const statements = await migrationStatements(await inspectSnapshot(database, "app"), changed);
    assert.equal(statements.length, 2);
    for (const statement of statements) await client.query(statement);
    const after = await inspectSnapshot(database, "app");
    assert.equal(snapshotHash(after), snapshotHash(changed));
    assert.deepEqual(await migrationStatements(after, changed), []);
    assert.deepEqual(await nativeMapping(client, unicodeNamespace, await installedDefault(client, "app.docs", "one")), [
      pair("a", ""),
      pair("empty", ""),
    ]);
    assert.deepEqual(
      (await nativeArray(client, unicodeNamespace, await installedDefault(client, "app.docs", "some"))).leaves,
      [[pair("a", "2"), pair("b", "2")]],
    );
  });
});

test("hstoreDefaults.nativeSameNamedNonExtensionTypesAndNonliteralExpressionsKeepTheirDefaults", async () => {
  await withHstore(unicodeNamespace, "1.8", async (client, database) => {
    const hstore = `${q(unicodeNamespace)}.hstore`;
    await client.query(`create schema shadow; create domain shadow.hstore as text`);
    await client.query(`create table shadow.docs(value shadow.hstore default 'b=>1, aa=>2')`);
    const shadow = await inspectSnapshot(database, "shadow");
    const shadowValue = shadow.ddl.find((entity) => entity.entityType === "columns" && entity.name === "value");
    // The domain is not an extension member, so its default keeps the declared entry order.
    assert.ok(shadowValue?.entityType === "columns" && shadowValue.default);
    assert.ok(shadowValue.default.includes("'b=>1, aa=>2'"));

    await client.query(`create schema expr`);
    await client.query(
      `create table expr.docs(value ${hstore} default ${q(unicodeNamespace)}.hstore('b','1') operator(${q(unicodeNamespace)}.||) ${q(unicodeNamespace)}.hstore('aa','2'))`,
    );
    const expression = (await inspectSnapshot(database, "expr")).ddl.find(
      (entity) => entity.entityType === "columns" && entity.name === "value",
    );
    assert.ok(expression?.entityType === "columns" && expression.default);
    assert.equal(expression.default.startsWith("'"), false);
    assert.match(expression.default, /hstore\(/);
    assert.deepEqual(
      await nativeMapping(client, unicodeNamespace, await installedDefault(client, "expr.docs", "value")),
      [pair("aa", "2"), pair("b", "1")],
    );
  });
});

test("hstoreDefaults.nativeOtherExtensionVersionKeepsItsNativeDefaultOrder", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const versions = await client.query("select version from pg_available_extension_versions where name='hstore'");
      assert.ok(
        versions.rows.some((row) => row.version === "1.7"),
        "The PostgreSQL 18 fixture must offer hstore 1.7 for the other-version isolation proof",
      );
    } finally {
      await client.end();
    }
  });
  await withHstore(unicodeNamespace, "1.7", async (client, database) => {
    await client.query(`create schema legacy`);
    await client.query(
      `create table legacy.docs(value ${q(unicodeNamespace)}.hstore default '"aa"=>"2", "b"=>"1"'::${q(unicodeNamespace)}.hstore)`,
    );
    const value = (await inspectSnapshot(database, "legacy")).ddl.find(
      (entity) => entity.entityType === "columns" && entity.name === "value",
    );
    assert.ok(value?.entityType === "columns" && value.default);
    // PostgreSQL stores shorter keys first; the exact 1.8 normalization would sort "aa" before "b".
    assert.ok(value.default.indexOf('"b"=>') < value.default.indexOf('"aa"=>'));
  });
});
