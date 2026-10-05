import { extensionProofTest } from "../fixtures/extension-proof";
import { postgisTigerGeocoderConsumerProofCase } from "../fixtures/postgis-tiger-geocoder-proof-cases";
import { runPostgisTigerGeocoderPreparedConsumer } from "../fixtures/postgis-tiger-geocoder-prepared-consumer";

extensionProofTest(postgisTigerGeocoderConsumerProofCase, runPostgisTigerGeocoderPreparedConsumer, 600000);
