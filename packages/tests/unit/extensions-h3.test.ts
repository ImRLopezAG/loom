import { expect, test } from "vite-plus/test";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createH3_4_2_3, h3Index } from "../../../apps/loom/src/core/extensions/adapters/h3";
import {
  createH3IndexArrayCodec,
  createH3IndexCodec,
  h3LatFirstPolygonCodec,
  h3LatLngCodec,
  h3LocalIjCodec,
  h3MultiPolygonPartCodec,
  h3PolygonArrayCodec,
  h3PolygonCodec,
} from "../../../apps/loom/src/core/extensions/adapters/h3-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { h3Annotations } from "../../../apps/loom/src/tooling/extensions/annotations/h3";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/h3.json";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { h3UnitProofCase } from "../../e2e/fixtures/h3-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";

const digest = "0402a89cff2876378a25b680936da0841125dc5d194c2dad6f006092914ffbaf";
const extension = createH3_4_2_3({
  name: "h3",
  version: "4.2.3",
  schema: 'custom"h3',
  apiSupport: { status: "verified", digest },
});
const dialect = extensionSqlDialect(nodePgCodecs);
const sorted = (values: readonly (string | undefined)[]) =>
  values.map((value) => value ?? "").sort((a, b) => a.localeCompare(b));
const cell = h3Index("8928308280fffff");
const edge = h3Index("11928308280fffff");
const point = { lng: -122.4089866999972, lat: 37.81331899998324 };
const square = [
  { lng: -122.4089, lat: 37.8133 },
  { lng: -122.4089, lat: 37.8033 },
  { lng: -122.3989, lat: 37.8033 },
  { lng: -122.3989, lat: 37.8133 },
];

// The host corroborates this callback's terminal event against Vitest's independent JSON result.
test(h3UnitProofCase.title, () => {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: h3UnitProofCase });
  record({ runId: identity, kind: "started", caseId: h3UnitProofCase.id });
  let passed = false;
  try {
    const selection = { h3: { version: "4.2.3", schema: 'unit"h3' } } as const;
    const resolved = resolveSelectedExtension("h3", selection.h3);
    assert(resolved.manifest);
    expect(resolved.manifest.digest).toBe(digest);
    expect(resolved.support).toEqual({ status: "verified", digest });
    const required = buildRequiredApi(selection);
    expect(validateRequiredApiForTarget(required)).toEqual(required);
    expect(required?.apis[0]?.manifest.digest).toBe(digest);
    const generated = extensionBindingsSource(selection);
    expect(generated).toContain(JSON.stringify(digest));
    expect(generated).toContain('import { createH3_4_2_3 } from "kello/extensions/h3"');
    expect(generated).not.toContain("kello/tooling");
    expect(generated).not.toContain("h3-postgis");
    expect(resolveSelectedExtension("h3", { version: "4.2.2", schema: "extensions" }).adapter).toBeUndefined();
    expect(extensionBindingsSource(undefined)).not.toContain("kello/extensions/h3");
    expect(extensionBindingsSource({})).not.toContain("kello/extensions/h3");
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: h3UnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
});

test("h3 callable factory requires its exact verified manifest", () => {
  const verified = {
    name: "h3",
    version: "4.2.3",
    schema: "geo",
    apiSupport: { status: "verified", digest },
  } as const;
  expect(Object.isFrozen(createH3_4_2_3(verified))).toBe(true);
  for (const descriptor of [
    { ...verified, name: "h3_postgis" },
    { ...verified, version: "4.2.2" },
    { ...verified, apiSupport: { status: "unverified" } },
    { ...verified, apiSupport: { status: "verified" } },
    { ...verified, apiSupport: { status: "verified", digest: "wrong" } },
  ])
    // SAFETY: Invalid JavaScript descriptors exercise admission beyond the factory static signature.
    expect(() => createH3_4_2_3(descriptor as never)).toThrow("h3 4.2.3 requires its exact verified contract");
});

