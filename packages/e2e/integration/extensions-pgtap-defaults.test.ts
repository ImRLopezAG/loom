import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import pg from "pg";
import * as v from "valibot";
import {
  createPgtap_1_3_3,
  pgtapRoutineSpecs,
  type PgtapMember,
  type PgtapAnyResult,
} from "../../../apps/loom/src/core/extensions/adapters/pgtap";
import { withPgtap } from "../../../apps/loom/src/tooling/extensions/operations/pgtap";
import { pgtapCaseArguments, pgtapNativeCases } from "../fixtures/pgtap-cases";
import { pgtapDescriptor, pgtapInstall, withPgtapDatabase } from "../fixtures/pgtap";
import type { PgtapOutput, PgtapCodecName } from "../../../apps/loom/src/core/extensions/adapters/pgtap-codecs";

test("all six captured defaulted overloads map explicit optional undefined to native omission", async () => {
  await withPgtapDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    const api = createPgtap_1_3_3(pgtapDescriptor);
    try {
      await client.query(pgtapInstall);
      let calls = 0;
      for (const entry of pgtapNativeCases) {
        // SAFETY: the baseline exhaustive IDs match the selected manifest and each captured routine spec.
        const id = entry.id as PgtapMember;
        const spec = pgtapRoutineSpecs[id];
        if (!spec.args.at(-1)?.endsWith("?")) continue;
        const setup = "SELECT tap.no_plan(); SELECT tap.ok(true, 'fixture')";
        const sql = entry.sql.replace(/,?\$\d+::pg_catalog\."[a-z0-9_]+"(?=\))/, "");
        assert.notEqual(sql, entry.sql);
        await client.query("BEGIN");
        let expected: readonly PgtapOutput<PgtapCodecName>[];
        try {
          await client.query(setup);
          const native = await client.query<{ value: unknown }>(sql, entry.values.slice(0, -1));
          expected = native.rows.map((row) =>
            api.codecs[spec.result].decode(
              spec.result === "bool" && v.is(v.string(), row.value) ? row.value === "true" : row.value,
            ),
          );
        } finally {
          await client.query("ROLLBACK");
        }
        const result = await withPgtap(url, pgtapDescriptor, async (session) => {
          await session.call(
            "routine:$extension:pgtap._time_trials(pg_catalog.text,pg_catalog.int4,pg_catalog.numeric)",
            setup,
            1,
            "1",
          );
          // SAFETY: this exact native fixture supplies the captured required tuple and the public optional argument accepts undefined.
          const call = session.routines[id] as (...values: readonly unknown[]) => Promise<PgtapAnyResult>;
          return call(...pgtapCaseArguments(id, entry.values).slice(0, -1), undefined);
        });
        if (!spec.set) expect(expected).toHaveLength(1);
        assert.deepEqual(result.value, spec.set ? expected : expected[0]!, id);
        calls++;
      }
      expect(calls).toBe(6);
    } finally {
      await client.end();
    }
  });
}, 120_000);
