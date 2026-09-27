# U5 schema-only branch baseline

Implemented schema-only development provisioning through the CLI, with a source catalog/history capture before creation, verified provider and SQL branch identities, and transactional migration-ledger adoption after matching the copied catalogs. An operation receipt prevents adoption against a changed source. Schema-only copies receive no activation records. Data-child infrastructure provisioning remains supported separately.

New restricted NOLOGIN roles receive a discarded random password because Neon rejects schema-only copies containing legacy passwordless roles. No login or administrative privilege is added. Existing roles are not silently rewritten.

## Evidence

Project `late-moon-69483649`; disposable source `br-shy-block-aw671pe2`, schema-only target `br-young-frost-aw1c23or`. The default branch was not modified. The compiled public function and actual CLI repeat returned the same target. Source fixture data was absent in the target; restricted role flags and memberships remained restricted. Migration status was consistent and applying existing migrations executed no DDL.

The real Neon adversarial test passed 10 assertions: repeated adoption, changed Drizzle ledger, target catalog drift, inherited runtime results, source schema race, zero activations, restricted-role privileges, and normal target writes. Fixtures restore their temporary changes. Workspace typecheck passed all 16 tasks. Focused provisioning tests and lint passed.

## Inline review

Correctness/security review added input validation before filesystem writes, schema-only mode enforcement, and linked-project conflict refusal. Source/target connection identities are checked in SQL, source locks remain on owned dedicated sessions, and rollback protects partial ledger writes. Catalog comparison normalizes only semantically equivalent owner/default metadata ACLs. Maintainability review retained the existing infrastructure primitive and isolated schema adoption orchestration. Tests exercise real failure behavior rather than only fixture output.

## Remaining U5 acceptance

This receipt does not close U5. Second-migration deployment, data-copy runtime quarantine, environment/auth/storage inheritance, supported reset behavior, cleanup failure, and final resource cleanup remain to be exercised. Schema-only child mode is not exposed without its separate conformance proof.

## Additional live acceptance

The schema-only target accepted the second application migration (nullable description) and reported consistent migration history; repeating apply performed no DDL. The source and target remained separately identified in `.git/loom-public-package-run/u5-live.json`.

A separate data child, `br-twilight-scene-b5czm4ig`, was created under receipt-owned parent `br-sparkling-unit-b59pt3r5` in disposable project `spring-glade-05131505`. All 16 function slugs and their environment-variable names were copied. The SDK exposes names, not secret values, so this does not prove arbitrary environment-value inheritance. Three storage buckets were copied and one object's bytes from each matched its parent. All 12 parent auth user records appeared in the child.

With the valid parent deployment probe credential, the parent returned 200 and the inherited child returned 503 before activation. Explicit quarantine revoked three copied activation grants. No pending jobs existed in that namespace, so the zero cancelled-job count is not proof of inherited job cancellation. Resetting only that disposable child from its parent removed a child-only test schema. The inherited runtime still refused startup afterward; the parent remained healthy. Evidence: `.git/loom-public-package-run/u5-data-acceptance.json`, `/tmp/loom-u5-inheritance3.log`, `/tmp/loom-u5-reset.log`.

Cleanup and the remaining inherited-job/environment-marker cases are still open; this addition does not claim complete U5 acceptance.
