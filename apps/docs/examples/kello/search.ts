import { and, eq } from "drizzle-orm";
import type { SearchPolicy } from "kello/server";
import relations from "./relations";

export const taskSearchPolicy = {
  scope: {
    name: "owner",
    version: "1",
    where: ({ table, identity }) =>
      and(eq(table.ownerId, identity?.subject ?? ""), eq(table.ownerIssuer, identity?.issuer ?? ""))!,
  },
  columns: ["_id", "title", "done"],
  filter: ["title", "done"],
  text: ["title"],
  order: ["title", "_createdAt"],
  // This example intentionally uses a shared public label catalog.
  through: { taskLabels: "public" },
  relations: { labels: { scope: "public", columns: ["name"], filter: ["name"], order: ["name"] } },
} as const satisfies SearchPolicy<typeof relations, typeof relations.tasks>;
