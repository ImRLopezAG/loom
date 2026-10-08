# Deterministic deadline correction: worker receipt

Task: `node:delegated-task:command%3Amcp%3A583aba27-23ff-4583-add7-a3bb37e882cc%3Adelegate-task%3A001-r1-fix-deadline-test-v1`

Terminal result consumed. Source-only; verification remains pending and no execution result is claimed.

Changed only [diagnostics-telemetry.test.ts](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/packages/tests/unit/diagnostics-telemetry.test.ts).

- Replaced real-clock shutdown scenarios with pinned Vitest 5.0.1 fake timers, including `performance.now()`, and abort-aware fetch promises.
- Preserved both strict `<2000` assertions. The periodic scenario explicitly starts stop with a 100 ms-old request and expects completion at 1900 ms.
- Added boundary coverage: queued ingress and delayed abort settlement must retain ownership at 1999 ms and release it at exactly 2000 ms. It checks two requests, two failures, cumulative RPC/loss bodies, no overlap, replacement ownership, and snapshot stability.
- Removed the socket-narrowing suppression using `Schema.is(Schema.String)`.
- Preserved the other real collector tests.

Source inspection predicts green with the current shared deadline. Resetting the exporter budget or stacking request waits should fail the exact-2000 completion assertion. These are expectations, not executed results.

No tests, lint, typecheck, formatting, builds, probes, commits, or publishing ran. Root still owns queued verification and implementation/API/security reviews. Other agents’ edits were preserved.
