import { expect } from "bun:test";
import pg from "pg";
import * as v from "valibot";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  plpgsqlCheckDependenciesProofCase,
  plpgsqlCheckDiagnosticsProofCase,
  plpgsqlCheckSessionProofCase,
  plpgsqlCheckSharedProfileProofCase,
} from "../fixtures/plpgsql_check-proof-cases";
import {
  plpgsqlCheckDescriptor,
  plpgsqlCheckInstall,
  plpgsqlCheckSchema,
  withPreloadedPlpgsqlCheckDatabase,
} from "../fixtures/plpgsql_check";
import {
  PlpgsqlCheckOperationError,
  withPlpgsqlCheck,
  type PlpgsqlCheckSession,
} from "../../../apps/loom/src/tooling/extensions/operations/plpgsql_check";
import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";

const signatureMember = (name: string) => `routine:$extension:plpgsql_check.${name}(pg_catalog.regprocedure`;
const nameMember = (name: string) => `routine:$extension:plpgsql_check.${name}(pg_catalog.text`;
/** Witness the exact captured overload; the assertion performs the native call itself. */
function witness<Value>(
  definition: ExtensionProofCase,
  prefix: string,
  assertion: () => Promise<Value>,
): Promise<Value> {
  const claims = definition.claims.filter((claim) => claim.member.startsWith(prefix));
  expect(claims).toHaveLength(1);
  return extensionProofWitness({ ...claims[0]!, schema: plpgsqlCheckSchema }, assertion);
}
const routine = (name: string) => `routine:$extension:plpgsql_check.${name}(`;
/** Independent oracle rendering: PostgreSQL's own JSON, with oid as a JSON number like the oid codec's domain. */
async function oracleRows(oracle: pg.Client, sql: string) {
  const oid = /dependency_tb\(/.test(sql) ? " || jsonb_build_object('oid', s.oid::pg_catalog.int8)" : "";
  const result = await oracle.query<{ row: object }>(`SELECT to_jsonb(s)${oid} AS row FROM ${sql} AS s`);
  return result.rows.map((entry) => entry.row);
}
const quoted = `"${plpgsqlCheckSchema}"`;
const postgresArray = v.object({ dimensions: v.array(v.object({})), values: v.array(v.any()) });
/** Decoded rows in JSON terms: int8 as numbers and native arrays as their element values. */
function normalise(rows: readonly object[]) {
  return JSON.parse(
    JSON.stringify(rows, (_key, value) =>
      v.is(v.bigint(), value) ? Number(value) : v.is(postgresArray, value) ? value.values : value,
    ),
  );
}
async function connect(url: string) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query("SET search_path = pg_catalog");
  return client;
}

