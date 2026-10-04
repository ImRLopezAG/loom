import * as v from "valibot";
import source from "../manifests/rdkit.json";
import {
  extensionManifestValidator,
  type ExtensionMember,
  type ExtensionTypeReference,
} from "../../../core/extensions/contracts";
import { validateExtensionManifest } from "../../../core/extensions/registry";

const digest = "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952";
/** Validated exact 4.8.0 manifest; family fixtures read typed members from here, never the raw JSON. */
export const rdkitManifest = validateExtensionManifest(v.parse(extensionManifestValidator, source));
const manifest = rdkitManifest;
if (manifest.contract.extension !== "rdkit" || manifest.contract.version !== "4.8.0" || manifest.digest !== digest)
  throw new Error("rdkit annotations require the exact captured 4.8.0 manifest");

const evidence = [
  "apps/loom/src/tooling/extensions/manifests/rdkit.json",
  "https://www.rdkit.org/docs/Cartridge.html",
  "apps/loom/src/core/extensions/adapters/rdkit.ts",
  "apps/loom/src/core/extensions/adapters/rdkit-codecs.ts",
  "packages/tests/unit/extensions-rdkit.test.ts",
  "packages/tests/types/extensions-rdkit.test-d.ts",
  "packages/e2e/integration/extensions-rdkit.test.ts",
] as const;
const sortsupportEvidence = [
  "https://github.com/rdkit/rdkit/blob/Release_2025_09_1/CMakeLists.txt#L32-L34",
  "https://github.com/rdkit/rdkit/blob/Release_2025_09_1/Code/PgSQL/rdkit/CMakeLists.txt#L262-L266",
  "https://github.com/rdkit/rdkit/blob/Release_2025_09_1/Code/PgSQL/rdkit/rdkit.sql.in#L1848",
  "https://github.com/rdkit/rdkit/blob/Release_2025_09_1/Code/PgSQL/rdkit/rdkit.sql.in#L1955-L1972",
  "packages/e2e/scripts/rdkit-native.Dockerfile",
] as const;
const reactionSearch =
  "routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)";
const searchPathNote =
  "SQL-language body calls cartridge functions unqualified; it resolves only with the installation schema on the session search_path (native 42883 otherwise).";
/** Native behaviors observed on the exact 4.8.0 oracle and asserted by packages/e2e/integration/extensions-rdkit.test.ts. */
const nativeBehavior = new Map<string, string>([
  [
    "operator:$extension:rdkit.=($extension:rdkit.reaction,$extension:rdkit.reaction)",
    "Shell operator created as the NEGATOR of <>(reaction,reaction); it has no procedure, so PostgreSQL rejects every call (42883 operator is only a shell).",
  ],
  [
    "routine:$extension:rdkit.fmcs_smiles_transition(pg_catalog.text,pg_catalog.text)",
    "Transition function of fmcs(text); direct calls fail natively (XX000 called in out of aggregate context).",
  ],
  ["routine:$extension:rdkit.mol_from_smiles(pg_catalog.text)", searchPathNote],
  ["routine:$extension:rdkit.fmcs_smiles(pg_catalog.text,pg_catalog.text)", searchPathNote],
  ["routine:$extension:rdkit.fmcs_smiles(pg_catalog.text)", searchPathNote],
  ["routine:$extension:rdkit.fmcs(pg_catalog.text)", `Final function fmcs_smiles(text) is SQL. ${searchPathNote}`],
  ["cast:pg_catalog.text->$extension:rdkit.mol", `Cast function mol_from_smiles(text) is SQL. ${searchPathNote}`],
  ["cast:pg_catalog.varchar->$extension:rdkit.mol", `Cast function mol_from_smiles(text) is SQL. ${searchPathNote}`],
  ...["hash_mol_ops", "hash_bfp_ops", "hash_sfp_ops"].map(
    (name) =>
      [
        `opclass:$extension:rdkit.${name}/hash`,
        "Upstream registers hashvarlena(internal) with internal left/right types, so PostgreSQL 18 refuses CREATE INDEX (XX000 missing support function 1).",
      ] as const,
  ),
]);
function observed(id: string) {
  const note = nativeBehavior.get(id);
  return note ? { nativeBehavior: note } : {};
}
const pending = { providerAcceptance: "pending" as const, publicExportAcceptance: "pending" as const };
const members = new Map(manifest.contract.members.map((member) => [member.id, member]));
const aggregateSlots = [
  "transition",
  "final",
  "combine",
  "serial",
  "deserial",
  "movingTransition",
  "movingInverse",
  "movingFinal",
] as const;

