# Better Auth schema compiler (U2)

Scope: native schema translation and adapter foundation for U2, following U1 commit e657dc7. Migration-scope wiring and external-table preflight remain integration work in U3; this receipt does not mark U2–U8 complete.

## Evidence

- Better Auth/core/Drizzle adapter pinned to 1.7.6; Better Inbox 0.3.1 is test-only.
- Public `getAuthTables` supplies native model/field descriptions. Private native tables bypass Loom entity columns. Adapter and snapshots use the same translation.
- Runtime defaults remain native functions; UUIDs have PostgreSQL defaults. Logical foreign keys resolve before physical aliases. Duplicate names, unsupported ID modes, joins without generated relations, and schema-changing initialization fail explicitly.
- Native initialization is awaited. Planning uses an adapter that rejects every database operation; resolving twice detects schema differences between factory invocations. Fingerprints include advertised plugin versions and structural fields, excluding secrets. The project source hash also covers its dependency lockfile.
- Unit suite: 67 files / 281 tests passed. Focused resolver suite: 17 tests.
- Build: 8 tasks passed. Typecheck: 18 tasks passed. Lint passed after rebuilding compiled exports; an earlier concurrent lint/build attempt saw transient missing declarations and was rerun sequentially.
- Actual Neon PostgreSQL 18: 12 configurations passed native table creation, sign-up/sign-in, and no-op repeat snapshots. Cases: core, JWT, organization, teams, two-factor, Inbox, combined, aliases, serial, UUID, database rate limiting, additional scalar/JSON/array/enum fields.
- Constraint checks exercised PostgreSQL rejection of missing referenced users, duplicate email, and invalid enum values. Two sign-ups proved timestamps are evaluated per insertion. Date and boolean values round-tripped. After assertion API cleanup, core/additional-field cases passed again.
- The first UUID case failed because the ID had no database default. Adding `gen_random_uuid()` fixed it; the complete matrix then passed.
- Disposable schema-only branch: project late-moon-69483649, branch br-withered-sound-awvacv2m. Each case removed its temporary schema. Branch retained temporarily for subsequent units; final cleanup still required.

## Phase review

Sequential review in the main thread follows the supplied AGENTS mapping.

- Correctness/API: inspected canonical/physical aliases, native defaults, ID modes, resolver ownership flags, adapter transactions, initialization lifecycle, and deterministic snapshots. No synthetic Loom entity wrapper or credential validators were introduced.
- Security: identifiers are bounded and validated; enum SQL literals escape quotes; `neon_auth`, public and system namespaces reject. Initialization cannot use the planning database. No connection string, token, password, or resolved environment value is included in artifacts.
- Migration: this unit generates native snapshots but does not connect them to automatic application. External-table existence/compatibility checks, retention, runtime DML grants (including sequences), and activation fingerprints are required next. Local SQL plus a Neon database is not deployed Functions acceptance.
- Simplification: reuse/quality/efficiency review kept the existing snapshot implementation as the single migration serializer and the official native adapter as the single runtime translator. No schema work belongs on a request path; initialization wiring remains next.

Full plugin HTTP/client flows, browser behavior, dev synchronization, and hosted Functions acceptance remain unverified. Native joins are explicitly unsupported pending relation generation. A third-party plugin without version metadata is represented by its ID plus the project lockfile version hash; no version is fabricated.
