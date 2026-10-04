import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const child = spawnSync(
  "bun",
  ["test", "packages/e2e/integration/extensions-pg_repack.test.ts"],
  { cwd: root, stdio: "inherit", env: process.env },
);
process.exit(child.status ?? 1);
