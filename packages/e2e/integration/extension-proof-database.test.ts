import assert from "node:assert/strict";
import { test } from "bun:test";
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
  process.env.LOOM_EXTENSION_PROOF_RUN_ID = "metadata.local.fixture";
  process.env.LOOM_EXTENSION_PROOF_DATABASE_OUTPUT = output;
  process.env.LOOM_EXTENSION_PROOF_PROVIDER = "postgres";
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
    const observations: ExtensionProofDatabaseObservation[] = (await readFile(output, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const input = { runId: "metadata.local.fixture", expectedCaseIds: ["metadata.local.case"], observations };
    const result = collectExtensionProofDatabaseObservations(input);
    assert.equal(result.length, 1);
    assert.equal(result[0]!.manifest.contract.extension, "citext");
    assert.equal(result[0]!.manifest.contract.version, "1.8");
    assert.equal(result[0]!.manifest.contract.provider, "postgres");
    assert.equal(result[0]!.manifest.provenance.installationSchema, 'proof"metadata');
    assert.equal(result[0]!.manifest.contract.postgresMajor, 18);
    assert.equal(result[0]!.manifest.contract.members.length, 104);
    assert.match(result[0]!.databaseFingerprint, /^[a-f0-9]{64}$/);
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
