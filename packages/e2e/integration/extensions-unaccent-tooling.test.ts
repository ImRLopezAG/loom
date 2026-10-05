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

async function installedDictionary(client: pg.Client) {
  const rows = await client.query(
    `SELECT d.oid::text AS oid,t.oid::text AS "templateOid",tn.nspname AS "templateSchema",t.tmplname AS "templateName",pg_catalog.pg_get_userbyid(d.dictowner) AS owner,d.dictinitoption AS options
    FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate JOIN pg_catalog.pg_namespace tn ON tn.oid=t.tmplnamespace WHERE n.nspname=$1 AND d.dictname='unaccent'`,
    [descriptor.schema],
  );
  return v.parse(
    v.tuple([
      v.strictObject({
        oid: v.string(),
        templateOid: v.string(),
        templateSchema: v.string(),
        templateName: v.literal("unaccent"),
        owner: v.string(),
        options: v.nullable(v.string()),
      }),
    ]),
    rows.rows,
  )[0];
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

test("Unaccent cancellation rolls back native creation and releases the owned backend", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    const controller = new AbortController();
    const reason = new DOMException("Unaccent fixture cancellation", "AbortError");
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    const reference = dictionaryReference({ schema: 'custom"dictionaries', name: "cancelled_creation" });
    let retained: (() => Promise<UnaccentDictionaryFacts>) | undefined;
    const pending = withUnaccentDictionaries(
      url,
      descriptor,
      async (dictionaries) => {
        await dictionaries.createDictionary(reference);
        retained = () => dictionaries.reloadRules(reference);
        entered.resolve();
        await resume.promise;
      },
      controller.signal,
    );
    void pending.catch(() => undefined);
    try {
      await Promise.race([
        entered.promise,
        pending.then(() => assert.fail("Dictionary owner settled before cancellation")),
      ]);
      const pid = await observe(url, async (client) => {
        const rows = await client.query(
          "SELECT pid FROM pg_catalog.pg_stat_activity WHERE datname=current_database() AND usename=current_user AND application_name='loom-migrations' AND state='idle in transaction'",
        );
        return v.parse(v.tuple([v.strictObject({ pid: v.pipe(v.number(), v.integer()) })]), rows.rows)[0].pid;
      });
      controller.abort(reason);
      await assert.rejects(pending, (error) => {
        assert.ok(error instanceof ExtensionOperationError);
        expect(error.cause).toBe(reason);
        expect(error.completion).toBe("rolled-back");
        expect(error.cleanupFailures).toEqual([]);
        return true;
      });
      expect(await exists(url, reference.name)).toBe(false);
      await observe(url, async (client) => {
        expect((await client.query("SELECT pid FROM pg_catalog.pg_stat_activity WHERE pid=$1", [pid])).rows).toEqual(
          [],
        );
        expect((await client.query("SELECT pid FROM pg_catalog.pg_locks WHERE pid=$1", [pid])).rows).toEqual([]);
      });
      assert.ok(retained);
      await assert.rejects(retained(), /inactive|owner/);
    } finally {
      controller.abort(reason);
      resume.resolve();
      await pending.catch(() => undefined);
    }
  });
}, 45000);

test("Unaccent restoration repairs actual installed options drift or records native catalogue denial", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    await observe(url, async (client) => {
      const original = await installedDictionary(client);
      expect(original.options).toBe("rules = 'unaccent'");
      try {
        // Disposable corruption fixture: ordinary ALTER validates RULES before storing them.
        const changed = await client.query(
          "UPDATE pg_catalog.pg_ts_dict d SET dictinitoption=NULL FROM pg_catalog.pg_namespace n WHERE n.oid=d.dictnamespace AND n.nspname=$1 AND d.dictname='unaccent' RETURNING d.oid",
          [descriptor.schema],
        );
        expect(changed.rowCount).toBe(1);
      } catch (error) {
        expect(v.parse(v.object({ code: v.string() }), error).code).toBe("42501");
        expect(await installedDictionary(client)).toEqual(original);
        console.info("Unaccent options drift: catalogue UPDATE denied (42501); restoration scenario not executed.");
        return;
      }
      expect(await installedDictionary(client)).toEqual({ ...original, options: null });
      let entered = false;
      await assert.rejects(
        withUnaccentDictionaries(url, descriptor, async () => {
          entered = true;
        }),
        (error) =>
          error instanceof ExtensionOperationError &&
          error.completion === "rolled-back" &&
          error.cause instanceof Error &&
          /text-search contract mismatch/.test(error.cause.message),
      );
      expect(entered).toBe(false);
      const restored = await restoreUnaccentDictionary(url, descriptor);
      expect(restored.completion).toBe("committed");
      expect(restored.value.options).toBe(original.options);
      expect(restored.value.owner).toBe(original.owner);
      expect(restored.value.reference).toMatchObject({ schema: descriptor.schema, name: "unaccent" });
      expect(restored.value.template).toEqual({ schema: original.templateSchema, name: original.templateName });
      expect(await installedDictionary(client)).toEqual(original);
      expect(
        (
          await client.query(
            "SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,'unaccent')::pg_catalog.regdictionary,'Hôtel') AS lexemes",
            [descriptor.schema],
          )
        ).rows,
      ).toEqual([{ lexemes: ["Hotel"] }]);
      expect(
        await withUnaccentDictionaries(url, descriptor, async (dictionaries) => dictionaries.inspectDictionary()),
      ).toEqual({ completion: "committed", value: restored.value });
      console.info("Unaccent options drift: actual native drift restored with unchanged OID, template and owner.");
    });
  });
}, 45000);

