import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import {
  segBoundary,
  segPoint,
  segInterval,
  segDeviation,
  type SegValue,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/seg";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { checkedExtensionExpression, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { createSnapshot, inspectSnapshot, snapshotHash } from "../../../apps/loom/src/tooling/migrations/adapter";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { segCases, segManaged, segNamespace, segType, withSegApi } from "../fixtures/seg-api";
import {
  segOrdinaryProofCase,
  segPrecisionProofCase,
  segSchemaIndexProofCase,
  segCompositionProofCase,
  segProofSchema,
} from "../fixtures/seg-proof-cases";
import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";

// Serialize the decoded structured result for comparison to independent native seg_out;
// this intentionally bypasses the adapter's input encoder, since native intersections can be inverted.
function resultText(value: SegValue): string {
  const bound = (item: { value: string; certainty: string }) => item.certainty + item.value;
  if (value.kind === "point") return bound(value.value);
  assert.equal(value.kind, "interval", "seg_out never emits deviation notation");
  return `${value.lower ? bound(value.lower) + " " : ""}..${value.upper ? " " + bound(value.upper) : ""}`;
}
extensionProofTest(
  segOrdinaryProofCase,
  async () => {
    await withSegApi(async ({ client, connection, api }) => {
      const cases = segCases(api);
      assert.equal(cases.length, 33);
      assert.deepEqual(cases.map((entry) => entry.member).sort(), Object.keys(api.sql.overloads).sort());
      for (const item of cases) {
        const claim = segOrdinaryProofCase.claims.find((claim) => claim.member === item.member);
        assert(claim);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
          // Source values and oracle routines are native SQL, never production encoder output.
          const actual = (
            await connection.transaction((db) => db.select({ value: item.expression }).from(sql`portable_seg_inputs`))
          )[0]!.value;
          const oracle = (
            await client.query(
              `select ${item.native}${item.kind === "seg" ? "::text" : ""} value from portable_seg_inputs`,
            )
          ).rows[0]!.value;
          // SAFETY: segCases pairs the captured seg result identities with SQL expressions whose codec validates SegValue.
          assert.deepEqual(item.kind === "seg" ? resultText(actual as SegValue) : actual, oracle, item.member);
          for (const nulls of [
            `NULL::${segType} lhs,rhs`,
            `lhs,NULL::${segType} rhs`,
            `NULL::${segType} lhs,NULL::${segType} rhs`,
          ]) {
            const source = `(select ${nulls} from portable_seg_inputs) portable_seg_inputs`;
            const result = await connection.transaction((db) =>
              db.select({ value: item.expression }).from(sql.raw(source)),
            );
            const expected = (
              await client.query(`select ${item.native}${item.kind === "seg" ? "::text" : ""} value from ${source}`)
            ).rows;
            assert.deepEqual(result, expected, item.member);
          }
        });
      }
    }, segOrdinaryProofCase.id);
  },
  90000,
);

