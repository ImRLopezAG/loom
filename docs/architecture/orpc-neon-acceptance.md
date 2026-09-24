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

## Local baseline measurements

An isolated archive of pre-redesign commit `b8ddb6a` was installed with its frozen lockfile and built on the same machine as native commit `c4a859a`. Measurements use each example's normal production build and three invocations of its typecheck command. This is local tooling evidence, not hosted runtime performance.

| Example        | Baseline JS / gzip bytes | Native JS / gzip bytes | Baseline generated declarations | Native generated declarations | Baseline typecheck ms | Native typecheck ms |
| -------------- | ------------------------ | ---------------------- | ------------------------------- | ----------------------------- | --------------------- | ------------------- |
| Tasks          | 290,104 / 88,376         | 313,550 / 94,564       | 3,307                           | 2,399                         | 613, 382, 463         | 413, 423, 452       |
| Upload Catalog | 289,164 / 88,659         | 321,470 / 97,706       | 2,582                           | 2,162                         | 470, 494, 343         | 388, 359, 353       |

Declaration measurements include the current generation's API, internal, service and worker declarations; tiny stable re-export wrappers are counted separately in `/tmp/loom-u12-size-typecheck.json`. Browser totals include all emitted JavaScript assets. The changed client surface replaces the custom live client with native oRPC WebSocket framing and TanStack ownership; Upload Catalog also retains its storage control-plane client. These are aggregate deltas, not a module-by-module size attribution. Raw JS increases are 8.1% and 11.2%; gzip increases are 7.0% and 10.2%. Typecheck medians are 463→423 ms and 470→359 ms. None exceeds the 20% acceptance threshold in this initial comparison. Final cleanup still requires a refreshed measurement of the shipped surface.

## Cross-instance measurement correction

The first short test connected all 100 subscriptions without client errors but failed its separate HTTP metric assertions: those reads showed idle state. [Neon's runtime model](https://neon.com/docs/compute/functions/reference/runtime-limits#concurrency) permits separate isolates for concurrent requests, each with independent module state. The fixture now reads test-only, authenticated diagnostic procedures over each subscription's existing WebSocket peer. The failed attempts are not counted as passing acceptance; notification latency, listener recovery and cleanup remain under test.

The corrected short run passed on 2026-09-24 at 22:32 UTC: one test, zero skips, 53 seconds including deployment. Release `e7383637955ef404d048434e3768aa0e63b216361373c849d6086f16c2ac0151`, Functions `loomlivea` and `loomliveb`, deployment 1 each, on the owned Tasks branch. Their authenticated metric responses identified two distinct isolate UUIDs, each with 50 subscriptions, one listener, at most four concurrent evaluations and a batch no larger than 50. Both recovered after terminating their restricted-role PostgreSQL LISTEN backends. All 100 direct SQL writes became visible. After unsubscribe both reported zero subscriptions/evaluations/queued entries and idle listeners; PostgreSQL confirmed zero LISTEN backends. Pools reported four clients with no waiters; idle-pool reporting still needs database-side confirmation in the full run. The database reported 20 connections against `max_connections=450` after the test.

The ten-second sample had p95 lower/upper commit-to-observer bounds of 255/320 ms (maximum 542/605 ms). One monotonic coordinator clock brackets SQL commit acknowledgement and Playwright's browser-observation callback; the upper bound includes SQL request time and callback delivery. This is explicitly a smoke sample, not the required ten-minute workload, warmup, hot-table comparison or three-run performance gate. Evidence: `/tmp/loom-u12-live-smoke3.log` and `/tmp/loom-u12-live-smoke-receipt.json`. Cloud resources remain owned by this run and pending cleanup.

## Remaining acceptance

- Two independent service instances, direct SQL invalidation, listener interruption and reconnect.
- Matched baseline/new performance and resource measurements required by the plan.
- Populated legacy branch upgrade and deliberate stale-client outcome.
- Removal of this run's branches and revocation of its temporary API key; cleanup is not yet performed.
