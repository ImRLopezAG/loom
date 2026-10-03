import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { appendFileSync } from "node:fs";
import { test } from "bun:test";
import {
  extensionProofCasesDigest,
  type ExtensionProofCase,
  type ExtensionProofClaim,
  type ExtensionProofReceipt,
  type ExtensionProofWitness,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

type CaseResult = ExtensionProofReceipt["cases"][number];
type ProofEventBody =
  | { kind: "registered"; definition: ExtensionProofCase }
  | { kind: "started"; caseId: string }
  | { kind: "witness"; caseId: string; witness: ExtensionProofWitness }
  | { kind: "witness-failure"; caseId: string }
  | { kind: "terminal"; caseId: string; status: "passed" | "failed"; witnessFailures: number };
export type ExtensionProofEvent = { runId: string } & ProofEventBody;

type ActiveCase = {
  definition: ExtensionProofCase;
  closed: boolean;
  pending: number;
  witnessFailures: number;
  witnessed: Set<string>;
};
const active = new AsyncLocalStorage<ActiveCase>();

function claimKey(claim: ExtensionProofClaim) {
  const f = claim.family;
  return JSON.stringify([
    f.extension,
    f.version,
    f.postgresMajor,
    f.provider,
    f.manifestDigest,
    claim.member,
    claim.scenario,
  ]);
}

function record(event: ProofEventBody) {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output), "Proof collection needs both run ID and output path");
  if (runId && output) appendFileSync(output, JSON.stringify({ ...event, runId }) + "\n", { mode: 0o600 });
}

/** Test-only evidence: the host still owns exit status, source hashes, target observation and cleanup. */
export function extensionProofTest(
  definition: ExtensionProofCase,
  callback: () => void | Promise<void>,
  timeout = 30000,
): void {
  extensionProofCasesDigest([definition]);
  record({ kind: "registered", definition });
  test(
    definition.title,
    () =>
      active.run({ definition, closed: false, pending: 0, witnessFailures: 0, witnessed: new Set() }, async () => {
        const state = active.getStore()!;
        record({ kind: "started", caseId: definition.id });
        let passed = false;
        try {
          await callback();
          assert.equal(state.pending, 0, "Incomplete detached proof witness");
          assert.equal(state.witnessFailures, 0, "Caught proof witness failure");
          for (const claim of definition.claims)
            assert(state.witnessed.has(claimKey(claim)), "Missing declared proof witness");
          passed = true;
        } finally {
          state.closed = true;
          record({
            kind: "terminal",
            caseId: definition.id,
            status: passed ? "passed" : "failed",
            witnessFailures: state.witnessFailures,
          });
        }
      }),
    timeout,
  );
}

/** Wrap the existing native assertion, rather than marking a capability before it succeeds. */
export async function extensionProofWitness<T>(
  witness: ExtensionProofWitness,
  assertion: () => T | Promise<T>,
): Promise<T> {
  const state = active.getStore();
  assert(state, "Proof witness must run inside its registered case");
  state.pending++;
  try {
    assert(!state.closed, "Proof witness arrived after case completion");
    assert(witness.schema.trim(), "Proof witness needs its observed schema");
    const key = claimKey(witness);
    assert(
      state.definition.claims.some((claim) => claimKey(claim) === key),
      "Undeclared proof witness",
    );
    assert(!state.witnessed.has(key), "Duplicate proof witness");
    const value = await assertion();
    assert(!state.closed, "Detached proof witness arrived after case completion");
    assert(!state.witnessed.has(key), "Duplicate concurrent proof witness");
    state.witnessed.add(key);
    record({ kind: "witness", caseId: state.definition.id, witness });
    return value;
  } catch (error) {
    state.witnessFailures++;
    record({ kind: "witness-failure", caseId: state.definition.id });
    throw error;
  } finally {
    state.pending--;
  }
}

/** Corroborate a fresh child's events against the host's exact case registry. No receipt authority comes from the child. */
export function collectExtensionProofCases(input: {
  runId: string;
  expected: readonly ExtensionProofCase[];
  events: readonly ExtensionProofEvent[];
  exitCode: number | null;
}): CaseResult[] {
  assert.equal(input.exitCode, 0, "Proof child exit was not zero");
  extensionProofCasesDigest(input.expected);
  const definitions = new Map(input.expected.map((definition) => [definition.id, definition]));
  const registered = new Set<string>();
  const started = new Set<string>();
  const results = new Map<string, CaseResult>();
  const witnesses = new Map<string, ExtensionProofWitness[]>();
  for (const event of input.events) {
    assert.equal(event.runId, input.runId, "Stale or foreign proof run");
    const id = event.kind === "registered" ? event.definition.id : event.caseId;
    const definition = definitions.get(id);
    assert(definition, `Unknown proof case: ${id}`);
    if (event.kind === "registered") {
      assert(!registered.has(id), "Duplicate proof registration");
      assert.equal(
        extensionProofCasesDigest([event.definition]),
        extensionProofCasesDigest([definition]),
        "Proof definition differs from host registry",
      );
      registered.add(id);
      witnesses.set(id, []);
      continue;
    }
    assert(registered.has(id), "Missing proof registration");
    assert(!results.has(id), "Duplicate or late proof terminal event");
    if (event.kind === "started") {
      assert(!started.has(id), "Duplicate proof case start");
      started.add(id);
    } else if (event.kind === "witness") {
      assert(started.has(id), "Proof witness before case start");
      assert(event.witness.schema.trim(), "Missing proof witness schema");
      const key = claimKey(event.witness);
      assert(
        definition.claims.some((claim) => claimKey(claim) === key),
        "Undeclared proof witness",
      );
      const observed = witnesses.get(id)!;
      assert(!observed.some((witness) => claimKey(witness) === key), "Duplicate proof witness");
      observed.push(event.witness);
    } else {
      assert.equal(event.kind, "terminal", "Unknown proof event");
      assert(started.has(id), "Proof terminal before case start");
      assert.equal(event.status, "passed", "Proof case failed");
      assert.equal(event.witnessFailures, 0, "Proof case caught a witness failure");
      const observed = witnesses.get(id)!;
      for (const claim of definition.claims)
        assert(
          observed.some((witness) => claimKey(witness) === claimKey(claim)),
          "Missing declared proof witness",
        );
      results.set(id, {
        id,
        file: definition.file,
        title: definition.title,
        status: "passed",
        witnessFailures: 0,
        witnesses: observed,
      });
    }
  }
  return input.expected.map((definition) => {
    const result = results.get(definition.id);
    assert(result, `Missing or incomplete proof case: ${definition.id}`);
    return result;
  });
}
