import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import {
  addressStandardizerDataUsDatabaseProofCase,
  addressStandardizerDataUsNativeSeeds,
} from "../fixtures/address-standardizer-data-us-proof-cases";

// Local native PostgreSQL 18 characterization; provider and package gates remain caller-owned.
extensionProofTest(
  addressStandardizerDataUsDatabaseProofCase,
  async () => {
    const result = await promisify(execFile)(
      process.execPath,
      [fileURLToPath(new URL("../scripts/run-address-standardizer-data-us-native.ts", import.meta.url))],
      { maxBuffer: 1024 * 1024 },
    );
    const receipt = JSON.parse(result.stdout);
    assert.equal(receipt.exactContract, true);
    assert.deepEqual(receipt.seed, addressStandardizerDataUsNativeSeeds);
    assert.equal(receipt.allSeedCodecs, 8383);
    for (const claim of addressStandardizerDataUsDatabaseProofCase.claims) {
      await extensionProofWitness({ ...claim, schema: 'Data"US日本' }, () => {
        assert.equal(receipt.digest, claim.family.manifestDigest);
        assert.equal(receipt.members, 60);
        assert(receipt.memberIds.includes(claim.member));
        assert.equal(receipt.restrictedReads, true);
        assert.equal(receipt.restrictedSequencePrivileges, true);
        assert.equal(receipt.nativeCompositeArrayIo, true);
        assert.equal(receipt.unicodeNullMultidimensionalArrays, true);
        assert.equal(receipt.nativeDefaultsAndPrimaryKeys, true);
      });
    }
  },
  60000,
);
