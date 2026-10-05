import {
  Column,
  SQL,
  StringChunk,
  Param,
  Name,
  Subquery,
  is,
  sql,
  getColumnTable,
  getTableUniqueName,
  type SQLChunk,
  type TableRelationalConfig,
} from "drizzle-orm";
import { PgDialect, PgColumn, PgTable, makePgArray } from "drizzle-orm/pg-core";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import type { SearchDescriptor, SearchProjector, SearchProjection, ExactSearchInput } from "../search/types";
import type { SearchRuntimeDescriptor, SearchRuntimeNode, RuntimeSearchScope } from "../search/metadata";
import type { SearchPublicSelection } from "../search/public";
import { selectedColumns, searchRecord } from "../search/public";
import { compileSearch, searchColumn } from "../search/compiler";
import { textCodec } from "./codecs";
import { checkedExtensionExpression } from "./sql";
import { captureNestedQueryInvocation, registeredNestedQuerySource } from "./nested-query-private";

declare const nestedRow: unique symbol;
/** Opaque authorized row contract. Query text and dependency claims cannot be supplied by callers. */
export interface NestedQuery<Row extends object> {
  readonly [nestedRow]: Row;
}
type FlatSelection<Projection extends SearchProjector> = {
  readonly columns: {
    readonly [
      Key in keyof NonNullable<Projection["selection"][Extract<"columns", keyof Projection["selection"]>]>
    ]?: true;
  };
  readonly where?: Projection["selection"][Extract<"where", keyof Projection["selection"]>];
  readonly orderBy?: Projection["selection"][Extract<"orderBy", keyof Projection["selection"]>];
};
type ProjectionRow<Projection extends SearchProjector, Selection> =
  SearchProjection<Projection, Selection> extends { rows: (infer Row extends object)[] } ? Row : never;
interface QueryEvidence {
  readonly ast: SQL;
  readonly text: string;
  readonly dependencies: readonly string[];
  readonly check: () => void;
}
const evidence = new WeakMap<object, QueryEvidence>();
const dialect = new PgDialect({ codecs: nodePgCodecs });
const primitive = v.union([v.string(), v.number(), v.bigint(), v.boolean()]);

