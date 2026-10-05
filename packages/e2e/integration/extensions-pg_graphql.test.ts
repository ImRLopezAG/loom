import assert from "node:assert/strict";
import { expect } from "bun:test";
import { sql } from "drizzle-orm";
import * as v from "valibot";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { jsonbDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { pgGraphqlApi, pgGraphqlSchema, recordPgGraphqlRole, withPgGraphqlApi } from "../fixtures/pg_graphql";
import { pgGraphqlNativeProofCase, pgGraphqlProofFamily } from "../fixtures/pg_graphql-proof-cases";

const scenario = "native-jsonb-text-authority-and-trigger-only-increment";
const list = "{ accountCollection(orderBy:[{id:AscNullsLast}]) { totalCount edges { node { id name balance big } } } }";
const listText =
  '{"data": {"accountCollection": {"edges": [{"node": {"id": "1", "big": "9007199254740993", "name": "a", "balance": "12345678901234567890.123456789"}}, {"node": {"id": "2", "big": null, "name": null, "balance": null}}], "totalCount": 2}}}';

function witness(member: string, assertion: () => void | Promise<void>) {
  return extensionProofWitness({ family: pgGraphqlProofFamily, member, scenario, schema: pgGraphqlSchema }, assertion);
}

extensionProofTest(
  pgGraphqlNativeProofCase,
  async () => {
    await withPgGraphqlApi(async ({ url, client, connection, api }) => {
      await observeExtensionProofDatabase(url, pgGraphqlNativeProofCase.id, "pg_graphql");
      expect(api).toBe(pgGraphqlApi);

      const resolved = await connection.transaction((db) =>
        db.select({ document: api.resolve(list) }).from(sql`(values (1)) as fixture(value)`),
      );
      const nativeList = await client.query<{ r: string }>("SELECT graphql.resolve($1)::text AS r", [list]);
      await witness(
        "routine:$extension:pg_graphql.resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
        () => {
          expect(resolved[0]?.document).toEqual(jsonbDocument(nativeList.rows[0]!.r));
          expect(resolved[0]?.document.text).toBe(listText);
        },
      );

      const variables = jsonbDocument('{"id":"2"}');
      const filtered = await connection.transaction((db) =>
        db
          .select({
            document: api.resolve(
              "query Q($id: BigInt!) { accountCollection(filter:{id:{eq:$id}}) { edges { node { id } } } }",
              variables,
            ),
          })
          .from(sql`(values (1)) as fixture(value)`),
      );
      expect(filtered[0]?.document.text).toBe('{"data": {"accountCollection": {"edges": [{"node": {"id": "2"}}]}}}');

      const named = await connection.transaction((db) =>
        db
          .select({
            document: api.resolve(
              "query A { __typename } query B { accountCollection { totalCount } }",
              jsonbDocument("{}"),
              "B",
            ),
          })
          .from(sql`(values (1)) as fixture(value)`),
      );
      expect(named[0]?.document.text).toBe('{"data": {"accountCollection": {"totalCount": 2}}}');

      const syntax = await connection.transaction((db) =>
        db.select({ document: api.resolve("{ not closed") }).from(sql`(values (1)) as fixture(value)`),
      );
      expect(syntax[0]?.document.text).toContain("query parse error");
      const afterGraphqlError = await client.query("SELECT 1 AS r");
      expect(afterGraphqlError.rows).toEqual([{ r: 1 }]);

      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const readOnly = await client.query<{ r: string }>("SELECT graphql.resolve($1)::text AS r", [
        'mutation { insertIntoaccountCollection(objects:[{id:"3", name:"c"}]) { affectedCount } }',
      ]);
      expect(readOnly.rows[0]?.r).toContain("read-only transaction");
      await client.query("ROLLBACK");

      const directive = await connection.transaction((db) =>
        db
          .select({ document: api.commentDirective('x @graphql({"name":"Acct"}) y') })
          .from(sql`(values (1)) as fixture(value)`),
      );
      const nativeDirective = await client.query<{ r: string }>("SELECT graphql.comment_directive($1)::text AS r", [
        'x @graphql({"name":"Acct"}) y',
      ]);
      await witness("routine:$extension:pg_graphql.comment_directive(pg_catalog.text)", () => {
        expect(directive[0]?.document).toEqual(jsonbDocument(nativeDirective.rows[0]!.r));
        expect(directive[0]?.document.text).toBe('{"name": "Acct"}');
      });
      const empty = await connection.transaction((db) =>
        db.select({ document: api.commentDirective(null) }).from(sql`(values (1)) as fixture(value)`),
      );
      expect(empty[0]?.document.text).toBe("{}");

      const before = await connection.transaction((db) =>
        db.select({ version: api.getSchemaVersion() }).from(sql`(values (1)) as fixture(value)`),
      );
      await client.query("BEGIN; CREATE TABLE public.rolled_back(id int); ROLLBACK");
      const afterRollback = await connection.transaction((db) =>
        db.select({ version: api.getSchemaVersion() }).from(sql`(values (1)) as fixture(value)`),
      );
      await witness("routine:$extension:pg_graphql.get_schema_version()", () => {
        expect(afterRollback[0]?.version).toBe((before[0]?.version ?? 0) + 1);
      });

      await witness("routine:$extension:pg_graphql.increment_schema_version()", async () => {
        await assert.rejects(client.query("SELECT graphql.increment_schema_version()"), { code: "0A000" });
      });

      await witness(
        "routine:$extension:pg_graphql._internal_resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
        async () => {
          const ok = await connection.transaction((db) =>
            db
              .select({ document: api.internalResolve("{ accountCollection { totalCount } }") })
              .from(sql`(values (1)) as fixture(value)`),
          );
          expect(ok[0]?.document.text).toBe('{"data": {"accountCollection": {"totalCount": 2}}}');
          await assert.rejects(
            connection.transaction((db) =>
              db
                .select({ document: api.sql.functions._internal_resolve(null) })
                .from(sql`(values (1)) as fixture(value)`),
            ),
            (error) => v.is(v.object({ cause: v.object({ code: v.literal("XX000") }) }), error),
          );
        },
      );

      await witness("routine:$extension:pg_graphql.exception(pg_catalog.text)", async () => {
        await assert.rejects(
          connection.transaction((db) =>
            db.select({ result: api.exception("boom") }).from(sql`(values (1)) as fixture(value)`),
          ),
          (error) =>
            v.is(v.object({ cause: v.object({ code: v.literal("22000"), message: v.literal("boom") }) }), error),
        );
        await assert.rejects(
          connection.transaction((db) =>
            db.select({ result: api.sql.functions.exception(null) }).from(sql`(values (1)) as fixture(value)`),
          ),
          (error) => v.is(v.object({ cause: v.object({ code: v.literal("22004") }) }), error),
        );
      });

      const triggers = await client.query<{ evtname: string }>(
        "SELECT evtname FROM pg_catalog.pg_event_trigger WHERE evtname IN ('graphql_watch_ddl','graphql_watch_drop') ORDER BY 1",
      );
      await witness("event trigger:graphql_watch_ddl", () => {
        expect(triggers.rows.map((row) => row.evtname)).toContain("graphql_watch_ddl");
      });
      await witness("event trigger:graphql_watch_drop", () => {
        expect(triggers.rows.map((row) => row.evtname)).toContain("graphql_watch_drop");
      });

      const sequence = await client.query<{ nspname: string; relname: string }>(
        "SELECT n.nspname, c.relname FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'S' AND c.relname = 'seq_schema_version'",
      );
      await witness('sequence:"$extension:pg_graphql".seq_schema_version', () => {
        expect(sequence.rows).toEqual([{ nspname: "graphql", relname: "seq_schema_version" }]);
      });
      const columns = await client.query<{ attname: string }>(
        "SELECT a.attname FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid = a.attrelid JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'graphql' AND c.relname = 'seq_schema_version' AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum",
      );
      await witness('sequence column:"$extension:pg_graphql".seq_schema_version.last_value', () => {
        expect(columns.rows.map((row) => row.attname)).toContain("last_value");
      });
      await witness('sequence column:"$extension:pg_graphql".seq_schema_version.log_cnt', () => {
        expect(columns.rows.map((row) => row.attname)).toContain("log_cnt");
      });
      await witness('sequence column:"$extension:pg_graphql".seq_schema_version.is_called', () => {
        expect(columns.rows.map((row) => row.attname)).toContain("is_called");
      });

      const suffix = crypto.randomUUID().replaceAll("-", "");
      const role = `loom_gql_${suffix}`;
      await client.query(`CREATE ROLE ${quoteIdentifier(role)}`);
      await client.query(`GRANT ${quoteIdentifier(role)} TO CURRENT_USER`);
      recordPgGraphqlRole(role);
      try {
        await client.query(`GRANT USAGE ON SCHEMA graphql TO ${quoteIdentifier(role)}`);
        await client.query(`SET ROLE ${quoteIdentifier(role)}`);
        const unprivileged = await client.query<{ r: string }>("SELECT graphql.resolve($1)::text AS r", [
          "{ accountCollection { totalCount } }",
        ]);
        expect(unprivileged.rows[0]?.r).toContain("Unknown field");
        await client.query("RESET ROLE");
        const session = await client.query<{ search_path: string; role: string; no_xid: boolean }>(
          "SELECT current_setting('search_path') AS search_path, current_user::text AS role, pg_catalog.txid_current_if_assigned() IS NULL AS no_xid",
        );
        expect(session.rows[0]?.role).not.toBe(role);
        expect(session.rows[0]?.no_xid).toBe(true);
      } finally {
        await client.query("RESET ROLE");
        await client.query(`DROP OWNED BY ${quoteIdentifier(role)}`);
        await client.query(`DROP ROLE IF EXISTS ${quoteIdentifier(role)}`);
      }
    });
  },
  60000,
);
