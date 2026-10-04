import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const suppliedUrl = process.env.LOOM_TEST_DATABASE_URL;
assert(suppliedUrl, "Supply LOOM_TEST_DATABASE_URL from the parent-managed shared PostgreSQL fixture");
const url = new URL(suppliedUrl);
assert(["postgres:", "postgresql:"].includes(url.protocol), "Expected a PostgreSQL fixture URL");

{
  const child = spawnSync(
    "bun",
    ["test", "--timeout", "180000", "packages/e2e/integration/extensions-dblink.test.ts"],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, CI: "1", LOOM_TEST_DATABASE_URL: url.href },
      maxBuffer: 64 * 1024 * 1024,
      timeout: 240000,
      killSignal: "SIGKILL",
    },
  );
  const redact = (text: string) => {
    let output = text;
    for (const value of [url.href, url.password, url.username]) {
      if (value) output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
    }
    return output.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]");
  };
  if (child.stdout) process.stdout.write(redact(child.stdout));
  if (child.stderr) process.stderr.write(redact(child.stderr));
  assert.equal(child.error, undefined, `dblink native oracle did not complete: ${child.error?.message ?? ""}`);
  assert.equal(child.signal, null, `dblink native oracle was terminated by ${child.signal}`);
  assert.equal(child.status, 0, "dblink native oracle failed");
}
