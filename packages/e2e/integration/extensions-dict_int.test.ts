import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/dict_int.json";
import graphSource from "../../../apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { extensionTextSearchCaptureValidator } from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import { verifyExtensionApiContracts } from "../../../apps/loom/src/tooling/extensions/verify";
import { createDictInt_1_0, dictionaryReference } from "../../../apps/loom/src/core/extensions/adapters/dict_int";
import { withDictIntDictionaries } from "../../../apps/loom/src/tooling/extensions/operations/dict_int";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { dictIntDescriptor, dictIntInstall } from "../fixtures/dict_int";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { wave10CallbackProofCase } from "../fixtures/wave10-callback-proof-cases";

async function lexize(client: pg.Client, schema: string, name: string, token: string | null) {
  const result = await client.query(
    "SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,$3::text) AS lexemes",
    [schema, name, token],
  );
  return result.rows[0]?.lexemes ?? null;
}

const proof = wave10CallbackProofCase("dict_int");
const witness = (index: number) => ({ ...proof.claims[index]!, schema: dictIntDescriptor.schema });
extensionProofTest(proof, async () => {
  await withExtensionDatabase(async (url) =>
    extensionProofWitness(witness(0), async () => {
      const api = createDictInt_1_0(dictIntDescriptor);
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(dictIntInstall);
        await observeExtensionProofDatabase(url, proof.id, "dict_int");
        expect(api.dictionary).toMatchObject({ schema: dictIntDescriptor.schema, name: "intdict" });
        const defaults = [
          await lexize(client, dictIntDescriptor.schema, "intdict", "12345678"),
          await lexize(client, dictIntDescriptor.schema, "intdict", "123"),
          await lexize(client, dictIntDescriptor.schema, "intdict", "-123"),
          await lexize(client, dictIntDescriptor.schema, "intdict", null),
        ];
        const defaultOracle = await client.query(
          `SELECT pg_catalog.ts_lexize('"dict""int".intdict'::pg_catalog.regdictionary, token) AS lexemes
         FROM (VALUES ('12345678'), ('123'), ('-123'), (NULL)) AS input(token)`,
        );
        expect(defaults).toEqual(defaultOracle.rows.map((row) => row.lexemes));
        expect(defaults[0]).toEqual(["123456"]);
        expect(defaults[3]).toBeNull();
        const custom = dictionaryReference({ schema: 'custom"dictionaries', name: 'digits"; drop schema public;--' });
        await extensionProofWitness(witness(1), async () => {
          const created = await withDictIntDictionaries(url, dictIntDescriptor, async (dictionaries) => {
            const template = await dictionaries.inspectTemplate();
            expect(template).toEqual({
              schema: dictIntDescriptor.schema,
              name: "intdict_template",
              member: 'text search template:"$extension:dict_int".intdict_template',
              init: "routine:$extension:dict_int.dintdict_init(pg_catalog.internal)",
              lexize:
                "routine:$extension:dict_int.dintdict_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
            });
            const installed = await dictionaries.inspectDictionary();
            expect(installed.parsed).toEqual({ maxlen: 6, rejectlong: false, absval: false });
            const made = await dictionaries.createDictionary(custom, { maxlen: 4, rejectlong: true, absval: true });
            expect(made.parsed).toEqual({ maxlen: 4, rejectlong: true, absval: true });
            return made;
          });
          expect(created.completion).toBe("committed");
          // rejectlong marks an overlong recognized token as a stop word (empty lexemes); NULL means unrecognized.
          expect(await lexize(client, custom.schema, custom.name, "12345678")).toEqual([]);
          expect(await lexize(client, custom.schema, custom.name, "1234")).toEqual(["1234"]);
          expect(await lexize(client, custom.schema, custom.name, "-123")).toEqual(["123"]);
        });
        for (const sqlText of [
          `SELECT "${dictIntDescriptor.schema.replaceAll('"', '""')}"."dintdict_init"(NULL)`,
          `SELECT "${dictIntDescriptor.schema.replaceAll('"', '""')}"."dintdict_lexize"(NULL, NULL, NULL, NULL)`,
        ]) {
          await expect(client.query(sqlText)).rejects.toThrow();
        }
      } finally {
        await client.end();
      }
    }),
  );
});

