import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { pgStatStatementsDatabaseProofCase } from "../fixtures/pg_stat_statements-proof-cases";
import { expect } from "bun:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import pg from "pg";
import { defineRelations } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createPgStatStatements_1_12 } from "../../../apps/loom/src/core/extensions/adapters/pg_stat_statements";
import {
  statementCodec,
  statementFields,
  statementInfoFields,
  statementInfoCodec,
  statementArrayCodec,
  statementInfoArrayCodec,
} from "../../../apps/loom/src/core/extensions/adapters/pg_stat_statements-codecs";
import { withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import {
  withPgStatStatements,
  StatementStatisticsOperationError,
  type StatementStatisticsSession,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_stat_statements";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  statementStatisticsDescriptor,
  statementStatisticsInstall,
  statementStatisticsSchema,
} from "../fixtures/pg_stat_statements";

extensionProofTest(
  pgStatStatementsDatabaseProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      const schema = defineSchema(() => ({ rows: {} }), { namespace: "stat_app" });
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      const role = `stat_reader_${crypto.randomUUID().replaceAll("-", "")}`;
      let roleAttempted = false;
      try {
        await oracle.query(statementStatisticsInstall);
        await observeExtensionProofDatabase(url, pgStatStatementsDatabaseProofCase.id, "pg_stat_statements");
        const prove = (member: string, assertion: () => void | Promise<void>) => {
          const claim = pgStatStatementsDatabaseProofCase.claims.find((claim) => claim.member === member);
          assert(claim);
          return extensionProofWitness({ ...claim, schema: statementStatisticsSchema }, assertion);
        };
        await oracle.query("SET DateStyle = 'ISO, YMD'");
        // The real info call deliberately fails when preload/shared memory is absent.
        const nativeInfo = await oracle.query(
          `SELECT dealloc::text,stats_reset::text FROM "stats ""shared""".pg_stat_statements_info()`,
        );
        await oracle.query("SELECT count(*) FROM statement_items WHERE id > 0");
        const identity = (
          await oracle.query(
            "SELECT (SELECT oid FROM pg_roles WHERE rolname=current_user)::int8::text AS userid, (SELECT oid FROM pg_database WHERE datname=current_database())::int8::text AS dbid",
          )
        ).rows[0];
        const native = await oracle.query(
          `SELECT ROW(s.*)::text AS record FROM "stats ""shared""".pg_stat_statements AS s WHERE s.userid=$1::oid AND s.dbid=$2::oid AND s.query LIKE 'SELECT count(*) FROM statement_items WHERE id >%'`,
          [identity.userid, identity.dbid],
        );
        expect(native.rows.length).toBe(1);
        const expected = statementCodec.decode(native.rows[0].record);
        expect(expected.userid).toBe(Number(identity.userid));
        expect(expected.dbid).toBe(Number(identity.dbid));
        expect(expected.toplevel).toBe(true);
        expect(expected.calls).toBe(1n);
        expect(expected.queryid).not.toBeNull();
        let escaped: StatementStatisticsSession | undefined;
        const observed = await withPgStatStatements(url, statementStatisticsDescriptor, async (session) => {
          escaped = session;
          const prerequisites = await session.prerequisites();
          expect(prerequisites.computeQueryId).not.toBe("off");
          expect(prerequisites.resetExecutable).toBe(true);
          const routine = (await session.statistics()).find(
            (row) =>
              row.dbid === Number(identity.dbid) &&
              row.userid === Number(identity.userid) &&
              row.queryid === expected.queryid,
          )!;
          const view = (await session.statementView()).find(
            (row) =>
              row.dbid === Number(identity.dbid) &&
              row.userid === Number(identity.userid) &&
              row.queryid === expected.queryid,
          )!;
          expect(routine).toEqual(expected);
          expect(view).toEqual(expected);
          expect((await session.statistics(false)).every((row) => row.query === null)).toBe(true);
          const info = await session.info(),
            viewInfo = await session.infoView();
          const sameResetInstant = await oracle.query<{ equal: boolean }>(
            "SELECT $1::timestamptz IS NOT DISTINCT FROM $2::timestamptz AS equal",
            [info.stats_reset.text, nativeInfo.rows[0].stats_reset],
          );
          expect(sameResetInstant.rows[0]?.equal).toBe(true);
          expect(viewInfo.stats_reset).toEqual(info.stats_reset);
          expect(info.dealloc).toBeGreaterThanOrEqual(0n);
          return { routine, view, info, viewInfo };
        });
        expect(observed.resets).toEqual([]);
        await expect(escaped!.info()).rejects.toThrow(/inactive|owner/);
        // Application expressions use the invocation connection and retain external-state contracts.
        const stats = createPgStatStatements_1_12(statementStatisticsDescriptor);
        const rows = stats.statementRows(true, "shared_stats");
        let externalContracts = 0;
        const applicationRows = await withExtensionSqlExecution(
          {
            check: (contract) => {
              if (contract.member.startsWith("routine:$extension:pg_stat_statements.")) {
                expect(contract.observability).toBe("external");
                externalContracts++;
              }
            },
          },
          () => connection.transaction((db) => db.select(rows.columns).from(rows.from)),
        );
        expect(externalContracts).toBeGreaterThan(0);
        expect(applicationRows.find((row) => row.queryid === expected.queryid && row.dbid === expected.dbid)).toEqual(
          expected,
        );
        // Scalar native projections and catalog types are independent of composite field order/decoding.
        const scalar = (
          await oracle.query(
            `SELECT ${Object.keys(statementFields)
              .map((name) => `${name === "toplevel" ? `"${name}"` : `"${name}"::text`} AS "${name}"`)
              .join(
                ",",
              )} FROM "stats ""shared""".pg_stat_statements WHERE userid=$1::oid AND dbid=$2::oid AND queryid=$3::int8`,
            [identity.userid, identity.dbid, expected.queryid!.toString()],
          )
        ).rows[0];
        for (const [name, codec] of Object.entries(statementFields)) {
          await prove(`view column:"$extension:pg_stat_statements".pg_stat_statements.${name}`, async () => {
            const nativeType = (
              await oracle.query(
                "SELECT format_type(atttypid,NULL) AS type FROM pg_attribute WHERE attrelid=$1::regclass AND attname=$2",
                ['"stats ""shared""".pg_stat_statements', name],
              )
            ).rows[0].type;
            assert(codec.sqlType);
            const expectedType = (
              await oracle.query("SELECT $1::regtype::text AS type", [`${codec.sqlType.schema}.${codec.sqlType.name}`])
            ).rows[0].type;
            expect(nativeType).toBe(expectedType);
            const actual = Object.entries(observed.value.view).find(([field]) => field === name);
            assert(actual);
            expect(actual[1]).toEqual(codec.decode(scalar[name]));
          });
        }
        await prove("routine:$extension:pg_stat_statements.pg_stat_statements(pg_catalog.bool)", () => {
          expect(observed.value.routine).toEqual(expected);
          expect(applicationRows.find((row) => row.queryid === expected.queryid && row.dbid === expected.dbid)).toEqual(
            expected,
          );
        });
        await prove('view:"$extension:pg_stat_statements".pg_stat_statements', () =>
          expect(observed.value.view).toEqual(expected),
        );
        await prove("type:$extension:pg_stat_statements.pg_stat_statements", async () => {
          const native = (
            await oracle.query(
              `SELECT s::text AS record,pg_typeof(s)::text AS type FROM "stats ""shared""".pg_stat_statements s WHERE userid=$1::oid AND dbid=$2::oid AND queryid=$3::int8`,
              [identity.userid, identity.dbid, expected.queryid!.toString()],
            )
          ).rows[0];
          expect(native.type).toBe('"stats ""shared""".pg_stat_statements');
          expect(statementCodec.decode(native.record)).toEqual(expected);
        });
        const infoNative = (
          await oracle.query(
            `SELECT i::text AS record,pg_typeof(i)::text AS type,dealloc::text,stats_reset::text FROM "stats ""shared""".pg_stat_statements_info i`,
          )
        ).rows[0];
        const infoExpected = statementInfoCodec.decode(infoNative.record);
        for (const [name, codec] of Object.entries(statementInfoFields))
          await prove(`view column:"$extension:pg_stat_statements".pg_stat_statements_info.${name}`, async () => {
            assert(codec.sqlType);
            const nativeType = (
              await oracle.query(
                "SELECT format_type(atttypid,NULL) AS type FROM pg_attribute WHERE attrelid=$1::regclass AND attname=$2",
                ['"stats ""shared""".pg_stat_statements_info', name],
              )
            ).rows[0].type;
            const expectedType = (
              await oracle.query("SELECT $1::regtype::text AS type", [`${codec.sqlType.schema}.${codec.sqlType.name}`])
            ).rows[0].type;
            expect(nativeType).toBe(expectedType);
            const actual = Object.entries(observed.value.viewInfo).find(([field]) => field === name);
            assert(actual);
            expect(actual[1]).toEqual(codec.decode(infoNative[name]));
          });
        await prove("routine:$extension:pg_stat_statements.pg_stat_statements_info()", () =>
          expect(observed.value.info).toEqual(infoExpected),
        );
        await prove('view:"$extension:pg_stat_statements".pg_stat_statements_info', () =>
          expect(observed.value.viewInfo).toEqual(infoExpected),
        );
        await prove("type:$extension:pg_stat_statements.pg_stat_statements_info", () => {
          expect(infoNative.type).toBe('"stats ""shared""".pg_stat_statements_info');
          expect(infoExpected).toEqual(observed.value.info);
        });
        await prove("type:$extension:pg_stat_statements._pg_stat_statements", async () => {
          const native = (
            await oracle.query(
              `SELECT array_fill(s,ARRAY[2],ARRAY[-2])::text AS bounded,ARRAY[NULL,s]::text AS nullable FROM "stats ""shared""".pg_stat_statements s WHERE userid=$1::oid AND dbid=$2::oid AND queryid=$3::int8`,
              [identity.userid, identity.dbid, expected.queryid!.toString()],
            )
          ).rows[0];
          expect(statementArrayCodec.decode(native.bounded)).toEqual({
            dimensions: [{ lowerBound: -2, length: 2 }],
            values: [expected, expected],
          });
          expect(statementArrayCodec.decode(native.nullable)).toEqual({
            dimensions: [{ lowerBound: 1, length: 2 }],
            values: [null, expected],
          });
        });
        await prove("type:$extension:pg_stat_statements._pg_stat_statements_info", async () => {
          const native = (
            await oracle.query(
              `SELECT array_fill(i,ARRAY[2],ARRAY[-2])::text AS bounded,ARRAY[NULL,i]::text AS nullable FROM "stats ""shared""".pg_stat_statements_info i`,
            )
          ).rows[0];
          expect(statementInfoArrayCodec.decode(native.bounded)).toEqual({
            dimensions: [{ lowerBound: -2, length: 2 }],
            values: [infoExpected, infoExpected],
          });
          expect(statementInfoArrayCodec.decode(native.nullable)).toEqual({
            dimensions: [{ lowerBound: 1, length: 2 }],
            values: [null, infoExpected],
          });
        });
        for (const name of ["pg_stat_statements", "pg_stat_statements_info"])
          await prove(`rule:"_RETURN" on "$extension:pg_stat_statements".${name}`, async () => {
            const native = (
              await oracle.query(
                "SELECT rulename,ev_type,is_instead,pg_get_ruledef(oid) AS definition FROM pg_rewrite WHERE ev_class=$1::regclass AND rulename='_RETURN'",
                [`"stats ""shared""".${name}`],
              )
            ).rows[0];
            expect(native.rulename).toBe("_RETURN");
            expect(native.ev_type).toBe("1");
            expect(native.is_instead).toBe(true);
            expect(native.definition).toContain(
              name === "pg_stat_statements" ? "pg_stat_statements(true)" : "pg_stat_statements_info()",
            );
          });
        await prove(
          "routine:$extension:pg_stat_statements.pg_stat_statements_reset(pg_catalog.oid,pg_catalog.oid,pg_catalog.int8,pg_catalog.bool)",
          async () => {
            // Restrict reset to this fixture's exact role/database/query: it still affects server shared memory.
            try {
              await withPgStatStatements(url, statementStatisticsDescriptor, async (session) => {
                await session.reset({
                  userId: Number(identity.userid),
                  databaseId: Number(identity.dbid),
                  queryId: expected.queryid!,
                  minmaxOnly: true,
                });
                throw new Error("after shared reset");
              });
              throw new Error("Expected reset callback failure");
            } catch (cause) {
              if (!(cause instanceof StatementStatisticsOperationError)) throw cause;
              expect(cause.completion).toBe("rolled-back");
              expect(cause.resets[0]).toMatchObject({ state: "acknowledged", rollback: "not-transactional" });
            }
            const resetNative = (
              await oracle.query(
                `SELECT calls::text,min_exec_time,max_exec_time FROM "stats ""shared""".pg_stat_statements WHERE userid=$1::oid AND dbid=$2::oid AND queryid=$3::bigint`,
                [identity.userid, identity.dbid, expected.queryid!.toString()],
              )
            ).rows[0];
            expect(resetNative.calls).toBe("1");
            expect(resetNative.min_exec_time).toBe(0);
            expect(resetNative.max_exec_time).toBe(0);
            const full = await withPgStatStatements(url, statementStatisticsDescriptor, (session) =>
              session.reset({
                userId: Number(identity.userid),
                databaseId: Number(identity.dbid),
                queryId: expected.queryid!,
              }),
            );
            expect(full.resets[0]!.state).toBe("acknowledged");
            expect(
              (
                await oracle.query(
                  `SELECT count(*)::int AS n FROM "stats ""shared""".pg_stat_statements WHERE userid=$1::oid AND dbid=$2::oid AND queryid=$3::bigint`,
                  [identity.userid, identity.dbid, expected.queryid!.toString()],
                )
              ).rows[0].n,
            ).toBe(0);
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
            roleAttempted = true;
            await oracle.query(`CREATE ROLE "${role}" NOLOGIN; GRANT "${role}" TO CURRENT_USER WITH SET TRUE`);
            await oracle.query(
              `GRANT USAGE ON SCHEMA "stats ""shared""" TO "${role}"; GRANT SELECT ON ALL TABLES IN SCHEMA "stats ""shared""" TO "${role}"`,
            );
            await oracle.query(`SET ROLE "${role}"`);
            const redacted = await oracle.query(
              `SELECT queryid,query,calls::text FROM "stats ""shared""".pg_stat_statements(true) WHERE userid=$1::oid AND dbid=$2::oid`,
              [identity.userid, identity.dbid],
            );
            expect(redacted.rows.length).toBeGreaterThan(0);
            expect(redacted.rows.every((row) => row.queryid === null && row.query === "<insufficient privilege>")).toBe(
              true,
            );
            const noText = await oracle.query(
              `SELECT queryid,query FROM "stats ""shared""".pg_stat_statements(false) WHERE userid=$1::oid AND dbid=$2::oid`,
              [identity.userid, identity.dbid],
            );
            expect(noText.rows.every((row) => row.queryid === null && row.query === null)).toBe(true);
            await expect(
              oracle.query(`SELECT "stats ""shared""".pg_stat_statements_reset($1::oid,$2::oid,0,false)`, [
                identity.userid,
                identity.dbid,
              ]),
            ).rejects.toThrow(/permission denied/);
            await oracle.query("RESET ROLE");
          },
        );
      } finally {
        try {
          await oracle.query("RESET ROLE");
          if (roleAttempted) {
            const exists = (await oracle.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount;
            if (exists) await oracle.query(`DROP OWNED BY "${role}"`);
            await oracle.query(`DROP ROLE IF EXISTS "${role}"`);
          }
        } finally {
          try {
            await oracle.end();
          } finally {
            await connection.close();
          }
        }
      }
    });
  },
  120000,
);
