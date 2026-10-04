import assert from "node:assert/strict";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";
import {
  createIntarray_1_5,
  intarrayValues,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/intarray";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { extensionIndexOpclass } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import {
  createSnapshot,
  emptySnapshot,
  migrationStatements,
  inspectSnapshot,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import intarrayManifest from "../../../apps/loom/src/tooling/extensions/manifests/intarray.json";
import {
  intarrayIndexProofCase,
  intarrayIndexProofClaims,
  intarrayNativeProofCase,
  intarrayNativeProofClaims,
  intarrayEstimatorProofCase,
  intarrayEstimatorProofClaims,
  intarrayProofFamily,
  intarrayProofSchema,
} from "../fixtures/intarray-proof-cases";

const descriptor = {
  name: "intarray",
  version: "1.5",
  schema: intarrayProofSchema,
  apiSupport: { status: "verified", digest: intarrayProofFamily.manifestDigest },
} as const;
const namespace = `"${intarrayProofSchema.replaceAll('"', '""')}"`;
type Api = ReturnType<typeof createIntarray_1_5<typeof descriptor>>;
type Value = PostgreSqlArray<number> | number | boolean | null;

/** Independent PostgreSQL array_out formatter: the oracle never reuses the adapter's encoder. */
function arrayText(value: PostgreSqlArray<number>): string {
  const body = (entries: readonly unknown[]): string =>
    `{${entries.map((entry) => (Array.isArray(entry) ? body(entry) : entry === null ? "NULL" : String(v.parse(v.number(), entry)))).join(",")}}`;
  if (!value.values.length) return "{}";
  const custom = value.dimensions.some((dimension) => dimension.lowerBound !== 1);
  const bounds = value.dimensions.map((d) => `[${d.lowerBound}:${d.lowerBound + d.length - 1}]`).join("");
  return `${custom ? `${bounds}=` : ""}${body(value.values)}`;
}
function text(value: Value): string | null {
  if (value === null) return null;
  if (value === true || value === false) return String(value);
  return v.is(v.number(), value) ? String(value) : arrayText(value);
}

const lhs = sql<number[]>`lhs`,
  rhs = sql<number[]>`rhs`,
  element = sql<number>`element`,
  query = sql<string>`query`,
  start = sql<number>`start`,
  len = sql<number>`len`,
  tags = sql<number[]>`tags`;
type Case = { member: string; expression: (api: Api) => SQL; native: string; expected: Value };
/** Captured inputs: lhs '[0:4]={5,1,3,1,2}', rhs '{1,2,7}', element 1, query '1&!7', start -2, len -1, direction 'DESC'. */
const cases: readonly Case[] = [
  {
    member: "operator:$extension:intarray.-(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.subtract(lhs, rhs),
    native: `lhs operator(${namespace}.-) rhs`,
    expected: intarrayValues([3, 5]),
  },
  {
    member: "operator:$extension:intarray.-(pg_catalog._int4,pg_catalog.int4)",
    expression: (api) => api.removeElement(lhs, element),
    native: `lhs operator(${namespace}.-) element`,
    expected: intarrayValues([5, 3, 2], 0),
  },
  {
    member: "operator:$extension:intarray.@@(pg_catalog._int4,$extension:intarray.query_int)",
    expression: (api) => api.matches(lhs, query),
    native: `lhs operator(${namespace}.@@) query`,
    expected: true,
  },
  {
    member: "operator:$extension:intarray.@>(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.contains(lhs, intarrayValues([1, 2])),
    native: `lhs operator(${namespace}.@>) '{1,2}'::int4[]`,
    expected: true,
  },
  {
    member: "operator:$extension:intarray.&(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.intersection(lhs, rhs),
    native: `lhs operator(${namespace}.&) rhs`,
    expected: intarrayValues([1, 2]),
  },
  {
    member: "operator:$extension:intarray.&&(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.overlaps(rhs, intarrayValues([])),
    native: `rhs operator(${namespace}.&&) '{}'::int4[]`,
    expected: false,
  },
  {
    member: "operator:$extension:intarray.#(,pg_catalog._int4)",
    expression: (api) =>
      api.count({
        dimensions: [
          { lowerBound: 1, length: 2 },
          { lowerBound: 1, length: 2 },
        ],
        values: [
          [1, 2],
          [3, 4],
        ],
      }),
    native: `operator(${namespace}.#) '{{1,2},{3,4}}'::int4[]`,
    expected: 4,
  },
  {
    member: "operator:$extension:intarray.#(pg_catalog._int4,pg_catalog.int4)",
    expression: (api) => api.indexOf(lhs, 9),
    native: `lhs operator(${namespace}.#) 9`,
    expected: 0,
  },
  {
    member: "operator:$extension:intarray.+(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.concat(lhs, rhs),
    native: `lhs operator(${namespace}.+) rhs`,
    expected: intarrayValues([5, 1, 3, 1, 2, 1, 2, 7]),
  },
  {
    member: "operator:$extension:intarray.+(pg_catalog._int4,pg_catalog.int4)",
    expression: (api) => api.append(lhs, element),
    native: `lhs operator(${namespace}.+) element`,
    expected: intarrayValues([5, 1, 3, 1, 2, 1]),
  },
  {
    member: "operator:$extension:intarray.<@(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.containedBy(rhs, lhs),
    native: `rhs operator(${namespace}.<@) lhs`,
    expected: false,
  },
  {
    member: "operator:$extension:intarray.|(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.union(lhs, rhs),
    native: `lhs operator(${namespace}.|) rhs`,
    expected: intarrayValues([1, 2, 3, 5, 7]),
  },
  {
    member: "operator:$extension:intarray.|(pg_catalog._int4,pg_catalog.int4)",
    expression: (api) => api.unionElement(rhs, -3),
    native: `rhs operator(${namespace}.|) -3`,
    expected: intarrayValues([-3, 1, 2, 7]),
  },
  {
    member: "operator:$extension:intarray.~~($extension:intarray.query_int,pg_catalog._int4)",
    expression: (api) => api.matchedBy("2 & (7 | 9)", lhs),
    native: `'2 & (7 | 9)'::${namespace}.query_int operator(${namespace}.~~) lhs`,
    expected: false,
  },
  {
    member: "routine:$extension:intarray._int_contained(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.sql.functions._int_contained(intarrayValues([1, 1]), rhs),
    native: `${namespace}._int_contained('{1,1}', rhs)`,
    expected: true,
  },
  {
    member: "routine:$extension:intarray._int_contains(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.sql.functions._int_contains(rhs, lhs),
    native: `${namespace}._int_contains(rhs, lhs)`,
    expected: false,
  },
  {
    member: "routine:$extension:intarray._int_different(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.sql.functions._int_different(intarrayValues([2, 1, 1]), intarrayValues([1, 2])),
    native: `${namespace}._int_different('{2,1,1}', '{1,2}')`,
    expected: true,
  },
  {
    member: "routine:$extension:intarray._int_inter(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.sql.functions._int_inter(rhs, lhs),
    native: `${namespace}._int_inter(rhs, lhs)`,
    expected: intarrayValues([1, 2]),
  },
  {
    member: "routine:$extension:intarray._int_overlap(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.sql.functions._int_overlap(rhs, lhs),
    native: `${namespace}._int_overlap(rhs, lhs)`,
    expected: true,
  },
  {
    member: "routine:$extension:intarray._int_same(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.sql.functions._int_same(intarrayValues([2, 1]), intarrayValues([1, 2])),
    native: `${namespace}._int_same('{2,1}', '{1,2}')`,
    expected: true,
  },
  {
    member: "routine:$extension:intarray._int_union(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.sql.functions._int_union(rhs, intarrayValues([0])),
    native: `${namespace}._int_union(rhs, '{0}')`,
    expected: intarrayValues([0, 1, 2, 7]),
  },
  {
    member: "routine:$extension:intarray.boolop(pg_catalog._int4,$extension:intarray.query_int)",
    expression: (api) => api.sql.functions.boolop(rhs, query),
    native: `${namespace}.boolop(rhs, query)`,
    expected: false,
  },
  {
    member: "routine:$extension:intarray.rboolop($extension:intarray.query_int,pg_catalog._int4)",
    expression: (api) => api.sql.functions.rboolop("!(5 | 6)", rhs),
    native: `${namespace}.rboolop('!(5 | 6)', rhs)`,
    expected: true,
  },
  {
    member: "routine:$extension:intarray.icount(pg_catalog._int4)",
    expression: (api) => api.icount({ dimensions: [{ lowerBound: 1, length: 2 }], values: [null, 4] }),
    native: `${namespace}.icount('{NULL,4}'::int4[])`,
    expected: 2,
  },
  {
    member: "routine:$extension:intarray.idx(pg_catalog._int4,pg_catalog.int4)",
    expression: (api) => api.idx(lhs, element),
    native: `${namespace}.idx(lhs, element)`,
    expected: 2,
  },
  {
    member: "routine:$extension:intarray.intarray_del_elem(pg_catalog._int4,pg_catalog.int4)",
    expression: (api) => api.sql.functions.intarray_del_elem(rhs, 2),
    native: `${namespace}.intarray_del_elem(rhs, 2)`,
    expected: intarrayValues([1, 7]),
  },
  {
    member: "routine:$extension:intarray.intarray_push_array(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.sql.functions.intarray_push_array(rhs, intarrayValues([7])),
    native: `${namespace}.intarray_push_array(rhs, '{7}')`,
    expected: intarrayValues([1, 2, 7, 7]),
  },
  {
    member: "routine:$extension:intarray.intarray_push_elem(pg_catalog._int4,pg_catalog.int4)",
    expression: (api) => api.sql.functions.intarray_push_elem(intarrayValues([]), 2147483647),
    native: `${namespace}.intarray_push_elem('{}', 2147483647)`,
    expected: intarrayValues([2147483647]),
  },
  {
    member: "routine:$extension:intarray.intset_subtract(pg_catalog._int4,pg_catalog._int4)",
    expression: (api) => api.sql.functions.intset_subtract(rhs, lhs),
    native: `${namespace}.intset_subtract(rhs, lhs)`,
    expected: intarrayValues([7]),
  },
  {
    member: "routine:$extension:intarray.intset_union_elem(pg_catalog._int4,pg_catalog.int4)",
    expression: (api) => api.sql.functions.intset_union_elem(lhs, element),
    native: `${namespace}.intset_union_elem(lhs, element)`,
    expected: intarrayValues([1, 2, 3, 5]),
  },
  {
    member: "routine:$extension:intarray.intset(pg_catalog.int4)",
    expression: (api) => api.intset(-2147483648),
    native: `${namespace}.intset(-2147483648)`,
    expected: intarrayValues([-2147483648]),
  },
  {
    member: "routine:$extension:intarray.sort_asc(pg_catalog._int4)",
    expression: (api) => api.sortAsc(lhs),
    native: `${namespace}.sort_asc(lhs)`,
    expected: intarrayValues([1, 1, 2, 3, 5], 0),
  },
  {
    member: "routine:$extension:intarray.sort_desc(pg_catalog._int4)",
    expression: (api) => api.sortDesc(lhs),
    native: `${namespace}.sort_desc(lhs)`,
    expected: intarrayValues([5, 3, 2, 1, 1], 0),
  },
  {
    member: "routine:$extension:intarray.sort(pg_catalog._int4,pg_catalog.text)",
    expression: (api) => api.sort(rhs, "DeSc"),
    native: `${namespace}.sort(rhs, 'DeSc')`,
    expected: intarrayValues([7, 2, 1]),
  },
  {
    member: "routine:$extension:intarray.sort(pg_catalog._int4)",
    expression: (api) =>
      api.sort({
        dimensions: [
          { lowerBound: 1, length: 2 },
          { lowerBound: 1, length: 2 },
        ],
        values: [
          [3, 2],
          [1, 4],
        ],
      }),
    native: `${namespace}.sort('{{3,2},{1,4}}'::int4[])`,
    expected: {
      dimensions: [
        { lowerBound: 1, length: 2 },
        { lowerBound: 1, length: 2 },
      ],
      values: [
        [1, 2],
        [3, 4],
      ],
    },
  },
  {
    member: "routine:$extension:intarray.subarray(pg_catalog._int4,pg_catalog.int4,pg_catalog.int4)",
    expression: (api) => api.subarray(lhs, 2, len),
    native: `${namespace}.subarray(lhs, 2, len)`,
    expected: intarrayValues([1, 3, 1]),
  },
  {
    member: "routine:$extension:intarray.subarray(pg_catalog._int4,pg_catalog.int4)",
    expression: (api) => api.subarray(lhs, start),
    native: `${namespace}.subarray(lhs, start)`,
    expected: intarrayValues([1, 2]),
  },
  {
    member: "routine:$extension:intarray.uniq(pg_catalog._int4)",
    expression: (api) => api.uniq(lhs),
    native: `${namespace}.uniq(lhs)`,
    expected: intarrayValues([5, 1, 3, 1, 2], 0),
  },
];
const querytreeMember = "routine:$extension:intarray.querytree($extension:intarray.query_int)";
const nullInputs = `(select NULL::int4[] lhs, NULL::int4[] rhs, NULL::int4 element, NULL::${namespace}.query_int query, NULL::int4 start, NULL::int4 len) inputs`;
/** Members that ignore NULL for a constant non-NULL operand still return NULL only for the NULL row argument. */
const nullCases: readonly { member: string; expression: (api: Api) => SQL; native: string }[] = [
  {
    member: "@@",
    expression: (api) => api.matches(lhs, query),
    native: `lhs operator(${namespace}.@@) query`,
  },
  {
    member: "-",
    expression: (api) => api.subtract(lhs, rhs),
    native: `lhs operator(${namespace}.-) rhs`,
  },
  {
    member: "&&",
    expression: (api) => api.overlaps(lhs, rhs),
    native: `lhs operator(${namespace}.&&) rhs`,
  },
  { member: "sort", expression: (api) => api.sort(lhs, "asc"), native: `${namespace}.sort(lhs, 'asc')` },
  {
    member: "subarray",
    expression: (api) => api.subarray(lhs, start),
    native: `${namespace}.subarray(lhs, start)`,
  },
  {
    member: "idx",
    expression: (api) => api.idx(lhs, element),
    native: `${namespace}.idx(lhs, element)`,
  },
];

type Connection = Awaited<ReturnType<typeof connectDatabase>>;
async function withIntarray(
  operation: (input: { client: pg.Client; api: Api; connection: Connection; url: string }) => Promise<void>,
  caseId: string,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    const schema = defineSchema(() => ({}), { namespace: "app" });
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await client.query(
        `create schema ${namespace}; create extension intarray with schema ${namespace} version '1.5'`,
      );
      const live = await captureExtensionContract(client, {
        name: "intarray",
        provider: "postgres",
        fixture: "intarray-local",
      });
      assert.equal(live.contract.version, "1.5");
      assert.equal(live.contract.postgresMajor, 18);
      // Local PostgreSQL establishes the exact SQL inventory, while Neon profile/target acceptance stays host-owned.
      assert.deepEqual(live.contract.members, intarrayManifest.contract.members);
      assert.deepEqual(live.contract.installation, intarrayManifest.contract.installation);
      assert.deepEqual(live.contract.requires, intarrayManifest.contract.requires);
      await observeExtensionProofDatabase(url, caseId, "intarray");
      await client.query(
        `create table inputs as select '[0:4]={5,1,3,1,2}'::int4[] lhs, '{1,2,7}'::int4[] rhs, 1 element, '1&!7'::${namespace}.query_int query, -2 start, -1 len`,
      );
      await operation({ client, api: createIntarray_1_5(descriptor), connection, url });
    } finally {
      await connection.close();
      await client.end();
    }
  });
}

