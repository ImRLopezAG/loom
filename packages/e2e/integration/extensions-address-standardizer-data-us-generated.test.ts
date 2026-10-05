import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { extensionProofTest } from "../fixtures/extension-proof";
import { addressStandardizerDataUsGenerationProofCase } from "../fixtures/address-standardizer-data-us-proof-cases";

extensionProofTest(
  addressStandardizerDataUsGenerationProofCase,
  async () => {
    assert(process.env.DATA_US_PUBLIC_MODULES, "Parent must supply the ready public build via DATA_US_PUBLIC_MODULES");
    const script = fileURLToPath(new URL("../scripts/run-address-standardizer-data-us-generation.ts", import.meta.url));
    const child = Bun.spawn(["bun", script], { stdout: "pipe", stderr: "pipe" });
    const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
    assert.equal(await child.exited, 0, output);
  },
  240000,
);
