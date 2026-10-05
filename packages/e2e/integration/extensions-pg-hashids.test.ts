import { expect } from "bun:test";
import { asc, defineRelations, eq, sql, type SQL } from "drizzle-orm";
import { bigint, pgTable } from "drizzle-orm/pg-core";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  pgHashidsNativeProofCase,
  pgHashidsNativeProofClaims,
  pgHashidsProofMembers,
  pgHashidsStorageProofCase,
} from "../fixtures/pg-hashids-proof-cases";
import { createPgHashids_1_2_1 } from "../../../apps/loom/src/core/extensions/adapters/pg-hashids";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";

const extension = createPgHashids_1_2_1({
  name: "pg_hashids",
  version: "1.2.1",
  schema: 'custom"hash',
  apiSupport: { status: "verified", digest: "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041" },
});
const install = sql`create schema "custom""hash"; create extension pg_hashids with schema "custom""hash" version '1.2.1'`;
const fixture = sql`(values(1)) fixture(value)`;
const salt = "This is my salt";
const alphabet = "abcdefghijABCDxFGHIJ1234567890";
const max = 9223372036854775807n;
const min = -9223372036854775808n;
const array = (values: readonly bigint[], lowerBound = 1) => ({
  dimensions: [{ lowerBound, length: values.length }],
  values,
});
const decoded = (...values: bigint[]) => array(values);
function member(index: number) {
  const id = pgHashidsProofMembers[index];
  if (!id) throw new Error("Unknown pg_hashids proof member");
  return id;
}

/**
 * Expected values are independent of this adapter: upstream sql/pg_hashids.sql vectors and pinned v1.2.1
 * hashids.c compiled as on Neon (Linux unsigned char). Apple signed-char standalone C disagrees when a
 * salt or alphabet contains bytes >= 0x80; those vectors use the Linux/Neon identity (sälz [1,2,3] -> m2sYIv).
 * Each row also runs as hand-written SQL text, so typed binding, casts and codecs are checked against native calls.
 */