extensionProofTest(
  intarrayEstimatorProofCase,
  async () => {
    await withIntarray(async ({ client, api, connection }) => {
      await client.query(`
        create table estimator_left(id int, tags int4[]);
        insert into estimator_left values (1, '{1,2}'), (2, '{2}'), (3, '{3}'), (4, '{}');
        create table estimator_right(id int, tags int4[]);
        insert into estimator_right values (1, '{2}'), (2, '{1,2}');
        analyze estimator_left; analyze estimator_right;
      `);
      const left = sql<number[]>`a.tags`,
        right = sql<number[]>`b.tags`;
      const restrictions = [
        { operator: "&&", predicate: api.overlaps(left, [2]), operand: "'{2}'::int4[]", ids: [1, 2] },
        { operator: "@>", predicate: api.contains(left, [2]), operand: "'{2}'::int4[]", ids: [1, 2] },
        { operator: "<@", predicate: api.containedBy(left, [1, 2]), operand: "'{1,2}'::int4[]", ids: [1, 2, 4] },
        { operator: "@@", predicate: api.matches(left, "1 & 2"), operand: `'1 & 2'::${namespace}.query_int`, ids: [1] },
      ];
      const joins = [
        { operator: "&&", predicate: api.overlaps(left, right), pairs: ["1:1", "1:2", "2:1", "2:2"] },
        { operator: "@>", predicate: api.contains(left, right), pairs: ["1:1", "1:2", "2:1"] },
        { operator: "<@", predicate: api.containedBy(left, right), pairs: ["1:2", "2:1", "2:2", "4:1", "4:2"] },
      ];
      for (const claim of intarrayEstimatorProofClaims) {
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          const restriction = claim.scenario.includes("where");
          const item = (restriction ? restrictions : joins).find(
            (row) => extensionExpressionContract(row.predicate)?.member === claim.member,
          )!;
          const query = restriction
            ? sql`select a.id from estimator_left a where ${item.predicate}`
            : sql`select a.id left_id, b.id right_id from estimator_left a join estimator_right b on ${item.predicate}`;
          const native = restriction
            ? `select a.id from estimator_left a where a.tags operator(${namespace}.${item.operator}) ${(item as (typeof restrictions)[number]).operand}`
            : `select a.id left_id, b.id right_id from estimator_left a join estimator_right b on a.tags operator(${namespace}.${item.operator}) b.tags`;
          const expected = restriction
            ? (item as (typeof restrictions)[number]).ids.map((id) => ({ id }))
            : (item as (typeof joins)[number]).pairs.map((pair) => {
                const [left_id, right_id] = pair.split(":").map(Number);
                return { left_id, right_id };
              });
          const order = restriction ? sql`a.id` : sql`a.id, b.id`;
          await connection.transaction(async (db) => {
            // EXPLAIN ANALYZE puts the operator in a real restriction/join clause. Its captured
            // oprrest/oprjoin pointer is PostgreSQL's planner callback, not a callable SQL projection.
            const result = await db.execute(sql`explain (analyze, format json) ${query}`);
            const document = result.rows[0]!["QUERY PLAN"];
            const plan = v.parse(
              v.array(v.object({ Plan: v.object({ "Actual Rows": v.number(), "Plan Rows": v.number() }) })),
              document,
            )[0]!.Plan;
            assert.equal(plan["Actual Rows"], expected.length);
            assert(plan["Plan Rows"] > 0);
            assert(JSON.stringify(document).includes(restriction ? '"Filter"' : '"Join Filter"'));
            assert(JSON.stringify(document).includes(`.${item.operator})`));
            assert.deepEqual((await db.execute(sql`${query} order by ${order}`)).rows, expected);
          });
          const nativePlan = (await client.query(`explain (analyze, format json) ${native}`)).rows[0]["QUERY PLAN"][0]
            .Plan;
          assert.equal(nativePlan["Actual Rows"], expected.length);
          assert(nativePlan["Plan Rows"] > 0);
          assert.deepEqual(
            (await client.query(`${native} order by ${restriction ? "a.id" : "a.id, b.id"}`)).rows,
            expected,
          );
        });
      }
    }, intarrayEstimatorProofCase.id);
  },
  90000,
);

