import { createNeonApiFromOptions } from "@neon/config-runtime";
import type { NeonApi } from "@neon/config-runtime";
import * as v from "valibot";
import { configValidator } from "../config/define-config";
import type { LoomConfig } from "../config/define-config";

export type DevelopmentProvider = Pick<NeonApi, "getProject" | "listBranches" | "listEndpoints">;
export interface DevelopmentTarget {
  readonly projectId: string;
  readonly branchId: string;
  readonly endpointId: string;
  readonly postgresVersion: 18;
}
export function createDevelopmentProvider(): NeonApi {
  const apiKey = process.env.NEON_API_KEY;
  return createNeonApiFromOptions("loom development target", apiKey ? { apiKey } : undefined);
}
const identifier = v.pipe(v.string(), v.minLength(1));
const projectMetadata = v.object({ id: identifier, pgVersion: v.number() });
const branchMetadata = v.array(v.object({ id: identifier, protected: v.boolean(), isDefault: v.boolean() }));
const endpointMetadata = v.array(
  v.object({ id: identifier, branchId: identifier, type: v.picklist(["read_only", "read_write"]) }),
);

/** Reads provider state on every call. No credentials, provisioning or database mutations are performed. */
export async function inspectDevelopmentTarget(
  input: LoomConfig,
  provider?: DevelopmentProvider,
): Promise<DevelopmentTarget> {
  const config = v.parse(configValidator, input);
  const selection = config.provider;
  const development = selection?.targets.development;
  if (!selection || !development) throw new Error("Select an explicit development branch in loom.config.ts");
  if (development.protected) throw new Error("Development sync refuses a configured protected branch");
  if ([selection.targets.production?.branchId, selection.targets.preview?.branchId].includes(development.branchId))
    throw new Error("Development sync requires a branch separate from production and preview");

  const api = provider ?? createDevelopmentProvider();
  // The pinned runtime owns the management API transport. Validate the fields that authorize DDL.
  const responses = await Promise.all([
    api.getProject(selection.projectId),
    api.listBranches(selection.projectId),
    api.listEndpoints(selection.projectId),
  ]).catch((cause) => {
    throw new Error("Could not inspect the development target", { cause });
  });
  const project = v.parse(projectMetadata, responses[0]);
  const branches = v.parse(branchMetadata, responses[1]);
  const endpoints = v.parse(endpointMetadata, responses[2]);
  if (project.id !== selection.projectId) throw new Error("Provider returned a different project");
  if (project.pgVersion !== 18) throw new Error("Development sync requires PostgreSQL 18");
  const matches = branches.filter((branch) => branch.id === development.branchId);
  const branch = matches[0];
  if (!branch || matches.length !== 1) throw new Error("Development branch was not uniquely resolved");
  if (branch.protected || branch.isDefault) throw new Error("Development sync refuses protected or default branches");
  const writable = endpoints.filter((endpoint) => endpoint.branchId === branch.id && endpoint.type === "read_write");
  const endpoint = writable[0];
  if (!endpoint || writable.length !== 1)
    throw new Error("Development requires exactly one resolved read-write endpoint");
  return { projectId: project.id, branchId: branch.id, endpointId: endpoint.id, postgresVersion: 18 };
}
