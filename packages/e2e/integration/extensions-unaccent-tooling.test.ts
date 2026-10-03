import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createUnaccent_1_1, dictionaryReference } from "../../../apps/loom/src/core/extensions/adapters/unaccent";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import {
  withUnaccentDictionaries,
  restoreUnaccentDictionary,
  type UnaccentDictionaryFacts,
} from "../../../apps/loom/src/tooling/extensions/unaccent";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
const descriptor = {
  name: "unaccent",
  version: "1.1",
  schema: 'accent"schema',
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
} as const;
const install =
  'CREATE SCHEMA "accent""schema"; CREATE EXTENSION unaccent WITH SCHEMA "accent""schema"; CREATE SCHEMA "custom""dictionaries"; CREATE SCHEMA conflicting; CREATE TEXT SEARCH DICTIONARY conflicting.unaccent(TEMPLATE=pg_catalog.simple)';
async function observe<Value>(url: string, work: (client: pg.Client) => Promise<Value>) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}
async function setup(url: string) {
  await observe(url, async (client) => {
    await client.query(install);
  });
}
async function exists(url: string, name: string) {
  return observe(
    url,
    async (client) =>
      (
        await client.query(
          "SELECT d.dictname FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace WHERE n.nspname=$1 AND d.dictname=$2",
          ['custom"dictionaries', name],
        )
      ).rows.length === 1,
  );
}

