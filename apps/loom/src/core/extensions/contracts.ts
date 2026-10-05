import * as v from "valibot";

const token = v.pipe(v.string(), v.minLength(1));
const typeReference = v.strictObject({ namespace: token, name: token });
const argument = v.strictObject({
  name: v.nullable(v.string()),
  type: typeReference,
  mode: v.picklist(["in", "out", "inout", "variadic", "table"]),
  hasDefault: v.boolean(),
});
const common = {
  id: token,
  name: token,
  namespace: v.nullable(token),
  ownership: v.picklist(["direct", "subordinate"]),
};
const column = v.strictObject({
  name: token,
  type: typeReference,
  nullable: v.boolean(),
  ordinal: v.number(),
  modifier: v.number(),
  collation: v.nullable(v.string()),
});

/** Facts observed in pg_catalog. Capability semantics and adapter coverage are separate reviewed inputs. */
export const extensionMemberValidator = v.variant("kind", [
  v.strictObject({
    ...common,
    kind: v.literal("routine"),
    routineKind: v.picklist(["function", "procedure", "aggregate", "window"]),
    arguments: v.array(argument),
    returns: typeReference,
    returnsSet: v.boolean(),
    defaults: v.nullable(v.string()),
    variadic: v.nullable(typeReference),
    strict: v.boolean(),
    volatility: v.picklist(["immutable", "stable", "volatile"]),
    parallel: v.picklist(["safe", "restricted", "unsafe"]),
    securityDefiner: v.boolean(),
    leakproof: v.boolean(),
    publicExecute: v.boolean(),
    language: token,
    configuration: v.array(v.string()),
    aggregate: v.nullable(
      v.strictObject({
        kind: v.picklist(["normal", "ordered-set", "hypothetical"]),
        directArguments: v.number(),
        transitionType: typeReference,
        transition: v.string(),
        final: v.nullable(v.string()),
        combine: v.nullable(v.string()),
        serial: v.nullable(v.string()),
        deserial: v.nullable(v.string()),
        initial: v.nullable(v.string()),
        finalExtra: v.boolean(),
        finalModify: v.string(),
        movingTransition: v.nullable(v.string()),
        movingInverse: v.nullable(v.string()),
        movingFinal: v.nullable(v.string()),
        movingTransitionType: v.nullable(typeReference),
        movingInitial: v.nullable(v.string()),
        movingFinalExtra: v.boolean(),
        movingFinalModify: v.string(),
      }),
    ),
  }),
  v.strictObject({
    ...common,
    kind: v.literal("operator"),
    left: v.nullable(typeReference),
    right: v.nullable(typeReference),
    returns: v.nullable(typeReference),
    procedure: v.nullable(token),
    defined: v.boolean(),
    commutator: v.nullable(v.string()),
    negator: v.nullable(v.string()),
    canHash: v.boolean(),
    canMerge: v.boolean(),
    restrict: v.nullable(v.string()),
    join: v.nullable(v.string()),
  }),
  v.strictObject({
    ...common,
    kind: v.literal("type"),
    typeKind: token,
    category: token,
    base: v.nullable(typeReference),
    element: v.nullable(typeReference),
    array: v.nullable(typeReference),
    delimiter: v.string(),
    length: v.number(),
    byValue: v.boolean(),
    input: v.string(),
    output: v.string(),
    receive: v.nullable(v.string()),
    send: v.nullable(v.string()),
    typmodInput: v.nullable(v.string()),
    typmodOutput: v.nullable(v.string()),
    enumValues: v.array(v.string()),
    attributes: v.array(column),
    nullable: v.boolean(),
    modifier: v.number(),
    default: v.nullable(v.string()),
    alignment: v.string(),
    storage: v.string(),
    collation: v.nullable(v.string()),
    range: v.nullable(
      v.strictObject({
        subtype: typeReference,
        multirange: typeReference,
        canonical: v.nullable(v.string()),
        subdiff: v.nullable(v.string()),
      }),
    ),
  }),
  v.strictObject({
    ...common,
    kind: v.literal("cast"),
    source: typeReference,
    target: typeReference,
    context: v.picklist(["implicit", "assignment", "explicit"]),
    method: v.picklist(["function", "binary", "inout"]),
    procedure: v.nullable(v.string()),
  }),
  v.strictObject({
    ...common,
    kind: v.literal("opclass"),
    accessMethod: token,
    family: token,
    input: typeReference,
    storage: v.nullable(typeReference),
    isDefault: v.boolean(),
  }),
  v.strictObject({
    ...common,
    kind: v.literal("opfamily"),
    accessMethod: token,
    operators: v.array(
      v.strictObject({
        left: typeReference,
        right: typeReference,
        strategy: v.number(),
        purpose: v.string(),
        operator: token,
        sortFamily: v.nullable(v.string()),
      }),
    ),
    procedures: v.array(
      v.strictObject({ left: typeReference, right: typeReference, number: v.number(), procedure: token }),
    ),
  }),
  v.strictObject({ ...common, kind: v.literal("access-method"), methodKind: v.string(), handler: token }),
  v.strictObject({
    ...common,
    kind: v.literal("relation"),
    relationKind: token,
    columns: v.array(column),
    definition: v.nullable(v.string()),
  }),
  v.strictObject({
    ...common,
    kind: v.literal("other"),
    objectType: token,
    identity: token,
    definition: v.optional(v.nullable(v.string()), null),
  }),
]);

export const extensionContractValidator = v.strictObject({
  extension: token,
  postgresMajor: v.pipe(v.number(), v.integer(), v.minValue(18)),
  version: token,
  provider: token,
  installation: v.strictObject({ relocatable: v.boolean(), fixedSchema: v.nullable(token) }),
  requires: v.array(token),
  members: v.array(extensionMemberValidator),
});
export const extensionManifestValidator = v.strictObject({
  format: v.literal(1),
  contract: extensionContractValidator,
  provenance: v.strictObject({
    capturedAt: token,
    fixture: token,
    source: v.literal("pg_catalog"),
    serverVersion: token,
    installationSchema: token,
    verified: v.literal(true),
  }),
  digest: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
});
export type ExtensionTypeReference = v.InferOutput<typeof typeReference>;
export type ExtensionMember = v.InferOutput<typeof extensionMemberValidator>;
export type ExtensionContract = v.InferOutput<typeof extensionContractValidator>;
export type ExtensionManifest = v.InferOutput<typeof extensionManifestValidator>;
export type ExtensionProvenance = ExtensionManifest["provenance"];

export type ExtensionContractSelection = { name: string; postgresMajor: number; version: string; provider: string };
export type ExtensionContractResolution =
  | { status: "verified"; manifest: ExtensionManifest }
  | ({ status: "unverified"; reason: string } & ExtensionContractSelection);
