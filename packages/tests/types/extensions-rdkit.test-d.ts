import { type SQL } from "drizzle-orm";
import {
  createRdkit_4_8_0,
  type RdkitValue,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/rdkit";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
const api = createRdkit_4_8_0({
  name: "rdkit",
  version: "4.8.0",
  schema: 'Chem"日本',
  apiSupport: { status: "verified", digest: "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952" },
});
const molValue: RdkitValue<"mol"> = api.mol.value("CCO");
const qmolValue: RdkitValue<"qmol"> = api.qmol.value("CCO");
const xqmolValue: RdkitValue<"xqmol"> = api.xqmol.value("CCO");
const reactionValue: RdkitValue<"reaction"> = api.reaction.value("CCO>>CCO");
const bfpValue: RdkitValue<"bfp"> = api.bfp.value("0101");
const sfpValue: RdkitValue<"sfp"> = api.sfp.value("{1,2}");
const smiles: SQL<RdkitValue<"mol"> | null> = api.fromSmiles("CCO");
const smarts: SQL<RdkitValue<"qmol"> | null> = api.fromSmarts("CCO");
const bits: SQL<RdkitValue<"bfp"> | null> = api.morganBitFingerprint(smiles);
const sparse: SQL<RdkitValue<"sfp"> | null> = api.morganFingerprint(smiles);
const tanimoto: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoSimilarity(
  bits,
  bits,
);
const sparseTanimoto: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.tanimotoSimilaritySparse(sparse, sparse);
const distance: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoDistance(bits, bits);
const similar: SQL<boolean | null> = api.similarTanimoto(bits, bits);
const similarSparse: SQL<boolean | null> = api.similarTanimotoSparse(sparse, sparse);
const neighbors: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoNeighbors(
  bits,
  bits,
);
const schema = defineSchema(() => ({
  molecules: {
    structure: api.mol.field().notNull(),
    query: api.qmol.field(),
    bits: api.bfp.field(),
    sparse: api.sfp.arrayField(),
  },
}));
const gist = api.indexes.gist_mol();
const gin = api.indexes.gin_bfp();
const btree = api.indexes.btree_mol();
const hash = api.indexes.hash_sfp();
const array: PostgreSqlArray<RdkitValue<"mol">> = {
  dimensions: [{ lowerBound: -2, length: 2 }],
  values: [molValue, null],
};
void [
  schema,
  gist,
  gin,
  btree,
  hash,
  array,
  smarts,
  tanimoto,
  sparseTanimoto,
  distance,
  similar,
  similarSparse,
  neighbors,
];
// @ts-expect-error Molecular text is not a dense fingerprint.
api.tanimotoSimilarity(molValue, molValue);
// @ts-expect-error Sparse fingerprints are not dense Tanimoto distance operands.
api.tanimotoDistance(sfpValue, sfpValue);
// @ts-expect-error Query-molecule values are not mol values.
api.mol.codec.encode(qmolValue);
const unknownVersion = {
  name: "rdkit",
  version: "0.0.0",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952" },
} as const;
// @ts-expect-error Unknown versions do not mint a typed adapter.
createRdkit_4_8_0(unknownVersion);
const reactionSearch: {
  readonly member: "routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)";
} = api.reactionSubstructMatch;
void reactionSearch;
// @ts-expect-error The relation-reading reaction search is operator tooling, not an RPC query overload.
void api.sql.overloads[
  "routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)"
];
const result0: SQL<RdkitValue<"sfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.add($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result1: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.all_values_gt($extension:rdkit.sfp,pg_catalog.int4)"
](sfpValue, 2);
const result2: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.all_values_lt($extension:rdkit.sfp,pg_catalog.int4)"
](sfpValue, 2);
const result3: SQL<RdkitValue<"sfp"> | null> =
  api.sql.overloads["routine:$extension:rdkit.atompair_fp($extension:rdkit.mol)"](molValue);
const result4: SQL<RdkitValue<"bfp"> | null> =
  api.sql.overloads["routine:$extension:rdkit.atompairbv_fp($extension:rdkit.mol)"](molValue);
