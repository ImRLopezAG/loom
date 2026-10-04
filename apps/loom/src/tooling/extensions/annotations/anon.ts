import * as v from "valibot";
import { ANON_DIGEST, ANON_FOREIGN_KEY_TRIGGER_IDS } from "../../../core/extensions/adapters/anon";
import { anonRoutineSpecs } from "../../../core/extensions/adapters/anon-specs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { validateExtensionManifest } from "../../../core/extensions/registry";
import manifestSource from "../manifests/anon.json";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
if (manifest.contract.extension !== "anon" || manifest.contract.version !== "2.5.1" || manifest.digest !== ANON_DIGEST)
  throw new Error("anon annotations require the exact captured 2.5.1 manifest");
const foreignKeyTriggers = new Set<string>(ANON_FOREIGN_KEY_TRIGGER_IDS);

const evidence = [
  "apps/loom/src/tooling/extensions/manifests/anon.json",
  "https://gitlab.com/dalibo/postgresql_anonymizer/-/tree/2.5.1/sql",
  "https://neon.com/docs/extensions/postgresql-anonymizer",
  "apps/loom/src/core/extensions/adapters/anon.ts",
  "apps/loom/src/core/extensions/adapters/anon-specs.ts",
  "apps/loom/src/tooling/extensions/operations/anon.ts",
  "packages/tests/unit/extensions-anon.test.ts",
  "packages/e2e/integration/extensions-anon.test.ts",
] as const;
const pending = {
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const views = new Set(["pg_identifiers", "pg_masked_roles", "pg_masking_rules", "pg_masks", "pg_trusted_functions"]);
const dictionaryTypes = new Set([
  "address",
  "city",
  "company",
  "country",
  "email",
  "first_name",
  "iban",
  "identifier",
  "identifiers_category",
  "last_name",
  "lorem_ipsum",
  "postcode",
  "siret",
]);

/** Every captured member is accounted for. Query-safe routines are application SQL; the rest are operator routines. */
export const anonAnnotations = manifest.contract.members.map((member) => {
  if (member.kind === "routine") {
    // SAFETY: the following absence check rejects a routine not present in the pinned spec map.
    const spec = anonRoutineSpecs[member.id as keyof typeof anonRoutineSpecs];
    if (!spec) throw new Error(`Missing anon routine spec: ${member.id}`);
    if (spec.result === "event_trigger")
      return {
        id: member.id,
        disposition: "internal" as const,
        reason:
          "Native DDL callback invoked by anon_trg_mask_update; PostgreSQL rejects direct SELECT invocation of event-trigger routines.",
        evidence,
        semantics: {
          ...pending,
          authority: "extension",
          advertised: false,
          surface: "event trigger:anon_trg_mask_update",
        },
      };
    const surface = spec.query ? `sql.overloads[${member.id}]` : `withAnon.routines[${member.id}]`;
    return {
      id: member.id,
      disposition: spec.query ? ("query" as const) : ("tooling" as const),
      reason: spec.query
        ? `${surface}: captured masking or helper function. Native SQL only; also valid in a SECURITY LABEL rule.`
        : `${surface}: operator-owned native call. Preserves privileges, search_path, and session state.`,
      evidence,
      semantics: {
        ...pending,
        authority: spec.query ? "query" : "operator",
        observability: "external",
        live: "No automatic live-query binding; results depend on extension or session state",
        volatility: member.volatility,
        privilege: `${member.publicExecute ? "PUBLIC EXECUTE" : "restricted EXECUTE"}${member.securityDefiner ? ", SECURITY DEFINER" : ""}`,
        surface,
        advertised: true,
        codec: spec.result,
      },
    };
  }
  if (member.kind === "type" && (member.typeKind === "c" || member.typeKind === "b")) {
    const base = member.name.replace(/^_/, "");
    if (views.has(base) || dictionaryTypes.has(base) || member.name.startsWith("pg_"))
      return {
        id: member.id,
        disposition: "schema" as const,
        reason: `Captured native composite/array codec and qualified schema field (${member.name}).`,
        evidence,
        semantics: { ...pending, authority: "query", surface: `fields.${member.name}`, codec: `codecs.${member.name}` },
      };
  }
  if (member.kind === "relation" && member.relationKind === "v" && views.has(member.name))
    return {
      id: member.id,
      disposition: "tooling" as const,
      reason: `withAnon.views: decoded native ${member.name}.`,
      evidence,
      semantics: { ...pending, authority: "operator", surface: `withAnon.views.${member.name}` },
    };
  if (member.kind === "other" && member.objectType === "trigger" && foreignKeyTriggers.has(member.id))
    return {
      id: member.id,
      disposition: "internal" as const,
      reason: `Native RI callback for constraint identifier_fk_identifiers_category_fkey (${member.identity}). Catalog identity only; never an application helper.`,
      evidence,
      semantics: { ...pending, authority: "extension" },
    };
  return {
    id: member.id,
    disposition: "internal" as const,
    reason:
      member.kind === "other" && member.objectType === "event trigger"
        ? "Extension-owned DDL event trigger that invokes trg_mask_update in the native event-trigger context."
        : "Extension-owned fake-data storage, catalog object or dependent used by native masking functions; it is never called directly.",
    evidence,
    semantics: { ...pending, authority: "extension" },
  };
});
