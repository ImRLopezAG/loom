import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { sql } from "drizzle-orm";
import type { HllSketch, PostgreSqlArray } from "../../../apps/loom/src/core/extensions/adapters/hll";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { withHllSession, type HllDefaults, type HllSession } from "../../../apps/loom/src/tooling/extensions/hll";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import { createSnapshot, inspectSnapshot, snapshotHash } from "../../../apps/loom/src/tooling/migrations/adapter";
import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  hllDigest,
  hllHashvalType,
  hllManaged,
  hllNamespace,
  hllNullInputs,
  hllSketchText,
  hllScalarCases,
  hllType,
  withHllApi,
} from "../fixtures/hll-api";
import {
  hllAggregateProofCase,
  hllProofSchema,
  hllScalarProofCase,
  hllSchemaProofCase,
  hllToolingProofCase,
  hllToolingSchema,
} from "../fixtures/hll-proof-cases";

async function proveCaseMembers(definition: ExtensionProofCase, schema: string, work: () => Promise<void>) {
  const prove = async (index: number): Promise<void> => {
    const claim = definition.claims[index];
    if (!claim) return work();
    await extensionProofWitness({ ...claim, schema }, () => prove(index + 1));
  };
  await prove(0);
}

extensionProofTest(
  hllScalarProofCase,
  async () => {
    await withHllApi(async ({ client, connection, api }) => {
      const cases = hllScalarCases(api);
      assert.deepEqual(
        cases.map((entry) => entry.member).sort(),
        hllScalarProofCase.claims.map((claim) => claim.member).sort(),
      );
      for (const item of cases) {
        const claim = hllScalarProofCase.claims.find((entry) => entry.member === item.member)!;
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
          for (const from of ["hll_inputs", hllNullInputs])
            await item.check(async (expression, text) => {
              const actual = (
                await connection.transaction((db) => db.select({ value: expression }).from(sql.raw(from)))
              )[0]!.value;
              const oracle = (await client.query(`select (${item.native})::text value from ${from}`)).rows[0]!.value;
              assert.equal(text(actual), oracle, item.member);
            });
        });
      }
    }, hllScalarProofCase.id);
  },
  90000,
);

