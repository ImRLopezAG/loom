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