function nativeOnly(value: ExtensionTypeReference) {
  return value.namespace === "pg_catalog" && (value.name === "cstring" || value.name === "internal");
}

/** Same captured-callback rule as semantic-proof: only cstring/internal type, family or aggregate slots. */
export function isRdkitNativeCallback(member: ExtensionMember) {
  if (member.kind !== "routine" || member.routineKind !== "function") return false;
  if (!nativeOnly(member.returns) && !member.arguments.some((argument) => nativeOnly(argument.type))) return false;
  if (
    member.arguments.some((argument) => argument.type.namespace === "pg_catalog" && argument.type.name === "internal")
  )
    return true;
  for (const parent of members.values()) {
    const aggregate = parent.kind === "routine" && parent.routineKind === "aggregate" ? parent.aggregate : null;
    if (aggregate && aggregateSlots.some((slot) => member.id === `routine:${aggregate[slot]}`)) return true;
    if (
      parent.kind === "type" &&
      [parent.input, parent.output, parent.receive, parent.send, parent.typmodInput, parent.typmodOutput].some(
        (routine) => member.id === `routine:${routine}`,
      )
    )
      return true;
    if (parent.kind === "opfamily" && parent.procedures.some((row) => member.id === `routine:${row.procedure}`))
      return true;
  }
  return false;
}

function typeParent(member: ExtensionMember) {
  return manifest.contract.members.find(
    (row) =>
      row.kind === "type" &&
      [row.input, row.output, row.receive, row.send, row.typmodInput, row.typmodOutput].some(
        (routine) => member.id === `routine:${routine}`,
      ),
  );
}

function aggregateParent(member: ExtensionMember) {
  return manifest.contract.members.find((row) => {
    const aggregate = row.kind === "routine" && row.routineKind === "aggregate" ? row.aggregate : null;
    return aggregate !== null && aggregateSlots.some((slot) => member.id === `routine:${aggregate[slot]}`);
  });
}

function familyParent(member: ExtensionMember) {
  return manifest.contract.members.find(
    (row) =>
      row.kind === "opfamily" && row.procedures.some((procedure) => member.id === `routine:${procedure.procedure}`),
  );
}

function attachmentParent(member: Extract<ExtensionMember, { kind: "other" }>) {
  const match = / of "\$extension:rdkit"\.([A-Za-z0-9_]+) USING ([a-z]+)$/.exec(member.identity);
  if (!match) return undefined;
  return `opclass:$extension:rdkit.${match[1]}/${match[2]}`;
}

