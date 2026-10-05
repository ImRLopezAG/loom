import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { call } from "@orpc/server";
import { Context } from "effect";
import { defineRelations, eq, sql } from "drizzle-orm";
import { bytea, pgTable, text } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { pgcryptoNativeGroups, pgcryptoNativeProofCases, pgcryptoProofFamily } from "../fixtures/pgcrypto-proof-cases";
import { pgcryptoProofSchema } from "../fixtures/pgcrypto-semantic-proof";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import { withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";

// Public PostgreSQL regression vectors, pinned at 37bbf5bba09c4244d74f152557e69f73f2b6690e:
// contrib/pgcrypto/{sql,expected}/sha2.{sql,out} and hmac-sha1.{sql,out}.
// These constants are unsuitable as production keys. Expected values are independent of this adapter.
const abc = { hex: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" };
const empty = { hex: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" };
const textMac = { hex: "156d4c35468a0339f3fa57a067bf47f814eb7a57" };
const byteMac = { hex: "675b0b3a1b4ddf4e124872da6c2f632bfed957e9" };
const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'crypto"proof',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});

const installation = sql`create schema "crypto""proof"; create extension pgcrypto with schema "crypto""proof" version '1.4'; create schema conflicting; create function conflicting.digest(text,text) returns bytea language sql as 'select null::bytea'; create function conflicting.hmac(text,text,text) returns bytea language sql as 'select null::bytea'`;

const [digestText, digestBytea, hmacText, hmacBytea] = pgcryptoNativeGroups.hash.members;
function witness(member: string, assertion: () => void) {
  return extensionProofWitness(
    { family: pgcryptoProofFamily, member, scenario: pgcryptoNativeGroups.hash.scenario, schema: pgcryptoProofSchema },
    assertion,
  );
}

extensionProofTest(pgcryptoNativeProofCases.hash, async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      const server = await connection.db.execute(sql`show server_version_num`);
      expect(Number(server.rows[0]!.server_version_num)).toBeGreaterThanOrEqual(180000);
      expect(Number(server.rows[0]!.server_version_num)).toBeLessThan(190000);
      await connection.db.execute(installation);
      expect(
        (
          await connection.db.execute(
            sql`select e.extversion, n.nspname from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto'`,
          )
        ).rows,
      ).toEqual([{ extversion: "1.4", nspname: 'crypto"proof' }]);
      await observeExtensionProofDatabase(url, pgcryptoNativeProofCases.hash.id, "pgcrypto");
      await connection.transaction(async (db) => {
        await db.execute(sql`set local search_path = conflicting, public`);
        const [vectors] = await db
          .select({
            text: extension.digest("abc", "sha256", "text"),
            binary: extension.sql.functions["digest(bytea,text)"]({ hex: "616263" }, "sha256"),
            emptyText: extension.sql.functions["digest(text,text)"]("", "sha256"),
            emptyBinary: extension.digest({ hex: "" }, "sha256", "bytea"),
            textMac: extension.sql.functions["hmac(text,text,text)"]("Jefe", "what do ya want for nothing?", "sha1"),
            binaryMac: extension.hmac({ hex: "4869205468657265" }, { hex: "0b".repeat(16) }, "sha1", "bytea"),
            longKey: extension.hmac(
              { hex: Buffer.from("Test Using Larger Than Block-Size Key - Hash Key First", "utf8").toString("hex") },
              { hex: "aa".repeat(80) },
              "sha1",
              "bytea",
            ),
          })
          .from(sql`(values (1)) fixture(id)`);
        assert(vectors);
        const [unicode] = await db
          .select({
            text: extension.digest("é你好🙂", "sha256", "text"),
            utf8: extension.digest({ hex: "c3a9e4bda0e5a5bdf09f9982" }, "sha256", "bytea"),
            distinctBytes: extension.digest({ hex: "e9" }, "sha256", "bytea"),
            allOctets: extension.digest(
              { hex: Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, "0")).join("") },
              "sha256",
              "bytea",
            ),
          })
          .from(sql`(values (1)) fixture(id)`);
        expect(unicode!.text).toEqual(unicode!.utf8);
        expect(unicode!.distinctBytes).not.toEqual(unicode!.text);
        expect(unicode!.allOctets?.hex).toHaveLength(64);
        const [nulls] = await db
          .select({
            dtData: extension.digest(null, "sha256", "text"),
            dtAlgorithm: extension.digest("abc", null, "text"),
            dbData: extension.digest(null, "sha256", "bytea"),
            dbAlgorithm: extension.digest({ hex: "616263" }, null, "bytea"),
            htData: extension.hmac(null, "key", "sha1", "text"),
            htKey: extension.hmac("data", null, "sha1", "text"),
            htAlgorithm: extension.hmac("data", "key", null, "text"),
            hbData: extension.hmac(null, { hex: "00" }, "sha1", "bytea"),
            hbKey: extension.hmac({ hex: "00" }, null, "sha1", "bytea"),
            hbAlgorithm: extension.hmac({ hex: "00" }, { hex: "00" }, null, "bytea"),
          })
          .from(sql`(values (1)) fixture(id)`);
        assert(nulls);
        await witness(digestText!, () => {
          expect([vectors.text, vectors.emptyText]).toEqual([abc, empty]);
          expect([nulls.dtData, nulls.dtAlgorithm]).toEqual([null, null]);
        });
        await witness(digestBytea!, () => {
          expect([vectors.binary, vectors.emptyBinary]).toEqual([abc, empty]);
          expect([nulls.dbData, nulls.dbAlgorithm]).toEqual([null, null]);
        });
        await witness(hmacText!, () => {
          expect(vectors.textMac).toEqual(textMac);
          expect([nulls.htData, nulls.htKey, nulls.htAlgorithm]).toEqual([null, null, null]);
        });
        await witness(hmacBytea!, () => {
          expect([vectors.binaryMac, vectors.longKey]).toEqual([
            byteMac,
            { hex: "aa4ae5e15272d00e95705637ce8a3b55ed402112" },
          ]);
          expect([nulls.hbData, nulls.hbKey, nulls.hbAlgorithm]).toEqual([null, null, null]);
        });
      });
    } finally {
      await connection.close();
    }
  });
});

