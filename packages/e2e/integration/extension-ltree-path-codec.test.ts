import { test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, eq, sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createLtreeCodec, ltree, type Ltree } from "../../../apps/loom/src/core/extensions/ltree-codec";
import { nullableCodec, textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { createSqlFunction, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { createExtensionField } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/ltree.json";

const schemaName = 'Ltree "Scalar_日本';
const qualifiedSchema = pg.escapeIdentifier(schemaName);
const nativeType = `${qualifiedSchema}."ltree"`;
const codec = createLtreeCodec(schemaName);
const nlevel = createSqlFunction({
  schema: schemaName,
  name: "nlevel",
  member: "routine:$extension:ltree.nlevel($extension:ltree.ltree)",
  arguments: [nullableCodec(codec)] as const,
  result: nullableCodec(int4Codec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
const fromText = createSqlFunction({
  schema: schemaName,
  name: "text2ltree",
  member: "routine:$extension:ltree.text2ltree(pg_catalog.text)",
  arguments: [nullableCodec(textCodec)] as const,
  result: nullableCodec(codec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});

async function withLtree(work: (client: pg.Client, url: string) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      assert.equal(
        (await client.query("select current_setting('server_version_num') version")).rows[0].version,
        "180006",
      );
      await client.query(
        `create schema ${qualifiedSchema}; create extension ltree schema ${qualifiedSchema} version '1.3'`,
      );
      assert.deepEqual(
        (
          await client.query(
            "select e.extversion version,n.nspname schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='ltree'",
          )
        ).rows,
        [{ version: "1.3", schema: schemaName }],
      );
      await work(client, url);
    } finally {
      await client.end();
    }
  });
}

test("ltree.scalarCodec.nativeOutputsLocaleAndExactLimits", async () => {
  await withLtree(async (client) => {
    const locale = (await client.query("select datctype from pg_database where datname=current_database()")).rows[0]
      .datctype;
    assert.ok(["en_US.utf8", "C.UTF-8"].includes(locale), `Uncharacterized ltree locale: ${locale}`);
    // Each expected spelling and level count is independent of the candidate codec.
    const cases = [
      { input: "", levels: 0 },
      { input: "Top.Science", levels: 2 },
      { input: "foo-bar.Child_2", levels: 2 },
      { input: "日本語.é", levels: 2 },
      { input: "a".repeat(1000), levels: 1 },
      { input: Array(65535).fill("a").join("."), levels: 65535 },
    ];
    for (const { input, levels } of cases) {
      const native = await client.query(
        `select $1::${nativeType} value,$1::${nativeType}::text text,${qualifiedSchema}.nlevel($1::${nativeType}) levels,pg_catalog.pg_typeof($1::${nativeType})=$2::regtype native`,
        [input, nativeType],
      );
      assert.deepEqual(native.rows, [{ value: input, text: input, levels, native: true }]);
      assert.ok(native.rows[0]);
      assert.equal(codec.decode(native.rows[0].value), input);
      const rebound = await client.query(`select $1::${nativeType}::text value`, [codec.encode(input)]);
      assert.deepEqual(rebound.rows, [{ value: input }]);
    }
    const missing = await client.query(`select NULL::${nativeType} value,NULL::${nativeType}::text text`);
    assert.deepEqual(missing.rows, [{ value: null, text: null }]);
    assert.ok(missing.rows[0]);
    assert.equal(nullableCodec(codec).decode(missing.rows[0].value), null);
    for (const { input, code } of [
      { input: "a".repeat(1001), code: "42622" },
      { input: Array(65536).fill("a").join("."), code: "54000" },
      { input: "a..b", code: "42601" },
      { input: "a b", code: "42601" },
    ]) {
      // Transport accepts lossless text; PostgreSQL remains the syntax and limits authority.
      assert.equal(codec.encode(input), input);
      await assert.rejects(client.query(`select $1::${nativeType}`, [codec.encode(input)]), { code });
    }
  });
});

test("ltree.scalarCodec.nativeFunctionParameterTypeAndDecodedSqlOutputs", async () => {
  await withLtree(async (client, url) => {
    const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(nlevel("Top.Science"));
    assert.equal(compiled.sql, `${qualifiedSchema}."nlevel"($1::${nativeType})`);
    assert.deepEqual(compiled.params, ["Top.Science"]);
    // This previously failed with SQLSTATE 42883 when the parameter was pg_catalog.text.
    assert.deepEqual((await client.query(`select ${compiled.sql} levels`, compiled.params)).rows, [{ levels: 2 }]);
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      const selected = await connection.transaction((db) =>
        db
          .select({
            path: fromText("Top.Science"),
            levels: nlevel("Top.Science"),
            empty: fromText(""),
            emptyLevels: nlevel(""),
            missing: fromText(null),
            missingLevels: nlevel(null),
            composed: nlevel(fromText("Top.Science")),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      assert.deepEqual(selected, [
        { path: "Top.Science", levels: 2, empty: "", emptyLevels: 0, missing: null, missingLevels: null, composed: 2 },
      ]);
    } finally {
      await connection.close();
    }
  });
});

const noSearch = { filter: false, comparison: false, order: false, text: false } as const;
const pathField = () =>
  createExtensionField<Ltree, typeof noSearch>({
    extension: {
      name: "ltree",
      version: "1.3",
      schema: schemaName,
      apiSupport: { status: "verified", digest: manifest.digest },
    },
    member: "type:$extension:ltree.ltree",
    type: "ltree",
    codec,
    value: { kind: "string" },
    search: noSearch,
  });
const fieldSchema = defineSchema(
  (fields) => ({
    docs: { path: pathField(), fallback: pathField().notNull().default(ltree("Top.Default")) },
    children: { parentId: fields.reference("docs").notNull(), path: pathField() },
  }),
  { namespace: "app" },
);
const { docs, children } = fieldSchema.tables;
const relations = defineRelations(fieldSchema.tables, (r) => ({
  docs: { children: r.many.children({ from: r.docs._id, to: r.children.parentId }) },
  children: { parent: r.one.docs({ from: r.children.parentId, to: r.docs._id }) },
}));

test("ltree.scalarCodec.storedDefaultOrdinaryNestedReadsAndNativeRollback", async () => {
  await withLtree(async (client, url) => {
    for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(fieldSchema)))
      await client.query(statement);
    const connection = await connectDatabase({ schema: fieldSchema, relations, connectionString: url });
    try {
      const [root] = await connection.transaction((db) =>
        db
          .insert(docs)
          .values({ path: ltree("Top.Science") })
          .returning(),
      );
      assert.ok(root);
      assert.equal(root.path, "Top.Science");
      assert.equal(root.fallback, "Top.Default");
      const defaultType = await client.query(
        `select fallback::text value,${qualifiedSchema}.nlevel(fallback) levels,pg_catalog.pg_typeof(fallback)=$1::regtype native from app.docs`,
        [nativeType],
      );
      assert.deepEqual(defaultType.rows, [{ value: "Top.Default", levels: 2, native: true }]);
      const inserted = await connection.transaction((db) =>
        db
          .insert(children)
          .values([
            { parentId: root._id, path: ltree("foo-bar.Child_2") },
            { parentId: root._id, path: ltree("") },
            { parentId: root._id, path: null },
          ])
          .returning({ id: children._id, path: children.path }),
      );
      const ordinary = await connection.transaction((db) =>
        db.select({ path: docs.path }).from(docs).where(eq(docs._id, root._id)),
      );
      assert.deepEqual(ordinary, [{ path: "Top.Science" }]);
      const nested = await connection.transaction((db) =>
        db.query.docs.findMany({
          columns: { path: true, fallback: true },
          with: { children: { columns: { _id: true, path: true } } },
        }),
      );
      assert.equal(nested.length, 1);
      assert.equal(nested[0]!.path, "Top.Science");
      assert.equal(nested[0]!.fallback, "Top.Default");
      assert.equal(nested[0]!.children.length, 3);
      for (const child of nested[0]!.children) {
        const expected = inserted.find((row) => row.id === child._id);
        assert.ok(expected);
        assert.equal(child.path, expected.path);
        assert.deepEqual(
          (await client.query("select path::text value from app.children where _id=$1", [child._id])).rows,
          [{ value: expected.path }],
        );
      }
      // Native syntax rejection has its own SQLSTATE witness and restores the original stored row after rollback.
      await client.query("begin");
      try {
        await client.query(`update app.docs set path=$1::${nativeType} where _id=$2`, ["Temporary.Path", root._id]);
        await assert.rejects(
          client.query(`update app.docs set path=$1::${nativeType} where _id=$2`, [codec.encode("a..b"), root._id]),
          { code: "42601" },
        );
      } finally {
        await client.query("rollback");
      }
      assert.deepEqual((await client.query("select path::text value from app.docs where _id=$1", [root._id])).rows, [
        { value: "Top.Science" },
      ]);
      await assert.rejects(
        connection.transaction(async (db) => {
          await db
            .update(docs)
            .set({ path: ltree("Temporary.Path") })
            .where(eq(docs._id, root._id));
          await db.select({ value: nlevel("a..b") }).from(docs);
        }),
      );
      assert.deepEqual((await client.query("select path::text value from app.docs where _id=$1", [root._id])).rows, [
        { value: "Top.Science" },
      ]);
    } finally {
      await connection.close();
    }
  });
});
