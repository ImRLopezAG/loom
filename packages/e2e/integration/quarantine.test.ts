import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import pg from "pg";
import { bootstrapDatabase, defineConfig, quarantinePreviewDatabase, withDeploymentConnection } from "@loom/tooling";
import type { DeploymentDatabaseProvider } from "@loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "preview quarantine revokes grants and fences copied jobs atomically on a verified target",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      const address = new URL(connectionString);
      const endpointId = address.hostname.split(".")[0] ?? "";
      const branch = { id: "br-preview", name: "preview", protected: false, isDefault: false };
      const endpoint = {
        id: endpointId,
        branchId: branch.id,
        type: "read_write" as const,
        autoscalingLimitMinCu: 0.25,
        autoscalingLimitMaxCu: 1,
        suspendTimeout: 300,
      } satisfies Awaited<ReturnType<DeploymentDatabaseProvider["listEndpoints"]>>[number];
      const api: DeploymentDatabaseProvider = {
        getProject: async () => ({ id: "project", name: "tasks", regionId: "aws-us-east-2", pgVersion: 18 }),
        listBranches: async () => [branch],
        listEndpoints: async () => [endpoint],
        getConnectionUri: async () => ({ uri: connectionString }),
      };
      const config = defineConfig({
        project: "tasks",
        database: { metadataNamespace },
        provider: { projectId: "project", targets: { preview: { branchId: branch.id } } },
      });
      const options = {
        config,
        environment: "preview" as const,
        databaseName: decodeURIComponent(address.pathname.slice(1)),
        migrationRole: decodeURIComponent(address.username),
      };
      const version = "b".repeat(64);
      await admin.query(
        `INSERT INTO "${metadataNamespace}".deployment_activations
      (deployment, version, project_id, branch_id, endpoint_host, database_name, token_hash, state)
      VALUES ('original', $1, 'project', 'br-original', 'ep-original.example', 'neondb', $1, 'active')`,
        [version],
      );
      await admin.query(`INSERT INTO "${metadataNamespace}".jobs
      (id, deployment, deduplication_key, fingerprint, call, identity, due_at, max_attempts, retry_delay_seconds, state, attempts, lease_owner, lease_expires_at, fencing_token)
      SELECT uuidv7(), 'original', state, repeat('a', 64), '{}'::jsonb, 'null'::jsonb, clock_timestamp(), 2, 1, state,
        CASE WHEN state = 'running' THEN 1 ELSE 0 END,
        CASE WHEN state = 'running' THEN 'old-worker' END,
        CASE WHEN state = 'running' THEN clock_timestamp() + interval '30 seconds' END, 1
      FROM unnest(ARRAY['pending', 'running', 'succeeded']) AS state`);
      await admin.query(
        `ALTER TABLE "${metadataNamespace}".jobs ADD CONSTRAINT refuse_cancel CHECK (state <> 'cancelled')`,
      );
      await assert.rejects(quarantinePreviewDatabase(options, api), /quarantine transaction failed/);
      expect((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows).toEqual([
        { state: "active" },
      ]);
      await admin.query(`ALTER TABLE "${metadataNamespace}".jobs DROP CONSTRAINT refuse_cancel`);
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      const runtimeAddress = new URL(connectionString);
      runtimeAddress.username = runtimeRole;
      runtimeAddress.password = "loom-test-only";
      api.getConnectionUri = async () => ({ uri: runtimeAddress.href });
      await assert.rejects(
        quarantinePreviewDatabase({ ...options, migrationRole: runtimeRole }, api),
        /metadata owner/,
      );
      api.getConnectionUri = async () => ({ uri: connectionString });
      const first = await quarantinePreviewDatabase(options, api);
      expect(first).toMatchObject({ branchId: "br-preview", revokedGrants: 1, cancelledJobs: 2 });
      expect((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows).toEqual([
        { state: "quarantined" },
      ]);
      expect(
        (
          await admin.query(
            `SELECT state, fencing_token::integer AS token, lease_owner, cancel_requested FROM "${metadataNamespace}".jobs ORDER BY deduplication_key`,
          )
        ).rows,
      ).toEqual([
        { state: "cancelled", token: 2, lease_owner: null, cancel_requested: true },
        { state: "cancelled", token: 2, lease_owner: null, cancel_requested: true },
        { state: "succeeded", token: 1, lease_owner: null, cancel_requested: false },
      ]);
      expect(await quarantinePreviewDatabase(options, api)).toMatchObject({ revokedGrants: 0, cancelledJobs: 0 });
      let reads = 0;
      let ran = false;
      api.listBranches = async () => [{ ...branch, name: ++reads > 1 ? "renamed" : branch.name }];
      await assert.rejects(
        withDeploymentConnection(
          options,
          async () => {
            ran = true;
          },
          api,
        ),
        /target changed/i,
      );
      expect(ran).toBe(false);
      api.listBranches = async () => [branch];
      api.getConnectionUri = async () => ({ uri: connectionString.replace(address.hostname, "wrong.example.test") });
      await assert.rejects(quarantinePreviewDatabase(options, api), /connection/i);
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);
