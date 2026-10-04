import assert from "node:assert/strict";
import pg from "pg";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPgRepack_1_5_2, type PgRepackPrimaryKey, type PgRepackTable } from "../../../apps/loom/src/core/extensions/adapters/pg_repack";
import { withPgRepack, RepackOperationError } from "../../../apps/loom/src/tooling/extensions/operations/pg_repack";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { withPgRepackDatabase } from "../fixtures/pg_repack-lifecycle";
import { pgRepackDescriptor, pgRepackInstall, pgRepackSqlSchema } from "../fixtures/pg_repack";
import { pgRepackNativeProofCase } from "../fixtures/pg_repack-proof-cases";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_repack.json";

extensionProofTest(
  pgRepackNativeProofCase,
  async () => {
    await withPgRepackDatabase(async (fixture) => {
      const oracle = new pg.Client({ connectionString: fixture.url });
      await oracle.connect();
      const api = createPgRepack_1_5_2(pgRepackDescriptor);
      const dialect = extensionSqlDialect(nodePgCodecs);
      const prove = async (member: string, assertion: () => void | Promise<void>) => {
        const claim = pgRepackNativeProofCase.claims.find((entry) => entry.member === member);
        assert(claim, `Undeclared pg_repack member: ${member}`);
        await extensionProofWitness({ ...claim, schema: pgRepackSqlSchema }, assertion);
      };
      try {
        assert.equal(
          Math.floor(Number((await oracle.query("SHOW server_version_num")).rows[0].server_version_num) / 10000),
          18,
        );
        await oracle.query(pgRepackInstall);
        const installation = await oracle.query(
          "SELECT n.nspname AS schema, e.extrelocatable AS relocatable FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_repack'",
        );
        assert.equal(installation.rows[0].relocatable, false);
        assert.equal(installation.rows[0].schema, pgRepackDescriptor.schema);
        await oracle.query("CREATE SCHEMA IF NOT EXISTS loom_repack_other");
        await assert.rejects(oracle.query("ALTER EXTENSION pg_repack SET SCHEMA loom_repack_other"));
        const owned = `loom_repack_${crypto.randomUUID().replaceAll("-", "")}`;
        await oracle.query(`CREATE SCHEMA ${owned}`);
        await oracle.query(
          `CREATE TABLE ${owned}.items(id integer PRIMARY KEY, label text NOT NULL); INSERT INTO ${owned}.items SELECT g, 'row'||g FROM generate_series(1,20) g`,
        );
        const ids = await oracle.query(
          `SELECT c.oid::text AS table_oid, i.indexrelid::text AS pk_oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_index i ON i.indrelid=c.oid AND i.indisprimary WHERE n.nspname=$1 AND c.relname='items'`,
          [owned],
        );
        const tableOid = Number(ids.rows[0].table_oid);
        const pkOid = Number(ids.rows[0].pk_oid);
        const versions = await oracle.query("SELECT repack.version() AS version, repack.version_sql() AS version_sql");
        assert.equal(versions.rows[0].version, "pg_repack 1.5.2");
        assert.equal(versions.rows[0].version_sql, "pg_repack 1.5.2");
        await prove("routine:repack.version()", async () => {
          assert.match(dialect.sqlToQuery(sql`select ${api.libraryVersion()}`).sql, /"repack"\."version"/);
          assert.equal((await oracle.query("SELECT repack.version() AS value")).rows[0].value, "pg_repack 1.5.2");
        });
        await prove("routine:repack.version_sql()", async () => {
          assert.equal((await oracle.query("SELECT repack.version_sql() AS value")).rows[0].value, "pg_repack 1.5.2");
        });
        await prove("routine:repack.oid2text(pg_catalog.oid)", async () => {
          assert.equal(
            (await oracle.query("SELECT repack.oid2text($1::oid) AS value", [tableOid])).rows[0].value,
            `${owned}.items`,
          );
        });
        await prove("routine:repack.get_index_columns(pg_catalog.oid)", async () => {
          assert.match(
            (await oracle.query("SELECT repack.get_index_columns($1::oid) AS value", [pkOid])).rows[0].value,
            /id/,
          );
        });
        await prove("routine:repack.get_order_by(pg_catalog.oid,pg_catalog.oid)", async () => {
          const value = (await oracle.query("SELECT repack.get_order_by($1::oid,$2::oid) AS value", [pkOid, tableOid]))
            .rows[0].value;
          assert.equal(typeof value === "string" || value === null, true);
        });
        await prove("routine:repack.get_create_index_type(pg_catalog.oid,pg_catalog.name)", async () => {
          assert.match(
            (await oracle.query("SELECT repack.get_create_index_type($1::oid,$2::name) AS value", [pkOid, "pk_type"]))
              .rows[0].value,
            /CREATE TYPE/,
          );
        });
        await prove("routine:repack.get_create_trigger(pg_catalog.oid,pg_catalog.oid)", async () => {
          assert.match(
            (await oracle.query("SELECT repack.get_create_trigger($1::oid,$2::oid) AS value", [tableOid, pkOid])).rows[0]
              .value,
            /repack\.repack_trigger/,
          );
        });
        await prove("routine:repack.get_enable_trigger(pg_catalog.oid)", async () => {
          assert.match(
            (await oracle.query("SELECT repack.get_enable_trigger($1::oid) AS value", [tableOid])).rows[0].value,
            /ENABLE ALWAYS TRIGGER/,
          );
        });
        await prove("routine:repack.get_assign(pg_catalog.oid,pg_catalog.text)", async () => {
          assert.match(
            (await oracle.query("SELECT repack.get_assign($1::oid,$2::text) AS value", [tableOid, "$2"])).rows[0].value,
            /label/,
          );
        });
        await prove("routine:repack.get_compare_pkey(pg_catalog.oid,pg_catalog.text)", async () => {
          assert.match(
            (await oracle.query("SELECT repack.get_compare_pkey($1::oid,$2::text) AS value", [pkOid, "$1"])).rows[0]
              .value,
            /id/,
          );
        });
        await prove("routine:repack.get_columns_for_create_as(pg_catalog.oid)", async () => {
          assert.match(
            (await oracle.query("SELECT repack.get_columns_for_create_as($1::oid) AS value", [tableOid])).rows[0].value,
            /id/,
          );
        });
        await prove("routine:repack.get_drop_columns(pg_catalog.oid,pg_catalog.text)", async () => {
          const value = (
            await oracle.query("SELECT repack.get_drop_columns($1::oid,$2::text) AS value", [
              tableOid,
              `repack.table_${tableOid}`,
            ])
          ).rows[0].value;
          assert.equal(value, null);
        });
        await prove("routine:repack.get_storage_param(pg_catalog.oid)", async () => {
          try {
            const value = (await oracle.query("SELECT repack.get_storage_param($1::oid) AS value", [tableOid])).rows[0]
              .value;
            assert.equal(value, "oids = false");
          } catch (cause) {
            assert(cause instanceof Error);
            assert.match(cause.message, /relhasoids|column/);
          }
        });
        await prove("routine:repack.get_alter_col_storage(pg_catalog.oid)", async () => {
          const value = (await oracle.query("SELECT repack.get_alter_col_storage($1::oid) AS value", [tableOid])).rows[0]
            .value;
          assert.equal(typeof value === "string" || value === null, true);
        });
        await prove("routine:repack.get_table_and_inheritors(pg_catalog.regclass)", async () => {
          const value = (
            await oracle.query("SELECT repack.get_table_and_inheritors($1::regclass)::text AS value", [`${owned}.items`])
          ).rows[0].value as string;
          assert.match(value, /^\{[0-9]+\}$/);
        });
        await prove("routine:repack.conflicted_triggers(pg_catalog.oid)", async () => {
          assert.deepEqual(
            (await oracle.query("SELECT * FROM repack.conflicted_triggers($1::oid)", [tableOid])).rows,
            [],
          );
        });
        await prove("routine:repack.repack_indexdef(pg_catalog.oid,pg_catalog.oid,pg_catalog.name,pg_catalog.bool)", async () => {
          assert.match(
            (
              await oracle.query("SELECT repack.repack_indexdef($1::oid,$2::oid,$3::name,$4::bool) AS value", [
                pkOid,
                tableOid,
                "repack",
                false,
              ])
            ).rows[0].value,
            /CREATE.*INDEX/i,
          );
        });
        await prove("view:repack.primary_keys", async () => {
          const rows = await oracle.query(
            "SELECT indrelid::text, indexrelid::text FROM repack.primary_keys WHERE indrelid=$1::oid",
            [tableOid],
          );
          assert.equal(rows.rows[0].indexrelid, String(pkOid));
        });
        await prove("view:repack.tables", async () => {
          const rows = await oracle.query("SELECT relid::text, schemaname FROM repack.tables WHERE relid=$1::oid", [
            tableOid,
          ]);
          assert.equal(rows.rows[0].schemaname, owned);
        });
        await prove("type:repack.primary_keys", async () => {
          const encoded = (await oracle.query("SELECT ROW(p.*)::text AS value FROM repack.primary_keys p WHERE p.indrelid=$1::oid", [
            tableOid,
          ])).rows[0].value as string;
          const decoded = api.primaryKeysCodec.decode(encoded);
          assert.equal(decoded.indrelid, tableOid);
          assert.equal(decoded.indexrelid, pkOid);
        });
        await prove("type:repack.tables", async () => {
          const encoded = (await oracle.query("SELECT ROW(t.*)::text AS value FROM repack.tables t WHERE t.relid=$1::oid", [
            tableOid,
          ])).rows[0].value as string;
          assert.equal(api.tablesCodec.decode(encoded).relid, tableOid);
        });
        await prove("type:repack._primary_keys", async () => {
          const encoded = (await oracle.query("SELECT ARRAY[ROW(p.*)]::repack.primary_keys[]::text AS value FROM repack.primary_keys p WHERE p.indrelid=$1::oid", [
            tableOid,
          ])).rows[0].value as string;
          const key = api.primaryKeysArrayCodec.decode(encoded).values[0];
          assert(key && typeof key === "object" && !Array.isArray(key));
          assert.equal((key as PgRepackPrimaryKey).indrelid, tableOid);
        });
        await prove("type:repack._tables", async () => {
          const encoded = (await oracle.query("SELECT ARRAY[ROW(t.*)]::repack.tables[]::text AS value FROM repack.tables t WHERE t.relid=$1::oid", [
            tableOid,
          ])).rows[0].value as string;
          const row = api.tablesArrayCodec.decode(encoded).values[0];
          assert(row && typeof row === "object" && !Array.isArray(row));
          assert.equal((row as PgRepackTable).relid, tableOid);
        });
        for (const column of source.contract.members.filter((member) => member.id.startsWith("view column:repack."))) {
          await prove(column.id, async () => {
            const name = column.id.slice("view column:repack.".length).split(".")[1]!;
            const relation = column.id.includes("primary_keys") ? "primary_keys" : "tables";
            const rows = await oracle.query(
              `SELECT ${name} FROM repack.${relation} WHERE ${relation === "primary_keys" ? "indrelid" : "relid"}=$1::oid`,
              [tableOid],
            );
            assert.equal(rows.rows.length, 1);
          });
        }
        await prove("schema:repack", async () => {
          assert.equal((await oracle.query("SELECT nspname FROM pg_namespace WHERE nspname='repack'")).rows[0].nspname, "repack");
        });
        await prove('rule:"_RETURN" on repack.primary_keys', async () => {
          assert.equal(
            (
              await oracle.query(
                "SELECT ev_type FROM pg_rewrite WHERE ev_class='repack.primary_keys'::regclass AND ev_type='1'",
              )
            ).rows.length,
            1,
          );
        });
        await prove('rule:"_RETURN" on repack.tables', async () => {
          assert.equal(
            (await oracle.query("SELECT ev_type FROM pg_rewrite WHERE ev_class='repack.tables'::regclass AND ev_type='1'"))
              .rows.length,
            1,
          );
        });
        await prove("routine:repack.repack_trigger()", async () => {
          await assert.rejects(oracle.query("SELECT repack.repack_trigger()"), /invalid trigger call/);
        });
        let escaped;
        const result = await withPgRepack(fixture.url, pgRepackDescriptor, async (session) => {
          escaped = session;
          return session.repack({ relation: { schema: owned, name: "items" }, binary: fixture.binary });
        });
        assert.equal(result.completion, "committed");
        assert.deepEqual(result.value, {
          state: "acknowledged",
          rollback: "not-transactional",
          identity: "pg_repack 1.5.2",
        });
        assert.deepEqual(result.effects, [
          { operation: "repack", state: "acknowledged", rollback: "not-transactional", identity: "pg_repack 1.5.2" },
        ]);
        assert.equal((await oracle.query(`SELECT count(*)::text AS value FROM ${owned}.items`)).rows[0].value, "20");
        await assert.rejects(escaped!.repack({ relation: { schema: owned, name: "items" }, binary: fixture.binary }), /inactive|owner/);
        try {
          await withPgRepack(fixture.url, pgRepackDescriptor, async (session) => {
            await session.repack({ relation: { schema: owned, name: "items" }, binary: fixture.binary });
            throw new Error("after repack");
          });
          throw new Error("Expected callback failure");
        } catch (cause) {
          if (!(cause instanceof RepackOperationError)) throw cause;
          assert.equal(cause.completion, "unknown");
          assert.deepEqual(cause.effects, [
            { operation: "repack", state: "acknowledged", rollback: "not-transactional", identity: "pg_repack 1.5.2" },
          ]);
        }
        await oracle.query(`CREATE TABLE ${owned}.other(id integer PRIMARY KEY, label text NOT NULL)`);
        const other = await oracle.query(
          `SELECT c.oid::text AS table_oid, i.indexrelid::text AS pk_oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_index i ON i.indrelid=c.oid AND i.indisprimary WHERE n.nspname=$1 AND c.relname='other'`,
          [owned],
        );
        const otherOid = Number(other.rows[0].table_oid);
        const otherPk = Number(other.rows[0].pk_oid);
        await prove("routine:repack.create_index_type(pg_catalog.oid,pg_catalog.oid)", async () => {
          await oracle.query("SELECT repack.create_index_type($1::oid,$2::oid)", [otherPk, otherOid]);
        });
        await prove("routine:repack.create_log_table(pg_catalog.oid)", async () => {
          await oracle.query("SELECT repack.create_log_table($1::oid)", [otherOid]);
        });
        await prove("routine:repack.create_table(pg_catalog.oid,pg_catalog.name)", async () => {
          await oracle.query("SELECT repack.create_table($1::oid,$2::name)", [otherOid, "pg_default"]);
        });
        await prove("routine:repack.disable_autovacuum(pg_catalog.regclass)", async () => {
          await oracle.query("SELECT repack.disable_autovacuum($1::regclass)", [`repack.table_${otherOid}`]);
        });
        await prove(
          "routine:repack.repack_apply(pg_catalog.cstring,pg_catalog.cstring,pg_catalog.cstring,pg_catalog.cstring,pg_catalog.cstring,pg_catalog.int4)",
          async () => {
            const applied = await oracle.query(
              "SELECT repack.repack_apply($1::cstring,$2::cstring,$3::cstring,$4::cstring,$5::cstring,$6::int4) AS value",
              [
                `SELECT * FROM repack.log_${otherOid} ORDER BY id LIMIT $1`,
                `INSERT INTO repack.table_${otherOid} VALUES ($1.*)`,
                `DELETE FROM repack.table_${otherOid} WHERE FALSE`,
                `UPDATE repack.table_${otherOid} SET id=id WHERE FALSE`,
                `DELETE FROM repack.log_${otherOid} WHERE id IN (`,
                10,
              ],
            );
            assert.equal(applied.rows[0].value, 0);
          },
        );
        await prove("routine:repack.repack_index_swap(pg_catalog.oid)", async () => {
          await assert.rejects(oracle.query("SELECT repack.repack_index_swap($1::oid)", [otherPk]), /Could not find index/);
        });
        await prove("routine:repack.repack_swap(pg_catalog.oid)", async () => {
          await assert.rejects(oracle.query("SELECT repack.repack_swap($1::oid)", [otherOid]));
        });
        await prove("routine:repack.repack_drop(pg_catalog.oid,pg_catalog.int4)", async () => {
          try {
            await oracle.query("SELECT repack.repack_drop($1::oid,$2::int4)", [otherOid, 0]);
          } catch (cause) {
            assert(cause instanceof Error);
            assert.match(cause.message, /cannot drop type|depend/);
          }
        });
      } finally {
        await oracle.end();
      }
    });
  },
  360000,
);
