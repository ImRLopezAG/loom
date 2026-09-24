import type { DiscoveredFunction } from "./discovery";

interface Namespace {
  readonly children: Map<string, Namespace>;
  functionIndex?: number;
}
/** Emit real nested members, and reject ambiguous file/export paths before publication. */
export function queryApi(functions: readonly DiscoveredFunction[]) {
  const root: Namespace = { children: new Map() };
  for (const [index, entry] of functions.entries()) {
    const [module, exported] = entry.name.split(":");
    if (!module || !exported) throw new Error("Invalid public function name");
    let node = root;
    for (const segment of [...module.split("/"), exported]) {
      if (node.functionIndex !== undefined) throw new Error(`Ambiguous public API path: ${entry.name}`);
      let child = node.children.get(segment);
      if (!child) {
        child = { children: new Map() };
        node.children.set(segment, child);
      }
      node = child;
    }
    if (node.children.size || node.functionIndex !== undefined)
      throw new Error(`Ambiguous public API path: ${entry.name}`);
    node.functionIndex = index;
  }
  function emit(node: Namespace, declarations: boolean): string {
    if (node.functionIndex !== undefined) {
      const entry = functions[node.functionIndex];
      if (!entry) throw new Error("Missing public API function");
      const query = entry.definition.kind === "query";
      if (declarations)
        return `${query ? "QueryMethod" : "MutationMethod"}<StandardSchemaV1.InferInput<typeof f${node.functionIndex}.${entry.exportName}.args>, StandardSchemaV1.InferOutput<typeof f${node.functionIndex}.${entry.exportName}.returns>${query ? "" : `, ${JSON.stringify(entry.definition.kind)}`}>`;
      const reference = { name: entry.name, kind: entry.definition.kind, visibility: "public" };
      return `${query ? "createQueryMethod" : "createMutationMethod"}({ ...${JSON.stringify(reference)}, version })`;
    }
    const members = [...node.children].map(([key, child]) =>
      declarations
        ? `readonly ${JSON.stringify(key)}: ${emit(child, true)};`
        : `[${JSON.stringify(key)}]: ${emit(child, false)}`,
    );
    return declarations ? `{ ${members.join(" ")} }` : `Object.freeze({ ${members.join(", ")} })`;
  }
  return { declarations: emit(root, true), javascript: emit(root, false) };
}
