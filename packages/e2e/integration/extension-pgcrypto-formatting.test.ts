import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { call } from "@orpc/server";
import { Context } from "effect";
import { defineRelations, eq, sql, type SQL } from "drizzle-orm";
import { bytea, pgTable, text } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  anyKeyBytes,
  duplicateHeaders,
  duplicateHeadersArmor,
  emptyArmor,
  fixtureBytes,
  independentArmor,
  multipleRecipientBytes,
  publicKeyArmor,
  publicKeyId,
  recipientArmor,
  secondRecipientArmor,
  secondRecipientId,
  secretKeyArmor,
  signingOnlyKeyArmor,
  symmetricArmor,
  testArmor,
} from "../fixtures/pgcrypto-formatting";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import { binaryCodec, type PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import { checkedExtensionExpression, withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { captureInvocationGuard, connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { captureSnapshotRevisions, evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'format"functions',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const fixture = sql`(values (1)) fixture(id)`;
const bytes = { hex: "74657374" };
const install = sql`create schema "format""functions"; create extension pgcrypto with schema "format""functions" version '1.4'; grant usage on schema "format""functions" to public; create schema conflicting; create function conflicting.armor(bytea) returns text language sql as 'select ''shadow''::text'; create function conflicting.armor(bytea,text[],text[]) returns text language sql as 'select ''shadow''::text'; create function conflicting.dearmor(text) returns bytea language sql as 'select null::bytea'; create function conflicting.pgp_key_id(bytea) returns text language sql as 'select ''shadow''::text'; create function conflicting.pgp_armor_headers(text, out key text, out value text) returns setof record language sql as 'select ''shadow''::text,''shadow''::text'`;

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native SQLSTATE arrives through Drizzle cause chains before RPC sanitizes it.
function nativeError(error: unknown): pg.DatabaseError {
  if (error instanceof pg.DatabaseError) return error;
  if (error instanceof Error && error.cause) return nativeError(error.cause);
  throw new Error("Expected native PostgreSQL error", { cause: error });
}

async function withFormatting(operation: (connection: Awaited<ReturnType<typeof connectDatabase>>) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      const [server] = (
        await connection.db.execute(
          sql`select current_setting('server_version_num')::int4 as version, current_setting('server_encoding') as encoding`,
        )
      ).rows;
      assert(server);
      expect(Number(server.version)).toBeGreaterThanOrEqual(180000);
      expect(Number(server.version)).toBeLessThan(190000);
      expect(server.encoding).toBe("UTF8");
      await connection.db.execute(install);
      expect(
        (
          await connection.db.execute(
            sql`select e.extversion,n.nspname from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto'`,
          )
        ).rows,
      ).toEqual([{ extversion: "1.4", nspname: 'format"functions' }]);
      // Check exact installed symbolic input identities before interpreting fixture behavior.
      expect(
        (
          await connection.db.execute(
            sql`select p.proname as name, (select string_agg(tn.nspname||'.'||t.typname,',' order by a.ordinality) from unnest(p.proargtypes) with ordinality a(oid,ordinality) join pg_catalog.pg_type t on t.oid=a.oid join pg_catalog.pg_namespace tn on tn.oid=t.typnamespace) as arguments, p.proisstrict as strict, p.provolatile as volatility, p.proparallel as parallel, p.proretset as setof from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='format"functions' and p.proname in ('armor','dearmor','pgp_armor_headers','pgp_key_id') order by p.proname,p.pronargs`,
          )
        ).rows,
      ).toEqual([
        { name: "armor", arguments: "pg_catalog.bytea", strict: true, volatility: "i", parallel: "s", setof: false },
        {
          name: "armor",
          arguments: "pg_catalog.bytea,pg_catalog._text,pg_catalog._text",
          strict: true,
          volatility: "i",
          parallel: "s",
          setof: false,
        },
        { name: "dearmor", arguments: "pg_catalog.text", strict: true, volatility: "i", parallel: "s", setof: false },
        {
          name: "pgp_armor_headers",
          arguments: "pg_catalog.text",
          strict: true,
          volatility: "i",
          parallel: "s",
          setof: true,
        },
        {
          name: "pgp_key_id",
          arguments: "pg_catalog.bytea",
          strict: true,
          volatility: "i",
          parallel: "s",
          setof: false,
        },
      ]);
      await operation(connection);
    } finally {
      await connection.close();
    }
  });
}

test("all five exact members execute on actual PG18 including old backends against independent public vectors", async () => {
  await withFormatting(async (connection) => {
    const headers = extension.armorHeaders(duplicateHeadersArmor, 'headers"alias');
    const queries = {
      armor: extension.sql.functions["armor(bytea)"](bytes),
      headersArmor: extension.sql.functions["armor(bytea,text[],text[])"](bytes, ["Version", "Comment"], ["Kello", ""]),
      binary: extension.sql.functions["dearmor(text)"](testArmor),
      record: extension.sql.functions["pgp_armor_headers(text)"](duplicateHeadersArmor),
      key: extension.sql.functions["pgp_key_id(bytea)"](fixtureBytes(publicKeyArmor)),
    };
    const prepared = connection.db
      .select({ armor: queries.armor, headersArmor: queries.headersArmor, binary: queries.binary, key: queries.key })
      .from(fixture)
      .prepare("formatting_roots");
    const expected = [
      {
        armor: testArmor,
        headersArmor: testArmor.replace("\n\n", "\nVersion: Kello\nComment: \n\n"),
        binary: bytes,
        key: publicKeyId,
      },
    ];
    await connection.transaction(async (db) => {
      await db.execute(sql`set local search_path = conflicting, public`);
      expect(
        await db
          .select({
            armor: queries.armor,
            headersArmor: queries.headersArmor,
            binary: queries.binary,
            key: queries.key,
          })
          .from(fixture),
      ).toEqual(expected);
      expect(await prepared.execute()).toEqual(expected);
      expect(await db.select({ row: queries.record }).from(fixture)).toEqual(duplicateHeaders.map((row) => ({ row })));
      expect(
        await db.select({ key: headers.key, value: headers.value }).from(headers.from).prepare().execute(),
      ).toEqual(duplicateHeaders);
      expect(
        await db.select({ empty: extension.armor({ hex: "" }), parsed: extension.dearmor(emptyArmor) }).from(fixture),
      ).toEqual([{ empty: emptyArmor, parsed: { hex: "" } }]);
      expect(
        await db
          .select({
            public: extension.keyId(fixtureBytes(publicKeyArmor)),
            secret: extension.keyId(fixtureBytes(secretKeyArmor)),
            recipient: extension.keyId(fixtureBytes(recipientArmor)),
            second: extension.keyId(fixtureBytes(secondRecipientArmor)),
            symmetric: extension.keyId(fixtureBytes(symmetricArmor)),
            any: extension.keyId(anyKeyBytes()),
          })
          .from(fixture),
      ).toEqual([
        {
          public: publicKeyId,
          secret: publicKeyId,
          recipient: publicKeyId,
          second: secondRecipientId,
          symmetric: "SYMKEY",
          any: "ANYKEY",
        },
      ]);
    });
  });
});

test("armor Base64, CRC24, payload wrapping, high bytes and literal binary comparison are independently verified", async () => {
  await withFormatting(async (connection) => {
    const raw = Buffer.from(Array.from({ length: 193 }, (_, index) => index & 255));
    const independentlyFramed = independentArmor(raw);
    expect(independentArmor(Buffer.alloc(0))).toBe(emptyArmor);
    expect(independentArmor(Buffer.from("test"))).toBe(testArmor);
    const wrapText =
      "0123456789abcdef0123456789abcdef0123456789abcdef\n0123456789abcdef0123456789abcdef0123456789abcdef";
    const wrapArmor =
      "-----BEGIN PGP MESSAGE-----\n\nMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVmCjAxMjM0NTY3\nODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZg==\n=JFw5\n-----END PGP MESSAGE-----\n";
    for (const mode of ["hex", "escape"] as const)
      await connection.transaction(async (db) => {
        await db.execute(mode === "hex" ? sql`set local bytea_output='hex'` : sql`set local bytea_output='escape'`);
        const rows = await db
          .select({
            armor: extension.armor({ hex: raw.toString("hex") }),
            decoded: extension.dearmor(independentlyFramed),
            wrap: extension.armor({ hex: Buffer.from(wrapText).toString("hex") }),
          })
          .from(fixture)
          .prepare()
          .execute();
        expect(rows).toEqual([{ armor: independentlyFramed, decoded: { hex: raw.toString("hex") }, wrap: wrapArmor }]);
        expect(
          await db
            .select({ value: extension.dearmor(independentlyFramed) })
            .from(fixture)
            .where(eq(extension.dearmor(independentlyFramed), { hex: raw.toString("hex") }))
            .prepare()
            .execute(),
        ).toEqual([{ value: { hex: raw.toString("hex") } }]);
        expect(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, rows)))).toEqual(rows);
      });
  });
});

