import { test, expect } from "bun:test";
import { writeFile } from "node:fs/promises";
import pg from "pg";
import * as v from "valibot";
import source from "../../../apps/loom/src/tooling/extensions/manifests/dict_int.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { captureExtensionTextSearch } from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import { withExtensionDatabase } from "../fixtures/extension-database";

test("dict_int captures native dictionary/template callbacks across qualified installations", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const manifest = v.parse(extensionManifestValidator, source);
      const schema = 'Dict "整数"';
      await client.query(
        `CREATE SCHEMA ${pg.escapeIdentifier(schema)}; CREATE EXTENSION dict_int WITH SCHEMA ${pg.escapeIdentifier(schema)} VERSION '1.0'`,
      );
      const artifact = await captureExtensionTextSearch(client, manifest, {
        provider: "neon",
        fixture: process.env.LOOM_EXTENSION_PROOF_RUN_ID ?? "local-dict-int-text-search",
      });
      const native = await client.query<{
        dictionary: string;
        template: string;
        init: string;
        lexize: string;
        options: string | null;
      }>(
        `SELECT d.dictname AS dictionary,t.tmplname AS template,i.proname AS init,l.proname AS lexize,d.dictinitoption AS options
         FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate
         JOIN pg_catalog.pg_proc i ON i.oid=t.tmplinit JOIN pg_catalog.pg_proc l ON l.oid=t.tmpllexize
         JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace WHERE n.nspname=$1 AND d.dictname='intdict'`,
        [schema],
      );
      expect(native.rows).toEqual([
        {
          dictionary: "intdict",
          template: "intdict_template",
          init: "dintdict_init",
          lexize: "dintdict_lexize",
          options: null,
        },
      ]);
      expect(artifact.contract.dictionaries).toEqual([
        {
          id: 'text search dictionary:"$extension:dict_int".intdict',
          template: 'text search template:"$extension:dict_int".intdict_template',
          options: native.rows[0]!.options,
        },
      ]);
      expect(artifact.contract.templates).toEqual([
        {
          id: 'text search template:"$extension:dict_int".intdict_template',
          init: "routine:$extension:dict_int.dintdict_init(pg_catalog.internal)",
          lexize:
            "routine:$extension:dict_int.dintdict_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
        },
      ]);
      expect(artifact.provenance.installationSchema).toBe(schema);
      const moved = 'Moved "整数"';
      // Neon's operator can install into a schema but does not own the provider's C callbacks for ALTER SET SCHEMA.
      await client.query(
        `CREATE SCHEMA ${pg.escapeIdentifier(moved)}; DROP EXTENSION dict_int; CREATE EXTENSION dict_int WITH SCHEMA ${pg.escapeIdentifier(moved)} VERSION '1.0'`,
      );
      const relocated = await captureExtensionTextSearch(client, manifest, {
        provider: "neon",
        fixture: "dict-int-relocated-native",
      });
      expect(relocated.digest).toBe(artifact.digest);
      expect(relocated.provenance.installationSchema).toBe(moved);
      const output = process.env.LOOM_EXTENSION_TEXT_SEARCH_OUTPUT;
      if (output) await writeFile(output, JSON.stringify(artifact, null, 2) + "\n", { mode: 0o600, flag: "wx" });
    } finally {
      await client.end();
    }
  });
});
