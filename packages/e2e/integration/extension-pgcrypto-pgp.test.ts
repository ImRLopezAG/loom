import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import { bytea, pgTable, text } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { pgcryptoNativeGroups, pgcryptoNativeProofCases, pgcryptoProofFamily } from "../fixtures/pgcrypto-proof-cases";
import { pgcryptoProofSchema } from "../fixtures/pgcrypto-semantic-proof";
import {
  encryptionOptions,
  faultyCipherArmor,
  faultyCipherPlainBytes,
  faultyCipherPlainText,
  fixtureBytes,
  fixturePassword,
  plainBytes,
  plainText,
  protectedKeyPassword,
  protectedSecretKeyArmor,
  publicKeyArmor,
  recipientArmor,
  secretKeyArmor,
  signingOnlyKeyArmor,
  withIndependentGpg,
  wrongSecretKeyArmor,
} from "../fixtures/pgcrypto-pgp";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import { withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { captureSnapshotRevisions, evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'crypto"proof',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const publicKey = fixtureBytes(publicKeyArmor);
const secretKey = fixtureBytes(secretKeyArmor);
const protectedKey = fixtureBytes(protectedSecretKeyArmor);
const recipient = fixtureBytes(recipientArmor);
const fixture = sql`(values (1)) fixture(id)`;
const signatures = [
  "pgp_sym_encrypt(text,text)",
  "pgp_sym_encrypt(text,text,text)",
  "pgp_sym_encrypt_bytea(bytea,text)",
  "pgp_sym_encrypt_bytea(bytea,text,text)",
  "pgp_sym_decrypt(bytea,text)",
  "pgp_sym_decrypt(bytea,text,text)",
  "pgp_sym_decrypt_bytea(bytea,text)",
  "pgp_sym_decrypt_bytea(bytea,text,text)",
  "pgp_pub_encrypt(text,bytea)",
  "pgp_pub_encrypt(text,bytea,text)",
  "pgp_pub_encrypt_bytea(bytea,bytea)",
  "pgp_pub_encrypt_bytea(bytea,bytea,text)",
  "pgp_pub_decrypt(bytea,bytea)",
  "pgp_pub_decrypt(bytea,bytea,text)",
  "pgp_pub_decrypt(bytea,bytea,text,text)",
  "pgp_pub_decrypt_bytea(bytea,bytea)",
  "pgp_pub_decrypt_bytea(bytea,bytea,text)",
  "pgp_pub_decrypt_bytea(bytea,bytea,text,text)",
] as const;
type FixtureArgument = string | { hex: string } | null;
type FixtureRoutine = (...args: FixtureArgument[]) => SQL<string | { hex: string } | null>;
// Dynamic native coverage is finite and validated at the callable boundary. Public API type proof is separate.
function canonical(signature: (typeof signatures)[number], args: FixtureArgument[]) {
  return v.parse(
    v.custom<FixtureRoutine>((input) => v.is(v.function(), input)),
    extension.sql.functions[signature],
  )(...args);
}
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native SQLSTATE arrives through Drizzle cause chains before RPC sanitizes it.
function nativeError(error: unknown): pg.DatabaseError {
  if (error instanceof pg.DatabaseError) return error;
  if (error instanceof Error && error.cause) return nativeError(error.cause);
  throw new Error("Expected native PostgreSQL error", { cause: error });
}
async function withPgp(
  operation: (connection: Awaited<ReturnType<typeof connectDatabase>>, url: string) => Promise<void>,
) {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      const version = await connection.db.execute(sql`show server_version_num`);
      expect(Number(version.rows[0]!.server_version_num)).toBeGreaterThanOrEqual(180006);
      expect(Number(version.rows[0]!.server_version_num)).toBeLessThan(190000);
      await connection.db.execute(
        sql`create schema "crypto""proof"; create extension pgcrypto with schema "crypto""proof" version '1.4'`,
      );
      expect(
        (
          await connection.db.execute(
            sql`select e.extversion,n.nspname from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto'`,
          )
        ).rows,
      ).toEqual([{ extversion: "1.4", nspname: 'crypto"proof' }]);
      await operation(connection, url);
    } finally {
      await connection.close();
    }
  });
}

