import * as v from "valibot";
import source from "../manifests/isn.json";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { validateExtensionManifest } from "../../../core/extensions/registry";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, source));
if (
  manifest.contract.extension !== "isn" ||
  manifest.contract.version !== "1.3" ||
  manifest.digest !== "570342dc61cc815ae91896f43c59a79150643b22f540681e6c82d89db6a5e9be"
)
  throw new Error("ISN annotations require the exact captured 1.3 manifest");
const evidence = [
  "apps/loom/src/tooling/extensions/manifests/isn.json",
  "https://www.postgresql.org/docs/18/isn.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/isn/isn.c",
  "apps/loom/src/core/extensions/adapters/isn.ts",
  "apps/loom/src/core/extensions/adapters/isn-codecs.ts",
  "apps/loom/src/tooling/extensions/operations/isn.ts",
  "packages/tests/unit/extensions-isn.test.ts",
  "packages/tests/types/extensions-isn.test-d.ts",
  "packages/e2e/integration/extensions-isn.test.ts",
] as const;
const pending = { providerAcceptance: "pending", publicExportAcceptance: "pending" } as const;

/** All 671 captured identities; proof declarations and acceptance receipts remain independent. */
export const isnAnnotations = manifest.contract.members.map((member) => {
  const common = { id: member.id, evidence };
  if (member.kind === "type")
    return {
      ...common,
      disposition: "schema" as const,
      reason: `Native ${member.name} storage through its scalar or dimensional array field and codec; PostgreSQL owns check digits, correction, invalid marking and hyphenation.`,
      semantics: {
        ...pending,
        authority: "schema",
        representation: "{ kind, text }; arrays preserve bounds and NULL leaves",
      },
    };
  if (member.kind === "opclass")
    return {
      ...common,
      disposition: "schema" as const,
      reason: `Qualified ${member.name} ${member.accessMethod} index declaration; native index versus sequential oracle covers its exact cross-type strategy rows.`,
      semantics: { ...pending, authority: "schema", parent: `opfamily:$extension:isn.isn_ops/${member.accessMethod}` },
    };
  if (member.kind === "routine" && member.name === "isn_weak")
    return {
      ...common,
      disposition: "tooling" as const,
      reason:
        "withIsnSession owns a dedicated direct backend and transaction; weakStatus/setWeak never enter request SQL or a reusable pool.",
      semantics: {
        ...pending,
        authority: "tooling",
        observability: "none",
        lifetime: "session-level native weak mode; backend closed on completion or failure",
        nulls: "Strict setter returns NULL without changing state",
      },
    };
  if (
    member.kind === "operator" ||
    member.kind === "cast" ||
    (member.kind === "routine" &&
      member.returns?.name !== "cstring" &&
      !member.arguments.some((argument) => argument.type.name === "cstring"))
  )
    return {
      ...common,
      disposition: "query" as const,
      reason: `Exact schema-qualified native ${member.kind}; canonical member identity selects the captured overload and matching result codec.`,
      semantics: {
        ...pending,
        authority: "query",
        observability: "tables",
        nulls: "Strict native invocation returns NULL for any NULL argument",
        behavior:
          "Native comparison, hashing, conversion, validity or make_valid; no client implementation of ISN algorithms",
      },
    };
  let parent: string;
  if (member.kind === "routine") {
    const owner = manifest.contract.members.find(
      (row) => row.kind === "type" && (row.input === member.id.slice(8) || row.output === member.id.slice(8)),
    );
    if (!owner) throw new Error(`Unowned ISN type callback: ${member.id}`);
    parent = owner.id;
  } else if (member.kind === "opfamily") {
    parent = `opclass:$extension:isn.ean13_ops/${member.accessMethod}`;
  } else if (member.kind === "other") {
    const match =
      /^(function|operator) (\d+) \("\$extension:isn"\.([a-z0-9]+), "\$extension:isn"\.([a-z0-9]+)\) of "\$extension:isn"\.isn_ops USING (btree|hash)$/.exec(
        member.identity,
      );
    if (!match) throw new Error(`Unrecognized ISN access-method attachment: ${member.id}`);
    parent = `opclass:$extension:isn.${match[3]}_ops/${match[5]}`;
  } else throw new Error(`Unreviewed ISN disposition: ${member.id}`);
  return {
    ...common,
    disposition: "internal" as const,
    reason:
      "Captured type I/O, operator-family or access-method attachment; exercised through its exact owning native type/index and never exposed as an application callback.",
    semantics: { ...pending, authority: "internal", parent },
  };
});
