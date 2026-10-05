import * as v from "valibot";
import manifestSource from "../manifests/btree_gin.json";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { validateExtensionManifest } from "../../../core/extensions/registry";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
if (
  manifest.contract.extension !== "btree_gin" ||
  manifest.contract.version !== "1.3" ||
  manifest.digest !== "c3c8db3d98f5b687408fa9feac34338a9ad5fc0308c713b709008cd5889b709e"
)
  throw new Error("btree_gin annotations require the exact captured 1.3 manifest");
const evidence = [
  "apps/loom/src/tooling/extensions/manifests/btree_gin.json",
  "https://www.postgresql.org/docs/18/btree-gin.html",
  "apps/loom/src/core/extensions/adapters/btree_gin.ts",
  "packages/tests/unit/extensions-btree_gin.test.ts",
  "packages/tests/types/extensions-btree_gin.test-d.ts",
  "packages/e2e/integration/extensions-btree_gin.test.ts",
] as const;
const pending = { providerAcceptance: "pending", publicExportAcceptance: "pending" } as const;

/** Every captured member is accounted for; SQL-callable support routines retain direct APIs. */
export const btreeGinAnnotations = manifest.contract.members.map((member) => {
  if (member.kind === "opclass")
    return {
      id: member.id,
      disposition: "schema" as const,
      reason: `indexes.${member.input.name === "anyenum" ? "enum" : member.input.name}() declares the exact ${member.name} GIN class in the selected installation schema, for ${member.input.namespace}.${member.input.name} input.`,
      evidence,
      semantics: {
        ...pending,
        authority: "schema",
        surface: `indexes.${member.input.name === "anyenum" ? "enum" : member.input.name}()`,
        strategies: "1:<, 2:<=, 3:=, 4:>=, 5:>; native GIN bitmap scans, not ordered index scans",
        unique: "unsupported by GIN",
        nulls:
          "native GIN null keys; ordinary comparison strategies exclude NULL; PostgreSQL performs rechecks where needed",
        namespace: "operator class relocates with the extension; all native types/operators stay in pg_catalog",
        input: `${member.input.namespace}.${member.input.name}`,
      },
    };
  let reason: string;
  if (member.kind === "routine") {
    if (member.name === "gin_enum_cmp" || member.name === "gin_numeric_cmp")
      return {
        id: member.id,
        disposition: "query" as const,
        reason: `SQL-callable ${member.name} has no internal pseudo-type and is exposed through sql.functions.${member.name} with its exact native int4 result decoder. Native index support also uses this routine; that role does not remove its public SQL interface.`,
        evidence,
        semantics: {
          ...pending,
          authority: "query",
          surface: `sql.functions.${member.name}`,
          nulls: "STRICT; either SQL NULL argument yields NULL, not the private GIN leftmost sentinel",
          codec: "pg:int4:1:nullable",
          observability: "tables",
          arguments:
            member.name === "gin_enum_cmp"
              ? "Concrete native Drizzle PgEnum definition plus two checked literal labels or compatible SQL expressions; both parameters cast to that enum. Native enum order, including ALTER TYPE additions, is authoritative."
              : "Exact decimal strings or explicit NaN/Infinity/-Infinity values; pg:numeric:1:nullable preserves precision. PostgreSQL numeric comparison is authoritative.",
          volatility: member.volatility,
          parallel: member.parallel,
        },
      };
    const parents = manifest.contract.members
      .filter(
        (family) =>
          family.kind === "opfamily" &&
          family.procedures.some((procedure) => `routine:${procedure.procedure}` === member.id),
      )
      .map((family) => family.id);
    if (!parents.length) throw new Error(`Unattached btree_gin support routine: ${member.id}`);
    if (
      !member.arguments.some(
        (argument) => argument.type.namespace === "pg_catalog" && argument.type.name === "internal",
      )
    )
      throw new Error(`Unreviewed SQL-callable btree_gin routine: ${member.id}`);
    reason = `C support routine ${member.name}, attached to ${parents.join(", ")}; invoked by PostgreSQL during native GIN build/insertion/comparison/prefix scans. The captured internal pseudo-type argument requires a native pointer that ordinary SQL cannot supply.`;
  } else if (member.kind === "opfamily") {
    reason = `Exact strategy and support-procedure wiring for ${member.name}; exercised by its matching opclass declaration, never a separately callable SQL or RPC capability.`;
  } else if (
    member.kind === "other" &&
    member.ownership === "subordinate" &&
    ["function of access method", "operator of access method"].includes(member.objectType)
  ) {
    reason = `Captured ${member.objectType} attachment ${member.identity}; exact catalog wiring under its parent GIN family. Native class proof exercises the attached procedure or strategy, not an application helper.`;
  } else throw new Error(`Unreviewed btree_gin disposition: ${member.id}`);
  return {
    id: member.id,
    disposition: "internal" as const,
    reason,
    evidence,
    semantics: {
      ...pending,
      authority: "internal",
      surface: "native GIN operator-class support only; absent from RPC SQL and operator tooling",
    },
  };
});
