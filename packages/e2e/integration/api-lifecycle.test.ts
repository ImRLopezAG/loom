import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { createRpcTransport, createORPCClient } from "@loom/core/client";
import type { RpcCallContext } from "@loom/core/client";
import type { Client } from "@orpc/client";
import { createRpcQuerySession, createRpcLiveMethod } from "@loom/core/query";
import { QueryObserver } from "@tanstack/react-query";
import { bootstrapDatabase, installRevisionTracking } from "@loom/tooling";
import pg from "pg";
import * as v from "valibot";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "live queries reconnect after API SIGKILL and read writes committed during downtime",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const namespace = `app_${suffix}`;
    const metadataNamespace = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const runtime = new URL(connectionString);
    runtime.username = runtimeRole;
    runtime.password = "loom-test-only";
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    const children: ReturnType<typeof Bun.spawn>[] = [];
    const errors: Promise<string>[] = [];
    async function start(port: number) {
      const child = Bun.spawn(["bun", fileURLToPath(new URL("../fixtures/api-lifecycle.ts", import.meta.url))], {
        env: {
          ...process.env,
          LOOM_TEST_DATABASE_URL: runtime.href,
          LOOM_TEST_LIFECYCLE_SCHEMA: namespace,
          LOOM_TEST_LIFECYCLE_METADATA: metadataNamespace,
          LOOM_TEST_LIFECYCLE_PORT: String(port),
        },
        stdout: "pipe",
        stderr: "pipe",
      });
      children.push(child);
      errors.push(new Response(child.stderr).text());
      const reader = child.stdout.getReader();
      const timeout = setTimeout(() => child.kill("SIGKILL"), 5000);
      try {
        const first = await reader.read();
        return v.parse(
          v.pipe(v.string(), v.trim(), v.regex(/^\d+$/), v.transform(Number)),
          new TextDecoder().decode(first.value),
        );
      } finally {
        clearTimeout(timeout);
        reader.releaseLock();
      }
    }
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`CREATE SCHEMA "${namespace}"`);
      await admin.query(`CREATE TABLE "${namespace}".counter (value integer NOT NULL)`);
      await admin.query(`INSERT INTO "${namespace}".counter VALUES (1)`);
      await admin.query("BEGIN");
      await installRevisionTracking(admin, namespace, metadataNamespace, ["counter"]);
      await admin.query("COMMIT");
      await admin.query(`GRANT USAGE ON SCHEMA "${namespace}" TO "${runtimeRole}"`);
      await admin.query(`GRANT SELECT ON "${namespace}".counter TO "${runtimeRole}"`);
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      const port = await start(0);
      const peerPort = await start(0);
      let tickets = 0;
      const connections = [port, peerPort].map((port) => {
        const transport = createRpcTransport({
          url: `http://127.0.0.1:${port}`,
          version: "a".repeat(64),
          getToken: async () => {
            tickets++;
            return "test";
          },
        });
        const session = createRpcQuerySession({
          link: transport.link,
          deployment: "lifecycle",
          version: "a".repeat(64),
          identity: { issuer: "test", subject: "alice" },
        });
        const client = createORPCClient<{
          read: Client<RpcCallContext, undefined, AsyncIteratorObject<number, void, void>, Error>;
        }>(session.link);
        const read = createRpcLiveMethod(client.read, session, ["read"]);
        return {
          transport,
          session,
          observer: new QueryObserver(session.queryClient, read({ retry: true, retryDelay: 50 })),
        };
      });
      const observations = connections.map(({ observer }) => {
        const first = Promise.withResolvers<void>();
        const recovered = Promise.withResolvers<void>();
        const values: number[] = [];
        const unsubscribe = observer.subscribe((snapshot) => {
          if (snapshot.status !== "success") return;
          const value = snapshot.data;
          values.push(value);
          if (value === 1) first.resolve();
          if (value === 2) recovered.resolve();
        });
        const recovery = recovered.promise.then(
          () => true,
          () => false,
        );
        return { first, recovered, recovery, values, unsubscribe };
      });
      const timeout = setTimeout(() => {
        for (const observation of observations) {
          observation.first.reject(new Error("Initial subscription timed out"));
          observation.recovered.reject(new Error("Restart recovery timed out"));
        }
      }, 10000);
      try {
        await Promise.all(observations.map((observation) => observation.first.promise));
        const original = children[0];
        if (!original) throw new Error("Missing API process");
        original.kill("SIGKILL");
        await original.exited;
        await admin.query(`UPDATE "${namespace}".counter SET value = 2`);
        expect(await start(port)).toBe(port);
        expect(await Promise.all(observations.map((observation) => observation.recovery))).toEqual([true, true]);
        for (const { values } of observations) {
          expect(values[0]).toBe(1);
          expect(values.at(-1)).toBe(2);
        }
        expect(tickets).toBeGreaterThanOrEqual(3);
      } finally {
        clearTimeout(timeout);
        for (const observation of observations) observation.unsubscribe();
        for (const connection of connections) {
          connection.session.dispose();
          connection.transport.dispose();
        }
      }
    } finally {
      for (const child of children) child.kill("SIGKILL");
      await Promise.all(children.map((child) => child.exited));
      const diagnostics = await Promise.all(errors);
      await admin.query("ROLLBACK");
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
      expect(
        diagnostics.map((value) => value.replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[redacted database URL]")),
      ).toEqual(diagnostics.map(() => ""));
    }
  },
  20000,
);
