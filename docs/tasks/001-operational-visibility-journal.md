# Operational visibility phase and acceptance journal

## 2026-10-07 — Planning accepted for execution

Worktree: `/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility`; baseline `1590e4ec272cf4fc32bcaeb7123d94b2ac789fa1`. No CodeGraph index. Source provenance is in the refined plan. Only owned files may be committed.

Applied plan-loop, lfg, ce-plan mode:pipeline and ce-doc-review mode:non-interactive. Product acceptance unchanged. User authorized implementation and shipping; no production changes or merge authorized.

Review receipts use task ID prefix `node:delegated-task:command%3Amcp%3A40ead648-2078-4138-b285-f034f18910d1%3Adelegate-task%3A` and these suffixes. All completed on codex/gpt-6-astra, reasoning low:

| Suffix | Result | Disposition |
| --- | --- | --- |
| 001-plan-coherence-reviewer-r1 | P2 versioned shape omitted mandatory loss branch | Retained; corrected the exported union to include runtime, deployment and diagnostics.loss with cumulative DiagnosticsStats. Otherwise typed consumers could reject valid emitted loss records. |
| 001-plan-feasibility-reviewer-r1 | Approved, no findings | Accepted; implementation and runtime gates remain pending. |
| 001-plan-security-lens-reviewer-r1 | Approved, no findings | Accepted. |
| 001-plan-scope-guardian-reviewer-r1 | Approved, no findings | Accepted. |
| 001-plan-adversarial-document-reviewer-r1 | Approved, no findings | Accepted. |

Resolved review: fixes_applied=1, proposed_fixes_count=0, decisions_count=0, fyi_count=0. Correction is directly supported by the existing loss-record requirement and authorized draft revision. Supplemental other-provider pass was not run: user prescribed codex/astra independent reviewers.

Research receipt `001-planning-research-v1` completed on codex/gpt-6-luna low. Pinned Effect APIs inspected; real collector and PostgreSQL acceptance are separate and pending. Docker availability is infrastructure evidence only.

## Acceptance ledger

| Unit | Implementation | Phase tests | Independent review | Commit |
| --- | --- | --- | --- | --- |
| U1 | Complete | 11 tests/build/types/lint passed | Approved r1 | U1 changeset |
| U2 | Pending | Pending | Pending | Pending |
| U3 | Pending | Pending (disposable PG18) | Pending | Pending |
| U4 | Pending | Pending (actual collector) | Pending | Pending |
| U5 | Pending | Pending | Pending | Pending |
| U6 | Pending | Pending (packed consumers/browser/root/CI) | Pending | Pending |

Shared contract: initial 68 series, maximum128; 005 owns atomic17-series extension to85 and cleanup-operation unit{event}; 004 adds no telemetry variants. No metadata migration. Root received planned shared file changes before implementation. Reviewed baseline handoff to root/005 is pending U1 acceptance; mapping acceptance remains a later gate.

## U1 preparation and infrastructure

Planning commit: `4e42917b`. Worker task suffix `001-u1-projection-v1`, codex/gpt-6.1-sol medium, owns types/project and one unit test only. Read-only native acceptance researcher suffix `001-native-acceptance-research-v1`, codex/gpt-6-luna low. Host retains all builds, commits and canonical verification.

`bun install --frozen-lockfile` exited0; 1165 packages installed, Bun1.4.2. Installed Effect4.0.0, TypeScript7.0.2 and Turbo2.11.6 verified. Read installed Turbo docs/README and running-tasks docs before any Turbo command. `vp test run --help` (Vitest5.0.1) confirms `--maxWorkers`; use2 for suite runner.

Disposable PG command: `docker run -d --name kello-001-pg18-visibility --label kello.feature=001 --label kello.disposable=true -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=kello001 -p 127.0.0.1::5432 postgres:18`. Container ID `9873e3f6ade983850d869982d511e2a2ac939ac188d2c954573cd97f917dd53a`, port127.0.0.1:32774. `docker exec kello-001-pg18-visibility psql -U postgres -d kello001 -Atc 'select version()'` exited0: PostgreSQL18.6 Debian18.6-1.pgdg13+2/aarch64. Disposable URL has no password: `postgresql://postgres@127.0.0.1:32774/kello001`. Only this feature container may be cleaned up by this thread. Infrastructure only; native acceptance pending.

`docker pull otel/opentelemetry-collector:0.156.0` exited0, digest `sha256:0beba82d63792511591522a8d582904b9a8ae81710357bfcab731607b8b0ffe2`. Collector is not yet launched and wire acceptance remains pending.

Collector launched with mounted `/tmp/kello-001-collector/config.yaml`: otlp/http receiver0.0.0.0:4318, debug exporter verbosity detailed, metrics pipeline. Exact launch: `docker run -d --name kello-001-collector --label kello.feature=001 --label kello.disposable=true -p 127.0.0.1::4318 -v /tmp/kello-001-collector/config.yaml:/etc/otelcol/config.yaml:ro otel/opentelemetry-collector@sha256:0beba82d63792511591522a8d582904b9a8ae81710357bfcab731607b8b0ffe2 --config=/etc/otelcol/config.yaml`. Container `bbf63593ed135bad9fb4d30cc84bedcfcc32cd3d3d808ea42c9e03c4d2e71153`; published127.0.0.1:32775, metrics endpoint `/v1/metrics`. Logs verify0.156.0 and ready state. No data acceptance yet.

Pre-implementation `bun run --cwd apps/loom build` exited0 (existing Zod CommonJS declaration/use-client bundling warnings); `bun run --cwd apps/loom typecheck` exited0 for Bun/Node/browser projects. These baseline checks precede the U1 implementation and do not accept its contract.

Native fixture research completed: use built-tooling child native router/server plus real PG runtime/replacement regressions; launch CLI actual routing separately for both signals. Parent must only read child artifact; parent-only published canary absent. Direct named `bun test` avoids package script's whole-directory selection. Research-only evidence, no gate executed.

## U1 implementation and canonical checks

Worker `001-u1-projection-v1` completed. Changed types.ts/project.ts/diagnostics.test.ts only; behavior_changed=true. Existing tests inspected: realtime-metrics, effect-runtime, rpc-contracts, release-receipt. Exact red: `./node_modules/.bin/vp test run packages/tests/unit/diagnostics.test.ts --maxWorkers=2 --no-cache --configLoader=runner` exited1 before production code (missing project module,0tests); afterward11tests passed. No synthetic historical red claimed. No session/CLI/metrics/005 work built.

Host canonical `bun run --cwd packages/tests test unit/diagnostics.test.ts --maxWorkers=2` exited0,11tests. Package build exited0 (log `/tmp/kello-001-u1-build.log`), all3package typecheck targets and packages/tests typecheck exited0. Scoped lint initially rejected two assertion comments lacking literal SAFETY; comments corrected with checked invariant intact and no behavior change. Fresh independent reviewer `001-u1-contract-review-r1` codex/gpt-6-astra low pending. U1 remains review status until result consumed and resolved.

U1 independent review `001-u1-contract-review-r1`: APPROVED, no consequential findings; verified all variants/fields/enums, safe own descriptors and fresh copies, type exhaustiveness, loss record union and bounded work. Reviewer did not rerun host checks. Scoped lint rerun exited0. U1 accepted; session and exporter gates remain pending.
