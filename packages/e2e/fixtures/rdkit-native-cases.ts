import type { ExtensionMember } from "../../../apps/loom/src/core/extensions/contracts";
import type { RdkitKind, RdkitValue } from "../../../apps/loom/src/core/extensions/adapters/rdkit-codecs";
import { rdkitKinds } from "../../../apps/loom/src/core/extensions/adapters/rdkit-codecs";
import { rdkitManifest } from "../../../apps/loom/src/tooling/extensions/annotations/rdkit";

type TypeReference = { readonly namespace: string; readonly name: string };
type Routine = Extract<ExtensionMember, { kind: "routine" }>;

/**
 * Argument values for every public rdkit 4.8.0 member. Each seed is SQL evaluated by the native cartridge,
 * so fingerprints, CTABs, JSON and pickles come from PostgreSQL; no chemistry is computed in JavaScript.
 */
const seeds = {
  mol0: (s: string) => `'Oc1ccccc1'::${s}.mol`,
  mol1: (s: string) => `'c1ccccc1'::${s}.mol`,
  qmol0: (s: string) => `'c1ccccc1'::${s}.qmol`,
  xqmol0: (s: string) => `${s}.mol_to_xqmol('Oc1ccccc1'::${s}.mol)`,
  reaction0: (s: string) => `'[C:1](=[O:2])O>>[C:1](=[O:2])N'::${s}.reaction`,
  reaction1: (s: string) => `'C(=O)O>>C(=O)N'::${s}.reaction`,
  bfp0: (s: string) => `${s}.morganbv_fp('Oc1ccccc1'::${s}.mol)`,
  bfp1: (s: string) => `${s}.morganbv_fp('c1ccccc1'::${s}.mol)`,
  sfp0: (s: string) => `${s}.morgan_fp('Oc1ccccc1'::${s}.mol)`,
  sfp1: (s: string) => `${s}.morgan_fp('c1ccccc1'::${s}.mol)`,
  smiles: () => `'Oc1ccccc1'`,
  smarts: () => `'[#6]O'`,
  smilesList: () => `'Oc1ccccc1 Nc1ccccc1'`,
  fmcsParameters: () => `''`,
  molCtab: (s: string) => `${s}.mol_to_ctab('Oc1ccccc1'::${s}.mol)`,
  molJson: (s: string) => `${s}.mol_to_json('Oc1ccccc1'::${s}.mol)`,
  molPickle: (s: string) => `${s}.mol_to_pkl('Oc1ccccc1'::${s}.mol)`,
  bfpBinary: (s: string) => `${s}.bfp_to_binary_text(${s}.morganbv_fp('Oc1ccccc1'::${s}.mol))`,
  reactionSmarts: () => `'[C:1](=[O:2])O>>[C:1](=[O:2])N'`,
  reactionSmiles: () => `'CC(=O)O>>CC(=O)N'`,
  reactionCtab: (s: string) => `${s}.reaction_to_ctab('[C:1](=[O:2])O>>[C:1](=[O:2])N'::${s}.reaction)`,
  zero: () => `0`,
  half: () => `0.5`,
} as const;
export type RdkitSeed = keyof typeof seeds;

const scalarSeeds = {
  mol_from_smiles: ["smiles"],
  qmol_from_smiles: ["smiles"],
  is_valid_smiles: ["smiles"],
  qmol_from_smarts: ["smarts"],
  is_valid_smarts: ["smarts"],
  mol_from_ctab: ["molCtab"],
  qmol_from_ctab: ["molCtab"],
  is_valid_ctab: ["molCtab"],
  mol_from_json: ["molJson"],
  qmol_from_json: ["molJson"],
  reaction_from_smarts: ["reactionSmarts"],
  reaction_from_smiles: ["reactionSmiles"],
  reaction_from_ctab: ["reactionCtab"],
  fmcs_smiles: ["smilesList", "fmcsParameters"],
  fmcs_smiles_transition: ["fmcsParameters", "smiles"],
  fmcs: ["smiles"],
  mol_from_pkl: ["molPickle"],
  is_valid_mol_pkl: ["molPickle"],
  bfp_from_binary_text: ["bfpBinary"],
  all_values_gt: ["zero"],
  all_values_lt: ["zero"],
  tversky_sml: ["half", "half"],
} as const satisfies Readonly<Record<string, readonly RdkitSeed[]>>;

export interface RdkitNativeArgument {
  readonly seed: RdkitSeed;
  readonly type: TypeReference;
}
export interface RdkitNativeCase {
  readonly id: string;
  readonly kind: "routine" | "aggregate" | "operator" | "cast";
  readonly name: string;
  readonly arguments: readonly RdkitNativeArgument[];
  readonly result: TypeReference;
  /**
   * Native invocation always fails: a captured shell operator has no procedure, and an aggregate transition
   * function rejects calls outside aggregate context.
   */
  readonly failure: "shell-operator" | "aggregate-context" | undefined;
  /** SQL-language bodies resolve unqualified cartridge functions, so they need the schema on search_path. */
  readonly searchPath: boolean;
}

const members = new Map(rdkitManifest.contract.members.map((row) => [row.id, row]));
function sqlLanguage(identity: string | null | undefined): boolean {
  const member = identity ? members.get(`routine:${identity}`) : undefined;
  if (member?.kind !== "routine") return false;
  return member.language === "sql" || sqlLanguage(member.aggregate?.final);
}
function transitionOnly(member: Routine) {
  return rdkitManifest.contract.members.some(
    (row) => row.kind === "routine" && row.aggregate?.transition === member.id.slice("routine:".length),
  );
}

