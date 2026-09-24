import { join } from "node:path";

/** Keep fake-session builds outside the example's production output. */
export async function buildAcceptanceFrontend(root: string) {
  const directory = join(root, ".loom/acceptance-dist");
  const child = Bun.spawn(["bun", "x", "vp", "build", "--outDir", directory], {
    cwd: root,
    env: { ...process.env, VITE_LOOM_ACCEPTANCE: "1" },
    stdout: "ignore",
    stderr: "pipe",
    timeout: 60000,
  });
  await new Response(child.stderr).text();
  if ((await child.exited) !== 0) throw new Error("Acceptance frontend build failed");
  return directory;
}
