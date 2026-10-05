import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAddressStandardizerPublicGeneration } from "../fixtures/address-standardizer-public-generation";

const receipt = await runAddressStandardizerPublicGeneration();
writeFileSync(
  join(tmpdir(), "loom-address-standardizer-generation-receipt.json"),
  JSON.stringify(
    {
      gate: "generation",
      publicCallable: true,
      generateProjectThroughInstalledKello: true,
      virtualFirstLoad: true,
      diskBindings: true,
      hostMounted: true,
      selectedEmptyFutureCustom: true,
      compiledRpcEffect: true,
      allCompositeFields: true,
      unquotedRultabQuoteIdent: true,
      sourceImportIsNotThisGate: true,
      packedInstallIsNotThisGate: true,
      ...receipt,
    },
    null,
    2,
  ),
  { mode: 0o600 },
);
console.log(
  `address_standardizer public kello/tooling initialize/load/generate first-load/disk/types host/mounted selected/empty/future/custom and native RPC/Effect passed. journal=${receipt.fixtureJournal}`,
);
