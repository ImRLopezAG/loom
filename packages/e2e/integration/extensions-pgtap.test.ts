import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";
import type { PgtapCodecName, PgtapOutput } from "../../../apps/loom/src/core/extensions/adapters/pgtap-codecs";
import {
  createPgtap_1_3_3,
  pgtapRoutineSpecs,
  type PgtapMember,
  type PgtapAnyResult,
} from "../../../apps/loom/src/core/extensions/adapters/pgtap";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { withPgtap, type PgtapSession } from "../../../apps/loom/src/tooling/extensions/operations/pgtap";
import { pgtapCaseArguments, pgtapNativeCases } from "../fixtures/pgtap-cases";
import { pgtapDescriptor, pgtapInstall, withPgtapDatabase } from "../fixtures/pgtap";

test("all exact query overloads and captured catalog views execute through Kello decoding", async () => {
  await withPgtapDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      connectionString: url,
      schema,
      relations: defineRelations(schema.tables),
    });
    const api = createPgtap_1_3_3(pgtapDescriptor);
    try {
      await client.query(pgtapInstall);
      await client.query("SET search_path = pg_catalog");
      let calls = 0;
      for (const entry of pgtapNativeCases) {
        // SAFETY: the baseline exact member set is checked against the native manifest in the unit inventory test.
        const id = entry.id as PgtapMember;
        const spec = pgtapRoutineSpecs[id];
        if (!spec.query) continue;
        const values: readonly unknown[] =
          spec.name === "_pg_sv_table_accessible"
            ? Object.values(
                (
                  await client.query(
                    "SELECT 'public'::regnamespace::oid AS schema_oid, 'public.fixture'::regclass::oid AS table_oid",
                  )
                ).rows[0]!,
              )
            : entry.values;
        // SAFETY: the independent native fixture selects the exact captured member and its typed codec inputs.
        const call = api.sql.overloads[id as keyof typeof api.sql.overloads] as (...args: readonly unknown[]) => SQL;
        const expression = call(...pgtapCaseArguments(id, values));
        const result = await connection.transaction(async (db) => {
          await db.execute(sql`SET LOCAL search_path = pg_catalog`);
          return db.select({ value: expression }).from(sql`(values (1)) as fixture(value)`);
        });
        const native = await client.query<{ value: unknown }>(entry.sql, [...values]);
        const codec = api.codecs[spec.result];
        const expected = native.rows.map((row: { value: unknown }) =>
          codec.decode(spec.result === "bool" && v.is(v.string(), row.value) ? row.value === "true" : row.value),
        );
        expect(
          result.map((row) => row.value),
          id,
        ).toEqual(expected);
        calls++;
      }
      expect(calls).toBe(102);
      const foreign = api.views.foreignKeys("fk");
      const foreignRows = await connection.transaction((db) => db.select(foreign.columns).from(foreign.from));
      expect(foreignRows.some((row) => row.fk_table_name === "fixture" && row.pk_table_name === "parent")).toBe(true);
      const functionRows = await withPgtap(url, pgtapDescriptor, (session) => session.views.functions());
      expect(functionRows.value.some((row) => row?.name === "fixture_fn" && row.args === "integer")).toBe(true);
    } finally {
      await connection.close();
      await client.end();
    }
  });
}, 120_000);