const memberOf = (signature: (typeof signatures)[number]) =>
  `routine:$extension:pgcrypto.${signature.replace(/\b(text|bytea)\b/g, "pg_catalog.$1")}`;

extensionProofTest(
  pgcryptoNativeProofCases.pgp,
  async () => {
    await withPgp(async (connection, url) => {
      await observeExtensionProofDatabase(url, pgcryptoNativeProofCases.pgp.id, "pgcrypto");
      await withIndependentGpg(async (gpg) => {
        gpg(["--import"], Buffer.from(secretKeyArmor));
        const symmetricText = {
          hex: gpg(
            [
              "--passphrase",
              fixturePassword,
              "--cipher-algo",
              "AES256",
              "--compress-algo",
              "none",
              "--textmode",
              "--symmetric",
            ],
            Buffer.from(plainText),
          ).toString("hex"),
        };
        const symmetricBytes = {
          hex: gpg(
            ["--passphrase", fixturePassword, "--cipher-algo", "AES256", "--compress-algo", "none", "--symmetric"],
            Buffer.from(plainBytes.hex, "hex"),
          ).toString("hex"),
        };
        const seen = new Set<string>();
        for (const signature of signatures) {
          const encrypt = signature.includes("encrypt");
          const symmetric = signature.startsWith("pgp_sym");
          const bytes = signature.split("(")[0]!.endsWith("bytea");
          const count = signature.split("(")[1]!.slice(0, -1).split(",").length;
          const args: FixtureArgument[] = encrypt
            ? [bytes ? plainBytes : plainText, symmetric ? fixturePassword : publicKey]
            : [
                symmetric ? (bytes ? symmetricBytes : symmetricText) : recipient,
                symmetric ? fixturePassword : count > 2 ? protectedKey : secretKey,
              ];
          if (count > 2) args.push(encrypt ? encryptionOptions : symmetric ? "" : protectedKeyPassword);
          if (count === 4) args.push("");
          const expression = canonical(signature, args);
          const query = connection.db.select({ value: expression }).from(fixture);
          expect(query.toSQL().sql).toContain('"crypto""proof".');
          expect(query.toSQL().sql).not.toContain(fixturePassword);
          const [row] = await withExtensionSqlExecution({ check: (contract) => seen.add(contract.member) }, () =>
            query.execute(),
          );
          assert(row);
          await extensionProofWitness(
            {
              family: pgcryptoProofFamily,
              member: memberOf(signature),
              scenario: pgcryptoNativeGroups.pgp.scenario,
              schema: pgcryptoProofSchema,
            },
            async () => {
              if (encrypt) {
                const encoded = v.parse(v.object({ hex: v.string() }), row.value);
                expect(
                  gpg(["--passphrase", symmetric ? fixturePassword : "", "--decrypt"], Buffer.from(encoded.hex, "hex")),
                ).toEqual(Buffer.from(bytes ? plainBytes.hex : Buffer.from(plainText).toString("hex"), "hex"));
              } else {
                expect(row.value).toEqual(
                  bytes ? (symmetric ? plainBytes : { hex: Buffer.from(plainText).toString("hex") }) : plainText,
                );
              }
              for (let index = 0; index < args.length; index++) {
                const nullArgs = [...args];
                nullArgs[index] = null;
                expect(await connection.db.select({ value: canonical(signature, nullArgs) }).from(fixture)).toEqual([
                  { value: null },
                ]);
              }
            },
          );
        }
        expect(seen).toEqual(new Set(signatures.map(memberOf)));
        expect([...seen].sort()).toEqual([...pgcryptoNativeGroups.pgp.members].sort());
      });
    });
  },
  120_000,
);

