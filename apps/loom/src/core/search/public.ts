import * as v from "valibot";
import { storageParser, systemParsers } from "../validation/encoding";
import type { StorageRow } from "../validation/encoding";
import type { FieldMetadata } from "../schema/fields";

/** Masked, serializable projection metadata shared by generated clients. */
export interface SearchPublicNode {
  readonly columns: Readonly<Record<string, FieldMetadata | "_id" | "_createdAt">>;
  readonly relations: Readonly<
    Record<string, { readonly many: boolean; readonly optional: boolean; readonly node: SearchPublicNode }>
  >;
}
export interface SearchPublicSelection {
  readonly columns?: Readonly<Record<string, boolean>>;
  readonly with?: Readonly<Record<string, SearchPublicSelection>>;
  readonly limit?: number;
  readonly cursor?: string | null;
  readonly direction?: "forward" | "backward";
}
export interface SearchCachedPage {
  readonly rows: StorageRow[];
  readonly nextCursor: string | null;
  readonly previousCursor: string | null;
}
const record = v.record(v.string(), v.unknown());
const choice = v.record(v.string(), v.boolean());
const controls = new Set(["columns", "with", "limit", "cursor", "direction"]);

export function validSearchSelection(node: SearchPublicNode, input: unknown): input is SearchPublicSelection {
  if (!v.is(record, input) || Object.keys(input).some((key) => !controls.has(key))) return false;
  if (input.limit !== undefined && !v.is(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), input.limit))
    return false;
  if (input.cursor !== undefined && input.cursor !== null && !v.is(v.pipe(v.string(), v.maxLength(4096)), input.cursor))
    return false;
  if (input.direction !== undefined && input.direction !== "forward" && input.direction !== "backward") return false;
  if (input.columns !== undefined) {
    if (
      !v.is(choice, input.columns) ||
      !Object.keys(input.columns).length ||
      Object.keys(input.columns).some((key) => !Object.hasOwn(node.columns, key))
    )
      return false;
    const values = Object.values(input.columns);
    if (values.includes(true) && values.includes(false)) return false;
    if (!selectedColumns(node, input).length) return false;
  }
  if (input.with !== undefined) {
    if (!v.is(record, input.with)) return false;
    for (const [name, selection] of Object.entries(input.with)) {
      const relation = Object.hasOwn(node.relations, name) ? node.relations[name] : undefined;
      if (!relation || !validSearchSelection(relation.node, selection)) return false;
    }
  }
  return true;
}

export function selectedColumns(node: SearchPublicNode, input: SearchPublicSelection) {
  if (!v.is(choice, input.columns)) return Object.keys(node.columns);
  const columns = input.columns;
  return Object.values(columns).includes(true)
    ? Object.keys(columns).filter((key) => columns[key])
    : Object.keys(node.columns).filter((key) => columns[key] !== false);
}

/** Validate cached data structurally: compatible extra fields are permitted by
 * native initial-data assignability. Server result validation is stricter. */
export function acceptsSearchPage(
  node: SearchPublicNode,
  input: SearchPublicSelection,
  data: unknown,
): data is SearchCachedPage {
  if (!v.is(record, data)) return false;
  if (
    !v.is(v.array(v.unknown()), data.rows) ||
    !v.is(v.nullable(v.string()), data.nextCursor) ||
    !v.is(v.nullable(v.string()), data.previousCursor)
  )
    return false;
  return data.rows.every((row) => acceptsSearchRow(node, input, row));
}

function acceptsSearchRow(node: SearchPublicNode, input: SearchPublicSelection, row: unknown): row is StorageRow {
  if (!v.is(record, row)) return false;
  for (const name of selectedColumns(node, input)) {
    const field = node.columns[name];
    if (!field || !Object.hasOwn(row, name)) return false;
    const parser = field === "_id" || field === "_createdAt" ? systemParsers[field] : storageParser(field);
    if (!v.is(parser, row[name])) return false;
  }
  if (v.is(record, input.with)) {
    for (const [name, selection] of Object.entries(input.with)) {
      const relation = node.relations[name];
      if (!relation || !v.is(record, selection) || !Object.hasOwn(row, name)) return false;
      const value = row[name];
      if (relation.many) {
        if (
          !v.is(v.array(v.unknown()), value) ||
          !value.every((item) => acceptsSearchRow(relation.node, selection, item))
        )
          return false;
      } else if (value === null ? !relation.optional : !acceptsSearchRow(relation.node, selection, value)) return false;
    }
  }
  return true;
}
