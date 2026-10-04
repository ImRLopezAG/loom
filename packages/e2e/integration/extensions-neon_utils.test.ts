import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { createNeonUtils_1_1 } from "../../../apps/loom/src/core/extensions/adapters/neon_utils";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { serializeRpcValue, deserializeRpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/neon_utils.json";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { neonUtilsDatabaseProofCase, neonUtilsProofFamily } from "../fixtures/neon_utils-proof-cases";

extensionProofTest(
  neonUtilsDatabaseProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      const role = `loom_cpu_${randomUUID().replaceAll("-", "")}`;
      const placement = 'cpu"native';
      const moved = 'cpu"moved';
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      const journalRole = (kind: "attempted" | "created" | "dropped") => {
        const file = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
        if (file)
          appendFileSync(
            file,
            JSON.stringify({
              runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
              name: role,
              kind,
              sha256: createHash("sha256").update(role).digest("hex"),
            }) + "\n",
            { mode: 0o600 },
          );
      };
      let roleCreated = false;
      try {
        await oracle.connect();
        const version = await oracle.query("SELECT current_setting('server_version_num')::integer / 10000 AS major");
        assert.equal(version.rows[0].major, 18);
        const binary = await oracle.query(
          "SELECT version FROM pg_available_extension_versions WHERE name='neon_utils' AND version='1.1'",
        );
        assert.equal(binary.rowCount, 1, "Matching neon_utils 1.1 binary is required; no relabelled 1.0 substitute");
        await oracle.query(
          `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE SCHEMA ${pg.escapeIdentifier(moved)}; CREATE EXTENSION neon_utils WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '1.1'; CREATE TABLE public.cpu_writes (value text)`,
        );
        const actual = await captureExtensionContract(oracle, {
          name: "neon_utils",
          provider: "postgres",
          fixture: "disposable-local-pg18-neon_utils",
        });
        assert.equal(actual.contract.version, neonUtilsProofFamily.version);
        assert.deepEqual(actual.contract.members, manifest.contract.members);
        assert.deepEqual(actual.contract.installation, manifest.contract.installation);
        await observeExtensionProofDatabase(url, neonUtilsDatabaseProofCase.id, "neon_utils");
        await extensionProofWitness({ ...neonUtilsDatabaseProofCase.claims[0]!, schema: placement }, async () => {
          const api = createNeonUtils_1_1({
            name: "neon_utils",
            version: "1.1",
            schema: placement,
            apiSupport: { status: "verified", digest: neonUtilsProofFamily.manifestDigest },
          });
          const native = await oracle.query(
            `SELECT ${pg.escapeIdentifier(placement)}.num_cpus() AS cpus, pg_typeof(${pg.escapeIdentifier(placement)}.num_cpus())::text AS type`,
          );
          assert.equal(native.rows[0].type, "integer");
          // CPU online state can change between statements; both calls must preserve the native int4 domain.
          assert(Number.isInteger(native.rows[0].cpus));
          const rows = await connection.transaction(async (db) =>
            db
              .select({ cpus: api.numCpus(), canonical: api.sql.functions.num_cpus() })
              .from(sql`(values (1)) cpu_fixture(n)`),
          );
          assert.equal(rows.length, 1);
          for (const count of Object.values(rows[0]!))
            assert(Number.isInteger(count) && count >= -2147483648 && count <= 2147483647);
          assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
          await assert.rejects(
            connection.transaction(async (db) => {
              await db.execute("INSERT INTO public.cpu_writes VALUES ('rollback')");
              await db.select({ cpus: api.numCpus() }).from(sql`(values (1)) cpu_fixture(n)`);
              throw Error("rollback CPU observation transaction");
            }),
            /rollback CPU observation transaction/,
          );
          assert.deepEqual((await oracle.query("SELECT * FROM public.cpu_writes")).rows, []);
          journalRole("attempted");
          await oracle.query(`CREATE ROLE ${pg.escapeIdentifier(role)} NOLOGIN`);
          roleCreated = true;
          journalRole("created");
          await oracle.query(`GRANT ${pg.escapeIdentifier(role)} TO CURRENT_USER`);
          await oracle.query(
            `GRANT USAGE ON SCHEMA ${pg.escapeIdentifier(placement)}, ${pg.escapeIdentifier(moved)} TO ${pg.escapeIdentifier(role)}`,
          );
          await oracle.query("BEGIN");
          try {
            await oracle.query(`SET LOCAL ROLE ${pg.escapeIdentifier(role)}`);
            assert(
              Number.isInteger(
                (await oracle.query(`SELECT ${pg.escapeIdentifier(placement)}.num_cpus() AS cpus`)).rows[0].cpus,
              ),
            );
          } finally {
            await oracle.query("ROLLBACK");
          }
          let selectedPlacement = placement;
          try {
            await oracle.query(`ALTER EXTENSION neon_utils SET SCHEMA ${pg.escapeIdentifier(moved)}`);
            selectedPlacement = moved;
          } catch (cause) {
            // Neon internally owns the function even in this fixture-owned
            // database; its native ownership restriction also governs relocation.
            assert(cause instanceof Error && "code" in cause && cause.code === "42501");
          }
          const relocated = createNeonUtils_1_1({ ...api, schema: selectedPlacement });
          assert(
            Number.isInteger(
              (
                await connection.transaction(async (db) =>
                  db.select({ cpus: relocated.numCpus() }).from(sql`(values (1)) cpu_fixture(n)`),
                )
              )[0]!.cpus,
            ),
          );
          const absentPlacement = selectedPlacement === moved ? placement : moved;
          await assert.rejects(oracle.query(`SELECT ${pg.escapeIdentifier(absentPlacement)}.num_cpus()`), {
            code: "42883",
          });
          // Neon retains ownership of its internal function. Characterize that
          // restriction, then exercise denial through the fixture-owned schema.
          const revoke = `REVOKE EXECUTE ON FUNCTION ${pg.escapeIdentifier(selectedPlacement)}.num_cpus() FROM PUBLIC`;
          try {
            await oracle.query(revoke);
          } catch (cause) {
            // Membership in Neon internal roles does not imply permission to
            // change their objects; the native operation decides this boundary.
            assert(cause instanceof Error && "code" in cause && cause.code === "42501");
          }
          const privilege = await oracle.query(
            "SELECT has_function_privilege($1,p.oid,'EXECUTE') AS can_execute FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=$2 AND p.proname='num_cpus' AND p.pronargs=0",
            [role, selectedPlacement],
          );
          assert.equal(privilege.rowCount, 1);
          if (privilege.rows[0].can_execute)
            await oracle.query(
              `REVOKE USAGE ON SCHEMA ${pg.escapeIdentifier(selectedPlacement)} FROM PUBLIC, ${pg.escapeIdentifier(role)}`,
            );
          await oracle.query("BEGIN");
          try {
            await oracle.query(`SET LOCAL ROLE ${pg.escapeIdentifier(role)}`);
            await assert.rejects(oracle.query(`SELECT ${pg.escapeIdentifier(selectedPlacement)}.num_cpus()`), {
              code: "42501",
            });
          } finally {
            await oracle.query("ROLLBACK");
          }
        });
      } finally {
        try {
          if (roleCreated) {
            await oracle.query(`DROP OWNED BY ${pg.escapeIdentifier(role)}`);
            await oracle.query(`DROP ROLE ${pg.escapeIdentifier(role)}`);
            journalRole("dropped");
          }
        } finally {
          try {
            await connection.close();
          } finally {
            await oracle.end();
          }
        }
      }
    });
  },
  120000,
);