function rdkitKind(type: TypeReference): RdkitKind | undefined {
  if (type.namespace !== "$extension:rdkit") return undefined;
  return rdkitKinds.find((kind) => kind === type.name);
}

function chemistrySeed(kind: RdkitKind, second: boolean): RdkitSeed {
  switch (kind) {
    case "mol":
      return second ? "mol1" : "mol0";
    case "reaction":
      return second ? "reaction1" : "reaction0";
    case "bfp":
      return second ? "bfp1" : "bfp0";
    case "sfp":
      return second ? "sfp1" : "sfp0";
    case "qmol":
      return "qmol0";
    case "xqmol":
      return "xqmol0";
  }
}

function scalarSeed(member: ExtensionMember, scalar: number): RdkitSeed {
  const named = Object.entries(scalarSeeds).find(([name]) => name === member.name)?.[1];
  const seed = named?.[scalar];
  if (!seed) throw new Error(`No native rdkit seed for ${member.id} scalar ${scalar}`);
  return seed;
}

function routineCase(member: Routine): RdkitNativeCase {
  let scalar = 0;
  const required = member.arguments.filter((argument) => !argument.hasDefault);
  return {
    id: member.id,
    kind: member.routineKind === "aggregate" ? "aggregate" : "routine",
    name: member.name,
    arguments: required.map((argument, index) => {
      const kind = rdkitKind(argument.type);
      return { seed: kind ? chemistrySeed(kind, index === 1) : scalarSeed(member, scalar++), type: argument.type };
    }),
    result: member.returns,
    failure: transitionOnly(member) ? "aggregate-context" : undefined,
    searchPath: sqlLanguage(member.id.slice("routine:".length)),
  };
}

function operand(type: TypeReference | null, second: boolean, member: ExtensionMember) {
  const kind = type && rdkitKind(type);
  if (!type || !kind) throw new Error(`Unsupported rdkit operator operand: ${member.id}`);
  return { seed: chemistrySeed(kind, second), type };
}

/** Exact public query members by captured identity. Shell operators carry their declared operand types. */
export function rdkitNativeCases(queryIds: readonly string[]): RdkitNativeCase[] {
  return queryIds.map((id) => {
    const member = rdkitManifest.contract.members.find((row) => row.id === id);
    if (!member) throw new Error(`Unknown rdkit member ${id}`);
    if (member.kind === "routine") return routineCase(member);
    if (member.kind === "operator")
      return {
        id,
        kind: "operator",
        name: member.name,
        arguments: [operand(member.left, false, member), operand(member.right, true, member)],
        result: member.returns ?? { namespace: "pg_catalog", name: "bool" },
        failure: member.defined ? undefined : "shell-operator",
        searchPath: false,
      };
    if (member.kind === "cast")
      return {
        id,
        kind: "cast",
        name: member.target.name,
        arguments: [{ seed: member.source.name === "mol" ? "mol0" : "smiles", type: member.source }],
        result: member.target,
        failure: undefined,
        searchPath: sqlLanguage(member.procedure),
      };
    throw new Error(`Not a query member: ${id}`);
  });
}

export function quoteRdkitIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function sqlType(schema: string, type: TypeReference) {
  return type.namespace === "$extension:rdkit"
    ? `${quoteRdkitIdentifier(schema)}.${quoteRdkitIdentifier(type.name)}`
    : `pg_catalog.${quoteRdkitIdentifier(type.name)}`;
}

/** Native SQL that renders each seed as text in the installation schema. */
export function rdkitSeedSql(schema: string, seed: RdkitSeed) {
  return `SELECT (${seeds[seed](quoteRdkitIdentifier(schema))})::pg_catalog.text AS value`;
}

/** Independent native invocation over text parameters; never built through the adapter under test. */
export function rdkitNativeSql(schema: string, entry: RdkitNativeCase) {
  const s = quoteRdkitIdentifier(schema);
  const params = entry.arguments.map((argument, index) => `$${index + 1}::${sqlType(schema, argument.type)}`);
  if (entry.kind === "operator")
    return `SELECT (${params[0]} OPERATOR(${s}.${entry.name}) ${params[1]})::pg_catalog.text AS value`;
  if (entry.kind === "cast")
    return `SELECT ((${params[0]})::${sqlType(schema, entry.result)})::pg_catalog.text AS value`;
  if (entry.kind === "aggregate")
    return `SELECT (${s}.${quoteRdkitIdentifier(entry.name)}(fixture.value))::pg_catalog.text AS value FROM (VALUES (${params[0]}), (${params[0]})) AS fixture(value)`;
  return `SELECT (${s}.${quoteRdkitIdentifier(entry.name)}(${params.join(", ")}))::pg_catalog.text AS value`;
}

/** Every public rdkit argument or result value in its decoded Kello representation. */
export type RdkitPublicValue = RdkitValue | number | boolean | string | { readonly hex: string } | null;

/** Decoded public value for native ::text output of a captured PostgreSQL type. */
export function rdkitPublicValue(type: TypeReference, text: string | null): RdkitPublicValue {
  if (text === null) return null;
  const kind = rdkitKind(type);
  if (kind) return { kind, text };
  if (type.name === "bool") return text === "true";
  // float4 text is PostgreSQL's shortest decimal; the decoded wire value is that exact single-precision number.
  if (type.name === "float4") return Math.fround(Number(text));
  if (type.name === "int4" || type.name === "float8") return Number(text);
  if (type.name === "bytea") return { hex: text.slice(2).toLowerCase() };
  return text;
}
