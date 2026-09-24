# Native oRPC Neon acceptance — in progress

This is an execution record, not a completed acceptance claim. U12's cross-runtime, performance, upgrade and cleanup gates remain open.

## Verified target

Authenticated CLI inspection on 2026-09-24 confirmed project `late-moon-69483649`, name `loom`, region `aws-us-east-1`, PostgreSQL 18. The older shortened project ID in conversation is not used. Current [Neon Functions documentation](https://neon.com/docs/compute/functions/overview) confirms this region supports Functions; the installed skill's Ohio-only restriction is stale.

Acceptance uses a project-scoped temporary API key and disposable branches. Credentials are kept outside the repository and are not included here. Existing branches are not modified.

## Tasks: real Neon Auth and Functions

- Branch: `br-nameless-cloud-aw8zphwm`, `loom-acceptance-orpc-tasks`; expires 2026-09-25 22:07 UTC.
- Compute: 1 CU; idle suspend 300 seconds. Function runtime: Node.js 24, 2048 MiB.
- Service function: `sabbe1794c9059cbbfc6`, deployment 2. Worker: `wabbe1794c9059cbbfc6`, deployment 2.
- Protocol: `loom-orpc-2`; realtime: default polling. This run makes no notification latency claim.
- Executed: actual frontend signup, authenticated project/task writes, live results, sign-out and subsequent sign-in, retained task visible.
- Result: one hosted test passed, zero skips; about 50 seconds. Evidence: `/tmp/loom-u12-neon-auth.log`.

Provider prerequisite found during setup: Auth enablement failed with `permission denied for database neondb`. Inspection showed the managed `neon_service` role lacked database CREATE authority on the disposable schema-only branch. Granting CREATE on that branch's `neondb` to `neon_service` allowed Auth provisioning. Loom's runtime role remains restricted; no public grant was added.

## Storage: real bytes, events and durable processing

- Branch: `br-orange-brook-awq4kx1v`, `loom-acceptance-orpc-storage`; an owned data child of main, because the project's root-branch limit prevented another schema-only root.
- Release: `2a019129355c1992ed5210de4531a67be8011c17443f69345de8d86d0a4fb3fc`.
- Service: `s2a019129355c1992ed5`, deployment 2; worker: `w2a019129355c1992ed5`, deployment 2. Same region, compute and runtime settings as Tasks.
- Actual Neon Auth signup, signed uploads to all three example buckets, provider object-created delivery, scheduled worker delivery, successful processing after one attempt, retry success after two attempts and terminal failure after three attempts all passed. No manual worker invocation substitutes for provider delivery.
- Downloaded bytes matched the uploaded text. Sign-out/sign-in retained the authenticated catalog.
- Result: one hosted test passed, zero skips, 185 seconds. Evidence: `/tmp/loom-u12-neon-storage.log` and `/tmp/loom-u12-neon-storage-receipt.json`; completed 2026-09-24 22:17 UTC.

Both runs used oRPC `2.0.0-beta.40`, Effect `4.0.0-rc.117`, Drizzle `1.0.0-rc.4` with the reviewed rename patch, Neon SDK `6.1.0`, config `1.7.3`, config-runtime `1.6.3`, and Functions `0.11.0` from the workspace lockfile. These results establish application behavior, not the latency or resource gates below.

## Remaining acceptance

- Two independent service instances, direct SQL invalidation, listener interruption and reconnect.
- Matched baseline/new performance and resource measurements required by the plan.
- Populated legacy branch upgrade and deliberate stale-client outcome.
- Removal of this run's branches and revocation of its temporary API key; cleanup is not yet performed.
