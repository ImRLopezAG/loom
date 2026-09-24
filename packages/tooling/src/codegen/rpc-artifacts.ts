import { relative } from "node:path";
import type { loadProject } from "../project/load";
import type { DiscoveredProcedure } from "./procedures";

interface RouterNode {
  readonly children: Map<string, RouterNode>;
  leaf?: DiscoveredProcedure;
}

function graph(entries: readonly DiscoveredProcedure[], types: boolean): string {
  const root: RouterNode = { children: new Map() };
  for (const entry of entries) {
    let node = root;
    for (const segment of entry.path) {
      let child = node.children.get(segment);
      if (!child) {
        child = { children: new Map() };
        node.children.set(segment, child);
      }
      node = child;
    }
    node.leaf = entry;
  }
  function emit(node: RouterNode): string {
    if (node.leaf) {
      const access = node.leaf.exportPath.map((key) => `[${JSON.stringify(key)}]`).join("");
      return types ? `typeof m${node.leaf.moduleIndex}${access}` : `project.module${node.leaf.moduleIndex}${access}`;
    }
    return `{ ${[...node.children].map(([key, child]) => `${JSON.stringify(key)}: ${emit(child)}`).join(types ? "; " : ", ")} }`;
  }
  return emit(root);
}

/** Runtime client code contains no project imports; declarations alone refer to
 * the native procedure types. Internal routes are emitted only in server code. */
export function rpcArtifacts(project: Awaited<ReturnType<typeof loadProject>>, directory: string) {
  const publicEntries = project.procedures.filter((entry) => entry.visibility === "public");
  const internalEntries = project.procedures.filter((entry) => entry.visibility === "internal");
  const declarations = (entries: readonly DiscoveredProcedure[]) => {
    const indices = [...new Set(entries.map((entry) => entry.moduleIndex))];
    return indices
      .map((index) => {
        const source = project.procedureModules[index];
        if (!source) throw new Error("Discovered procedure module is missing");
        const path = relative(directory, source.file)
          .replaceAll("\\", "/")
          .replace(/\.(?:[cm]?[jt]s)$/, "");
        return `import type * as m${index} from ${JSON.stringify(path.startsWith(".") ? path : `./${path}`)};`;
      })
      .join("\n");
  };
  return {
    "api.js": 'export { createORPCClient as createClient } from "@loom/core/client";\n',
    "api.d.ts": `${declarations(publicEntries)}
import type { RouterClient } from "@loom/core/server";
import type { ClientLink } from "@loom/core/client";
export type PublicRouter = ${graph(publicEntries, true)};
export type Client = RouterClient<PublicRouter>;
export declare function createClient(link: ClientLink<Record<never, never>>): Client;
`,
    "internal.js": 'export { internal } from "./router.js";\n',
    "internal.d.ts": `${declarations(internalEntries)}\nexport declare const internal: ${graph(internalEntries, true)};\n`,
    "router.js": `import * as project from "./project.js";
export { schema, relations, auth, crons, storage } from "./project.js";
export const router = ${graph(publicEntries, false)};
export const internal = ${graph(internalEntries, false)};
`,
  };
}
