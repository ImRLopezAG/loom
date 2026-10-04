import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import * as v from "valibot";
import {
  prefixRange,
  type PrefixRange,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/prefix";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { float4Codec } from "../../../apps/loom/src/core/extensions/primitive-number-codecs";
import { checkedExtensionExpression, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { createSnapshot, inspectSnapshot, snapshotHash } from "../../../apps/loom/src/tooling/migrations/adapter";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import {
  prefixCases,
  prefixManaged,
  prefixNamespace,
  prefixType,
  withPrefixApi,
  type PrefixCase,
} from "../fixtures/prefix-api";
import {
  prefixOrdinaryProofCase,
  prefixCanonicalProofCase,
  prefixSchemaIndexProofCase,
  prefixCompositionProofCase,
  prefixNativeGraphProofCase,
  prefixProofSchema,
} from "../fixtures/prefix-proof-cases";
import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";

const nativeOracle = v.union([
  v.null(),
  v.string(),
  v.boolean(),
  v.number(),
  v.custom<Uint8Array>((value) => value instanceof Uint8Array),
]);

function oracleValue(kind: PrefixCase["kind"], value: v.InferOutput<typeof nativeOracle>) {
  if (value === null) return null;
  if (kind === "prefix_range") return v.parse(v.string(), value);
  if (kind === "bytea")
    return {
      hex: Buffer.from(
        v.parse(
          v.custom<Uint8Array>((item) => item instanceof Uint8Array),
          value,
        ),
      ).toString("hex"),
    };
  if (kind === "float4") return float4Codec.decode(value);
  return value;
}

extensionProofTest(
  prefixOrdinaryProofCase,
  async () => {
    await withPrefixApi(async ({ client, connection, api }) => {
      const cases = prefixCases(api);
      assert.equal(cases.length, 33);
      assert.deepEqual(cases.map((entry) => entry.member).sort(), Object.keys(api.sql.overloads).sort());
      for (const item of cases) {
        const claim = prefixOrdinaryProofCase.claims.find((claim) => claim.member === item.member);
        assert(claim);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
          const actual = (
            await connection.transaction((db) =>
              db.select({ value: item.expression }).from(sql`portable_prefix_inputs`),
            )
          )[0]!.value;
          const oracle = v.parse(
            nativeOracle,
            (
              await client.query(
                `select ${item.native}${item.kind === "prefix_range" ? "::text" : ""} value from portable_prefix_inputs`,
              )
            ).rows[0]!.value,
          );
          assert.deepEqual(actual, oracleValue(item.kind, oracle), item.member);
          for (const nulls of [
            `NULL::${prefixType} lhs,rhs`,
            `lhs,NULL::${prefixType} rhs`,
            `NULL::${prefixType} lhs,NULL::${prefixType} rhs`,
          ]) {
            const source = `(select ${nulls} from portable_prefix_inputs) portable_prefix_inputs`;
            const result = await connection.transaction((db) =>
              db.select({ value: item.expression }).from(sql.raw(source)),
            );
            const expected = (
              await client.query(
                `select ${item.native}${item.kind === "prefix_range" ? "::text" : ""} value from ${source}`,
              )
            ).rows.map((row) => ({ value: oracleValue(item.kind, v.parse(nativeOracle, row.value)) }));
            assert.deepEqual(result, expected, item.member);
          }
        });
      }
    }, prefixOrdinaryProofCase.id);
  },
  90000,
);