test("h3index values keep every unsigned 64-bit address and normalize to native output text", () => {
  // Native h3index_in parsed each of these to the same bits h3index_out printed (private h3-pg 4.2.3 oracle).
  expect(h3Index("8928308280FFFFF")).toBe("8928308280fffff");
  expect(h3Index("08928308280fffff")).toBe("8928308280fffff");
  expect(h3Index("0")).toBe("0");
  expect(h3Index("0000000000000000")).toBe("0");
  expect(h3Index("FFFFFFFFFFFFFFFF")).toBe("ffffffffffffffff");
  expect(h3Index("2222597fffffffff")).toBe("2222597fffffffff");
  for (const invalid of [
    "",
    // h3index_in saturates 17+ significant digits to ffffffffffffffff; that is not lossless.
    "18928308280fffff0",
    "0x8928308280fffff",
    " 8928308280fffff",
    "8928308280fffffzz",
    "8928308280fffff ",
    "-1",
    "89283082８0fffff",
  ])
    expect(() => h3Index(invalid)).toThrow();
  const codec = createH3IndexCodec('custom"h3');
  expect(codec.sqlType).toEqual({ schema: 'custom"h3', name: "h3index" });
  expect(codec.encode("08928308280FFFFF")).toBe("8928308280fffff");
  expect(codec.decode("8928308280fffff")).toBe(cell);
  // Native output never carries upper case or leading zeros; anything else is a different type or driver drift.
  expect(() => codec.decode("8928308280FFFFF")).toThrow();
  expect(() => codec.decode("08928308280fffff")).toThrow();
  expect(() => codec.decode(617700169958293503n)).toThrow();
  const array = createH3IndexArrayCodec('custom"h3');
  expect(array.decode("[0:1]={8928308280fffff,NULL}")).toEqual({
    dimensions: [{ lowerBound: 0, length: 2 }],
    values: [cell, null],
  });
  expect(array.encode({ dimensions: [{ lowerBound: 1, length: 2 }], values: ["0", "FFFFFFFFFFFFFFFF"] })).toBe(
    '[1:2]={"0","ffffffffffffffff"}',
  );
  expect(() => array.encode({ dimensions: [{ lowerBound: 2147483647, length: 2 }], values: ["0", "1"] })).toThrow(
    "PostgreSQL array upper bound overflow",
  );
});

test("h3 points and polygons keep each member's captured coordinate order", () => {
  expect(h3LatLngCodec.encode(point)).toBe("(-122.4089866999972,37.81331899998324)");
  expect(h3LatLngCodec.decode("(-122.41845932318309,37.776702349435695)")).toEqual({
    lng: -122.41845932318309,
    lat: 37.776702349435695,
  });
  expect(h3LatLngCodec.encode({ lng: -0, lat: { nonfinite: "NaN" } })).toBe("(-0,NaN)");
  // node-postgres parses a top-level point column to {x, y} before the codec runs (observed on native h3 4.2.3).
  expect(h3LatLngCodec.decode({ x: -122.41845932318309, y: 37.776702349435695 })).toEqual({
    lng: -122.41845932318309,
    lat: 37.776702349435695,
  });
  expect(h3LatLngCodec.decode({ x: Number.NaN, y: -Infinity })).toEqual({
    lng: { nonfinite: "NaN" },
    lat: { nonfinite: "-Infinity" },
  });
  expect(h3LocalIjCodec.decode({ x: 1120, y: 617 })).toEqual({ i: 1120, j: 617 });
  expect(() => h3LocalIjCodec.decode({ x: 1.5, y: 2 })).toThrow();
  expect(() => h3LatLngCodec.decode({ x: 1, y: 2, z: 3 })).toThrow();
  expect(h3LatLngCodec.decode("(NaN,-Infinity)")).toEqual({
    lng: { nonfinite: "NaN" },
    lat: { nonfinite: "-Infinity" },
  });
  // SAFETY: invalid JavaScript input exercises runtime codec admission beyond the static signature.
  expect(() => h3LatLngCodec.encode({ lat: 1, lng: 2, x: 3 } as never)).toThrow();
  // Native localIjToCell truncates doubles toward zero and casts NaN to an arbitrary integer; only int32 is lossless.
  expect(h3LocalIjCodec.encode({ i: -123, j: 35 })).toBe("(-123,35)");
  expect(h3LocalIjCodec.decode("(1120,617)")).toEqual({ i: 1120, j: 617 });
  for (const invalid of [{ i: -123.9, j: 0 }, { i: 0, j: 2147483648 }, { i: Number.NaN, j: 0 }])
    expect(() => h3LocalIjCodec.encode(invalid)).toThrow();
  expect(() => h3LocalIjCodec.decode("(1.5,2)")).toThrow();
  expect(h3PolygonCodec.encode(square)).toBe(
    "((-122.4089,37.8133),(-122.4089,37.8033),(-122.3989,37.8033),(-122.3989,37.8133))",
  );
  expect(h3PolygonCodec.decode("((-122.4089,37.8133),(-122.3989,37.8033))")).toEqual([
    { lng: -122.4089, lat: 37.8133 },
    { lng: -122.3989, lat: 37.8033 },
  ]);
  expect(() => h3PolygonCodec.encode([])).toThrow();
  // h3_directed_edge_to_boundary writes latitude into x and longitude into y.
  expect(
    h3LatFirstPolygonCodec.decode(
      "((37.77820687262237,-122.41971895414808),(37.776524206993216,-122.42079024541879))",
    ),
  ).toEqual([
    { lng: -122.41971895414808, lat: 37.77820687262237 },
    { lng: -122.42079024541879, lat: 37.776524206993216 },
  ]);
  expect(h3LatFirstPolygonCodec.encode([{ lng: 1, lat: 2 }])).toBe("((2,1))");
  expect(h3PolygonArrayCodec.decode('{"((1,2),(3,4))",NULL}')).toEqual({
    dimensions: [{ lowerBound: 1, length: 2 }],
    values: [
      [
        { lng: 1, lat: 2 },
        { lng: 3, lat: 4 },
      ],
      null,
    ],
  });
  expect(
    h3MultiPolygonPartCodec.decode('("((1,2),(3,4),(5,6))","{""((1.5,2.5),(3,4),(5,6))""}")'),
  ).toEqual({
    exterior: [
      { lng: 1, lat: 2 },
      { lng: 3, lat: 4 },
      { lng: 5, lat: 6 },
    ],
    holes: {
      dimensions: [{ lowerBound: 1, length: 1 }],
      values: [
        [
          { lng: 1.5, lat: 2.5 },
          { lng: 3, lat: 4 },
          { lng: 5, lat: 6 },
        ],
      ],
    },
  });
  expect(h3MultiPolygonPartCodec.decode('("((1,2),(3,4))",{})')).toEqual({
    exterior: [
      { lng: 1, lat: 2 },
      { lng: 3, lat: 4 },
    ],
    holes: { dimensions: [], values: [] },
  });
});

