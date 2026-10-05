import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";

/** Record ownership before creation; parent must independently corroborate role cleanup. */
export function recordHstoreRole(name: string): void {
  assert.match(name, /^loom_hstore_(?:[a-f0-9]{32}|live_[a-f0-9]{32}_role)$/);
  const output = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
  if (!output) return;
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  assert(runId);
  appendFileSync(
    output,
    JSON.stringify({ runId, name, sha256: createHash("sha256").update(name).digest("hex") }) + "\n",
    { mode: 0o600 },
  );
}
