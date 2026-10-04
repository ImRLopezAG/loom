import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import {
  createPostgisRasterCodec,
  rasterWkb,
} from "../../../apps/loom/src/core/extensions/adapters/postgis-raster-codecs";
import { createPostgisRaster_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis-raster";
import { geometryEwkt } from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";
import { postgisRasterAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgis_raster";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_raster.json";
import dispositions from "../../../packages/e2e/fixtures/postgis-raster-member-dispositions.json";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const emptyRasterHex =
  "0100000000000000000000f03f000000000000f0bf0000000000002440000000000000344000000000000000000000000000000000e610000002000300";
const descriptor = {
  name: "postgis_raster",
  version: "3.6.4",
  schema: 'rast"q',
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;
const postgis = {
  name: "postgis",
  version: "3.6.4",
  schema: 'rast"q',
  apiSupport: { status: "verified", digest: "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29" },
} as const;

test("PostGIS raster WKB preserves header identity without pixel algorithms", () => {
  const value = rasterWkb(emptyRasterHex);
  expect(value).toMatchObject({
    kind: "raster",
    format: "wkb",
    hex: emptyRasterHex,
    srid: 4326,
    width: 2,
    height: 3,
    numBands: 0,
    scaleX: 1,
    scaleY: -1,
    ipX: 10,
    ipY: 20,
  });
  const codec = createPostgisRasterCodec('rast"q');
  expect(codec.decode(codec.encode(value))).toEqual(value);
  expect(JSON.parse(JSON.stringify(value))).toEqual(value);
  expect(codec.id).toContain("postgis_raster:3.6.4:raster:wkb:1");
});

test("postgis_raster 3.6.4 pins its exact 583-member manifest", () => {
  expect(manifest.digest).toBe("8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2");
  expect(manifest.contract.members).toHaveLength(583);
  expect(postgisRasterAnnotations.map((row) => row.id).sort()).toEqual(
    manifest.contract.members.map((row) => row.id).sort(),
  );
  expect(Object.keys(dispositions.members).sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
  const api = createPostgisRaster_3_6_4(descriptor, postgis);
  expect(
    Object.keys(api.sql.overloads).length + Object.values(dispositions.members).filter((d) => d !== "query").length,
  ).toBe(583);
  expect(api.indexes.hash_raster_ops()).toMatchObject({
    method: "hash",
    opclass: "hash_raster_ops",
    type: "raster",
    default: true,
  });
});

test("postgis_raster rejects unverified, mismatched or wrong-version descriptors", () => {
  // SAFETY: intentionally invalid version bypasses compile-time admission to test runtime rejection.
  expect(() => createPostgisRaster_3_6_4({ ...descriptor, version: "3.6.3" } as never, postgis)).toThrow(/3\.6\.4/);
  expect(() =>
    createPostgisRaster_3_6_4({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } }, postgis),
  ).toThrow(/exact verified/);
  // SAFETY: intentionally incompatible prerequisite tests the runtime version boundary.
  expect(() => createPostgisRaster_3_6_4(descriptor, { ...postgis, version: "3.5.0" } as never)).toThrow(
    /postgis 3\.6\.4/,
  );
  expect(() => createPostgisRaster_3_6_4(descriptor, { ...postgis, schema: "other" })).toThrow(
    /share the PostGIS installation schema/,
  );
});

test("postgis_raster compiles qualified native calls with header codecs and PostGIS geometry", () => {
  const api = createPostgisRaster_3_6_4(descriptor, postgis);
  const raster = rasterWkb(emptyRasterHex);
  const width = api.sql.functions.st_width(raster);
  expect(extensionExpressionContract(width)).toMatchObject({
    member: "routine:$extension:postgis_raster.st_width($extension:postgis_raster.raster)",
  });
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(width);
  expect(query.sql).toContain('"rast""q"."st_width"');
  expect(query.params).toEqual([emptyRasterHex]);
  const point = geometryEwkt("SRID=4326;POINT(10 20)");
  const value = extensionSqlDialect(nodePgCodecs).sqlToQuery(
    api.sql.functions.st_value["($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)"](
      raster,
      point,
    ),
  );
  expect(value.sql).toContain('"rast""q"."st_value"');
  expect(value.params).toEqual([emptyRasterHex, point.text]);
  expect(api.raster.field({ srid: 4326 }).metadata.extension).toMatchObject({
    type: "raster",
    codec: "postgis_raster:3.6.4:raster:wkb:1:srid=4326:width=native:height=native:bands=native",
  });
});

test("postgis_raster preserves captured variadic array calls", () => {
  const api = createPostgisRaster_3_6_4(descriptor, postgis);
  const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
    api.sql.functions.st_reclass["($extension:postgis_raster.raster,$extension:postgis_raster._reclassarg)"](
      rasterWkb(emptyRasterHex),
      { values: [], dimensions: [] },
    ),
  );
  expect(compiled.sql).toContain("variadic");
  expect(compiled.sql).toContain('"rast""q"."reclassarg"[]');
});

test("the confirmed native ST_SetGeoTransform member rejects friendly and canonical alias chains before submission", () => {
  const api = createPostgisRaster_3_6_4(descriptor, postgis);
  const id =
    "routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)";
  const canonical = api.sql.overloads[id];
  expect(api.sql.functions.st_setgeotransform).toBe(canonical);
  for (const call of [canonical, api.sql.functions.st_setgeotransform]) {
    let submitted = 0;
    let failure: unknown;
    try {
      extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`${call(rasterWkb(emptyRasterHex), 1, 1, 0, Math.PI / 2, 10, 20).as("transform")}`,
      );
      submitted++;
    } catch (cause) {
      failure = cause;
    }
    expect(submitted).toBe(0);
    expect(failure).toMatchObject({
      name: "PostgisRasterNativeSafetyError",
      code: "POSTGIS_RASTER_NATIVE_REPAIR_REQUIRED",
      disposition: "safety-rejected",
      member: id,
      nativeSymbol: "RASTER_setGeotransform",
      version: "3.6.4",
      manifestDigest: manifest.digest,
    });
  }
  expect(() =>
    api.sql.functions.st_setgeoreference[
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
    ](rasterWkb(emptyRasterHex), 1, 0, 0, -1, 10, 20),
  ).not.toThrow();
  const annotation = postgisRasterAnnotations.find((row) => row.id === id);
  expect(annotation?.semantics).toMatchObject({
    safetyDisposition: "safety-rejected",
    nativeRepairAcceptance: "pending",
    providerAcceptance: "pending",
  });
});

test("the two confirmed native fixed-sample quantile overloads reject every alias before submission", () => {
  const api = createPostgisRaster_3_6_4(descriptor, postgis);
  const raster = rasterWkb(emptyRasterHex);
  const arrayId =
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)";
  const scalarId =
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)";
  const quantiles = { values: [0.25, 0.5, 0.75], dimensions: [{ length: 3, lowerBound: 1 }] };
  expect(api.sql.functions.st_approxquantile["($extension:postgis_raster.raster,pg_catalog._float8)"]).toBe(
    api.sql.overloads[arrayId],
  );
  expect(
    api.sql.functions.st_approxquantile["($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"],
  ).toBe(api.sql.overloads[scalarId]);
  const calls = [
    { id: arrayId, call: () => api.sql.overloads[arrayId](raster, quantiles) },
    {
      id: arrayId,
      call: () =>
        api.sql.functions.st_approxquantile["($extension:postgis_raster.raster,pg_catalog._float8)"](raster, quantiles),
    },
    { id: arrayId, call: () => api.sql.rows[arrayId]("quantiles", raster, quantiles) },
    { id: scalarId, call: () => api.sql.overloads[scalarId](raster, true, 0.5) },
    {
      id: scalarId,
      call: () =>
        api.sql.functions.st_approxquantile["($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"](
          raster,
          true,
        ),
    },
    { id: scalarId, call: () => api.sql.overloads[scalarId](null, null, null) },
  ];
  for (const { id, call } of calls) {
    let submitted = 0;
    let failure: unknown;
    try {
      call();
      submitted++;
    } catch (cause) {
      failure = cause;
    }
    expect(submitted).toBe(0);
    expect(failure).toMatchObject({
      name: "PostgisRasterNativeSafetyError",
      code: "POSTGIS_RASTER_NATIVE_REPAIR_REQUIRED",
      disposition: "safety-rejected",
      member: id,
      nativeSymbol: "RASTER_quantile",
      version: "3.6.4",
      manifestDigest: manifest.digest,
    });
    expect(postgisRasterAnnotations.find((row) => row.id === id)?.semantics).toMatchObject({
      safetyDisposition: "safety-rejected",
      nativeRepairAcceptance: "pending",
      providerAcceptance: "pending",
    });
  }
  const explicitSample =
    api.sql.functions.st_approxquantile["($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)"];
  expect(extensionSqlDialect(nodePgCodecs).sqlToQuery(explicitSample(raster, 0.5, quantiles)).sql).toContain(
    '"rast""q"."st_approxquantile"',
  );
  expect(() =>
    api.sql.functions.st_quantile["($extension:postgis_raster.raster,pg_catalog._float8)"](raster, quantiles),
  ).not.toThrow();
});