const oracle: readonly { member: string; typed: SQL; raw: SQL; text: string; value: unknown }[] = [
  ...(
    [
      [0, extension.encode(1001n), sql`id_encode(1001::int8)`, "jNl"],
      [0, extension.encode(max), sql`id_encode(9223372036854775807::int8)`, "p21ZD04m8GQ42"],
      [0, extension.encode(min), sql`id_encode((-9223372036854775808)::int8)`, "qZ1QEvgn7JYg2"],
      [0, extension.encode(-1n), sql`id_encode((-1)::int8)`, "AOo9Ql5nQR1VO"],
      [0, extension.encode(0n), sql`id_encode(0::int8)`, "gY"],
      [1, extension.encode(1234567n, salt), sql`id_encode(1234567::int8, ${salt})`, "Pdzxp"],
      [2, extension.encode(1234567n, salt, 10), sql`id_encode(1234567::int8, ${salt}, 10)`, "PlRPdzxpR7"],
      [
        3,
        extension.encode(1234567n, salt, 10, alphabet),
        sql`id_encode(1234567::int8, ${salt}, 10, ${alphabet})`,
        "3GJ956J9B9",
      ],
      [3, extension.encode(0n, "", 0, "0123456789abcdef"), sql`id_encode(0::int8, '', 0, '0123456789abcdef')`, "3a"],
    ] as const
  ).map(([arity, typed, raw, text]) => ({ member: member(arity), typed, raw, text, value: text })),
  ...(
    [
      [
        0,
        extension.encodeArray(array([max, min, 0n])),
        sql`id_encode('{9223372036854775807,-9223372036854775808,0}'::int8[])`,
        "r912Gwjo8KRj9UnlDRjGmwgrG1IK",
      ],
      [0, extension.encodeArray(array([1n, 2n, 3n])), sql`id_encode('{1,2,3}'::int8[])`, "o2fXhV"],
      [0, extension.encodeArray(array([1n, 2n, 3n], -7)), sql`id_encode('[-7:-5]={1,2,3}'::int8[])`, "o2fXhV"],
      [1, extension.encodeArray(array([1n, 2n, 3n]), "sälz"), sql`id_encode('{1,2,3}'::int8[], ${"sälz"})`, "m2sYIv"],
      [
        2,
        extension.encodeArray(array([1234567n]), salt, 10),
        sql`id_encode('{1234567}'::int8[], ${salt}, 10)`,
        "PlRPdzxpR7",
      ],
      [
        3,
        extension.encodeArray(array([1n, 2n, 3n]), salt, 10, alphabet),
        sql`id_encode('{1,2,3}'::int8[], ${salt}, 10, ${alphabet})`,
        "4G31H3f7GD",
      ],
    ] as const
  ).map(([arity, typed, raw, text]) => ({ member: member(4 + arity), typed, raw, text, value: text })),
  ...(
    [
      [0, extension.decode("jNl"), sql`id_decode('jNl')`, "{1001}", decoded(1001n)],
      [0, extension.decode("a"), sql`id_decode('a')`, "{0}", decoded(0n)],
      [0, extension.decode("c"), sql`id_decode('c')`, "{0,0}", decoded(0n, 0n)],
      [
        0,
        extension.decode("kkkkkkkkkkkkkkkkkkkkkkkk"),
        sql`id_decode('kkkkkkkkkkkkkkkkkkkkkkkk')`,
        "{7493284456020305967}",
        decoded(7493284456020305967n),
      ],
      [
        0,
        extension.decode("r912Gwjo8KRj9UnlDRjGmwgrG1IK"),
        sql`id_decode('r912Gwjo8KRj9UnlDRjGmwgrG1IK')`,
        "{9223372036854775807,-9223372036854775808,0}",
        decoded(max, min, 0n),
      ],
      [1, extension.decode("Pdzxp", salt), sql`id_decode('Pdzxp', ${salt})`, "{1234567}", decoded(1234567n)],
      [1, extension.decode("m2sYIv", "sälz"), sql`id_decode('m2sYIv', ${"sälz"})`, "{1,2,3}", decoded(1n, 2n, 3n)],
      [
        2,
        extension.decode("PlRPdzxpR7", salt, 10),
        sql`id_decode('PlRPdzxpR7', ${salt}, 10)`,
        "{1234567}",
        decoded(1234567n),
      ],
      [
        3,
        extension.decode("3GJ956J9B9", salt, 10, alphabet),
        sql`id_decode('3GJ956J9B9', ${salt}, 10, ${alphabet})`,
        "{1234567}",
        decoded(1234567n),
      ],
      [
        3,
        extension.decode("4G31H3f7GD", salt, 10, alphabet),
        sql`id_decode('4G31H3f7GD', ${salt}, 10, ${alphabet})`,
        "{1,2,3}",
        decoded(1n, 2n, 3n),
      ],
    ] as const
  ).map(([arity, typed, raw, text, value]) => ({ member: member(8 + arity), typed, raw, text, value })),
  ...(
    [
      [0, extension.decodeOnce("o2fXhV"), sql`id_decode_once('o2fXhV')`, "1", 1n],
      [0, extension.decodeOnce("qZ1QEvgn7JYg2"), sql`id_decode_once('qZ1QEvgn7JYg2')`, "-9223372036854775808", min],
      [0, extension.decodeOnce("p21ZD04m8GQ42"), sql`id_decode_once('p21ZD04m8GQ42')`, "9223372036854775807", max],
      [1, extension.decodeOnce("Pdzxp", salt), sql`id_decode_once('Pdzxp', ${salt})`, "1234567", 1234567n],
      [
        2,
        extension.decodeOnce("PlRPdzxpR7", salt, 10),
        sql`id_decode_once('PlRPdzxpR7', ${salt}, 10)`,
        "1234567",
        1234567n,
      ],
      [
        3,
        extension.decodeOnce("3GJ956J9B9", salt, 10, alphabet),
        sql`id_decode_once('3GJ956J9B9', ${salt}, 10, ${alphabet})`,
        "1234567",
        1234567n,
      ],
    ] as const
  ).map(([arity, typed, raw, text, value]) => ({ member: member(12 + arity), typed, raw, text, value })),
  ...(
    [
      [0, extension.hashEncode(1001n), sql`hash_encode(1001::int8)`, "jNl"],
      [0, extension.hashEncode(max), sql`hash_encode(9223372036854775807::int8)`, "p21ZD04m8GQ42"],
      [1, extension.hashEncode(1234567n, salt), sql`hash_encode(1234567::int8, ${salt})`, "Pdzxp"],
      [2, extension.hashEncode(1234567n, salt, 10), sql`hash_encode(1234567::int8, ${salt}, 10)`, "PlRPdzxpR7"],
    ] as const
  ).map(([arity, typed, raw, text]) => ({ member: member(16 + arity), typed, raw, text, value: text })),
  ...(
    [
      [extension.hashDecode("PlRPdzxpR7", salt, 10), sql`hash_decode('PlRPdzxpR7', ${salt}, 10)`, "1234567", 1234567],
      // 4294967301 = 2^32 + 5 and 2147483648 = 2^31: the int4 declaration keeps only the low 32 bits.
      [extension.hashDecode("QkXPBLb", salt, 0), sql`hash_decode('QkXPBLb', ${salt}, 0)`, "5", 5],
      [extension.hashDecode("X1PYYpn", salt, 0), sql`hash_decode('X1PYYpn', ${salt}, 0)`, "-2147483648", -2147483648],
    ] as const
  ).map(([typed, raw, text, value]) => ({ member: member(19), typed, raw, text, value })),
];

