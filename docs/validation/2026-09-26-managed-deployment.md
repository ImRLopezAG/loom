# Managed deployment credentials (U3, U13)

Loom now resolves its default runtime credentials and activation secret through saved Neon CLI authentication. A linked project needs neither `loom.config.ts` nor manually supplied `LOOM_DATABASE_URL`, `LOOM_DIRECT_DATABASE_URL`, `LOOM_MIGRATION_DATABASE_URL`, or `LOOM_ACTIVATION_TOKEN`.

Framework migration 24 adds owner-only deployment secrets, keyed by project, branch, deployment, and version. Retrying a release retains its secret; distinct versions receive distinct secrets. Development uses a stable reserved identity across source updates and restarts. Only roles created and marked by Loom qualify for automatic credentials. Explicit credentials remain supported for existing unmanaged roles and custom environment sources.

## Verification

- 227 unit tests passed; all 16 workspace typecheck tasks and lint passed.
- Live Neon Postgres test upgraded framework metadata from 23 to 24 without changing historical migration hashes, verified retry stability and distinct release secrets, connected as the restricted runtime role and confirmed secret-table reads fail, and rejected an unmarked role.
- Installed compiled tarball SHA-256 `2c0dcf4ef629651956f1756d40d46c6587584236545ab0a694111c917bd75e8f` completed init, link, schema-only provisioning, generation, migration generation, deployment, and same-release resume without the four credential environment variables or a config file.
- Owned acceptance target: project `spring-glade-05131505`, branch `br-holy-dawn-b5cz7aod`. Release `c5ec2f7faeb127c40947c2f61b4c322a8dd58896874d220a48e926c16e7dab38` passed deployment health and activation gates.
- Installed `loom dev` reached ready against that branch and stopped cleanly on SIGTERM. The initial harness mistakenly sent SIGTERM again on shutdown output; sending it once passed.

Local receipts are under `.git/loom-public-package-run/u13-managed-cli.json`; logs are `/tmp/loom-managed-unit.log`, `/tmp/loom-managed-types3.log`, `/tmp/loom-managed-lint3.log`, `/tmp/loom-managed-upgrade.log`, `/tmp/loom-managed-cli3.log`, `/tmp/loom-managed-cli-resume.log`, and `/tmp/loom-managed-dev2.log`. They are local evidence, not published artifacts.

## Inline review

Reviewed correctness, security, migration integrity, reliability, and simplicity inline in accordance with the workspace's sequential review instruction. Deployment target verification and its database lock precede secret creation. SQL identifiers are validated and quoted; secret values are parameterized. Transaction rollback preserves retry behavior. Runtime inspection explicitly rejects readable or writable deployment secrets. Public receipts and link files contain no credentials. The helper is internal, and explicit overrides retain their existing behavior.

This unit does not close the whole plan. Deployment-to-generated-client URL propagation remains a separate acceptance finding. Clerk, WorkOS, and Auth0 remain deferred by user direction.
