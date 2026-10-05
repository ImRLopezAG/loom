import * as v from "valibot";
import manifestSource from "../manifests/lakebase_vector.json";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { validateExtensionManifest } from "../../../core/extensions/registry";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
if (
  manifest.contract.extension !== "lakebase_vector" ||
  manifest.contract.version !== "1.1.1" ||
  manifest.digest !== "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20"
)
  throw new Error("lakebase_vector annotations require the exact captured 1.1.1 manifest");

const evidence = [
  "apps/loom/src/tooling/extensions/manifests/lakebase_vector.json",
  "https://neon.com/docs/extensions/lakebase-vector",
  "apps/loom/src/core/extensions/adapters/lakebase-vector.ts",
  "apps/loom/src/core/extensions/adapters/lakebase-vector-codecs.ts",
  "packages/tests/unit/extensions-lakebase-vector.test.ts",
  "packages/tests/types/extensions-lakebase-vector.test-d.ts",
  "packages/e2e/integration/extensions-lakebase-vector.test.ts",
  "packages/e2e/integration/extensions-lakebase-vector-generated.test.ts",
  "packages/e2e/integration/packed-lakebase-vector.test.ts",
  "packages/e2e/fixtures/lakebase-vector-native.ts",
] as const;
const pending = { providerAcceptance: "pending", publicExportAcceptance: "pending" } as const;

function callableRoutine(member: (typeof manifest.contract.members)[number]) {
  if (member.kind !== "routine") return false;
  const blocked = (member.arguments ?? []).some((argument) =>
    ["internal", "cstring", "_cstring"].includes(argument.type.name),
  );
  const result = member.returns?.name;
  return !blocked && !["cstring", "internal", "index_am_handler"].includes(result ?? "");
}

