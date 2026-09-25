import { relative } from "node:path";
import type { loadProject } from "../project/load";
import { contractGraph } from "./contracts";

export function applicationArtifacts(project: Awaited<ReturnType<typeof loadProject>>, hasRelations: boolean) {
  const schema = `${
    hasRelations ? 'import relations from "../relations";' : 'import { defineRelations } from "drizzle-orm";'
  }
import schema from "../schema";
import { createProjectContext } from "@loom/core/server";
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
import { resolveContract } from "@loom/core/contract";
import { validators } from "./schema";
${declarations}
${project.contractModules.map((_, index) => `export const contract${index} = resolveContract(declaration${index}, { validators });`).join("\n")}
export const contract = ${contractGraph(project.contractModules, (index) => `contract${index}`)};
`;
  const registration = `import type { schema, relations, validators } from "./schema";
import type { contract } from "./contract-registry";
declare module "@loom/core/contract" {
  interface ProjectRegistration {
    schema: typeof schema;
    relations: typeof relations;
    validators: typeof validators;
    contract: typeof contract;
  }
}
`;
  const rpc = `import type {} from "./registration";
import { createApplicationRpc } from "@loom/core/server";
import app from "../app.config";
import { schema, relations } from "./schema";
import { contract } from "./contract-registry";
const rpc = createApplicationRpc(app, { schema, relations, contract });
${project.builderNames.map((key, index) => `const builder${index} = rpc[${JSON.stringify(key)}]; export { builder${index} as ${key} };`).join("\n")}
`;
  const files = new Map([
    ["schema.ts", schema],
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
  return {
    "api.js": `import { createORPCClient, createRpcTransport, createRpcHttpTransport } from "@loom/core/client";
export const version = ${JSON.stringify(project.version)};
export function createServerClient(options) {
  const transport = createRpcHttpTransport({ ...options, version });
  return Object.freeze({ ...transport, client: createORPCClient(transport.link) });
}
export function createClient(options) {
  const transport = createRpcTransport({ ...options, version });
  return Object.freeze({ ...transport, client: createORPCClient(transport.link) });
}
`,
    "api.d.ts": `import type { contract } from ${JSON.stringify(registry.startsWith(".") ? registry : `./${registry}`)};
import type { RouterContractClient } from "@loom/core/contract";
import type { RpcCallContext, RpcTransportOptions, createRpcTransport } from "@loom/core/client";
export type PublicContract = Omit<typeof contract, "internal">;
export type Client = RouterContractClient<PublicContract, RpcCallContext>;
export declare const version: ${JSON.stringify(project.version)};
export declare function createServerClient(options: Omit<RpcTransportOptions, "version">): ReturnType<typeof createRpcTransport> & { readonly client: Client };
export declare function createClient(options: Omit<RpcTransportOptions, "version">): ReturnType<typeof createRpcTransport> & { readonly client: Client };
`,
  };
}