const result5: SQL<RdkitValue<"bfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.avalon_fp($extension:rdkit.mol,pg_catalog.bool,pg_catalog.int4)"
](molValue, true, 2);
const result6: SQL<number | null> = api.sql.overloads[
  "routine:$extension:rdkit.bfp_cmp($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result7: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.bfp_eq($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result8: SQL<RdkitValue<"bfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.bfp_from_binary_text(pg_catalog.bytea)"
]({ hex: "00" });
const result9: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.bfp_ge($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result10: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.bfp_gt($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result11: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.bfp_le($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result12: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.bfp_lt($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result13: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.bfp_ne($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result14: SQL<{ readonly hex: string } | null> =
  api.sql.overloads["routine:$extension:rdkit.bfp_to_binary_text($extension:rdkit.bfp)"](bfpValue);
const result15: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "routine:$extension:rdkit.dice_dist($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result16: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.dice_sml_op($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result17: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.dice_sml_op($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result18: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "routine:$extension:rdkit.dice_sml($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result19: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "routine:$extension:rdkit.dice_sml($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result20: SQL<RdkitValue<"sfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.featmorgan_fp($extension:rdkit.mol,pg_catalog.int4)"
](molValue, 2);
const result21: SQL<RdkitValue<"bfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.featmorganbv_fp($extension:rdkit.mol,pg_catalog.int4)"
](molValue, 2);
const result22: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.fmcs_smiles_transition(pg_catalog.text,pg_catalog.text)"
]("CCO", "CCO");
const result23: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.fmcs_smiles(pg_catalog.cstring,pg_catalog.cstring)"
]("CCO", "CCO");
const result24: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.fmcs_smiles(pg_catalog.text,pg_catalog.text)"
]("CCO", "CCO");
const result25: SQL<string | null> = api.sql.overloads["routine:$extension:rdkit.fmcs_smiles(pg_catalog.text)"]("CCO");
const result26: SQL<string | null> = api.sql.overloads["routine:$extension:rdkit.fmcs($extension:rdkit.mol)"](molValue);
const result27: SQL<string | null> = api.sql.overloads["routine:$extension:rdkit.fmcs(pg_catalog.text)"]("CCO");
const result28: SQL<boolean | null> =
  api.sql.overloads["routine:$extension:rdkit.is_valid_ctab(pg_catalog.cstring)"]("CCO");
const result29: SQL<boolean | null> = api.sql.overloads["routine:$extension:rdkit.is_valid_mol_pkl(pg_catalog.bytea)"]({
  hex: "00",
});
const result30: SQL<boolean | null> =
  api.sql.overloads["routine:$extension:rdkit.is_valid_smarts(pg_catalog.cstring)"]("CCO");
const result31: SQL<boolean | null> =
  api.sql.overloads["routine:$extension:rdkit.is_valid_smiles(pg_catalog.cstring)"]("CCO");
const result32: SQL<RdkitValue<"bfp"> | null> =
  api.sql.overloads["routine:$extension:rdkit.layered_fp($extension:rdkit.mol)"](molValue);
const result33: SQL<RdkitValue<"bfp"> | null> =
  api.sql.overloads["routine:$extension:rdkit.maccs_fp($extension:rdkit.mol)"](molValue);
const result34: SQL<RdkitValue<"mol"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_adjust_query_properties($extension:rdkit.mol,pg_catalog.cstring)"
](molValue, "CCO");
const result35: SQL<RdkitValue<"qmol"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_adjust_query_properties($extension:rdkit.qmol,pg_catalog.cstring)"
](qmolValue, "CCO");
const result36: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_amw($extension:rdkit.mol)"](molValue);
const result37: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi0n($extension:rdkit.mol)"](molValue);
const result38: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi0v($extension:rdkit.mol)"](molValue);
const result39: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi1n($extension:rdkit.mol)"](molValue);
const result40: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi1v($extension:rdkit.mol)"](molValue);
const result41: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi2n($extension:rdkit.mol)"](molValue);
const result42: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi2v($extension:rdkit.mol)"](molValue);
const result43: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi3n($extension:rdkit.mol)"](molValue);
const result44: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi3v($extension:rdkit.mol)"](molValue);
const result45: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi4n($extension:rdkit.mol)"](molValue);
const result46: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_chi4v($extension:rdkit.mol)"](molValue);
const result47: SQL<number | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_cmp($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result48: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_eq($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result49: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_exactmw($extension:rdkit.mol)"](molValue);
const result50: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_formula($extension:rdkit.mol,pg_catalog.bool,pg_catalog.bool)"
](molValue, true, true);
const result51: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_fractioncsp3($extension:rdkit.mol)"](molValue);
const result52: SQL<RdkitValue<"mol"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_from_ctab(pg_catalog.cstring,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"
]("CCO", true, true, true);
const result53: SQL<RdkitValue<"mol"> | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_from_json(pg_catalog.cstring)"]("CCO");
const result54: SQL<RdkitValue<"mol"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_from_pkl(pg_catalog.bytea)"
]({ hex: "00" });
const result55: SQL<RdkitValue<"mol"> | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_from_smiles(pg_catalog.cstring)"]("CCO");
const result56: SQL<RdkitValue<"mol"> | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_from_smiles(pg_catalog.text)"]("CCO");
const result57: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_ge($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result58: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_gt($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result59: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_hallkieralpha($extension:rdkit.mol)"](molValue);
const result60: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_hba($extension:rdkit.mol)"](molValue);
const result61: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_hbd($extension:rdkit.mol)"](molValue);
const result62: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_inchi($extension:rdkit.mol,pg_catalog.cstring)"
](molValue, "CCO");
const result63: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_inchikey($extension:rdkit.mol,pg_catalog.cstring)"
](molValue, "CCO");
const result64: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_kappa1($extension:rdkit.mol)"](molValue);
const result65: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_kappa2($extension:rdkit.mol)"](molValue);
const result66: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_kappa3($extension:rdkit.mol)"](molValue);
const result67: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_labuteasa($extension:rdkit.mol)"](molValue);
const result68: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_le($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result69: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_logp($extension:rdkit.mol)"](molValue);
const result70: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_lt($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result71: SQL<RdkitValue<"mol"> | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_murckoscaffold($extension:rdkit.mol)"](molValue);
const result72: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_ne($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result73: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_nm_hash($extension:rdkit.mol,pg_catalog.cstring)"
](molValue, "CCO");
const result74: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numaliphaticcarbocycles($extension:rdkit.mol)"](molValue);
const result75: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numaliphaticheterocycles($extension:rdkit.mol)"](molValue);
const result76: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numaliphaticrings($extension:rdkit.mol)"](molValue);
const result77: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numamidebonds($extension:rdkit.mol)"](molValue);
const result78: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numaromaticcarbocycles($extension:rdkit.mol)"](molValue);
const result79: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numaromaticheterocycles($extension:rdkit.mol)"](molValue);
const result80: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numaromaticrings($extension:rdkit.mol)"](molValue);
const result81: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numatoms($extension:rdkit.mol)"](molValue);
const result82: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numbridgeheadatoms($extension:rdkit.mol)"](molValue);
const result83: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numheavyatoms($extension:rdkit.mol)"](molValue);
const result84: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numheteroatoms($extension:rdkit.mol)"](molValue);
const result85: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numheterocycles($extension:rdkit.mol)"](molValue);
const result86: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numrings($extension:rdkit.mol)"](molValue);
const result87: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numrotatablebonds($extension:rdkit.mol)"](molValue);
const result88: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numsaturatedcarbocycles($extension:rdkit.mol)"](molValue);
const result89: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numsaturatedheterocycles($extension:rdkit.mol)"](molValue);
const result90: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numsaturatedrings($extension:rdkit.mol)"](molValue);
const result91: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_numspiroatoms($extension:rdkit.mol)"](molValue);
const result92: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_phi($extension:rdkit.mol)"](molValue);
const result93: SQL<{ readonly hex: string } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_send($extension:rdkit.mol)"](molValue);
const result94: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_to_ctab($extension:rdkit.mol,pg_catalog.bool,pg_catalog.bool)"
](molValue, true, true);
const result95: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_to_cxsmarts($extension:rdkit.mol)"](molValue);
const result96: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_to_cxsmarts($extension:rdkit.qmol)"](qmolValue);
const result97: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_to_cxsmiles($extension:rdkit.mol,pg_catalog.bool)"
](molValue, true);
const result98: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_to_json($extension:rdkit.mol)"](molValue);
const result99: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_to_json($extension:rdkit.qmol)"](qmolValue);
const result100: SQL<{ readonly hex: string } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_to_pkl($extension:rdkit.mol)"](molValue);
const result101: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_to_smarts($extension:rdkit.mol)"](molValue);
const result102: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_to_smarts($extension:rdkit.qmol)"](qmolValue);
const result103: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_to_smiles($extension:rdkit.mol,pg_catalog.bool)"
](molValue, true);
const result104: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_to_smiles($extension:rdkit.qmol)"](qmolValue);
const result105: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_to_svg($extension:rdkit.mol,pg_catalog.cstring,pg_catalog.int4,pg_catalog.int4,pg_catalog.cstring)"
](molValue, "CCO", 2, 2, "CCO");
const result106: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_to_svg($extension:rdkit.qmol,pg_catalog.cstring,pg_catalog.int4,pg_catalog.int4,pg_catalog.cstring)"
](qmolValue, "CCO", 2, 2, "CCO");
const result107: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_to_v3kctab($extension:rdkit.mol,pg_catalog.bool)"
](molValue, true);
const result108: SQL<RdkitValue<"xqmol"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.mol_to_xqmol($extension:rdkit.mol,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.cstring)"
](molValue, true, true, true, "CCO");
const result109: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> =
  api.sql.overloads["routine:$extension:rdkit.mol_tpsa($extension:rdkit.mol)"](molValue);
