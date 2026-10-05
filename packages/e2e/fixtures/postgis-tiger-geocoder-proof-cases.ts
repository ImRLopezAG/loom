import type { ExtensionProofCase, ExtensionProofFamily } from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const POSTGIS_TIGER_GEOCODER_DIGEST =
  "8afcc1fb470670f2a40780b473a8e35afe9172eb79cc8bab7391732503bfd966";

export const postgisTigerGeocoderProofFamily = {
  extension: "postgis_tiger_geocoder",
  version: "3.6.4",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: POSTGIS_TIGER_GEOCODER_DIGEST,
} as const satisfies ExtensionProofFamily;

export const postgisTigerGeocoderUnitProofCases = [
  {
    id: "postgis_tiger_geocoder.unit-contracts",
    title: "postgis_tiger_geocoder exact 894-member digest dispositions and factory identity",
  },
  {
    id: "postgis_tiger_geocoder.unit-transport",
    title: "norm_addy composite NULL Unicode type IO without a JS geocoding algorithm",
  },
  {
    id: "postgis_tiger_geocoder.unit-sql",
    title: "geocode normalize reverse interpolate and settings bind exact captured overloads",
  },
].map(
  (entry) =>
    ({
      ...entry,
      file: "packages/tests/unit/extensions-postgis-tiger-geocoder.test.ts",
      gate: "unit",
      families: [postgisTigerGeocoderProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const postgisTigerGeocoderTypesProofCase = {
  id: "postgis_tiger_geocoder.types-contracts",
  file: "packages/tests/types/extensions-postgis-tiger-geocoder.test-d.ts",
  title: "postgis_tiger_geocoder public exact-version overloads composite fields and rows",
  gate: "types",
  families: [postgisTigerGeocoderProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const postgisTigerGeocoderGenerationProofCase = {
  id: "postgis_tiger_geocoder.generation-contracts",
  file: "packages/e2e/integration/extension-adapter-codegen-postgis-tiger-geocoder.test.ts",
  title:
    "postgis_tiger_geocoder public initializeProject/loadProject/generateProject first-load and disk retain selected/default/custom/empty/future host and mounted RPC/Effect",
  gate: "generation",
  families: [postgisTigerGeocoderProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const postgisTigerGeocoderConsumerProofCase = {
  id: "postgis_tiger_geocoder.consumer-contracts",
  file: "packages/e2e/integration/packed-postgis-tiger-geocoder.test.ts",
  title:
    "postgis_tiger_geocoder no-install prepared isolated frozen consumer generateProject, retained artifact+lock, UUID journal and native RPC/Effect",
  gate: "consumer",
  families: [postgisTigerGeocoderProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
