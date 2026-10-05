import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import {
  captureExtensionTextSearch,
  validateExtensionTextSearchCapture,
  type ExtensionTextSearchCapture,
} from "../../../apps/loom/src/tooling/extensions/text-search-capture";

const dictionaryId = 'text search dictionary:"$extension:unaccent".unaccent';
const templateId = 'text search template:"$extension:unaccent".unaccent';
const initId = "routine:$extension:unaccent.unaccent_init(pg_catalog.internal)";
const lexizeId =
  "routine:$extension:unaccent.unaccent_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)";
// The runner supplies its observed environment profile; this string does not authenticate the provider.
const provider = process.env.LOOM_EXTENSION_TEST_PROVIDER ?? "local-postgresql";

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "unaccent relationships resolve exact owned registrations with stable symbolic digests across schemas and OIDs",
  async () => {
    const artifacts: ExtensionTextSearchCapture[] = [];
    const liveTemplateOids: number[] = [];
    for (const [index, namespace] of ['Search "One"', "custom_search_two"].entries()) {
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        const schema = `"${namespace.replaceAll('"', '""')}"`;
        try {
          if (index) await client.query("CREATE TYPE public.text_search_oid_noise AS ENUM ('noise')");
          await client.query(`CREATE SCHEMA ${schema}`);
          await client.query(`CREATE EXTENSION unaccent SCHEMA ${schema} VERSION '1.1'`);
          const source = await captureExtensionContract(client, {
            name: "unaccent",
            provider,
            fixture: `disposable-text-search-${index}`,
          });
          const sourceBytes = JSON.stringify(source);
          const artifact = await captureExtensionTextSearch(client, source, {
            provider,
            fixture: `disposable-text-search-${index}`,
          });
          artifacts.push(artifact);
          expect(validateExtensionTextSearchCapture(artifact, source)).toEqual(artifact);
          expect(JSON.stringify(source)).toBe(sourceBytes);
          expect(artifact.contract.manifestDigest).toBe(source.digest);
          expect(artifact.provenance.installationSchema).toBe(namespace);
          expect(artifact.contract.dictionaries).toEqual([
            { id: dictionaryId, template: templateId, options: "rules = 'unaccent'" },
          ]);
          expect(artifact.contract.templates).toEqual([{ id: templateId, init: initId, lexize: lexizeId }]);
          expect(JSON.stringify(artifact.contract)).not.toContain(namespace);
          expect(JSON.stringify(artifact)).not.toContain('"oid":');

          const registrations = await client.query<{
            dictionary: string;
            template: string;
            init: string;
            lexize: string;
            dictionarySchema: string;
            templateSchema: string;
            initSchema: string;
            lexizeSchema: string;
            owner: string;
            templateOid: number;
            initArguments: string;
            lexizeArguments: string;
          }>(
            `SELECT d.dictname AS dictionary,t.tmplname AS template,i.proname AS init,l.proname AS lexize,
            dn.nspname AS "dictionarySchema",tn.nspname AS "templateSchema",ins.nspname AS "initSchema",lns.nspname AS "lexizeSchema",
            pg_get_userbyid(d.dictowner) AS owner,t.oid::integer AS "templateOid",
            pg_get_function_identity_arguments(i.oid) AS "initArguments",pg_get_function_identity_arguments(l.oid) AS "lexizeArguments"
            FROM pg_ts_dict d JOIN pg_namespace dn ON dn.oid=d.dictnamespace
            JOIN pg_ts_template t ON t.oid=d.dicttemplate JOIN pg_namespace tn ON tn.oid=t.tmplnamespace
            JOIN pg_proc i ON i.oid=t.tmplinit JOIN pg_namespace ins ON ins.oid=i.pronamespace
            JOIN pg_proc l ON l.oid=t.tmpllexize JOIN pg_namespace lns ON lns.oid=l.pronamespace
            WHERE dn.nspname=$1 AND d.dictname='unaccent'`,
            [namespace],
          );
          expect(registrations.rows).toHaveLength(1);
          const registration = registrations.rows[0];
          if (!registration) throw new Error("Missing native text-search registrations");
          liveTemplateOids.push(registration.templateOid);
          expect(registration).toMatchObject({
            dictionary: "unaccent",
            template: "unaccent",
            init: "unaccent_init",
            lexize: "unaccent_lexize",
            dictionarySchema: namespace,
            templateSchema: namespace,
            initSchema: namespace,
            lexizeSchema: namespace,
            initArguments: "internal",
            lexizeArguments: "internal, internal, internal, internal",
          });
          expect(artifact.provenance.dictionaryOwners).toEqual([{ id: dictionaryId, owner: registration.owner }]);

          // A new backend observes initialization and lexization through supported native entry points.
          const native = new pg.Client({ connectionString: url });
          await native.connect();
          try {
            const result = await native.query<{ text: string; lexemes: string[] }>(
              `SELECT ${schema}.unaccent($1::text) AS text,pg_catalog.ts_lexize($2::regdictionary,$3::text) AS lexemes`,
              ["Hôtel Æsir", `${schema}.unaccent`, "Hôtel"],
            );
            expect(result.rows).toEqual([{ text: "Hotel AEsir", lexemes: ["Hotel"] }]);
          } finally {
            await native.end();
          }
        } finally {
          await client.end();
        }
      });
    }
    expect(liveTemplateOids).toHaveLength(2);
    expect(liveTemplateOids[0]).not.toBe(liveTemplateOids[1]);
    expect(artifacts[0]?.contract).toEqual(artifacts[1]?.contract);
    expect(artifacts[0]?.digest).toBe(artifacts[1]?.digest);
  },
);

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "actual dictionary membership drift, missing templates and provider ownership restrictions preserve capture checks",
  async () => {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      const schema = '"Drift ""Search"""';
      try {
        await client.query(`CREATE SCHEMA ${schema}`);
        await client.query(`CREATE EXTENSION unaccent SCHEMA ${schema} VERSION '1.1'`);
        const source = await captureExtensionContract(client, {
          name: "unaccent",
          provider,
          fixture: "disposable-text-search-drift",
        });
        const options = { provider, fixture: "disposable-text-search-drift" };
        const baseline = await captureExtensionTextSearch(client, source, options);

        await client.query("BEGIN");
        try {
          await client.query(
            `CREATE TEXT SEARCH DICTIONARY ${schema}.owned_dictionary (TEMPLATE=${schema}.unaccent, RULES='unaccent')`,
          );
          await client.query(`ALTER EXTENSION unaccent ADD TEXT SEARCH DICTIONARY ${schema}.owned_dictionary`);
          await assert.rejects(captureExtensionTextSearch(client, source, options), /duplicate/);
        } finally {
          await client.query("ROLLBACK");
        }
        expect((await captureExtensionTextSearch(client, source, options)).digest).toBe(baseline.digest);

        await client.query("BEGIN");
        try {
          const privileges = await client.query<{ superuser: boolean }>(
            "SELECT current_setting('is_superuser')='on' AS superuser",
          );
          if (privileges.rows[0]?.superuser) {
            await client.query(`ALTER EXTENSION unaccent DROP TEXT SEARCH DICTIONARY ${schema}.unaccent`);
            await client.query(`ALTER EXTENSION unaccent DROP TEXT SEARCH TEMPLATE ${schema}.unaccent`);
            await assert.rejects(captureExtensionTextSearch(client, source, options), /Missing/);
          } else {
            await assert.rejects(
              client.query(`ALTER EXTENSION unaccent DROP TEXT SEARCH TEMPLATE ${schema}.unaccent`),
              { code: "42501" },
            );
          }
        } finally {
          await client.query("ROLLBACK");
        }
        expect((await captureExtensionTextSearch(client, source, options)).digest).toBe(baseline.digest);
      } finally {
        await client.end();
      }
    });
  },
);
