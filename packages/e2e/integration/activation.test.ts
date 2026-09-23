import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import pg from "pg";
import * as v from "valibot";
import { drizzle } from "drizzle-orm/node-postgres";
import { createHash } from "node:crypto";
import { createNeonActivationVerifier } from "@loom/core/neon";
import { createRuntime, defineSchema, defineAuth, query } from "@loom/core/server";
import { defineRelations } from "drizzle-orm";
import { bootstrapDatabase } from "@loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "Neon activation requires external branch identity and a read-only database grant",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    const keys = ["NEON_BRANCH", "DATABASE_URL", "LOOM_ACTIVATION_TOKEN"] as const;
    const saved = keys.map((key) => [key, process.env[key]] as const);
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      const address = new URL(connectionString);
      const token = "a".repeat(64);
      const version = "b".repeat(64);
      process.env.NEON_BRANCH = "production";
      process.env.DATABASE_URL = connectionString;
      process.env.LOOM_ACTIVATION_TOKEN = token;
      const verify = createNeonActivationVerifier({
        metadataNamespace,
        deployment: "app",
        version,
        projectId: "project",
        branchId: "br-production",
        branchName: "production",
        endpointHost: address.hostname,
        databaseName: decodeURIComponent(address.pathname.slice(1)),
      });
      const signal = new AbortController().signal;
      const context = {
        db: drizzle({ client: admin }),
        connectionString,
        deployment: "app",
        version,
        metadataNamespace,
      };
      await verify(signal);
      await assert.rejects(verify(signal, context), /activation denied/i);
      await admin.query(
        `INSERT INTO "${metadataNamespace}".deployment_activations
      (deployment, version, project_id, branch_id, endpoint_host, database_name, token_hash, state)
      VALUES ('app', $1, 'project', 'br-production', $2, $3, $4, 'active')`,
        [
          version,
          address.hostname,
          decodeURIComponent(address.pathname.slice(1)),
          createHash("sha256").update(token).digest("hex"),
        ],
      );
      await verify(signal, context);
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      const runtimeAddress = new URL(connectionString);
      runtimeAddress.username = runtimeRole;
      runtimeAddress.password = "loom-test-only";
      const schema = defineSchema(() => ({}));
      const admitted = Promise.withResolvers<void>();
      const resume = Promise.withResolvers<void>();
      let pauseAdmission = false;
      let executed = false;
      let holdHandler = false;
      const entered = Promise.withResolvers<void>();
      const finish = Promise.withResolvers<void>();
      const runtimeOptions = {
        schema,
        relations: defineRelations(schema.tables),
        connectionString: runtimeAddress.href,
        maxConnections: 1,
        version,
        deployment: "app",
        metadataNamespace,
        auth: defineAuth({ authorize: () => {} }),
        functions: {
          "test:read": query({
            args: v.null(),
            returns: v.null(),
            handler: async () => {
              executed = true;
              if (holdHandler) {
                entered.resolve();
                await finish.promise;
              }
              return null;
            },
          }),
        },
        assertActive: async (...args: Parameters<typeof verify>) => {
          await verify(...args);
          if (pauseAdmission) {
            pauseAdmission = false;
            admitted.resolve();
            await resume.promise;
          }
        },
      };
      await assert.rejects(createRuntime({ ...runtimeOptions, version: "d".repeat(64) }), /activation denied/i);
      const runtime = await createRuntime(runtimeOptions);
      try {
        expect(
          (await runtime.dispatcher.public({ name: "test:read", kind: "query", version, args: null }, null)).ok,
        ).toBe(true);
        holdHandler = true;
        const inFlight = runtime.dispatcher.public({ name: "test:read", kind: "query", version, args: null }, null);
        await entered.promise;
        await admin.query("BEGIN");
        try {
          await assert.rejects(
            admin.query(`LOCK TABLE "${metadataNamespace}".deployment_activations IN ACCESS EXCLUSIVE MODE NOWAIT`),
            /could not obtain lock/,
          );
        } finally {
          await admin.query("ROLLBACK");
          finish.resolve();
        }
        expect((await inFlight).ok).toBe(true);
        holdHandler = false;
        executed = false;
        pauseAdmission = true;
        const request = runtime.dispatcher.public({ name: "test:read", kind: "query", version, args: null }, null);
        await admitted.promise;
        await admin.query("BEGIN");
        await admin.query(`LOCK TABLE "${metadataNamespace}".deployment_activations IN ACCESS EXCLUSIVE MODE`);
        await admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET state = 'quarantined'`);
        await admin.query("COMMIT");
        resume.resolve();
        expect((await request).ok).toBe(false);
        expect(executed).toBe(false);
      } finally {
        resume.resolve();
        finish.resolve();
        await runtime.stop();
      }
      await admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET state = 'active'`);
      process.env.NEON_BRANCH = "cloned-preview";
      await assert.rejects(verify(signal), /activation denied/i);
      await assert.rejects(createRuntime(runtimeOptions), /activation denied/i);
      await assert.rejects(verify(signal, context), /activation denied/i);
      process.env.NEON_BRANCH = "production";
      const cloneAddress = new URL(connectionString);
      cloneAddress.hostname = "clone.example.test";
      process.env.DATABASE_URL = cloneAddress.href;
      await assert.rejects(verify(signal), /activation denied/i);
      process.env.DATABASE_URL = connectionString;
      process.env.LOOM_ACTIVATION_TOKEN = "c".repeat(64);
      await assert.rejects(verify(signal, context), /activation denied/i);
      process.env.LOOM_ACTIVATION_TOKEN = token;
      await assert.rejects(
        verify(signal, { ...context, connectionString: `${connectionString}?host=other` }),
        /activation denied/i,
      );
      const otherPort = new URL(connectionString);
      otherPort.port = otherPort.port === "5433" ? "5434" : "5433";
      await assert.rejects(verify(signal, { ...context, connectionString: otherPort.href }), /activation denied/i);
      await admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET state = 'quarantined'`);
      await assert.rejects(verify(signal, context), /activation denied/i);
      await assert.rejects(createRuntime(runtimeOptions), /activation denied/i);
      await admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET state = 'retired'`);
      await assert.rejects(verify(signal, context), /activation denied/i);
      await assert.rejects(createRuntime(runtimeOptions), /activation denied/i);
      await admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET state = 'quarantined'`);
      await admin.query(`SET ROLE "${runtimeRole}"`);
      expect(
        (await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows[0]?.state,
      ).toBe("quarantined");
      await assert.rejects(
        admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET state = 'active'`),
        /permission denied/,
      );
      await admin.query("RESET ROLE");
    } finally {
      for (const [key, value] of saved) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      await admin.query("RESET ROLE");
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);
