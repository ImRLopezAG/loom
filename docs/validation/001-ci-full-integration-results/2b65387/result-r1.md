# Exact 2b65387 refusal provenance results

Both runs on `2b65387ec6293980828274202d10d2471ec00386` completed **failure**:

- Push run `37723652120`, verify job `113136763319`.
- Pull-request run `37723655151`, verify job `113136773621`.

Each actual log records ALL20 successful tasks, 89 unit files / 500 passing tests, then restore-build 8/8 successful. The native integration step exits 1 during diagnostic preflight. Upload succeeds; Chromium, browser/copied packed example and provider-scope steps are skipped. This is not full feature acceptance.

## Directly observed refusal

Both digest-verified result receipts contain the same bounded observation:

```json
{"status":"observed","stage":"dependency","file":"file_35","regular":true,"nlink":2,"size":753,"bound":1048576,"failedPredicates":["link_count_not_one"]}
```

The exact committed supervisor maps `file_35` to `node_modules/turbo/package.json`. Its descriptor was a regular 753-byte file with link count 2; only the single-link predicate failed. This identifies the current supervisor preflight refusal. It does not identify the writer, cache origin, other hardlink pathname, or installation mechanism, and does not retrospectively prove the uninstrumented ff45799 descriptor state. Bun hardlink behavior was previously a hypothesis; the present receipts directly prove this descriptor's link count, not that hypothesis's entire causal chain.

The primary reason remains `file_type_or_bound`. `originalExit`, workload, lineage, provisioning, trace and resolved reporter remain null. Before/after source hashes are empty. Each archive contains only result.json (595 bytes) and supervisor.jsonl (133 bytes, supervisor.end). `restored:true` is the no-application path; empty direct-child audit/count zero is preflight-only. No original integration workload, overlay application, exercised restoration or workload descendant cleanup was established. Earlier development credential-recovery and provisioning timeout causes remain unresolved; historical named skips and reds remain preserved.

## Artifact integrity

- Push ZIP digest: `8fa604c03a7794ec9224976b8ae84c7360c4c5fb84dd590e2c82a16b20f593b1`.
- Pull-request ZIP digest: `98ff8fa8c25501c431759a6574cf79be5e11f362a271009995c4065908e37b09`.

Downloaded archive SHA-256 matched each GitHub artifact digest. Member names were exactly result.json and supervisor.jsonl, bounded before extraction into owned receipt paths. Raw run metadata, artifact metadata, logs, ZIPs and extracted members are retained alongside a per-file inventory.

## Disposition

Finite refusal provenance was obtained. CI remains red; no guard/backend/install/platform/workflow adaptation is applied or implicitly authorized. Any proposed handling of an installed dependency's hardlinked metadata needs a separately scoped source design and review that preserves strict guards on owned artifacts, live source, restoration and publication. No local supervisor import, syntax execution, test/build/DB/probe, dependency mutation, commit, push or manual CI rerun occurred while consuming these results. No new reviewer was launched.
