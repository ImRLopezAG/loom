import * as v from "valibot";
import manifest from "../manifests/prefix.json";

const evidence = [
  "apps/loom/src/tooling/extensions/manifests/prefix.json",
  "https://github.com/dimitri/prefix",
  "https://github.com/dimitri/prefix/blob/master/prefix.c",
  "apps/loom/src/core/extensions/adapters/prefix.ts",
  "packages/tests/unit/extensions-prefix.test.ts",
  "packages/tests/types/extensions-prefix.test-d.ts",
  "packages/e2e/integration/extensions-prefix.test.ts",
] as const;

const pending = { providerAcceptance: "pending", publicExportAcceptance: "pending" } as const;

function accessMethodParent(identity: string): string {
  const match = / of ("\$extension:prefix"\.[A-Za-z0-9_]+ USING [a-z]+)$/.exec(identity);
  if (!match) throw new Error(`Missing prefix access-method parent: ${identity}`);
  return match[1]!;
}

function routineInternal(name: string): { reason: string; parent: string } | undefined {
  if (
    name === "prefix_range_in" ||
    name === "prefix_range_out" ||
    name === "prefix_range_recv"
  )
    return {
      reason: "Type input/output or receive wiring; exercised only through the prefix_range codec.",
      parent: "type:$extension:prefix.prefix_range",
    };
  if (name.startsWith("gpr_"))
    return {
      reason: "GiST support callback; exercised only through gist_prefix_range_ops.",
      parent: "opclass:$extension:prefix.gist_prefix_range_ops/gist",
    };
  return undefined;
}

/** Exact prefix 1.2.0 dispositions; acceptance remains pending until host native and isolated-consumer proofs. */
export const prefixAnnotations = manifest.contract.members.map((member) => {
  if (member.kind === "cast")
    return {
      id: member.id,
      disposition: "query" as const,
      reason:
        "Exact native cast with the captured prefix_range/text codecs; implicit text input and explicit text output.",
      evidence,
      semantics: pending,
    };
  if (member.kind === "operator")
    return {
      id: member.id,
      disposition: "query" as const,
      reason: "Exact native SQL operator with validated prefix_range arguments, canonical text and strict-null codecs.",
      evidence,
      semantics: pending,
    };
  if (member.kind === "opclass")
    return {
      id: member.id,
      disposition: "schema" as const,
      reason: "Default qualified btree or gist operator class for stored prefix_range columns.",
      evidence,
      semantics: pending,
    };
  if (member.kind === "type")
    return {
      id: member.id,
      disposition: "schema" as const,
      reason: "Native prefix_range type or dimensional array with the canonical text codec.",
      evidence,
      semantics: pending,
    };
  if (member.kind === "opfamily")
    return {
      id: member.id,
      disposition: "internal" as const,
      reason: "Operator family catalog wiring; exercised only through the owning operator class.",
      evidence,
      semantics: { ...pending, parent: `opclass:${member.id.slice("opfamily:".length)}` },
    };
  if (member.kind === "other") {
    const identity = v.parse(v.string(), member.identity);
    return {
      id: member.id,
      disposition: "internal" as const,
      reason: "Backend callback or access-method catalog wiring; exercised only through the owning index path.",
      evidence,
      semantics: { ...pending, parent: accessMethodParent(identity) },
    };
  }
  if (member.kind !== "routine") throw new Error(`Unhandled prefix member: ${member.id}`);
  const support = routineInternal(member.name);
  const internalArgs =
    (member.arguments ?? []).some((argument) => ["internal", "cstring"].includes(argument.type.name)) ||
    member.returns?.name === "cstring";
  if (support || (internalArgs && member.name !== "prefix_range_send"))
    return {
      id: member.id,
      disposition: "internal" as const,
      reason:
        support?.reason ??
        "Backend callback or access-method catalog wiring; exercised only through the owning native type or index path.",
      evidence,
      semantics: { ...pending, parent: support?.parent ?? "type:$extension:prefix.prefix_range" },
    };
  return {
    id: member.id,
    disposition: "query" as const,
    reason: "Exact native SQL routine with validated prefix_range arguments, canonical text and strict-null codecs.",
    evidence,
    semantics: pending,
  };
});
