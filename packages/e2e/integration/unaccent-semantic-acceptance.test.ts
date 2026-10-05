import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { connectDatabase, defineSchema } from "kello/server";
import { createUnaccent_1_1, dictionaryReference } from "kello/extensions/unaccent";
import { withUnaccentDictionaries } from "kello/tooling/extensions/unaccent";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import {
  unaccentNativeProofCase,
  unaccentNativeProofClaims,
  unaccentProofFamily,
  unaccentProofSchema,
} from "../fixtures/unaccent-proof-cases";

const descriptor = {
  name: "unaccent",
  version: "1.1",
  schema: unaccentProofSchema,
  apiSupport: { status: "verified", digest: unaccentProofFamily.manifestDigest },
} as const;
const fixture = sql`(values (1)) as fixture(value)`;

async function observe<Value>(url: string, operation: (client: pg.Client) => Promise<Value>): Promise<Value> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await operation(client);
  } finally {
    await client.end();
  }
}

extensionProofTest(
  unaccentNativeProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      await observe(url, async (client) => {
        assert.match((await client.query("SHOW server_version_num")).rows[0]!.server_version_num, /^18\d{4}$/);
        await client.query(
          `CREATE SCHEMA "capture""text";
         CREATE EXTENSION unaccent WITH SCHEMA "capture""text" VERSION '1.1';
         CREATE SCHEMA "proof""dictionaries";
         CREATE SCHEMA conflicting;
         CREATE TEXT SEARCH DICTIONARY conflicting.unaccent(TEMPLATE=pg_catalog.simple)`,
        );
        assert.deepEqual(
          (
            await client.query(
              `SELECT e.extversion AS version,n.nspname AS schema FROM pg_catalog.pg_extension e
         JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='unaccent'`,
            )
          ).rows,
          [{ version: "1.1", schema: unaccentProofSchema }],
        );
      });
      // The real collector reads pg_catalog; provider ownership and fixture cleanup are host-owned.
      await observeExtensionProofDatabase(url, unaccentNativeProofCase.id, "unaccent");
      const extension = createUnaccent_1_1(descriptor);
      const requested = dictionaryReference({ schema: 'proof"dictionaries', name: 'dict";--' });
      // These closed public entries share the published dictionary/SQL guard modules.
      // Tooling verifies the exact manifest and supplemental graph before admitting its callback.
      const operated = await withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
        const installed = await dictionaries.inspectDictionary();
        const template = await dictionaries.inspectTemplate();
        const created = await dictionaries.createDictionary(requested);
        return { installed, template, created };
      });
      assert.equal(operated.completion, "committed");
      const dictionaryRevision = () =>
        observe(url, async (client) => {
          const result = await client.query<{ revision: string }>(
            `SELECT d.xmin::text AS revision FROM pg_catalog.pg_ts_dict d
         JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace
         WHERE n.nspname=$1 AND d.dictname=$2`,
            [requested.schema, requested.name],
          );
          assert.equal(result.rowCount, 1);
          return result.rows[0]!.revision;
        });
      // Separate committed transactions make the actual catalogue writes observable without a test hook.
      const createdRevision = await dictionaryRevision();
      const changed = await withUnaccentDictionaries(url, descriptor, (dictionaries) =>
        dictionaries.setRules(operated.value.created.reference, "unaccent"),
      );
      assert.equal(changed.completion, "committed");
      const changedRevision = await dictionaryRevision();
      assert.notEqual(changedRevision, createdRevision, "setRules must execute its native ALTER");
      const reloaded = await withUnaccentDictionaries(url, descriptor, (dictionaries) =>
        dictionaries.reloadRules(changed.value.reference),
      );
      assert.equal(reloaded.completion, "committed");
      assert.notEqual(await dictionaryRevision(), changedRevision, "reloadRules must execute its native ALTER");
      const facts = { ...operated.value, changed: changed.value, reloaded: reloaded.value };
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      try {
        await extensionProofWitness(
          { ...unaccentNativeProofClaims.implicit, schema: unaccentProofSchema },
          async () => {
            const actual = await connection.transaction(async (db) => {
              await db.execute(sql`select set_config('search_path','conflicting,pg_catalog',true)`);
              return db
                .select({
                  expanded: extension.unaccent("Æther Hôtel Œuvre Straße"),
                  deleted: extension.unaccent("\u0301"),
                  unchanged: extension.unaccent("你好🙂"),
                  empty: extension.unaccent(""),
                  nullText: extension.unaccent(null),
                })
                .from(fixture);
            });
            const native = await observe(url, async (client) => {
              await client.query("SET search_path=conflicting,pg_catalog");
              assert.deepEqual(
                (
                  await client.query(
                    `SELECT pg_catalog.oidvectortypes(p.proargtypes) AS arguments,
             p.prorettype::pg_catalog.regtype::text AS result,p.proisstrict AS strict
             FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname=$1 AND p.proname='unaccent' ORDER BY arguments`,
                    [unaccentProofSchema],
                  )
                ).rows,
                [
                  { arguments: "regdictionary, text", result: "text", strict: true },
                  { arguments: "text", result: "text", strict: true },
                ],
              );
              return (
                await client.query(
                  `SELECT "capture""text".unaccent($1::text) AS expanded,
             "capture""text".unaccent($2::text) AS deleted,
             "capture""text".unaccent($3::text) AS unchanged,
             "capture""text".unaccent(''::text) AS empty,
             "capture""text".unaccent(NULL::text) AS "nullText"`,
                  ["Æther Hôtel Œuvre Straße", "\u0301", "你好🙂"],
                )
              ).rows;
            });
            assert.deepEqual(native, [
              { expanded: "AEther Hotel OEuvre Strasse", deleted: "", unchanged: "你好🙂", empty: "", nullText: null },
            ]);
            assert.deepEqual(actual, native);
          },
        );
        await extensionProofWitness(
          { ...unaccentNativeProofClaims.explicit, schema: unaccentProofSchema },
          async () => {
            const actual = await connection.transaction(async (db) => {
              await db.execute(sql`select set_config('search_path','conflicting,pg_catalog',true)`);
              return db
                .select({
                  custom: extension.unaccent(facts.reloaded.reference, "Æther Hôtel"),
                  installed: extension.sql.functions.unaccent(facts.installed.reference, "Hôtel"),
                  nullDictionary: extension.unaccent(null, "é"),
                  nullText: extension.unaccent(facts.created.reference, null),
                })
                .from(fixture);
            });
            const native = await observe(
              url,
              async (client) =>
                (
                  await client.query(
                    `SELECT "capture""text".unaccent(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,$3::text) AS custom,
           "capture""text".unaccent(pg_catalog.format('%I.%I',$4::text,'unaccent')::pg_catalog.regdictionary,'Hôtel'::text) AS installed,
           "capture""text".unaccent(NULL::pg_catalog.regdictionary,'é'::text) AS "nullDictionary",
           "capture""text".unaccent(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,NULL::text) AS "nullText"`,
                    [requested.schema, requested.name, "Æther Hôtel", unaccentProofSchema],
                  )
                ).rows,
            );
            assert.deepEqual(native, [
              { custom: "AEther Hotel", installed: "Hotel", nullDictionary: null, nullText: null },
            ]);
            assert.deepEqual(actual, native);
          },
        );
        await extensionProofWitness(
          { ...unaccentNativeProofClaims.dictionary, schema: unaccentProofSchema },
          async () => {
            await observe(url, async (client) => {
              for (const inspected of [facts.installed, facts.created, facts.changed, facts.reloaded]) {
                const native = await client.query(
                  `SELECT tn.nspname AS "templateSchema",t.tmplname AS "templateName",
               pg_catalog.pg_get_userbyid(d.dictowner) AS owner,d.dictinitoption AS options,
               pg_catalog.ts_lexize(d.oid::pg_catalog.regdictionary,$3::text) AS lexemes
               FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace
               JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate
               JOIN pg_catalog.pg_namespace tn ON tn.oid=t.tmplnamespace
               WHERE n.nspname=$1 AND d.dictname=$2`,
                  [inspected.reference.schema, inspected.reference.name, "Hôtel"],
                );
                assert.deepEqual(native.rows, [
                  {
                    templateSchema: unaccentProofSchema,
                    templateName: "unaccent",
                    owner: inspected.owner,
                    options: "rules = 'unaccent'",
                    lexemes: ["Hotel"],
                  },
                ]);
                assert.equal(inspected.options, native.rows[0]!.options);
                assert.deepEqual(inspected.template, {
                  schema: native.rows[0]!.templateSchema,
                  name: native.rows[0]!.templateName,
                });
              }
              assert.deepEqual(facts.installed.reference, extension.dictionary);
              assert.deepEqual(facts.created.reference, requested);
            });
          },
        );
        await extensionProofWitness(
          { ...unaccentNativeProofClaims.template, schema: unaccentProofSchema },
          async () => {
            await observe(url, async (client) => {
              const native = await client.query(
                `SELECT t.tmplname AS name,ni.nspname AS "initSchema",pi.proname AS init,
             pg_catalog.oidvectortypes(pi.proargtypes) AS "initArguments",
             pi.prorettype::pg_catalog.regtype::text AS "initResult",
             nl.nspname AS "lexizeSchema",pl.proname AS lexize,
             pg_catalog.oidvectortypes(pl.proargtypes) AS "lexizeArguments",
             pl.prorettype::pg_catalog.regtype::text AS "lexizeResult"
             FROM pg_catalog.pg_ts_template t JOIN pg_catalog.pg_namespace n ON n.oid=t.tmplnamespace
             JOIN pg_catalog.pg_proc pi ON pi.oid=t.tmplinit JOIN pg_catalog.pg_namespace ni ON ni.oid=pi.pronamespace
             JOIN pg_catalog.pg_proc pl ON pl.oid=t.tmpllexize JOIN pg_catalog.pg_namespace nl ON nl.oid=pl.pronamespace
             WHERE n.nspname=$1 AND t.tmplname='unaccent'`,
                [unaccentProofSchema],
              );
              assert.deepEqual(native.rows, [
                {
                  name: "unaccent",
                  initSchema: unaccentProofSchema,
                  init: "unaccent_init",
                  initArguments: "internal",
                  initResult: "internal",
                  lexizeSchema: unaccentProofSchema,
                  lexize: "unaccent_lexize",
                  lexizeArguments: "internal, internal, internal, internal",
                  lexizeResult: "internal",
                },
              ]);
              assert.deepEqual(facts.template, {
                schema: unaccentProofSchema,
                name: "unaccent",
                member: 'text search template:"$extension:unaccent".unaccent',
                init: "routine:$extension:unaccent.unaccent_init(pg_catalog.internal)",
                lexize:
                  "routine:$extension:unaccent.unaccent_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
              });
              for (const reference of [facts.installed.reference, facts.created.reference]) {
                for (const [input, lexemes] of [
                  ["Æther", ["AEther"]],
                  ["e\u0301", ["e"]],
                ] as const) {
                  assert.deepEqual(
                    (
                      await client.query(
                        "SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,$3::text) AS lexemes",
                        [reference.schema, reference.name, input],
                      )
                    ).rows,
                    [{ lexemes: [...lexemes] }],
                  );
                }
              }
            });
          },
        );
      } finally {
        await connection.close();
      }
    });
  },
  120000,
);
