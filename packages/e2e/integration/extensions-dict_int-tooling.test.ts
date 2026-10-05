import { expect, test } from "bun:test";
import { withDictIntDictionaries } from "kello/tooling/extensions/dict-int";
import { dictIntDescriptor } from "../fixtures/dict_int";

test("dict_int tooling stays out of RPC and rejects unverified descriptors without connecting", async () => {
  let entered = false;
  await expect(
    withDictIntDictionaries(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...dictIntDescriptor, apiSupport: { status: "unverified" } },
      async () => {
        entered = true;
      },
    ),
  ).rejects.toThrow(/exact verified contract/);
  expect(entered).toBe(false);
});
