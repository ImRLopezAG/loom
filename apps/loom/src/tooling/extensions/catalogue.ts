export type ExtensionCatalogueDisposition =
  | "eligible"
  | "unavailable-pg18"
  | "existing-only"
  | "deprecated"
  | "builtin"
  | "decoder-plugin";
export type ExtensionCatalogueEntry = {
  name: string;
  version: string | null;
  disposition: ExtensionCatalogueDisposition;
};
function catalogueMap(entries: readonly ExtensionCatalogueEntry[]): Map<string, ExtensionCatalogueEntry> {
  const result = new Map<string, ExtensionCatalogueEntry>();
  for (const entry of entries) {
    if (result.has(entry.name)) throw new Error(`Duplicate catalogue extension: ${entry.name}`);
    result.set(entry.name, entry);
  }
  return result;
}
/** Compare explicit facts; the caller decides whether to accept a changed provider baseline. */
export function compareExtensionCatalogue(
  baseline: readonly ExtensionCatalogueEntry[],
  observed: readonly ExtensionCatalogueEntry[],
) {
  const previous = catalogueMap(baseline);
  const current = catalogueMap(observed);
  const added = [...current.keys()].filter((name) => !previous.has(name)).sort();
  const removed = [...previous.keys()].filter((name) => !current.has(name)).sort();
  const changed = [...current]
    .filter(([name, entry]) => {
      const before = previous.get(name);
      return before && (before.version !== entry.version || before.disposition !== entry.disposition);
    })
    .map(([name]) => name)
    .sort();
  return { unchanged: !added.length && !removed.length && !changed.length, added, removed, changed };
}
