import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pgtap.json";
import { pgtapInstall, withPgtapDatabase } from "../fixtures/pgtap";

const output = process.argv[2];
assert(output, "Usage: bun run-pgtap-native-characterization.ts /absolute/scratch-output.json");
const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
const upstream = process.env.PGTAP_UPSTREAM_SQL;
assert(upstream, "PGTAP_UPSTREAM_SQL must select the built v1.3.3 SQL source");
const upstreamSql = await readFile(upstream, "utf8");
const result = await withPgtapDatabase(async (url) => {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(pgtapInstall);
    await client.query("SET search_path = pg_catalog");
    const native = await captureExtensionContract(client, {
      name: "pgtap",
      provider: "neon",
      fixture: "owned-local-pgtap-1.3.3-pg18",
    });
    await writeFile(`${output}.contract.json`, JSON.stringify(native, null, 2));
    assert.equal(native.digest, source.digest, "Native PostgreSQL 18 contract must match all 1119 captured members");
    await client.query("SET search_path = tap, public, pg_catalog");
    const definitions = (
      await client.query<{ id: string; name: string; body: string; definition: string }>(`
      SELECT 'routine:$extension:pgtap.' || p.proname || '(' ||
        coalesce((SELECT string_agg('pg_catalog.' || t.typname, ',' ORDER BY a.ordinality)
          FROM unnest(p.proargtypes) WITH ORDINALITY a(oid, ordinality)
          JOIN pg_type t ON t.oid=a.oid), '') || ')' AS id,
        p.proname AS name, p.prosrc AS body, pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='tap' ORDER BY 1
    `)
    ).rows;
    assert.equal(definitions.length, 1079);
    const byId = new Map(definitions.map((entry) => [entry.id, entry]));
    const observations = [];
    for (const member of source.contract.members) {
      if (member.kind !== "routine") continue;
      const definition = byId.get(member.id);
      assert(definition, member.id);
      // Check the installed native declaration against the built versioned upstream source.
      assert(
        upstreamSql.includes(definition.body.trim()) ||
          upstreamSql.replaceAll("''", "'").includes(definition.body.trim()),
        `Native body absent from upstream SQL: ${member.id}`,
      );
      await client.query("BEGIN");
      if (!["plan", "no_plan", "_runner", "runtests"].includes(member.name)) await client.query("SELECT tap.no_plan()");
      if (["finish", "check_test"].includes(member.name)) await client.query("SELECT tap.ok(true, 'fixture')");
      if (member.name === "todo_end") await client.query("SELECT tap.todo_start('fixture')");
      await client.query("DECLARE fixture_cursor CURSOR FOR SELECT 1");
      await client.query("DECLARE fixture_cursor2 CURSOR FOR SELECT 1");
      if (["_do_ne", "_docomp", "_temptypes"].includes(member.name))
        await client.query("CREATE TEMP TABLE have AS SELECT 1; CREATE TEMP TABLE want AS SELECT 1");
      await client.query("SAVEPOINT member");
      const args = member.arguments!.filter(
        (arg) => arg.mode === "in" || arg.mode === "inout" || arg.mode === "variadic",
      );
      const values: (string | number | boolean)[] = args.map((arg) => {
        const type = arg.type.name;
        if (type.startsWith("_")) return "{}";
        if (type === "bool") return true;
        if (type === "int4" || type === "oid") return 1;
        if (type === "numeric") return "1";
        if (type === "anyarray") return "{1,2}";
        if (type === "anyelement") return 1;
        if (type === "name") return "fixture";
        if (type === "regtype") return "pg_catalog.int4";
        if (type === "char" || type === "bpchar") return "v";
        if (type === "refcursor") return "fixture_cursor";
        return "fixture";
      });
      const queryFamilies = [
        "_relcomp",
        "_relne",
        "_temptable",
        "_time_trials",
        "bag_eq",
        "bag_has",
        "bag_hasnt",
        "bag_ne",
        "performs_ok",
        "performs_within",
        "row_eq",
        "set_eq",
        "set_has",
        "set_hasnt",
        "set_ne",
        "results_eq",
        "results_ne",
        "is_empty",
        "isnt_empty",
      ];
      if (queryFamilies.includes(member.name)) {
        args.forEach((arg, i) => {
          if (i < 2 && arg.type.name === "text") values[i] = "SELECT 1";
        });
      }
      if (member.name === "_temptable") values[1] = "fixture_temp";
      if (["_docomp", "_do_ne"].includes(member.name)) {
        values[0] = "have";
        values[1] = "want";
        values[3] = "ALL";
      }
      if (member.name === "_temptypes") values[0] = "have";
      if (member.name === "_relcomp" || member.name === "_relne") values[3] = args.length === 5 ? "INTERSECT" : "ALL";
      if (member.name === "_def_is") {
        values[0] = "1";
        values[1] = "integer";
      }
      if (member.name === "_finish") {
        values[2] = 0;
        values[3] = false;
      }
      if (member.name === "cmp_ok") values[1] = "=";
      if (member.name === "_pg_sv_table_accessible") {
        const row = (
          await client.query("SELECT 'public'::regnamespace::oid AS schema, 'public.fixture'::regclass::oid AS table")
        ).rows[0]!;
        values[0] = row.schema;
        values[1] = row.table;
      }
      if (member.name === "do_tap" && args.length) {
        values[0] = "^no_such_test$";
        if (args.length > 1) {
          values[0] = "public";
          values[1] = "^no_such_test$";
        }
      }
      let cursor = 0;
      args.forEach((arg, i) => {
        if (arg.type.name === "refcursor") values[i] = cursor++ ? "fixture_cursor2" : "fixture_cursor";
      });
      const patternFamily = /^(?:alike|ialike|unalike|unialike|matches|imatches|doesnt_match|doesnt_imatch)$/.test(
        member.name,
      );
      args.forEach((arg, i) => {
        if (patternFamily && arg.type.name === "anyelement") values[i] = "fixture";
      });
      if (member.name === "row_eq") {
        values[0] = "SELECT 1::numeric AS a_time";
        values[1] = "(1)";
      }
      const casts = args.map((arg, i) => {
        const type = arg.type.name;
        if (member.name === "row_eq" && type === "anyelement") return `$${i + 1}::tap._time_trial_type`;
        const concrete =
          type === "anyelement" ? (patternFamily ? "text" : "int4") : type === "anyarray" ? "_int4" : type;
        return `${member.variadic && i === args.length - 1 ? "VARIADIC " : ""}$${i + 1}::pg_catalog.${quote(concrete)}`;
      });
      try {
        const observed = await client.query(
          `SELECT tap.${quote(member.name)}(${casts.join(",")})::text AS value`,
          values,
        );
        observations.push({
          id: member.id,
          sql: `SELECT tap.${quote(member.name)}(${casts.join(",")})::text AS value`,
          values,
          outcome: "returned",
          rows: observed.rows,
          bodySha256: createHash("sha256").update(definition.body).digest("hex"),
        });
      } catch (error) {
        assert(error instanceof Error);
        if (
          member.id === "routine:$extension:pgtap.diag(pg_catalog.anyarray)" &&
          "code" in error &&
          error.code === "42725"
        ) {
          await client.query("ROLLBACK TO SAVEPOINT member");
          // This exact installed SQL body was source-checked above. PostgreSQL's anyelement/anyarray
          // resolver makes the original signature ambiguous; characterize the unchanged body natively.
          const transferredSql = definition.body.replaceAll("$1", "$1::pg_catalog.int4[]");
          const transferred = await client.query(transferredSql, values);
          observations.push({
            id: member.id,
            sql: transferredSql,
            values,
            outcome: "captured-native-transfer",
            rows: transferred.rows.map((row) => ({ value: Object.values(row)[0] })),
            nativeInvocationError: { message: error.message, sqlstate: error.code },
            bodySha256: createHash("sha256").update(definition.body).digest("hex"),
          });
        } else
          observations.push({
            id: member.id,
            values,
            outcome: "native-error",
            message: error.message,
            sqlstate: "code" in error ? error.code : null,
            bodySha256: createHash("sha256").update(definition.body).digest("hex"),
          });
      } finally {
        await client.query("ROLLBACK");
      }
    }
    return {
      digest: native.digest,
      members: native.contract.members.length,
      serverVersion: native.provenance.serverVersion,
      upstreamSqlSha256: createHash("sha256").update(upstreamSql).digest("hex"),
      definitions,
      observations,
    };
  } finally {
    await client.end();
  }
});
await writeFile(output, JSON.stringify(result, null, 2) + "\n");
console.log(
  JSON.stringify({
    output,
    digest: result.digest,
    members: result.members,
    returned: result.observations.filter((entry) => entry.outcome === "returned").length,
    transferred: result.observations.filter((entry) => entry.outcome === "captured-native-transfer").length,
    errors: result.observations.filter((entry) => entry.outcome === "native-error").length,
  }),
);