/** All 415 captured identities. Native and isolated-consumer acceptance remain parent-owned. */
export const rdkitAnnotations = manifest.contract.members.map((member) => {
  const common = { id: member.id, evidence };
  if (member.kind === "type")
    return {
      ...common,
      disposition: "schema" as const,
      reason:
        member.name === "_internal"
          ? "Captured PostgreSQL shell type; not an application field. No public SQL value uses this identity."
          : `Native ${member.name} or array field uses the exact cartridge text domain. PostgreSQL owns SMILES, SMARTS, reaction, pickle and fingerprint grammar.`,
      semantics: {
        ...pending,
        authority: "schema",
        transport:
          member.name === "_internal"
            ? "shell_in/shell_out only"
            : "Type output/send are native text or bytea; arrays keep six ranks, lower bounds and NULL elements.",
      },
    };
  if (member.kind === "opclass")
    return {
      ...common,
      disposition: "schema" as const,
      reason: `Qualified ${member.name} ${member.accessMethod} index declaration for ${member.input.name}.`,
      semantics: {
        ...pending,
        authority: "schema",
        parent: `opfamily:$extension:rdkit.${member.name}/${member.accessMethod}`,
        ...observed(member.id),
      },
    };
  if (member.kind === "cast" || member.kind === "operator")
    return {
      ...common,
      disposition: "query" as const,
      reason: `Exact sql.${member.kind === "cast" ? "casts" : "overloads"}[${member.id}] binds the captured ${member.kind} and its argument/result codecs.`,
      semantics: {
        ...pending,
        authority: "query",
        observability: "tables",
        ...observed(member.id),
        units:
          member.name === "%" || member.name === "<%>" || member.id.includes("tanimoto")
            ? "Tanimoto similarity is dimensionless 0-1; Tanimoto distance is the captured pair distance. % uses rdkit.tanimoto_threshold."
            : member.name === "#" || member.name === "<#>"
              ? "Dice similarity is dimensionless 0-1; Dice distance is the captured pair distance. # uses rdkit.dice_threshold."
              : "Cartridge comparison, substructure and reaction operators keep native boolean or float semantics.",
      },
    };
  if (member.id === reactionSearch)
    return {
      ...common,
      evidence: [
        ...evidence,
        "https://github.com/rdkit/rdkit/blob/Release_2025_09_1/Code/PgSQL/rdkit/rdkit.sql.in#L2058-L2091",
        "apps/loom/src/tooling/extensions/operations/rdkit.ts",
      ],
      disposition: "tooling" as const,
      reason:
        "withRdkit.hasReactionSubstructMatch. PL/pgSQL reads the caller-named relation through dynamic SQL and issues session-level SET enable_seqscan/indexscan/bitmapscan, so it is never an RPC query helper.",
      semantics: {
        ...pending,
        authority: "operator",
        observability: "session",
        state:
          "Planner settings persist on the backend after the call; the dedicated operator backend is closed afterwards.",
      },
    };
  if (member.kind === "routine" && !isRdkitNativeCallback(member))
    return {
      ...common,
      disposition: "query" as const,
      reason: `Exact sql.overloads[${member.id}] binds captured argument and result codecs. Directly SQL-callable; no chemistry fallback.`,
      semantics: {
        ...pending,
        authority: "query",
        observability: "tables",
        ...observed(member.id),
        nulls: member.strict
          ? "Strict native invocation returns NULL for any NULL argument"
          : "Non-strict; PostgreSQL owns NULL completion",
        units: member.name.startsWith("tanimoto_")
          ? "Tanimoto similarity is dimensionless 0-1; tanimoto_dist is the captured distance of the same pair."
          : member.name.startsWith("dice_")
            ? "Dice similarity is dimensionless 0-1; dice_dist is the captured distance of the same pair."
            : undefined,
      },
    };
  let parent: string | undefined;
  if (member.kind === "routine") {
    const owner = typeParent(member) ?? aggregateParent(member) ?? familyParent(member);
    parent = owner?.id;
  } else if (member.kind === "opfamily") {
    parent = `opclass:$extension:rdkit.${member.name}/${member.accessMethod}`;
  } else if (member.kind === "other") {
    parent = attachmentParent(member);
  }
  if (!parent && member.id === "routine:$extension:rdkit.gbfp_sortsupport(pg_catalog.internal)")
    return {
      ...common,
      evidence: [...evidence, ...sortsupportEvidence],
      disposition: "internal" as const,
      reason:
        "Unattached GiST sortsupport callback taking pg_catalog.internal. rdkit.sql.in always creates it; only RDK_PGSQL_BFP_GIST_SORTSUPPORT=ON adds it as gist_bfp_ops support 11. Not an application value.",
      semantics: {
        ...pending,
        authority: "internal",
        nativeGraph:
          "Release_2025_09_1 CMakeLists.txt:32 defaults RDK_PGSQL_BFP_GIST_SORTSUPPORT OFF (MOL/QMOL ON). The captured gist_bfp_ops has procedures 1-9 and gist_mol_ops/gist_qmol_ops have 11. A native catalog scan finds no amproc, aggregate, type, operator, support or cast owner.",
      },
    };
  if (!parent) throw new Error(`Unowned rdkit internal member: ${member.id}`);
  return {
    ...common,
    disposition: "internal" as const,
    reason:
      member.kind === "routine"
        ? `Captured cstring/internal callback linked to ${parent}. SQL pseudo-types are not application values.`
        : `Captured ${member.kind === "other" ? "access-method attachment" : "operator family"} linked to ${parent}. Catalog wiring, not an independent application helper.`,
    semantics: { ...pending, authority: "internal", parent },
  };
});

export function rdkitQueryMemberIds() {
  return rdkitAnnotations
    .filter((row) => row.disposition === "query" && !row.id.startsWith("cast:"))
    .map((row) => row.id);
}
