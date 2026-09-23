import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { connectDatabase, createConnectionTickets, defineSchema } from "@loom/core/server";
import { bootstrapDatabase } from "@loom/tooling";
import { defineRelations } from "drizzle-orm";
import pg from "pg";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "connection tickets are durable, scoped, expiring and atomically single use",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_tickets_${suffix}`;
    const runtimeRole = `loom_runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      const address = new URL(connectionString);
      address.username = runtimeRole;
      address.password = "loom-test-only";
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: address.href,
      });
      try {
        const options = {
          db: connection.db,
          metadataNamespace,
          namespace: "app",
          deployment: "preview-one",
          version: "a".repeat(64),
        };
        const tickets = createConnectionTickets(options);
        const origin = "https://app.example.test";
        const session = {
          identity: { issuer: "https://identity.example.test", subject: "alice", tenantId: "one" },
          expiresAt: Math.floor(Date.now() / 1000) + 600,
        };
        const beforeIssue = (await admin.query("SELECT extract(epoch FROM clock_timestamp())::float8 AS now")).rows[0]
          .now;
        const issued = await tickets.issue(session, origin);
        const afterIssue = (await admin.query("SELECT extract(epoch FROM clock_timestamp())::float8 AS now")).rows[0]
          .now;
        expect(issued.ticket).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(issued.expiresAt).toBeGreaterThanOrEqual(beforeIssue + 30);
        expect(issued.expiresAt).toBeLessThanOrEqual(afterIssue + 30);
        const stored = (await admin.query(`SELECT * FROM "${metadataNamespace}".connection_tickets`)).rows;
        expect(JSON.stringify(stored)).not.toContain(issued.ticket);
        expect(stored).toHaveLength(1);
        await assert.rejects(tickets.redeem(issued.ticket, "https://other.example.test"), /Authentication failed/);
        await assert.rejects(
          createConnectionTickets({ ...options, deployment: "preview-two" }).redeem(issued.ticket, origin),
          /Authentication failed/,
        );
        await assert.rejects(
          createConnectionTickets({ ...options, version: "b".repeat(64) }).redeem(issued.ticket, origin),
          /Authentication failed/,
        );
        await assert.rejects(
          createConnectionTickets({ ...options, namespace: "other" }).redeem(issued.ticket, origin),
          /Authentication failed/,
        );
        const restarted = createConnectionTickets(options);
        const attempts = await Promise.allSettled([
          tickets.redeem(issued.ticket, origin),
          restarted.redeem(issued.ticket, origin),
        ]);
        expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        expect(attempts.filter((result) => result.status === "rejected")).toHaveLength(1);
        const accepted = attempts.find((result) => result.status === "fulfilled");
        expect(accepted?.value).toEqual(session);
        await assert.rejects(restarted.redeem(issued.ticket, origin), /Authentication failed/);
        expect((await admin.query(`SELECT * FROM "${metadataNamespace}".connection_tickets`)).rows).toEqual([]);
        expect(
          (
            await admin.query(
              `SELECT namespace,deployment,version,extract(epoch FROM expires_at)::float8 AS expires FROM "${metadataNamespace}".client_sessions`,
            )
          ).rows,
        ).toEqual([
          { namespace: "app", deployment: "preview-one", version: options.version, expires: session.expiresAt },
        ]);
        const migrationTicket = await tickets.issue(session, origin);
        await admin.query("SELECT pg_advisory_lock(hashtextextended($1,0))", ["loom:migrations:app"]);
        try {
          await assert.rejects(tickets.redeem(migrationTicket.ticket, origin), /Authentication failed/);
        } finally {
          await admin.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", ["loom:migrations:app"]);
        }
        expect(await tickets.redeem(migrationTicket.ticket, origin)).toEqual(session);
        const admittedTicket = await tickets.issue(session, origin);
        const admitted = createConnectionTickets({
          ...options,
          assertActive: async () => {
            const lock = await admin.query<{ acquired: boolean }>(
              "SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS acquired",
              ["loom:migrations:app"],
            );
            assert.equal(lock.rows[0]?.acquired, false, "Migration must wait for admitted redemption");
          },
        });
        expect(await admitted.redeem(admittedTicket.ticket, origin)).toEqual(session);
        const retryTicket = await tickets.issue(session, origin);
        await admin.query(`REVOKE INSERT ON "${metadataNamespace}".client_sessions FROM "${runtimeRole}"`);
        try {
          await assert.rejects(tickets.redeem(retryTicket.ticket, origin));
        } finally {
          await admin.query(`GRANT INSERT ON "${metadataNamespace}".client_sessions TO "${runtimeRole}"`);
        }
        expect(await tickets.redeem(retryTicket.ticket, origin)).toEqual(session);
        await assert.rejects(
          connection.pool.query(`UPDATE "${metadataNamespace}".client_sessions SET expires_at = clock_timestamp()`),
          /permission denied/,
        );
        await assert.rejects(
          connection.pool.query(`DELETE FROM "${metadataNamespace}".client_sessions`),
          /permission denied/,
        );
        const shortSession = { ...session, expiresAt: Math.floor(Date.now() / 1000) + 5 };
        const limited = await tickets.issue(shortSession, origin);
        expect(limited.expiresAt).toBe(shortSession.expiresAt);
        await admin.query(
          `UPDATE "${metadataNamespace}".connection_tickets SET expires_at = clock_timestamp() - interval '1 second'`,
        );
        await assert.rejects(tickets.redeem(limited.ticket, origin), /Authentication failed/);
        await assert.rejects(tickets.issue({ ...session, expiresAt: 1 }, origin), /Authentication failed/);
        await assert.rejects(tickets.redeem("forged", origin), /Authentication failed/);
        await assert.rejects(tickets.issue(session, "null"));
        for (const lifetimeSeconds of [0, 61, 1.5])
          expect(() => createConnectionTickets({ ...options, lifetimeSeconds })).toThrow("ticket lifetime");
        expect(() => createConnectionTickets({ ...options, deployment: "" })).toThrow("deployment identity");
        expect(() => createConnectionTickets({ ...options, metadataNamespace: "public" })).toThrow(
          "metadata namespace",
        );
        const shortTickets = createConnectionTickets({ ...options, lifetimeSeconds: 1 });
        const blockedTicket = await shortTickets.issue(session, origin);
        await admin.query("BEGIN");
        try {
          await admin.query(`SELECT * FROM "${metadataNamespace}".connection_tickets FOR UPDATE`);
          const pending = shortTickets.redeem(blockedTicket.ticket, origin).then(
            () => "accepted",
            () => "rejected",
          );
          let waiting = false;
          for (let attempt = 0; attempt < 100; attempt++) {
            await admin.query("SELECT pg_stat_clear_snapshot()");
            const state = await admin.query<{ waiting: boolean }>(
              "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE usename = $1 AND wait_event_type = 'Lock') AS waiting",
              [runtimeRole],
            );
            if (state.rows[0]?.waiting) {
              waiting = true;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 5));
          }
          assert.equal(waiting, true, "Redemption must wait on the held row lock");
          await new Promise((resolve) =>
            setTimeout(resolve, Math.max(0, blockedTicket.expiresAt * 1000 - Date.now() + 30)),
          );
          await admin.query("COMMIT");
          expect(await pending).toBe("rejected");
        } finally {
          await admin.query("ROLLBACK");
        }
        await assert.rejects(
          connection.pool.query(`UPDATE "${metadataNamespace}".connection_tickets SET identity = '{}'::jsonb`),
          /permission denied/,
        );
        expect(connection.pool.idleCount).toBe(connection.pool.totalCount);
      } finally {
        await connection.close();
      }
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);
