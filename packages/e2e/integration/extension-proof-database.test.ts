import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  observeExtensionProofDatabase,
  collectExtensionProofDatabaseObservations,
  type ExtensionProofDatabaseObservation,
} from "../fixtures/extension-proof-database";
import { validateExtensionSubscriptCapture } from "../../../apps/loom/src/tooling/extensions/subscript-capture";
import dictIntManifest from "../../../apps/loom/src/tooling/extensions/manifests/dict_int.json";
import dictIntGraph from "../../../apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { extensionTextSearchCaptureValidator } from "../../../apps/loom/src/tooling/extensions/text-search-capture";

test("dict_int proof observations require their exact captured text-search graph", () => {
  // Structural collector regression only; this fabricated event is never retained as provider acceptance.
  const observation: ExtensionProofDatabaseObservation = structuredClone({
    runId: "collector.fixture",
    caseId: "dict_int.fixture",
    databaseFingerprint: "a".repeat(64),
    manifest: v.parse(extensionManifestValidator, dictIntManifest),
    textSearch: v.parse(extensionTextSearchCaptureValidator, dictIntGraph),
  });
  observation.textSearch!.provenance.installationSchema = observation.manifest.provenance.installationSchema;
  const input = { runId: observation.runId, expectedCaseIds: [observation.caseId], observations: [observation] };
  const result = collectExtensionProofDatabaseObservations(input);
  expect(result[0]!.textSearch?.contract.extension).toBe("dict_int");
  const missing = structuredClone(observation);
  delete missing.textSearch;
  expect(() => collectExtensionProofDatabaseObservations({ ...input, observations: [missing] })).toThrow(
    "Missing actual text-search",
  );
  const foreign = structuredClone(observation);
  foreign.textSearch!.contract.extension = "unaccent";
  expect(() => collectExtensionProofDatabaseObservations({ ...input, observations: [foreign] })).toThrow();
  const wrongSchema = structuredClone(observation);
  wrongSchema.textSearch!.provenance.installationSchema = "foreign";
  expect(() => collectExtensionProofDatabaseObservations({ ...input, observations: [wrongSchema] })).toThrow(
    "schema mismatch",
  );
});

