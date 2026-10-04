const evidence = [
  "apps/loom/src/tooling/extensions/manifests/neon.json",
  "https://github.com/neondatabase/neon/blob/fa504217c61bbcaf5c512d75830564541f917f8f/pgxn/neon/README.md",
  "packages/tests/unit/extensions-neon.test.ts",
  "packages/e2e/integration/extensions-neon.test.ts",
] as const;

export const neonAnnotations = [
  {
    id: 'composite type:"$extension:neon".neon_wait_event_snapshot',
    disposition: "schema",
    reason:
      "Native named composite declaration neon_wait_event_snapshot; codecs/arrays expose its exact captured record shape.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.__neon_internal_current_snapshot_with_subxids()",
    disposition: "internal",
    reason:
      "Provider snapshot/trigger callback; native provider execution context, not an ordinary application helper.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.approximate_working_set_size_seconds(pg_catalog.int4)",
    disposition: "query",
    reason:
      "Native SQL helper approximateWorkingSetSizeSeconds / sql.functions.approximate_working_set_size_seconds; exact checked result codec; no JavaScript replacement.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.approximate_working_set_size(pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method approximateWorkingSetSize; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.backpressure_lsns()",
    disposition: "query",
    reason:
      "Native SQL helper backpressureLsns / sql.functions.backpressure_lsns; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.backpressure_throttling_time()",
    disposition: "query",
    reason:
      "Native SQL helper backpressureThrottlingTime / sql.functions.backpressure_throttling_time; exact checked result codec; no JavaScript replacement.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.cancel_buffer_cache_prewarm()",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method cancelBufferCachePrewarm; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.cancel_prewarm()",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method cancelPrewarm; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.get_backend_perf_counters()",
    disposition: "query",
    reason:
      "Native SQL helper getBackendPerfCounters / sql.functions.get_backend_perf_counters; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.get_buffer_cache_state_sql(pg_catalog.int4)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method getBufferCacheStateSql; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "native-error-42501",
      privilege:
        "Actual Neon 1.25 fixture returned SQLSTATE42501. PUBLIC EXECUTE alone does not establish authorization; native role checks remain authoritative.",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.get_buffercache_prewarm_info()",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method getBuffercachePrewarmInfo; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "native-error-42501",
      privilege:
        "Actual Neon 1.25 fixture returned SQLSTATE42501. PUBLIC EXECUTE alone does not establish authorization; native role checks remain authoritative.",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.get_hll_state()",
    disposition: "query",
    reason:
      "Native SQL helper getHllState / sql.functions.get_hll_state; exact checked result codec; no JavaScript replacement.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "native-error-42501",
      privilege:
        "Actual Neon 1.25 fixture returned SQLSTATE42501. PUBLIC EXECUTE alone does not establish authorization; native role checks remain authoritative.",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.get_local_cache_state(pg_catalog.int4)",
    disposition: "query",
    reason:
      "Native SQL helper getLocalCacheState / sql.functions.get_local_cache_state; exact checked result codec; no JavaScript replacement.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.get_perf_counters()",
    disposition: "query",
    reason:
      "Native SQL helper getPerfCounters / sql.functions.get_perf_counters; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.get_prewarm_info()",
    disposition: "query",
    reason:
      "Native SQL helper getPrewarmInfo / sql.functions.get_prewarm_info; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      resultNullability:
        "Exact Neon 1.25 read-only native run a465acd2-b00b-47c0-b824-0b992169aa8b observed whole SQL NULL. The scalar helper preserves NULL separately from a record with nullable OUT attributes.",
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.local_cache_pages()",
    disposition: "query",
    reason:
      "Native SQL helper localCachePages / sql.functions.local_cache_pages; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_backend_wait_report(pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Native SQL helper neonBackendWaitReport / sql.functions.neon_backend_wait_report; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "native-error-42704",
      prerequisite:
        "Actual Neon 1.25 returned SQLSTATE42704: type neon_wait_event_snapshot[] does not exist. These native PL/pgSQL reports require the extension schema in the caller session search_path. Qualified function invocation alone does not provide it; preserve current path and native error, never silently SET or replace the report algorithm.",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_backpressure_status()",
    disposition: "query",
    reason:
      "Native SQL helper neonBackpressureStatus / sql.functions.neon_backpressure_status; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_check_for_superuser()",
    disposition: "internal",
    reason:
      "Provider snapshot/trigger callback; native provider execution context, not an ordinary application helper.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_clear_lfc()",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method neonClearLfc; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_communicator_min_inflight_request_lsn()",
    disposition: "query",
    reason:
      "Native SQL helper neonCommunicatorMinInflightRequestLsn / sql.functions.neon_communicator_min_inflight_request_lsn; exact checked result codec; no JavaScript replacement.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_datum_image_equal(pg_catalog.anyelement,pg_catalog.anyelement)",
    disposition: "query",
    reason:
      "Native SQL helper neonDatumImageEqual / sql.functions.neon_datum_image_equal; exact checked result codec; no JavaScript replacement.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_emit_reverse_etl_commit(pg_catalog.bytea)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method neonEmitReverseEtlCommit; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_get_backend_wait_event_stats(pg_catalog.int4)",
    disposition: "query",
    reason:
      "Native SQL helper neonGetBackendWaitEventStats / sql.functions.neon_get_backend_wait_event_stats; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_get_cache_stats()",
    disposition: "query",
    reason:
      "Native SQL helper neonGetCacheStats / sql.functions.neon_get_cache_stats; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_get_lfc_stats()",
    disposition: "query",
    reason:
      "Native SQL helper neonGetLfcStats / sql.functions.neon_get_lfc_stats; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_get_wait_event_stats()",
    disposition: "query",
    reason:
      "Native SQL helper neonGetWaitEventStats / sql.functions.neon_get_wait_event_stats; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_invalidate_relsize_cache(pg_catalog.oid,pg_catalog.int4)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method neonInvalidateRelsizeCache; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_lfc_part_stats()",
    disposition: "query",
    reason:
      "Native SQL helper neonLfcPartStats / sql.functions.neon_lfc_part_stats; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_shmem_huge_pages(pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method neonShmemHugePages; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "native-error-42501",
      privilege:
        "Actual Neon 1.25 fixture returned SQLSTATE42501. PUBLIC EXECUTE alone does not establish authorization; native role checks remain authoritative.",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.neon_wait_report(pg_catalog.int4)",
    disposition: "query",
    reason:
      "Native SQL helper neonWaitReport / sql.functions.neon_wait_report; exact captured OUT/record row codec and FROM helper.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "native-error-42704",
      prerequisite:
        "Actual Neon 1.25 returned SQLSTATE42704: type neon_wait_event_snapshot[] does not exist. These native PL/pgSQL reports require the extension schema in the caller session search_path. Qualified function invocation alone does not provide it; preserve current path and native error, never silently SET or replace the report algorithm.",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.pg_cluster_size()",
    disposition: "query",
    reason:
      "Native SQL helper pgClusterSize / sql.functions.pg_cluster_size; exact checked result codec; no JavaScript replacement.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.pg_resize_shared_buffers(pg_catalog.text)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method pgResizeSharedBuffers; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.prewarm_buffer_cache(pg_catalog.bytea)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method prewarmBufferCache; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.prewarm_local_cache(pg_catalog.bytea,pg_catalog.int4)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method prewarmLocalCache; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.replace_hll(pg_catalog.bytea)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method replaceHll; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "routine:$extension:neon.reset_perf_counter(pg_catalog.text)",
    disposition: "tooling",
    reason:
      "withNeonOperation explicit operator method resetPerfCounter; preserves native defaults and result decoding. Never exposed through RPC bindings.",
    evidence,
    semantics: {
      authority: "tooling",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:neon".local_cache',
    disposition: "internal",
    reason:
      "PostgreSQL-owned rule dependency of the native view/composite; no ordinary SQL-callable application member.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:neon".neon_backend_perf_counters',
    disposition: "internal",
    reason:
      "PostgreSQL-owned rule dependency of the native view/composite; no ordinary SQL-callable application member.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:neon".neon_backpressure_status',
    disposition: "internal",
    reason:
      "PostgreSQL-owned rule dependency of the native view/composite; no ordinary SQL-callable application member.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:neon".neon_lfc_stats',
    disposition: "internal",
    reason:
      "PostgreSQL-owned rule dependency of the native view/composite; no ordinary SQL-callable application member.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:neon".neon_lwlsn_cache_stats',
    disposition: "internal",
    reason:
      "PostgreSQL-owned rule dependency of the native view/composite; no ordinary SQL-callable application member.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:neon".neon_perf_counters',
    disposition: "internal",
    reason:
      "PostgreSQL-owned rule dependency of the native view/composite; no ordinary SQL-callable application member.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:neon".neon_relperst_cache_stats',
    disposition: "internal",
    reason:
      "PostgreSQL-owned rule dependency of the native view/composite; no ordinary SQL-callable application member.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:neon".neon_relsize_cache_stats',
    disposition: "internal",
    reason:
      "PostgreSQL-owned rule dependency of the native view/composite; no ordinary SQL-callable application member.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:neon".neon_stat_file_cache',
    disposition: "internal",
    reason:
      "PostgreSQL-owned rule dependency of the native view/composite; no ordinary SQL-callable application member.",
    evidence,
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._local_cache",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.local_cache; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._neon_backend_perf_counters",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.neon_backend_perf_counters; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._neon_backpressure_status",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.neon_backpressure_status; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._neon_lfc_stats",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.neon_lfc_stats; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._neon_lwlsn_cache_stats",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.neon_lwlsn_cache_stats; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._neon_perf_counters",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.neon_perf_counters; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._neon_relperst_cache_stats",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.neon_relperst_cache_stats; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._neon_relsize_cache_stats",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.neon_relsize_cache_stats; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._neon_stat_file_cache",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.neon_stat_file_cache; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon._neon_wait_event_snapshot",
    disposition: "query",
    reason:
      "Qualified native array codec and schema arrayFields.neon_wait_event_snapshot; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.local_cache",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.local_cache; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.neon_backend_perf_counters",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.neon_backend_perf_counters; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.neon_backpressure_status",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.neon_backpressure_status; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.neon_lfc_stats",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.neon_lfc_stats; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.neon_lwlsn_cache_stats",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.neon_lwlsn_cache_stats; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.neon_perf_counters",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.neon_perf_counters; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.neon_relperst_cache_stats",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.neon_relperst_cache_stats; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.neon_relsize_cache_stats",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.neon_relsize_cache_stats; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.neon_stat_file_cache",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.neon_stat_file_cache; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: "type:$extension:neon.neon_wait_event_snapshot",
    disposition: "query",
    reason:
      "Qualified native composite codec and schema fields.neon_wait_event_snapshot; captured attribute order and nullable values retained.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".local_cache.accesscount',
    disposition: "query",
    reason: "Typed native view column; exact codec in localCacheFields and views.local_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".local_cache.pageoffs',
    disposition: "query",
    reason: "Typed native view column; exact codec in localCacheFields and views.local_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".local_cache.relblocknumber',
    disposition: "query",
    reason: "Typed native view column; exact codec in localCacheFields and views.local_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".local_cache.reldatabase',
    disposition: "query",
    reason: "Typed native view column; exact codec in localCacheFields and views.local_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".local_cache.relfilenode',
    disposition: "query",
    reason: "Typed native view column; exact codec in localCacheFields and views.local_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".local_cache.relforknumber',
    disposition: "query",
    reason: "Typed native view column; exact codec in localCacheFields and views.local_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".local_cache.reltablespace',
    disposition: "query",
    reason: "Typed native view column; exact codec in localCacheFields and views.local_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_backend_perf_counters.bucket_le',
    disposition: "query",
    reason:
      "Typed native view column; exact codec in neonBackendPerfCountersFields and views.neon_backend_perf_counters.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_backend_perf_counters.metric',
    disposition: "query",
    reason:
      "Typed native view column; exact codec in neonBackendPerfCountersFields and views.neon_backend_perf_counters.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_backend_perf_counters.pid',
    disposition: "query",
    reason:
      "Typed native view column; exact codec in neonBackendPerfCountersFields and views.neon_backend_perf_counters.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_backend_perf_counters.procno',
    disposition: "query",
    reason:
      "Typed native view column; exact codec in neonBackendPerfCountersFields and views.neon_backend_perf_counters.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_backend_perf_counters.value',
    disposition: "query",
    reason:
      "Typed native view column; exact codec in neonBackendPerfCountersFields and views.neon_backend_perf_counters.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_backpressure_status.metric',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonBackpressureStatusFields and views.neon_backpressure_status.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_backpressure_status.value',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonBackpressureStatusFields and views.neon_backpressure_status.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_lfc_stats.lfc_key',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonLfcStatsFields and views.neon_lfc_stats.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_lfc_stats.lfc_value',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonLfcStatsFields and views.neon_lfc_stats.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_lwlsn_cache_stats.metric_name',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonLwlsnCacheStatsFields and views.neon_lwlsn_cache_stats.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_lwlsn_cache_stats.metric_value',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonLwlsnCacheStatsFields and views.neon_lwlsn_cache_stats.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_perf_counters.bucket_le',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonPerfCountersFields and views.neon_perf_counters.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_perf_counters.metric',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonPerfCountersFields and views.neon_perf_counters.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_perf_counters.value',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonPerfCountersFields and views.neon_perf_counters.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_relperst_cache_stats.metric_name',
    disposition: "query",
    reason:
      "Typed native view column; exact codec in neonRelperstCacheStatsFields and views.neon_relperst_cache_stats.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_relperst_cache_stats.metric_value',
    disposition: "query",
    reason:
      "Typed native view column; exact codec in neonRelperstCacheStatsFields and views.neon_relperst_cache_stats.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_relsize_cache_stats.metric_name',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonRelsizeCacheStatsFields and views.neon_relsize_cache_stats.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_relsize_cache_stats.metric_value',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonRelsizeCacheStatsFields and views.neon_relsize_cache_stats.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_hit_ratio',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonStatFileCacheFields and views.neon_stat_file_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_hits',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonStatFileCacheFields and views.neon_stat_file_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_misses',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonStatFileCacheFields and views.neon_stat_file_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_used',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonStatFileCacheFields and views.neon_stat_file_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_writes',
    disposition: "query",
    reason: "Typed native view column; exact codec in neonStatFileCacheFields and views.neon_stat_file_cache.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view:"$extension:neon".local_cache',
    disposition: "query",
    reason:
      "Native view views.local_cache reads the captured database view, preserving provider calculation/filtering and external-state rejection.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view:"$extension:neon".neon_backend_perf_counters',
    disposition: "query",
    reason:
      "Native view views.neon_backend_perf_counters reads the captured database view, preserving provider calculation/filtering and external-state rejection.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view:"$extension:neon".neon_backpressure_status',
    disposition: "query",
    reason:
      "Native view views.neon_backpressure_status reads the captured database view, preserving provider calculation/filtering and external-state rejection.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view:"$extension:neon".neon_lfc_stats',
    disposition: "query",
    reason:
      "Native view views.neon_lfc_stats reads the captured database view, preserving provider calculation/filtering and external-state rejection.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view:"$extension:neon".neon_lwlsn_cache_stats',
    disposition: "query",
    reason:
      "Native view views.neon_lwlsn_cache_stats reads the captured database view, preserving provider calculation/filtering and external-state rejection.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view:"$extension:neon".neon_perf_counters',
    disposition: "query",
    reason:
      "Native view views.neon_perf_counters reads the captured database view, preserving provider calculation/filtering and external-state rejection.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view:"$extension:neon".neon_relperst_cache_stats',
    disposition: "query",
    reason:
      "Native view views.neon_relperst_cache_stats reads the captured database view, preserving provider calculation/filtering and external-state rejection.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view:"$extension:neon".neon_relsize_cache_stats',
    disposition: "query",
    reason:
      "Native view views.neon_relsize_cache_stats reads the captured database view, preserving provider calculation/filtering and external-state rejection.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
  {
    id: 'view:"$extension:neon".neon_stat_file_cache',
    disposition: "query",
    reason:
      "Native view views.neon_stat_file_cache reads the captured database view, preserving provider calculation/filtering and external-state rejection.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      version: "1.25",
      limitation:
        "Exact provider binary unavailable locally. Captured catalog is contract provenance, not native semantic acceptance.",
    },
  },
] as const;
