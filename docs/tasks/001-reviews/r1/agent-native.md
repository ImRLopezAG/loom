## Agent-Native Architecture Review

### Summary

PASS for incremental CLI/programmatic parity in plan 001. Kello is a TypeScript backend framework with a Bun CLI and server-side tooling API. The reviewed change adds no embedded agent, tool registry, system prompt, or interactive UI; agents access these capabilities through the same noninteractive CLI and public API as users. No actionable agent-native findings were identified. This review inspected source and test definitions only; it did not execute validation or independently establish runtime acceptance.

### Capability Map

| User action                      | Location                                                  | Agent-accessible equivalent                                                          | Discoverability                                                   | Priority    | Status     |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------- | ---------- |
| Enable local text diagnostics    | `apps/loom/src/cli.ts`                                    | `kello dev --diagnostics text`; `startDiagnostics({ output })`                       | CLI help and development documentation                            | Should have | Accessible |
| Capture structured event records | `apps/loom/src/cli.ts`                                    | `--diagnostics jsonl --diagnostics-file <path>`; JSONL writer callback               | Help, public `DiagnosticsRecord`, documented schema               | Should have | Accessible |
| Enable private metrics export    | `apps/loom/src/cli.ts`                                    | `--telemetry otlp` with explicit environment configuration; typed `telemetry` option | Help and explicit CLI/API examples                                | Should have | Accessible |
| Inspect diagnostic loss          | `apps/loom/src/tooling/diagnostics/session.ts`            | `diagnostics.loss` records and `session.snapshot()`                                  | Public `DiagnosticsStats` and documented final snapshot semantics | Should have | Accessible |
| Stop observation/export          | `apps/loom/src/commands/dev.ts`; `diagnostics/session.ts` | SIGINT/SIGTERM for CLI; idempotent `session.stop()` for API                          | Shutdown and cancellation documentation                           | Should have | Accessible |

### Findings

None.

### What's Working Well

- `apps/loom/src/tooling/index.ts:168-176` exports the start primitive and associated options, session, statistics, record and event types through the existing public package entrypoint. Start, snapshot and stop are composable operations.
- `apps/loom/src/tooling/diagnostics/output.ts:176-180` formats text and JSONL from the same record. Machine consumers receive the same approved event information as human text consumers, including schema version, local-process scope, sequence and observation timestamp.
- CLI artifacts resolve against the selected project directory and are ordinary user-owned files, not a separate agent workspace. Lifecycle JSON remains independent of the event-only JSONL file.
- The owning dev process starts diagnostics before project development and stops it after development drains. Documentation explicitly excludes remote attachment, separate processes and fleet health, preventing agents from treating an empty local stream as remote-state evidence.
- The nouns introduced here—session, event record, loss statistics and telemetry export—have typed or machine-readable representations and documented meanings. No runtime prompt injection is applicable because this change introduces no embedded agent prompt.
- Packed-consumer test source exercises public imports, typed records, snapshots, stop/restart and Bun/Node execution; CLI test source covers noninteractive flag validation, file ownership and signal-driven lifecycle. These are inspected assertions, not tests run by this reviewer.

### Residual Risks and Testing Gaps

No additional parity-specific risks or missing scenarios identified. Runtime, collector and packed-artifact acceptance remains outside this source-only review's evidence.

### Score

- **5/5 reviewed high-priority capabilities are agent-accessible through CLI or public API.**
- **Verdict: PASS.**
