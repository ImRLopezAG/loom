import { expect, test } from "vite-plus/test";
import { withDictIntDictionaries } from "kello/tooling/extensions/dict-int";

const descriptor = {
  name: "dict_int",
  version: "1.0",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da" },
} as const;

test("dict_int tooling rejects foreign contract claims before connection acquisition", async () => {
  let entered = false;
  await expect(
    withDictIntDictionaries(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => {
        entered = true;
      },
    ),
  ).rejects.toThrow(/exact verified contract/);
  await expect(
    withDictIntDictionaries(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } },
      async () => {
        entered = true;
      },
    ),
  ).rejects.toThrow(/exact verified contract/);
  expect(entered).toBe(false);
});
