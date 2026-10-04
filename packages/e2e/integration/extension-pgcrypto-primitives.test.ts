import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { call } from "@orpc/server";
import { Context } from "effect";
import { defineRelations, eq, sql, type SQL } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { pgcryptoNativeGroups, pgcryptoNativeProofCases, pgcryptoProofFamily } from "../fixtures/pgcrypto-proof-cases";
import { pgcryptoProofSchema } from "../fixtures/pgcrypto-semantic-proof";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import { checkedExtensionExpression, withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { captureInvocationGuard, connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";

// Public PostgreSQL regression vectors (PostgreSQL License), pinned at
// https://github.com/postgres/postgres/tree/37bbf5bba09c4244d74f152557e69f73f2b6690e/contrib/pgcrypto
// sql/crypt-md5.sql + expected/crypt-md5.out; sql/crypt-blowfish.sql + expected/crypt-blowfish.out.
// These public fixtures are not production passwords. Expected hashes are independent of this adapter.
const md5Salt = "$1$Szzz0yzz";
const md5Hash = "$1$Szzz0yzz$IYL49cd3t9bllsA7Jmz1M1";
const md5Empty = "$1$Szzz0yzz$To38XrR3BsbXQW2ZpfKjF1";
const bcryptSalt = "$2a$06$RQiOJ.3ELirrXwxIZY8q0O";
const bcryptHash = "$2a$06$RQiOJ.3ELirrXwxIZY8q0OR3CVJrAfda1z26CCHPnB6mmVZD8p0/C";
const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'crypto"proof',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const fixture = sql`(values (1)) fixture(id)`;
const install = sql`create schema "crypto""proof"; create extension pgcrypto with schema "crypto""proof" version '1.4'; grant usage on schema "crypto""proof" to public; create schema conflicting; create function conflicting.crypt(text,text) returns text language sql as 'select ''shadow''::text'; create function conflicting.gen_salt(text) returns text language sql as 'select ''shadow''::text'; create function conflicting.gen_salt(text,int4) returns text language sql as 'select ''shadow''::text'; create function conflicting.gen_random_bytes(int4) returns bytea language sql as 'select null::bytea'; create function conflicting.gen_random_uuid() returns uuid language sql as 'select ''00000000-0000-0000-0000-000000000000''::uuid'; create function conflicting.fips_mode() returns boolean language sql as 'select null::boolean'`;

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native errors arrive through Drizzle cause chains; inspect SQLSTATE before the public RPC boundary sanitizes it.
function nativeError(error: unknown): pg.DatabaseError {
  if (error instanceof pg.DatabaseError) return error;
  if (error instanceof Error && error.cause) return nativeError(error.cause);
  throw new Error("Expected a native PostgreSQL error", { cause: error });
}

const [cryptMember, genSaltMember, genSaltRoundsMember, randomBytesMember, randomUuidMember, fipsModeMember] =
  pgcryptoNativeGroups.primitives.members;
function witness(member: string, assertion: () => void | Promise<void>) {
  return extensionProofWitness(
    {
      family: pgcryptoProofFamily,
      member,
      scenario: pgcryptoNativeGroups.primitives.scenario,
      schema: pgcryptoProofSchema,
    },
    assertion,
  );
}

extensionProofTest(pgcryptoNativeProofCases.primitives, async () => {
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
      await connection.db.execute(install);
      expect(
        (
          await connection.db.execute(
            sql`select e.extversion, n.nspname from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto'`,
          )
        ).rows,
      ).toEqual([{ extversion: "1.4", nspname: 'crypto"proof' }]);
      await observeExtensionProofDatabase(url, pgcryptoNativeProofCases.primitives.id, "pgcrypto");
      // Establish the independent verifier's native $2a$ compatibility before using generated salts.
      expect(await Bun.password.verify("foox", bcryptHash)).toBe(true);
      expect(await Bun.password.verify("wrong", bcryptHash)).toBe(false);
      await connection.transaction(async (db) => {
        await db.execute(sql`set local search_path = conflicting, public`);
        const seen: string[] = [];
        const [roots] = await withExtensionSqlExecution({ check: (contract) => seen.push(contract.member) }, () =>
          db
            .select({
              crypt: extension.crypt("foox", md5Salt),
              salt: extension.genSalt("bf"),
              rounds: extension.sql.functions["gen_salt(text,int4)"]("bf", 4),
              bytes: extension.genRandomBytes(1),
              id: extension.sql.functions["gen_random_uuid()"](),
              mode: extension.fipsMode(),
            })
            .from(fixture)
            .execute(),
        );
        expect(new Set(seen)).toEqual(
          new Set([
            "routine:$extension:pgcrypto.crypt(pg_catalog.text,pg_catalog.text)",
            "routine:$extension:pgcrypto.gen_salt(pg_catalog.text)",
            "routine:$extension:pgcrypto.gen_salt(pg_catalog.text,pg_catalog.int4)",
            "routine:$extension:pgcrypto.gen_random_bytes(pg_catalog.int4)",
            "routine:$extension:pgcrypto.gen_random_uuid()",
            "routine:$extension:pgcrypto.fips_mode()",
          ]),
        );
        assert(roots);
        const observed = await db.execute(sql`select "crypto""proof".fips_mode() as mode`);
        assert(roots.salt !== null && roots.rounds !== null);
        const [hashes] = await db
          .select({
            generated: extension.crypt("foox", roots.salt),
            counted: extension.crypt("foox", roots.rounds),
            pinned: extension.sql.functions["crypt(text,text)"]("foox", bcryptSalt),
            empty: extension.crypt("", md5Salt),
          })
          .from(fixture);
        assert(hashes?.generated && hashes.counted);
        const { generated, counted } = hashes;
        async function verifies(hash: string) {
          expect(await Bun.password.verify("foox", hash)).toBe(true);
          expect(await Bun.password.verify("wrong", hash)).toBe(false);
        }
        // Native bcrypt truncates at 72 bytes; Bun's long-password preprocessing is not its oracle.
        const boundary = await db
          .select({
            at72: extension.crypt("a".repeat(72), bcryptSalt),
            at73: extension.crypt(`${"a".repeat(72)}b`, bcryptSalt),
            different72: extension.crypt(`${"a".repeat(71)}b`, bcryptSalt),
          })
          .from(fixture);
        const [nulls] = await db
          .select({
            password: extension.crypt(null, md5Salt),
            salt: extension.crypt("foox", null),
            type: extension.genSalt(null),
            countedType: extension.genSalt(null, 4),
            rounds: extension.genSalt("bf", null),
            bytes: extension.genRandomBytes(null),
          })
          .from(fixture);
        assert(nulls);
        const [maximum] = await db
          .select({ bytes: extension.sql.functions["gen_random_bytes(int4)"](1024) })
          .from(fixture);
        await witness(cryptMember!, () => {
          expect([roots.crypt, hashes.pinned, hashes.empty]).toEqual([md5Hash, bcryptHash, md5Empty]);
          expect(boundary[0]!.at73).toBe(boundary[0]!.at72);
          expect(boundary[0]!.different72).not.toBe(boundary[0]!.at72);
          expect([nulls.password, nulls.salt]).toEqual([null, null]);
        });
        await witness(genSaltMember!, async () => {
          expect(roots.salt).toMatch(/^\$2a\$06\$[./A-Za-z0-9]{22}$/);
          await verifies(generated);
          expect(nulls.type).toBeNull();
        });
        await witness(genSaltRoundsMember!, async () => {
          expect(roots.rounds).toMatch(/^\$2a\$04\$[./A-Za-z0-9]{22}$/);
          await verifies(counted);
          expect([nulls.countedType, nulls.rounds]).toEqual([null, null]);
        });
        await witness(randomBytesMember!, () => {
          expect(roots.bytes?.hex).toMatch(/^[a-f0-9]{2}$/);
          expect(maximum!.bytes?.hex).toMatch(/^[a-f0-9]{2048}$/);
          expect(nulls.bytes).toBeNull();
        });
        await witness(randomUuidMember!, () => {
          expect(roots.id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
        });
        await witness(fipsModeMember!, () => {
          assert.equal(roots.mode, observed.rows[0]!.mode);
          assert.equal(v.parse(v.boolean(), roots.mode), roots.mode);
        });
        expect(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, roots)))).toEqual(roots);
      });
    } finally {
      await connection.close();
    }
  });
});