test("strict whole NULLs, empty arrays and independent non-one bounds retain native behavior", async () => {
  await withFormatting(async (connection) => {
    const nullHeaders = extension.armorHeaders(null, "headers");
    expect(
      await connection.db.select({ key: nullHeaders.key, value: nullHeaders.value }).from(nullHeaders.from),
    ).toEqual([]);
    expect(
      await connection.db
        .select({
          one: extension.armor(null),
          binary: extension.dearmor(null),
          key: extension.keyId(null),
          data: extension.armor(null, ["Version"], ["Kello"]),
          keys: extension.armor(bytes, null, ["Kello"]),
          values: extension.armor(bytes, ["Version"], null),
          shortCircuit: extension.armor(null, [null, "café", "bad: key"], ["x\ny"]),
          empty: extension.armor(bytes, [], []),
        })
        .from(fixture),
    ).toEqual([
      {
        one: null,
        binary: null,
        key: null,
        data: null,
        keys: null,
        values: null,
        shortCircuit: null,
        empty: testArmor,
      },
    ]);
    const bound = extension.armor(
      bytes,
      { dimensions: [{ lowerBound: 0, length: 1 }], values: ["Version"] },
      { dimensions: [{ lowerBound: -3, length: 1 }], values: ["Kello"] },
    );
    const expressions = extension.armor(
      bytes,
      sql<PostgreSqlArray<string>>`'[4:4]={Version}'::text[]`,
      sql<PostgreSqlArray<string>>`'[9:9]={Kello}'::text[]`,
    );
    expect(await connection.db.select({ bound, expressions }).from(fixture).prepare().execute()).toEqual([
      {
        bound: testArmor.replace("\n\n", "\nVersion: Kello\n\n"),
        expressions: testArmor.replace("\n\n", "\nVersion: Kello\n\n"),
      },
    ]);
    // Native generation permits a colon without space and CR; these are not JS policy checks.
    const permitted = await connection.db
      .select({ value: extension.armor(bytes, ["a:b", "CR\r"], ["value\r", ""]) })
      .from(fixture);
    expect(permitted[0]!.value).toBe(testArmor.replace("\n\n", "\na:b: value\r\nCR\r: \n\n"));
  });
});

