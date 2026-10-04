import { expect } from "bun:test";
import assert from "node:assert/strict";
import { defineRelations, sql } from "drizzle-orm";
import pg from "pg";
import { appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createPgSessionJwt_0_5_0 } from "../../../apps/loom/src/core/extensions/adapters/pg_session_jwt";
import { jsonbDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import {
  SessionJwtOperationError,
  withPgSessionJwt,
  type SessionJwtObservation,
  type SessionJwtSession,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_session_jwt";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  pgSessionJwtApi,
  pgSessionJwtDescriptor,
  pgSessionJwtInstall,
  createSessionJwtSigner,
  requireSessionJwtExtension,
} from "../fixtures/pg_session_jwt";
import {
  pgSessionJwtNativeReaderProofCase,
  pgSessionJwtNativeSessionProofCase,
  pgSessionJwtDatabaseProofCases,
} from "../fixtures/pg_session_jwt-proof-cases";

const claims = {
  sub: "550e8400-e29b-41d4-a716-446655440000",
  o: { id: "11111111-1111-4111-8111-111111111111", slug: "acme", role: "admin" },
};
const claimsText = JSON.stringify(claims);
const nullSession = jsonbDocument("null");
const epoch = () => Math.floor(Date.now() / 1000);

interface JwkReaderEvidence {
  ignoredClaims: Awaited<ReturnType<typeof readAll>>;
  verified: Awaited<ReturnType<typeof readAll>>;
  nonStringSub: pg.DatabaseError;
  nonUuidSub: Awaited<ReturnType<typeof readAll>>;
  badSignature: pg.DatabaseError;
}

/** Autocommit statements on a test-owned client; each reader runs after its writer, never in the same SELECT. */
async function readAll(client: pg.Client) {
  const result = await client.query<{
    session: string;
    user_id: string | null;
    uid: string | null;
    organization: string | null;
    organization_id: string | null;
  }>(
    "select auth.session()::text as session, auth.user_id() as user_id, auth.uid()::text as uid, auth.organization()::text as organization, auth.organization_id()::text as organization_id",
  );
  return result.rows[0]!;
}
async function databaseError(work: Promise<unknown>) {
  const failure = await work.then(
    () => undefined,
    (cause: unknown) => cause,
  );
  assert(failure instanceof pg.DatabaseError);
  return failure;
}
async function operationError(work: Promise<unknown>) {
  const failure = await work.then(
    () => undefined,
    (cause: unknown) => cause,
  );
  assert(failure instanceof SessionJwtOperationError);
  assert(failure.cause instanceof pg.DatabaseError);
  return { operation: failure, cause: failure.cause };
}

// Witness schema identifies the selected installation environment. Captured routines remain fixed in auth.
extensionProofTest(pgSessionJwtNativeReaderProofCase, async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const available = await client.query<{ name: string }>(
        "SELECT name FROM pg_available_extensions WHERE name='pg_session_jwt'",
      );
      requireSessionJwtExtension(available.rowCount === 1);
      await client.query(pgSessionJwtInstall);
      await observeExtensionProofDatabase(url, pgSessionJwtNativeReaderProofCase.id, "pg_session_jwt");
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      try {
        const api = createPgSessionJwt_0_5_0(pgSessionJwtDescriptor);
        expect(api.identity.loomInvocation).toBe(false);
        const empty = await connection.transaction(async (db) => {
          await db.execute(sql`select pg_catalog.set_config('request.jwt.claims', '', true)`);
          const [row] = await db
            .select({
              jwt: api.jwt(),
              session: api.session(),
              userId: api.userId(),
              uid: api.uid(),
              organization: api.organization(),
              organizationId: api.organizationId(),
            })
            .from(sql`(values (1)) as fixture(value)`);
          return row;
        });
        const populated = await connection.transaction(async (db) => {
          await db.execute(sql`select pg_catalog.set_config('request.jwt.claims', ${claimsText}, true)`);
          const [row] = await db
            .select({
              jwt: api.jwt(),
              session: api.session(),
              userId: api.userId(),
              uid: api.uid(),
              organization: api.organization(),
              organizationId: api.organizationId(),
            })
            .from(sql`(values (1)) as fixture(value)`);
          return row;
        });
        await client.query("BEGIN");
        await client.query("SELECT pg_catalog.set_config('request.jwt.claims', $1, true)", [claimsText]);
        const native = await client.query<{
          jwt: string;
          session: string;
          user_id: string | null;
          uid: string | null;
          organization: string | null;
          organization_id: string | null;
        }>(
          `select auth.jwt()::text as jwt,
            auth.session()::text as session,
            auth.user_id() as user_id,
            auth.uid()::text as uid,
            auth.organization()::text as organization,
            auth.organization_id()::text as organization_id`,
        );
        await client.query("ROLLBACK");
        // Claims-only fallback: malformed JSON and wrongly typed claims read as absence, never as ERROR.
        await client.query("BEGIN");
        await client.query("SELECT pg_catalog.set_config('request.jwt.claims', '{not json', true)");
        const malformed = await readAll(client);
        await client.query("SELECT pg_catalog.set_config('request.jwt.claims', $1, true)", [
          JSON.stringify({ sub: 42, o: { id: 7 } }),
        ]);
        const nonString = await readAll(client);
        await client.query("SELECT pg_catalog.set_config('request.jwt.claims', $1, true)", [
          JSON.stringify({ sub: "not-a-uuid", o: "acme" }),
        ]);
        const nonUuid = await readAll(client);
        await client.query("ROLLBACK");
        // JWK mode on a test-owned startup connection: request.jwt.claims is ignored and verification failures raise.
        const signer = createSessionJwtSigner();
        const keyed = new pg.Client({ connectionString: signer.startupUrl(url) });
        await keyed.connect();
        let jwk: JwkReaderEvidence;
        try {
          await keyed.query("SELECT pg_catalog.set_config('request.jwt.claims', $1, false)", [claimsText]);
          const ignoredClaims = await readAll(keyed);
          const n = epoch();
          await keyed.query("SELECT auth.jwt_session_init($1)", [signer.sign({ ...claims, jti: 1, exp: n + 600 })]);
          const verified = await readAll(keyed);
          await keyed.query("SELECT auth.jwt_session_init($1)", [signer.sign({ sub: 42, jti: 2, exp: n + 600 })]);
          const nonStringSub = await databaseError(keyed.query("SELECT auth.user_id()"));
          await keyed.query("SELECT auth.jwt_session_init($1)", [signer.sign({ sub: "not-a-uuid", jti: 3 })]);
          const nonUuidSub = await readAll(keyed);
          // A userset GUC write bypasses jwt_session_init; the reader itself verifies and raises.
          await keyed.query("SELECT pg_catalog.set_config('pg_session_jwt.jwt', $1, false)", [
            signer.signWithOtherKey({ ...claims, jti: 4 }),
          ]);
          const badSignature = await databaseError(keyed.query("SELECT auth.session()"));
          jwk = { ignoredClaims, verified, nonStringSub, nonUuidSub, badSignature };
        } finally {
          await keyed.end();
        }
        await extensionProofWitness(
          { ...pgSessionJwtNativeReaderProofCase.claims[0]!, schema: "jwt_install" },
          async () => {
            expect(empty?.jwt).toEqual(jsonbDocument("null"));
            expect(populated?.jwt?.type).toBe("jsonb");
            expect(JSON.parse(populated!.jwt.text)).toEqual(claims);
            expect(JSON.parse(native.rows[0]!.jwt)).toEqual(claims);
            expect(malformed.session).toBe("null");
            expect(jwk.ignoredClaims.session).toBe("null");
            expect(jwk.badSignature.code).toBe("23514");
            expect(jwk.badSignature.message).toBe("invalid JWT signature");
          },
        );
        await extensionProofWitness(
          { ...pgSessionJwtNativeReaderProofCase.claims[1]!, schema: "jwt_install" },
          async () => {
            expect(empty?.session).toEqual(jsonbDocument("null"));
            expect(JSON.parse(populated!.session.text)).toEqual(claims);
            expect(JSON.parse(nonString.session)).toEqual({ sub: 42, o: { id: 7 } });
            expect(JSON.parse(jwk.verified.session)).toMatchObject(claims);
          },
        );
        await extensionProofWitness(
          { ...pgSessionJwtNativeReaderProofCase.claims[2]!, schema: "jwt_install" },
          async () => {
            expect(empty?.userId).toBeNull();
            expect(populated?.userId).toBe(claims.sub);
            expect(native.rows[0]!.user_id).toBe(claims.sub);
            expect(malformed.user_id).toBeNull();
            expect(nonString.user_id).toBeNull();
            expect(nonUuid.user_id).toBe("not-a-uuid");
            expect(jwk.ignoredClaims.user_id).toBeNull();
            expect(jwk.verified.user_id).toBe(claims.sub);
            expect(jwk.nonStringSub.code).toBe("42804");
            expect(jwk.nonStringSub.message).toBe("invalid subject claim in the JWT");
            expect(jwk.nonUuidSub.user_id).toBe("not-a-uuid");
          },
        );
        await extensionProofWitness(
          { ...pgSessionJwtNativeReaderProofCase.claims[3]!, schema: "jwt_install" },
          async () => {
            expect(empty?.uid).toBeNull();
            expect(populated?.uid).toBe(claims.sub);
            expect(native.rows[0]!.uid).toBe(claims.sub);
            expect(nonString.uid).toBeNull();
            expect(nonUuid.uid).toBeNull();
            expect(jwk.verified.uid).toBe(claims.sub);
            expect(jwk.nonUuidSub.uid).toBeNull();
          },
        );
        await extensionProofWitness(
          { ...pgSessionJwtNativeReaderProofCase.claims[4]!, schema: "jwt_install" },
          async () => {
            expect(empty?.organization).toBeNull();
            expect(JSON.parse(populated!.organization!.text)).toEqual(claims.o);
            expect(nonString.organization).toBe('{"id": 7}');
            expect(nonUuid.organization).toBeNull();
            expect(JSON.parse(jwk.verified.organization!)).toEqual(claims.o);
            expect(jwk.nonUuidSub.organization).toBeNull();
          },
        );
        await extensionProofWitness(
          { ...pgSessionJwtNativeReaderProofCase.claims[5]!, schema: "jwt_install" },
          async () => {
            expect(empty?.organizationId).toBeNull();
            expect(populated?.organizationId).toBe(claims.o.id);
            expect(native.rows[0]!.organization_id).toBe(claims.o.id);
            expect(nonString.organization_id).toBeNull();
            expect(jwk.verified.organization_id).toBe(claims.o.id);
          },
        );
        expect(pgSessionJwtApi.sql.functions).not.toHaveProperty("init");
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
});

extensionProofTest(pgSessionJwtDatabaseProofCases[2]!, async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    const role = `jwt_acl_${crypto.randomUUID().replaceAll("-", "")}`;
    const journal = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
    if (journal)
      appendFileSync(
        journal,
        JSON.stringify({
          runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
          name: role,
          sha256: createHash("sha256").update(role).digest("hex"),
        }) + "\n",
        { mode: 0o600 },
      );
    try {
      await client.connect();
      await client.query(pgSessionJwtInstall);
      await observeExtensionProofDatabase(url, pgSessionJwtDatabaseProofCases[2]!.id, "pg_session_jwt");
      await extensionProofWitness(
        { ...pgSessionJwtDatabaseProofCases[2]!.claims[0]!, schema: "jwt_install" },
        async () => {
          const ownership = await client.query<{ namespace: string; dependency: string }>(
            `SELECT n.nspname AS namespace, d.deptype AS dependency
             FROM pg_catalog.pg_namespace n
             JOIN pg_catalog.pg_depend d ON d.classid='pg_catalog.pg_namespace'::regclass AND d.objid=n.oid
             JOIN pg_catalog.pg_extension e ON d.refclassid='pg_catalog.pg_extension'::regclass AND d.refobjid=e.oid
             WHERE e.extname='pg_session_jwt' AND n.nspname='auth'`,
          );
          expect(ownership.rows).toEqual([{ namespace: "auth", dependency: "e" }]);
        },
      );
      await client.query(`CREATE ROLE ${pg.escapeIdentifier(role)} NOLOGIN`);
      await client.query(`GRANT USAGE ON SCHEMA jwt_install TO ${pg.escapeIdentifier(role)}`);
      const required = buildRequiredApi({ pg_session_jwt: { version: "0.5.0", schema: "jwt_install" } });
      expect(required).toBeDefined();
      const denied = await verifyRequiredApiOnTarget(client, required, role).then(
        () => undefined,
        (cause: unknown) => cause,
      );
      assert(denied instanceof Error);
      expect(denied.message).toContain(`USAGE denied: ${role} auth`);
      // auth is provider-owned on Neon. Observe its authorized operator role rather than rewriting provider ACLs.
      const operator = await client.query<{ role: string }>("SELECT current_user AS role");
      await verifyRequiredApiOnTarget(client, required, operator.rows[0]!.role);
    } finally {
      try {
        const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [role]);
        if (exists.rows.length)
          await client.query(
            `GRANT ${pg.escapeIdentifier(role)} TO CURRENT_USER; DROP OWNED BY ${pg.escapeIdentifier(role)}; DROP ROLE ${pg.escapeIdentifier(role)}`,
          );
      } finally {
        await client.end();
      }
    }
  });
});