extensionProofTest(
  intarrayNativeProofCase,
  async () => {
    await withIntarray(async ({ client, api, connection }) => {
      assert.deepEqual(
        [...cases.map((item) => item.member), querytreeMember].sort(),
        Object.keys(api.sql.overloads).sort(),
      );
      for (const item of cases) {
        const claim = intarrayNativeProofClaims.find((entry) => entry.member === item.member);
        assert(claim, `Missing intarray claim: ${item.member}`);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          const expression = item.expression(api);
          assert.equal(extensionExpressionContract(expression)?.member, item.member);
          const rows = await connection.transaction((db) => db.select({ value: expression }).from(sql`inputs`));
          assert.deepEqual(rows, [{ value: item.expected }], item.member);
          const native = await client.query<{ value: string | null }>(
            `select (${item.native})::text value from inputs`,
          );
          assert.deepEqual(native.rows, [{ value: text(item.expected) }], item.member);
        });
      }
      const querytree = intarrayNativeProofClaims.find((entry) => entry.member === querytreeMember)!;
      await extensionProofWitness({ ...querytree, schema: api.schema }, async () => {
        const expression = api.querytree("1 & 2");
        assert.equal(extensionExpressionContract(expression)?.member, querytreeMember);
        await assert.rejects(
          connection.transaction((db) => db.select({ value: expression }).from(sql`inputs`)),
          (error: Error) => /querytree is no longer implemented/.test(`${error.message} ${String(error.cause)}`),
        );
        await assert.rejects(
          client.query(`select ${namespace}.querytree('1 & 2')`),
          /querytree is no longer implemented/,
        );
      });
      for (const item of nullCases) {
        const rows = await connection.transaction((db) =>
          db.select({ value: item.expression(api) }).from(sql.raw(nullInputs)),
        );
        assert.deepEqual(rows, [{ value: null }], item.member);
        assert.deepEqual((await client.query(`select (${item.native}) value from ${nullInputs}`)).rows, [
          { value: null },
        ]);
      }
      // NULL elements: decoded exactly where PostgreSQL accepts them, and rejected natively where it does not.
      await assert.rejects(
        connection.transaction((db) =>
          db
            .select({ value: api.uniq({ dimensions: [{ lowerBound: 1, length: 2 }], values: [1, null] }) })
            .from(sql`inputs`),
        ),
        (error: Error) => /array must not contain nulls/.test(`${error.message} ${String(error.cause)}`),
      );
      // Composition: filter and order by intarray expressions over stored rows.
      await client.query(`create table documents(id int primary key, tags int4[] not null)`);
      await client.query(`insert into documents values (1, '{3,1}'), (2, '{1,2,3,4}'), (3, '{5}'), (4, '{2,1}')`);
      const composed = await connection.transaction((db) =>
        db
          .select({ id: sql<number>`id`, tags: api.sort(tags) })
          .from(sql`documents`)
          .where(api.matches(tags, "1 & !4"))
          .orderBy(api.count(tags), sql`id`),
      );
      assert.deepEqual(composed, [
        { id: 1, tags: intarrayValues([1, 3]) },
        { id: 4, tags: intarrayValues([1, 2]) },
      ]);
      const nativeComposed = await client.query(
        `select id, ${namespace}.sort(tags)::text tags from documents where tags operator(${namespace}.@@) '1 & !4' order by operator(${namespace}.#) tags, id`,
      );
      assert.deepEqual(nativeComposed.rows, [
        { id: 1, tags: "{1,3}" },
        { id: 4, tags: "{1,2}" },
      ]);
      // Plain number[] arguments (drizzle integer().array() data) bind as native int4[] and compose with results.
      assert.deepEqual(
        await connection.transaction((db) =>
          db.select({ value: api.union([3, 1, 3], api.sort([2, 0], "DESC")), empty: api.uniq([]) }).from(sql`inputs`),
        ),
        [{ value: intarrayValues([0, 1, 2, 3]), empty: intarrayValues([]) }],
      );
      assert.deepEqual(
        (
          await client.query(
            `select (array[3,1,3] operator(${namespace}.|) ${namespace}.sort(array[2,0], 'DESC'))::text value`,
          )
        ).rows,
        [{ value: "{0,1,2,3}" }],
      );
      // query_int parsing and normalization belong to PostgreSQL, without a hand-written local parser.
      const corpus = ["1&(2|!3)", " 1 | 2", "!!1", "((1))", "0", "01", "-2147483648", "2147483647", "1 & 2 | 3"];
      const rejected = ["", " ", "!", "(1", "1&&2", "1--2", "- 1", "+1", "1 2", "2147483648", "1\t&2", "a"];
      for (const query of corpus) {
        const rows = await connection.transaction((db) =>
          db
            .select({
              value: api.matches(intarrayValues([1, 2]), query),
              query: sql<string>`${query}::${sql.raw(namespace)}.query_int::text`,
            })
            .from(sql`inputs`),
        );
        const native = await client.query(
          `select '{1,2}'::int4[] operator(${namespace}.@@) $1::${namespace}.query_int value`,
          [query],
        );
        assert.equal(rows[0]!.value, native.rows[0].value, query);
      }
      for (const query of rejected) {
        await assert.rejects(
          connection.transaction((db) => db.select({ value: api.matches([1], query) }).from(sql`inputs`)),
          (error: Error) => /syntax error/.test(`${error.message} ${String(error.cause)}`),
          query,
        );
        await assert.rejects(client.query(`select $1::${namespace}.query_int`, [query]), /syntax error/, query);
      }
      assert.deepEqual(
        await connection.transaction((db) =>
          db
            .select({
              value: sql`${sql.param("1&(2|!3)")}::${sql.raw(namespace)}.query_int`.mapWith(api.queryCodec.decode),
            })
            .from(sql`inputs`),
        ),
        [{ value: "1 & ( 2 | !3 )" }],
      );
      for (const type of ["query_int", "_query_int"]) {
        const queryClaim = intarrayNativeProofClaims.find(
          (claim) => claim.member === `type:$extension:intarray.${type}`,
        )!;
        await extensionProofWitness({ ...queryClaim, schema: api.schema }, async () => {
          const queryArray = api.queryArrayCodec.decode(
            (await client.query(`select '[0:1]={"1&(2|!3)",NULL}'::${namespace}.query_int[]::text value`)).rows[0]
              .value,
          );
          assert.deepEqual(queryArray, {
            dimensions: [{ lowerBound: 0, length: 2 }],
            values: ["1 & ( 2 | !3 )", null],
          });
          const encoded = api.queryArrayCodec.encode(queryArray);
          assert.equal(
            (await client.query(`select $1::${namespace}.query_int[]::text value`, [encoded])).rows[0].value,
            '[0:1]={"1 & ( 2 | !3 )",NULL}',
          );
        });
      }
    }, intarrayNativeProofCase.id);
  },
  90000,
);