test("header parsing retains duplicates, empty values, UTF8 and CRLF and does not validate message CRC", async () => {
  await withFormatting(async (connection) => {
    for (const armored of [duplicateHeadersArmor, duplicateHeadersArmor.replaceAll("\n", "\r\n")]) {
      const headers = extension.armorHeaders(armored, "headers");
      const rows = await connection.db.select({ key: headers.key, value: headers.value }).from(headers.from);
      expect(rows).toEqual(duplicateHeaders);
      expect(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, rows)))).toEqual(rows);
      await assert.rejects(
        connection.transaction((db) => db.select({ value: extension.dearmor(armored) }).from(fixture)),
        (error) => {
          expect(nativeError(error).code).toBe("39000");
          return true;
        },
      );
    }
    const unicode = extension.armorHeaders(testArmor.replace("\n\n", "\nComment: café 世界\n\n"), "unicode");
    expect(await connection.db.select({ key: unicode.key, value: unicode.value }).from(unicode.from)).toEqual([
      { key: "Comment", value: "café 世界" },
    ]);
  });
});

test("real array columns, selected aliases, correlated named FROM and prepared contracts retain their sources", async () => {
  await withFormatting(async (connection) => {
    await connection.db.execute(sql`create table format_inputs(bytes bytea, armored text, keys text[], values text[])`);
    await connection.db.execute(
      sql`insert into format_inputs values (decode('74657374','hex'), ${testArmor}, array['Version','Comment'], array['Kello',''])`,
    );
    const table = pgTable("format_inputs", {
      bytes: bytea(),
      armored: text(),
      keys: text().array(),
      values: text().array(),
    });
    const selected = connection.db
      .select({
        armored: extension.armor(table.bytes, table.keys, table.values).as("armored"),
        bytes: extension.dearmor(table.armored).as("bytes"),
      })
      .from(table)
      .as("selected");
    const headers = extension.armorHeaders(selected.armored, 'correlated"headers');
    const query = connection.db
      .select({ key: headers.key, value: headers.value, armor: extension.armor(selected.bytes) })
      .from(sql`${selected}, lateral ${headers.from}`);
    const prepared = query.prepare("correlated_format_headers");
    const seen: { member: string; relations: readonly string[] | undefined }[] = [];
    expect(
      await withExtensionSqlExecution(
        { check: (contract, relations) => seen.push({ member: contract.member, relations }) },
        () => connection.transaction(() => prepared.execute()),
      ),
    ).toEqual([
      { key: "Version", value: "Kello", armor: testArmor },
      { key: "Comment", value: "", armor: testArmor },
    ]);
    expect(seen.map((entry) => entry.member)).toContain(
      "routine:$extension:pgcrypto.pgp_armor_headers(pg_catalog.text)",
    );
    expect(seen.some((entry) => entry.relations?.includes("public.format_inputs"))).toBe(true);
    const rows = connection.db
      .select({ key: headers.key.as("key"), value: headers.value.as("value") })
      .from(sql`${selected}, lateral ${headers.from}`)
      .as("selected_headers");
    expect(await connection.db.select().from(rows)).toEqual([
      { key: "Version", value: "Kello" },
      { key: "Comment", value: "" },
    ]);
    // The test reads its revision fixture inside the native transaction; it does not claim real provider invalidation.
    await connection.db.execute(
      sql`create table format_revisions(revision text); insert into format_revisions values ('1')`,
    );
    for (const execute of [() => query.execute(), () => prepared.execute()]) {
      const snapshot = await evaluateSnapshot(() =>
        connection.transaction(async (db) => {
          const result = await execute();
          await captureSnapshotRevisions(db, async (reader) => {
            const [revision] = (await reader.execute(sql`select revision from format_revisions`)).rows;
            assert(revision);
            return { "public.format_inputs": v.parse(v.string(), revision.revision) };
          });
          return result;
        }),
      );
      expect(snapshot.value).toHaveLength(2);
      expect(snapshot.revisions).toEqual({ "public.format_inputs": "1" });
    }
    const literal = connection.db.select({ value: extension.armor(bytes) }).from(fixture);
    expect(
      (
        await evaluateSnapshot(() =>
          connection.transaction(async (db) => {
            const rows = await literal.execute();
            await captureSnapshotRevisions(db, async () => ({}));
            return rows;
          }),
        )
      ).value,
    ).toEqual([{ value: testArmor }]);
    for (const expression of [
      extension.armor(extension.genRandomBytes(1)),
      extension.keyId(extension.genRandomBytes(1)),
      extension.dearmor(extension.armor(extension.genRandomBytes(1))),
    ]) {
      const external = connection.db.select({ value: expression }).from(fixture);
      await assert.rejects(
        evaluateSnapshot(() => external.execute()),
        /Automatic live query cannot observe external extension dependency/,
      );
      await assert.rejects(
        evaluateSnapshot(() => external.prepare().execute()),
        /Automatic live query cannot observe external extension dependency/,
      );
      await assert.rejects(
        evaluateSnapshot(async () => {
          try {
            await external.prepare().execute();
          } catch {}
          return "caught";
        }),
        /Automatic live query cannot observe external extension dependency/,
      );
    }
  });
});