test("all native salt schemes preserve case, defaults, adaptive low counts and accepted nonadaptive counts", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(install);
      const schemes = [
        { type: "des", rounds: 25, salt: /^[./A-Za-z0-9]{2}$/, hash: /^[./A-Za-z0-9]{13}$/ },
        {
          type: "md5",
          rounds: 1000,
          salt: /^\$1\$[./A-Za-z0-9]{1,8}$/,
          hash: /^\$1\$[./A-Za-z0-9]{1,8}\$[./A-Za-z0-9]{22}$/,
        },
        { type: "xdes", rounds: 1, salt: /^_[./A-Za-z0-9]{8}$/, hash: /^_[./A-Za-z0-9]{19}$/ },
        { type: "bf", rounds: 4, salt: /^\$2a\$\d{2}\$[./A-Za-z0-9]{22}$/, hash: /^\$2a\$\d{2}\$[./A-Za-z0-9]{53}$/ },
        {
          type: "sha256crypt",
          rounds: 1000,
          salt: /^\$5\$rounds=\d+\$[./A-Za-z0-9]{16}$/,
          hash: /^\$5\$(?:rounds=\d+\$)?[./A-Za-z0-9]{16}\$[./A-Za-z0-9]{43}$/,
        },
        {
          type: "sha512crypt",
          rounds: 1000,
          salt: /^\$6\$rounds=\d+\$[./A-Za-z0-9]{16}$/,
          hash: /^\$6\$(?:rounds=\d+\$)?[./A-Za-z0-9]{16}\$[./A-Za-z0-9]{86}$/,
        },
      ];
      for (const scheme of schemes) {
        const [salts] = await connection.db
          .select({
            omitted: extension.genSalt(scheme.type.toUpperCase()),
            zero: extension.genSalt(scheme.type, 0),
            counted: extension.genSalt(scheme.type, scheme.rounds),
          })
          .from(fixture);
        assert(salts);
        for (const salt of [salts.omitted, salts.zero, salts.counted]) {
          assert(salt !== null);
          expect(salt).toMatch(scheme.salt);
          const [hashed] = await connection.db.select({ value: extension.crypt("foox", salt) }).from(fixture);
          assert(hashed?.value);
          expect(hashed.value).toMatch(scheme.hash);
          const [rechecked] = await connection.db
            .select({ correct: extension.crypt("foox", hashed.value), wrong: extension.crypt("wrong", hashed.value) })
            .from(fixture);
          expect(rechecked!.correct).toBe(hashed.value);
          expect(rechecked!.wrong).not.toBe(hashed.value);
        }
      }
    } finally {
      await connection.close();
    }
  });
});

