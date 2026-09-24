import "@orpc/experimental-effect/extensions/effect";
import { defineMeta, os, ORPCError, ValidationError } from "@orpc/server";
import { reconcileORPCError } from "@orpc/contract";
import type { WithEffectContext } from "@orpc/experimental-effect";
import { Cause, Effect } from "effect";
import type { SchemaDefinition } from "../../schema/define-schema";
import type { InvocationContext } from "../auth/context";
import type { Invocation } from "../effect/runtime";
import { serializeRpcValue, rpcValue } from "./serialization";
import * as v from "valibot";
import type { Id } from "../../schema/fields";

export type ClientMode = "finite" | "live" | "mutation";
export const [clientMode, getClientMode] = defineMeta("loom.clientMode", (incoming: ClientMode) => incoming);

export interface ProcedureContext extends InvocationContext, WithEffectContext<Invocation> {}

/** Generated bindings configure this native builder once per project. Database
 * capabilities are supplied separately by transaction middleware. */
export function createProjectProcedures<
  Schema extends SchemaDefinition & {
    readonly validators: object;
    readonly id: (table: never) => v.GenericSchema<string, Id<string>>;
  },
>(schema: Schema) {
  const bindings: ProjectBindings<Schema> = Object.freeze({
    tables: schema.tables,
    validators: Object.freeze({ tables: schema.validators, id: schema.id }),
  });
  const procedure = os
    .$context<ProcedureContext>()
    .meta(clientMode("mutation"))
    .use(async ({ next, procedure }) => {
      try {
        const result = await next();
        serializeRpcValue(v.parse(rpcValue, result.output));
        return result;
      } catch (cause) {
        if (cause instanceof ORPCError) {
          if (cause.cause instanceof ValidationError && cause.code === "BAD_REQUEST") {
            throw new ORPCError("BAD_REQUEST", { message: "Invalid input" });
          }
          const declared = await reconcileORPCError(procedure["~orpc"].errorMap, cause);
          if (declared.defined) throw declared;
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" });
      }
    })
    .use(({ next }) => next({ context: { ...bindings, "effect/wrap": redactDefects } }));
  return Object.freeze({ procedure });
}

interface ProjectBindings<
  Schema extends SchemaDefinition & {
    readonly validators: object;
    readonly id: (table: never) => v.GenericSchema<string, Id<string>>;
  },
> {
  readonly tables: Schema["tables"];
  readonly validators: { readonly tables: Schema["validators"]; readonly id: Schema["id"] };
}

function redactDefects<A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> {
  return Effect.catchCause(effect, (cause) =>
    Cause.hasDies(cause) ? Effect.die(new Error("Procedure defect")) : Effect.failCause(cause),
  );
}
