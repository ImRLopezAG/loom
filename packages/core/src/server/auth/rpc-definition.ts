import { ORPCError } from "@orpc/server";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import type { InvocationContext } from "./context";
import type { DatabasePolicy } from "../rpc/database";
import type { RpcValue } from "../rpc/serialization";
import type { AuthConfigInput } from "./config";
import { createAuthentication } from "./definition";

export interface RpcAuthorization extends InvocationContext {
  readonly path: readonly string[];
  readonly input: RpcValue;
  readonly databasePolicy?: DatabasePolicy;
  readonly db?: NodePgDatabase;
}
export interface RpcAuthDefinition {
  readonly authorize: (context: RpcAuthorization) => Promise<void>;
  readonly allowAnonymous: boolean;
}
const definitions = new WeakSet<object>();
export function isRpcAuthDefinition(value: unknown): value is RpcAuthDefinition {
  return value instanceof Object && definitions.has(value);
}

/** Returning permits the invocation. Database policies authorize inside every
 * transaction attempt, including receipt replay; no database authority is inferred. */
export function defineRpcAuth(
  options: {
    readonly authorize: (context: RpcAuthorization) => void | Promise<void>;
    readonly allowAnonymous?: boolean;
  } = {
    authorize: () => {
      throw new ORPCError("FORBIDDEN");
    },
  },
): RpcAuthDefinition {
  const authorize = v.parse(v.function(), options.authorize);
  const allowAnonymous = v.parse(v.optional(v.boolean(), false), options.allowAnonymous);
  const definition = Object.freeze({
    allowAnonymous,
    async authorize(context: RpcAuthorization): Promise<void> {
      await authorize(context);
    },
  });
  definitions.add(definition);
  return definition;
}
const deny = defineRpcAuth();
export function createRpcAuthentication(input: AuthConfigInput, definition: RpcAuthDefinition = deny) {
  if (!definitions.has(definition)) throw new Error("Expected defineRpcAuth's result");
  const { verify, origins } = createAuthentication(input);
  return Object.freeze({ verify, origins, authorize: definition.authorize, allowAnonymous: definition.allowAnonymous });
}
