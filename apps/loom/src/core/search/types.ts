import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
  AnyRelations,
  BuildQueryResult,
  FindTargetTableInRelationalConfig,
  GetTableViewFieldSelection,
  TableRelationalConfig,
  AnyRelation,
  RelationResultKind,
} from "drizzle-orm";

/** Server-owned projection capabilities. Relations must be exposed explicitly;
 * mounting a graph does not publish every column or relation. */
export type SearchPolicy<Graph extends AnyRelations, Table extends TableRelationalConfig> = {
  readonly columns: readonly (keyof GetTableViewFieldSelection<Table["table"]> & string)[];
  readonly scope: "public";
  readonly relations?: {
    readonly [Name in keyof Table["relations"]]?: SearchPolicy<
      Graph,
      FindTargetTableInRelationalConfig<Graph, Table["relations"][Name]>
    >;
  };
};

/** Selection inferred from the compiled graph and the contract's capabilities. */
export type SearchSelection<Graph extends AnyRelations, Table extends TableRelationalConfig, Policy> = {
  readonly columns?: Policy extends { columns: readonly (infer Column extends string)[] }
    ? { readonly [Name in Column]?: boolean }
    : never;
  readonly with?: Policy extends { relations: infer Relations }
    ? {
        readonly [Name in keyof Relations & keyof Table["relations"]]?: SearchSelection<
          Graph,
          FindTargetTableInRelationalConfig<Graph, Table["relations"][Name]>,
          Relations[Name]
        >;
      }
    : never;
  readonly limit?: number;
  readonly cursor?: string | null;
  readonly direction?: "forward" | "backward";
};

type AllowedColumns<Policy> = Policy extends { columns: readonly (infer Key extends string)[] } ? Key : never;
type DefiniteKeys<Columns, Value> = {
  [Key in keyof Columns]-?: [Columns[Key]] extends [Value] ? Key : never;
}[keyof Columns];
type PossibleKeys<Columns, Value> = {
  [Key in keyof Columns]-?: Value extends Columns[Key] ? Key : never;
}[keyof Columns];
type GuaranteedColumns<Policy, Columns> = [DefiniteKeys<Columns, true>] extends [never]
  ? [PossibleKeys<Columns, true>] extends [never]
    ? Exclude<AllowedColumns<Policy>, PossibleKeys<Columns, false>>
    : never
  : Extract<AllowedColumns<Policy>, DefiniteKeys<Columns, true>>;
type PossibleColumns<Policy, Columns> = [DefiniteKeys<Columns, true>] extends [never]
  ? Exclude<AllowedColumns<Policy>, DefiniteKeys<Columns, false>>
  : Extract<AllowedColumns<Policy>, PossibleKeys<Columns, true>>;
type ColumnsOf<Input> = Input[Extract<"columns", keyof Input>];
type RequiredColumns<Policy, Input> = "columns" extends keyof Input
  ? [NonNullable<ColumnsOf<Input>>] extends [never]
    ? AllowedColumns<Policy>
    : GuaranteedColumns<Policy, NonNullable<ColumnsOf<Input>>>
  : AllowedColumns<Policy>;
type AvailableColumns<Policy, Input> = "columns" extends keyof Input
  ? undefined extends ColumnsOf<Input>
    ? AllowedColumns<Policy>
    : PossibleColumns<Policy, NonNullable<ColumnsOf<Input>>>
  : AllowedColumns<Policy>;
type ProjectedColumns<Model, Policy, Input> = {
  [Key in Extract<RequiredColumns<Policy, Input>, keyof Model>]: Model[Key];
} & {
  [Key in Extract<Exclude<AvailableColumns<Policy, Input>, RequiredColumns<Policy, Input>>, keyof Model>]?: Model[Key];
};
type RelationRow<
  Graph extends AnyRelations,
  Table extends TableRelationalConfig,
  Policy,
  Name extends keyof Table["relations"],
  Input,
> = Policy extends { relations: infer Policies }
  ? Name extends keyof Policies
    ? Table["relations"][Name] extends infer Relation extends AnyRelation
      ? RelationResultKind<
          SearchRow<Graph, FindTargetTableInRelationalConfig<Graph, Relation>, Policies[Name], NonNullable<Input>>,
          Input,
          Relation
        >
      : never
    : never
  : never;
