# Documentation audit — 2026-09-29

## Scope

Reviewed the 35 MDX pages in `apps/docs/content/docs`: introduction and quickstart; all authoring, client, integration, operation, and reference pages. This pass changes documentation and its compiled example fixture, not the library runtime. Existing auth implementation changes and other dirty files were excluded.

## Improvements

- Added official references and next steps throughout, with concrete command effects, expected results, and troubleshooting guidance.
- Expanded configuration, schemas, relations, validators, procedures, components, jobs, development, migration, deployment, CLI, and type inference explanations.
- Added private aggregate and component HTTP examples to the typechecked fixture. MDX renders their actual source through `Snippet`.
- Corrected storage provisioning: deployment creates missing private buckets, while development verifies them. Corrected storage execution restrictions and independent storage transactions.
- Separated initial authentication loading from signed-out UI, identified examples that belong to different applications, and scoped the live-query illustration to verified owner identity.
- Distinguished historical provider acceptance from checks performed in this pass.

## Verification

| Check                                                              | Result                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `bunx turbo run build typecheck --filter=@loom/docs`               | Passed; 36 generated pages, including the generated reference page              |
| External reference requests                                        | 46 URLs returned successful responses after fixing two links                    |
| Built HTML links and anchors                                       | 1,046 local references checked across 36 pages; zero unresolved targets         |
| `bunx vp fmt --check` on changed documentation and fixture sources | Passed                                                                          |
| `git diff --check -- apps/docs`                                    | Passed                                                                          |
| `bunx vp lint apps/docs`                                           | Exit 0; four unused-import warnings in generated health component bindings      |
| `bunx vp test run packages/tests/unit/component-http.test.ts`      | Seven tests passed                                                              |
| Browser review                                                     | HTTP page at 1440×900 and internal-procedure page at 390×844 rendered correctly |

A diagnostic direct `bun test` invocation passed six tests and failed one existing assertion because Bun adds `charset=utf-8` to a fetched data URL's content type. The repository's configured Vite Plus runner passed all seven. No runtime or assertion was changed to hide this difference.

External-link checks establish reachability; they do not prove every upstream statement. Provider-sensitive claims were also compared with the relevant implementation and selected official documentation. No Neon deployment, migration, storage transfer, or hosted authentication acceptance was rerun for this documentation task.

## Review

### Actionable findings

No remaining blocking findings in this scoped change. Generated unused imports remain a generator cleanup item; generated files were not manually patched.

### Coverage

Correctness, security, and simplification were reviewed sequentially in the main thread, as required by the workspace's agent mapping. The private aggregate checks identity and filters by both issuer and subject; it aggregates in SQL. The anonymous health route returns only a fixed public value. Neither example introduces credentials, deployment work, or a public route for the internal procedure.

Reuse, quality, and efficiency passes found no useful additional abstraction in the small fixture. Snippets reuse their compiled source; SDK wrappers and new runtime helpers were not introduced. This is a scoped review, not an independent security audit of the framework.

### Verdict

Ready for a documentation commit. Runtime acceptance and unrelated pending auth work are outside this result.
