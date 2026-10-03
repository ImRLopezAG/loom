import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { defineRelations, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { bytea, pgTable, text } from "drizzle-orm/pg-core";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import { binaryCodec, nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { checkedExtensionExpression, withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";

// Independent PostgreSQL pgcrypto SHA-256 regression vector for the UTF-8 bytes of abc.
const abc = { hex: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" };
const emptyDigest = { hex: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" };
const allOctets = { hex: Array.from({ length: 256 }, (_, byte) => byte.toString(16).padStart(2, "0")).join("") };
const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'binary"parameters',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const installation = sql`create schema "binary""parameters"; create extension pgcrypto with schema "binary""parameters" version '1.4'`;

test("checked binary result literal matches the independent digest row", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const table = pgTable("binary_inputs", { value: text(), hash: bytea() });
    try {
      await connection.db.execute(installation);
      await connection.db.execute(sql`create table binary_inputs(value text, hash bytea)`);
      await connection.db.execute(
        sql`insert into binary_inputs values ('abc', decode(${abc.hex},'hex')), ('', decode(${emptyDigest.hex},'hex'))`,
      );
      const expression = extension.digest(table.value, "sha256", "text");
      expect(await connection.db.select({ value: table.value }).from(table).where(eq(expression, abc))).toEqual([
        { value: "abc" },
      ]);
      const filtered = (condition: ReturnType<typeof eq>) =>
        connection.db.select({ value: table.value }).from(table).where(condition).orderBy(table.value);
      expect(await filtered(ne(expression, abc))).toEqual([{ value: "" }]);
      expect(await filtered(inArray(expression, [abc, emptyDigest]))).toEqual([{ value: "" }, { value: "abc" }]);
      expect(await filtered(gt(expression, abc))).toEqual([{ value: "" }]);
      const compiled = filtered(inArray(expression, [abc, emptyDigest])).toSQL();
      expect(compiled.params).toEqual(["sha256", `\\x${abc.hex}`, `\\x${emptyDigest.hex}`]);
      expect(compiled.sql).not.toContain(abc.hex);
      expect(await filtered(eq(expression, extension.digest("abc", "sha256", "text")))).toEqual([{ value: "abc" }]);
      expect(await filtered(eq(expression, table.hash))).toEqual([{ value: "" }, { value: "abc" }]);
      expect(filtered(eq(expression, table.hash)).toSQL().params).toEqual(["sha256"]);
      for (const value of [{ hex: "" }, allOctets]) {
        const bound = sql.param(value, expression);
        expect((await connection.db.execute(sql`select encode(${bound}::bytea,'hex') as value`)).rows).toEqual([
          { value: value.hex },
        ]);
        const bytes = checkedExtensionExpression(sql`decode(${value.hex},'hex')`, binaryCodec, []);
        expect(await connection.db.select({ bytes }).from(table).where(eq(bytes, value))).toEqual([
          { bytes: value },
          { bytes: value },
        ]);
      }
    } finally {
      await connection.close();
    }
  });
});

test("native prepared binary parameters retain contracts and explicit selected alias encoding", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const table = pgTable("binary_inputs", { value: text() });
    try {
      await connection.db.execute(installation);
      await connection.db.execute(
        sql`create table binary_inputs(value text); insert into binary_inputs values ('abc'), ('')`,
      );
      let active = true;
      const expression = checkedExtensionExpression(
        extension.digest(table.value, "sha256", "text"),
        nullableCodec(binaryCodec),
        ["public.binary_inputs"],
        () => {
          if (!active) throw new Error("Binary expression execution lease expired");
        },
      );
      const query = connection.db
        .select({ value: table.value, hash: expression })
        .from(table)
        .where(eq(expression, sql.param(sql.placeholder("expected"), expression)));
      // Compilation/preparation precedes the invocation-local checker.
      const compiled = query.toSQL();
      expect(compiled.sql).not.toContain(abc.hex);
      const prepared = query.prepare();
      const seen: { member: string; relations: readonly string[] | undefined }[] = [];
      expect(
        await withExtensionSqlExecution(
          { check: (contract, relations) => seen.push({ member: contract.member, relations }) },
          () => prepared.execute({ expected: abc }),
        ),
      ).toEqual([{ value: "abc", hash: abc }]);
      expect(
        seen.some(({ member }) => member === "routine:$extension:pgcrypto.digest(pg_catalog.text,pg_catalog.text)"),
      ).toBe(true);
      expect(seen.some(({ relations }) => relations?.includes("public.binary_inputs"))).toBe(true);
      expect(await prepared.execute({ expected: emptyDigest })).toEqual([{ value: "", hash: emptyDigest }]);
      expect(await prepared.execute({ expected: null })).toEqual([]);
      await assert.rejects(async () => prepared.execute({}), /No value for placeholder "expected"/);
      for (const expected of [{ hex: "0" }, { hex: "FF" }, { hex: "zz" }, { bytes: "00" }, false])
        await assert.rejects(async () => prepared.execute({ expected }));
      expect(await prepared.execute({ expected: abc })).toEqual([{ value: "abc", hash: abc }]);

      const direct = expression.as("hash");
      expect(
        await connection.db
          .select({ hash: direct })
          .from(table)
          .where(eq(direct.sql, sql.param(abc, expression))),
      ).toEqual([{ hash: abc }]);
      const selected = connection.db.select({ value: table.value, hash: direct }).from(table).as("hashed");
      const aliasQuery = connection.db
        .select({ value: selected.value, hash: selected.hash })
        .from(selected)
        .where(eq(selected.hash, sql.param(abc, expression)));
      const aliasCompiled = aliasQuery.toSQL();
      expect(aliasCompiled.sql).toContain('where "hashed"."hash" =');
      expect(aliasCompiled.sql.match(/"digest"\(/g)).toHaveLength(1);
      expect(aliasCompiled.params).toEqual(["sha256", `\\x${abc.hex}`]);
      expect(await aliasQuery).toEqual([{ value: "abc", hash: abc }]);
      active = false;
      await assert.rejects(
        async () => prepared.execute({ expected: abc }),
        /Binary expression execution lease expired/,
      );
      expect((await connection.db.execute(sql`select count(*)::int as count from binary_inputs`)).rows).toEqual([
        { count: 2 },
      ]);
    } finally {
      await connection.close();
    }
  });
});

