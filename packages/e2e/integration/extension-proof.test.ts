import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectExtensionProofCases, type ExtensionProofEvent } from "../fixtures/extension-proof";

test("proof collection corroborates actual runner completion and sticky assertion witnesses", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-proof-collector-"));
  const helper = fileURLToPath(new URL("../fixtures/extension-proof.ts", import.meta.url));
  const family = {
    extension: "pg_uuidv7",
    version: "1.6",
    postgresMajor: 18 as const,
    provider: "neon" as const,
    manifestDigest: "f6723e0d29a7ea7a57a7655eebd254c072d1101c19049450863b21337ca7b396",
  };
  // These actual runner cases test instrumentation only, not extension/provider acceptance.
  const definition = {
    id: "collector.fixture",
    file: "packages/e2e/integration/extension-proof.test.ts",
    title: "collector child fixture",
    gate: "database" as const,
    families: [family],
    claims: [{ family, member: "fixture-only", scenario: "assertion" }],
  };
  try {
    for (const mode of ["pass", "fail", "caught", "skip", "missing", "detached", "wrong-claim"] as const) {
      const output = join(root, `${mode}.jsonl`);
      const childFile = join(root, `${mode}.test.ts`);
      await writeFile(
        childFile,
        `
import { test } from "bun:test";
import assert from "node:assert/strict";
import { extensionProofTest, extensionProofWitness } from ${JSON.stringify(helper)};
const definition = ${JSON.stringify(definition)};
const mode = ${JSON.stringify(mode)};
if (mode === "skip") test.skip(definition.title, () => {});
else if (mode === "missing") test("unrelated case", () => {});
else extensionProofTest(definition, async () => {
  const witness = {...definition.claims[0], schema:"fixture_extensions"};
  if (mode === "wrong-claim") witness.member = "not-declared";
  if (mode === "detached") {
    void extensionProofWitness(witness, async () => { await new Promise(resolve => setTimeout(resolve, 50)); assert.equal(1,1); });
    return;
  }
  if (mode === "caught") {
    try { await extensionProofWitness(witness, () => { assert.equal(1,2); }); } catch {}
  } else {
    await extensionProofWitness(witness, () => { assert.equal(1, mode === "fail" ? 2 : 1); });
  }
});
`,
      );
      const process = Bun.spawn(["bun", "test", childFile], {
        env: { ...globalThis.process.env, LOOM_EXTENSION_PROOF_RUN_ID: mode, LOOM_EXTENSION_PROOF_OUTPUT: output },
        stdout: "pipe",
        stderr: "pipe",
        timeout: 10000,
      });
      const [exitCode] = await Promise.all([
        process.exited,
        new Response(process.stdout).text(),
        new Response(process.stderr).text(),
      ]);
      const lines = await readFile(output, "utf8").catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
        return "";
      });
      const events: ExtensionProofEvent[] = lines.trim()
        ? lines
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line))
        : [];
      const collect = () => collectExtensionProofCases({ runId: mode, expected: [definition], events, exitCode });
      if (mode === "pass") {
        assert.deepEqual(collect(), [
          {
            id: definition.id,
            file: definition.file,
            title: definition.title,
            status: "passed",
            witnessFailures: 0,
            witnesses: [{ ...definition.claims[0]!, schema: "fixture_extensions" }],
          },
        ]);
        assert.throws(
          () => collectExtensionProofCases({ runId: "stale", expected: [definition], events, exitCode }),
          /run/i,
        );
        assert.throws(
          () =>
            collectExtensionProofCases({
              runId: mode,
              expected: [definition],
              events: [...events, events.at(-1)!],
              exitCode,
            }),
          /terminal|duplicate/i,
        );
        assert.throws(
          () => collectExtensionProofCases({ runId: mode, expected: [definition], events, exitCode: 1 }),
          /exit/i,
        );
        assert.throws(
          () => collectExtensionProofCases({ runId: mode, expected: [definition, definition], events, exitCode }),
          /duplicate/i,
        );
        const registered = events.find((event) => event.kind === "registered")!;
        const started = events.find((event) => event.kind === "started")!;
        const witnessed = events.find((event) => event.kind === "witness")!;
        const terminal = events.find((event) => event.kind === "terminal")!;
        // Keep a zero child exit so malformed evidence must fail the host's event checks.
        const reject = (changed: ExtensionProofEvent[], message: RegExp) =>
          assert.throws(
            () => collectExtensionProofCases({ runId: mode, expected: [definition], events: changed, exitCode: 0 }),
            message,
          );
        reject(
          [{ ...registered, definition: { ...definition, title: "different body" } }, ...events.slice(1)],
          /definition/i,
        );
        reject([registered, { ...started, caseId: "unknown.case" }, witnessed, terminal], /unknown/i);
        reject([started, witnessed, terminal], /registration/i);
        reject([registered, registered, started, witnessed, terminal], /registration/i);
        reject([registered, started, started, witnessed, terminal], /start/i);
        reject([registered, witnessed, started, terminal], /before case start/i);
        reject([registered, terminal], /before case start/i);
        reject([registered, started, witnessed, witnessed, terminal], /duplicate proof witness/i);
        reject(
          [registered, started, { ...witnessed, witness: { ...witnessed.witness, member: "undeclared" } }, terminal],
          /undeclared/i,
        );
        reject(
          [registered, started, { ...witnessed, witness: { ...witnessed.witness, schema: " " } }, terminal],
          /schema/i,
        );
        reject([registered, started, terminal], /missing declared/i);
        reject([registered, started, witnessed, { ...terminal, status: "failed" }], /case failed/i);
        reject([registered, started, witnessed, { ...terminal, witnessFailures: 1 }], /caught/i);
        reject(
          [registered, started, { runId: mode, kind: "witness-failure", caseId: definition.id }, terminal],
          /event/i,
        );
        reject([...events, { runId: mode, kind: "witness-failure", caseId: definition.id }], /late/i);
      } else {
        assert.throws(collect, /exit|missing|incomplete|witness|failed/i, mode);
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);
