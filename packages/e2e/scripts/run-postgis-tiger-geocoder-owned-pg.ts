import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POSTGIS_TIGER_CUSTOM_POSTGIS_SCHEMA } from "../fixtures/postgis-tiger-geocoder-generated-project.ts";
import { startPostgisTigerGeocoderOwnedPg } from "../fixtures/postgis-tiger-geocoder-owned-pg.ts";

const fixture = await startPostgisTigerGeocoderOwnedPg();
try {
  const selectedUrl = await fixture.provision("public");
  let customInstall: string | { error: string } = { error: "not-attempted" };
  try {
    customInstall = await fixture.provision(POSTGIS_TIGER_CUSTOM_POSTGIS_SCHEMA);
  } catch (error) {
    customInstall = { error: error instanceof Error ? error.message : String(error) };
    await fixture.journal("native-condition", {
      condition: "non-public PostGIS schema cannot install postgis_tiger_geocoder 3.6.4",
      postgisSchema: POSTGIS_TIGER_CUSTOM_POSTGIS_SCHEMA,
      error: customInstall.error,
    });
  }
  await writeFile(
    join(tmpdir(), "loom-postgis-tiger-geocoder-owned-pg-receipt.json"),
    JSON.stringify(
      {
        gate: "owned-local-pg",
        journal: fixture.journalFile,
        selectedUrlHost: new URL(selectedUrl).hostname,
        selectedPostgisSchema: "public",
        customSchema: POSTGIS_TIGER_CUSTOM_POSTGIS_SCHEMA,
        customInstall,
        loaderExecuted: false,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(`tiger owned UUID PG provisioned; journal=${fixture.journalFile}`);
} finally {
  await fixture.stop();
  await fixture.proveAbsent();
}
