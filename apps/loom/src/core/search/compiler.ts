import {
  and,
  or,
  not,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  sql,
  is,
  SQL,
  getTableColumns,
  relationToSQL,
  getTableAsAliasSQL,
} from "drizzle-orm";
import type { AnyColumn, Relation, TableRelationalConfig } from "drizzle-orm";
import { alias, PgTable } from "drizzle-orm/pg-core";
import { ORPCError } from "@orpc/server";
import * as v from "valibot";
import type { InvocationIdentity } from "../server/auth/context";
import type { SearchRuntimeDescriptor, SearchRuntimeNode, RuntimeSearchScope } from "./metadata";
import type { SearchPublicSelection, SearchPublicFilter, SearchOrder } from "./public";
import { validSearchSelection, selectedColumns, searchRecord } from "./public";
import type { ExtensionFieldMetadata, ExtensionSearchOperation } from "../extensions/values";
import { extensionFieldSqlType } from "../extensions/fields";
import { storageValue } from "../validation/encoding";
import type { StorageValue } from "../validation/encoding";

export function extensionSearchOperator(field: ExtensionFieldMetadata, operation: ExtensionSearchOperation): SQL {
  const operator = field.operators?.[operation];
  if (!operator) throw new Error(`Missing extension search operator: ${operation}`);
  return sql`operator(${sql.identifier(operator.schema)}.${sql.raw(operator.name)})`;
}
/** Both filtering and cursor continuation use the same declared operator and native field encoder. */
export function searchComparison(
  column: AnyColumn,
  operation: ExtensionSearchOperation,
  value: StorageValue | SQL | undefined,
  field?: ExtensionFieldMetadata,
): SQL {
  if (field) {
    const operator = field.operators?.[operation];
    if (!operator) throw new Error(`Missing extension search operator: ${operation}`);
    const cast =
      operator.operand === "field"
        ? sql.raw(extensionFieldSqlType(field))
        : sql`${sql.identifier(operator.operand.schema)}.${sql.identifier(operator.operand.type)}`;
    const parameter = operator.operand === "field" ? sql.param(value, column) : sql.param(v.parse(v.string(), value));
    return sql`${column} ${extensionSearchOperator(field, operation)} ${parameter}::${cast}`;
  }
  switch (operation) {
    case "eq":
      return eq(column, value);
    case "ne":
      return ne(column, value);
    case "gt":
      return gt(column, value);
    case "gte":
      return gte(column, value);
    case "lt":
      return lt(column, value);
    case "lte":
      return lte(column, value);
    case "like":
      return sql`${column} like ${value}`;
    case "ilike":
      return sql`${column} ilike ${value}`;
  }
}

export function searchOrderTerm(
  table: TableRelationalConfig["table"],
  order: SearchOrder & { readonly extension?: ExtensionFieldMetadata },
): SQL {
  return sql`${searchColumn(table, order.field)} ${order.extension ? sql`using ${extensionSearchOperator(order.extension, order.direction === "asc" ? "lt" : "gt")}` : order.direction === "asc" ? sql`asc` : sql`desc`} nulls ${order.nulls === "first" ? sql`first` : sql`last`}`;
}

