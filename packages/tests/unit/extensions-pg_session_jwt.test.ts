import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  pgSessionJwtUnitProofCases,
  pgSessionJwtMemberProofs,
  pgSessionJwtDatabaseProofCases,
} from "../../e2e/fixtures/pg_session_jwt-proof-cases";
import { expect } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import { createPgSessionJwt_0_5_0 } from "../../../apps/loom/src/core/extensions/adapters/pg_session_jwt";
import { jsonbDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import {
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";
import { pgSessionJwtAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_session_jwt";
import {
  jwtSessionInitRequestValidator,
  withPgSessionJwt,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_session_jwt";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { pgSessionJwtProofFamily } from "../../e2e/fixtures/pg_session_jwt-proof-cases";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_session_jwt.json";

const descriptor = {
  name: "pg_session_jwt",
  version: "0.5.0",
  schema: "jwt 日本",
  apiSupport: { status: "verified", digest: source.digest },
} as const;
const dialect = extensionSqlDialect(nodePgCodecs);
const expressionDecoder = v.object({ decoder: v.object({ mapFromDriverValue: v.function() }) });

extensionProofUnitTest(pgSessionJwtUnitProofCases[0]!, () => {
  const binding = createPgSessionJwt_0_5_0(descriptor);
  const readers = [
    binding.jwt(),
    binding.session(),
    binding.userId(),
    binding.uid(),
    binding.organization(),
    binding.organizationId(),
  ];
  expect(readers.map((expression) => extensionExpressionContract(expression)?.member)).toEqual([
    "routine:auth.jwt()",
    "routine:auth.session()",
    "routine:auth.user_id()",
    "routine:auth.uid()",
    "routine:auth.organization()",
    "routine:auth.organization_id()",
  ]);
  expect(readers.map((expression) => extensionExpressionContract(expression)?.observability)).toEqual([
    "session",
    "session",
    "session",
    "session",
    "session",
    "session",
  ]);
  expect(Object.keys(binding.sql.functions)).toEqual([
    "jwt",
    "session",
    "user_id",
    "uid",
    "organization",
    "organization_id",
  ]);
  expect(Object.keys(binding.sql.operators)).toEqual([]);
  expect(binding.sql.functions).not.toHaveProperty("init");
  expect(binding.sql.functions).not.toHaveProperty("jwt_session_init");
  expect(binding.init).toEqual({ member: "routine:auth.init()", authority: "session" });
  expect(binding.jwtSessionInit).toEqual({
    member: "routine:auth.jwt_session_init(pg_catalog.text)",
    authority: "session",
  });
  expect(dialect.sqlToQuery(binding.jwt()).sql).toContain('"auth"."jwt"');
  expect(dialect.sqlToQuery(binding.jwt()).sql).not.toContain("jwt 日本");
  const hostile = "'); drop table sessions;--";
  expect(v.parse(jwtSessionInitRequestValidator, { jwt: hostile })).toEqual({ jwt: hostile });
  expect(() => v.parse(jwtSessionInitRequestValidator, { jwt: "" })).toThrow();
  expect(() => v.parse(jwtSessionInitRequestValidator, { jwt: "token\0" })).toThrow();
});

extensionProofUnitTest(pgSessionJwtUnitProofCases[1]!, async () => {
  expect(pgSessionJwtAnnotations.map((annotation) => annotation.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(pgSessionJwtMemberProofs.map((proof) => proof.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  const claimed = pgSessionJwtDatabaseProofCases.flatMap((definition) =>
    definition.claims.map((claim) => claim.member),
  );
  expect(claimed.sort()).toEqual(source.contract.members.map((member) => member.id).sort());
  const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, source));
  expect(manifest.digest).toBe("623c651ce14c1a66283624660e7588f073e56e92628ba73878a47c50150350d8");
  expect(manifest.digest).toBe(pgSessionJwtProofFamily.manifestDigest);
  expect(() =>
    validateExtensionManifest(v.parse(extensionManifestValidator, { ...source, digest: "0".repeat(64) })),
  ).toThrow(/digest mismatch: pg_session_jwt/);
  const semantics = new Map<string, unknown>(
    pgSessionJwtAnnotations.map((annotation) => [annotation.id, annotation.semantics]),
  );
  for (const id of ["routine:auth.jwt()", "routine:auth.session()"])
    expect(semantics.get(id)).toMatchObject({
      claimsOnly: expect.stringMatching(/malformed JSON.*JSON null/),
      jwk: expect.stringMatching(/raises ERROR/),
    });
  expect(semantics.get("routine:auth.user_id()")).toMatchObject({
    claimsOnly: expect.stringMatching(/non-string sub.*SQL NULL/),
    jwk: expect.stringMatching(/non-string sub raises ERROR/),
  });
  expect(semantics.get("routine:auth.uid()")).toMatchObject({
    jwk: expect.stringMatching(/non-UUID string sub returns SQL NULL/),
  });
  expect(semantics.get("routine:auth.jwt_session_init(pg_catalog.text)")).toMatchObject({
    replay: expect.stringMatching(/identical token.*cache/),
  });
  const binding = createPgSessionJwt_0_5_0(descriptor);
  expect(binding.identity).toEqual({
    loomInvocation: false,
    verification: "jwk-when-configured-otherwise-claims-only",
    organization: "neon-auth-o-claim",
  });
  expect(() =>
    createPgSessionJwt_0_5_0({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } }),
  ).toThrow(/exact verified contract/);
  await expect(
    withPgSessionJwt(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});

extensionProofUnitTest(pgSessionJwtUnitProofCases[2]!, () => {
  const binding = createPgSessionJwt_0_5_0(descriptor);
  const sessionDecoder = v.parse(expressionDecoder, binding.session()).decoder;
  expect(sessionDecoder.mapFromDriverValue("null")).toEqual(jsonbDocument("null"));
  expect(sessionDecoder.mapFromDriverValue('{"sub":"user-123"}')).toEqual(jsonbDocument('{"sub":"user-123"}'));
  expect(() => sessionDecoder.mapFromDriverValue(null)).toThrow();
  const organizationDecoder = v.parse(expressionDecoder, binding.organization()).decoder;
  expect(organizationDecoder.mapFromDriverValue(null)).toBeNull();
  expect(organizationDecoder.mapFromDriverValue('{"id":"11111111-1111-4111-8111-111111111111"}')).toEqual(
    jsonbDocument('{"id":"11111111-1111-4111-8111-111111111111"}'),
  );
  const userDecoder = v.parse(expressionDecoder, binding.userId()).decoder;
  expect(userDecoder.mapFromDriverValue(null)).toBeNull();
  expect(userDecoder.mapFromDriverValue("user-123")).toBe("user-123");
  const uidDecoder = v.parse(expressionDecoder, binding.uid()).decoder;
  expect(uidDecoder.mapFromDriverValue(null)).toBeNull();
  expect(uidDecoder.mapFromDriverValue("550E8400-E29B-41D4-A716-446655440000")).toBe(
    "550e8400-e29b-41d4-a716-446655440000",
  );
  const observed: { member: string; observability: string }[] = [];
  const query = dialect.sqlToQuery(sql`select ${binding.userId()}, ${binding.session()}`);
  withExtensionSqlExecution({ check: (contract) => observed.push(contract) }, () => checkCompiledExtensionQuery(query));
  expect(observed).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ member: "routine:auth.user_id()", observability: "session" }),
      expect.objectContaining({ member: "routine:auth.session()", observability: "session" }),
    ]),
  );
});