test("Unaccent restoration native DDL failure rolls back changes and trigger work", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    await observe(url, async (client) => {
      const original = await installedDictionary(client);
      await client.query(`CREATE SEQUENCE "custom""dictionaries".restoration_calls;
        CREATE TABLE "custom""dictionaries".restoration_trace (mark bigint NOT NULL);
        CREATE FUNCTION "custom""dictionaries".loom_unaccent_restore_failure() RETURNS event_trigger LANGUAGE plpgsql AS $fixture$
        BEGIN
          INSERT INTO "custom""dictionaries".restoration_trace VALUES (nextval('"custom""dictionaries".restoration_calls'));
          PERFORM 1 / 0;
        END;
        $fixture$`);
      try {
        await client.query(
          `CREATE EVENT TRIGGER loom_unaccent_restore_failure ON ddl_command_end WHEN TAG IN ('ALTER TEXT SEARCH DICTIONARY') EXECUTE FUNCTION "custom""dictionaries".loom_unaccent_restore_failure()`,
        );
      } catch (error) {
        expect(v.parse(v.object({ code: v.string() }), error).code).toBe("42501");
        expect(await installedDictionary(client)).toEqual(original);
        expect((await client.query('SELECT mark FROM "custom""dictionaries".restoration_trace')).rows).toEqual([]);
        expect((await client.query('SELECT is_called FROM "custom""dictionaries".restoration_calls')).rows).toEqual([
          { is_called: false },
        ]);
        console.info("Unaccent restoration rollback: event-trigger creation denied (42501); scenario not executed.");
        return;
      }
      try {
        try {
          const changed = await client.query(
            "UPDATE pg_catalog.pg_ts_dict d SET dictinitoption=NULL FROM pg_catalog.pg_namespace n WHERE n.oid=d.dictnamespace AND n.nspname=$1 AND d.dictname='unaccent' RETURNING d.oid",
            [descriptor.schema],
          );
          expect(changed.rowCount).toBe(1);
        } catch (error) {
          expect(v.parse(v.object({ code: v.string() }), error).code).toBe("42501");
          expect(await installedDictionary(client)).toEqual(original);
          console.info("Unaccent restoration rollback: catalogue UPDATE denied (42501); scenario not executed.");
          return;
        }
        const drifted = { ...original, options: null };
        expect(await installedDictionary(client)).toEqual(drifted);
        await assert.rejects(restoreUnaccentDictionary(url, descriptor), (error) => {
          assert.ok(error instanceof ExtensionOperationError);
          expect(error.completion).toBe("rolled-back");
          expect(error.cleanupFailures).toEqual([]);
          const native = v.parse(v.object({ code: v.string(), where: v.string() }), error.cause);
          expect(native.code).toBe("22012");
          expect(native.where).toContain("loom_unaccent_restore_failure");
          return true;
        });
        expect(await installedDictionary(client)).toEqual(drifted);
        expect((await client.query('SELECT mark FROM "custom""dictionaries".restoration_trace')).rows).toEqual([]);
        expect(
          (
            await client.query(
              'SELECT last_value::text AS value,is_called FROM "custom""dictionaries".restoration_calls',
            )
          ).rows,
        ).toEqual([{ value: "1", is_called: true }]);
        console.info(
          "Unaccent restoration rollback: native trigger executed; dictionary change and prior INSERT rolled back.",
        );
      } finally {
        await client.query("DROP EVENT TRIGGER loom_unaccent_restore_failure");
      }
    });
  });
}, 45000);

