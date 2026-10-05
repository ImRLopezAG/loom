import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { extensionProofTest } from "../fixtures/extension-proof";
import { addressStandardizerDataUsConsumerProofCase } from "../fixtures/address-standardizer-data-us-proof-cases";

extensionProofTest(
  addressStandardizerDataUsConsumerProofCase,
  async () => {
    const { DATA_US_FROZEN_CONSUMER, DATA_US_TARBALL, DATA_US_TARBALL_SHA256, DATA_US_LOCK_SHA256 } = process.env;
    assert(
      DATA_US_FROZEN_CONSUMER && DATA_US_TARBALL && DATA_US_TARBALL_SHA256 && DATA_US_LOCK_SHA256,
      "Parent must supply exact frozen consumer/artifact/lock inputs",
    );
    const script = fileURLToPath(
      new URL("../scripts/run-address-standardizer-data-us-packed-node24.ts", import.meta.url),
    );
    const child = Bun.spawn(
      ["bun", script, DATA_US_FROZEN_CONSUMER, DATA_US_TARBALL, DATA_US_TARBALL_SHA256, DATA_US_LOCK_SHA256],
      { stdout: "pipe", stderr: "pipe" },
    );
    const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
    assert.equal(await child.exited, 0, output);
  },
  240000,
);
