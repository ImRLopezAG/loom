import * as v from "valibot";
import manifestSource from "../manifests/btree_gist.json";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { validateExtensionManifest } from "../../../core/extensions/registry";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
if (
  manifest.contract.extension !== "btree_gist" ||
  manifest.contract.version !== "1.8" ||
  manifest.digest !== "73fdb4831683ee8042ecbcd0d0639909650d018d6c7ca51bb85c1cb38de96072"
)
  throw new Error("btree_gist annotations require the exact captured 1.8 manifest");
const evidence = [
  "apps/loom/src/tooling/extensions/manifests/btree_gist.json",
  "https://www.postgresql.org/docs/18/btree-gist.html",
  "apps/loom/src/core/extensions/adapters/btree_gist.ts",
  "packages/tests/unit/extensions-btree_gist.test.ts",
  "packages/tests/types/extensions-btree_gist.test-d.ts",
  "packages/e2e/integration/extensions-btree_gist.test.ts",
] as const;
const pending = { providerAcceptance: "pending", publicExportAcceptance: "pending" } as const;
const codecs = {
  money: "pg:money:en-us:1:nullable",
  date: "pg:date:iso:1:nullable",
  int4: "pg:int4:1:nullable",
  int2: "pg:int2:1:nullable",
  int8: "pg:int8:1:nullable",
  float4: "pg:float4:1:nullable",
  float8: "pg:float8:1:nullable",
  interval: "pg:interval:postgres:1:nullable",
  oid: "pg:oid:unsigned32:1:nullable",
  time: "pg:time:1:nullable",
  timestamp: "pg:timestamp:1:nullable",
  timestamptz: "pg:timestamptz:1:nullable",
} as const;
function codec(name: string): string {
  const id = Object.entries(codecs).find(([type]) => type === name)?.[1];
  if (!id) throw new Error(`Unreviewed btree_gist codec type: ${name}`);
  return id;
}
const nativeOnly = (name: string) => name === "internal" || name === "cstring";
const indexKey = (input: string) => (input === "anyenum" ? "enum" : input);

