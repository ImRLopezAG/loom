import { sql, type SQL } from "drizzle-orm";
import {
  createPostgisTigerGeocoder_3_6_4,
  type PostgisTigerGeocoderNormAddy,
} from "../../../apps/loom/src/core/extensions/adapters/postgis-tiger-geocoder";
import { POSTGIS_TIGER_GEOCODER_DIGEST } from "../../e2e/fixtures/postgis-tiger-geocoder-proof-cases";

const api = createPostgisTigerGeocoder_3_6_4(
  {
    name: "postgis_tiger_geocoder",
    version: "3.6.4",
    schema: "tiger",
    apiSupport: { status: "verified", digest: POSTGIS_TIGER_GEOCODER_DIGEST },
  },
  { schema: "public" },
);
const addy: PostgisTigerGeocoderNormAddy = {
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
};
const normalized: SQL<PostgisTigerGeocoderNormAddy | null> = api.normalizeAddress("26 Court Street, Boston, MA 02108");
const pretty: SQL<string | null> = api.prettyAddress(addy);
const geocoded = api.geocode("26 Court Street, Boston, MA 02108");
const fromAddy = api.geocode(addy);
const reversed = api.reverseGeocode("SRID=4269;POINT(-71.057811 42.358274)");
const interpolated: SQL<string | null> = api.interpolateFromAddress(15, "10", "20", "SRID=4269;LINESTRING(-71.06 42.35,-71.05 42.35)");
api.codec.encode(addy);
api.state_lookupRows("states");
void sql`${normalized} ${pretty} ${geocoded} ${fromAddy} ${reversed} ${interpolated}`;
// @ts-expect-error Wrong selected version is rejected statically.
createPostgisTigerGeocoder_3_6_4({ ...api, version: "3.6.3" }, { schema: "public" });
// @ts-expect-error A caller cannot select a result type.
api.normalizeAddress<string>("26 Court Street");