test("hashing native bytea storage, alias references and prepared filters preserve executed contracts", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const table = pgTable("hash_inputs", { data: bytea(), key: bytea(), value: text(), algorithm: text() });
    try {
      await connection.db.execute(installation);
      await connection.db.execute(
        sql`create table hash_inputs(data bytea, key bytea, value text, algorithm text); insert into hash_inputs values (decode('4869205468657265','hex'), decode(repeat('0b',16),'hex'), 'abc', 'sha256')`,
      );
      const query = connection.db
        .select({
          digest: extension.digest(table.value, table.algorithm, "text"),
          mac: extension.hmac(table.data, table.key, "sha1", "bytea"),
        })
        .from(table);
      const compiled = query.toSQL();
      expect(compiled.sql).toContain('("hash_inputs"."data")::"pg_catalog"."bytea"');
      expect(compiled.sql).toContain('("hash_inputs"."value")::"pg_catalog"."text"');
      const prepared = query.prepare();
      const seen: { member: string; relations: readonly string[] | undefined }[] = [];
      expect(
        await withExtensionSqlExecution(
          { check: (contract, relations) => seen.push({ member: contract.member, relations }) },
          () => prepared.execute(),
        ),
      ).toEqual([{ digest: abc, mac: byteMac }]);
      expect(seen.map((entry) => entry.member)).toContain(
        "routine:$extension:pgcrypto.hmac(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
      );
      expect(seen.some((entry) => entry.relations?.includes("public.hash_inputs"))).toBe(true);
      const selected = connection.db
        .select({
          value: sql<string>`'abc'`.as("value"),
          data: sql<{ hex: string }>`decode('616263','hex')`.as("data"),
        })
        .from(table)
        .as("selected");
      const aliases = connection.db
        .select({
          text: extension.digest(selected.value, "sha256", "text"),
          binary: extension.digest(selected.data, "sha256", "bytea"),
          direct: extension.digest(sql<string>`'abc'`.as("raw_alias"), "sha256", "text"),
        })
        .from(selected);
      expect(aliases.toSQL().sql).toContain('("selected"."value")::"pg_catalog"."text"');
      expect(aliases.toSQL().sql).toContain('("selected"."data")::"pg_catalog"."bytea"');
      expect(aliases.toSQL().sql).not.toContain('("raw_alias")');
      expect(await aliases).toEqual([{ text: abc, binary: abc, direct: abc }]);
      expect(
        await connection.db
          .select({ value: table.value })
          .from(table)
          .where(eq(extension.digest(table.value, "sha256", "text"), extension.digest("abc", "sha256", "text"))),
      ).toEqual([{ value: "abc" }]);
    } finally {
      await connection.close();
    }
  });
});

