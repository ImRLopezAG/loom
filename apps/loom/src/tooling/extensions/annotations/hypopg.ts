/** Exact HypoPG 1.4.3 / PG18 captured member dispositions. Acceptance remains parent-owned. */
export const hypopgAnnotations = [
  {
    id: "routine:$extension:hypopg.hypopg_create_index(pg_catalog.text)",
    disposition: "tooling",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "withHypopg.createIndex binds SQL text; PostgreSQL consumes CREATE INDEX statements only and returns every created OID/name. STRICT NULL returns no rows.",
    semantics: {
      authority: "session",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg_drop_index(pg_catalog.oid)",
    disposition: "tooling",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason: "withHypopg.dropIndex returns native bool/STRICT NULL and unhides a removed hypothetical index.",
    semantics: {
      authority: "session",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg_get_indexdef(pg_catalog.oid)",
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason: "getIndexdef delegates to native deparse; missing OID and STRICT NULL return SQL NULL.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg_hidden_indexes()",
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "hiddenIndexes/hiddenIndexRows and withHypopg.hiddenIndexes expose backend-local OIDs; hiddenView reads the captured real/hypothetical index union.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg_hide_index(pg_catalog.oid)",
    disposition: "tooling",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "withHypopg.hideIndex hides real or hypothetical indexes for plain EXPLAIN; duplicate/missing OID returns false, STRICT NULL returns NULL.",
    semantics: {
      authority: "session",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg_relation_size(pg_catalog.oid)",
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "relationSize returns native estimated bytes as bigint; missing non-null OID raises ERROR, STRICT NULL returns NULL.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg_reset_index()",
    disposition: "tooling",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "withHypopg.resetIndex is the captured native reset alias; it removes hypothetical indexes but leaves hidden real indexes.",
    semantics: {
      authority: "session",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg_reset()",
    disposition: "tooling",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "withHypopg.reset removes all hypothetical indexes and their hidden entries; hidden real indexes remain. Not transactionally rolled back.",
    semantics: {
      authority: "session",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg_unhide_all_indexes()",
    disposition: "tooling",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "withHypopg.unhideAllIndexes clears all hidden real and hypothetical indexes without dropping hypothetical definitions.",
    semantics: {
      authority: "session",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg_unhide_index(pg_catalog.oid)",
    disposition: "tooling",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason: "withHypopg.unhideIndex delegates to native hidden-list removal and returns bool/STRICT NULL.",
    semantics: {
      authority: "session",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:hypopg.hypopg()",
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "indexes/indexRows and withHypopg.indexes decode all 12 OUT fields in captured order; int2vector/oidvector/node trees retain native text and NULL.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:hypopg".hypopg_hidden_indexes',
    disposition: "internal",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason: "PostgreSQL-owned _RETURN rewrite rule implements the captured view; no independent application operation.",
    semantics: {
      authority: "schema",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:hypopg".hypopg_list_indexes',
    disposition: "internal",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason: "PostgreSQL-owned _RETURN rewrite rule implements the captured view; no independent application operation.",
    semantics: {
      authority: "schema",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:hypopg._hypopg_hidden_indexes",
    disposition: "schema",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Selected bounded PostgreSQL composite array codec and arrayField for _hypopg_hidden_indexes; native I/O only, no hypothetical index materialization.",
    semantics: {
      authority: "schema",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:hypopg._hypopg_list_indexes",
    disposition: "schema",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Selected bounded PostgreSQL composite array codec and arrayField for _hypopg_list_indexes; native I/O only, no hypothetical index materialization.",
    semantics: {
      authority: "schema",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:hypopg.hypopg_hidden_indexes",
    disposition: "schema",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Selected named composite codec and field for hypopg_hidden_indexes; native I/O only, no hypothetical index materialization.",
    semantics: {
      authority: "schema",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:hypopg.hypopg_list_indexes",
    disposition: "schema",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Selected named composite codec and field for hypopg_list_indexes; native I/O only, no hypothetical index materialization.",
    semantics: {
      authority: "schema",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_hidden_indexes.am_name',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column am_name decoded in hypopg_hidden_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_hidden_indexes.index_name',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column index_name decoded in hypopg_hidden_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_hidden_indexes.indexrelid',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column indexrelid decoded in hypopg_hidden_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_hidden_indexes.is_hypo',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column is_hypo decoded in hypopg_hidden_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_hidden_indexes.schema_name',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column schema_name decoded in hypopg_hidden_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_hidden_indexes.table_name',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column table_name decoded in hypopg_hidden_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_list_indexes.am_name',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column am_name decoded in hypopg_list_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_list_indexes.index_name',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column index_name decoded in hypopg_list_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_list_indexes.indexrelid',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column indexrelid decoded in hypopg_list_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_list_indexes.schema_name',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column schema_name decoded in hypopg_list_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:hypopg".hypopg_list_indexes.table_name',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Exact captured column table_name decoded in hypopg_list_indexes projection/row codec with catalogue nullability.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view:"$extension:hypopg".hypopg_hidden_indexes',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Qualified captured view and exact nullable columns exposed through hiddenView; session observability retained.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view:"$extension:hypopg".hypopg_list_indexes',
    disposition: "query",
    evidence: [
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg--1.4.3.sql",
      "https://github.com/HypoPG/hypopg/blob/1.4.3/hypopg_index.c",
      "packages/e2e/integration/extensions-hypopg.test.ts",
    ],
    reason:
      "Qualified captured view and exact nullable columns exposed through listView; session observability retained.",
    semantics: {
      authority: "query",
      observability: "session",
      live: "Backend-local state and catalogue joins are not automatic table-revision live queries.",
      state:
        "Hypothetical and hidden indexes are backend-local and survive transaction rollback; close/termination releases state.",
      cleanup:
        "reset/reset_index leave hidden real indexes; dedicated tooling also unhide_all_indexes after COMMIT/ROLLBACK.",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
] as const;
