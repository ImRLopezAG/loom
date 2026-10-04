import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { nullableCodec, textCodec } from "../codecs";
import { jsonbCodec } from "../native-json-codecs";
import { uuidCodec } from "../native-uuid-codec";
import { createSqlFunction, statefulSqlMember } from "../sql";

const digest = "623c651ce14c1a66283624660e7588f073e56e92628ba73878a47c50150350d8";
const authSchema = "auth";
function sessionWrite<const Member extends string>(member: Member) {
  // SAFETY: statefulSqlMember returns these two fields unchanged; the generic retains the exact member literal.
  return statefulSqlMember(member, "session") as Readonly<{ member: Member; authority: "session" }>;
}

/** Claim readers are session-observable SQL. JWK writes stay in dedicated-session tooling and never grant Kello identity. */
export function createPgSessionJwt_0_5_0<
  const Descriptor extends ExtensionDescriptor<"pg_session_jwt", { version: "0.5.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pg_session_jwt" ||
    descriptor.version !== "0.5.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("pg_session_jwt 0.5.0 requires its exact verified contract");
  const base = { schema: authSchema, dependencies: [], observability: "session", authority: "query" } as const;
  const jwt = createSqlFunction({
    ...base,
    name: "jwt",
    member: "routine:auth.jwt()",
    arguments: [] as const,
    result: jsonbCodec,
  });
  const session = createSqlFunction({
    ...base,
    name: "session",
    member: "routine:auth.session()",
    arguments: [] as const,
    result: jsonbCodec,
  });
  const userId = createSqlFunction({
    ...base,
    name: "user_id",
    member: "routine:auth.user_id()",
    arguments: [] as const,
    result: nullableCodec(textCodec),
  });
  const uid = createSqlFunction({
    ...base,
    name: "uid",
    member: "routine:auth.uid()",
    arguments: [] as const,
    result: nullableCodec(uuidCodec),
  });
  const organization = createSqlFunction({
    ...base,
    name: "organization",
    member: "routine:auth.organization()",
    arguments: [] as const,
    result: nullableCodec(jsonbCodec),
  });
  const organizationId = createSqlFunction({
    ...base,
    name: "organization_id",
    member: "routine:auth.organization_id()",
    arguments: [] as const,
    result: nullableCodec(uuidCodec),
  });
  return bindExtension(descriptor, {
    jwt,
    session,
    userId,
    uid,
    organization,
    organizationId,
    init: sessionWrite("routine:auth.init()"),
    jwtSessionInit: sessionWrite("routine:auth.jwt_session_init(pg_catalog.text)"),
    identity: Object.freeze({
      loomInvocation: false,
      verification: "jwk-when-configured-otherwise-claims-only",
      organization: "neon-auth-o-claim",
    } as const),
    sql: Object.freeze({
      functions: Object.freeze({
        jwt,
        session,
        user_id: userId,
        uid,
        organization,
        organization_id: organizationId,
      }),
      operators: Object.freeze({}),
    }),
  });
}
