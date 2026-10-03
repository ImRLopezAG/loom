import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createCitext_1_8, citext } from "../../../apps/loom/src/core/extensions/adapters/citext";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import { binaryCodec, textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createSqlFunction, createSqlOperator } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";

const caseText = createCitext_1_8({
  name: "citext",
  version: "1.8",
  schema: "binding_extensions",
  apiSupport: { status: "verified", digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3" },
});
const crypto = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: "binding_extensions",
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const lower = createSqlFunction({
  schema: "pg_catalog",
  name: "lower",
  member: "fixture:binding.lower",
  arguments: [textCodec] as const,
  result: textCodec,
  dependencies: [],
  authority: "query",
  observability: "tables",
});
const concat = createSqlOperator({
  schema: "pg_catalog",
  name: "||",
  member: "fixture:binding.concat",
  left: textCodec,
  right: textCodec,
  result: textCodec,
  dependencies: [],
  authority: "query",
  observability: "tables",
});
const schema = defineSchema(() => ({ entries: { value: caseText.field() } }), { namespace: "public" });
const relations = defineRelations(schema.tables);
type Connection = Awaited<ReturnType<typeof connectDatabase<typeof relations>>>;

async function fixture(work: (connection: Connection, observer: pg.Client) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const observer = new pg.Client({ connectionString: url });
    await observer.connect();
    try {
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      try {
        await observer.query(
          "create schema binding_extensions; create extension citext with schema binding_extensions version '1.8'; create extension pgcrypto with schema binding_extensions version '1.4'; create table writes(value text not null); create table entries(\"_id\" uuid primary key default uuidv7(), \"_createdAt\" bigint default 1, value binding_extensions.citext)",
        );
        await work(connection, observer);
      } finally {
        await connection.close();
      }
    } finally {
      await observer.end();
    }
  });
}

test("caught eager extension binding failures roll back writes despite a usable PostgreSQL transaction", async () => {
  await fixture(async (connection, observer) => {
    const modes = [
      "function",
      "operator",
      "pgcrypto-text",
      "pgcrypto-bytea",
      "citext-cast",
      "field-literal",
      "field-prepared",
    ] as const;
    const outcomes = [];
    for (const mode of modes) {
      await observer.query("delete from writes; delete from entries");
      let firstCause: unknown;
      let outerCause: unknown;
      let caught = false;
      let serverUsable = false;
      let rejected = false;
      try {
        await connection.transaction(async (db) => {
          await db.execute(sql`insert into writes values (${mode})`);
          // A native placeholder compiles successfully and reaches the column encoder only at execution.
          const prepared =
            mode === "field-prepared"
              ? db
                  .insert(schema.tables.entries)
                  .values({ value: sql.placeholder("value") })
                  .prepare()
              : undefined;
          const failBinding = async (second: boolean) => {
            switch (mode) {
              case "function":
                // SAFETY: this negative fixture passes a JavaScript number to prove the function's text encoder rejects it.
                lower((second ? 456 : 123) as never);
                break;
              case "operator":
                if (second) {
                  // SAFETY: this negative fixture bypasses typing only to exercise the operator's right text encoder.
                  concat("valid", 456 as never);
                } else {
                  // SAFETY: this negative fixture bypasses typing only to exercise the operator's left text encoder.
                  concat(123 as never, "valid");
                }
                break;
              case "pgcrypto-text":
                // SAFETY: this negative fixture supplies malformed JavaScript input to the actual Pgcrypto text binding.
                crypto.digest((second ? 456 : 123) as never, "sha256", "text");
                break;
              case "pgcrypto-bytea":
                crypto.digest({ hex: second ? "zz" : "FF" }, "sha256", "bytea");
                break;
              case "citext-cast":
                caseText.toText(second ? "c\0d" : "a\0b");
                break;
              case "field-literal":
                // SAFETY: this negative fixture bypasses Citext branding to reach native column encoding with a NUL string.
                await db.insert(schema.tables.entries).values({ value: (second ? "c\0d" : "a\0b") as never });
                break;
              case "field-prepared":
                assert.ok(prepared);
                await prepared.execute({ value: second ? "c\0d" : "a\0b" });
                break;
            }
          };
          await assert.rejects(
            () => failBinding(false),
            (cause) => {
              firstCause = cause;
              return true;
            },
          );
          await assert.rejects(
            () => failBinding(true),
            (cause) => cause !== firstCause,
          );
          caught = true;
          // Both failures happened before SQL was sent; a server-side error would abort this transaction.
          assert.deepEqual((await db.execute(sql`select 1 as value`)).rows, [{ value: 1 }]);
          await db.execute(sql`insert into writes values (${`${mode}-after`})`);
          serverUsable = true;
          return "caught";
        });
      } catch (cause) {
        rejected = true;
        outerCause = cause;
      }
      outcomes.push({
        mode,
        caught,
        serverUsable,
        rejected,
        firstCausePreserved: rejected && outerCause === firstCause,
        writes: (await observer.query("select value from writes order by value")).rows,
      });
      // A new invocation must not inherit the failed invocation's sticky cause.
      await observer.query("delete from writes");
      await connection.transaction(async (db) => {
        await db.execute(sql`insert into writes values (${`${mode}-fresh`})`);
        await db.insert(schema.tables.entries).values({ value: citext("Valid") });
        expect(
          await db
            .select({ value: lower("VALID"), joined: concat("a", "b"), cast: caseText.toText("Valid") })
            .from(schema.tables.entries),
        ).toEqual([{ value: "valid", joined: "ab", cast: "Valid" }]);
      });
      expect((await observer.query("select value from writes")).rows).toEqual([{ value: `${mode}-fresh` }]);
    }
    // Aggregate all seven distinct seams so the unguarded baseline reports each committed write.
    expect(outcomes).toEqual(
      modes.map((mode) => ({
        mode,
        caught: true,
        serverUsable: true,
        rejected: true,
        firstCausePreserved: true,
        writes: [],
      })),
    );
  });
});

test("standalone codec, storage validation and schema default rejection leave an invocation able to commit", async () => {
  await fixture(async (connection, observer) => {
    await connection.transaction(async (db) => {
      await db.execute(sql`insert into writes values ('authoring')`);
      // SAFETY: this standalone negative control supplies a JavaScript number to the raw text codec, without SQL binding.
      assert.throws(() => textCodec.encode(123 as never));
      assert.throws(() => binaryCodec.encode({ hex: "FF" }));
      const parsed = await schema.validators.entries.insert["~standard"].validate({ value: "a\0b" });
      assert.ok(parsed.issues?.length);
      // SAFETY: this negative schema-authoring control bypasses Citext branding so default encoding must reject NUL.
      assert.throws(() => caseText.field().default("a\0b" as never));
      await db.insert(schema.tables.entries).values({ value: citext("MiXeD") });
      expect(
        await db
          .select({ value: schema.tables.entries.value, hash: crypto.digest("abc", "sha256", "text") })
          .from(schema.tables.entries),
      ).toEqual([
        { value: citext("MiXeD"), hash: { hex: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" } },
      ]);
      await db.execute(sql`insert into writes values ('authoring-after')`);
    });
    expect((await observer.query("select value from writes order by value")).rows).toEqual([
      { value: "authoring" },
      { value: "authoring-after" },
    ]);
    expect((await observer.query("select value::text from entries")).rows).toEqual([{ value: "MiXeD" }]);
  });
});