test("hash binary results remain JSON-safe in scalar and nested RQB under both bytea output modes", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(
      (fields) => ({
        parents: { value: fields.text() },
        children: { value: fields.text(), parentId: fields.reference("parents") },
      }),
      { namespace: "public" },
    );
    const relations = defineRelations(schema.tables, (r) => ({
      parents: { children: r.many.children({ from: r.parents._id, to: r.children.parentId }) },
      children: { parent: r.one.parents({ from: r.children.parentId, to: r.parents._id }) },
    }));
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db.execute(installation);
      await connection.db.execute(
        sql`create table parents("_id" uuid primary key default uuidv7(), "_createdAt" bigint default 1, value text); create table children("_id" uuid primary key default uuidv7(), "_createdAt" bigint default 1, value text, parent_id uuid); insert into parents(value) values ('abc'); insert into children(value,parent_id) select 'abc', "_id" from parents`,
      );
      for (const mode of ["hex", "escape"] as const)
        await connection.transaction(async (db) => {
          await db.execute(mode === "hex" ? sql`set local bytea_output='hex'` : sql`set local bytea_output='escape'`);
          const scalar = await db
            .select({ value: extension.digest("abc", "sha256", "text") })
            .from(schema.tables.parents);
          expect(scalar).toEqual([{ value: abc }]);
          const nested = await db.query.parents.findMany({
            columns: { value: true },
            extras: { hash: (table) => extension.digest(table.value, "sha256", "text") },
            with: {
              children: {
                columns: { value: true },
                extras: {
                  hash: (table) => extension.digest(table.value, "sha256", "text"),
                  binaryMac: extension.hmac({ hex: "4869205468657265" }, { hex: "0b".repeat(16) }, "sha1", "bytea"),
                  missing: extension.digest(null, "sha256", "bytea"),
                },
              },
            },
          });
          expect(nested).toEqual([
            { value: "abc", hash: abc, children: [{ value: "abc", hash: abc, binaryMac: byteMac, missing: null }] },
          ]);
          expect(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, nested)))).toEqual(nested);
          expect(JSON.parse(JSON.stringify(nested))).toEqual(nested);
        });
    } finally {
      await connection.close();
    }
  });
});

test("native algorithm failures in every hash overload roll back public invocation writes", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db.execute(installation);
      await connection.db.execute(sql`create table writes(value integer not null)`);
      const route = bindRpcDatabaseProcedure(
        createProjectProcedures(schema)
          .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
          .input(v.picklist(["digest-text", "digest-bytea", "hmac-text", "hmac-bytea", "caught"]))
          .handler(async ({ context, input }) => {
            await context.db.execute(sql`insert into writes values (1)`);
            function invalidAlgorithm() {
              switch (input) {
                case "digest-text":
                  return extension.digest("abc", "loom_invalid_algorithm", "text");
                case "digest-bytea":
                  return extension.digest({ hex: "616263" }, "loom_invalid_algorithm", "bytea");
                case "hmac-text":
                  return extension.hmac("Jefe", "what do ya want for nothing?", "loom_invalid_algorithm", "text");
                case "hmac-bytea":
                case "caught":
                  return extension.hmac(
                    { hex: "4869205468657265" },
                    { hex: "0b".repeat(16) },
                    "loom_invalid_algorithm",
                    "bytea",
                  );
              }
            }
            const invalid = invalidAlgorithm();
            if (input === "caught") {
              try {
                await context.db.select({ value: invalid }).from(sql`(values (1)) fixture(id)`);
              } catch {}
              // The subsequent native query witnesses PostgreSQL's aborted transaction; no sticky JS-error claim.
              await context.db.execute(sql`select 1`);
            } else await context.db.select({ value: invalid }).from(sql`(values (1)) fixture(id)`);
            return "done";
          }),
        {
          connection,
          replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
          authorize: async () => {},
        },
      );
      for (const input of ["digest-text", "digest-bytea", "hmac-text", "hmac-bytea", "caught"] as const) {
        const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
        await assert.rejects(
          call(route, input, {
            context: { ...invocation, operation: "mutation", "effect/context": Context.make(Invocation, invocation) },
          }),
        );
        expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([]);
      }
    } finally {
      await connection.close();
    }
  });
});
