import { is, SQL, sql } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  booleanCodec,
  binaryCodec,
  floatCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type ExtensionCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { float4Codec } from "../primitive-number-codecs";
import { createExtensionField, createExtensionIndex } from "../fields";
import {
  checkedExtensionExpression,
  createSqlAggregate,
  createSqlFunction,
  createSqlOperator,
  defaultSqlArgument,
  extensionSqlType,
  statefulSqlMember,
  type ExtensionSqlInput,
} from "../sql";
import {
  createRdkitArrayCodec,
  createRdkitCodec,
  rdkitArrayWireValue,
  rdkitValue,
  rdkitWireValue,
  type RdkitKind,
} from "./rdkit-codecs";
export { rdkitValue, rdkitKinds } from "./rdkit-codecs";
export type { RdkitKind, RdkitValue } from "./rdkit-codecs";
export type { PostgreSqlArray } from "../codecs";

const digest = "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952";
type Descriptor = ExtensionDescriptor<"rdkit", { readonly version: "4.8.0"; readonly schema: string }>;
const wrapper = v.object({ getSQL: v.function() });
function cast<Input, Output>(
  member: string,
  source: ExtensionCodec<Input, Input>,
  target: ExtensionCodec<Output, Output>,
) {
  return (value: ExtensionSqlInput<typeof source>) => {
    // SAFETY: Aliased and SQL wrappers are handled first, so the remaining value is the source codec input.
    const input = is(value, SQL.Aliased)
      ? "isSelectionField" in value && value.isSelectionField === true
        ? sql`${value}`
        : value.sql
      : v.is(wrapper, value)
        ? sql`${value}`
        : sql`${sql.param(source.encode(value as Input))}::${extensionSqlType(source.sqlType!.schema, source.sqlType!.name)}`;
    return checkedExtensionExpression(
      sql`(${input})::${extensionSqlType(target.sqlType!.schema, target.sqlType!.name)}`,
      target,
      [],
      undefined,
      member,
    );
  };
}

