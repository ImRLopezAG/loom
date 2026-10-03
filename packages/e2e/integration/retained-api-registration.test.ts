import assert from "node:assert/strict";
import { test } from "bun:test";
import type pg from "pg";
import {
  buildGenerationRequiredApi,
  validateGenerationRequiredApi,
} from "../../../apps/loom/src/tooling/codegen/required-api";
import { bootstrapSession, frameworkMigrations } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { quoteIdentifier, withMigrationConnection } from "../../../apps/loom/src/tooling/migrations/connection";
import { recordRuntimeCompatibility } from "../../../apps/loom/src/tooling/migrations/runtime-compatibility";
import { withExtensionDatabase } from "../fixtures/extension-database";

const metadataNamespace = "loom_meta";
const namespace = "app";
const componentNamespace = "component_search";
const version = "a".repeat(64);
const sourceSchema = "b".repeat(64);
const inspection = {
  head: sourceSchema,
  minimumOrdinal: 0,
  maximumOrdinal: 0,
  schemas: [sourceSchema],
  migrationHashes: [],
};
const identity = { namespace, metadataNamespace, deployment: "preview", version, sourceSchema, inspection };

function generationPins(mountPath = "search") {
  const pins = buildGenerationRequiredApi([
    {
      mountPath,
      namespace: componentNamespace,
      extensions: { pg_trgm: { version: "1.6", schema: "search_extensions" } },
    },
    { mountPath: "", namespace, extensions: { citext: { version: "1.8", schema: "extensions" } } },
  ]);
  assert(pins);
  return pins;
}

async function withFixture(operation: (client: pg.Client, runtimeRole: string) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    await withMigrationConnection(url, async (client) => {
      const runtimeRole = `runtime_${crypto.randomUUID().replaceAll("-", "")}`;
      try {
        await bootstrapSession(client, metadataNamespace, runtimeRole);
        await operation(client, runtimeRole);
      } finally {
        await client.query("RESET ROLE");
        if ((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [runtimeRole])).rowCount) {
          await client.query(`GRANT ${quoteIdentifier(runtimeRole)} TO CURRENT_USER`);
          await client.query(`DROP OWNED BY ${quoteIdentifier(runtimeRole)}`);
          await client.query(`DROP ROLE ${quoteIdentifier(runtimeRole)}`);
        }
      }
    });
  });
}

async function registrationSnapshot(client: pg.Client) {
  return {
    compatibility: (
      await client.query("SELECT * FROM loom_meta.runtime_compatibility ORDER BY namespace,deployment,version")
    ).rows,
    scopes: (await client.query("SELECT * FROM loom_meta.runtime_scopes ORDER BY namespace,deployment,version")).rows,
    history: (await client.query("SELECT * FROM loom_meta.migration_history ORDER BY namespace,ordinal")).rows,
  };
}

test("retained API metadata upgrades genuine v27 without backfilling legacy proof or changing history", async () => {
  await withFixture(async (client, runtimeRole) => {
    await recordRuntimeCompatibility(client, identity);
    await client.query(
      "CREATE SCHEMA app; CREATE TABLE app.tasks(title text); INSERT INTO app.tasks VALUES ('preserved')",
    );
    await client.query(
      "INSERT INTO loom_meta.migration_history(namespace,ordinal,name,hash,before_hash,after_hash,catalog_hash) VALUES('app',1,'initial',$1,$2,$2,$2)",
      ["c".repeat(64), sourceSchema],
    );
    await client.query(
      "ALTER TABLE loom_meta.runtime_compatibility DROP COLUMN IF EXISTS required_api, DROP COLUMN IF EXISTS runtime_role",
    );
    await client.query("DROP TABLE loom_meta.development_runtime_api");
    await client.query("DELETE FROM loom_meta.framework_migrations WHERE version>=28");
    const originalFramework = (
      await client.query("SELECT version,hash FROM loom_meta.framework_migrations ORDER BY version")
    ).rows;
    assert.equal(originalFramework.length, 27);
    const before = await registrationSnapshot(client);
    const role = (
      await client.query("SELECT oid,rolname,rolsuper,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname=$1", [
        runtimeRole,
      ])
    ).rows;
    await bootstrapSession(client, metadataNamespace, runtimeRole);
    const framework = (await client.query("SELECT version,hash FROM loom_meta.framework_migrations ORDER BY version"))
      .rows;
    assert.equal(framework.length, 29);
    assert.deepEqual(framework.slice(0, 27), originalFramework);
    assert.deepEqual(
      frameworkMigrations(metadataNamespace)
        .slice(0, 27)
        .map(({ version: number, hash }) => ({ version: number, hash })),
      originalFramework,
    );
    const after = await registrationSnapshot(client);
    assert.deepEqual(
      after.compatibility,
      before.compatibility.map((row) => ({ ...row, required_api: null, runtime_role: null })),
    );
    assert.deepEqual(after.scopes, before.scopes);
    assert.deepEqual(after.history, before.history);
    assert.deepEqual((await client.query("SELECT title FROM app.tasks")).rows, [{ title: "preserved" }]);
    assert.deepEqual(
      (
        await client.query("SELECT oid,rolname,rolsuper,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname=$1", [
          runtimeRole,
        ])
      ).rows,
      role,
    );
    for (const [payload, roleName] of [
      ["null", runtimeRole],
      ["null", null],
      ["{}", null],
      [null, runtimeRole],
      ["[]", runtimeRole],
    ]) {
      await assert.rejects(
        client.query("UPDATE loom_meta.runtime_compatibility SET required_api=$1::jsonb,runtime_role=$2", [
          payload,
          roleName,
        ]),
        /check constraint/,
      );
    }
    assert.deepEqual(await registrationSnapshot(client), after);
  });
}, 120000);

