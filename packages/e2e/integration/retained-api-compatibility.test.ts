import assert from "node:assert/strict";
import { test } from "bun:test";
import { defineSchema, defineTable } from "kello/server";
import { planCustomMigration } from "../../../apps/loom/src/tooling/migrations/custom";
import { writeMigration } from "../../../apps/loom/src/tooling/migrations/history";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { withRetainedApiFixture } from "../fixtures/retained-api-compatibility";
import type { RetainedDependency } from "../fixtures/retained-api-compatibility";

for (const dependency of ["active", "pending", "running", "claimed", "session"] satisfies RetainedDependency[]) {
  test(`retained component API ${dependency} dependency blocks an extension-free no-op before grant healing`, async () => {
    await withRetainedApiFixture(async (fixture) => {
      const { client, retainedRole, candidateRole } = fixture;
      await fixture.depend(dependency);
      await client.query(`REVOKE USAGE ON SCHEMA search_extensions FROM ${quoteIdentifier(retainedRole)}`);
      await client.query(`REVOKE SELECT ON loom_meta.jobs FROM ${quoteIdentifier(candidateRole)}`);
      const before = await fixture.snapshot();
      assert.deepEqual(before.privileges, [{ candidate: true, retained: false }]);
      assert.deepEqual(before.metadataPrivilege, [{ allowed: false }]);
      await assert.rejects(fixture.apply(), /runtime role.*USAGE denied/i);
      assert.deepEqual(await fixture.snapshot(), before);
    });
  }, 120000);
}

test("retained API checks legacy pending SQL across namespaces before application effects", async () => {
  await withRetainedApiFixture(async (fixture) => {
    await fixture.append("UPDATE app.tasks SET title='must not commit'");
    await fixture.depend("session");
    await fixture.client.query(
      `REVOKE USAGE ON SCHEMA search_extensions FROM ${quoteIdentifier(fixture.retainedRole)}`,
    );
    const before = await fixture.snapshot();
    await assert.rejects(fixture.apply(), /runtime role.*USAGE denied/i);
    assert.deepEqual(await fixture.snapshot(), before);
  });
}, 120000);

test("same-name version and placement member drift blocks a retained component before native grant healing", async () => {
  await withRetainedApiFixture(async (fixture) => {
    await fixture.depend("active");
    await fixture.client.query(
      "CREATE FUNCTION search_extensions.retained_extra(value text) RETURNS text LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT value'; ALTER EXTENSION pg_trgm ADD FUNCTION search_extensions.retained_extra(text)",
    );
    await fixture.client.query(`REVOKE SELECT ON loom_meta.jobs FROM ${quoteIdentifier(fixture.candidateRole)}`);
    const before = await fixture.snapshot();
    assert.deepEqual(
      before.extensions.filter((extension) => extension.extname === "pg_trgm"),
      [{ extname: "pg_trgm", extversion: "1.6", schema: "search_extensions" }],
    );
    await assert.rejects(fixture.apply(), /SQL contract mismatch/i);
    assert.deepEqual(await fixture.snapshot(), before);
  });
}, 120000);

test("terminal jobs and expired sessions release retained pins while inherited native privileges pass", async () => {
  await withRetainedApiFixture(async (fixture) => {
    const { client, retainedRole, candidateRole } = fixture;
    await fixture.depend("running");
    await fixture.depend("session");
    await client.query(`REVOKE USAGE ON SCHEMA search_extensions FROM ${quoteIdentifier(retainedRole)}`);
    await client.query(`GRANT ${quoteIdentifier(candidateRole)} TO ${quoteIdentifier(retainedRole)} WITH INHERIT TRUE`);
    assert.deepEqual(
      (
        await client.query("SELECT has_schema_privilege($1::name,'search_extensions','USAGE') AS allowed", [
          retainedRole,
        ])
      ).rows,
      [{ allowed: true }],
    );
    assert.deepEqual((await fixture.apply()).applied, []);
    await client.query(`REVOKE ${quoteIdentifier(candidateRole)} FROM ${quoteIdentifier(retainedRole)}`);
    await client.query(
      "UPDATE loom_meta.jobs SET state='succeeded',lease_owner=NULL,lease_expires_at=NULL; UPDATE loom_meta.client_sessions SET expires_at=clock_timestamp()-interval '1 second'",
    );
    const plan = await fixture.append("UPDATE app.tasks SET title='safe after drain'");
    assert.deepEqual((await fixture.apply()).applied, [plan.hash]);
    assert.deepEqual((await client.query("SELECT title FROM app.tasks")).rows, [{ title: "safe after drain" }]);
  });
}, 120000);

