import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  citextProofFamily,
  citextProofSchema,
  citextDatabaseProofCases,
  citextDatabaseFixtureCount,
  citextDatabaseRoleCount,
} from "./citext-proof-cases";
import {
  cubeProofFamily,
  cubeProofSchema,
  cubeDatabaseProofCases,
  cubeDatabaseFixtureCount,
  cubeDatabaseRoleCount,
} from "./cube-proof-cases";

export const wave10CallbackProofs = {
  citext: {
    family: citextProofFamily,
    schema: citextProofSchema,
    member: "type:$extension:citext.citext",
    scenario: "native-fields-arrays-and-index-strategies",
    file: "packages/e2e/integration/extensions-citext.test.ts",
    title: "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses",
    databaseFixtures: citextDatabaseFixtureCount,
    databaseRoles: citextDatabaseRoleCount,
  },
  cube: {
    family: cubeProofFamily,
    schema: cubeProofSchema,
    member: "type:$extension:cube.cube",
    scenario: "native-text-and-binary-wire-dimensions-nonfinite-and-array-constructors",
    file: "packages/e2e/integration/extensions-cube.test.ts",
    title: "cube.nativeBinaryOracleDimensionsNonfiniteAndConstructorArrays",
    databaseFixtures: cubeDatabaseFixtureCount,
    databaseRoles: cubeDatabaseRoleCount,
  },
  autoinc: {
    family: {
      extension: "autoinc",
      version: "1.0",
      postgresMajor: 18,
      provider: "neon",
      manifestDigest: "bcd5ce0898658378ee20de54d2ca173811612f5d2c41c14345ed3eb9473403ee",
    },
    schema: 'trig"ext',
    member: "routine:$extension:autoinc.autoinc()",
    scenario: "native-trigger-null-zero-explicit-values-and-rollback",
    file: "packages/e2e/integration/extensions-autoinc.test.ts",
    title: "autoinc native trigger assigns nextval on insert/update NULL or 0, keeps explicit ids and rolls back",
  },
  moddatetime: {
    family: {
      extension: "moddatetime",
      version: "1.0",
      postgresMajor: 18,
      provider: "neon",
      manifestDigest: "bfaa16ea149d74d0f9e6c5a74144a0240ad18e0e02098a5f39f462c942ca68b6",
    },
    schema: 'trig"ext',
    member: "routine:$extension:moddatetime.moddatetime()",
    scenario: "native-update-transaction-timestamp-insert-preservation-and-rollback",
    file: "packages/e2e/integration/extensions-moddatetime.test.ts",
    title: "moddatetime native trigger stamps transaction start on update only and rolls back",
  },
  tsm_system_rows: {
    family: {
      extension: "tsm_system_rows",
      version: "1.0",
      postgresMajor: 18,
      provider: "neon",
      manifestDigest: "cb606ea0ec43b299ed4776aaeb12126165f751dbf9c5d40a974df6a8a7067eec",
    },
    schema: 'sample"s',
    member: "routine:$extension:tsm_system_rows.system_rows(pg_catalog.internal)",
    scenario: "native-qualified-row-sampling-boundaries-and-rollback",
    file: "packages/e2e/integration/extensions-tsm-system-rows.test.ts",
    title: "tsm_system_rows samples relations through a relocated quoted schema on PostgreSQL 18",
  },
  tsm_system_time: {
    family: {
      extension: "tsm_system_time",
      version: "1.0",
      postgresMajor: 18,
      provider: "neon",
      manifestDigest: "70720316f9c0607be92e7948af63f27a96da580a8f492ce7a3a7d972b779af1f",
    },
    schema: 'sample"s',
    member: "routine:$extension:tsm_system_time.system_time(pg_catalog.internal)",
    scenario: "native-qualified-time-sampling-boundaries-and-rollback",
    file: "packages/e2e/integration/extensions-tsm-system-time.test.ts",
    title: "tsm_system_time samples relations through a relocated quoted schema on PostgreSQL 18",
  },
  intagg: {
    family: {
      extension: "intagg",
      version: "1.1",
      postgresMajor: 18,
      provider: "neon",
      manifestDigest: "7e9c80504c50e5a1910b61667a1774d8c1976c676c087c23fd744168986311f1",
    },
    schema: 'int"agg',
    member: "routine:$extension:intagg.int_array_aggregate(pg_catalog.int4)",
    scenario: "native-empty-null-filter-window-and-rollback-aggregate",
    additionalClaims: [
      {
        member: "routine:$extension:intagg.int_array_enum(pg_catalog._int4)",
        scenario: "native-null-elements-and-strict-null-array-enumeration",
      },
    ],
    databaseFixtures: 2,
    file: "packages/e2e/integration/extensions-intagg.test.ts",
    title: "intagg.nativeAggregateEmptyFilterWindowAndEnum",
  },
  pgstattuple: {
    family: {
      extension: "pgstattuple",
      version: "1.5",
      postgresMajor: 18,
      provider: "neon",
      manifestDigest: "6dd83523499b827ca6ba17e3af232cf28a46dded5819afef113fd37ff3913aec",
    },
    schema: 'stat "tuple"',
    member: "routine:$extension:pgstattuple.pg_relpages(pg_catalog.regclass)",
    scenario: "native-qualified-page-count-and-privileges",
    additionalClaims: [
      { member: "routine:$extension:pgstattuple.pg_relpages(pg_catalog.text)", scenario: "native-text-page-count" },
      {
        member: "routine:$extension:pgstattuple.pgstattuple(pg_catalog.regclass)",
        scenario: "native-quoted-table-tuple-count",
      },
      { member: "routine:$extension:pgstattuple.pgstattuple(pg_catalog.text)", scenario: "native-text-tuple-count" },
      {
        member: "routine:$extension:pgstattuple.pgstattuple_approx(pg_catalog.regclass)",
        scenario: "native-approximate-table-length",
      },
      {
        member: "routine:$extension:pgstattuple.pgstatindex(pg_catalog.regclass)",
        scenario: "native-btree-version-and-leaf-pages",
      },
      {
        member: "routine:$extension:pgstattuple.pgstatindex(pg_catalog.text)",
        scenario: "native-text-btree-version-and-leaf-pages",
      },
      {
        member: "routine:$extension:pgstattuple.pgstatginindex(pg_catalog.regclass)",
        scenario: "native-gin-pending-tuple-count",
      },
      {
        member: "routine:$extension:pgstattuple.pgstathashindex(pg_catalog.regclass)",
        scenario: "native-hash-live-item-count",
      },
    ],
    databaseRoles: 1,
    file: "packages/e2e/integration/extensions-pgstattuple.test.ts",
    title: "pgstattuple and pgrowlocks decode native observation rows against independent SQL",
  },
  pgrowlocks: {
    family: {
      extension: "pgrowlocks",
      version: "1.2",
      postgresMajor: 18,
      provider: "neon",
      manifestDigest: "d14f05ab2ddaedb3b915bc6cbead50da7c1880dcaf2bf37a1e192d1a4a336f61",
    },
    schema: 'stat "tuple"',
    member: "routine:$extension:pgrowlocks.pgrowlocks(pg_catalog.text)",
    scenario: "native-locker-xid-pid-ctid-modes-and-rollback",
    databaseFixtures: 0,
    file: "packages/e2e/integration/extensions-pgstattuple.test.ts",
    title: "pgstattuple and pgrowlocks decode native observation rows against independent SQL",
  },
  dict_int: {
    family: {
      extension: "dict_int",
      version: "1.0",
      postgresMajor: 18,
      provider: "neon",
      manifestDigest: "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da",
    },
    schema: 'dict"int',
    member: 'text search dictionary:"$extension:dict_int".intdict',
    scenario: "native-dictionary-defaults-lexemes-and-null-token",
    additionalClaims: [
      {
        member: 'text search template:"$extension:dict_int".intdict_template',
        scenario: "native-template-callbacks-and-created-dictionary-options",
      },
    ],
    databaseFixtures: 3,
    file: "packages/e2e/integration/extensions-dict_int.test.ts",
    title: "dict_int.dictionaryOptionsChangeTsLexizeWithoutCallingCallbacks",
  },
} as const satisfies Record<
  string,
  {
    family: ExtensionProofFamily;
    schema: string;
    member: string;
    scenario: string;
    file: string;
    title: string;
    additionalClaims?: readonly { member: string; scenario: string }[];
    databaseFixtures?: number;
    databaseRoles?: number;
  }
