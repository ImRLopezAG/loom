import type { FieldDefinition } from "./fields";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { ExtensionIndexContract } from "../extensions/fields";

/** Named field declarations used to compile a table and its validators. */
export type Fields = Readonly<Record<string, FieldDefinition>>;
/** Ordered fields in a database index. Set unique to enforce uniqueness in PostgreSQL, not only in request validation. */
export interface IndexDeclaration<Key extends string = string> {
  readonly fields: readonly [Key, ...Key[]];
  readonly unique?: boolean;
  readonly extension?: ExtensionIndexContract;
  readonly with?: Readonly<Record<string, string | number | boolean>>;
}
/** Table indexes and validator projections. serverFields are omitted from client inserts and patches; commandFields and publicFields select explicit command and public shapes. */
export interface TableOptions<Key extends string = string> {
  readonly indexes?: readonly IndexDeclaration<Key>[];
  readonly serverFields?: readonly Key[];
  readonly commandFields?: readonly Key[];
  readonly publicFields?: readonly (Key | "_id" | "_createdAt")[];
  readonly insertValidation?: StandardSchemaV1;
  readonly patchValidation?: StandardSchemaV1;
}
/** Immutable table declaration retaining literal field and policy types for schema generation. */
export class TableDefinition<F extends Fields, Options extends TableOptions = TableOptions> {
  readonly fields: F;
  readonly options: Options;
  constructor(fields: F, options: Options) {
    this.fields = Object.freeze({ ...fields });
    // SAFETY: every supplied option is preserved; declared lists are copied and frozen without changing their elements.
    this.options = Object.freeze({
      ...options,
      indexes: Object.freeze(
        (options.indexes ?? []).map((index) =>
          Object.freeze({
            ...index,
            fields: Object.freeze([...index.fields] as const),
            ...(index.extension && {
              extension: Object.freeze({
                ...index.extension,
                ...(index.extension.options && { options: Object.freeze({ ...index.extension.options }) }),
              }),
            }),
            ...(index.with && { with: Object.freeze({ ...index.with }) }),
          }),
        ),
      ),
      serverFields: Object.freeze([...(options.serverFields ?? [])]),
      commandFields: Object.freeze([...(options.commandFields ?? [])]),
      publicFields: Object.freeze([...(options.publicFields ?? [])]),
    }) as Options;
    Object.freeze(this);
  }
}
export function defineTable<const F extends Fields>(fields: F): TableDefinition<F, Record<never, never>>;
export function defineTable<const F extends Fields, const Options extends TableOptions<Extract<keyof F, string>>>(
  fields: F,
  options: Options,
): TableDefinition<F, Options>;
export function defineTable<const F extends Fields>(fields: F, options: TableOptions = {}) {
  return new TableDefinition(fields, options);
}
/** A table may be declared as fields alone or with defineTable for indexes and validation policies. */
export type EntityDeclaration = Fields | TableDefinition<Fields>;
/** Extracts field declarations from either supported table declaration shape. */
export type EntityFields<Entity extends EntityDeclaration> =
  Entity extends TableDefinition<infer F> ? F : Entity extends Fields ? Entity : never;