const result110: SQL<RdkitValue<"sfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.morgan_fp($extension:rdkit.mol,pg_catalog.int4)"
](molValue, 2);
const result111: SQL<RdkitValue<"bfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.morganbv_fp($extension:rdkit.mol,pg_catalog.int4)"
](molValue, 2);
const result112: SQL<RdkitValue<"qmol"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.qmol_from_ctab(pg_catalog.cstring,pg_catalog.bool,pg_catalog.bool)"
]("CCO", true, true);
const result113: SQL<RdkitValue<"qmol"> | null> =
  api.sql.overloads["routine:$extension:rdkit.qmol_from_json(pg_catalog.cstring)"]("CCO");
const result114: SQL<RdkitValue<"qmol"> | null> =
  api.sql.overloads["routine:$extension:rdkit.qmol_from_smarts(pg_catalog.cstring)"]("CCO");
const result115: SQL<RdkitValue<"qmol"> | null> =
  api.sql.overloads["routine:$extension:rdkit.qmol_from_smiles(pg_catalog.cstring)"]("CCO");
const result116: SQL<{ readonly hex: string } | null> =
  api.sql.overloads["routine:$extension:rdkit.qmol_send($extension:rdkit.qmol)"](qmolValue);
const result117: SQL<RdkitValue<"bfp"> | null> =
  api.sql.overloads["routine:$extension:rdkit.rdkit_fp($extension:rdkit.mol)"](molValue);
