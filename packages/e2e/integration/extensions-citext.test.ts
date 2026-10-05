import { test, expect } from "bun:test";
import pg from "pg";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  citextProofSchema,
  citextRoutinesProofCase,
  citextOperatorsProofCase,
  citextCastsAggregatesProofCase,
  citextSchemaIndexesProofCase,
} from "../fixtures/citext-proof-cases";

function proveCitext<T>(definition: ExtensionProofCase, member: string, assertion: () => T | Promise<T>): Promise<T> {
  const claim = definition.claims.find((value) => value.member === member);
  assert(claim, `Missing declared Citext member: ${member}`);
  return extensionProofWitness({ ...claim, schema: citextProofSchema }, assertion);
}

// Each parent witness encloses the same complete native field/binary and indexed strategy oracle.
// No registration or annotation alone marks a backend callback as executed.
function proveCitextSchemaAndIndexes(assertion: () => Promise<void>): Promise<void> {
  return proveCitext(citextSchemaIndexesProofCase, "type:$extension:citext.citext", () =>
    proveCitext(citextSchemaIndexesProofCase, "type:$extension:citext._citext", () =>
      proveCitext(citextSchemaIndexesProofCase, "opclass:$extension:citext.citext_ops/btree", () =>
        proveCitext(citextSchemaIndexesProofCase, "opclass:$extension:citext.citext_ops/hash", () =>
          proveCitext(citextSchemaIndexesProofCase, "opclass:$extension:citext.citext_pattern_ops/btree", assertion),
        ),
      ),
    ),
  );
}

test("citext.losslessUtf8NativeSendAndLocalFailureRollback", async () => {
  await fixture(async (connection, admin) => {
    const value = "MiXeD 日本 😀";
    await connection.transaction((db) =>
      db.insert(schema.tables.entries).values({ value: api.value(value), original: value }),
    );
    const actual = await connection.transaction((db) =>
      db
        .select({
          value: schema.tables.entries.value,
          bytes: api.send(schema.tables.entries.value),
        })
        .from(schema.tables.entries),
    );
    const native = (
      await admin.query("select case_text.citextsend($1::case_text.citext) bytes, $1::case_text.citext::text value", [
        value,
      ])
    ).rows[0]!;
    assert.deepEqual(actual, [{ value: native.value, bytes: { hex: native.bytes.toString("hex") } }]);
    assert.equal(new TextDecoder("utf-8", { fatal: true }).decode(native.bytes), value);
    await assert.rejects(
      connection.transaction(async (db) => {
        await db.insert(schema.tables.entries).values({ value: api.value("before"), original: "before" });
        await db.select({ value: api.fromText("\ud800") }).from(schema.tables.entries);
      }),
    );
    assert.equal(
      (await admin.query("select count(*)::int count from app.entries where original='before'")).rows[0]!.count,
      0,
    );
  });
});

test("citext.nativeBaseline", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const available = await client.query(
        "select version from pg_available_extension_versions where name='citext' and version='1.8'",
      );
      expect(available.rows).toHaveLength(1);
      await client.query("create schema case_text; create extension citext with schema case_text version '1.8'");
      const { rows } = await client.query(
        `select 'MiXeD'::case_text.citext::text kept, 'A'::case_text.citext operator(case_text.=) 'a'::case_text.citext eq, 'Straße'::case_text.citext operator(case_text.=) 'STRASSE'::case_text.citext unicode, case_text.regexp_replace('aA'::case_text.citext,'a'::case_text.citext,'x','g') replacement, case_text.regexp_match('ABC'::case_text.citext,'abc'::case_text.citext,'c') sensitive, case_text.citext('x  '::bpchar)::text trimmed, case_text.citext('192.0.2.1/24'::inet)::text inet, case_text.citext_larger('A'::case_text.citext,'a'::case_text.citext)::text larger, case_text.citext_smaller('A'::case_text.citext,'a'::case_text.citext)::text smaller, encode(case_text.citextsend('ABC'::case_text.citext),'hex') bytes`,
      );
      expect(rows).toEqual([
        {
          kept: "MiXeD",
          eq: true,
          unicode: false,
          replacement: "xx",
          sensitive: null,
          trimmed: "x",
          inet: "192.0.2.1/24",
          larger: "a",
          smaller: "a",
          bytes: "414243",
        },
      ]);
      console.log(
        "citext baseline",
        rows,
        (
          await client.query(
            "select current_setting('server_version_num') server, (select datctype from pg_database where datname=current_database()) ctype",
          )
        ).rows,
      );
    } finally {
      await client.end();
    }
  });
});

