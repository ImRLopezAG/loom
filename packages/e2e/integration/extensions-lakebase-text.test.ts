import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import pg from "pg";
import * as v from "valibot";
import { defineRelations, sql } from "drizzle-orm";
import { createLakebaseText_0_1_3 } from "../../../apps/loom/src/core/extensions/adapters/lakebase-text";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { serializeRpcValue, deserializeRpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/lakebase_text.json";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { lakebaseTextDatabaseProofCase, lakebaseTextProofFamily } from "../fixtures/lakebase-text-proof-cases";

extensionProofTest(
  lakebaseTextDatabaseProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      const role = `loom_bm25_${randomUUID().replaceAll("-", "")}`;
      const placement = 'bm25"native';
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
          "SELECT version FROM pg_available_extension_versions WHERE name='lakebase_text' AND version='0.1.3'",
        );
        assert.equal(binary.rowCount, 1, "Matching lakebase_text 0.1.3 binary is required; no relabelled substitute");
        await oracle.query(
          `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION lakebase_text WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '0.1.3'`,
        );
        const actual = await captureExtensionContract(oracle, {
          name: "lakebase_text",
          provider: "neon",
          fixture: "disposable-neon-pg18-lakebase-text",
        });
        assert.equal(actual.contract.version, lakebaseTextProofFamily.version);
        assert.deepEqual(actual.contract.members, manifest.contract.members);
        assert.deepEqual(actual.contract.installation, manifest.contract.installation);
        await observeExtensionProofDatabase(url, lakebaseTextDatabaseProofCase.id, "lakebase_text");
        const observed = async () => {
          const api = createLakebaseText_0_1_3({
            name: "lakebase_text",
            version: "0.1.3",
            schema: placement,
            apiSupport: { status: "verified", digest: lakebaseTextProofFamily.manifestDigest },
          });
          await oracle.query(`
          CREATE TABLE public.lakebase_text_docs (
            id serial PRIMARY KEY,
            passage text,
            vector tsvector
          );
          INSERT INTO public.lakebase_text_docs (passage, vector) VALUES
            ('PostgreSQL BM25', to_tsvector('english', 'PostgreSQL BM25')),
            ('unrelated row', to_tsvector('english', 'unrelated row'));
          CREATE INDEX documents_passage_bm25 ON public.lakebase_text_docs USING lakebase_bm25 (vector);
          CREATE INDEX documents_passage_bm25v0 ON public.lakebase_text_docs USING lakebase_bm25v0 (vector);
        `);
          const native = await oracle.query(
            `SELECT vector OPERATOR(${pg.escapeIdentifier(placement)}.<@>) ${pg.escapeIdentifier(placement)}.to_bm25query(to_tsvector('english', 'PostgreSQL'), 'documents_passage_bm25') AS score,
                  ${pg.escapeIdentifier(placement)}._lakebase_bm25_evaluate_tsvector(vector, ${pg.escapeIdentifier(placement)}.to_bm25query(to_tsvector('english', 'PostgreSQL'), 'documents_passage_bm25')) AS evaluated,
                  ${pg.escapeIdentifier(placement)}._lakebase_bm25_support_tsvector_bm25_ops() AS support,
                  pg_typeof(vector OPERATOR(${pg.escapeIdentifier(placement)}.<@>) ${pg.escapeIdentifier(placement)}.to_bm25query(to_tsvector('english', 'PostgreSQL'), 'documents_passage_bm25'))::text AS type
           FROM public.lakebase_text_docs
           ORDER BY score
           LIMIT 2`,
          );
          assert.equal(native.rows[0].type, "double precision");
          v.parse(v.number(), native.rows[0].score);
          assert.equal(native.rows[0].score, native.rows[0].evaluated);
          v.parse(v.string(), native.rows[0].support);
          const rows = await connection.transaction(async (db) => {
            await db.execute(sql`${api.session.defaultLimit(5)}`);
            return db
              .select({
                score: api.rank(
                  sql`to_tsvector('english', 'PostgreSQL')`,
                  api.toBm25Query(sql`to_tsvector('english', 'PostgreSQL')`, "documents_passage_bm25"),
                ),
                evaluated: api.evaluate(
                  sql`to_tsvector('english', 'PostgreSQL')`,
                  api.toBm25Query(sql`to_tsvector('english', 'PostgreSQL')`, "documents_passage_bm25"),
                ),
              })
              .from(sql`public.lakebase_text_docs`);
          });
          assert.equal(rows.length, 2);
          assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
          const info = await connection.transaction(async (db) =>
            db
              .select({
                info: api.indexInfo("documents_passage_bm25"),
                support: api.support(),
              })
              .from(sql`(values (1)) bm25_info(n)`),
          );
          v.parse(v.string(), info[0]?.info);
          v.parse(v.string(), info[0]?.support);
          journalRole("attempted");
          await oracle.query(`CREATE ROLE ${pg.escapeIdentifier(role)} NOLOGIN`);
          roleCreated = true;
          journalRole("created");
          await oracle.query(`GRANT USAGE ON SCHEMA ${pg.escapeIdentifier(placement)} TO ${pg.escapeIdentifier(role)}`);
          await oracle.query("BEGIN");
          try {
            await oracle.query(`SET LOCAL ROLE ${pg.escapeIdentifier(role)}`);
            v.parse(
              v.record(v.string(), v.unknown()),
              (
                await oracle.query(
                  `SELECT ${pg.escapeIdentifier(placement)}.to_bm25query(to_tsvector('english', 'PostgreSQL'), 'documents_passage_bm25')`,
                )
              ).rows[0],
            );
          } finally {
            await oracle.query("ROLLBACK");
          }
        };
        let ran = false;
        for (const claim of lakebaseTextDatabaseProofCase.claims) {
          await extensionProofWitness({ ...claim, schema: placement }, async () => {
            if (ran) return;
            ran = true;
            await observed();
          });
        }
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
  180000,
);