extensionProofTest(
  pgSessionJwtNativeSessionProofCase,
  async () => {
    const signer = createSessionJwtSigner();
    await withExtensionDatabase(async (url) => {
      const startup = signer.startupUrl(url);
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        const available = await client.query<{ name: string }>(
          "SELECT name FROM pg_available_extensions WHERE name='pg_session_jwt'",
        );
        requireSessionJwtExtension(available.rowCount === 1);
        await client.query(pgSessionJwtInstall);
        await observeExtensionProofDatabase(url, pgSessionJwtNativeSessionProofCase.id, "pg_session_jwt");
        const n = epoch();
        const token = signer.sign({ ...claims, jti: 1, nbf: n - 30, exp: n + 600 });
        const unset = { jwt: "unset", session: nullSession } as const;

        // Committed: payload observed on the operator backend, then RESET observed on that same backend.
        const observed: (SessionJwtObservation | Awaited<ReturnType<SessionJwtSession["init"]>>)[] = [];
        const committed = await withPgSessionJwt(startup, pgSessionJwtDescriptor, async (session) => {
          observed.push(await session.observe());
          observed.push(await session.init());
          observed.push(await session.observe());
          observed.push(await session.jwtSessionInit({ jwt: token }));
          observed.push(await session.observe());
          // Identical token text is served from the backend cache without a jti check.
          observed.push(await session.jwtSessionInit({ jwt: token }));
          return "done" as const;
        });

        // Rejections latch, roll back, and still RESET and observe the same backend before disposal.
        const replay = await operationError(
          withPgSessionJwt(startup, pgSessionJwtDescriptor, async (session) => {
            await session.jwtSessionInit({ jwt: signer.sign({ sub: "first", jti: 5 }) });
            await session.jwtSessionInit({ jwt: signer.sign({ sub: "second", jti: 5 }) });
          }),
        );
        const rejected: Awaited<ReturnType<typeof operationError>>[] = [];
        for (const jwt of [
          signer.signWithOtherKey({ ...claims, jti: 1 }),
          "not-a-jwt",
          signer.sign({ ...claims, jti: 1, nbf: n + 600 }),
          signer.sign({ ...claims, jti: 1, exp: n - 600 }),
          signer.sign({ ...claims, jti: "1" }),
        ])
          rejected.push(
            await operationError(
              withPgSessionJwt(startup, pgSessionJwtDescriptor, (session) => session.jwtSessionInit({ jwt })),
            ),
          );
        const leeway = await withPgSessionJwt(startup, pgSessionJwtDescriptor, (session) =>
          session.jwtSessionInit({ jwt: signer.sign({ ...claims, jti: 1, exp: epoch() - 30 }) }),
        );
        const missingKey = await operationError(
          withPgSessionJwt(url, pgSessionJwtDescriptor, (session) => session.init()),
        );

        // Abort: the framework terminates the backend; no RESET is attempted and the backend is gone.
        const controller = new AbortController();
        const reason = new Error("operator abort");
        let backend: number | undefined;
        const aborted = await withPgSessionJwt(
          startup,
          pgSessionJwtDescriptor,
          async (session) => {
            await session.jwtSessionInit({ jwt: token });
            const owned = await client.query<{ pid: number }>(
              "SELECT pid FROM pg_catalog.pg_stat_activity WHERE datname=current_database() AND application_name='loom-migrations' AND state='idle in transaction'",
            );
            expect(owned.rows).toHaveLength(1);
            backend = owned.rows[0]!.pid;
            controller.abort(reason);
            await session.observe();
          },
          controller.signal,
        ).then(
          () => undefined,
          (cause: unknown) => cause,
        );
        const remaining = await client.query("SELECT 1 FROM pg_catalog.pg_stat_activity WHERE pid=$1", [backend]);

        await extensionProofWitness(
          { ...pgSessionJwtNativeSessionProofCase.claims[0]!, schema: "jwt_install" },
          async () => {
            expect(observed.slice(0, 3)).toEqual([unset, { verification: "jwk", loomInvocation: false }, unset]);
            expect(missingKey.cause.code).toBe("02000");
            expect(missingKey.cause.message).toBe("Missing runtime parameter: pg_session_jwt.jwk");
            expect(missingKey.operation.completion).toBe("rolled-back");
            expect(missingKey.operation.effects).toEqual([
              { operation: "init", state: "unknown", scope: "backend" },
              { operation: "reset", state: "acknowledged", scope: "session-guc", observed: unset },
            ]);
          },
        );
        await extensionProofWitness(
          { ...pgSessionJwtNativeSessionProofCase.claims[1]!, schema: "jwt_install" },
          async () => {
            expect(observed[3]).toEqual({ verification: "jwk", loomInvocation: false });
            expect(observed[4]).toMatchObject({ jwt: "set" });
            const populatedObservation = observed[4];
            assert(populatedObservation && "session" in populatedObservation);
            expect(JSON.parse(populatedObservation.session.text)).toEqual({
              ...claims,
              jti: 1,
              nbf: n - 30,
              exp: n + 600,
            });
            expect(observed[5]).toEqual({ verification: "jwk", loomInvocation: false });
            expect(committed.completion).toBe("committed");
            expect(committed.value).toBe("done");
            expect(committed.effects).toEqual([
              { operation: "init", state: "acknowledged", scope: "backend" },
              { operation: "jwt-session-init", state: "acknowledged", scope: "transactional-guc-and-backend" },
              { operation: "jwt-session-init", state: "acknowledged", scope: "transactional-guc-and-backend" },
              { operation: "reset", state: "acknowledged", scope: "session-guc", observed: unset },
            ]);
            expect([replay.cause.code, replay.cause.message]).toEqual([
              "23514",
              "Token ID must be strictly monotonically increasing.",
            ]);
            expect(replay.operation.completion).toBe("rolled-back");
            expect(replay.operation.effects).toEqual([
              { operation: "jwt-session-init", state: "acknowledged", scope: "transactional-guc-and-backend" },
              { operation: "jwt-session-init", state: "unknown", scope: "transactional-guc-and-backend" },
              { operation: "reset", state: "acknowledged", scope: "session-guc", observed: unset },
            ]);
            expect(rejected.map(({ cause }) => [cause.code, cause.message])).toEqual([
              ["23514", "invalid JWT signature"],
              ["42804", "invalid JWT encoding"],
              ["23514", "Token used before it is ready"],
              ["23514", "Token used after it has expired"],
              ["42804", "JWT payload must contain a valid 'jti' (JWT ID)"],
            ]);
            for (const { operation } of rejected) {
              expect(operation.completion).toBe("rolled-back");
              expect(operation.cleanupFailures).toEqual([]);
              expect(operation.effects.at(-1)).toEqual({
                operation: "reset",
                state: "acknowledged",
                scope: "session-guc",
                observed: unset,
              });
            }
            expect(leeway.completion).toBe("committed");
            assert(aborted instanceof SessionJwtOperationError);
            const abort = aborted;
            expect(abort.cause).toBe(reason);
            expect(abort.completion).toBe("rolled-back");
            expect(abort.cleanupFailures).toEqual([]);
            expect(abort.effects).toEqual([
              { operation: "jwt-session-init", state: "acknowledged", scope: "transactional-guc-and-backend" },
            ]);
            expect(backend).toBeGreaterThan(0);
            expect(remaining.rowCount).toBe(0);
          },
        );
      } finally {
        await client.end();
      }
    });
  },
  90000,
);
