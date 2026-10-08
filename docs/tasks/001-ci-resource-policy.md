# 001 CI resource policy

## Intent and scope

The coordinator authorized only the verify check-step resource bound after the three-case diagnostic window was released. The step now supplies `VITEST_MAX_WORKERS=2` and invokes the original `check` script with Turbo loose environment mode and task concurrency 1. This preserves the original ALL20 graph, task commands, subsequent build-cache restoration, PostgreSQL/packed consumers, browser and provider-scope steps. Versions, services, workflow permissions, checkout authentication, cache settings, test assertions and deadlines are unchanged. The cap bounds Vitest workers and Turbo task overlap, not every subprocess.

This implements the user's resource preference. It is not a demonstrated fix for startup timeouts.

## Environment and cache review

The actual job explicitly supplies only the disposable local PostgreSQL URL and `TURBO_TELEMETRY_DISABLED=1`; the changed step adds only the worker cap. No repository secrets, GitHub token, provider credentials or remote-cache credentials are explicitly mapped into this step. Checkout retains `persist-credentials: false`, and workflow permissions remain `contents: read`.

Loose mode makes all inherited step environment variables visible to every check task, including the disposable database URL and GitHub runner metadata that strict Turbo filtering previously excluded from tasks without explicit declarations. This is a real visibility expansion. It does not create credentials or change the shell step's existing authority. Runner/action-injected variables are not exhaustively inventoried in this source review, so absence of sensitive inherited values is not established. Future secrets added to this job or step would also become visible to these subprocesses and require renewed review.

Turbo does not automatically include arbitrary loose-mode environment values in task cache keys. Existing declared environment inputs still apply, but an undeclared variable affecting task output could cause incorrect cache reuse. The worker cap controls scheduling rather than intended output. No cache keys or restore behavior were changed; this tradeoff is explicit rather than evidence of a startup fix.

## Retained evidence and limitations

- Head `142883c6` failed both CI runs `37705074569` and `37705036215`: 499 passes, one 5000 ms timeout in `diagnostics.test.ts` startup-unwind coverage, 19/20 tasks. The reported 89 worker births are cumulative across files, not measured peak concurrency.
- Local exact-head acceptance previously passed ALL20 and 500 unit tests with Node 24, two Vitest workers and serial Turbo tasks. This did not establish Linux CI behavior.
- The authorized diagnostic matrix ran exactly three selected cases: original, instrumented and beforeAll-preloaded control. Each passed; each filtered 43 other cases. Both modified files were restored and hash-verified after each command; final owned process audits were empty. This is local non-reproduction, not full-suite acceptance.
- Passing-test console output contained no stage markers, so there are no stage deltas. Installed Vitest 5.0.1 selects MinimalReporter for detected agents; that reporter suppresses passing logs. Actual resolved reporter/worker state was not captured in the matrix, so the source mechanism does not prove its historical runtime configuration.
- The original researcher incorrectly claimed the protocol was invalid. The actual supported `otlp-http-json` path imports metrics and OTLP modules before rejecting the endpoint. The original receipt and host correction remain together. Cold-loader delay and shutdown interaction are unconfirmed hypotheses.

Raw CI logs remain under `docs/validation/001-remediation/`. Matrix logs, source variants, hashes, restoration records, release and independent source/log review remain under `docs/validation/001-ci-startup/`. These are retained local artifacts, not portable CI acceptance receipts.

## Verification boundary

No local execution is authorized for this workflow change while feature 006 owns the window. A fresh independent implementation/API/security source review must approve the exact workflow diff before commit and push to existing PR 4. The new head's full CI supplies authoritative workflow execution evidence. Both prior reds remain part of the record even if the resource-policy head passes.

If startup still fails, retain the red and propose a bounded Linux investigation with durable monotonic stage JSONL and resolved reporter/worker evidence before adding instrumentation. Do not relax the 5000 ms test or 2000 ms shutdown contracts, label the failure a flake, or retry the unchanged head as a fix.