extensionProofTest(
  segPrecisionProofCase,
  async () => {
    await proveSegCaseMembers(segPrecisionProofCase, async () => {
      await withSegApi(async ({ client, connection, api }) => {
        const cases: readonly [SegValue, string][] = [
          [segPoint(segBoundary("6.50")), "6.50"],
          [segPoint(segBoundary("6.5", "~")), "~6.5"],
          [segPoint(segBoundary("5.0", "<")), "<5.0"],
          [segPoint(segBoundary("5.0", ">")), ">5.0"],
          [segPoint(segBoundary("0.00")), "0.00"],
          [segPoint(segBoundary("0.0067")), "0.0067"],
          [segPoint(segBoundary("1.23456789")), "1.23456789"],
          [segPoint(segBoundary("16777217")), "16777217"],
          [segInterval(segBoundary("1.5e-2"), segBoundary("2E-2")), "1.5e-2 .. 2E-2"],
          [segInterval(segBoundary("50"), null), "50 .."],
          [segInterval(null, segBoundary("0")), ".. 0"],
          [segDeviation(segBoundary("10"), "1"), "10(+-)1"],
          [segDeviation(segBoundary("5.0", "~"), "0.3"), "~5.0(+-)0.3"],
          [segDeviation(segBoundary("3.4e38"), "3.4e38"), "3.4e38(+-)3.4e38"],
          [segDeviation(segBoundary("-3.4e38"), "3.4e38"), "-3.4e38(+-)3.4e38"],
        ];
        for (const [input, nativeInput] of cases) {
          const native = (await client.query(`select $1::${segType}::text value`, [nativeInput])).rows[0]!.value;
          assert.doesNotThrow(
            () => api.codec.decode(native),
            `Native seg fixture input ${nativeInput}; seg_out ${native}`,
          );
          const result = checkedExtensionExpression(
            sql<SegValue>`${sql.param(api.codec.encode(input))}::${sql.raw(segType)}`,
            nullableCodec(api.codec),
            [],
          );
          const actual = (
            await connection.transaction((db) => db.select({ value: result }).from(sql`(values (1)) fixture(id)`))
          )[0]!.value;
          assert(actual);
          assert.equal(resultText(actual), native);
        }
        // C source FLT_DIG is 6; the docs' "7 digits" description does not match native output.
        assert.equal((await client.query(`select '1.23456789'::${segType}::text value`)).rows[0]!.value, "1.23457");
        assert.equal((await client.query(`select '10(+-)1'::${segType}::text value`)).rows[0]!.value, "9.0 .. 1.1e1");
        const p65 = segPoint(segBoundary("6.5")),
          p650 = segPoint(segBoundary("6.50"));
        const comparison = await connection.transaction((db) =>
          db
            .select({
              equal: api.equal(p65, p650),
              cmp: api.compare(p65, p650),
              approximate: api.equal(api.point(api.boundary("6.5", "~")), p65),
              contains: api.contains(p65, p650),
            })
            .from(sql`(values (1)) fixture(id)`),
        );
        assert.deepEqual(comparison, [{ equal: false, cmp: -1, approximate: false, contains: true }]);
        const inverted = (
          await connection.transaction((db) =>
            db
              .select({
                value: api.intersection(
                  api.interval(api.boundary("1"), api.boundary("2")),
                  api.interval(api.boundary("5"), api.boundary("6")),
                ),
              })
              .from(sql`(values (1)) fixture(id)`),
          )
        )[0]!.value;
        assert(inverted);
        assert.equal(
          resultText(inverted),
          (
            await client.query(
              `select ${segNamespace}.seg_inter('1 .. 2'::${segType},'5 .. 6'::${segType})::text value`,
            )
          ).rows[0]!.value,
        );
        assert.throws(() => api.codec.encode(inverted));
        const infinite = (
          await connection.transaction((db) =>
            db
              .select({
                value: api.union(api.interval(null, api.boundary("0")), api.interval(api.boundary("0"), null)),
                center: api.center(api.deviation(api.boundary("3.4e38"), "3.4e38")),
              })
              .from(sql`(values (1)) fixture(id)`),
          )
        )[0]!;
        assert.equal(resultText(infinite.value!), "..");
        assert.deepEqual(infinite.center, { nonfinite: "Infinity" });
        assert.throws(() => api.codec.encode(infinite.value!));
        assert.equal(
          (
            await client.query(
              `select typreceive::regproc::text receive,typsend::regproc::text send from pg_type where oid=$1::regtype`,
              [segType],
            )
          ).rows[0]!.receive,
          "-",
        );
        for (const invalid of ["5 .. 2", ".5", "1.", "1(+-)~2", "inf", "NaN", "1e999", "1e-999"])
          await assert.rejects(client.query(`select $1::${segType}`, [invalid]));
      }, segPrecisionProofCase.id);
    });
  },
  90000,
);