import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import {
  createCitext_1_8,
  citext,
  bpchar,
  varchar,
  inet,
} from "../../../apps/loom/src/core/extensions/adapters/citext";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import {
  createSnapshot,
  emptySnapshot,
  migrationStatements,
  inspectSnapshot,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { serializeRpcValue, deserializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import * as v from "valibot";
import assert from "node:assert/strict";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";
import { searchContractDescriptor } from "../../../apps/loom/src/core/search/metadata";
import { oc } from "../../../apps/loom/src/core/contract/index";
import { prepareSearchPage, finishSearchPage } from "../../../apps/loom/src/core/search/pagination";
import { storageRows } from "../../../apps/loom/src/core/validation/encoding";
import type { SearchPublicSelection } from "../../../apps/loom/src/core/search/public";
import { evaluateSnapshot, captureSnapshotRevisions } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { frameworkMigrations } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { installRevisionTracking } from "../../../apps/loom/src/tooling/migrations/revisions";
import { createRevisionReader } from "../../../apps/loom/src/core/server/realtime/revisions";
import { createRevisionCoordinator } from "../../../apps/loom/src/core/server/realtime/coordinator";
const descriptor = {
  name: "citext",
  version: "1.8",
  schema: "case_text",
  apiSupport: {
    status: "verified",
    digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3",
  },
} as const;
const api = createCitext_1_8(descriptor);
const schema = defineSchema(
  (fields) => ({
    entries: defineTable(
      {
        value: api.field(),
        original: fields.text().notNull(),
        tags: api.arrayField(),
        fallback: api.field().notNull().default(citext("DeFaUlT")),
      },
      {
        indexes: [{ fields: ["value"], extension: api.indexes.btree() }, { fields: ["original"] }],
      },
    ),
    uniqueEntries: defineTable(
      { value: api.field().notNull() },
      { indexes: [{ fields: ["value"], unique: true, extension: api.indexes.btree() }] },
    ),
    children: defineTable({
      parentId: fields.reference("entries").notNull(),
      value: api.field(),
      tags: api.arrayField(),
    }),
  }),
  { namespace: "app" },
);
const relations = defineRelations(schema.tables, (r) => ({
  entries: { children: r.many.children({ from: r.entries._id, to: r.children.parentId }) },
  children: { parent: r.one.entries({ from: r.children.parentId, to: r.entries._id }) },
}));
async function fixture(
  work: (connection: Awaited<ReturnType<typeof connect>>, admin: pg.Client) => Promise<void>,
  proof?: ExtensionProofCase,
) {
  await withExtensionDatabase(async (url) => {
    const admin = new pg.Client({ connectionString: url });
    await admin.connect();
    const connection = await connect(url);
    try {
      const available = await admin.query(
        "select version from pg_available_extension_versions where name='citext' and version='1.8'",
      );
      expect(available.rows).toHaveLength(1);
      await admin.query("create schema case_text; create extension citext with schema case_text version '1.8'");
      if (proof) await observeExtensionProofDatabase(url, proof.id, "citext");
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
        await admin.query(statement);
      if (proof === citextSchemaIndexesProofCase) await proveCitextSchemaAndIndexes(() => work(connection, admin));
      else await work(connection, admin);
    } finally {
      await connection.close();
      await admin.end();
    }
  });
}
const connect = (url: string) => connectDatabase({ schema, relations, connectionString: url });
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Validate the actual RPC serialization boundary.
const rpc = (value: unknown) => deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, value)));
const textArray = (values: readonly string[]) => ({
  dimensions: values.length ? [{ lowerBound: 1, length: values.length }] : [],
  values,
});

