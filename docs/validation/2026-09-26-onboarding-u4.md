# U4 — Installed CLI onboarding

The compiled `loom` package now provides `create`, `link`, and preview-first `integrate`. Existing frontend package and TypeScript configuration are preserved. File collisions refuse application. Creation persists an operation before the remote mutation, reconciles a unique temporary project name after an uncertain response, and never repeats that uncertain create. Concurrent writers are locked; confirmed provider rejections permit an explicit retry.

Linking uses the pinned official Neon context writer with environment pulling disabled. Only validated public configuration is written locally. A branch without service/auth URLs removes stale managed values while retaining unrelated environment entries and comments. Saved `.loom/project.json` alone also prevents accidental creation of another project.

## Verification

- Workspace build/typecheck: 16 tasks passed.
- Onboarding, configuration, installed-tarball consumer, and CLI integration: 20 tests, 150 assertions passed.
- Oxlint passed. All 207 unit tests in 53 files passed. The unit suite used the repository's Vite+ runner; an initial invocation with Bun's test runner was stopped because these unit tests use Vite+ APIs.
- Installed consumer integration preserves its frontend configuration, generates the backend, checks repeated integration, and exercises create dry-run.
- Fixtures cover lost create response, missing reconciliation result, concurrent creation, denied permission followed by repair, linked-project refusal, and collision preservation. Interactive terminal cancellation and actual provider quota exhaustion were not exercised live.

## Live evidence

On 2026-09-26, an external consumer installed tarball SHA-256 `45babfcad208dc7f2770f04dd3dbf4d16e742ad518f2b2a736f32bb82f7cf2c7`. Its CLI created project `winter-mouse-47252646` and branch `br-long-resonance-b4oaizs4` in the personal organization, then wrote the official link and public descriptor. Creation and discovery completed between 20:59:12 and 20:59:18 UTC. Repeating the same installed command returned the same IDs. Before cleanup, the official CLI verified the project ID, organization and name against the owned receipt. Deletion succeeded at 21:03:41 UTC.

An earlier attempt in the Vercel-managed organization returned no acknowledged ID. Reconciliation found no matching temporary project, and Loom refused a second create. Its underlying provider error was not captured by that earlier artifact, so this is an unresolved failed attempt, not proof of a provider restriction. Later diagnostics retain an HTTP status when available without exposing response bodies.

The existing Loom project `late-moon-69483649` was independently linked through the installed command without mutating cloud resources. This unit does not claim function deployment or authentication acceptance.

## Review and scope

Reviewed the unit against `217192d` sequentially in the main thread, as required by the user's tool mapping. Correctness, security/adversarial, API/types, reliability/concurrency, test coverage, maintainability, reuse/efficiency, project standards and CLI automation were checked. These are inline review lenses, not independent reviewer agents. The saved-descriptor create guard and stale-URL removal address concrete findings; retries preserve operation identity and do not replay ambiguous cloud mutations. Simplification reuses the existing project templates, path checks, configuration lock, receipt writer and credential adapter.

The user's subsequent instruction defers Clerk, WorkOS and Auth0 implementations and live acceptance. U8's Neon portion and provider-independent work remain in scope; external-provider portions of U8–U13 are deferred, not passed.
