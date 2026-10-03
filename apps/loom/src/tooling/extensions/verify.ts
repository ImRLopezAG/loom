import type pg from "pg";
import * as v from "valibot";
import { extensionManifestValidator } from "../../core/extensions/contracts";
import { validateExtensionManifest } from "../../core/extensions/registry";
import { captureExtensionContract } from "./capture";
import {
  captureExtensionSubscript,
  extensionSubscriptCaptureValidator,
  validateExtensionSubscriptCapture,
} from "./subscript-capture";
import {
  captureExtensionTextSearch,
  extensionTextSearchCaptureValidator,
  validateExtensionTextSearchCapture,
} from "./text-search-capture";

const schema = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\u0000")),
);
export const extensionApiRequirementValidator = v.strictObject({
  schema,
  manifest: extensionManifestValidator,
  textSearch: v.optional(extensionTextSearchCaptureValidator),
  subscripting: v.optional(extensionSubscriptCaptureValidator),
});
export type ExtensionApiRequirement = v.InferOutput<typeof extensionApiRequirementValidator>;

/** Pinned catalogue contracts are portable across namespaces; placement is a separate requirement. */
export function validateExtensionApiRequirement(input: ExtensionApiRequirement): ExtensionApiRequirement {
  const requirement = v.parse(extensionApiRequirementValidator, input);
  const manifest = validateExtensionManifest(requirement.manifest);
  const fixedSchema = manifest.contract.installation.fixedSchema;
  if (fixedSchema && fixedSchema !== requirement.schema)
    throw new Error(`Extension API namespace differs from fixed schema: ${manifest.contract.extension}`);
  if (manifest.contract.extension === "unaccent") {
    if (!requirement.textSearch) throw new Error("Unaccent API verification requires a pinned text-search contract");
    validateExtensionTextSearchCapture(requirement.textSearch, manifest);
  } else if (requirement.textSearch) throw new Error("Foreign text-search contract in extension API requirement");
  // Subscripting evidence is optional: requirements stored without it keep their original meaning and hash.
  if (requirement.subscripting) {
    if (manifest.contract.extension !== "hstore")
      throw new Error("Foreign subscripting contract in extension API requirement");
    validateExtensionSubscriptCapture(requirement.subscripting, manifest);
  }
  return requirement;
}

/**
 * Observe structural SQL contracts on the caller's direct session, without DDL or cached acknowledgements.
 * The caller owns lifecycle locking and provider authentication. Catalogue equality does not establish
 * effective runtime-role privileges, function implementation, external rules files or codec semantics.
 */
export async function verifyExtensionApiContracts(
  client: Pick<pg.Client, "query">,
  input: readonly ExtensionApiRequirement[],
): Promise<void> {
  // Validate every input before database I/O; a bad later requirement cannot produce a partial verification.
  const requirements = input.map(validateExtensionApiRequirement);
  const names = new Set<string>();
  for (const { manifest } of requirements) {
    if (names.has(manifest.contract.extension))
      throw new Error(`Duplicate extension API requirement: ${manifest.contract.extension}`);
    names.add(manifest.contract.extension);
  }
  for (const requirement of requirements) {
    const { manifest } = requirement;
    const { extension, provider } = manifest.contract;
    const observed = await captureExtensionContract(client, {
      name: extension,
      provider,
      fixture: "extension-api-verification",
    });
    if (observed.provenance.installationSchema !== requirement.schema)
      throw new Error(`Extension API namespace mismatch: ${extension}`);
    if (observed.digest !== manifest.digest) throw new Error(`Extension SQL contract mismatch: ${extension}`);
    if (requirement.textSearch) {
      const graph = await captureExtensionTextSearch(client, observed, {
        provider,
        fixture: "extension-api-verification",
      });
      if (graph.provenance.installationSchema !== requirement.schema || graph.digest !== requirement.textSearch.digest)
        throw new Error(`Extension text-search contract mismatch: ${extension}`);
    }
    if (requirement.subscripting) {
      const subscripting = await captureExtensionSubscript(client, observed, {
        provider,
        fixture: "extension-api-verification",
      });
      if (
        subscripting.provenance.installationSchema !== requirement.schema ||
        subscripting.digest !== requirement.subscripting.digest
      )
        throw new Error(`Extension subscripting contract mismatch: ${extension}`);
    }
  }
}
