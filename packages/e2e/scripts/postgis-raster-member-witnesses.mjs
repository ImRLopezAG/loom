// Focused local source characterization. This is not a generation or packed-consumer gate.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile, appendFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as v from "valibot";
import {
  createPostgisRaster_3_6_4,
  PostgisRasterNativeSafetyError,
} from "../../../apps/loom/src/core/extensions/adapters/postgis-raster.ts";
import { getColumnFromDecoder } from "drizzle-orm/utils";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql.ts";
import { withPostgisRasterOperations } from "../../../apps/loom/src/tooling/extensions/operations/postgis_raster.ts";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_raster.json" with { type: "json" };
import postgis from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json" with { type: "json" };
import dispositions from "../fixtures/postgis-raster-member-dispositions.json" with { type: "json" };
import nativeSafety from "../fixtures/postgis-raster-native-safety-evidence.json" with { type: "json" };

const [container, output] = process.argv.slice(2);
assert(container && output, "usage: <owned-container> <output.json>");
const port = execFileSync("docker", ["port", container, "5432/tcp"], { encoding: "utf8" }).trim().split(":").at(-1);
const database = `raster_${randomUUID().replaceAll("-", "")}`;
const baseUrl = `postgresql://postgres:raster-local@127.0.0.1:${port}/postgres`;
const admin = new pg.Client({ connectionString: baseUrl });
await admin.connect();
await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
const url = baseUrl.replace(/postgres$/, database);
const client = new pg.Client({ connectionString: url });
const schema = "Raster 日本",
  s = pg.escapeIdentifier(schema);
const descriptor = {
  name: "postgis_raster",
  version: "3.6.4",
  schema,
  apiSupport: { status: "verified", digest: manifest.digest },
};
const dependency = {
  name: "postgis",
  version: "3.6.4",
  schema,
  apiSupport: { status: "verified", digest: postgis.digest },
};
const api = createPostgisRaster_3_6_4(descriptor, dependency);
const dialect = extensionSqlDialect(nodePgCodecs);
const results = [],
  codecResults = [],
  operationResults = [],
  safetyResults = [];
