import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import pg from "pg";
import { defineConfig, withDevelopmentConnection } from "@loom/tooling";
import type { DevelopmentDatabaseProvider } from "@loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "development sessions bind credentials, recheck protection under the lock, and release on failure",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const url = new URL(connectionString);
    const namespace = `app_${crypto.randomUUID().replaceAll("-", "")}`;
    const config = defineConfig({
      project: "tasks",
      database: { namespace },
      provider: {
        projectId: "test-project",
        targets: { development: { branchId: "br-developer" } },
      },
    });
    const branch = { id: "br-developer", name: "developer", protected: false, isDefault: false };
    const requests: Parameters<DevelopmentDatabaseProvider["getConnectionUri"]>[1][] = [];
    let credentialsRequested = () => {};
    const requested = new Promise<void>((resolve) => {
      credentialsRequested = resolve;
    });
    const api: DevelopmentDatabaseProvider = {
      getProject: async () => ({ id: "test-project", name: "tasks", pgVersion: 18, regionId: "test" }),
      listBranches: async () => [branch],
      listEndpoints: async () => [
        {
          id: "ep-developer",
          branchId: branch.id,
          type: "read_write",
          autoscalingLimitMinCu: 0.25,
          autoscalingLimitMaxCu: 1,
          suspendTimeout: 300,
        },
      ],
      getConnectionUri: async (_project, input) => {
        requests.push(input);
        credentialsRequested();
        return { uri: connectionString };
      },
    };
    const options = {
      config,
      databaseName: decodeURIComponent(url.pathname.slice(1)),
      migrationRole: decodeURIComponent(url.username),
    };
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    const lock = `loom:migrations:${namespace}`;
    try {
      await admin.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", [lock]);
      let ran = false;
      const blocked = withDevelopmentConnection(
        options,
        async () => {
          ran = true;
        },
        api,
      );
      // The first provider inspection passed; change protection before this session can acquire the lock.
      await requested;
      branch.protected = true;
      await admin.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [lock]);
      await assert.rejects(blocked, /protected/);
      expect(ran).toBe(false);
      branch.protected = false;
      const identity = await withDevelopmentConnection(
        options,
        async (client, target) => {
          await client.query(`CREATE SCHEMA "${namespace}"`);
          return target;
        },
        api,
      );
      expect(identity.endpointId).toBe("ep-developer");
      expect(
        requests.every(
          (request) =>
            request.branchId === branch.id && request.endpointId === "ep-developer" && request.pooled === false,
        ),
      ).toBe(true);
      await assert.rejects(
        withDevelopmentConnection(
          options,
          async () => {
            throw new Error("Candidate rejected");
          },
          api,
        ),
        /Candidate rejected/,
      );
      expect(
        (
          await admin.query<{ acquired: boolean }>("SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS acquired", [
            lock,
          ])
        ).rows[0]?.acquired,
      ).toBe(true);
      await admin.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [lock]);
      const count = requests.length;
      branch.protected = true;
      await assert.rejects(
        withDevelopmentConnection(options, async () => {}, api),
        /protected/,
      );
      expect(requests).toHaveLength(count);
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.end();
    }
  },
);
