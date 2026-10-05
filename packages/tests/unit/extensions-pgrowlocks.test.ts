import { expect, test } from "vite-plus/test";
import { createPgrowlocks_1_2 } from "../../../apps/loom/src/core/extensions/adapters/pgrowlocks";
import { tidCodec, xidCodec } from "../../../apps/loom/src/core/extensions/adapters/pgrowlocks-codecs";
import lockManifest from "../../../apps/loom/src/tooling/extensions/manifests/pgrowlocks.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { wave10CallbackUnitCases } from "../../e2e/fixtures/wave10-callback-unit-types-cases";

const locks = createPgrowlocks_1_2({
  name: "pgrowlocks",
  version: "1.2",
  schema: "locks",
  apiSupport: { status: "verified", digest: lockManifest.digest },
});

extensionProofUnitTest(
  wave10CallbackUnitCases.find((proof) => proof.families[0]!.extension === "pgrowlocks")!,
  () => {
    expect(tidCodec.decode("(4294967295,65535)")).toEqual({ block: 4294967295, offset: 65535 });
    expect(() => tidCodec.decode("(1,65536)")).toThrow();
    expect(() => tidCodec.decode("(4294967296,1)")).toThrow();
    expect(() => tidCodec.decode("1,2")).toThrow();
    expect(tidCodec.encode({ block: 0, offset: 1 })).toBe("(0,1)");
    expect(xidCodec.decode("4294967295")).toBe(4294967295);
    expect(() => xidCodec.decode("4294967296")).toThrow();
    expect(() => xidCodec.decode("-1")).toThrow();
  },
);

test("lock records decode multixact arrays and quoted modes", () => {
  expect(locks.lockCodec.decode('("(0,2)",77,t,"{750,751}","{""For Share"",""For Share""}","{41,42}")')).toEqual({
    locked_row: { block: 0, offset: 2 },
    locker: 77,
    multi: true,
    xids: { dimensions: [{ lowerBound: 1, length: 2 }], values: [750, 751] },
    modes: { dimensions: [{ lowerBound: 1, length: 2 }], values: ["For Share", "For Share"] },
    pids: { dimensions: [{ lowerBound: 1, length: 2 }], values: [41, 42] },
  });
});
