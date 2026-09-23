import { createNeonApiFromOptions } from "@neon/config-runtime/v1";
import type { NeonApi } from "@neon/config-runtime/v1";
import { cronScheduleValidator, storageUploadValidator, storageUploadPrefix } from "@loom/core/server";
import { neonTriggerBindingValidator } from "@loom/core/neon";
import type { NeonTriggerBinding } from "@loom/core/neon";
import * as v from "valibot";
import { configValidator } from "../../config/define-config";
import type { LoomConfig } from "../../config/define-config";
import { inspectDeploymentTarget } from "./target";
import type { DeploymentEnvironment, DeploymentProvider, DeploymentTarget } from "./target";
import { readStorageBuckets } from "./storage";

export type DeploymentTriggerProvider = DeploymentProvider &
  Pick<NeonApi, "listBranchFunctions" | "listBranchTriggers" | "createBranchTrigger" | "updateBranchTrigger">;
export type DeploymentStorageTriggerProvider = DeploymentTriggerProvider & Pick<NeonApi, "listBranchBuckets">;
export interface NeonStorageTriggerOptions extends NeonTriggerTargetOptions {
  readonly workerSlug: string;
  readonly buckets: ReadonlyArray<{ readonly name: string; readonly bucket: string }>;
}
export interface NeonTriggerTargetOptions {
  readonly config: LoomConfig;
  readonly environment: DeploymentEnvironment;
}
export interface NeonTriggerDisableOptions extends NeonTriggerTargetOptions {
  readonly workerSlugs: readonly string[];
}
export interface NeonScheduleTriggerOptions extends NeonTriggerTargetOptions {
  readonly workerSlug: string;
  readonly schedules: ReadonlyArray<{
    readonly name: string;
    readonly schedule: string;
    readonly binding: Exclude<NeonTriggerBinding, { kind: "storage" }>;
  }>;
}
const identifier = v.pipe(v.string(), v.minLength(1), v.maxLength(256));
const slug = v.pipe(v.string(), v.regex(/^[a-z0-9]{1,20}$/));
const commonTrigger = {
  triggerId: identifier,
  name: identifier,
  functionSlug: slug,
  functionPath: v.string(),
  enabled: v.boolean(),
  inherited: v.boolean(),
};
const triggerValidator = v.variant("type", [
  v.object({ ...commonTrigger, type: v.literal("schedule"), cron: v.string() }),
  v.object({
    ...commonTrigger,
    type: v.literal("storage_object_created"),
    bucketName: storageUploadValidator.entries.bucket,
    prefix: v.optional(v.string()),
  }),
]);
const schedulesValidator = v.pipe(
  v.array(
    v.pipe(
      v.strictObject({
        name: identifier,
        schedule: cronScheduleValidator,
        binding: neonTriggerBindingValidator,
      }),
      v.check(
        (entry) => entry.binding.kind !== "storage" && entry.name === entry.binding.name,
        "Expected a matching schedule binding",
      ),
    ),
  ),
  v.check(
    (entries) => new Set(entries.map((entry) => entry.name)).size === entries.length,
    "Trigger names must be unique",
  ),
);
const triggerPath = "/api/loom/triggers";

async function triggerContext(options: NeonTriggerTargetOptions, provider?: DeploymentTriggerProvider) {
  const config = v.parse(configValidator, options.config);
  const environment = v.parse(v.picklist(["preview", "production"]), options.environment);
  const apiKey = process.env.NEON_API_KEY;
  const api: DeploymentTriggerProvider =
    provider ?? createNeonApiFromOptions("loom triggers", apiKey ? { apiKey } : undefined);
  const target = await inspectDeploymentTarget(config, environment, api);
  return {
    api,
    target,
    async assertTarget() {
      const current = await inspectDeploymentTarget(config, environment, api);
      if (JSON.stringify(current) !== JSON.stringify(target)) throw new Error("Trigger target changed");
    },
    async read() {
      const triggers = v.parse(
        v.array(triggerValidator),
        await api.listBranchTriggers(target.projectId, target.branchId),
      );
      if (
        new Set(triggers.map((trigger) => trigger.triggerId)).size !== triggers.length ||
        new Set(triggers.map((trigger) => trigger.name)).size !== triggers.length
      )
        throw new Error("Ambiguous provider triggers");
      return triggers;
    },
  };
}