test("h3 binds qualified functions, named defaults, operators and casts with checked parameters", () => {
  const indexed = dialect.sqlToQuery(extension.latLngToCell(point, 9));
  expect(indexed.sql).toContain('"custom""h3"."h3_latlng_to_cell"(');
  expect(indexed.sql).toContain('::"pg_catalog"."point"');
  expect(indexed.params).toEqual(["(-122.4089866999972,37.81331899998324)", 9]);
  const disk = dialect.sqlToQuery(extension.gridDisk("8928308280FFFFF"));
  expect(disk.sql).toBe('select "custom""h3"."h3_grid_disk"($1::"custom""h3"."h3index")'.slice(7));
  expect(disk.params).toEqual(["8928308280fffff"]);
  const ring = dialect.sqlToQuery(extension.gridDisk(cell, 2));
  expect(ring.sql).toContain('"k" => $2::"pg_catalog"."int4"');
  const area = dialect.sqlToQuery(extension.cellArea(cell, "m^2"));
  expect(area.sql).toContain('"unit" => $2::"pg_catalog"."text"');
  expect(area.params).toEqual(["8928308280fffff", "m^2"]);
  // SAFETY: invalid JavaScript input exercises runtime codec admission beyond the static signature.
  expect(() => extension.cellArea(cell, "km" as never)).toThrow();
  // SAFETY: invalid JavaScript input exercises runtime codec admission beyond the static signature.
  expect(() => extension.getHexagonAreaAvg(5, "km^2" as never)).toThrow();
  // SAFETY: invalid JavaScript input exercises runtime codec admission beyond the static signature.
  expect(() => extension.edgeLength(edge, "m^2" as never)).toThrow();
  const mode = dialect.sqlToQuery(extension.polygonToCellsExperimental(square, null, 9, "overlapping_bbox"));
  expect(mode.sql).toContain('"containment_mode" => $4::"pg_catalog"."text"');
  expect(mode.params[1]).toBeNull();
  // SAFETY: invalid JavaScript input exercises runtime codec admission beyond the static signature.
  expect(() => extension.polygonToCellsExperimental(square, null, 9, "bbox" as never)).toThrow();
  const parent = dialect.sqlToQuery(extension.cellToParent(cell));
  expect(parent.sql).toContain('"custom""h3"."h3_cell_to_parent"($1::"custom""h3"."h3index")');
  expect(dialect.sqlToQuery(extension.cellToParent(cell, 5)).params).toEqual(["8928308280fffff", 5]);
  const cells = { dimensions: [{ lowerBound: 1, length: 1 }], values: [cell] };
  expect(dialect.sqlToQuery(extension.compactCells(cells)).sql).toContain('::"custom""h3"."h3index"[]');
  // h3-pg 4.2.3 dereferences an empty outline and terminates the backend (SIGSEGV); literals are refused first.
  expect(() => extension.cellsToMultiPolygon({ dimensions: [], values: [] })).toThrow(
    "h3_cells_to_multi_polygon requires at least one array element",
  );
  expect(dialect.sqlToQuery(extension.cellsToMultiPolygon(cells)).params).toEqual(['[1:1]={"8928308280fffff"}']);
  const operator = dialect.sqlToQuery(extension.containedBy(cell, "85283083fffffff"));
  expect(operator.sql).toContain('operator("custom""h3".<@)');
  const cast = dialect.sqlToQuery(extension.sql.casts.h3index_to_int8(cell));
  expect(cast.sql).toContain('::"custom""h3"."h3index")::"pg_catalog"."int8"');
  expect(dialect.sqlToQuery(extension.sql.casts.int8_to_h3index(-1n)).params).toEqual(["-1"]);
  expect(dialect.sqlToQuery(extension.sql.casts.h3index_to_point(cell)).sql).toContain('::"pg_catalog"."point"');
  // SAFETY: invalid JavaScript input exercises runtime codec admission beyond the static signature.
  expect(() => extension.gridDisk("';drop table cells;--" as never)).toThrow();
  expect(dialect.sqlToQuery(sql`select ${extension.extensionVersion()}`).sql).toContain(
    '"custom""h3"."h3_get_extension_version"()',
  );
  expect(Object.isFrozen(extension)).toBe(true);
  expect(extension.sql.functions.h3_latlng_to_cell).toBe(extension.latLngToCell);
  expect(extension.sql.functions.h3_cell_to_parent.adjacent).toBeTypeOf("function");
  expect(extension.sql.operators["="]).toBe(extension.equal);
  expect("migratePassByReference" in extension).toBe(false);
  expect("h3_pg_migrate_pass_by_reference" in extension.sql.functions).toBe(false);
});