extensionProofTest(
  hllAggregateProofCase,
  async () => {
    await withHllApi(async ({ client, connection, api }) => {
      await client.query(
        `create table hll_rows as select g, case when g % 10 = 0 then NULL else ${hllNamespace}.hll_hash_integer(g) end hv,
           ${hllNamespace}.hll_add(${hllNamespace}.hll_empty(), ${hllNamespace}.hll_hash_integer(g)) h from generate_series(1,200000) g;
         alter table hll_rows set (parallel_workers = 2); analyze hll_rows`,
      );
      const hv = sql<bigint>`hv`,
        h = sql<HllSketch>`h`;
      const add = api.addAggregate;
      const cases = [
        {
          member: hllAggregateProofCase.claims[0]!.member,
          expression: add.sparseon(hv, 12, 5, -1n, 1),
          native: `${hllNamespace}.hll_add_agg(hv,12,5,-1,1)`,
        },
        {
          member: hllAggregateProofCase.claims[1]!.member,
          expression: add.expthresh(hv, 12, 5, -1n),
          native: `${hllNamespace}.hll_add_agg(hv,12,5,-1)`,
        },
        {
          member: hllAggregateProofCase.claims[2]!.member,
          expression: add.regwidth(hv, 12, 5),
          native: `${hllNamespace}.hll_add_agg(hv,12,5)`,
        },
        {
          member: hllAggregateProofCase.claims[3]!.member,
          expression: add.log2m(hv, 12),
          native: `${hllNamespace}.hll_add_agg(hv,12)`,
        },
        {
          member: hllAggregateProofCase.claims[4]!.member,
          expression: add.hashval(hv),
          native: `${hllNamespace}.hll_add_agg(hv)`,
        },
        {
          member: hllAggregateProofCase.claims[5]!.member,
          expression: api.unionAggregate(h),
          native: `${hllNamespace}.hll_union_agg(h)`,
        },
      ];
      assert.deepEqual(
        cases.map((entry) => entry.member),
        hllAggregateProofCase.claims.map((claim) => claim.member),
      );
      for (const item of cases) {
        const claim = hllAggregateProofCase.claims.find((entry) => entry.member === item.member)!;
        assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          for (const parallel of [false, true]) {
            const settings = parallel
              ? "set max_parallel_workers_per_gather=2; set parallel_setup_cost=0; set parallel_tuple_cost=0; set min_parallel_table_scan_size=0"
              : "set max_parallel_workers_per_gather=0";
            const actual = await connection.transaction(async (db) => {
              await db.execute(sql.raw(settings.replaceAll("set ", "set local ")));
              return db.select({ value: item.expression }).from(sql`hll_rows`);
            });
            await client.query("begin");
            try {
              await client.query(settings.replaceAll("set ", "set local "));
              const plan = (
                await client.query(
                  `explain (analyze, costs off, timing off, summary off) select ${item.native} from hll_rows`,
                )
              ).rows
                .map((row) => row["QUERY PLAN"])
                .join("\n");
              // Partial aggregation runs combine, serialize and deserialize; serial plans run transition and final only.
              if (parallel) assert.match(plan, /Workers Launched: [1-9][\s\S]*Partial Aggregate/);
              else assert.doesNotMatch(plan, /Partial Aggregate/);
              const oracle = (await client.query(`select (${item.native})::text value from hll_rows`)).rows[0]!.value;
              assert.equal(hllSketchText(actual[0]!.value), oracle, `${item.member} parallel=${parallel}`);
            } finally {
              await client.query("rollback");
            }
          }
          // NULL hash values are skipped; empty and all-NULL groups finalize to SQL NULL rather than an empty sketch.
          for (const where of [sql`g < 0`, sql`hv is null and h is null`]) {
            const empty = await connection.transaction((db) =>
              db
                .select({ value: item.expression })
                .from(sql`hll_rows`)
                .where(where),
            );
            assert.deepEqual(empty, [{ value: null }]);
          }
          const grouped = await connection.transaction((db) =>
            db
              .select({ value: item.expression })
              .from(sql`hll_rows`)
              .where(sql`g <= 30`)
              .groupBy(sql`g % 3`)
              .orderBy(sql`g % 3`),
          );
          const nativeGrouped = (
            await client.query(
              `select (${item.native})::text value from hll_rows where g <= 30 group by g % 3 order by g % 3`,
            )
          ).rows.map((row) => row.value);
          assert.deepEqual(
            grouped.map((row) => hllSketchText(row.value)),
            nativeGrouped,
          );
        });
      }
      assert.equal("distinct" in add.hashval, false);
      assert.equal("distinct" in api.unionAggregate, false);
      for (const native of [`${hllNamespace}.hll_add_agg(distinct hv)`, `${hllNamespace}.hll_union_agg(distinct h)`])
        await assert.rejects(client.query(`select ${native} from hll_rows`), /could not identify an equality operator/);
      const filtered = await connection.transaction((db) =>
        db.select({ value: add.hashval.filter(sql<boolean>`g <= 3`, hv) }).from(sql`hll_rows`),
      );
      const nativeFiltered = (
        await client.query(`select (${hllNamespace}.hll_add_agg(hv) filter (where g <= 3))::text value from hll_rows`)
      ).rows[0]!.value;
      assert.equal(hllSketchText(filtered[0]!.value), nativeFiltered);
      const running = await connection.transaction((db) =>
        db
          .select({ value: add.hashval.over({ orderBy: [sql`g`] }, hv) })
          .from(sql`hll_rows`)
          .where(sql`g <= 30`)
          .orderBy(sql`g`),
      );
      const nativeRunning = (
        await client.query(
          `select (${hllNamespace}.hll_add_agg(hv) over (order by g))::text value from hll_rows where g <= 30 order by g`,
        )
      ).rows.map((row) => row.value);
      assert.equal(running.length, 30);
      assert.deepEqual(
        running.map((row) => hllSketchText(row.value)),
        nativeRunning,
      );
    }, hllAggregateProofCase.id);
  },
  120000,
);

