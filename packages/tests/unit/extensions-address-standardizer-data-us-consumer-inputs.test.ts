import { test, expect } from "vite-plus/test";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeDataUsProject } from "../../e2e/fixtures/address-standardizer-data-us-generated-project";
import * as v from "valibot";
import { extensionSchemaValidator } from "../../../apps/loom/src/tooling/config/extensions";

// Writer regression only; this does not claim public initialize/load/generate acceptance.
test("selected data-US consumer config and schema declare the same namespace", async () => {
  for (const selection of ["selected", "custom"] as const) {
    const root = await mkdtemp(join(tmpdir(), "loom-data-us-inputs-"));
    try {
      await mkdir(join(root, "kello/contracts"), { recursive: true });
      await mkdir(join(root, "kello/functions"));
      await writeDataUsProject(root, selection);
      const config = await readFile(join(root, "kello.config.ts"), "utf8");
      const schema = await readFile(join(root, "kello/schema.ts"), "utf8");
      const namespace = /namespace: ("[^"]+")/.exec(schema)?.[1];
      expect(namespace).toBeDefined();
      expect(config).toContain(`"namespace":${namespace}`);
      if (selection === "custom") {
        const placement = /api.schema !== ("(?:\\.|[^"\\])*")/.exec(schema)?.[1];
        expect(placement).toBeDefined();
        expect(() => v.parse(extensionSchemaValidator, JSON.parse(placement!))).not.toThrow();
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});