extensionProofTest(
  plpgsqlCheckDiagnosticsProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = await connect(url);
      try {
        await oracle.query(plpgsqlCheckInstall);
        await observeExtensionProofDatabase(url, plpgsqlCheckDiagnosticsProofCase.id, "plpgsql_check");
        await withPlpgsqlCheck(url, plpgsqlCheckDescriptor, async (session) => {
          await witness(plpgsqlCheckDiagnosticsProofCase, signatureMember("plpgsql_check_function"), async () => {
            expect(await session.check({ signature: "public.check_broken(integer)" })).toEqual(
              (
                await oracle.query(`SELECT * FROM ${quoted}.plpgsql_check_function('public.check_broken(integer)')`)
              ).rows.map((row) => row.plpgsql_check_function),
            );
            const json = await session.check({ signature: "public.check_broken(integer)" }, { format: "json" });
            expect(json).toHaveLength(1);
            expect(JSON.parse(json[0]!).issues[0]).toMatchObject({ level: "error", sqlState: "42703" });
            const xml = await session.check({ signature: "public.check_broken(integer)" }, { format: "xml" });
            expect(xml[0]).toContain("<Sqlstate>42703</Sqlstate>");
            // Explicit trigger relation and every warning class reach the native named arguments.
            const trigger = await session.check(
              { signature: "public.check_trigger()" },
              { relation: { schema: "public", name: "check_items" }, allWarnings: true },
            );
            expect(trigger.join("\n")).toContain('record "new" has no field "zz"');
          });
          await witness(plpgsqlCheckDiagnosticsProofCase, nameMember("plpgsql_check_function"), async () => {
            expect(
              await session.check({ name: "public.check_broken" }, { format: "text", fatalErrors: false }),
            ).toEqual(
              (
                await oracle.query(
                  `SELECT * FROM ${quoted}.plpgsql_check_function('public.check_broken', format => 'text', fatal_errors => false)`,
                )
              ).rows.map((row) => row.plpgsql_check_function),
            );
          });
          await witness(plpgsqlCheckDiagnosticsProofCase, signatureMember("plpgsql_check_function_tb"), async () => {
            const options = { fatalErrors: false, allWarnings: true, performanceWarnings: true } as const;
            const issues = await session.checkTable({ signature: "public.check_broken(integer)" }, options);
            expect(normalise(issues)).toEqual(
              await oracleRows(
                oracle,
                `${quoted}.plpgsql_check_function_tb('public.check_broken(integer)', fatal_errors => false, all_warnings => true, performance_warnings => true)`,
              ),
            );
            expect(issues[0]).toMatchObject({ functionid: "public.check_broken", lineno: 1, sqlstate: "42703" });
            expect(issues.some((issue) => issue.lineno === null && issue.level === "performance")).toBe(true);
            const trigger = await session.checkTable(
              { signature: "public.check_trigger()" },
              { relation: { schema: "public", name: "check_items" } },
            );
            expect(trigger.map((issue) => issue.message)).toEqual(['record "new" has no field "zz"']);
          });
          await witness(plpgsqlCheckDiagnosticsProofCase, nameMember("plpgsql_check_function_tb"), async () => {
            expect(normalise(await session.checkTable({ name: "public.check_broken" }))).toEqual(
              await oracleRows(oracle, `${quoted}.plpgsql_check_function_tb('public.check_broken')`),
            );
          });
          await witness(plpgsqlCheckDiagnosticsProofCase, routine("plpgsql_check_pragma"), async () => {
            expect(await session.pragma(["disable:check"])).toBe(1);
            expect(await session.pragma([])).toBe(1);
            expect(await session.pragma(null)).toBe(0);
            // A body pragma suppresses the missing-field error; native still reports the then-unread record.
            const pragmaIssues = await session.checkTable({ signature: "public.check_pragma()" });
            expect(normalise(pragmaIssues)).toEqual(
              await oracleRows(oracle, `${quoted}.plpgsql_check_function_tb('public.check_pragma()')`),
            );
            expect(pragmaIssues.map((issue) => [issue.level, issue.sqlstate, issue.message])).toEqual([
              ["warning", "00000", 'unused variable "r"'],
            ]);
          });
        });
        // A native error aborts and rolls back the owned transaction; each probe therefore owns one operation.
        const probes: readonly (readonly [(session: PlpgsqlCheckSession) => Promise<object>, RegExp])[] = [
          [
            (session: PlpgsqlCheckSession) => session.check({ signature: "public.check_sql()" }),
            /not a plpgsql function/,
          ],
          [
            (session: PlpgsqlCheckSession) => session.checkTable({ signature: "public.check_trigger()" }),
            /missing trigger relation/,
          ],
          // Unqualified names resolve natively against the operator session's pg_catalog search_path.
          [(session: PlpgsqlCheckSession) => session.check({ name: "check_broken" }), /does not exist/],
        ];
        for (const [probe, message] of probes) {
          const error = await withPlpgsqlCheck(url, plpgsqlCheckDescriptor, probe).catch((cause) => cause);
          expect(error).toBeInstanceOf(PlpgsqlCheckOperationError);
          if (!(error instanceof PlpgsqlCheckOperationError)) throw error;
          expect(error.completion).toBe("rolled-back");
          expect(String(error.cause)).toMatch(message);
        }
      } finally {
        await oracle.end();
      }
    });
  },
  60000,
);

extensionProofTest(
  plpgsqlCheckDependenciesProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = await connect(url);
      try {
        await oracle.query(plpgsqlCheckInstall);
        await observeExtensionProofDatabase(url, plpgsqlCheckDependenciesProofCase.id, "plpgsql_check");
        await oracle.query(
          "CREATE FUNCTION public.check_dependent() RETURNS int LANGUAGE plpgsql AS $$ BEGIN PERFORM public.check_profiled(1); RETURN (SELECT count(*) FROM public.check_items); END $$",
        );
        await withPlpgsqlCheck(url, plpgsqlCheckDescriptor, async (session) => {
          for (const [name, method] of [
            ["plpgsql_show_dependency_tb", "dependencies"],
            ["__plpgsql_show_dependency_tb", "nativeDependencies"],
          ] as const) {
            await witness(plpgsqlCheckDependenciesProofCase, signatureMember(name), async () => {
              const rows = await session[method]({ signature: "public.check_dependent()" });
              expect(normalise(rows)).toEqual(
                await oracleRows(oracle, `${quoted}.${name}('public.check_dependent()')`),
              );
              expect(rows.map((row) => [row.type, row.schema, row.name])).toHaveLength(2);
              expect(rows.map((row) => [row.type, row.schema, row.name])).toEqual(
                expect.arrayContaining([
                  ["FUNCTION", "public", "check_profiled"],
                  ["RELATION", "public", "check_items"],
                ]),
              );
              expect(rows.every((row) => row.oid !== null && row.oid > 0)).toBe(true);
            });
            await witness(plpgsqlCheckDependenciesProofCase, nameMember(name), async () => {
              expect(
                normalise(
                  await session[method]({ name: "public.check_dependent" }, { anyElementType: "pg_catalog.text" }),
                ),
              ).toEqual(
                await oracleRows(
                  oracle,
                  `${quoted}.${name}('public.check_dependent', anyelememttype => 'pg_catalog.text')`,
                ),
              );
            });
          }
        });
      } finally {
        await oracle.end();
      }
    });
  },
  60000,
);

