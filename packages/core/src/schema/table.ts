import type { FieldDefinition } from "./fields.js";

export type Fields = Readonly<Record<string, FieldDefinition>>;
export interface IndexDeclaration<Key extends string = string> {
  readonly fields: readonly [Key, ...Key[]];
  readonly unique?: boolean;
}
export interface TableOptions<Key extends string = string> {
  readonly indexes?: readonly IndexDeclaration<Key>[];
  readonly serverFields?: readonly Key[];
  readonly commandFields?: readonly Key[];
  readonly publicFields?: readonly Key[];
}
export class TableDefinition<F extends Fields> {
  readonly fields: F;
  readonly options: TableOptions;
  constructor(fields: F, options: TableOptions<Extract<keyof F, string>>) {
    this.fields = Object.freeze({ ...fields });
    this.options = Object.freeze({
      indexes: Object.freeze((options.indexes ?? []).map((index) => Object.freeze({ ...index, fields: Object.freeze([...index.fields] as const) }))),
      serverFields: Object.freeze([...(options.serverFields ?? [])]),
      commandFields: Object.freeze([...(options.commandFields ?? [])]),
      publicFields: Object.freeze([...(options.publicFields ?? [])]),
    });
    Object.freeze(this);
  }
}
export function defineTable<const F extends Fields>(fields: F, options: TableOptions<Extract<keyof F, string>> = {}) {
  return new TableDefinition(fields, options);
}
export type EntityDeclaration = Fields | TableDefinition<Fields>;
export type EntityFields<Entity extends EntityDeclaration> = Entity extends TableDefinition<infer F> ? F : Entity extends Fields ? Entity : never;
