import * as v from "valibot";
import type pg from "pg";
import { createPgSessionJwt_0_5_0 } from "../../../core/extensions/adapters/pg_session_jwt";
import { jsonbDocument, type JsonbDocument } from "../../../core/extensions/native-json-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { ExtensionOperationError, withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/pg_session_jwt.json";

const jwtText = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
export const jwtSessionInitRequestValidator = v.strictObject({ jwt: jwtText });
export interface JwtSessionInitRequest {
  readonly jwt: string;
}
/** Same-backend observation. The bound token text is never returned. */
export interface SessionJwtObservation {
  readonly jwt: "set" | "unset";
  readonly session: JsonbDocument;
}
/**
 * init caches the startup JWK for the backend lifetime. jwt_session_init issues a transactional session-level
 * SET of pg_session_jwt.jwt and advances the backend-local jti high-water mark and payload cache, which neither
 * ROLLBACK nor RESET reverts. Both backend scopes end only when the dedicated backend closes or is terminated.
 */
export type SessionJwtEffect =
  | { readonly operation: "init"; readonly state: "acknowledged" | "unknown"; readonly scope: "backend" }
  | {
      readonly operation: "jwt-session-init";
      readonly state: "acknowledged" | "unknown";
      readonly scope: "transactional-guc-and-backend";
    }
  | { readonly operation: "reset"; readonly state: "unknown"; readonly scope: "session-guc" }
  | {
      readonly operation: "reset";
      readonly state: "acknowledged";
      readonly scope: "session-guc";
      readonly observed: SessionJwtObservation;
    };
export class SessionJwtOperationError extends ExtensionOperationError {
  constructor(
    failure: ExtensionOperationError,
    readonly effects: readonly SessionJwtEffect[],
  ) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "SessionJwtOperationError";
  }
}
export interface SessionJwtSession {
  readonly init: () => Promise<{ readonly verification: "jwk"; readonly loomInvocation: false }>;
  readonly jwtSessionInit: (
    request: JwtSessionInitRequest,
  ) => Promise<{ readonly verification: "jwk"; readonly loomInvocation: false }>;
  readonly observe: () => Promise<SessionJwtObservation>;
}

/** JWK writes require a dedicated connection whose startup options already carry pg_session_jwt.jwk. */
export async function withPgSessionJwt<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"pg_session_jwt", { version: "0.5.0"; schema: string }>,
  callback: (session: SessionJwtSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{
  readonly completion: "committed";
  readonly value: Result;
  readonly effects: readonly SessionJwtEffect[];
}> {
  createPgSessionJwt_0_5_0(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const effects: SessionJwtEffect[] = [];
  try {
    const result = await withExtensionOperation(
      directOperatorUrl,
      async (context) => {
        await acquireExtensionLock(context.client, signal);
        await verifyExtensionApiContracts(context.client, [requirement]);
        async function effect<Value>(
          operation: "init" | "jwt-session-init",
          work: () => Promise<Value>,
        ): Promise<Value> {
          const pending: SessionJwtEffect =
            operation === "init"
              ? { operation, state: "unknown", scope: "backend" }
              : { operation, state: "unknown", scope: "transactional-guc-and-backend" };
          const index = effects.push(pending) - 1;
          const value = await work();
          effects[index] = { ...pending, state: "acknowledged" };
          return value;
        }
        return Object.freeze({
          init: () =>
            context.run(() =>
              effect("init", async () => {
                await context.client.query('SELECT "auth"."init"()');
                return { verification: "jwk", loomInvocation: false } as const;
              }),
            ),
          jwtSessionInit: (request: JwtSessionInitRequest) =>
            context.run(async () => {
              const checked = v.parse(jwtSessionInitRequestValidator, request);
              return effect("jwt-session-init", async () => {
                await context.client.query('SELECT "auth"."jwt_session_init"($1::pg_catalog.text)', [checked.jwt]);
                return { verification: "jwk", loomInvocation: false } as const;
              });
            }),
          observe: () => context.run(() => observeSessionJwt(context.client)),
        } satisfies SessionJwtSession);
      },
      callback,
      signal,
      async (context) => {
        await effectReset(context.client, effects);
      },
    );
    return { ...result, effects: Object.freeze(effects.map((effect) => Object.freeze(effect))) };
  } catch (cause) {
    if (cause instanceof ExtensionOperationError)
      throw new SessionJwtOperationError(cause, Object.freeze(effects.map((effect) => Object.freeze(effect))));
    throw cause;
  }
}

const observationValidator = v.strictObject({ jwt: v.boolean(), session: v.string() });
async function observeSessionJwt(client: Pick<pg.Client, "query">): Promise<SessionJwtObservation> {
  // A separate statement after any SET: the STABLE readers never share a snapshot with a volatile writer.
  const result = await client.query(
    `SELECT COALESCE(pg_catalog.current_setting('pg_session_jwt.jwt', true), '') <> '' AS jwt, "auth"."session"()::pg_catalog.text AS session`,
  );
  const row = v.parse(observationValidator, result.rows[0]);
  return Object.freeze({ jwt: row.jwt ? "set" : "unset", session: jsonbDocument(row.session) });
}

/** RESET clears only the session GUC; the same backend is then observed before it closes. */
async function effectReset(client: Pick<pg.Client, "query">, effects: SessionJwtEffect[]): Promise<void> {
  const index = effects.push({ operation: "reset", state: "unknown", scope: "session-guc" }) - 1;
  await client.query("RESET pg_session_jwt.jwt");
  const observed = await observeSessionJwt(client);
  effects[index] = { operation: "reset", state: "acknowledged", scope: "session-guc", observed };
}
