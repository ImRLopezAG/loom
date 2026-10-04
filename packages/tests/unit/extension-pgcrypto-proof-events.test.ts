import { expect, test } from "vite-plus/test";
import { readPgcryptoProofEvents } from "../../e2e/fixtures/pgcrypto-proof-events";

test("pgcrypto proof driver rejects empty or incomplete event streams", () => {
  expect(() => readPgcryptoProofEvents("", 1)).toThrow("emitted no events");
  expect(() => readPgcryptoProofEvents("\n", 1)).toThrow("emitted no events");
  const terminal = JSON.stringify({ runId: "r", kind: "terminal", caseId: "c", status: "passed", witnessFailures: 0 });
  expect(() => readPgcryptoProofEvents(`${terminal}\n`, 2)).toThrow("do not match");
  expect(readPgcryptoProofEvents(`${terminal}\n`, 1)).toHaveLength(1);
});
