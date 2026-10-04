import assert from "node:assert/strict";
import * as v from "valibot";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { isnApi as api, isnDescriptor, isnProofSchema, isnNativeCases, isnCastCases } from "../fixtures/isn-api";
import { isnKinds, type IsnKind } from "../../../apps/loom/src/core/extensions/adapters/isn-codecs";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/isn.json";
import { withIsnSession, type IsnSession } from "../../../apps/loom/src/tooling/extensions/operations/isn";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { isnOrdinaryProofCase, isnSchemaProofCase, isnSessionProofCase } from "../fixtures/isn-proof-cases";

const namespace = pg.escapeIdentifier(isnProofSchema);
const manifest = v.parse(extensionManifestValidator, manifestSource);
const indexSamples = {
  ean13: "9780123456786",
  isbn: "9780123456786",
  isbn13: "9780123456786",
  ismn: "9790123456785",
  ismn13: "9790123456785",
  issn: "9771234567898",
  issn13: "9771234567898",
  upc: "123456789012",
} as const;
/** Exercise every captured strategy/right-type pair through its owning native class. */
async function verifyIndexFamily(client: pg.Client, kind: IsnKind, method: "btree" | "hash") {
  const family = manifest.contract.members.find(
    (member) => member.kind === "opfamily" && member.accessMethod === method,
  );
  assert.ok(family?.kind === "opfamily");
  const operators = family.operators.filter((operator) => operator.left.name === kind);
  assert.ok(operators.length > 0);
  for (const operator of operators) {
    const right = v.parse(v.picklist(isnKinds), operator.right.name);
    const symbol = /^\$extension:isn\.([<=>]+)\(/.exec(operator.operator)?.[1];
    assert.ok(symbol && ["<", "<=", "=", ">=", ">"].includes(symbol));
    const query = `SELECT value::text AS value FROM app.${pg.escapeIdentifier(`${kind}_${method}`)} WHERE value OPERATOR(${namespace}.${symbol}) $1::${namespace}.${pg.escapeIdentifier(right)} ORDER BY value::text`;
    const args = [indexSamples[right]];
    await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
    const sequentialPlan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
    assert.match(JSON.stringify(sequentialPlan.rows), /Seq Scan/, operator.operator);
    const sequential = await client.query(query, args);
    await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
    const indexedPlan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
    assert.match(JSON.stringify(indexedPlan.rows), /Index (?:Only )?Scan/, operator.operator);
    assert.match(JSON.stringify(indexedPlan.rows), /Index Cond/, operator.operator);
    assert.deepEqual((await client.query(query, args)).rows, sequential.rows, operator.operator);
  }
}
const managed = defineSchema(
  () => ({
    ean13_btree: defineTable(
      {
        value: api.ean13.field(),
        tags: api.ean13.arrayField(),
        fallback: api.ean13.field().notNull().default(api.ean13.value("9780123456786")),
      },
      { indexes: [{ fields: ["value"], extension: api.ean13.indexes.btree() }] },
    ),
    ean13_hash: defineTable(
      {
        value: api.ean13.field(),
        tags: api.ean13.arrayField(),
        fallback: api.ean13.field().notNull().default(api.ean13.value("9780123456786")),
      },
      { indexes: [{ fields: ["value"], extension: api.ean13.indexes.hash() }] },
    ),
    isbn_btree: defineTable(
      {
        value: api.isbn.field(),
        tags: api.isbn.arrayField(),
        fallback: api.isbn.field().notNull().default(api.isbn.value("9780123456786")),
      },
      { indexes: [{ fields: ["value"], extension: api.isbn.indexes.btree() }] },
    ),
    isbn_hash: defineTable(
      {
        value: api.isbn.field(),
        tags: api.isbn.arrayField(),
        fallback: api.isbn.field().notNull().default(api.isbn.value("9780123456786")),
      },
      { indexes: [{ fields: ["value"], extension: api.isbn.indexes.hash() }] },
    ),
    isbn13_btree: defineTable(
      {
        value: api.isbn13.field(),
        tags: api.isbn13.arrayField(),
        fallback: api.isbn13.field().notNull().default(api.isbn13.value("9780123456786")),
      },
      { indexes: [{ fields: ["value"], extension: api.isbn13.indexes.btree() }] },
    ),
    isbn13_hash: defineTable(
      {
        value: api.isbn13.field(),
        tags: api.isbn13.arrayField(),
        fallback: api.isbn13.field().notNull().default(api.isbn13.value("9780123456786")),
      },
      { indexes: [{ fields: ["value"], extension: api.isbn13.indexes.hash() }] },
    ),
    ismn_btree: defineTable(
      {
        value: api.ismn.field(),
        tags: api.ismn.arrayField(),
        fallback: api.ismn.field().notNull().default(api.ismn.value("9790123456785")),
      },
      { indexes: [{ fields: ["value"], extension: api.ismn.indexes.btree() }] },
    ),
    ismn_hash: defineTable(
      {
        value: api.ismn.field(),
        tags: api.ismn.arrayField(),
        fallback: api.ismn.field().notNull().default(api.ismn.value("9790123456785")),
      },
      { indexes: [{ fields: ["value"], extension: api.ismn.indexes.hash() }] },
    ),
    ismn13_btree: defineTable(
      {
        value: api.ismn13.field(),
        tags: api.ismn13.arrayField(),
        fallback: api.ismn13.field().notNull().default(api.ismn13.value("9790123456785")),
      },
      { indexes: [{ fields: ["value"], extension: api.ismn13.indexes.btree() }] },
    ),
    ismn13_hash: defineTable(
      {
        value: api.ismn13.field(),
        tags: api.ismn13.arrayField(),
        fallback: api.ismn13.field().notNull().default(api.ismn13.value("9790123456785")),
      },
      { indexes: [{ fields: ["value"], extension: api.ismn13.indexes.hash() }] },
    ),
    issn_btree: defineTable(
      {
        value: api.issn.field(),
        tags: api.issn.arrayField(),
        fallback: api.issn.field().notNull().default(api.issn.value("9771234567898")),
      },
      { indexes: [{ fields: ["value"], extension: api.issn.indexes.btree() }] },
    ),
    issn_hash: defineTable(
      {
        value: api.issn.field(),
        tags: api.issn.arrayField(),
        fallback: api.issn.field().notNull().default(api.issn.value("9771234567898")),
      },
      { indexes: [{ fields: ["value"], extension: api.issn.indexes.hash() }] },
    ),
    issn13_btree: defineTable(
      {
        value: api.issn13.field(),
        tags: api.issn13.arrayField(),
        fallback: api.issn13.field().notNull().default(api.issn13.value("9771234567898")),
      },
      { indexes: [{ fields: ["value"], extension: api.issn13.indexes.btree() }] },
    ),
    issn13_hash: defineTable(
      {
        value: api.issn13.field(),
        tags: api.issn13.arrayField(),
        fallback: api.issn13.field().notNull().default(api.issn13.value("9771234567898")),
      },
      { indexes: [{ fields: ["value"], extension: api.issn13.indexes.hash() }] },
    ),
    upc_btree: defineTable(
      {
        value: api.upc.field(),
        tags: api.upc.arrayField(),
        fallback: api.upc.field().notNull().default(api.upc.value("123456789012")),
      },
      { indexes: [{ fields: ["value"], extension: api.upc.indexes.btree() }] },
    ),
    upc_hash: defineTable(
      {
        value: api.upc.field(),
        tags: api.upc.arrayField(),
        fallback: api.upc.field().notNull().default(api.upc.value("123456789012")),
      },
      { indexes: [{ fields: ["value"], extension: api.upc.indexes.hash() }] },
    ),
  }),
  { namespace: "app" },
);
const relations = defineRelations(managed.tables);
async function fixture(caseId: string, work: (url: string, client: pg.Client) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const version = await client.query("SELECT current_setting('server_version_num')::int AS version");
      assert.equal(Math.floor(version.rows[0].version / 10000), 18);
      await client.query(`CREATE SCHEMA ${namespace}; CREATE EXTENSION isn WITH SCHEMA ${namespace} VERSION '1.3'`);
      await observeExtensionProofDatabase(url, caseId, "isn");
      await work(url, client);
    } finally {
      await client.end();
    }
  });
}
const scalar = v.union([
  v.null(),
  v.string(),
  v.number(),
  v.boolean(),
  v.strictObject({ kind: v.picklist(isnKinds), text: v.string() }),
]);
function nativeResult(value: v.InferOutput<typeof scalar>): string | null {
  return value === null ? null : v.is(v.object({ text: v.string() }), value) ? value.text : String(value);
}
extensionProofTest(
  isnOrdinaryProofCase,
  async () => {
    await fixture(isnOrdinaryProofCase.id, async (url, client) => {
      await client.query(`CREATE TABLE ${namespace}.codec_rollback (marker pg_catalog.text NOT NULL)`);
      const connection = await connectDatabase({ schema: managed, relations, connectionString: url });
      try {
        for (const entry of [...isnNativeCases(), ...isnCastCases()]) {
          const claim = isnOrdinaryProofCase.claims.find((claim) => claim.member === entry.member)!;
          await extensionProofWitness({ ...claim, schema: isnProofSchema }, async () => {
            const result = (
              await connection.transaction((db) =>
                db.select({ value: entry.expression }).from(sql`(values (1)) fixture(id)`),
              )
            )[0]!.value;
            const oracle = await client.query(`SELECT (${entry.native})::pg_catalog.text AS value`);
            assert.equal(nativeResult(v.parse(scalar, result)), oracle.rows[0]!.value, entry.member);
            const nullResult = await connection.transaction((db) =>
              db.select({ value: entry.nullExpression }).from(sql`(values (1)) fixture(id)`),
            );
            assert.deepEqual(nullResult, [{ value: null }], entry.member);
          });
        }
        let caughtInvalidInput = false;
        await assert.rejects(
          connection.transaction(async (db) => {
            await db.execute(
              sql`insert into ${sql.identifier(isnProofSchema)}.${sql.identifier("codec_rollback")} values (${"before invalid cast"})`,
            );
            try {
              // @ts-expect-error Exercise native invocation poisoning after a caller catches invalid typed input.
              api.sql.casts["cast:$extension:isn.isbn->$extension:isn.ean13"](api.ismn.value("M-1234-5678-5"));
            } catch {
              caughtInvalidInput = true;
            }
          }),
        );
        assert.equal(caughtInvalidInput, true);
        assert.deepEqual((await client.query(`SELECT marker FROM ${namespace}.codec_rollback`)).rows, []);
      } finally {
        await connection.close();
      }
    });
  },
  900000,
);

