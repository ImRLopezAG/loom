import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { wave10CallbackProofs } from "./wave10-callback-proof-cases";

const families = Object.values(wave10CallbackProofs).map((proof) => proof.family);
export const wave10GenerationProofCase: ExtensionProofCase = {
  id: "wave10.callbacks.generated-composition",
  file: "packages/e2e/integration/extensions-wave10-generated.test.ts",
  title:
    "wave10 generated root RPC and mounted Effect retain ten selected families and execute native schema/query capabilities",
  gate: "generation",
  families,
  claims: [],
};
export const wave10ConsumerProofCase: ExtensionProofCase = {
  id: "wave10.callbacks.packed-composition",
  file: "packages/e2e/integration/packed-extension-adapters.test.ts",
  title: "packed selected adapters preserve precise declarations and independent Node runtime bundles",
  gate: "consumer",
  families,
  claims: [],
};
