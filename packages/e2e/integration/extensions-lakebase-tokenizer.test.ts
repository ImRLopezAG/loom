import assert from "node:assert/strict";
import pg from "pg";
import { sql, defineRelations } from "drizzle-orm";
import {
  createLakebaseTokenizer_0_1_1,
  dictionaryReference,
} from "../../../apps/loom/src/core/extensions/adapters/lakebase_tokenizer";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withLakebaseTokenizer } from "../../../apps/loom/src/tooling/extensions/operations/lakebase_tokenizer";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/lakebase_tokenizer.json";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  lakebaseTokenizerDatabaseProofCase,
  lakebaseTokenizerProofFamily,
} from "../fixtures/lakebase-tokenizer-proof-cases";

extensionProofTest(
  lakebaseTokenizerDatabaseProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      const placement = 'token"izer',
        dictionarySchema = 'dict"schema';
      const q = pg.escapeIdentifier;
      const descriptor = {
        name: "lakebase_tokenizer",
        version: "0.1.1",
        schema: placement,
        apiSupport: { status: "verified", digest: manifest.digest },
      } as const;
      const api = createLakebaseTokenizer_0_1_1(descriptor);
      const dictionary = dictionaryReference({ schema: dictionarySchema, name: "words" });
      const storageSchema = defineSchema(
        () => ({
          rows: defineTable({
            stopword: api.fields.stopword(),
            synonym: api.fields.synonym(),
            stopwordArray: api.fields.stopwordArray(),
            synonymArray: api.fields.synonymArray(),
          }),
        }),
        { namespace: "app" },
      );
      const connect = () =>
        connectDatabase({
          schema: storageSchema,
          relations: defineRelations(storageSchema.tables),
          connectionString: url,
        });
      let connection: Awaited<ReturnType<typeof connect>> | undefined;
      try {
        await client.connect();
        await client.query(
          `CREATE SCHEMA ${q(placement)}; CREATE SCHEMA ${q(dictionarySchema)}; CREATE EXTENSION lakebase_tokenizer WITH SCHEMA ${q(placement)} VERSION '0.1.1'`,
        );
        const observed = await captureExtensionContract(client, {
          name: "lakebase_tokenizer",
          provider: "neon",
          fixture: "native-tokenizer-family",
        });
        assert.equal(observed.digest, manifest.digest);
        await observeExtensionProofDatabase(url, lakebaseTokenizerDatabaseProofCase.id, "lakebase_tokenizer");
        const created = await withLakebaseTokenizer(url, descriptor, async (operations) => {
          assert.deepEqual(await operations.inspectTemplate(), {
            schema: placement,
            name: "tokenizer_wholeword",
            init: "lakebase_tokenizer_wholeword_init",
            lexize: "lakebase_tokenizer_wholeword_lexize",
          });
          return operations.createDictionary(dictionary);
        });
        assert.equal(created.completion, "committed");
        for (const statement of await migrationStatements(
          await emptySnapshot("app"),
          await createSnapshot(storageSchema),
        ))
          await client.query(statement);
        connection = await connect();
        async function lexize(input: string | null) {
          assert(connection);
          const rows = await connection.transaction((db) =>
            db.select({ value: api.lexize(dictionary, input) }).from(sql`(values (1)) fixture(n)`),
          );
          const native = await client.query("SELECT pg_catalog.ts_lexize($1::regdictionary,$2::text)::text AS value", [
            `${q(dictionarySchema)}.${q(dictionary.name)}`,
            input,
          ]);
          assert.deepEqual(rows[0]!.value, api.codecs.lexemes.decode(native.rows[0].value));
          return rows[0]!.value;
        }
        assert.deepEqual((await lexize("RUNNING"))?.values, ["running"]);
        assert.deepEqual((await lexize("Café's"))?.values, ["café"]);
        assert.equal(await lexize(null), null);
        await lexize("");
        const normalized = {
          NFC: "ﬁcafé",
          NFD: "ﬁcafe\u0301",
          NFKC: "ficafé",
          NFKD: "ficafe\u0301",
          none: "ﬁcafe\u0301",
        };
        for (const normalize of ["NFC", "NFD", "NFKC", "NFKD", "none"] as const) {
          const changed = await withLakebaseTokenizer(url, descriptor, (operations) =>
            operations.alterDictionary(dictionary, { normalize }),
          );
          assert.equal(changed.value.storedVectors, "regeneration-required");
          assert.deepEqual((await lexize("ﬁcafe\u0301"))?.values, [normalized[normalize]]);
        }
        await withLakebaseTokenizer(url, descriptor, async (operations) => {
          await operations.alterDictionary(dictionary, {
            normalize: null,
            lowercase: true,
            englishPossessive: true,
            stripAccents: true,
            stemmer: "english",
            stopwords: "stop",
            synonyms: "syn",
          });
          assert.equal((await operations.replaceStopwords("stop", ["the", "running"])).dictionaryCache, "reloaded");
          const edited = await operations.replaceSynonyms("syn", [{ word: "usa", synonym: "ponies" }]);
          assert.equal(edited.dictionaries.length, 1);
          assert.deepEqual(await operations.listStopwords("stop"), [
            { name: "stop", word: "running" },
            { name: "stop", word: "the" },
          ]);
          assert.deepEqual(await operations.listSynonyms("syn"), [{ name: "syn", word: "usa", synonym: "ponies" }]);
        });
        assert.deepEqual((await lexize("The"))?.values, []);
        assert.deepEqual((await lexize("Running"))?.values, []);
        assert.deepEqual((await lexize("USA"))?.values, ["ponies"]);
        assert.deepEqual((await lexize("Cats"))?.values, ["cat"]);
        assert.deepEqual((await lexize("Café's"))?.values, ["cafe"]);
        await withLakebaseTokenizer(url, descriptor, async (operations) => {
          await operations.alterDictionary(dictionary, {
            stopwords: null,
            synonyms: null,
            stemmer: null,
            stripAccents: false,
            lowercase: false,
            englishPossessive: false,
          });
          await operations.reloadDictionary(dictionary);
        });
        assert.deepEqual((await lexize("Café's"))?.values, ["Café's"]);
        assert.deepEqual((await lexize("Cats"))?.values, ["Cats"]);

        const sw = api.stopwords("sw"),
          syn = api.synonyms("syn");
        assert.deepEqual(
          await connection.transaction((db) => db.select(sw.columns).from(sw.from).orderBy(sw.columns.word)),
          [
            { name: "stop", word: "running" },
            { name: "stop", word: "the" },
          ],
        );
        assert.deepEqual(await connection.transaction((db) => db.select(syn.columns).from(syn.from)), [
          { name: "syn", word: "usa", synonym: "ponies" },
        ]);
        const composites =
          await client.query(`SELECT ROW(NULL,'café')::${q(placement)}.lakebase_tokenizer_stopwords::text AS sw,
        ROW('a',NULL,'b')::${q(placement)}.lakebase_tokenizer_synonyms::text AS syn,
        ('[0:1]={"(a,b,c)",NULL}')::${q(placement)}.lakebase_tokenizer_synonyms[]::text AS arr`);
        assert.deepEqual(api.codecs.stopword.decode(composites.rows[0].sw), { name: null, word: "café" });
        assert.deepEqual(api.codecs.synonym.decode(composites.rows[0].syn), { name: "a", word: null, synonym: "b" });
        assert.deepEqual(api.codecs.synonymArray.decode(composites.rows[0].arr), {
          dimensions: [{ lowerBound: 0, length: 2 }],
          values: [{ name: "a", word: "b", synonym: "c" }, null],
        });
        const row = {
          stopword: { name: null, word: "café" },
          synonym: { name: "a", word: null, synonym: "b" },
          stopwordArray: { dimensions: [{ lowerBound: -1, length: 2 }], values: [{ name: null, word: "café" }, null] },
          synonymArray: {
            dimensions: [{ lowerBound: 0, length: 2 }],
            values: [{ name: "a", word: null, synonym: "b" }, null],
          },
        };
        await connection.transaction((db) => db.insert(storageSchema.tables.rows).values(row));
        const stored = await connection.transaction((db) => db.select().from(storageSchema.tables.rows));
        assert.equal(stored.length, 1);
        for (const key of ["stopword", "synonym", "stopwordArray", "synonymArray"] as const)
          assert.deepEqual(stored[0]![key], row[key]);
        const constraints = manifest.contract.members.filter(
          (member) => member.kind === "other" && member.objectType === "table constraint",
        );
        for (const constraint of constraints) {
          const synonyms = constraint.id.includes("lakebase_tokenizer_synonyms");
          const relation = synonyms ? "lakebase_tokenizer_synonyms" : "lakebase_tokenizer_stopwords";
          const args: (string | null)[] = synonyms ? ["test", "test", "test"] : ["test", "test"];
          if (constraint.name.includes("name_check")) args[0] = "é".repeat(129);
          if (constraint.name.includes("word_check")) args[1] = "x".repeat(1025);
          if (constraint.name.includes("synonym_check")) args[2] = "x".repeat(1025);
          if (constraint.name.includes("name_not_null")) args[0] = null;
          if (constraint.name.includes("word_not_null")) args[1] = null;
          if (constraint.name.includes("synonym_not_null")) args[2] = null;
          const insert = `INSERT INTO ${q(placement)}.${q(relation)} VALUES (${args.map((_, index) => `$${index + 1}`).join(",")})`;
          await client.query("BEGIN");
          try {
            if (constraint.name.includes("pkey")) await client.query(insert, args);
            await assert.rejects(client.query(insert, args), (error: Error) => {
              if (!(error instanceof pg.DatabaseError)) return false;
              // PostgreSQL 18 reports NOT NULL violations with table/column, without a constraint name.
              if (constraint.name.includes("_not_null")) {
                const column = constraint.name.includes("name_not_null")
                  ? "name"
                  : constraint.name.includes("word_not_null")
                    ? "word"
                    : "synonym";
                return error.code === "23502" && error.table === relation && error.column === column;
              }
              return error.constraint === constraint.name.split(" on ")[0];
            });
          } finally {
            await client.query("ROLLBACK");
          }
        }
        // The captured graph and completed native scenarios witness every object, including pointer callbacks and storage attachments.
        for (const member of manifest.contract.members)
          await extensionProofWitness(
            {
              family: lakebaseTokenizerProofFamily,
              member: member.id,
              scenario: "exact-native-catalog-and-family-behavior",
              schema: placement,
            },
            () => {
              assert.deepEqual(
                observed.contract.members.find((value) => value.id === member.id),
                member,
              );
            },
          );
        await connection.close();
        connection = undefined;
        await client.query(`CREATE SCHEMA relocated`);
        const relocationAuthority = await client.query<{ canRelocate: boolean }>(
          `SELECT r.rolsuper OR bool_and(pg_catalog.pg_has_role(t.typowner, 'USAGE')) AS "canRelocate"
           FROM pg_catalog.pg_type t
           JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
           CROSS JOIN pg_catalog.pg_roles r
           WHERE n.nspname = $1 AND r.rolname = CURRENT_USER
           GROUP BY r.rolsuper`,
          [placement],
        );
        assert.equal(relocationAuthority.rowCount, 1);
        const canRelocate = relocationAuthority.rows[0]!.canRelocate;
        if (canRelocate) await client.query(`ALTER EXTENSION lakebase_tokenizer SET SCHEMA relocated`);
        else {
          // Neon installs these types as cloud_admin; native ownership checks still govern relocation.
          await assert.rejects(client.query(`ALTER EXTENSION lakebase_tokenizer SET SCHEMA relocated`), {
            code: "42501",
          });
        }
        const relocated = await captureExtensionContract(client, {
          name: "lakebase_tokenizer",
          provider: "neon",
          fixture: "native-tokenizer-relocated",
        });
        assert.equal(relocated.digest, manifest.digest);
        assert.equal(relocated.provenance.installationSchema, canRelocate ? "relocated" : placement);
      } finally {
        try {
          await connection?.close();
        } finally {
          await client.end();
        }
      }
    });
  },
  180000,
);
