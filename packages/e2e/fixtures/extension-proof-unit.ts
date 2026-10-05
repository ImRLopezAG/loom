import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { test } from "vite-plus/test";
import {
  extensionProofCasesDigest,
  type ExtensionProofCase,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import type { ExtensionProofEvent } from "./extension-proof";

/** The host independently checks Vitest's file, title, status and source bytes. */
export function extensionProofUnitTest(definition: ExtensionProofCase, callback: () => void | Promise<void>): void {
  assert.equal(definition.gate, "unit");
  assert.equal(definition.claims.length, 0, "Member claims require executable witnesses");
  extensionProofCasesDigest([definition]);
  test(definition.title, async () => {
    const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
    const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
    assert.equal(Boolean(runId), Boolean(output));
    function record(event: ExtensionProofEvent) {
      if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
    }
    const identity = runId ?? "uncollected";
    record({ runId: identity, kind: "registered", definition });
    record({ runId: identity, kind: "started", caseId: definition.id });
    let passed = false;
    try {
      await callback();
      passed = true;
    } finally {
      record({
        runId: identity,
        kind: "terminal",
        caseId: definition.id,
        status: passed ? "passed" : "failed",
        witnessFailures: 0,
      });
    }
  });
}
