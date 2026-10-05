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

// Public, test-only keys and ECB vectors; raw native ciphers do not authenticate data.
// PostgreSQL upstream at 37bbf5bba09c4244d74f152557e69f73f2b6690e:
// https://github.com/postgres/postgres/blob/37bbf5bba09c4244d74f152557e69f73f2b6690e/contrib/pgcrypto/expected/rijndael.out
// Nonzero CBC vector: NIST SP800-38A, Appendix F.2.1 (first block):
// https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf
const plain = { hex: "00112233445566778899aabbccddeeff" };
const key128 = { hex: "000102030405060708090a0b0c0d0e0f" };
const key192 = { hex: "000102030405060708090a0b0c0d0e0f1011121314151617" };
const key256 = { hex: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f" };
const cipher128 = { hex: "69c4e0d86a7b0430d8cdb78070b4c55a" };
const cipher192 = { hex: "dda97ca4864cdfe06eaf70a0ec0d7191" };
const cipher256 = { hex: "8ea2b7ca516745bfeafc49904b496089" };
const cbcPlain = { hex: "6bc1bee22e409f96e93d7e117393172a" };
const cbcKey = { hex: "2b7e151628aed2a6abf7158809cf4f3c" };
const cbcIv = { hex: "000102030405060708090a0b0c0d0e0f" };
const cbcCipher = { hex: "7649abac8119b246cee98e9b12e9197d" };
const ecb = "aes-ecb/pad:none";
const cbc = "aes-cbc/pad:none";
const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'crypto"proof',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const installation = sql`create schema "crypto""proof"; create extension pgcrypto with schema "crypto""proof" version '1.4'; create schema conflicting; create function conflicting.encrypt(bytea,bytea,text) returns bytea language sql as 'select null::bytea'; create function conflicting.decrypt(bytea,bytea,text) returns bytea language sql as 'select null::bytea'; create function conflicting.encrypt_iv(bytea,bytea,bytea,text) returns bytea language sql as 'select null::bytea'; create function conflicting.decrypt_iv(bytea,bytea,bytea,text) returns bytea language sql as 'select null::bytea'`;

const [encryptMember, decryptMember, encryptIvMember, decryptIvMember] = pgcryptoNativeGroups.cipher.members;
function witness(member: string, assertion: () => void) {
  return extensionProofWitness(
    {
      family: pgcryptoProofFamily,
      member,
      scenario: pgcryptoNativeGroups.cipher.scenario,
      schema: pgcryptoProofSchema,
    },
    assertion,
  );
}

extensionProofTest(pgcryptoNativeProofCases.cipher, async () => {
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
      await observeExtensionProofDatabase(url, pgcryptoNativeProofCases.cipher.id, "pgcrypto");
      await connection.transaction(async (db) => {
        await db.execute(sql`set local search_path=conflicting,public`);
        const [vectors] = await db
          .select({
            aes128: extension.encrypt(plain, key128, ecb),
            aes192: extension.sql.functions["encrypt(bytea,bytea,text)"](plain, key192, ecb),
            aes256: extension.encrypt(plain, key256, ecb),
            plain128: extension.decrypt(cipher128, key128, ecb),
            plain192: extension.sql.functions["decrypt(bytea,bytea,text)"](cipher192, key192, ecb),
            plain256: extension.decrypt(cipher256, key256, ecb),
            cbc: extension.sql.functions["encrypt_iv(bytea,bytea,bytea,text)"](cbcPlain, cbcKey, cbcIv, cbc),
            cbcPlain: extension.sql.functions["decrypt_iv(bytea,bytea,bytea,text)"](cbcCipher, cbcKey, cbcIv, cbc),
            zeroIv: extension.encrypt(plain, key256, cbc),
            explicitZeroIv: extension.encryptWithIv(plain, key256, { hex: "00".repeat(16) }, cbc),
            ecbIgnoredIv: extension.encryptWithIv(plain, key128, cbcIv, ecb),
            ecbIgnoredIvPlain: extension.decryptWithIv(cipher128, key128, cbcIv, ecb),
            shortIv: extension.encryptWithIv({ hex: "666f6f" }, { hex: "30313233343536" }, { hex: "61626364" }, "aes"),
            paddedIv: extension.encryptWithIv(
              { hex: "666f6f" },
              { hex: "30313233343536" },
              { hex: "61626364" + "00".repeat(12) },
              "aes",
            ),
            clippedIv: extension.encryptWithIv(cbcPlain, cbcKey, { hex: cbcIv.hex + "ff".repeat(4) }, cbc),
            shortIvPlain: extension.decryptWithIv(
              { hex: "2c24cb7da91d6d5699801268b0f5adad" },
              { hex: "30313233343536" },
              { hex: "61626364" },
              "aes",
            ),
            clippedIvPlain: extension.decryptWithIv(cbcCipher, cbcKey, { hex: cbcIv.hex + "ff".repeat(4) }, cbc),
            empty: extension.encrypt({ hex: "" }, { hex: "666f6f" }, "aes"),
            shortKey: extension.encrypt({ hex: "0011223344" }, { hex: "000102030405" }, "aes-cbc"),
            clippedKey: extension.encrypt(plain, { hex: key256.hex + "ff".repeat(8) }, ecb),
            clippedKeyPlain: extension.decrypt(cipher256, { hex: key256.hex + "ff".repeat(8) }, ecb),
            nativeAlias: extension.encrypt(plain, key128, "rijndael-ecb/pad:none"),
          })
          .from(sql`(values (1)) fixture(id)`);
        assert(vectors);
        const expected = {
          aes128: cipher128,
          aes192: cipher192,
          aes256: cipher256,
          plain128: plain,
          plain192: plain,
          plain256: plain,
          cbc: cbcCipher,
          cbcPlain,
          zeroIv: cipher256,
          explicitZeroIv: cipher256,
          ecbIgnoredIv: cipher128,
          ecbIgnoredIvPlain: plain,
          shortIv: { hex: "2c24cb7da91d6d5699801268b0f5adad" },
          paddedIv: { hex: "2c24cb7da91d6d5699801268b0f5adad" },
          clippedIv: cbcCipher,
          shortIvPlain: { hex: "666f6f" },
          clippedIvPlain: cbcPlain,
          empty: { hex: "b48cc3338a2eb293b6007ef72c360d48" },
          shortKey: { hex: "189a28932213f017b246678dbc28655f" },
          clippedKey: cipher256,
          clippedKeyPlain: plain,
          nativeAlias: cipher128,
        };
        const octets = { hex: Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, "0")).join("") };
        expect(
          await db
            .select({
              value: extension.decrypt(extension.encrypt(octets, key128, ecb), key128, ecb),
              iv: extension.decryptWithIv(extension.encryptWithIv(octets, cbcKey, cbcIv, cbc), cbcKey, cbcIv, cbc),
            })
            .from(sql`(values (1)) fixture(id)`),
        ).toEqual([{ value: octets, iv: octets }]);
        const [nulls] = await db
          .select({
            eData: extension.encrypt(null, key128, ecb),
            eKey: extension.encrypt(plain, null, ecb),
            eAlgorithm: extension.encrypt(plain, key128, null),
            dData: extension.decrypt(null, key128, ecb),
            dKey: extension.decrypt(cipher128, null, ecb),
            dAlgorithm: extension.decrypt(cipher128, key128, null),
            eiData: extension.encryptWithIv(null, cbcKey, cbcIv, cbc),
            eiKey: extension.encryptWithIv(cbcPlain, null, cbcIv, cbc),
            eiIv: extension.encryptWithIv(cbcPlain, cbcKey, null, cbc),
            eiAlgorithm: extension.encryptWithIv(cbcPlain, cbcKey, cbcIv, null),
            diData: extension.decryptWithIv(null, cbcKey, cbcIv, cbc),
            diKey: extension.decryptWithIv(cbcCipher, null, cbcIv, cbc),
            diIv: extension.decryptWithIv(cbcCipher, cbcKey, null, cbc),
            diAlgorithm: extension.decryptWithIv(cbcCipher, cbcKey, cbcIv, null),
          })
          .from(sql`(values (1)) fixture(id)`);
        assert(nulls);
        type Field = keyof typeof expected;
        const pick = (row: typeof vectors, keys: readonly Field[]) => keys.map((key) => row[key]);
        const encrypted: Field[] = [
          "aes128",
          "aes192",
          "aes256",
          "zeroIv",
          "empty",
          "shortKey",
          "clippedKey",
          "nativeAlias",
        ];
        const decrypted: Field[] = ["plain128", "plain192", "plain256", "clippedKeyPlain"];
        const encryptedIv: Field[] = ["cbc", "explicitZeroIv", "ecbIgnoredIv", "shortIv", "paddedIv", "clippedIv"];
        const decryptedIv: Field[] = ["cbcPlain", "ecbIgnoredIvPlain", "shortIvPlain", "clippedIvPlain"];
        await witness(encryptMember!, () => {
          expect(pick(vectors, encrypted)).toEqual(pick(expected, encrypted));
          expect([nulls.eData, nulls.eKey, nulls.eAlgorithm]).toEqual([null, null, null]);
        });
        await witness(decryptMember!, () => {
          expect(pick(vectors, decrypted)).toEqual(pick(expected, decrypted));
          expect([nulls.dData, nulls.dKey, nulls.dAlgorithm]).toEqual([null, null, null]);
        });
        await witness(encryptIvMember!, () => {
          expect(pick(vectors, encryptedIv)).toEqual(pick(expected, encryptedIv));
          expect([nulls.eiData, nulls.eiKey, nulls.eiIv, nulls.eiAlgorithm]).toEqual([null, null, null, null]);
        });
        await witness(decryptIvMember!, () => {
          expect(pick(vectors, decryptedIv)).toEqual(pick(expected, decryptedIv));
          expect([nulls.diData, nulls.diKey, nulls.diIv, nulls.diAlgorithm]).toEqual([null, null, null, null]);
        });
      });
    } finally {
      await connection.close();
    }
  });
});

