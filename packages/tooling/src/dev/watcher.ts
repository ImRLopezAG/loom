import { watch } from "node:fs";
import { resolveProjectPath } from "../config/paths";
import { createDevelopmentCoordinator } from "./coordinator";
import type { DevelopmentCoordinatorOptions, DevelopmentRevision } from "./coordinator";

const ignoredDirectories = new Set([".git", ".loom", "node_modules", "dist", ".astro"]);

/** Watch dependencies anywhere in the project, including helpers outside backend/functions. */
export async function watchDevelopment(
  root: string,
  update: (revision: DevelopmentRevision) => Promise<void>,
  options: DevelopmentCoordinatorOptions = {},
) {
  const directory = await resolveProjectPath(root, ".");
  const coordinator = createDevelopmentCoordinator(update, options);
  let stopped = false;
  let watchError: Error | null = null;
  const watcher = watch(directory, { recursive: true, encoding: "utf8" }, (_event, filename) => {
    if (stopped) return;
    // A missing filename means the OS could not identify the change: conservatively rebuild.
    const parts = filename?.split(/[\\/]/);
    if (parts?.some((part) => ignoredDirectories.has(part))) return;
    const generated = parts?.indexOf("_generated") ?? -1;
    if (generated !== -1 && parts?.[generated + 1] !== "migrations") return;
    coordinator.invalidate();
  });
  const closed = new Promise<void>((resolve) => watcher.once("close", resolve));
  async function stop(): Promise<void> {
    if (!stopped) {
      stopped = true;
      watcher.close();
    }
    await Promise.all([closed, coordinator.stop()]);
  }
  watcher.on("error", (cause) => {
    watchError = new Error("Development filesystem watcher failed", { cause });
    void stop();
  });
  coordinator.invalidate();
  return {
    get failure() {
      return coordinator.failure;
    },
    get watchError(): Error | null {
      return watchError;
    },
    flush: coordinator.flush,
    settled: coordinator.settled,
    stop,
  };
}