test("native formatting rejection families retain their SQLSTATE and roll back preceding writes", async () => {
  await withFormatting(async (connection) => {
    await connection.db.execute(sql`create table writes(value int4 not null)`);
    const invalid = [
      { name: "count", state: "2202E", expression: extension.armor(bytes, ["one"], ["a", "b"]) },
      {
        name: "key-dimensions",
        state: "2202E",
        expression: extension.armor(
          bytes,
          {
            dimensions: [
              { lowerBound: 1, length: 1 },
              { lowerBound: 1, length: 1 },
            ],
            values: [["one"]],
          },
          ["value"],
        ),
      },
      {
        name: "value-dimensions",
        state: "2202E",
        expression: extension.armor(bytes, ["key"], sql<PostgreSqlArray<string>>`array[['value']]::text[]`),
      },
      { name: "null-key", state: "22004", expression: extension.armor(bytes, [null], ["value"]) },
      { name: "null-value", state: "22004", expression: extension.armor(bytes, ["key"], [null]) },
      { name: "unicode-key", state: "22023", expression: extension.armor(bytes, ["café"], ["value"]) },
      { name: "unicode-value", state: "22023", expression: extension.armor(bytes, ["key"], ["世界"]) },
      { name: "newline-key", state: "22023", expression: extension.armor(bytes, ["key\n"], ["value"]) },
      { name: "newline-value", state: "22023", expression: extension.armor(bytes, ["key"], ["value\n"]) },
      { name: "colon-space", state: "22023", expression: extension.armor(bytes, ["bad: key"], ["value"]) },
      { name: "checksum", state: "39000", expression: extension.dearmor(testArmor.replace("=+G7Q", "=ZZZZ")) },
      {
        name: "header-framing",
        state: "39000",
        expression: extension.sql.functions["pgp_armor_headers(text)"](testArmor.replace("\n\n", "\nfoo:\n\n")),
      },
      {
        name: "no-header-separator",
        state: "39000",
        expression: extension.sql.functions["pgp_armor_headers(text)"](testArmor.replace("\n\n", "\n")),
      },
      { name: "no-encryption-key", state: "39000", expression: extension.keyId(fixtureBytes(signingOnlyKeyArmor)) },
      { name: "multiple-recipients", state: "39000", expression: extension.keyId(multipleRecipientBytes()) },
      {
        name: "truncated",
        state: "39000",
        expression: extension.keyId({ hex: fixtureBytes(recipientArmor).hex.slice(0, 16) }),
      },
      { name: "malformed", state: "39000", expression: extension.keyId(bytes) },
    ];
    for (const entry of invalid) {
      for (const prepared of [false, true])
        await assert.rejects(
          connection.transaction(async (db) => {
            await db.execute(sql`insert into writes values (1)`);
            const query = db.select({ value: entry.expression }).from(fixture);
            await (prepared ? query.prepare().execute() : query.execute());
          }),
          (error) => {
            expect(nativeError(error).code).toBe(entry.state);
            return true;
          },
        );
      expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([]);
      await assert.rejects(
        connection.transaction(async (db) => {
          await db.execute(sql`insert into writes values (1)`);
          await assert.rejects(db.select({ value: entry.expression }).from(fixture).execute(), (error) => {
            expect(nativeError(error).code).toBe(entry.state);
            return true;
          });
          await db.execute(sql`select 1`);
        }),
        (error) => {
          expect(nativeError(error).code).toBe("25P02");
          return true;
        },
      );
      expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([]);
    }
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const route = bindRpcDatabaseProcedure(
      createProjectProcedures(schema)
        .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
        .input(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(invalid.length - 1)))
        .handler(async ({ context, input }) => {
          await context.db.execute(sql`insert into writes values (1)`);
          try {
            await context.db.select({ value: invalid[input]!.expression }).from(fixture);
          } catch {}
          await context.db.execute(sql`select 1`);
          return "done";
        }),
      {
        connection,
        replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
        authorize: async () => {},
      },
    );
    for (let input = 0; input < invalid.length; input++) {
      const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
      await assert.rejects(
        call(route, input, {
          context: { ...invocation, operation: "mutation", "effect/context": Context.make(Invocation, invocation) },
        }),
        { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
      );
      expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([]);
    }
  });
});

