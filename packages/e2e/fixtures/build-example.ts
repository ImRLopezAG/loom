import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Keep acceptance builds outside the example's production output. */
export async function buildAcceptanceFrontend(root: string, connection: { authUrl: string; serviceUrl: string }) {
  const directory = join(root, ".loom/acceptance-dist");
  await mkdir(join(root, ".loom"), { recursive: true });
  const fixture = join(root, ".loom/acceptance-sign-in.tsx");
  await copyFile(new URL("./acceptance-sign-in.tsx", import.meta.url), fixture);
  const config = join(root, ".loom/acceptance-vite.config.ts");
  await writeFile(
    config,
    `import { defineConfig } from "vite-plus";
export default defineConfig({ resolve: { alias: { "./sign-in": ${JSON.stringify(fixture)} } }, build: { target: "es2022" } });
`,
  );
  const child = Bun.spawn(["bun", "x", "vp", "build", "--outDir", directory, "--config", config], {
    cwd: root,
    env: {
      ...process.env,
      VITE_LOOM_ACCEPTANCE: "1",
      VITE_NEON_AUTH_URL: connection.authUrl,
      VITE_LOOM_URL: connection.serviceUrl,
    },
    stdout: "ignore",
    stderr: "pipe",
    timeout: 60000,
  });
  await new Response(child.stderr).text();
  if ((await child.exited) !== 0) throw new Error("Acceptance frontend build failed");
  return directory;
}
