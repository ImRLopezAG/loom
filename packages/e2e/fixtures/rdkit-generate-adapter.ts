import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ExtensionMember } from "../../../apps/loom/src/core/extensions/contracts";
import {
  isRdkitNativeCallback,
  rdkitManifest as source,
  rdkitQueryMemberIds,
} from "../../../apps/loom/src/tooling/extensions/annotations/rdkit";

const digest = "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952";
if (source.digest !== digest) throw new Error("rdkit generator requires the exact 4.8.0 digest");

type TypeRef = { readonly namespace: string; readonly name: string };
type Routine = Extract<ExtensionMember, { kind: "routine" }>;
type Operator = Extract<ExtensionMember, { kind: "operator" }>;
type Cast = Extract<ExtensionMember, { kind: "cast" }>;
type Opclass = Extract<ExtensionMember, { kind: "opclass" }>;

const members = source.contract.members;
const queryIds = new Set(rdkitQueryMemberIds());
const routines = members.filter((row): row is Routine => row.kind === "routine" && queryIds.has(row.id));
const operators = members.filter((row): row is Operator => row.kind === "operator");
const casts = members.filter((row): row is Cast => row.kind === "cast");
const opclasses = members.filter((row): row is Opclass => row.kind === "opclass");
for (const row of routines) if (isRdkitNativeCallback(row)) throw new Error(`Query classified as callback: ${row.id}`);
// The only set-returning 4.8.0 routine reads caller-named relations and is operator tooling.
for (const row of routines) if (row.returnsSet) throw new Error(`Set-returning rdkit query member: ${row.id}`);

function codecName(type: TypeRef | null) {
  if (!type) throw new Error("Missing type");
  if (type.namespace === "$extension:rdkit") return type.name;
  const known = ["bool", "int4", "float4", "float8", "text", "cstring", "bytea"] as const;
  const mapped = type.namespace === "pg_catalog" ? known.find((name) => name === type.name) : undefined;
  if (!mapped) throw new Error(`Unmapped SQL type ${type.namespace}.${type.name}`);
  return mapped;
}

function argExpr(argument: Routine["arguments"][number]) {
  const codec = codecName(argument.type);
  if (!argument.hasDefault) return codec;
  return argument.name
    ? `defaultSqlArgument(${codec}, ${JSON.stringify(argument.name)})`
    : `defaultSqlArgument(${codec})`;
}

function overloadKey(types: Array<TypeRef | null>) {
  return (
    types
      .filter((value): value is TypeRef => value !== null)
      .map((value) => value.name)
      .join("_") || "none"
  );
}

const lines: string[] = [];
function emit(line = "") {
  lines.push(line);
}

