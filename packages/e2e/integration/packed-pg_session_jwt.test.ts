import { expect, test } from "bun:test";
import { createPgSessionJwt_0_5_0 } from "../../../apps/loom/src/core/extensions/adapters/pg_session_jwt";
import { withPgSessionJwt } from "../../../apps/loom/src/tooling/extensions/operations/pg_session_jwt";
import { pgSessionJwtDescriptor } from "../fixtures/pg_session_jwt";

test("session JWT source imports characterize factory and dedicated-session boundaries", async () => {
  const adapter = await import("../../../apps/loom/src/core/extensions/adapters/pg_session_jwt");
  expect(adapter.createPgSessionJwt_0_5_0).toBe(createPgSessionJwt_0_5_0);
  const binding = adapter.createPgSessionJwt_0_5_0(pgSessionJwtDescriptor);
  expect(createPgSessionJwt_0_5_0(pgSessionJwtDescriptor).identity).toEqual(binding.identity);
  expect(binding.sql.functions).not.toHaveProperty("init");
  expect(binding.init.authority).toBe("session");
  expect(binding.identity.loomInvocation).toBe(false);
  await expect(
    withPgSessionJwt(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...pgSessionJwtDescriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});
