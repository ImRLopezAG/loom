import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import pg from "pg";
import * as v from "valibot";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import {
  captureExtensionSubscript,
  extensionSubscriptCaptureValidator,
  validateExtensionSubscriptCapture,
} from "../../../apps/loom/src/tooling/extensions/subscript-capture";
import {
  captureExtensionTextSearch,
  extensionTextSearchCaptureValidator,
  validateExtensionTextSearchCapture,
} from "../../../apps/loom/src/tooling/extensions/text-search-capture";

const token = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => value.trim() === value),
);
const observationValidator = v.strictObject({
  runId: token,
  caseId: token,
  databaseFingerprint: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  manifest: extensionManifestValidator,
  textSearch: v.optional(extensionTextSearchCaptureValidator),
  subscripting: v.optional(extensionSubscriptCaptureValidator),
});
export type ExtensionProofDatabaseObservation = v.InferOutput<typeof observationValidator>;

/** Read the installed fixture, rather than copying the configured or captured expected contract. */
export async function observeExtensionProofDatabase(url: string, caseId: string, name: string): Promise<void> {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_DATABASE_OUTPUT;
  if (!runId && !output) return;
  assert(runId && output, "Database proof collection requires run ID and output path");
  // This is a host-supplied profile label; the host must corroborate Neon ownership independently.
  const provider = v.parse(v.picklist(["postgres", "neon"]), process.env.LOOM_EXTENSION_PROOF_PROVIDER);
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const database = await client.query<{ name: string }>("SELECT current_database() AS name");
    const manifest = await captureExtensionContract(client, { name, provider, fixture: "extension-semantic-proof" });
    const observation: ExtensionProofDatabaseObservation = {
      runId,
      caseId,
      databaseFingerprint: createHash("sha256").update(database.rows[0]!.name).digest("hex"),
      manifest,
    };
    if (name === "unaccent")
      observation.textSearch = await captureExtensionTextSearch(client, manifest, {
        provider,
        fixture: "extension-semantic-proof",
      });
    if (name === "hstore")
      observation.subscripting = await captureExtensionSubscript(client, manifest, {
        provider,
        fixture: "extension-semantic-proof",
      });
    appendFileSync(output, JSON.stringify(v.parse(observationValidator, observation)) + "\n", { mode: 0o600 });
  } finally {
    await client.end();
  }
}

/** Return exact per-case observations; profile, target ownership and cleanup remain host-owned gates. */
export function collectExtensionProofDatabaseObservations(input: {
  runId: string;
  expectedCaseIds: readonly string[];
  observations: readonly ExtensionProofDatabaseObservation[];
}): ExtensionProofDatabaseObservation[] {
  const expected = new Set(input.expectedCaseIds);
  assert.equal(expected.size, input.expectedCaseIds.length, "Duplicate expected database proof case");
  const observed = new Map<string, ExtensionProofDatabaseObservation>();
  for (const observation of v.parse(v.array(observationValidator), input.observations)) {
    assert.equal(observation.runId, input.runId, "Foreign database proof run");
    assert(expected.has(observation.caseId), "Unknown database proof case");
    assert(!observed.has(observation.caseId), "Duplicate database proof observation");
    validateExtensionManifest(observation.manifest);
    if (observation.manifest.contract.extension === "unaccent") {
      assert(observation.textSearch, "Missing actual text-search database observation");
      const graph = validateExtensionTextSearchCapture(observation.textSearch, observation.manifest);
      assert.equal(
        graph.provenance.installationSchema,
        observation.manifest.provenance.installationSchema,
        "Text-search observation schema mismatch",
      );
    } else assert.equal(observation.textSearch, undefined, "Foreign text-search database observation");
    // Historical observations legitimately lack the supplement; only a present one is validated, never defaulted.
    if (observation.subscripting) {
      assert.equal(observation.manifest.contract.extension, "hstore", "Foreign subscripting database observation");
      const capture = validateExtensionSubscriptCapture(observation.subscripting, observation.manifest);
      assert.equal(
        capture.provenance.installationSchema,
        observation.manifest.provenance.installationSchema,
        "Subscripting observation schema mismatch",
      );
    }
    observed.set(observation.caseId, observation);
  }
  return input.expectedCaseIds.map((id) => {
    const observation = observed.get(id);
    assert(observation, `Missing database proof observation: ${id}`);
    return observation;
  });
}
