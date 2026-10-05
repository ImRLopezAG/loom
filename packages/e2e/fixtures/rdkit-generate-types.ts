import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ExtensionMember } from "../../../apps/loom/src/core/extensions/contracts";
import {
  rdkitManifest as source,
  rdkitQueryMemberIds,
} from "../../../apps/loom/src/tooling/extensions/annotations/rdkit";

const digest = "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952";
if (source.digest !== digest) throw new Error("rdkit type generator requires the exact 4.8.0 digest");

type TypeRef = { readonly namespace: string; readonly name: string };
type Routine = Extract<ExtensionMember, { kind: "routine" }>;
type Operator = Extract<ExtensionMember, { kind: "operator" }>;
type Cast = Extract<ExtensionMember, { kind: "cast" }>;

const queryIds = new Set(rdkitQueryMemberIds());
const routines = source.contract.members.filter(
  (row): row is Routine => row.kind === "routine" && queryIds.has(row.id),
);
const operators = source.contract.members.filter((row): row is Operator => row.kind === "operator");
const casts = source.contract.members.filter((row): row is Cast => row.kind === "cast");

function tsType(type: TypeRef | null) {
  if (!type) return "boolean | null";
  if (type.namespace === "$extension:rdkit") return `RdkitValue<"${type.name}"> | null`;
  switch (type.name) {
    case "bool":
      return "boolean | null";
    case "int4":
      return "number | null";
    case "float4":
    case "float8":
      return 'number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null';
    case "text":
    case "cstring":
    case "bpchar":
    case "regclass":
    case "varchar":
      return "string | null";
    case "bytea":
      return "{ readonly hex: string } | null";
    default:
      throw new Error(`Unmapped TypeScript result ${type.namespace}.${type.name}`);
  }
}

function sample(type: TypeRef) {
  if (type.namespace === "$extension:rdkit") return `${type.name}Value`;
  switch (type.name) {
    case "bool":
      return "true";
    case "int4":
      return "2";
    case "float4":
    case "float8":
      return "0.5";
    case "text":
    case "cstring":
    case "bpchar":
    case "varchar":
      return '"CCO"';
    case "regclass":
      return '"reactions"';
    case "bytea":
      return '{ hex: "00" }';
    default:
      throw new Error(`Unmapped sample ${type.namespace}.${type.name}`);
  }
}

const lines: string[] = [
  `import { type SQL } from "drizzle-orm";`,
  `import {`,
  `  createRdkit_4_8_0,`,
  `  type RdkitValue,`,
  `  type PostgreSqlArray,`,
  `} from "../../../apps/loom/src/core/extensions/adapters/rdkit";`,
  `import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";`,
  `const api = createRdkit_4_8_0({`,
  `  name: "rdkit",`,
  `  version: "4.8.0",`,
  `  schema: 'Chem"日本',`,
  `  apiSupport: { status: "verified", digest: "${digest}" },`,
  `});`,
  `const molValue: RdkitValue<"mol"> = api.mol.value("CCO");`,
  `const qmolValue: RdkitValue<"qmol"> = api.qmol.value("CCO");`,
  `const xqmolValue: RdkitValue<"xqmol"> = api.xqmol.value("CCO");`,
  `const reactionValue: RdkitValue<"reaction"> = api.reaction.value("CCO>>CCO");`,
  `const bfpValue: RdkitValue<"bfp"> = api.bfp.value("0101");`,
  `const sfpValue: RdkitValue<"sfp"> = api.sfp.value("{1,2}");`,
  `const smiles: SQL<RdkitValue<"mol"> | null> = api.fromSmiles("CCO");`,
  `const smarts: SQL<RdkitValue<"qmol"> | null> = api.fromSmarts("CCO");`,
  `const bits: SQL<RdkitValue<"bfp"> | null> = api.morganBitFingerprint(smiles);`,
  `const sparse: SQL<RdkitValue<"sfp"> | null> = api.morganFingerprint(smiles);`,
  `const tanimoto: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoSimilarity(bits, bits);`,
  `const sparseTanimoto: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoSimilaritySparse(sparse, sparse);`,
  `const distance: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoDistance(bits, bits);`,
  `const similar: SQL<boolean | null> = api.similarTanimoto(bits, bits);`,
  `const similarSparse: SQL<boolean | null> = api.similarTanimotoSparse(sparse, sparse);`,
  `const neighbors: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoNeighbors(bits, bits);`,
  `const schema = defineSchema(() => ({`,
  `  molecules: {`,
  `    structure: api.mol.field().notNull(),`,
  `    query: api.qmol.field(),`,
  `    bits: api.bfp.field(),`,
  `    sparse: api.sfp.arrayField(),`,
  `  },`,
  `}));`,
  `const gist = api.indexes.gist_mol();`,
  `const gin = api.indexes.gin_bfp();`,
  `const btree = api.indexes.btree_mol();`,
  `const hash = api.indexes.hash_sfp();`,
  `const array: PostgreSqlArray<RdkitValue<"mol">> = {`,
  `  dimensions: [{ lowerBound: -2, length: 2 }],`,
  `  values: [molValue, null],`,
  `};`,
  `void [schema, gist, gin, btree, hash, array, smarts, tanimoto, sparseTanimoto, distance, similar, similarSparse, neighbors];`,
  `// @ts-expect-error Molecular text is not a dense fingerprint.`,
  `api.tanimotoSimilarity(molValue, molValue);`,
  `// @ts-expect-error Sparse fingerprints are not dense Tanimoto distance operands.`,
  `api.tanimotoDistance(sfpValue, sfpValue);`,
  `// @ts-expect-error Query-molecule values are not mol values.`,
  `api.mol.codec.encode(qmolValue);`,
  `const unknownVersion = { name: "rdkit", version: "0.0.0", schema: "extensions", apiSupport: { status: "verified", digest: "${digest}" } } as const;`,
  `// @ts-expect-error Unknown versions do not mint a typed adapter.`,
  `createRdkit_4_8_0(unknownVersion);`,
  `const reactionSearch: { readonly member: "routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)" } = api.reactionSubstructMatch;`,
  `void reactionSearch;`,
  `// @ts-expect-error The relation-reading reaction search is operator tooling, not an RPC query overload.`,
  `void api.sql.overloads["routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)"];`,
];

let index = 0;
for (const routine of routines) {
  const args = routine.arguments.map((argument) => sample(argument.type)).join(", ");
  lines.push(
    `const result${index}: SQL<${tsType(routine.returns)}> = api.sql.overloads[${JSON.stringify(routine.id)}](${args});`,
  );
  index += 1;
}
for (const operator of operators) {
  const args = [operator.left, operator.right]
    .filter((value): value is TypeRef => value !== null)
    .map((type) => sample(type))
    .join(", ");
  lines.push(
    `const result${index}: SQL<${tsType(operator.returns)}> = api.sql.overloads[${JSON.stringify(operator.id)}](${args});`,
  );
  index += 1;
}
for (const row of casts) {
  lines.push(
    `const result${index}: SQL<${tsType(row.target)}> = api.sql.casts[${JSON.stringify(row.id)}](${sample(row.source)});`,
  );
  index += 1;
}
lines.push(`void [${Array.from({ length: index }, (_, current) => `result${current}`).join(", ")}];`);
lines.push("");

const destination = fileURLToPath(new URL("../../tests/types/extensions-rdkit.test-d.ts", import.meta.url));
writeFileSync(destination, lines.join("\n"));
console.log(`wrote ${destination} signatures=${index}`);