test("malformed and conflicting saved full-generation proofs refuse before native repair or application writes", async () => {
  await withRetainedApiFixture(async (fixture) => {
    await fixture.depend("active");
    const { client, requiredApi, candidateRole } = fixture;
    await client.query(
      "UPDATE loom_meta.runtime_compatibility SET required_api='{}'::jsonb WHERE namespace='component_search'",
    );
    await client.query(`REVOKE SELECT ON loom_meta.jobs FROM ${quoteIdentifier(candidateRole)}`);
    const malformed = await fixture.snapshot();
    await assert.rejects(fixture.apply(), /Invalid|required API|evidence/i);
    assert.deepEqual(await fixture.snapshot(), malformed);
    const conflicting = {
      ...requiredApi,
      scopes: requiredApi.scopes.map((scope) => ({ ...scope, mountPath: "different_original_mount" })),
    };
    await client.query(
      "UPDATE loom_meta.runtime_compatibility SET required_api=$1::jsonb WHERE namespace='component_search'",
      [JSON.stringify(conflicting)],
    );
    const conflict = await fixture.snapshot();
    await assert.rejects(fixture.apply(), /conflict|original|required API|evidence/i);
    assert.deepEqual(await fixture.snapshot(), conflict);
    await client.query(
      "UPDATE loom_meta.runtime_compatibility SET required_api=$1::jsonb,runtime_role=$2 WHERE namespace='component_search'",
      [JSON.stringify(requiredApi), candidateRole],
    );
    const roleConflict = await fixture.snapshot();
    await assert.rejects(fixture.apply(), /conflict|original|runtime role|evidence/i);
    assert.deepEqual(await fixture.snapshot(), roleConflict);
    await client.query(
      "UPDATE loom_meta.runtime_compatibility SET required_api=NULL,runtime_role=NULL WHERE namespace='component_search'",
    );
    const mixedLegacy = await fixture.snapshot();
    await assert.rejects(fixture.apply(), /conflict|original|required API|evidence/i);
    assert.deepEqual(await fixture.snapshot(), mixedLegacy);
  });
}, 120000);

test("retained native postcheck rolls back reviewed callable removal, data effects and both journals", async () => {
  await withRetainedApiFixture(async (fixture) => {
    await fixture.depend("active");
    await fixture.append("UPDATE app.tasks SET title='must roll back'; DROP SCHEMA search_extensions CASCADE");
    const before = await fixture.snapshot();
    await assert.rejects(fixture.apply(), /extension|contract|namespace|installation|pg_trgm/i);
    assert.deepEqual(await fixture.snapshot(), before);
    await verifyRequiredApiOnTarget(fixture.client, fixture.scopedApi, fixture.retainedRole);
    assert.equal(
      (await fixture.client.query("SELECT search_extensions.similarity('same','same') AS similarity")).rows[0]
        .similarity,
      1,
    );
  });
}, 120000);

test("each artifact rechecks its original retained role and rolls back only the incompatible later artifact", async () => {
  await withRetainedApiFixture(async (fixture) => {
    await fixture.depend("active");
    const first = await fixture.append("UPDATE app.tasks SET title='first committed'", "first");
    const role = quoteIdentifier(fixture.retainedRole).replaceAll("'", "''");
    await fixture.append(
      `CREATE FUNCTION app.revoke_retained_usage() RETURNS void LANGUAGE plpgsql AS $fixture$ BEGIN EXECUTE 'REVOKE USAGE ON SCHEMA search_extensions FROM ${role}'; END; $fixture$; SELECT app.revoke_retained_usage(); UPDATE app.tasks SET title='second must roll back'`,
      "second",
    );
    await assert.rejects(fixture.apply(), /runtime role.*USAGE denied/i);
    assert.deepEqual((await fixture.client.query("SELECT title FROM app.tasks")).rows, [{ title: "first committed" }]);
    assert.deepEqual(
      (await fixture.client.query("SELECT hash FROM loom_meta.migration_history ORDER BY ordinal")).rows,
      [{ hash: fixture.initial.hash }, { hash: first.hash }],
    );
    assert.equal(
      (await fixture.client.query("SELECT to_regprocedure('app.revoke_retained_usage()')::text AS routine")).rows[0]
        .routine,
      null,
    );
    await verifyRequiredApiOnTarget(fixture.client, fixture.scopedApi, fixture.retainedRole);
  });
}, 120000);

