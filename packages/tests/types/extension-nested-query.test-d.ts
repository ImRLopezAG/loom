import { createProjectProcedures, nestedQuery, type NestedQuery } from "kello/server";
import { extensionRows } from "../../../apps/loom/src/core/extensions/rows";
import { textCodec, integerCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { sql, type SQL } from "drizzle-orm";
import { searchSchema, searchRelations } from "../fixtures/search-schema";
const source = createProjectProcedures(searchSchema, searchRelations).validators.tables.tasks.search({
  columns: ["title", "count"],
  filter: ["title"],
  scope: "public",
});
const relatedSource = createProjectProcedures(searchSchema, searchRelations).validators.tables.tasks.search({
  columns: ["title"],
  scope: "public",
  through: { taskLabels: "public" },
  relations: { labels: { columns: ["name"], filter: ["name"], scope: "public" } },
});
const related: NestedQuery<{ title: string }> = nestedQuery(relatedSource, {
  columns: { title: true },
  where: { NOT: { relations: { labels: { some: { name: { eq: "x" } } } } } },
});
const projected: NestedQuery<{ title: string }> = nestedQuery(source, {
  columns: { title: true },
  where: { title: { eq: "x" } },
});
// @ts-expect-error Projection excludes count.
const wrong: NestedQuery<{ title: string; count: bigint }> = nestedQuery(source, { columns: { title: true } });
// @ts-expect-error Columns outside the policy are unavailable.
nestedQuery(source, { columns: { done: true } });
// @ts-expect-error Wrong scalar filter type.
nestedQuery(source, { columns: { title: true }, where: { title: { eq: 1 } } });
// @ts-expect-error Pagination cannot silently drop inner rows.
nestedQuery(source, { columns: { title: true }, limit: 2 });
// @ts-expect-error Explicit flat projections use only inclusion fields.
nestedQuery(source, { columns: { title: false } });
// @ts-expect-error A result generic cannot assert a query contract.
nestedQuery<{ secret: string }>(source, { columns: { title: true } });
// @ts-expect-error Opaque query cannot be constructed from query text.
const forged: NestedQuery<{ title: string }> = { text: "select secret" };
const rows = extensionRows(sql`function()`, "record", { title: textCodec, count: integerCodec });
const title: SQL<string> = rows.columns.title;
const count: SQL<bigint> = rows.columns.count;
// @ts-expect-error Named record columns retain codec output.
const number: SQL<number> = rows.columns.count;
void [projected, related, wrong, forged, title, count, number];