extensionProofTest(
  isnSchemaProofCase,
  async () => {
    await fixture(isnSchemaProofCase.id, async (url, client) => {
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(managed)))
        await client.query(statement);
      const connection = await connectDatabase({ schema: managed, relations, connectionString: url });
      try {
        {
          const table = managed.tables.ean13_btree;
          const value = api.ean13.value("9780123456786");
          const marked = api.ean13.value("9780123456786!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.ean13.codec.decode(
            (await client.query(`SELECT '9780123456786'::${namespace}.ean13::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.ean13.codec.decode(
            (await client.query(`SELECT '9780123456786!'::${namespace}.ean13::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn.ean13")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.ean13_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn._ean13")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.ean13_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.ean13_ops/btree")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "ean13", "btree");
              const query = `SELECT value::text AS value FROM app.ean13_btree WHERE value OPERATOR(${namespace}.=) $1::${namespace}.ean13`;
              const args = ["9780123456786"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.ean13.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.ean13_hash;
          const value = api.ean13.value("9780123456786");
          const marked = api.ean13.value("9780123456786!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.ean13.codec.decode(
            (await client.query(`SELECT '9780123456786'::${namespace}.ean13::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.ean13.codec.decode(
            (await client.query(`SELECT '9780123456786!'::${namespace}.ean13::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.ean13_ops/hash")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "ean13", "hash");
              const query = `SELECT value::text AS value FROM app.ean13_hash WHERE value OPERATOR(${namespace}.=) $1::${namespace}.ean13`;
              const args = ["9780123456786"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.ean13.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.isbn_btree;
          const value = api.isbn.value("9780123456786");
          const marked = api.isbn.value("9780123456786!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.isbn.codec.decode(
            (await client.query(`SELECT '9780123456786'::${namespace}.isbn::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.isbn.codec.decode(
            (await client.query(`SELECT '9780123456786!'::${namespace}.isbn::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn.isbn")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.isbn_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn._isbn")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.isbn_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.isbn_ops/btree")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "isbn", "btree");
              const query = `SELECT value::text AS value FROM app.isbn_btree WHERE value OPERATOR(${namespace}.=) $1::${namespace}.isbn`;
              const args = ["9780123456786"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.isbn.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.isbn_hash;
          const value = api.isbn.value("9780123456786");
          const marked = api.isbn.value("9780123456786!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.isbn.codec.decode(
            (await client.query(`SELECT '9780123456786'::${namespace}.isbn::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.isbn.codec.decode(
            (await client.query(`SELECT '9780123456786!'::${namespace}.isbn::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.isbn_ops/hash")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "isbn", "hash");
              const query = `SELECT value::text AS value FROM app.isbn_hash WHERE value OPERATOR(${namespace}.=) $1::${namespace}.isbn`;
              const args = ["9780123456786"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.isbn.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.isbn13_btree;
          const value = api.isbn13.value("9780123456786");
          const marked = api.isbn13.value("9780123456786!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.isbn13.codec.decode(
            (await client.query(`SELECT '9780123456786'::${namespace}.isbn13::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.isbn13.codec.decode(
            (await client.query(`SELECT '9780123456786!'::${namespace}.isbn13::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn.isbn13")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.isbn13_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn._isbn13")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.isbn13_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.isbn13_ops/btree")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "isbn13", "btree");
              const query = `SELECT value::text AS value FROM app.isbn13_btree WHERE value OPERATOR(${namespace}.=) $1::${namespace}.isbn13`;
              const args = ["9780123456786"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.isbn13.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.isbn13_hash;
          const value = api.isbn13.value("9780123456786");
          const marked = api.isbn13.value("9780123456786!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.isbn13.codec.decode(
            (await client.query(`SELECT '9780123456786'::${namespace}.isbn13::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.isbn13.codec.decode(
            (await client.query(`SELECT '9780123456786!'::${namespace}.isbn13::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.isbn13_ops/hash")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "isbn13", "hash");
              const query = `SELECT value::text AS value FROM app.isbn13_hash WHERE value OPERATOR(${namespace}.=) $1::${namespace}.isbn13`;
              const args = ["9780123456786"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.isbn13.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.ismn_btree;
          const value = api.ismn.value("9790123456785");
          const marked = api.ismn.value("9790123456785!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.ismn.codec.decode(
            (await client.query(`SELECT '9790123456785'::${namespace}.ismn::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.ismn.codec.decode(
            (await client.query(`SELECT '9790123456785!'::${namespace}.ismn::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn.ismn")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.ismn_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn._ismn")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.ismn_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.ismn_ops/btree")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "ismn", "btree");
              const query = `SELECT value::text AS value FROM app.ismn_btree WHERE value OPERATOR(${namespace}.=) $1::${namespace}.ismn`;
              const args = ["9790123456785"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.ismn.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.ismn_hash;
          const value = api.ismn.value("9790123456785");
          const marked = api.ismn.value("9790123456785!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.ismn.codec.decode(
            (await client.query(`SELECT '9790123456785'::${namespace}.ismn::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.ismn.codec.decode(
            (await client.query(`SELECT '9790123456785!'::${namespace}.ismn::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.ismn_ops/hash")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "ismn", "hash");
              const query = `SELECT value::text AS value FROM app.ismn_hash WHERE value OPERATOR(${namespace}.=) $1::${namespace}.ismn`;
              const args = ["9790123456785"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.ismn.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.ismn13_btree;
          const value = api.ismn13.value("9790123456785");
          const marked = api.ismn13.value("9790123456785!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.ismn13.codec.decode(
            (await client.query(`SELECT '9790123456785'::${namespace}.ismn13::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.ismn13.codec.decode(
            (await client.query(`SELECT '9790123456785!'::${namespace}.ismn13::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn.ismn13")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.ismn13_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn._ismn13")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.ismn13_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.ismn13_ops/btree")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "ismn13", "btree");
              const query = `SELECT value::text AS value FROM app.ismn13_btree WHERE value OPERATOR(${namespace}.=) $1::${namespace}.ismn13`;
              const args = ["9790123456785"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.ismn13.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.ismn13_hash;
          const value = api.ismn13.value("9790123456785");
          const marked = api.ismn13.value("9790123456785!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.ismn13.codec.decode(
            (await client.query(`SELECT '9790123456785'::${namespace}.ismn13::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.ismn13.codec.decode(
            (await client.query(`SELECT '9790123456785!'::${namespace}.ismn13::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.ismn13_ops/hash")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "ismn13", "hash");
              const query = `SELECT value::text AS value FROM app.ismn13_hash WHERE value OPERATOR(${namespace}.=) $1::${namespace}.ismn13`;
              const args = ["9790123456785"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.ismn13.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.issn_btree;
          const value = api.issn.value("9771234567898");
          const marked = api.issn.value("9771234567898!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.issn.codec.decode(
            (await client.query(`SELECT '9771234567898'::${namespace}.issn::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.issn.codec.decode(
            (await client.query(`SELECT '9771234567898!'::${namespace}.issn::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn.issn")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.issn_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn._issn")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.issn_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.issn_ops/btree")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "issn", "btree");
              const query = `SELECT value::text AS value FROM app.issn_btree WHERE value OPERATOR(${namespace}.=) $1::${namespace}.issn`;
              const args = ["9771234567898"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.issn.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.issn_hash;
          const value = api.issn.value("9771234567898");
          const marked = api.issn.value("9771234567898!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.issn.codec.decode(
            (await client.query(`SELECT '9771234567898'::${namespace}.issn::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.issn.codec.decode(
            (await client.query(`SELECT '9771234567898!'::${namespace}.issn::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.issn_ops/hash")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "issn", "hash");
              const query = `SELECT value::text AS value FROM app.issn_hash WHERE value OPERATOR(${namespace}.=) $1::${namespace}.issn`;
              const args = ["9771234567898"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.issn.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.issn13_btree;
          const value = api.issn13.value("9771234567898");
          const marked = api.issn13.value("9771234567898!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.issn13.codec.decode(
            (await client.query(`SELECT '9771234567898'::${namespace}.issn13::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.issn13.codec.decode(
            (await client.query(`SELECT '9771234567898!'::${namespace}.issn13::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn.issn13")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.issn13_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn._issn13")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.issn13_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.issn13_ops/btree")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "issn13", "btree");
              const query = `SELECT value::text AS value FROM app.issn13_btree WHERE value OPERATOR(${namespace}.=) $1::${namespace}.issn13`;
              const args = ["9771234567898"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.issn13.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.issn13_hash;
          const value = api.issn13.value("9771234567898");
          const marked = api.issn13.value("9771234567898!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.issn13.codec.decode(
            (await client.query(`SELECT '9771234567898'::${namespace}.issn13::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.issn13.codec.decode(
            (await client.query(`SELECT '9771234567898!'::${namespace}.issn13::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.issn13_ops/hash")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "issn13", "hash");
              const query = `SELECT value::text AS value FROM app.issn13_hash WHERE value OPERATOR(${namespace}.=) $1::${namespace}.issn13`;
              const args = ["9771234567898"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.issn13.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.upc_btree;
          const value = api.upc.value("123456789012");
          const marked = api.upc.value("123456789012!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.upc.codec.decode(
            (await client.query(`SELECT '123456789012'::${namespace}.upc::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.upc.codec.decode(
            (await client.query(`SELECT '123456789012!'::${namespace}.upc::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn.upc")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.upc_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "type:$extension:isn._upc")!,
              schema: isnProofSchema,
            },
            async () => {
              assert.deepEqual(rows[0]!.tags, expectedTags);
              const relational = await connection.db.query.upc_btree.findMany();
              assert.deepEqual(
                relational.map(({ value, tags, fallback }) => ({ value, tags, fallback })),
                rows,
              );
            },
          );
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.upc_ops/btree")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "upc", "btree");
              const query = `SELECT value::text AS value FROM app.upc_btree WHERE value OPERATOR(${namespace}.=) $1::${namespace}.upc`;
              const args = ["123456789012"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.upc.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
        {
          const table = managed.tables.upc_hash;
          const value = api.upc.value("123456789012");
          const marked = api.upc.value("123456789012!");
          const tags = {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 4, length: 2 },
            ],
            values: [
              [value, null],
              [marked, value],
            ],
          };
          await connection.db.insert(table).values([
            { value, tags },
            { value: null, tags: null },
          ]);
          const rows = await connection.transaction((db) =>
            db.select({ value: table.value, tags: table.tags, fallback: table.fallback }).from(table),
          );
          const canonical = api.upc.codec.decode(
            (await client.query(`SELECT '123456789012'::${namespace}.upc::text AS value`)).rows[0]!.value,
          );
          const canonicalMarked = api.upc.codec.decode(
            (await client.query(`SELECT '123456789012!'::${namespace}.upc::text AS value`)).rows[0]!.value,
          );
          const expectedTags = {
            ...tags,
            values: [
              [canonical, null],
              [canonicalMarked, canonical],
            ],
          };
          assert.deepEqual(rows[0], { value: canonical, tags: expectedTags, fallback: canonical });
          assert.deepEqual(rows[1], { value: null, tags: null, fallback: canonical });
          await extensionProofWitness(
            {
              ...isnSchemaProofCase.claims.find((claim) => claim.member === "opclass:$extension:isn.upc_ops/hash")!,
              schema: isnProofSchema,
            },
            async () => {
              await verifyIndexFamily(client, "upc", "hash");
              const query = `SELECT value::text AS value FROM app.upc_hash WHERE value OPERATOR(${namespace}.=) $1::${namespace}.upc`;
              const args = ["123456789012"];
              await client.query("SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_seqscan=on");
              const sequential = await client.query(query, args);
              await client.query("SET enable_indexscan=on; SET enable_seqscan=off");
              const plan = await client.query(`EXPLAIN (FORMAT JSON) ${query}`, args);
              assert.match(
                JSON.stringify(plan.rows),
                /Index (?:Only )?Scan/,
                "Native planner must actually use the claimed class",
              );
              assert.deepEqual((await client.query(query, args)).rows, sequential.rows);
              const typed = await connection.transaction((db) =>
                db.select({ value: table.value }).from(table).where(api.upc.equal(table.value, value)),
              );
              assert.deepEqual(typed, [{ value: canonical }]);
            },
          );
        }
      } finally {
        await connection.close();
      }
    });
  },
  900000,
);

extensionProofTest(
  isnSessionProofCase,
  async () => {
    await fixture(isnSessionProofCase.id, async (url) => {
      let escaped: IsnSession | undefined;
      const result = await withIsnSession(url, isnDescriptor, async (session) => {
        escaped = session;
        for (const claim of isnSessionProofCase.claims)
          await extensionProofWitness({ ...claim, schema: isnProofSchema }, async () => {
            assert.equal(await session.weakStatus(), false);
            assert.equal(await session.setWeak(null), null);
            assert.equal(await session.weakStatus(), false);
            assert.equal(await session.setWeak(true), true);
            assert.equal(await session.weakStatus(), true);
            assert.deepEqual(await session.isbn("9780123456780"), api.isbn.value("0-12-345678-9!"));
            assert.equal(await session.setWeak(false), false);
            assert.equal(await session.weakStatus(), false);
            assert.deepEqual(await session.isbn("978012345678?"), api.isbn.value("0-12-345678-9"));
          });
        return "observed";
      });
      assert.deepEqual(result, { completion: "committed", value: "observed" });
      assert(escaped);
      await assert.rejects(escaped.weakStatus());
      await assert.rejects(
        withIsnSession(url, isnDescriptor, async (session) => {
          assert.equal(await session.weakStatus(), false, "Session setter must not leak to another dedicated backend");
          await assert.rejects(session.isbn("9780123456780"));
        }),
        (error) => error instanceof ExtensionOperationError && error.completion === "rolled-back",
      );
      await assert.rejects(
        withIsnSession(url, isnDescriptor, async (session) => {
          await session.setWeak(true);
          // Accepted but unawaited work must drain; failure still poisons the owning transaction.
          void session.isbn("not an identifier").catch(() => undefined);
          return "floated";
        }),
        (error) => error instanceof ExtensionOperationError && error.completion === "rolled-back",
      );
      await withIsnSession(url, isnDescriptor, async (session) => {
        assert.equal(await session.weakStatus(), false, "Failed weak-mode owner must close its backend");
        void session.setWeak(true);
      });
      await withIsnSession(url, isnDescriptor, async (session) => {
        assert.equal(await session.weakStatus(), false, "Successful floated setter must not leak native state");
      });
    });
  },
  180000,
);
