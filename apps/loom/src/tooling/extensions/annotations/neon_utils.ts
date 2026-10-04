export const neonUtilsAnnotations = [
  {
    id: "routine:$extension:neon_utils.num_cpus()",
    disposition: "query",
    reason: "numCpus / sql.functions.num_cpus: zero-argument native CPU observation with exact signed int4 decoding.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/neon_utils.json",
      "https://github.com/neondatabase/neon/blob/1401021b21c6338951b6c8eb2d3d2c4c5729918f/pgxn/neon_utils/neon_utils.c",
      "https://github.com/neondatabase/neon/blob/1401021b21c6338951b6c8eb2d3d2c4c5729918f/pgxn/neon_utils/neon_utils--1.0.sql",
      "packages/tests/unit/extensions-neon_utils.test.ts",
      "packages/tests/types/extensions-neon_utils.test-d.ts",
      "packages/e2e/integration/extensions-neon_utils.test.ts",
    ],
    semantics: {
      authority: "query",
      observability: "external",
      codec: "pg:int4:1",
      nulls: "STRICT zero-argument function: no nullable argument or invented NULL overload; native int4 result.",
      privilege: "Captured PUBLIC EXECUTE, security invoker; schema USAGE and current EXECUTE grants still apply.",
      live: "Host observation is not a table dependency; automatic table-revision subscriptions reject it.",
      volatility: "VOLATILE / PARALLEL UNSAFE; preserve native per-evaluation behavior without caching or retries.",
      transaction: "Uses the invocation database transaction; no new connection, session mutation or admin operation.",
      result: "Signed PostgreSQL int4 number, without client-side CPU discovery or a positive-count guarantee.",
      limitation:
        "Public upstream 1401021 source/control declares 1.0, not selected 1.1. It describes online host processors (sysconf/GetSystemInfo), not a vCPU quota guarantee. Exact 1.1 binary/provider semantics remain unaccepted until native proof.",
      schema:
        "Relocatable function qualification only; no extension-owned types, fields, indexes or tooling members are captured.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
] as const;
