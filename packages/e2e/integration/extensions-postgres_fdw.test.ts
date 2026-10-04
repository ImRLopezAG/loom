import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { postgresFdwDatabaseProofCase } from "../fixtures/postgres_fdw-proof-cases";
import { expect } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { createPostgresFdw_1_2 } from "../../../apps/loom/src/core/extensions/adapters/postgres_fdw";
import { withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import {
  PostgresFdwOperationError,
  withPostgresFdw,
  type PostgresFdwSession,
} from "../../../apps/loom/src/tooling/extensions/operations/postgres_fdw";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { postgresFdwDescriptor, postgresFdwInstall, postgresFdwSchema } from "../fixtures/postgres_fdw";
import { postgresFdwLoopbackSql, withPostgresFdwRemote } from "../fixtures/postgres_fdw-remote";

extensionProofTest(
  postgresFdwDatabaseProofCase,
  async () => {
    const adminUrl = process.env.LOOM_TEST_DATABASE_URL;
    assert(adminUrl, "Missing PostgreSQL 18 extension fixture");
    const admin = new URL(adminUrl);
    await withExtensionDatabase(async (url) => {
      await withPostgresFdwRemote(adminUrl, async (remote) => {
        const oracle = new pg.Client({ connectionString: url });
        await oracle.connect();
        const schema = defineSchema(() => ({ rows: {} }), { namespace: "fdw_app" });
        const connection = await connectDatabase({
          schema,
          relations: defineRelations(schema.tables),
          connectionString: url,
        });
        try {
          await oracle.query(postgresFdwInstall);
          await observeExtensionProofDatabase(url, postgresFdwDatabaseProofCase.id, "postgres_fdw");
          const prove = (member: string, assertion: () => void | Promise<void>) => {
            const claim = postgresFdwDatabaseProofCase.claims.find((entry) => entry.member === member);
            assert(claim);
            return extensionProofWitness({ ...claim, schema: postgresFdwSchema }, assertion);
          };
          await prove("foreign-data wrapper:postgres_fdw", async () => {
            const fdw = await oracle.query(
              `SELECT f.fdwname, h.proname AS handler, v.proname AS validator
               FROM pg_foreign_data_wrapper f
               JOIN pg_proc h ON h.oid=f.fdwhandler
               JOIN pg_proc v ON v.oid=f.fdwvalidator
               WHERE f.fdwname='postgres_fdw'`,
            );
            expect(fdw.rows).toEqual([
              { fdwname: "postgres_fdw", handler: "postgres_fdw_handler", validator: "postgres_fdw_validator" },
            ]);
            const binding = createPostgresFdw_1_2(postgresFdwDescriptor);
            expect(binding.foreignDataWrapper).toEqual({
              member: "foreign-data wrapper:postgres_fdw",
              name: "postgres_fdw",
              handler: "routine:$extension:postgres_fdw.postgres_fdw_handler()",
              validator: "routine:$extension:postgres_fdw.postgres_fdw_validator(pg_catalog._text,pg_catalog.oid)",
            });
          });
          await prove("routine:$extension:postgres_fdw.postgres_fdw_handler()", async () => {
            const type = (await oracle.query(`SELECT pg_typeof("fdw ""cache""".postgres_fdw_handler())::text AS type`))
              .rows[0].type;
            expect(type).toBe("fdw_handler");
            expect(createPostgresFdw_1_2(postgresFdwDescriptor).handler.authority).toBe("schema");
          });
          await prove(
            "routine:$extension:postgres_fdw.postgres_fdw_validator(pg_catalog._text,pg_catalog.oid)",
            async () => {
              expect(createPostgresFdw_1_2(postgresFdwDescriptor).validator.authority).toBe("schema");
              await oracle.query(
                `SELECT "fdw ""cache""".postgres_fdw_validator(ARRAY['host=localhost','port=5432']::text[], 'pg_catalog.pg_foreign_server'::regclass::oid)`,
              );
              await assert.rejects(
                oracle.query(
                  `SELECT "fdw ""cache""".postgres_fdw_validator(ARRAY['not_an_option=value']::text[], 'pg_catalog.pg_foreign_server'::regclass::oid)`,
                ),
                (error) => {
                  assert(error instanceof pg.DatabaseError);
                  expect(error.code).toBe("HV00D");
                  return true;
                },
              );
            },
          );

          await oracle.query(
            postgresFdwLoopbackSql(
              remote.options,
              decodeURIComponent(admin.username),
              decodeURIComponent(admin.password),
            ),
          );

          let escaped: PostgresFdwSession | undefined;
          const result = await withPostgresFdw(url, postgresFdwDescriptor, async (session) => {
            escaped = session;
            expect(await session.connections()).toEqual([]);
            expect(await session.connections(true)).toEqual([]);
            expect(await session.disconnectAll()).toEqual({ disconnected: false, rollback: "not-transactional" });
            await assert.rejects(
              oracle.query(`SELECT "fdw ""cache""".postgres_fdw_disconnect('missing_server')`),
              (error) => {
                assert(error instanceof pg.DatabaseError);
                expect(error.code).toBe("42704");
                return true;
              },
            );
            expect((await oracle.query("SELECT * FROM remote_items ORDER BY id")).rows).toEqual([
              { id: 1, label: "alpha" },
              { id: 2, label: "beta" },
            ]);
            await oracle.query("SELECT * FROM remote_items");
            const emptyOnOtherBackend = await session.connections();
            expect(emptyOnOtherBackend).toEqual([]);
            await session.connections();
            const local = new pg.Client({ connectionString: url });
            await local.connect();
            try {
              await local.query("SELECT count(*) FROM remote_items");
              const native = await local.query(
                `SELECT server_name, user_name, valid, used_in_xact, closed, remote_backend_pid
                 FROM "fdw ""cache""".postgres_fdw_get_connections()`,
              );
              expect(native.rows).toEqual([
                {
                  server_name: "loopback",
                  user_name: decodeURIComponent(admin.username),
                  valid: true,
                  used_in_xact: false,
                  closed: null,
                  remote_backend_pid: native.rows[0]!.remote_backend_pid,
                },
              ]);
              // Managed PostgreSQL proxies can report a signed virtual backend PID. Preserve the captured int4
              // rather than imposing the local operating system's positive-PID convention on native output.
              const pid = native.rows[0]!.remote_backend_pid;
              assert(Number.isInteger(pid) && pid >= -2147483648 && pid <= 2147483647 && pid !== 0);
              expect(
                (
                  await local.query(
                    `SELECT pg_typeof(remote_backend_pid)::text AS type FROM "fdw ""cache""".postgres_fdw_get_connections()`,
                  )
                ).rows,
              ).toEqual([{ type: "integer" }]);
              const checked = await local.query(
                `SELECT closed FROM "fdw ""cache""".postgres_fdw_get_connections(true)`,
              );
              expect(checked.rows[0].closed).toBe(false);
              expect(
                (await local.query(`SELECT * FROM "fdw ""cache""".postgres_fdw_get_connections(NULL::boolean)`)).rows,
              ).toEqual([]);
              expect(
                (await local.query(`SELECT "fdw ""cache""".postgres_fdw_disconnect(NULL::text) AS disconnected`)).rows,
              ).toEqual([{ disconnected: null }]);
              await local.query("BEGIN");
              await local.query("SELECT * FROM remote_items WHERE id=1");
              expect(
                (await local.query(`SELECT used_in_xact, closed FROM "fdw ""cache""".postgres_fdw_get_connections()`))
                  .rows[0],
              ).toEqual({ used_in_xact: true, closed: null });
              expect(
                (await local.query(`SELECT "fdw ""cache""".postgres_fdw_disconnect('loopback') AS disconnected`))
                  .rows[0].disconnected,
              ).toBe(false);
              expect(
                (await local.query(`SELECT "fdw ""cache""".postgres_fdw_disconnect_all() AS disconnected`)).rows[0]
                  .disconnected,
              ).toBe(false);
              await local.query("ROLLBACK");
              expect(
                (await local.query(`SELECT used_in_xact FROM "fdw ""cache""".postgres_fdw_get_connections()`)).rows[0]
                  .used_in_xact,
              ).toBe(false);
              expect(
                (await local.query(`SELECT "fdw ""cache""".postgres_fdw_disconnect('loopback') AS disconnected`))
                  .rows[0].disconnected,
              ).toBe(true);
              expect((await local.query(`SELECT * FROM "fdw ""cache""".postgres_fdw_get_connections()`)).rows).toEqual(
                [],
              );
              await local.query("SELECT count(*) FROM remote_items");
              expect(
                (await local.query(`SELECT "fdw ""cache""".postgres_fdw_disconnect_all() AS disconnected`)).rows[0]
                  .disconnected,
              ).toBe(true);
            } finally {
              await local.end();
            }
            return "observed";
          });
          expect(result.completion).toBe("committed");
          expect(result.value).toBe("observed");
          expect(
            result.effects.some((effect) => effect.operation === "cleanup" && effect.state === "acknowledged"),
          ).toBe(true);
          assert(escaped);
          await assert.rejects(escaped.connections(), /inactive|owner/);
          await assert.rejects(escaped.disconnectAll(), /inactive|owner/);

          await prove("routine:$extension:postgres_fdw.postgres_fdw_get_connections(pg_catalog.bool)", async () => {
            const api = createPostgresFdw_1_2(postgresFdwDescriptor);
            const rows = api.connections(false, "fdw_connections");
            let sessionContracts = 0;
            await withExtensionSqlExecution(
              {
                check: (contract) => {
                  if (
                    contract.member === "routine:$extension:postgres_fdw.postgres_fdw_get_connections(pg_catalog.bool)"
                  ) {
                    expect(contract.observability).toBe("session");
                    expect(contract.observability).not.toBe("tables");
                    sessionContracts++;
                  }
                },
              },
              () => connection.transaction((db) => db.select(rows.columns).from(rows.from)),
            );
            expect(sessionContracts).toBeGreaterThan(0);
            await assert.rejects(
              evaluateSnapshot(() => connection.transaction((db) => db.select(rows.columns).from(rows.from))),
              /Automatic live query cannot observe session/,
            );
          });

          await prove("routine:$extension:postgres_fdw.postgres_fdw_disconnect(pg_catalog.text)", async () => {
            const failed = await withPostgresFdw(url, postgresFdwDescriptor, async (session) => {
              await session.disconnect({ serverName: "loopback" });
              throw new Error("after idle disconnect acknowledgement");
            }).then(
              () => {
                throw new Error("Expected callback failure");
              },
              (error) => {
                assert(error instanceof PostgresFdwOperationError);
                return error;
              },
            );
            assert(failed instanceof PostgresFdwOperationError);
            expect(failed.completion).toBe("rolled-back");
            expect(failed.effects[0]).toMatchObject({
              operation: "disconnect",
              serverName: "loopback",
              state: "acknowledged",
              rollback: "not-transactional",
            });
            const reset = await withPostgresFdw(url, postgresFdwDescriptor, (session) => session.connections());
            expect(reset.completion).toBe("committed");
            expect(reset.value).toEqual([]);
          });

          await prove("routine:$extension:postgres_fdw.postgres_fdw_disconnect_all()", async () => {
            const committed = await withPostgresFdw(url, postgresFdwDescriptor, (session) => session.disconnectAll());
            expect(committed.completion).toBe("committed");
            expect(committed.value).toEqual({ disconnected: false, rollback: "not-transactional" });
            expect(committed.effects.map((effect) => effect.operation)).toEqual(["disconnect-all", "cleanup"]);
          });
        } finally {
          try {
            await connection.close();
          } finally {
            await oracle.end();
          }
        }
      });
    });
  },
  120000,
);
