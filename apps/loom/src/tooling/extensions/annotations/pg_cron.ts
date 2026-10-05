/** All 70 exact pg_cron 1.6 manifest members. Local proof is distinct from Neon acceptance. */
export const pgCronAnnotations = [
  {
    id: "default value:for cron.job_run_details.runid",
    disposition: "internal",
    reason:
      "Native default value:for cron.job_run_details.runid is captured structurally and exercised by ordinary named/anonymous scheduling or actual worker execution; job readback proves host/port/database/user/active defaults and scheduler-generated bigint IDs.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "default value:for cron.job.active",
    disposition: "internal",
    reason:
      "Native default value:for cron.job.active is captured structurally and exercised by ordinary named/anonymous scheduling or actual worker execution; job readback proves host/port/database/user/active defaults and scheduler-generated bigint IDs.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "default value:for cron.job.database",
    disposition: "internal",
    reason:
      "Native default value:for cron.job.database is captured structurally and exercised by ordinary named/anonymous scheduling or actual worker execution; job readback proves host/port/database/user/active defaults and scheduler-generated bigint IDs.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "default value:for cron.job.jobid",
    disposition: "internal",
    reason:
      "Native default value:for cron.job.jobid is captured structurally and exercised by ordinary named/anonymous scheduling or actual worker execution; job readback proves host/port/database/user/active defaults and scheduler-generated bigint IDs.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "default value:for cron.job.nodename",
    disposition: "internal",
    reason:
      "Native default value:for cron.job.nodename is captured structurally and exercised by ordinary named/anonymous scheduling or actual worker execution; job readback proves host/port/database/user/active defaults and scheduler-generated bigint IDs.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "default value:for cron.job.nodeport",
    disposition: "internal",
    reason:
      "Native default value:for cron.job.nodeport is captured structurally and exercised by ordinary named/anonymous scheduling or actual worker execution; job readback proves host/port/database/user/active defaults and scheduler-generated bigint IDs.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "default value:for cron.job.username",
    disposition: "internal",
    reason:
      "Native default value:for cron.job.username is captured structurally and exercised by ordinary named/anonymous scheduling or actual worker execution; job readback proves host/port/database/user/active defaults and scheduler-generated bigint IDs.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "index:cron.job_pkey",
    disposition: "internal",
    reason:
      "Extension-owned index:cron.job_pkey is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "index:cron.job_run_details_pkey",
    disposition: "internal",
    reason:
      "Extension-owned index:cron.job_run_details_pkey is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "index:cron.jobname_username_uniq",
    disposition: "internal",
    reason:
      "Extension-owned index:cron.jobname_username_uniq is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: 'index:pg_toast."$toast-index:job_run_details"',
    disposition: "internal",
    reason:
      'Extension-owned index:pg_toast."$toast-index:job_run_details" is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.',
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: 'index:pg_toast."$toast-index:job"',
    disposition: "internal",
    reason:
      'Extension-owned index:pg_toast."$toast-index:job" is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.',
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "policy:cron_job_policy on cron.job",
    disposition: "internal",
    reason:
      "Native policy:cron_job_policy on cron.job enforces username=current_user isolation. Owned UUID role/job readback tests exercise RLS; no application policy recreation or SECURITY DEFINER escalation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "policy:cron_job_run_details_policy on cron.job_run_details",
    disposition: "internal",
    reason:
      "Native policy:cron_job_run_details_policy on cron.job_run_details enforces username=current_user isolation. Owned UUID role/job readback tests exercise RLS; no application policy recreation or SECURITY DEFINER escalation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "routine:cron.alter_job(pg_catalog.int8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "withPgCron / operator sql.functions.alter_job: exact routine:cron.alter_job(pg_catalog.int8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool); explicit casts resolve the captured overload; native scheduling/parser/authorization only.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "operator",
      observability: "external",
      rollback:
        "Job metadata writes are transactional; committed jobs persist. Sequence allocation can leave gaps. No implicit cleanup or retries.",
      privilege:
        "Native PostgreSQL RLS, role LOGIN and database CONNECT checks apply. alter_job and schedule_in_database are not PUBLIC EXECUTE; named/anonymous schedule and unschedule are PUBLIC EXECUTE but excluded from application bindings.",
      nulls:
        "Strict anonymous schedule/unschedule return NULL on NULL input; named schedule rejects NULL name/schedule/command. alter_job NULL optional attributes mean unchanged.",
      defaults: "NULL::text, NULL::text, NULL::text, NULL::text, NULL::boolean",
    },
  },
  {
    id: "routine:cron.job_cache_invalidate()",
    disposition: "internal",
    reason:
      "Native cron.job AFTER INSERT/UPDATE/DELETE/TRUNCATE statement trigger executes cron.job_cache_invalidate(); trigger-context-only routine is not callable as an ordinary SQL expression. Direct job mutations exercise the captured attachment, with source-checked native invalidation implementation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
      privilege: "Native routine is PUBLIC EXECUTE and not SECURITY DEFINER; requires native trigger context.",
      observability: "external",
    },
  },
  {
    id: "routine:cron.schedule_in_database(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "withPgCron / operator sql.functions.schedule_in_database: exact routine:cron.schedule_in_database(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool); explicit casts resolve the captured overload; native scheduling/parser/authorization only.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "operator",
      observability: "external",
      rollback:
        "Job metadata writes are transactional; committed jobs persist. Sequence allocation can leave gaps. No implicit cleanup or retries.",
      privilege:
        "Native PostgreSQL RLS, role LOGIN and database CONNECT checks apply. alter_job and schedule_in_database are not PUBLIC EXECUTE; named/anonymous schedule and unschedule are PUBLIC EXECUTE but excluded from application bindings.",
      nulls:
        "Strict anonymous schedule/unschedule return NULL on NULL input; named schedule rejects NULL name/schedule/command. alter_job NULL optional attributes mean unchanged.",
      defaults: "NULL::text, true",
    },
  },
  {
    id: "routine:cron.schedule(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "withPgCron / operator sql.functions.schedule: exact routine:cron.schedule(pg_catalog.text,pg_catalog.text,pg_catalog.text); explicit casts resolve the captured overload; native scheduling/parser/authorization only.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "operator",
      observability: "external",
      rollback:
        "Job metadata writes are transactional; committed jobs persist. Sequence allocation can leave gaps. No implicit cleanup or retries.",
      privilege:
        "Native PostgreSQL RLS, role LOGIN and database CONNECT checks apply. alter_job and schedule_in_database are not PUBLIC EXECUTE; named/anonymous schedule and unschedule are PUBLIC EXECUTE but excluded from application bindings.",
      nulls:
        "Strict anonymous schedule/unschedule return NULL on NULL input; named schedule rejects NULL name/schedule/command. alter_job NULL optional attributes mean unchanged.",
      defaults: "No SQL defaults.",
    },
  },
  {
    id: "routine:cron.schedule(pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "withPgCron / operator sql.functions.schedule: exact routine:cron.schedule(pg_catalog.text,pg_catalog.text); explicit casts resolve the captured overload; native scheduling/parser/authorization only.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "operator",
      observability: "external",
      rollback:
        "Job metadata writes are transactional; committed jobs persist. Sequence allocation can leave gaps. No implicit cleanup or retries.",
      privilege:
        "Native PostgreSQL RLS, role LOGIN and database CONNECT checks apply. alter_job and schedule_in_database are not PUBLIC EXECUTE; named/anonymous schedule and unschedule are PUBLIC EXECUTE but excluded from application bindings.",
      nulls:
        "Strict anonymous schedule/unschedule return NULL on NULL input; named schedule rejects NULL name/schedule/command. alter_job NULL optional attributes mean unchanged.",
      defaults: "No SQL defaults.",
    },
  },
  {
    id: "routine:cron.unschedule(pg_catalog.int8)",
    disposition: "tooling",
    reason:
      "withPgCron / operator sql.functions.unschedule: exact routine:cron.unschedule(pg_catalog.int8); explicit casts resolve the captured overload; native scheduling/parser/authorization only.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "operator",
      observability: "external",
      rollback:
        "Job metadata writes are transactional; committed jobs persist. Sequence allocation can leave gaps. No implicit cleanup or retries.",
      privilege:
        "Native PostgreSQL RLS, role LOGIN and database CONNECT checks apply. alter_job and schedule_in_database are not PUBLIC EXECUTE; named/anonymous schedule and unschedule are PUBLIC EXECUTE but excluded from application bindings.",
      nulls:
        "Strict anonymous schedule/unschedule return NULL on NULL input; named schedule rejects NULL name/schedule/command. alter_job NULL optional attributes mean unchanged.",
      defaults: "No SQL defaults.",
    },
  },
  {
    id: "routine:cron.unschedule(pg_catalog.text)",
    disposition: "tooling",
    reason:
      "withPgCron / operator sql.functions.unschedule: exact routine:cron.unschedule(pg_catalog.text); explicit casts resolve the captured overload; native scheduling/parser/authorization only.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "operator",
      observability: "external",
      rollback:
        "Job metadata writes are transactional; committed jobs persist. Sequence allocation can leave gaps. No implicit cleanup or retries.",
      privilege:
        "Native PostgreSQL RLS, role LOGIN and database CONNECT checks apply. alter_job and schedule_in_database are not PUBLIC EXECUTE; named/anonymous schedule and unschedule are PUBLIC EXECUTE but excluded from application bindings.",
      nulls:
        "Strict anonymous schedule/unschedule return NULL on NULL input; named schedule rejects NULL name/schedule/command. alter_job NULL optional attributes mean unchanged.",
      defaults: "No SQL defaults.",
    },
  },
  {
    id: "schema:cron",
    disposition: "internal",
    reason:
      "Fixed installation pg_catalog with native cron object namespace; existing installation authority creates schema:cron. No request-time DDL or custom schema option.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "sequence column:cron.jobid_seq.is_called",
    disposition: "internal",
    reason:
      "Native scheduler-owned sequence column:cron.jobid_seq.is_called supplies job/run identities. Read-only catalogue/sequence layout proof; no public reset or arbitrary sequence mutation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "sequence column:cron.jobid_seq.last_value",
    disposition: "internal",
    reason:
      "Native scheduler-owned sequence column:cron.jobid_seq.last_value supplies job/run identities. Read-only catalogue/sequence layout proof; no public reset or arbitrary sequence mutation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "sequence column:cron.jobid_seq.log_cnt",
    disposition: "internal",
    reason:
      "Native scheduler-owned sequence column:cron.jobid_seq.log_cnt supplies job/run identities. Read-only catalogue/sequence layout proof; no public reset or arbitrary sequence mutation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "sequence column:cron.runid_seq.is_called",
    disposition: "internal",
    reason:
      "Native scheduler-owned sequence column:cron.runid_seq.is_called supplies job/run identities. Read-only catalogue/sequence layout proof; no public reset or arbitrary sequence mutation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "sequence column:cron.runid_seq.last_value",
    disposition: "internal",
    reason:
      "Native scheduler-owned sequence column:cron.runid_seq.last_value supplies job/run identities. Read-only catalogue/sequence layout proof; no public reset or arbitrary sequence mutation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "sequence column:cron.runid_seq.log_cnt",
    disposition: "internal",
    reason:
      "Native scheduler-owned sequence column:cron.runid_seq.log_cnt supplies job/run identities. Read-only catalogue/sequence layout proof; no public reset or arbitrary sequence mutation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "sequence:cron.jobid_seq",
    disposition: "internal",
    reason:
      "Native scheduler-owned sequence:cron.jobid_seq supplies job/run identities. Read-only catalogue/sequence layout proof; no public reset or arbitrary sequence mutation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "sequence:cron.runid_seq",
    disposition: "internal",
    reason:
      "Native scheduler-owned sequence:cron.runid_seq supplies job/run identities. Read-only catalogue/sequence layout proof; no public reset or arbitrary sequence mutation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table column:cron.job_run_details.command",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.command in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job_run_details.database",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.database in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job_run_details.end_time",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.end_time in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job_run_details.job_pid",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.job_pid in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job_run_details.jobid",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.jobid in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job_run_details.return_message",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.return_message in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job_run_details.runid",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.runid in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job_run_details.start_time",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.start_time in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job_run_details.status",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.status in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job_run_details.username",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job_run_details.username in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: "table column:cron.job.active",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job.active in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table column:cron.job.command",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job.command in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table column:cron.job.database",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job.database in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table column:cron.job.jobid",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job.jobid in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table column:cron.job.jobname",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job.jobname in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table column:cron.job.nodename",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job.nodename in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table column:cron.job.nodeport",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job.nodeport in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table column:cron.job.schedule",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job.schedule in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table column:cron.job.username",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table column:cron.job.username in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table constraint:job_active_not_null on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_active_not_null on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_command_not_null on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_command_not_null on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_database_not_null on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_database_not_null on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_jobid_not_null on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_jobid_not_null on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_nodename_not_null on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_nodename_not_null on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_nodeport_not_null on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_nodeport_not_null on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_pkey on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_pkey on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_run_details_pkey on cron.job_run_details",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_run_details_pkey on cron.job_run_details is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_run_details_runid_not_null on cron.job_run_details",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_run_details_runid_not_null on cron.job_run_details is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_schedule_not_null on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_schedule_not_null on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:job_username_not_null on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:job_username_not_null on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table constraint:jobname_username_uniq on cron.job",
    disposition: "internal",
    reason:
      "Extension-owned table constraint:jobname_username_uniq on cron.job is captured exactly. Native unique name/username upsert, scheduler job/run readback and NULL contracts exercise the stored layout; no application index/constraint DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "table:cron.job",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table:cron.job in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronJobFields",
    },
  },
  {
    id: "table:cron.job_run_details",
    disposition: "query",
    reason:
      "Read-only jobRows/runDetailRows and withPgCron jobs/job/runDetails decode table:cron.job_run_details in exact native order; extension-owned table schema is not application DDL.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      privilege:
        "SELECT is subject to native RLS username=current_user; superusers/BYPASSRLS can observe other users. Scheduler changes are not table-revision observable.",
      codec: "cronRunDetailFields",
    },
  },
  {
    id: 'toast table:pg_toast."$toast:job_run_details"',
    disposition: "internal",
    reason:
      'PostgreSQL-owned subordinate toast table:pg_toast."$toast:job_run_details" supports native scheduler row storage. Exact catalogue capture proves identity/layout; native command/result rows exercise storage without exporting a TOAST API.',
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: 'toast table:pg_toast."$toast:job"',
    disposition: "internal",
    reason:
      'PostgreSQL-owned subordinate toast table:pg_toast."$toast:job" supports native scheduler row storage. Exact catalogue capture proves identity/layout; native command/result rows exercise storage without exporting a TOAST API.',
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
    },
  },
  {
    id: "trigger:cron_job_cache_invalidate on cron.job",
    disposition: "internal",
    reason:
      "Native cron.job AFTER INSERT/UPDATE/DELETE/TRUNCATE statement trigger executes cron.job_cache_invalidate(); trigger-context-only routine is not callable as an ordinary SQL expression. Direct job mutations exercise the captured attachment, with source-checked native invalidation implementation.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "internal",
      privilege: "Native routine is PUBLIC EXECUTE and not SECURITY DEFINER; requires native trigger context.",
      observability: "external",
    },
  },
  {
    id: "type:cron._job",
    disposition: "query",
    reason:
      "Exact native named composite/array codec for type:cron._job; stored scheduler layouts belong to extension installation, without application-created cron types.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      codec: "jobArrayCodec",
      nulls: "Preserves captured column nullability; composite arrays retain rank/bounds and NULL elements.",
    },
  },
  {
    id: "type:cron._job_run_details",
    disposition: "query",
    reason:
      "Exact native named composite/array codec for type:cron._job_run_details; stored scheduler layouts belong to extension installation, without application-created cron types.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      codec: "runDetailArrayCodec",
      nulls: "Preserves captured column nullability; composite arrays retain rank/bounds and NULL elements.",
    },
  },
  {
    id: "type:cron.job",
    disposition: "query",
    reason:
      "Exact native named composite/array codec for type:cron.job; stored scheduler layouts belong to extension installation, without application-created cron types.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      codec: "jobCodec",
      nulls: "Preserves captured column nullability; composite arrays retain rank/bounds and NULL elements.",
    },
  },
  {
    id: "type:cron.job_run_details",
    disposition: "query",
    reason:
      "Exact native named composite/array codec for type:cron.job_run_details; stored scheduler layouts belong to extension installation, without application-created cron types.",
    evidence: [
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/src/job_metadata.c",
      "https://github.com/citusdata/pg_cron/blob/v1.6.8/pg_cron.sql",
      "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
      "packages/e2e/integration/extensions-pg_cron.test.ts",
      "packages/tests/unit/extensions-pg_cron.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "local-exact-contract",
      authority: "query",
      observability: "external",
      codec: "runDetailCodec",
      nulls: "Preserves captured column nullability; composite arrays retain rank/bounds and NULL elements.",
    },
  },
] as const;
