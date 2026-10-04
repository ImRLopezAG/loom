import { addressStandardizerFrozenConsumerFixture } from "./address-standardizer-consumer-proof-cases";
import { addressStandardizerGenerationProofCase } from "./address-standardizer-proof-cases";

/**
 * Public kello/tooling initializeProject/loadProject/generateProject expectations.
 * Source-import or emitter-only checks are not this gate.
 */
export const addressStandardizerFrozenGenerationFixture = Object.freeze({
  ...addressStandardizerFrozenConsumerFixture,
  proofCase: addressStandardizerGenerationProofCase.id,
  generatedBinding: `import { ${addressStandardizerFrozenConsumerFixture.factory} } from "${addressStandardizerFrozenConsumerFixture.module}";`,
  selectedConfig: {
    address_standardizer: { version: "3.6.4", schema: "addr_std_custom" },
  },
  node24: true,
  publicEmitter: "kello/tooling generateProject",
  generateProjectThroughInstalledKello: true,
  sourceImportIsNotGenerationGate: true,
  packedTarballIsNotGenerationGate: true,
});
