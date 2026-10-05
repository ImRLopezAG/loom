import { expect, test } from "vite-plus/test";
import {
  withUnaccentDictionaries,
  restoreUnaccentDictionary,
} from "../../../apps/loom/src/tooling/extensions/unaccent";
const descriptor = {
  name: "unaccent",
  version: "1.1",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
} as const;
test("Unaccent tooling rejects foreign contract claims before connection acquisition", async () => {
  let entered = false;
  await expect(
    withUnaccentDictionaries(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => {
        entered = true;
      },
    ),
  ).rejects.toThrow(/exact verified contract/);
  await expect(
    restoreUnaccentDictionary("postgresql://operator@127.0.0.1:1/fixture", {
      ...descriptor,
      apiSupport: { status: "verified", digest: "0".repeat(64) },
    }),
  ).rejects.toThrow(/exact verified contract/);
  expect(entered).toBe(false);
});
