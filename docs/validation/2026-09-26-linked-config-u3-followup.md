# U3 follow-up — linked operational defaults

Saved, validated Neon discovery now supplies project, branch, database, migration owner, and restricted runtime role defaults to development and preview deployment. Explicit operational settings still take precedence. Production requires an explicit target; preview and development still inspect live provider metadata and reject default/protected branches. Development uses the same official saved-login credential adapter as deployment.

This closes a gap in U3: an optional config file alone did not make development or deployment configurable through linking. It does not yet complete example migration, auth presets, automatic activation-secret setup, or CLI-to-cloud acceptance.

Verification: the existing config integration first failed because linked project identity remained undefined. After implementation, all four config integration tests passed (17 assertions), 13 target unit tests passed, workspace build and all 16 typecheck tasks passed, and Oxlint passed. Formatting and diff whitespace checks were scoped to these files. Logs are in `/tmp/loom-config-*` for this run.

Inline reviews covered correctness, security/adversarial inputs, API/types, reliability, tests, project standards, and simplicity. These were sequential review lenses, not independent reviewers. Conflict checks run before saved values are consumed; no credential is persisted or copied into generated public output. Live branch inspection remains authoritative even if local discovery is stale. Negative tests exercise default-branch refusal and refusal to infer production permission. Existing explicit-target separation checks remain. No database mutation occurs during configuration loading.