test("random bytes and primitive aliases compose with integer/text storage, prepared predicates and nested bytea modes", async () => {
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
    const inputs = pgTable("primitive_inputs", { password: text(), salt: text(), type: text(), count: integer() });
    try {
      await connection.db.execute(install);
      await connection.db.execute(
        sql`create table primitive_inputs(password text, salt text, type text, count int4); create table parents("_id" uuid primary key default uuidv7(), "_createdAt" bigint default 1, value text); create table children("_id" uuid primary key default uuidv7(), "_createdAt" bigint default 1, value text, parent_id uuid); insert into parents(value) values ('foox'); insert into children(value,parent_id) select 'foox', "_id" from parents`,
      );
      await connection.db.execute(sql`insert into primitive_inputs values ('foox', ${md5Salt}, 'bf', 4)`);
      const selected = connection.db
        .select({ password: inputs.password, salt: inputs.salt, type: inputs.type, count: inputs.count })
        .from(inputs)
        .as("selected");
      const aliases = connection.db
        .select({
          crypt: extension.crypt(selected.password, selected.salt),
          salt: extension.genSalt(selected.type, selected.count),
          bytes: extension.genRandomBytes(selected.count),
          raw: extension.crypt(
            sql<string>`'foox'`.as("unselected_password"),
            sql<string>`${md5Salt}`.as("unselected_salt"),
          ),
        })
        .from(selected);
      expect(aliases.toSQL().sql).toContain('("selected"."count")::"pg_catalog"."int4"');
      expect(aliases.toSQL().sql).not.toContain('("unselected_password")');
      const rows = await aliases.prepare().execute();
      expect(rows[0]!.crypt).toBe(md5Hash);
      expect(rows[0]!.raw).toBe(md5Hash);
      expect(rows[0]!.salt).toMatch(/^\$2a\$04\$[./A-Za-z0-9]{22}$/);
      expect(rows[0]!.bytes?.hex).toHaveLength(8);
      expect(
        await connection.db
          .select({ password: inputs.password })
          .from(inputs)
          .where(eq(extension.crypt(inputs.password, inputs.salt), md5Hash))
          .prepare()
          .execute(),
      ).toEqual([{ password: "foox" }]);
      for (const mode of ["hex", "escape"] as const)
        await connection.transaction(async (db) => {
          await db.execute(mode === "hex" ? sql`set local bytea_output='hex'` : sql`set local bytea_output='escape'`);
          const random = extension.genRandomBytes(1);
          const scalar = await db.select({ value: random }).from(fixture).prepare().execute();
          expect(scalar[0]!.value?.hex).toMatch(/^[a-f0-9]{2}$/);
          // Result parameters use the shared checked binary encoder on the actual executing backend.
          const predicates = await db
            .select({ value: random })
            .from(fixture)
            .where(eq(random, { hex: "00" }))
            .prepare()
            .execute();
          for (const row of predicates) expect(row.value?.hex).toMatch(/^[a-f0-9]{2}$/);
          const nested = await db.query.parents.findMany({
            columns: { value: true },
            extras: { bytes: extension.genRandomBytes(1) },
            with: {
              children: {
                columns: { value: true },
                extras: { bytes: extension.genRandomBytes(4), missing: extension.genRandomBytes(null) },
              },
            },
          });
          expect(nested).toHaveLength(1);
          expect(nested[0]!.bytes?.hex).toMatch(/^[a-f0-9]{2}$/);
          expect(nested[0]!.children[0]!.bytes?.hex).toMatch(/^[a-f0-9]{8}$/);
          expect(nested[0]!.children[0]!.missing).toBeNull();
          expect(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, nested)))).toEqual(nested);
          expect(JSON.parse(JSON.stringify(nested))).toEqual(nested);
        });
    } finally {
      await connection.close();
    }
  });
});

