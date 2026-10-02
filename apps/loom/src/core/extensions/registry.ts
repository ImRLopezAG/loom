import { createHash } from "node:crypto";
import * as v from "valibot";
import {
  extensionContractValidator,
  extensionManifestValidator,
  type ExtensionContract,
  type ExtensionManifest,
  type ExtensionProvenance,
  type ExtensionContractSelection,
  type ExtensionContractResolution,
} from "./contracts";

function canonicalContract(input: ExtensionContract): ExtensionContract {
  const contract = v.parse(extensionContractValidator, input);
  const names = new Set<string>();
  for (const member of contract.members) {
    if (names.has(member.id)) throw new Error(`Duplicate extension member: ${member.id}`);
    names.add(member.id);
    if (member.kind === "operator" && member.defined !== (member.returns !== null && member.procedure !== null))
      throw new Error(`Inconsistent shell operator contract: ${member.id}`);
  }
  if (new Set(contract.requires).size !== contract.requires.length) throw new Error("Duplicate extension dependency");
  return {
    ...contract,
    requires: [...contract.requires].sort(),
    members: [...contract.members].sort((left, right) => left.id.localeCompare(right.id)),
  };
}
export function extensionContractDigest(contract: ExtensionContract): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalContract(contract)))
    .digest("hex");
}
export function createExtensionManifest(
  contract: ExtensionContract,
  provenance: ExtensionProvenance,
): ExtensionManifest {
  const normalized = canonicalContract(contract);
  return v.parse(extensionManifestValidator, {
    format: 1,
    contract: normalized,
    provenance,
    digest: extensionContractDigest(normalized),
  });
}
export function validateExtensionManifest(input: ExtensionManifest): ExtensionManifest {
  const manifest = v.parse(extensionManifestValidator, input);
  if (manifest.digest !== extensionContractDigest(manifest.contract))
    throw new Error(`Extension manifest digest mismatch: ${manifest.contract.extension}`);
  return { ...manifest, contract: canonicalContract(manifest.contract) };
}
export function resolveExtensionContract(
  manifests: readonly ExtensionManifest[],
  selection: ExtensionContractSelection,
): ExtensionContractResolution {
  const keys = new Set<string>();
  let selected: ExtensionManifest | undefined;
  for (const input of manifests) {
    const manifest = validateExtensionManifest(input);
    const contract = manifest.contract;
    const key = JSON.stringify([contract.extension, contract.postgresMajor, contract.version, contract.provider]);
    if (keys.has(key)) throw new Error(`Duplicate extension registry contract: ${key}`);
    keys.add(key);
    if (
      contract.extension === selection.name &&
      contract.postgresMajor === selection.postgresMajor &&
      contract.version === selection.version &&
      contract.provider === selection.provider
    )
      selected = manifest;
  }
  return selected
    ? { status: "verified", manifest: selected }
    : {
        ...selection,
        status: "unverified",
        reason: "No verified SQL contract for the configured extension version and provider",
      };
}
