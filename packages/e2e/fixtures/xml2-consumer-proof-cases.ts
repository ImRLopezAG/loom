import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { xml2ProofFamily } from "./xml2-proof-cases";

/** Expected public consumer import after parent adds the package export and codegen adapter. */
export const xml2ConsumerImport = "kello/extensions/xml2";
export const xml2ConsumerFactory = "createXml2_1_2";
export const xml2ConsumerProofCase = {
  id: "xml2.consumer-contracts",
  file: "packages/e2e/integration/packed-xml2.test.ts",
  title: "xml2 isolated Node 24 packed tarball, selected bundles, quoted placement and 13 native members",
  gate: "consumer",
  families: [xml2ProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
