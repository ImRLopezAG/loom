import assert from "node:assert/strict";
import { call } from "@orpc/server";
import { Context } from "effect";
import type { AnyRelations } from "drizzle-orm";
import {
  bindRpcDatabaseProcedure,
  connectDatabase,
  Invocation,
  prepareApplicationEnvironment,
  type RpcRuntimeOptions,
} from "kello/server";

/** Executes the actual generated procedure without metadata bootstrap or provider administration. */
export async function exerciseNeonGeneratedRpc(
  options: Pick<RpcRuntimeOptions<AnyRelations>, "application" | "schema" | "relations" | "procedures">,
  connectionString: string,
  selection: "selected" | "empty" | "unsupported",
  placement: string,
): Promise<void> {
  assert(options.application);
  const environment = await prepareApplicationEnvironment(options.application, {});
  const connection = await connectDatabase({ schema: options.schema, relations: options.relations, connectionString });
  try {
    const entry = options.procedures.find((entry) => entry.path.join(".") === "cpu.describe");
    assert(entry);
    const bound = bindRpcDatabaseProcedure(entry.procedure, {
      connection,
      replay: { deployment: "neon-consumer", metadataNamespace: "loom_neon_consumer" },
      authorize: async () => {},
    });
    const invocation = { requestId: "cold-neon", identity: null, signal: new AbortController().signal };
    const actual = await environment.run(() =>
      call(bound, undefined, {
        context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
        path: [...entry.path],
      }),
    );
    if (selection === "selected")
      assert.deepEqual(actual, {
        sql: `select "${placement.replaceAll('"', '""')}"."pg_cluster_size"() from (values (1)) fixture(n)`,
        params: [],
        version: "1.25",
        schema: placement,
        effectSame: true,
      });
    else assert.deepEqual(actual, { selection, effectSame: true });
  } finally {
    await connection.close();
  }
}
