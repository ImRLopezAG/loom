# Auth migration scopes and development synchronization (U3)

Predecessor: b94d900. This phase connects native auth schemas to project loading, release planning, the existing locked migration runner, and development synchronization. Hosted HTTP/runtime activation is still U4 work.

## Evidence

- Explicit mounts produce private component migration scopes. Optional Better Auth runtime dependencies load only when an auth definition is registered.
- Native snapshots retain removed plugin tables/columns. Removing a required column without a database default rejects activation; type changes still receive normal safety classification.
- Planned ownership is recorded in `.auth-ownership.json` under the scope's `_generated/migrations` directory. Committed migration history remains authoritative. Regeneration preserves this directory; watcher ignores ownership-file writes.
- Native tables receive DML grants and sequence usage, without `_id` protection or revision triggers. The compiler rejects Loom-reserved field aliases to preserve that boundary.
- Release artifacts carry the planned auth fingerprint. Runtime comparison is the next phase.
- Unit suite: 68 files / 284 tests passed. Native-retention tests first failed because the planner only accepted entity schemas, then passed with native inputs.
- Actual Neon runner: native serial-ID signup succeeded under the runtime role; CREATE TABLE was denied; no Loom triggers were installed. Seeded organization and user rows survived removal/re-addition planning and namespace detachment. Temporary schemas/roles were removed.
- Actual Neon development watcher: compiled `watchDevelopment` + `prepareProject` + `synchronizeDevelopment` used the real Neon control plane and PostgreSQL branch. Plugin saves created organization tables once, removal/re-addition preserved a seeded record, idle checks remained stable, and a teams edit after watcher stop did not create its table. The expanded run also rejected a missing external plugin table, preserved the seeded row, and recovered after restoring configuration. Passed in 94.78 seconds. This is a development-pipeline test, not packed-CLI or hosted-Function acceptance.
- Initial scaffolding causes an extra watcher evaluation when its migration directory is first created; history confirms one applied migration. Subsequent ownership writes do not retrigger work.
- Local component/migration/watcher regression run: 7 passed, 4 database-gated skips. One earlier combined run hit the existing watcher timeout; immediate same-suite rerun passed. Skips are not evidence of database acceptance; the new auth runner was separately run with Neon credentials.

- Full build: 8 tasks passed; typecheck: 18 tasks passed; Oxlint passed. Generator revision advanced to 33 for the new runtime fingerprint metadata. Verified abandoned generation locks from a cancelled build were removed before rerunning.

## Phase review

Sequential correctness, API, security, migration, and simplification review followed the supplied AGENTS mapping.

- Reused existing locks, schema snapshots, safety classification, namespace identity, and watcher coordination. No second migration executor or runtime DDL was added.
- Retention preserves constraints rather than silently weakening them. Incompatible retained required columns fail before candidate activation.
- Found and fixed a possible watcher loop from generated ownership files. Added regression coverage for the exact final and temporary paths.
- Found missing native sequence grants in the existing entity-oriented runner; verified serial sign-up under the restricted role after adding sequence usage.
- Checked generated metadata contains names, schemas and fingerprints, not environment values. No credential table becomes a public entity or generated CRUD surface.
- External disabled-migration tables receive a missing-column preflight. Full external-table ownership/drift compatibility remains a limitation requiring further work before claiming that matrix case complete; presence alone does not establish constraints or adoption rights.
- Packed CLI, failed hosted candidate preservation, complete auth plugin runtime behavior, and final acceptance remain open. This receipt does not declare the full goal complete.
