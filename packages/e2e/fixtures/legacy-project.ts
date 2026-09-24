import { initializeProject } from "@loom/tooling";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Existing release/dev regression fixtures stay on the old protocol until their
 * native lifecycle replacements land. The public initializer emits procedures. */
export async function initializeLegacyProject(root: string, name: string) {
  const files = await initializeProject(root, name);
  await writeFile(
    join(root, "loom/functions/tasks.ts"),
    `import { query } from "../_generated/server";
import * as v from "valibot";
import schema from "../schema";
export const list = query({
  args: v.object({}),
  handler: async (ctx) => (await ctx.db.select({ title: schema.tables.tasks.title }).from(schema.tables.tasks)).map((row) => row.title),
});
`,
  );
  return files;
}