/** Exact member dispositions. Neon native queries and isolated-consumer acceptance stay parent-owned. */
export const lakebaseVectorAnnotations = manifest.contract.members.map((member) => {
  if (member.kind === "access-method")
    return {
      id: member.id,
      disposition: "schema" as const,
      reason: `${member.name} is selected by indexes.ann|annv0; PostgreSQL resolves ${member.handler} only through pg_am.`,
      evidence,
      semantics: {
        ...pending,
        authority: "schema",
        surface: member.name === "lakebase_ann" ? "indexes.ann.*" : "indexes.annv0.*",
        handler: member.handler,
        format: member.name === "lakebase_ann" ? "current lakebase_ann v1 handler" : "legacy lakebase_annv0 storage",
      },
    };
  if (member.kind === "opclass")
    return {
      id: member.id,
      disposition: "schema" as const,
      reason: `indexes.${member.accessMethod === "lakebase_ann" ? "ann" : "annv0"}.${member.input.name}.${member.name.replace(`${member.input.name}_`, "").replace("_ops", "")}() declares this captured class.`,
      evidence,
      semantics: {
        ...pending,
        authority: "schema",
        surface: `indexes.${member.accessMethod === "lakebase_ann" ? "ann" : "annv0"}`,
        input: `${member.input.namespace}.${member.input.name}`,
        method: member.accessMethod,
      },
    };
  if (member.kind === "type")
    return {
      id: member.id,
      disposition: "schema" as const,
      reason: member.name.startsWith("_")
        ? `arrayField.${member.element?.name ?? member.name}() stores the captured array type.`
        : `field.${member.name}() stores the captured ${member.typeKind === "c" ? "composite" : "scalar"} type. Native rabitq binary I/O is uncharacterized.`,
      evidence,
      semantics: {
        ...pending,
        authority: "schema",
        surface: member.name.startsWith("_") ? `arrayField.${member.element?.name}` : `field.${member.name}`,
        codec:
          member.name.includes("rabitq") && !member.name.startsWith("sphere")
            ? "opaque native-text; no JavaScript quantization"
            : member.name.startsWith("sphere")
              ? "PostgreSQL record_in/record_out composite"
              : "array of the captured element",
      },
    };
  if (member.kind === "relation")
    return {
      id: member.id,
      disposition: "schema" as const,
      reason: `Composite ${member.name} is the captured sphere row type (center, radius) backing field.${member.name}().`,
      evidence,
      semantics: { ...pending, authority: "schema", surface: `field.${member.name}`, parent: `type:$extension:lakebase_vector.${member.name}` },
    };
  if (member.kind === "operator")
    return {
      id: member.id,
      disposition: "query" as const,
      reason: `sql.operators and sql.overloads expose ${member.name} with its captured ${member.returns?.name ?? "result"} decoder. Distance and range semantics stay in native SQL.`,
      evidence,
      semantics: {
        ...pending,
        authority: "query",
        surface: member.name === "<<=>" || member.name === "<<=>>" ? "withinCosine" : `sql.overloads[${member.id}]`,
        result: member.returns ? `${member.returns.namespace}.${member.returns.name}` : "unknown",
        observability: "tables",
      },
    };
  if (member.kind === "opfamily")
    return {
      id: member.id,
      disposition: "internal" as const,
      reason: `Catalog family wiring for ${member.name}; exercised by the matching opclass, not a separately callable helper.`,
      evidence,
      semantics: { ...pending, authority: "internal", parent: member.id.replace("opfamily:", "opclass:") },
    };
  if (member.kind === "other")
    return {
      id: member.id,
      disposition: "internal" as const,
      reason: `Captured ${member.objectType} attachment ${member.identity ?? member.name}; catalog wiring under its parent ANN class.`,
      evidence,
      semantics: { ...pending, authority: "internal", surface: "native ANN operator-class support only" },
    };
  if (member.kind !== "routine") throw new Error(`Unreviewed lakebase_vector disposition: ${member.id}`);
  if (member.name === "lakebase_annv0_amhandler" || member.name === "lakebase_annv1_amhandler")
    return {
      id: member.id,
      disposition: "schema" as const,
      reason: `Index AM handler ${member.name}; PostgreSQL invokes it through pg_am. The internal argument makes ordinary SQL calls fail.`,
      evidence,
      semantics: {
        ...pending,
        authority: "schema",
        surface: member.name === "lakebase_annv1_amhandler" ? "accessMethods.lakebase_ann.handler" : "accessMethods.lakebase_annv0.handler",
      },
    };
  if (member.name === "lakebase_ann_prewarm")
    return {
      id: member.id,
      disposition: "tooling" as const,
      reason: "Loads index pages into memory. Session-scoped cache mutation stays on tooling.prewarm, not ordinary RPC helpers.",
      evidence,
      semantics: {
        ...pending,
        authority: "session",
        surface: "tooling.prewarm",
        scope: "search | routing; default search",
        observability: "session",
      },
    };
  if (member.name.startsWith("_lakebase_ann_support_"))
    return {
      id: member.id,
      disposition: "query" as const,
      reason: `ANN support routine ${member.name} has an ordinary SQL-callable text contract on sql.functions and sql.overloads, with native execution required like every other callable overload.`,
      evidence,
      semantics: { ...pending, authority: "query", surface: `sql.functions[${member.id}]` },
    };
  if (!callableRoutine(member))
    return {
      id: member.id,
      disposition: "internal" as const,
      reason: `Type I/O or internal routine ${member.name}; PostgreSQL invokes it for rabitq send/recv/typmod. Native binary remains uncharacterized.`,
      evidence,
      semantics: { ...pending, authority: "internal", surface: "native type I/O only" },
    };
  return {
    id: member.id,
    disposition: "query" as const,
    reason: `sql.overloads[${member.id}] is the captured ${member.name} routine with its native result decoder.`,
    evidence,
    semantics: {
      ...pending,
      authority: "query",
      surface: `sql.overloads[${member.id}]`,
      volatility: member.volatility,
      parallel: member.parallel,
      observability: member.name === "lakebase_ann_index_info" ? "session" : "tables",
    },
  };
});