test("h3 classifies GUC- and search_path-dependent expressions as session state", () => {
  for (const value of [
    extension.latLngToCell(point, 9),
    extension.sql.functions.h3_lat_lng_to_cell(point, 9),
    extension.cellToBoundary(cell),
    extension.sql.functions.h3_cell_to_children_slow.adjacent(cell),
    extension.sql.functions.h3_cell_to_children_slow.resolution(cell, 10),
    extension.sql.functions.__h3_cell_to_children_aux(cell, 10, -1),
  ])
    expect(extensionExpressionContract(value)?.observability).toBe("session");
  for (const value of [
    extension.cellToLatLng(cell),
    extension.sql.functions.h3_cell_to_boundary.extendAntimeridian(cell, true),
    extension.directedEdgeToBoundary(edge),
    extension.gridDisk(cell),
    extension.polygonToCells(square, null, 9),
    extension.greatCircleDistance(point, point),
    extension.equal(cell, cell),
    extension.sql.casts.h3index_to_point(cell),
  ])
    expect(extensionExpressionContract(value)?.observability).toBe("tables");
});

test("all 134 h3 captured members reconcile with executable overloads, schema surfaces and annotations", () => {
  const members = manifest.contract.members;
  const captured = members.map((member) => member.id);
  expect(captured).toHaveLength(134);
  const pointSample = point;
  const samples = new Map<string, unknown>([
    ["$extension:h3.h3index", cell],
    ["$extension:h3._h3index", { dimensions: [{ lowerBound: 1, length: 1 }], values: [cell] }],
    ["pg_catalog.int4", 1],
    ["pg_catalog.int8", 1n],
    ["pg_catalog.bool", true],
    ["pg_catalog.text", undefined],
    ["pg_catalog.point", pointSample],
    ["pg_catalog.polygon", square],
    ["pg_catalog._polygon", null],
  ]);
  // Arguments follow each captured signature: cast source, operator operands or routine parameter list.
  const executable = Object.entries(extension.sql.overloads).map(([member, call]) => {
    const types = member.startsWith("cast:")
      ? [member.slice(5, member.indexOf("->"))]
      : member
          .slice(member.indexOf("(") + 1, -1)
          .split(",")
          .filter(Boolean);
    expect(types.every((name) => samples.has(name))).toBe(true);
    // h3_local_ij_to_cell's point is IJ grid space, not degrees.
    const values = types
      .map((name) => (name === "pg_catalog.point" && member.includes("h3_local_ij_to_cell") ? { i: 1, j: 2 } : samples.get(name)))
      .filter((value) => value !== undefined);
    // SAFETY: each sample is the checked value of the captured argument type named by this overload's member identity.
    const value = (call as (...values: unknown[]) => Parameters<typeof extensionExpressionContract>[0])(...values);
    expect(extensionExpressionContract(value)?.member).toBe(member);
    return member;
  });
  const schemaMembers = [
    extension.field().metadata.extension?.member,
    extension.arrayField().metadata.extension?.member,
    extension.indexes.btree().member,
    extension.indexes.hash().member,
    extension.indexes.brin().member,
    extension.indexes.spgist().member,
  ];
  expect(schemaMembers).toEqual([
    "type:$extension:h3.h3index",
    "type:$extension:h3._h3index",
    "opclass:$extension:h3.h3index_ops/btree",
    "opclass:$extension:h3.h3index_ops/hash",
    "opclass:$extension:h3.h3index_minmax_ops/brin",
    "opclass:$extension:h3.h3index_ops_experimental/spgist",
  ]);
  const by = (disposition: string) =>
    h3Annotations.filter((entry) => entry.disposition === disposition).map((entry) => entry.id);
  expect(sorted([...executable, ...by("schema"), ...by("internal"), ...by("tooling")])).toEqual(sorted(captured));
  expect(sorted(h3Annotations.map((entry) => entry.id))).toEqual(sorted(captured));
  expect(sorted(executable)).toEqual(sorted(by("query")));
  expect(sorted(by("schema"))).toEqual(sorted(schemaMembers));
  expect(by("tooling")).toEqual(["routine:$extension:h3.h3_pg_migrate_pass_by_reference($extension:h3.h3index)"]);
  // Internal means a native-only callback (cstring/internal signature), an opfamily or an access-method row.
  const nativeOnly = (value: { namespace: string; name: string }) =>
    value.namespace === "pg_catalog" && (value.name === "cstring" || value.name === "internal");
  expect(sorted(by("internal"))).toEqual(
    sorted(
      members
        .filter(
          (member) =>
            member.id.startsWith("function of access method:") ||
            member.id.startsWith("operator of access method:") ||
            member.kind === "opfamily" ||
            (member.kind === "routine" &&
              "returns" in member &&
              (nativeOnly(member.returns) || (member.arguments ?? []).some((argument) => nativeOnly(argument.type)))),
        )
        .map((member) => member.id),
    ),
  );
  expect(by("internal")).toHaveLength(40);
  expect(executable).toHaveLength(87);
  expect(
    h3Annotations.every((entry) => entry.reason.length > 0 && entry.evidence.length >= 4 && entry.semantics),
  ).toBe(true);
});

