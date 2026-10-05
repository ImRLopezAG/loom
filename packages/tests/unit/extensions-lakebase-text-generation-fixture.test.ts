import { expect, test } from "vite-plus/test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeLakebaseTextProject } from "../../e2e/fixtures/lakebase-text-generated-project";

/** Authored project files only. This is not initializeProject/loadProject/generateProject. */
async function scratch(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `loom-lakebase-text-fixture-${name}-`));
  await mkdir(join(root, "kello/functions"), { recursive: true });
  await mkdir(join(root, "kello/contracts"), { recursive: true });
  await writeFile(join(root, "kello/functions/tasks.ts"), "export {}\n");
  await writeFile(join(root, "kello/contracts/tasks.ts"), "export {}\n");
  return root;
}

async function source(root: string, path: string): Promise<string> {
  return readFile(join(root, path), "utf8");
}

test("lakebase_text authored fixtures cover empty, future, selected and mounted custom schemas", async () => {
  const empty = await scratch("empty");
  const future = await scratch("future");
  const selected = await scratch("selected");
  const custom = await scratch("custom");
  try {
    await writeLakebaseTextProject(empty, "empty");
    await writeLakebaseTextProject(future, "future");
    await writeLakebaseTextProject(selected, "selected");
    await writeLakebaseTextProject(custom, "selected", 'bm25"text');

    const emptyConfig = await source(empty, "kello.config.ts");
    expect(emptyConfig).not.toContain("lakebase_text");
    expect(emptyConfig).toContain("defineConfig({})");
    expect(await source(empty, "kello/functions/tasks.ts")).toContain("undefined");
    await expect(source(empty, "kello/components/bm25/setup.ts")).rejects.toMatchObject({ code: "ENOENT" });

    const futureConfig = await source(future, "kello.config.ts");
    expect(futureConfig).toContain('version: "future"');
    expect(futureConfig).not.toContain("0.1.3");
    const futureSchema = await source(future, "kello/schema.ts");
    expect(futureSchema).toContain("unverified");
    expect(futureSchema).toContain('"toBm25Query" in extensions.lakebase_text');
    expect(await source(future, "kello/functions/tasks.ts")).toContain('const exact: "future"');
    await expect(source(future, "kello/components/bm25/setup.ts")).rejects.toMatchObject({ code: "ENOENT" });

    const selectedConfig = await source(selected, "kello.config.ts");
    expect(selectedConfig).toContain("lakebase_text");
    expect(selectedConfig).toContain("0.1.3");
    expect(selectedConfig).not.toContain("schema:");
    expect(await source(selected, "kello/app.config.ts")).toContain("components/bm25/setup");
    expect(await source(selected, "kello/components/bm25/setup.ts")).toContain('versions: ["0.1.3"]');
    expect(await source(selected, "kello/functions/tasks.ts")).toContain("context.components.bm25.rpc.status.run");
    expect(await source(selected, "kello/functions/tasks.ts")).toContain("api.rank");
    expect(await source(selected, "kello/functions/tasks.ts")).toContain(
      "@ts-expect-error No invented BM25 client scoring helper exists.",
    );

    const customConfig = await source(custom, "kello.config.ts");
    expect(customConfig).toContain('schema: "bm25\\"text"');
    expect(await source(custom, "kello/schema.ts")).toContain('api.schema !== "bm25\\"text"');
    expect(await source(custom, "kello/components/bm25/schema.ts")).toContain('schema !== "bm25\\"text"');
  } finally {
    await Promise.all([empty, future, selected, custom].map((root) => rm(root, { recursive: true, force: true })));
  }
});
