import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import pg from "pg";
import * as v from "valibot";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_graphql.json";

/**
 * Read-only-output native characterization of pg_graphql 1.5.12 on a disposable PostgreSQL 18 fixture. It creates
 * and force-drops its own UUID database and role, and prints one JSON receipt. It is not a provider (Neon) gate.
 */
const connectionString = process.env.LOOM_TEST_DATABASE_URL;
if (!connectionString) throw new Error("Missing PostgreSQL 18 pg_graphql fixture");
const suffix = crypto.randomUUID().replaceAll("-", "");
const database = `loom_ext_${suffix}`;
const role = `loom_gql_${suffix}`;
const admin = new pg.Client({ connectionString });
type NativeValue = string | number | boolean | null | NativeValue[] | { [key: string]: NativeValue };
type NativeRow = { [key: string]: NativeValue };
const nativeValueSchema: v.GenericSchema<NativeValue> = v.lazy(() =>
  v.union([
    v.string(),
    v.number(),
    v.boolean(),
    v.null(),
    v.array(nativeValueSchema),
    v.record(v.string(), nativeValueSchema),
  ]),
);
type Outcome = { ok: NativeRow[] } | { error: { code: string | null; message: string } };
async function attempt(client: pg.Client, text: string, values: unknown[] = []): Promise<Outcome> {
  try {
    const result = await client.query(text, values);
    return { ok: v.parse(v.array(v.record(v.string(), nativeValueSchema)), result.rows) };
  } catch (cause) {
    assert(cause instanceof Error);
    const error = v.parse(v.object({ code: v.optional(v.string()), message: v.string() }), cause);
    return { error: { code: error.code ?? null, message: error.message } };
  }
}
const receipt: { [key: string]: NativeValue } = {};
await admin.connect();
try {
  await admin.query(`CREATE DATABASE ${quoteIdentifier(database)}`);
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  try {
    await client.query("CREATE EXTENSION pg_graphql VERSION '1.5.12'");
    const captured = await captureExtensionContract(client, {
      name: "pg_graphql",
      provider: "neon",
      fixture: "disposable-local-pg18-docker",
    });
    receipt.capture = {
      serverVersion: captured.provenance.serverVersion,
      installationSchema: captured.provenance.installationSchema,
      digest: captured.digest,
      manifestDigest: manifest.digest,
      digestMatches: captured.digest === manifest.digest,
      contractMatches: isDeepStrictEqual(captured.contract, manifest.contract),
      members: captured.contract.members.map((member) => member.id),
    };
    const q = (text: string, values: unknown[] = []) => attempt(client, text, values);
    await client.query(
      'CREATE TABLE public.account(id bigint PRIMARY KEY, name text, balance numeric, big bigint); COMMENT ON TABLE public.account IS e\'@graphql({"totalCount": {"enabled": true}})\'',
    );
    await client.query(
      "INSERT INTO public.account VALUES (1,'a',12345678901234567890.123456789,9007199254740993),(2,NULL,NULL,NULL)",
    );
    const list =
      "{ accountCollection(orderBy:[{id:AscNullsLast}]) { totalCount edges { node { id name balance big } } } }";
    receipt.comment_directive = {
      directive: await q(`SELECT graphql.comment_directive($1) AS r`, ['x @graphql({"name":"Acct"}) y']),
      plain: await q(`SELECT graphql.comment_directive($1) AS r`, ["plain"]),
      null: await q(`SELECT graphql.comment_directive(NULL) AS r`),
      invalidJson: await q(`SELECT graphql.comment_directive($1) AS r`, ["@graphql({bad)"]),
      typeof: await q(`SELECT pg_typeof(graphql.comment_directive('x'))::text AS r`),
    };
    receipt.exception = {
      message: await q(`SELECT graphql.exception('boom') AS r`),
      null: await q(`SELECT graphql.exception(NULL) AS r`),
    };
    const before = await q("SELECT graphql.get_schema_version() AS r");
    await client.query("BEGIN; CREATE TABLE public.rolled_back(id int); ROLLBACK");
    const afterRollback = await q("SELECT graphql.get_schema_version() AS r");
    await client.query("CREATE TABLE public.kept(id int primary key)");
    const afterDdl = await q("SELECT graphql.get_schema_version() AS r");
    receipt.get_schema_version = {
      before,
      afterRollback,
      afterDdl,
      typeof: await q("SELECT pg_typeof(graphql.get_schema_version())::text AS r"),
    };
    receipt.increment_schema_version = { direct: await q("SELECT graphql.increment_schema_version()") };
    receipt.resolve = {
      list: await q(`SELECT graphql.resolve($1)::text AS r`, [list]),
      variables: await q(`SELECT graphql.resolve($1, $2::jsonb)::text AS r`, [
        "query Q($id: BigInt!) { accountCollection(filter:{id:{eq:$id}}) { edges { node { id } } } }",
        '{"id":"2"}',
      ]),
      operationName: await q(`SELECT graphql.resolve($1, '{}'::jsonb, $2)::text AS r`, [
        "query A { __typename } query B { accountCollection { totalCount } }",
        "B",
      ]),
      ambiguousOperation: await q(`SELECT graphql.resolve($1)::text AS r`, [
        "query A { __typename } query B { __typename }",
      ]),
      syntax: await q(`SELECT graphql.resolve($1)::text AS r`, ["{ not closed"]),
      nullQuery: await q(`SELECT graphql.resolve(NULL)::text AS r`),
      nullVariables: await q(`SELECT graphql.resolve($1, NULL)::text AS r`, ["{ __typename }"]),
      extensions: await q(`SELECT graphql.resolve($1, '{}', NULL, $2::jsonb)::text AS r`, [
        "{ __typename }",
        '{"x":1}',
      ]),
      newTableSameSession: await q(`SELECT graphql.resolve($1)::text AS r`, [
        "{ keptCollection { edges { node { id } } } }",
      ]),
      typeof: await q("SELECT pg_typeof(graphql.resolve('{ __typename }'))::text AS r"),
    };
    // Write authority: a mutation is native SQL under the caller's transaction mode.
    const mutation = 'mutation { insertIntoaccountCollection(objects:[{id:"3", name:"c"}]) { affectedCount } }';
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const readOnly = await q(`SELECT graphql.resolve($1)::text AS r`, [mutation]);
    const afterErrorSameTransaction = await q("SELECT 1 AS r");
    await client.query("ROLLBACK");
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE");
    const readWrite = await q(`SELECT graphql.resolve($1)::text AS r`, [mutation]);
    await client.query("ROLLBACK");
    const afterRollbackRows = await q("SELECT count(*)::int AS r FROM public.account WHERE id=3");
    receipt.resolveWrites = { readOnly, afterErrorSameTransaction, readWrite, afterRollbackRows };
    receipt._internal_resolve = {
      list: await q(`SELECT graphql._internal_resolve($1)::text AS r`, ["{ accountCollection { totalCount } }"]),
      syntax: await q(`SELECT graphql._internal_resolve($1)::text AS r`, ["{ not closed"]),
      nullQuery: await q(`SELECT graphql._internal_resolve(NULL)::text AS r`),
    };
    // Caller privileges: neither resolve function is SECURITY DEFINER.
    await client.query(`CREATE ROLE ${quoteIdentifier(role)}`);
    await client.query(`GRANT ${quoteIdentifier(role)} TO CURRENT_USER`);
    await client.query(`GRANT USAGE ON SCHEMA graphql TO ${quoteIdentifier(role)}`);
    await client.query(`SET ROLE ${quoteIdentifier(role)}`);
    receipt.privileges = {
      unprivileged: await q(`SELECT graphql.resolve($1)::text AS r`, ["{ accountCollection { totalCount } }"]),
      schemaVersion: await q("SELECT graphql.get_schema_version() AS r"),
    };
    await client.query("RESET ROLE");
    receipt.sessionState = await q(
      "SELECT current_setting('search_path') AS search_path, current_user::text AS role, pg_catalog.txid_current_if_assigned() IS NULL AS no_xid",
    );
  } finally {
    await client.end();
  }
} finally {
  await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(database)} WITH (FORCE)`);
  await admin.query(`DROP ROLE IF EXISTS ${quoteIdentifier(role)}`);
  await admin.end();
}
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