extensionProofTest(
  prefixCanonicalProofCase,
  async () => {
    await provePrefixCaseMembers(prefixCanonicalProofCase, async () => {
      await withPrefixApi(async ({ client, connection, api }) => {
        const cases: readonly [string, string][] = [
          ["123", "123"],
          ["123[4-6]", "123[4-6]"],
          ["[a-c]", "[a-c]"],
          ["123[4-4]", "1234"],
          ["123[6-4]", "123[4-6]"],
          ["01[]", "01"],
          ["[]", ""],
          ["7", "7"],
        ];
        for (const [input, canonical] of cases) {
          const native = (await client.query(`select $1::${prefixType}::text value`, [input])).rows[0]!.value;
          assert.equal(native, canonical, input);
          assert.equal(api.codec.decode(native), prefixRange(input));
          const result = checkedExtensionExpression(
            sql<PrefixRange>`${sql.param(api.codec.encode(prefixRange(input)))}::${sql.raw(prefixType)}`,
            nullableCodec(api.codec),
            [],
          );
          const actual = (
            await connection.transaction((db) => db.select({ value: result }).from(sql`(values (1)) fixture(id)`))
          )[0]!.value;
          assert.equal(actual, native);
        }
        const nativeCompare = (
          await client.query(
            `select ('123'::${prefixType} operator(${prefixNamespace}.=) '1234'::${prefixType}) equal, ${prefixNamespace}.prefix_range_cmp('123[4-6]'::${prefixType},'1234'::${prefixType}) cmp, ('123[4-6]'::${prefixType} operator(${prefixNamespace}.@>) '1234'::${prefixType}) contains, ('123[4-6]'::${prefixType} operator(${prefixNamespace}.&&) '123[5-8]'::${prefixType}) overlap, ${prefixNamespace}.prefix_range_inter('123[4-6]'::${prefixType},'123[5-8]'::${prefixType})::text "intersect", ${prefixNamespace}.prefix_range_union('123'::${prefixType},'1234'::${prefixType})::text "union"`,
          )
        ).rows[0]!;
        const comparison = await connection.transaction((db) =>
          db
            .select({
              equal: api.equal(prefixRange("123"), prefixRange("123[4-4]")),
              cmp: api.compare(prefixRange("123[4-6]"), prefixRange("1234")),
              contains: api.contains(prefixRange("123[4-6]"), prefixRange("1234")),
              overlap: api.overlaps(prefixRange("123[4-6]"), prefixRange("123[5-8]")),
              intersect: api.intersect(prefixRange("123[4-6]"), prefixRange("123[5-8]")),
              union: api.union(prefixRange("123"), prefixRange("1234")),
            })
            .from(sql`(values (1)) fixture(id)`),
        );
        assert.deepEqual(comparison, [nativeCompare]);
        for (const invalid of ["123[", "123]", "[-5]", "[4-]", "[4]", "123[4-5]x", "12[3-4]5"])
          await assert.rejects(client.query(`select $1::${prefixType}`, [invalid]));
      }, prefixCanonicalProofCase.id);
    });
  },
  90000,
);