test("Unaccent tooling creates qualified dictionaries and returns authentic runtime references", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    const reference = dictionaryReference({ schema: 'custom"dictionaries', name: 'dict"; drop schema public;--' });
    const result = await withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
      const installed = await dictionaries.inspectDictionary();
      expect(installed.reference).toMatchObject({ schema: descriptor.schema, name: "unaccent" });
      expect(installed.options).toBe("rules = 'unaccent'");
      expect(installed.owner.length).toBeGreaterThan(0);
      expect(await dictionaries.inspectTemplate()).toMatchObject({
        schema: descriptor.schema,
        name: "unaccent",
        init: "routine:$extension:unaccent.unaccent_init(pg_catalog.internal)",
        lexize:
          "routine:$extension:unaccent.unaccent_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
      });
      const created = await dictionaries.createDictionary(reference);
      expect(Object.isFrozen(created)).toBe(true);
      expect(Object.isFrozen(created.template)).toBe(true);
      expect(created.template).toEqual({ schema: descriptor.schema, name: "unaccent" });
      expect(await dictionaries.setRules(reference, "unaccent")).toEqual(created);
      expect(await dictionaries.reloadRules(reference)).toEqual(created);
      return created;
    });
    expect(result.completion).toBe("committed");
    await observe(url, async (client) => {
      await client.query("SET search_path=conflicting,pg_catalog");
      expect(
        (
          await client.query(
            "SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,'Hôtel') AS lexemes",
            [descriptor.schema, "unaccent"],
          )
        ).rows,
      ).toEqual([{ lexemes: ["Hotel"] }]);
      const expression = createUnaccent_1_1(descriptor).unaccent(result.value.reference, "Æther Hôtel");
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select ${expression} AS value`);
      expect((await client.query(compiled.sql, compiled.params)).rows).toEqual([{ value: "AEther Hotel" }]);
    });
    await observe(url, async (client) => {
      expect(
        (
          await client.query(
            "SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,'Hôtel') AS lexemes",
            [reference.schema, reference.name],
          )
        ).rows,
      ).toEqual([{ lexemes: ["Hotel"] }]);
    });
  });
});

test("caught validation and native rules failures poison prior dictionary creation", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    for (const scenario of [
      { name: "validation_rollback", rules: "bad\u0000rules", code: null },
      { name: "native_rollback", rules: "loom_missing_rules_20261002", code: "F0000" },
      { name: "hostile_rollback", rules: "unaccent'); DROP SCHEMA conflicting CASCADE;--", code: "22023" },
    ]) {
      const ref = dictionaryReference({ schema: 'custom"dictionaries', name: scenario.name });
      let caught: unknown;
      await assert.rejects(
        withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
          await dictionaries.createDictionary(ref);
          try {
            await dictionaries.setRules(ref, scenario.rules);
          } catch (cause) {
            caught = cause;
          }
          return "caught";
        }),
        (error) => {
          assert.ok(error instanceof ExtensionOperationError);
          expect(error.completion).toBe("rolled-back");
          expect(error.cause).toBe(caught);
          if (scenario.code !== null)
            expect(v.parse(v.object({ code: v.string() }), error.cause).code).toBe(scenario.code);
          return true;
        },
      );
      expect(await exists(url, scenario.name)).toBe(false);
      await observe(url, async (client) => {
        expect(
          (
            await client.query(
              "SELECT pg_catalog.ts_lexize('conflicting.unaccent'::pg_catalog.regdictionary,'Hôtel') AS lexemes",
            )
          ).rows,
        ).toEqual([{ lexemes: ["hôtel"] }]);
        expect(
          (
            await client.query(
              "SELECT d.dictinitoption AS options FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace WHERE n.nspname=$1 AND d.dictname='unaccent'",
              [descriptor.schema],
            )
          ).rows,
        ).toEqual([{ options: "rules = 'unaccent'" }]);
      });
    }
  });
});

test("unawaited dictionary work drains and escaped methods refuse new work", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    const ref = dictionaryReference({ schema: 'custom"dictionaries', name: "drained" });
    let retained: (() => Promise<UnaccentDictionaryFacts>) | undefined;
    const result = await withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
      retained = () => dictionaries.inspectDictionary();
      void dictionaries.createDictionary(ref);
      return 1;
    });
    expect(result.value).toBe(1);
    expect(await exists(url, "drained")).toBe(true);
    assert.ok(retained);
    await assert.rejects(retained(), /inactive/);
    const missing = dictionaryReference({ schema: 'custom"dictionaries', name: "failed_drain" });
    await assert.rejects(
      withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
        void dictionaries.createDictionary(missing, "loom_missing_rules_20261002");
      }),
      (error) => error instanceof ExtensionOperationError && error.completion === "rolled-back",
    );
    expect(await exists(url, "failed_drain")).toBe(false);
  });
});

test("wrong-template and absent targets cannot mutate and fixed restoration preserves strict pins", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    for (const name of ["unaccent", "missing"]) {
      const ref = dictionaryReference({ schema: "conflicting", name });
      await assert.rejects(
        withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
          await dictionaries.setRules(ref, "unaccent");
        }),
        (error) => error instanceof ExtensionOperationError && error.completion === "rolled-back",
      );
    }
    const owner = await observe(
      url,
      async (client) =>
        (
          await client.query(
            "SELECT pg_catalog.pg_get_userbyid(dictowner) AS owner, current_user AS role FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace WHERE n.nspname=$1 AND dictname='unaccent'",
            [descriptor.schema],
          )
        ).rows[0],
    );
    v.parse(v.strictObject({ owner: v.string(), role: v.string() }), owner);
    for (const run of [
      () => restoreUnaccentDictionary(url, descriptor),
      () =>
        withUnaccentDictionaries(url, descriptor, async (dictionaries) =>
          dictionaries.setRules(createUnaccent_1_1(descriptor).dictionary, "unaccent"),
        ),
    ]) {
      try {
        const result = await run();
        expect(result.completion).toBe("committed");
        expect(result.value.options).toBe("rules = 'unaccent'");
      } catch (error) {
        assert.ok(error instanceof ExtensionOperationError);
        expect(error.completion).toBe("rolled-back");
        expect(v.parse(v.object({ code: v.string() }), error.cause).code).toBe("42501");
      }
    }
    expect(
      await withUnaccentDictionaries(
        url,
        descriptor,
        async (dictionaries) => (await dictionaries.inspectDictionary()).options,
      ),
    ).toEqual({ completion: "committed", value: "rules = 'unaccent'" });
  });
});

test("actual namespace mismatch prevents callback admission and fixed restoration", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    let entered = false;
    await assert.rejects(
      withUnaccentDictionaries(url, { ...descriptor, schema: "conflicting" }, async () => {
        entered = true;
      }),
      (error) =>
        error instanceof ExtensionOperationError &&
        error.completion === "rolled-back" &&
        error.cause instanceof Error &&
        /namespace mismatch/.test(error.cause.message),
    );
    expect(entered).toBe(false);
    await assert.rejects(
      restoreUnaccentDictionary(url, { ...descriptor, schema: "conflicting" }),
      (error) => error instanceof ExtensionOperationError && error.completion === "rolled-back",
    );
    await observe(url, async (client) => {
      expect(
        (
          await client.query(
            "SELECT d.dictinitoption AS options FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace WHERE n.nspname=$1 AND d.dictname='unaccent'",
            [descriptor.schema],
          )
        ).rows,
      ).toEqual([{ options: "rules = 'unaccent'" }]);
      expect(
        (
          await client.query(
            "SELECT pg_catalog.ts_lexize('conflicting.unaccent'::pg_catalog.regdictionary,'Hôtel') AS lexemes",
          )
        ).rows,
      ).toEqual([{ lexemes: ["hôtel"] }]);
    });
  });
});

test("cross-owner calls and copied references cannot admit dictionary work", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    const reference = dictionaryReference({ schema: 'custom"dictionaries', name: "nominal_rollback" });
    let retained: (() => Promise<UnaccentDictionaryFacts>) | undefined;
    await withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
      retained = () => dictionaries.inspectDictionary();
    });
    assert.ok(retained);
    await withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
      assert.ok(retained);
      await assert.rejects(retained(), /inactive|different owner/);
      expect((await dictionaries.inspectDictionary()).options).toBe("rules = 'unaccent'");
    });
    await assert.rejects(
      withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
        await dictionaries.createDictionary(reference);
        try {
          // SAFETY: a copied nominal object exercises runtime authenticity validation within tracked work.
          await dictionaries.inspectDictionary({ ...reference } as never);
        } catch {}
        await assert.rejects(dictionaries.inspectDictionary());
      }),
      (error) => error instanceof ExtensionOperationError && error.completion === "rolled-back",
    );
    expect(await exists(url, "nominal_rollback")).toBe(false);
  });
});