/** Every captured member is accounted for; SQL-callable distance and translation routines retain direct APIs. */
export const btreeGistAnnotations = manifest.contract.members.map((member) => {
  if (member.kind === "opclass") {
    const ordered = manifest.contract.members.some(
      (family) =>
        family.kind === "opfamily" &&
        `$extension:btree_gist.${family.name}/gist` === member.family &&
        family.operators.some((row) => row.purpose === "o"),
    );
    return {
      id: member.id,
      disposition: "schema" as const,
      reason: `indexes.${indexKey(member.input.name)}() declares the exact ${member.name} GiST class in the selected installation schema, for ${member.input.namespace}.${member.input.name} input.`,
      evidence,
      semantics: {
        ...pending,
        authority: "schema",
        surface: `indexes.${indexKey(member.input.name)}()`,
        strategies: `1:<, 2:<=, 3:=, 4:>=, 5:>, 6:<>${ordered ? "; 15:<-> nearest-neighbour ordering" : ""}`,
        unique: "unsupported by GiST; equality exclusion constraints are the native alternative",
        nulls: "native GiST null entries; comparison strategies exclude NULL",
        namespace: "operator class relocates with the extension; native types and comparison operators stay in pg_catalog",
        input: `${member.input.namespace}.${member.input.name}`,
      },
    };
  }
  if (member.kind === "operator") {
    if (
      member.name !== "<->" ||
      !member.left ||
      !member.right ||
      !member.returns ||
      member.left.name !== member.right.name
    )
      throw new Error(`Unreviewed btree_gist operator: ${member.id}`);
    const type = member.left.name;
    return {
      id: member.id,
      disposition: "query" as const,
      reason: `SQL operator <-> for ${type} is exposed as distance.${type} and sql.operators["<->(${type},${type})"], computed by PostgreSQL through ${member.procedure}; it is also the strategy 15 ordering operator of gist_${type === "money" ? "cash" : type}_ops.`,
      evidence,
      semantics: {
        ...pending,
        authority: "query",
        surface: `distance.${type}`,
        codec: codec(member.returns.name),
        observability: "tables",
        nulls: "STRICT procedure; either NULL operand yields NULL",
        commutator: member.commutator,
      },
    };
  }
  if (
    member.kind === "routine" &&
    !nativeOnly(member.returns.name) &&
    !member.arguments.some((argument) => nativeOnly(argument.type.name))
  ) {
    const argument = member.arguments[0]?.type.name;
    if (!argument || member.routineKind !== "function") throw new Error(`Unreviewed btree_gist routine: ${member.id}`);
    return {
      id: member.id,
      disposition: "query" as const,
      reason:
        member.name === "gist_translate_cmptype_btree"
          ? "SQL-callable gist_translate_cmptype_btree(int4) is exposed through sql.functions.gist_translate_cmptype_btree with its exact native int2 decoder. It is also support procedure 12 of every class; that role does not remove its public SQL interface."
          : `SQL-callable ${member.name} is exposed through sql.functions.${member.name} with exact ${argument} parameters and its native ${member.returns.name} result decoder; it is also the procedure behind the matching <-> operator.`,
      evidence,
      semantics: {
        ...pending,
        authority: "query",
        surface: `sql.functions.${member.name}`,
        nulls: "STRICT; either SQL NULL argument yields NULL",
        codec: codec(member.returns.name),
        arguments: member.arguments.map((entry) => codec(entry.type.name)).join(", "),
        observability: "tables",
        overflow: "PostgreSQL raises out-of-range errors; no local arithmetic",
        volatility: member.volatility,
        parallel: member.parallel,
      },
    };
  }
  let reason: string;
  if (member.kind === "routine") {
    const families = manifest.contract.members
      .filter(
        (family) =>
          family.kind === "opfamily" &&
          family.procedures.some((procedure) => `routine:${procedure.procedure}` === member.id),
      )
      .map((family) => family.id);
    const types = manifest.contract.members
      .filter((type) => type.kind === "type" && [type.input, type.output].some((routine) => `routine:${routine}` === member.id))
      .map((type) => type.id);
    if (families.length)
      reason = `C support routine ${member.name}, attached to ${families.join(", ")}; invoked by PostgreSQL during GiST build, insertion, search, distance ordering, fetch or sorted build. Its captured internal pseudo-type argument requires a native pointer that ordinary SQL cannot supply.`;
    else if (types.length)
      reason = `Type I/O callback ${member.name} for ${types.join(", ")}; the captured cstring signature is invoked only by PostgreSQL's type system, and the storage key type rejects text input natively.`;
    else throw new Error(`Unattached btree_gist native routine: ${member.id}`);
  } else if (member.kind === "type") {
    reason = member.element
      ? `Array type of private GiST storage key ${member.element.name}; created implicitly by PostgreSQL and never an application value.`
      : `Private GiST storage key ${member.name} (length ${member.length}) used only as an operator-class STORAGE type; it has no public routine, operator or column role.`;
  } else if (member.kind === "opfamily") {
    reason = `Exact strategy and support-procedure wiring for ${member.name}; exercised by its matching opclass declaration, never a separately callable SQL or RPC capability.`;
  } else if (
    member.kind === "other" &&
    member.ownership === "subordinate" &&
    ["function of access method", "operator of access method"].includes(member.objectType)
  ) {
    reason = `Captured ${member.objectType} attachment ${member.identity}; exact catalog wiring under its parent GiST family. Native class proof exercises the attached procedure or strategy, not an application helper.`;
  } else throw new Error(`Unreviewed btree_gist disposition: ${member.id}`);
  return {
    id: member.id,
    disposition: "internal" as const,
    reason,
    evidence,
    semantics: {
      ...pending,
      authority: "internal",
      surface: "native GiST operator-class support only; absent from RPC SQL and operator tooling",
    },
  };
});