test("native invalid salt, rounds and random counts abort and roll back public invocation writes", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db.execute(install);
      await connection.db.execute(sql`create table writes(value int4 not null)`);
      const cases = [
        "crypt",
        "type",
        "counted-type",
        "bf-low",
        "bf-high",
        "negative",
        "xdes-even",
        "xdes-high",
        "sha-low",
        "sha-high",
        "des-invalid",
        "md5-invalid",
        "zero-bytes",
        "negative-bytes",
        "large-bytes",
        "caught",
      ] as const;
      // Independently characterized through native pg.Client on PG18.6/pgcrypto1.4,
      // including the subsequent aborted statement and rollback for every input.
      const nativeSqlstates = {
        crypt: "22023",
        type: "22023",
        "counted-type": "22023",
        "bf-low": "22023",
        "bf-high": "22023",
        negative: "22023",
        "xdes-even": "22023",
        "xdes-high": "22023",
        "sha-low": "22023",
        "sha-high": "22023",
        "des-invalid": "22023",
        "md5-invalid": "22023",
        "zero-bytes": "39000",
        "negative-bytes": "39000",
        "large-bytes": "39000",
        caught: "25P02",
      };
      function invalidPrimitive(input: (typeof cases)[number]) {
        switch (input) {
          case "crypt":
            return extension.crypt("foox", "$2a$99$invalid");
          case "type":
            return extension.genSalt("loom_invalid_algorithm");
          case "counted-type":
            return extension.genSalt("loom_invalid_algorithm", 4);
          case "bf-low":
            return extension.genSalt("bf", 3);
          case "bf-high":
            return extension.genSalt("bf", 32);
          case "negative":
            return extension.genSalt("bf", -1);
          case "xdes-even":
            return extension.genSalt("xdes", 2);
          case "xdes-high":
            return extension.genSalt("xdes", 16777216);
          case "sha-low":
            return extension.genSalt("sha256crypt", 999);
          case "sha-high":
            return extension.genSalt("sha512crypt", 1000000000);
          case "des-invalid":
            return extension.genSalt("des", 1);
          case "md5-invalid":
            return extension.genSalt("md5", 1);
          case "zero-bytes":
            return extension.genRandomBytes(0);
          case "negative-bytes":
            return extension.genRandomBytes(-1);
          case "large-bytes":
          case "caught":
            return extension.genRandomBytes(1025);
        }
      }
      const route = bindRpcDatabaseProcedure(
        createProjectProcedures(schema)
          .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
          .input(v.picklist(cases))
          .handler(async ({ context, input }) => {
            await context.db.execute(sql`insert into writes values (1)`);
            const invalid = invalidPrimitive(input);
            if (input === "caught") {
              try {
                await context.db.select({ value: invalid }).from(fixture);
              } catch (error) {
                expect(nativeError(error).code).toBe("39000");
              }
              await assert.rejects(context.db.execute(sql`select 1`), (error) => {
                expect(nativeError(error).code).toBe("25P02");
                return true;
              });
              // Let PostgreSQL's aborted transaction error escape; catching it must not commit preceding writes.
              await context.db.execute(sql`select 1`);
            } else await context.db.select({ value: invalid }).from(fixture);
            return "done";
          }),
        {
          connection,
          replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
          authorize: async () => {},
        },
      );
      for (const input of cases) {
        // Observe the native error before the public RPC boundary deliberately sanitizes its cause.
        await assert.rejects(
          connection.transaction(async (db) => {
            await db.execute(sql`insert into writes values (1)`);
            const invalid = invalidPrimitive(input);
            if (input === "caught") {
              await assert.rejects(db.select({ value: invalid }).from(fixture).execute(), (error) => {
                expect(nativeError(error).code).toBe("39000");
                return true;
              });
              // A real subsequent native statement witnesses PostgreSQL's aborted transaction.
              await db.execute(sql`select 1`);
            } else await db.select({ value: invalid }).from(fixture);
          }),
          (error) => {
            expect(nativeError(error).code).toBe(nativeSqlstates[input]);
            return true;
          },
        );
        expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([]);
        const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
        await assert.rejects(
          call(route, input, {
            context: { ...invocation, operation: "mutation", "effect/context": Context.make(Invocation, invocation) },
          }),
          { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
        );
        expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([]);
      }
    } finally {
      await connection.close();
    }
  });
});

