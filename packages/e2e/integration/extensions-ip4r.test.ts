import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import * as v from "valibot";
import { ip4rValue, type PostgreSqlArray } from "../../../apps/loom/src/core/extensions/adapters/ip4r";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { createSnapshot, inspectSnapshot, migrationStatements, snapshotHash } from "../../../apps/loom/src/tooling/migrations/adapter";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { ip4rCases, ip4rCastCases, ip4rManaged, ip4rNamespace, withIp4rApi } from "../fixtures/ip4r-api";
import {
  ip4rOrdinaryProofCase,
  ip4rCastProofCase,
  ip4rSchemaIndexProofCase,
  ip4rCompositionProofCase,
} from "../fixtures/ip4r-proof-cases";

const kinds = ["ip4", "ip4r", "ip6", "ip6r", "ipaddress", "iprange"] as const;
const kindSchema = v.picklist(kinds);
const textRow = v.strictObject({ value: v.string() });
const hex = v.pipe(v.string(), v.regex(/^(?:[a-f0-9]{2})*$/));
const bits = v.pipe(v.string(), v.regex(/^[01]*$/));
const int8Text = v.pipe(v.union([v.string(), v.number(), v.bigint()]), v.transform((value) => BigInt(value)));

const nativeValue = v.union([v.null(), v.boolean(), v.string(), v.number(), v.bigint(), v.custom<Buffer>((value) => value instanceof Uint8Array)]);
const nativeRow = v.strictObject({ value: nativeValue });

function decodeNative(kind: string, value: v.InferOutput<typeof nativeValue>) {
  if (v.is(kindSchema, kind)) return { kind, text: v.parse(v.string(), value) };
  if (kind === "bytea") {
    if (value instanceof Uint8Array) return { hex: Buffer.from(value).toString("hex") };
    return { hex: v.parse(hex, v.parse(v.string(), value).replace(/^\\x/i, "").toLowerCase()) };
  }
  if (kind === "bit" || kind === "varbit") return { bits: v.parse(bits, value) };
  if (kind === "int8") return v.parse(int8Text, value);
  return value;
}

extensionProofTest(
  ip4rOrdinaryProofCase,
  async () => {
    await withIp4rApi(async ({ client, connection, api }) => {
      const cases = ip4rCases(api);
      assert.equal(cases.length, 341);
      assert.deepEqual(cases.map((entry) => entry.member).sort(), Object.keys(api.sql.overloads).sort());
      for (const item of cases) {
        const claim = ip4rOrdinaryProofCase.claims.find((claim) => claim.member === item.member);
        assert(claim);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
          const actual = (
            await connection.transaction((db) => db.select({ value: item.expression }).from(sql`portable_ip4r_inputs`))
          ).map((row) => row.value);
          const native = (
            await client.query(`select (${item.native})${v.is(kindSchema, item.kind) ? "::text" : ""} value from portable_ip4r_inputs`)
          ).rows.map((row) => decodeNative(item.kind, v.parse(nativeRow, row).value));
          assert.deepEqual(actual, native, item.member);
        });
      }
    }, ip4rOrdinaryProofCase.id);
  },
  180000,
);

extensionProofTest(
  ip4rCastProofCase,
  async () => {
    await withIp4rApi(async ({ client, connection, api }) => {
      const cases = ip4rCastCases(api);
      assert.equal(cases.length, 66);
      for (const item of cases) {
        const claim = ip4rCastProofCase.claims.find((claim) => claim.member === item.member);
        assert(claim);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
          const actual = (
            await connection.transaction((db) => db.select({ value: item.expression }).from(sql`portable_ip4r_inputs`))
          )[0]!.value;
          const native = v.parse(
            nativeRow,
            (await client.query(`select (${item.native})${v.is(kindSchema, item.kind) ? "::text" : ""} value from portable_ip4r_inputs`))
              .rows[0],
          ).value;
          assert.deepEqual(actual, decodeNative(item.kind, native), item.member);
        });
      }
    }, ip4rCastProofCase.id);
  },
  180000,
);