extensionProofTest(
  intarrayIndexProofCase,
  async () => {
    await withIntarray(async ({ client, api, connection, url }) => {
      const managed = defineSchema(
        () => ({
          stored: defineTable(
            { tags: api.field().notNull().default([1]) },
            {
              indexes: [
                { fields: ["tags"], extension: api.indexes.gin() },
                { fields: ["tags"], extension: api.indexes.gist({ numranges: 252 }) },
                { fields: ["tags"], extension: api.indexes.gistBig({ siglen: 2024 }) },
              ],
            },
          ),
        }),
        { namespace: "app" },
      );
      const desired = await createSnapshot(managed);
      for (const statement of await migrationStatements(await emptySnapshot("app"), desired))
        await client.query(statement);
      const stored = await connectDatabase({
        schema: managed,
        relations: defineRelations(managed.tables),
        connectionString: url,
      });
      try {
        assert.equal(snapshotHash(await inspectSnapshot(stored.db, "app")), snapshotHash(desired));
        await stored.transaction((db) => db.insert(managed.tables.stored).values([{ tags: [3, 1, 3] }, {}]));
        assert.deepEqual(
          await stored.transaction((db) =>
            db
              .select({ tags: managed.tables.stored.tags })
              .from(managed.tables.stored)
              .orderBy(api.count(managed.tables.stored.tags)),
          ),
          [{ tags: [1] }, { tags: [3, 1, 3] }],
        );
        assert.deepEqual(
          await stored.transaction((db) =>
            db
              .select({ tags: api.sort(managed.tables.stored.tags) })
              .from(managed.tables.stored)
              .where(api.contains(managed.tables.stored.tags, [3])),
          ),
          [{ tags: intarrayValues([1, 3, 3]) }],
        );
        // @ts-expect-error intarray fields store null-free integer arrays.
        await assert.rejects(stored.transaction((db) => db.insert(managed.tables.stored).values({ tags: [1, null] })));
      } finally {
        await stored.close();
      }
      await client.query(`create table items(id int primary key, tags int4[] not null)`);
      await client.query(
        `insert into items select g, array[g % 97, g % 13, 1000 + g % 7] from generate_series(1, 4000) g`,
      );
      const indexes = [
        {
          claim: intarrayIndexProofClaims[0]!,
          contract: api.indexes.gin(),
          predicate: api.contains(tags, intarrayValues([5, 1003])),
        },
        {
          claim: intarrayIndexProofClaims[1]!,
          contract: api.indexes.gist({ numranges: 252 }),
          predicate: api.overlaps(tags, intarrayValues([96])),
        },
        {
          claim: intarrayIndexProofClaims[2]!,
          contract: api.indexes.gistBig({ siglen: 2024 }),
          predicate: api.matches(tags, "5 & 1003"),
        },
      ];
      const expected = (
        await connection.transaction((db) =>
          db
            .select({ id: sql<number>`id` })
            .from(sql`items`)
            .where(indexes[0]!.predicate)
            .orderBy(sql`id`),
        )
      ).map((row) => row.id);
      assert(expected.length > 0);
      for (const { claim, contract, predicate } of indexes) {
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          assert.equal(contract.member, claim.member);
          await client.query(
            `create index items_tags on items using ${contract.method} (tags ${extensionIndexOpclass(contract)})`,
          );
          await client.query("analyze items");
          await connection.transaction(async (db) => {
            await db.execute(sql`set local enable_seqscan = off`);
            const plan = await db.execute(sql`explain (format json) select id from items where ${predicate}`);
            assert.match(JSON.stringify(plan.rows ?? plan), /items_tags/);
            const rows = await db
              .select({ id: sql<number>`id` })
              .from(sql`items`)
              .where(predicate)
              .orderBy(sql`id`);
            // Built-in pg_catalog array operators, outside the index's class, are the unindexed oracle.
            const oracle = claim.member.includes("gist__int_ops") ? "tags && '{96}'" : "tags @> '{5,1003}'";
            const seq = await client.query(`select count(*)::int n from items where ${oracle}`);
            assert.equal(rows.length, seq.rows[0].n);
            if (claim.member.includes("gist__int_ops")) assert(rows.length > 0);
            else
              assert.deepEqual(
                rows.map((row) => row.id),
                expected,
              );
          });
          await client.query("drop index items_tags");
        });
      }
    }, intarrayIndexProofCase.id);
  },
  90000,
);
