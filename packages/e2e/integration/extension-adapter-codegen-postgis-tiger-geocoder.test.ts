import { extensionProofTest } from "../fixtures/extension-proof";
import { postgisTigerGeocoderGenerationProofCase } from "../fixtures/postgis-tiger-geocoder-proof-cases";
import { runPostgisTigerGeocoderPublicGeneration } from "../fixtures/postgis-tiger-geocoder-public-generation";

extensionProofTest(
  postgisTigerGeocoderGenerationProofCase,
  async () => {
    await runPostgisTigerGeocoderPublicGeneration();
  },
  600000,
);