test("real backend builtin crypto on/off/fips policy, SET permissions and transaction-local reset stay distinct", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    // Own one pool backend, verify its PID across each commit and rollback, and prepare inside its transaction.
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
      maxConnections: 1,
    });
    try {
      await connection.db.execute(install);
      const observe = sql`select pg_backend_pid() as pid, current_setting('pgcrypto.builtin_crypto_enabled') as setting, "crypto""proof".fips_mode() as mode, current_user as role, pg_catalog.has_parameter_privilege(current_user, 'pgcrypto.builtin_crypto_enabled', 'SET') as can_set`;
      await connection.db.execute(sql`select "crypto""proof".fips_mode()`);
      const [original] = (await connection.db.execute(observe)).rows;
      assert(original);
      assert.equal(v.parse(v.boolean(), original.mode), original.mode);
      const canSet = v.parse(v.boolean(), original.can_set);
      assert.equal(canSet, original.can_set);
      if (!canSet) {
        const refusedModes: { mode: string; sqlstate: string }[] = [];
        for (const attempt of [
          { mode: "on", statement: sql`set local pgcrypto.builtin_crypto_enabled='on'` },
          { mode: "off", statement: sql`set local pgcrypto.builtin_crypto_enabled='off'` },
          { mode: "fips", statement: sql`set local pgcrypto.builtin_crypto_enabled='fips'` },
        ]) {
          await assert.rejects(
            connection.transaction(async (db) => {
              expect((await db.execute(observe)).rows).toEqual([original]);
              const [row] = await db
                .select({ value: extension.crypt("foox", md5Salt), mode: extension.fipsMode() })
                .from(fixture)
                .prepare()
                .execute();
              expect(row!.value).toBe(md5Hash);
              assert.equal(row!.mode, original.mode);
              await db.execute(attempt.statement);
            }),
            (error) => {
              const native = nativeError(error);
              expect(native.code).toBe("42501");
              assert(native.code);
              expect(native.message).toContain("pgcrypto.builtin_crypto_enabled");
              refusedModes.push({ mode: attempt.mode, sqlstate: native.code });
              return true;
            },
          );
          expect((await connection.db.execute(observe)).rows).toEqual([original]);
          const [row] = await connection.db
            .select({ value: extension.crypt("foox", md5Salt), mode: extension.fipsMode() })
            .from(fixture);
          expect(row!.value).toBe(md5Hash);
          assert.equal(row!.mode, original.mode);
        }
        expect(refusedModes).toEqual([
          { mode: "on", sqlstate: "42501" },
          { mode: "off", sqlstate: "42501" },
          { mode: "fips", sqlstate: "42501" },
        ]);
        console.info("pgcrypto primitive native mode evidence", {
          original: original.setting,
          processFips: original.mode,
          hasParameterSetPrivilege: canSet,
          refusedModes,
          modeChanges: "UNAVAILABLE: current role lacks parameter SET privilege",
          trueProcessFipsBranch: "PENDING: authorized true-process-FIPS mode policy unavailable on current role",
        });
        return;
      }
      const builtins = [extension.crypt("foox", md5Salt), extension.genSalt("bf"), extension.genSalt("bf", 4)];
      await connection.transaction(async (db) => {
        await db.execute(sql`set local pgcrypto.builtin_crypto_enabled='on'`);
        const [current] = (await db.execute(observe)).rows;
        expect(current!.pid).toBe(original.pid);
        expect(current!.setting).toBe("on");
        expect(current!.mode).toBe(original.mode);
        for (const expression of builtins)
          expect((await db.select({ value: expression }).from(fixture).prepare().execute())[0]!.value).not.toBeNull();
      });
      expect((await connection.db.execute(observe)).rows).toEqual([original]);
      const modeErrors: string[] = [];
      for (const expression of builtins) {
        await assert.rejects(
          connection.transaction(async (db) => {
            await db.execute(sql`set local pgcrypto.builtin_crypto_enabled='off'`);
            const [current] = (await db.execute(observe)).rows;
            expect(current!.setting).toBe("off");
            expect(current!.mode).toBe(original.mode);
            expect(current!.pid).toBe(original.pid);
            await db.select({ value: expression }).from(fixture).prepare().execute();
          }),
          (error) => {
            const native = nativeError(error);
            assert(native.code);
            modeErrors.push(native.code);
            expect(native.message).toContain("disabled");
            return true;
          },
        );
        expect((await connection.db.execute(observe)).rows).toEqual([original]);
      }
      expect(modeErrors).toHaveLength(3);
      for (const expression of builtins) {
        const run = () =>
          connection.transaction(async (db) => {
            await db.execute(sql`set local pgcrypto.builtin_crypto_enabled='fips'`);
            const [current] = (await db.execute(observe)).rows;
            expect(current!.setting).toBe("fips");
            expect(current!.mode).toBe(original.mode);
            expect(current!.pid).toBe(original.pid);
            const [row] = await db
              .select({ value: expression, mode: extension.fipsMode() })
              .from(fixture)
              .prepare()
              .execute();
            expect(row!.value).not.toBeNull();
            assert.equal(row!.mode, original.mode);
          });
        if (original.mode === true)
          await assert.rejects(run(), (error) => {
            expect(nativeError(error).message).toContain("FIPS");
            return true;
          });
        else await run();
        expect((await connection.db.execute(observe)).rows).toEqual([original]);
      }
      // pg_read_all_data is an existing unprivileged role, requiring no global role creation.
      await assert.rejects(
        connection.transaction(async (db) => {
          await db.execute(sql`set local role pg_read_all_data`);
          expect((await db.execute(sql`select current_user as role`)).rows).toEqual([{ role: "pg_read_all_data" }]);
          expect((await db.select({ value: extension.crypt("foox", md5Salt) }).from(fixture))[0]!.value).toBe(md5Hash);
          await db.execute(sql`set local pgcrypto.builtin_crypto_enabled='off'`);
        }),
        (error) => {
          expect(nativeError(error).code).toBe("42501");
          expect(nativeError(error).message).toContain("pgcrypto.builtin_crypto_enabled");
          return true;
        },
      );
      expect((await connection.db.execute(observe)).rows).toEqual([original]);
      console.info("pgcrypto primitive native mode evidence", {
        original: original.setting,
        processFips: original.mode,
        hasParameterSetPrivilege: canSet,
        modeChanges: "executed on authorized role",
        disabledSqlstates: modeErrors,
        restrictedSetSqlstate: "42501",
        trueProcessFipsBranch:
          original.mode === true ? "executed" : "PENDING: authorized true-process-FIPS backend unavailable",
      });
    } finally {
      await connection.close();
    }
  });
});

