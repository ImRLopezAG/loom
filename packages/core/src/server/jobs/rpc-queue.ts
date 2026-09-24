import { call, Procedure } from "@orpc/server";
import type { AnyProcedure } from "@orpc/server";
import * as v from "valibot";
import { createDurableJobQueue } from "./durable-queue";
import type { DurableQueueOptions } from "./durable-queue";
import { rpcJobCall, decodeRpcJobInput } from "./rpc-contracts";
import type { RpcJobCall } from "./rpc-contracts";

export interface InternalProcedureEntry {
  readonly path: readonly string[];
  readonly procedure: AnyProcedure;
}

/** Construct only from the generated internal graph, never from client input. */
export function createRpcJobQueue(
  options: Omit<DurableQueueOptions<RpcJobCall>, "parseCall" | "prepare"> & {
    readonly internal: readonly InternalProcedureEntry[];
  },
) {
  const procedures = new Map<string, AnyProcedure>();
  for (const entry of options.internal) {
    const path = v.parse(rpcJobCall.entries.path, entry.path);
    const key = JSON.stringify(path);
    if (procedures.has(key)) throw new Error("Duplicate internal procedure path");
    const definition = entry.procedure["~orpc"];
    if (definition.disableInputValidation) throw new Error("Scheduled procedures require input validation");
    // Native oRPC owns schema sequencing and transformations. This validation-only
    // procedure cannot run application middleware, acquire a database, or invoke a handler.
    procedures.set(
      key,
      new Procedure({
        ...definition,
        orderedMiddlewares: [],
        outputSchemas: [],
        handler: () => undefined,
      }),
    );
  }
  return createDurableJobQueue({
    ...options,
    parseCall: (input) => v.parse(rpcJobCall, input),
    prepare: async (envelope) => {
      const procedure = procedures.get(JSON.stringify(envelope.path));
      if (!procedure) throw new Error("Internal job procedure not found");
      await call(procedure, decodeRpcJobInput(envelope), { context: {}, path: envelope.path });
    },
  });
}
