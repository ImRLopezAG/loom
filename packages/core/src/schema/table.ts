import type { FieldDefinition } from "./fields.js";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export type Fields = Readonly<Record<string, FieldDefinition>>;
export interface IndexDeclaration<Key extends string = string> {
  readonly fields: readonly [Key, ...Key[]];
  readonly unique?: boolean;
}
export interface TableOptions<Key extends string = string> {
  readonly indexes?: readonly IndexDeclaration<Key>[];
  readonly serverFields?: readonly Key[];
  readonly commandFields?: readonly Key[];
  readonly publicFields?: readonly (Key | "_id" | "_createdAt")[];
  readonly insertValidation?: StandardSchemaV1;
  readonly patchValidation?: StandardSchemaV1;
}
export class TableDefinition<F extends Fields, Options extends TableOptions = TableOptions> {
  readonly fields: F;
  readonly options: Options;
  constructor(fields: F, options: Options) {
    this.fields = Object.freeze({ ...fields });
    // SAFETY: every supplied option is preserved; declared lists are copied and frozen without changing their elements.
    this.options = Object.freeze({
      ...options,
      indexes: Object.freeze((options.indexes ?? []).map((index) => Object.freeze({ ...index, fields: Object.freeze([...index.fields] as const) }))),
      serverFields: Object.freeze([...(options.serverFields ?? [])]),
      commandFields: Object.freeze([...(options.commandFields ?? [])]),
      publicFields: Object.freeze([...(options.publicFields ?? [])]),
    }) as Options;
    Object.freeze(this);
  }
}
export function defineTable<const F extends Fields>(fields: F): TableDefinition<F, Record<never, never>>;
export function defineTable<const F extends Fields, const Options extends TableOptions<Extract<keyof F, string>>>(fields: F, options: Options): TableDefinition<F, Options>;
export function defineTable<const F extends Fields>(fields: F, options: TableOptions = {}) {
  return new TableDefinition(fields, options);
}
export type EntityDeclaration = Fields | TableDefinition<Fields>;
export type EntityFields<Entity extends EntityDeclaration> = Entity extends TableDefinition<infer F> ? F : Entity extends Fields ? Entity : never;