test("new array bindings and fixed key-ID/header decoders keep caught failures sticky in RPC transactions", async () => {
  await withFormatting(async (connection) => {
    await connection.db.execute(sql`create table writes(value int4 not null)`);
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const decoderSchema = v.object({ decoder: v.object({ mapFromDriverValue: v.function() }) });
    const keyDecoder = v.parse(decoderSchema, extension.keyId(bytes)).decoder;
    const headerDecoder = v.parse(decoderSchema, extension.sql.functions["pgp_armor_headers(text)"](testArmor)).decoder;
    const fields = extension.armorHeaders(testArmor, "headers");
    const keyFieldDecoder = v.parse(decoderSchema, fields.key).decoder;
    const valueFieldDecoder = v.parse(decoderSchema, fields.value).decoder;
    const failures = ["array", "key", "record", "key-field", "value-field"] as const;
    const route = bindRpcDatabaseProcedure(
      createProjectProcedures(schema)
        .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
        .input(v.picklist(failures))
        .handler(async ({ context, input }) => {
          await context.db.execute(sql`insert into writes values (1)`);
          try {
            if (input === "array")
              extension.armor(bytes, { dimensions: [{ lowerBound: 1, length: 2 }], values: ["one"] }, []);
            // Deliberate fixture driver values exercise the actual new decoder, never a native rejection oracle.
            else if (input === "key")
              await context.db.select({ value: sql`'lowercase'`.mapWith(keyDecoder) }).from(fixture);
            else if (input === "record")
              await context.db.select({ value: sql`'(Comment)'`.mapWith(headerDecoder) }).from(fixture);
            else if (input === "key-field")
              await context.db.select({ value: sql`true::boolean`.mapWith(keyFieldDecoder) }).from(fixture);
            else await context.db.select({ value: sql`1::int4`.mapWith(valueFieldDecoder) }).from(fixture);
          } catch {}
          // A successful native statement must not erase a prior checked binding/result failure.
          await context.db.execute(sql`select 1`);
          return "caught";
        }),
      {
        connection,
        replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
        authorize: async () => {},
      },
    );
    for (const input of failures) {
      const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
      await assert.rejects(
        call(route, input, {
          context: { ...invocation, operation: "mutation", "effect/context": Context.make(Invocation, invocation) },
        }),
        { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
      );
      expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([]);
    }
  });
});

test("dearmor scalar results decode inside nested RQB under both bytea modes", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(
      (fields) => ({
        parents: { armor: fields.text() },
        children: { armor: fields.text(), parentId: fields.reference("parents") },
      }),
      { namespace: "public" },
    );
    const relations = defineRelations(schema.tables, (r) => ({
      parents: { children: r.many.children({ from: r.parents._id, to: r.children.parentId }) },
      children: { parent: r.one.parents({ from: r.children.parentId, to: r.parents._id }) },
    }));
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db.execute(install);
      await connection.db.execute(
        sql`create table parents("_id" uuid primary key default uuidv7(), "_createdAt" bigint default 1, armor text); create table children("_id" uuid primary key default uuidv7(), "_createdAt" bigint default 1, armor text, parent_id uuid)`,
      );
      await connection.db.execute(sql`insert into parents(armor) values (${testArmor})`);
      await connection.db.execute(sql`insert into children(armor,parent_id) select armor,"_id" from parents`);
      for (const mode of ["hex", "escape"] as const)
        await connection.transaction(async (db) => {
          await db.execute(mode === "hex" ? sql`set local bytea_output='hex'` : sql`set local bytea_output='escape'`);
          const rows = await db.query.parents.findMany({
            columns: { armor: true },
            extras: { bytes: (table) => extension.dearmor(table.armor) },
            with: {
              children: {
                columns: { armor: true },
                extras: { bytes: (table) => extension.dearmor(table.armor), missing: extension.dearmor(null) },
              },
            },
          });
          expect(rows).toEqual([{ armor: testArmor, bytes, children: [{ armor: testArmor, bytes, missing: null }] }]);
          expect(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, rows)))).toEqual(rows);
        });
    } finally {
      await connection.close();
    }
  });
});

