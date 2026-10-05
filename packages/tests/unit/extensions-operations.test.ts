import { expect, test } from "vite-plus/test";
import { withExtensionOperation } from "../../../apps/loom/src/tooling/extensions/operations";

test("an already-aborted operator never acquires a connection or constructs a family", async () => {
  const controller = new AbortController();
  const reason = new Error("Before acquisition");
  controller.abort(reason);
  let initialized = false;
  await expect(
    withExtensionOperation(
      "postgresql://operator@127.0.0.1:1/fixture",
      () => {
        initialized = true;
        return { read: async () => 1 };
      },
      async (session) => session.read(),
      controller.signal,
    ),
  ).rejects.toBe(reason);
  expect(initialized).toBe(false);
});

test("obvious Neon transaction-pooler URLs refuse before acquisition", async () => {
  let initialized = false;
  await expect(
    withExtensionOperation(
      "postgresql://operator@example-pooler.us-east-2.aws.neon.tech/fixture",
      () => {
        initialized = true;
        return { read: async () => 1 };
      },
      async (session) => session.read(),
    ),
  ).rejects.toThrow(/direct credentials/);
  expect(initialized).toBe(false);
});
