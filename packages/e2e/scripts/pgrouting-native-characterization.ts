import pg from "pg";
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pgrouting.json";
import cases from "../fixtures/pgrouting-native-cases.json";

// This native fixture is deliberately local, disposable and separate from canonical receipts.
const url = process.env.PGROUTING_PROOF_URL;
if (!url || !["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname))
  throw new Error("A disposable local pgRouting oracle URL is required");
const output = process.env.PGROUTING_PROOF_OUTPUT;
if (!output) throw new Error("PGROUTING_PROOF_OUTPUT must name a scratch evidence file");
const client = new pg.Client({ connectionString: url });
await client.connect();
const results: {
  id: string;
  status: string;
  rows?: string[];
  rowCount?: number;
  digest?: string;
  error?: { code: string; message: string };
}[] = [];
try {
  await client.query("SET search_path TO fixture,routing,spatial,pg_catalog");
  const captured = await captureExtensionContract(client, {
    name: "pgrouting",
    provider: "neon",
    fixture: "local-exact-primary-source-oracle",
  });
  const exact = captured.digest === manifest.digest;
  await client.query("BEGIN");
  for (const proof of cases.cases) {
    if (proof.name === "pgr_alphashape" || proof.name === "_pgr_alphashape") {
      results.push({
        id: proof.id,
        status: "blocked-native-repair",
        error: {
          code: "native-safety",
          message: "Confirmed backend SIGSEGV; no re-probe pending verified native repair",
        },
      });
      continue;
    }
    await client.query("SAVEPOINT member_proof");
    try {
      await client.query("SET LOCAL statement_timeout='10s'");
      const rows = await client.query<{ value: string }>(
        `SELECT (native_row)::pg_catalog.text AS value FROM (${proof.sql}) AS native_row`,
      );
      const values = rows.rows.map((row) => row.value);
      results.push({
        id: proof.id,
        status: "observed",
        rowCount: values.length,
        digest: createHash("sha256").update(JSON.stringify(values)).digest("hex"),
        rows: values,
      });
    } catch (cause) {
      if (!(cause instanceof Error)) throw cause;
      const error = { code: "code" in cause ? String(cause.code) : "unknown", message: cause.message };
      const expected =
        "expectedError" in proof &&
        proof.expectedError?.code === error.code &&
        proof.expectedError?.message === error.message;
      results.push({ id: proof.id, status: expected ? "characterized-native-defect" : "native-error", error });
    } finally {
      await client.query("ROLLBACK TO SAVEPOINT member_proof");
    }
  }
  await client.query("ROLLBACK");
  const exactCoverage =
    cases.cases.length === manifest.contract.members.length &&
    new Set(results.map((row) => row.id)).size === manifest.contract.members.length &&
    manifest.contract.members.every((row) => results.some((result) => result.id === row.id));
  const report = {
    extension: "pgrouting",
    version: "3.8.0",
    manifestDigest: manifest.digest,
    capturedDigest: captured.digest,
    exactManifestIdentity: exact,
    exactCoverage,
    captured,
    results,
    observed: results.filter((row) => row.status === "observed").length,
    characterizedNativeDefects: results.filter((row) => row.status === "characterized-native-defect").length,
    nativeErrors: results.filter((row) => row.status === "native-error").length,
    blockedNativeRepair: results.filter((row) => row.status === "blocked-native-repair").length,
    skipped: results.filter((row) => row.status === "blocked-native-repair").length,
    nativeAcceptance: "blocked-pending-verified-alpha-repair",
    providerAcceptance: "pending",
    publicExportAcceptance: "pending",
  };
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify({
      exactManifestIdentity: exact,
      exactCoverage,
      observed: report.observed,
      characterizedNativeDefects: report.characterizedNativeDefects,
      nativeErrors: report.nativeErrors,
      blockedNativeRepair: report.blockedNativeRepair,
      skipped: report.skipped,
    }),
  );
  if (!exact || !exactCoverage || report.nativeErrors) process.exitCode = 1;
} finally {
  await client.end();
}
