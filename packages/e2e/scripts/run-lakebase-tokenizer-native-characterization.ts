import assert from "node:assert/strict";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import { lakebaseTokenizerDigest } from "../../../apps/loom/src/core/extensions/adapters/lakebase_tokenizer";

// The parent supplies a disposable target and an already-created native dictionary. No provisioning/authentication.
const url = process.env.LOOM_LAKEBASE_TOKENIZER_CHARACTERIZATION_DATABASE_URL;
const schema = process.env.LOOM_LAKEBASE_TOKENIZER_CHARACTERIZATION_DICTIONARY_SCHEMA;
const name = process.env.LOOM_LAKEBASE_TOKENIZER_CHARACTERIZATION_DICTIONARY_NAME;
assert(url && schema && name, "Parent-owned URL and existing fixture dictionary schema/name are required");
const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query("BEGIN READ ONLY");
  const captured = await captureExtensionContract(client, {
    name: "lakebase_tokenizer",
    provider: "neon",
    fixture: "parent-read-only-tokenizer-characterization",
  });
  assert.equal(captured.contract.version, "0.1.1");
  assert.equal(captured.contract.postgresMajor, 18);
  assert.equal(captured.digest, lakebaseTokenizerDigest);
  const facts = await client.query(
    `SELECT t.tmplname AS template, tn.nspname AS "templateSchema", d.dictinitoption AS options,
    init.proname AS init, lexize.proname AS lexize FROM pg_catalog.pg_ts_dict d
    JOIN pg_catalog.pg_namespace dn ON dn.oid=d.dictnamespace JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate
    JOIN pg_catalog.pg_namespace tn ON tn.oid=t.tmplnamespace JOIN pg_catalog.pg_proc init ON init.oid=t.tmplinit
    JOIN pg_catalog.pg_proc lexize ON lexize.oid=t.tmpllexize WHERE dn.nspname=$1 AND d.dictname=$2`,
    [schema, name],
  );
  assert.equal(facts.rowCount, 1);
  assert.equal(facts.rows[0].template, "tokenizer_wholeword");
  assert.equal(facts.rows[0].templateSchema, captured.provenance.installationSchema);
  const samples = ["Running", "Café's", "cafe\u0301", "USA", "The", "'s", "", null];
  const observations = [];
  for (const input of samples) {
    const result: pg.QueryResult<{ lexemes: string | null }> = await client.query(
      "SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,$3::text)::text AS lexemes",
      [schema, name, input],
    );
    assert.equal(result.rowCount, 1);
    observations.push({ input, ...result.rows[0] });
  }
  await client.query("ROLLBACK");
  console.log(
    JSON.stringify({
      extension: "lakebase_tokenizer",
      version: "0.1.1",
      manifestDigest: captured.digest,
      memberCount: captured.contract.members.length,
      facts: facts.rows[0],
      observations,
      readOnly: true,
    }),
  );
} finally {
  await client.end();
}
