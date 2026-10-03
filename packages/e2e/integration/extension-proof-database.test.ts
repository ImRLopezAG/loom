import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  observeExtensionProofDatabase,
  collectExtensionProofDatabaseObservations,
  type ExtensionProofDatabaseObservation,
} from "../fixtures/extension-proof-database";

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
