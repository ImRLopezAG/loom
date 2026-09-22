import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineSchema } from "@loom/core/server";
import { applyMigrations, emptySnapshot, planMigration, writeMigration } from "@loom/tooling";
import pg from "pg";
import { catalogFingerprint } from "../../tooling/src/migrations/drift.js";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)("locked ORM migrations apply once, roll back failed upgrades, preserve runtime boundaries and reject drift", async () => {
  if (!connectionString) throw new Error("Missing test database");
  const suffix = crypto.randomUUID().replaceAll("-", "");
  const namespace = `app_${suffix}`;
  const metadataNamespace = `loom_meta_${suffix}`;
  const runtimeRole = `loom_runtime_${suffix}`;
  const root = await mkdtemp(join(tmpdir(), "loom-runner-"));
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  await admin.query("SET search_path = pg_catalog");
  const options = { connectionString, root, migrations: "migrations", namespace, metadataNamespace, runtimeRole };
  try {
    const schema = defineSchema((f) => ({ tasks: { title: f.text() } }), { namespace });
    const initial = await planMigration(await emptySnapshot(namespace), schema);
    await writeMigration(root, "migrations", "initial", initial);
    const receipts = await Promise.all([applyMigrations(options), applyMigrations(options)]);
    expect(receipts.flatMap((receipt) => receipt.applied)).toEqual([initial.hash]);
    expect((await admin.query(`SELECT ordinal FROM "${metadataNamespace}".migration_history`)).rows).toEqual([{ ordinal: 1 }]);
    await admin.query(`SET ROLE "${runtimeRole}"`);
    await admin.query(`INSERT INTO "${namespace}".tasks (title) VALUES (NULL)`);
    await expect(admin.query(`ALTER TABLE "${namespace}".tasks ADD COLUMN forbidden text`)).rejects.toThrow("owner");
    await expect(admin.query(`UPDATE "${namespace}".tasks SET "_createdAt" = 0`)).rejects.toThrow("immutable");
    await admin.query("RESET ROLE");
    const required = await planMigration(initial.snapshot, defineSchema((f) => ({ tasks: { title: f.text().notNull() } }), { namespace }));
    await writeMigration(root, "migrations", "require_title", required);
    await expect(applyMigrations(options)).rejects.toThrow("requires review");
    const reviewed = { ...options, reviewedHashes: [required.hash] };
    await expect(applyMigrations(reviewed)).rejects.toThrow();
    expect((await admin.query(`SELECT ordinal FROM "${metadataNamespace}".migration_history`)).rows).toEqual([{ ordinal: 1 }]);
    expect((await admin.query<{ is_nullable: string }>("SELECT is_nullable FROM information_schema.columns WHERE table_schema=$1 AND table_name='tasks' AND column_name='title'", [namespace])).rows[0]?.is_nullable).toBe("YES");
    await admin.query(`UPDATE "${namespace}".tasks SET title = 'backfilled'`);
    expect((await applyMigrations(reviewed)).applied).toEqual([required.hash]);
    expect((await applyMigrations(reviewed)).applied).toEqual([]);
    const upgraded = await catalogFingerprint(admin, namespace);
    await admin.query(`DROP SCHEMA "${namespace}" CASCADE`);
    await admin.query(`DROP SCHEMA "${metadataNamespace}" CASCADE`);
    expect((await applyMigrations(reviewed)).applied).toEqual([initial.hash, required.hash]);
    expect(await catalogFingerprint(admin, namespace)).toBe(upgraded);
    await admin.query(`ALTER TABLE "${namespace}".tasks ADD COLUMN unmanaged text`);
    await expect(applyMigrations(reviewed)).rejects.toThrow("drift");
  } finally {
    await admin.query("RESET ROLE");
    await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
    await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
    await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
    await admin.end();
    await rm(root, { recursive: true, force: true });
  }
});
