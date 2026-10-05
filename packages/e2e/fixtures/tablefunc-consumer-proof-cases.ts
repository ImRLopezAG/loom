import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { tablefuncProofFamily } from "./tablefunc-proof-cases";

/** Expected public consumer import after parent adds the package export and codegen adapter. */
export const tablefuncConsumerImport = "kello/extensions/tablefunc";
export const tablefuncConsumerFactory = "createTablefunc_1_0";
export const tablefuncConsumerProofCase = {
  id: "tablefunc.consumer-contracts",
  file: "packages/e2e/integration/packed-tablefunc.test.ts",
  title: "tablefunc isolated Node 24 packed tarball, selected bundles, quoted placement and 20 native members",
  gate: "consumer",
  families: [tablefuncProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
