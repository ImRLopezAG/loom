import { expect, test } from "bun:test";
import pg from "pg";
import * as v from "valibot";
import { call } from "@orpc/server";
import { Context } from "effect";
import { defineRelations, sql } from "drizzle-orm";
import { createTablefunc_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tablefunc";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { nullableCodec, textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { nestedQuery } from "../../../apps/loom/src/core/extensions/nested-query";
import { checkCompiledExtensionQuery, withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createProjectProcedures, type ProcedureContext } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { tablefuncDescriptor, tablefuncInstall } from "../fixtures/tablefunc";
import { tablefuncNativeProofCase } from "../fixtures/tablefunc-proof-cases";

const ns = `"table""func"`;
const text = nullableCodec(textCodec);
type Row = object;

function context(subject: string): ProcedureContext {
  const invocation = {
    identity: { issuer: "test", subject },
    requestId: crypto.randomUUID(),
    signal: new AbortController().signal,
  };
  return { ...invocation, "effect/context": Context.make(Invocation, invocation) };
}

extensionProofTest(
  tablefuncNativeProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const api = createTablefunc_1_0(tablefuncDescriptor);
      const schema = defineSchema((s) => ({
        facts: {
          name: s.text(),
          cat: s.text().notNull(),
          val: s.text(),
          extra: s.integer().notNull(),
        },
        cats: { cat: s.text().notNull() },
        tree: { node: s.text().notNull(), parent: s.text(), pos: s.integer().notNull() },
      }));
      const relations = defineRelations(schema.tables);
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      try {
        await connection.db.execute(sql.raw(tablefuncInstall));
        await observeExtensionProofDatabase(url, tablefuncNativeProofCase.id, "tablefunc");
        for (const statement of await migrationStatements(await emptySnapshot("public"), await createSnapshot(schema)))
          await connection.db.execute(sql.raw(statement));
        await connection.db.insert(schema.tables.facts).values([
          { name: "test1", cat: "att1", val: "val1", extra: 10 },
          { name: "test1", cat: "att2", val: "val2", extra: 10 },
          { name: "test1", cat: "att3", val: "val'3", extra: 10 },
          { name: "test2", cat: "att1", val: "val5", extra: 20 },
          { name: "test2", cat: "att3", val: null, extra: 20 },
          { name: null, cat: "att2", val: "anon", extra: 30 },
        ]);
        await connection.db.insert(schema.tables.cats).values([{ cat: "att1" }, { cat: "att2" }, { cat: "att3" }]);
        await connection.db.insert(schema.tables.tree).values([
          { node: "row1", parent: null, pos: 0 },
          { node: "row2", parent: "row1", pos: 0 },
          { node: "row3", parent: "row1", pos: 0 },
          { node: "row4", parent: "row2", pos: 1 },
          { node: "row5", parent: "row2", pos: 0 },
          { node: "row6", parent: "row4", pos: 0 },
          { node: "row8", parent: "row6", pos: 0 },
          { node: "row9", parent: "row5", pos: 0 },
        ]);
        const { procedure, validators } = createProjectProcedures(schema, relations);
        const facts = validators.tables.facts.search({
          columns: ["name", "cat", "val", "extra"],
          filter: ["cat"],
          order: ["name", "cat"],
          scope: "public",
        });
        const cats = validators.tables.cats.search({
          columns: ["cat"],
          filter: ["cat"],
          order: ["cat"],
          scope: "public",
        });
        const tree = validators.tables.tree.search({
          columns: ["node", "parent", "pos"],
          filter: ["node"],
          order: ["node"],
          scope: "public",
        });
        const options = {
          connection,
          replay: { metadataNamespace: "loom_unused", deployment: "tablefunc-fixture" },
          authorize: async () => {},
        };
        const order = [
          { field: "name", direction: "asc" },
          { field: "cat", direction: "asc" },
        ] as const;
        const helpers = {
          crosstab1: () =>
            api.crosstab({
              source: nestedQuery(facts, { columns: { name: true, cat: true, val: true }, orderBy: order }),
              fields: { name: text, a: text, b: text, c: text },
              alias: "pivot",
            }),
          crosstabCount: () =>
            api.crosstab({
              source: nestedQuery(facts, { columns: { name: true, cat: true, val: true }, orderBy: order }),
              count: 99,
              fields: { name: text, a: text },
              alias: "pivot",
            }),
          crosstabCountNull: () =>
            api.crosstab({
              source: nestedQuery(facts, { columns: { name: true, cat: true, val: true }, orderBy: order }),
              count: null,
              fields: { name: text, a: text },
              alias: "pivot",
            }),
          crosstabHash: () =>
            api.crosstab({
              source: nestedQuery(facts, {
                columns: { name: true, extra: true, cat: true, val: true },
                orderBy: order,
              }),
              categories: nestedQuery(cats, { columns: { cat: true }, orderBy: [{ field: "cat", direction: "asc" }] }),
              fields: { name: text, extra: nullableCodec(int4Codec), att1: text, att2: text, att3: text },
              alias: "pivot",
            }),
          crosstab2: () =>
            api.crosstab2({
              source: nestedQuery(facts, { columns: { name: true, cat: true, val: true }, orderBy: order }),
              alias: "pivot",
            }),
          crosstab3: () =>
            api.crosstab3({
              source: nestedQuery(facts, { columns: { name: true, cat: true, val: true }, orderBy: order }),
              alias: "pivot",
            }),
          crosstab4: () =>
            api.crosstab4({
              source: nestedQuery(facts, { columns: { name: true, cat: true, val: true }, orderBy: order }),
              alias: "pivot",
            }),
          connectby5: () =>
            api.connectby({
              relation: { schema: "public", name: "tree" },
              key: "node",
              parent: "parent",
              start: "row2",
              maxDepth: 0,
              keyCodec: textCodec,
              alias: "t",
            }),
          connectby6: () =>
            api.connectby({
              relation: { schema: "public", name: "tree" },
              key: "node",
              parent: "parent",
              start: "row2",
              maxDepth: 0,
              branchDelimiter: "~",
              keyCodec: textCodec,
              alias: "t",
            }),
          connectbySerial6: () =>
            api.connectby({
              source: nestedQuery(tree, { columns: { node: true, parent: true, pos: true } }),
              key: "node",
              parent: "parent",
              orderBy: "pos",
              start: "row2",
              maxDepth: 1,
              keyCodec: textCodec,
              alias: "t",
            }),
          connectbySerial7: () =>
            api.connectby({
              relation: { schema: "public", name: "tree" },
              key: "node",
              parent: "parent",
              orderBy: "pos",
              start: "row2",
              maxDepth: 0,
              branchDelimiter: "~",
              keyCodec: textCodec,
              alias: "t",
            }),
          connectbyNull: () =>
            api.connectby({
              relation: { schema: "public", name: "tree" },
              key: "node",
              parent: "parent",
              start: null,
              maxDepth: 0,
              keyCodec: textCodec,
              alias: "t",
            }),
          connectbyMissing: () =>
            api.connectby({
              relation: { schema: "public", name: "tree" },
              key: "node",
              parent: "parent",
              start: "nope",
              maxDepth: 0,
              keyCodec: textCodec,
              alias: "t",
            }),
          normalRand: () => api.normalRand(5, 2.5, 0, "samples"),
          normalRandNaN: () => api.normalRand(2, { nonfinite: "NaN" }, 1, "samples"),
          normalRandNull: () => api.normalRand(null, 0, 1, "samples"),
          crosstabTypeMismatch: () =>
            api.crosstab({
              source: nestedQuery(facts, { columns: { name: true, cat: true, val: true }, orderBy: order }),
              fields: { name: text, a: nullableCodec(int4Codec) },
              alias: "pivot",
            }),
        } as const;
        let rows: Row[] = [];
        let dependencies: string[] = [];
        // SAFETY: helpers is a closed literal object, so its own keys are exactly keyof typeof helpers.
        const run = bindRpcDatabaseProcedure(
          procedure
            .use(createDatabaseMiddleware(relations, "read", schema))
            .input(v.picklist(Object.keys(helpers) as (keyof typeof helpers)[]))
            .output(v.boolean())
            .handler(async ({ context, input }) => {
              const table = helpers[input]();
              const query = context.db.select(table.columns).from(table.from);
              dependencies = [
                ...new Set(checkCompiledExtensionQuery(query.toSQL()).flatMap((row) => row.dependencies)),
              ];
              rows = await query;
              return true;
            }),
          options,
        );
        async function helper(name: keyof typeof helpers): Promise<Row[]> {
          await withExtensionSqlExecution({ check: () => {} }, () => call(run, name, { context: context("alice") }));
          return rows;
        }
        async function native(statement: string): Promise<Row[]> {
          return (await oracle.query(statement)).rows;
        }
        const facts3 = `$$select name, cat, val from facts order by 1, 2$$`;
        const cases: { member: string; actual: () => Promise<Row[]>; native: string; nonEmpty?: boolean }[] = [
          {
            member: "routine:$extension:tablefunc.crosstab(pg_catalog.text)",
            actual: () => helper("crosstab1"),
            native: `select * from ${ns}.crosstab(${facts3}) as pivot(name text, a text, b text, c text)`,
          },
          {
            member: "routine:$extension:tablefunc.crosstab(pg_catalog.text,pg_catalog.int4)",
            actual: () => helper("crosstabCount"),
            native: `select * from ${ns}.crosstab(${facts3}, 99) as pivot(name text, a text)`,
          },
          {
            member: "routine:$extension:tablefunc.crosstab(pg_catalog.text,pg_catalog.text)",
            actual: () => helper("crosstabHash"),
            native: `select * from ${ns}.crosstab($$select name, extra, cat, val from facts order by 1, 3$$, $$select cat from cats order by 1$$) as pivot(name text, extra int4, att1 text, att2 text, att3 text)`,
          },
          {
            member: "routine:$extension:tablefunc.crosstab2(pg_catalog.text)",
            actual: () => helper("crosstab2"),
            native: `select * from ${ns}.crosstab2(${facts3})`,
          },
          {
            member: "routine:$extension:tablefunc.crosstab3(pg_catalog.text)",
            actual: () => helper("crosstab3"),
            native: `select * from ${ns}.crosstab3(${facts3})`,
          },
          {
            member: "routine:$extension:tablefunc.crosstab4(pg_catalog.text)",
            actual: () => helper("crosstab4"),
            native: `select * from ${ns}.crosstab4(${facts3})`,
          },
          {
            member:
              "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
            actual: () => helper("connectby5"),
            native: `select * from ${ns}.connectby('tree', 'node', 'parent', 'row2', 0) as t(keyid text, parent_keyid text, level int4)`,
          },
          {
            member:
              "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
            actual: () => helper("connectby6"),
            native: `select * from ${ns}.connectby('tree', 'node', 'parent', 'row2', 0, '~') as t(keyid text, parent_keyid text, level int4, branch text)`,
          },
          {
            member:
              "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
            actual: () => helper("connectbySerial6"),
            native: `select * from ${ns}.connectby('tree', 'node', 'parent', 'pos', 'row2', 1) as t(keyid text, parent_keyid text, level int4, pos int4)`,
          },
          {
            member:
              "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
            actual: () => helper("connectbySerial7"),
            native: `select * from ${ns}.connectby('tree', 'node', 'parent', 'pos', 'row2', 0, '~') as t(keyid text, parent_keyid text, level int4, branch text, pos int4)`,
          },
          {
            member: "routine:$extension:tablefunc.normal_rand(pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
            actual: () => helper("normalRand"),
            native: `select * from ${ns}.normal_rand(5, 2.5, 0) as samples(value)`,
          },
        ];
        for (const entry of cases) {
          const claim = tablefuncNativeProofCase.claims.find((row) => row.member === entry.member);
          if (!claim) throw new Error(`Missing tablefunc native claim: ${entry.member}`);
          await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
            const actual = await entry.actual();
            const expected = await native(entry.native);
            expect(actual.length).toBeGreaterThan(0);
            expect(actual).toEqual(expected);
            if (entry.member.includes("connectby"))
              expect(dependencies.some((name) => name.endsWith("tree"))).toBe(true);
            if (entry.member.includes("crosstab")) expect(dependencies).toContain("facts");
            if (entry.member.includes("crosstab(pg_catalog.text,pg_catalog.text)"))
              expect(dependencies).toContain("cats");
          });
        }
        // STRICT NULL arguments yield no rows; native oddities are passed through, not reimplemented.
        expect(await helper("crosstabCountNull")).toEqual(
          await native(`select * from ${ns}.crosstab(${facts3}, null) as pivot(name text, a text)`),
        );
        expect(await helper("connectbyNull")).toEqual([]);
        expect(await helper("normalRandNull")).toEqual([]);
        expect(await helper("connectbyMissing")).toEqual(
          await native(
            `select * from ${ns}.connectby('tree', 'node', 'parent', 'nope', 0) as t(keyid text, parent_keyid text, level int4)`,
          ),
        );
        expect(await helper("normalRandNaN")).toEqual([
          { value: { nonfinite: "NaN" } },
          { value: { nonfinite: "NaN" } },
        ]);
        expect(await native(`select * from ${ns}.normal_rand(2, 'NaN', 1) as samples(value)`)).toEqual([
          { value: Number.NaN },
          { value: Number.NaN },
        ]);
        await Promise.resolve(expect(helper("crosstabTypeMismatch")).rejects.toThrow());
        await Promise.resolve(
          expect(native(`select * from ${ns}.crosstab(${facts3}) as t(name text, a int4)`)).rejects.toThrow(
            /invalid crosstab return type/,
          ),
        );
        // Captured composite and array types: codec text equals PostgreSQL's own input/output round trip.
        const typeCases = [
          { width: 2, codec: api.codecs.crosstab2, array: api.codecs.crosstab2Array },
          { width: 3, codec: api.codecs.crosstab3, array: api.codecs.crosstab3Array },
          { width: 4, codec: api.codecs.crosstab4, array: api.codecs.crosstab4Array },
        ] as const;
        for (const { width, codec, array } of typeCases) {
          const value = Object.fromEntries([
            ["row_name", 'a,b "q"'],
            ...Array.from({ length: width }, (_, index) => [
              `category_${index + 1}`,
              index === 0 ? null : `v\\${index}`,
            ]),
          ]);
          const type = `${ns}.tablefunc_crosstab_${width}`;
          // SAFETY: value holds exactly row_name plus category_1..category_width, matching this width's codec.
          const encoded = codec.encode(value as never);
          const roundTrip = (await oracle.query(`select $1::${type}::text as value`, [encoded])).rows[0]!.value;
          const nativeRow = (await oracle.query(`select ($1::${type}).*`, [encoded])).rows[0]!;
          for (const id of [
            `composite type:"$extension:tablefunc".tablefunc_crosstab_${width}`,
            `type:$extension:tablefunc.tablefunc_crosstab_${width}`,
          ]) {
            const claim = tablefuncNativeProofCase.claims.find((row) => row.member === id)!;
            await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
              // SAFETY: both ids are captured tablefunc type members asserted by the unit gate to be sql.types keys.
              expect(api.sql.types[id as keyof typeof api.sql.types]).toBe(codec);
              expect(codec.decode(roundTrip)).toEqual(value);
              expect(codec.decode(roundTrip)).toEqual(nativeRow);
            });
          }
          const arrayClaim = tablefuncNativeProofCase.claims.find(
            (row) => row.member === `type:$extension:tablefunc._tablefunc_crosstab_${width}`,
          )!;
          await extensionProofWitness({ ...arrayClaim, schema: api.schema }, async () => {
            const input = { dimensions: [{ lowerBound: 1, length: 2 }], values: [value, null] };
            const arrayText =
              // SAFETY: input is a one-dimensional array of this width's row value plus NULL, matching the array codec.
              (await oracle.query(`select $1::${type}[]::text as value`, [array.encode(input as never)])).rows[0]!
                .value;
            const nativeText = (await oracle.query(`select array[$1::${type}, null]::text as value`, [encoded]))
              .rows[0]!.value;
            expect(arrayText).toBe(nativeText);
            expect(array.decode(arrayText)).toEqual(input);
          });
        }
        // SPI reads the caller's transaction snapshot: uncommitted rows are visible, then roll back with it.
        await oracle.query("BEGIN");
        await oracle.query(`insert into facts (name, cat, val, extra) values ('rollback', 'att1', 'r', 1)`);
        expect(
          await native(`select * from ${ns}.crosstab2($$select name, cat, val from facts where name = 'rollback'$$)`),
        ).toEqual([{ row_name: "rollback", category_1: "r", category_2: null }]);
        await oracle.query("ROLLBACK");
        expect(
          await native(`select * from ${ns}.crosstab2($$select name, cat, val from facts where name = 'rollback'$$)`),
        ).toEqual([]);
      } finally {
        await oracle.end();
        await connection.close();
      }
    });
  },
  60000,
);

test("tablefunc.sqlTextSlotsRejectUnprovenNestedQuery", () => {
  const api = createTablefunc_1_0(tablefuncDescriptor);
  // SAFETY: an empty object has no nested-query evidence; every SQL-text slot must reject it at runtime.
  const unproven = Object.freeze({}) as never;
  expect(() => api.crosstab({ source: unproven, fields: { name: textCodec, a: textCodec }, alias: "p" })).toThrow(
    /managed provenance/,
  );
  expect(() =>
    api.connectby({
      source: unproven,
      key: "a",
      parent: "b",
      start: "x",
      maxDepth: 0,
      keyCodec: textCodec,
      alias: "t",
    }),
  ).toThrow(/managed provenance/);
});
