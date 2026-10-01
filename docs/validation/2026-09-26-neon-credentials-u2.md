# U2 — Official Neon credentials

Plan: [public package and Neon auth](../plans/2026-09-26-0919-refactor-public-package-neon-auth-plan.md), U2 / R3 / KTD2.

Status: implemented and locally verified; live acceptance remains open.

## Implementation

- Pin `neon@6.2.3`. `loom login` invokes its compiled CLI with an argument array; `loom profile list` delegates profile inspection.
- Reuse exported `ensureAuth` and `defaultDir` through a validated compatibility boundary. Loom neither parses nor writes provider credential files.
- Resolve credentials in a short-lived child with CI enabled, no stdin, discarded provider stderr, and a 30-second deadline. This prevents implicit browser login without changing the parent environment or the helper's global state. Official Neon code retains file/keyring ownership and cross-process refresh locking.
- Snapshot credential selection per invocation. Explicit profile overrides ambient API key; otherwise ambient key wins over ambient profile. Concurrent requests within one resolver share the pending resolution; later operations resolve again.
- Route branch, deployment, connection, bucket, and trigger API factories through the same invocation context. The existing SDK-backed Neon adapter remains responsible for resource types. SDK retries are zero; the outer 423 retry is limited to one attempt.
- Distinguish missing login, revoked session, transient refresh failure, unreadable credentials, and insufficient permission with redacted diagnostics.

## Verification

- `bun run test`: 207 tests pass in 53 files.
- Workspace typecheck: 16 tasks pass. Final package check covers Bun tooling, Node runtime, and browser exports.
- Oxlint passes.
- Focused CLI, packed consumer, and credential integration suite: 14 pass, 0 fail, 131 expectations.
- Actual pinned helper fixtures cover official profile creation, explicit-profile precedence, rotated keys, missing credentials, expired OAuth tokens, concurrent resolver processes with exactly one refresh exchange, revoked grants, transient refresh failure, and rejected resource writes without replay on 423/500/503.
- Installed tarball exercises noninteractive `loom login` and the credential helper with an empty configuration directory. Existing packed Zod/Valibot/Effect and Node/browser checks continue to pass.
- Fixture secrets are synthetic; official persistence APIs create the fixtures. No production credential contents are printed.

## Review and simplification

Reviews ran sequentially in the main thread, as required by the user's tool mapping. These are review lenses, not independent reviewer agents.

| Lens                                  | Result                                                                                                                                                                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Correctness, TypeScript, API contract | Invocation scope is preserved across SDK factories; optional resource methods remain checked; no public runtime contract changes. Fixed source/compiled error-class identity regression and reran the CLI failure regression.                                                               |
| Security and adversarial              | No shell interpolation or credential argv; no provider messages forwarded; explicit profile cannot fall back to another account; unavailable credentials cannot initiate browser login. Auth failures propagate through existing redaction boundaries.                                      |
| Reliability and performance           | Official refresh locking verified across processes. Each operation resolves fresh credentials, with bounded child lifetime. No ambiguous mutation retry. The child-process cost applies to CLI control-plane work, not application request handlers; no performance improvement is claimed. |
| Maintainability and simplify          | Reuse official persistence, refresh, and SDK resource behavior. Keep a typed explicit adapter instead of reflection or a dynamic proxy. Isolate the unstable dependency boundary and pin its version.                                                                                       |
| Testing                               | Real helper and installed package are exercised, not just a mocked credential function. Live gates below remain explicitly unverified.                                                                                                                                                      |
| Project standards and agent-native    | Exact dependencies, extensionless source imports, TS7 checks, Oxlint, CI-safe diagnostics and noninteractive failure behavior retained. Existing unrelated dirty files remain untouched.                                                                                                    |

No unresolved local correctness/security finding was identified. Provider acceptance is not complete.

## Open acceptance evidence

The machine's real saved DEFAULT profile resolves a nonempty token through the pinned helper. A resource read for `late-moon-6948364` fails with HTTP 404 and "The request could not be authorized due to an internal error." The Neon plugin independently returns the same failure. No resource was mutated. The user was asked to verify project identity/account access while independent implementation continues.

A fresh interactive browser login, real OS-keyring success/failure, and successful project access have not been accepted. Do not mark U2 or dependent cloud onboarding fully accepted until these gates are exercised. Local fixture success is not cloud acceptance.

References: [Neon login](https://neon.com/docs/cli/login), [Neon profiles](https://neon.com/docs/cli/profile), and the installed `neon@6.2.3` exported modules. The login summary omits explicit-profile precedence; the pinned implementation and profile fixture establish actual behavior.
