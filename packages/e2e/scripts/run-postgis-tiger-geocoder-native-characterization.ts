import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import source from "../../../apps/loom/src/tooling/extensions/manifests/postgis_tiger_geocoder.json";

/**
 * Native postgis_tiger_geocoder 3.6.4 characterization.
 * Empty TIGER data tables stay empty. Loader script text is captured, never executed.
 * No census.gov or other provider/network fetch.
 */
const url = process.env.LOOM_POSTGIS_TIGER_GEOCODER_NATIVE_URL;
if (!url) throw new Error("pending gate: postgis_tiger_geocoder.native-characterization requires LOOM_POSTGIS_TIGER_GEOCODER_NATIVE_URL");

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const major = await client.query<{ server_version_num: string }>("SHOW server_version_num");
  assert.equal(Math.floor(Number(major.rows[0]?.server_version_num) / 10000), 18);
  await client.query("CREATE EXTENSION IF NOT EXISTS fuzzystrmatch");
  await client.query("CREATE EXTENSION IF NOT EXISTS postgis VERSION '3.6.4'");
  await client.query("CREATE EXTENSION postgis_tiger_geocoder VERSION '3.6.4'");
  const installed = await client.query<{ extname: string; extversion: string; nspname: string }>(
    `SELECT e.extname, e.extversion, n.nspname
     FROM pg_catalog.pg_extension e
     JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
     WHERE e.extname = ANY($1::text[])
     ORDER BY e.extname`,
    [["fuzzystrmatch", "postgis", "postgis_tiger_geocoder"]],
  );
  const byName = Object.fromEntries(installed.rows.map((row) => [row.extname, row]));
  assert.equal(byName.postgis?.extversion, "3.6.4");
  assert.equal(byName.postgis_tiger_geocoder?.extversion, "3.6.4");
  assert.equal(byName.postgis_tiger_geocoder?.nspname, "tiger");
  assert.ok(byName.fuzzystrmatch);
  const observed = await captureExtensionContract(client, {
    name: "postgis_tiger_geocoder",
    provider: "neon",
    fixture: "owned-local-pg18-postgis-tiger-geocoder-3.6.4",
  });
  const identity = {
    expectedDigest: source.digest,
    observedDigest: observed.digest,
    expectedMembers: source.contract.members.length,
    observedMembers: observed.contract.members.length,
    exactContract: JSON.stringify(observed.contract) === JSON.stringify(source.contract),
    version: "3.6.4",
    schema: "tiger",
    relocatable: false,
  };
  assert.equal(observed.digest, source.digest);
  assert.equal(observed.contract.members.length, 894);
  assert.equal(identity.exactContract, true);

  const emptyCounts = await client.query<{ relation: string; n: string }>(
    `SELECT unnest(ARRAY['addr','addrfeat','edges','faces','featnames','place','county','state']) AS relation,
            unnest(ARRAY[
              (SELECT count(*)::text FROM tiger.addr),
              (SELECT count(*)::text FROM tiger.addrfeat),
              (SELECT count(*)::text FROM tiger.edges),
              (SELECT count(*)::text FROM tiger.faces),
              (SELECT count(*)::text FROM tiger.featnames),
              (SELECT count(*)::text FROM tiger.place),
              (SELECT count(*)::text FROM tiger.county),
              (SELECT count(*)::text FROM tiger.state)
            ]) AS n`,
  );
  const lookupCounts = await client.query<{ relation: string; n: string }>(
    `SELECT unnest(ARRAY['state_lookup','street_type_lookup','direction_lookup','secondary_unit_lookup']) AS relation,
            unnest(ARRAY[
              (SELECT count(*)::text FROM tiger.state_lookup),
              (SELECT count(*)::text FROM tiger.street_type_lookup),
              (SELECT count(*)::text FROM tiger.direction_lookup),
              (SELECT count(*)::text FROM tiger.secondary_unit_lookup)
            ]) AS n`,
  );

  const nullNormalize = await client.query("SELECT tiger.normalize_address(NULL) AS value");
  const emptyNormalize = await client.query("SELECT tiger.normalize_address('') AS value");
  const parsed = await client.query(
    "SELECT tiger.normalize_address($1) AS value, tiger.pprint_addy(tiger.normalize_address($1)) AS pretty",
    ["26 Court Street, Boston, MA 02108"],
  );
  const emptyGeocode = await client.query(
    "SELECT addy, geomout, rating FROM tiger.geocode($1, 1, NULL::geometry)",
    ["26 Court Street, Boston, MA 02108"],
  );
  const emptyReverse = await client.query(
    "SELECT intpt, addy, street FROM tiger.reverse_geocode(public.ST_SetSRID(public.ST_MakePoint(-71.057811, 42.358274), 4269), false)",
  );
  let pagcError: string | null = null;
  try {
    await client.query("SELECT tiger.pagc_normalize_address($1)", ["26 Court Street, Boston, MA 02108"]);
  } catch (error) {
    pagcError = error instanceof Error ? error.message : String(error);
  }
  const setting = await client.query("SELECT tiger.get_geocode_setting('debug_geocode_address') AS value");
  const utmzone = await client.query("SELECT tiger.utmzone('SRID=4269;POINT(-71.057811 42.358274)'::geometry) AS value");
  const interpolated = await client.query(
    "SELECT ST_AsEWKT(tiger.interpolate_from_address(15,'10','20','SRID=4269;LINESTRING(-71.06 42.35,-71.05 42.35)'::geometry)) AS value",
  );
  const loader = await client.query("SELECT tiger.loader_macro_replace($1, $2::text[], $3::text[]) AS value", [
    "echo ${state}",
    ["state"],
    ["MA"],
  ]);
  const generated = await client.query("SELECT tiger.loader_generate_nation_script('sh') AS value LIMIT 1");
  const generatedText = String(generated.rows[0]?.value ?? "");
  assert.equal(loader.rows[0]?.value, "echo MA");
  assert.match(generatedText, /wget|curl|ftp/i);
  assert.doesNotMatch(generatedText, /executed|downloaded/i);

  const characterization = {
    identity,
    emptyCounts: Object.fromEntries(emptyCounts.rows.map((row) => [row.relation, Number(row.n)])),
    lookupCounts: Object.fromEntries(lookupCounts.rows.map((row) => [row.relation, Number(row.n)])),
    nullNormalize: nullNormalize.rows[0]?.value ?? null,
    emptyNormalize: emptyNormalize.rows[0]?.value ?? null,
    normalize: parsed.rows[0] ?? null,
    emptyGeocode: emptyGeocode.rows,
    emptyReverse: emptyReverse.rows[0] ?? null,
    pagcWithoutAddressStandardizer: pagcError,
    debugSetting: setting.rows[0]?.value ?? null,
    utmzone: utmzone.rows[0]?.value == null ? null : Number(utmzone.rows[0].value),
    interpolateFromConstructedLine: interpolated.rows[0]?.value ?? null,
    emptyGeocodeCount: emptyGeocode.rows.length,
    loaderMacroReplace: loader.rows[0]?.value ?? null,
    loaderGenerateNationScriptContainsFetchTool: /wget|curl/i.test(generatedText),
    loaderGenerateNationScriptExecuted: false,
    notes: [
      "TIGER data tables are empty until an operator loads owned fixture rows.",
      "loader_* scripts emit fetch commands; this characterization never runs them.",
      "pagc_normalize_address requires optional address_standardizer; native error is recorded.",
    ],
  };
  const output = process.env.LOOM_POSTGIS_TIGER_GEOCODER_CHARACTERIZATION_OUTPUT;
  if (output) await writeFile(output, `${JSON.stringify(characterization, null, 2)}\n`);
  console.log(JSON.stringify(characterization, null, 2));
} finally {
  await client.end();
}
