import type { SQL } from "drizzle-orm";
import { expectTypeOf } from "vite-plus/test";
import { createPgSessionJwt_0_5_0 } from "../../../apps/loom/src/core/extensions/adapters/pg_session_jwt";
import type { JsonbDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import {
  withPgSessionJwt,
  type JwtSessionInitRequest,
  type SessionJwtEffect,
  type SessionJwtObservation,
  type SessionJwtSession,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_session_jwt";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_session_jwt.json";

const descriptor = {
  name: "pg_session_jwt",
  version: "0.5.0",
  schema: "extensions",
  apiSupport: { status: "verified", digest: source.digest },
} as const;
const api = createPgSessionJwt_0_5_0(descriptor);
const session: SQL<JsonbDocument> = api.session();
const jwt: SQL<JsonbDocument> = api.jwt();
const userId: SQL<string | null> = api.userId();
const uid: SQL<string | null> = api.uid();
const organization: SQL<JsonbDocument | null> = api.organization();
const organizationId: SQL<string | null> = api.organizationId();
const schema: "extensions" = api.schema;
const version: "0.5.0" = api.version;
const loomInvocation: false = api.identity.loomInvocation;
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;
type Assert<Condition extends true> = Condition;
export type SessionJwtResultsAreExact = [
  Assert<Equal<typeof api.init, { readonly member: "routine:auth.init()"; readonly authority: "session" }>>,
  Assert<
    Equal<
      typeof api.jwtSessionInit,
      { readonly member: "routine:auth.jwt_session_init(pg_catalog.text)"; readonly authority: "session" }
    >
  >,
];
// @ts-expect-error Session writes are not application SQL functions.
api.sql.functions.init();
// @ts-expect-error Session writes are not application SQL functions.
api.sql.functions.jwt_session_init("token");
// @ts-expect-error JWT claims do not become Kello identity.
const identity: true = api.identity.loomInvocation;
// @ts-expect-error Readers have no caller-selected result generic.
api.session<string>();
// @ts-expect-error Exact factory only accepts 0.5.0.
createPgSessionJwt_0_5_0({ ...descriptor, version: "0.4.0" });
// @ts-expect-error Session() is jsonb, including JSON null, not SQL NULL.
const missingSession: SQL<null> = api.session();
void [
  session,
  jwt,
  userId,
  uid,
  organization,
  organizationId,
  schema,
  version,
  loomInvocation,
  identity,
  missingSession,
];
function sessionJwtTypeContract(): void {
  const request: JwtSessionInitRequest = { jwt: "header.payload.signature" };
  // @ts-expect-error JWT text cannot be null.
  const empty: JwtSessionInitRequest = { jwt: null };
  void empty;
  void withPgSessionJwt("postgresql://operator/fixture", descriptor, async (owned) => {
    expectTypeOf(owned).toEqualTypeOf<SessionJwtSession>();
    const initialized = await owned.init();
    expectTypeOf(initialized.loomInvocation).toEqualTypeOf<false>();
    const verified = await owned.jwtSessionInit(request);
    expectTypeOf(verified.verification).toEqualTypeOf<"jwk">();
    const observed = await owned.observe();
    expectTypeOf(observed).toEqualTypeOf<SessionJwtObservation>();
    expectTypeOf(observed.jwt).toEqualTypeOf<"set" | "unset">();
    expectTypeOf(observed.session).toEqualTypeOf<JsonbDocument>();
    // @ts-expect-error Observation never returns the bound token text.
    void observed.token;
    // @ts-expect-error No raw operator client crosses into callback.
    void owned.client;
    return verified;
  });
}
void sessionJwtTypeContract;
export type SessionJwtEffectsAreTruthful = [
  Assert<
    Equal<
      Extract<SessionJwtEffect, { operation: "init" }>,
      { readonly operation: "init"; readonly state: "acknowledged" | "unknown"; readonly scope: "backend" }
    >
  >,
  Assert<
    Equal<
      Extract<SessionJwtEffect, { operation: "jwt-session-init" }>,
      {
        readonly operation: "jwt-session-init";
        readonly state: "acknowledged" | "unknown";
        readonly scope: "transactional-guc-and-backend";
      }
    >
  >,
  Assert<
    Equal<
      Extract<SessionJwtEffect, { operation: "reset" }>,
      | { readonly operation: "reset"; readonly state: "unknown"; readonly scope: "session-guc" }
      | {
          readonly operation: "reset";
          readonly state: "acknowledged";
          readonly scope: "session-guc";
          readonly observed: SessionJwtObservation;
        }
    >
  >,
];