test("all six external primitive expressions reject ordinary and prepared automatic live subscriptions", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(install);
      for (const expression of [
        extension.crypt("foox", md5Salt),
        extension.genSalt("bf"),
        extension.genSalt("bf", 4),
        extension.genRandomBytes(1),
        extension.genRandomUuid(),
        extension.fipsMode(),
        extension.crypt("foox", extension.genSalt("bf", 4).as("salt")),
      ]) {
        const query = connection.db.select({ value: expression.as("value") }).from(fixture);
        const prepared = query.prepare();
        expect(await prepared.execute()).toHaveLength(1);
        await assert.rejects(
          evaluateSnapshot(() => query.execute()),
          /Automatic live query cannot observe external extension dependency/,
        );
        await assert.rejects(
          evaluateSnapshot(() => prepared.execute()),
          /Automatic live query cannot observe external extension dependency/,
        );
      }
      const nested = connection.db
        .select({ salt: extension.genSalt("bf", 4).as("salt") })
        .from(fixture)
        .as("selected");
      const query = connection.db.select({ value: extension.crypt("foox", nested.salt) }).from(nested);
      const prepared = query.prepare();
      expect(await prepared.execute()).toHaveLength(1);
      await assert.rejects(
        evaluateSnapshot(() => query.execute()),
        /Automatic live query cannot observe external extension dependency/,
      );
      await assert.rejects(
        evaluateSnapshot(() => prepared.execute()),
        /Automatic live query cannot observe external extension dependency/,
      );
      await assert.rejects(
        evaluateSnapshot(async () => {
          try {
            await prepared.execute();
          } catch {}
          return "caught";
        }),
        /Automatic live query cannot observe external extension dependency/,
      );
    } finally {
      await connection.close();
    }
  });
});