async function profileReads(
  definition: ExtensionProofCase,
  session: PlpgsqlCheckSession,
  oracle: pg.Client,
  executed: boolean,
) {
  const target = { signature: "public.check_profiled(integer)" } as const;
  for (const [name, method] of [
    ["plpgsql_profiler_function_tb", "profile"],
    ["plpgsql_profiler_function_statements_tb", "profileStatements"],
  ] as const) {
    await witness(definition, signatureMember(name), async () => {
      const rows = await session[method](target);
      expect(normalise(rows)).toEqual(await oracleRows(oracle, `${quoted}.${name}('public.check_profiled(integer)')`));
      if (executed) expect(rows.length).toBeGreaterThan(0);
    });
    await witness(definition, nameMember(name), async () => {
      expect(normalise(await session[method]({ name: "public.check_profiled" }))).toEqual(
        await oracleRows(oracle, `${quoted}.${name}('public.check_profiled')`),
      );
    });
  }
  await witness(definition, routine("plpgsql_profiler_functions_all"), async () => {
    const rows = await session.profiledFunctions();
    expect(normalise(rows)).toEqual(await oracleRows(oracle, `${quoted}.plpgsql_profiler_functions_all()`));
    if (executed) {
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ funcoid: "public.check_profiled(integer)", exec_count: 2n });
    } else expect(rows).toEqual([]);
  });
  for (const [name, method] of [
    ["plpgsql_coverage_statements", "statementCoverage"],
    ["plpgsql_coverage_branches", "branchCoverage"],
  ] as const) {
    await witness(definition, signatureMember(name), async () => {
      const value = await session[method](target);
      const expected = (await oracle.query(`SELECT ${quoted}.${name}('public.check_profiled(integer)') AS v`)).rows[0]
        .v;
      expect(value).toBe(expected);
      if (!executed) expect(value).toBe(0);
    });
    await witness(definition, nameMember(name), async () => {
      expect(await session[method]({ name: "public.check_profiled" })).toBe(
        (await oracle.query(`SELECT ${quoted}.${name}('public.check_profiled') AS v`)).rows[0].v,
      );
    });
  }
}

