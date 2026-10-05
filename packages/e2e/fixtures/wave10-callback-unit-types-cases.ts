import type { ExtensionProofCase } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { wave10CallbackProofs, wave10AdapterFileName } from "./wave10-callback-proof-cases";

const contracts = [
  ["citext", "citext.exactCoverageAndOverloadContracts"],
  ["cube", "cube native representation retains point shape, dimension and nonfinite coordinates"],
  ["autoinc", "autoinc requires its exact verified 1.0 contract"],
  ["moddatetime", "moddatetime requires its exact verified 1.0 contract"],
  ["tsm_system_rows", "tsm_system_rows factory admits only its exact verified manifest"],
  ["tsm_system_time", "tsm_system_time factory admits only its exact verified manifest"],
  ["intagg", "intagg requires its exact verified 1.1 contract"],
  ["pgstattuple", "factories require their exact verified manifests"],
  ["pgrowlocks", "tid and xid codecs enforce native ranges"],
  ["dict_int", "dict_int requires its exact verified 1.0 contract"],
] as const;

export const wave10CallbackUnitCases: ExtensionProofCase[] = contracts.map(([name, title]) => ({
  id: `${name}.unit-contracts`,
  file: `packages/tests/unit/extensions-${wave10AdapterFileName(name)}.test.ts`,
  title,
  gate: "unit",
  families: [wave10CallbackProofs[name].family],
  claims: [],
}));

export const wave10CallbackTypesCases: ExtensionProofCase[] = contracts.map(([name]) => ({
  id: `${name}.types-contracts`,
  file: `packages/tests/types/extensions-${wave10AdapterFileName(name === "pgrowlocks" ? "pgstattuple" : name)}.test-d.ts`,
  title: `${name} public exact-version and schema-authority declarations`,
  gate: "types",
  families: [wave10CallbackProofs[name].family],
  claims: [],
}));
