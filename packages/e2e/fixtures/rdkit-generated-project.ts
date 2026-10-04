/** Generated-project sources. Parent runs these through the canonical build, generation and packed consumer gates. */
export const rdkitGeneratedSelection = { rdkit: { version: "4.8.0", schema: 'Chem"日本' } } as const;
export const rdkitGeneratedQueryCount = 221;

export function rdkitGeneratedSchema(placement: string, namespace: string) {
  return `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.rdkit;
if (api.schema !== ${JSON.stringify(placement)} || Object.keys(api.sql.overloads).length !== ${rdkitGeneratedQueryCount}) throw new Error("Wrong first-load rdkit binding");
export default defineSchema(() => ({ molecules: defineTable({
  structure: api.mol.field().notNull(),
  query: api.qmol.field(),
  bits: api.bfp.field(),
  sparse: api.sfp.arrayField(),
}, { indexes: [{ fields: ["structure"], extension: api.indexes.gist_mol() }] }) }), { namespace: ${JSON.stringify(namespace)} });
`;
}

export interface RdkitGeneratedCase {
  readonly id: string;
  /** Qualified SQL type of an aggregate's input; undefined for ordinary calls. */
  readonly aggregate: string | undefined;
  readonly values: readonly unknown[];
}

/**
 * RPC handler body: Effect and RPC bindings must be the same object, and every public member executes through the
 * generated binding on the request transaction. Values are native seed texts; decoding is the binding's own.
 */
export function rdkitGeneratedHandler(cases: readonly RdkitGeneratedCase[], excluded: readonly string[]) {
  return `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC and Effect rdkit differ");
const api = binding.rdkit;
const calls = Object.entries({ ...api.sql.overloads, ...api.sql.casts });
const cases: readonly { id: string; aggregate?: string; values: unknown[] }[] = ${JSON.stringify(cases)};
const results: { id: string; value: unknown }[] = [];
for (const entry of cases) {
  const helper = calls.find(([id]) => id === entry.id)?.[1];
  if (!helper) throw new Error("Missing generated rdkit member " + entry.id);
  // SAFETY: values were seeded natively from this exact member's captured argument types.
  const call = helper as (...values: unknown[]) => SQL;
  const rows = entry.aggregate
    ? await context.db.select({ value: call(sql\`fixture.value\`) }).from(sql\`(values (\${entry.values[0]}::\${sql.raw(entry.aggregate)}), (\${entry.values[0]}::\${sql.raw(entry.aggregate)})) as fixture(value)\`)
    : await context.db.select({ value: call(...entry.values) }).from(sql\`(values (1)) as fixture(id)\`);
  results.push({ id: entry.id, value: rows[0]?.value });
}
const covered = [...cases.map(({ id }) => id), ...${JSON.stringify(excluded)}].sort();
if (covered.join("\\n") !== calls.map(([id]) => id).sort().join("\\n")) throw new Error("Wrong generated member inventory");
const output = { version: api.version, placement: api.schema, results };`;
}
export const rdkitGeneratedOutput =
  'v.object({version:v.literal("4.8.0"),placement:v.string(),results:v.array(v.object({id:v.string(),value:v.unknown()}))})';

export const rdkitGeneratedTypeProof = `
import { type SQL } from "drizzle-orm";
import { extensions } from "./_generated/extensions";
import type { RdkitValue } from "kello/extensions/rdkit";
const api = extensions.rdkit;
const smiles: SQL<RdkitValue<"mol"> | null> = api.fromSmiles("CCO");
const bits: SQL<RdkitValue<"bfp"> | null> = api.morganBitFingerprint(smiles);
const tanimoto: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoSimilarity(bits, bits);
const sparse: SQL<RdkitValue<"sfp"> | null> = api.morganFingerprint(smiles);
const sparseTanimoto: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoSimilaritySparse(sparse, sparse);
const distance: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.tanimotoDistance(bits, bits);
const search: { readonly member: "routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)" } = api.reactionSubstructMatch;
// @ts-expect-error Only explicitly selected keys exist.
extensions.vector;
// @ts-expect-error Sparse fingerprints are not dense Tanimoto distance operands.
api.tanimotoDistance(api.sfp.value("{1}"), api.sfp.value("{2}"));
// @ts-expect-error Caller-selected return casts are not available.
api.fromSmiles<string>("CCO");
// @ts-expect-error The relation-reading reaction search is operator tooling, not an RPC query overload.
api.sql.overloads["routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)"];
void [tanimoto, sparseTanimoto, distance, search];
`;
