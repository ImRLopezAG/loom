import { deployProjectRelease } from "@loom/tooling";

export async function deployCommand(root: string, file: string, structured: boolean): Promise<void> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const receipt = await deployProjectRelease(root, file, undefined, controller.signal);
    console.log(
      structured
        ? JSON.stringify({ ok: true, command: "deploy", receipt })
        : `Deployed ${receipt.identity.deployment} (${receipt.identity.version}) to ${receipt.identity.target.branchId}.`,
    );
  } finally {
    process.off("SIGINT", cancel);
    process.off("SIGTERM", cancel);
  }
}
