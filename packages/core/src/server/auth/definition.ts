import * as v from "valibot";
import { FunctionAccessDenied } from "../dispatch";
import type { FunctionAuthorization } from "../dispatch";
import { createAuthenticationConfiguration } from "./configuration";
import type { AuthConfigInput } from "./config";

export interface AuthOptions {
  readonly authorize: (context: FunctionAuthorization) => void | Promise<void>;
  readonly allowAnonymous?: boolean;
}
export interface AuthDefinition {
  readonly authorize: (context: FunctionAuthorization) => Promise<void>;
  readonly allowAnonymous: boolean;
}
const definitions = new WeakSet<object>();

export function isAuthDefinition(value: unknown): value is AuthDefinition {
  return value instanceof Object && definitions.has(value);
}

/** Explicit server policy; returning permits the call, throwing denies it. */
export function defineAuth(
  options: AuthOptions = {
    authorize: () => {
      throw new FunctionAccessDenied();
    },
  },
): AuthDefinition {
  const authorize = options.authorize;
  v.parse(v.function(), authorize);
  const allowAnonymous = v.parse(v.optional(v.boolean(), false), options.allowAnonymous);
  const definition = Object.freeze({
    allowAnonymous,
    async authorize(context: FunctionAuthorization): Promise<void> {
      await authorize(context);
    },
  });
  definitions.add(definition);
  return definition;
}

const deny = defineAuth();

/** Construction is offline; a trusted remote key set is fetched only during token verification. */
export function createAuthentication(input: AuthConfigInput, definition: AuthDefinition = deny) {
  if (!definitions.has(definition)) throw new Error("Expected defineAuth's result");
  const configuration = createAuthenticationConfiguration(input);
  return Object.freeze({
    ...configuration,
    authorize: definition.authorize,
    allowAnonymous: definition.allowAnonymous,
  });
}