extensionProofTest(
  hllSchemaProofCase,
  async () => {
    await proveCaseMembers(hllSchemaProofCase, hllProofSchema, async () => {
      await withHllApi(async ({ client, connection, api }) => {
        const table = hllManaged.tables.sketches;
        const native = (await client.query(`select lhs::text lhs, rhs::text rhs, hv::text hv from hll_inputs`))
          .rows[0]!;
        const lhs = api.codec.decode(native.lhs),
          rhs = api.codec.decode(native.rhs),
          hv = api.hashvalCodec.decode(native.hv);
        const history: PostgreSqlArray<HllSketch> = {
          dimensions: [
            { lowerBound: -1, length: 2 },
            { lowerBound: 4, length: 2 },
          ],
          values: [
            [lhs, null],
            [rhs, lhs],
          ],
        };
        const hashes: PostgreSqlArray<bigint> = {
          dimensions: [{ lowerBound: 0, length: 3 }],
          values: [hv, null, -9223372036854775808n],
        };
        const sized = (await client.query(`select ${hllNamespace}.hll_empty(10,4,-1,1)::text value`)).rows[0]!.value;
        const inserted = await connection.transaction((db) =>
          db
            .insert(table)
            .values({
              value: rhs,
              sized: api.codec.decode(sized),
              history,
              hash: hv,
              hashes,
            })
            .returning(),
        );
        const { _id, _createdAt, ...row } = inserted[0]!;
        assert.deepEqual(row, {
          value: rhs,
          sized: api.codec.decode(sized),
          history,
          hash: hv,
          hashes,
        });
        // Native text input/output and stored modifiers are read independently of the adapter.
        const stored = (
          await client.query(
            `select value::text value, sized::text sized, history::text history, hash::text hash, hashes::text hashes,
               pg_catalog.format_type(a.atttypid, a.atttypmod) sized_type from app.sketches,
               pg_attribute a where a.attrelid='app.sketches'::regclass and a.attname='sized'`,
          )
        ).rows[0]!;
        assert.equal(stored.value, native.rhs);
        assert.equal(stored.hash, native.hv);
        const element = (text: string) => `"${text.replaceAll("\\", "\\\\")}"`;
        assert.equal(
          stored.history,
          `[-1:0][4:5]={{${element(native.lhs)},NULL},{${element(native.rhs)},${element(native.lhs)}}}`,
        );
        assert.equal(stored.hashes, `[0:2]={${native.hv},NULL,-9223372036854775808}`);
        assert.equal(stored.sized_type, `${hllNamespace}.hll(10,4,-1,1)`);
        assert.deepEqual(api.arrayCodec.decode(stored.history), history);
        assert.deepEqual(api.hashvalArrayCodec.decode(stored.hashes), hashes);
        // The typmod coercion rejects a sketch whose metadata disagrees with hll(10,4,-1,1).
        await assert.rejects(
          connection.transaction((db) => db.insert(table).values({ sized: rhs })),
          (error: Error) => /register width does not match: source uses 5 and dest uses 4/.test(String(error.cause)),
        );
        const equal = await connection.transaction((db) =>
          db
            .select({ id: sql<number>`1` })
            .from(table)
            .where(sql`${table.value} operator(${sql.raw(hllNamespace)}.=) ${table.value}`),
        );
        assert.equal(equal.length, 1);
        // Binary send/receive round trip: hll_send bytes cast back through the binary-coercible bytea->hll path.
        const binary = (
          await client.query(`select (${hllNamespace}.hll_send(value)::${hllType})::text value from app.sketches`)
        ).rows[0]!.value;
        assert.equal(binary, native.rhs);
        const desired = await createSnapshot(hllManaged),
          observed = await inspectSnapshot(connection.db, "app");
        assert.deepEqual(observed, desired);
        assert.equal(snapshotHash(observed), snapshotHash(desired));
        for (const invalid of ["\\x00", "\\x", "zz"])
          await assert.rejects(client.query(`select $1::${hllType}`, [invalid]));
        for (const invalid of ["zz", "9223372036854775808"])
          await assert.rejects(client.query(`select $1::${hllHashvalType}`, [invalid]));
        assert.equal(
          (
            await client.query(
              `select ${hllNamespace}.hll_typmod_out(${hllNamespace}.hll_typmod_in('{12,5,-1,1}'::cstring[]))::text value`,
            )
          ).rows[0]!.value,
          "(12,5,-1,1)",
        );
      }, hllSchemaProofCase.id);
    });
  },
  90000,
);