extensionProofTest(
  prefixSchemaIndexProofCase,
  async () => {
    await provePrefixCaseMembers(prefixSchemaIndexProofCase, async () => {
      await withPrefixApi(async ({ client, connection, api }) => {
        const table = prefixManaged.tables.entries;
        const array: PostgreSqlArray<PrefixRange> = {
          dimensions: [
            { lowerBound: -2, length: 2 },
            { lowerBound: 3, length: 2 },
          ],
          values: [
            [prefixRange("123[4-6]"), null],
            [prefixRange("[a-c]"), prefixRange("01[0-9]")],
          ],
        };
        const inserted = await connection.transaction((db) =>
          db
            .insert(table)
            .values({ value: prefixRange("123[4-6]"), tags: array })
            .returning(),
        );
        assert.deepEqual(inserted[0]!.tags, array);
        assert.deepEqual(inserted[0]!.fallback, prefixRange("7"));
        const six: PostgreSqlArray<PrefixRange> = {
          dimensions: Array.from({ length: 6 }, (_, i) => ({ lowerBound: i - 3, length: 1 })),
          values: [[[[[[prefixRange("1")]]]]]],
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
        const raw = '[-2:-1][3:4]={{"123[4-6]",NULL},{"[a-c]","01[0-9]"}}';
        assert.deepEqual(
          api.arrayCodec.decode((await client.query(`select $1::${prefixType}[]::text value`, [raw])).rows[0]!.value),
          array,
        );
        const desired = await createSnapshot(prefixManaged),
          observed = await inspectSnapshot(connection.db, "app");
        const { id: _observedId, prevIds: _observedPrev, ...observedBody } = observed;
        const { id: _desiredId, prevIds: _desiredPrev, ...desiredBody } = desired;
        assert.deepEqual(observedBody, desiredBody);
        assert.equal(snapshotHash(observed), snapshotHash(desired));
        const classes = (
          await client.query(
            `select am.amname,c.opcname,n.nspname from pg_index i join pg_class t on t.oid=i.indrelid join pg_opclass c on c.oid=i.indclass[0] join pg_namespace n on n.oid=c.opcnamespace join pg_am am on am.oid=c.opcmethod where t.oid='app.entries'::regclass and n.nspname=$1 order by am.amname`,
            [api.schema],
          )
        ).rows;
        assert.deepEqual(classes, [
          { amname: "btree", opcname: "btree_prefix_range_ops", nspname: api.schema },
          { amname: "gist", opcname: "gist_prefix_range_ops", nspname: api.schema },
        ]);
        for (const method of ["btree", "gist"] as const) {
          const name = `prefix_${method}_native`,
            opclass = method === "gist" ? "gist_prefix_range_ops" : "btree_prefix_range_ops";
          await client.query(
            `create table ${name}(id int,value ${prefixType}); insert into ${name} select x, lpad(x::text, 4, '0')::${prefixType} from generate_series(1,5000) x; create index ${name}_oracle on ${name} using ${method}(value ${prefixNamespace}.${opclass})`,
          );
          await client.query(
            `insert into ${name} select x, lpad(x::text, 4, '0')::${prefixType} from generate_series(5001,6500) x; insert into ${name} values(7001,'123[4-6]'),(7002,'1234'),(7003,'7'),(7004,NULL); analyze ${name}`,
          );
          const operators = method === "gist" ? ["@>", "<@", "=", "&&"] : ["<", "<=", "=", ">=", ">"];
          for (const operator of operators) {
            const query = `select id from ${name} where value operator(${prefixNamespace}.${operator}) '1234'::${prefixType} order by id`;
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
      }, prefixSchemaIndexProofCase.id);
    });
  },
  90000,
);

extensionProofTest(prefixCompositionProofCase, async () => {
  await withPrefixApi(async ({ client, connection, api }) => {
    const table = prefixManaged.tables.entries;
    const subquery = connection.db
      .select({ value: api.union(prefixRange("123"), prefixRange("1234")).as('prefix"alias') })
      .from(sql`(values (1)) fixture(id)`)
      .as('subquery"日本');
    const actual = await connection.transaction((db) =>
      db
        .select({
          length: api.length(subquery.value),
          cmp: api.compare(subquery.value, prefixRange("123")),
          contains: api.contains(subquery.value, prefixRange("1234")),
        })
        .from(subquery),
    );
    const expected = (
      await client.query(
        `select ${prefixNamespace}.length(value)::int length, ${prefixNamespace}.prefix_range_cmp(value,'123'::${prefixType}) cmp, value operator(${prefixNamespace}.@>) '1234'::${prefixType} contains from (select ${prefixNamespace}.prefix_range_union('123'::${prefixType},'1234'::${prefixType}) value) fixture`,
      )
    ).rows[0]!;
    assert.deepEqual(actual, [expected]);
    await assert.rejects(
      connection.transaction(async (db) => {
        await db.insert(table).values({ value: prefixRange("99") });
        await db
          .select({ value: api.length(sql<PrefixRange>`${sql.param("123[")}::${sql.raw(prefixType)}`) })
          .from(sql`(values (1)) fixture(id)`);
      }),
    );
    assert.equal((await client.query("select count(*)::int count from app.entries")).rows[0]!.count, 0);
  }, prefixCompositionProofCase.id);
});

extensionProofTest(prefixNativeGraphProofCase, async () => {
  await withPrefixApi(async ({ client, api }) => {
    const owners = `
      (select count(*) from pg_amproc a where a.amproc=p.oid) +
      (select count(*) from pg_operator o where p.oid in (o.oprcode,o.oprrest,o.oprjoin)) +
      (select count(*) from pg_type t where p.oid in (t.typinput,t.typoutput,t.typreceive,t.typsend,t.typmodin,t.typmodout,t.typsubscript)) +
      (select count(*) from pg_aggregate a where p.oid in (a.aggtransfn,a.aggfinalfn,a.aggcombinefn,a.aggserialfn,a.aggdeserialfn,a.aggmtransfn,a.aggminvtransfn,a.aggmfinalfn)) +
      (select count(*) from pg_proc c where c.prosupport=p.oid) +
      (select count(*) from pg_am a where a.amhandler=p.oid) +
      (select count(*) from pg_trigger t where t.tgfoid=p.oid) +
      (select count(*) from pg_range r where p.oid in (r.rngcanonical,r.rngsubdiff)) +
      (select count(*) from pg_transform t where p.oid in (t.trffromsql,t.trftosql))`;
    for (const claim of prefixNativeGraphProofCase.claims) {
      const name = /\.([a-z_]+)\(/.exec(claim.member)?.[1];
      assert(name);
      const arity = name === "gpr_consistent" ? 4 : 2;
      const nativeSignature =
        name === "gpr_consistent"
          ? `array['internal'::regtype::oid, '${prefixNamespace}.prefix_range'::regtype::oid, 'int2'::regtype::oid, 'oid'::regtype::oid]`
          : `array['internal'::regtype::oid, 'internal'::regtype::oid]`;
      await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
        const native = await client.query(
          `select array(select unnest(p.proargtypes::oid[])) = ${nativeSignature} exact_signature, (${owners})::int owners
           from pg_proc p where p.pronamespace=$1::regnamespace and p.proname=$2 and p.pronargs=$3`,
          [prefixNamespace, name, arity],
        );
        assert.deepEqual(native.rows, [{ exact_signature: true, owners: 0 }]);
        // PostgreSQL cannot construct an internal argument from a SQL literal; this rejects before the C body.
        await assert.rejects(
          client.query(`select ${prefixNamespace}.${name}(NULL::internal)`),
          /cannot cast type unknown to internal/,
        );
      });
    }
  }, prefixNativeGraphProofCase.id);
});

async function provePrefixCaseMembers(definition: ExtensionProofCase, work: () => Promise<void>): Promise<void> {
  const prove = async (index: number): Promise<void> => {
    const claim = definition.claims[index];
    if (!claim) return work();
    await extensionProofWitness({ ...claim, schema: prefixProofSchema }, () => prove(index + 1));
  };
  await prove(0);
}