test("text, bytea and protected-key password slots preserve native UTF8, high-byte and NUL semantics", async () => {
  await withPgp(async (connection) => {
    expect(
      await connection.db
        .select({
          utf8: extension.pgpSymDecrypt(
            extension.pgpSymEncrypt("café 🧶", fixturePassword, encryptionOptions),
            fixturePassword,
          ),
          utf8Bytes: extension.pgpSymDecryptBytea(extension.pgpSymEncrypt("café", fixturePassword), fixturePassword),
          bytes: extension.pgpSymDecryptBytea(
            extension.pgpSymEncryptBytea(plainBytes, fixturePassword, encryptionOptions),
            fixturePassword,
          ),
          publicBytes: extension.pgpPubDecryptBytea(
            extension.pgpPubEncryptBytea(plainBytes, publicKey, encryptionOptions),
            protectedKey,
            protectedKeyPassword,
            "",
          ),
          publicText: extension.pgpPubDecrypt(
            extension.pgpPubEncrypt("café", publicKey),
            protectedKey,
            protectedKeyPassword,
          ),
          publicUtf8: extension.pgpPubDecrypt(extension.pgpPubEncrypt("café", publicKey), secretKey),
        })
        .from(fixture),
    ).toEqual([
      {
        utf8: "café 🧶",
        utf8Bytes: { hex: "636166c3a9" },
        bytes: plainBytes,
        publicBytes: plainBytes,
        publicText: "café",
        publicUtf8: "café",
      },
    ]);
    await connection.db.execute(sql`create table pgp_text_writes(value text)`);
    const rejected = [
      {
        name: "symmetric-highbytes-nul",
        expression: extension.pgpSymDecrypt(extension.pgpSymEncryptBytea(plainBytes, fixturePassword), fixturePassword),
        message: "Not text data",
      },
      {
        name: "public-highbytes-nul",
        expression: extension.pgpPubDecrypt(extension.pgpPubEncryptBytea(plainBytes, publicKey), secretKey),
        message: "Not text data",
      },
      {
        name: "symmetric-binary-valid-utf8",
        expression: extension.pgpSymDecrypt(
          extension.pgpSymEncryptBytea({ hex: "636166c3a9" }, fixturePassword),
          fixturePassword,
        ),
        message: "Not text data",
      },
      {
        name: "public-binary-valid-utf8",
        expression: extension.pgpPubDecrypt(extension.pgpPubEncryptBytea({ hex: "636166c3a9" }, publicKey), secretKey),
        message: "Not text data",
      },
      {
        name: "options-in-password-slot",
        expression: extension.pgpPubDecrypt(recipient, protectedKey, "cipher-algo=aes256"),
        message: "Wrong key or corrupt data",
      },
    ];
    for (const { name, expression, message } of rejected) {
      await assert.rejects(
        connection.transaction(async (db) => {
          await db.execute(sql`insert into pgp_text_writes values(${name})`);
          await db.select({ value: expression }).from(fixture);
        }),
        (cause) => {
          const native = nativeError(cause);
          expect(native.code).toBe("39000");
          expect(native.message).toBe(message);
          return true;
        },
      );
      expect((await connection.db.execute(sql`select value from pgp_text_writes`)).rows).toEqual([]);
    }
  });
});

