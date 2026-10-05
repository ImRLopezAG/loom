import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  ADDRESS_STANDARDIZER_DIGEST,
  addressStandardizerProofFamily,
} from "./address-standardizer-proof-cases";

/** Expected public consumer import after parent applies the unapplied export/Vite/factory patch. */
export const addressStandardizerConsumerImport = "kello/extensions/address-standardizer";
export const addressStandardizerConsumerFactory = "createAddressStandardizer_3_6_4";
export const addressStandardizerConsumerOperationsImport = "kello/tooling/extensions/address-standardizer";
export const addressStandardizerConsumerNodeTarget = "24";

export const addressStandardizerFrozenConsumerFixture = Object.freeze({
  extension: "address_standardizer",
  version: "3.6.4",
  digest: ADDRESS_STANDARDIZER_DIGEST,
  factory: addressStandardizerConsumerFactory,
  module: addressStandardizerConsumerImport,
  operationsModule: addressStandardizerConsumerOperationsImport,
  nodeTarget: addressStandardizerConsumerNodeTarget,
  memberCount: 7,
  publicExportApplied: true,
  packedTarballGate: "family-no-install-node24-frozen-wave35",
  generationGate: "public-kello-tooling-first-load-disk-types-rpc-effect",
});

export const addressStandardizerConsumerProofCase = {
  id: "address_standardizer.consumer-contracts",
  file: "packages/e2e/integration/packed-address-standardizer.test.ts",
  title: "address_standardizer isolated Node 24 no-install frozen wave35 generateProject RPC/Effect",
  gate: "consumer",
  families: [addressStandardizerProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
