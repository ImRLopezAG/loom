import assert from "node:assert/strict";
import { test } from "bun:test";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as v from "valibot";
import { applyMigrations, loadProject } from "@loom/tooling";
import { createRuntime } from "@loom/core/server";
import type { InvocationIdentity, JsonValue, StorageDelivery } from "@loom/core/server";
import { createHash } from "node:crypto";
import { createLocalStorage } from "../fixtures/local-storage";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "upload example catalogs verified objects, retries jobs and isolates owners",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const project = await loadProject(fileURLToPath(new URL("../../examples/jobs-storage/", import.meta.url)));
    if (project.protocol !== "loom-legacy-1") throw new Error("Expected legacy fixture");
    const database = `loom_upload_${crypto.randomUUID().replaceAll("-", "")}`;
    const runtimeRole = `${database}_runtime`;
    const admin = new pg.Client({ connectionString });
    const storage = createLocalStorage({ origin: "http://127.0.0.1:5174", onUploaded: async () => {} });
    const body = Buffer.from("verified local upload");
    await admin.connect();
    try {
      await admin.query(`CREATE DATABASE "${database}"`);
      const address = new URL(connectionString);
      address.pathname = `/${database}`;
      const migration = {
        connectionString: address.href,
        root: project.root,
        migrations: project.config.database.migrations,
        namespace: "app",
        metadataNamespace: "loom_meta",
        runtimeRole,
      };
      assert.equal((await applyMigrations(migration)).applied.length, 1);
      assert.deepEqual((await applyMigrations(migration)).applied, []);
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      address.username = runtimeRole;
      address.password = "loom-test-only";
      const runtime = await createRuntime({
        schema: project.schema,
        relations: project.relations,
        connectionString: address.href,
        version: project.version,
        deployment: "upload-example",
        metadataNamespace: "loom_meta",
        functions: Object.fromEntries(project.functions.map((entry) => [entry.name, entry.definition])),
        auth: project.auth,
        storage: project.storage,
        storageBackend: { ...storage.target, connect: () => storage },
        assertActive: async () => {},
      });
      try {
        assert(runtime.storage);
        const alice = { issuer: "example", subject: "alice", tenantId: "one" };
        const call = (name: string, args: JsonValue, identity: InvocationIdentity | null = alice) =>
          runtime.dispatcher.public({ name, kind: "query", args, version: project.version }, identity);
        const readStatus = async (intentId: string) => {
          const result = await call("files:status", { intentId });
          assert(result.ok, JSON.stringify(result));
          return v.parse(v.strictObject({ state: v.string(), attempts: v.number() }), result.value);
        };
        for (const bucket of ["uploads", "retry-demo", "failure-demo"]) {
          const upload = {
            size: body.length,
            contentType: "text/plain",
            sha256: createHash("sha256").update(body).digest("hex"),
          };
          const intent = await runtime.storage.intents.create(alice, { ...upload, bucket }, bucket);
          const signed = await runtime.storage.intents.signUpload(alice, intent.id);
          assert((await fetch(signed.url, { method: signed.method, headers: signed.headers, body })).ok);
          const delivery: StorageDelivery = {
            invocationId: crypto.randomUUID(),
            triggerId: "local",
            triggerName: bucket,
            bucket,
            key: signed.key,
          };
          const receipt = await runtime.storage.events.receive(delivery);
          assert.equal(receipt.state, "dispatched");
          assert.deepEqual(
            await runtime.storage.events.receive({ ...delivery, invocationId: crypto.randomUUID() }),
            receipt,
          );
          assert.equal((await runtime.worker.run(1)).completed, 1);
          assert.deepEqual(await readStatus(intent.id), { state: "pending", attempts: 0 });
          for (const identity of [
            null,
            { ...alice, subject: "bob" },
            { ...alice, issuer: "other" },
            { ...alice, tenantId: "two" },
          ]) {
            const denied = await call("files:status", { intentId: intent.id }, identity);
            assert(!denied.ok);
            assert.equal(denied.error.code, "FORBIDDEN");
          }
          const first = await runtime.worker.run(1);
          assert.equal(first.completed, bucket === "uploads" ? 1 : 0);
          if (bucket !== "uploads") {
            assert.deepEqual(await readStatus(intent.id), { state: "pending", attempts: 1 });
            await new Promise((resolve) => setTimeout(resolve, 2100));
            await runtime.worker.run(1);
            if (bucket === "failure-demo") {
              await new Promise((resolve) => setTimeout(resolve, 2100));
              await runtime.worker.run(1);
            }
          }
          assert.deepEqual(await readStatus(intent.id), {
            state: bucket === "failure-demo" ? "failed" : "succeeded",
            attempts: bucket === "uploads" ? 1 : bucket === "retry-demo" ? 2 : 3,
          });
        }
        const listed = await call("files:list", {});
        assert(listed.ok);
        const files = v.parse(
          v.array(v.object({ intentId: v.string(), bucket: v.string(), summary: v.nullable(v.string()) })),
          listed.value,
        );
        assert.equal(files.length, 3);
        assert.equal(new Set(files.map((file) => file.intentId)).size, 3);
        for (const file of files) assert.equal(file.summary === null, file.bucket === "failure-demo");
        const other = await call("files:list", {}, { ...alice, tenantId: "two" });
        assert(other.ok);
        assert.deepEqual(other.value, []);
      } finally {
        await runtime.stop();
      }
    } finally {
      await storage.close();
      await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
  30000,
);
