export const taskSelection = {
  columns: { title: true, done: true },
  with: { labels: { columns: { name: true }, orderBy: [{ field: "name", direction: "asc" }], limit: 5 } },
  where: { done: { eq: false } },
  orderBy: [{ field: "title", direction: "asc" }],
  limit: 20,
} as const;