extensionProofTest(citextRoutinesProofCase, async () => {
  await fixture(async (connection, admin) => {
    const f = api.sql.functions;
    const cases: {
      member: string;
      expression: SQL;
      missing: SQL;
      expected: unknown;
      set?: boolean;
    }[] = [
      {
        member: "routine:$extension:citext.citext_cmp($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_cmp("A", "a"),
        missing: f.citext_cmp(null, "a"),
        expected: 0,
      },
      {
        member: "routine:$extension:citext.citext_eq($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_eq("A", "a"),
        missing: f.citext_eq(null, "a"),
        expected: true,
      },
      {
        member: "routine:$extension:citext.citext_ge($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_ge("A", "a"),
        missing: f.citext_ge(null, "a"),
        expected: true,
      },
      {
        member: "routine:$extension:citext.citext_gt($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_gt("A", "a"),
        missing: f.citext_gt(null, "a"),
        expected: false,
      },
      {
        member: "routine:$extension:citext.citext_larger($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_larger("A", "a"),
        missing: f.citext_larger(null, "a"),
        expected: "a",
      },
      {
        member: "routine:$extension:citext.citext_le($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_le("A", "a"),
        missing: f.citext_le(null, "a"),
        expected: true,
      },
      {
        member: "routine:$extension:citext.citext_lt($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_lt("A", "a"),
        missing: f.citext_lt(null, "a"),
        expected: false,
      },
      {
        member: "routine:$extension:citext.citext_ne($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_ne("A", "a"),
        missing: f.citext_ne(null, "a"),
        expected: false,
      },
      {
        member: "routine:$extension:citext.citext_pattern_cmp($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_pattern_cmp("A", "a"),
        missing: f.citext_pattern_cmp(null, "a"),
        expected: 0,
      },
      {
        member: "routine:$extension:citext.citext_pattern_ge($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_pattern_ge("A", "a"),
        missing: f.citext_pattern_ge(null, "a"),
        expected: true,
      },
      {
        member: "routine:$extension:citext.citext_pattern_gt($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_pattern_gt("A", "a"),
        missing: f.citext_pattern_gt(null, "a"),
        expected: false,
      },
      {
        member: "routine:$extension:citext.citext_pattern_le($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_pattern_le("A", "a"),
        missing: f.citext_pattern_le(null, "a"),
        expected: true,
      },
      {
        member: "routine:$extension:citext.citext_pattern_lt($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_pattern_lt("A", "a"),
        missing: f.citext_pattern_lt(null, "a"),
        expected: false,
      },
      {
        member: "routine:$extension:citext.citext_smaller($extension:citext.citext,$extension:citext.citext)",
        expression: f.citext_smaller("A", "a"),
        missing: f.citext_smaller(null, "a"),
        expected: "a",
      },
      {
        member: "routine:$extension:citext.citext(pg_catalog.bool)",
        expression: f.citext.boolean(true),
        missing: f.citext.boolean(null),
        expected: "true",
      },
      {
        member: "routine:$extension:citext.citext(pg_catalog.bpchar)",
        expression: f.citext.bpchar(bpchar("X  ")),
        missing: f.citext.bpchar(null),
        expected: "X",
      },
      {
        member: "routine:$extension:citext.citext(pg_catalog.inet)",
        expression: f.citext.inet(inet("192.0.2.1/24")),
        missing: f.citext.inet(null),
        expected: "192.0.2.1/24",
      },
      {
        member: "routine:$extension:citext.citextsend($extension:citext.citext)",
        expression: f.citextsend("ABC"),
        missing: f.citextsend(null),
        expected: { hex: "414243" },
      },
      {
        member:
          "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
        expression: f.regexp_match("aA", "a", ""),
        missing: f.regexp_match(null, "a", ""),
        expected: textArray(["a"]),
      },
      {
        member: "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext)",
        expression: f.regexp_match("aA", "a"),
        missing: f.regexp_match(null, "a"),
        expected: textArray(["a"]),
      },
      {
        member:
          "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
        expression: f.regexp_matches("aA", "a", ""),
        missing: f.regexp_matches(null, "a", ""),
        expected: textArray(["a"]),
        set: true,
      },
      {
        member: "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext)",
        expression: f.regexp_matches("aA", "a"),
        missing: f.regexp_matches(null, "a"),
        expected: textArray(["a"]),
        set: true,
      },
      {
        member:
          "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text,pg_catalog.text)",
        expression: f.regexp_replace("aA", "a", "x", ""),
        missing: f.regexp_replace(null, "a", "x", ""),
        expected: "xA",
      },
      {
        member:
          "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
        expression: f.regexp_replace("aA", "a", "x"),
        missing: f.regexp_replace(null, "a", "x"),
        expected: "xA",
      },
      {
        member:
          "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
        expression: f.regexp_split_to_array("aXa", "x", ""),
        missing: f.regexp_split_to_array(null, "x", ""),
        expected: textArray(["a", "a"]),
      },
      {
        member: "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext)",
        expression: f.regexp_split_to_array("aXa", "x"),
        missing: f.regexp_split_to_array(null, "x"),
        expected: textArray(["a", "a"]),
      },
      {
        member:
          "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
        expression: f.regexp_split_to_table("aXa", "x", ""),
        missing: f.regexp_split_to_table(null, "x", ""),
        expected: "a",
        set: true,
      },
      {
        member: "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext)",
        expression: f.regexp_split_to_table("aXa", "x"),
        missing: f.regexp_split_to_table(null, "x"),
        expected: "a",
        set: true,
      },
      {
        member:
          "routine:$extension:citext.replace($extension:citext.citext,$extension:citext.citext,$extension:citext.citext)",
        expression: f.replace("aAa", "a", "X"),
        missing: f.replace(null, "a", "X"),
        expected: "XXX",
      },
      {
        member:
          "routine:$extension:citext.split_part($extension:citext.citext,$extension:citext.citext,pg_catalog.int4)",
        expression: f.split_part("BxC", "X", 2),
        missing: f.split_part(null, "X", 2),
        expected: "C",
      },
      {
        member: "routine:$extension:citext.strpos($extension:citext.citext,$extension:citext.citext)",
        expression: f.strpos("BaB", "a"),
        missing: f.strpos(null, "a"),
        expected: 2,
      },
      {
        member: "routine:$extension:citext.texticlike($extension:citext.citext,$extension:citext.citext)",
        expression: f.texticlike("A", "a"),
        missing: f.texticlike(null, "a"),
        expected: true,
      },
      {
        member: "routine:$extension:citext.texticlike($extension:citext.citext,pg_catalog.text)",
        expression: f.texticlike_text("A", "a"),
        missing: f.texticlike_text(null, "a"),
        expected: true,
      },
      {
        member: "routine:$extension:citext.texticnlike($extension:citext.citext,$extension:citext.citext)",
        expression: f.texticnlike("A", "a"),
        missing: f.texticnlike(null, "a"),
        expected: false,
      },
      {
        member: "routine:$extension:citext.texticnlike($extension:citext.citext,pg_catalog.text)",
        expression: f.texticnlike_text("A", "a"),
        missing: f.texticnlike_text(null, "a"),
        expected: false,
      },
      {
        member: "routine:$extension:citext.texticregexeq($extension:citext.citext,$extension:citext.citext)",
        expression: f.texticregexeq("A", "a"),
        missing: f.texticregexeq(null, "a"),
        expected: true,
      },
      {
        member: "routine:$extension:citext.texticregexeq($extension:citext.citext,pg_catalog.text)",
        expression: f.texticregexeq_text("A", "a"),
        missing: f.texticregexeq_text(null, "a"),
        expected: true,
      },
      {
        member: "routine:$extension:citext.texticregexne($extension:citext.citext,$extension:citext.citext)",
        expression: f.texticregexne("A", "a"),
        missing: f.texticregexne(null, "a"),
        expected: false,
      },
      {
        member: "routine:$extension:citext.texticregexne($extension:citext.citext,pg_catalog.text)",
        expression: f.texticregexne_text("A", "a"),
        missing: f.texticregexne_text(null, "a"),
        expected: false,
      },
      {
        member:
          "routine:$extension:citext.translate($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
        expression: f.translate("AbBa", "aB", "xy"),
        missing: f.translate(null, "aB", "xy"),
        expected: "xyyx",
      },
    ];
    for (const example of cases) {
      await proveCitext(citextRoutinesProofCase, example.member, async () => {
        const rows = await connection.transaction((db) =>
          db.select({ value: example.expression }).from(sql`(values (1)) fixture(id)`),
        );
        const multiplicity = example.member.includes("regexp_split_to_table") ? 2 : 1;
        assert.deepEqual(
          rows,
          Array.from({ length: multiplicity }, () => ({ value: example.expected })),
          example.member,
        );
        const missing = await connection.transaction((db) =>
          db.select({ value: example.missing }).from(sql`(values (1)) fixture(id)`),
        );
        assert.deepEqual(missing, example.set ? [] : [{ value: null }], example.member);
      });
    }
    await proveCitext(
      citextRoutinesProofCase,
      "routine:$extension:citext.citext_hash($extension:citext.citext)",
      async () => {
        const hash = await connection.transaction((db) =>
          db
            .select({ a: f.citext_hash("A"), b: f.citext_hash("a"), missing: f.citext_hash(null) })
            .from(sql`(values (1)) fixture(id)`),
        );
        const native = await admin.query(
          "select case_text.citext_hash('A'::case_text.citext) a, case_text.citext_hash('a'::case_text.citext) b, case_text.citext_hash(NULL::case_text.citext) missing",
        );
        assert.deepEqual(hash, native.rows);
        expect(hash[0]?.a).toBe(hash[0]?.b);
        expect(Number.isInteger(hash[0]?.a)).toBe(true);
        expect(hash[0]?.missing).toBeNull();
        assert.deepEqual(rpc(hash), hash);
      },
    );
    await proveCitext(
      citextRoutinesProofCase,
      "routine:$extension:citext.citext_hash_extended($extension:citext.citext,pg_catalog.int8)",
      async () => {
        const hash = await connection.transaction((db) =>
          db
            .select({
              a: f.citext_hash_extended("A", 9223372036854775807n),
              b: f.citext_hash_extended("a", 9223372036854775807n),
              missing: f.citext_hash_extended(null, 1n),
            })
            .from(sql`(values (1)) fixture(id)`),
        );
        const native = await admin.query(
          "select case_text.citext_hash_extended('A'::case_text.citext,9223372036854775807::bigint)::text a, case_text.citext_hash_extended('a'::case_text.citext,9223372036854775807::bigint)::text b, case_text.citext_hash_extended(NULL::case_text.citext,1::bigint) missing",
        );
        assert.deepEqual(
          hash,
          native.rows.map((row) => ({ a: BigInt(row.a), b: BigInt(row.b), missing: row.missing })),
        );
        expect(hash[0]?.a).toBe(hash[0]?.b);
        expect(v.is(v.bigint(), hash[0]?.a)).toBe(true);
        expect(hash[0]?.missing).toBeNull();
        assert.deepEqual(rpc(hash), hash);
      },
    );
  }, citextRoutinesProofCase);
});

