import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import type { ExtensionManifest } from "../../../apps/loom/src/core/extensions/contracts";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import {
  captureExtensionTextSearch,
  createExtensionTextSearchCapture,
} from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import { verifyExtensionApiContracts } from "../../../apps/loom/src/tooling/extensions/verify";

const provider = process.env.LOOM_EXTENSION_TEST_PROVIDER ?? "local-postgresql";

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "a prior structural pin verifies a new installation in a differently quoted namespace",
  async () => {
    let pinned: ExtensionManifest | undefined;
    for (const namespace of ['pin"source', 'target "placement"']) {
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        const schema = `"${namespace.replaceAll('"', '""')}"`;
        try {
          await client.query(`CREATE SCHEMA ${schema}; CREATE EXTENSION pg_trgm SCHEMA ${schema} VERSION '1.6'`);
          if (!pinned)
            pinned = await captureExtensionContract(client, {
              name: "pg_trgm",
              provider,
              fixture: "portable-source-pin",
            });
          await verifyExtensionApiContracts(client, [{ schema: namespace, manifest: pinned }]);
          expect(pinned.provenance.installationSchema).toBe('pin"source');
        } finally {
          await client.end();
        }
      });
    }
  },
);

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "fresh SQL verification rejects actual same-version return, operator and PUBLIC privilege drift",
  async () => {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      const namespace = 'Verify "API"';
      const schema = '"Verify ""API"""';
      try {
        await client.query(`CREATE SCHEMA ${schema}; CREATE EXTENSION pg_trgm SCHEMA ${schema} VERSION '1.6';
        CREATE FUNCTION ${schema}.verify_signature(value text) RETURNS text LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT value';
        ALTER EXTENSION pg_trgm ADD FUNCTION ${schema}.verify_signature(text);
        CREATE OPERATOR ${schema}.~#~ (FUNCTION=pg_catalog.int4eq,LEFTARG=integer,RIGHTARG=integer);
        ALTER EXTENSION pg_trgm ADD OPERATOR ${schema}.~#~(integer,integer)`);
        const manifest = await captureExtensionContract(client, {
          name: "pg_trgm",
          provider,
          fixture: "disposable-api-verification",
        });
        const requirement = { schema: namespace, manifest };
        const installation = async () =>
          (
            await client.query(
              "SELECT e.extname,e.extversion,n.nspname FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_trgm'",
            )
          ).rows;
        const installed = await installation();
        await verifyExtensionApiContracts(client, [requirement]);
        await assert.rejects(
          verifyExtensionApiContracts(client, [{ ...requirement, schema: "wrong_schema" }]),
          /namespace/,
        );
        const mutations = [
          `ALTER EXTENSION pg_trgm DROP FUNCTION ${schema}.verify_signature(text);
         DROP FUNCTION ${schema}.verify_signature(text);
         CREATE FUNCTION ${schema}.verify_signature(value text) RETURNS integer LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT length(value)';
         ALTER EXTENSION pg_trgm ADD FUNCTION ${schema}.verify_signature(text)`,
          `ALTER EXTENSION pg_trgm DROP OPERATOR ${schema}.~#~(integer,integer);
         DROP OPERATOR ${schema}.~#~(integer,integer);
         CREATE OPERATOR ${schema}.~#~ (FUNCTION=pg_catalog.int4ne,LEFTARG=integer,RIGHTARG=integer);
         ALTER EXTENSION pg_trgm ADD OPERATOR ${schema}.~#~(integer,integer)`,
          `REVOKE EXECUTE ON FUNCTION ${schema}.verify_signature(text) FROM PUBLIC`,
        ];
        for (const mutation of mutations) {
          await client.query("BEGIN");
          try {
            await client.query(mutation);
            expect(await installation()).toEqual(installed);
            await assert.rejects(verifyExtensionApiContracts(client, [requirement]), /SQL contract mismatch/);
          } finally {
            await client.query("ROLLBACK");
          }
          await verifyExtensionApiContracts(client, [requirement]);
        }
        expect(await installation()).toEqual(installed);
      } finally {
        await client.end();
      }
    });
  },
);

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "fresh Unaccent verification compares actual dictionary options against the pinned graph",
  async () => {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      const schema = '"search""verify"';
      try {
        await client.query(`CREATE SCHEMA ${schema}; CREATE EXTENSION unaccent SCHEMA ${schema} VERSION '1.1'`);
        const manifest = await captureExtensionContract(client, {
          name: "unaccent",
          provider,
          fixture: "disposable-api-verification",
        });
        const graph = await captureExtensionTextSearch(client, manifest, {
          provider,
          fixture: "disposable-api-verification",
        });
        const requirement = { schema: 'search"verify', manifest, textSearch: graph };
        await verifyExtensionApiContracts(client, [requirement]);
        const differentOptions = createExtensionTextSearchCapture(
          manifest,
          {
            ...graph.contract,
            dictionaries: graph.contract.dictionaries.map((dictionary) => ({
              ...dictionary,
              options: "rules = 'different'",
            })),
          },
          graph.provenance,
        );
        assert.notEqual(differentOptions.digest, graph.digest);
        await assert.rejects(
          verifyExtensionApiContracts(client, [{ ...requirement, textSearch: differentOptions }]),
          /text-search contract mismatch/,
        );
        await verifyExtensionApiContracts(client, [requirement]);
        await client.query("BEGIN");
        try {
          const privileges = await client.query<{ superuser: boolean }>(
            "SELECT current_setting('is_superuser')='on' AS superuser",
          );
          if (privileges.rows[0]?.superuser) {
            await client.query(`ALTER EXTENSION unaccent DROP TEXT SEARCH DICTIONARY ${schema}.unaccent;
            DROP TEXT SEARCH DICTIONARY ${schema}.unaccent;
            CREATE TEXT SEARCH DICTIONARY ${schema}.unaccent (TEMPLATE=pg_catalog.simple);
            ALTER EXTENSION unaccent ADD TEXT SEARCH DICTIONARY ${schema}.unaccent`);
            // The historical member manifest does not record dictionary pointers; the live supplementary graph must.
            expect(
              (await captureExtensionContract(client, { name: "unaccent", provider, fixture: "changed-dictionary" }))
                .digest,
            ).toBe(manifest.digest);
            await assert.rejects(verifyExtensionApiContracts(client, [requirement]), /foreign|cross-schema/);
          } else {
            // Neon owns the installed dictionary. Observe the restriction instead of claiming this mutation ran there.
            await assert.rejects(
              client.query(`ALTER EXTENSION unaccent DROP TEXT SEARCH DICTIONARY ${schema}.unaccent`),
              { code: "42501" },
            );
          }
        } finally {
          await client.query("ROLLBACK");
        }
        await verifyExtensionApiContracts(client, [requirement]);
        expect(
          (await captureExtensionContract(client, { name: "unaccent", provider, fixture: "after-verification" }))
            .digest,
        ).toBe(manifest.digest);
      } finally {
        await client.end();
      }
    });
  },
);