/** Disables all provider trigger types attached to the explicit worker slugs. Other functions remain untouched. */
export async function disableNeonTriggers(options: NeonTriggerDisableOptions, provider?: DeploymentTriggerProvider) {
  const workers = new Set(v.parse(v.pipe(v.array(slug), v.minLength(1)), [...options.workerSlugs]));
  try {
    const context = await triggerContext(options, provider);
    const { api, target } = context;
    const selected = (await context.read()).filter((trigger) => workers.has(trigger.functionSlug));
    for (const trigger of selected) {
      if (!trigger.enabled) continue;
      await context.assertTarget();
      const current = (await context.read()).find((candidate) => candidate.triggerId === trigger.triggerId);
      if (!current || !workers.has(current.functionSlug)) throw new Error("Trigger ownership changed");
      if (current.enabled)
        await api.updateBranchTrigger(target.projectId, target.branchId, current.triggerId, {
          type: current.type,
          enabled: false,
        });
    }
    await context.assertTarget();
    const disabled = (await context.read()).filter((trigger) => workers.has(trigger.functionSlug));
    if (disabled.some((trigger) => trigger.enabled)) throw new Error("Provider left triggers enabled");
    return Object.freeze({
      target,
      triggers: Object.freeze(
        disabled.map((trigger) =>
          Object.freeze({
            triggerId: trigger.triggerId,
            name: trigger.name,
            functionSlug: trigger.functionSlug,
            type: trigger.type,
            inherited: trigger.inherited,
            enabled: false as const,
          }),
        ),
      ),
    });
  } catch {
    throw new Error("Could not disable Neon worker triggers");
  }
}

async function completedWorker(api: DeploymentTriggerProvider, target: DeploymentTarget, workerSlug: string) {
  const functions = v.parse(
    v.array(
      v.object({
        slug,
        activeDeploymentId: v.optional(v.number()),
        currentDeployment: v.optional(v.object({ id: v.number(), status: v.string() })),
      }),
    ),
    await api.listBranchFunctions(target.projectId, target.branchId),
  );
  const workers = functions.filter((fn) => fn.slug === workerSlug);
  const worker = workers[0];
  if (
    workers.length !== 1 ||
    !worker?.currentDeployment ||
    worker.currentDeployment.status !== "completed" ||
    worker.activeDeploymentId !== worker.currentDeployment.id
  )
    throw new Error("Deploy the worker before preparing triggers");
  return worker.currentDeployment.id;
}

/** Creates/reconciles disabled schedules. Returned IDs must be bound into the worker before later activation. */
export async function prepareNeonScheduleTriggers(
  options: NeonScheduleTriggerOptions,
  provider?: DeploymentTriggerProvider,
) {
  const workerSlug = v.parse(slug, options.workerSlug);
  const schedules = v.parse(schedulesValidator, structuredClone(options.schedules));
  try {
    const context = await triggerContext(options, provider);
    const { api, target } = context;
    await completedWorker(api, target, workerSlug);
    const initial = await context.read();
    for (const desired of schedules) {
      const existing = initial.find((trigger) => trigger.name === desired.name);
      if (existing && (existing.functionSlug !== workerSlug || existing.type !== "schedule"))
        throw new Error("Trigger name belongs to another resource");
    }
    for (const desired of schedules) {
      await context.assertTarget();
      const current = (await context.read()).find((trigger) => trigger.name === desired.name);
      if (current && (current.functionSlug !== workerSlug || current.type !== "schedule"))
        throw new Error("Trigger ownership changed");
      const input = {
        type: "schedule" as const,
        name: desired.name,
        functionSlug: workerSlug,
        functionPath: triggerPath,
        cron: desired.schedule,
        enabled: false,
      };
      if (!current) {
        v.parse(triggerValidator, await api.createBranchTrigger(target.projectId, target.branchId, input));
      } else if (
        current.type === "schedule" &&
        (current.enabled || current.cron !== desired.schedule || current.functionPath !== triggerPath)
      ) {
        v.parse(
          triggerValidator,
          await api.updateBranchTrigger(target.projectId, target.branchId, current.triggerId, input),
        );
      }
    }
    await context.assertTarget();
    const final = await context.read();
    const triggers = schedules.map((desired) => {
      const current = final.find((trigger) => trigger.name === desired.name);
      if (
        !current ||
        current.type !== "schedule" ||
        current.enabled ||
        current.functionSlug !== workerSlug ||
        current.functionPath !== triggerPath ||
        current.cron !== desired.schedule
      )
        throw new Error("Provider trigger does not match the disabled schedule");
      return Object.freeze({ ...current, binding: Object.freeze(desired.binding) });
    });
    const bindings: Record<string, NeonTriggerBinding> = Object.fromEntries(
      triggers.map((trigger) => [trigger.triggerId, trigger.binding]),
    );
    return Object.freeze({ target, workerSlug, triggers: Object.freeze(triggers), bindings: Object.freeze(bindings) });
  } catch {
    throw new Error("Could not prepare Neon schedule triggers");
  }
}

