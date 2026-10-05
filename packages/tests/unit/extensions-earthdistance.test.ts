import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { earthdistanceUnitProofCases } from "../../e2e/fixtures/earthdistance-proof-cases";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createEarthdistance_1_2 } from "../../../apps/loom/src/core/extensions/adapters/earthdistance";
import { cubePoint, cubeBox } from "../../../apps/loom/src/core/extensions/adapters/cube";
import { earthdistanceAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/earthdistance";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/earthdistance.json";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const earth = {
  name: "earthdistance",
  version: "1.2",
  schema: 'Earth"日本',
  apiSupport: { status: "verified", digest: "13bae0f141ff6fb7a7e4253e02958e7b6dd18c82db9b51c03bf12605df99fcd6" },
} as const;
const cube = {
  name: "cube",
  version: "1.5",
  schema: "Cube日本",
  apiSupport: { status: "verified", digest: "205421c1cacc198ba7088c60ec4f76b0a8e7adec18be87d17a8082dd7b0515e2" },
} as const;

extensionProofUnitTest(earthdistanceUnitProofCases[0]!, () => {
  const api = createEarthdistance_1_2(earth, cube);
  expect(earthdistanceAnnotations.map((row) => row.id).sort()).toEqual(
    manifest.contract.members.map((row) => row.id).sort(),
  );
  expect(new Set(earthdistanceAnnotations.map((row) => row.id)).size).toBe(15);
  expect(Object.keys(api.sql.overloads).sort()).toEqual(
    manifest.contract.members
      .filter((row) => row.kind === "routine" || row.kind === "operator")
      .map((row) => row.id)
      .sort(),
  );
  expect(api.codec.sqlType).toEqual({ schema: earth.schema, name: "earth" });
  expect(api.cubeCodec.sqlType).toEqual({ schema: cube.schema, name: "cube" });
  expect(() =>
    createEarthdistance_1_2({ ...earth, apiSupport: { status: "verified", digest: "wrong" } }, cube),
  ).toThrow();
  expect(() => createEarthdistance_1_2(earth, { ...cube, apiSupport: { status: "unverified" } })).toThrow();
  for (const character of ['"', "$", "'", "\\"])
    expect(() => createEarthdistance_1_2(earth, { ...cube, schema: `Cube${character}日本` })).toThrow(
      /cube dependency schema.*PostgreSQL @extschema:cube@ restriction/,
    );
  for (const row of earthdistanceAnnotations) {
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
  }
});

extensionProofUnitTest(earthdistanceUnitProofCases[1]!, () => {
  const api = createEarthdistance_1_2(earth, cube);
  // Shape validation is client-side; PostgreSQL owns radius, dimensionality and equal-corner compression.
  for (const value of [cubePoint([6378168]), cubeBox([6378168], [6378168]), cubePoint([0, 0, 6378168])])
    expect(api.codec.decode(api.codec.encode(value))).toEqual(value);
  expect(() => api.codec.decode("(broken)")).toThrow();
  const array = {
    dimensions: [
      { lowerBound: -2, length: 2 },
      { lowerBound: 3, length: 2 },
    ],
    values: [
      [cubePoint([6378168]), null],
      [cubePoint([0, 6378168]), cubePoint([0, 0, 6378168])],
    ],
  };
  expect(api.arrayCodec.decode(api.arrayCodec.encode(array))).toEqual(array);
  expect(api.arrayCodec.decode("{}")).toEqual({ dimensions: [], values: [] });
  const sixRanks = {
    dimensions: Array.from({ length: 6 }, () => ({ lowerBound: -1, length: 1 })),
    values: [[[[[[cubePoint([6378168])]]]]]],
  };
  expect(api.arrayCodec.decode(api.arrayCodec.encode(sixRanks))).toEqual(sixRanks);
  expect(() =>
    api.arrayCodec.encode({ dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [cubePoint([6378168])] }),
  ).toThrow();
  expect(api.field().metadata.extension).toMatchObject({
    type: "earth",
    member: "type:$extension:earthdistance.earth",
    schema: earth.schema,
  });
  expect(api.arrayField().metadata.extension).toMatchObject({
    type: "earth",
    array: true,
    member: "type:$extension:earthdistance._earth",
  });
});

extensionProofUnitTest(earthdistanceUnitProofCases[2]!, () => {
  const api = createEarthdistance_1_2(earth, cube);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const miles = api.pointDistanceMiles({ longitude: -69.9, latitude: 18.4 }, { longitude: 0, latitude: 0 });
  expect(extensionExpressionContract(miles)?.member).toBe(
    "operator:$extension:earthdistance.<@>(pg_catalog.point,pg_catalog.point)",
  );
  const pointQuery = dialect.sqlToQuery(miles);
  expect(pointQuery.sql).toContain('operator("Earth""日本".<@>)');
  expect(pointQuery.params).toEqual(["(-69.9, 18.4)", "(0, 0)"]);
  expect(api.pointCodec.decode("(-69.9,18.4)")).toEqual({ longitude: -69.9, latitude: 18.4 });
  expect(() => api.pointCodec.decode("(1,2,3)")).toThrow();
  const location = api.fromDegrees(18.4, -69.9);
  const distanceQuery = dialect.sqlToQuery(api.distanceMeters(location.as('location"日本'), cubePoint([6378168])));
  expect(distanceQuery.sql).toContain('"Earth""日本"."ll_to_earth"');
  expect(distanceQuery.params).toEqual([18.4, -69.9, "(6378168)"]);
  expect(dialect.sqlToQuery(api.distanceMeters(null, null)).params).toEqual([null, null]);
  expect(extensionExpressionContract(api.boxMeters(location, 1000))?.codec).toBe(`${api.cubeCodec.id}:nullable`);
});