/** Classify policy nodes, never infer authorization from arbitrary SQL text. */
function checkPolicy(predicate: SQL, table: TableRelationalConfig["table"]): void {
  if (!is(table, PgTable)) throw new Error("Nested query policy requires a native table");
  const nativeTable = table;
  function visit(chunk: SQLChunk): void {
    if (is(chunk, Column)) {
      // Native alias columns create fresh table proxies, so identity is the
      // qualified table/alias name used in the compiler's current FROM scope.
      if (getTableUniqueName(getColumnTable(chunk)) !== getTableUniqueName(nativeTable))
        throw new Error("Nested query policy reads an undeclared table");
    } else if (is(chunk, SQL)) for (const child of chunk.queryChunks) visit(child);
    else if (is(chunk, StringChunk)) {
      const text = chunk.value.join("").toLowerCase();
      // Native comparison/Boolean operators have fixed grammar. Functions,
      // subqueries, comments, quoted SQL literals and arbitrary wrappers fail closed.
      if (
        text.includes("--") ||
        text.includes("/*") ||
        !/^(?:\s|[()=<>!+*/%,.-]|\b(?:and|or|not|is|null|true|false|in|like|ilike|between)\b)*$/.test(text)
      )
        throw new Error("Nested query policy contains unproven raw SQL or functions");
    } else if (is(chunk, Param)) {
      if (is(chunk.value, SQL)) throw new Error("Nested query policy parameter cannot hide SQL");
    } else if (Array.isArray(chunk)) for (const child of chunk) visit(child);
    else if (chunk !== undefined && chunk !== null && !v.is(primitive, chunk))
      throw new Error("Nested query policy contains an unproven SQL node");
  }
  visit(predicate);
}
function reviewedNode(node: SearchRuntimeNode): SearchRuntimeNode {
  const review = (policy: "public" | RuntimeSearchScope): "public" | RuntimeSearchScope =>
    policy === "public"
      ? policy
      : {
          ...policy,
          where: (context) => {
            const predicate = policy.where(context);
            checkPolicy(predicate, context.table);
            return predicate;
          },
        };
  return {
    ...node,
    scope: review(node.scope),
    through: Object.fromEntries(Object.entries(node.through).map(([name, policy]) => [name, review(policy)])),
    relations: Object.fromEntries(Object.entries(node.relations).map(([name, child]) => [name, reviewedNode(child)])),
  };
}
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native relation filters include driver values; only data and native operators may enter this managed boundary.
function checkNativeRelationWhere(value: unknown): void {
  if (value === null || value === undefined || value instanceof Date || v.is(primitive, value)) return;
  if (Array.isArray(value)) {
    for (const child of value) checkNativeRelationWhere(child);
    return;
  }
  if (!searchRecord(value)) throw new Error("Nested query relation filter contains an unproven SQL node");
  for (const [name, child] of Object.entries(value)) {
    if (name === "RAW" && child !== undefined)
      throw new Error("Nested query relation filter contains unproven raw SQL");
    checkNativeRelationWhere(child);
  }
}
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Already validated search filters are traversed without allowing SQL wrapper claims from relation declarations.
function reviewRelationFilters(descriptor: SearchRuntimeDescriptor, node: SearchRuntimeNode, filter: unknown): void {
  if (filter === undefined) return;
  if (!searchRecord(filter)) throw new Error("Invalid nested relation filter");
  for (const [key, value] of Object.entries(filter)) {
    if ((key === "AND" || key === "OR") && Array.isArray(value))
      for (const child of value) reviewRelationFilters(descriptor, node, child);
    else if (key === "NOT") reviewRelationFilters(descriptor, node, value);
    else if (key === "relations" && searchRecord(value)) {
      for (const [name, conditions] of Object.entries(value)) {
        const relation = descriptor.graph[node.entity]?.relations[name];
        const child = node.relations[name];
        if (!relation || !child || !searchRecord(conditions)) throw new Error("Invalid nested relation filter");
        checkNativeRelationWhere(relation.where);
        for (const condition of Object.values(conditions)) reviewRelationFilters(descriptor, child, condition);
      }
    }
  }
}
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native column encoders produce driver values; this boundary checks their literal representation.
function sqlLiteral(value: unknown): SQL {
  if (value === null) return sql`null`;
  if (value instanceof Date) value = value.toISOString();
  if (Array.isArray(value)) value = makePgArray(value);
  if (value instanceof Uint8Array) value = `\\x${Buffer.from(value).toString("hex")}`;
  if (v.is(v.record(v.string(), v.unknown()), value)) value = JSON.stringify(value);
  if (!v.is(primitive, value)) throw new Error("Unsupported nested query driver parameter");
  const text = String(value);
  if (text.includes("\0")) throw new Error("PostgreSQL text cannot contain NUL");
  // E literals fix backslash semantics independently of standard_conforming_strings.
  return sql.raw(`E'${text.replaceAll("\\", "\\\\").replaceAll("'", "''")}'`);
}
function columnCast(column: PgColumn): SQL {
  const type = column.getSQLType();
  if (type.startsWith('"')) {
    const match = /^("(?:[^"]|"")+"(?:\."(?:[^"]|"")+")?)(?:\([\s\S]*\))?((?:\[\])*)$/.exec(type);
    if (!match) throw new Error(`Unsupported nested query SQL type: ${type}`);
    return sql.raw(`${match[1]}${match[2] || "[]".repeat(column.dimensions ?? 0)}`);
  }
  const aliases = {
    bigint: "int8",
    integer: "int4",
    smallint: "int2",
    boolean: "bool",
    "double precision": "float8",
    real: "float4",
    "character varying": "varchar",
    "timestamp with time zone": "timestamptz",
    "timestamp without time zone": "timestamp",
  };
  const nominal = type
    .replace(/\([\d, ]+\)/, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = /^([a-z ]+)((?:\[\])*)$/.exec(nominal);
  if (!match) throw new Error(`Unsupported nested query SQL type: ${type}`);
  const name = Object.entries(aliases).find(([name]) => name === match[1])?.[1] ?? match[1]!;
  // Column typmods round/truncate values before comparison. Only nominal type and array shape belong on policy parameters.
  return sql`${sql.identifier("pg_catalog")}.${sql.identifier(name)}${sql.raw(match[2] || "[]".repeat(column.dimensions ?? 0))}`;
}
/** Rewrite native parameter nodes before serialization, including their column encoder and qualified cast. */
function materialize(ast: SQL): string {
  function visit(chunk: SQLChunk): SQLChunk {
    if (is(chunk, SQL)) return new SQL(chunk.queryChunks.map(visit));
    if (is(chunk, SQL.Aliased)) return new SQL.Aliased(new SQL(chunk.sql.queryChunks.map(visit)), chunk.fieldAlias);
    if (is(chunk, Subquery)) throw new Error("Nested query requires managed compiler subqueries");
    if (is(chunk, Param)) {
      if (is(chunk.value, SQL)) throw new Error("Nested query parameter cannot hide SQL");
      let value = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
      if (is(value, SQL)) throw new Error("Nested query encoder cannot introduce SQL");
      if (is(chunk.encoder, Column) && value !== null)
        value = dialect.codecs.apply(chunk.encoder, "normalizeParam", value);
      const literal = sqlLiteral(value);
      return is(chunk.encoder, PgColumn) ? sql`${literal}::${columnCast(chunk.encoder)}` : literal;
    }
    if (Array.isArray(chunk)) return chunk.map(visit);
    if (chunk === null || v.is(primitive, chunk)) return sqlLiteral(chunk);
    if (chunk === undefined || is(chunk, StringChunk) || is(chunk, Column) || is(chunk, Name) || is(chunk, PgTable))
      return chunk;
    throw new Error("Nested query contains an unproven SQL wrapper");
  }
  const result = dialect.sqlToQuery(new SQL(ast.queryChunks.map(visit)));
  if (result.params.length) throw new Error("Nested query has unresolved parameters");
  return result.sql;
}
export function nestedQuery<Projection extends SearchProjector, const Selection extends FlatSelection<Projection>>(
  source: SearchDescriptor<Projection>,
  selection: Selection & ExactSearchInput<Selection, FlatSelection<Projection>>,
): NestedQuery<ProjectionRow<Projection, Selection>> {
  const descriptor = registeredNestedQuerySource(source);
  const owner = captureNestedQueryInvocation(descriptor.graph);
  if (descriptor.mode !== "finite") throw new Error("Nested query requires a finite search descriptor");
  if (Object.keys(selection).some((key) => !["where", "columns", "orderBy"].includes(key)))
    throw new Error("Nested query supports only flat columns, where and orderBy");
  if (
    !selection.columns ||
    !Object.values(selection.columns).some((value) => value === true) ||
    Object.values(selection.columns).some((value) => value !== true)
  )
    throw new Error("Nested query requires an explicit inclusion projection");
  const root = descriptor.graph[descriptor.entity]!.table;
  const reviewed: SearchRuntimeDescriptor = { ...descriptor, node: reviewedNode(descriptor.node) };
  // SAFETY: the exact selection generic is the descriptor's inclusion-only native search input; compileSearch validates its runtime form.
  const publicSelection = selection as SearchPublicSelection;
  const compiled = compileSearch(reviewed, publicSelection, owner.identity);
  reviewRelationFilters(descriptor, descriptor.node, publicSelection.where);
  const predicate = compiled.where(root);
  const columns = selectedColumns(descriptor.node.public, publicSelection);
  const projection = columns.map((name) => sql`${searchColumn(root, name)} as ${sql.identifier(name)}`);
  const order = publicSelection.orderBy ? compiled.config.orderBy(root) : [];
  const ast = sql`select ${sql.join(projection, sql`, `)} from ${root} where ${predicate}${order.length ? sql` order by ${sql.join(order, sql`, `)}` : sql.empty()}`;
  const result = Object.freeze({});
  evidence.set(result, {
    ast,
    text: materialize(ast),
    dependencies: Object.freeze([...compiled.dependencies]),
    check: owner.check,
  });
  // SAFETY: source projector alone supplies this opaque result type; no caller result assertion exists.
  return result as NestedQuery<ProjectionRow<Projection, Selection>>;
}
/** Private adapter consumption seam. The AST stays in the evidence sidecar alongside SPI text. */
export function nestedQueryText(query: NestedQuery<object>): SQL<string> {
  const proof = evidence.get(query);
  if (!proof) throw new Error("Nested query has no managed provenance");
  proof.check();
  return checkedExtensionExpression(sql`${sql.param(proof.text)}`, textCodec, proof.dependencies, proof.check);
}
