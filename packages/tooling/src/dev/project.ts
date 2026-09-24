import { readFile } from "node:fs/promises";
import * as v from "valibot";
import { createNeonStorageBackend } from "@loom/core/neon";
import type { RuntimeStorageBackend } from "@loom/core/server";
import { resolveProjectPath } from "../config/paths";
import { developmentRuntimeOptions } from "./runtime";
import { developmentConfigValidator } from "../config/development";
import { startDevelopment } from "./development";
import type { DevelopmentDatabaseProvider } from "./connection";
import { loadProjectConfig } from "../project/load";
import { quarantineDevelopmentDatabase } from "./quarantine";

const declarationValidator = v.strictObject({ format: v.literal(1), ...developmentConfigValidator.entries });

async function readDeclaration(root: string, file: string) {
  if (file === "loom.config.ts") {
    const { config } = await loadProjectConfig(root);
    if (!config.development) throw new Error("Configure development in loom.config.ts");
    return { format: 1 as const, ...config.development };
  }
  const path = await resolveProjectPath(root, file);
  try {
    return v.parse(declarationValidator, JSON.parse(await readFile(path, "utf8")));
  } catch {
    throw new Error("Invalid development declaration");
  }
}

/** Reads a contained declaration, capturing the secret before executing project modules. */
export async function startProjectDevelopment(
  root: string,
  file = "loom.config.ts",
  provider?: DevelopmentDatabaseProvider,
) {
  const declaration = await readDeclaration(root, file);
  const { format: _format, activationTokenEnv, storage, ...options } = declaration;
  if (activationTokenEnv === "NEON_API_KEY") throw new Error("Reserved development environment source");
  const token = v.safeParse(developmentRuntimeOptions.entries.activationToken, process.env[activationTokenEnv]);
  if (!token.success) throw new Error("Invalid development activation token");
  const backend: Partial<Record<"storageBackend", RuntimeStorageBackend>> = {};
  if (storage) {
    try {
      const { projectId, branchId, endpoint, region, accessKeyIdEnv, secretAccessKeyEnv } = storage;
      if (new Set(["NEON_API_KEY", activationTokenEnv, accessKeyIdEnv, secretAccessKeyEnv]).size !== 4)
        throw new Error("Distinct storage credential sources required");
      const secret = v.pipe(v.string(), v.minLength(1));
      backend.storageBackend = createNeonStorageBackend(
        { projectId, branchId },
        {
          endpoint,
          region,
          credentials: {
            accessKeyId: v.parse(secret, process.env[accessKeyIdEnv]),
            secretAccessKey: v.parse(secret, process.env[secretAccessKeyEnv]),
          },
        },
      );
    } catch {
      throw new Error("Invalid development storage configuration");
    }
  }
  return startDevelopment({ ...options, ...backend, root, activationToken: token.output }, provider);
}

/** Quarantines the selected database without reading runtime secrets or loading backend modules. */
export async function quarantineProjectDevelopment(
  root: string,
  file = "loom.config.ts",
  provider?: DevelopmentDatabaseProvider,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  const declaration = await readDeclaration(root, file);
  const { config } = await loadProjectConfig(root);
  signal?.throwIfAborted();
  const cancellation: Partial<Record<"signal", AbortSignal>> = {};
  if (signal) cancellation.signal = signal;
  return quarantineDevelopmentDatabase(
    {
      config,
      databaseName: declaration.databaseName,
      migrationRole: declaration.migrationRole,
      ...cancellation,
    },
    provider,
  );
}