test("cipher native bytea columns, selected aliases and prepared filters retain executed member contracts", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const table = pgTable("cipher_inputs", {
      data: bytea(),
      ciphertext: bytea(),
      key: bytea(),
      iv: bytea(),
      algorithm: text(),
    });
    try {
      await connection.db.execute(installation);
      await connection.db.execute(
        sql`create table cipher_inputs(data bytea,ciphertext bytea,key bytea,iv bytea,algorithm text)`,
      );
      await connection.db.execute(
        sql`insert into cipher_inputs values(decode(${cbcPlain.hex},'hex'),decode(${cbcCipher.hex},'hex'),decode(${cbcKey.hex},'hex'),decode(${cbcIv.hex},'hex'),${cbc})`,
      );
      const query = connection.db
        .select({
          encrypted: extension.encryptWithIv(table.data, table.key, table.iv, table.algorithm),
          decrypted: extension.decryptWithIv(table.ciphertext, table.key, table.iv, table.algorithm),
          noIv: extension.encrypt(plain, key128, ecb),
          noIvPlain: extension.decrypt(cipher128, key128, ecb),
        })
        .from(table);
      expect(query.toSQL().sql).toContain('("cipher_inputs"."iv")::"pg_catalog"."bytea"');
      expect(query.toSQL().sql).toContain('("cipher_inputs"."algorithm")::"pg_catalog"."text"');
      const seen: { member: string; relations: readonly string[] | undefined }[] = [];
      const prepared = query.prepare();
      expect(
        await withExtensionSqlExecution(
          { check: (contract, relations) => seen.push({ member: contract.member, relations }) },
          () => prepared.execute(),
        ),
      ).toEqual([{ encrypted: cbcCipher, decrypted: cbcPlain, noIv: cipher128, noIvPlain: plain }]);
      expect(new Set(seen.map((entry) => entry.member))).toEqual(
        new Set([
          "routine:$extension:pgcrypto.encrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
          "routine:$extension:pgcrypto.decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
          "routine:$extension:pgcrypto.encrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
          "routine:$extension:pgcrypto.decrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
        ]),
      );
      expect(seen.every((entry) => entry.relations?.includes("public.cipher_inputs"))).toBe(true);
      const selected = connection.db
        .select({
          data: sql<{ hex: string }>`decode(${plain.hex},'hex')`.as("data"),
          key: sql<{ hex: string }>`decode(${key128.hex},'hex')`.as("key"),
          algorithm: sql<string>`${ecb}::text`.as("algorithm"),
        })
        .from(table)
        .as("selected");
      const aliases = connection.db
        .select({
          value: extension.encrypt(selected.data, selected.key, selected.algorithm),
          direct: extension.encrypt(sql<{ hex: string }>`decode(${plain.hex},'hex')`.as("direct"), key128, ecb),
        })
        .from(selected);
      expect(aliases.toSQL().sql).toContain('("selected"."data")::"pg_catalog"."bytea"');
      expect(aliases.toSQL().sql).toContain('("selected"."algorithm")::"pg_catalog"."text"');
      expect(aliases.toSQL().sql).not.toContain('("direct")');
      expect(await aliases).toEqual([{ value: cipher128, direct: cipher128 }]);
      expect(
        await connection.db
          .select({ algorithm: table.algorithm })
          .from(table)
          .where(
            eq(
              extension.encryptWithIv(table.data, table.key, table.iv, table.algorithm),
              extension.encryptWithIv(cbcPlain, cbcKey, cbcIv, cbc),
            ),
          ),
      ).toEqual([{ algorithm: cbc }]);
    } finally {
      await connection.close();
    }
  });
});