test("the two raster-reference resample signatures retain positional native overload identity and exact defaults", () => {
  const api = createPostgisRaster_3_6_4(descriptor, postgis);
  const raster = rasterWkb(emptyRasterHex);
  const boolFirst =
    api.sql.functions.st_resample[
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.text,pg_catalog.float8)"
    ];
  const textFirst =
    api.sql.functions.st_resample[
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"
    ];
  for (const expression of [
    boolFirst(raster, raster, true, "NearestNeighbor", 0.125),
    textFirst(raster, raster, "NearestNeighbor", 0.125, true),
    textFirst(raster, raster, undefined, 0.2, false),
  ]) {
    const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
    expect(query.sql).not.toContain("=>");
  }
  const defaults = extensionSqlDialect(nodePgCodecs).sqlToQuery(textFirst(raster, raster));
  expect(defaults.sql).toContain("'NearestNeighbour'::text");
  expect(defaults.sql).toContain("0.125");
  expect(defaults.sql).toContain("true");
});

test("raster snap-to-grid and transform aliases preserve their positional overload identity", () => {
  const api = createPostgisRaster_3_6_4(descriptor, postgis);
  const raster = rasterWkb(emptyRasterHex);
  const snap =
    api.sql.functions.st_snaptogrid[
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
    ];
  const transform =
    api.sql.functions.st_transform[
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
    ];
  for (const expression of [
    snap(raster, 10, 20, undefined, 0.2, 1, -1),
    transform(raster, 4326, undefined, 0.2, 1, -1),
  ]) {
    const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
    expect(query.sql).not.toContain("=>");
    expect(query.sql).toContain("'NearestNeighbour'::text");
  }
});