test("Unaccent operator and runtime credentials have distinct native dictionary privileges", async () => {
  await withExtensionDatabase(async (url) => {
    await setup(url);
    const role = `loom_ext_unaccent_runtime_${crypto.randomUUID().replaceAll("-", "")}`;
    const quotedRole = pg.escapeIdentifier(role);
    const reference = dictionaryReference({ schema: 'custom"dictionaries', name: "operator_owned" });
    const created = await withUnaccentDictionaries(url, descriptor, async (dictionaries) =>
      dictionaries.createDictionary(reference),
    );
    const changed = await withUnaccentDictionaries(url, descriptor, async (dictionaries) =>
      dictionaries.setRules(reference, "unaccent"),
    );
    expect(changed).toEqual(created);
    await observe(url, async (client) => {
      const original = await installedDictionary(client);
      const database = v.parse(
        v.tuple([v.strictObject({ name: v.string() })]),
        (await client.query("SELECT current_database() AS name")).rows,
      )[0].name;
      try {
        await client.query(`CREATE ROLE ${quotedRole} LOGIN NOINHERIT PASSWORD 'loom-unaccent-runtime-fixture-only'`);
      } catch (error) {
        expect(v.parse(v.object({ code: v.string() }), error).code).toBe("42501");
        expect(await installedDictionary(client)).toEqual(original);
        console.info("Unaccent runtime privilege fixture: CREATE ROLE denied (42501); runtime scenario not executed.");
        return;
      }
      try {
        await client.query(`GRANT CONNECT ON DATABASE ${pg.escapeIdentifier(database)} TO ${quotedRole};
          GRANT USAGE ON SCHEMA "accent""schema","custom""dictionaries" TO ${quotedRole}`);
        expect(
          (
            await client.query(
              "SELECT rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolbypassrls FROM pg_catalog.pg_roles WHERE rolname=$1",
              [role],
            )
          ).rows,
        ).toEqual([
          { rolsuper: false, rolinherit: false, rolcreaterole: false, rolcreatedb: false, rolbypassrls: false },
        ]);
        const runtime = new URL(url);
        runtime.username = role;
        runtime.password = "loom-unaccent-runtime-fixture-only";
        await observe(runtime.href, async (runtimeClient) => {
          expect(
            (await runtimeClient.query(`SELECT current_user AS role,"accent""schema".unaccent('Æther Hôtel') AS value`))
              .rows,
          ).toEqual([{ role, value: "AEther Hotel" }]);
        });
        expect(
          await withUnaccentDictionaries(runtime.href, descriptor, async (dictionaries) =>
            dictionaries.inspectDictionary(reference),
          ),
        ).toEqual({ completion: "committed", value: created.value });
        const deniedCreation = dictionaryReference({ schema: reference.schema, name: "runtime_creation_denied" });
        for (const run of [
          () =>
            withUnaccentDictionaries(runtime.href, descriptor, async (dictionaries) =>
              dictionaries.createDictionary(deniedCreation),
            ),
          () =>
            withUnaccentDictionaries(runtime.href, descriptor, async (dictionaries) =>
              dictionaries.setRules(reference, "unaccent"),
            ),
          () => restoreUnaccentDictionary(runtime.href, descriptor),
        ]) {
          await assert.rejects(run(), (error) => {
            assert.ok(error instanceof ExtensionOperationError);
            expect(error.completion).toBe("rolled-back");
            expect(error.cleanupFailures).toEqual([]);
            expect(v.parse(v.object({ code: v.string() }), error.cause).code).toBe("42501");
            return true;
          });
        }
        expect(await exists(url, deniedCreation.name)).toBe(false);
        expect(await installedDictionary(client)).toEqual(original);
        expect(
          (await client.query("SELECT pid FROM pg_catalog.pg_stat_activity WHERE usename=$1", [role])).rows,
        ).toEqual([]);
        console.info(
          "Unaccent privileges: operator-owned mutation committed; runtime query/inspection committed; runtime mutations denied (42501).",
        );
      } finally {
        await client.query(`REVOKE ALL ON SCHEMA "accent""schema","custom""dictionaries" FROM ${quotedRole};
          REVOKE ALL ON DATABASE ${pg.escapeIdentifier(database)} FROM ${quotedRole}; DROP ROLE ${quotedRole}`);
      }
    });
  });
}, 90000);