extensionProofTest(
  segSchemaIndexProofCase,
  async () => {
    await proveSegCaseMembers(segSchemaIndexProofCase, async () => {
      await withSegApi(async ({ client, connection, api }) => {
        const table = segManaged.tables.entries;
        const array: PostgreSqlArray<SegValue> = {
          dimensions: [
            { lowerBound: -2, length: 2 },
            { lowerBound: 3, length: 2 },
          ],
          values: [
            [api.point(api.boundary("6.50")), null],
            [api.interval(null, api.boundary("0.00")), api.point(api.boundary("1.00", "~"))],
          ],
        };
        const inserted = await connection.transaction((db) =>
          db
            .insert(table)
            .values({ value: api.point(api.boundary("6.50")), tags: array })
            .returning(),
        );
        assert.deepEqual(inserted[0]!.tags, array);
        assert.deepEqual(inserted[0]!.fallback, api.point(api.boundary("7.00")));
        const six: PostgreSqlArray<SegValue> = {
          dimensions: Array.from({ length: 6 }, (_, i) => ({ lowerBound: i - 3, length: 1 })),
          values: [[[[[[api.point(api.boundary("1.00"))]]]]]],
        };
        const sixRows = await connection.transaction((db) =>
          db.insert(table).values({ tags: six }).returning({ tags: table.tags }),
        );
        assert.deepEqual(sixRows[0]!.tags, six);
        const arrays = (
          await client.query(
            "select pg_catalog.array_dims(tags) bounds,pg_catalog.cardinality(tags) cardinality from app.entries where value is not null",
          )
        ).rows;
        assert.deepEqual(arrays, [{ bounds: "[-2:-1][3:4]", cardinality: 4 }]);
        // An independent native array bind supplies a second oracle, including lower bounds and NULL.
        const raw = '[-2:-1][3:4]={{"6.50",NULL},{".. 0.00","~1.00"}}';
        assert.deepEqual(
          api.arrayCodec.decode((await client.query(`select $1::${segType}[]::text value`, [raw])).rows[0]!.value),
          array,
        );
        const desired = await createSnapshot(segManaged),
          observed = await inspectSnapshot(connection.db, "app");
        assert.deepEqual(observed, desired);
        assert.equal(snapshotHash(observed), snapshotHash(desired));
        const classes = (
          await client.query(
            `select am.amname,c.opcname,n.nspname from pg_index i join pg_class t on t.oid=i.indrelid join pg_opclass c on c.oid=i.indclass[0] join pg_namespace n on n.oid=c.opcnamespace join pg_am am on am.oid=c.opcmethod where t.oid='app.entries'::regclass and n.nspname=$1 order by am.amname`,
            [api.schema],
          )
        ).rows;
        assert.deepEqual(classes, [
          { amname: "btree", opcname: "seg_ops", nspname: api.schema },
          { amname: "gist", opcname: "gist_seg_ops", nspname: api.schema },
        ]);
        for (const method of ["btree", "gist"] as const) {
          const name = `seg_${method}_native`,
            opclass = method === "gist" ? "gist_seg_ops" : "seg_ops";
          await client.query(
            `create table ${name}(id int,value ${segType}); insert into ${name} select x, (x::text || ' .. ' || (x+2)::text)::${segType} from generate_series(1,5000) x; create index ${name}_oracle on ${name} using ${method}(value ${segNamespace}.${opclass})`,
          );
          // Post-build inserts exercise union, penalty, picksplit and same, beyond bulk construction.
          await client.query(
            `insert into ${name} select x, (x::text || ' .. ' || (x+2)::text)::${segType} from generate_series(5001,6500) x; insert into ${name} values(7001,'6.5'),(7002,'6.50'),(7003,'~6.5'),(7004,NULL); analyze ${name}`,
          );
          const operators =
            method === "gist" ? ["<<", "&<", "&&", "&>", ">>", "=", "@>", "<@"] : ["<", "<=", "=", ">=", ">"];
          for (const operator of operators) {
            const query = `select id from ${name} where value operator(${segNamespace}.${operator}) '6.50'::${segType} order by id`;
            await client.query("begin; set local enable_seqscan=off");
            try {
              const plan = (await client.query(`explain ${query}`)).rows.map((row) => row["QUERY PLAN"]).join("\n");
              assert.match(plan, new RegExp(`${name}_oracle`));
              const indexed = (await client.query(query)).rows;
              await client.query(
                "set local enable_indexscan=off; set local enable_indexonlyscan=off; set local enable_bitmapscan=off; set local enable_seqscan=on",
              );
              assert.deepEqual(indexed, (await client.query(query)).rows, `${method}/${operator}`);
            } finally {
              await client.query("rollback");
            }
          }
        }
      }, segSchemaIndexProofCase.id);
    });
  },
  90000,
);

extensionProofTest(segCompositionProofCase, async () => {
  await withSegApi(async ({ client, connection, api }) => {
    const table = segManaged.tables.entries;
    const subquery = connection.db
      .select({ value: api.union(api.point(api.boundary("1.00")), api.point(api.boundary("3.00"))).as('seg"alias') })
      .from(sql`(values (1)) fixture(id)`)
      .as('subquery"日本');
    const actual = await connection.transaction((db) =>
      db
        .select({
          lower: api.lower(subquery.value),
          size: api.size(subquery.value),
          cmp: api.compare(subquery.value, api.interval(api.boundary("1.00"), api.boundary("3.00"))),
        })
        .from(subquery),
    );
    assert.deepEqual(actual, [{ lower: 1, size: 2, cmp: 0 }]);
    await assert.rejects(
      connection.transaction(async (db) => {
        await db.insert(table).values({ value: api.point(api.boundary("99")) });
        await db
          .select({ value: api.lower(sql<SegValue>`${sql.param("5 .. 2")}::${sql.raw(segType)}`) })
          .from(sql`(values (1)) fixture(id)`);
      }),
    );
    assert.equal((await client.query("select count(*)::int count from app.entries")).rows[0]!.count, 0);
  }, segCompositionProofCase.id);
});
async function proveSegCaseMembers(definition: ExtensionProofCase, work: () => Promise<void>): Promise<void> {
  const prove = async (index: number): Promise<void> => {
    const claim = definition.claims[index];
    if (!claim) return work();
    await extensionProofWitness({ ...claim, schema: segProofSchema }, () => prove(index + 1));
  };
  await prove(0);
}
