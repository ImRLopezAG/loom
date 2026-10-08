import { ciStage, ciHash, ciId } from "../dev/ci-trace";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { resolveProjectPath } from "../config/paths";

/** Fail closed on an abandoned lock; only its current owner removes it. */
export async function withGenerationLock<T>(root: string, operation: () => Promise<T>): Promise<T> {
  const state = await resolveProjectPath(root, ".loom");
  await mkdir(state, { recursive: true });
  const lock = join(state, "generation.lock");
  const ciOperation = ciId();
  ciStage("lock.wait", { rootHash: ciHash(root), operation: ciOperation });
  const deadline = Date.now() + 10_000;
  for (;;) {
    try {
      await mkdir(lock);
      ciStage("lock.acquired", { rootHash: ciHash(root), operation: ciOperation });
      break;
    } catch (cause) {
      if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "EEXIST") throw cause;
      if (Date.now() >= deadline) throw new Error("Project generation is locked by another operation");
      await setTimeout(25);
    }
  }
  try {
    return await operation();
  } finally {
    ciStage("lock.release.begin", { rootHash: ciHash(root), operation: ciOperation });
    await rm(lock, { recursive: true });
    ciStage("lock.release.end", { rootHash: ciHash(root), operation: ciOperation });
  }
}