test("raw cipher results decode to JSON-safe hex in scalar and nested RQB under both bytea modes", async () => {
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
        sql`create table parents("_id" uuid primary key default uuidv7(),"_createdAt" bigint default 1,value text); create table children("_id" uuid primary key default uuidv7(),"_createdAt" bigint default 1,value text,parent_id uuid)`,
      );
      await connection.db.execute(sql`insert into parents(value) values(${plain.hex})`);
      await connection.db.execute(sql`insert into children(value,parent_id) select value,"_id" from parents`);
      for (const mode of ["hex", "escape"] as const)
        await connection.transaction(async (db) => {
          await db.execute(mode === "hex" ? sql`set local bytea_output='hex'` : sql`set local bytea_output='escape'`);
          expect(await db.select({ value: extension.encrypt(plain, key128, ecb) }).from(schema.tables.parents)).toEqual(
            [{ value: cipher128 }],
          );
          const nested = await db.query.parents.findMany({
            columns: { value: true },
            extras: {
              ciphertext: (table) => extension.encrypt(sql<{ hex: string }>`decode(${table.value},'hex')`, key128, ecb),
            },
            with: {
              children: {
                columns: { value: true },
                extras: {
                  ciphertext: (table) =>
                    extension.encrypt(sql<{ hex: string }>`decode(${table.value},'hex')`, key128, ecb),
                  plain: extension.decrypt(cipher128, key128, ecb),
                  cbc: extension.encryptWithIv(cbcPlain, cbcKey, cbcIv, cbc),
                  cbcPlain: extension.decryptWithIv(cbcCipher, cbcKey, cbcIv, cbc),
                  missing: extension.decrypt(null, key128, ecb),
                },
              },
            },
          });
          expect(nested).toEqual([
            {
              value: plain.hex,
              ciphertext: cipher128,
              children: [{ value: plain.hex, ciphertext: cipher128, plain, cbc: cbcCipher, cbcPlain, missing: null }],
            },
          ]);
          expect(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, nested)))).toEqual(nested);
          expect(JSON.parse(JSON.stringify(nested))).toEqual(nested);
        });
    } finally {
      await connection.close();
    }
  });
});

