import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_stat_statements.json";
export const statementStatisticsSchema = 'stats "shared"';
export const statementStatisticsDescriptor = {
  name: "pg_stat_statements",
  version: "1.12",
  schema: statementStatisticsSchema,
  apiSupport: { status: "verified", digest: source.digest },
} as const;
export const statementStatisticsInstall = `CREATE SCHEMA "stats ""shared"""; CREATE EXTENSION pg_stat_statements WITH SCHEMA "stats ""shared""" VERSION '1.12'; CREATE TABLE statement_items (id int); INSERT INTO statement_items SELECT generate_series(1,20)`;
/** Database creation cannot initialize pg_stat_statements shared memory or enable query IDs. */
export const statementStatisticsPrerequisite =
  "An isolated disposable proof compute must preload pg_stat_statements and enable query identifier calculation; missing prerequisites are failed acceptance, never a skipped pass.";
