import { expect } from "bun:test";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { defineRelations, sql } from "drizzle-orm";
import pg from "pg";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createPgstattuple_1_5 } from "../../../apps/loom/src/core/extensions/adapters/pgstattuple";
import { createPgrowlocks_1_2 } from "../../../apps/loom/src/core/extensions/adapters/pgrowlocks";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { wave10CallbackProofCase } from "../fixtures/wave10-callback-proof-cases";

// The extension schema is relocated and hostile; the application namespace must satisfy defineSchema, so a raw
// quoted table separately proves relation-name quoting.
const extensionSchema = 'stat "tuple"';
const appSchema = "obs_app";
const quotedSchema = 'q"x';

const proof = wave10CallbackProofCase("pgstattuple");
async function prove<T>(suffix: string, assertion: () => T | Promise<T>): Promise<T> {
  const claim = proof.claims.find((claim) => claim.member.endsWith(`.${suffix}`));
  assert(claim, "Unknown observation member");
  return extensionProofWitness({ ...claim, schema: extensionSchema }, assertion);
}
extensionProofTest(proof, async () => {
  await withExtensionDatabase(async (url) =>
    prove("pg_relpages(pg_catalog.regclass)", async () => {
      const schema = defineSchema((fields) => ({ docs: { body: fields.text().notNull() } }), { namespace: appSchema });
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      const descriptor = { version: "1.5", schema: extensionSchema } as const;
      const stat = createPgstattuple_1_5({
        name: "pgstattuple",
        ...descriptor,
        apiSupport: { status: "verified", digest: "6dd83523499b827ca6ba17e3af232cf28a46dded5819afef113fd37ff3913aec" },
      });
      const locks = createPgrowlocks_1_2({
        name: "pgrowlocks",
        version: "1.2",
        schema: extensionSchema,
        apiSupport: { status: "verified", digest: "d14f05ab2ddaedb3b915bc6cbead50da7c1880dcaf2bf37a1e192d1a4a336f61" },
      });
      const oracle = new pg.Client({ connectionString: url });
      const holder = new pg.Client({ connectionString: url });
      const role = `pst_reader_${crypto.randomUUID().replaceAll("-", "")}`;
      let roleAttempted = false;
      await oracle.connect();
      await holder.connect();
      try {
        const ext = sql.identifier(extensionSchema);
        await connection.db
          .execute(sql`create schema ${ext}; create extension pgstattuple with schema ${ext} version '1.5';
        create extension pgrowlocks with schema ${ext} version '1.2'; create schema ${sql.identifier(appSchema)};
        create table ${schema.tables.docs}(id int primary key, body text not null, tags int[] not null default '{}');
        insert into ${schema.tables.docs} select g, 'row ' || g from generate_series(1, 200) g; delete from ${schema.tables.docs} where id <= 50;
        create index docs_hash on ${schema.tables.docs} using hash (id); create index docs_gin on ${schema.tables.docs} using gin (tags);
        create schema ${sql.identifier(quotedSchema)}; create table ${sql.identifier(quotedSchema)}."d.v1"(id int);
        insert into ${sql.identifier(quotedSchema)}."d.v1" values (1), (2);`);
        for (const name of ["pgstattuple", "pgrowlocks"])
          await observeExtensionProofDatabase(url, `${proof.id}:${name}`, name);
        const quoted = { schema: quotedSchema, name: "d.v1" };
        const quotedRows = locks.rows(quoted);
        await prove("pgstattuple(pg_catalog.regclass)", async () => {
          const [quotedTuple] = await connection.transaction((db) =>
            db.select({ tuple: stat.tuple(quoted) }).from(sql`(select 1) as one`),
          );
          expect(quotedTuple!.tuple.tuple_count).toBe(2n);
        });
        expect(await connection.transaction((db) => db.select(quotedRows.columns).from(quotedRows.from))).toEqual([]);
        const docs = { schema: appSchema, name: "docs" };
        const ex = `"stat ""tuple"""`;
        const rel = `'obs_app.docs'::regclass`;

        const observed = await connection.transaction((db) =>
          db
            .select({ pages: stat.relationPages(schema.tables.docs), tuple: stat.tuple(docs) })
            .from(sql`(select 1) as one`),
        );
        const expected = await oracle.query(
          `select ${ex}.pg_relpages(${rel})::text as pages, (${ex}.pgstattuple(${rel})).*`,
        );
        const truth = expected.rows[0];
        expect(observed[0]!.pages).toBe(BigInt(truth.pages));
        expect(observed[0]!.tuple.tuple_count).toBe(150n);
        expect(observed[0]!.tuple.dead_tuple_count).toBe(BigInt(truth.dead_tuple_count));
        expect(observed[0]!.tuple.free_percent).toBe(Number(truth.free_percent));
        await prove("pg_relpages(pg_catalog.text)", async () => {
          const [textPages] = await connection.transaction((db) =>
            db.select({ value: stat.sql.functions.pg_relpages("obs_app.docs") }).from(sql`(select 1) as one`),
          );
          const textTruth = await oracle.query(`select ${ex}.pg_relpages('obs_app.docs'::text)::text as pages`);
          expect(textPages!.value).toBe(BigInt(textTruth.rows[0].pages));
        });

        const btree = stat.btreeIndexRows({ schema: appSchema, name: "docs_pkey" }, "b");
        await prove("pgstatindex(pg_catalog.regclass)", async () => {
          const [index] = await connection.transaction((db) => db.select(btree.columns).from(btree.from));
          const btreeTruth = (await oracle.query(`select * from ${ex}.pgstatindex('obs_app.docs_pkey')`)).rows[0];
          expect(index!.version).toBe(btreeTruth.version);
          expect(index!.leaf_pages).toBe(BigInt(btreeTruth.leaf_pages));
        });
        await prove("pgstatindex(pg_catalog.text)", async () => {
          const [textIndex] = await connection.transaction((db) =>
            db.select({ value: stat.sql.functions.pgstatindex("obs_app.docs_pkey") }).from(sql`(select 1) as one`),
          );
          const expectedIndex = (await oracle.query(`select * from ${ex}.pgstatindex('obs_app.docs_pkey'::text)`))
            .rows[0];
          expect(textIndex!.value.version).toBe(expectedIndex.version);
          expect(textIndex!.value.leaf_pages).toBe(BigInt(expectedIndex.leaf_pages));
        });
        const gin = stat.ginIndexRows({ schema: appSchema, name: "docs_gin" }, "g");
        const hash = stat.hashIndexRows({ schema: appSchema, name: "docs_hash" }, "h");
        const approx = stat.tupleApproxRows(schema.tables.docs, "a");
        await prove("pgstatginindex(pg_catalog.regclass)", async () => {
          const ginTruth = (await oracle.query(`select * from ${ex}.pgstatginindex('obs_app.docs_gin'::regclass)`))
            .rows[0];
          expect((await connection.transaction((db) => db.select(gin.columns).from(gin.from)))[0]!.pending_tuples).toBe(
            BigInt(ginTruth.pending_tuples),
          );
        });
        await prove("pgstathashindex(pg_catalog.regclass)", async () => {
          const hashTruth = (await oracle.query(`select (${ex}.pgstathashindex('obs_app.docs_hash'::regclass)).*`))
            .rows[0];
          expect((await connection.transaction((db) => db.select(hash.columns).from(hash.from)))[0]!.live_items).toBe(
            BigInt(hashTruth.live_items),
          );
        });
        await prove("pgstattuple_approx(pg_catalog.regclass)", async () => {
          const approxTruth = (await oracle.query(`select * from ${ex}.pgstattuple_approx('obs_app.docs'::regclass)`))
            .rows[0];
          expect(
            (await connection.transaction((db) => db.select(approx.columns).from(approx.from)))[0]!.table_len,
          ).toBe(BigInt(approxTruth.table_len));
        });
        await prove("pgstattuple(pg_catalog.text)", async () => {
          const textual = await connection.transaction((db) =>
            db.select({ value: stat.sql.functions.pgstattuple("obs_app.docs") }).from(sql`(select 1) as one`),
          );
          expect(textual[0]!.value.tuple_count).toBe(150n);
        });

        // Wrong access method raises and rolls back; the connection stays usable.
        await assert.rejects(
          connection.transaction((db) =>
            db.select({ v: stat.btreeIndex({ schema: appSchema, name: "docs_hash" }) }).from(sql`(select 1) as one`),
          ),
        );
        await assert.rejects(
          connection.transaction((db) =>
            db.select({ v: stat.tuple({ schema: appSchema, name: "missing" }) }).from(sql`(select 1) as one`),
          ),
        );

        // Another session's FOR UPDATE lock, verified against its own pid and xid.
        await prove("pgrowlocks(pg_catalog.text)", async () => {
          await holder.query("begin");
          const lockTruth = (
            await holder.query(
              `select pg_backend_pid() as pid, pg_current_xact_id()::xid::text as xid, ctid::text from obs_app.docs where id = 60 for update`,
            )
          ).rows[0];
          const rows = locks.rows(schema.tables.docs);
          const held = await connection.transaction((db) => db.select(rows.columns).from(rows.from));
          expect(held).toHaveLength(1);
          expect(held[0]!.locker).toBe(Number(lockTruth.xid));
          expect(held[0]!.multi).toBe(false);
          expect(held[0]!.pids.values).toEqual([lockTruth.pid]);
          expect(held[0]!.modes.values).toEqual(["For Update"]);
          expect(`(${held[0]!.locked_row.block},${held[0]!.locked_row.offset})`).toBe(lockTruth.ctid);
          await holder.query("rollback");
          expect(await connection.transaction((db) => db.select(rows.columns).from(rows.from))).toEqual([]);

          // Live evaluation rejects external observation.
          await assert.rejects(
            withExtensionSqlExecution({ check: (contract) => assert.equal(contract.observability, "tables") }, () =>
              connection.transaction((db) => db.select(rows.columns).from(rows.from)),
            ),
          );
        });

        // Privilege classification: pgstattuple is revoked from PUBLIC; pgrowlocks needs table SELECT.
        roleAttempted = true;
        const roleOutput = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
        if (roleOutput) {
          assert(process.env.LOOM_EXTENSION_PROOF_RUN_ID);
          appendFileSync(
            roleOutput,
            JSON.stringify({
              runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
              name: role,
              sha256: createHash("sha256").update(role).digest("hex"),
            }) + "\n",
            { mode: 0o600 },
          );
        }
        // CREATEROLE alone does not grant SET ROLE on PostgreSQL 18, including Neon's operator role.
        await oracle.query(
          `create role "${role}" nologin; grant "${role}" to current_user with set true; grant usage on schema ${ex}, obs_app to "${role}"`,
        );
        await oracle.query(`begin; set local role "${role}"`);
        await assert.rejects(oracle.query(`select ${ex}.pg_relpages(${rel})`), /permission denied/);
        await oracle.query(`rollback; begin; set local role "${role}"`);
        await assert.rejects(oracle.query(`select * from ${ex}.pgrowlocks('obs_app.docs')`), /permission denied/);
        await oracle.query("rollback");
        const [authority] = (
          await oracle.query<{ may_grant: boolean }>(
            `SELECT r.rolsuper OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m
         WHERE m.roleid='pg_stat_scan_tables'::regrole AND m.member=current_user::regrole AND m.admin_option) AS may_grant
         FROM pg_catalog.pg_roles r WHERE r.rolname=current_user`,
          )
        ).rows;
        assert(authority);
        if (authority.may_grant) {
          await oracle.query(`grant pg_stat_scan_tables to "${role}"; begin; set local role "${role}"`);
          expect((await oracle.query(`select ${ex}.pg_relpages(${rel})::text as p`)).rows[0].p).toBe(truth.pages);
          await oracle.query("rollback");
        } else {
          // The Neon operator can run diagnostics but cannot delegate the provider's monitoring role.
          await assert.rejects(oracle.query(`grant pg_stat_scan_tables to "${role}"`), { code: "42501" });
          expect((await oracle.query(`select ${ex}.pg_relpages(${rel})::text as p`)).rows[0].p).toBe(truth.pages);
        }
      } finally {
        try {
          await oracle.query("rollback");
          if (roleAttempted) {
            const existing = await oracle.query("select 1 from pg_catalog.pg_roles where rolname=$1", [role]);
            if (existing.rowCount)
              await oracle.query(
                `grant "${role}" to current_user with set true; drop owned by "${role}"; drop role "${role}"`,
              );
          }
        } finally {
          await holder.end();
          await oracle.end();
          await connection.close();
        }
      }
    }),
  );
});