type SelectedRelations<Graph extends AnyRelations, Table extends TableRelationalConfig, Policy, With> = {
  [Name in keyof With & keyof Table["relations"] as undefined extends With[Name] ? never : Name]: RelationRow<
    Graph,
    Table,
    Policy,
    Name,
    With[Name]
  >;
} & {
  [Name in keyof With & keyof Table["relations"] as undefined extends With[Name] ? Name : never]?: RelationRow<
    Graph,
    Table,
    Policy,
    Name,
    With[Name]
  >;
};
type WithOf<Input> = Input[Extract<"with", keyof Input>];
type ProjectedRelations<
  Graph extends AnyRelations,
  Table extends TableRelationalConfig,
  Policy,
  Input,
> = "with" extends keyof Input
  ? undefined extends WithOf<Input>
    ? {
        [Name in keyof NonNullable<WithOf<Input>> & keyof Table["relations"]]?: RelationRow<
          Graph,
          Table,
          Policy,
          Name,
          NonNullable<WithOf<Input>>[Name]
        >;
      }
    : SelectedRelations<Graph, Table, Policy, NonNullable<WithOf<Input>>>
  : object;

/** Native Drizzle scalars and relation cardinality with the contract's field
 * mask. Literal selections are exact; uncertain fields remain optional and
 * unions stay unions, including at each nested relation. */
export type SearchRow<
  Graph extends AnyRelations,
  Table extends TableRelationalConfig,
  Policy,
  Input,
> = Input extends unknown
  ? {
      [
        Key in keyof (ProjectedColumns<BuildQueryResult<Graph, Table, true>, Policy, Input> &
          ProjectedRelations<Graph, Table, Policy, Input>)
      ]: (ProjectedColumns<BuildQueryResult<Graph, Table, true>, Policy, Input> &
        ProjectedRelations<Graph, Table, Policy, Input>)[Key];
    }
  : never;

/** One finite page. Boundary values remain opaque; refreshing starts a new
 * traversal snapshot. Counts are exact decimal strings when requested. */
export interface SearchPage<Row> {
  readonly rows: Row[];
  readonly nextCursor: string | null;
  readonly previousCursor: string | null;
  readonly count?: string;
}

/** Type-level projection retained by generated native client declarations. */
export interface SearchProjector<Input = unknown> {
  readonly selection: Input;
  readonly input: unknown;
  readonly output: object;
}
export type SearchProjection<Projection extends SearchProjector, Input> = (Projection & {
  readonly input: Input;
})["output"];
export interface SchemaSearchProjector<
  Graph extends AnyRelations,
  Table extends TableRelationalConfig,
  Policy,
> extends SearchProjector<SearchSelection<Graph, Table, Policy>> {
  readonly output: SearchPage<SearchRow<Graph, Table, Policy, this["input"]>>;
}

declare const searchProjection: unique symbol;
/** Phantom type identity; this property is never present in wire results. */
export type SearchWire<Projection extends SearchProjector> = {
  readonly rows: object[];
  readonly nextCursor: string | null;
  readonly previousCursor: string | null;
  readonly [searchProjection]?: Projection;
};
export type InferSearchProjector<Output> = typeof searchProjection extends keyof Output
  ? NonNullable<Output[typeof searchProjection]> extends infer Projection extends SearchProjector
    ? Projection
    : never
  : never;

/** Matching Standard Schema instances used by native oRPC input/output chaining. */
export interface SearchDescriptor<Projection extends SearchProjector> {
  readonly input: StandardSchemaV1<Projection["selection"]>;
  readonly output: StandardSchemaV1<SearchWire<Projection>>;
}

/** Deep excess-key checks also apply to predeclared selections and spreads. */
export type ExactSearchInput<Input, Contract> = Input extends object
  ? {
      [Key in keyof Input]: Key extends keyof Contract
        ? ExactSearchInput<Input[Key], NonNullable<Contract[Key]>>
        : never;
    }
  : Input;
