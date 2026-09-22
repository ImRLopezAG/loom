import { expect, test } from "bun:test";
import { channel } from "node:diagnostics_channel";
import {
  action,
  connectDatabase,
  createDispatcher,
  defineSchema,
  FunctionAccessDenied,
  internalQuery,
  mutation,
  query,
} from "@loom/core/server";
import { defineRelations, sql } from "drizzle-orm";
import * as v from "valibot";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "dispatch checks visibility, versions and authorization and gives actions no database",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString });
    const version = "a".repeat(64);
    const diagnostics: string[] = [];
    const failureChannel = channel("loom.function.failure");
    const onFailure: Parameters<typeof failureChannel.subscribe>[0] = (event) => {
      diagnostics.push(JSON.stringify(event));
    };
    failureChannel.subscribe(onFailure);
    let actionCalls = 0;
    let authorizations = 0;
    const read = query({
      args: v.null(),
      returns: v.string(),
      handler: async (context) => {
        const result = await context.db.execute<{ value: string }>(
          sql`SELECT current_setting('transaction_read_only') AS value`,
        );
        return result.rows[0]?.value ?? "missing";
      },
    });
    const write = mutation({
      args: v.null(),
      returns: v.string(),
      handler: async (context) => {
        const result = await context.db.execute<{ value: string }>(
          sql`SELECT current_setting('transaction_read_only') AS value`,
        );
        return result.rows[0]?.value ?? "missing";
      },
    });
    const external = action({
      args: v.null(),
      returns: v.string(),
      handler: (context) => {
        actionCalls++;
        expect(Object.hasOwn(context, "db")).toBe(false);
        return context.requestId;
      },
    });
    const fails = action({
      args: v.null(),
      returns: v.null(),
      handler: () => {
        actionCalls++;
        throw Object.assign(new Error("secret-password"), { code: "40001" });
      },
    });
    const secret = internalQuery({ args: v.null(), returns: v.string(), handler: () => "private" });
    const dispatcher = createDispatcher({
      connection,
      version,
      functions: {
        "tasks:read": read,
        "tasks:write": write,
        "tasks:external": external,
        "tasks:fails": fails,
        "tasks:secret": secret,
      },
      authorize: async (context) => {
        authorizations++;
        if (context.identity?.subject === "blocked") throw new FunctionAccessDenied();
      },
    });
    const call = { name: "tasks:read", kind: "query" as const, version, args: null };
    try {
      expect(await dispatcher.public(call, null)).toMatchObject({ ok: true, value: "on" });
      expect(await dispatcher.public({ ...call, name: "tasks:write", kind: "mutation" }, null)).toMatchObject({
        ok: true,
        value: "off",
      });
      expect(await dispatcher.public({ ...call, name: "tasks:secret" }, null)).toMatchObject({
        ok: false,
        error: { code: "NOT_FOUND" },
      });
      expect(await dispatcher.internal({ ...call, name: "tasks:secret" }, null)).toMatchObject({
        ok: true,
        value: "private",
      });
      expect(await dispatcher.public({ ...call, version: "b".repeat(64) }, null)).toMatchObject({
        ok: false,
        error: { code: "VERSION_MISMATCH" },
      });
      expect(await dispatcher.public({ ...call, kind: "mutation" }, null)).toMatchObject({
        ok: false,
        error: { code: "NOT_FOUND" },
      });
      expect(await dispatcher.public({ ...call, args: 42 }, null)).toMatchObject({
        ok: false,
        error: { code: "INVALID_ARGUMENTS" },
      });
      expect(await dispatcher.public(call, { issuer: "test", subject: "blocked" })).toMatchObject({
        ok: false,
        error: { code: "FORBIDDEN" },
      });
      const result = await dispatcher.public({ ...call, name: "tasks:external", kind: "action" }, null);
      expect(result).toMatchObject({ ok: true, value: result.requestId });
      const failed = await dispatcher.public({ ...call, name: "tasks:fails", kind: "action" }, null);
      expect(failed).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
      expect(JSON.stringify(failed)).not.toContain("secret-password");
      expect(diagnostics.join("\n")).not.toContain("secret-password");
      expect(diagnostics.some((event) => event.includes(failed.requestId))).toBe(true);
      expect(actionCalls).toBe(2);
      expect(authorizations).toBe(6);
      const cancelled = new AbortController();
      cancelled.abort();
      expect(await dispatcher.public(call, null, cancelled.signal)).toMatchObject({
        ok: false,
        error: { code: "CANCELLED" },
      });
      expect(authorizations).toBe(6);
      const duringAuthorization = new AbortController();
      let cancelledHandlerCalls = 0;
      const cancellingDispatcher = createDispatcher({
        connection,
        version,
        functions: {
          "tasks:cancel": mutation({
            args: v.null(),
            returns: v.null(),
            handler: () => {
              cancelledHandlerCalls++;
              return null;
            },
          }),
        },
        authorize: async () => {
          duringAuthorization.abort();
        },
      });
      expect(
        await cancellingDispatcher.public(
          { ...call, name: "tasks:cancel", kind: "mutation" },
          null,
          duringAuthorization.signal,
        ),
      ).toMatchObject({ ok: false, error: { code: "CANCELLED" } });
      expect(cancelledHandlerCalls).toBe(0);
      expect(connection.pool.idleCount).toBe(connection.pool.totalCount);
    } finally {
      failureChannel.unsubscribe(onFailure);
      await connection.close();
    }
  },
);
