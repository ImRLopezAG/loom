import { test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, eq, sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  createLqueryCodec,
  createLtxtqueryCodec,
  lquery,
  ltxtquery,
  type Lquery,
  type Ltxtquery,
} from "../../../apps/loom/src/core/extensions/ltree-query-codecs";
import { createLtreeCodec } from "../../../apps/loom/src/core/extensions/ltree-codec";
import { booleanCodec, nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import {
  checkedExtensionExpression,
  createSqlOperator,
  extensionSqlDialect,
  extensionSqlType,
} from "../../../apps/loom/src/core/extensions/sql";
import { createExtensionField } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/ltree.json";

const schemaName = 'Ltree "Scalar_日本';
const qualifiedSchema = pg.escapeIdentifier(schemaName);
const queryType = `${qualifiedSchema}."lquery"`;
const textQueryType = `${qualifiedSchema}."ltxtquery"`;
const queryCodec = createLqueryCodec(schemaName);
const textQueryCodec = createLtxtqueryCodec(schemaName);
const nullableQuery = nullableCodec(queryCodec);
const nullableTextQuery = nullableCodec(textQueryCodec);
const matchesQuery = createSqlOperator({
  schema: schemaName,
  name: "~",
  member: "operator:$extension:ltree.~($extension:ltree.ltree,$extension:ltree.lquery)",
  left: nullableCodec(createLtreeCodec(schemaName)),
  right: nullableQuery,
  result: nullableCodec(booleanCodec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
const matchesTextQuery = createSqlOperator({
  schema: schemaName,
  name: "@",
  member: "operator:$extension:ltree.@($extension:ltree.ltree,$extension:ltree.ltxtquery)",
  left: nullableCodec(createLtreeCodec(schemaName)),
  right: nullableTextQuery,
  result: nullableCodec(booleanCodec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
const queryExpression = (input: string | null) =>
  checkedExtensionExpression(
    sql`${sql.param(nullableQuery.encode(input))}::${extensionSqlType(schemaName, "lquery")}`,
    nullableQuery,
    [],
    undefined,
    "type:$extension:ltree.lquery",
  );
const textQueryExpression = (input: string | null) =>
  checkedExtensionExpression(
    sql`${sql.param(nullableTextQuery.encode(input))}::${extensionSqlType(schemaName, "ltxtquery")}`,
    nullableTextQuery,
    [],
    undefined,
    "type:$extension:ltree.ltxtquery",
  );

async function withLtree(work: (client: pg.Client, url: string) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      const [version] = (await client.query("select current_setting('server_version_num') version")).rows;
      assert.ok(version);
      assert.equal(version.version, "180006");
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
      const [locale] = (
        await client.query("select datctype,datcollate from pg_database where datname=current_database()")
      ).rows;
      assert.ok(locale);
      assert.ok(
        (locale.datctype === "en_US.utf8" && locale.datcollate === "en_US.utf8") ||
          (locale.datctype === "C.UTF-8" && locale.datcollate === "C.UTF-8"),
        "Uncharacterized ltree query locale",
      );
      await work(client, url);
    } finally {
      await client.end();
    }
  });
}

test("ltree.queryScalars.backendCanonicalTextAndNativeDecodeEncodeRoundTrips", async () => {
  await withLtree(async (client) => {
    // Independent expected outputs retained by ROOT on local PG18.6 and Neon; no JS normalization.
    for (const { type, codec, nullable, cases, malformed, operator } of [
      {
        type: queryType,
        codec: queryCodec,
        nullable: nullableQuery,
        cases: [
          { input: "Top.*", output: "Top.*", matches: true },
          { input: "*.sport*@.*", output: "*.sport@*.*", matches: false },
          { input: "日本語.*", output: "日本語.*", matches: false },
          { input: "foo-bar", output: "foo-bar", matches: false },
          { input: "*{0,2}.foo|bar", output: "*{,2}.foo|bar", matches: false },
        ],
        malformed: ["", "a..b", "a b", "!"],
        operator: "~",
      },
      {
        type: textQueryType,
        codec: textQueryCodec,
        nullable: nullableTextQuery,
        cases: [
          { input: "Top & Science", output: "Top & Science", matches: true },
          { input: "Science & Top", output: "Science & Top", matches: true },
          { input: "Top & !Transportation", output: "Top & !Transportation", matches: true },
          { input: "日本語 | Science", output: "日本語 | Science", matches: true },
          { input: "foo_bar%*", output: "foo_bar%*", matches: false },
          { input: "Top | (Science & !Math)", output: "Top | Science & !Math", matches: true },
        ],
        malformed: ["", "Top && Science", "(", "!"],
        operator: "@",
      },
    ]) {
      for (const { input, output, matches } of cases) {
        assert.equal(codec.encode(input), input);
        const [native] = (
          await client.query(
            `select $1::${type} value,$1::${type}::text text,pg_catalog.pg_typeof($1::${type})=$2::regtype native`,
            [codec.encode(input), type],
          )
        ).rows;
        assert.ok(native);
        assert.deepEqual(native, { value: output, text: output, native: true });
        const decoded = codec.decode(native.value);
        assert.equal(decoded, output);
        assert.deepEqual(
          (
            await client.query(`select $1::${type}::text value,pg_catalog.pg_typeof($1::${type})=$2::regtype native`, [
              codec.encode(decoded),
              type,
            ])
          ).rows,
          [{ value: output, native: true }],
        );
        assert.deepEqual(
          (
            await client.query(
              `select 'Top.Science'::${qualifiedSchema}."ltree" operator(${qualifiedSchema}.${operator}) $1::${type} matches`,
              [codec.encode(decoded)],
            )
          ).rows,
          [{ matches }],
        );
      }
      const [missing] = (await client.query(`select NULL::${type} value`)).rows;
      assert.ok(missing);
      assert.equal(nullable.decode(missing.value), null);
      assert.deepEqual((await client.query(`select $1::${type} value`, [nullable.encode(null)])).rows, [
        { value: null },
      ]);
      for (const input of malformed) {
        assert.equal(codec.encode(input), input);
        await assert.rejects(client.query(`select $1::${type}`, [codec.encode(input)]), { code: "42601" });
      }
    }
  });
});

test("ltree.queryScalars.nativeOperatorIdentityAndTransactionComposition", async () => {
  await withLtree(async (client, url) => {
    const dialect = extensionSqlDialect(nodePgCodecs);
    for (const { expression, operator, type, parameters } of [
      {
        expression: matchesQuery("Top.Science", "Top.*"),
        operator: "~",
        type: queryType,
        parameters: ["Top.Science", "Top.*"],
      },
      {
        expression: matchesTextQuery("Top.Science", "Top & Science"),
        operator: "@",
        type: textQueryType,
        parameters: ["Top.Science", "Top & Science"],
      },
    ]) {
      const compiled = dialect.sqlToQuery(expression);
      assert.equal(
        compiled.sql,
        `($1::${qualifiedSchema}."ltree" operator(${qualifiedSchema}.${operator}) $2::${type})`,
      );
      assert.deepEqual(compiled.params, parameters);
      // ROOT observed SQLSTATE 42883 for these calls with a pg_catalog.text right operand on both providers.
      assert.deepEqual((await client.query(`select ${compiled.sql} matches`, compiled.params)).rows, [
        { matches: true },
      ]);
    }
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
            pattern: queryExpression("*.sport*@.*"),
            search: textQueryExpression("Top | (Science & !Math)"),
            missingPattern: queryExpression(null),
            missingSearch: textQueryExpression(null),
            queryMatch: matchesQuery("Top.Science", "Top.*"),
            textMatch: matchesTextQuery("Top.Science", "Top & Science"),
            composedQuery: matchesQuery("Top.Science", queryExpression("Top.*")),
            composedText: matchesTextQuery("Top.Science", textQueryExpression("Top & Science")),
            nullQueryLeft: matchesQuery(null, "Top.*"),
            nullQueryRight: matchesQuery("Top.Science", null),
            nullTextLeft: matchesTextQuery(null, "Top"),
            nullTextRight: matchesTextQuery("Top.Science", null),
          })
          .from(sql`(values (1)) fixture(id)`)
          .where(matchesQuery("Top.Science", queryExpression("Top.*"))),
      );
      assert.deepEqual(selected, [
        {
          pattern: "*.sport@*.*",
          search: "Top | Science & !Math",
          missingPattern: null,
          missingSearch: null,
          queryMatch: true,
          textMatch: true,
          composedQuery: true,
          composedText: true,
          nullQueryLeft: null,
          nullQueryRight: null,
          nullTextLeft: null,
          nullTextRight: null,
        },
      ]);
      const [row] = selected;
      assert.ok(row);
      const decodedPattern: Lquery | null = row.pattern;
      const decodedSearch: Ltxtquery | null = row.search;
      assert.equal(decodedPattern, "*.sport@*.*");
      assert.equal(decodedSearch, "Top | Science & !Math");
      const queryFiltered = await connection.transaction((db) =>
        db
          .select({ matches: matchesQuery("Top.Science", "Other.*") })
          .from(sql`(values (1)) fixture(id)`)
          .where(matchesQuery("Top.Science", "Other.*")),
      );
      const textFiltered = await connection.transaction((db) =>
        db
          .select({ matches: matchesTextQuery("Top.Science", "Other") })
          .from(sql`(values (1)) fixture(id)`)
          .where(matchesTextQuery("Top.Science", "Other")),
      );
      assert.deepEqual(queryFiltered, []);
      assert.deepEqual(textFiltered, []);
    } finally {
      await connection.close();
    }
  });
});

