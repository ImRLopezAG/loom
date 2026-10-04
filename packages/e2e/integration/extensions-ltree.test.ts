import { expect } from "bun:test";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  ltreeEdgeProofCase,
  ltreeIndexScenario,
  ltreeNativeProofCase,
  ltreeNativeGraphProofCase,
  ltreeProofFamily,
  ltreeProofSchema,
  ltreeQueryScenario,
  ltreeSchemaProofCase,
  ltreeStorageScenario,
} from "../fixtures/ltree-proof-cases";
import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { asc, defineRelations, sql, type SQL, type SQLWrapper } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { withExtensionDatabase } from "../fixtures/extension-database";
import characterization from "../fixtures/ltree-native-characterization.json";
import {
  createLtree_1_3,
  ltree,
  lquery,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/ltree";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { deserializeRpcValue, rpcValue, serializeRpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/ltree.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const schemaName = ltreeProofSchema;
assert.equal(characterization.schema, schemaName);
const qualified = pg.escapeIdentifier(schemaName);
const api = createLtree_1_3({
  name: "ltree",
  version: "1.3",
  schema: schemaName,
  apiSupport: { status: "verified", digest: "f0d5b39c468e80a8748a7a35ed30af0e530da547c2c15ebcaee307e34090c82e" },
});
const array = (...values: (string | null)[]): PostgreSqlArray<string> => ({
  dimensions: values.length ? [{ lowerBound: 1, length: values.length }] : [],
  values,
});
const schema = defineSchema(
  () => ({
    nodes: defineTable(
      {
        path: api.field().notNull(),
        tags: api.pathSetField().notNull().default({ dimensions: [], values: [] }),
        history: api.arrayField(),
        pattern: api.queryField(),
        patterns: api.queryArrayField(),
        search: api.textQueryField(),
        searches: api.textQueryArrayField(),
      },
      {
        indexes: [
          { fields: ["path"], extension: api.indexes.btree() },
          { fields: ["path"], extension: api.indexes.hash() },
          { fields: ["path"], extension: api.indexes.gist({ siglen: 100 }) },
          { fields: ["tags"], extension: api.indexes.arrayGist({ siglen: 4 }) },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
const relations = defineRelations(schema.tables);
const dialect = extensionSqlDialect(nodePgCodecs);
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Validate decoded native values at the real RPC serialization boundary.
const rpc = (value: unknown) => deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, value)));

async function fixture(
  caseId: string,
  work: (connection: Awaited<ReturnType<typeof connectDatabase>>, admin: pg.Client) => Promise<void>,
) {
  await withExtensionDatabase(async (url) => {
    const admin = new pg.Client({ connectionString: url });
    await admin.connect();
    try {
      const server = await admin.query<{ server_version_num: string }>("SHOW server_version_num");
      expect(Math.floor(Number(server.rows[0]!.server_version_num) / 10000)).toBe(18);
      await admin.query(`create schema ${qualified}; create extension ltree with schema ${qualified} version '1.3'`);
      await observeExtensionProofDatabase(url, caseId, "ltree");
      const installed = await admin.query("select extversion from pg_extension where extname='ltree'");
      expect(installed.rows).toEqual([{ extversion: "1.3" }]);
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
        await admin.query(statement);
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      try {
        await work(connection, admin);
      } finally {
        await connection.close();
      }
    } finally {
      await admin.end();
    }
  });
}
const select = (connection: Awaited<ReturnType<typeof connectDatabase>>, columns: Record<string, SQL>) =>
  connection.transaction((db) => db.select(columns).from(sql`(values (1)) as fixture(id)`));
async function sqlstate(work: () => Promise<void>) {
  try {
    await work();
  } catch (error) {
    return v.parse(v.object({ cause: v.object({ code: v.string() }) }), error).cause.code;
  }
  throw new Error("Expected native ltree failure");
}
const failure = (connection: Awaited<ReturnType<typeof connectDatabase>>, expression: SQL) =>
  sqlstate(async () => {
    await select(connection, { value: expression });
  });

// The same positional literals as run-ltree-native-characterization.ts, here supplied through typed codecs.
const samples = {
  "$extension:ltree.ltree": ["Top.Science.Astronomy", "Top.Science", "Top.Science.Astronomy.Stars"],
  "$extension:ltree._ltree": [array("Top.Science", "Top.Arts"), array("Top.Collections.Pictures", "Top.Science")],
  "$extension:ltree.lquery": ["*.Science.*"],
  "$extension:ltree._lquery": [array("*.Arts", "*.Science")],
  "$extension:ltree.ltxtquery": ["Astro* & !Arts"],
  "pg_catalog.text": ["Leaf"],
  "pg_catalog.int4": [1, 2, 3],
  "pg_catalog.int8": [7n],
} satisfies Readonly<Record<string, readonly (string | number | bigint | PostgreSqlArray<string>)[]>>;
const callable = v.custom<(...values: unknown[]) => SQL>((value) => v.is(v.function(), value));
const builderTree = v.record(v.string(), v.union([callable, v.record(v.string(), callable)]));

extensionProofTest(
  ltreeNativeProofCase,
  async () => {
    const members = new Map(manifest.contract.members.map((member) => [member.id, member]));
    const observed = new Map(characterization.observations.map((entry) => [entry.member, entry]));
    const typeName = (type: { readonly namespace: string | null; readonly name: string }) =>
      `${type.namespace}.${type.name}`;
    const operand = (type: { readonly namespace: string | null; readonly name: string }, position: number) => {
      const values = Object.entries(samples).find(([name]) => name === typeName(type))?.[1];
      assert(values, typeName(type));
      return values[position % values.length];
    };
    // Pair each exported builder with the one captured member it emits, by calling it with that member's operands.
    const built = new Map<string, SQL>();
    for (const [kind, tree] of [
      ["routine", api.sql.functions],
      ["operator", api.sql.operators],
    ] as const) {
      for (const [name, entry] of Object.entries(v.parse(builderTree, tree))) {
        const leaves = v.is(callable, entry) ? [entry] : Object.values(entry);
        for (const leaf of leaves) {
          const candidates = [...members.values()].filter((member) => member.kind === kind && member.name === name);
          const matches = candidates.flatMap((member) => {
            const operands =
              member.kind === "routine"
                ? member.arguments.map((argument, index) => operand(argument.type, index))
                : member.kind === "operator" && member.left && member.right
                  ? [operand(member.left, 0), operand(member.right, 1)]
                  : [];
            try {
              const expression = leaf(...operands);
              return extensionExpressionContract(expression)?.member === member.id
                ? [[member.id, expression] as const]
                : [];
            } catch {
              return [];
            }
          });
          expect(matches).toHaveLength(1);
          built.set(matches[0]![0], matches[0]![1]);
        }
      }
    }
    expect(built.size).toBe(102);
    await fixture(ltreeNativeProofCase.id, async (connection) => {
      const ids = [...built.keys()];
      const [row] = await select(connection, Object.fromEntries(ids.map((id, index) => [`m${index}`, built.get(id)!])));
      assert(row);
      // Strict NULL propagation through every public builder.
      const nulls = await select(
        connection,
        Object.fromEntries(
          ids.map((id, index) => {
            const member = members.get(id)!;
            const arity = member.kind === "routine" ? member.arguments.length : 2;
            const leaf = [
              ...Object.values(v.parse(builderTree, api.sql.functions)),
              ...Object.values(v.parse(builderTree, api.sql.operators)),
            ]
              .flatMap((entry) => (v.is(callable, entry) ? [entry] : Object.values(entry)))
              .find((candidate) => {
                try {
                  return (
                    extensionExpressionContract(candidate(...Array.from({ length: arity }, () => null)))?.member === id
                  );
                } catch {
                  return false;
                }
              });
            assert(leaf, id);
            return [`m${index}`, leaf(...Array.from({ length: arity }, () => null))];
          }),
        ),
      );
      for (const [index, id] of ids.entries()) {
        const native = observed.get(id);
        assert(native && !("sqlstate" in native), id);
        await extensionProofWitness(
          { family: ltreeProofFamily, member: id, scenario: ltreeQueryScenario, schema: schemaName },
          () => {
            const value = row[`m${index}`];
            const text =
              value === null
                ? null
                : v.is(v.object({ hex: v.string() }), value)
                  ? `\\x${value.hex}`
                  : v.parse(v.union([v.string(), v.number(), v.bigint(), v.boolean()]), value).toString();
            expect([id, text]).toEqual([id, native.result]);
            expect([id, nulls[0]![`m${index}`]]).toEqual([id, null]);
          },
        );
      }
    });
  },
  180000,
);

extensionProofTest(
  ltreeEdgeProofCase,
  async () => {
    await fixture(ltreeEdgeProofCase.id, async (connection) => {
      const [row] = await select(connection, {
        empty: api.nlevel(""),
        emptyHash: api.hash(""),
        unicode: api.nlevel("日本.ü"),
        unicodeMatch: api.matches("日本.ü", "日本.*"),
        foldedUnicode: api.matches("Ü", "ü@"),
        caseSensitive: api.equal("a.B", "a.b"),
        caseFolded: api.matches("Top.science", "*.Science@.*"),
        textCase: api.search("Top.Science", "science@ & Top"),
        textLabelCase: api.search("Top.Science", "science@ & top"),
        textPrefixCase: api.search("Top.Science", "sci*"),
        underscoreWord: api.matches("a_b", "a%"),
        hyphenWord: api.matches("a-b.c_d", "a%"),
        byteOrder: api.lessThan("a", "B"),
        shorterFirst: api.lessThan("a.b", "a.b.c"),
        labelOrder: api.lessThan("a.z", "aa"),
        lcaEmpty: api.lca("", ""),
        lcaRoot: api.lca("a", "b"),
        lcaSelf: api.lca("1.2.3", "1.2.3"),
        lcaNone: api.lcaArray(array()),
        lcaMany: api.lca("a.b", "a.c", "a.d", "a.e", "a.f", "a.g", "a.h.i"),
        firstNone: api.firstAncestor(array("a.b", "a.c"), "z"),
        emptyAny: api.anyAncestor(array(), "a"),
        emptyQueries: api.matchesAny("a.b", array()),
        fromEnd: api.subpath("a.b.c.d", -2),
        leaveOff: api.subpath("a.b.c.d", 1, -1),
        indexMiss: api.index("a.b", "x"),
        indexFromEnd: api.index("a.b.c.b.c", "b.c", -2),
        longest: api.nlevel(ltree("x".repeat(1000))),
        deepest: api.nlevel(`${"a.".repeat(65534)}a`),
        concatEmpty: api.concat("", ""),
        queryCanonical: sql<string>`${lquery("a|B@*%.*{1,}")}::${sql.raw(qualified)}.lquery::text`,
      });
      expect(row).toEqual({
        empty: 0,
        emptyHash: 1,
        unicode: 2,
        unicodeMatch: true,
        foldedUnicode: true,
        caseSensitive: false,
        caseFolded: true,
        textCase: true,
        textLabelCase: false,
        textPrefixCase: false,
        underscoreWord: true,
        hyphenWord: false,
        byteOrder: false,
        shorterFirst: true,
        labelOrder: true,
        lcaEmpty: null,
        lcaRoot: "",
        lcaSelf: "1.2",
        lcaNone: null,
        lcaMany: "a",
        firstNone: null,
        emptyAny: false,
        emptyQueries: false,
        fromEnd: "c.d",
        leaveOff: "b.c",
        indexMiss: -1,
        indexFromEnd: 3,
        longest: 1,
        deepest: 65535,
        concatEmpty: "",
        queryCanonical: "a|B%@*.*{1,}",
      });
      assert.deepEqual(rpc(row), row);
      // PostgreSQL owns grammar and limits; Kello forwards the text and surfaces the native SQLSTATE.
      expect(await failure(connection, api.nlevel("x".repeat(1001)))).toBe("42622");
      expect(await failure(connection, api.nlevel(`${"a.".repeat(65535)}a`))).toBe("54000");
      expect(await failure(connection, api.nlevel("a b"))).toBe("42601");
      expect(await failure(connection, api.nlevel("a..b"))).toBe("42601");
      expect(await failure(connection, api.matches("a", "a.."))).toBe("42601");
      expect(await failure(connection, api.search("a", "&"))).toBe("42601");
      expect(await failure(connection, api.subpath("a.b", 5))).toBe("22023");
      expect(await failure(connection, api.subltree("a.b", 2, 1))).toBe("22023");
      expect(await failure(connection, api.anyAncestor(array("a.b", null), "a.b.c"))).toBe("22004");
      expect(await failure(connection, api.lcaArray(array("a.b", null)))).toBe("22004");
      expect(await failure(connection, api.matchesAny("a", array("a", null)))).toBe("22004");
      const matrix = {
        dimensions: [
          { lowerBound: 1, length: 1 },
          { lowerBound: 1, length: 1 },
        ],
        values: [["a"]],
      };
      expect(await failure(connection, api.anyAncestor(matrix, "a.b"))).toBe("2202E");
      expect(await failure(connection, api.matchesAny("a", matrix))).toBe("2202E");
    });
  },
  180000,
);

extensionProofTest(
  ltreeSchemaProofCase,
  async () => {
    await fixture(ltreeSchemaProofCase.id, async (connection, admin) => {
      const nodes = schema.tables.nodes;
      const rows = [
        { path: ltree("Top"), tags: { dimensions: [{ lowerBound: 1, length: 1 }], values: [ltree("Top")] } },
        {
          path: ltree("Top.Science"),
          tags: { dimensions: [{ lowerBound: 1, length: 2 }], values: [ltree("Top.Science"), ltree("Shared")] },
        },
        {
          path: ltree("Top.Science.Astronomy"),
          history: { dimensions: [{ lowerBound: -2, length: 2 }], values: [ltree("Old.Path"), null] },
        },
        {
          path: ltree("Top.Arts"),
          pattern: lquery("*.Arts"),
          patterns: { dimensions: [{ lowerBound: 1, length: 1 }], values: [lquery("Top.*")] },
        },
        {
          path: ltree("Top.Hobbies.Amateurs_Astronomy"),
          search: api.textQueryCodec.decode("Astro*"),
          searches: { dimensions: [], values: [] },
        },
      ];
      await connection.transaction((db) => db.insert(nodes).values(rows));
      const read = await connection.transaction((db) =>
        db
          .select({
            path: nodes.path,
            depth: api.nlevel(nodes.path),
            tags: nodes.tags,
            history: nodes.history,
            pattern: nodes.pattern,
            patterns: nodes.patterns,
            search: nodes.search,
            searches: nodes.searches,
          })
          .from(nodes)
          .where(api.isDescendant(nodes.path, "Top"))
          .orderBy(asc(nodes.path)),
      );
      expect(read.map((row) => row.path)).toEqual(
        ["Top", "Top.Arts", "Top.Hobbies.Amateurs_Astronomy", "Top.Science", "Top.Science.Astronomy"].map(ltree),
      );
      expect(read[0]).toMatchObject({
        depth: 1,
        tags: { dimensions: [{ lowerBound: 1, length: 1 }], values: ["Top"] },
      });
      expect(read[1]).toMatchObject({
        tags: { dimensions: [], values: [] },
        pattern: "*.Arts",
        patterns: { dimensions: [{ lowerBound: 1, length: 1 }], values: ["Top.*"] },
      });
      expect(read[2]).toMatchObject({ search: "Astro*", searches: { dimensions: [], values: [] } });
      expect(read[4]).toMatchObject({
        history: { dimensions: [{ lowerBound: -2, length: 2 }], values: ["Old.Path", null] },
      });
      assert.deepEqual(rpc(read), read);
      for (const type of ["ltree", "_ltree", "lquery", "_lquery", "ltxtquery", "_ltxtquery"])
        await extensionProofWitness(
          {
            family: ltreeProofFamily,
            member: `type:$extension:ltree.${type}`,
            scenario: ltreeStorageScenario,
            schema: schemaName,
          },
          async () => {
            const column = await admin.query<{ schema: string; type: string }>(
              "select n.nspname as schema, t.typname as type from pg_attribute a join pg_type t on t.oid=a.atttypid join pg_namespace n on n.oid=t.typnamespace where a.attrelid='app.nodes'::regclass and a.attnum>0 and t.typname=$1 limit 1",
              [type],
            );
            expect(column.rows).toEqual([{ schema: schemaName, type }]);
          },
        );
      const searched = await connection.transaction((db) =>
        db.select({ path: nodes.path }).from(nodes).where(api.search(nodes.path, "Astro*")).orderBy(asc(nodes.path)),
      );
      expect(searched).toEqual([{ path: ltree("Top.Science.Astronomy") }]);
      const tagged = await connection.transaction((db) =>
        db.select({ path: nodes.path }).from(nodes).where(api.anyAncestor(nodes.tags, "Shared.Child")),
      );
      expect(tagged).toEqual([{ path: ltree("Top.Science") }]);
      // A NULL element or a matrix is storable in ltree[] but rejected by the gist__ltree_ops index on tags.
      const rejected = await sqlstate(async () => {
        await connection.transaction((db) =>
          db
            .insert(nodes)
            .values({ path: ltree("X"), tags: { dimensions: [{ lowerBound: 1, length: 1 }], values: [null] } }),
        );
      });
      expect(rejected).toBe("22004");
      // Selected-schema operator classes and parameters as created by the migration.
      const indexes = await admin.query<{ definition: string }>(
        "select pg_get_indexdef(indexrelid) definition from pg_index where indrelid='app.nodes'::regclass and not indisprimary order by indexrelid::regclass::text",
      );
      expect(indexes.rows.map((entry) => entry.definition.replace(/^CREATE INDEX \S+ ON app\.nodes /, ""))).toEqual([
        "USING btree (path)",
        "USING hash (path)",
        `USING gist (path ${qualified}.gist_ltree_ops (siglen='100'))`,
        `USING gist (tags ${qualified}.gist__ltree_ops (siglen='4'))`,
      ]);
      // Native index-assisted scans for typed ancestry, lquery, ltxtquery, array and equality predicates.
      const plan = async (predicate: SQLWrapper) => {
        const query = dialect.sqlToQuery(sql`explain (costs off) select 1 from "app"."nodes" where ${predicate}`);
        await admin.query("set enable_seqscan = off");
        const result = await admin.query<{ "QUERY PLAN": string }>(query.sql, query.params);
        return result.rows.map((entry) => entry["QUERY PLAN"]).join("\n");
      };
      for (const predicate of [
        api.isDescendant(nodes.path, "Top.Science"),
        api.isAncestor(nodes.path, "Top.Science.Astronomy"),
        api.matches(nodes.path, "*.Astronomy"),
        api.search(nodes.path, "Astro*"),
        api.matchesAny(nodes.path, array("*.Arts")),
      ])
        expect(await plan(predicate)).toContain("nodes_2_idx");
      // gist__ltree_ops captures <@(ltree[],ltree), @>(ltree,ltree[]), ~, @ and ? on arrays, but not @>(ltree[],ltree).
      for (const predicate of [
        api.anyDescendant(nodes.tags, "Shared"),
        api.sql.operators["@>"]["ltree,_ltree"]("Top", nodes.tags),
        api.anyMatches(nodes.tags, "Shared"),
        api.anySearch(nodes.tags, "Shared"),
        api.anyMatchesAny(nodes.tags, array("Shared")),
      ])
        expect(await plan(predicate)).toContain("nodes_3_idx");
      expect(await plan(api.anyAncestor(nodes.tags, "Shared.Child"))).toContain("Seq Scan on nodes");
      const classPlans = {
        ltree_ops: ["btree", "nodes_0_idx", api.lessThan(nodes.path, "Top.A")],
        hash_ltree_ops: ["hash", "nodes_1_idx", api.equal(nodes.path, "Top")],
        gist_ltree_ops: ["gist", "nodes_2_idx", api.isDescendant(nodes.path, "Top.Science")],
        gist__ltree_ops: ["gist", "nodes_3_idx", api.anyDescendant(nodes.tags, "Shared")],
      } as const;
      for (const [opclass, [method, index, predicate]] of Object.entries(classPlans))
        await extensionProofWitness(
          {
            family: ltreeProofFamily,
            member: `opclass:$extension:ltree.${opclass}/${method}`,
            scenario: ltreeIndexScenario,
            schema: schemaName,
          },
          async () => {
            const owner = await admin.query<{ index: string }>(
              "select i.indexrelid::regclass::text as index from pg_index i join pg_opclass c on c.oid=i.indclass[0] join pg_namespace n on n.oid=c.opcnamespace where i.indrelid='app.nodes'::regclass and c.opcname=$1 and n.nspname=$2",
              [opclass, schemaName],
            );
            expect(owner.rows).toEqual([{ index: `app.${index}` }]);
            // Hide the other classes that also serve the predicate so the planner must choose this one natively.
            await admin.query("begin");
            try {
              for (const other of ["nodes_0_idx", "nodes_1_idx", "nodes_2_idx"].filter((name) => name !== index))
                await admin.query(`drop index app.${other}`);
              expect(await plan(predicate)).toContain(index);
            } finally {
              await admin.query("rollback");
            }
          },
        );
      // Repeated migration of the same schema reports no drift.
      expect(await migrationStatements(await createSnapshot(schema), await createSnapshot(schema))).toEqual([]);
    });
  },
  180000,
);

extensionProofTest(ltreeNativeGraphProofCase, async () => {
  await fixture(ltreeNativeGraphProofCase.id, async (_connection, admin) => {
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
    for (const claim of ltreeNativeGraphProofCase.claims) {
      await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
        const native = await admin.query(
          `select p.proargtypes::oid[] @> array['internal'::regtype::oid] has_internal, (${owners})::int owners
           from pg_proc p where p.oid=$1::regprocedure`,
          [`${qualified}.ltreeparentsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)`],
        );
        assert.deepEqual(native.rows, [{ has_internal: true, owners: 0 }]);
        await assert.rejects(
          admin.query(`select ${qualified}.ltreeparentsel(NULL::internal,NULL::oid,NULL::internal,1::int4)`),
          /cannot cast type unknown to internal/,
        );
      });
    }
  });
});
