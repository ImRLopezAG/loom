import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { dblinkDatabaseProofCase } from "../fixtures/dblink-proof-cases";
import { expect } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { createDblink_1_2 } from "../../../apps/loom/src/core/extensions/adapters/dblink";
import { int4Codec, textCodec } from "../../../apps/loom/src/core/extensions/adapters/dblink-codecs";
import { withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import {
  DblinkOperationError,
  withDblink,
  type DblinkSession,
} from "../../../apps/loom/src/tooling/extensions/operations/dblink";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { dblinkDescriptor, dblinkInstall, dblinkSchema } from "../fixtures/dblink";
import { withDblinkRemote } from "../fixtures/dblink-remote";

const record = { id: int4Codec, label: textCodec } as const;
const idOnly = { id: int4Codec } as const;

function redact(text: string, secrets: readonly string[]) {
  let output = text;
  for (const value of secrets) if (value) output = output.replaceAll(value, "[redacted]");
  return output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
}

extensionProofTest(
  dblinkDatabaseProofCase,
  async () => {
    const adminUrl = process.env.LOOM_TEST_DATABASE_URL;
    assert(adminUrl, "Missing PostgreSQL 18 extension fixture");
    const admin = new URL(adminUrl);
    const user = decodeURIComponent(admin.username);
    const password = decodeURIComponent(admin.password);
    await withExtensionDatabase(async (url) => {
      await withDblinkRemote(adminUrl, async (remote) => {
        const oracle = new pg.Client({ connectionString: url });
        await oracle.connect();
        const schema = defineSchema(() => ({ rows: {} }), { namespace: "dblink_app" });
        const connection = await connectDatabase({
          schema,
          relations: defineRelations(schema.tables),
          connectionString: url,
        });
        try {
          await oracle.query(dblinkInstall);
          await oracle.query(`CREATE TABLE local_items(id integer PRIMARY KEY, label text NOT NULL)`);
          await oracle.query(`INSERT INTO local_items VALUES (1, 'alpha')`);
          await observeExtensionProofDatabase(url, dblinkDatabaseProofCase.id, "dblink");
          const prove = (member: string, assertion: () => void | Promise<void>) => {
            const claim = dblinkDatabaseProofCase.claims.find((entry) => entry.member === member);
            assert(claim);
            return extensionProofWitness({ ...claim, schema: dblinkSchema }, assertion);
          };
          // dblink 1.2 revokes dblink_connect_u from PUBLIC. Without EXECUTE the native call fails with SQLSTATE 42501;
          // never grant, probe, or substitute here. Both witnesses stay pending until the operator holds the privilege.
          const connectUPrivileges = (
            await oracle.query<{ granted: boolean }>(
              `SELECT pg_catalog.has_function_privilege(signature::pg_catalog.regprocedure, 'EXECUTE') AS granted
               FROM unnest($1::pg_catalog.text[]) WITH ORDINALITY AS member(signature, position) ORDER BY position`,
              [['"db""link".dblink_connect_u(text,text)', '"db""link".dblink_connect_u(text)']],
            )
          ).rows.map((row) => row.granted);
          const connstr = remote.connstr(user, password);
          const secrets = [connstr, password, user, remote.name];

          await prove("foreign-data wrapper:dblink_fdw", async () => {
            const fdw = await oracle.query(
              `SELECT f.fdwname, h.proname AS handler, v.proname AS validator
               FROM pg_foreign_data_wrapper f
               LEFT JOIN pg_proc h ON h.oid=f.fdwhandler
               LEFT JOIN pg_proc v ON v.oid=f.fdwvalidator
               WHERE f.fdwname='dblink_fdw'`,
            );
            expect(fdw.rows).toEqual([{ fdwname: "dblink_fdw", handler: null, validator: "dblink_fdw_validator" }]);
            expect(createDblink_1_2(dblinkDescriptor).foreignDataWrapper).toEqual({
              member: "foreign-data wrapper:dblink_fdw",
              name: "dblink_fdw",
              handler: null,
              validator: "routine:$extension:dblink.dblink_fdw_validator(pg_catalog._text,pg_catalog.oid)",
            });
          });
          await prove("routine:$extension:dblink.dblink_fdw_validator(pg_catalog._text,pg_catalog.oid)", async () => {
            expect(createDblink_1_2(dblinkDescriptor).validator.authority).toBe("internal");
            await oracle.query(
              `SELECT "db""link".dblink_fdw_validator(ARRAY[]::text[], 'pg_foreign_server'::regclass::oid)`,
            );
          });
          await prove('composite type:"$extension:dblink".dblink_pkey_results', async () => {
            const type = await oracle.query(
              `SELECT pg_catalog.format_type(t.oid, NULL) AS type
               FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
               WHERE n.nspname='db"link' AND t.typname='dblink_pkey_results'`,
            );
            expect(type.rows[0]?.type).toBe('"db""link".dblink_pkey_results');
          });
          await prove("type:$extension:dblink.dblink_pkey_results", () => {
            const binding = createDblink_1_2(dblinkDescriptor);
            expect(binding.sql.types["type:$extension:dblink.dblink_pkey_results"]).toBe(binding.pkeyCodec);
            binding.field();
          });
          await prove("type:$extension:dblink._dblink_pkey_results", async () => {
            const value = await oracle.query(
              `SELECT ARRAY[ROW(1,'id')::"db""link".dblink_pkey_results]::text AS value`,
            );
            expect(String(value.rows[0]?.value)).toContain("(1,id)");
            const binding = createDblink_1_2(dblinkDescriptor);
            expect(binding.sql.types["type:$extension:dblink._dblink_pkey_results"]).toBe(binding.pkeyArrayCodec);
            binding.arrayField();
          });

          await prove("routine:$extension:dblink.dblink_get_pkey(pg_catalog.text)", async () => {
            const rows = await oracle.query(`SELECT * FROM "db""link".dblink_get_pkey('local_items')`);
            expect(rows.rows).toEqual([{ position: 1, colname: "id" }]);
          });
          await prove(
            "routine:$extension:dblink.dblink_build_sql_insert(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text,pg_catalog._text)",
            async () => {
              const sql = await oracle.query(
                `SELECT "db""link".dblink_build_sql_insert('local_items','1'::int2vector,1,ARRAY['1']::text[],ARRAY['9']::text[]) AS sql`,
              );
              expect(sql.rows[0]?.sql).toBe("INSERT INTO local_items(id,label) VALUES('9','alpha')");
            },
          );
          await prove(
            "routine:$extension:dblink.dblink_build_sql_update(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text,pg_catalog._text)",
            async () => {
              const sql = await oracle.query(
                `SELECT "db""link".dblink_build_sql_update('local_items','1'::int2vector,1,ARRAY['1']::text[],ARRAY['9']::text[]) AS sql`,
              );
              expect(sql.rows[0]?.sql).toBe("UPDATE local_items SET id = '9', label = 'alpha' WHERE id = '9'");
            },
          );
          await prove(
            "routine:$extension:dblink.dblink_build_sql_delete(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text)",
            async () => {
              const sql = await oracle.query(
                `SELECT "db""link".dblink_build_sql_delete('local_items','1'::int2vector,1,ARRAY['1']::text[]) AS sql`,
              );
              expect(sql.rows[0]?.sql).toBe("DELETE FROM local_items WHERE id = '1'");
            },
          );
          await prove("routine:$extension:dblink.dblink_current_query()", async () => {
            const current = await oracle.query(`SELECT "db""link".dblink_current_query() AS query`);
            expect(String(current.rows[0]?.query)).toContain("dblink_current_query");
          });

          let escaped: DblinkSession | undefined;
          const observed = await withDblink(url, dblinkDescriptor, async (session) => {
            escaped = session;
            expect(await session.connections()).toBeNull();
            expect(await session.getPkey({ schema: "public", name: "local_items" })).toEqual([
              { position: 1, colname: "id" },
            ]);
            expect(await session.buildSqlInsert({ schema: "public", name: "local_items" }, "1", 1, ["1"], ["9"])).toBe(
              "INSERT INTO public.local_items(id,label) VALUES('9','alpha')",
            );

            await prove("routine:$extension:dblink.dblink_connect(pg_catalog.text,pg_catalog.text)", async () => {
              const status = await session.connect({ connection: "named", connstr });
              expect(status).toEqual({ status: "OK", rollback: "not-transactional" });
              expect(JSON.stringify(status)).not.toContain(password);
            });
            await prove("routine:$extension:dblink.dblink_connect(pg_catalog.text)", async () => {
              expect(await session.connect({ connstr })).toEqual({ status: "OK", rollback: "not-transactional" });
            });
            await prove("routine:$extension:dblink.dblink_get_connections()", async () => {
              expect(await session.connections()).toEqual(["named"]);
              const empty = await oracle.query(`SELECT "db""link".dblink_get_connections() AS connections`);
              expect(empty.rows[0]?.connections).toBeNull();
              const api = createDblink_1_2(dblinkDescriptor);
              let sessionContracts = 0;
              await withExtensionSqlExecution(
                {
                  check: (contract) => {
                    if (contract.member === "routine:$extension:dblink.dblink_get_connections()") {
                      expect(contract.observability).toBe("session");
                      sessionContracts++;
                    }
                  },
                },
                () =>
                  connection.transaction((db) =>
                    db.select({ value: api.connections() }).from(sql`(values (1)) as loom_dblink_probe`),
                  ),
              );
              expect(sessionContracts).toBeGreaterThan(0);
              await expect(
                evaluateSnapshot(() =>
                  connection.transaction((db) =>
                    db.select({ value: api.connections() }).from(sql`(values (1)) as loom_dblink_probe`),
                  ),
                ),
              ).rejects.toThrow(/Automatic live query cannot observe session/);
            });

            await prove("routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.text)", async () => {
              expect(
                await session.query({
                  connection: "named",
                  sql: "SELECT id, label FROM items ORDER BY id",
                  fields: record,
                }),
              ).toEqual([
                { id: 1, label: "alpha" },
                { id: 2, label: "beta" },
              ]);
            });
            await prove(
              "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
              async () => {
                expect(
                  await session.query({
                    connection: "named",
                    sql: "SELECT id, label FROM items ORDER BY id",
                    failOnError: true,
                    fields: record,
                  }),
                ).toHaveLength(2);
              },
            );
            await prove("routine:$extension:dblink.dblink(pg_catalog.text)", async () => {
              expect(await session.query({ sql: "SELECT id FROM items WHERE id=1", fields: idOnly })).toEqual([
                { id: 1 },
              ]);
            });
            await prove("routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.bool)", async () => {
              expect(
                await session.query({ sql: "SELECT id FROM items WHERE id=1", failOnError: true, fields: idOnly }),
              ).toEqual([{ id: 1 }]);
            });

            await prove("routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.text)", async () => {
              expect(await session.exec({ connection: "named", sql: "INSERT INTO items VALUES (3, 'gamma')" })).toEqual(
                {
                  status: "INSERT 0 1",
                  rollback: "not-transactional",
                },
              );
            });
            await prove(
              "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
              async () => {
                expect(
                  await session.exec({
                    connection: "named",
                    sql: "INSERT INTO items VALUES (4, 'delta')",
                    failOnError: true,
                  }),
                ).toEqual({ status: "INSERT 0 1", rollback: "not-transactional" });
              },
            );
            await prove("routine:$extension:dblink.dblink_exec(pg_catalog.text)", async () => {
              expect(await session.exec({ sql: "UPDATE items SET label='alpha2' WHERE id=1" })).toEqual({
                status: "UPDATE 1",
                rollback: "not-transactional",
              });
            });
            await prove("routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.bool)", async () => {
              expect(
                await session.exec({ sql: "UPDATE items SET label='alpha3' WHERE id=1", failOnError: true }),
              ).toEqual({
                status: "UPDATE 1",
                rollback: "not-transactional",
              });
            });

            await prove(
              "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
              async () => {
                expect(
                  await session.open({
                    connection: "named",
                    cursor: "cur",
                    sql: "SELECT id, label FROM items ORDER BY id",
                  }),
                ).toEqual({ status: "OK", rollback: "not-transactional" });
              },
            );
            await prove(
              "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
              async () => {
                expect(await session.fetch({ connection: "named", cursor: "cur", count: 1, fields: record })).toEqual([
                  { id: 1, label: "alpha3" },
                ]);
              },
            );
            await prove(
              "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)",
              async () => {
                expect(
                  await session.fetch({
                    connection: "named",
                    cursor: "cur",
                    count: 10,
                    failOnError: true,
                    fields: record,
                  }),
                ).toHaveLength(3);
              },
            );
            await prove("routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.text)", async () => {
              expect(await session.close({ connection: "named", cursor: "cur" })).toEqual({
                status: "OK",
                rollback: "not-transactional",
              });
            });
            await prove(
              "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
              async () => {
                expect(
                  await session.open({
                    connection: "named",
                    cursor: "curx",
                    sql: "SELECT id FROM items ORDER BY id",
                    failOnError: true,
                  }),
                ).toEqual({ status: "OK", rollback: "not-transactional" });
              },
            );
            await prove(
              "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
              async () => {
                expect(await session.close({ connection: "named", cursor: "curx", failOnError: true })).toEqual({
                  status: "OK",
                  rollback: "not-transactional",
                });
              },
            );
            await prove(
              "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
              async () => {
                expect(
                  await session.open({ cursor: "cur2", sql: "SELECT id FROM items ORDER BY id", failOnError: true }),
                ).toEqual({ status: "OK", rollback: "not-transactional" });
              },
            );
            await prove(
              "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.int4,pg_catalog.bool)",
              async () => {
                expect(await session.fetch({ cursor: "cur2", count: 1, failOnError: true, fields: idOnly })).toEqual([
                  { id: 1 },
                ]);
              },
            );
            await prove("routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.bool)", async () => {
              expect(await session.close({ cursor: "cur2", failOnError: true })).toEqual({
                status: "OK",
                rollback: "not-transactional",
              });
            });
            await prove("routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text)", async () => {
              expect(await session.open({ cursor: "cur3", sql: "SELECT id FROM items ORDER BY id" })).toEqual({
                status: "OK",
                rollback: "not-transactional",
              });
            });
            await prove("routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.int4)", async () => {
              expect(await session.fetch({ cursor: "cur3", count: 2, fields: idOnly })).toHaveLength(2);
            });
            await prove("routine:$extension:dblink.dblink_close(pg_catalog.text)", async () => {
              expect(await session.close({ cursor: "cur3" })).toEqual({ status: "OK", rollback: "not-transactional" });
            });

            await prove("routine:$extension:dblink.dblink_send_query(pg_catalog.text,pg_catalog.text)", async () => {
              expect(await session.sendQuery({ connection: "named", sql: "SELECT id FROM items WHERE id=2" })).toEqual({
                sent: 1,
                rollback: "not-transactional",
              });
            });
            await prove("routine:$extension:dblink.dblink_is_busy(pg_catalog.text)", async () => {
              expect(await session.isBusy("named")).toBe(0);
            });
            await prove("routine:$extension:dblink.dblink_get_result(pg_catalog.text)", async () => {
              expect(await session.getResult({ connection: "named", fields: idOnly })).toEqual([{ id: 2 }]);
            });
            await prove("routine:$extension:dblink.dblink_get_result(pg_catalog.text,pg_catalog.bool)", async () => {
              expect(await session.getResult({ connection: "named", failOnError: true, fields: idOnly })).toEqual([]);
            });
            await prove("routine:$extension:dblink.dblink_error_message(pg_catalog.text)", async () => {
              expect(await session.errorMessage("named")).toBe("OK");
            });
            await prove("routine:$extension:dblink.dblink_cancel_query(pg_catalog.text)", async () => {
              expect(await session.cancelQuery("named")).toEqual({ status: "OK", rollback: "not-transactional" });
            });

            await prove("routine:$extension:dblink.dblink_get_notify(pg_catalog.text)", async () => {
              expect(await session.getNotify("named")).toEqual([]);
              await session.exec({ connection: "named", sql: "LISTEN dblink_probe" });
              const remoteUrl = new URL(adminUrl);
              remoteUrl.pathname = `/${remote.name}`;
              const notifier = new pg.Client({ connectionString: remoteUrl.href });
              await notifier.connect();
              try {
                await notifier.query("NOTIFY dblink_probe, 'payload'");
              } finally {
                await notifier.end();
              }
              const notes = await session.getNotify("named");
              expect(notes).toEqual([expect.objectContaining({ notify_name: "dblink_probe", extra: "payload" })]);
              expect(notes[0]?.be_pid).toBeGreaterThan(0);
            });
            await prove("routine:$extension:dblink.dblink_get_notify()", async () => {
              expect(await session.getNotify()).toEqual([]);
            });

            if (connectUPrivileges.every((granted) => granted)) {
              await prove("routine:$extension:dblink.dblink_connect_u(pg_catalog.text,pg_catalog.text)", async () => {
                expect(await session.connectU({ connection: "priv", connstr })).toEqual({
                  status: "OK",
                  rollback: "not-transactional",
                });
              });
              await prove("routine:$extension:dblink.dblink_connect_u(pg_catalog.text)", async () => {
                expect(await session.connectU({ connstr })).toEqual({ status: "OK", rollback: "not-transactional" });
              });
            }

            await prove("routine:$extension:dblink.dblink_disconnect(pg_catalog.text)", async () => {
              expect(await session.disconnect({ connection: "named" })).toEqual({
                status: "OK",
                rollback: "not-transactional",
              });
              await assert.rejects(oracle.query(`SELECT "db""link".dblink_disconnect('missing')`), (error) => {
                assert(error instanceof pg.DatabaseError);
                expect(error.code).toBe("08003");
                expect(redact(error.message, secrets)).toContain("not available");
                return true;
              });
            });
            await prove("routine:$extension:dblink.dblink_disconnect()", async () => {
              expect(await session.disconnect()).toEqual({ status: "OK", rollback: "not-transactional" });
            });
            return "observed";
          });
          expect(observed.completion).toBe("committed");
          expect(observed.value).toBe("observed");
          expect(
            observed.effects.some((effect) => effect.operation === "cleanup" && effect.state === "acknowledged"),
          ).toBe(true);
          for (const effect of observed.effects) {
            expect(JSON.stringify(effect)).not.toContain(password);
            expect(JSON.stringify(effect)).not.toContain(connstr);
          }
          assert(escaped);
          await expect(escaped.connections()).rejects.toThrow(/inactive|owner/);
          await expect(escaped.disconnect({ connection: "named" })).rejects.toThrow(/inactive|owner/);
          const failed = await withDblink(url, dblinkDescriptor, async (session) => {
            await session.disconnect({ connection: "missing" });
          }).then(
            () => {
              throw new Error("Expected missing disconnect to fail the leased session");
            },
            (error: Error) => error,
          );
          assert(failed instanceof DblinkOperationError);
          expect(failed.completion).toBe("rolled-back");
          expect(redact(String(failed.cause), secrets)).toContain("not available");
          assert(
            connectUPrivileges.every((granted) => granted),
            "Pending native prerequisite: EXECUTE on both dblink_connect_u overloads (provider SQLSTATE 42501)",
          );
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
  180000,
);
