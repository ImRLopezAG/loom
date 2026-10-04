import type {
  ExtensionProofCase,
  ExtensionProofFamily,
  ExtensionMemberProof,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { citextAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/citext";

export const citextProofFamily = {
  extension: "citext",
  version: "1.8",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3",
} as const satisfies ExtensionProofFamily;
export const citextProofSchema = "case_text";
const file = "packages/e2e/integration/extensions-citext.test.ts";
export const citextRoutineProofMembers = [
  "routine:$extension:citext.citext_cmp($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_eq($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_ge($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_gt($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_larger($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_le($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_lt($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_ne($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_pattern_cmp($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_pattern_ge($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_pattern_gt($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_pattern_le($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_pattern_lt($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext_smaller($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.citext(pg_catalog.bool)",
  "routine:$extension:citext.citext(pg_catalog.bpchar)",
  "routine:$extension:citext.citext(pg_catalog.inet)",
  "routine:$extension:citext.citextsend($extension:citext.citext)",
  "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.replace($extension:citext.citext,$extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.split_part($extension:citext.citext,$extension:citext.citext,pg_catalog.int4)",
  "routine:$extension:citext.strpos($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.texticlike($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.texticlike($extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.texticnlike($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.texticnlike($extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.texticregexeq($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.texticregexeq($extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.texticregexne($extension:citext.citext,$extension:citext.citext)",
  "routine:$extension:citext.texticregexne($extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.translate($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
  "routine:$extension:citext.citext_hash($extension:citext.citext)",
  "routine:$extension:citext.citext_hash_extended($extension:citext.citext,pg_catalog.int8)",
] as const;
export const citextOperatorProofMembers = [
  "operator:$extension:citext.!~($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.!~($extension:citext.citext,pg_catalog.text)",
  "operator:$extension:citext.!~*($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.!~*($extension:citext.citext,pg_catalog.text)",
  "operator:$extension:citext.!~~($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.!~~($extension:citext.citext,pg_catalog.text)",
  "operator:$extension:citext.!~~*($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.!~~*($extension:citext.citext,pg_catalog.text)",
  "operator:$extension:citext.<($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.<=($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.<>($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.=($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.>($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.>=($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.~($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.~($extension:citext.citext,pg_catalog.text)",
  "operator:$extension:citext.~*($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.~*($extension:citext.citext,pg_catalog.text)",
  "operator:$extension:citext.~<=~($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.~<~($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.~>=~($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.~>~($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.~~($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.~~($extension:citext.citext,pg_catalog.text)",
  "operator:$extension:citext.~~*($extension:citext.citext,$extension:citext.citext)",
  "operator:$extension:citext.~~*($extension:citext.citext,pg_catalog.text)",
] as const;
export const citextCastProofMembers = [
  "cast:$extension:citext.citext->pg_catalog.bpchar",
  "cast:$extension:citext.citext->pg_catalog.text",
  "cast:$extension:citext.citext->pg_catalog.varchar",
  "cast:pg_catalog.bool->$extension:citext.citext",
  "cast:pg_catalog.bpchar->$extension:citext.citext",
  "cast:pg_catalog.inet->$extension:citext.citext",
  "cast:pg_catalog.text->$extension:citext.citext",
  "cast:pg_catalog.varchar->$extension:citext.citext",
] as const;
export const citextAggregateProofMembers = [
  "routine:$extension:citext.max($extension:citext.citext)",
  "routine:$extension:citext.min($extension:citext.citext)",
] as const;
export const citextSchemaProofMembers = [
  "opclass:$extension:citext.citext_ops/btree",
  "opclass:$extension:citext.citext_ops/hash",
  "opclass:$extension:citext.citext_pattern_ops/btree",
  "type:$extension:citext._citext",
  "type:$extension:citext.citext",
] as const;
export const citextRoutinesProofCase = {
  id: "citext.allCallableRoutinesAndStrictNull",
  file,
  title: "citext.allCallableRoutinesAndStrictNull",
  gate: "database",
  families: [citextProofFamily],
  claims: citextRoutineProofMembers.map((member) => ({
    family: citextProofFamily,
    member,
    scenario: "native-hardcoded-values-strict-nulls-and-independent-hash-sql",
  })),
} satisfies ExtensionProofCase;
export const citextOperatorsProofCase = {
  id: "citext.all26OperatorsBothDirectionsAndNull",
  file,
  title: "citext.all26OperatorsBothDirectionsAndNull",
  gate: "database",
  families: [citextProofFamily],
  claims: citextOperatorProofMembers.map((member) => ({
    family: citextProofFamily,
    member,
    scenario: "native-both-directions-boolean-values-and-strict-nulls",
  })),
} satisfies ExtensionProofCase;
export const citextCastsAggregatesProofCase = {
  id: "citext.allEightCastsRegexEdgesAggregatesAndComposition",
  file,
  title: "citext.allEightCastsRegexEdgesAggregatesAndComposition",
  gate: "database",
  families: [citextProofFamily],
  claims: [...citextCastProofMembers, ...citextAggregateProofMembers].map((member) => ({
    family: citextProofFamily,
    member,
    scenario: "native-exact-casts-nulls-empty-filter-distinct-and-window-aggregates",
  })),
} satisfies ExtensionProofCase;
export const citextSchemaIndexesProofCase = {
  id: "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses",
  file,
  title: "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses",
  gate: "database",
  families: [citextProofFamily],
  claims: citextSchemaProofMembers.map((member) => ({
    family: citextProofFamily,
    member,
    scenario: "native-text-binary-arrays-snapshot-unique-index-strategies-and-hash-routing",
  })),
} satisfies ExtensionProofCase;
export const citextDatabaseProofCases = [
  citextRoutinesProofCase,
  citextOperatorsProofCase,
  citextCastsAggregatesProofCase,
  citextSchemaIndexesProofCase,
] satisfies ExtensionProofCase[];
// All seven tests in the native file allocate exactly one database, including three additional regression cases.
export const citextDatabaseFixtureCount = 7;
export const citextDatabaseRoleCount = 0;

// These are exact rows from the pinned manifest, never inferred from a routine name.
// The verifier still corroborates them against the observed database and executed parent witness.
const citextInternalRelations = {
  "routine:$extension:citext.citextin(pg_catalog.cstring)": {
    from: "type:$extension:citext.citext",
    relation: {
      kind: "type-routine",
      slot: "input",
    },
  },
  "routine:$extension:citext.citextout($extension:citext.citext)": {
    from: "type:$extension:citext.citext",
    relation: {
      kind: "type-routine",
      slot: "output",
    },
  },
  "routine:$extension:citext.citextrecv(pg_catalog.internal)": {
    from: "type:$extension:citext.citext",
    relation: {
      kind: "type-routine",
      slot: "receive",
    },
  },
  "opfamily:$extension:citext.citext_ops/btree": {
    from: "opclass:$extension:citext.citext_ops/btree",
    relation: {
      kind: "opclass-family",
    },
  },
  'function of access method:function 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_ops/btree",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          number: 1,
          procedure: "$extension:citext.citext_cmp($extension:citext.citext,$extension:citext.citext)",
        },
      },
    },
  'operator of access method:operator 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 1,
          purpose: "s",
          operator: "$extension:citext.<($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 2 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 2,
          purpose: "s",
          operator: "$extension:citext.<=($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 3 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 3,
          purpose: "s",
          operator: "$extension:citext.=($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 4 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 4,
          purpose: "s",
          operator: "$extension:citext.>=($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 5 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 5,
          purpose: "s",
          operator: "$extension:citext.>($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  "opfamily:$extension:citext.citext_ops/hash": {
    from: "opclass:$extension:citext.citext_ops/hash",
    relation: {
      kind: "opclass-family",
    },
  },
  'function of access method:function 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING hash':
    {
      from: "opclass:$extension:citext.citext_ops/hash",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_ops/hash",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          number: 1,
          procedure: "$extension:citext.citext_hash($extension:citext.citext)",
        },
      },
    },
  'function of access method:function 2 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING hash':
    {
      from: "opclass:$extension:citext.citext_ops/hash",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_ops/hash",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          number: 2,
          procedure: "$extension:citext.citext_hash_extended($extension:citext.citext,pg_catalog.int8)",
        },
      },
    },
  'operator of access method:operator 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING hash':
    {
      from: "opclass:$extension:citext.citext_ops/hash",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_ops/hash",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 1,
          purpose: "s",
          operator: "$extension:citext.=($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  "opfamily:$extension:citext.citext_pattern_ops/btree": {
    from: "opclass:$extension:citext.citext_pattern_ops/btree",
    relation: {
      kind: "opclass-family",
    },
  },
  'function of access method:function 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_pattern_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_pattern_ops/btree",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          number: 1,
          procedure: "$extension:citext.citext_pattern_cmp($extension:citext.citext,$extension:citext.citext)",
        },
      },
    },
  'operator of access method:operator 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_pattern_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_pattern_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 1,
          purpose: "s",
          operator: "$extension:citext.~<~($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 2 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_pattern_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_pattern_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 2,
          purpose: "s",
          operator: "$extension:citext.~<=~($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 3 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_pattern_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_pattern_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 3,
          purpose: "s",
          operator: "$extension:citext.=($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 4 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_pattern_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_pattern_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 4,
          purpose: "s",
          operator: "$extension:citext.~>=~($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 5 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree':
    {
      from: "opclass:$extension:citext.citext_pattern_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:citext.citext_pattern_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:citext",
            name: "citext",
          },
          right: {
            namespace: "$extension:citext",
            name: "citext",
          },
          strategy: 5,
          purpose: "s",
          operator: "$extension:citext.~>~($extension:citext.citext,$extension:citext.citext)",
          sortFamily: null,
        },
      },
    },
} satisfies Record<string, { from: string; relation: ExtensionMemberProof["transfers"][number]["relation"] }>;
export const citextMemberProofs: ExtensionMemberProof[] = citextAnnotations.map((annotation) => {
  const direct = citextDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === annotation.id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
  const edge = Object.entries(citextInternalRelations).find(([id]) => id === annotation.id)?.[1];
  const parent =
    edge &&
    citextDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === edge.from)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    );
  if (annotation.disposition === "internal" && (!edge || !parent || parent.length !== 1))
    throw new Error(`Missing exact Citext internal parent: ${annotation.id}`);
  if (annotation.disposition !== "internal" && direct.length !== 1)
    throw new Error(`Missing executed Citext member case: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: direct,
    transfers:
      edge && parent
        ? parent.map((proof) => ({
            ...edge,
            ...proof,
            basis:
              "Exact captured Citext graph edge; native text/binary type and indexed-versus-sequential strategy/hash-routing parent oracles execute this registration.",
          }))
        : [],
  };
});
