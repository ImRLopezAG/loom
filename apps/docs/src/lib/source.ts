import { relative } from "node:path";
import { getCollection, type CollectionEntry } from "astro:content";
import { loader, type StaticSource } from "fumadocs-core/source";

const content: StaticSource<{
  pageData: CollectionEntry<"docs">["data"] & { entry: CollectionEntry<"docs"> };
  metaData: CollectionEntry<"meta">["data"];
}> = { files: [] };

for (const entry of await getCollection("docs")) {
  if (!entry.filePath) throw new Error(`Documentation page ${entry.id} has no source file`);
  content.files.push({ type: "page", path: relative("content/docs", entry.filePath), data: { ...entry.data, entry } });
}
for (const entry of await getCollection("meta")) {
  if (!entry.filePath) throw new Error(`Documentation metadata ${entry.id} has no source file`);
  content.files.push({ type: "meta", path: relative("content/docs", entry.filePath), data: entry.data });
}

export const source = loader({ source: content, baseUrl: "/" });