const result118: SQL<string | null> = api.sql.overloads["routine:$extension:rdkit.rdkit_toolkit_version()"]();
const result119: SQL<string | null> = api.sql.overloads["routine:$extension:rdkit.rdkit_version()"]();
const result120: SQL<RdkitValue<"sfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.reaction_difference_fp($extension:rdkit.reaction,pg_catalog.int4)"
](reactionValue, 2);
const result121: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.reaction_eq($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result122: SQL<RdkitValue<"reaction"> | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_from_ctab(pg_catalog.cstring)"]("CCO");
const result123: SQL<RdkitValue<"reaction"> | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_from_smarts(pg_catalog.cstring)"]("CCO");
const result124: SQL<RdkitValue<"reaction"> | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_from_smiles(pg_catalog.cstring)"]("CCO");
const result125: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.reaction_ne($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result126: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_numagents($extension:rdkit.reaction)"](reactionValue);
const result127: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_numproducts($extension:rdkit.reaction)"](reactionValue);
const result128: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_numreactants($extension:rdkit.reaction)"](reactionValue);
const result129: SQL<{ readonly hex: string } | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_send($extension:rdkit.reaction)"](reactionValue);
const result130: SQL<RdkitValue<"bfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.reaction_structural_bfp($extension:rdkit.reaction,pg_catalog.int4)"
](reactionValue, 2);
const result131: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_to_ctab($extension:rdkit.reaction)"](reactionValue);
const result132: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_to_smarts($extension:rdkit.reaction)"](reactionValue);
const result133: SQL<string | null> =
  api.sql.overloads["routine:$extension:rdkit.reaction_to_smiles($extension:rdkit.reaction)"](reactionValue);
const result134: SQL<string | null> = api.sql.overloads[
  "routine:$extension:rdkit.reaction_to_svg($extension:rdkit.reaction,pg_catalog.bool,pg_catalog.int4,pg_catalog.int4,pg_catalog.cstring)"
](reactionValue, true, 2, 2, "CCO");
const result135: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.rsubstruct_chiral($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result136: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.rsubstruct_query($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result137: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.rsubstruct_query($extension:rdkit.qmol,$extension:rdkit.mol)"
](qmolValue, molValue);
const result138: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.rsubstruct_query($extension:rdkit.xqmol,$extension:rdkit.mol)"
](xqmolValue, molValue);
const result139: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.rsubstruct($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result140: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.rsubstruct($extension:rdkit.qmol,$extension:rdkit.mol)"
](qmolValue, molValue);
const result141: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.rsubstruct($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result142: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.rsubstruct($extension:rdkit.xqmol,$extension:rdkit.mol)"
](xqmolValue, molValue);
const result143: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.rsubstructfp($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result144: SQL<number | null> = api.sql.overloads[
  "routine:$extension:rdkit.sfp_cmp($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result145: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.sfp_eq($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result146: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.sfp_ge($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result147: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.sfp_gt($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result148: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.sfp_le($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result149: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.sfp_lt($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result150: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.sfp_ne($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result151: SQL<number | null> =
  api.sql.overloads["routine:$extension:rdkit.size($extension:rdkit.bfp)"](bfpValue);
const result152: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct_chiral($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result153: SQL<number | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct_count_chiral($extension:rdkit.mol,$extension:rdkit.mol,pg_catalog.bool)"
](molValue, molValue, true);
const result154: SQL<number | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct_count_chiral($extension:rdkit.mol,$extension:rdkit.qmol,pg_catalog.bool)"
](molValue, qmolValue, true);
const result155: SQL<number | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct_count($extension:rdkit.mol,$extension:rdkit.mol,pg_catalog.bool)"
](molValue, molValue, true);
const result156: SQL<number | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct_count($extension:rdkit.mol,$extension:rdkit.qmol,pg_catalog.bool)"
](molValue, qmolValue, true);
const result157: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct_query($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result158: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct_query($extension:rdkit.mol,$extension:rdkit.qmol)"
](molValue, qmolValue);
const result159: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct_query($extension:rdkit.mol,$extension:rdkit.xqmol)"
](molValue, xqmolValue);
const result160: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result161: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct($extension:rdkit.mol,$extension:rdkit.qmol)"
](molValue, qmolValue);
const result162: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct($extension:rdkit.mol,$extension:rdkit.xqmol)"
](molValue, xqmolValue);
const result163: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.substruct($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result164: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.substructfp($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result165: SQL<RdkitValue<"sfp"> | null> = api.sql.overloads[
  "routine:$extension:rdkit.subtract($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result166: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "routine:$extension:rdkit.tanimoto_dist($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result167: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.tanimoto_sml_op($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result168: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:rdkit.tanimoto_sml_op($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result169: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "routine:$extension:rdkit.tanimoto_sml($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result170: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "routine:$extension:rdkit.tanimoto_sml($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result171: SQL<RdkitValue<"sfp"> | null> =
  api.sql.overloads["routine:$extension:rdkit.torsion_fp($extension:rdkit.mol)"](molValue);
const result172: SQL<RdkitValue<"bfp"> | null> =
  api.sql.overloads["routine:$extension:rdkit.torsionbv_fp($extension:rdkit.mol)"](molValue);
const result173: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "routine:$extension:rdkit.tversky_sml($extension:rdkit.bfp,$extension:rdkit.bfp,pg_catalog.float4,pg_catalog.float4)"
](bfpValue, bfpValue, 0.5, 0.5);
const result174: SQL<{ readonly hex: string } | null> =
  api.sql.overloads["routine:$extension:rdkit.xqmol_send($extension:rdkit.xqmol)"](xqmolValue);
const result175: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.?<($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result176: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.?>($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result177: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@<>($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result178: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@<>($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result179: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@=($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result180: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@=($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result181: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@>($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result182: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@>($extension:rdkit.mol,$extension:rdkit.qmol)"
](molValue, qmolValue);
const result183: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@>($extension:rdkit.mol,$extension:rdkit.xqmol)"
](molValue, xqmolValue);
const result184: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@>($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result185: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@>>($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result186: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@>>($extension:rdkit.mol,$extension:rdkit.qmol)"
](molValue, qmolValue);
const result187: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.@>>($extension:rdkit.mol,$extension:rdkit.xqmol)"
](molValue, xqmolValue);
const result188: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.#($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result189: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.#($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result190: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.%($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result191: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.%($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result192: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result193: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result194: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result195: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<@($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result196: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<@($extension:rdkit.qmol,$extension:rdkit.mol)"
](qmolValue, molValue);
const result197: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<@($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result198: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<@($extension:rdkit.xqmol,$extension:rdkit.mol)"
](xqmolValue, molValue);
const result199: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "operator:$extension:rdkit.<#>($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result200: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "operator:$extension:rdkit.<%>($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result201: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<<@($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result202: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<<@($extension:rdkit.qmol,$extension:rdkit.mol)"
](qmolValue, molValue);
const result203: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<<@($extension:rdkit.xqmol,$extension:rdkit.mol)"
](xqmolValue, molValue);
const result204: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<=($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result205: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<=($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result206: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<=($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result207: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<>($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result208: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<>($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result209: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<>($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result210: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.<>($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result211: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.=($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result212: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.=($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result213: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.=($extension:rdkit.reaction,$extension:rdkit.reaction)"
](reactionValue, reactionValue);
const result214: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.=($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result215: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.>($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result216: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.>($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result217: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.>($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result218: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.>=($extension:rdkit.bfp,$extension:rdkit.bfp)"
](bfpValue, bfpValue);
const result219: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.>=($extension:rdkit.mol,$extension:rdkit.mol)"
](molValue, molValue);
const result220: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:rdkit.>=($extension:rdkit.sfp,$extension:rdkit.sfp)"
](sfpValue, sfpValue);
const result221: SQL<RdkitValue<"qmol"> | null> =
  api.sql.casts["cast:$extension:rdkit.mol->$extension:rdkit.qmol"](molValue);
const result222: SQL<RdkitValue<"mol"> | null> = api.sql.casts["cast:pg_catalog.text->$extension:rdkit.mol"]("CCO");
const result223: SQL<RdkitValue<"mol"> | null> = api.sql.casts["cast:pg_catalog.varchar->$extension:rdkit.mol"]("CCO");
void [
  result0,
  result1,
  result2,
  result3,
  result4,
  result5,
  result6,
  result7,
  result8,
  result9,
  result10,
  result11,
  result12,
  result13,
  result14,
  result15,
  result16,
  result17,
  result18,
  result19,
  result20,
  result21,
  result22,
  result23,
  result24,
  result25,
  result26,
  result27,
  result28,
  result29,
  result30,
  result31,
  result32,
  result33,
  result34,
  result35,
  result36,
  result37,
  result38,
  result39,
  result40,
  result41,
  result42,
  result43,
  result44,
  result45,
  result46,
  result47,
  result48,
  result49,
  result50,
  result51,
  result52,
  result53,
  result54,
  result55,
  result56,
  result57,
  result58,
  result59,
  result60,
  result61,
  result62,
  result63,
  result64,
  result65,
  result66,
  result67,
  result68,
  result69,
  result70,
  result71,
  result72,
  result73,
  result74,
  result75,
  result76,
  result77,
  result78,
  result79,
  result80,
  result81,
  result82,
  result83,
  result84,
  result85,
  result86,
  result87,
  result88,
  result89,
  result90,
  result91,
  result92,
  result93,
  result94,
  result95,
  result96,
  result97,
  result98,
  result99,
  result100,
  result101,
  result102,
  result103,
  result104,
  result105,
  result106,
  result107,
  result108,
  result109,
  result110,
  result111,
  result112,
  result113,
  result114,
  result115,
  result116,
  result117,
  result118,
  result119,
  result120,
  result121,
  result122,
  result123,
  result124,
  result125,
  result126,
  result127,
  result128,
  result129,
  result130,
  result131,
  result132,
  result133,
  result134,
  result135,
  result136,
  result137,
  result138,
  result139,
  result140,
  result141,
  result142,
  result143,
  result144,
  result145,
  result146,
  result147,
  result148,
  result149,
  result150,
  result151,
  result152,
  result153,
  result154,
  result155,
  result156,
  result157,
  result158,
  result159,
  result160,
  result161,
  result162,
  result163,
  result164,
  result165,
  result166,
  result167,
  result168,
  result169,
  result170,
  result171,
  result172,
  result173,
  result174,
  result175,
  result176,
  result177,
  result178,
  result179,
  result180,
  result181,
  result182,
  result183,
  result184,
  result185,
  result186,
  result187,
  result188,
  result189,
  result190,
  result191,
  result192,
  result193,
  result194,
  result195,
  result196,
  result197,
  result198,
  result199,
  result200,
  result201,
  result202,
  result203,
  result204,
  result205,
  result206,
  result207,
  result208,
  result209,
  result210,
  result211,
  result212,
  result213,
  result214,
  result215,
  result216,
  result217,
  result218,
  result219,
  result220,
  result221,
  result222,
  result223,
];