test("custom evidence and dependency deletion cannot discard the original retained snapshot", async () => {
  await withRetainedApiFixture(async (fixture) => {
    await fixture.depend("session");
    await fixture.append(
      "DELETE FROM loom_meta.runtime_compatibility WHERE deployment='retained'; DELETE FROM loom_meta.client_sessions WHERE deployment='retained'; UPDATE app.tasks SET title='erased evidence'; DROP SCHEMA search_extensions CASCADE",
    );
    const before = await fixture.snapshot();
    await assert.rejects(fixture.apply(), /retained|required API|evidence|contract|extension/i);
    assert.deepEqual(await fixture.snapshot(), before);
    await verifyRequiredApiOnTarget(fixture.client, fixture.scopedApi, fixture.retainedRole);
  });
}, 120000);

test("loss of an original persisted scope identity rolls back even when the native contract remains callable", async () => {
  await withRetainedApiFixture(async (fixture) => {
    await fixture.depend("session");
    await fixture.append(
      "DELETE FROM loom_meta.runtime_compatibility WHERE namespace='component_search'; DELETE FROM loom_meta.client_sessions WHERE deployment='retained'; UPDATE app.tasks SET title='must preserve original evidence'",
    );
    const before = await fixture.snapshot();
    await assert.rejects(fixture.apply(), /retained|required API|evidence|identity|compatibility/i);
    assert.deepEqual(await fixture.snapshot(), before);
    await verifyRequiredApiOnTarget(fixture.client, fixture.scopedApi, fixture.retainedRole);
  });
}, 120000);

test("a real v27 metadata prefix upgrades before retained readers select the appended columns", async () => {
  await withRetainedApiFixture(async (fixture) => {
    const { client } = fixture;
    await client.query(
      "ALTER TABLE loom_meta.runtime_compatibility DROP COLUMN required_api, DROP COLUMN runtime_role; DELETE FROM loom_meta.framework_migrations WHERE version>=28",
    );
    const framework = (await client.query("SELECT version,hash FROM loom_meta.framework_migrations ORDER BY version"))
      .rows;
    assert.equal(framework.length, 27);
    const history = (await client.query("SELECT * FROM loom_meta.migration_history ORDER BY ordinal")).rows;
    assert.deepEqual((await fixture.apply()).applied, []);
    assert.deepEqual(
      (await client.query("SELECT version,hash FROM loom_meta.framework_migrations WHERE version<=27 ORDER BY version"))
        .rows,
      framework,
    );
    assert.equal(
      (await client.query("SELECT max(version) AS version FROM loom_meta.framework_migrations")).rows[0].version,
      28,
    );
    assert.deepEqual(
      (await client.query("SELECT required_api,runtime_role FROM loom_meta.runtime_compatibility ORDER BY namespace"))
        .rows,
      [
        { required_api: null, runtime_role: null },
        { required_api: null, runtime_role: null },
      ],
    );
    assert.deepEqual((await client.query("SELECT * FROM loom_meta.migration_history ORDER BY ordinal")).rows, history);
  });
}, 120000);

test("retained native drift refuses concurrent recovery before index DDL or recovery journaling", async () => {
  await withRetainedApiFixture(async (fixture) => {
    const indexed = defineSchema(
      (s) => ({ tasks: defineTable({ title: s.text() }, { indexes: [{ fields: ["title"] }] }) }),
      { namespace: "app" },
    );
    const plan = await planCustomMigration(
      fixture.initial.snapshot,
      indexed,
      'CREATE INDEX CONCURRENTLY tasks_0_idx ON "app".tasks (title)',
      "nontransactional",
      fixture.initial.hash,
    );
    await writeMigration(fixture.root, "migrations", "index_title", plan);
    fixture.artifacts.push(plan);
    await fixture.register();
    await fixture.depend("active");
    await fixture.client.query(
      `REVOKE USAGE ON SCHEMA search_extensions FROM ${quoteIdentifier(fixture.retainedRole)}`,
    );
    const before = await fixture.snapshot();
    await assert.rejects(fixture.apply(true), /runtime role.*USAGE denied/i);
    assert.deepEqual(await fixture.snapshot(), before);
    assert.equal(
      (await fixture.client.query("SELECT to_regclass('app.tasks_0_idx')::text AS index")).rows[0].index,
      null,
    );
    await fixture.client.query(`GRANT USAGE ON SCHEMA search_extensions TO ${quoteIdentifier(fixture.retainedRole)}`);
    assert.deepEqual((await fixture.apply(true)).applied, [plan.hash]);
    assert.deepEqual((await fixture.client.query("SELECT * FROM loom_meta.nontransactional_migrations")).rows, []);
  });
}, 120000);
