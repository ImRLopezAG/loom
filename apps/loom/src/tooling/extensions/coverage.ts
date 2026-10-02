import { validateExtensionManifest } from "../../core/extensions/registry";
import type { ExtensionManifest } from "../../core/extensions/contracts";
import type { ExtensionCatalogueEntry } from "./catalogue";

export type ExtensionMemberCoverage = {
  id: string;
  disposition: "query" | "schema" | "tooling" | "internal";
  reason: string;
  evidence: readonly string[];
};
export type ExtensionCoverageEntry =
  | {
      name: string;
      status: "verified";
      digest: string;
      members: readonly ExtensionMemberCoverage[];
      catalogueVersionMismatch?: { capturedVersion: string; reason: string; evidence: readonly string[] };
    }
  | {
      name: string;
      status: "restricted" | "pending";
      prerequisite: string;
      members: readonly ExtensionMemberCoverage[];
    }
  | { name: string; status: "excluded"; reason: string; members: readonly ExtensionMemberCoverage[] };

/** Exact reconciliation prevents a partial capture or an unsupported provider fixture becoming a coverage pass. */
export function validateExtensionCoverage(
  baseline: readonly ExtensionCatalogueEntry[],
  entries: readonly ExtensionCoverageEntry[],
  manifests: readonly ExtensionManifest[],
) {
  const expected = new Map(baseline.map((entry) => [entry.name, entry]));
  if (expected.size !== baseline.length) throw new Error("Duplicate catalogue extension");
  const seen = new Set<string>();
  const blockers: string[] = [];
  for (const entry of entries) {
    if (seen.has(entry.name)) throw new Error(`Duplicate coverage extension: ${entry.name}`);
    seen.add(entry.name);
    const catalogue = expected.get(entry.name);
    if (!catalogue) throw new Error(`Unknown coverage extension: ${entry.name}`);
    if (catalogue.disposition !== "eligible") {
      if (entry.status !== "excluded" || !entry.reason.trim() || entry.members.length)
        throw new Error(`Invalid excluded coverage: ${entry.name}`);
      continue;
    }
    if (entry.status === "excluded") throw new Error(`Eligible extension cannot be excluded: ${entry.name}`);
    if (entry.status !== "verified") {
      if (!entry.prerequisite.trim()) throw new Error(`Missing capture prerequisite: ${entry.name}`);
      blockers.push(`${entry.name}: ${entry.prerequisite}`);
      continue;
    }
    const matches = manifests.filter(
      (manifest) => manifest.digest === entry.digest && manifest.contract.extension === entry.name,
    );
    if (matches.length !== 1 || !matches[0]) throw new Error(`Missing or duplicate manifest: ${entry.name}`);
    const manifest = validateExtensionManifest(matches[0]);
    if (manifest.contract.provider !== "neon" || manifest.contract.postgresMajor !== 18)
      throw new Error(`Manifest does not match Neon catalogue: ${entry.name}`);
    if (manifest.contract.version !== catalogue.version) {
      const mismatch = entry.catalogueVersionMismatch;
      if (
        !mismatch ||
        mismatch.capturedVersion !== manifest.contract.version ||
        !mismatch.reason.trim() ||
        !mismatch.evidence.length ||
        mismatch.evidence.some((item) => !item.trim())
      )
        throw new Error(`Manifest version does not match Neon catalogue: ${entry.name}`);
      blockers.push(
        `${entry.name}: catalogue version ${catalogue.version}; captured SQL version ${mismatch.capturedVersion}: ${mismatch.reason}`,
      );
    } else if (entry.catalogueVersionMismatch) throw new Error(`Unexpected catalogue version mismatch: ${entry.name}`);
    const members = new Map(manifest.contract.members.map((member) => [member.id, member]));
    const covered = new Set<string>();
    for (const member of entry.members) {
      if (covered.has(member.id)) throw new Error(`Duplicate member coverage: ${member.id}`);
      covered.add(member.id);
      if (!members.has(member.id)) throw new Error(`Unknown member coverage: ${member.id}`);
      if (!member.reason.trim() || !member.evidence.length || member.evidence.some((item) => !item.trim()))
        throw new Error(`Missing member evidence: ${member.id}`);
    }
    for (const id of members.keys()) if (!covered.has(id)) throw new Error(`Missing member coverage: ${id}`);
  }
  for (const name of expected.keys()) if (!seen.has(name)) throw new Error(`Missing coverage extension: ${name}`);
  return { complete: !blockers.length, blockers: blockers.sort() };
}