emit(`import { is, SQL, sql } from "drizzle-orm";`);
emit(`import * as v from "valibot";`);
emit(`import { bindExtension, type ExtensionDescriptor } from "../bindings";`);
emit(`import {`);
emit(`  booleanCodec,`);
emit(`  binaryCodec,`);
emit(`  floatCodec,`);
emit(`  nullableCodec,`);
emit(`  textCodec,`);
emit(`  withCodecSqlType,`);
emit(`  type ExtensionCodec,`);
emit(`} from "../codecs";`);
emit(`import { int4Codec } from "../native-codecs";`);
emit(`import { float4Codec } from "../primitive-number-codecs";`);
emit(`import { createExtensionField, createExtensionIndex } from "../fields";`);
emit(`import {`);
emit(`  checkedExtensionExpression,`);
emit(`  createSqlAggregate,`);
emit(`  createSqlFunction,`);
emit(`  createSqlOperator,`);
emit(`  defaultSqlArgument,`);
emit(`  extensionSqlType,`);
emit(`  statefulSqlMember,`);
emit(`  type ExtensionSqlInput,`);
emit(`} from "../sql";`);
emit(`import {`);
emit(`  createRdkitArrayCodec,`);
emit(`  createRdkitCodec,`);
emit(`  rdkitArrayWireValue,`);
emit(`  rdkitValue,`);
emit(`  rdkitWireValue,`);
emit(`  type RdkitKind,`);
emit(`} from "./rdkit-codecs";`);
emit(`export { rdkitValue, rdkitKinds } from "./rdkit-codecs";`);
emit(`export type { RdkitKind, RdkitValue } from "./rdkit-codecs";`);
emit(`export type { PostgreSqlArray } from "../codecs";`);
emit();
emit(`const digest = "${digest}";`);
emit(`type Descriptor = ExtensionDescriptor<"rdkit", { readonly version: "4.8.0"; readonly schema: string }>;`);
emit(`const wrapper = v.object({ getSQL: v.function() });`);
emit(`function cast<Input, Output>(`);
emit(`  member: string,`);
emit(`  source: ExtensionCodec<Input, Input>,`);
emit(`  target: ExtensionCodec<Output, Output>,`);
emit(`) {`);
emit(`  return (value: ExtensionSqlInput<typeof source>) => {`);
emit(`    // SAFETY: Aliased and SQL wrappers are handled first, so the remaining value is the source codec input.`);
emit(`    const input = is(value, SQL.Aliased)`);
emit(`      ? "isSelectionField" in value && value.isSelectionField === true`);
emit(`        ? sql\`\${value}\``);
emit(`        : value.sql`);
emit(`      : v.is(wrapper, value)`);
emit(`        ? sql\`\${value}\``);
emit(
  `        : sql\`\${sql.param(source.encode(value as Input))}::\${extensionSqlType(source.sqlType!.schema, source.sqlType!.name)}\`;`,
);
emit(`    return checkedExtensionExpression(`);
emit(`      sql\`(\${input})::\${extensionSqlType(target.sqlType!.schema, target.sqlType!.name)}\`,`);
emit(`      target,`);
emit(`      [],`);
emit(`      undefined,`);
emit(`      member,`);
emit(`    );`);
emit(`  };`);
emit(`}`);
emit();
emit(`/** Exact RDKit 4.8.0 cartridge. PostgreSQL owns chemistry; adapters only bind captured SQL. */`);
emit(`export function createRdkit_4_8_0<const Selected extends Descriptor>(descriptor: Selected) {`);
emit(`  if (`);
emit(`    descriptor.name !== "rdkit" ||`);
emit(`    descriptor.version !== "4.8.0" ||`);
emit(`    descriptor.apiSupport.status !== "verified" ||`);
emit(`    descriptor.apiSupport.digest !== digest`);
emit(`  )`);
emit(`    throw new Error("rdkit 4.8.0 requires its exact verified contract");`);
emit(`  const molCodec = createRdkitCodec(descriptor.schema, "mol");`);
emit(`  const qmolCodec = createRdkitCodec(descriptor.schema, "qmol");`);
emit(`  const xqmolCodec = createRdkitCodec(descriptor.schema, "xqmol");`);
emit(`  const reactionCodec = createRdkitCodec(descriptor.schema, "reaction");`);
emit(`  const bfpCodec = createRdkitCodec(descriptor.schema, "bfp");`);
emit(`  const sfpCodec = createRdkitCodec(descriptor.schema, "sfp");`);
emit(`  const mol = nullableCodec(molCodec);`);
emit(`  const qmol = nullableCodec(qmolCodec);`);
emit(`  const xqmol = nullableCodec(xqmolCodec);`);
emit(`  const reaction = nullableCodec(reactionCodec);`);
emit(`  const bfp = nullableCodec(bfpCodec);`);
emit(`  const sfp = nullableCodec(sfpCodec);`);
emit(`  const bool = nullableCodec(booleanCodec);`);
emit(`  const int4 = nullableCodec(int4Codec);`);
emit(`  const float4 = nullableCodec(float4Codec);`);
emit(`  const float8 = nullableCodec(floatCodec);`);
emit(`  const text = nullableCodec(textCodec);`);
emit(`  const cstring = nullableCodec(withCodecSqlType(textCodec, { schema: "pg_catalog", name: "cstring" }));`);
emit(`  const bytea = nullableCodec(binaryCodec);`);
emit(
  `  const base = { schema: descriptor.schema, dependencies: [], observability: "tables" as const, authority: "query" as const };`,
);

const routineVars = new Map<string, string>();
routines.forEach((routine, index) => {
  const variable = `routine${index}`;
  routineVars.set(routine.id, variable);
  const factory = routine.routineKind === "aggregate" ? "createSqlAggregate" : "createSqlFunction";
  const result = routine.returns ? codecName(routine.returns) : "text";
  emit(`  const ${variable} = ${factory}({`);
  emit(`    ...base,`);
  emit(`    name: ${JSON.stringify(routine.name)},`);
  emit(`    member: ${JSON.stringify(routine.id)},`);
  emit(`    arguments: [${routine.arguments.map(argExpr).join(", ")}] as const,`);
  emit(`    result: ${result},`);
  emit(`  });`);
});

const operatorVars = new Map<string, string>();
operators.forEach((operator, index) => {
  const variable = `operator${index}`;
  operatorVars.set(operator.id, variable);
  emit(`  const ${variable} = createSqlOperator({`);
  emit(`    ...base,`);
  emit(`    name: ${JSON.stringify(operator.name)},`);
  emit(`    member: ${JSON.stringify(operator.id)},`);
  emit(`    left: ${operator.left ? codecName(operator.left) : "undefined"},`);
  emit(`    right: ${operator.right ? codecName(operator.right) : "undefined"},`);
  emit(`    result: ${operator.returns ? codecName(operator.returns) : "bool"},`);
  emit(`  });`);
});

