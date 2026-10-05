import { expect } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createRdkit_4_8_0 } from "../../../apps/loom/src/core/extensions/adapters/rdkit";
import { rdkitAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/rdkit";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/rdkit.json";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { rdkitMemberProofs, rdkitUnitProofCases } from "../../e2e/fixtures/rdkit-proof-cases";

const digest = "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952";
const descriptor = {
  name: "rdkit",
  version: "4.8.0",
  schema: 'Chem"日本',
  apiSupport: { status: "verified", digest },
} as const;

extensionProofUnitTest(rdkitUnitProofCases[0]!, () => {
  expect(manifest.digest).toBe(digest);
  expect(manifest.contract.members).toHaveLength(415);
  const api = createRdkit_4_8_0(descriptor);
  expect(rdkitAnnotations.map((row) => row.id).sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
  expect(new Set(rdkitAnnotations.map((row) => row.id)).size).toBe(415);
  const queryIds = rdkitAnnotations
    .filter((row) => row.disposition === "query" && !row.id.startsWith("cast:"))
    .map((row) => row.id)
    .sort();
  expect(Object.keys(api.sql.overloads).sort()).toEqual(queryIds);
  expect(Object.keys(api.sql.casts).sort()).toEqual(
    manifest.contract.members
      .filter((row) => row.kind === "cast")
      .map((row) => row.id)
      .sort(),
  );
  expect(queryIds).toHaveLength(221);
  const reactionSearch =
    "routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)";
  expect(rdkitAnnotations.filter((row) => row.disposition === "tooling").map((row) => row.id)).toEqual([
    reactionSearch,
  ]);
  expect(api.reactionSubstructMatch).toEqual({ member: reactionSearch, authority: "operator" });
  expect(Object.keys(api.sql.casts)).toHaveLength(3);
  expect(() => createRdkit_4_8_0({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow(
    /exact verified contract/,
  );
  expect(() =>
    createRdkit_4_8_0({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } }),
  ).toThrow(/exact verified contract/);
  expect(
    rdkitAnnotations
      .filter((row) => "nativeBehavior" in row.semantics)
      .map((row) => row.id)
      .sort(),
  ).toEqual(
    [
      "cast:pg_catalog.text->$extension:rdkit.mol",
      "cast:pg_catalog.varchar->$extension:rdkit.mol",
      "opclass:$extension:rdkit.hash_bfp_ops/hash",
      "opclass:$extension:rdkit.hash_mol_ops/hash",
      "opclass:$extension:rdkit.hash_sfp_ops/hash",
      "operator:$extension:rdkit.=($extension:rdkit.reaction,$extension:rdkit.reaction)",
      "routine:$extension:rdkit.fmcs(pg_catalog.text)",
      "routine:$extension:rdkit.fmcs_smiles(pg_catalog.text)",
      "routine:$extension:rdkit.fmcs_smiles(pg_catalog.text,pg_catalog.text)",
      "routine:$extension:rdkit.fmcs_smiles_transition(pg_catalog.text,pg_catalog.text)",
      "routine:$extension:rdkit.mol_from_smiles(pg_catalog.text)",
    ].sort(),
  );
  for (const row of rdkitAnnotations) {
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
  }
});

extensionProofUnitTest(rdkitUnitProofCases[1]!, () => {
  const api = createRdkit_4_8_0(descriptor);
  const ethanol = api.mol.value("CCO");
  const query = api.qmol.value("CCO");
  expect(api.mol.codec.decode(api.mol.codec.encode(ethanol))).toEqual(ethanol);
  expect(api.qmol.codec.decode(api.qmol.codec.encode(query))).toEqual(query);
  // @ts-expect-error Query-molecule values are rejected by the mol codec.
  expect(() => api.mol.codec.encode(query)).toThrow();
  // @ts-expect-error Molecules are rejected by the dense fingerprint codec.
  expect(() => api.bfp.codec.encode(ethanol)).toThrow();
  const array = {
    dimensions: [
      { lowerBound: -2, length: 2 },
      { lowerBound: 3, length: 2 },
    ],
    values: [
      [ethanol, null],
      [api.mol.value("c1ccccc1"), ethanol],
    ],
  };
  expect(api.mol.arrayCodec.decode(api.mol.arrayCodec.encode(array))).toEqual(array);
  expect(api.mol.arrayCodec.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(api.mol.field().metadata.extension).toMatchObject({
    type: "mol",
    member: "type:$extension:rdkit.mol",
    schema: descriptor.schema,
  });
  expect(api.bfp.field().metadata.extension).toMatchObject({
    type: "bfp",
    member: "type:$extension:rdkit.bfp",
  });
  expect(api.mol.field().metadata.extension?.search).toEqual({
    filter: false,
    comparison: false,
    order: false,
    text: false,
  });
});

extensionProofUnitTest(rdkitUnitProofCases[2]!, () => {
  const api = createRdkit_4_8_0(descriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const smiles = api.fromSmiles("CCO");
  expect(extensionExpressionContract(smiles)?.member).toBe(
    "routine:$extension:rdkit.mol_from_smiles(pg_catalog.cstring)",
  );
  const tanimoto = api.tanimotoSimilarity(
    api.morganBitFingerprint(smiles),
    api.morganBitFingerprint(api.fromSmiles("CCN")),
  );
  expect(extensionExpressionContract(tanimoto)?.member).toBe(
    "routine:$extension:rdkit.tanimoto_sml($extension:rdkit.bfp,$extension:rdkit.bfp)",
  );
  const query = dialect.sqlToQuery(tanimoto);
  expect(query.sql).toContain('"Chem""日本"."tanimoto_sml"');
  expect(query.sql).toContain('"Chem""日本"."morganbv_fp"');
  expect(query.params).toEqual(["CCO", "CCN"]);
  expect(extensionExpressionContract(api.tanimotoDistance(api.bfp.value("0101"), api.bfp.value("1010")))?.member).toBe(
    "routine:$extension:rdkit.tanimoto_dist($extension:rdkit.bfp,$extension:rdkit.bfp)",
  );
  expect(
    extensionExpressionContract(api.tanimotoSimilaritySparse(api.sfp.value("{1}"), api.sfp.value("{2}")))?.member,
  ).toBe("routine:$extension:rdkit.tanimoto_sml($extension:rdkit.sfp,$extension:rdkit.sfp)");
  const textCast = dialect.sqlToQuery(api.sql.casts["cast:pg_catalog.text->$extension:rdkit.mol"]("CCO"));
  expect(textCast.sql).toContain('::"pg_catalog"."text")::"Chem""日本"."mol"');
  expect(textCast.params).toEqual(["CCO"]);
  // @ts-expect-error tanimoto_dist has no sparse overload in 4.8.0.
  expect(api.sql.functions.tanimoto_dist.sfp_sfp).toBeUndefined();
  expect(
    extensionExpressionContract(api.similarTanimotoSparse(api.sfp.value("{1}"), api.sfp.value("{2}")))?.member,
  ).toBe("operator:$extension:rdkit.%($extension:rdkit.sfp,$extension:rdkit.sfp)");
});

extensionProofUnitTest(rdkitUnitProofCases[3]!, () => {
  const api = createRdkit_4_8_0(descriptor);
  const internals = rdkitAnnotations.filter((row) => row.disposition === "internal");
  expect(internals.length).toBeGreaterThan(0);
  for (const row of internals) {
    if (row.id === "routine:$extension:rdkit.gbfp_sortsupport(pg_catalog.internal)") {
      expect("parent" in row.semantics).toBe(false);
      expect("unresolvedBlocker" in row.semantics).toBe(false);
      expect("nativeGraph" in row.semantics ? row.semantics.nativeGraph : "").toMatch(/RDK_PGSQL_BFP_GIST_SORTSUPPORT/);
      continue;
    }
    expect("parent" in row.semantics ? row.semantics.parent : undefined).toEqual(expect.any(String));
  }
  expect(Object.keys(api.indexes).sort()).toEqual([
    "btree_bfp",
    "btree_mol",
    "btree_sfp",
    "gin_bfp",
    "gist_bfp",
    "gist_mol",
    "gist_qmol",
    "gist_reaction",
    "gist_sfp",
    "gist_sfp_low",
    "hash_bfp",
    "hash_mol",
    "hash_sfp",
  ]);
  expect(api.indexes.gist_mol().member).toBe("opclass:$extension:rdkit.gist_mol_ops/gist");
  expect(api.sql.functions.mol_from_smiles.cstring).toBeDefined();
  expect(api.sql.functions.mol_from_smiles.text).toBeDefined();
  expect(rdkitMemberProofs).toHaveLength(415);
  expect(
    rdkitMemberProofs.filter((row) => row.id === "routine:$extension:rdkit.gbfp_sortsupport(pg_catalog.internal)")[0]
      ?.transfers,
  ).toEqual([]);
  expect(
    rdkitMemberProofs.find((row) => row.id === "routine:$extension:rdkit.gbfp_sortsupport(pg_catalog.internal)")?.cases,
  ).toEqual([{ caseId: "rdkit.native-graph", scenario: "extension-member-without-catalog-owner" }]);
});