>;

export function wave10CallbackProofCase(name: keyof typeof wave10CallbackProofs): ExtensionProofCase {
  const selected = wave10CallbackProofs[name];
  const { family, member, scenario, file, title } = selected;
  return {
    id: `${name}.native-callback`,
    file,
    title,
    gate: "database",
    families: [family, ...(name === "pgstattuple" ? [wave10CallbackProofs.pgrowlocks.family] : [])],
    claims: [
      { family, member, scenario },
      ...("additionalClaims" in selected ? selected.additionalClaims.map((claim) => ({ family, ...claim })) : []),
      ...(name === "pgstattuple"
        ? [
            {
              family: wave10CallbackProofs.pgrowlocks.family,
              member: wave10CallbackProofs.pgrowlocks.member,
              scenario: wave10CallbackProofs.pgrowlocks.scenario,
            },
          ]
        : []),
    ],
  };
}

export function wave10AdapterFileName(name: keyof typeof wave10CallbackProofs): string {
  return name === "dict_int" ? name : name.replaceAll("_", "-");
}

export const wave10CallbackDatabaseProofCases: ExtensionProofCase[] = [
  ...(
    ["autoinc", "moddatetime", "tsm_system_rows", "tsm_system_time", "intagg", "pgstattuple", "dict_int"] as const
  ).map(wave10CallbackProofCase),
  ...citextDatabaseProofCases,
  ...cubeDatabaseProofCases,
];