extensionProofTest(
  hllToolingProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const admin = new pg.Client({ connectionString: url });
      await admin.connect();
      try {
        await admin.query(
          `create schema ${hllNamespace}; create extension hll with schema ${hllNamespace} version '2.21'; create table hll_marker(id int)`,
        );
        await observeExtensionProofDatabase(url, hllToolingProofCase.id, "hll");
        const descriptor = {
          name: "hll",
          version: "2.21",
          schema: hllToolingSchema,
          apiSupport: { status: "verified", digest: hllDigest },
        } as const;
        const emptyText = `select ${hllNamespace}.hll_empty()::text value`;
        const empty = async (client: pg.Client) => (await client.query(emptyText)).rows[0]!.value;
        const builtIn = await empty(admin);
        assert.equal(builtIn, "\\x118b7f");
        const textRow = v.pipe(
          v.strictObject({ value: v.string() }),
          v.transform((row) => row.value),
        );
        const pidRow = v.pipe(
          v.strictObject({ pid: v.number() }),
          v.transform((row) => row.pid),
        );
        const failure = v.instance(Error);
        const pid = async (session: HllSession) =>
          v.parse(v.tuple([v.number()]), await session.query("select pg_catalog.pg_backend_pid() pid", pidRow))[0];
        const [defaults, sparse, output] = hllToolingProofCase.claims;
        let owned = 0;
        const result = await withHllSession(url, descriptor, async (session) => {
          assert.equal("client" in session, false);
          owned = await pid(session);
          await extensionProofWitness({ ...defaults!, schema: hllToolingSchema }, async () => {
            assert.deepEqual(await session.setDefaults({ log2m: 10, regwidth: 4, expthresh: 0, sparseon: 0 }), {
              log2m: 11,
              regwidth: 5,
              expthresh: -1,
              sparseon: 1,
            });
            assert.deepEqual(await session.query(emptyText, textRow), ["\\x116a00"]);
            assert.deepEqual(
              await session.query(
                "select $1::int value, $2::text label",
                v.strictObject({ value: v.number(), label: v.string() }),
                [7, "a"],
              ),
              [{ value: 7, label: "a" }],
            );
            assert.deepEqual(await session.setDefaults({ log2m: 12, regwidth: 5, expthresh: -1, sparseon: 1 }), {
              log2m: 10,
              regwidth: 4,
              expthresh: 0,
              sparseon: 0,
            });
            assert.deepEqual(await session.query(emptyText, textRow), ["\\x118c7f"]);
            assert.equal(await empty(admin), builtIn);
          });
          await extensionProofWitness({ ...sparse!, schema: hllToolingSchema }, async () => {
            const query = `select ${hllNamespace}.hll_add_agg(${hllNamespace}.hll_hash_integer(g),10,4,0,1)::text value from generate_series(1,3) g`;
            const [sparseValue] = await session.query(query, textRow);
            assert.equal(await session.setMaxSparse(0), -1);
            const [fullValue] = await session.query(query, textRow);
            assert.match(sparseValue!, /^\\x136a/);
            assert.match(fullValue!, /^\\x146a/);
            assert.equal(await session.setMaxSparse(-1), 0);
            assert.equal((await admin.query(query)).rows[0]!.value, sparseValue);
          });
          await extensionProofWitness({ ...output!, schema: hllToolingSchema }, async () => {
            assert.equal(await session.setOutputVersion(1), 1);
          });
          return "settled";
        });
        assert.deepEqual(result, { completion: "committed", value: "settled" });
        // The owned backend ended with the operation, taking its process-local settings with it.
        assert.deepEqual(
          (await admin.query("select count(*)::int count from pg_stat_activity where pid=$1", [owned])).rows,
          [{ count: 0 }],
        );
        assert.equal(await empty(admin), builtIn);
        const fresh = new pg.Client({ connectionString: url });
        await fresh.connect();
        try {
          assert.equal(await empty(fresh), builtIn);
        } finally {
          await fresh.end();
        }
        const failed = async <Result>(operation: (session: HllSession) => Promise<Result>, signal?: AbortSignal) => {
          try {
            await withHllSession(url, descriptor, operation, signal);
          } catch (cause) {
            assert(cause instanceof ExtensionOperationError);
            return cause;
          }
          return assert.fail("hll session should fail");
        };
        // Native rejections of a setter or query latch the operation even when the caller floats and catches them.
        const rejected: ((session: HllSession) => Promise<number | string | HllDefaults>)[] = [
          (session: HllSession) => session.setOutputVersion(2),
          (session: HllSession) => session.setDefaults({ log2m: 40, regwidth: 5, expthresh: -1, sparseon: 1 }),
          async (session: HllSession) => {
            void session.query("select 1/0 value", textRow).catch(() => undefined);
            return "ignored";
          },
        ];
        for (const operation of rejected) {
          const error = await failed(operation);
          assert.equal(error.completion, "rolled-back");
          assert.match(v.parse(failure, error.cause).message, /output version must be 1|log2m|division by zero/);
        }
        // The session owns its transaction: control statements and multi-statement text are refused natively.
        for (const text of [
          "commit",
          "begin",
          "select 1) q; commit; select (1",
          "with w as (insert into hll_marker values (1) returning id) select id from w",
        ]) {
          const error = await failed(async (session) => {
            await session.query("select pg_catalog.lo_create(424242) id", v.strictObject({ id: v.number() }));
            return session.query(text, v.strictObject({ id: v.number() }));
          });
          assert.equal(error.completion, "rolled-back");
          assert.deepEqual(
            (
              await admin.query(
                "select (select count(*)::int from pg_largeobject_metadata where oid=424242) objects, (select count(*)::int from hll_marker) marks",
              )
            ).rows,
            [{ objects: 0, marks: 0 }],
            text,
          );
        }
        const controller = new AbortController();
        let aborted = 0;
        const abortedError = await failed(async (session) => {
          aborted = await pid(session);
          await session.setDefaults({ log2m: 10, regwidth: 4, expthresh: 0, sparseon: 0 });
          const pending = session.query(
            "select pg_catalog.pg_sleep(30)::text slept",
            v.strictObject({ slept: v.string() }),
          );
          controller.abort(new Error("operator abort"));
          return pending;
        }, controller.signal);
        assert.equal(v.parse(failure, abortedError.cause).message, "operator abort");
        assert.deepEqual(
          (await admin.query("select count(*)::int count from pg_stat_activity where pid=$1", [aborted])).rows,
          [{ count: 0 }],
        );
        assert.equal(await empty(admin), builtIn);
        await assert.rejects(
          withHllSession(
            url,
            { ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } },
            async () => 1,
          ),
          /exact verified 2.21 contract/,
        );
        // PostgreSQL refuses to create an internal-returning routine without an internal argument, so no SQL expression
        // can produce the sole argument of these legacy finalizers, and no captured aggregate, opfamily or type slot
        // invokes them natively.
        assert.deepEqual(
          (
            await admin.query(
              "select count(*)::int count from pg_proc p where p.pronamespace=$1::regnamespace and p.prorettype='internal'::regtype and not 'internal'::regtype = any(p.proargtypes::oid[])",
              [hllNamespace],
            )
          ).rows,
          [{ count: 0 }],
        );
        for (const claim of hllToolingProofCase.claims.slice(3))
          await extensionProofWitness({ ...claim, schema: hllToolingSchema }, async () => {
            const name = /\.(hll_\w+)\(/.exec(claim.member)![1]!;
            const catalog = (
              await admin.query(
                `select pg_catalog.pg_get_function_identity_arguments(p.oid) args from pg_proc p where p.pronamespace=$1::regnamespace and p.proname=$2`,
                [hllNamespace, name],
              )
            ).rows;
            assert.deepEqual(catalog, [{ args: "internal" }]);
            assert.equal(
              (
                await admin.query(
                  "select count(*)::int count from pg_aggregate a join pg_proc p on p.oid in (a.aggtransfn, a.aggfinalfn, a.aggcombinefn, a.aggserialfn, a.aggdeserialfn, a.aggmtransfn, a.aggminvtransfn, a.aggmfinalfn) where p.proname=$1",
                  [name],
                )
              ).rows[0]!.count,
              0,
            );
            await assert.rejects(admin.query(`select ${hllNamespace}.${name}(NULL)`), /does not exist/);
            await assert.rejects(
              admin.query(`select ${hllNamespace}.${name}(NULL::internal)`),
              /cannot cast type unknown to internal/,
            );
          });
      } finally {
        await admin.end();
      }
    });
  },
  90000,
);