const noSearch = { filter: false, comparison: false, order: false, text: false } as const;
// Private field descriptors use the captured manifest; they do not register a public adapter.
const patternField = () =>
  createExtensionField<Lquery, typeof noSearch>({
    extension: {
      name: "ltree",
      version: "1.3",
      schema: schemaName,
      apiSupport: { status: "verified", digest: manifest.digest },
    },
    member: "type:$extension:ltree.lquery",
    type: "lquery",
    codec: queryCodec,
    value: { kind: "string" },
    search: noSearch,
  });
const searchField = () =>
  createExtensionField<Ltxtquery, typeof noSearch>({
    extension: {
      name: "ltree",
      version: "1.3",
      schema: schemaName,
      apiSupport: { status: "verified", digest: manifest.digest },
    },
    member: "type:$extension:ltree.ltxtquery",
    type: "ltxtquery",
    codec: textQueryCodec,
    value: { kind: "string" },
    search: noSearch,
  });
const fieldSchema = defineSchema(
  (fields) => ({
    docs: {
      pattern: patternField(),
      search: searchField(),
      fallbackPattern: patternField().notNull().default(lquery("*{0,2}.foo|bar")),
      fallbackSearch: searchField().notNull().default(ltxtquery("Top | (Science & !Math)")),
    },
    children: { parentId: fields.reference("docs").notNull(), pattern: patternField(), search: searchField() },
  }),
  { namespace: "app" },
);
const { docs, children } = fieldSchema.tables;
const relations = defineRelations(fieldSchema.tables, (r) => ({
  docs: { children: r.many.children({ from: r.docs._id, to: r.children.parentId }) },
  children: { parent: r.one.docs({ from: r.children.parentId, to: r.docs._id }) },
}));