async function connect(url: string) {
  const schema = defineSchema(() => ({}));
  return connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
}

extensionProofTest(pgHashidsNativeProofCase, async () => {
  await withExtensionDatabase(async (url) => {
    const connection = await connect(url);
    try {
      await connection.db.execute(install);
      await observeExtensionProofDatabase(url, pgHashidsNativeProofCase.id, "pg_hashids");
      const installed = await connection.db.execute(
        sql`select e.extversion,n.nspname from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pg_hashids'`,
      );
      expect(installed.rows).toEqual([{ extversion: "1.2.1", nspname: 'custom"hash' }]);
      const results = await connection.transaction(async (db) => {
        await db.execute(sql`select set_config('search_path','"custom""hash"',true)`);
        const rows: { member: string; typed: unknown; raw: unknown }[] = [];
        for (const entry of oracle) {
          expect(extensionExpressionContract(entry.typed)?.member).toBe(entry.member);
          const [typed] = await db.select({ value: entry.typed }).from(fixture);
          const raw = await db.execute(sql`select (${entry.raw})::text as value`);
          rows.push({ member: entry.member, typed: typed!.value, raw: raw.rows[0]?.value });
        }
        // Native-only observation: SQL NULL int8 is read as 0 and encodes as gY. SQL<bigint> cannot prevent this.
        const nullInt8 = await db.execute(sql`select id_encode(null::int8)::text as value`);
        expect(nullInt8.rows).toEqual([{ value: "gY" }]);
        const guardOnly = await db.execute(sql`select id_decode('a')::text as value`);
        expect(guardOnly.rows).toEqual([{ value: "{0}" }]);
        const separatorOnly = await db.execute(sql`select id_decode('c')::text as value`);
        expect(separatorOnly.rows).toEqual([{ value: "{0,0}" }]);
        return rows;
      });
      for (const claim of pgHashidsNativeProofClaims)
        await extensionProofWitness({ ...claim, schema: extension.schema }, () => {
          const expected = oracle.filter((entry) => entry.member === claim.member);
          const actual = results.filter((entry) => entry.member === claim.member);
          expect(expected.length).toBeGreaterThan(0);
          expect(actual.map((entry) => entry.raw)).toEqual(expected.map((entry) => entry.text));
          expect(actual.map((entry) => entry.typed)).toEqual(expected.map((entry) => entry.value));
        });
    } finally {
      await connection.close();
    }
  });
});

extensionProofTest(pgHashidsStorageProofCase, async () => {
  await withExtensionDatabase(async (url) => {
    const connection = await connect(url);
    const ids = pgTable("hashids_ids", { id: bigint({ mode: "bigint" }).notNull() });
    try {
      await connection.db.execute(install);
      await observeExtensionProofDatabase(url, pgHashidsStorageProofCase.id, "pg_hashids");
      await connection.db.execute(
        sql`create table hashids_ids(id int8 not null); insert into hashids_ids values (1001),(9223372036854775807),(-9223372036854775808)`,
      );
      expect(
        await connection.db
          .select({ id: ids.id, hash: extension.encode(ids.id) })
          .from(ids)
          .orderBy(asc(extension.encode(ids.id))),
      ).toEqual([
        { id: 1001n, hash: "jNl" },
        { id: max, hash: "p21ZD04m8GQ42" },
        { id: min, hash: "qZ1QEvgn7JYg2" },
      ]);
      expect(
        await connection.db
          .select({ id: ids.id })
          .from(ids)
          .where(eq(ids.id, extension.decodeOnce("qZ1QEvgn7JYg2"))),
      ).toEqual([{ id: min }]);
      const nested = connection.db
        .select({ hash: extension.encode(ids.id).as("hash") })
        .from(ids)
        .as("nested");
      expect(
        await connection.db
          .select({ id: extension.decodeOnce("p21ZD04m8GQ42") })
          .from(nested)
          .where(eq(nested.hash, "p21ZD04m8GQ42")),
      ).toEqual([{ id: max }]);
    } finally {
      await connection.close();
    }
  });
});