const members = manifest.contract.members;
const rejectedMembers = new Set([nativeSafety.member, ...nativeSafety.quantileSafety.members]);
function nativeType(type) {
  const ns = type.namespace.startsWith("$extension:") ? s : pg.escapeIdentifier(type.namespace);
  return `${ns}.${pg.escapeIdentifier(type.name.startsWith("_") ? type.name.slice(1) : type.name)}${type.name.startsWith("_") ? "[]" : ""}`;
}
const raster = `${s}.st_addband(${s}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326),'8BUI'::text,7::float8,0::float8)`;
const geometry = `${s}.st_geomfromewkt('SRID=4326;POINT(10.5 19.5)')`;
function value(argument, member, positive) {
  const t = argument.type,
    name = argument.name ?? "";
  if (!positive) return `NULL::${nativeType(t)}`;
  if (t.name === "raster") return raster;
  if (t.name === "geometry") return geometry;
  if (t.name === "bytea") return `${s}.st_asbinary(${raster})`;
  if (t.name === "regprocedure")
    return `${pg.escapeLiteral(`${schema}.st_sum4ma(double precision[],integer[],text[])`)}::regprocedure`;
  if (t.name === "regclass") return `${pg.escapeLiteral(`${s}.tiles`)}::regclass`;
  if (t.name === "bool") return "true::bool";
  if (t.name === "int4") return `${/srid/i.test(name) ? 4326 : /width|height|tile/i.test(name) ? 2 : 1}::int4`;
  if (t.name === "float8")
    return `${/theta_ij/.test(name) ? Math.PI / 2 : /skew|theta_i|grid|maxerr/.test(name) ? 0 : /scale.*y/i.test(name) ? -1 : /upperleft.*x|xoffset/i.test(name) ? 10 : /upperleft.*y|yoffset/i.test(name) ? 20 : /quantile|percent|sample/i.test(name) ? 0.5 : 1}::float8`;
  if (t.name === "_float8") return "ARRAY[0.25,0.5,0.75]::float8[]";
  if (t.name === "_int4") return "ARRAY[1]::int4[]";
  if (t.name === "_text") return /constraints/.test(member.name) ? "ARRAY['srid']::text[]" : "ARRAY[]::text[]";
  if (t.name === "_raster") return `ARRAY[${raster}]`;
  if (t.name === "_reclassarg") return `ARRAY[ROW(1,'0-10:1-10','8BUI',0)::${s}.reclassarg]`;
  if (t.name === "_addbandarg") return `ARRAY[ROW(1,'8BUI',7,0)::${s}.addbandarg]`;
  if (t.name === "_rastbandarg") return `ARRAY[ROW(${raster},1)::${s}.rastbandarg]`;
  if (t.name === "_unionarg") return `ARRAY[ROW(1,'LAST')::${s}.unionarg]`;
  if (["text", "name", "bpchar"].includes(t.name)) {
    const text = /pixeltype/.test(name)
      ? "8BUI"
      : /extenttype/.test(name)
        ? "FIRST"
        : /uniontype/.test(name)
          ? "LAST"
          : /algorithm|resample/.test(name)
            ? "NearestNeighbor"
            : /expression/.test(name)
              ? "[rast.val]+1"
              : /georef/.test(name)
                ? "1 0 0 -1 10 20"
                : /format/.test(name)
                  ? member.name === "st_setgeoreference"
                    ? "GDAL"
                    : "GTiff"
                  : /width|height/.test(name)
                    ? "2"
                    : /reclass/.test(name)
                      ? "0-10:1-10"
                      : /schema/.test(name)
                        ? schema
                        : /table|coverage/.test(name)
                          ? "tiles"
                          : /col/.test(name)
                            ? "rast"
                            : "";
    return `${pg.escapeLiteral(text)}::${nativeType(t)}`;
  }
  return `NULL::${nativeType(t)}`;
}
async function run(query, params = []) {
  try {
    const rows = (await client.query(query, params)).rows;
    return { ok: true, values: rows.map((row) => row.value) };
  } catch (error) {
    if (!(error instanceof pg.DatabaseError)) throw error;
    return { ok: false, sqlstate: error.code, message: error.message };
  }
}
try {
  await client.connect();
  await client.query(
    `CREATE SCHEMA ${s}; CREATE EXTENSION postgis WITH SCHEMA ${s} VERSION '3.6.4'; CREATE EXTENSION postgis_raster WITH SCHEMA ${s} VERSION '3.6.4'; SET search_path=${s},pg_catalog; SET statement_timeout='5s'`,
  );
  await client.query(
    `CREATE TABLE ${s}.tiles(rast ${s}.raster); INSERT INTO ${s}.tiles SELECT ${raster}; CREATE INDEX tiles_hash ON ${s}.tiles USING hash(rast)`,
  );
  for (const member of members.filter((m) => dispositions.members[m.id] === "query")) {
    // The retained native crash is authoritative: test the rejection without an oracle reprobe.
    if (rejectedMembers.has(member.id)) {
      assert.throws(
        () => api.sql.overloads[member.id](...member.arguments.map(() => sql.raw("NULL"))),
        PostgisRasterNativeSafetyError,
      );
      safetyResults.push({
        member: member.id,
        disposition: "safety-rejected",
        submitted: false,
        nativeRepairAcceptance: "pending",
      });
      continue;
    }
    for (const positive of [false, true]) {
      let args, raw;
      if (member.kind === "routine") {
        args = member.arguments
          .filter((a) => ["in", "inout", "variadic"].includes(a.mode))
          .map((a) => value(a, member, positive));
        raw = `${s}.${pg.escapeIdentifier(member.name)}(${args.map((v, i) => (member.arguments.filter((a) => ["in", "inout", "variadic"].includes(a.mode))[i].mode === "variadic" ? `VARIADIC ${v}` : v)).join(",")})`;
      } else if (member.kind === "cast") {
        args = [positive ? raster : `NULL::${s}.raster`];
        raw = `(${args[0]})::${nativeType(member.target)}`;
      } else {
        args = [member.left, member.right].filter(Boolean).map((type) => value({ type }, member, positive));
        raw = `(${args[0]} OPERATOR(${s}.${member.name}) ${args[1]})`;
      }
      await writeFile(output + ".intent.json", JSON.stringify({ database, member: member.id, positive, raw }));
      const oracle = await run(`SELECT (${raw})::text AS value`);
      let compiled, observed, decoded, expression;
      try {
        expression = api.sql.overloads[member.id](...args.map((v) => sql.raw(v)));
        // Use the captured codec's transport rather than forcing native booleans to text.
        const codec = getColumnFromDecoder(expression);
        const projection = codec?.codec === "loom:extension:text" ? sql`(${expression})::text` : expression;
        compiled = dialect.sqlToQuery(sql`SELECT ${projection} AS value`);
        observed = await run(compiled.sql, compiled.params);
        if (observed.ok)
          decoded = dialect.mapperGenerators.rows(
            [{ path: ["value"], field: expression }],
            {},
          )(observed.values.map((v) => [v]));
      } catch (error) {
        observed = { ok: false, message: error.message };
      }
      const observedText = observed.ok
        ? await run(`SELECT (${dialect.sqlToQuery(expression).sql})::text AS value`)
        : observed;
      const matched =
        oracle.ok === observed.ok &&
        (oracle.ok
          ? JSON.stringify(oracle.values) === JSON.stringify(observedText.values)
          : oracle.message === observed.message);
      results.push({
        member: member.id,
        scenario: positive ? "native-values" : "native-null",
        raw,
        compiled: compiled?.sql,
        oracle,
        observed,
        decoded,
        matched,
      });
      await appendFile(
        output + ".cases.jsonl",
        JSON.stringify(results.at(-1), (_, value) => (v.is(v.bigint(), value) ? `${value}n` : value)) + "\n",
      );
    }
  }
  // Every published type codec is independently decoded from native text and re-encoded into PostgreSQL.
  for (const member of members.filter((m) => m.kind === "type")) {
    const codec = api.codecs[member.name];
    const t = nativeType({ namespace: member.namespace, name: member.name });
    const expr =
      member.name === "raster"
        ? raster
        : member.name === "_raster"
          ? `ARRAY[${raster}]`
          : member.name.startsWith("_")
            ? `'{}'::${t}`
            : `ROW(${member.attributes.map((a) => `NULL::${nativeType(a.type)}`).join(",")})::${t}`;
    const raw = (await client.query(`SELECT (${expr})::text AS value`)).rows[0].value;
    const decoded = codec.decode(raw),
      encoded = codec.encode(decoded);
    const roundtrip = (await client.query(`SELECT ($1::${t})::text AS value`, [encoded])).rows[0].value;
    assert.equal(roundtrip, raw, member.id);
    codecResults.push({ member: member.id, raw, roundtrip, matched: true });
  }
  for (const id of Object.keys(dispositions.members).filter((id) => dispositions.members[id] === "tooling")) {
    await withPostgisRasterOperations(url, descriptor, dependency, async (session) => {
      const operation = session[id];
      if (id.includes(".st_createoverview(")) {
        await client.query(
          `CREATE TABLE public.raster_tiles(rast ${s}.raster); INSERT INTO public.raster_tiles SELECT ${raster}; SELECT ${s}.addrasterconstraints('public'::name,'raster_tiles'::name,'rast'::name)`,
        );
      }
      const member = members.find((m) => m.id === id);
      const args = member.arguments
        .filter((a) => ["in", "inout", "variadic"].includes(a.mode))
        .map((a) => value(a, member, true));
      if (member.name === "st_createoverview")
        args.splice(
          0,
          args.length,
          "'public.raster_tiles'::regclass",
          "'rast'::name",
          "2::int4",
          "'NearestNeighbor'::text",
        );
      if (member.name === "st_retile")
        args.splice(
          0,
          args.length,
          `${pg.escapeLiteral(`${s}.tiles`)}::regclass`,
          "'rast'::name",
          `${s}.st_envelope(${raster})`,
          "1::float8",
          "-1::float8",
          "1::int4",
          "1::int4",
          "'NearestNeighbor'::text",
        );
      if (member.name.includes("overview") && !member.name.startsWith("st_")) {
        // Explicit overview constraints need the independently created native overview relation.
        args.splice(
          0,
          args.length,
          ...member.arguments
            .filter((a) => ["in", "inout", "variadic"].includes(a.mode))
            .map((a) =>
              a.type.name === "int4"
                ? "2::int4"
                : a.name?.startsWith("o_")
                  ? pg.escapeLiteral(
                      a.name.includes("schema") ? schema : a.name.includes("column") ? "rast" : "overview",
                    ) + "::name"
                  : a.name?.startsWith("r_")
                    ? pg.escapeLiteral(
                        a.name.includes("schema") ? schema : a.name.includes("column") ? "rast" : "tiles",
                      ) + "::name"
                    : value(a, member, true),
            ),
        );
      }
      try {
        const result = await operation(...args.map((v) => sql.raw(v)));
        if (member.name === "st_retile") {
          const oracle = (await client.query(`SELECT count(*)::int AS count FROM ${s}.st_retile(${args.join(",")})`))
            .rows[0].count;
          assert.equal(result.length, oracle);
          assert(oracle > 1, "retile fixture must prove multiple native rows");
        }
        operationResults.push({ member: id, ok: true, result });
      } catch (error) {
        operationResults.push({ member: id, ok: false, message: error.message });
        throw error;
      }
    }).catch(() => {});
  }
  const mismatches = results.filter((r) => !r.matched);
  const receipt = {
    database,
    schema,
    manifestDigest: manifest.digest,
    members: 583,
    results,
    codecResults,
    operationResults,
    safetyResults,
    mismatches,
    sourceCharacterization: true,
    generationAcceptance: false,
    consumerAcceptance: false,
  };
  await writeFile(
    output,
    JSON.stringify(receipt, (_, value) => (v.is(v.bigint(), value) ? `${value}n` : value), 2),
  );
  console.log(
    JSON.stringify({
      results: results.length,
      matches: results.length - mismatches.length,
      positiveNativeSuccess: results.filter((r) => r.scenario === "native-values" && r.oracle.ok).length,
      codecs: codecResults.length,
      operations: operationResults.length,
      mismatches: mismatches.map((r) => ({
        member: r.member,
        scenario: r.scenario,
        oracle: r.oracle,
        observed: r.observed,
      })),
    }),
  );
  assert.equal(mismatches.length, 0);
} finally {
  await client.end();
  await admin.query(`DROP DATABASE ${pg.escapeIdentifier(database)} WITH (FORCE)`);
  await admin.end();
}