test("PGP native columns, selected aliases, named and ordinary preparation retain table dependencies", async () => {
  await withPgp(async (connection) => {
    const table = pgTable("pgp_inputs", { ciphertext: bytea(), key: bytea(), password: text() });
    await connection.db.execute(
      sql`create table pgp_inputs(ciphertext bytea,key bytea,password text); create table pgp_revisions(revision text); insert into pgp_revisions values ('1')`,
    );
    await connection.db.execute(
      sql`insert into pgp_inputs values(decode(${recipient.hex},'hex'),decode(${protectedKey.hex},'hex'),${protectedKeyPassword})`,
    );
    const selected = connection.db
      .select({
        ciphertext: sql<{ hex: string }>`${table.ciphertext}`.as("ciphertext"),
        key: sql<{ hex: string }>`${table.key}`.as("key"),
        password: sql<string>`${table.password}`.as("password"),
      })
      .from(table)
      .as("selected");
    const query = connection.db
      .select({
        value: extension.pgpPubDecrypt(selected.ciphertext, selected.key, selected.password, ""),
        bytes: extension.pgpPubDecryptBytea(table.ciphertext, table.key, table.password),
        alias: extension.pgpPubDecrypt(
          sql<{ hex: string }>`decode(${recipient.hex},'hex')`.as("inline_cipher"),
          secretKey,
        ),
      })
      .from(selected)
      .crossJoin(table);
    expect(query.toSQL().sql).toContain('("selected"."ciphertext")::"pg_catalog"."bytea"');
    expect(query.toSQL().sql).not.toContain('("inline_cipher")');
    const ordinary = query.prepare();
    const named = query.prepare("pgp_named_columns");
    for (const execute of [() => query.execute(), () => ordinary.execute(), () => named.execute()]) {
      const contracts: { member: string; relations: readonly string[] | undefined }[] = [];
      const rows = await withExtensionSqlExecution(
        { check: (contract, relations) => contracts.push({ member: contract.member, relations }) },
        execute,
      );
      expect(rows).toEqual([
        { value: plainText, bytes: { hex: Buffer.from(plainText).toString("hex") }, alias: plainText },
      ]);
      // Compilation checks intrinsic contracts before submission attaches the complete query relations.
      const submitted = contracts.filter((entry) => entry.relations !== undefined);
      expect(new Set(submitted.map((entry) => entry.member))).toEqual(
        new Set([
          "routine:$extension:pgcrypto.pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
          "routine:$extension:pgcrypto.pgp_pub_decrypt_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
          "routine:$extension:pgcrypto.pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea)",
        ]),
      );
      for (const entry of submitted) expect(entry.relations).toEqual(["public.pgp_inputs"]);
      const snapshot = await evaluateSnapshot(() =>
        connection.transaction(async (db) => {
          const rows = await execute();
          await captureSnapshotRevisions(db, async (reader) => {
            const [revision] = (await reader.execute(sql`select revision from pgp_revisions`)).rows;
            assert(revision);
            return { "public.pgp_inputs": v.parse(v.string(), revision.revision) };
          });
          return rows;
        }),
      );
      expect(snapshot.revisions).toEqual({ "public.pgp_inputs": "1" });
      await assert.rejects(
        evaluateSnapshot(() =>
          connection.transaction(async (db) => {
            const rows = await execute();
            await captureSnapshotRevisions(db, async () => ({}));
            return rows;
          }),
        ),
        /Automatic live query has an unknown table dependency: public\.pgp_inputs/,
      );
    }
    for (const expression of [
      extension.pgpSymEncrypt("x", fixturePassword),
      extension.pgpPubEncryptBytea(plainBytes, publicKey),
      extension.pgpSymDecrypt(extension.pgpSymEncrypt("x", fixturePassword), fixturePassword),
      extension.pgpPubDecrypt(extension.pgpPubEncrypt("x", publicKey), secretKey),
    ]) {
      const external = connection.db.select({ value: expression }).from(fixture);
      for (const execute of [
        () => external.execute(),
        () => external.prepare().execute(),
        () => external.prepare("pgp_live_reject").execute(),
      ])
        await assert.rejects(
          evaluateSnapshot(execute),
          /Automatic live query cannot observe external extension dependency/,
        );
    }
  });
});

