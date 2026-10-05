import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { loUnitProofCases, loMemberProofs, loDatabaseProofCases } from "../../e2e/fixtures/lo-proof-cases";
import { expect } from "vite-plus/test";
import { pgSchema, integer } from "drizzle-orm/pg-core";
import { createLo_1_2 } from "../../../apps/loom/src/core/extensions/adapters/lo";
import { loOidCodec } from "../../../apps/loom/src/core/extensions/adapters/lo-codecs";
import source from "../../../apps/loom/src/tooling/extensions/manifests/lo.json";
import { loAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/lo";
import { withLargeObjects } from "../../../apps/loom/src/tooling/extensions/operations/lo";

const descriptor = {
  name: "lo",
  version: "1.2",
  schema: 'large"objects',
  apiSupport: { status: "verified", digest: source.digest },
} as const;
extensionProofUnitTest(loUnitProofCases[0]!, () => {
  expect(loOidCodec.decode("4294967295")).toBe(4294967295);
  expect(loOidCodec.decode(0)).toBe(0);
  for (const value of [-1, 4294967296, 1.1, true, "1.5", "1e2", null]) expect(() => loOidCodec.decode(value)).toThrow();
});
extensionProofUnitTest(loUnitProofCases[1]!, async () => {
  expect(loAnnotations.map((annotation) => annotation.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(loMemberProofs.map((proof) => proof.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  for (const proof of loMemberProofs) expect(proof.cases).toHaveLength(1);
  expect(loDatabaseProofCases.flatMap((definition) => definition.claims.map((claim) => claim.member)).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  await expect(
    withLargeObjects(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});
extensionProofUnitTest(loUnitProofCases[2]!, () => {
  const lo = createLo_1_2(descriptor);
  const table = pgSchema('app"data').table("files", { object: lo.field().build("object"), wrong: integer() });
  expect(table.object.getSQLType()).toBe('"large""objects"."lo"');
  const trigger = lo.trigger({ name: 'manage"object', table, column: table.object });
  expect(trigger.events).toEqual(["update", "delete"]);
  expect(trigger.create).toBe(
    'CREATE TRIGGER "manage""object" BEFORE UPDATE OR DELETE ON "app""data"."files" FOR EACH ROW EXECUTE FUNCTION "large""objects"."lo_manage"(\'object\')',
  );
  expect(() => lo.trigger({ name: "bad", table, column: table.wrong })).toThrow();
  expect(Object.keys(lo.sql.functions)).toEqual(["lo_oid"]);
  expect(lo).not.toHaveProperty("lo_manage");
  expect(() => createLo_1_2({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } })).toThrow();
});
