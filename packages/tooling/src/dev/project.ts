import { readFile } from "node:fs/promises";
import * as v from "valibot";
import { resolveProjectPath } from "../config/paths";
import { developmentRuntimeOptions } from "./runtime";
import { developmentServerLimits } from "./server";
import { startDevelopment } from "./development";
import type { DevelopmentDatabaseProvider } from "./connection";
import { developmentJobInterval } from "./jobs";

const declarationValidator = v.strictObject({
  format: v.literal(1),
  ...v.omit(developmentRuntimeOptions, ["root", "sourceVersion", "activationToken"]).entries,
  ...developmentServerLimits.entries,
  activationTokenEnv: v.pipe(v.string(), v.regex(/^[A-Z][A-Z0-9_]*$/)),
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
  const { format: _format, activationTokenEnv, ...options } = declaration;
  if (activationTokenEnv === "NEON_API_KEY") throw new Error("Reserved development environment source");
  const token = v.safeParse(developmentRuntimeOptions.entries.activationToken, process.env[activationTokenEnv]);
  if (!token.success) throw new Error("Invalid development activation token");
  return startDevelopment({ ...options, root, activationToken: token.output }, provider);
}