test("PGP scalar and nested RQB bytea decoders retain JSON-safe wire values under both bytea output modes", async () => {
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
      await connection.db.execute(
        sql`create schema "crypto""proof"; create extension pgcrypto with schema "crypto""proof" version '1.4'; create table parents("_id" uuid primary key default uuidv7(),"_createdAt" bigint default 1,value text); create table children("_id" uuid primary key default uuidv7(),"_createdAt" bigint default 1,value text,parent_id uuid); insert into parents(value) values ('fixture'); insert into children(value,parent_id) select value,"_id" from parents`,
      );
      for (const mode of ["hex", "escape"] as const)
        await connection.transaction(async (db) => {
          await db.execute(mode === "hex" ? sql`set local bytea_output='hex'` : sql`set local bytea_output='escape'`);
          const rows = await db.query.parents.findMany({
            columns: { value: true },
            extras: { bytes: extension.pgpPubDecryptBytea(recipient, secretKey) },
            with: {
              children: {
                columns: { value: true },
                extras: {
                  bytes: extension.pgpSymDecryptBytea(
                    extension.pgpSymEncryptBytea(plainBytes, fixturePassword),
                    fixturePassword,
                  ),
                  missing: extension.pgpPubDecryptBytea(null, secretKey),
                },
              },
            },
          });
          expect(rows).toEqual([
            {
              value: "fixture",
              bytes: { hex: Buffer.from(plainText).toString("hex") },
              children: [{ value: "fixture", bytes: plainBytes, missing: null }],
            },
          ]);
          expect(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, rows)))).toEqual(rows);
          expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
          expect(
            await db.select({ value: extension.pgpPubDecryptBytea(recipient, secretKey) }).from(schema.tables.parents),
          ).toEqual([{ value: { hex: Buffer.from(plainText).toString("hex") } }]);
        });
    } finally {
      await connection.close();
    }
  });
});

test("native wrong password, key, corrupt message and option failures roll back earlier writes", async () => {
  await withPgp(async (connection) => {
    await connection.db.execute(sql`create table pgp_writes(value text)`);
    const cases = [
      {
        name: "sym-password",
        expression: extension.pgpSymDecrypt(extension.pgpSymEncrypt(plainText, fixturePassword), "wrong"),
        error: /Wrong key or corrupt data/,
      },
      {
        name: "protected-password",
        expression: extension.pgpPubDecrypt(recipient, protectedKey, "wrong"),
        error: /Wrong key or corrupt data/,
      },
      {
        name: "protected-omission",
        expression: extension.pgpPubDecrypt(recipient, protectedKey),
        error: /Need password/,
      },
      {
        name: "wrong-key",
        expression: extension.pgpPubDecrypt(recipient, fixtureBytes(wrongSecretKeyArmor)),
        error: /Wrong key/,
      },
      {
        name: "sign-only-public-key",
        expression: extension.pgpPubDecrypt(recipient, fixtureBytes(signingOnlyKeyArmor)),
        error: /No encryption key|Wrong key|Not a secret key/,
      },
      {
        name: "corrupt-sym",
        expression: extension.pgpSymDecrypt({ hex: "00ff" }, fixturePassword),
        error: /Wrong key or corrupt data|Corrupt data|Unexpected packet/,
      },
      {
        name: "corrupt-pub",
        expression: extension.pgpPubDecrypt({ hex: "00ff" }, secretKey),
        error: /Wrong key or corrupt data|Corrupt data|Unexpected packet/,
      },
      {
        name: "sym-options",
        expression: extension.pgpSymEncrypt(plainText, fixturePassword, "cipher-algo=loom_invalid"),
        error: /Unsupported cipher|Unknown cipher|Illegal argument|Unknown option/i,
      },
      {
        name: "pub-options",
        expression: extension.pgpPubEncryptBytea(plainBytes, publicKey, "cipher-algo=loom_invalid"),
        error: /Unsupported cipher|Unknown cipher|Illegal argument|Unknown option/i,
      },
    ];
    for (const { name, expression, error } of cases) {
      await assert.rejects(
        connection.transaction(async (db) => {
          await db.execute(sql`insert into pgp_writes values(${name})`);
          await db.select({ value: expression }).from(fixture);
        }),
        (cause) => {
          const native = nativeError(cause);
          expect(native.code).toBe("39000");
          expect(native.message).toMatch(error);
          return true;
        },
      );
      expect((await connection.db.execute(sql`select value from pgp_writes`)).rows).toEqual([]);
    }
  });
});

