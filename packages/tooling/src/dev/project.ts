import { readFile } from "node:fs/promises";
import * as v from "valibot";
import { createNeonStorageBackend } from "@loom/core/neon";
import type { RuntimeStorageBackend } from "@loom/core/server";
import { resolveProjectPath } from "../config/paths";
import { developmentRuntimeOptions } from "./runtime";
import { developmentServerLimits } from "./server";
import { startDevelopment } from "./development";
import type { DevelopmentDatabaseProvider } from "./connection";
import { developmentJobInterval } from "./jobs";

const environmentName = v.pipe(v.string(), v.regex(/^[A-Z][A-Z0-9_]*$/));
const declarationValidator = v.strictObject({
  format: v.literal(1),
  ...v.omit(developmentRuntimeOptions, ["root", "sourceVersion", "activationToken"]).entries,
  ...developmentServerLimits.entries,
  activationTokenEnv: environmentName,
  storage: v.optional(
    v.strictObject({
      projectId: v.string(),
      branchId: v.string(),
      endpoint: v.string(),
      region: v.string(),
      accessKeyIdEnv: environmentName,
      secretAccessKeyEnv: environmentName,
    }),
  ),
  debounceMs: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(60_000)), 75),
  jobPollMs: developmentJobInterval,
});

/** Reads a contained declaration, capturing the secret before executing project modules. */
export async function startProjectDevelopment(
  root: string,
  file = "loom.dev.json",
  provider?: DevelopmentDatabaseProvider,
) {
  const path = await resolveProjectPath(root, file);
  let declaration: v.InferOutput<typeof declarationValidator>;
  try {
    declaration = v.parse(declarationValidator, JSON.parse(await readFile(path, "utf8")));
  } catch {
    throw new Error("Invalid development declaration");
  }
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