test("h3 fields and indexes bind the installation type, unsigned operators and all four classes", () => {
  const field = extension.field();
  expect(field.metadata.extension).toMatchObject({ type: "h3index", member: "type:$extension:h3.h3index" });
  expect(field.metadata.extension?.search).toEqual({ filter: true, comparison: true, order: true, text: false });
  expect(field.metadata.extension?.operators?.eq?.member).toBe(
    "operator:$extension:h3.=($extension:h3.h3index,$extension:h3.h3index)",
  );
  expect(field.metadata.extension?.operators?.lte?.schema).toBe('custom"h3');
  expect(extension.arrayField().metadata.extension).toMatchObject({ type: "h3index", array: true });
  expect(extension.indexes.btree()).toMatchObject({ method: "btree", opclass: "h3index_ops", default: true });
  expect(extension.indexes.hash()).toMatchObject({ method: "hash", opclass: "h3index_ops", default: true });
  expect(extension.indexes.brin()).toMatchObject({ method: "brin", opclass: "h3index_minmax_ops", default: true });
  const spgist = extension.indexes.spgist();
  expect(spgist).toMatchObject({ method: "spgist", opclass: "h3index_ops_experimental" });
  expect(spgist.default).toBeUndefined();
  expect(extension.indexes.btree().input).toEqual({ schema: 'custom"h3', type: "h3index", dimensions: 0 });
});