test("faulty published ciphertext follows backend Blowfish availability and explicit recovery options", async () => {
  await withPgp(async (connection) => {
    // Catch only the known BF initialization failure inside PostgreSQL so the executing lease remains usable.
    // This disposable fixture function is not added to the extension's owned member contract.
    await connection.db.execute(sql`
      create function "crypto""proof".loom_fixture_blowfish_probe()
      returns table(backend_pid integer, ciphertext_hex text, error_sqlstate text, error_message text)
      language plpgsql as $probe$
      begin
        backend_pid := pg_catalog.pg_backend_pid();
        begin
          ciphertext_hex := pg_catalog.encode("crypto""proof".encrypt(
            pg_catalog.decode('0000000000000000', 'hex'),
            pg_catalog.decode('0000000000000000', 'hex'), 'bf-ecb/pad:none'), 'hex');
        exception when sqlstate '39000' then
          get stacked diagnostics error_sqlstate = returned_sqlstate, error_message = message_text;
          if error_message <> 'encrypt error: Cipher cannot be initialized' then
            raise;
          end if;
          ciphertext_hex := null;
        end;
        return next;
      end;
      $probe$
    `);
    await connection.db.execute(sql`create table pgp_recovery_writes(value text)`);
    const ciphertext = fixtureBytes(faultyCipherArmor);
    const cases = [
      ["omitted", "direct-text", extension.pgpPubDecrypt(ciphertext, secretKey), faultyCipherPlainText],
      [
        "omitted",
        "canonical-text",
        extension.sql.functions["pgp_pub_decrypt(bytea,bytea)"](ciphertext, secretKey),
        faultyCipherPlainText,
      ],
      ["omitted", "direct-bytea", extension.pgpPubDecryptBytea(ciphertext, secretKey), faultyCipherPlainBytes],
      [
        "omitted",
        "canonical-bytea",
        extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea)"](ciphertext, secretKey),
        faultyCipherPlainBytes,
      ],
      [
        "0",
        "direct-text",
        extension.pgpPubDecrypt(ciphertext, secretKey, "", "ignore-cipher-failure=0"),
        faultyCipherPlainText,
      ],
      [
        "0",
        "canonical-text",
        extension.sql.functions["pgp_pub_decrypt(bytea,bytea,text,text)"](
          ciphertext,
          secretKey,
          "",
          "ignore-cipher-failure=0",
        ),
        faultyCipherPlainText,
      ],
      [
        "0",
        "direct-bytea",
        extension.pgpPubDecryptBytea(ciphertext, secretKey, "", "ignore-cipher-failure=0"),
        faultyCipherPlainBytes,
      ],
      [
        "0",
        "canonical-bytea",
        extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea,text,text)"](
          ciphertext,
          secretKey,
          "",
          "ignore-cipher-failure=0",
        ),
        faultyCipherPlainBytes,
      ],
      [
        "1",
        "direct-text",
        extension.pgpPubDecrypt(ciphertext, secretKey, "", "ignore-cipher-failure=1"),
        faultyCipherPlainText,
      ],
      [
        "1",
        "canonical-text",
        extension.sql.functions["pgp_pub_decrypt(bytea,bytea,text,text)"](
          ciphertext,
          secretKey,
          "",
          "ignore-cipher-failure=1",
        ),
        faultyCipherPlainText,
      ],
      [
        "1",
        "direct-bytea",
        extension.pgpPubDecryptBytea(ciphertext, secretKey, "", "ignore-cipher-failure=1"),
        faultyCipherPlainBytes,
      ],
      [
        "1",
        "canonical-bytea",
        extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea,text,text)"](
          ciphertext,
          secretKey,
          "",
          "ignore-cipher-failure=1",
        ),
        faultyCipherPlainBytes,
      ],
    ] as const;
    const committed: { value: string }[] = [];
    for (const [mode, name, expression, expected] of cases) {
      const value = `${mode}-${name}`;
      let blowfishAvailable: boolean | undefined;
      let backend: number | undefined;
      const operation = connection.transaction(async (db) => {
        const [{ pid }] = v.parse(
          v.tuple([v.object({ pid: v.number() })]),
          (await db.execute(sql`select pg_catalog.pg_backend_pid() as pid`)).rows,
        );
        backend = pid;
        const [probe] = v.parse(
          v.tuple([
            v.object({
              backend_pid: v.number(),
              ciphertext_hex: v.nullable(v.string()),
              error_sqlstate: v.nullable(v.string()),
              error_message: v.nullable(v.string()),
            }),
          ]),
          (await db.execute(sql`select * from "crypto""proof".loom_fixture_blowfish_probe()`)).rows,
        );
        blowfishAvailable = probe.ciphertext_hex !== null;
        // Independent published Blowfish ECB vector: upstream expected/blowfish.out at the pinned fixture commit.
        expect(probe).toEqual(
          blowfishAvailable
            ? {
                backend_pid: pid,
                ciphertext_hex: "4ef997456198dd78",
                error_sqlstate: null,
                error_message: null,
              }
            : {
                backend_pid: pid,
                ciphertext_hex: null,
                error_sqlstate: "39000",
                error_message: "encrypt error: Cipher cannot be initialized",
              },
        );
        expect((await db.execute(sql`select pg_catalog.pg_backend_pid() as pid`)).rows).toEqual([{ pid }]);
        await db.execute(sql`insert into pgp_recovery_writes values(${value})`);
        const rows = await db
          .select({ value: expression, pid: sql<number>`pg_catalog.pg_backend_pid()` })
          .from(fixture);
        expect((await db.execute(sql`select pg_catalog.pg_backend_pid() as pid`)).rows).toEqual([{ pid }]);
        return rows;
      });
      const outcome = await operation.then(
        (rows) => ({ status: "fulfilled" as const, rows }),
        (cause) => ({ status: "rejected" as const, cause }),
      );
      assert(blowfishAvailable !== undefined);
      assert(backend !== undefined);
      if (outcome.status === "fulfilled") {
        // Explicit recovery can strip this faulty encryption when OpenSSL lacks Blowfish; no authenticity claim.
        expect(blowfishAvailable).toBe(false);
        expect(mode).toBe("1");
        expect(outcome.rows).toEqual([{ value: expected, pid: backend }]);
        committed.push({ value });
      } else {
        if (mode === "1") expect(blowfishAvailable).toBe(true);
        const native = nativeError(outcome.cause);
        expect(native.code).toBe("39000");
        expect(native.message).toBe(
          blowfishAvailable ? "Wrong key or corrupt data" : "encrypt error: Cipher cannot be initialized",
        );
      }
      expect((await connection.db.execute(sql`select value from pgp_recovery_writes order by value`)).rows).toEqual(
        [...committed].sort((left, right) => left.value.localeCompare(right.value)),
      );
    }
  });
});

