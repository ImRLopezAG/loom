import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { ip4rProofFamily } from "./ip4r-proof-cases";

export const ip4rGenerationProofCase = {
  id: "ip4r.public-generation",
  file: "packages/e2e/integration/extensions-ip4r-generation.test.ts",
  title: "ip4r.publicFirstLoadDiskTypesAndNativeRpcEffect",
  gate: "generation",
  families: [ip4rProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const ip4rConsumerProofCase = {
  id: "ip4r.frozen-consumer",
  file: "packages/e2e/integration/packed-ip4r.test.ts",
  title: "ip4r.frozenInstalledGenerationColdNode24AndNativeRpcEffect",
  gate: "consumer",
  families: [ip4rProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