test("ltree.queryScalars.storedFieldsDefaultsNestedBrandsAndNativeRollback", async () => {
  await withLtree(async (client, url) => {
    assert.deepEqual(patternField().metadata.extension?.value, { kind: "string" });
    assert.deepEqual(searchField().metadata.extension?.value, { kind: "string" });
    for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(fieldSchema)))
      await client.query(statement);
    const connection = await connectDatabase({ schema: fieldSchema, relations, connectionString: url });
    try {
      const [root] = await connection.transaction((db) =>
        db
          .insert(docs)
          .values({ pattern: lquery("Top.*"), search: ltxtquery("Top & Science") })
          .returning(),
      );
      assert.ok(root);
      assert.equal(root.fallbackPattern, "*{,2}.foo|bar");
      assert.equal(root.fallbackSearch, "Top | Science & !Math");
      assert.deepEqual(
        (
          await client.query(
            `select pg_catalog.pg_typeof(pattern)=$1::regtype pattern_native,pg_catalog.pg_typeof(search)=$2::regtype search_native from app.docs`,
            [queryType, textQueryType],
          )
        ).rows,
        [{ pattern_native: true, search_native: true }],
      );
      const inserted = await connection.transaction((db) =>
        db
          .insert(children)
          .values([
            { parentId: root._id, pattern: lquery("*.sport*@.*"), search: ltxtquery("Top | (Science & !Math)") },
            { parentId: root._id, pattern: null, search: null },
          ])
          .returning({ id: children._id, pattern: children.pattern, search: children.search }),
      );
      assert.equal(inserted.length, 2);
      const ordinary = await connection.transaction((db) =>
        db
          .select({ pattern: docs.pattern, search: docs.search, matches: matchesTextQuery("Top.Science", docs.search) })
          .from(docs)
          .where(matchesQuery("Top.Science", docs.pattern)),
      );
      assert.deepEqual(ordinary, [{ pattern: "Top.*", search: "Top & Science", matches: true }]);
      const nested = await connection.transaction((db) =>
        db.query.docs.findMany({
          columns: { pattern: true, search: true, fallbackPattern: true, fallbackSearch: true },
          with: { children: { columns: { _id: true, pattern: true, search: true } } },
        }),
      );
      assert.equal(nested.length, 1);
      const [parent] = nested;
      assert.ok(parent);
      const decodedPattern: Lquery | null = parent.pattern;
      const decodedSearch: Ltxtquery | null = parent.search;
      assert.equal(decodedPattern, "Top.*");
      assert.equal(decodedSearch, "Top & Science");
      assert.equal(parent.fallbackPattern, "*{,2}.foo|bar");
      assert.equal(parent.fallbackSearch, "Top | Science & !Math");
      assert.equal(parent.children.length, 2);
      for (const child of parent.children) {
        const expected = inserted.find((row) => row.id === child._id);
        assert.ok(expected);
        assert.equal(child.pattern, expected.pattern);
        assert.equal(child.search, expected.search);
        const pattern: Lquery | null = child.pattern;
        const search: Ltxtquery | null = child.search;
        assert.deepEqual(
          (
            await client.query("select pattern::text pattern,search::text search from app.children where _id=$1", [
              child._id,
            ])
          ).rows,
          [{ pattern, search }],
        );
      }
      assert.ok(
        parent.children.some((child) => child.pattern === "*.sport@*.*" && child.search === "Top | Science & !Math"),
      );
      assert.ok(parent.children.some((child) => child.pattern === null && child.search === null));
      for (const { column, type, codec, temporary, malformed } of [
        { column: "pattern", type: queryType, codec: queryCodec, temporary: "Temporary.*", malformed: "a..b" },
        {
          column: "search",
          type: textQueryType,
          codec: textQueryCodec,
          temporary: "Temporary",
          malformed: "Top && Science",
        },
      ]) {
        await client.query("begin");
        try {
          await client.query(`update app.docs set ${pg.escapeIdentifier(column)}=$1::${type} where _id=$2`, [
            codec.encode(temporary),
            root._id,
          ]);
          await assert.rejects(
            client.query(`update app.docs set ${pg.escapeIdentifier(column)}=$1::${type} where _id=$2`, [
              codec.encode(malformed),
              root._id,
            ]),
            { code: "42601" },
          );
        } finally {
          await client.query("rollback");
        }
        assert.deepEqual(
          (
            await client.query("select pattern::text pattern,search::text search from app.docs where _id=$1", [
              root._id,
            ])
          ).rows,
          [{ pattern: "Top.*", search: "Top & Science" }],
        );
      }
      for (const malformed of [queryExpression("a..b"), textQueryExpression("Top && Science")]) {
        await assert.rejects(
          connection.transaction(async (db) => {
            await db
              .update(docs)
              .set({ pattern: lquery("Temporary.*"), search: ltxtquery("Temporary") })
              .where(eq(docs._id, root._id));
            await db.select({ value: malformed }).from(docs);
          }),
        );
        assert.deepEqual(
          (
            await client.query("select pattern::text pattern,search::text search from app.docs where _id=$1", [
              root._id,
            ])
          ).rows,
          [{ pattern: "Top.*", search: "Top & Science" }],
        );
      }
    } finally {
      await connection.close();
    }
  });
});