type NativeQueryCallback = (cause: Error | null, result?: pg.QueryResult) => void;
type NativeQueryConfig = string | pg.QueryConfig;
type NativeQueryDispatch = (config: NativeQueryConfig, values?: pg.QueryConfig["values"]) => Promise<pg.QueryResult>;
type NativeQueryArguments = [
  config: NativeQueryConfig,
  valuesOrCallback?: pg.QueryConfig["values"] | NativeQueryCallback,
  callback?: NativeQueryCallback,
];
const nativeCallback = v.custom<NativeQueryCallback>((input) => v.is(v.function(), input));
const nativeQueryConfig = v.custom<NativeQueryConfig>((input) =>
  v.is(v.union([v.string(), v.looseObject({ text: v.string() })]), input),
);
const nativeQueryArguments = v.tupleWithRest(
  [nativeQueryConfig, v.optional(v.union([v.array(v.unknown()), nativeCallback])), v.optional(nativeCallback)],
  v.never(),
);
// Fail before the underlying native client if a checked public member ever escapes old-backend admission.
function oldPgpSentry(pool: pg.Pool) {
  const originals = new Map<pg.PoolClient, pg.PoolClient["query"]>();
  let attempted = 0;
  const install = (client: pg.PoolClient) => {
    if (originals.has(client)) return;
    const restore = client.query.bind(client);
    const original: NativeQueryDispatch = restore;
    originals.set(client, restore);
    const observe = (...originalArgs: NativeQueryArguments) => {
      v.parse(nativeQueryArguments, originalArgs);
      const [config, valuesOrCallback, callback] = originalArgs;
      const done = v.is(nativeCallback, valuesOrCallback) ? valuesOrCallback : callback;
      const values = v.is(nativeCallback, valuesOrCallback) ? undefined : valuesOrCallback;
      const run = async () => {
        const text = v.is(v.string(), config) ? config : config.text;
        if (/"crypto""proof"\."pgp_(?:sym|pub)_(?:encrypt|decrypt)(?:_bytea)?"\(/.test(text)) {
          attempted++;
          throw new Error("OLD18 PROTECTIVE SENTRY: public PGP attempted native submission");
        }
        return original(config, values);
      };
      const pending = run();
      if (done) {
        void pending.then(
          (result) => done(null, result),
          (cause) => done(v.parse(v.instance(Error), cause)),
        );
        return;
      }
      return pending;
    };
    client.query = v.parse(
      v.custom<pg.PoolClient["query"]>((input) => v.is(v.function(), input)),
      observe,
    );
  };
  pool.on("acquire", install);
  return {
    attempted: () => attempted,
    dispose: () => {
      pool.off("acquire", install);
      for (const [client, original] of originals) client.query = original;
    },
  };
}

test("actual public eighteen PGP overloads refuse PostgreSQL180000 before any affected native submission", async () => {
  const address = process.env.LOOM_TEST_OLD_DATABASE_URL;
  assert(address, "Missing required PostgreSQL180000 public PGP fixture");
  const name = `loom_pgp_public_old_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(address);
  url.pathname = `/${name}`;
  const admin = new pg.Client({ connectionString: address });
  await admin.connect();
  try {
    await admin.query(`create database ${quoteIdentifier(name)}`);
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url.href,
      maxConnections: 1,
    });
    const sentry = oldPgpSentry(connection.pool);
    try {
      expect((await connection.db.execute(sql`show server_version_num`)).rows).toEqual([
        { server_version_num: "180000" },
      ]);
      await connection.db.execute(
        sql`create schema "crypto""proof"; create extension pgcrypto with schema "crypto""proof" version '1.4'; create table pgp_writes(value text)`,
      );
      for (const signature of signatures) {
        const types = signature.split("(")[1]!.slice(0, -1).split(",");
        const args = types.map((type) => (type === "bytea" ? { hex: "00" } : "fixture"));
        const query = connection.db.select({ value: canonical(signature, args) }).from(fixture);
        for (const execute of [
          () => query.execute(),
          () => query.prepare().execute(),
          () => query.prepare(`old_${signatures.indexOf(signature)}`).execute(),
        ])
          await assert.rejects(execute(), /Checked PGP requires PostgreSQL 18\.6/);
      }
      await assert.rejects(
        connection.transaction(async (db) => {
          await db.execute(sql`insert into pgp_writes values ('before refused public member')`);
          await db
            .select({
              value: extension.pgpSymDecrypt(extension.pgpSymEncrypt("fixture", fixturePassword), fixturePassword),
            })
            .from(fixture);
        }),
        /Checked PGP requires PostgreSQL 18\.6/,
      );
      expect((await connection.db.execute(sql`select value from pgp_writes`)).rows).toEqual([]);
      expect(sentry.attempted()).toBe(0);
    } finally {
      await connection.close();
      sentry.dispose();
    }
  } finally {
    await admin.query(`drop database if exists ${quoteIdentifier(name)} with (force)`);
    await admin.end();
  }
}, 120_000);
