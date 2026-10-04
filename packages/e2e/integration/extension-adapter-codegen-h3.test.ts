import { extensionProofTest } from "../fixtures/extension-proof";
import { h3GenerationProofCase } from "../fixtures/h3-proof-cases";
import { runH3PublicGeneration } from "../fixtures/h3-public-generation";

extensionProofTest(
  h3GenerationProofCase,
  async () => {
    await runH3PublicGeneration();
  },
  180000,
);