test("dict_int.toolingRollsBackFailedCreatesAndRejectsForeignTemplates", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      await client.query(dictIntInstall);
      const missing = dictionaryReference({ schema: 'custom"dictionaries', name: "missing" });
      await assert.rejects(
        withDictIntDictionaries(url, dictIntDescriptor, async (dictionaries) => {
          await dictionaries.alterDictionary(missing, { maxlen: 2 });
        }),
        (error) => error instanceof ExtensionOperationError && error.completion === "rolled-back",
      );
      const rolled = dictionaryReference({ schema: 'custom"dictionaries', name: "rolled" });
      await assert.rejects(
        withDictIntDictionaries(url, dictIntDescriptor, async (dictionaries) => {
          await dictionaries.createDictionary(rolled, { maxlen: 3 });
          throw new Error("force rollback");
        }),
        (error) => error instanceof ExtensionOperationError && error.completion === "rolled-back",
      );
      const leftover = await client.query(
        `SELECT d.dictname FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace
         WHERE n.nspname=$1 AND d.dictname=$2`,
        [rolled.schema, rolled.name],
      );
      expect(leftover.rows).toEqual([]);
    } finally {
      await client.end();
    }
  });
});

test("dict_int tooling manages dictionary options across successive sessions with native ownership checks", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      await client.query(dictIntInstall);
      const requirement = {
        schema: dictIntDescriptor.schema,
        manifest: v.parse(extensionManifestValidator, manifestSource),
        textSearch: v.parse(extensionTextSearchCaptureValidator, graphSource),
      };
      await verifyExtensionApiContracts(client, [requirement]);
      const [authority] = (
        await client.query<{ may_alter: boolean }>(
          `SELECT r.rolsuper OR pg_catalog.pg_has_role(current_user,d.dictowner,'USAGE') AS may_alter
         FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace
         CROSS JOIN pg_catalog.pg_roles r WHERE n.nspname=$1 AND d.dictname='intdict' AND r.rolname=current_user`,
          [dictIntDescriptor.schema],
        )
      ).rows;
      assert(authority);
      const installed = dictionaryReference({ schema: dictIntDescriptor.schema, name: "intdict" });
      const dictionary = authority.may_alter
        ? installed
        : dictionaryReference({ schema: 'custom"dictionaries', name: "successive_options" });
      if (authority.may_alter) {
        await withDictIntDictionaries(url, dictIntDescriptor, (operations) =>
          operations.alterDictionary(dictionary, { maxlen: 4 }),
        );
      } else {
        // Neon owns the installed dictionary. The operator can manage its own dictionary using the same template.
        await expect(
          withDictIntDictionaries(url, dictIntDescriptor, (operations) =>
            operations.alterDictionary(installed, { maxlen: 4 }),
          ),
        ).rejects.toMatchObject({ completion: "rolled-back", cause: { code: "42501" } });
        await withDictIntDictionaries(url, dictIntDescriptor, (operations) =>
          operations.createDictionary(dictionary, { maxlen: 4 }),
        );
      }
      const observed = await withDictIntDictionaries(url, dictIntDescriptor, async (operations) => {
        const first = await operations.inspectDictionary(dictionary);
        expect(first.parsed.maxlen).toBe(4);
        return operations.alterDictionary(dictionary, { maxlen: 3, rejectlong: true });
      });
      expect(observed.completion).toBe("committed");
      expect(observed.value.parsed).toEqual({ maxlen: 3, rejectlong: true, absval: false });
      expect(await lexize(client, dictionary.schema, dictionary.name, "1234")).toEqual([]);
      expect(await lexize(client, dictionary.schema, dictionary.name, "123")).toEqual(["123"]);
      if (authority.may_alter)
        await assert.rejects(verifyExtensionApiContracts(client, [requirement]), /text-search contract mismatch/);
      else await verifyExtensionApiContracts(client, [requirement]);
    } finally {
      await client.end();
    }
  });
});
