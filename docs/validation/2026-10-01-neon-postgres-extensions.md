# Neon PostgreSQL extensions acceptance — 2026-10-01

The seven-unit [integration plan](../plans/2026-10-01-1350-feat-neon-postgres-extensions-plan.md) covers typed configuration, development, migrations, branch baselines and release activation. Effect is pinned at `4.0.0`, Vite+ at `1.0.0`, all oRPC packages at `2.0.0-beta.41`, and Drizzle ORM/Kit at `1.0.0-rc.4`.

## Verification

| Gate                      | Result                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------- |
| Workspace check           | 20 tasks and 370 unit tests passed                                                    |
| PostgreSQL 18 integration | 261 passed, two existing fixture skips, zero failures; 2,240 assertions               |
| Browser suite             | Six passed, eight existing optional-fixture skips, zero failures                      |
| Documentation             | Rebuilt; mobile page checked at 390px with no horizontal overflow                     |
| Static checks             | Zero errors; one pre-existing unbound-method warning in `search-transactions.test.ts` |
| Frozen installation       | Passed against the committed manifests and lockfile                                   |
| Neon PostgreSQL 18        | Three passed, zero failures; both clone modes; 759.34 seconds                         |

The local skips require a supplied schema-only clone or pooler. The dedicated Neon extension suite exercises both clone modes. Packed consumer tests cover public tooling types, negative declarations, independent installation, documentation examples and runtime release recovery.

## Provider evidence

The official Neon CLI selected the existing `loom` PostgreSQL 18 project. All application DDL ran on disposable acceptance branches. The tested pins are `vector` `0.8.6` and `pg_trgm` `1.3`, followed by a reviewed update to `1.6`; `pg_trgm` uses the custom `text_search` schema.

[The final receipt](2026-10-01-neon-postgres-extensions-receipt.json) records actual installation, authenticated runtime SQL, denial of runtime extension DDL, database activation, acknowledged-release drift refusal, retirement before upgrade, extension-only release identity and both branch modes. Completed provisioning receipts are reobserved after drift and recovery.

A schema-only clone can use the provider's default extension version rather than its source's older pin. Acceptance reproduced `pg_trgm` `1.3` becoming `1.6`; Loom refused the mismatch. Both final branch modes use the reviewed source upgrade. Neon also assigns some trusted-extension routines to its administrator; extension ownership alone does not permit relocation. The ownership preflight reports that condition, and initial custom placement is verified.

## Review and recovery

`ce-code-review` completed with run ID `20261001-213058-7108d330`. Its one confirmed finding showed that the parent's current schedule state cannot prove what an older clone inherited. The correction retains source locks through creation and records project, parent, target and provider creation metadata before connecting to the target. Missing proof, resets and restores refuse the connection. TimescaleDB cloning remains unsupported because pre-start prevention is unproven.

Five unit regressions cover historical clones, retained proof, identity mismatches, reset/restore invalidation, schema-only roots and linked configuration-free projects. Credential integration also verifies that all provenance reads retain a selected profile after its invocation scope ends. Review and validation roles ran sequentially in the main thread under the supplied AGENTS instructions; no independent review is claimed.

Acceptance exposed two retry defects during implementation: extra deployment fields in a strict creation receipt, and independently resolved credentials in the provenance read batch. The final implementation writes only the receipt's declared fields and uses one resolved credential across the read operation. Provider writes are not automatically replayed.

## Cleanup and scope

Both owned acceptance source branches and every child created by the fixture were deleted. The final inventory contains only the original main branch and the pre-existing auth acceptance branch; neither was changed by the extension fixture.

[The final inventory](2026-10-01-neon-postgres-extensions-cleanup.json) records the remaining branches. No credentials are included in these artifacts. This acceptance verifies database activation; production Neon Functions deployment and package publication were not performed. Typed vector/GIS authoring remains separate work.