const functionGroups = new Map<string, Array<{ key: string; id: string }>>();
for (const routine of routines) {
  const group = functionGroups.get(routine.name) ?? [];
  group.push({ key: overloadKey(routine.arguments.map((argument) => argument.type)), id: routine.id });
  functionGroups.set(routine.name, group);
}
emit(`  const functions = Object.freeze({`);
for (const [name, group] of [...functionGroups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  if (group.length === 1) emit(`    ${JSON.stringify(name)}: ${routineVars.get(group[0]!.id)},`);
  else {
    emit(`    ${JSON.stringify(name)}: Object.freeze({`);
    for (const entry of group) emit(`      ${JSON.stringify(entry.key)}: ${routineVars.get(entry.id)},`);
    emit(`    }),`);
  }
}
emit(`  });`);

const operatorGroups = new Map<string, Array<{ key: string; id: string }>>();
for (const operator of operators) {
  const group = operatorGroups.get(operator.name) ?? [];
  group.push({ key: overloadKey([operator.left, operator.right]), id: operator.id });
  operatorGroups.set(operator.name, group);
}
emit(`  const operators = Object.freeze({`);
for (const [name, group] of [...operatorGroups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  if (group.length === 1) emit(`    ${JSON.stringify(name)}: ${operatorVars.get(group[0]!.id)},`);
  else {
    emit(`    ${JSON.stringify(name)}: Object.freeze({`);
    for (const entry of group) emit(`      ${JSON.stringify(entry.key)}: ${operatorVars.get(entry.id)},`);
    emit(`    }),`);
  }
}
emit(`  });`);

emit(`  const overloads = Object.freeze({`);
for (const routine of routines) emit(`    ${JSON.stringify(routine.id)}: ${routineVars.get(routine.id)},`);
for (const operator of operators) emit(`    ${JSON.stringify(operator.id)}: ${operatorVars.get(operator.id)},`);
emit(`  });`);

const sourceCodec = (type: TypeRef) =>
  type.namespace === "$extension:rdkit"
    ? `${type.name}Codec`
    : type.name === "text"
      ? "textCodec"
      : type.name === "varchar"
        ? 'withCodecSqlType(textCodec, { schema: "pg_catalog", name: "varchar" })'
        : codecName(type).replace(/Codec$/, "") + "Codec";

emit(`  const varchar = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "varchar" });`);
emit(`  const casts = Object.freeze({`);
for (const row of casts) {
  const sourceName =
    row.source.namespace === "$extension:rdkit"
      ? `${row.source.name}Codec`
      : row.source.name === "text"
        ? "textCodec"
        : row.source.name === "varchar"
          ? "varchar"
          : sourceCodec(row.source);
  const targetName = row.target.namespace === "$extension:rdkit" ? `${row.target.name}Codec` : sourceCodec(row.target);
  emit(`    ${JSON.stringify(row.id)}: cast(${JSON.stringify(row.id)}, ${sourceName}, ${targetName}),`);
}
emit(`  });`);

emit(`  const search = { filter: false, comparison: false, order: false, text: false } as const;`);
emit(
  `  function family<const Kind extends RdkitKind>(kind: Kind, member: \`type:$extension:rdkit.\${Kind}\`, arrayMember: \`type:$extension:rdkit._\${Kind}\`) {`,
);
emit(`    const codec = createRdkitCodec(descriptor.schema, kind);`);
emit(`    const array = createRdkitArrayCodec(descriptor.schema, kind);`);
emit(`    return Object.freeze({`);
emit(`      codec,`);
emit(`      arrayCodec: array,`);
emit(`      value: (text: string) => rdkitValue(kind, text),`);
emit(`      field: () =>`);
emit(`        createExtensionField({`);
emit(`          extension: descriptor,`);
emit(`          member,`);
emit(`          type: kind,`);
emit(`          codec,`);
emit(`          value: rdkitWireValue(kind),`);
emit(`          search,`);
emit(`        }),`);
emit(`      arrayField: () =>`);
emit(`        createExtensionField({`);
emit(`          extension: descriptor,`);
emit(`          member: arrayMember,`);
emit(`          type: kind,`);
emit(`          array: true,`);
emit(`          codec: array,`);
emit(`          value: rdkitArrayWireValue(kind),`);
emit(`          search,`);
emit(`        }),`);
emit(`    });`);
emit(`  }`);
emit(`  const molFamily = family("mol", "type:$extension:rdkit.mol", "type:$extension:rdkit._mol");`);
emit(`  const qmolFamily = family("qmol", "type:$extension:rdkit.qmol", "type:$extension:rdkit._qmol");`);
emit(`  const xqmolFamily = family("xqmol", "type:$extension:rdkit.xqmol", "type:$extension:rdkit._xqmol");`);
emit(
  `  const reactionFamily = family("reaction", "type:$extension:rdkit.reaction", "type:$extension:rdkit._reaction");`,
);
emit(`  const bfpFamily = family("bfp", "type:$extension:rdkit.bfp", "type:$extension:rdkit._bfp");`);
emit(`  const sfpFamily = family("sfp", "type:$extension:rdkit.sfp", "type:$extension:rdkit._sfp");`);
emit(`  const indexes = Object.freeze({`);
for (const opclass of opclasses) {
  const key = opclass.name.replace(/_ops$/, "");
  emit(`    ${JSON.stringify(key)}: () =>`);
  emit(`      createExtensionIndex({`);
  emit(`        extension: descriptor,`);
  emit(`        member: ${JSON.stringify(opclass.id)},`);
  emit(`        method: ${JSON.stringify(opclass.accessMethod)},`);
  emit(`        opclass: ${JSON.stringify(opclass.name)},`);
  emit(`        type: ${JSON.stringify(opclass.input.name)},`);
  emit(`        default: ${opclass.isDefault},`);
  emit(`      }),`);
}
emit(`  });`);

// The C cstring parser is schema-qualified; mol_from_smiles(text) is SQL that resolves it through search_path.
const fromSmiles = routineVars.get("routine:$extension:rdkit.mol_from_smiles(pg_catalog.cstring)");
const fromSmarts = routineVars.get("routine:$extension:rdkit.qmol_from_smarts(pg_catalog.cstring)");
const morganbv = routineVars.get("routine:$extension:rdkit.morganbv_fp($extension:rdkit.mol,pg_catalog.int4)");
const morgan = routineVars.get("routine:$extension:rdkit.morgan_fp($extension:rdkit.mol,pg_catalog.int4)");
const tanimotoBfp = routineVars.get("routine:$extension:rdkit.tanimoto_sml($extension:rdkit.bfp,$extension:rdkit.bfp)");
const tanimotoSfp = routineVars.get("routine:$extension:rdkit.tanimoto_sml($extension:rdkit.sfp,$extension:rdkit.sfp)");
const tanimotoDistBfp = routineVars.get(
  "routine:$extension:rdkit.tanimoto_dist($extension:rdkit.bfp,$extension:rdkit.bfp)",
);
const similar = operatorVars.get("operator:$extension:rdkit.%($extension:rdkit.bfp,$extension:rdkit.bfp)");
const similarSparse = operatorVars.get("operator:$extension:rdkit.%($extension:rdkit.sfp,$extension:rdkit.sfp)");
const neighbors = operatorVars.get("operator:$extension:rdkit.<%>($extension:rdkit.bfp,$extension:rdkit.bfp)");
if (!fromSmiles || !morganbv || !tanimotoBfp || !tanimotoDistBfp)
  throw new Error("Missing required rdkit fingerprint/Tanimoto identities");

emit(`  return bindExtension(descriptor, {`);
emit(`    mol: molFamily,`);
emit(`    qmol: qmolFamily,`);
emit(`    xqmol: xqmolFamily,`);
emit(`    reaction: reactionFamily,`);
emit(`    bfp: bfpFamily,`);
emit(`    sfp: sfpFamily,`);
emit(`    fromSmiles: ${fromSmiles},`);
if (fromSmarts) emit(`    fromSmarts: ${fromSmarts},`);
emit(`    morganBitFingerprint: ${morganbv},`);
if (morgan) emit(`    morganFingerprint: ${morgan},`);
emit(`    tanimotoSimilarity: ${tanimotoBfp},`);
if (tanimotoSfp) emit(`    tanimotoSimilaritySparse: ${tanimotoSfp},`);
emit(`    tanimotoDistance: ${tanimotoDistBfp},`);
if (similar) emit(`    similarTanimoto: ${similar},`);
if (similarSparse) emit(`    similarTanimotoSparse: ${similarSparse},`);
if (neighbors) emit(`    tanimotoNeighbors: ${neighbors},`);
emit(
  `    reactionSubstructMatch: statefulSqlMember("routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)", "operator"),`,
);
emit(`    indexes,`);
emit(`    sql: Object.freeze({ functions, operators, overloads, casts }),`);
emit(`  });`);
emit(`}`);
emit();

const destination = fileURLToPath(new URL("../../../apps/loom/src/core/extensions/adapters/rdkit.ts", import.meta.url));
writeFileSync(destination, `${lines.join("\n")}\n`);
console.log(`wrote ${destination} routines=${routines.length} operators=${operators.length} casts=${casts.length}`);
