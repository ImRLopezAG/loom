import { addressStandardizerDataUsProofFamily } from "./address-standardizer-data-us-proof-cases";

/** Executable drivers below consume parent-owned public/frozen artifacts; metadata is never a passing receipt. */
export const addressStandardizerDataUsFrozenConsumerFixture = Object.freeze({
  ...addressStandardizerDataUsProofFamily,
  factory: "createAddressStandardizerDataUs_3_6_4",
  module: "kello/extensions/address-standardizer-data-us",
  selectedConfig: { address_standardizer_data_us: { version: "3.6.4", schema: 'Data"US日本' } },
  nodeTarget: "24",
  memberCount: 60,
  publicEmitter: "extensionBindingsSource",
  generationDriver: "packages/e2e/scripts/run-address-standardizer-data-us-generation.ts",
  frozenConsumerDriver: "packages/e2e/scripts/run-address-standardizer-data-us-packed-node24.ts",
  publicEntryPoints: ["initializeProject", "loadProject", "generateProject"],
  selections: ["omitted", "empty", "future", "selected", "custom"],
  typedSeedRows: 8383,
  nativeHostMountedRpcEffect: true,
  sourceImportIsNotGenerationGate: true,
  generationAcceptance: "pending",
  packedTarballAcceptance: "pending",
  assertions: [
    "exact descriptor and manifest digest",
    "three typed tables and sequence bigint",
    "table composite and array fields",
    "empty selection omits data_us",
    "data_us selection does not implicitly install address_standardizer",
    "native source relations compose with separately-selected address_standardizer",
  ],
});
