import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";

/** Journal an owned role before creation so the host can read back its removal even after a failed child. */
export function recordPgTrgmRole(name: string): void {
  assert.match(name, /^loom_trgm_[a-f0-9]{32}$/);
  const output = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
  if (!output) return;
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  assert(runId, "Role ownership events need the proof run ID");
  appendFileSync(
    output,
    JSON.stringify({ runId, name, sha256: createHash("sha256").update(name).digest("hex") }) + "\n",
    { mode: 0o600 },
  );
}
