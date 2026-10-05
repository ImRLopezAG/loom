import { expect } from "bun:test";
import pg from "pg";
import assert from "node:assert/strict";
import { asc, defineRelations, eq, sql, type SQL } from "drizzle-orm";
import * as v from "valibot";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  semverGrammarProofCase,
  semverNativeProofCase,
  semverNativeProofClaims,
  semverProofSchema,
  semverSchemaProofCase,
  semverSchemaProofClaims,
  semverSessionProofCase,
} from "../fixtures/semver-proof-cases";
import {
  createSemver_0_40_0,
  semver,
  semverText,
  type SemverRange,
} from "../../../apps/loom/src/core/extensions/adapters/semver";
import { createSemverCodec } from "../../../apps/loom/src/core/extensions/adapters/semver-codecs";
import { checkedExtensionExpression } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withSemverSession, type SemverSession } from "../../../apps/loom/src/tooling/extensions/operations/semver";

const descriptor = {
  name: "semver",
  version: "0.40.0",
  schema: semverProofSchema,
  apiSupport: { status: "verified", digest: "5a21997dcf96a0af38e49bc1d9309905050a05f18e6afe15f37fb2a63722a86e" },
} as const;
const api = createSemver_0_40_0(descriptor);
const qualified = pg.escapeIdentifier(semverProofSchema);
const schema = defineSchema(
  () => ({
    releases: defineTable(
      {
        version: api.field().notNull(),
        history: api.arrayField(),
        supported: api.rangeField(),
        windows: api.rangeArrayField(),
        compatible: api.multirangeField(),
        matrix: api.multirangeArrayField(),
      },
      {
        indexes: [
          { fields: ["version"], extension: api.indexes.btree() },
          { fields: ["version"], extension: api.indexes.hash() },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
const relations = defineRelations(schema.tables);
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Validate the actual RPC serialization boundary for decoded native values.
const rpc = (value: unknown) => deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, value)));
const span = (lower: string | null, upper: string | null, lowerInclusive = true, upperInclusive = false) =>
  ({ empty: false, lower, upper, lowerInclusive: lower !== null && lowerInclusive, upperInclusive }) as const;

async function fixture(
  caseId: string,
  work: (connection: Awaited<ReturnType<typeof connect>>, admin: pg.Client) => Promise<void>,
) {
  await withExtensionDatabase(async (url) => {
    const admin = new pg.Client({ connectionString: url });
    await admin.connect();
    try {
      const server = await admin.query<{ server_version_num: string }>("SHOW server_version_num");
      expect(Math.floor(Number(server.rows[0]!.server_version_num) / 10000)).toBe(18);
      const available = await admin.query(
        "select version from pg_available_extension_versions where name='semver' and version='0.40.0'",
      );
      expect(available.rows).toHaveLength(1);
      await admin.query(
        `create schema ${qualified}; create extension semver with schema ${qualified} version '0.40.0'`,
      );
      await observeExtensionProofDatabase(url, caseId, "semver");
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
        await admin.query(statement);
      const connection = await connect(url);
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
const connect = (url: string) => connectDatabase({ schema, relations, connectionString: url });

extensionProofTest(
  semverNativeProofCase,
  async () => {
    await fixture(semverNativeProofCase.id, async (connection) => {
      const f = api.sql.functions,
        c = api.sql.casts,
        o = api.sql.operators;
      const range = span("1.0.0", "2.0.0");
      // Expected values are native semver 0.40.0 results; `missing` proves strict SQL NULL propagation.
      const cases: Record<
        keyof typeof semverNativeProofClaims,
        {
          expression: SQL;
          missing?: SQL;
          expected: unknown;
          extra?: readonly [SQL, unknown][];
          /** SQL-language wrappers call unqualified to_semver, so they resolve only through the session search_path. */
          searchPath?: true;
        }
      > = {
        semver_send: {
          expression: f.semver_send("1.2.3+b"),
          missing: f.semver_send(null),
          expected: { hex: "01312e322e332b62" },
        },
        cast_text: { expression: c.semver_to_text("1.2.3+b"), missing: c.semver_to_text(null), expected: "1.2.3+b" },
        cast_multirange: {
          expression: c.semverrange_to_semvermultirange(range),
          missing: c.semverrange_to_semvermultirange(null),
          expected: [range],
          extra: [[c.semverrange_to_semvermultirange(api.range("1.0.0+a", "1.0.0+b")), []]],
        },
        cast_float4: {
          expression: c.float4_to_semver(1.5),
          missing: c.float4_to_semver(null),
          expected: "1.5.0",
          searchPath: true,
        },
        cast_float8: {
          expression: c.float8_to_semver(1.25),
          missing: c.float8_to_semver(null),
          expected: "1.25.0",
          searchPath: true,
        },
        cast_int2: {
          expression: c.int2_to_semver(1),
          missing: c.int2_to_semver(null),
          expected: "1.0.0",
          searchPath: true,
        },
        cast_int4: {
          expression: c.int4_to_semver(-1),
          missing: c.int4_to_semver(null),
          expected: "0.0.0-1",
          searchPath: true,
        },
        cast_int8: {
          expression: c.int8_to_semver(3n),
          missing: c.int8_to_semver(null),
          expected: "3.0.0",
          searchPath: true,
        },
        cast_numeric: {
          expression: c.numeric_to_semver("1.234"),
          missing: c.numeric_to_semver(null),
          expected: "1.234.0",
          searchPath: true,
        },
        cast_from_text: {
          expression: c.text_to_semver(" 1.2.3-rc.1"),
          missing: c.text_to_semver(null),
          expected: "1.2.3-rc.1",
        },
        operator_lt: { expression: o["<"]("1.0.0-rc.1", "1.0.0"), missing: o["<"](null, "1.0.0"), expected: true },
        operator_le: { expression: o["<="]("1.0.0+b", "1.0.0+a"), missing: o["<="]("1.0.0", null), expected: true },
        operator_ne: { expression: o["<>"]("1.0.0+a", "1.0.0+b"), missing: o["<>"](null, null), expected: false },
        operator_eq: { expression: o["="]("1.0.0+a", "1.0.0+b"), missing: o["="](null, "1.0.0"), expected: true },
        operator_gt: { expression: o[">"]("10.0.0", "2.0.0"), missing: o[">"](null, "1.0.0"), expected: true },
        operator_ge: {
          expression: o[">="]("1.0.0-alpha", "1.0.0-alpha.1"),
          missing: o[">="]("1.0.0", null),
          expected: false,
        },
        get_semver_major: {
          expression: f.get_semver_major("1.2.3-rc.1+b"),
          missing: f.get_semver_major(null),
          expected: 1,
        },
        get_semver_minor: {
          expression: f.get_semver_minor("1.2.3-rc.1+b"),
          missing: f.get_semver_minor(null),
          expected: 2,
        },
        get_semver_patch: {
          expression: f.get_semver_patch("1.2.3-rc.1+b"),
          missing: f.get_semver_patch(null),
          expected: 3,
        },
        get_semver_prerelease: {
          expression: f.get_semver_prerelease("1.2.3-rc.1+b"),
          missing: f.get_semver_prerelease(null),
          expected: "rc.1",
          extra: [[f.get_semver_prerelease("1.2.3"), ""]],
        },
        hash_semver: {
          expression: f.hash_semver("1.0.0+a"),
          missing: f.hash_semver(null),
          expected: -272711505,
          extra: [[f.hash_semver("1.0.0"), -272711505]],
        },
        is_semver: {
          expression: f.is_semver("1.2.3-x"),
          missing: f.is_semver(null),
          expected: true,
          extra: [
            [f.is_semver("1.2"), false],
            [f.is_semver("v1.2.3"), false],
          ],
        },
        max: {
          expression: sql`(select ${f.max(sql`value`)} from (values ('1.0.0'::${sql.raw(qualified)}.semver), ('1.0.0-rc.1'), ('2.0.0+x'), (null)) fixture(value))`,
          missing: sql`(select ${f.max(sql`value`)} from (select null::${sql.raw(qualified)}.semver where false) fixture(value))`,
          expected: "2.0.0+x",
        },
        min: {
          expression: sql`(select ${f.min(sql`value`)} from (values ('1.0.0'::${sql.raw(qualified)}.semver), ('1.0.0-rc.1'), ('2.0.0+x'), (null)) fixture(value))`,
          missing: sql`(select ${f.min(sql`value`)} from (select null::${sql.raw(qualified)}.semver where false) fixture(value))`,
          expected: "1.0.0-rc.1",
        },
        semver_cmp: { expression: f.semver_cmp("2.0.0", "10.0.0"), missing: f.semver_cmp(null, "1.0.0"), expected: -1 },
        semver_eq: {
          expression: f.semver_eq("1.0.0+a", "1.0.0+b"),
          missing: f.semver_eq(null, "1.0.0"),
          expected: true,
        },
        semver_ge: {
          expression: f.semver_ge("1.0.0", "1.0.0-rc.1"),
          missing: f.semver_ge(null, "1.0.0"),
          expected: true,
        },
        semver_gt: {
          expression: f.semver_gt("1.0.0-beta.11", "1.0.0-beta.2"),
          missing: f.semver_gt(null, "1.0.0"),
          expected: true,
        },
        semver_larger: {
          expression: f.semver_larger("1.0.0+a", "1.0.0+b"),
          missing: f.semver_larger(null, "1.0.0"),
          expected: "1.0.0+a",
        },
        semver_le: {
          expression: f.semver_le("1.0.0", "1.0.0-rc.1"),
          missing: f.semver_le(null, "1.0.0"),
          expected: false,
        },
        semver_lt: {
          expression: f.semver_lt("1.0.0-alpha.1", "1.0.0-alpha.beta"),
          missing: f.semver_lt(null, "1.0.0"),
          expected: true,
        },
        semver_ne: { expression: f.semver_ne("1.0.0", "1.0.1"), missing: f.semver_ne(null, "1.0.0"), expected: true },
        semver_smaller: {
          expression: f.semver_smaller("1.0.0+a", "1.0.0"),
          missing: f.semver_smaller(null, "1.0.0"),
          expected: "1.0.0+a",
        },
        semver_float4: {
          expression: f.semver.float4(1.1),
          missing: f.semver.float4(null),
          expected: "1.1.0",
          searchPath: true,
        },
        semver_float8: {
          expression: f.semver.float8(1e20),
          missing: f.semver.float8(null),
          expected: "1.0.0-e+20",
          extra: [[f.semver.float8({ nonfinite: "Infinity" }), "0.0.0-Infinity"]],
          searchPath: true,
        },
        semver_int2: {
          expression: f.semver.int2(32767),
          missing: f.semver.int2(null),
          expected: "32767.0.0",
          searchPath: true,
        },
        semver_int4: {
          expression: f.semver.int4(2),
          missing: f.semver.int4(null),
          expected: "2.0.0",
          searchPath: true,
        },
        semver_int8: {
          expression: f.semver.int8(2147483647n),
          missing: f.semver.int8(null),
          expected: "2147483647.0.0",
          searchPath: true,
        },
        semver_numeric: {
          expression: f.semver.numeric({ nonfinite: "NaN" }),
          missing: f.semver.numeric(null),
          expected: "0.0.0-NaN",
          extra: [[f.semver.numeric("-1.5"), "0.0.0-1.5"]],
          searchPath: true,
        },
        semver_text: { expression: f.semver.text("1.2.3+x"), missing: f.semver.text(null), expected: "1.2.3+x" },
        multirange_empty: { expression: f.semvermultirange.empty(), expected: [] },
        multirange_variadic: {
          expression: f.semvermultirange.variadic(span("3.0.0", "4.0.0"), api.range("1.0.0", "3.0.0")),
          expected: [span("1.0.0", "4.0.0")],
          extra: [[api.multirange(span("5.0.0", null), range), [range, span("5.0.0", null)]]],
        },
        multirange_range: {
          expression: f.semvermultirange.range(range),
          missing: f.semvermultirange.range(null),
          expected: [range],
        },
        range_flags: {
          expression: f.semverrange.flags("1.0.0", "1.0.0", "[]"),
          expected: span("1.0.0", "1.0.0", true, true),
          extra: [[api.range(null, "1.0.0", "[]"), span(null, "1.0.0", false, true)]],
        },
        range: {
          expression: f.semverrange.bounds(null, "2.0.0"),
          expected: span(null, "2.0.0"),
          extra: [
            [api.range("1.0.0+a", "1.0.0+b"), { empty: true }],
            [api.range(null, null), span(null, null)],
          ],
        },
        text: { expression: f.text("1.2.3+x"), missing: f.text(null), expected: "1.2.3+x" },
        to_semver: {
          expression: f.to_semver("1.2"),
          missing: f.to_semver(null),
          expected: "1.2.0",
          extra: [
            [f.to_semver("v1.2.3"), "0.0.0-v1.2.3"],
            [f.to_semver("1.2.3-01"), "1.2.3-1"],
          ],
        },
      };
      for (const [key, claim] of Object.entries(semverNativeProofClaims)) {
        // SAFETY: Claim keys and cases are the same literal key set; a missing case fails the lookup assertion.
        const entry = cases[key as keyof typeof cases];
        assert(entry, `Missing native case for ${key}`);
        await extensionProofWitness({ ...claim, schema: semverProofSchema }, async () => {
          if (entry.searchPath)
            await assert.rejects(
              connection.db.select({ value: entry.expression }).from(sql`(values (1)) fixture(id)`),
              (error: Error) => v.is(v.object({ code: v.literal("42883") }), error.cause),
            );
          const selected = await connection.transaction(async (db) => {
            if (entry.searchPath) await db.execute(sql.raw(`set local search_path = ${qualified}, pg_catalog`));
            return db
              .select({
                value: entry.expression,
                missing: entry.missing ?? sql<null>`null`,
                ...Object.fromEntries((entry.extra ?? []).map(([expression], index) => [`extra${index}`, expression])),
              })
              .from(sql`(values (1)) fixture(id)`);
          });
          assert.deepEqual(selected, [
            {
              value: entry.expected,
              missing: null,
              ...Object.fromEntries((entry.extra ?? []).map(([, expected], index) => [`extra${index}`, expected])),
            },
          ]);
          assert.deepEqual(rpc(selected), selected);
        });
      }
      const rows = await connection.transaction(async (db) => {
        await db
          .insert(schema.tables.releases)
          .values(["2.0.0", "10.0.0", "1.0.0-rc.1", "1.0.0+build", "1.0.0-alpha"].map((version) => ({ version })));
        return db
          .select({ version: schema.tables.releases.version, major: api.major(schema.tables.releases.version) })
          .from(schema.tables.releases)
          .where(api.lessThan(schema.tables.releases.version, api.parse("10.0.0")))
          .orderBy(asc(schema.tables.releases.version));
      });
      expect(rows).toEqual([
        { version: "1.0.0-alpha", major: 1 },
        { version: "1.0.0-rc.1", major: 1 },
        { version: "1.0.0+build", major: 1 },
        { version: "2.0.0", major: 2 },
      ]);
      const matched = await connection.db
        .select({ version: schema.tables.releases.version })
        .from(schema.tables.releases)
        .where(eq(api.compare(schema.tables.releases.version, "1.0.0"), 0));
      expect(matched).toEqual([{ version: "1.0.0+build" }]);
      for (const failing of [
        api.parse("1.2"),
        api.fromInt8(2147483648n),
        api.fromInt2(-32768),
        api.range("2.0.0", "1.0.0"),
        api.multirange(range, sql`null::${sql.raw(qualified)}.semverrange`),
      ])
        await assert.rejects(connection.db.select({ value: failing }).from(sql`(values (1)) fixture(id)`));
    });
  },
  180000,
);

extensionProofTest(semverSchemaProofCase, async () => {
  await fixture(semverSchemaProofCase.id, async (connection, admin) => {
    const range = span("1.0.0", "2.0.0", true, true);
    const emptyRange: SemverRange = { empty: true };
    const value = {
      version: semver("1.2.3-rc.1+build.5"),
      history: { dimensions: [{ lowerBound: 0, length: 2 }], values: ["1.0.0", null] },
      supported: range,
      windows: { dimensions: [{ lowerBound: 1, length: 2 }], values: [range, emptyRange] },
      compatible: [span("3.0.0", "4.0.0"), span("1.0.0", "3.0.0")],
      matrix: { dimensions: [{ lowerBound: 1, length: 1 }], values: [[span(null, "1.0.0")]] },
    } as const;
    const [stored] = await connection.transaction((db) => db.insert(schema.tables.releases).values(value).returning());
    assert(stored);
    const read = await connection.db
      .select({
        version: schema.tables.releases.version,
        history: schema.tables.releases.history,
        supported: schema.tables.releases.supported,
        windows: schema.tables.releases.windows,
        compatible: schema.tables.releases.compatible,
        matrix: schema.tables.releases.matrix,
      })
      .from(schema.tables.releases);
    const expected = { ...value, compatible: [span("1.0.0", "4.0.0")] };
    const native = await admin.query(
      "select version::text, history::text, supported::text, windows::text, compatible::text, matrix::text from app.releases",
    );
    const indexes = await admin.query(
      "select am.amname, opc.opcname, n.nspname from pg_index i join pg_class c on c.oid=i.indexrelid join pg_am am on am.oid=c.relam join pg_opclass opc on opc.oid=i.indclass[0] join pg_namespace n on n.oid=opc.opcnamespace where i.indrelid='app.releases'::regclass and opc.opcname='semver_ops' order by am.amname",
    );
    const claims = semverSchemaProofClaims;
    const witness = (claim: (typeof claims)[keyof typeof claims], assertion: () => void) =>
      extensionProofWitness({ ...claim, schema: semverProofSchema }, assertion);
    await witness(claims.semver, async () => {
      assert.equal(read[0]!.version, value.version);
      assert.equal(native.rows[0]!.version, "1.2.3-rc.1+build.5");
      const filtered = await connection.db
        .select({ version: schema.tables.releases.version })
        .from(schema.tables.releases)
        .where(api.equal(schema.tables.releases.version, "1.2.3-rc.1"));
      assert.deepEqual(filtered, [{ version: value.version }]);
    });
    await witness(claims.semverArray, () => {
      assert.deepEqual(read[0]!.history, value.history);
      assert.equal(native.rows[0]!.history, "[0:1]={1.0.0,NULL}");
    });
    await witness(claims.semverrange, () => {
      assert.deepEqual(read[0]!.supported, range);
      assert.equal(native.rows[0]!.supported, "[1.0.0,2.0.0]");
    });
    await witness(claims.semverrangeArray, () => {
      assert.deepEqual(read[0]!.windows, value.windows);
      assert.equal(native.rows[0]!.windows, '{"[1.0.0,2.0.0]",empty}');
    });
    await witness(claims.semvermultirange, () => {
      assert.deepEqual(read[0]!.compatible, expected.compatible);
      assert.equal(native.rows[0]!.compatible, "{[1.0.0,4.0.0)}");
    });
    await witness(claims.semvermultirangeArray, () => {
      assert.deepEqual(read[0]!.matrix, value.matrix);
      assert.equal(native.rows[0]!.matrix, '{"{(,1.0.0)}"}');
    });
    await witness(claims.btree, () => {
      assert.deepEqual(indexes.rows[0], { amname: "btree", opcname: "semver_ops", nspname: semverProofSchema });
    });
    await witness(claims.hash, () => {
      assert.deepEqual(indexes.rows[1], { amname: "hash", opcname: "semver_ops", nspname: semverProofSchema });
    });
    assert.deepEqual(rpc(read), read);
  });
});

extensionProofTest(semverGrammarProofCase, async () => {
  await fixture(semverGrammarProofCase.id, async (connection, admin) => {
    const codec = createSemverCodec(semverProofSchema);
    const alphabet = ["0", "1", "00", "01", "a", "-", ".", "+", "0a", "a0"];
    const candidates = new Set(["", " 1.2.3", "1.2", "2147483647.0.0", "2147483648.0.0", "01.2.3"]);
    let seed = 7;
    for (let index = 0; index < 4000; index++) {
      let value = "1.2.3-";
      seed = (seed * 1103515245 + 12345) % 2147483648;
      for (let length = 1 + (seed % 7); length > 0; length--) {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        value += alphabet[seed % alphabet.length];
      }
      candidates.add(value);
    }
    const values = [...candidates];
    await admin.query(
      `create function pg_temp.semver_out_or_null(value text) returns text language plpgsql as $$ begin return value::${qualified}.semver::text; exception when others then return null; end $$`,
    );
    const result = await admin.query<{ value: string; output: string | null }>(
      "select value, pg_temp.semver_out_or_null(value) as output from unnest($1::text[]) value",
      [values],
    );
    expect(result.rows).toHaveLength(values.length);
    let fixed = 0;
    for (const row of result.rows) {
      const native = row.output === row.value;
      if (native) fixed++;
      expect([row.value, v.is(semverText, row.value)]).toEqual([row.value, native]);
      if (row.output !== null) expect(codec.decode(row.output)).toBe(row.output);
    }
    expect(fixed).toBeGreaterThan(100);
    const [stored] = await connection.transaction((db) =>
      db.insert(schema.tables.releases).values({ version: "1.0.0" }).returning(),
    );
    assert(stored);
    const malformed = checkedExtensionExpression(sql`'1.2'::text`, codec, []);
    await assert.rejects(
      connection.transaction(async (db) => {
        await db
          .update(schema.tables.releases)
          .set({ version: "9.9.9" })
          .where(eq(schema.tables.releases._id, stored._id));
        await db.select({ value: malformed }).from(schema.tables.releases);
      }),
    );
    expect((await admin.query("select version::text from app.releases")).rows).toEqual([{ version: "1.0.0" }]);
  });
});

extensionProofTest(
  semverSessionProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const admin = new pg.Client({ connectionString: url });
      await admin.connect();
      try {
        await admin.query(
          `create schema ${qualified}; create extension semver with schema ${qualified} version '0.40.0'`,
        );
        await observeExtensionProofDatabase(url, semverSessionProofCase.id, "semver");
        // Ordinary queries cannot reach the SQL-language wrappers: they call unqualified to_semver.
        await assert.rejects(admin.query(`select ${qualified}.semver(1::pg_catalog.int2)`), { code: "42883" });
        await assert.rejects(admin.query(`select (1::pg_catalog.int2)::${qualified}.semver`), { code: "42883" });
        let escaped: SemverSession | undefined;
        const result = await withSemverSession(url, descriptor, async (session) => {
          escaped = session;
          expect(await session.searchPath()).toBe(`${qualified}, pg_catalog`);
          const routines = await Promise.all([
            session.semver.int2(1),
            session.semver.int4(-1),
            session.semver.int8(3n),
            session.semver.float4(1.5),
            session.semver.float8(1.25),
            session.semver.numeric("1.234"),
            session.semver.int2(null),
            session.semver.numeric(null),
          ]);
          expect(routines).toEqual(["1.0.0", "0.0.0-1", "3.0.0", "1.5.0", "1.25.0", "1.234.0", null, null]);
          const casts = await Promise.all([
            session.casts.int2_to_semver(1),
            session.casts.int4_to_semver(-1),
            session.casts.int8_to_semver(3n),
            session.casts.float4_to_semver(1.5),
            session.casts.float8_to_semver(1.25),
            session.casts.numeric_to_semver("1.234"),
            session.casts.int8_to_semver(null),
          ]);
          expect(casts).toEqual(["1.0.0", "0.0.0-1", "3.0.0", "1.5.0", "1.25.0", "1.234.0", null]);
          return "observed";
        });
        const { before } = result.searchPath;
        expect(result).toEqual({
          completion: "committed",
          value: "observed",
          searchPath: { scope: "transaction", before, during: `${qualified}, pg_catalog`, after: before },
        });
        expect(before).not.toContain(qualified);
        assert(escaped);
        await assert.rejects(escaped.semver.int2(1));
        // Native range errors abort the owned transaction; the setting never outlives it.
        await assert.rejects(
          withSemverSession(url, descriptor, (session) => session.semver.int8(2147483648n)),
          (error: Error) => v.is(v.object({ code: v.literal("XX000") }), error.cause),
        );
      } finally {
        await admin.end();
      }
    });
  },
  180000,
);
