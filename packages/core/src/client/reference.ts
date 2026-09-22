export type FunctionKind = "query" | "mutation" | "action";
export type FunctionVisibility = "public" | "internal";
declare const referenceTypes: unique symbol;

/** Browser-safe identity and type contract; carries no handler or credentials. */
export interface FunctionReference<Kind extends FunctionKind, Visibility extends FunctionVisibility, Input, Output> {
  readonly name: string;
  readonly kind: Kind;
  readonly visibility: Visibility;
  readonly version: string;
  readonly [referenceTypes]?: { readonly input: Input; readonly output: Output };
}
