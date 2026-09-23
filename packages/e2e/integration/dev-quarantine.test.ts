import assert from "node:assert/strict";
import { test } from "bun:test";
import pg from "pg";
import { bootstrapDatabase, defineConfig, quarantineDevelopmentDatabase } from "@loom/tooling";
import type { DevelopmentDatabaseProvider } from "@loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "development quarantine verifies the target and atomically fences inherited work",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    const address = new URL(connectionString);
    const branch = { id: "br-development", name: "development", protected: false, isDefault: false };
    const provider: DevelopmentDatabaseProvider = {
      getProject: async () => ({ id: "project", name: "tasks", regionId: "test", pgVersion: 18 }),
      listBranches: async () => [branch],
      listEndpoints: async () => [
        {
          id: address.hostname.split(".")[0]!,
          branchId: branch.id,
          type: "read_write",
          autoscalingLimitMinCu: 0.25,
          autoscalingLimitMaxCu: 1,
          suspendTimeout: 300,
        },
      ],
      getConnectionUri: async () => ({ uri: connectionString }),
    };
    const config = defineConfig({
      project: "tasks",
      database: { metadataNamespace },
      provider: { projectId: "project", targets: { development: { branchId: branch.id } } },
    });
    const options = {
      config,
      databaseName: decodeURIComponent(address.pathname.slice(1)),
      migrationRole: decodeURIComponent(address.username),
    };
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`INSERT INTO "${metadataNamespace}".deployment_activations
      (deployment, version, project_id, branch_id, endpoint_host, database_name, token_hash, state)
      VALUES ('original', repeat('a', 64), 'project', 'br-original', 'ep-original.example', 'neondb', repeat('b', 64), 'active')`);
      await admin.query(`INSERT INTO "${metadataNamespace}".jobs
      (id, deployment, deduplication_key, fingerprint, call, identity, due_at, max_attempts, retry_delay_seconds, state, attempts, lease_owner, lease_expires_at, fencing_token)
      SELECT uuidv7(), 'original', state, repeat('a', 64), '{}'::jsonb, 'null'::jsonb, clock_timestamp(), 2, 1, state,
        CASE WHEN state = 'running' THEN 1 ELSE 0 END,
        CASE WHEN state = 'running' THEN 'inherited-worker' END,
        CASE WHEN state = 'running' THEN clock_timestamp() + interval '30 seconds' END, 1
      FROM unnest(ARRAY['pending', 'running', 'succeeded']) AS state`);
      branch.protected = true;
      await assert.rejects(quarantineDevelopmentDatabase(options, provider), /protected/);
      branch.protected = false;
      branch.isDefault = true;
      await assert.rejects(quarantineDevelopmentDatabase(options, provider), /default/);
      branch.isDefault = false;
      await assert.rejects(
        quarantineDevelopmentDatabase(options, {
          ...provider,
          getConnectionUri: async () => {
            branch.protected = true;
            return { uri: connectionString };
          },
        }),
        /protected/,
      );
      branch.protected = false;
      await assert.rejects(
        quarantineDevelopmentDatabase(
          {
            ...options,
            config: defineConfig({
              ...config,
              provider: {
                projectId: "project",
                targets: { development: { branchId: branch.id }, production: { branchId: branch.id } },
              },
            }),
          },
          provider,
        ),
        /separate/,
      );
      const cancellation = new AbortController();
      cancellation.abort();
      await assert.rejects(
        quarantineDevelopmentDatabase({ ...options, signal: cancellation.signal }, provider),
        /aborted/i,
      );
      await admin.query(
        `ALTER TABLE "${metadataNamespace}".jobs ADD CONSTRAINT refuse_cancel CHECK (state <> 'cancelled')`,
      );
      await assert.rejects(quarantineDevelopmentDatabase(options, provider), /quarantine transaction failed/);
      assert.equal(
        (await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows[0].state,
        "active",
      );
      await admin.query(`ALTER TABLE "${metadataNamespace}".jobs DROP CONSTRAINT refuse_cancel`);
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'quarantine-test-only'`);
      const runtimeAddress = new URL(address);
      runtimeAddress.username = runtimeRole;
      runtimeAddress.password = "quarantine-test-only";
      await assert.rejects(
        quarantineDevelopmentDatabase(
          { ...options, migrationRole: runtimeRole },
          {
            ...provider,
            getConnectionUri: async () => ({ uri: runtimeAddress.href }),
          },
        ),
        /metadata owner/,
      );
      const result = await quarantineDevelopmentDatabase(options, provider);
      assert.deepEqual(result, {
        projectId: "project",
        branchId: branch.id,
        endpointId: address.hostname.split(".")[0],
        revokedGrants: 1,
        cancelledJobs: 2,
      });
      assert.equal(
        (await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows[0].state,
        "quarantined",
      );
      assert.deepEqual(
        (
          await admin.query(
            `SELECT state, fencing_token::integer AS token, lease_owner, cancel_requested FROM "${metadataNamespace}".jobs ORDER BY deduplication_key`,
          )
        ).rows,
        [
          { state: "cancelled", token: 2, lease_owner: null, cancel_requested: true },
          { state: "cancelled", token: 2, lease_owner: null, cancel_requested: true },
          { state: "succeeded", token: 1, lease_owner: null, cancel_requested: false },
        ],
      );
      assert.equal((await quarantineDevelopmentDatabase(options, provider)).cancelledJobs, 0);
      assert.equal((await quarantineDevelopmentDatabase(options, provider)).revokedGrants, 0);
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);