export interface CompiledSearch {
  readonly config: SearchQueryConfig;
  /** The same authorized root predicate is used for rows and optional count. */
  readonly where: (table: TableRelationalConfig["table"]) => SQL;
  readonly dependencies: ReadonlySet<string>;
}
export interface SearchQueryConfig {
  readonly columns: Record<string, boolean>;
  readonly with: Record<string, SearchQueryConfig>;
  readonly where: { readonly RAW: (table: TableRelationalConfig["table"]) => SQL };
  readonly orderBy: (table: TableRelationalConfig["table"]) => SQL[];
  readonly limit: number;
}
type FilterValue = SearchPublicFilter[string];
function table(value: TableRelationalConfig["table"]): PgTable {
  if (!is(value, PgTable)) throw new Error("Search requires a compiled PostgreSQL table");
  return value;
}
export function searchColumn(value: TableRelationalConfig["table"], name: string): AnyColumn {
  const column = getTableColumns(table(value))[name];
  if (!column) throw new Error("Search field is absent from the compiled table");
  return column;
}
function scope(
  value: "public" | RuntimeSearchScope,
  table: TableRelationalConfig["table"],
  identity: InvocationIdentity | null,
): SQL {
  if (value === "public") return sql`true`;
  const predicate = value.where({ table, identity });
  if (!is(predicate, SQL)) throw new Error("Search scope must return native SQL");
  return predicate;
}
function combine(predicates: readonly SQL[], kind: "AND" | "OR" = "AND"): SQL {
  return (kind === "AND" ? and(...predicates) : or(...predicates)) ?? (kind === "AND" ? sql`true` : sql`false`);
}
function record(value: FilterValue): SearchPublicFilter {
  return v.parse(v.custom<SearchPublicFilter>(searchRecord), value);
}
function escapedPattern(value: FilterValue, operator: string) {
  const escaped = v.parse(v.string(), value).replace(/[\\%_]/g, "\\$&");
  return `${operator === "startsWith" ? "" : "%"}${escaped}${operator === "endsWith" ? "" : "%"}`;
}
function scalar(column: AnyColumn, conditions: FilterValue, field?: ExtensionFieldMetadata): SQL[] {
  const values = record(conditions);
  const predicates: SQL[] = [];
  for (const [operator, value] of Object.entries(values)) {
    if (value === undefined || operator === "insensitive") continue;
    switch (operator) {
      case "eq":
      case "ne":
      case "gt":
      case "gte":
      case "lt":
      case "lte":
        predicates.push(searchComparison(column, operator, v.parse(storageValue, value), field));
        break;
      case "in":
        predicates.push(
          field
            ? (or(
                ...v.parse(v.array(storageValue), value).map((value) => searchComparison(column, "eq", value, field)),
              ) ?? sql`false`)
            : inArray(column, v.parse(v.array(v.unknown()), value)),
        );
        break;
      case "notIn":
        predicates.push(
          field
            ? (and(
                ...v.parse(v.array(storageValue), value).map((value) => searchComparison(column, "ne", value, field)),
              ) ?? sql`true`)
            : notInArray(column, v.parse(v.array(v.unknown()), value)),
        );
        break;
      case "isNull":
        predicates.push(value ? isNull(column) : isNotNull(column));
        break;
      case "contains":
      case "startsWith":
      case "endsWith":
        predicates.push(
          field
            ? searchComparison(
                column,
                values.insensitive === true ? "ilike" : "like",
                escapedPattern(value, operator),
                field,
              )
            : values.insensitive === true
              ? sql`${column} ilike ${escapedPattern(value, operator)} escape '\\'`
              : sql`${column} like ${escapedPattern(value, operator)} escape '\\'`,
        );
        break;
      default:
        throw new ORPCError("INVALID_SELECTION");
    }
  }
  return predicates;
}
/** Compile only a validated descriptor and selection, using native aliases and encoders. */
export function compileSearch(
  descriptor: SearchRuntimeDescriptor,
  input: SearchPublicSelection,
  identity: InvocationIdentity | null,
): CompiledSearch {
  if (!validSearchSelection(descriptor.node.public, input)) throw new ORPCError("INVALID_SELECTION");
  const dependencies = new Set<string>([descriptor.entity]);
  const tableNames = new Map(Object.entries(descriptor.graph).map(([name, config]) => [config.table, name]));
  function configNode(node: SearchRuntimeNode) {
    const value = descriptor.graph[node.entity];
    if (!value) throw new Error("Search graph is incomplete");
    return value;
  }
  function junction(node: SearchRuntimeNode, relation: Relation) {
    const name = relation.throughTable && tableNames.get(relation.throughTable);
    if (!name || !Object.hasOwn(node.through, name)) throw new Error("Search junction scope is missing");
    dependencies.add(name);
    const policy = node.through[name];
    if (!policy) throw new Error("Search junction scope is missing");
    return { table: table(descriptor.graph[name]!.table), policy };
  }
  function collect(node: SearchRuntimeNode, filter: SearchPublicFilter | undefined): void {
    for (const [name, condition] of Object.entries(filter ?? {})) {
      if (condition === undefined) continue;
      if (name === "AND" || name === "OR") {
        for (const child of v.parse(v.array(v.custom<SearchPublicFilter>(searchRecord)), condition))
          collect(node, child);
      } else if (name === "NOT") collect(node, record(condition));
      else if (name === "relations") {
        for (const [name, conditions] of Object.entries(record(condition))) {
          const relation = configNode(node).relations[name];
          const child = node.relations[name];
          if (!relation || !child) throw new ORPCError("INVALID_SELECTION");
          dependencies.add(child.entity);
          if (relation.throughTable) junction(node, relation);
          for (const filter of Object.values(record(conditions))) collect(child, record(filter));
        }
      }
    }
  }
  function predicate(
    node: SearchRuntimeNode,
    source: TableRelationalConfig["table"],
    filter: SearchPublicFilter | undefined,
  ): SQL {
    let sequence = 0;
    function visit(
      node: SearchRuntimeNode,
      source: TableRelationalConfig["table"],
      filter: SearchPublicFilter | undefined,
    ): SQL {
      dependencies.add(node.entity);
      const predicates = [scope(node.scope, source, identity)];
      for (const [name, condition] of Object.entries(filter === undefined ? {} : record(filter))) {
        if (condition === undefined) continue;
        if (name === "AND" || name === "OR") {
          predicates.push(
            combine(
              v
                .parse(v.array(v.custom<SearchPublicFilter>(searchRecord)), condition)
                .map((value) => visit(node, source, value)),
              name,
            ),
          );
        } else if (name === "NOT") {
          // Authorization stays outside NOT, which negates only client membership.
          predicates.push(not(client(node, source, record(condition))));
        } else if (name === "relations") {
          for (const [relationName, conditions] of Object.entries(record(condition))) {
            const relation = configNode(node).relations[relationName];
            const child = node.relations[relationName];
            if (!relation || !child) throw new ORPCError("INVALID_SELECTION");
            for (const [mode, childFilter] of Object.entries(record(conditions))) {
              const target = alias(table(relation.targetTable), `s${++sequence}`);
              const through = relation.throughTable ? junction(node, relation) : undefined;
              const throughTable = through ? alias(through.table, `j${++sequence}`) : undefined;
              const joins = relationToSQL(relation, source, target, throughTable);
              const match = combine([
                ...(joins.filter ? [joins.filter] : []),
                visit(child, target, record(childFilter)),
                ...(through && throughTable ? [scope(through.policy, throughTable, identity)] : []),
              ]);
              const join = throughTable
                ? sql`inner join ${getTableAsAliasSQL(throughTable)} on ${joins.joinCondition}`
                : sql``;
              const exists = sql`exists (select 1 from ${getTableAsAliasSQL(target)} ${join} where ${match})`;
              predicates.push(mode === "none" || mode === "isNot" ? not(exists) : exists);
            }
          }
        } else {
          const metadata = node.public.fields?.[name] ?? node.public.columns[name];
          predicates.push(
            ...scalar(
              searchColumn(source, name),
              condition,
              metadata && metadata !== "_id" && metadata !== "_createdAt" ? metadata.extension : undefined,
            ),
          );
        }
      }
      return combine(predicates);
    }
    function client(node: SearchRuntimeNode, source: TableRelationalConfig["table"], filter: SearchPublicFilter): SQL {
      // Scope is applied to related rows, but root authorization cannot be negated.
      return visit({ ...node, scope: "public" }, source, filter);
    }
    return visit(node, source, filter);
  }
  function projection(
    node: SearchRuntimeNode,
    selection: SearchPublicSelection,
    depth: number,
    incoming?: { node: SearchRuntimeNode; relation: Relation },
  ): SearchQueryConfig {
    dependencies.add(node.entity);
    collect(node, selection.where);
    const children: Record<string, SearchQueryConfig> = {};
    for (const [name, childSelection] of Object.entries(selection.with ?? {})) {
      const child = node.relations[name];
      const relation = configNode(node).relations[name];
      if (!child || !relation) throw new ORPCError("INVALID_SELECTION");
      children[name] = projection(child, childSelection, depth + 1, { node, relation });
    }
    if (incoming?.relation.throughTable) junction(incoming.node, incoming.relation);
    return {
      columns: Object.fromEntries(selectedColumns(node.public, selection).map((name) => [name, true])),
      with: children,
      where: {
        RAW: (source) => {
          const predicates = [predicate(node, source, selection.where)];
          if (incoming?.relation.throughTable) {
            const through = junction(incoming.node, incoming.relation);
            // Pinned Drizzle RQB v2 uses tr{parentDepth} for its exact joined junction.
            predicates.push(scope(through.policy, alias(through.table, `tr${depth - 1}`), identity));
          }
          return combine(predicates);
        },
      },
      orderBy: (source) =>
        (
          selection.orderBy ?? [
            { field: "_createdAt", direction: "asc" },
            { field: "_id", direction: "asc" },
          ]
        ).map((order) => {
          const metadata = node.public.fields?.[order.field] ?? node.public.columns[order.field];
          const extension =
            metadata && metadata !== "_id" && metadata !== "_createdAt" ? metadata.extension : undefined;
          return searchOrderTerm(source, { ...order, ...(extension && { extension }) });
        }),
      limit:
        selection.limit ??
        Math.min(depth ? 20 : 50, depth ? descriptor.budgets.nestedSize : descriptor.budgets.pageSize),
    };
  }
  const where = (source: TableRelationalConfig["table"]) => predicate(descriptor.node, source, input.where);
  const config = projection(descriptor.node, input, 0);
  return { config, where, dependencies };
}
