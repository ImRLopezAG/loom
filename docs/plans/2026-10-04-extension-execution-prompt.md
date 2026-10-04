# Extension completion execution prompt

Continue `docs/plans/2026-10-02-0952-feat-typed-neon-extensions-plan.md` on `feat/neon-postgres-extensions` until all 73 eligible families have complete, current verification. Keep the repository folder `/Users/angel/dev/loom`; keep the Kello package rename, `.loom`, and `LOOM_*` environment names.

## User instructions effective October 4

- Save all current tracked and untracked repository work to this branch and push it to GitHub before continuing implementation. This is the user's explicit unfinished-work checkpoint exception to the usual completed-change commit workflow. Inspect credentials and artifacts before pushing, stage explicit paths, and record executed checks and outstanding failures. A checkpoint does not certify extension acceptance.
- Use multiple T3-owned agents from Codex and Claude. Select supported models through `orchestrator_capabilities`. Do not use Cursor providers or models. Codex workers inherit the parent's supported Codex model and effort; Claude workers use Opus 5.5 with low effort.
- Queue ten extension families per batch, or all remaining families when fewer than ten remain. Fill the queue from adjacent plan batches as needed. Assign each implementation agent one family through source readiness; retain that assignment while it fixes failures from parent-run gates. Run up to three workers concurrently; the parent handles integration and verification.
- Each worker must read and follow `compound-engineering:ce-work` in return-to-caller mode. Supply explicit owned files and acceptance criteria. Workers share the checkout and must preserve one another's changes.
- Use at most **one local PostgreSQL test container**. Reuse it across extension families, with separately journaled UUID databases or schemas inside it. Do not create a container per agent, family, or test.
- Only the parent may start, stop, rebuild, or configure that container. Serialize database tests and builds. Cap the shared container at two CPUs and 3 GiB RAM; use at most two compiler jobs. Do not run concurrent Docker builds or full workspace checks.
- Keep compatible exact extension binaries in the shared fixture image. Group preload checks into scheduled configuration windows and journal reconfiguration or restarts of the same container. If the installed binary differs from the captured version, keep that gate pending; do not substitute a version or create a second container as a workaround.
- Use at most one owned temporary Neon branch at a time for provider checks, shared by the parent-controlled queue. Reprovision it serially between batches when clean branch state is required, journaling deletion and replacement. Local PostgreSQL evidence cannot substitute for Neon-specific behavior or capabilities. For extensions with no locally buildable binary, run the native gate on the owned Neon fixture and record local status as `not-locally-buildable`, never as passed.

## Worker packet

State the family, exact captured version and digest, owned paths, source-ready artifact, remaining gates, and known blocked calls from `apps/docs/content/docs/integrations/postgres-extensions.mdx` and the family's safety tests and retained evidence. Workers may implement and run focused source checks. They must not create containers, provision provider resources, install dependencies, run shared builds, change manifests or digests without parent reconciliation, modify shared codegen or ledgers, stage files, commit, or push. They must not spawn nested workers. The parent supplies the shared fixture or runs database and packed-consumer gates.

## Safety and evidence

Use only journaled disposable test resources. Preserve the source branch and unrelated user containers. Keep credentials and raw provider data out of prompts, tracked files, logs, and commits. Reject previously identified unsafe calls until a verified native repair exists; never repeat a known native crash probe. Preserve native permission failures and prerequisites without bypasses.

For every family, execute unit, type, native database, genuine public generation, and isolated frozen packed-consumer gates. Exercise selected, omitted, explicit-empty, and unsupported selections in generated RPC and Effect contexts where the plan requires them. Prove runtime credential separation. Bind receipts to actual current sources and package bytes; do not edit receipt hashes to make old executions appear fresh. Test cleanup through independent readback. Missing witnesses, restricted privileges, and unverified repairs remain pending.

Report progress using accepted families and remaining concrete blockers. Distinguish implementation, local characterization, provider verification, and complete acceptance. Finish lifecycle checks, documentation, review, and phase commits before declaring the overall goal complete.