extensionProofTest(
  ip4rSchemaIndexProofCase,
  async () => {
    await withIp4rApi(async ({ client, connection, api }) => {
      const table = ip4rManaged.tables.entries;
      const values = {
        ip4: ip4rValue("ip4", "192.0.2.10"),
        ip4r: ip4rValue("ip4r", "192.0.2.0/24"),
        ip6: ip4rValue("ip6", "2001:db8::10"),
        ip6r: ip4rValue("ip6r", "2001:db8::/32"),
        ipaddress: ip4rValue("ipaddress", "192.0.2.10"),
        iprange: ip4rValue("iprange", "192.0.2.0/24"),
      };
      for (const kind of kinds) {
        const claim = ip4rSchemaIndexProofCase.claims.find((entry) => entry.member === `type:$extension:ip4r.${kind}`);
        assert(claim);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          const array: PostgreSqlArray<(typeof values)[typeof kind]> = {
            dimensions: [{ lowerBound: -2, length: 2 }],
            values: [values[kind], null],
          };
          await connection.transaction((db) => db.insert(table).values({ [kind]: values[kind], [`${kind}s`]: array }));
          const native = v.parse(
            textRow,
            (await client.query(`select ${kind}::text value from app.entries order by _id desc limit 1`)).rows[0],
          );
          assert.equal(native.value, values[kind].text);
        });
        const arrayClaim = ip4rSchemaIndexProofCase.claims.find((entry) => entry.member === `type:$extension:ip4r._${kind}`);
        assert(arrayClaim);
        await extensionProofWitness({ ...arrayClaim, schema: api.schema }, async () => {
          const native = v.parse(
            v.strictObject({ bounds: v.string() }),
            (
              await client.query(
                `select pg_catalog.array_dims(${kind}s) bounds from app.entries where ${kind}s is not null order by _id desc limit 1`,
              )
            ).rows[0],
          );
          assert.equal(native.bounds, "[-2:-1]");
        });
      }
      const desired = await createSnapshot(ip4rManaged);
      const observed = await inspectSnapshot(connection.db, "app");
      assert.equal(snapshotHash(observed), snapshotHash(desired));
      assert.deepEqual(await migrationStatements(observed, desired), []);
      const classes = await client.query(
        `select am.amname,c.opcname from pg_index i join pg_class t on t.oid=i.indrelid join pg_opclass c on c.oid=i.indclass[0] join pg_namespace n on n.oid=c.opcnamespace join pg_am am on am.oid=c.opcmethod where t.oid='app.entries'::regclass and n.nspname=$1 order by c.opcname`,
        [api.schema],
      );
      const expected = [
        "btree_ip4_ops",
        "btree_ip4r_ops",
        "btree_ip6_ops",
        "btree_ip6r_ops",
        "btree_ipaddress_ops",
        "btree_iprange_ops",
        "gist_ip4r_ops",
        "gist_ip6r_ops",
        "gist_iprange_ops",
        "hash_ip4_ops",
        "hash_ip4r_ops",
        "hash_ip6_ops",
        "hash_ip6r_ops",
        "hash_ipaddress_ops",
        "hash_iprange_ops",
      ];
      assert.deepEqual(classes.rows.map((row) => v.parse(v.strictObject({ amname: v.string(), opcname: v.string() }), row).opcname).sort(), expected);
      const opclasses = [
        { id: "opclass:$extension:ip4r.btree_ip4_ops/btree", name: "btree_ip4_ops", method: "btree", type: "ip4" },
        { id: "opclass:$extension:ip4r.btree_ip4r_ops/btree", name: "btree_ip4r_ops", method: "btree", type: "ip4r" },
        { id: "opclass:$extension:ip4r.btree_ip6_ops/btree", name: "btree_ip6_ops", method: "btree", type: "ip6" },
        { id: "opclass:$extension:ip4r.btree_ip6r_ops/btree", name: "btree_ip6r_ops", method: "btree", type: "ip6r" },
        { id: "opclass:$extension:ip4r.btree_ipaddress_ops/btree", name: "btree_ipaddress_ops", method: "btree", type: "ipaddress" },
        { id: "opclass:$extension:ip4r.btree_iprange_ops/btree", name: "btree_iprange_ops", method: "btree", type: "iprange" },
        { id: "opclass:$extension:ip4r.gist_ip4r_ops/gist", name: "gist_ip4r_ops", method: "gist", type: "ip4r" },
        { id: "opclass:$extension:ip4r.gist_ip6r_ops/gist", name: "gist_ip6r_ops", method: "gist", type: "ip6r" },
        { id: "opclass:$extension:ip4r.gist_iprange_ops/gist", name: "gist_iprange_ops", method: "gist", type: "iprange" },
        { id: "opclass:$extension:ip4r.hash_ip4_ops/hash", name: "hash_ip4_ops", method: "hash", type: "ip4" },
        { id: "opclass:$extension:ip4r.hash_ip4r_ops/hash", name: "hash_ip4r_ops", method: "hash", type: "ip4r" },
        { id: "opclass:$extension:ip4r.hash_ip6_ops/hash", name: "hash_ip6_ops", method: "hash", type: "ip6" },
        { id: "opclass:$extension:ip4r.hash_ip6r_ops/hash", name: "hash_ip6r_ops", method: "hash", type: "ip6r" },
        { id: "opclass:$extension:ip4r.hash_ipaddress_ops/hash", name: "hash_ipaddress_ops", method: "hash", type: "ipaddress" },
        { id: "opclass:$extension:ip4r.hash_iprange_ops/hash", name: "hash_iprange_ops", method: "hash", type: "iprange" },
      ] as const;
      for (const opclass of opclasses) {
        const claim = ip4rSchemaIndexProofCase.claims.find((entry) => entry.member === opclass.id);
        assert(claim);
        await extensionProofWitness({ ...claim, schema: api.schema }, async () => {
          assert(classes.rows.some((row) => row.opcname === opclass.name && row.amname === opclass.method));
          if (opclass.type === "ip4" || opclass.type === "ipaddress") {
            const query = `select _id from app.entries where ${opclass.type} operator(${ip4rNamespace}.=) ${ip4rNamespace}.${opclass.type}('192.0.2.10') order by _id`;
            await client.query("begin; set local enable_seqscan=off");
            try {
              const indexed = (await client.query(query)).rows;
              await client.query("set local enable_indexscan=off; set local enable_bitmapscan=off; set local enable_seqscan=on");
              assert.deepEqual(indexed, (await client.query(query)).rows, opclass.id);
            } finally {
              await client.query("rollback");
            }
          }
        });
      }
    }, ip4rSchemaIndexProofCase.id);
  },
  180000,
);

extensionProofTest(
  ip4rCompositionProofCase,
  async () => {
    await withIp4rApi(async ({ connection, api }) => {
      await connection.transaction(async (db) => {
        await db
          .select({ value: api.ip4.equal(ip4rValue("ip4", "192.0.2.1"), ip4rValue("ip4", "192.0.2.1")) })
          .from(sql`portable_ip4r_inputs`);
      });
    }, ip4rCompositionProofCase.id);
  },
  120000,
);
