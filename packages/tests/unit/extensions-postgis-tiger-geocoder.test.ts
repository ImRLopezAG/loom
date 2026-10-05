import { expect } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  POSTGIS_TIGER_GEOCODER_DIGEST,
  postgisTigerGeocoderUnitProofCases,
} from "../../e2e/fixtures/postgis-tiger-geocoder-proof-cases";
import { createPostgisTigerGeocoder_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis-tiger-geocoder";
import { postgisTigerGeocoderAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgis_tiger_geocoder";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_tiger_geocoder.json";
import nativeCharacterization from "../../e2e/fixtures/postgis-tiger-geocoder-native-characterization.json";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const descriptor = {
  name: "postgis_tiger_geocoder",
  version: "3.6.4",
  schema: "tiger",
  apiSupport: { status: "verified" as const, digest: POSTGIS_TIGER_GEOCODER_DIGEST },
} as const;
const postgis = { schema: "public" } as const;

extensionProofUnitTest(postgisTigerGeocoderUnitProofCases[0]!, () => {
  const api = createPostgisTigerGeocoder_3_6_4(descriptor, postgis);
  const ids = manifest.contract.members.map((row) => row.id).sort();
  expect(manifest.digest).toBe(POSTGIS_TIGER_GEOCODER_DIGEST);
  expect(manifest.contract.version).toBe("3.6.4");
  expect(manifest.contract.members).toHaveLength(894);
  expect(manifest.contract.installation).toEqual({ relocatable: false, fixedSchema: "tiger" });
  expect(nativeCharacterization.identity.observedDigest).toBe(POSTGIS_TIGER_GEOCODER_DIGEST);
  expect(nativeCharacterization.identity.exactContract).toBe(true);
  expect(nativeCharacterization.identity.observedMembers).toBe(894);
  expect(postgisTigerGeocoderAnnotations.map((row) => row.id).sort()).toEqual(ids);
  expect(new Set(postgisTigerGeocoderAnnotations.map((row) => row.id)).size).toBe(894);
  const queryRoutines = postgisTigerGeocoderAnnotations
    .filter((row) => row.disposition === "query" && row.id.startsWith("routine:"))
    .map((row) => row.id)
    .sort();
  expect(Object.keys(api.sql.overloads).sort()).toEqual(queryRoutines);
  expect(nativeCharacterization.emptyCounts).toEqual({
    addr: 0,
    addrfeat: 0,
    edges: 0,
    faces: 0,
    featnames: 0,
    place: 0,
    county: 0,
    state: 0,
  });
  expect(nativeCharacterization.lookupCounts.state_lookup).toBe(59);
  expect(nativeCharacterization.loaderGenerateNationScriptExecuted).toBe(false);
  expect(nativeCharacterization.pagcWithoutAddressStandardizer).toMatch(/parse_address/);
  for (const wrong of [
    { ...descriptor, apiSupport: { status: "verified" as const, digest: "wrong" } },
    { ...descriptor, apiSupport: { status: "unverified" as const } },
    { ...descriptor, version: "3.6.3" },
  ])
    expect(() => createPostgisTigerGeocoder_3_6_4(wrong as never, postgis)).toThrow(/exact verified contract/);
  for (const row of postgisTigerGeocoderAnnotations) {
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
  }
});

extensionProofUnitTest(postgisTigerGeocoderUnitProofCases[1]!, () => {
  const api = createPostgisTigerGeocoder_3_6_4(descriptor, postgis);
  const empty = api.codec.decode("(,,,,,,,,,,,)");
  expect(empty.parsed).toBeNull();
  expect(empty.streetname).toBeNull();
  const nativeEmpty = api.codec.decode(nativeCharacterization.emptyNormalize);
  expect(nativeEmpty.parsed).toBe(true);
  expect(nativeEmpty.streetname).toBe("");
  const native = api.codec.decode(nativeCharacterization.normalize.value);
  expect(native).toEqual({
    address: 26,
    predirabbrev: null,
    streetname: "Court",
    streettypeabbrev: "St",
    postdirabbrev: null,
    internal: null,
    location: "Boston",
    stateabbrev: "MA",
    zip: "02108",
    parsed: true,
    zip4: null,
    address_alphanumeric: "26",
  });
  expect(api.codec.decode(api.codec.encode(native))).toEqual(native);
  const unicode = { ...native, location: '東京 "通り"', internal: "a\\b" };
  expect(api.codec.decode(api.codec.encode(unicode))).toEqual(unicode);
  expect(() => api.codec.decode("(1,2)")).toThrow();
  expect(() => api.codec.decode("not-a-record")).toThrow();
});

extensionProofUnitTest(postgisTigerGeocoderUnitProofCases[2]!, () => {
  const api = createPostgisTigerGeocoder_3_6_4(descriptor, postgis);
  const normalize = api.sql.functions.normalize_address("26 Court Street, Boston, MA 02108");
  expect(extensionExpressionContract(normalize)?.member).toBe(
    "routine:$extension:postgis_tiger_geocoder.normalize_address(pg_catalog.varchar)",
  );
  const geocode = api.sql.functions.geocode("26 Court Street, Boston, MA 02108");
  expect(extensionExpressionContract(geocode)?.member).toBe(
    "routine:$extension:postgis_tiger_geocoder.geocode(pg_catalog.varchar,pg_catalog.int4,$extension:postgis.geometry)",
  );
  const reverse = api.sql.functions.reverse_geocode("SRID=4269;POINT(-71.057811 42.358274)");
  expect(extensionExpressionContract(reverse)?.member).toBe(
    "routine:$extension:postgis_tiger_geocoder.reverse_geocode($extension:postgis.geometry,pg_catalog.bool)",
  );
  const interpolate = api.sql.functions.interpolate_from_address(
    15,
    "10",
    "20",
    "SRID=4269;LINESTRING(-71.06 42.35,-71.05 42.35)",
  );
  expect(extensionExpressionContract(interpolate)?.member).toBe(
    "routine:$extension:postgis_tiger_geocoder.interpolate_from_address(pg_catalog.int4,pg_catalog.varchar,pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.varchar,pg_catalog.float8)",
  );
  const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(geocode);
  expect(compiled.sql).toContain("geocode");
  expect(compiled.sql).not.toMatch(/census\.gov|wget|curl/i);
});