extensionProofTest(citextOperatorsProofCase, async () => {
  await fixture(async (connection) => {
    const cases: { member: string; expression: SQL; missing: SQL; expected: boolean }[] = [
      {
        member: "operator:$extension:citext.!~($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["!~"]("A", "a"),
        missing: api.sql.operators["!~"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.!~($extension:citext.citext,pg_catalog.text)",
        expression: api.sql.operators.text["!~"]("A", "a"),
        missing: api.sql.operators.text["!~"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.!~*($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["!~*"]("A", "a"),
        missing: api.sql.operators["!~*"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.!~*($extension:citext.citext,pg_catalog.text)",
        expression: api.sql.operators.text["!~*"]("A", "a"),
        missing: api.sql.operators.text["!~*"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.!~~($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["!~~"]("A", "a"),
        missing: api.sql.operators["!~~"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.!~~($extension:citext.citext,pg_catalog.text)",
        expression: api.sql.operators.text["!~~"]("A", "a"),
        missing: api.sql.operators.text["!~~"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.!~~*($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["!~~*"]("A", "a"),
        missing: api.sql.operators["!~~*"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.!~~*($extension:citext.citext,pg_catalog.text)",
        expression: api.sql.operators.text["!~~*"]("A", "a"),
        missing: api.sql.operators.text["!~~*"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.<($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["<"]("A", "a"),
        missing: api.sql.operators["<"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.<=($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["<="]("A", "a"),
        missing: api.sql.operators["<="]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.<>($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["<>"]("A", "a"),
        missing: api.sql.operators["<>"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.=($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["="]("A", "a"),
        missing: api.sql.operators["="]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.>($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators[">"]("A", "a"),
        missing: api.sql.operators[">"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.>=($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators[">="]("A", "a"),
        missing: api.sql.operators[">="]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["~"]("A", "a"),
        missing: api.sql.operators["~"]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~($extension:citext.citext,pg_catalog.text)",
        expression: api.sql.operators.text["~"]("A", "a"),
        missing: api.sql.operators.text["~"]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~*($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["~*"]("A", "a"),
        missing: api.sql.operators["~*"]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~*($extension:citext.citext,pg_catalog.text)",
        expression: api.sql.operators.text["~*"]("A", "a"),
        missing: api.sql.operators.text["~*"]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~<=~($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["~<=~"]("A", "a"),
        missing: api.sql.operators["~<=~"]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~<~($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["~<~"]("A", "a"),
        missing: api.sql.operators["~<~"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.~>=~($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["~>=~"]("A", "a"),
        missing: api.sql.operators["~>=~"]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~>~($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["~>~"]("A", "a"),
        missing: api.sql.operators["~>~"]("A", null),
        expected: false,
      },
      {
        member: "operator:$extension:citext.~~($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["~~"]("A", "a"),
        missing: api.sql.operators["~~"]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~~($extension:citext.citext,pg_catalog.text)",
        expression: api.sql.operators.text["~~"]("A", "a"),
        missing: api.sql.operators.text["~~"]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~~*($extension:citext.citext,$extension:citext.citext)",
        expression: api.sql.operators["~~*"]("A", "a"),
        missing: api.sql.operators["~~*"]("A", null),
        expected: true,
      },
      {
        member: "operator:$extension:citext.~~*($extension:citext.citext,pg_catalog.text)",
        expression: api.sql.operators.text["~~*"]("A", "a"),
        missing: api.sql.operators.text["~~*"]("A", null),
        expected: true,
      },
    ];
    expect(cases).toHaveLength(26);
    for (const example of cases) {
      await proveCitext(citextOperatorsProofCase, example.member, async () => {
        const result = await connection.transaction((db) =>
          db.select({ value: example.expression, missing: example.missing }).from(sql`(values (1)) fixture(id)`),
        );
        assert.deepEqual(result, [{ value: example.expected, missing: null }], example.member);
      });
    }
    const orientations = await connection.transaction((db) =>
      db
        .select({
          lt: api.lessThan("a", "b"),
          gt: api.greaterThan("b", "a"),
          wrong: api.greaterThan("a", "b"),
          pattern: api.sql.operators["~<~"]("a", "b"),
        })
        .from(sql`(values (1)) fixture(id)`),
    );
    expect(orientations).toEqual([{ lt: true, gt: true, wrong: false, pattern: true }]);
  }, citextOperatorsProofCase);
});

extensionProofTest(citextCastsAggregatesProofCase, async () => {
  await fixture(async (connection) => {
    const c = api.sql.casts;
    const castCases: { member: string; expression: SQL; missing: SQL; expected: string }[] = [
      {
        member: "cast:$extension:citext.citext->pg_catalog.bpchar",
        expression: c.citext_to_bpchar("Ab  "),
        missing: c.citext_to_bpchar(null),
        expected: "Ab  ",
      },
      {
        member: "cast:$extension:citext.citext->pg_catalog.text",
        expression: c.citext_to_text("Ab  "),
        missing: c.citext_to_text(null),
        expected: "Ab  ",
      },
      {
        member: "cast:$extension:citext.citext->pg_catalog.varchar",
        expression: c.citext_to_varchar("Ab  "),
        missing: c.citext_to_varchar(null),
        expected: "Ab  ",
      },
      {
        member: "cast:pg_catalog.bool->$extension:citext.citext",
        expression: c.bool_to_citext(true),
        missing: c.bool_to_citext(null),
        expected: "true",
      },
      {
        member: "cast:pg_catalog.bpchar->$extension:citext.citext",
        expression: c.bpchar_to_citext(bpchar("Ab  ")),
        missing: c.bpchar_to_citext(null),
        expected: "Ab",
      },
      {
        member: "cast:pg_catalog.inet->$extension:citext.citext",
        expression: c.inet_to_citext(inet("192.0.2.1/24")),
        missing: c.inet_to_citext(null),
        expected: "192.0.2.1/24",
      },
      {
        member: "cast:pg_catalog.text->$extension:citext.citext",
        expression: c.text_to_citext("Ab  "),
        missing: c.text_to_citext(null),
        expected: "Ab  ",
      },
      {
        member: "cast:pg_catalog.varchar->$extension:citext.citext",
        expression: c.varchar_to_citext(varchar("Ab  ")),
        missing: c.varchar_to_citext(null),
        expected: "Ab  ",
      },
    ];
    for (const example of castCases) {
      await proveCitext(citextCastsAggregatesProofCase, example.member, async () => {
        const actual = await connection.transaction((db) =>
          db.select({ value: example.expression, missing: example.missing }).from(sql`(values (1)) fixture(id)`),
        );
        assert.deepEqual(actual, [{ value: example.expected, missing: null }], example.member);
      });
    }

    const result = await connection.transaction((db) =>
      db
        .select({
          char: c.citext_to_bpchar("Ab  "),
          text: c.citext_to_text("Ab  "),
          varying: c.citext_to_varchar("Ab  "),
          boolean: c.bool_to_citext(true),
          padded: c.bpchar_to_citext(bpchar("Ab  ")),
          network: c.inet_to_citext(inet("192.0.2.1/24")),
          string: c.text_to_citext("Ab  "),
          varchar: c.varchar_to_citext(varchar("Ab  ")),
          nullCast: c.text_to_citext(null),
          noMatch: api.regexpMatch("ABC", "zzz"),
          sensitive: api.regexpMatch("ABC", "abc", "c"),
          insensitive: api.regexpMatch("ABC", "abc"),
          replaced: api.regexpReplace("aA", "a", "x", "g"),
          escaped: api.replace("a.a", ".", "\\"),
          outside: api.splitPart("a-b", "-", 10),
          empty: api.replace("", "a", "x"),
        })
        .from(sql`(values (1)) fixture(id)`),
    );
    assert.deepEqual(result, [
      {
        char: "Ab  ",
        text: "Ab  ",
        varying: "Ab  ",
        boolean: "true",
        padded: "Ab",
        network: "192.0.2.1/24",
        string: "Ab  ",
        varchar: "Ab  ",
        nullCast: null,
        noMatch: null,
        sensitive: null,
        insensitive: textArray(["ABC"]),
        replaced: "xx",
        escaped: "a\\a",
        outside: null,
        empty: "",
      },
    ]);
    assert.deepEqual(rpc(result), result);
    const matches = await connection.transaction((db) =>
      db.select({ value: api.regexpMatches("aA", "a", "g") }).from(sql`(values (1)) fixture(id)`),
    );
    assert.deepEqual(matches, [{ value: textArray(["a"]) }, { value: textArray(["A"]) }]);
    expect(
      await connection.transaction((db) =>
        db.select({ value: api.regexpMatches("ABC", "zzz") }).from(sql`(values (1)) fixture(id)`),
      ),
    ).toEqual([]);
    await assert.rejects(
      connection.transaction((db) =>
        db.select({ value: api.regexpMatch("a", "[") }).from(sql`(values (1)) fixture(id)`),
      ),
      (error) => v.is(v.object({ cause: v.object({ code: v.literal("2201B") }) }), error),
    );
    await assert.rejects(
      connection.transaction((db) =>
        db.select({ value: api.regexpMatch("a", "a", "g") }).from(sql`(values (1)) fixture(id)`),
      ),
      (error) => v.is(v.object({ cause: v.object({ code: v.literal("22023") }) }), error),
    );
    await connection.db.insert(schema.tables.entries).values([
      { value: citext("B"), original: "B" },
      { value: null, original: "missing" },
      { value: citext("a"), original: "a" },
    ]);
    const aliased = await connection.transaction((db) =>
      db
        .select({
          cast: api.fromText(sql<string>`'MiXeD'`.as("direct_text")),
          routine: api.equal(api.fromText("MiXeD").as("direct_citext"), "mixed"),
          aggregate: api.min(api.fromText("MiXeD").as("aggregate_input")),
        })
        .from(sql`(values (1)) fixture(id)`),
    );
    assert.deepEqual(aliased, [{ cast: "MiXeD", routine: true, aggregate: "MiXeD" }]);
    const native = schema.tables.entries.original;
    const subquery = connection.db
      .select({ value: api.fromText(native).as("converted") })
      .from(schema.tables.entries)
      .as("converted_rows");
    const converted = await connection.transaction((db) =>
      db.select({ value: api.equal(subquery.value, "b") }).from(subquery),
    );
    expect(converted.map((row) => row.value)).toEqual([true, false, false]);
    await proveCitext(citextCastsAggregatesProofCase, "routine:$extension:citext.min($extension:citext.citext)", () =>
      proveCitext(
        citextCastsAggregatesProofCase,
        "routine:$extension:citext.max($extension:citext.citext)",
        async () => {
          const aggregates = await connection.transaction((db) =>
            db
              .select({
                min: api.min(schema.tables.entries.value),
                max: api.max(schema.tables.entries.value),
                distinct: api.min.distinct(schema.tables.entries.value),
                filtered: api.max.filter(sql`false`, schema.tables.entries.value),
              })
              .from(schema.tables.entries),
          );
          assert.deepEqual(aggregates, [{ min: "a", max: "B", distinct: "a", filtered: null }]);
          const empty = await connection.transaction((db) =>
            db
              .select({
                min: api.min(schema.tables.entries.value),
                max: api.max(schema.tables.entries.value),
              })
              .from(schema.tables.entries)
              .where(sql`false`),
          );
          expect(empty).toEqual([{ min: null, max: null }]);
          const windows = await connection.transaction((db) =>
            db
              .select({
                minimum: api.min.over({}, schema.tables.entries.value),
                maximum: api.max.over({}, schema.tables.entries.value),
              })
              .from(schema.tables.entries),
          );
          assert.deepEqual(
            windows.map((row) => row.minimum),
            ["a", "a", "a"],
          );
          assert.deepEqual(
            windows.map((row) => row.maximum),
            ["B", "B", "B"],
          );
        },
      ),
    );
  }, citextCastsAggregatesProofCase);
});

extensionProofTest(citextSchemaIndexesProofCase, async () => {
  await fixture(async (connection, admin) => {
    const table = schema.tables.entries;
    const array = {
      dimensions: [
        { lowerBound: -2, length: 2 },
        { lowerBound: 3, length: 2 },
      ],
      values: [
        [citext("MiXeD"), null],
        [citext("NULL"), citext('a,"b\\c')],
      ],
    };
    await connection.db.insert(table).values([
      { value: citext("Angel"), original: "Angel", tags: array },
      { value: null, original: "null", tags: null },
    ]);
    const rows = await connection.transaction((db) =>
      db
        .select({
          value: table.value,
          tags: table.tags,
          fallback: table.fallback,
        })
        .from(table),
    );
    assert.deepEqual(rows, [
      { value: "Angel", tags: array, fallback: "DeFaUlT" },
      { value: null, tags: null, fallback: "DeFaUlT" },
    ]);
    assert.deepEqual(rpc(rows), rows);
    const relational = await connection.transaction((db) =>
      db.query.entries.findMany({
        columns: { value: true, tags: true },
        extras: { equal: (table) => api.equal(table.value, "angel") },
      }),
    );
    assert.deepEqual(relational, [
      { value: "Angel", tags: array, equal: true },
      { value: null, tags: null, equal: null },
    ]);
    const [parent] = await connection.db.select({ id: table._id }).from(table).where(api.equal(table.value, "angel"));
    assert.ok(parent);
    await connection.db
      .insert(schema.tables.children)
      .values({ parentId: parent.id, value: citext("ChIlD"), tags: array });
    const nested = await connection.transaction((db) =>
      db.query.entries.findMany({
        columns: { value: true },
        where: { RAW: (table) => api.equal(table.value, "angel") },
        with: { children: { columns: { value: true, tags: true } } },
      }),
    );
    assert.deepEqual(nested, [{ value: "Angel", children: [{ value: "ChIlD", tags: array }] }]);
    assert.deepEqual(rpc(nested), nested);
    await connection.db.insert(schema.tables.uniqueEntries).values({ value: citext("Angel") });
    await assert.rejects(
      connection.db
        .insert(schema.tables.uniqueEntries)
        .values({ value: citext("angel") })
        .execute(),
      (error) => v.is(v.object({ cause: v.object({ code: v.literal("23505") }) }), error),
    );
    const desired = await createSnapshot(schema),
      inspected = await inspectSnapshot(connection.db, "app");
    expect(snapshotHash(inspected)).toBe(snapshotHash(desired));
    await admin.query(
      `create table class_btree(value case_text.citext); create index class_btree_index on class_btree using btree(value case_text.citext_ops); create table class_hash(value case_text.citext); create index class_hash_index on class_hash using hash(value case_text.citext_ops); create table class_pattern(value case_text.citext); create index class_pattern_index on class_pattern using btree(value case_text.citext_pattern_ops)`,
    );
    for (const name of ["class_btree", "class_hash", "class_pattern"])
      await admin.query(`insert into ${name} select 'A' || g::text from generate_series(1,100) g`);
    await admin.query("set enable_seqscan=off");
    const strategies = [
      ["class_btree", "<"],
      ["class_btree", "<="],
      ["class_btree", "="],
      ["class_btree", ">="],
      ["class_btree", ">"],
      ["class_hash", "="],
      ["class_pattern", "~<~"],
      ["class_pattern", "~<=~"],
      ["class_pattern", "="],
      ["class_pattern", "~>=~"],
      ["class_pattern", "~>~"],
    ] as const;
    for (const [table, operator] of strategies) {
      const query = `select value from ${table} where value operator(case_text.${operator}) 'a50'::case_text.citext`;
      const plan = await admin.query(`explain (analyze, format json) ${query}`);
      expect(JSON.stringify(plan.rows)).toContain(`${table}_index`);
      const indexed = await admin.query(query);
      await admin.query("set enable_indexscan=off;set enable_bitmapscan=off;set enable_seqscan=on");
      const sequential = await admin.query(query);
      const compare = (left: string, right: string) => (left < right ? -1 : left > right ? 1 : 0);
      expect(indexed.rows.map((row) => v.parse(v.string(), row.value)).sort(compare)).toEqual(
        sequential.rows.map((row) => v.parse(v.string(), row.value)).sort(compare),
      );
      await admin.query("set enable_indexscan=on;set enable_bitmapscan=on;set enable_seqscan=off");
    }
    await admin.query("set enable_seqscan=on");
    // The hash family's support function 2 routes native hash partitions, beyond ordinary hash index lookup.
    await admin.query(
      "create table hashed_parent(value case_text.citext) partition by hash(value); create table hashed_part0 partition of hashed_parent for values with(modulus 2,remainder 0); create table hashed_part1 partition of hashed_parent for values with(modulus 2,remainder 1)",
    );
    await admin.query("insert into hashed_parent values('A'),('a'),('B'),('b')");
    const routed = await admin.query(
      'select value::text value,tableoid::regclass::text partition from hashed_parent order by value::text collate "C"',
    );
    expect(routed.rows[0]?.partition).toBe(routed.rows[2]?.partition);
    expect(routed.rows[1]?.partition).toBe(routed.rows[3]?.partition);
    const callbacks = await admin.query(
      "select opc.opcname,am.amname,ap.amprocnum,p.proname from pg_opclass opc join pg_am am on am.oid=opc.opcmethod join pg_namespace n on n.oid=opc.opcnamespace join pg_amproc ap on ap.amprocfamily=opc.opcfamily join pg_proc p on p.oid=ap.amproc where n.nspname='case_text' order by am.amname,opc.opcname,ap.amprocnum",
    );
    expect(callbacks.rows).toEqual([
      {
        opcname: "citext_ops",
        amname: "btree",
        amprocnum: 1,
        proname: "citext_cmp",
      },
      {
        opcname: "citext_pattern_ops",
        amname: "btree",
        amprocnum: 1,
        proname: "citext_pattern_cmp",
      },
      {
        opcname: "citext_ops",
        amname: "hash",
        amprocnum: 1,
        proname: "citext_hash",
      },
      {
        opcname: "citext_ops",
        amname: "hash",
        amprocnum: 2,
        proname: "citext_hash_extended",
      },
    ]);
    const received = await admin.query({
      text: "select $1::case_text.citext::text value",
      values: [Buffer.from("BiNaRy")],
    });
    expect(received.rows).toEqual([{ value: "BiNaRy" }]);
    const sendConfig = {
      text: "select $1::case_text.citext value",
      values: ["BiNaRy"],
      binary: true,
    };
    const sent = await admin.query(sendConfig);
    expect(sent.fields[0]?.format).toBe("binary");
    expect(sent.rows[0]?.value).toBe("BiNaRy");
    // Resolve this fixture's type identity only for native binary I/O; production codecs use text transport.
    const identity = await admin.query("select 'case_text.citext'::regtype::oid oid");
    const words = (values: readonly number[]) => {
      const bytes = Buffer.alloc(values.length * 4);
      values.forEach((value, index) => bytes.writeInt32BE(value, index * 4));
      return bytes;
    };
    const elements = array.values
      .flat()
      .map((value) =>
        value === null ? words([-1]) : Buffer.concat([words([Buffer.byteLength(value)]), Buffer.from(value)]),
      );
    const binaryArray = Buffer.concat([
      words([2, 1, v.parse(v.pipe(v.number(), v.integer()), identity.rows[0]?.oid), 2, -2, 2, 3]),
      ...elements,
    ]);
    const arraySent = await admin.query("select pg_catalog.array_send($1::case_text.citext[]) bytes", [
      api.arrayCodec.encode(array),
    ]);
    assert.deepEqual(arraySent.rows[0]?.bytes, binaryArray);
    const arrayReceived = await admin.query({
      text: "select $1::case_text.citext[]::text value",
      values: [binaryArray],
    });
    assert.deepEqual(api.arrayCodec.decode(arrayReceived.rows[0]?.value), array);

    const empty = { dimensions: [], values: [] };
    await connection.db.insert(table).values({ value: citext("Empty"), original: "Empty", tags: empty });
    const emptyRows = await connection.transaction((db) =>
      db.select({ tags: table.tags }).from(table).where(api.equal(table.value, "empty")),
    );
    assert.deepEqual(emptyRows, [{ tags: empty }]);
    assert.deepEqual(rpc(emptyRows), emptyRows);
    const six = {
      dimensions: Array.from({ length: 6 }, () => ({ lowerBound: 1, length: 1 })),
      values: [[[[[[citext("Six")]]]]]],
    };
    await connection.db.insert(table).values({ value: citext("Six"), original: "Six", tags: six });
    const last = await connection.transaction((db) =>
      db.select({ tags: table.tags }).from(table).where(api.equal(table.value, "six")),
    );
    assert.deepEqual(last, [{ tags: six }]);
    assert.deepEqual(rpc(last), last);
    await assert.rejects(admin.query("select '{{{{{{{a}}}}}}}'::case_text.citext[]"), { code: "54000" });
    const adjacentBound = {
      dimensions: [{ lowerBound: 2147483646, length: 1 }],
      values: [citext("A")],
    };
    const adjacentNative = await admin.query("select $1::case_text.citext[]::text value", [
      api.arrayCodec.encode(adjacentBound),
    ]);
    assert.deepEqual(api.arrayCodec.decode(adjacentNative.rows[0]?.value), adjacentBound);
    for (const text of ["[2147483647:2147483647]={A}", "[2147483646:2147483647]={A,B}"]) {
      await assert.rejects(admin.query("select $1::case_text.citext[]", [text]), {
        code: "54000",
      });
      assert.throws(() => api.arrayCodec.decode(text));
    }
    await assert.rejects(
      connection.transaction(async (db) => {
        await db.insert(table).values({ value: citext("RolledBack"), original: "RolledBack" });
        assert.throws(() => api.arrayCodec.decode("[2147483647:2147483647]={A}"));
        return "caught";
      }),
    );
    assert.deepEqual(
      await connection.db.select({ value: table.value }).from(table).where(api.equal(table.value, "RolledBack")),
      [],
    );
  }, citextSchemaIndexesProofCase);
});

test("citext.publicSearchNativePaginationLocaleAndObservableInvalidation", async () => {
  await fixture(async (connection, admin) => {
    const validators = createSearchValidators(schema, relations);
    const source = validators.entries.search({
      columns: ["value", "original"],
      filter: ["value"],
      order: ["value"],
      text: ["value"],
      scope: "public",
    });
    const descriptor = searchContractDescriptor(oc.input(source.input).output(source.output));
    if (!descriptor) throw new Error("Missing search contract");
    const context = {
      branchId: "br-citext",
      namespace: "app",
      contract: "entries.citext",
      identity: null,
    };
    async function page(input: SearchPublicSelection) {
      const plan = await prepareSearchPage(descriptor!, input, context, "03".repeat(32));
      return connection.transaction(async (db) =>
        finishSearchPage(
          plan,
          v.parse(
            storageRows,
            await db.query.entries.findMany({
              columns: plan.config.columns,
              orderBy: plan.config.orderBy,
              where: plan.config.where,
              limit: plan.config.limit,
              extras: plan.config.extras,
            }),
          ),
        ),
      );
    }
    const table = schema.tables.entries;
    const words = ["A", "a", "B", "b", "É", "é", "Straße", "STRASSE", null];
    await connection.db.insert(table).values(
      words.map((value, index) => ({
        value: value === null ? null : citext(value),
        original: `${index}:${value}`,
      })),
    );
    expect((await page({ where: { value: { eq: "a" } } })).rows?.map((row) => row.value)).toEqual(["A", "a"]);
    expect(
      (await page({ where: { value: { contains: "STRASSE", insensitive: false } } })).rows?.map((row) => row.value),
    ).toEqual(["STRASSE"]);
    for (const direction of ["asc", "desc"] as const)
      for (const nulls of ["first", "last"] as const) {
        const oracle = await admin.query(
          `select value,original from app.entries order by value using operator(case_text.${direction === "asc" ? "<" : ">"}) nulls ${nulls}, _id asc`,
        );
        for (const traversal of ["forward", "backward"] as const) {
          const found: unknown[] = [];
          let cursor: string | null = null,
            pages = 0;
          do {
            const result = await page({
              orderBy: [{ field: "value", direction, nulls }],
              direction: traversal,
              limit: 2,
              cursor,
            });
            if (traversal === "forward") found.push(...(result.rows ?? []));
            else found.unshift(...(result.rows ?? []));
            cursor = traversal === "forward" ? result.nextCursor : result.previousCursor;
            expect(++pages).toBeLessThan(10);
          } while (cursor);
          assert.deepEqual(found, oracle.rows);
        }
      }
    const cOrder = await admin.query(
      "select 'É'::case_text.citext collate \"C\" operator(case_text.<) 'z'::case_text.citext native, lower('É') collate \"C\" < lower('z') collate \"C\" oracle",
    );
    expect(cOrder.rows[0]?.native).toBe(cOrder.rows[0]?.oracle);
    const locale = await admin.query("select datctype from pg_database where datname=current_database()");
    expect(locale.rows[0]?.datctype).toBeTruthy();
    const unicode = await connection.transaction((db) =>
      db
        .select({ accent: api.equal("É", "é"), fold: api.equal("Straße", "STRASSE") })
        .from(table)
        .limit(1),
    );
    expect(unicode[0]?.fold).toBe(false);
    const lowerOracle = await admin.query("select lower('É')=lower('é') accent");
    expect(unicode[0]?.accent).toBe(lowerOracle.rows[0]?.accent);
    await admin.query("create schema loom_meta");
    for (const migration of frameworkMigrations("loom_meta"))
      for (const statement of migration.statements) await admin.query(statement);
    await admin.query("begin");
    await installRevisionTracking(admin, "app", "loom_meta", ["entries"]);
    await admin.query("commit");
    const external = createSqlFunction({
      schema: "pg_catalog",
      name: "current_database",
      member: "fixture:external-database",
      arguments: [] as const,
      result: textCodec,
      dependencies: [],
      observability: "external",
      authority: "query",
    });
    await assert.rejects(
      evaluateSnapshot(() =>
        connection.transaction((db) => db.select({ value: api.fromText(external().as("external_alias")) }).from(table)),
      ),
      /cannot observe external/,
    );
    const read = createRevisionReader({
      namespace: "app",
      metadataNamespace: "loom_meta",
      tables: ["entries"],
    });
    const events: unknown[] = [];
    const failures: Error[] = [];
    const coordinator = createRevisionCoordinator({
      readRevisions: () => read(connection.db),
      intervalMs: 60_000,
    });
    try {
      coordinator.subscribe(
        { expiresAt: Math.floor(Date.now() / 1000) + 60 },
        {
          evaluate: () =>
            evaluateSnapshot(() =>
              connection.transaction(async (db) => {
                const rows = await db.select({ value: table.value }).from(table).where(api.equal(table.value, "alpha"));
                await captureSnapshotRevisions(db, read);
                return rows;
              }),
            ),
          publish: (rows) => {
            events.push(rows);
            return true;
          },
          close: (_reason, error) => {
            if (error) failures.push(error);
          },
        },
      );
      await coordinator.poll();
      expect(events).toEqual([[]]);
      await connection.transaction((db) => db.insert(table).values({ value: citext("ALPHA"), original: "live" }));
      await coordinator.poll();
      expect(events).toEqual([[], [{ value: "ALPHA" }]]);
      expect(failures).toEqual([]);
    } finally {
      await coordinator.stop();
    }
  });
});