test("all 1079 operator overloads preserve native results or the exact native ambiguity", async () => {
  await withPgtapDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    const api = createPgtap_1_3_3(pgtapDescriptor);
    try {
      await client.query(pgtapInstall);
      let returned = 0,
        ambiguous = 0;
      // Separate owned native transactions release temporary-object locks while still invoking every member.
      for (let offset = 0; offset < pgtapNativeCases.length; offset += 100) {
        await withPgtap(url, pgtapDescriptor, async (session) => {
          for (const entry of pgtapNativeCases.slice(offset, offset + 100)) {
            if (entry.outcome === "captured-native-transfer") continue;
            // SAFETY: the baseline exact member set is checked against the native manifest in the unit inventory test.
            const id = entry.id as PgtapMember;
            const spec = pgtapRoutineSpecs[id];
            const setup = [
              "CLOSE ALL",
              "DROP TABLE IF EXISTS pg_temp.__tcache__, pg_temp.have, pg_temp.want, pg_temp.fixture, pg_temp.fixture_temp",
              "DROP SEQUENCE IF EXISTS pg_temp.__tcache___id_seq, pg_temp.__tresults___numb_seq",
              ...(!["plan", "no_plan", "_runner", "runtests"].includes(spec.name) ? ["SELECT tap.no_plan()"] : []),
              ...(["finish", "check_test"].includes(spec.name) ? ["SELECT tap.ok(true, 'fixture')"] : []),
              ...(spec.name === "todo_end" ? ["SELECT tap.todo_start('fixture')"] : []),
              "DECLARE fixture_cursor CURSOR FOR SELECT 1",
              "DECLARE fixture_cursor2 CURSOR FOR SELECT 1",
              ...(["_do_ne", "_docomp", "_temptypes"].includes(spec.name)
                ? ["CREATE TEMP TABLE have AS SELECT 1", "CREATE TEMP TABLE want AS SELECT 1"]
                : []),
            ].join("; ");
            const values: readonly unknown[] =
              spec.name === "_pg_sv_table_accessible"
                ? Object.values(
                    (
                      await client.query(
                        "SELECT 'public'::regnamespace::oid AS schema_oid, 'public.fixture'::regclass::oid AS table_oid",
                      )
                    ).rows[0]!,
                  )
                : entry.values;
            await client.query("BEGIN");
            let native: readonly PgtapOutput<PgtapCodecName>[];
            try {
              await client.query("SET LOCAL search_path = tap, public, pg_catalog, pg_temp");
              await client.query(setup);
              const result = await client.query<{ value: unknown }>(entry.sql, [...values]);
              native = result.rows.map((row: { value: unknown }) =>
                api.codecs[spec.result].decode(
                  spec.result === "bool" && v.is(v.string(), row.value) ? row.value === "true" : row.value,
                ),
              );
            } finally {
              await client.query("ROLLBACK");
            }
            // This captured SQL-taking helper executes fixture setup without adding TAP test-state results.
            await session.call(
              "routine:$extension:pgtap._time_trials(pg_catalog.text,pg_catalog.int4,pg_catalog.numeric)",
              setup,
              1,
              "1",
            );
            // SAFETY: this native fixture selects the captured member and validated tuple; its result codec determines the union.
            const call = session.routines[id] as (...args: readonly unknown[]) => Promise<PgtapAnyResult>;
            const value = await call(...pgtapCaseArguments(id, values));
            if (spec.name === "_time_trials") {
              expect(value).toBeArray();
              expect(v.parse(v.array(v.strictObject({ a_time: v.string() })), value)).toHaveLength(native.length);
            } else if (spec.name === "performs_ok" || spec.name === "performs_within") {
              expect(v.parse(v.string(), value), id).toBeString();
              expect(v.parse(v.string(), value), id).toMatch(/^(?:not )?ok /);
            } else {
              // Backend-local temporary schema numbers are expected to differ between independent native sessions.
              const normalize = (result: PgtapOutput<PgtapCodecName> | readonly PgtapOutput<PgtapCodecName>[]) =>
                JSON.stringify(result).replace(/pg_temp_\d+/g, "pg_temp_owned");
              if (!spec.set) expect(native, id).toHaveLength(1);
              expect(normalize(value), id).toEqual(normalize(spec.set ? native : native[0]!));
            }
            returned++;
            if (returned % 100 === 0) console.log(`pgTAP native operator overloads: ${returned}/1078`);
          }
        });
      }
      const ambiguity = pgtapNativeCases.find((entry) => entry.outcome === "captured-native-transfer")!;
      await assert.rejects(
        withPgtap(url, pgtapDescriptor, async (session) => {
          // SAFETY: the source-checked ambiguity baseline names this exact captured callable member.
          const id = ambiguity.id as PgtapMember;
          // SAFETY: the independent native fixture supplies the exact codec-validated member tuple.
          return (session.routines[id] as (...args: readonly unknown[]) => Promise<PgtapAnyResult>)(
            ...pgtapCaseArguments(id, ambiguity.values),
          );
        }),
        (error) => {
          expect(error).toMatchObject({ completion: "rolled-back", cause: { code: "42725" } });
          return true;
        },
      );
      ambiguous++;
      expect({ returned, ambiguous }).toEqual({ returned: 1078, ambiguous: 1 });
    } finally {
      await client.end();
    }
  });
}, 120_000);

