import { isRegisteredFunction } from "@loom/core/server";
import type { FunctionMetadata } from "@loom/core/server";
import * as v from "valibot";

export const moduleNamespace = v.record(v.string(), v.unknown());
export interface FunctionModule {
  readonly path: string;
  readonly exports: v.InferOutput<typeof moduleNamespace>;
}
export interface DiscoveredFunction {
  readonly name: string;
  readonly modulePath: string;
  readonly exportName: string;
  readonly definition: FunctionMetadata;
}

export function discoverFunctions(modules: readonly FunctionModule[]): readonly DiscoveredFunction[] {
  const found = new Map<string, DiscoveredFunction>();
  for (const module of modules) {
    const segments = module.path.replaceAll("\\", "/").split("/");
    if (segments.some((part) => part.startsWith("_") || part.startsWith("."))) continue;
    const modulePath = segments.join("/").replace(/\.(?:[cm]?[jt]s)$/, "");
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_/-]*$/.test(modulePath))
      throw new Error(`Invalid function module path: ${module.path}`);
    for (const [exportName, definition] of Object.entries(module.exports)) {
      if (!isRegisteredFunction(definition)) continue;
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(exportName))
        throw new Error(`Invalid function export: ${module.path}:${exportName}`);
      const name = `${modulePath}:${exportName}`;
      if (found.has(name)) throw new Error(`Duplicate function route: ${name}`);
      found.set(name, { name, modulePath: module.path, exportName, definition });
    }
  }
  return [...found.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