test("retained API registration stores the same full normalized host and component generation pins and actual role", async () => {
  await withFixture(async (client, runtimeRole) => {
    const pins = generationPins();
    const reversed = { ...pins, scopes: [...pins.scopes].reverse() };
    for (const selectedNamespace of [namespace, componentNamespace]) {
      const options = { ...identity, namespace: selectedNamespace, requiredApi: reversed, runtimeRole };
      await recordRuntimeCompatibility(client, options);
    }
    const proof = (
      await client.query(
        "SELECT namespace,required_api,runtime_role FROM loom_meta.runtime_compatibility ORDER BY namespace",
      )
    ).rows;
    assert.deepEqual(
      proof,
      [namespace, componentNamespace].map((selectedNamespace) => ({
        namespace: selectedNamespace,
        required_api: validateGenerationRequiredApi(pins),
        runtime_role: runtimeRole,
      })),
    );
    const widened = {
      ...identity,
      requiredApi: pins,
      runtimeRole,
      inspection: { ...inspection, maximumOrdinal: 1, migrationHashes: ["c".repeat(64)] },
    };
    await recordRuntimeCompatibility(client, widened);
    assert.deepEqual(
      (
        await client.query(
          "SELECT namespace,required_api,runtime_role FROM loom_meta.runtime_compatibility ORDER BY namespace",
        )
      ).rows,
      proof,
    );
    assert.equal(
      (await client.query("SELECT maximum_ordinal FROM loom_meta.runtime_compatibility WHERE namespace='app'")).rows[0]
        .maximum_ordinal,
      1,
    );
  });
}, 120000);

test("retained API registration rejects replacement, role changes and stripped evidence before registering scopes", async () => {
  await withFixture(async (client, runtimeRole) => {
    const options = { ...identity, requiredApi: generationPins(), runtimeRole };
    await recordRuntimeCompatibility(client, options);
    await client.query("DELETE FROM loom_meta.runtime_scopes");
    const before = await registrationSnapshot(client);
    const replacement = { ...options, requiredApi: generationPins("renamed") };
    const changedRole = { ...options, runtimeRole: "another_runtime" };
    const partial = { ...options, runtimeRole: undefined };
    for (const attempted of [replacement, changedRole, partial, identity]) {
      await assert.rejects(recordRuntimeCompatibility(client, attempted), /required API|runtime role|evidence/i);
      assert.deepEqual(await registrationSnapshot(client), before);
    }
  });
}, 120000);

test("retained API legacy NULL registrations stay unpinned and cannot be silently backfilled", async () => {
  await withFixture(async (client, runtimeRole) => {
    await recordRuntimeCompatibility(client, identity);
    await client.query("DELETE FROM loom_meta.runtime_scopes");
    const before = await registrationSnapshot(client);
    const attempted = { ...identity, requiredApi: generationPins(), runtimeRole };
    await assert.rejects(recordRuntimeCompatibility(client, attempted), /required API|evidence/i);
    assert.deepEqual(await registrationSnapshot(client), before);
    await recordRuntimeCompatibility(client, {
      ...identity,
      inspection: { ...inspection, maximumOrdinal: 1, migrationHashes: ["c".repeat(64)] },
    });
    assert.deepEqual(
      (await client.query("SELECT required_api,runtime_role FROM loom_meta.runtime_compatibility")).rows,
      [{ required_api: null, runtime_role: null }],
    );
  });
}, 120000);

