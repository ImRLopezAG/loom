---
feature: 001-operational-visibility
unit: U3
status: done
---

# CLI and native process integration

Plan: [U3](../plans/001-operational-visibility.md#u3-cli-and-native-process-integration-source-phase2).

Dependencies: U2 accepted.
Ownership, requirements, test scenarios and acceptance: preserve the referenced unit and its source phase verbatim. Begin with observed failing proof for new behavior. Host owns canonical verification and commits; workers own explicitly assigned files only.

## Acceptance and owned scope

**Goal/requirements:** R1,R2,R4; subscriber belongs to the actual owning CLI.
**Dependencies:** U2 accepted.
**Files:** `apps/loom/src/cli.ts`, `apps/loom/src/commands/dev.ts`, diagnostics `output.ts`; `packages/e2e/integration/dev-cli.test.ts`, `diagnostics.test.ts`, `dev-runtime.test.ts`.
**Approach:** validate before config/provider work, attach once before development, stop after development drains; exclusive files and cooperative asynchronous stderr/file sinks.
**Test scenarios:** all source phase2 routing, mode0600/wx/symlink, invalid-option, signal, child/native RPC, parent-only event absence and replacement scenarios; execute existing PG-backed runtime regressions against isolated PG18.
**Verification:** all phase2 gates with no required DB skips.

Evidence: build/all3app+consumer+e2e types/scoped lint and diagnostics41unit passed. Independent lifecycle R1 rejected missing real failed-watch recovery; added actual PG18 watcher failure/valid-save/native RPC recovery. R2 approved all implementation/API/security and recovery criteria, rejected intermittent new exact1 connection assertion. Controlled real PG lock/RPC overlap reproduced two legitimate active pool connections; test now verifies causal overlap, previous generation backend retirement and final zero without changing original connection assertions or deadlines. Latest combined5file22tests0skip passed20.80s. Fresh exact-tree R3 APPROVED all phase criteria; independent combined22pass0fail0skip23.07s and diffcheck0. Prior native-child watchdog and count-red receipts retained in journal. Commit: this U3 acceptance commit.
