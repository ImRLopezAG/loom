import { createNeonApiFromOptions } from "@neon/config-runtime/v1";
import type { NeonApi } from "@neon/config-runtime/v1";
import * as v from "valibot";
import { configValidator } from "../../config/define-config";
import type { LoomConfig } from "../../config/define-config";
import { readNeonFunctionReceipt } from "./receipt";
import { inspectDeploymentTarget } from "./target";
import type { DeploymentEnvironment, DeploymentProvider } from "./target";
import { readWithSignal } from "./observe";

export type DeploymentHealthProvider = DeploymentProvider & Pick<NeonApi, "listBranchFunctions">;
export interface NeonFunctionHealthOptions {
  readonly config: LoomConfig;
  readonly environment: DeploymentEnvironment;
  readonly artifactHash: string;
  readonly activationToken: string;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}
const digest = v.pipe(v.string(), v.length(64), v.regex(/^[a-f0-9]+$/));
const healthValidator = v.strictObject({
  format: v.literal(1),
  databaseDrainProtocol: v.optional(v.picklist([0, 1]), 0),
  version: digest,
  artifactHash: digest,
  role: v.picklist(["service", "worker"]),
});
function invocationAddress(value: string): URL {
  const address = new URL(value);
  if (address.protocol !== "https:" || address.username || address.password || address.search || address.hash)
    throw new Error("Invalid invocation address");
  return address;
}
async function readHealth(response: Response) {
  if (
    response.status !== 200 ||
    response.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json" ||
    !response.body
  ) {
    await response.body?.cancel();
    throw new Error("Invalid health response");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 4096) throw new Error("Health response too large");
      text += decoder.decode(chunk.value, { stream: true });
    }
    return v.parse(healthValidator, JSON.parse(text + decoder.decode()));
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Observes saved, completed deployments over verified HTTPS. Never activates grants or modifies receipts. */
export async function inspectNeonFunctionHealth(
  root: string,
  input: NeonFunctionHealthOptions,
  provider?: DeploymentHealthProvider,
) {
  try {
    const { signal: callerSignal, ...values } = input;
    const options = structuredClone(values);
    const config = v.parse(configValidator, options.config);
    const token = v.parse(digest, options.activationToken);
    const timeout = options.timeoutMs ?? 10_000;
    if (!Number.isInteger(timeout) || timeout < 1 || timeout > 60_000) throw new Error("Invalid timeout");
    const signal = AbortSignal.any([AbortSignal.timeout(timeout), ...(callerSignal ? [callerSignal] : [])]);
    signal.throwIfAborted();
    const receipt = await readNeonFunctionReceipt(root, options.artifactHash);
    if (
      receipt.artifactHash !== options.artifactHash ||
      receipt.functions[0].role !== "service" ||
      receipt.functions[1].role !== "worker" ||
      new Set(receipt.functions.map((fn) => fn.slug)).size !== 2 ||
      new Set(receipt.functions.map((fn) => fn.functionId)).size !== 2 ||
      receipt.functions.some(
        (fn) => fn.state !== "completed" || !fn.functionId || !fn.deploymentId || !fn.invocationUrl,
      )
    )
      throw new Error("Incomplete function receipt");
    const apiKey = process.env.NEON_API_KEY;
    const api = provider ?? createNeonApiFromOptions("loom deployment health", apiKey ? { apiKey } : undefined);
    async function observe() {
      const target = await readWithSignal(() => inspectDeploymentTarget(config, options.environment, api), signal);
      if (JSON.stringify(target) !== JSON.stringify(receipt.target)) throw new Error("Target changed");
      const functions = await readWithSignal(() => api.listBranchFunctions(target.projectId, target.branchId), signal);
      for (const expected of receipt.functions) {
        const matches = functions.filter((fn) => fn.slug === expected.slug);
        const current = matches[0];
        if (
          !current ||
          matches.length !== 1 ||
          current.id !== expected.functionId ||
          current.activeDeploymentId !== expected.deploymentId ||
          current.currentDeployment?.id !== expected.deploymentId ||
          current.currentDeployment.status !== "completed" ||
          !expected.invocationUrl ||
          invocationAddress(current.invocationUrl).href !== invocationAddress(expected.invocationUrl).href
        )
          throw new Error("Function deployment changed");
      }
      signal.throwIfAborted();
    }
    await observe();
    const protocols = new Map<"service" | "worker", 0 | 1>();
    for (const fn of receipt.functions) {
      if (!fn.invocationUrl) throw new Error("Missing invocation address");
      signal.throwIfAborted();
      const response = await fetch(
        `${invocationAddress(fn.invocationUrl).href.replace(/\/$/, "")}/_loom/deployment/health`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          redirect: "error",
          cache: "no-store",
          signal,
        },
      );
      const health = await readHealth(response);
      if (health.version !== receipt.version || health.artifactHash !== receipt.artifactHash || health.role !== fn.role)
        throw new Error("Unexpected runtime build");
      protocols.set(fn.role, health.databaseDrainProtocol);
    }
    await observe();
    return Object.freeze({
      target: receipt.target,
      version: receipt.version,
      artifactHash: receipt.artifactHash,
      functions: receipt.functions.map(({ role, functionId, deploymentId }) =>
        Object.freeze({ role, functionId, deploymentId, databaseDrainProtocol: protocols.get(role) ?? 0 }),
      ),
    });
  } catch {
    throw new Error("Deployment health verification failed");
  }
}
