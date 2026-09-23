import { setTimeout } from "node:timers/promises";
import { startProjectDevelopment } from "@loom/tooling";

export async function devCommand(root: string, file: string, structured: boolean): Promise<number> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.on("SIGINT", cancel);
  process.on("SIGTERM", cancel);
  let development: Awaited<ReturnType<typeof startProjectDevelopment>> | undefined;
  function report(event: "watching" | "ready" | "stopped", version?: string, url?: string) {
    console.log(
      structured
        ? JSON.stringify({ ok: true, command: "dev", event, version, url })
        : event === "ready"
          ? `Development ready at ${url} (${version}).`
          : event === "watching"
            ? "Watching development sources."
            : "Development stopped.",
    );
  }
  try {
    development = await startProjectDevelopment(root, file);
    report("watching");
    let version: string | undefined;
    let failure: typeof development.failure = null;
    while (!controller.signal.aborted) {
      if (development.watchError) throw new Error("Development watcher failed");
      const nextFailure = development.failure;
      const nextVersion = development.active?.version;
      if (nextFailure && nextFailure !== failure) {
        const code = "DEVELOPMENT_UPDATE_FAILED";
        const message =
          "Development update failed. Check source, schema changes, credentials and target access; save to retry.";
        console.error(
          structured
            ? JSON.stringify({
                ok: false,
                command: "dev",
                event: "update-failed",
                revision: nextFailure.revision,
                error: { code, message },
              })
            : `${code}: ${message}`,
        );
      }
      if (nextVersion && (nextVersion !== version || (failure && !nextFailure)))
        report("ready", nextVersion, development.url?.href);
      version = nextVersion;
      failure = nextFailure;
      try {
        await setTimeout(100, undefined, { signal: controller.signal });
      } catch (cause) {
        if (!controller.signal.aborted) throw cause;
      }
    }
  } finally {
    try {
      await development?.stop();
    } finally {
      process.off("SIGINT", cancel);
      process.off("SIGTERM", cancel);
    }
  }
  report("stopped");
  return 0;
}