test("primitive operands preserve invocation identity, read policy and retained execution leases", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    let retained: SQL<{ hex: string } | null> | undefined;
    let retainedPrepared: { execute(): Promise<{ value: { hex: string } | null }[]> } | undefined;
    const identity = { issuer: "fixture", subject: "primitive-user", tenantId: "primitive-tenant" };
    try {
      await connection.db.execute(install);
      await connection.db.execute(sql`create table policy_writes(value int4 not null)`);
      const route = bindRpcDatabaseProcedure(
        createProjectProcedures(schema)
          .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
          .input(v.picklist(["create", "reuse", "write"]))
          .handler(async ({ context, input }) => {
            expect(context.identity).toEqual(identity);
            expect(
              (await context.db.execute(sql`select current_setting('kello.identity')::jsonb as identity`)).rows,
            ).toEqual([{ identity }]);
            if (input === "write") await context.db.execute(sql`insert into policy_writes values (1)`);
            if (input === "reuse") {
              assert(retained);
              return context.db.select({ value: retained }).from(fixture);
            }
            const owned = checkedExtensionExpression(
              sql<number>`1`,
              int4Codec,
              [],
              captureInvocationGuard(),
              "fixture:invocation-count",
            );
            retained = extension.genRandomBytes(owned.as("count"));
            retainedPrepared = context.db.select({ value: retained }).from(fixture).prepare();
            return retainedPrepared.execute();
          }),
        {
          connection,
          replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
          authorize: async () => {},
        },
      );
      const invoke = (input: "create" | "reuse" | "write") => {
        const invocation = { identity, requestId: crypto.randomUUID(), signal: new AbortController().signal };
        return call(route, input, {
          context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
        });
      };
      expect((await invoke("create"))[0]!.value?.hex).toMatch(/^[a-f0-9]{2}$/);
      assert(retained && retainedPrepared);
      const escaped = retained;
      await assert.rejects(async () => connection.db.select({ value: escaped }).from(fixture).execute(), /invocation/i);
      await assert.rejects(retainedPrepared.execute(), /invocation/i);
      await assert.rejects(invoke("reuse"), { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
      await assert.rejects(invoke("write"), { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
      expect((await connection.db.execute(sql`select * from policy_writes`)).rows).toEqual([]);
    } finally {
      await connection.close();
    }
  });
});
