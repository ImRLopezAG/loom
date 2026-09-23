import { createNeonApiFromOptions } from "@neon/config-runtime/v1";
import type { NeonApi } from "@neon/config-runtime/v1";
import { assertGeneratedVersion } from "../../codegen/generate";
import { loadProject } from "../../project/load";
import { inspectNeonFunctionHealth } from "./health";
import { inspectReleaseDatabase } from "./live-schema";
import { withNeonReleasePreparation } from "./prepare-release";
import type { NeonReleasePreparationOptions } from "./prepare-release";
import type { NeonReleaseReceipt } from "./release-receipt";
import { inspectRuntimeDatabase } from "./runtime-database";
import { activateNeonTriggers } from "./triggers";

/** Deploys to an explicitly selected, provisioned branch; retries verify live state before continuing. */
export async function deployNeonRelease(
  root: string,
  input: NeonReleasePreparationOptions,
  provider?: NeonApi,
): Promise<NeonReleaseReceipt> {
  const { signal = new AbortController().signal, ...values } = input;
  const options = { ...structuredClone(values), signal };
  signal.throwIfAborted();
  const project = await loadProject(root);
  if (project.version !== options.version) throw new Error("Release source version changed");
  const connectionString = options.variables[project.config.database.runtimeUrlEnv];
  if (!connectionString) throw new Error("Missing release runtime connection");
  const apiKey = process.env.NEON_API_KEY;
  const api = provider ?? createNeonApiFromOptions("loom release", apiKey ? { apiKey } : undefined);
  return withNeonReleasePreparation(
    project.root,
    options,
    async ({ client, database, activation, journal }) => {
      const receipt = journal.read();
      const functions = receipt.completed.find((entry) => entry.stage === "functions");
      const triggers = receipt.completed.find((entry) => entry.stage === "triggers");
      if (!functions || !triggers) throw new Error("Release preparation is incomplete");
      // Repeat health even after a saved acknowledgement: a prior observation is not current runtime evidence.
      const health = await inspectNeonFunctionHealth(
        project.root,
        {
          config: project.config,
          environment: options.environment,
          artifactHash: functions.artifactHash,
          activationToken: options.activationToken,
          signal,
        },
        api,
      );
      if (
        health.version !== receipt.identity.version ||
        JSON.stringify(health.target) !== JSON.stringify(receipt.identity.target) ||
        health.functions.some(
          (fn, index) =>
            fn.role !== functions.functions[index]?.role ||
            fn.functionId !== functions.functions[index]?.functionId ||
            fn.deploymentId !== functions.functions[index]?.deploymentId,
        )
      )
        throw new Error("Release health identity differs from its acknowledgement");
      await inspectReleaseDatabase(client, project.root, {
        namespace: database.namespace,
        migrations: project.config.database.migrations,
        migrationHashes: receipt.identity.migrationHashes,
        schema: receipt.identity.schema,
      });
      await inspectRuntimeDatabase({
        connectionString,
        database: database.database,
        namespace: database.namespace,
        metadataNamespace: database.metadataNamespace,
        runtimeRole: options.runtimeRole,
        signal,
      });
      await assertGeneratedVersion(project.root, options.version);
      await journal.complete({ stage: "health" });
      let activated = false;
      const worker = functions.functions[1];
      const enabled = await activateNeonTriggers(
        {
          config: project.config,
          environment: options.environment,
          target: database.target,
          workerSlug: worker.slug,
          workerFunctionId: worker.functionId,
          workerDeploymentId: worker.deploymentId,
          triggers: triggers.triggers,
          signal,
          assertActive: async (stageSignal) => {
            // This callback runs after provider target, worker, bucket and trigger checks, before any enable write.
            if (!activated) {
              stageSignal.throwIfAborted();
              if (receipt.completed.some((entry) => entry.stage === "activated"))
                await activation.assertActive(stageSignal);
              else await activation.activate();
              await journal.complete({ stage: "activated" });
              activated = true;
            }
            await activation.assertActive(stageSignal);
          },
        },
        api,
      );
      signal.throwIfAborted();
      await journal.complete({
        stage: "complete",
        enabledTriggerIds: enabled.triggers.map((entry) => entry.triggerId),
      });
      return journal.read();
    },
    api,
  );
}
