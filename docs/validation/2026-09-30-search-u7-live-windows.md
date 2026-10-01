# U7: coherent live search windows

Status: verified for U7. Hosted Functions acceptance remains U8.

The generated `context.search.tasks.watch(input)` uses the existing native live invocation. Every event reauthorizes and reads all loaded roots plus optional count inside one owned snapshot. It trims the extra root, hides ordering keys, then partitions the selected rows into display pages. Expanding pages replaces the stream. External root, related, junction and authorization-table revisions remain conservatively tracked.

A replacement-subscription test first reproduced a 60-second first-event delay. The coordinator now reschedules an idle timer immediately; unchanged subscribers retain their revision checks. A deterministic active-evaluation test verifies the dirty follow-up path without repeating unchanged readers.

## Verification

- Build: 8/8 tasks passed (`/tmp/loom-u7-build3.log`).
- Workspace typecheck: 18/18 tasks passed (`/tmp/loom-u7-typecheck-final2.log`).
- Oxlint and anti-slop: passed; existing unrelated warnings remain (`/tmp/loom-u7-lint4.log`).
- Configured VitePlus suite: 341 tests passed (`/tmp/loom-u7-all-unit3.log`). One prior full run timed out importing Better Auth; two subsequent complete runs passed without weakening that test.
- Packed generated search, browser projection/filter replacement, provider identity lifecycle and native reconnect: four tests passed (`/tmp/loom-u7-consumers.log`); final browser fixture rerun passed (`/tmp/loom-u7-browser-final.log`).
- Real Neon native WebSocket and U5 transaction regression: two tests passed, 26 assertions (`/tmp/loom-u7-neon6.log`); final U7 fixture rerun passed (`/tmp/loom-u7-neon7.log`). Database host was verified against owned branch `br-wispy-dew-awdp5g3y` in project `late-moon-69483649`.

Neon scenarios cover first-event loading without a finite bootstrap; coherent insertion/deletion/sort crossing; label-only and junction-only changes; load-window expansion; contract-bound anchors; shrinking/empty windows; exact counts; authorization-only revocation; and no idle transaction. Browser scenarios use actual packed native options to reject inherited incompatible data and prevent delayed old projection/filter/identity work from populating the replacement query. Its server fixture is synthetic: actual hosted JWT/Function ingress is U8, not claimed here.

## Review and simplification

Correctness, security, API, reliability, performance, testing, maintainability and repository standards were reviewed sequentially inline under AGENTS; these are not independent local reviews. Reuse, quality and efficiency lenses preserved invocation guards and consolidated finite/live reading. The independent Claude CLI review requested and confirmed `claude-opus-5-5`; requested low effort, actual effort unverified. No actionable defects remained. Its replacement-during-evaluation and finite/live input coverage gaps were addressed with tests. Scope/receipt: `/tmp/compound-engineering-501/ce-code-review/20260930-163358-482d8559/review.json`.

Live windows are bounded current snapshots, not historical range retention. Finite and live cursors cannot cross contracts. Live anchors continue forward; finite endpoints own bidirectional traversal. Root-window budget overflow is a declared `QUERY_BUDGET_EXCEEDED` error; full nested/encoded-output budget acceptance is checked in final U8 coverage.
