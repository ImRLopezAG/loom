import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_prewarm.json";
export const pgPrewarmSchema = 'warm "cache"';
export const pgPrewarmDescriptor = {
  name: "pg_prewarm",
  version: "1.2",
  schema: pgPrewarmSchema,
  apiSupport: { status: "verified", digest: source.digest },
} as const;
export const pgPrewarmInstall = `CREATE SCHEMA "warm ""cache"""; CREATE EXTENSION pg_prewarm WITH SCHEMA "warm ""cache""" VERSION '1.2'; CREATE TABLE prewarm_items AS SELECT g,repeat('x',100) AS body FROM generate_series(1,1000) g`;
/** Worker/dump acceptance affects server state beyond database teardown and requires an isolated proof compute. */
export function requirePrewarmServerIsolation(): void {
  if (process.env.LOOM_PREWARM_ISOLATED_SERVER !== "1")
    throw new Error(
      "pg_prewarm shared worker/file acceptance requires an isolated server; database-local cleanup cannot stop the worker or remove autoprewarm.blocks",
    );
}
