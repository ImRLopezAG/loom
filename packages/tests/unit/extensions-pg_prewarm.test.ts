import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  pgPrewarmUnitProofCases,
  pgPrewarmMemberProofs,
  pgPrewarmDatabaseProofCases,
  pgPrewarmDatabaseFixtureCount,
  pgPrewarmDatabaseRoleCount,
} from "../../e2e/fixtures/pg_prewarm-proof-cases";
import { expect } from "vite-plus/test";
import { createPgPrewarm_1_2 } from "../../../apps/loom/src/core/extensions/adapters/pg_prewarm";
import {
  prewarmRequestValidator,
  withPgPrewarm,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_prewarm";
import { pgPrewarmAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_prewarm";
import * as v from "valibot";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_prewarm.json";
const descriptor = {
  name: "pg_prewarm",
  version: "1.2",
  schema: "cache",
  apiSupport: { status: "verified", digest: source.digest },
} as const;
extensionProofUnitTest(pgPrewarmUnitProofCases[0]!, () => {
  const binding = createPgPrewarm_1_2(descriptor);
  expect(Object.keys(binding.sql.functions)).toEqual([]);
  expect(binding).not.toHaveProperty("prewarm");
  expect(() => createPgPrewarm_1_2({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow();
});
extensionProofUnitTest(pgPrewarmUnitProofCases[1]!, async () => {
  expect(pgPrewarmAnnotations.map((annotation) => annotation.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(pgPrewarmMemberProofs.map((proof) => proof.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  for (const proof of pgPrewarmMemberProofs) {
    expect(proof.cases.length).toBeGreaterThan(0);
    expect(proof.transfers).toEqual([]);
  }
  expect(
    [
      ...new Set(pgPrewarmDatabaseProofCases.flatMap((definition) => definition.claims.map((claim) => claim.member))),
    ].sort(),
  ).toEqual(source.contract.members.map((member) => member.id).sort());
  expect(pgPrewarmDatabaseProofCases.map((definition) => definition.id)).toEqual([
    "pg_prewarm.native",
    "pg_prewarm.native-worker",
    "pg_prewarm.drain",
    "pg_prewarm.cancel-blocked",
    "pg_prewarm.cancel-suspended",
  ]);
  expect(pgPrewarmDatabaseFixtureCount).toBe(5);
  expect(pgPrewarmDatabaseRoleCount).toBe(1);
  await expect(
    withPgPrewarm(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});
extensionProofUnitTest(pgPrewarmUnitProofCases[3]!, async () => {
  const controller = new AbortController();
  const reason = new Error("Prewarm cancelled before connection acquisition");
  controller.abort(reason);
  let admitted = false;
  await expect(
    withPgPrewarm(
      "postgresql://operator@127.0.0.1:1/fixture",
      descriptor,
      async () => {
        admitted = true;
      },
      controller.signal,
    ),
  ).rejects.toBe(reason);
  expect(admitted).toBe(false);
});
extensionProofUnitTest(pgPrewarmUnitProofCases[2]!, () => {
  expect(v.parse(prewarmRequestValidator, { relation: { schema: "public", name: "items" }, firstBlock: null })).toEqual(
    { relation: { schema: "public", name: "items" }, firstBlock: null },
  );
  expect(
    v.parse(prewarmRequestValidator, { relation: { schema: "public", name: "items" }, firstBlock: 4n, lastBlock: 3n })
      .lastBlock,
  ).toBe(3n);
  for (const options of [{ mode: "anything" }, { fork: "invalid" }, { firstBlock: -1n }, { firstBlock: 1 }])
    expect(() =>
      v.parse(prewarmRequestValidator, { relation: { schema: "public", name: "items" }, ...options }),
    ).toThrow();
});
