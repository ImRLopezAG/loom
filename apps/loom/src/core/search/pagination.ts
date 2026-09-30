import { and, sql, getTableColumns, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import type { StorageRow } from "../validation/encoding";
import { ORPCError } from "@orpc/server";
import type { SearchRuntimeDescriptor } from "./metadata";
import type { SearchPublicSelection, SearchCachedPage } from "./public";
import { acceptsSearchPage, acceptsSearchOutput } from "./public";
import { compileSearch, searchColumn } from "./compiler";
import { searchOrdering, searchOrderSQL, searchKeyset } from "./ordering";
import { createSearchCursor } from "./cursor";
import type { SearchCursorContext } from "./cursor";

/** Plan through the native relational query; ordering fields stay private until page assembly. */
export async function prepareSearchPage(
  descriptor: SearchRuntimeDescriptor,
  input: SearchPublicSelection,
  context: SearchCursorContext,
  key: string | undefined,
) {
  const compiled = compileSearch(descriptor, input, context.identity);
  const order = searchOrdering(descriptor, input);
  const codec = createSearchCursor(key, descriptor, input, context);
  const direction = input.direction ?? "forward";
  const token = input.cursor ?? input.anchor;
  const boundary = token ? await codec.read(token, direction) : undefined;
  const pageSize = compiled.config.limit;
  const limit = pageSize * (descriptor.mode === "live" ? (input.loadedPages ?? 1) : 1);
  if (limit > descriptor.budgets.rows)
    throw new ORPCError("QUERY_BUDGET_EXCEEDED", { message: "Search window exceeds row budget" });
  const root = descriptor.graph[descriptor.entity];
  if (!root || !is(root.table, PgTable)) throw new Error("Missing search table");
  const columns = getTableColumns(root.table);
  const timestamps = order.flatMap(({ field }, index) => {
    const metadata = descriptor.node.public.fields?.[field] ?? descriptor.node.public.columns[field];
    if (!metadata || metadata === "_id" || metadata === "_createdAt" || metadata.kind !== "timestamp") return [];
    let alias = `_loom_search_timestamp_${index}`;
    while (Object.hasOwn(columns, alias)) alias = `_${alias}`;
    return [{ field, alias }];
  });
  return {
    descriptor,
    input,
    context,
    codec,
    direction,
    order,
    limit,
    pageSize,
    timestamps,
    fromCursor: Boolean(token),
    dependencies: compiled.dependencies,
    where: compiled.where,
    config: {
      ...compiled.config,
      columns: { ...compiled.config.columns, ...Object.fromEntries(order.map(({ field }) => [field, true])) },
      limit: limit + 1,
      orderBy: (table: Parameters<typeof searchOrderSQL>[0]) => searchOrderSQL(table, order, direction),
      extras: Object.fromEntries(
        timestamps.map(({ field, alias }) => [
          alias,
          (table: Parameters<typeof searchOrderSQL>[0]) =>
            sql<string>`to_char(${searchColumn(table, field)} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || case when extract(year from ${searchColumn(table, field)} at time zone 'UTC') < 0 then ' BC' else '' end`.as(
              alias,
            ),
        ]),
      ),
      where: {
        RAW: (table: Parameters<typeof searchOrderSQL>[0]) =>
          and(
            compiled.config.where.RAW(table),
            ...(boundary ? [searchKeyset(table, order, boundary, direction)] : []),
          ) ?? sql`false`,
      },
    },
    selected: compiled.config.columns,
  };
}
export type SearchPagePlan = Awaited<ReturnType<typeof prepareSearchPage>>;

/** Trim the extra root, issue boundaries from retained rows, then remove private sort keys. */
export async function finishSearchPage(plan: SearchPagePlan, rows: readonly StorageRow[]): Promise<SearchCachedPage> {
  if (rows.length > plan.limit + 1) throw new Error("Search returned too many roots");
  const retained = rows.slice(0, plan.limit);
  if (plan.direction === "backward") retained.reverse();
  const first = retained[0];
  const last = retained.at(-1);
  const hasMore = rows.length > plan.limit;
  const keys = (row: StorageRow) =>
    plan.order.map(({ field }) => {
      const timestamp = plan.timestamps.find((entry) => entry.field === field);
      const value = row[timestamp?.alias ?? field];
      if (value === undefined) throw new Error("Search omitted an ordering field");
      return timestamp && value !== null ? { timestamp: value } : value;
    });
  const nextCursor =
    last && (plan.direction === "forward" ? hasMore : plan.fromCursor)
      ? await plan.codec.issue(keys(last), "forward")
      : null;
  const previousCursor =
    first && (plan.direction === "backward" ? hasMore : plan.fromCursor)
      ? await plan.codec.issue(keys(first), "backward")
      : null;
  const hidden = new Set(plan.order.filter(({ field }) => !plan.selected[field]).map(({ field }) => field));
  for (const { alias } of plan.timestamps) hidden.add(alias);
  const selected = retained.map((row) => Object.fromEntries(Object.entries(row).filter(([name]) => !hidden.has(name))));
  const page = {
    ...(plan.descriptor.mode === "live"
      ? {
          pages: Array.from({ length: Math.ceil(selected.length / plan.pageSize) }, (_, index) =>
            selected.slice(index * plan.pageSize, (index + 1) * plan.pageSize),
          ),
        }
      : { rows: selected }),
    nextCursor,
    previousCursor,
  };
  acceptsSearchOutput(plan.descriptor.node.public, page, () => {
    throw new ORPCError("QUERY_BUDGET_EXCEEDED", { message: "Search result exceeds publication budget" });
  });
  if (!acceptsSearchPage(plan.descriptor.node.public, { ...plan.input, count: false }, page, true))
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Invalid selected search result" });
  return page;
}