extensionProofTest(
  plpgsqlCheckSessionProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = await connect(url);
      try {
        await oracle.query(plpgsqlCheckInstall);
        await observeExtensionProofDatabase(url, plpgsqlCheckSessionProofCase.id, "plpgsql_check");
        const preload = (await oracle.query("SELECT current_setting('shared_preload_libraries') AS v")).rows[0].v;
        expect(
          String(preload)
            .split(",")
            .map((entry) => entry.trim()),
        ).not.toContain("plpgsql_check");
        // Backend-local profiles: an application execution elsewhere is invisible to the operator and the oracle.
        const application = await connect(url);
        try {
          await application.query(`SELECT ${quoted}.plpgsql_check_profiler(true); SELECT public.check_profiled(0)`);
          const result = await withPlpgsqlCheck(url, plpgsqlCheckDescriptor, async (session) => {
            await witness(plpgsqlCheckSessionProofCase, routine("plpgsql_check_profiler"), async () => {
              expect(await session.profiler()).toBe(false);
              expect(await session.profiler(true)).toBe(true);
              expect(await session.profiler(null)).toBe(true);
            });
            await witness(plpgsqlCheckSessionProofCase, routine("plpgsql_check_tracer"), async () => {
              expect(await session.tracer()).toBe(false);
              expect(await session.tracer({ enable: true, verbosity: "verbose" })).toBe(true);
              expect(await session.tracer({ verbosity: "terse" })).toBe(true);
            });
            await witness(plpgsqlCheckSessionProofCase, routine("plpgsql_profiler_install_fake_queryid_hook"), () =>
              session.installFakeQueryIdHook(),
            );
            await witness(plpgsqlCheckSessionProofCase, routine("plpgsql_profiler_remove_fake_queryid_hook"), () =>
              session.removeFakeQueryIdHook(),
            );
            await profileReads(plpgsqlCheckSessionProofCase, session, oracle, false);
            await witness(plpgsqlCheckSessionProofCase, routine("plpgsql_profiler_reset"), () =>
              session.resetProfile({ signature: "public.check_profiled(integer)" }),
            );
            await witness(plpgsqlCheckSessionProofCase, routine("plpgsql_profiler_reset_all"), () =>
              session.resetAllProfiles(),
            );
          });
          expect(result.effects).toEqual([
            {
              operation: "reset",
              signature: "public.check_profiled(integer)",
              state: "acknowledged",
              rollback: "not-transactional",
            },
            { operation: "reset-all", signature: null, state: "acknowledged", rollback: "not-transactional" },
          ]);
          // Operator resets were backend-local: the application backend still holds its own profile.
          expect(
            (await application.query(`SELECT count(*)::int AS n FROM ${quoted}.plpgsql_profiler_functions_all()`))
              .rows[0].n,
          ).toBe(1);
        } finally {
          await application.end();
        }
      } finally {
        await oracle.end();
      }
    });
  },
  60000,
);

extensionProofTest(
  plpgsqlCheckSharedProfileProofCase,
  async () => {
    await withPreloadedPlpgsqlCheckDatabase(async (url) => {
      const oracle = await connect(url);
      try {
        await oracle.query(plpgsqlCheckInstall);
        await observeExtensionProofDatabase(url, plpgsqlCheckSharedProfileProofCase.id, "plpgsql_check");
        const application = await connect(url);
        try {
          await application.query(
            `SELECT ${quoted}.plpgsql_check_profiler(true); SELECT public.check_profiled(0); SELECT public.check_profiled(1)`,
          );
        } finally {
          await application.end();
        }
        const result = await withPlpgsqlCheck(url, plpgsqlCheckDescriptor, async (session) => {
          await witness(plpgsqlCheckSharedProfileProofCase, routine("plpgsql_check_profiler"), async () => {
            // The application's setting stayed in its own backend; shared data does not imply a shared setting.
            expect(await session.profiler()).toBe(false);
          });
          await profileReads(plpgsqlCheckSharedProfileProofCase, session, oracle, true);
          expect(await session.statementCoverage({ signature: "public.check_profiled(integer)" })).toBe(1);
          expect(await session.branchCoverage({ signature: "public.check_profiled(integer)" })).toBe(1);
          await witness(plpgsqlCheckSharedProfileProofCase, routine("plpgsql_profiler_reset"), async () => {
            await session.resetProfile({ signature: "public.check_profiled(integer)" });
            expect(await session.profiledFunctions()).toEqual([]);
          });
          await witness(plpgsqlCheckSharedProfileProofCase, routine("plpgsql_profiler_reset_all"), () =>
            session.resetAllProfiles(),
          );
        });
        expect(result.effects.map((effect) => [effect.operation, effect.state])).toEqual([
          ["reset", "acknowledged"],
          ["reset-all", "acknowledged"],
        ]);
        // Shared resets are not transactional: a failed callback rolls back SQL but keeps the cleared profile.
        await oracle.query(`SELECT ${quoted}.plpgsql_check_profiler(true); SELECT public.check_profiled(0)`);
        const failure = new Error("callback failed after reset");
        const rejected = await withPlpgsqlCheck(url, plpgsqlCheckDescriptor, async (session) => {
          await session.resetAllProfiles();
          throw failure;
        }).catch((error) => error);
        expect(rejected).toBeInstanceOf(PlpgsqlCheckOperationError);
        if (!(rejected instanceof PlpgsqlCheckOperationError)) throw rejected;
        expect(rejected.cause).toBe(failure);
        expect(rejected.completion).toBe("rolled-back");
        expect(rejected.effects).toEqual([
          { operation: "reset-all", signature: null, state: "acknowledged", rollback: "not-transactional" },
        ]);
        expect(
          (await oracle.query(`SELECT count(*)::int AS n FROM ${quoted}.plpgsql_profiler_functions_all()`)).rows[0].n,
        ).toBe(0);
      } finally {
        await oracle.end();
      }
    });
  },
  60000,
);