test("proof metadata captures each actual installed database and rejects missing, duplicate and foreign environments", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-proof-database-"));
  const output = join(root, "observations.jsonl");
  const keys = [
    "LOOM_EXTENSION_PROOF_RUN_ID",
    "LOOM_EXTENSION_PROOF_DATABASE_OUTPUT",
    "LOOM_EXTENSION_PROOF_PROVIDER",
  ] as const;
  const previous = keys.map((key) => process.env[key]);
  const provider = process.env.LOOM_EXTENSION_TEST_PROVIDER === "neon" ? "neon" : "postgres";
  process.env.LOOM_EXTENSION_PROOF_RUN_ID = "metadata.local.fixture";
  process.env.LOOM_EXTENSION_PROOF_DATABASE_OUTPUT = output;
  process.env.LOOM_EXTENSION_PROOF_PROVIDER = provider;
  try {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(
          `CREATE SCHEMA "proof""metadata"; CREATE EXTENSION citext WITH SCHEMA "proof""metadata" VERSION '1.8'`,
        );
      } finally {
        await client.end();
      }
      await observeExtensionProofDatabase(url, "metadata.local.case", "citext");
    });
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(
          `CREATE SCHEMA "proof""search"; CREATE EXTENSION unaccent SCHEMA "proof""search" VERSION '1.1'`,
        );
      } finally {
        await client.end();
      }
      await observeExtensionProofDatabase(url, "metadata.local.unaccent", "unaccent");
    });
    const observations: ExtensionProofDatabaseObservation[] = (await readFile(output, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const input = {
      runId: "metadata.local.fixture",
      expectedCaseIds: ["metadata.local.case", "metadata.local.unaccent"],
      observations,
    };
    const result = collectExtensionProofDatabaseObservations(input);
    assert.equal(result.length, 2);
    assert.equal(result[0]!.manifest.contract.extension, "citext");
    assert.equal(result[0]!.manifest.contract.version, "1.8");
    assert.equal(result[0]!.manifest.contract.provider, provider);
    assert.equal(result[0]!.manifest.provenance.installationSchema, 'proof"metadata');
    assert.equal(result[0]!.manifest.contract.postgresMajor, 18);
    assert.equal(result[0]!.manifest.contract.members.length, 104);
    assert.match(result[0]!.databaseFingerprint, /^[a-f0-9]{64}$/);
    assert.notEqual(result[0]!.databaseFingerprint, result[1]!.databaseFingerprint);
    const graph = result[1]!.textSearch;
    assert(graph, "Unaccent requires an actually observed text-search graph");
    assert.equal(graph.contract.manifestDigest, result[1]!.manifest.digest);
    expect(graph.contract.provider).toBe(provider);
    assert.equal(graph.provenance.installationSchema, 'proof"search');
    expect(graph.contract.templates[0]!.init).toBe("routine:$extension:unaccent.unaccent_init(pg_catalog.internal)");
    assert.equal(result[0]!.textSearch, undefined);
    const missingGraph = structuredClone(observations);
    delete missingGraph[1]!.textSearch;
    assert.throws(
      () => collectExtensionProofDatabaseObservations({ ...input, observations: missingGraph }),
      /text-search/i,
    );
    const wrongSchema = structuredClone(observations);
    wrongSchema[1]!.textSearch!.provenance.installationSchema = "wrong";
    assert.throws(() => collectExtensionProofDatabaseObservations({ ...input, observations: wrongSchema }), /schema/i);
    const alteredGraph = structuredClone(observations);
    alteredGraph[1]!.textSearch!.digest = "0".repeat(64);
    assert.throws(() => collectExtensionProofDatabaseObservations({ ...input, observations: alteredGraph }), /digest/i);
    const foreignGraph = structuredClone(observations);
    foreignGraph[0]!.textSearch = graph;
    assert.throws(
      () => collectExtensionProofDatabaseObservations({ ...input, observations: foreignGraph }),
      /text-search/i,
    );
    assert.throws(() => collectExtensionProofDatabaseObservations({ ...input, observations: [] }), /missing/i);
    assert.throws(
      () => collectExtensionProofDatabaseObservations({ ...input, observations: [...observations, ...observations] }),
      /duplicate/i,
    );
    assert.throws(() => collectExtensionProofDatabaseObservations({ ...input, runId: "foreign" }), /run/i);
    assert.throws(
      () => collectExtensionProofDatabaseObservations({ ...input, expectedCaseIds: ["different.case"] }),
      /unknown/i,
    );
    assert.throws(
      () =>
        collectExtensionProofDatabaseObservations({
          ...input,
          expectedCaseIds: ["metadata.local.case", "metadata.local.case"],
        }),
      /duplicate/i,
    );
    assert.throws(
      () =>
        collectExtensionProofDatabaseObservations({
          ...input,
          observations: [{ ...observations[0]!, manifest: { ...observations[0]!.manifest, digest: "0".repeat(64) } }],
        }),
      /digest/i,
    );
  } finally {
    keys.forEach((key, index) => {
      const value = previous[index];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("proof metadata observes the installed hstore subscripting callbacks and the native subscripting they register", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-proof-subscript-"));
  const output = join(root, "observations.jsonl");
  const keys = [
    "LOOM_EXTENSION_PROOF_RUN_ID",
    "LOOM_EXTENSION_PROOF_DATABASE_OUTPUT",
    "LOOM_EXTENSION_PROOF_PROVIDER",
  ] as const;
  const previous = keys.map((key) => process.env[key]);
  const provider = process.env.LOOM_EXTENSION_TEST_PROVIDER === "neon" ? "neon" : "postgres";
  const runId = "metadata.local.subscript";
  const caseId = "metadata.local.hstore";
  const namespace = 'proof"subscript';
  const schema = `"${namespace.replaceAll('"', '""')}"`;
  process.env.LOOM_EXTENSION_PROOF_RUN_ID = runId;
  process.env.LOOM_EXTENSION_PROOF_DATABASE_OUTPUT = output;
  process.env.LOOM_EXTENSION_PROOF_PROVIDER = provider;
  try {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(`CREATE SCHEMA ${schema}; CREATE EXTENSION hstore SCHEMA ${schema} VERSION '1.8'`);
        const startedAt = Date.now();
        await observeExtensionProofDatabase(url, caseId, "hstore");
        const finishedAt = Date.now();

        const observations: ExtensionProofDatabaseObservation[] = (await readFile(output, "utf8"))
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line));
        assert.equal(observations.length, 1);
        const observation = observations[0]!;
        assert.equal(observation.manifest.contract.extension, "hstore");
        assert.equal(observation.manifest.contract.version, "1.8");
        assert.equal(observation.manifest.provenance.installationSchema, namespace);

        // The observation must carry its own actually observed subscripting supplement.
        const supplement = observation.subscripting;
        assert(supplement, "Hstore requires an actually observed subscripting database observation");
        assert.equal(supplement.contract.extension, "hstore");
        assert.equal(supplement.contract.version, "1.8");
        assert.equal(supplement.contract.postgresMajor, 18);
        assert.equal(supplement.contract.provider, provider);
        assert.equal(supplement.contract.manifestDigest, observation.manifest.digest);
        assert.equal(supplement.provenance.installationSchema, namespace);
        assert.equal(supplement.provenance.fixture, "extension-semantic-proof");
        assert.equal(supplement.provenance.collector, "loom:subscript-capture:1");
        // Provenance comes from this live backend and capture moment, not from a stored expected capture.
        const server = await client.query<{ version: string }>("SELECT current_setting('server_version') AS version");
        assert.equal(supplement.provenance.serverVersion, server.rows[0]!.version);
        assert(Date.parse(supplement.provenance.capturedAt) >= startedAt);
        assert(Date.parse(supplement.provenance.capturedAt) <= finishedAt);
        expect(validateExtensionSubscriptCapture(supplement, observation.manifest)).toEqual(supplement);

        // Independent oracle: the native pointers, joined by OID, with no Kello collector code involved.
        const pointers = await client.query<{ type: string; handler: string | null; handlerSchema: string | null }>(
          `SELECT t.typname AS type,p.proname AS handler,pn.nspname AS "handlerSchema"
            FROM pg_type t JOIN pg_namespace tn ON tn.oid=t.typnamespace
            LEFT JOIN pg_proc p ON p.oid=t.typsubscript::oid LEFT JOIN pg_namespace pn ON pn.oid=p.pronamespace
            WHERE tn.nspname=$1 AND t.typname=ANY($2::name[]) ORDER BY t.typname`,
          [namespace, ["hstore", "_hstore", "ghstore", "_ghstore"]],
        );
        expect(pointers.rows).toEqual([
          { type: "_ghstore", handler: "array_subscript_handler", handlerSchema: "pg_catalog" },
          { type: "_hstore", handler: "array_subscript_handler", handlerSchema: "pg_catalog" },
          { type: "ghstore", handler: null, handlerSchema: null },
          { type: "hstore", handler: "hstore_subscript_handler", handlerSchema: namespace },
        ]);
        expect(supplement.contract.types).toEqual([
          {
            id: "type:$extension:hstore._ghstore",
            handler: "routine:pg_catalog.array_subscript_handler(pg_catalog.internal)",
          },
          {
            id: "type:$extension:hstore._hstore",
            handler: "routine:pg_catalog.array_subscript_handler(pg_catalog.internal)",
          },
          { id: "type:$extension:hstore.ghstore", handler: null },
          {
            id: "type:$extension:hstore.hstore",
            handler: "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal)",
          },
        ]);

        // Collection validates a present supplement against its exact source manifest and installed schema.
        const input = { runId, expectedCaseIds: [caseId], observations };
        const collected = collectExtensionProofDatabaseObservations(input);
        assert.equal(collected.length, 1);
        expect(collected[0]!.subscripting).toEqual(supplement);
        // A historical observation without the optional supplement still loads; only a candidate requiring it blocks.
        const historical = structuredClone(observations);
        delete historical[0]!.subscripting;
        const loaded = collectExtensionProofDatabaseObservations({ ...input, observations: historical });
        assert.equal(loaded.length, 1);
        assert.equal(loaded[0]!.subscripting, undefined);
        const wrongSchema = structuredClone(observations);
        wrongSchema[0]!.subscripting!.provenance.installationSchema = "wrong";
        assert.throws(
          () => collectExtensionProofDatabaseObservations({ ...input, observations: wrongSchema }),
          /schema/i,
        );
        const alteredDigest = structuredClone(observations);
        alteredDigest[0]!.subscripting!.digest = "0".repeat(64);
        assert.throws(
          () => collectExtensionProofDatabaseObservations({ ...input, observations: alteredDigest }),
          /digest/i,
        );

        // The callbacks observed above are the ones the backend actually runs for fetch and assignment.
        await client.query(`CREATE TABLE public.subscript_native (id integer PRIMARY KEY, data ${schema}.hstore)`);
        await client.query(
          `INSERT INTO public.subscript_native VALUES (1, '"key"=>"value", "null"=>NULL'::${schema}.hstore), (2, NULL)`,
        );
        const fetched = await client.query(
          `SELECT data['key'] AS present, data['missing'] AS missing, data['null'] AS "storedNull",
            ${schema}.exist(data, 'null') AS "storedNullExists", ${schema}.exist(data, 'missing') AS "missingExists",
            data[NULL::text] AS "nullKey"
            FROM public.subscript_native WHERE id = 1`,
        );
        expect(fetched.rows).toEqual([
          {
            present: "value",
            missing: null,
            storedNull: null,
            storedNullExists: true,
            missingExists: false,
            nullKey: null,
          },
        ]);
        const nullBase = await client.query("SELECT data['key'] AS fetched FROM public.subscript_native WHERE id = 2");
        expect(nullBase.rows).toEqual([{ fetched: null }]);

        const key = `quoted'日本\\key`;
        await client.query("UPDATE public.subscript_native SET data[$1::text] = $2::text WHERE id = 1", [key, "value"]);
        await client.query("UPDATE public.subscript_native SET data['stored-null'] = $1::text WHERE id = 1", [null]);
        const assigned = await client.query(
          `SELECT data[$1::text] AS assigned, data['stored-null'] AS "storedNull",
            ${schema}.exist(data, 'stored-null') AS "storedNullExists", data['key'] AS kept
            FROM public.subscript_native WHERE id = 1`,
          [key],
        );
        expect(assigned.rows).toEqual([{ assigned: "value", storedNull: null, storedNullExists: true, kept: "value" }]);
        // Assigning into a NULL container creates the hstore rather than staying NULL.
        await client.query("UPDATE public.subscript_native SET data['created'] = 'made' WHERE id = 2");
        const created = await client.query(
          `SELECT data['created'] AS created, ${schema}.akeys(data) AS keys FROM public.subscript_native WHERE id = 2`,
        );
        expect(created.rows).toEqual([{ created: "made", keys: ["created"] }]);
        // Return row 2 to a NULL container so the rejection below covers a stored and a NULL base.
        await client.query("UPDATE public.subscript_native SET data = NULL WHERE id = 2");

        // A NULL assignment key is rejected for stored and NULL containers, leaving every row unchanged.
        const snapshot = () => client.query("SELECT id, data::text AS data FROM public.subscript_native ORDER BY id");
        const before = (await snapshot()).rows;
        for (const id of [1, 2]) {
          await client.query("BEGIN");
          try {
            await assert.rejects(
              client.query("UPDATE public.subscript_native SET data[$1::text] = 'x' WHERE id = $2", [null, id]),
              { code: "22004" },
            );
          } finally {
            await client.query("ROLLBACK");
          }
          expect((await snapshot()).rows).toEqual(before);
        }
      } finally {
        await client.end();
      }
    });
  } finally {
    keys.forEach((key, index) => {
      const value = previous[index];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
    await rm(root, { recursive: true, force: true });
  }
}, 30000);