test("retained API partial input and malformed saved evidence refuse without scope or history mutation", async () => {
  await withFixture(async (client, runtimeRole) => {
    const pins = generationPins();
    const before = await registrationSnapshot(client);
    const pinsOnly = { ...identity, requiredApi: pins };
    const roleOnly = { ...identity, runtimeRole };
    const invalidRole = { ...identity, requiredApi: pins, runtimeRole: 'runtime"unsafe' };
    const emptyRole = { ...identity, requiredApi: pins, runtimeRole: "" };
    const nulRole = { ...identity, requiredApi: pins, runtimeRole: "runtime\0unsafe" };
    const longRole = { ...identity, requiredApi: pins, runtimeRole: "a".repeat(64) };
    for (const attempted of [pinsOnly, roleOnly, invalidRole, emptyRole, nulRole, longRole]) {
      await assert.rejects(
        recordRuntimeCompatibility(client, attempted),
        /required API|runtime role|evidence|Invalid/i,
      );
      assert.deepEqual(await registrationSnapshot(client), before);
    }
    const options = { ...identity, requiredApi: pins, runtimeRole };
    await recordRuntimeCompatibility(client, options);
    await client.query("UPDATE loom_meta.runtime_compatibility SET required_api='{}'::jsonb");
    await client.query("DELETE FROM loom_meta.runtime_scopes");
    const malformed = await registrationSnapshot(client);
    await assert.rejects(recordRuntimeCompatibility(client, options), /required API|evidence|Invalid/i);
    assert.deepEqual(await registrationSnapshot(client), malformed);
    await client.query(
      "ALTER TABLE loom_meta.runtime_compatibility DROP CONSTRAINT runtime_compatibility_required_api_check",
    );
    await client.query("UPDATE loom_meta.runtime_compatibility SET required_api='null'::jsonb,runtime_role=NULL");
    const jsonNull = await registrationSnapshot(client);
    assert.equal(
      (await client.query("SELECT required_api IS NULL AS absent FROM loom_meta.runtime_compatibility")).rows[0].absent,
      false,
    );
    await assert.rejects(recordRuntimeCompatibility(client, identity), /required API|evidence/i);
    assert.deepEqual(await registrationSnapshot(client), jsonNull);
  });
}, 120000);

test("retained API original full generation identity remains identical when registering a new scope", async () => {
  await withFixture(async (client, runtimeRole) => {
    const pins = generationPins();
    const options = { ...identity, requiredApi: pins, runtimeRole };
    await recordRuntimeCompatibility(client, options);
    const before = await registrationSnapshot(client);
    const newScope = { ...options, namespace: componentNamespace };
    for (const attempted of [
      { ...newScope, requiredApi: generationPins("renamed") },
      { ...newScope, runtimeRole: "another_runtime" },
      { ...identity, namespace: componentNamespace },
    ]) {
      await assert.rejects(recordRuntimeCompatibility(client, attempted), /required API|runtime role|evidence/i);
      assert.deepEqual(await registrationSnapshot(client), before);
    }
    await recordRuntimeCompatibility(client, newScope);
    const proof = (
      await client.query("SELECT required_api,runtime_role FROM loom_meta.runtime_compatibility ORDER BY namespace")
    ).rows;
    assert.deepEqual(
      proof,
      [1, 2].map(() => ({ required_api: pins, runtime_role: runtimeRole })),
    );
    const legacy = { ...identity, version: "d".repeat(64) };
    await recordRuntimeCompatibility(client, legacy);
    const legacyBefore = await registrationSnapshot(client);
    const legacyBackfill = { ...legacy, namespace: componentNamespace, requiredApi: pins, runtimeRole };
    await assert.rejects(recordRuntimeCompatibility(client, legacyBackfill), /required API|evidence/i);
    assert.deepEqual(await registrationSnapshot(client), legacyBefore);
  });
}, 120000);

test("named runtime credentials cannot update retained API evidence or its original runtime role", async () => {
  await withFixture(async (client, runtimeRole) => {
    const options = { ...identity, requiredApi: generationPins(), runtimeRole };
    await recordRuntimeCompatibility(client, options);
    const before = await registrationSnapshot(client);
    await client.query(`GRANT ${quoteIdentifier(runtimeRole)} TO CURRENT_USER`);
    try {
      await client.query(`SET ROLE ${quoteIdentifier(runtimeRole)}`);
      assert.equal((await client.query("SELECT current_user AS role")).rows[0].role, runtimeRole);
      await assert.rejects(
        client.query("UPDATE loom_meta.runtime_compatibility SET required_api=NULL"),
        /permission denied/,
      );
      await assert.rejects(
        client.query("UPDATE loom_meta.runtime_compatibility SET runtime_role='another_runtime'"),
        /permission denied/,
      );
    } finally {
      await client.query("RESET ROLE");
      await client.query(`REVOKE ${quoteIdentifier(runtimeRole)} FROM CURRENT_USER`);
    }
    assert.deepEqual(await registrationSnapshot(client), before);
  });
}, 120000);