test("real cipher algorithm, data-length and padding failures roll back prior invocation writes", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db.execute(installation);
      await connection.db.execute(sql`create table writes(value integer not null)`);
      const failures = v.picklist([
        "encrypt-algorithm",
        "decrypt-algorithm",
        "encrypt-iv-algorithm",
        "decrypt-iv-algorithm",
        "encrypt-length",
        "decrypt-length",
        "decrypt-padding",
        "decrypt-iv-padding",
      ]);
      let nativeFailure: unknown;
      const route = bindRpcDatabaseProcedure(
        createProjectProcedures(schema)
          .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
          .input(failures)
          .handler(async ({ context, input }) => {
            await context.db.execute(sql`insert into writes values(1)`);
            function expression() {
              switch (input) {
                case "encrypt-algorithm":
                  return extension.encrypt(plain, key128, "loom_invalid_cipher");
                case "decrypt-algorithm":
                  return extension.decrypt(cipher128, key128, "loom_invalid_cipher");
                case "encrypt-iv-algorithm":
                  return extension.encryptWithIv(cbcPlain, cbcKey, cbcIv, "loom_invalid_cipher");
                case "decrypt-iv-algorithm":
                  return extension.decryptWithIv(cbcCipher, cbcKey, cbcIv, "loom_invalid_cipher");
                case "encrypt-length":
                  return extension.encrypt({ hex: plain.hex + "00" }, key128, ecb);
                case "decrypt-length":
                  return extension.decrypt({ hex: "00" }, key128, ecb);
                case "decrypt-padding":
                  return extension.decrypt(cipher128, key128, "aes-ecb/pad:pkcs");
                case "decrypt-iv-padding":
                  return extension.decryptWithIv(
                    { hex: "a21a9c15231465964e3396d32095e67eb52bab05f556a581621dee1b85385789" },
                    { hex: "30313233343536" },
                    { hex: "61626364" },
                    "aes",
                  );
              }
            }
            try {
              await context.db.select({ value: expression() }).from(sql`(values(1)) fixture(id)`);
            } catch (cause) {
              nativeFailure = cause;
              throw cause;
            }
            return "done";
          }),
        {
          connection,
          replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
          authorize: async () => {},
        },
      );
      for (const input of failures.options) {
        nativeFailure = undefined;
        const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
        await assert.rejects(
          call(route, input, {
            context: { ...invocation, operation: "mutation", "effect/context": Context.make(Invocation, invocation) },
          }),
        );
        let cause = nativeFailure;
        const seen = new Set<Error>();
        const expectedCode = input.endsWith("algorithm") ? "22023" : "39000";
        while (
          cause instanceof Error &&
          !seen.has(cause) &&
          !v.is(v.object({ code: v.literal(expectedCode) }), cause)
        ) {
          seen.add(cause);
          cause = cause.cause;
        }
        expect(v.is(v.object({ code: v.literal(expectedCode) }), cause)).toBe(true);
        expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([]);
      }
    } finally {
      await connection.close();
    }
  });
});
