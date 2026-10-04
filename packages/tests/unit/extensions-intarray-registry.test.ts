import { expect, test } from "vite-plus/test";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/intarray.json";
import {
  intarrayUnresolvedInternalMembers,
  registerIntarraySemanticProof,
} from "../../e2e/fixtures/intarray-semantic-proof";
import { intarrayDatabaseProofCases } from "../../e2e/fixtures/intarray-proof-cases";

test("intarray 1.5 selection generates its reviewed adapter and required public API", () => {
  const selection = { intarray: { version: "1.5", schema: 'unit"int' } } as const;
  const resolved = resolveSelectedExtension("intarray", selection.intarray);
  expect(resolved.adapter).toMatchObject({
    name: "intarray",
    version: "1.5",
    digest: manifest.digest,
    factory: "createIntarray_1_5",
    module: "kello/extensions/intarray",
  });
  expect(resolved.support).toEqual({ status: "verified", digest: manifest.digest });
  const required = buildRequiredApi(selection);
  expect(validateRequiredApiForTarget(required)).toEqual(required);
  expect(required?.apis[0]?.manifest.digest).toBe(manifest.digest);
  const generated = extensionBindingsSource(selection);
  expect(generated).toContain('import { createIntarray_1_5 } from "kello/extensions/intarray";');
  expect(generated).toContain('"intarray": createIntarray_1_5(descriptors["intarray"]),');
  expect(generated).toContain(JSON.stringify(manifest.digest));
  expect(generated).not.toContain("kello/tooling");
  expect(resolveSelectedExtension("intarray", { version: "1.4", schema: "extensions" }).adapter).toBeUndefined();
  expect(extensionBindingsSource({})).not.toContain("kello/extensions/intarray");
});

test("intarray internal estimators transfer through captured slots with native planner witnesses", () => {
  expect(intarrayUnresolvedInternalMembers).toEqual([]);
  const input = registerIntarraySemanticProof({
    baseline: [],
    declarations: [{ extension: "intarray", state: "pending", prerequisite: "Host acceptance pending" }],
    manifests: [],
    cases: [],
    receipts: [],
    currentSources: [],
    artifact: null,
  });
  const candidate = input.declarations[0]!;
  if (candidate.state !== "candidate") throw new Error("Missing intarray candidate");
  const estimators = candidate.members.flatMap((member) =>
    member.transfers
      .filter((edge) => edge.relation.kind === "operator-estimator")
      .map((edge) => ({ member: member.id, edge })),
  );
  expect(estimators).toHaveLength(7);
  for (const { member, edge } of estimators) {
    if (edge.relation.kind !== "operator-estimator") throw new Error("Missing estimator slot");
    const operator = manifest.contract.members.find((row) => row.id === edge.from);
    if (operator?.kind !== "operator") throw new Error("Missing captured parent operator");
    expect(member).toBe(`routine:${operator[edge.relation.slot]}`);
    expect(edge.caseId).toBe("intarray.operator-estimators");
    expect(edge.scenario).toContain(edge.relation.slot === "restrict" ? "where" : "join");
    expect(intarrayDatabaseProofCases.find((row) => row.id === edge.caseId)?.claims).toContainEqual({
      family: candidate.family,
      member: edge.from,
      scenario: edge.scenario,
    });
  }
});
