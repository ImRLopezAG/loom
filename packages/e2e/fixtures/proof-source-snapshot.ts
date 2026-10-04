import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { resolve, sep } from "node:path";
import type { ExtensionProofSource } from "../../../apps/loom/src/tooling/extensions/semantic-proof";

/** Missing build chunks stay absent so receipt validation reports stale evidence. */
export function snapshotProofSources(root: string, files: readonly string[]): ExtensionProofSource[] {
  const physicalRoot = realpathSync(root);
  return [...new Set(files)].flatMap((file) => {
    const logical = resolve(physicalRoot, file);
    assert(logical.startsWith(physicalRoot + sep), "Proof source escapes repository checkout");
    try {
      const physical = realpathSync(logical);
      assert(physical.startsWith(physicalRoot + sep), "Proof source escapes repository checkout");
      return [{ file, sha256: createHash("sha256").update(readFileSync(physical)).digest("hex") }];
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
      throw error;
    }
  });
}