/** Prepares disabled object-created triggers restricted to this branch's staging-upload keys. */
export async function prepareNeonStorageTriggers(
  options: NeonStorageTriggerOptions,
  provider?: DeploymentStorageTriggerProvider,
) {
  const workerSlug = v.parse(slug, options.workerSlug);
  const desired = v.parse(
    v.pipe(
      v.array(v.strictObject({ name: identifier, bucket: storageUploadValidator.entries.bucket })),
      v.check(
        (entries) =>
          new Set(entries.map((entry) => entry.name)).size === entries.length &&
          new Set(entries.map((entry) => entry.bucket)).size === entries.length,
      ),
    ),
    structuredClone(options.buckets),
  );
  try {
    const apiKey = process.env.NEON_API_KEY;
    const api: DeploymentStorageTriggerProvider =
      provider ?? createNeonApiFromOptions("loom storage triggers", apiKey ? { apiKey } : undefined);
    const context = await triggerContext(options, api);
    const { target } = context;
    const deploymentId = await completedWorker(api, target, workerSlug);
    const prefix = storageUploadPrefix(target.projectId, target.branchId);
    async function verify() {
      await context.assertTarget();
      if ((await completedWorker(api, target, workerSlug)) !== deploymentId)
        throw new Error("Worker deployment changed");
      const buckets = await readStorageBuckets(api, target);
      if (desired.some((entry) => buckets.get(entry.bucket)?.accessLevel !== "private"))
        throw new Error("Storage trigger requires a private bucket");
      const triggers = await context.read();
      for (const entry of desired) {
        const existing = triggers.find((trigger) => trigger.name === entry.name);
        if (
          existing &&
          (existing.type !== "storage_object_created" ||
            existing.functionSlug !== workerSlug ||
            existing.bucketName !== entry.bucket)
        )
          throw new Error("Trigger name belongs to another resource");
      }
      return triggers;
    }
    for (const entry of desired) {
      const current = (await verify()).find((trigger) => trigger.name === entry.name);
      const input = {
        type: "storage_object_created" as const,
        name: entry.name,
        bucketName: entry.bucket,
        functionSlug: workerSlug,
        functionPath: triggerPath,
        prefix,
        enabled: false,
      };
      if (!current) v.parse(triggerValidator, await api.createBranchTrigger(target.projectId, target.branchId, input));
      else if (
        current.type === "storage_object_created" &&
        (current.enabled || current.prefix !== prefix || current.functionPath !== triggerPath)
      )
        v.parse(
          triggerValidator,
          await api.updateBranchTrigger(target.projectId, target.branchId, current.triggerId, input),
        );
    }
    const final = await verify();
    const triggers = desired.map((entry) => {
      const current = final.find((trigger) => trigger.name === entry.name);
      if (
        !current ||
        current.type !== "storage_object_created" ||
        current.enabled ||
        current.prefix !== prefix ||
        current.functionPath !== triggerPath
      )
        throw new Error("Provider trigger does not match the disabled storage binding");
      return Object.freeze({
        ...current,
        binding: Object.freeze({ kind: "storage" as const, name: entry.name, bucket: entry.bucket }),
      });
    });
    const bindings: Readonly<Record<string, NeonTriggerBinding>> = Object.freeze(
      Object.fromEntries(triggers.map((trigger) => [trigger.triggerId, trigger.binding])),
    );
    return Object.freeze({ target, workerSlug, triggers: Object.freeze(triggers), bindings });
  } catch {
    throw new Error("Could not prepare Neon storage triggers");
  }
}