/** Exact RDKit 4.8.0 cartridge. PostgreSQL owns chemistry; adapters only bind captured SQL. */
export function createRdkit_4_8_0<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "rdkit" ||
    descriptor.version !== "4.8.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("rdkit 4.8.0 requires its exact verified contract");
  const molCodec = createRdkitCodec(descriptor.schema, "mol");
  const qmolCodec = createRdkitCodec(descriptor.schema, "qmol");
  const xqmolCodec = createRdkitCodec(descriptor.schema, "xqmol");
  const reactionCodec = createRdkitCodec(descriptor.schema, "reaction");
  const bfpCodec = createRdkitCodec(descriptor.schema, "bfp");
  const sfpCodec = createRdkitCodec(descriptor.schema, "sfp");
  const mol = nullableCodec(molCodec);
  const qmol = nullableCodec(qmolCodec);
  const xqmol = nullableCodec(xqmolCodec);
  const reaction = nullableCodec(reactionCodec);
  const bfp = nullableCodec(bfpCodec);
  const sfp = nullableCodec(sfpCodec);
  const bool = nullableCodec(booleanCodec);
  const int4 = nullableCodec(int4Codec);
  const float4 = nullableCodec(float4Codec);
  const float8 = nullableCodec(floatCodec);
  const text = nullableCodec(textCodec);
  const cstring = nullableCodec(withCodecSqlType(textCodec, { schema: "pg_catalog", name: "cstring" }));
  const bytea = nullableCodec(binaryCodec);
  const base = {
    schema: descriptor.schema,
    dependencies: [],
    observability: "tables" as const,
    authority: "query" as const,
  };
  const routine0 = createSqlFunction({
    ...base,
    name: "add",
    member: "routine:$extension:rdkit.add($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: sfp,
  });
  const routine1 = createSqlFunction({
    ...base,
    name: "all_values_gt",
    member: "routine:$extension:rdkit.all_values_gt($extension:rdkit.sfp,pg_catalog.int4)",
    arguments: [sfp, int4] as const,
    result: bool,
  });
  const routine2 = createSqlFunction({
    ...base,
    name: "all_values_lt",
    member: "routine:$extension:rdkit.all_values_lt($extension:rdkit.sfp,pg_catalog.int4)",
    arguments: [sfp, int4] as const,
    result: bool,
  });
  const routine3 = createSqlFunction({
    ...base,
    name: "atompair_fp",
    member: "routine:$extension:rdkit.atompair_fp($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: sfp,
  });
  const routine4 = createSqlFunction({
    ...base,
    name: "atompairbv_fp",
    member: "routine:$extension:rdkit.atompairbv_fp($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: bfp,
  });
  const routine5 = createSqlFunction({
    ...base,
    name: "avalon_fp",
    member: "routine:$extension:rdkit.avalon_fp($extension:rdkit.mol,pg_catalog.bool,pg_catalog.int4)",
    arguments: [mol, defaultSqlArgument(bool), defaultSqlArgument(int4)] as const,
    result: bfp,
  });
  const routine6 = createSqlFunction({
    ...base,
    name: "bfp_cmp",
    member: "routine:$extension:rdkit.bfp_cmp($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: int4,
  });
  const routine7 = createSqlFunction({
    ...base,
    name: "bfp_eq",
    member: "routine:$extension:rdkit.bfp_eq($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: bool,
  });
  const routine8 = createSqlFunction({
    ...base,
    name: "bfp_from_binary_text",
    member: "routine:$extension:rdkit.bfp_from_binary_text(pg_catalog.bytea)",
    arguments: [bytea] as const,
    result: bfp,
  });
  const routine9 = createSqlFunction({
    ...base,
    name: "bfp_ge",
    member: "routine:$extension:rdkit.bfp_ge($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: bool,
  });
  const routine10 = createSqlFunction({
    ...base,
    name: "bfp_gt",
    member: "routine:$extension:rdkit.bfp_gt($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: bool,
  });
  const routine11 = createSqlFunction({
    ...base,
    name: "bfp_le",
    member: "routine:$extension:rdkit.bfp_le($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: bool,
  });
  const routine12 = createSqlFunction({
    ...base,
    name: "bfp_lt",
    member: "routine:$extension:rdkit.bfp_lt($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: bool,
  });
  const routine13 = createSqlFunction({
    ...base,
    name: "bfp_ne",
    member: "routine:$extension:rdkit.bfp_ne($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: bool,
  });
  const routine14 = createSqlFunction({
    ...base,
    name: "bfp_to_binary_text",
    member: "routine:$extension:rdkit.bfp_to_binary_text($extension:rdkit.bfp)",
    arguments: [bfp] as const,
    result: bytea,
  });
  const routine15 = createSqlFunction({
    ...base,
    name: "dice_dist",
    member: "routine:$extension:rdkit.dice_dist($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: float8,
  });
  const routine16 = createSqlFunction({
    ...base,
    name: "dice_sml_op",
    member: "routine:$extension:rdkit.dice_sml_op($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: bool,
  });
  const routine17 = createSqlFunction({
    ...base,
    name: "dice_sml_op",
    member: "routine:$extension:rdkit.dice_sml_op($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: bool,
  });
  const routine18 = createSqlFunction({
    ...base,
    name: "dice_sml",
    member: "routine:$extension:rdkit.dice_sml($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: float8,
  });
  const routine19 = createSqlFunction({
    ...base,
    name: "dice_sml",
    member: "routine:$extension:rdkit.dice_sml($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: float8,
  });
  const routine20 = createSqlFunction({
    ...base,
    name: "featmorgan_fp",
    member: "routine:$extension:rdkit.featmorgan_fp($extension:rdkit.mol,pg_catalog.int4)",
    arguments: [mol, defaultSqlArgument(int4)] as const,
    result: sfp,
  });
  const routine21 = createSqlFunction({
    ...base,
    name: "featmorganbv_fp",
    member: "routine:$extension:rdkit.featmorganbv_fp($extension:rdkit.mol,pg_catalog.int4)",
    arguments: [mol, defaultSqlArgument(int4)] as const,
    result: bfp,
  });
  const routine22 = createSqlFunction({
    ...base,
    name: "fmcs_smiles_transition",
    member: "routine:$extension:rdkit.fmcs_smiles_transition(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: text,
  });
  const routine23 = createSqlFunction({
    ...base,
    name: "fmcs_smiles",
    member: "routine:$extension:rdkit.fmcs_smiles(pg_catalog.cstring,pg_catalog.cstring)",
    arguments: [cstring, cstring] as const,
    result: cstring,
  });
  const routine24 = createSqlFunction({
    ...base,
    name: "fmcs_smiles",
    member: "routine:$extension:rdkit.fmcs_smiles(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: text,
  });
  const routine25 = createSqlFunction({
    ...base,
    name: "fmcs_smiles",
    member: "routine:$extension:rdkit.fmcs_smiles(pg_catalog.text)",
    arguments: [text] as const,
    result: text,
  });
  const routine26 = createSqlAggregate({
    ...base,
    name: "fmcs",
    member: "routine:$extension:rdkit.fmcs($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: text,
  });
  const routine27 = createSqlAggregate({
    ...base,
    name: "fmcs",
    member: "routine:$extension:rdkit.fmcs(pg_catalog.text)",
    arguments: [text] as const,
    result: text,
  });
  const routine28 = createSqlFunction({
    ...base,
    name: "is_valid_ctab",
    member: "routine:$extension:rdkit.is_valid_ctab(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: bool,
  });
  const routine29 = createSqlFunction({
    ...base,
    name: "is_valid_mol_pkl",
    member: "routine:$extension:rdkit.is_valid_mol_pkl(pg_catalog.bytea)",
    arguments: [bytea] as const,
    result: bool,
  });
  const routine30 = createSqlFunction({
    ...base,
    name: "is_valid_smarts",
    member: "routine:$extension:rdkit.is_valid_smarts(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: bool,
  });
  const routine31 = createSqlFunction({
    ...base,
    name: "is_valid_smiles",
    member: "routine:$extension:rdkit.is_valid_smiles(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: bool,
  });
  const routine32 = createSqlFunction({
    ...base,
    name: "layered_fp",
    member: "routine:$extension:rdkit.layered_fp($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: bfp,
  });
  const routine33 = createSqlFunction({
    ...base,
    name: "maccs_fp",
    member: "routine:$extension:rdkit.maccs_fp($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: bfp,
  });
  const routine34 = createSqlFunction({
    ...base,
    name: "mol_adjust_query_properties",
    member: "routine:$extension:rdkit.mol_adjust_query_properties($extension:rdkit.mol,pg_catalog.cstring)",
    arguments: [mol, defaultSqlArgument(cstring)] as const,
    result: mol,
  });
  const routine35 = createSqlFunction({
    ...base,
    name: "mol_adjust_query_properties",
    member: "routine:$extension:rdkit.mol_adjust_query_properties($extension:rdkit.qmol,pg_catalog.cstring)",
    arguments: [qmol, defaultSqlArgument(cstring)] as const,
    result: qmol,
  });
  const routine36 = createSqlFunction({
    ...base,
    name: "mol_amw",
    member: "routine:$extension:rdkit.mol_amw($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine37 = createSqlFunction({
    ...base,
    name: "mol_chi0n",
    member: "routine:$extension:rdkit.mol_chi0n($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine38 = createSqlFunction({
    ...base,
    name: "mol_chi0v",
    member: "routine:$extension:rdkit.mol_chi0v($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine39 = createSqlFunction({
    ...base,
    name: "mol_chi1n",
    member: "routine:$extension:rdkit.mol_chi1n($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine40 = createSqlFunction({
    ...base,
    name: "mol_chi1v",
    member: "routine:$extension:rdkit.mol_chi1v($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine41 = createSqlFunction({
    ...base,
    name: "mol_chi2n",
    member: "routine:$extension:rdkit.mol_chi2n($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine42 = createSqlFunction({
    ...base,
    name: "mol_chi2v",
    member: "routine:$extension:rdkit.mol_chi2v($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine43 = createSqlFunction({
    ...base,
    name: "mol_chi3n",
    member: "routine:$extension:rdkit.mol_chi3n($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine44 = createSqlFunction({
    ...base,
    name: "mol_chi3v",
    member: "routine:$extension:rdkit.mol_chi3v($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine45 = createSqlFunction({
    ...base,
    name: "mol_chi4n",
    member: "routine:$extension:rdkit.mol_chi4n($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine46 = createSqlFunction({
    ...base,
    name: "mol_chi4v",
    member: "routine:$extension:rdkit.mol_chi4v($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine47 = createSqlFunction({
    ...base,
    name: "mol_cmp",
    member: "routine:$extension:rdkit.mol_cmp($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: int4,
  });
  const routine48 = createSqlFunction({
    ...base,
    name: "mol_eq",
    member: "routine:$extension:rdkit.mol_eq($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine49 = createSqlFunction({
    ...base,
    name: "mol_exactmw",
    member: "routine:$extension:rdkit.mol_exactmw($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine50 = createSqlFunction({
    ...base,
    name: "mol_formula",
    member: "routine:$extension:rdkit.mol_formula($extension:rdkit.mol,pg_catalog.bool,pg_catalog.bool)",
    arguments: [mol, defaultSqlArgument(bool), defaultSqlArgument(bool)] as const,
    result: cstring,
  });
  const routine51 = createSqlFunction({
    ...base,
    name: "mol_fractioncsp3",
    member: "routine:$extension:rdkit.mol_fractioncsp3($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine52 = createSqlFunction({
    ...base,
    name: "mol_from_ctab",
    member:
      "routine:$extension:rdkit.mol_from_ctab(pg_catalog.cstring,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    arguments: [
      cstring,
      defaultSqlArgument(bool, "keep_conformer"),
      defaultSqlArgument(bool, "sanitize"),
      defaultSqlArgument(bool, "remove_hs"),
    ] as const,
    result: mol,
  });
  const routine53 = createSqlFunction({
    ...base,
    name: "mol_from_json",
    member: "routine:$extension:rdkit.mol_from_json(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: mol,
  });
  const routine54 = createSqlFunction({
    ...base,
    name: "mol_from_pkl",
    member: "routine:$extension:rdkit.mol_from_pkl(pg_catalog.bytea)",
    arguments: [bytea] as const,
    result: mol,
  });
  const routine55 = createSqlFunction({
    ...base,
    name: "mol_from_smiles",
    member: "routine:$extension:rdkit.mol_from_smiles(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: mol,
  });
  const routine56 = createSqlFunction({
    ...base,
    name: "mol_from_smiles",
    member: "routine:$extension:rdkit.mol_from_smiles(pg_catalog.text)",
    arguments: [text] as const,
    result: mol,
  });
  const routine57 = createSqlFunction({
    ...base,
    name: "mol_ge",
    member: "routine:$extension:rdkit.mol_ge($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine58 = createSqlFunction({
    ...base,
    name: "mol_gt",
    member: "routine:$extension:rdkit.mol_gt($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine59 = createSqlFunction({
    ...base,
    name: "mol_hallkieralpha",
    member: "routine:$extension:rdkit.mol_hallkieralpha($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine60 = createSqlFunction({
    ...base,
    name: "mol_hba",
    member: "routine:$extension:rdkit.mol_hba($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine61 = createSqlFunction({
    ...base,
    name: "mol_hbd",
    member: "routine:$extension:rdkit.mol_hbd($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine62 = createSqlFunction({
    ...base,
    name: "mol_inchi",
    member: "routine:$extension:rdkit.mol_inchi($extension:rdkit.mol,pg_catalog.cstring)",
    arguments: [mol, defaultSqlArgument(cstring)] as const,
    result: cstring,
  });
  const routine63 = createSqlFunction({
    ...base,
    name: "mol_inchikey",
    member: "routine:$extension:rdkit.mol_inchikey($extension:rdkit.mol,pg_catalog.cstring)",
    arguments: [mol, defaultSqlArgument(cstring)] as const,
    result: cstring,
  });
  const routine64 = createSqlFunction({
    ...base,
    name: "mol_kappa1",
    member: "routine:$extension:rdkit.mol_kappa1($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine65 = createSqlFunction({
    ...base,
    name: "mol_kappa2",
    member: "routine:$extension:rdkit.mol_kappa2($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine66 = createSqlFunction({
    ...base,
    name: "mol_kappa3",
    member: "routine:$extension:rdkit.mol_kappa3($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine67 = createSqlFunction({
    ...base,
    name: "mol_labuteasa",
    member: "routine:$extension:rdkit.mol_labuteasa($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine68 = createSqlFunction({
    ...base,
    name: "mol_le",
    member: "routine:$extension:rdkit.mol_le($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine69 = createSqlFunction({
    ...base,
    name: "mol_logp",
    member: "routine:$extension:rdkit.mol_logp($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine70 = createSqlFunction({
    ...base,
    name: "mol_lt",
    member: "routine:$extension:rdkit.mol_lt($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine71 = createSqlFunction({
    ...base,
    name: "mol_murckoscaffold",
    member: "routine:$extension:rdkit.mol_murckoscaffold($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: mol,
  });
  const routine72 = createSqlFunction({
    ...base,
    name: "mol_ne",
    member: "routine:$extension:rdkit.mol_ne($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine73 = createSqlFunction({
    ...base,
    name: "mol_nm_hash",
    member: "routine:$extension:rdkit.mol_nm_hash($extension:rdkit.mol,pg_catalog.cstring)",
    arguments: [mol, defaultSqlArgument(cstring)] as const,
    result: cstring,
  });
  const routine74 = createSqlFunction({
    ...base,
    name: "mol_numaliphaticcarbocycles",
    member: "routine:$extension:rdkit.mol_numaliphaticcarbocycles($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine75 = createSqlFunction({
    ...base,
    name: "mol_numaliphaticheterocycles",
    member: "routine:$extension:rdkit.mol_numaliphaticheterocycles($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine76 = createSqlFunction({
    ...base,
    name: "mol_numaliphaticrings",
    member: "routine:$extension:rdkit.mol_numaliphaticrings($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine77 = createSqlFunction({
    ...base,
    name: "mol_numamidebonds",
    member: "routine:$extension:rdkit.mol_numamidebonds($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine78 = createSqlFunction({
    ...base,
    name: "mol_numaromaticcarbocycles",
    member: "routine:$extension:rdkit.mol_numaromaticcarbocycles($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine79 = createSqlFunction({
    ...base,
    name: "mol_numaromaticheterocycles",
    member: "routine:$extension:rdkit.mol_numaromaticheterocycles($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine80 = createSqlFunction({
    ...base,
    name: "mol_numaromaticrings",
    member: "routine:$extension:rdkit.mol_numaromaticrings($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine81 = createSqlFunction({
    ...base,
    name: "mol_numatoms",
    member: "routine:$extension:rdkit.mol_numatoms($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine82 = createSqlFunction({
    ...base,
    name: "mol_numbridgeheadatoms",
    member: "routine:$extension:rdkit.mol_numbridgeheadatoms($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine83 = createSqlFunction({
    ...base,
    name: "mol_numheavyatoms",
    member: "routine:$extension:rdkit.mol_numheavyatoms($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine84 = createSqlFunction({
    ...base,
    name: "mol_numheteroatoms",
    member: "routine:$extension:rdkit.mol_numheteroatoms($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine85 = createSqlFunction({
    ...base,
    name: "mol_numheterocycles",
    member: "routine:$extension:rdkit.mol_numheterocycles($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine86 = createSqlFunction({
    ...base,
    name: "mol_numrings",
    member: "routine:$extension:rdkit.mol_numrings($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine87 = createSqlFunction({
    ...base,
    name: "mol_numrotatablebonds",
    member: "routine:$extension:rdkit.mol_numrotatablebonds($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine88 = createSqlFunction({
    ...base,
    name: "mol_numsaturatedcarbocycles",
    member: "routine:$extension:rdkit.mol_numsaturatedcarbocycles($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine89 = createSqlFunction({
    ...base,
    name: "mol_numsaturatedheterocycles",
    member: "routine:$extension:rdkit.mol_numsaturatedheterocycles($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine90 = createSqlFunction({
    ...base,
    name: "mol_numsaturatedrings",
    member: "routine:$extension:rdkit.mol_numsaturatedrings($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine91 = createSqlFunction({
    ...base,
    name: "mol_numspiroatoms",
    member: "routine:$extension:rdkit.mol_numspiroatoms($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: int4,
  });
  const routine92 = createSqlFunction({
    ...base,
    name: "mol_phi",
    member: "routine:$extension:rdkit.mol_phi($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine93 = createSqlFunction({
    ...base,
    name: "mol_send",
    member: "routine:$extension:rdkit.mol_send($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: bytea,
  });
  const routine94 = createSqlFunction({
    ...base,
    name: "mol_to_ctab",
    member: "routine:$extension:rdkit.mol_to_ctab($extension:rdkit.mol,pg_catalog.bool,pg_catalog.bool)",
    arguments: [mol, defaultSqlArgument(bool), defaultSqlArgument(bool)] as const,
    result: cstring,
  });
  const routine95 = createSqlFunction({
    ...base,
    name: "mol_to_cxsmarts",
    member: "routine:$extension:rdkit.mol_to_cxsmarts($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: cstring,
  });
  const routine96 = createSqlFunction({
    ...base,
    name: "mol_to_cxsmarts",
    member: "routine:$extension:rdkit.mol_to_cxsmarts($extension:rdkit.qmol)",
    arguments: [qmol] as const,
    result: cstring,
  });
  const routine97 = createSqlFunction({
    ...base,
    name: "mol_to_cxsmiles",
    member: "routine:$extension:rdkit.mol_to_cxsmiles($extension:rdkit.mol,pg_catalog.bool)",
    arguments: [mol, defaultSqlArgument(bool, "isomeric")] as const,
    result: cstring,
  });
  const routine98 = createSqlFunction({
    ...base,
    name: "mol_to_json",
    member: "routine:$extension:rdkit.mol_to_json($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: cstring,
  });
  const routine99 = createSqlFunction({
    ...base,
    name: "mol_to_json",
    member: "routine:$extension:rdkit.mol_to_json($extension:rdkit.qmol)",
    arguments: [qmol] as const,
    result: cstring,
  });
  const routine100 = createSqlFunction({
    ...base,
    name: "mol_to_pkl",
    member: "routine:$extension:rdkit.mol_to_pkl($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: bytea,
  });
  const routine101 = createSqlFunction({
    ...base,
    name: "mol_to_smarts",
    member: "routine:$extension:rdkit.mol_to_smarts($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: cstring,
  });
  const routine102 = createSqlFunction({
    ...base,
    name: "mol_to_smarts",
    member: "routine:$extension:rdkit.mol_to_smarts($extension:rdkit.qmol)",
    arguments: [qmol] as const,
    result: cstring,
  });
  const routine103 = createSqlFunction({
    ...base,
    name: "mol_to_smiles",
    member: "routine:$extension:rdkit.mol_to_smiles($extension:rdkit.mol,pg_catalog.bool)",
    arguments: [mol, defaultSqlArgument(bool, "isomeric")] as const,
    result: cstring,
  });
  const routine104 = createSqlFunction({
    ...base,
    name: "mol_to_smiles",
    member: "routine:$extension:rdkit.mol_to_smiles($extension:rdkit.qmol)",
    arguments: [qmol] as const,
    result: cstring,
  });
  const routine105 = createSqlFunction({
    ...base,
    name: "mol_to_svg",
    member:
      "routine:$extension:rdkit.mol_to_svg($extension:rdkit.mol,pg_catalog.cstring,pg_catalog.int4,pg_catalog.int4,pg_catalog.cstring)",
    arguments: [
      mol,
      defaultSqlArgument(cstring),
      defaultSqlArgument(int4),
      defaultSqlArgument(int4),
      defaultSqlArgument(cstring),
    ] as const,
    result: cstring,
  });
  const routine106 = createSqlFunction({
    ...base,
    name: "mol_to_svg",
    member:
      "routine:$extension:rdkit.mol_to_svg($extension:rdkit.qmol,pg_catalog.cstring,pg_catalog.int4,pg_catalog.int4,pg_catalog.cstring)",
    arguments: [
      qmol,
      defaultSqlArgument(cstring),
      defaultSqlArgument(int4),
      defaultSqlArgument(int4),
      defaultSqlArgument(cstring),
    ] as const,
    result: cstring,
  });
  const routine107 = createSqlFunction({
    ...base,
    name: "mol_to_v3kctab",
    member: "routine:$extension:rdkit.mol_to_v3kctab($extension:rdkit.mol,pg_catalog.bool)",
    arguments: [mol, defaultSqlArgument(bool)] as const,
    result: cstring,
  });
  const routine108 = createSqlFunction({
    ...base,
    name: "mol_to_xqmol",
    member:
      "routine:$extension:rdkit.mol_to_xqmol($extension:rdkit.mol,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.cstring)",
    arguments: [
      mol,
      defaultSqlArgument(bool),
      defaultSqlArgument(bool),
      defaultSqlArgument(bool),
      defaultSqlArgument(cstring),
    ] as const,
    result: xqmol,
  });
  const routine109 = createSqlFunction({
    ...base,
    name: "mol_tpsa",
    member: "routine:$extension:rdkit.mol_tpsa($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: float4,
  });
  const routine110 = createSqlFunction({
    ...base,
    name: "morgan_fp",
    member: "routine:$extension:rdkit.morgan_fp($extension:rdkit.mol,pg_catalog.int4)",
    arguments: [mol, defaultSqlArgument(int4)] as const,
    result: sfp,
  });
  const routine111 = createSqlFunction({
    ...base,
    name: "morganbv_fp",
    member: "routine:$extension:rdkit.morganbv_fp($extension:rdkit.mol,pg_catalog.int4)",
    arguments: [mol, defaultSqlArgument(int4)] as const,
    result: bfp,
  });
  const routine112 = createSqlFunction({
    ...base,
    name: "qmol_from_ctab",
    member: "routine:$extension:rdkit.qmol_from_ctab(pg_catalog.cstring,pg_catalog.bool,pg_catalog.bool)",
    arguments: [cstring, defaultSqlArgument(bool, "keep_conformer"), defaultSqlArgument(bool, "merge_hs")] as const,
    result: qmol,
  });
  const routine113 = createSqlFunction({
    ...base,
    name: "qmol_from_json",
    member: "routine:$extension:rdkit.qmol_from_json(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: qmol,
  });
  const routine114 = createSqlFunction({
    ...base,
    name: "qmol_from_smarts",
    member: "routine:$extension:rdkit.qmol_from_smarts(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: qmol,
  });
  const routine115 = createSqlFunction({
    ...base,
    name: "qmol_from_smiles",
    member: "routine:$extension:rdkit.qmol_from_smiles(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: qmol,
  });
  const routine116 = createSqlFunction({
    ...base,
    name: "qmol_send",
    member: "routine:$extension:rdkit.qmol_send($extension:rdkit.qmol)",
    arguments: [qmol] as const,
    result: bytea,
  });
  const routine117 = createSqlFunction({
    ...base,
    name: "rdkit_fp",
    member: "routine:$extension:rdkit.rdkit_fp($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: bfp,
  });
  const routine118 = createSqlFunction({
    ...base,
    name: "rdkit_toolkit_version",
    member: "routine:$extension:rdkit.rdkit_toolkit_version()",
    arguments: [] as const,
    result: text,
  });
  const routine119 = createSqlFunction({
    ...base,
    name: "rdkit_version",
    member: "routine:$extension:rdkit.rdkit_version()",
    arguments: [] as const,
    result: text,
  });
  const routine120 = createSqlFunction({
    ...base,
    name: "reaction_difference_fp",
    member: "routine:$extension:rdkit.reaction_difference_fp($extension:rdkit.reaction,pg_catalog.int4)",
    arguments: [reaction, defaultSqlArgument(int4)] as const,
    result: sfp,
  });
  const routine121 = createSqlFunction({
    ...base,
    name: "reaction_eq",
    member: "routine:$extension:rdkit.reaction_eq($extension:rdkit.reaction,$extension:rdkit.reaction)",
    arguments: [reaction, reaction] as const,
    result: bool,
  });
  const routine122 = createSqlFunction({
    ...base,
    name: "reaction_from_ctab",
    member: "routine:$extension:rdkit.reaction_from_ctab(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: reaction,
  });
  const routine123 = createSqlFunction({
    ...base,
    name: "reaction_from_smarts",
    member: "routine:$extension:rdkit.reaction_from_smarts(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: reaction,
  });
  const routine124 = createSqlFunction({
    ...base,
    name: "reaction_from_smiles",
    member: "routine:$extension:rdkit.reaction_from_smiles(pg_catalog.cstring)",
    arguments: [cstring] as const,
    result: reaction,
  });
  const routine125 = createSqlFunction({
    ...base,
    name: "reaction_ne",
    member: "routine:$extension:rdkit.reaction_ne($extension:rdkit.reaction,$extension:rdkit.reaction)",
    arguments: [reaction, reaction] as const,
    result: bool,
  });
  const routine126 = createSqlFunction({
    ...base,
    name: "reaction_numagents",
    member: "routine:$extension:rdkit.reaction_numagents($extension:rdkit.reaction)",
    arguments: [reaction] as const,
    result: int4,
  });
  const routine127 = createSqlFunction({
    ...base,
    name: "reaction_numproducts",
    member: "routine:$extension:rdkit.reaction_numproducts($extension:rdkit.reaction)",
    arguments: [reaction] as const,
    result: int4,
  });
  const routine128 = createSqlFunction({
    ...base,
    name: "reaction_numreactants",
    member: "routine:$extension:rdkit.reaction_numreactants($extension:rdkit.reaction)",
    arguments: [reaction] as const,
    result: int4,
  });
  const routine129 = createSqlFunction({
    ...base,
    name: "reaction_send",
    member: "routine:$extension:rdkit.reaction_send($extension:rdkit.reaction)",
    arguments: [reaction] as const,
    result: bytea,
  });
  const routine130 = createSqlFunction({
    ...base,
    name: "reaction_structural_bfp",
    member: "routine:$extension:rdkit.reaction_structural_bfp($extension:rdkit.reaction,pg_catalog.int4)",
    arguments: [reaction, defaultSqlArgument(int4)] as const,
    result: bfp,
  });
  const routine131 = createSqlFunction({
    ...base,
    name: "reaction_to_ctab",
    member: "routine:$extension:rdkit.reaction_to_ctab($extension:rdkit.reaction)",
    arguments: [reaction] as const,
    result: cstring,
  });
  const routine132 = createSqlFunction({
    ...base,
    name: "reaction_to_smarts",
    member: "routine:$extension:rdkit.reaction_to_smarts($extension:rdkit.reaction)",
    arguments: [reaction] as const,
    result: cstring,
  });
  const routine133 = createSqlFunction({
    ...base,
    name: "reaction_to_smiles",
    member: "routine:$extension:rdkit.reaction_to_smiles($extension:rdkit.reaction)",
    arguments: [reaction] as const,
    result: cstring,
  });
  const routine134 = createSqlFunction({
    ...base,
    name: "reaction_to_svg",
    member:
      "routine:$extension:rdkit.reaction_to_svg($extension:rdkit.reaction,pg_catalog.bool,pg_catalog.int4,pg_catalog.int4,pg_catalog.cstring)",
    arguments: [
      reaction,
      defaultSqlArgument(bool),
      defaultSqlArgument(int4),
      defaultSqlArgument(int4),
      defaultSqlArgument(cstring),
    ] as const,
    result: cstring,
  });
  const routine135 = createSqlFunction({
    ...base,
    name: "rsubstruct_chiral",
    member: "routine:$extension:rdkit.rsubstruct_chiral($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine136 = createSqlFunction({
    ...base,
    name: "rsubstruct_query",
    member: "routine:$extension:rdkit.rsubstruct_query($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine137 = createSqlFunction({
    ...base,
    name: "rsubstruct_query",
    member: "routine:$extension:rdkit.rsubstruct_query($extension:rdkit.qmol,$extension:rdkit.mol)",
    arguments: [qmol, mol] as const,
    result: bool,
  });
  const routine138 = createSqlFunction({
    ...base,
    name: "rsubstruct_query",
    member: "routine:$extension:rdkit.rsubstruct_query($extension:rdkit.xqmol,$extension:rdkit.mol)",
    arguments: [xqmol, mol] as const,
    result: bool,
  });
  const routine139 = createSqlFunction({
    ...base,
    name: "rsubstruct",
    member: "routine:$extension:rdkit.rsubstruct($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine140 = createSqlFunction({
    ...base,
    name: "rsubstruct",
    member: "routine:$extension:rdkit.rsubstruct($extension:rdkit.qmol,$extension:rdkit.mol)",
    arguments: [qmol, mol] as const,
    result: bool,
  });
  const routine141 = createSqlFunction({
    ...base,
    name: "rsubstruct",
    member: "routine:$extension:rdkit.rsubstruct($extension:rdkit.reaction,$extension:rdkit.reaction)",
    arguments: [reaction, reaction] as const,
    result: bool,
  });
  const routine142 = createSqlFunction({
    ...base,
    name: "rsubstruct",
    member: "routine:$extension:rdkit.rsubstruct($extension:rdkit.xqmol,$extension:rdkit.mol)",
    arguments: [xqmol, mol] as const,
    result: bool,
  });
  const routine143 = createSqlFunction({
    ...base,
    name: "rsubstructfp",
    member: "routine:$extension:rdkit.rsubstructfp($extension:rdkit.reaction,$extension:rdkit.reaction)",
    arguments: [reaction, reaction] as const,
    result: bool,
  });
  const routine144 = createSqlFunction({
    ...base,
    name: "sfp_cmp",
    member: "routine:$extension:rdkit.sfp_cmp($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: int4,
  });
  const routine145 = createSqlFunction({
    ...base,
    name: "sfp_eq",
    member: "routine:$extension:rdkit.sfp_eq($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: bool,
  });
  const routine146 = createSqlFunction({
    ...base,
    name: "sfp_ge",
    member: "routine:$extension:rdkit.sfp_ge($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: bool,
  });
  const routine147 = createSqlFunction({
    ...base,
    name: "sfp_gt",
    member: "routine:$extension:rdkit.sfp_gt($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: bool,
  });
  const routine148 = createSqlFunction({
    ...base,
    name: "sfp_le",
    member: "routine:$extension:rdkit.sfp_le($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: bool,
  });
  const routine149 = createSqlFunction({
    ...base,
    name: "sfp_lt",
    member: "routine:$extension:rdkit.sfp_lt($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: bool,
  });
  const routine150 = createSqlFunction({
    ...base,
    name: "sfp_ne",
    member: "routine:$extension:rdkit.sfp_ne($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: bool,
  });
  const routine151 = createSqlFunction({
    ...base,
    name: "size",
    member: "routine:$extension:rdkit.size($extension:rdkit.bfp)",
    arguments: [bfp] as const,
    result: int4,
  });
  const routine152 = createSqlFunction({
    ...base,
    name: "substruct_chiral",
    member: "routine:$extension:rdkit.substruct_chiral($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine153 = createSqlFunction({
    ...base,
    name: "substruct_count_chiral",
    member:
      "routine:$extension:rdkit.substruct_count_chiral($extension:rdkit.mol,$extension:rdkit.mol,pg_catalog.bool)",
    arguments: [mol, mol, defaultSqlArgument(bool)] as const,
    result: int4,
  });
  const routine154 = createSqlFunction({
    ...base,
    name: "substruct_count_chiral",
    member:
      "routine:$extension:rdkit.substruct_count_chiral($extension:rdkit.mol,$extension:rdkit.qmol,pg_catalog.bool)",
    arguments: [mol, qmol, defaultSqlArgument(bool)] as const,
    result: int4,
  });
  const routine155 = createSqlFunction({
    ...base,
    name: "substruct_count",
    member: "routine:$extension:rdkit.substruct_count($extension:rdkit.mol,$extension:rdkit.mol,pg_catalog.bool)",
    arguments: [mol, mol, defaultSqlArgument(bool)] as const,
    result: int4,
  });
  const routine156 = createSqlFunction({
    ...base,
    name: "substruct_count",
    member: "routine:$extension:rdkit.substruct_count($extension:rdkit.mol,$extension:rdkit.qmol,pg_catalog.bool)",
    arguments: [mol, qmol, defaultSqlArgument(bool)] as const,
    result: int4,
  });
  const routine157 = createSqlFunction({
    ...base,
    name: "substruct_query",
    member: "routine:$extension:rdkit.substruct_query($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine158 = createSqlFunction({
    ...base,
    name: "substruct_query",
    member: "routine:$extension:rdkit.substruct_query($extension:rdkit.mol,$extension:rdkit.qmol)",
    arguments: [mol, qmol] as const,
    result: bool,
  });
  const routine159 = createSqlFunction({
    ...base,
    name: "substruct_query",
    member: "routine:$extension:rdkit.substruct_query($extension:rdkit.mol,$extension:rdkit.xqmol)",
    arguments: [mol, xqmol] as const,
    result: bool,
  });
  const routine160 = createSqlFunction({
    ...base,
    name: "substruct",
    member: "routine:$extension:rdkit.substruct($extension:rdkit.mol,$extension:rdkit.mol)",
    arguments: [mol, mol] as const,
    result: bool,
  });
  const routine161 = createSqlFunction({
    ...base,
    name: "substruct",
    member: "routine:$extension:rdkit.substruct($extension:rdkit.mol,$extension:rdkit.qmol)",
    arguments: [mol, qmol] as const,
    result: bool,
  });
  const routine162 = createSqlFunction({
    ...base,
    name: "substruct",
    member: "routine:$extension:rdkit.substruct($extension:rdkit.mol,$extension:rdkit.xqmol)",
    arguments: [mol, xqmol] as const,
    result: bool,
  });
  const routine163 = createSqlFunction({
    ...base,
    name: "substruct",
    member: "routine:$extension:rdkit.substruct($extension:rdkit.reaction,$extension:rdkit.reaction)",
    arguments: [reaction, reaction] as const,
    result: bool,
  });
  const routine164 = createSqlFunction({
    ...base,
    name: "substructfp",
    member: "routine:$extension:rdkit.substructfp($extension:rdkit.reaction,$extension:rdkit.reaction)",
    arguments: [reaction, reaction] as const,
    result: bool,
  });
  const routine165 = createSqlFunction({
    ...base,
    name: "subtract",
    member: "routine:$extension:rdkit.subtract($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: sfp,
  });
  const routine166 = createSqlFunction({
    ...base,
    name: "tanimoto_dist",
    member: "routine:$extension:rdkit.tanimoto_dist($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: float8,
  });
  const routine167 = createSqlFunction({
    ...base,
    name: "tanimoto_sml_op",
    member: "routine:$extension:rdkit.tanimoto_sml_op($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: bool,
  });
  const routine168 = createSqlFunction({
    ...base,
    name: "tanimoto_sml_op",
    member: "routine:$extension:rdkit.tanimoto_sml_op($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: bool,
  });
  const routine169 = createSqlFunction({
    ...base,
    name: "tanimoto_sml",
    member: "routine:$extension:rdkit.tanimoto_sml($extension:rdkit.bfp,$extension:rdkit.bfp)",
    arguments: [bfp, bfp] as const,
    result: float8,
  });
  const routine170 = createSqlFunction({
    ...base,
    name: "tanimoto_sml",
    member: "routine:$extension:rdkit.tanimoto_sml($extension:rdkit.sfp,$extension:rdkit.sfp)",
    arguments: [sfp, sfp] as const,
    result: float8,
  });
  const routine171 = createSqlFunction({
    ...base,
    name: "torsion_fp",
    member: "routine:$extension:rdkit.torsion_fp($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: sfp,
  });
  const routine172 = createSqlFunction({
    ...base,
    name: "torsionbv_fp",
    member: "routine:$extension:rdkit.torsionbv_fp($extension:rdkit.mol)",
    arguments: [mol] as const,
    result: bfp,
  });
  const routine173 = createSqlFunction({
    ...base,
    name: "tversky_sml",
    member:
      "routine:$extension:rdkit.tversky_sml($extension:rdkit.bfp,$extension:rdkit.bfp,pg_catalog.float4,pg_catalog.float4)",
    arguments: [bfp, bfp, float4, float4] as const,
    result: float8,
  });
  const routine174 = createSqlFunction({
    ...base,
    name: "xqmol_send",
    member: "routine:$extension:rdkit.xqmol_send($extension:rdkit.xqmol)",
    arguments: [xqmol] as const,
    result: bytea,
  });
  const operator0 = createSqlOperator({
    ...base,
    name: "?<",
    member: "operator:$extension:rdkit.?<($extension:rdkit.reaction,$extension:rdkit.reaction)",
    left: reaction,
    right: reaction,
    result: bool,
  });
  const operator1 = createSqlOperator({
    ...base,
    name: "?>",
    member: "operator:$extension:rdkit.?>($extension:rdkit.reaction,$extension:rdkit.reaction)",
    left: reaction,
    right: reaction,
    result: bool,
  });
  const operator2 = createSqlOperator({
    ...base,
    name: "@<>",
    member: "operator:$extension:rdkit.@<>($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator3 = createSqlOperator({
    ...base,
    name: "@<>",
    member: "operator:$extension:rdkit.@<>($extension:rdkit.reaction,$extension:rdkit.reaction)",
    left: reaction,
    right: reaction,
    result: bool,
  });
  const operator4 = createSqlOperator({
    ...base,
    name: "@=",
    member: "operator:$extension:rdkit.@=($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator5 = createSqlOperator({
    ...base,
    name: "@=",
    member: "operator:$extension:rdkit.@=($extension:rdkit.reaction,$extension:rdkit.reaction)",
    left: reaction,
    right: reaction,
    result: bool,
  });
  const operator6 = createSqlOperator({
    ...base,
    name: "@>",
    member: "operator:$extension:rdkit.@>($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator7 = createSqlOperator({
    ...base,
    name: "@>",
    member: "operator:$extension:rdkit.@>($extension:rdkit.mol,$extension:rdkit.qmol)",
    left: mol,
    right: qmol,
    result: bool,
  });
  const operator8 = createSqlOperator({
    ...base,
    name: "@>",
    member: "operator:$extension:rdkit.@>($extension:rdkit.mol,$extension:rdkit.xqmol)",
    left: mol,
    right: xqmol,
    result: bool,
  });
  const operator9 = createSqlOperator({
    ...base,
    name: "@>",
    member: "operator:$extension:rdkit.@>($extension:rdkit.reaction,$extension:rdkit.reaction)",
    left: reaction,
    right: reaction,
    result: bool,
  });
  const operator10 = createSqlOperator({
    ...base,
    name: "@>>",
    member: "operator:$extension:rdkit.@>>($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator11 = createSqlOperator({
    ...base,
    name: "@>>",
    member: "operator:$extension:rdkit.@>>($extension:rdkit.mol,$extension:rdkit.qmol)",
    left: mol,
    right: qmol,
    result: bool,
  });
  const operator12 = createSqlOperator({
    ...base,
    name: "@>>",
    member: "operator:$extension:rdkit.@>>($extension:rdkit.mol,$extension:rdkit.xqmol)",
    left: mol,
    right: xqmol,
    result: bool,
  });
  const operator13 = createSqlOperator({
    ...base,
    name: "#",
    member: "operator:$extension:rdkit.#($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: bool,
  });
  const operator14 = createSqlOperator({
    ...base,
    name: "#",
    member: "operator:$extension:rdkit.#($extension:rdkit.sfp,$extension:rdkit.sfp)",
    left: sfp,
    right: sfp,
    result: bool,
  });
  const operator15 = createSqlOperator({
    ...base,
    name: "%",
    member: "operator:$extension:rdkit.%($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: bool,
  });
  const operator16 = createSqlOperator({
    ...base,
    name: "%",
    member: "operator:$extension:rdkit.%($extension:rdkit.sfp,$extension:rdkit.sfp)",
    left: sfp,
    right: sfp,
    result: bool,
  });
  const operator17 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:rdkit.<($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: bool,
  });
  const operator18 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:rdkit.<($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator19 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:rdkit.<($extension:rdkit.sfp,$extension:rdkit.sfp)",
    left: sfp,
    right: sfp,
    result: bool,
  });
  const operator20 = createSqlOperator({
    ...base,
    name: "<@",
    member: "operator:$extension:rdkit.<@($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator21 = createSqlOperator({
    ...base,
    name: "<@",
    member: "operator:$extension:rdkit.<@($extension:rdkit.qmol,$extension:rdkit.mol)",
    left: qmol,
    right: mol,
    result: bool,
  });
  const operator22 = createSqlOperator({
    ...base,
    name: "<@",
    member: "operator:$extension:rdkit.<@($extension:rdkit.reaction,$extension:rdkit.reaction)",
    left: reaction,
    right: reaction,
    result: bool,
  });
  const operator23 = createSqlOperator({
    ...base,
    name: "<@",
    member: "operator:$extension:rdkit.<@($extension:rdkit.xqmol,$extension:rdkit.mol)",
    left: xqmol,
    right: mol,
    result: bool,
  });
  const operator24 = createSqlOperator({
    ...base,
    name: "<#>",
    member: "operator:$extension:rdkit.<#>($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: float8,
  });
  const operator25 = createSqlOperator({
    ...base,
    name: "<%>",
    member: "operator:$extension:rdkit.<%>($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: float8,
  });
  const operator26 = createSqlOperator({
    ...base,
    name: "<<@",
    member: "operator:$extension:rdkit.<<@($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator27 = createSqlOperator({
    ...base,
    name: "<<@",
    member: "operator:$extension:rdkit.<<@($extension:rdkit.qmol,$extension:rdkit.mol)",
    left: qmol,
    right: mol,
    result: bool,
  });
  const operator28 = createSqlOperator({
    ...base,
    name: "<<@",
    member: "operator:$extension:rdkit.<<@($extension:rdkit.xqmol,$extension:rdkit.mol)",
    left: xqmol,
    right: mol,
    result: bool,
  });
  const operator29 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:rdkit.<=($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: bool,
  });
  const operator30 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:rdkit.<=($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator31 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:rdkit.<=($extension:rdkit.sfp,$extension:rdkit.sfp)",
    left: sfp,
    right: sfp,
    result: bool,
  });
  const operator32 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:rdkit.<>($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: bool,
  });
  const operator33 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:rdkit.<>($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator34 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:rdkit.<>($extension:rdkit.reaction,$extension:rdkit.reaction)",
    left: reaction,
    right: reaction,
    result: bool,
  });
  const operator35 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:rdkit.<>($extension:rdkit.sfp,$extension:rdkit.sfp)",
    left: sfp,
    right: sfp,
    result: bool,
  });
  const operator36 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:rdkit.=($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: bool,
  });
  const operator37 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:rdkit.=($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator38 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:rdkit.=($extension:rdkit.reaction,$extension:rdkit.reaction)",
    left: reaction,
    right: reaction,
    result: bool,
  });
  const operator39 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:rdkit.=($extension:rdkit.sfp,$extension:rdkit.sfp)",
    left: sfp,
    right: sfp,
    result: bool,
  });
  const operator40 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:rdkit.>($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: bool,
  });
  const operator41 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:rdkit.>($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator42 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:rdkit.>($extension:rdkit.sfp,$extension:rdkit.sfp)",
    left: sfp,
    right: sfp,
    result: bool,
  });
  const operator43 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:rdkit.>=($extension:rdkit.bfp,$extension:rdkit.bfp)",
    left: bfp,
    right: bfp,
    result: bool,
  });
  const operator44 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:rdkit.>=($extension:rdkit.mol,$extension:rdkit.mol)",
    left: mol,
    right: mol,
    result: bool,
  });
  const operator45 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:rdkit.>=($extension:rdkit.sfp,$extension:rdkit.sfp)",
    left: sfp,
    right: sfp,
    result: bool,
  });
  const functions = Object.freeze({
    add: routine0,
    all_values_gt: routine1,
    all_values_lt: routine2,
    atompair_fp: routine3,
    atompairbv_fp: routine4,
    avalon_fp: routine5,
    bfp_cmp: routine6,
    bfp_eq: routine7,
    bfp_from_binary_text: routine8,
    bfp_ge: routine9,
    bfp_gt: routine10,
    bfp_le: routine11,
    bfp_lt: routine12,
    bfp_ne: routine13,
    bfp_to_binary_text: routine14,
    dice_dist: routine15,
    dice_sml: Object.freeze({
      bfp_bfp: routine18,
      sfp_sfp: routine19,
    }),
    dice_sml_op: Object.freeze({
      bfp_bfp: routine16,
      sfp_sfp: routine17,
    }),
    featmorgan_fp: routine20,
    featmorganbv_fp: routine21,
    fmcs: Object.freeze({
      mol: routine26,
      text: routine27,
    }),
    fmcs_smiles: Object.freeze({
      cstring_cstring: routine23,
      text_text: routine24,
      text: routine25,
    }),
    fmcs_smiles_transition: routine22,
    is_valid_ctab: routine28,
    is_valid_mol_pkl: routine29,
    is_valid_smarts: routine30,
    is_valid_smiles: routine31,
    layered_fp: routine32,
    maccs_fp: routine33,
    mol_adjust_query_properties: Object.freeze({
      mol_cstring: routine34,
      qmol_cstring: routine35,
    }),
    mol_amw: routine36,
    mol_chi0n: routine37,
    mol_chi0v: routine38,
    mol_chi1n: routine39,
    mol_chi1v: routine40,
    mol_chi2n: routine41,
    mol_chi2v: routine42,
    mol_chi3n: routine43,
    mol_chi3v: routine44,
    mol_chi4n: routine45,
    mol_chi4v: routine46,
    mol_cmp: routine47,
    mol_eq: routine48,
    mol_exactmw: routine49,
    mol_formula: routine50,
    mol_fractioncsp3: routine51,
    mol_from_ctab: routine52,
    mol_from_json: routine53,
    mol_from_pkl: routine54,
    mol_from_smiles: Object.freeze({
      cstring: routine55,
      text: routine56,
    }),
    mol_ge: routine57,
    mol_gt: routine58,
    mol_hallkieralpha: routine59,
    mol_hba: routine60,
    mol_hbd: routine61,
    mol_inchi: routine62,
    mol_inchikey: routine63,
    mol_kappa1: routine64,
    mol_kappa2: routine65,
    mol_kappa3: routine66,
    mol_labuteasa: routine67,
    mol_le: routine68,
    mol_logp: routine69,
    mol_lt: routine70,
    mol_murckoscaffold: routine71,
    mol_ne: routine72,
    mol_nm_hash: routine73,
    mol_numaliphaticcarbocycles: routine74,
    mol_numaliphaticheterocycles: routine75,
    mol_numaliphaticrings: routine76,
    mol_numamidebonds: routine77,
    mol_numaromaticcarbocycles: routine78,
    mol_numaromaticheterocycles: routine79,
    mol_numaromaticrings: routine80,
    mol_numatoms: routine81,
    mol_numbridgeheadatoms: routine82,
    mol_numheavyatoms: routine83,
    mol_numheteroatoms: routine84,
    mol_numheterocycles: routine85,
    mol_numrings: routine86,
    mol_numrotatablebonds: routine87,
    mol_numsaturatedcarbocycles: routine88,
    mol_numsaturatedheterocycles: routine89,
    mol_numsaturatedrings: routine90,
    mol_numspiroatoms: routine91,
    mol_phi: routine92,
    mol_send: routine93,
    mol_to_ctab: routine94,
    mol_to_cxsmarts: Object.freeze({
      mol: routine95,
      qmol: routine96,
    }),
    mol_to_cxsmiles: routine97,
    mol_to_json: Object.freeze({
      mol: routine98,
      qmol: routine99,
    }),
    mol_to_pkl: routine100,
    mol_to_smarts: Object.freeze({
      mol: routine101,
      qmol: routine102,
    }),
    mol_to_smiles: Object.freeze({
      mol_bool: routine103,
      qmol: routine104,
    }),
    mol_to_svg: Object.freeze({
      mol_cstring_int4_int4_cstring: routine105,
      qmol_cstring_int4_int4_cstring: routine106,
    }),
    mol_to_v3kctab: routine107,
    mol_to_xqmol: routine108,
    mol_tpsa: routine109,
    morgan_fp: routine110,
    morganbv_fp: routine111,
    qmol_from_ctab: routine112,
    qmol_from_json: routine113,
    qmol_from_smarts: routine114,
    qmol_from_smiles: routine115,
    qmol_send: routine116,
    rdkit_fp: routine117,
    rdkit_toolkit_version: routine118,
    rdkit_version: routine119,
    reaction_difference_fp: routine120,
    reaction_eq: routine121,
    reaction_from_ctab: routine122,
    reaction_from_smarts: routine123,
    reaction_from_smiles: routine124,
    reaction_ne: routine125,
    reaction_numagents: routine126,
    reaction_numproducts: routine127,
    reaction_numreactants: routine128,
    reaction_send: routine129,
    reaction_structural_bfp: routine130,
    reaction_to_ctab: routine131,
    reaction_to_smarts: routine132,
    reaction_to_smiles: routine133,
    reaction_to_svg: routine134,
    rsubstruct: Object.freeze({
      mol_mol: routine139,
      qmol_mol: routine140,
      reaction_reaction: routine141,
      xqmol_mol: routine142,
    }),
    rsubstruct_chiral: routine135,
    rsubstruct_query: Object.freeze({
      mol_mol: routine136,
      qmol_mol: routine137,
      xqmol_mol: routine138,
    }),
    rsubstructfp: routine143,
    sfp_cmp: routine144,
    sfp_eq: routine145,
    sfp_ge: routine146,
    sfp_gt: routine147,
    sfp_le: routine148,
    sfp_lt: routine149,
    sfp_ne: routine150,
    size: routine151,
    substruct: Object.freeze({
      mol_mol: routine160,
      mol_qmol: routine161,
      mol_xqmol: routine162,
      reaction_reaction: routine163,
    }),
    substruct_chiral: routine152,
    substruct_count: Object.freeze({
      mol_mol_bool: routine155,
      mol_qmol_bool: routine156,
    }),
    substruct_count_chiral: Object.freeze({
      mol_mol_bool: routine153,
      mol_qmol_bool: routine154,
    }),
    substruct_query: Object.freeze({
      mol_mol: routine157,
      mol_qmol: routine158,
      mol_xqmol: routine159,
    }),
    substructfp: routine164,
    subtract: routine165,
    tanimoto_dist: routine166,
    tanimoto_sml: Object.freeze({
      bfp_bfp: routine169,
      sfp_sfp: routine170,
    }),
    tanimoto_sml_op: Object.freeze({
      bfp_bfp: routine167,
      sfp_sfp: routine168,
    }),
    torsion_fp: routine171,
    torsionbv_fp: routine172,
    tversky_sml: routine173,
    xqmol_send: routine174,
  });
  const operators = Object.freeze({
    "?<": operator0,
    "?>": operator1,
    "@<>": Object.freeze({
      mol_mol: operator2,
      reaction_reaction: operator3,
    }),
    "@=": Object.freeze({
      mol_mol: operator4,
      reaction_reaction: operator5,
    }),
    "@>": Object.freeze({
      mol_mol: operator6,
      mol_qmol: operator7,
      mol_xqmol: operator8,
      reaction_reaction: operator9,
    }),
    "@>>": Object.freeze({
      mol_mol: operator10,
      mol_qmol: operator11,
      mol_xqmol: operator12,
    }),
    "#": Object.freeze({
      bfp_bfp: operator13,
      sfp_sfp: operator14,
    }),
    "%": Object.freeze({
      bfp_bfp: operator15,
      sfp_sfp: operator16,
    }),
    "<": Object.freeze({
      bfp_bfp: operator17,
      mol_mol: operator18,
      sfp_sfp: operator19,
    }),
    "<@": Object.freeze({
      mol_mol: operator20,
      qmol_mol: operator21,
      reaction_reaction: operator22,
      xqmol_mol: operator23,
    }),
    "<#>": operator24,
    "<%>": operator25,
    "<<@": Object.freeze({
      mol_mol: operator26,
      qmol_mol: operator27,
      xqmol_mol: operator28,
    }),
    "<=": Object.freeze({
      bfp_bfp: operator29,
      mol_mol: operator30,
      sfp_sfp: operator31,
    }),
    "<>": Object.freeze({
      bfp_bfp: operator32,
      mol_mol: operator33,
      reaction_reaction: operator34,
      sfp_sfp: operator35,
    }),
    "=": Object.freeze({
      bfp_bfp: operator36,
      mol_mol: operator37,
      reaction_reaction: operator38,
      sfp_sfp: operator39,
    }),
    ">": Object.freeze({
      bfp_bfp: operator40,
      mol_mol: operator41,
      sfp_sfp: operator42,
    }),
    ">=": Object.freeze({
      bfp_bfp: operator43,
      mol_mol: operator44,
      sfp_sfp: operator45,
    }),
  });
  const overloads = Object.freeze({
    "routine:$extension:rdkit.add($extension:rdkit.sfp,$extension:rdkit.sfp)": routine0,
    "routine:$extension:rdkit.all_values_gt($extension:rdkit.sfp,pg_catalog.int4)": routine1,
    "routine:$extension:rdkit.all_values_lt($extension:rdkit.sfp,pg_catalog.int4)": routine2,
    "routine:$extension:rdkit.atompair_fp($extension:rdkit.mol)": routine3,
    "routine:$extension:rdkit.atompairbv_fp($extension:rdkit.mol)": routine4,
    "routine:$extension:rdkit.avalon_fp($extension:rdkit.mol,pg_catalog.bool,pg_catalog.int4)": routine5,
    "routine:$extension:rdkit.bfp_cmp($extension:rdkit.bfp,$extension:rdkit.bfp)": routine6,
    "routine:$extension:rdkit.bfp_eq($extension:rdkit.bfp,$extension:rdkit.bfp)": routine7,
    "routine:$extension:rdkit.bfp_from_binary_text(pg_catalog.bytea)": routine8,
    "routine:$extension:rdkit.bfp_ge($extension:rdkit.bfp,$extension:rdkit.bfp)": routine9,
    "routine:$extension:rdkit.bfp_gt($extension:rdkit.bfp,$extension:rdkit.bfp)": routine10,
    "routine:$extension:rdkit.bfp_le($extension:rdkit.bfp,$extension:rdkit.bfp)": routine11,
    "routine:$extension:rdkit.bfp_lt($extension:rdkit.bfp,$extension:rdkit.bfp)": routine12,
    "routine:$extension:rdkit.bfp_ne($extension:rdkit.bfp,$extension:rdkit.bfp)": routine13,
    "routine:$extension:rdkit.bfp_to_binary_text($extension:rdkit.bfp)": routine14,
    "routine:$extension:rdkit.dice_dist($extension:rdkit.bfp,$extension:rdkit.bfp)": routine15,
    "routine:$extension:rdkit.dice_sml_op($extension:rdkit.bfp,$extension:rdkit.bfp)": routine16,
    "routine:$extension:rdkit.dice_sml_op($extension:rdkit.sfp,$extension:rdkit.sfp)": routine17,
    "routine:$extension:rdkit.dice_sml($extension:rdkit.bfp,$extension:rdkit.bfp)": routine18,
    "routine:$extension:rdkit.dice_sml($extension:rdkit.sfp,$extension:rdkit.sfp)": routine19,
    "routine:$extension:rdkit.featmorgan_fp($extension:rdkit.mol,pg_catalog.int4)": routine20,
    "routine:$extension:rdkit.featmorganbv_fp($extension:rdkit.mol,pg_catalog.int4)": routine21,
    "routine:$extension:rdkit.fmcs_smiles_transition(pg_catalog.text,pg_catalog.text)": routine22,
    "routine:$extension:rdkit.fmcs_smiles(pg_catalog.cstring,pg_catalog.cstring)": routine23,
    "routine:$extension:rdkit.fmcs_smiles(pg_catalog.text,pg_catalog.text)": routine24,
    "routine:$extension:rdkit.fmcs_smiles(pg_catalog.text)": routine25,
    "routine:$extension:rdkit.fmcs($extension:rdkit.mol)": routine26,
    "routine:$extension:rdkit.fmcs(pg_catalog.text)": routine27,
    "routine:$extension:rdkit.is_valid_ctab(pg_catalog.cstring)": routine28,
    "routine:$extension:rdkit.is_valid_mol_pkl(pg_catalog.bytea)": routine29,
    "routine:$extension:rdkit.is_valid_smarts(pg_catalog.cstring)": routine30,
    "routine:$extension:rdkit.is_valid_smiles(pg_catalog.cstring)": routine31,
    "routine:$extension:rdkit.layered_fp($extension:rdkit.mol)": routine32,
    "routine:$extension:rdkit.maccs_fp($extension:rdkit.mol)": routine33,
    "routine:$extension:rdkit.mol_adjust_query_properties($extension:rdkit.mol,pg_catalog.cstring)": routine34,
    "routine:$extension:rdkit.mol_adjust_query_properties($extension:rdkit.qmol,pg_catalog.cstring)": routine35,
    "routine:$extension:rdkit.mol_amw($extension:rdkit.mol)": routine36,
    "routine:$extension:rdkit.mol_chi0n($extension:rdkit.mol)": routine37,
    "routine:$extension:rdkit.mol_chi0v($extension:rdkit.mol)": routine38,
    "routine:$extension:rdkit.mol_chi1n($extension:rdkit.mol)": routine39,
    "routine:$extension:rdkit.mol_chi1v($extension:rdkit.mol)": routine40,
    "routine:$extension:rdkit.mol_chi2n($extension:rdkit.mol)": routine41,
    "routine:$extension:rdkit.mol_chi2v($extension:rdkit.mol)": routine42,
    "routine:$extension:rdkit.mol_chi3n($extension:rdkit.mol)": routine43,
    "routine:$extension:rdkit.mol_chi3v($extension:rdkit.mol)": routine44,
    "routine:$extension:rdkit.mol_chi4n($extension:rdkit.mol)": routine45,
    "routine:$extension:rdkit.mol_chi4v($extension:rdkit.mol)": routine46,
    "routine:$extension:rdkit.mol_cmp($extension:rdkit.mol,$extension:rdkit.mol)": routine47,
    "routine:$extension:rdkit.mol_eq($extension:rdkit.mol,$extension:rdkit.mol)": routine48,
    "routine:$extension:rdkit.mol_exactmw($extension:rdkit.mol)": routine49,
    "routine:$extension:rdkit.mol_formula($extension:rdkit.mol,pg_catalog.bool,pg_catalog.bool)": routine50,
    "routine:$extension:rdkit.mol_fractioncsp3($extension:rdkit.mol)": routine51,
    "routine:$extension:rdkit.mol_from_ctab(pg_catalog.cstring,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      routine52,
    "routine:$extension:rdkit.mol_from_json(pg_catalog.cstring)": routine53,
    "routine:$extension:rdkit.mol_from_pkl(pg_catalog.bytea)": routine54,
    "routine:$extension:rdkit.mol_from_smiles(pg_catalog.cstring)": routine55,
    "routine:$extension:rdkit.mol_from_smiles(pg_catalog.text)": routine56,
    "routine:$extension:rdkit.mol_ge($extension:rdkit.mol,$extension:rdkit.mol)": routine57,
    "routine:$extension:rdkit.mol_gt($extension:rdkit.mol,$extension:rdkit.mol)": routine58,
    "routine:$extension:rdkit.mol_hallkieralpha($extension:rdkit.mol)": routine59,
    "routine:$extension:rdkit.mol_hba($extension:rdkit.mol)": routine60,
    "routine:$extension:rdkit.mol_hbd($extension:rdkit.mol)": routine61,
    "routine:$extension:rdkit.mol_inchi($extension:rdkit.mol,pg_catalog.cstring)": routine62,
    "routine:$extension:rdkit.mol_inchikey($extension:rdkit.mol,pg_catalog.cstring)": routine63,
    "routine:$extension:rdkit.mol_kappa1($extension:rdkit.mol)": routine64,
    "routine:$extension:rdkit.mol_kappa2($extension:rdkit.mol)": routine65,
    "routine:$extension:rdkit.mol_kappa3($extension:rdkit.mol)": routine66,
    "routine:$extension:rdkit.mol_labuteasa($extension:rdkit.mol)": routine67,
    "routine:$extension:rdkit.mol_le($extension:rdkit.mol,$extension:rdkit.mol)": routine68,
    "routine:$extension:rdkit.mol_logp($extension:rdkit.mol)": routine69,
    "routine:$extension:rdkit.mol_lt($extension:rdkit.mol,$extension:rdkit.mol)": routine70,
    "routine:$extension:rdkit.mol_murckoscaffold($extension:rdkit.mol)": routine71,
    "routine:$extension:rdkit.mol_ne($extension:rdkit.mol,$extension:rdkit.mol)": routine72,
    "routine:$extension:rdkit.mol_nm_hash($extension:rdkit.mol,pg_catalog.cstring)": routine73,
    "routine:$extension:rdkit.mol_numaliphaticcarbocycles($extension:rdkit.mol)": routine74,
    "routine:$extension:rdkit.mol_numaliphaticheterocycles($extension:rdkit.mol)": routine75,
    "routine:$extension:rdkit.mol_numaliphaticrings($extension:rdkit.mol)": routine76,
    "routine:$extension:rdkit.mol_numamidebonds($extension:rdkit.mol)": routine77,
    "routine:$extension:rdkit.mol_numaromaticcarbocycles($extension:rdkit.mol)": routine78,
    "routine:$extension:rdkit.mol_numaromaticheterocycles($extension:rdkit.mol)": routine79,
    "routine:$extension:rdkit.mol_numaromaticrings($extension:rdkit.mol)": routine80,
    "routine:$extension:rdkit.mol_numatoms($extension:rdkit.mol)": routine81,
    "routine:$extension:rdkit.mol_numbridgeheadatoms($extension:rdkit.mol)": routine82,
    "routine:$extension:rdkit.mol_numheavyatoms($extension:rdkit.mol)": routine83,
    "routine:$extension:rdkit.mol_numheteroatoms($extension:rdkit.mol)": routine84,
    "routine:$extension:rdkit.mol_numheterocycles($extension:rdkit.mol)": routine85,
    "routine:$extension:rdkit.mol_numrings($extension:rdkit.mol)": routine86,
    "routine:$extension:rdkit.mol_numrotatablebonds($extension:rdkit.mol)": routine87,
    "routine:$extension:rdkit.mol_numsaturatedcarbocycles($extension:rdkit.mol)": routine88,
    "routine:$extension:rdkit.mol_numsaturatedheterocycles($extension:rdkit.mol)": routine89,
    "routine:$extension:rdkit.mol_numsaturatedrings($extension:rdkit.mol)": routine90,
    "routine:$extension:rdkit.mol_numspiroatoms($extension:rdkit.mol)": routine91,
    "routine:$extension:rdkit.mol_phi($extension:rdkit.mol)": routine92,
    "routine:$extension:rdkit.mol_send($extension:rdkit.mol)": routine93,
    "routine:$extension:rdkit.mol_to_ctab($extension:rdkit.mol,pg_catalog.bool,pg_catalog.bool)": routine94,
    "routine:$extension:rdkit.mol_to_cxsmarts($extension:rdkit.mol)": routine95,
    "routine:$extension:rdkit.mol_to_cxsmarts($extension:rdkit.qmol)": routine96,
    "routine:$extension:rdkit.mol_to_cxsmiles($extension:rdkit.mol,pg_catalog.bool)": routine97,
    "routine:$extension:rdkit.mol_to_json($extension:rdkit.mol)": routine98,
    "routine:$extension:rdkit.mol_to_json($extension:rdkit.qmol)": routine99,
    "routine:$extension:rdkit.mol_to_pkl($extension:rdkit.mol)": routine100,
    "routine:$extension:rdkit.mol_to_smarts($extension:rdkit.mol)": routine101,
    "routine:$extension:rdkit.mol_to_smarts($extension:rdkit.qmol)": routine102,
    "routine:$extension:rdkit.mol_to_smiles($extension:rdkit.mol,pg_catalog.bool)": routine103,
    "routine:$extension:rdkit.mol_to_smiles($extension:rdkit.qmol)": routine104,
    "routine:$extension:rdkit.mol_to_svg($extension:rdkit.mol,pg_catalog.cstring,pg_catalog.int4,pg_catalog.int4,pg_catalog.cstring)":
      routine105,
    "routine:$extension:rdkit.mol_to_svg($extension:rdkit.qmol,pg_catalog.cstring,pg_catalog.int4,pg_catalog.int4,pg_catalog.cstring)":
      routine106,
    "routine:$extension:rdkit.mol_to_v3kctab($extension:rdkit.mol,pg_catalog.bool)": routine107,
    "routine:$extension:rdkit.mol_to_xqmol($extension:rdkit.mol,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.cstring)":
      routine108,
    "routine:$extension:rdkit.mol_tpsa($extension:rdkit.mol)": routine109,
    "routine:$extension:rdkit.morgan_fp($extension:rdkit.mol,pg_catalog.int4)": routine110,
    "routine:$extension:rdkit.morganbv_fp($extension:rdkit.mol,pg_catalog.int4)": routine111,
    "routine:$extension:rdkit.qmol_from_ctab(pg_catalog.cstring,pg_catalog.bool,pg_catalog.bool)": routine112,
    "routine:$extension:rdkit.qmol_from_json(pg_catalog.cstring)": routine113,
    "routine:$extension:rdkit.qmol_from_smarts(pg_catalog.cstring)": routine114,
    "routine:$extension:rdkit.qmol_from_smiles(pg_catalog.cstring)": routine115,
    "routine:$extension:rdkit.qmol_send($extension:rdkit.qmol)": routine116,
    "routine:$extension:rdkit.rdkit_fp($extension:rdkit.mol)": routine117,
    "routine:$extension:rdkit.rdkit_toolkit_version()": routine118,
    "routine:$extension:rdkit.rdkit_version()": routine119,
    "routine:$extension:rdkit.reaction_difference_fp($extension:rdkit.reaction,pg_catalog.int4)": routine120,
    "routine:$extension:rdkit.reaction_eq($extension:rdkit.reaction,$extension:rdkit.reaction)": routine121,
    "routine:$extension:rdkit.reaction_from_ctab(pg_catalog.cstring)": routine122,
    "routine:$extension:rdkit.reaction_from_smarts(pg_catalog.cstring)": routine123,
    "routine:$extension:rdkit.reaction_from_smiles(pg_catalog.cstring)": routine124,
    "routine:$extension:rdkit.reaction_ne($extension:rdkit.reaction,$extension:rdkit.reaction)": routine125,
    "routine:$extension:rdkit.reaction_numagents($extension:rdkit.reaction)": routine126,
    "routine:$extension:rdkit.reaction_numproducts($extension:rdkit.reaction)": routine127,
    "routine:$extension:rdkit.reaction_numreactants($extension:rdkit.reaction)": routine128,
    "routine:$extension:rdkit.reaction_send($extension:rdkit.reaction)": routine129,
    "routine:$extension:rdkit.reaction_structural_bfp($extension:rdkit.reaction,pg_catalog.int4)": routine130,
    "routine:$extension:rdkit.reaction_to_ctab($extension:rdkit.reaction)": routine131,
    "routine:$extension:rdkit.reaction_to_smarts($extension:rdkit.reaction)": routine132,
    "routine:$extension:rdkit.reaction_to_smiles($extension:rdkit.reaction)": routine133,
    "routine:$extension:rdkit.reaction_to_svg($extension:rdkit.reaction,pg_catalog.bool,pg_catalog.int4,pg_catalog.int4,pg_catalog.cstring)":
      routine134,
    "routine:$extension:rdkit.rsubstruct_chiral($extension:rdkit.mol,$extension:rdkit.mol)": routine135,
    "routine:$extension:rdkit.rsubstruct_query($extension:rdkit.mol,$extension:rdkit.mol)": routine136,
    "routine:$extension:rdkit.rsubstruct_query($extension:rdkit.qmol,$extension:rdkit.mol)": routine137,
    "routine:$extension:rdkit.rsubstruct_query($extension:rdkit.xqmol,$extension:rdkit.mol)": routine138,
    "routine:$extension:rdkit.rsubstruct($extension:rdkit.mol,$extension:rdkit.mol)": routine139,
    "routine:$extension:rdkit.rsubstruct($extension:rdkit.qmol,$extension:rdkit.mol)": routine140,
    "routine:$extension:rdkit.rsubstruct($extension:rdkit.reaction,$extension:rdkit.reaction)": routine141,
    "routine:$extension:rdkit.rsubstruct($extension:rdkit.xqmol,$extension:rdkit.mol)": routine142,
    "routine:$extension:rdkit.rsubstructfp($extension:rdkit.reaction,$extension:rdkit.reaction)": routine143,
    "routine:$extension:rdkit.sfp_cmp($extension:rdkit.sfp,$extension:rdkit.sfp)": routine144,
    "routine:$extension:rdkit.sfp_eq($extension:rdkit.sfp,$extension:rdkit.sfp)": routine145,
    "routine:$extension:rdkit.sfp_ge($extension:rdkit.sfp,$extension:rdkit.sfp)": routine146,
    "routine:$extension:rdkit.sfp_gt($extension:rdkit.sfp,$extension:rdkit.sfp)": routine147,
    "routine:$extension:rdkit.sfp_le($extension:rdkit.sfp,$extension:rdkit.sfp)": routine148,
    "routine:$extension:rdkit.sfp_lt($extension:rdkit.sfp,$extension:rdkit.sfp)": routine149,
    "routine:$extension:rdkit.sfp_ne($extension:rdkit.sfp,$extension:rdkit.sfp)": routine150,
    "routine:$extension:rdkit.size($extension:rdkit.bfp)": routine151,
    "routine:$extension:rdkit.substruct_chiral($extension:rdkit.mol,$extension:rdkit.mol)": routine152,
    "routine:$extension:rdkit.substruct_count_chiral($extension:rdkit.mol,$extension:rdkit.mol,pg_catalog.bool)":
      routine153,
    "routine:$extension:rdkit.substruct_count_chiral($extension:rdkit.mol,$extension:rdkit.qmol,pg_catalog.bool)":
      routine154,
    "routine:$extension:rdkit.substruct_count($extension:rdkit.mol,$extension:rdkit.mol,pg_catalog.bool)": routine155,
    "routine:$extension:rdkit.substruct_count($extension:rdkit.mol,$extension:rdkit.qmol,pg_catalog.bool)": routine156,
    "routine:$extension:rdkit.substruct_query($extension:rdkit.mol,$extension:rdkit.mol)": routine157,
    "routine:$extension:rdkit.substruct_query($extension:rdkit.mol,$extension:rdkit.qmol)": routine158,
    "routine:$extension:rdkit.substruct_query($extension:rdkit.mol,$extension:rdkit.xqmol)": routine159,
    "routine:$extension:rdkit.substruct($extension:rdkit.mol,$extension:rdkit.mol)": routine160,
    "routine:$extension:rdkit.substruct($extension:rdkit.mol,$extension:rdkit.qmol)": routine161,
    "routine:$extension:rdkit.substruct($extension:rdkit.mol,$extension:rdkit.xqmol)": routine162,
    "routine:$extension:rdkit.substruct($extension:rdkit.reaction,$extension:rdkit.reaction)": routine163,
    "routine:$extension:rdkit.substructfp($extension:rdkit.reaction,$extension:rdkit.reaction)": routine164,
    "routine:$extension:rdkit.subtract($extension:rdkit.sfp,$extension:rdkit.sfp)": routine165,
    "routine:$extension:rdkit.tanimoto_dist($extension:rdkit.bfp,$extension:rdkit.bfp)": routine166,
    "routine:$extension:rdkit.tanimoto_sml_op($extension:rdkit.bfp,$extension:rdkit.bfp)": routine167,
    "routine:$extension:rdkit.tanimoto_sml_op($extension:rdkit.sfp,$extension:rdkit.sfp)": routine168,
    "routine:$extension:rdkit.tanimoto_sml($extension:rdkit.bfp,$extension:rdkit.bfp)": routine169,
    "routine:$extension:rdkit.tanimoto_sml($extension:rdkit.sfp,$extension:rdkit.sfp)": routine170,
    "routine:$extension:rdkit.torsion_fp($extension:rdkit.mol)": routine171,
    "routine:$extension:rdkit.torsionbv_fp($extension:rdkit.mol)": routine172,
    "routine:$extension:rdkit.tversky_sml($extension:rdkit.bfp,$extension:rdkit.bfp,pg_catalog.float4,pg_catalog.float4)":
      routine173,
    "routine:$extension:rdkit.xqmol_send($extension:rdkit.xqmol)": routine174,
    "operator:$extension:rdkit.?<($extension:rdkit.reaction,$extension:rdkit.reaction)": operator0,
    "operator:$extension:rdkit.?>($extension:rdkit.reaction,$extension:rdkit.reaction)": operator1,
    "operator:$extension:rdkit.@<>($extension:rdkit.mol,$extension:rdkit.mol)": operator2,
    "operator:$extension:rdkit.@<>($extension:rdkit.reaction,$extension:rdkit.reaction)": operator3,
    "operator:$extension:rdkit.@=($extension:rdkit.mol,$extension:rdkit.mol)": operator4,
    "operator:$extension:rdkit.@=($extension:rdkit.reaction,$extension:rdkit.reaction)": operator5,
    "operator:$extension:rdkit.@>($extension:rdkit.mol,$extension:rdkit.mol)": operator6,
    "operator:$extension:rdkit.@>($extension:rdkit.mol,$extension:rdkit.qmol)": operator7,
    "operator:$extension:rdkit.@>($extension:rdkit.mol,$extension:rdkit.xqmol)": operator8,
    "operator:$extension:rdkit.@>($extension:rdkit.reaction,$extension:rdkit.reaction)": operator9,
    "operator:$extension:rdkit.@>>($extension:rdkit.mol,$extension:rdkit.mol)": operator10,
    "operator:$extension:rdkit.@>>($extension:rdkit.mol,$extension:rdkit.qmol)": operator11,
    "operator:$extension:rdkit.@>>($extension:rdkit.mol,$extension:rdkit.xqmol)": operator12,
    "operator:$extension:rdkit.#($extension:rdkit.bfp,$extension:rdkit.bfp)": operator13,
    "operator:$extension:rdkit.#($extension:rdkit.sfp,$extension:rdkit.sfp)": operator14,
    "operator:$extension:rdkit.%($extension:rdkit.bfp,$extension:rdkit.bfp)": operator15,
    "operator:$extension:rdkit.%($extension:rdkit.sfp,$extension:rdkit.sfp)": operator16,
    "operator:$extension:rdkit.<($extension:rdkit.bfp,$extension:rdkit.bfp)": operator17,
    "operator:$extension:rdkit.<($extension:rdkit.mol,$extension:rdkit.mol)": operator18,
    "operator:$extension:rdkit.<($extension:rdkit.sfp,$extension:rdkit.sfp)": operator19,
    "operator:$extension:rdkit.<@($extension:rdkit.mol,$extension:rdkit.mol)": operator20,
    "operator:$extension:rdkit.<@($extension:rdkit.qmol,$extension:rdkit.mol)": operator21,
    "operator:$extension:rdkit.<@($extension:rdkit.reaction,$extension:rdkit.reaction)": operator22,
    "operator:$extension:rdkit.<@($extension:rdkit.xqmol,$extension:rdkit.mol)": operator23,
    "operator:$extension:rdkit.<#>($extension:rdkit.bfp,$extension:rdkit.bfp)": operator24,
    "operator:$extension:rdkit.<%>($extension:rdkit.bfp,$extension:rdkit.bfp)": operator25,
    "operator:$extension:rdkit.<<@($extension:rdkit.mol,$extension:rdkit.mol)": operator26,
    "operator:$extension:rdkit.<<@($extension:rdkit.qmol,$extension:rdkit.mol)": operator27,
    "operator:$extension:rdkit.<<@($extension:rdkit.xqmol,$extension:rdkit.mol)": operator28,
    "operator:$extension:rdkit.<=($extension:rdkit.bfp,$extension:rdkit.bfp)": operator29,
    "operator:$extension:rdkit.<=($extension:rdkit.mol,$extension:rdkit.mol)": operator30,
    "operator:$extension:rdkit.<=($extension:rdkit.sfp,$extension:rdkit.sfp)": operator31,
    "operator:$extension:rdkit.<>($extension:rdkit.bfp,$extension:rdkit.bfp)": operator32,
    "operator:$extension:rdkit.<>($extension:rdkit.mol,$extension:rdkit.mol)": operator33,
    "operator:$extension:rdkit.<>($extension:rdkit.reaction,$extension:rdkit.reaction)": operator34,
    "operator:$extension:rdkit.<>($extension:rdkit.sfp,$extension:rdkit.sfp)": operator35,
    "operator:$extension:rdkit.=($extension:rdkit.bfp,$extension:rdkit.bfp)": operator36,
    "operator:$extension:rdkit.=($extension:rdkit.mol,$extension:rdkit.mol)": operator37,
    "operator:$extension:rdkit.=($extension:rdkit.reaction,$extension:rdkit.reaction)": operator38,
    "operator:$extension:rdkit.=($extension:rdkit.sfp,$extension:rdkit.sfp)": operator39,
    "operator:$extension:rdkit.>($extension:rdkit.bfp,$extension:rdkit.bfp)": operator40,
    "operator:$extension:rdkit.>($extension:rdkit.mol,$extension:rdkit.mol)": operator41,
    "operator:$extension:rdkit.>($extension:rdkit.sfp,$extension:rdkit.sfp)": operator42,
    "operator:$extension:rdkit.>=($extension:rdkit.bfp,$extension:rdkit.bfp)": operator43,
    "operator:$extension:rdkit.>=($extension:rdkit.mol,$extension:rdkit.mol)": operator44,
    "operator:$extension:rdkit.>=($extension:rdkit.sfp,$extension:rdkit.sfp)": operator45,
  });
  const varchar = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "varchar" });
  const casts = Object.freeze({
    "cast:$extension:rdkit.mol->$extension:rdkit.qmol": cast(
      "cast:$extension:rdkit.mol->$extension:rdkit.qmol",
      molCodec,
      qmolCodec,
    ),
    "cast:pg_catalog.text->$extension:rdkit.mol": cast(
      "cast:pg_catalog.text->$extension:rdkit.mol",
      textCodec,
      molCodec,
    ),
    "cast:pg_catalog.varchar->$extension:rdkit.mol": cast(
      "cast:pg_catalog.varchar->$extension:rdkit.mol",
      varchar,
      molCodec,
    ),
  });
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  function family<const Kind extends RdkitKind>(
    kind: Kind,
    member: `type:$extension:rdkit.${Kind}`,
    arrayMember: `type:$extension:rdkit._${Kind}`,
  ) {
    const codec = createRdkitCodec(descriptor.schema, kind);
    const array = createRdkitArrayCodec(descriptor.schema, kind);
    return Object.freeze({
      codec,
      arrayCodec: array,
      value: (text: string) => rdkitValue(kind, text),
      field: () =>
        createExtensionField({
          extension: descriptor,
          member,
          type: kind,
          codec,
          value: rdkitWireValue(kind),
          search,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: arrayMember,
          type: kind,
          array: true,
          codec: array,
          value: rdkitArrayWireValue(kind),
          search,
        }),
    });
  }
  const molFamily = family("mol", "type:$extension:rdkit.mol", "type:$extension:rdkit._mol");
  const qmolFamily = family("qmol", "type:$extension:rdkit.qmol", "type:$extension:rdkit._qmol");
  const xqmolFamily = family("xqmol", "type:$extension:rdkit.xqmol", "type:$extension:rdkit._xqmol");
  const reactionFamily = family("reaction", "type:$extension:rdkit.reaction", "type:$extension:rdkit._reaction");
  const bfpFamily = family("bfp", "type:$extension:rdkit.bfp", "type:$extension:rdkit._bfp");
  const sfpFamily = family("sfp", "type:$extension:rdkit.sfp", "type:$extension:rdkit._sfp");
  const indexes = Object.freeze({
    btree_bfp: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.btree_bfp_ops/btree",
        method: "btree",
        opclass: "btree_bfp_ops",
        type: "bfp",
        default: true,
      }),
    btree_mol: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.btree_mol_ops/btree",
        method: "btree",
        opclass: "btree_mol_ops",
        type: "mol",
        default: true,
      }),
    btree_sfp: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.btree_sfp_ops/btree",
        method: "btree",
        opclass: "btree_sfp_ops",
        type: "sfp",
        default: true,
      }),
    gin_bfp: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.gin_bfp_ops/gin",
        method: "gin",
        opclass: "gin_bfp_ops",
        type: "bfp",
        default: true,
      }),
    gist_bfp: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.gist_bfp_ops/gist",
        method: "gist",
        opclass: "gist_bfp_ops",
        type: "bfp",
        default: true,
      }),
    gist_mol: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.gist_mol_ops/gist",
        method: "gist",
        opclass: "gist_mol_ops",
        type: "mol",
        default: true,
      }),
    gist_qmol: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.gist_qmol_ops/gist",
        method: "gist",
        opclass: "gist_qmol_ops",
        type: "qmol",
        default: true,
      }),
    gist_reaction: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.gist_reaction_ops/gist",
        method: "gist",
        opclass: "gist_reaction_ops",
        type: "reaction",
        default: true,
      }),
    gist_sfp_low: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.gist_sfp_low_ops/gist",
        method: "gist",
        opclass: "gist_sfp_low_ops",
        type: "sfp",
        default: false,
      }),
    gist_sfp: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.gist_sfp_ops/gist",
        method: "gist",
        opclass: "gist_sfp_ops",
        type: "sfp",
        default: true,
      }),
    hash_bfp: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.hash_bfp_ops/hash",
        method: "hash",
        opclass: "hash_bfp_ops",
        type: "bfp",
        default: true,
      }),
    hash_mol: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.hash_mol_ops/hash",
        method: "hash",
        opclass: "hash_mol_ops",
        type: "mol",
        default: true,
      }),
    hash_sfp: () =>
      createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:rdkit.hash_sfp_ops/hash",
        method: "hash",
        opclass: "hash_sfp_ops",
        type: "sfp",
        default: true,
      }),
  });
  return bindExtension(descriptor, {
    mol: molFamily,
    qmol: qmolFamily,
    xqmol: xqmolFamily,
    reaction: reactionFamily,
    bfp: bfpFamily,
    sfp: sfpFamily,
    fromSmiles: routine55,
    fromSmarts: routine114,
    morganBitFingerprint: routine111,
    morganFingerprint: routine110,
    tanimotoSimilarity: routine169,
    tanimotoSimilaritySparse: routine170,
    tanimotoDistance: routine166,
    similarTanimoto: operator15,
    similarTanimotoSparse: operator16,
    tanimotoNeighbors: operator25,
    reactionSubstructMatch: statefulSqlMember(
      "routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)",
      "operator",
    ),
    indexes,
    sql: Object.freeze({ functions, operators, overloads, casts }),
  });
}
