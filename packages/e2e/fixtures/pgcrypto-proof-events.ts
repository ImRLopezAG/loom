import assert from "node:assert/strict";
import type { ExtensionProofEvent } from "./extension-proof";

/** Proof events must come from executed cases; an empty or truncated stream is a failed gate. */
export function readPgcryptoProofEvents(text: string, expectedCases: number): ExtensionProofEvent[] {
  const lines = text.split("\n").filter((line) => line.length > 0);
  assert(lines.length > 0, "pgcrypto proof cases emitted no events");
  // SAFETY: The caller immediately validates these parsed events against the exact registered
  // definitions, run identity and event state machine through collectExtensionProofCases.
  const events = lines.map((line) => JSON.parse(line) as ExtensionProofEvent);
  assert.equal(
    events.filter((event) => event.kind === "terminal").length,
    expectedCases,
    "pgcrypto proof terminal events do not match the registered cases",
  );
  return events;
}