test("binary parameter filters keep scalar, prepared and nested decoding in both bytea output modes", async () => {
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
          const expression = extension.digest(schema.tables.parents.value, "sha256", "text");
          const prepared = db
            .select({ hash: expression })
            .from(schema.tables.parents)
            .where(eq(expression, sql.param(sql.placeholder("expected"), expression)))
            .prepare();
          expect(await prepared.execute({ expected: abc })).toEqual([{ hash: abc }]);
          const nested = await db.query.parents.findMany({
            columns: { value: true },
            where: { RAW: (table) => eq(extension.digest(table.value, "sha256", "text"), abc) },
            extras: { hash: (table) => extension.digest(table.value, "sha256", "text") },
            with: {
              children: {
                columns: { value: true },
                where: { RAW: (table) => eq(extension.digest(table.value, "sha256", "text"), abc) },
                extras: { hash: (table) => extension.digest(table.value, "sha256", "text") },
              },
            },
          });
          expect(nested).toEqual([{ value: "abc", hash: abc, children: [{ value: "abc", hash: abc }] }]);
          expect(JSON.parse(JSON.stringify(nested))).toEqual(nested);
        });
    } finally {
      await connection.close();
    }
  });
});

test("caught query-bound binary output validation failures invalidate prior invocation writes", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(installation);
      await connection.db.execute(sql`create table writes(value text not null)`);
      const outcomes: {
        mode: string;
        validationCaught: boolean;
        serverUsable: boolean;
        rejected: boolean;
        firstCausePreserved: boolean;
        writes: { value: string }[];
      }[] = [];
      for (const mode of ["compile", "prepared"] as const) {
        await connection.db.execute(sql`delete from writes`);
        let rejected = false;
        let validationCaught = false;
        let serverUsable = false;
        let firstCause: unknown;
        let outerCause: unknown;
        try {
          await connection.transaction(async (db) => {
            await db.execute(sql`insert into writes values (${mode})`);
            const expression = extension.digest("abc", "sha256", "text");
            const query = db.select({ hash: expression }).from(sql`(values (1)) fixture(id)`);
            if (mode === "compile") {
              assert.throws(
                () => query.where(eq(expression, { hex: "0" })).toSQL(),
                (cause) => {
                  firstCause = cause;
                  return true;
                },
              );
              assert.throws(() => query.where(eq(expression, { hex: "zz" })).toSQL());
            } else {
              const prepared = query
                .where(eq(expression, sql.param(sql.placeholder("expected"), expression)))
                .prepare();
              await assert.rejects(
                async () => prepared.execute({ expected: { hex: "0" } }),
                (cause) => {
                  firstCause = cause;
                  return true;
                },
              );
              await assert.rejects(async () => prepared.execute({ expected: { hex: "zz" } }));
            }
            validationCaught = true;
            // Validation happened before SQL reached PostgreSQL; its transaction remains usable here.
            await db.execute(sql`select 1`);
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
          validationCaught,
          serverUsable,
          rejected,
          firstCausePreserved: outerCause === firstCause,
          writes: (await connection.db.execute<{ value: string }>(sql`select value from writes`)).rows,
        });
      }
      expect(outcomes).toEqual([
        {
          mode: "compile",
          validationCaught: true,
          serverUsable: true,
          rejected: true,
          firstCausePreserved: true,
          writes: [],
        },
        {
          mode: "prepared",
          validationCaught: true,
          serverUsable: true,
          rejected: true,
          firstCausePreserved: true,
          writes: [],
        },
      ]);
      const freshExpression = extension.digest("abc", "sha256", "text");
      await connection.transaction(async (db) => {
        await db.execute(sql`insert into writes values ('fresh')`);
        expect(() => binaryCodec.encode({ hex: "0" })).toThrow();
        expect(() => binaryCodec.encodeOutputParameter({ hex: "0" })).toThrow();
        expect(
          await db
            .select({ hash: freshExpression })
            .from(sql`(values (1)) fixture(id)`)
            .where(eq(freshExpression, abc)),
        ).toEqual([{ hash: abc }]);
      });
      expect((await connection.db.execute(sql`select value from writes`)).rows).toEqual([{ value: "fresh" }]);
    } finally {
      await connection.close();
    }
  });
});
