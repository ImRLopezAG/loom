import { extensionProofTest } from "../fixtures/extension-proof";
import { addressStandardizerGenerationProofCase } from "../fixtures/address-standardizer-proof-cases";
import { runAddressStandardizerPublicGeneration } from "../fixtures/address-standardizer-public-generation";

extensionProofTest(
  addressStandardizerGenerationProofCase,
  async () => {
    await runAddressStandardizerPublicGeneration();
  },
  240000,
);
