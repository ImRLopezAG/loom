import { ciStage, ciHash, ciId, ciScope } from "./ci-trace";
import { watch } from "node:fs";
import { realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { resolveProjectPath } from "../config/paths";
import { createDevelopmentCoordinator } from "./coordinator";
import type { DevelopmentCoordinatorOptions, DevelopmentRevision } from "./coordinator";

const ignoredDirectories = new Set([".git", ".loom", "node_modules", "dist", ".astro"]);
const componentArtifacts =
  /^_generated\.(?:staging|previous)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Watch dependencies anywhere in the project, including helpers outside backend/functions. */
export async function watchDevelopment(
  root: string,
  update: (revision: DevelopmentRevision) => Promise<void>,
  options: DevelopmentCoordinatorOptions = {},
) {
  return watchDevelopmentInternal(root, update, options);
}

/** Source-internal CLI ownership forwarding; absent from the public tooling barrel. */
export async function watchDevelopmentWithOwnedOutput(
  root: string,
  update: (revision: DevelopmentRevision) => Promise<void>,
  options: DevelopmentCoordinatorOptions,
  ownedOutputPath: string,
) {
  return watchDevelopmentInternal(root, update, options, ownedOutputPath);
}

async function watchDevelopmentInternal(
  root: string,
  update: (revision: DevelopmentRevision) => Promise<void>,
  options: DevelopmentCoordinatorOptions,
  ownedOutputPath?: string,
) {
  const directory = await resolveProjectPath(root, ".");
  const ownedFile = ownedOutputPath === undefined ? undefined : await realpath(ownedOutputPath);
  ciStage("watch.create", { rootHash: ciHash(directory) });
  const coordinator = ciScope({ rootHash: ciHash(directory) }, () => createDevelopmentCoordinator(update, options));
  let stopped = false;
  let watchError: Error | null = null;
  const watcher = watch(directory, { recursive: true, encoding: "utf8" }, (_event, filename) => {
    const ciEvent = ciId();
    ciStage("watch.event", { event: ciEvent, rootHash: ciHash(directory), eventKind: _event === "rename" || _event === "change" ? _event : "other", filenameHash: filename ? ciHash(filename) : undefined, filenameKind: !filename ? "missing" : filename === "kello/schema.ts" ? "schema" : filename.includes("_generated") ? "generated" : filename.includes(".loom") ? "internal" : "other" });
    if (stopped) return;
    if (filename && ownedFile === resolve(directory, filename)) return;
    // A missing filename means the OS could not identify the change: conservatively rebuild.
    const parts = filename?.split(/[\\/]/);
    if (parts?.some((part) => ignoredDirectories.has(part))) return;
    // Component codegen swaps sibling directories before publishing _generated.
    if (parts?.some((part) => componentArtifacts.test(part))) return;
    const generated = parts?.indexOf("_generated") ?? -1;
    if (generated !== -1 && parts?.[generated + 1] !== "migrations") return;
    if (generated !== -1 && parts?.some((part) => /^\.auth-ownership(?:\.json|-[0-9a-f-]+\.tmp)$/.test(part))) return;
    ciStage("watch.admitted", { event: ciEvent, rootHash: ciHash(directory) });
    ciScope({ event: ciEvent, rootHash: ciHash(directory) }, () => coordinator.invalidate());
  });
  const closed = new Promise<void>((resolve) => watcher.once("close", resolve));
  async function stop(): Promise<void> {
    ciStage("watch.stop.begin", { rootHash: ciHash(directory) });
    if (!stopped) {
      stopped = true;
      watcher.close();
    }
    await Promise.all([closed, coordinator.stop()]);
    ciStage("watch.stop.end", { rootHash: ciHash(directory) });
  }
  watcher.on("error", (cause) => {
    ciStage("watch.error", { rootHash: ciHash(directory) });
    watchError = new Error("Development filesystem watcher failed", { cause });
    void stop();
  });
  ciScope({ rootHash: ciHash(directory) }, () => coordinator.invalidate());
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
