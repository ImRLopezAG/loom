import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { NativeTables } from "../schema/compile.js";
import type { Field } from "../schema/fields.js";
import type { EntityDeclaration, EntityFields, TableDefinition, TableOptions } from "../schema/table.js";

type FieldInput<F> = F extends Field<infer B, infer V>
  ? (V extends StandardSchemaV1 ? StandardSchemaV1.InferInput<V> : B["_"] extends { $type: infer Data } ? Data : B["_"]["data"]) | (B["_"]["notNull"] extends true ? never : null)
  : never;
type RequiredKeys<E extends EntityDeclaration> = {
  [Key in keyof EntityFields<E>]: EntityFields<E>[Key] extends Field<infer B, infer _V>
    ? undefined extends FieldInput<EntityFields<E>[Key]> ? never : B["_"]["notNull"] extends true ? B["_"]["hasDefault"] extends true ? never : Key : never : never;
}[keyof EntityFields<E>];
type Inputs<E extends EntityDeclaration> = {
  [Key in RequiredKeys<E>]: FieldInput<EntityFields<E>[Key]>;
} & { [Key in Exclude<keyof EntityFields<E>, RequiredKeys<E>>]?: FieldInput<EntityFields<E>[Key]> };
type PolicyKeys<E extends EntityDeclaration, Policy extends keyof TableOptions> = E extends TableDefinition<infer _F, infer O>
  ? Policy extends keyof O ? O[Policy] extends readonly (infer Key)[] ? Extract<Key, string> : never : never : never;
type Stored<E extends EntityDeclaration, Name extends string> = NativeTables<Record<Name, E>>[Name]["$inferSelect"];
type Inserted<E extends EntityDeclaration, Name extends string> = Omit<NativeTables<Record<Name, E>>[Name]["$inferInsert"], "_id" | "_createdAt" | PolicyKeys<E, "serverFields">>;

export interface TableValidators<E extends EntityDeclaration, Name extends string> {
  storage: StandardSchemaV1<Stored<E, Name>>;
  insert: StandardSchemaV1<Omit<Inputs<E>, PolicyKeys<E, "serverFields">>, Inserted<E, Name>>;
  patch: StandardSchemaV1<Partial<Omit<Inputs<E>, PolicyKeys<E, "serverFields">>>, Partial<Inserted<E, Name>>>;
  command: StandardSchemaV1<Pick<Inputs<E>, Extract<PolicyKeys<E, "commandFields">, keyof Inputs<E>>>, Pick<Inserted<E, Name>, Extract<PolicyKeys<E, "commandFields">, keyof Inserted<E, Name>>>>;
  public: StandardSchemaV1<Stored<E, Name>, Pick<Stored<E, Name>, Extract<PolicyKeys<E, "publicFields">, keyof Stored<E, Name>>>>;
}
export type SchemaValidators<Entities extends Record<string, EntityDeclaration>> = {
  [Name in keyof Entities & string]: TableValidators<Entities[Name], Name>;
};