test("formatting retains invocation identity and rejects escaped inputs, row sources and prepared handles", async () => {
  await withFormatting(async (connection) => {
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    let retained: SQL<string | null> | undefined;
    let retainedRows: ReturnType<typeof extension.armorHeaders> | undefined;
    let retainedPrepared: { execute(): Promise<{ value: string | null }[]> } | undefined;
    const identity = { issuer: "fixture", subject: "formatting-user", tenantId: "formatting-tenant" };
    const route = bindRpcDatabaseProcedure(
      createProjectProcedures(schema)
        .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
        .input(v.picklist(["create", "reuse"]))
        .handler(async ({ context, input }) => {
          expect(context.identity).toEqual(identity);
          expect(
            (await context.db.execute(sql`select current_setting('kello.identity')::jsonb as identity`)).rows,
          ).toEqual([{ identity }]);
          if (input === "reuse") {
            assert(retained);
            return context.db.select({ value: retained }).from(fixture);
          }
          const owned = checkedExtensionExpression(
            sql`decode('74657374','hex')`,
            binaryCodec,
            [],
            captureInvocationGuard(),
            "fixture:formatting-owned",
          );
          retained = extension.armor(owned.as("bytes"));
          retainedRows = extension.armorHeaders(retained, "headers");
          retainedPrepared = context.db.select({ value: retained }).from(fixture).prepare();
          return retainedPrepared.execute();
        }),
      {
        connection,
        replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
        authorize: async () => {},
      },
    );
    const invoke = (input: "create" | "reuse") => {
      const invocation = { identity, requestId: crypto.randomUUID(), signal: new AbortController().signal };
      return call(route, input, {
        context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
      });
    };
    expect(await invoke("create")).toEqual([{ value: testArmor }]);
    assert(retained && retainedPrepared && retainedRows);
    const escaped = retained;
    const escapedRows = retainedRows;
    await assert.rejects(async () => connection.db.select({ value: escaped }).from(fixture).execute(), /invocation/i);
    await assert.rejects(retainedPrepared.execute(), /invocation/i);
    await assert.rejects(
      async () =>
        connection.db.select({ key: escapedRows.key, value: escapedRows.value }).from(escapedRows.from).execute(),
      /invocation/i,
    );
    await assert.rejects(invoke("reuse"), { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
  });
});