test("native TAP failure is data; rollback, caught errors, and escaped session ownership remain native", async () => {
  await withPgtapDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      await client.query(pgtapInstall);
      let escaped: PgtapSession | undefined;
      const result = await withPgtap(url, pgtapDescriptor, async (session) => {
        escaped = session;
        await session.plan(1);
        const tap = await session.ok(false, "failure is TAP data");
        const finish = await session.finish();
        return { tap, finish };
      });
      expect(result.completion).toBe("committed");
      expect(result.value.tap).toBe('not ok 1 - failure is TAP data\n# Failed test 1: "failure is TAP data"');
      expect(result.value.finish).toEqual(["# Looks like you failed 1 test of 1"]);
      await assert.rejects(escaped!.noPlan(), /inactive/);
      await assert.rejects(
        withPgtap(url, pgtapDescriptor, async (session) => {
          await session.noPlan();
          await session.call(
            "routine:$extension:pgtap._time_trials(pg_catalog.text,pg_catalog.int4,pg_catalog.numeric)",
            "CREATE TABLE public.rollback_fixture(id int)",
            1,
            "1",
          );
          try {
            // SAFETY: this fixture helper issues the opaque concrete int4-array parameter for the exact captured overload.
            await session.call(
              "routine:$extension:pgtap.diag(pg_catalog.anyarray)",
              pgtapCaseArguments("routine:$extension:pgtap.diag(pg_catalog.anyarray)", [
                "{1,2}",
              ])[0] as import("../../../apps/loom/src/core/extensions/adapters/pgtap").PgtapParameter,
            );
          } catch {}
          return "caught";
        }),
        (error) => {
          expect(error).toMatchObject({ completion: "rolled-back", cause: { code: "42725" } });
          return true;
        },
      );
      expect((await client.query("SELECT to_regclass('public.rollback_fixture') AS relation")).rows).toEqual([
        { relation: null },
      ]);
      await assert.rejects(
        withPgtap(url, pgtapDescriptor, async (session) => {
          await session.noPlan();
          // SAFETY: deliberately model an untyped JS caller; the captured boolean codec must reject this invalid input.
          const untyped = session.ok as (...values: readonly unknown[]) => Promise<string | null>;
          try {
            await untyped("true", "invalid boolean must poison caught operation");
          } catch {}
          return "caught";
        }),
        (error) => {
          expect(error).toMatchObject({ completion: "rolled-back", cause: { name: "ValiError" } });
          return true;
        },
      );
    } finally {
      await client.end();
    }
  });
}, 120_000);

test("all six custom schema types round-trip composites, NULL fields, exact numerics and array bounds", async () => {
  await withPgtapDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    const api = createPgtap_1_3_3(pgtapDescriptor);
    const schema = defineSchema(
      () => ({
        samples: defineTable({
          time: api.fields._time_trial_type(),
          times: api.fields.__time_trial_type(),
          foreign: api.fields.pg_all_foreign_keys(),
          foreigns: api.fields._pg_all_foreign_keys(),
          function: api.fields.tap_funky(),
          functions: api.fields._tap_funky(),
        }),
      }),
      { namespace: "public" },
    );
    try {
      await client.query(pgtapInstall);
      await client.query(`CREATE TABLE public.samples (
        _id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "_createdAt" bigint NOT NULL DEFAULT 0,
        "time" tap._time_trial_type, times tap._time_trial_type[],
        "foreign" tap.pg_all_foreign_keys, foreigns tap.pg_all_foreign_keys[],
        "function" tap.tap_funky, functions tap.tap_funky[]
      )`);
      const foreign = api.codecs.pg_all_foreign_keys.decode(
        (await client.query("SELECT s::text AS value FROM tap.pg_all_foreign_keys s WHERE fk_table_name='fixture'"))
          .rows[0]!.value,
      );
      const funky = api.codecs.tap_funky.decode(
        (await client.query("SELECT s::text AS value FROM tap.tap_funky s WHERE name='fixture_fn'")).rows[0]!.value,
      );
      const time = { a_time: "12345678901234567890.123456789" };
      const array = <T>(value: T) => ({ dimensions: [{ lowerBound: -2, length: 2 }], values: [value, null] });
      const row = {
        time,
        times: array(time),
        foreign,
        foreigns: array(foreign),
        function: funky,
        functions: array(funky),
      };
      const connection = await connectDatabase({
        connectionString: url,
        schema,
        relations: defineRelations(schema.tables),
      });
      try {
        await connection.transaction((db) => db.insert(schema.tables.samples).values(row));
        const { samples } = schema.tables;
        const result = await connection.transaction((db) =>
          db
            .select({
              time: samples.time,
              times: samples.times,
              foreign: samples.foreign,
              foreigns: samples.foreigns,
              function: samples.function,
              functions: samples.functions,
            })
            .from(samples),
        );
        expect(result).toEqual([row]);
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
}, 120_000);
