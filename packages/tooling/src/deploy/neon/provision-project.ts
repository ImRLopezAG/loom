import { readFile } from "node:fs/promises";
import * as v from "valibot";
import { resolveProjectPath } from "../../config/paths";
import { branchProvisionOptionsValidator, planNeonBranchProvision, provisionNeonBranch } from "./provision";
import type { NeonBranchProvisionProvider } from "./provision";

const declarationValidator = v.strictObject({ format: v.literal(1), ...branchProvisionOptionsValidator.entries });

async function readDeclaration(root: string, file: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const path = await resolveProjectPath(root, file);
  let declaration: v.InferOutput<typeof declarationValidator>;
  try {
    declaration = v.parse(declarationValidator, JSON.parse(await readFile(path, "utf8")));
  } catch {
    throw new Error("Invalid branch provisioning declaration");
  }
  signal?.throwIfAborted();
  const { format: _format, ...options } = declaration;
  return signal ? { ...options, signal } : options;
}

/** Uses only the explicit declaration; provisioning does not execute project modules. */
export async function planProjectBranchProvision(
  root: string,
  file: string,
  provider?: NeonBranchProvisionProvider,
  signal?: AbortSignal,
) {
  return planNeonBranchProvision(await readDeclaration(root, file, signal), provider);
}

export async function provisionProjectBranch(
  root: string,
  file: string,
  provider?: NeonBranchProvisionProvider,
  signal?: AbortSignal,
) {
  return provisionNeonBranch(root, await readDeclaration(root, file, signal), provider);
}
