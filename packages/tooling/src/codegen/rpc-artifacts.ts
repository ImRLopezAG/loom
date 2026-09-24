import { getClientMode } from "@loom/core/server";
import { relative } from "node:path";
import type { loadProject } from "../project/load";
import type { DiscoveredProcedure } from "./procedures";

interface RouterNode {
  readonly children: Map<string, RouterNode>;
  leaf?: DiscoveredProcedure;
}

function graph(entries: readonly DiscoveredProcedure[], types: boolean, methods = false, wire = false): string {
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
      const mode = getClientMode(node.leaf.definition) ?? "mutation";
      if (methods) {
        const method = mode === "live" ? "Live" : mode === "finite" ? "Query" : "Mutation";
        const path = node.leaf.path.map((key) => `[${JSON.stringify(key)}]`).join("");
        return types
          ? `Rpc${method}Method<Client${path}>`
          : `createRpc${method}Method(raw${path}, session, ${JSON.stringify(node.leaf.path)})`;
      }
      const source = `typeof m${node.leaf.moduleIndex}${access}`;
      return types
        ? wire && mode === "live"
          ? `LiveProcedure<${source}>`
          : source
        : `project.module${node.leaf.moduleIndex}${access}`;
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
    "api.js": `import { createORPCClient as createClient } from "@loom/core/client";
import { createRpcQuerySession, createRpcQueryMethod, createRpcLiveMethod, createRpcMutationMethod } from "@loom/core/query";
export { createClient };
export function createApi(options) {
  const session = createRpcQuerySession(options);
  const raw = createClient(session.link);
  return Object.freeze({ ...session, raw, api: ${graph(publicEntries, false, true)} });
}
`,
    "api.d.ts": `${declarations(publicEntries)}
import type { RouterClient, LiveProcedure } from "@loom/core/server";
import type { RpcQuerySessionOptions, RpcQuerySession, RpcQueryMethod, RpcLiveMethod, RpcMutationMethod } from "@loom/core/query";
import type { ClientLink } from "@loom/core/client";
export type PublicRouter = ${graph(publicEntries, true, false, true)};
export type Client = RouterClient<PublicRouter>;
export declare function createClient(link: ClientLink<Record<never, never>>): Client;
export declare function createApi(options: RpcQuerySessionOptions<Record<never, never>>): RpcQuerySession<Record<never, never>> & { readonly raw: Client; readonly api: ${graph(publicEntries, true, true)} };
`,
    "internal.js": 'export { internal } from "./router.js";\n',
    "internal.d.ts": `${declarations(internalEntries)}\nexport declare const internal: ${graph(internalEntries, true)};\n`,
    "router.js": `import * as project from "./project.js";
import { defineRpcAuth, defineProcedureStorage } from "@loom/core/server";
export { schema, relations, crons, upgrade as jobMigrations } from "./project.js";
export const auth = project.auth ?? defineRpcAuth();
export const storage = project.storage ?? defineProcedureStorage();
export const router = ${graph(publicEntries, false)};
export const internal = ${graph(internalEntries, false)};
export const procedures = [${project.procedures.map((entry) => `{ path: ${JSON.stringify(entry.path)}, visibility: ${JSON.stringify(entry.visibility)}, procedure: project.module${entry.moduleIndex}${entry.exportPath.map((key) => `[${JSON.stringify(key)}]`).join("")} }`).join(", ")}];
`,
  };
}
