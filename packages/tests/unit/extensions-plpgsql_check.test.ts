import { expect } from "vite-plus/test";
import * as v from "valibot";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  plpgsqlCheckDatabaseFixtureCount,
  plpgsqlCheckDatabaseProofCases,
  plpgsqlCheckDatabaseRoleCount,
  plpgsqlCheckMemberProofs,
  plpgsqlCheckPreloadedFixtureCount,
  plpgsqlCheckUnitProofCases,
} from "../../e2e/fixtures/plpgsql_check-proof-cases";
import { createPlpgsqlCheck_2_8 } from "../../../apps/loom/src/core/extensions/adapters/plpgsql_check";
import { plpgsqlCheckAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/plpgsql_check";
import {
  plpgsqlCheckOptionsValidator,
  plpgsqlCheckRoutineValidator,
  plpgsqlCheckTracerValidator,
  withPlpgsqlCheck,
} from "../../../apps/loom/src/tooling/extensions/operations/plpgsql_check";
import source from "../../../apps/loom/src/tooling/extensions/manifests/plpgsql_check.json";

const descriptor = {
  name: "plpgsql_check",
  version: "2.8",
  schema: "extensions",
  apiSupport: { status: "verified", digest: source.digest },
} as const;
const members = source.contract.members.map((member) => member.id).sort();

extensionProofUnitTest(plpgsqlCheckUnitProofCases[0]!, () => {
  const binding = createPlpgsqlCheck_2_8(descriptor);
  expect(Object.keys(binding.sql.functions)).toEqual([]);
  expect(Object.keys(binding.sql.operators)).toEqual([]);
  expect(binding).not.toHaveProperty("check");
  expect(() => createPlpgsqlCheck_2_8({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow(
    /exact verified contract/,
  );
  expect(() =>
    createPlpgsqlCheck_2_8({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } }),
  ).toThrow(/exact verified contract/);
});

extensionProofUnitTest(plpgsqlCheckUnitProofCases[1]!, async () => {
  expect(source.contract.version).toBe("2.8");
  expect(source.digest).toBe("ef00befd1f61c832689dc4d4b3ee3c21f03585eda686474bb5ec8efd8696e74a");
  expect(members).toHaveLength(24);
  expect(plpgsqlCheckAnnotations.map((annotation) => annotation.id).sort()).toEqual(members);
  // Every member is SQL-callable, so none may be reclassified internal; none is ordinary application SQL.
  expect(new Set(plpgsqlCheckAnnotations.map((annotation) => annotation.disposition))).toEqual(new Set(["tooling"]));
  expect(plpgsqlCheckMemberProofs.map((proof) => proof.id).sort()).toEqual(members);
  for (const proof of plpgsqlCheckMemberProofs) {
    expect(proof.cases.length).toBeGreaterThan(0);
    expect(proof.transfers).toEqual([]);
  }
  expect(
    [
      ...new Set(
        plpgsqlCheckDatabaseProofCases.flatMap((definition) => definition.claims.map((claim) => claim.member)),
      ),
    ].sort(),
  ).toEqual(members);
  expect(plpgsqlCheckDatabaseProofCases.map((definition) => definition.id)).toEqual([
    "plpgsql_check.native-diagnostics",
    "plpgsql_check.native-dependencies",
    "plpgsql_check.backend-local-session",
    "plpgsql_check.preloaded-shared-profile",
  ]);
  expect(plpgsqlCheckDatabaseFixtureCount).toBe(3);
  expect(plpgsqlCheckPreloadedFixtureCount).toBe(1);
  expect(plpgsqlCheckDatabaseRoleCount).toBe(0);
  await expect(
    withPlpgsqlCheck(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});

extensionProofUnitTest(plpgsqlCheckUnitProofCases[2]!, () => {
  expect(v.parse(plpgsqlCheckRoutineValidator, { signature: "public.f(integer)" })).toEqual({
    signature: "public.f(integer)",
  });
  expect(v.parse(plpgsqlCheckRoutineValidator, { name: "f" })).toEqual({ name: "f" });
  for (const routine of [{}, { signature: "" }, { name: "a\0b" }, { signature: "f()", name: "f" }])
    expect(() => v.parse(plpgsqlCheckRoutineValidator, routine)).toThrow();
  // Omitted options stay omitted so PostgreSQL applies its own captured defaults.
  expect(v.parse(plpgsqlCheckOptionsValidator, {})).toEqual({});
  expect(
    v.parse(plpgsqlCheckOptionsValidator, {
      relation: { schema: "public", name: "items" },
      oldTable: null,
      allWarnings: true,
      anyElementType: "text",
    }),
  ).toEqual({
    relation: { schema: "public", name: "items" },
    oldTable: null,
    allWarnings: true,
    anyElementType: "text",
  });
  for (const options of [
    { fatalErrors: 1 },
    { relation: null },
    { newTable: "" },
    { anyRangeType: "x\0" },
    { extra: true },
  ])
    expect(() => v.parse(plpgsqlCheckOptionsValidator, options)).toThrow();
  expect(v.parse(plpgsqlCheckTracerValidator, { enable: true, verbosity: "verbose" })).toEqual({
    enable: true,
    verbosity: "verbose",
  });
  expect(() => v.parse(plpgsqlCheckTracerValidator, { verbosity: "loud" })).toThrow();
});

extensionProofUnitTest(plpgsqlCheckUnitProofCases[3]!, async () => {
  const controller = new AbortController();
  const reason = new Error("plpgsql_check cancelled before connection acquisition");
  controller.abort(reason);
  let admitted = false;
  await expect(
    withPlpgsqlCheck(
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
