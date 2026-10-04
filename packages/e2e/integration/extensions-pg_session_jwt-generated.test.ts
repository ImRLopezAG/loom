import { expect, test } from "bun:test";
import { pgSessionJwtApi, pgSessionJwtDescriptor } from "../fixtures/pg_session_jwt";
import { pgSessionJwtProofFamily } from "../fixtures/pg_session_jwt-proof-cases";
import { createPgSessionJwt_0_5_0 } from "../../../apps/loom/src/core/extensions/adapters/pg_session_jwt";

test("session JWT source factory characterization preserves reader and write contracts", () => {
  const binding = createPgSessionJwt_0_5_0(pgSessionJwtDescriptor);
  expect(binding.name).toBe(pgSessionJwtApi.name);
  expect({
    factory: "createPgSessionJwt_0_5_0",
    module: "kello/extensions/pg-session-jwt",
    name: binding.name,
    version: binding.version,
    digest: pgSessionJwtProofFamily.manifestDigest,
    readers: Object.keys(binding.sql.functions),
    writes: [binding.init.member, binding.jwtSessionInit.member],
    loomInvocation: binding.identity.loomInvocation,
  }).toEqual({
    factory: "createPgSessionJwt_0_5_0",
    module: "kello/extensions/pg-session-jwt",
    name: "pg_session_jwt",
    version: "0.5.0",
    digest: "623c651ce14c1a66283624660e7588f073e56e92628ba73878a47c50150350d8",
    readers: ["jwt", "session", "user_id", "uid", "organization", "organization_id"],
    writes: ["routine:auth.init()", "routine:auth.jwt_session_init(pg_catalog.text)"],
    loomInvocation: false,
  });
});
