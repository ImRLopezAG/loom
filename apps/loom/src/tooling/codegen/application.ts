import { relative } from "node:path";
import type { loadProject } from "../project/load";
import { contractGraph } from "./contracts";

export function applicationArtifacts(project: Awaited<ReturnType<typeof loadProject>>, hasRelations: boolean) {
  const schema = `${
    hasRelations ? 'import relations from "../relations";' : 'import { defineRelations } from "drizzle-orm";'
  }
import schema from "../schema";
import { createProjectContext } from "loom/server";
${hasRelations ? "" : "const relations = defineRelations(schema.tables);"}
export { schema, relations };
export const { tables, validators } = createProjectContext(schema);
`;
  const declarations = project.contractModules
    .map(
      (module, index) =>
        `import declaration${index} from ${JSON.stringify(`../contracts/${module.path.replace(/\.[cm]?[jt]s$/, "")}`)};`,
    )
    .join("\n");
  const registry = `import type {} from "./registration";
import { resolveContract } from "loom/contract";
import { validators } from "./schema";
${declarations}
${project.contractModules.map((_, index) => `export const contract${index} = resolveContract(declaration${index}, { validators });`).join("\n")}
export const contract = ${contractGraph(project.contractModules, (index) => `contract${index}`)};
`;
  const mounted = project.components.filter((node) => !node.path.includes("/"));
  const componentTypes = `import type { ComponentServices } from "loom/server";
import type { RouterContractClient } from "loom/contract";
${mounted.map((node, index) => `import type { contract as contract${index} } from ${JSON.stringify(node.packageDescriptor?.contractRegistry ?? relative(`${project.backend}/_generated`, `${node.directory}/_generated/contract-registry`).replaceAll("\\", "/"))};`).join("\n")}
export type PublicComponents = {
${mounted.flatMap((node, index) => (node.public === undefined ? [] : [`${JSON.stringify(node.public)}: Omit<typeof contract${index}, "internal">;`])).join("\n")}
};
export interface Components {
${mounted
  .map(
    (node, index) =>
      `${JSON.stringify(node.reference.name)}: { readonly rpc: RouterContractClient<Omit<typeof contract${index}, "internal">>; readonly services: ComponentServices<typeof import(${JSON.stringify(
        node.packageDescriptor?.entry ??
          relative(`${project.backend}/_generated`, node.setupFile)
            .replaceAll("\\", "/")
            .replace(/\.[cm]?[jt]s$/, ""),
      )}).default> };`,
  )
  .join("\n")}
}
`;
  const registration = `import type { Components } from "./components";
import type { schema, relations, validators } from "./schema";
import type { contract } from "./contract-registry";
declare module "loom/contract" {
  interface ProjectRegistration {
    components: Components;
    schema: typeof schema;
    relations: typeof relations;
    validators: typeof validators;
    contract: typeof contract;
  }
}
`;
  const rpc = `import type {} from "./registration";
import { createApplicationRpc } from "loom/server";
import app from "../app.config";
import { schema, relations } from "./schema";
import { contract } from "./contract-registry";
const rpc = createApplicationRpc(app, { schema, relations, contract });
${project.builderNames.map((key, index) => `const builder${index} = rpc[${JSON.stringify(key)}]; export { builder${index} as ${key} };`).join("\n")}
`;
  const files = new Map([
    ["schema.ts", schema],
    ["components.ts", componentTypes],
    ["config.js", `export const configuration = Object.freeze(${JSON.stringify(project.publicConfiguration)});\n`],
    [
      "config.d.ts",
      "export declare const configuration: Readonly<{ serviceUrl?: string; authUrl?: string; dataApiUrl?: string }>;\n",
    ],
    ["contract-registry.ts", registry],
    ["registration.d.ts", registration],
    ["rpc.ts", rpc],
  ]);
  for (const [index, module] of project.contractModules.entries()) {
    const filename = `contracts/${module.path.replace(/\.[cm]?[jt]s$/, "")}.ts`;
    const parent = filename
      .split("/")
      .slice(0, -1)
      .map(() => "..")
      .join("/");
    files.set(filename, `export { contract${index} as default } from "${parent}/contract-registry";\n`);
  }
  return Object.fromEntries(files);
}

export function applicationClientArtifacts(project: Awaited<ReturnType<typeof loadProject>>, directory: string) {
  const registry = relative(directory, `${project.backend}/_generated/contract-registry`).replaceAll("\\", "/");
  const configurationPath = relative(directory, `${project.backend}/_generated/config.js`).replaceAll("\\", "/");
  return {
    "api.js": `import { createORPCClient, createRpcTransport, createRpcHttpTransport } from "loom/client";
import { createTanstackQueryUtils } from "loom/client";
export const version = ${JSON.stringify(project.version)};
import { configuration } from ${JSON.stringify(configurationPath.startsWith(".") ? configurationPath : `./${configurationPath}`)};
export { configuration };
export function createServerClient(options) {
  const url = options.url ?? configuration.serviceUrl;
  if (!url) throw new Error("Loom service URL is missing. Deploy or pass url explicitly.");
  const transport = createRpcHttpTransport({ ...options, url, version });
  const client = createORPCClient(transport.link);
  return Object.freeze({ ...transport, client, rpc: createTanstackQueryUtils(client, { prefix: options.cachePrefix }) });
}
export function createClient(options) {
  const url = options.url ?? configuration.serviceUrl;
  if (!url) throw new Error("Loom service URL is missing. Deploy or pass url explicitly.");
  const transport = createRpcTransport({ ...options, url, version });
  const client = createORPCClient(transport.link);
  return Object.freeze({ ...transport, client, rpc: createTanstackQueryUtils(client, { prefix: options.cachePrefix }) });
}
`,
    "api.d.ts": `import type { contract } from ${JSON.stringify(registry.startsWith(".") ? registry : `./${registry}`)};
import type { PublicComponents } from ${JSON.stringify(relative(directory, `${project.backend}/_generated/components`).replaceAll("\\", "/"))};
import type { RouterUtils } from "loom/client";
import type { RouterContractClient } from "loom/contract";
import type { RpcCallContext, RpcTransportOptions, createRpcTransport } from "loom/client";
export type PublicContract = Omit<typeof contract, "internal"> & PublicComponents;
export type Client = RouterContractClient<PublicContract, RpcCallContext>;
export declare const configuration: Readonly<{ serviceUrl?: string; authUrl?: string; dataApiUrl?: string }>;
export declare const version: ${JSON.stringify(project.version)};
export declare function createServerClient(options: Omit<RpcTransportOptions, "version" | "url"> & { readonly url?: string }): ReturnType<typeof createRpcTransport> & { readonly client: Client; readonly rpc: RouterUtils<Client> };
export declare function createClient(options: Omit<RpcTransportOptions, "version" | "url"> & { readonly url?: string }): ReturnType<typeof createRpcTransport> & { readonly client: Client; readonly rpc: RouterUtils<Client> };
`,
  };
}
