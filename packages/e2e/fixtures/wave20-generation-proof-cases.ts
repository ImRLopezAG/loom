import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { wave20ConsumerFamilies } from "./wave20-consumer-proof-cases";

export const wave20GenerationProofCase: ExtensionProofCase = {
  id: "wave20.adapters.generated-composition",
  file: "packages/e2e/integration/extensions-wave20-generated.test.ts",
  title: "wave20 generated root RPC and mounted Effect preserve selected query, field and trigger capabilities",
  gate: "generation",
  families: [...wave20ConsumerFamilies],
  claims: [],
};
