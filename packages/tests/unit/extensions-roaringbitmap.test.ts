import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import {
  createRoaringbitmap_1_2,
  decodeRoaringBitmap64Bytes,
  decodeRoaringBitmapBytes,
} from "../../../apps/loom/src/core/extensions/adapters/roaringbitmap";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import {
  roaringbitmapAnnotations,
  roaringbitmapSearchPathMembers,
} from "../../../apps/loom/src/tooling/extensions/annotations/roaringbitmap";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/roaringbitmap.json";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { roaringbitmapUnitProofCase } from "../../e2e/fixtures/roaringbitmap-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";

// The host corroborates this callback's terminal event against Vitest's independent JSON result.
test(roaringbitmapUnitProofCase.title, () => {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: roaringbitmapUnitProofCase });
  record({ runId: identity, kind: "started", caseId: roaringbitmapUnitProofCase.id });
  let passed = false;
  try {
    const selection = { roaringbitmap: { version: "1.2", schema: 'unit"bitmaps' } } as const;
    const resolved = resolveSelectedExtension("roaringbitmap", selection.roaringbitmap);
    assert(resolved.manifest);
    expect(resolved.manifest.digest).toBe(manifest.digest);
    const required = buildRequiredApi(selection);
    expect(validateRequiredApiForTarget(required)).toEqual(required);
    expect(required?.apis[0]?.manifest.digest).toBe(manifest.digest);
    const generated = extensionBindingsSource(selection);
    expect(generated).toContain(JSON.stringify(manifest.digest));
    expect(generated).toContain('from "kello/extensions/roaringbitmap"');
    expect(generated).not.toContain("kello/tooling");
    expect(resolveSelectedExtension("roaringbitmap", { version: "future", schema: "extensions" }).adapter).toBeUndefined();
    expect(extensionBindingsSource(undefined)).not.toContain("kello/extensions/roaringbitmap");
    expect(extensionBindingsSource({})).not.toContain("kello/extensions/roaringbitmap");
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: roaringbitmapUnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
});

const dialect = extensionSqlDialect(nodePgCodecs);
const verified = {
  name: "roaringbitmap",
  version: "1.2",
  schema: 'custom"bits',
  apiSupport: { status: "verified", digest: "967ad98be988b37be7f198057e9f02bcbe325a0eab5364722ba4c6763cbc406a" },
} as const;
const rb = createRoaringbitmap_1_2(verified);
const members = manifest.contract.members;

test("roaringbitmap factory requires its exact verified 1.2 manifest", () => {
  expect(manifest.digest).toBe(verified.apiSupport.digest);
  expect(manifest.contract.version).toBe("1.2");
  for (const descriptor of [
    { ...verified, name: "hll" },
    { ...verified, version: "1.3" },
    { ...verified, apiSupport: { status: "unverified" } },
    { ...verified, apiSupport: { status: "verified" } },
    { ...verified, apiSupport: { status: "verified", digest: "0".repeat(64) } },
  ])
    // SAFETY: Invalid JavaScript descriptors exercise admission beyond the static signature.
    expect(() => createRoaringbitmap_1_2(descriptor as never)).toThrow(
      "roaringbitmap 1.2 requires its exact verified contract",
    );
});

test("roaringbitmap annotations dispose every captured member exactly once", () => {
  const ids = roaringbitmapAnnotations.map((annotation) => annotation.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect([...ids].sort()).toEqual(members.map((member) => member.id).sort());
  const count = (disposition: string) =>
    roaringbitmapAnnotations.filter((annotation) => annotation.disposition === disposition).length;
  expect(["query", "schema", "internal", "tooling"].map(count)).toEqual([132, 4, 28, 0]);
  const byId = new Map(members.map((member) => [member.id, member]));
  for (const annotation of roaringbitmapAnnotations) {
    const member = byId.get(annotation.id)!;
    if (annotation.disposition === "schema") expect(member.kind).toBe("type");
    if (annotation.disposition !== "internal") continue;
    // Internal routines are only captured cstring/internal callbacks whose captured parent slot names them.
    assert(member.kind === "routine" && "parents" in annotation);
    const nativeOnly = (type: { namespace: string; name: string }) =>
      type.namespace === "pg_catalog" && (type.name === "internal" || type.name === "cstring");
    expect(nativeOnly(member.returns!) || member.arguments!.some((argument) => nativeOnly(argument.type))).toBe(true);
    const parent = byId.get(annotation.parents[0])!;
    const { relation } = annotation.proofTransfer;
    if (relation.kind === "aggregate-routine") {
      assert(parent.kind === "routine" && parent.aggregate);
      expect(`routine:${parent.aggregate[relation.slot]}`).toBe(annotation.id);
    } else {
      assert(parent.kind === "type");
      expect(`routine:${parent[relation.slot]}`).toBe(annotation.id);
    }
  }
});

test("roaringbitmap search_path-dependent members are exactly the captured SQL-language bodies", () => {
  const sqlLanguage = members.flatMap((member) =>
    member.kind === "routine" && member.language === "sql" && !member.configuration?.length ? [member.id] : [],
  );
  const viaOperator = members.flatMap((member) =>
    member.kind === "operator" && sqlLanguage.includes(`routine:${member.procedure}`) ? [member.id] : [],
  );
  expect([...roaringbitmapSearchPathMembers].sort()).toEqual([...sqlLanguage, ...viaOperator].sort());
  expect(roaringbitmapSearchPathMembers.size).toBe(12);
});

test("roaringbitmap binds every public SQL-callable member by exact identity", () => {
  const callable = roaringbitmapAnnotations
    .filter((annotation) => annotation.disposition === "query")
    .map((annotation) => annotation.id)
    .sort();
  expect(Object.keys(rb.sql.overloads).sort()).toEqual(callable);
  for (const binding of Object.values(rb.sql.overloads)) expect(binding).toBeTypeOf("function");
  const fields = [rb.field(), rb.field64(), rb.arrayField(), rb.array64Field()];
  expect(fields.map((field) => field.metadata.extension?.member ?? "").sort()).toEqual(
    roaringbitmapAnnotations
      .filter((annotation) => annotation.disposition === "schema")
      .map((annotation) => annotation.id)
      .sort(),
  );
});

test("roaringbitmap direct helpers retain both native widths and exact member contracts", () => {
  expect(rb.cardinality).toBe(rb.sql.functions.rb_cardinality);
  expect(rb.add).toBe(rb.sql.functions.rb_add);
  expect(rb.bitmap64.cardinality).toBe(rb.sql.functions.rb64_cardinality);
  expect(rb.bitmap64.add).toBe(rb.sql.functions.rb64_add);
  expect(dialect.sqlToQuery(rb.cardinality([1, -1]))).toEqual(
    dialect.sqlToQuery(rb.sql.functions.rb_cardinality([1, -1])),
  );
  expect(extensionExpressionContract(rb.bitmap64.cardinality([1n, -1n]))?.member).toBe(
    "routine:$extension:roaringbitmap.rb64_cardinality($extension:roaringbitmap.roaringbitmap64)",
  );
});

test("roaringbitmap SQL is schema-qualified with exact argument types", () => {
  const compiled = (expression: Parameters<typeof dialect.sqlToQuery>[0]) => dialect.sqlToQuery(expression);
  const add = compiled(rb.sql.functions.rb_add.bitmapElement([3, 1, 2], 4));
  expect(add.sql).toBe('"custom""bits"."rb_add"($1::"custom""bits"."roaringbitmap", $2::"pg_catalog"."int4")');
  expect(add.params).toEqual(["{3,1,2}", 4]);
  const add64 = compiled(rb.sql.functions.rb64_add.elementBitmap(-1n, [9223372036854775807n, -9223372036854775808n]));
  expect(add64.sql).toBe('"custom""bits"."rb64_add"($1::"pg_catalog"."int8", $2::"custom""bits"."roaringbitmap64")');
  expect(add64.params).toEqual(["-1", "{9223372036854775807,-9223372036854775808}"]);
  const selected = compiled(rb.sql.functions.rb_select([1, 2, 3], 2n, undefined, true));
  expect(selected.sql).toBe(
    '"custom""bits"."rb_select"($1::"custom""bits"."roaringbitmap", $2::"pg_catalog"."int8", "reverse" => $3::"pg_catalog"."bool")',
  );
  expect(compiled(rb.sql.functions.rb_build({ dimensions: [{ lowerBound: 1, length: 2 }], values: [1, -1] })).sql).toBe(
    '"custom""bits"."rb_build"($1::"pg_catalog"."int4"[])',
  );
  const operator = compiled(rb.sql.operators.roaringbitmap64.elementContainedBy(5n, [5n]));
  expect(operator.sql).toBe(
    '($1::"pg_catalog"."int8" operator("custom""bits".<@) $2::"custom""bits"."roaringbitmap64")',
  );
  const cast = compiled(rb.sql.casts.bytea_to_roaringbitmap64({ hex: "0000000000000000" }));
  expect(cast.sql).toBe('(($1)::"pg_catalog"."bytea")::"custom""bits"."roaringbitmap64"');
  expect(compiled(rb.sql.functions.rb_or_agg(sql`value`)).sql).toBe('"custom""bits"."rb_or_agg"(value)');
  expect(compiled(rb.sql.functions.rb_build_agg.distinct(sql`value`)).sql).toBe(
    '"custom""bits"."rb_build_agg"(distinct value)',
  );
  expect("distinct" in rb.sql.functions.rb_or_agg).toBe(false);
  expect(extensionExpressionContract(rb.sql.functions.rb64_iterate([1n]))).toMatchObject({
    member: "routine:$extension:roaringbitmap.rb64_iterate($extension:roaringbitmap.roaringbitmap64)",
    codec: "pg:int8:bounded:1:nullable",
  });
  expect(() => rb.sql.functions.rb_add.bitmapElement([2147483648], 1)).toThrow();
  expect(() => rb.sql.functions.rb_contains.element([1], 1.5)).toThrow();
  expect(() => rb.sql.functions.rb64_contains.element([1n], 9223372036854775808n)).toThrow();
});

const hex = (...parts: string[]) => `\\x${parts.join("")}`;
test("roaringbitmap codecs decode exact native portable bytes and array text", () => {
  const { codec, codec64 } = rb;
  expect(codec.encode([3, -1, 3])).toBe("{3,-1,3}");
  expect(codec64.encode([-1n, 0n])).toBe("{-1,0}");
  expect(codec.decode(hex("3a300000", "01000000", "0000", "0200", "10000000", "0100", "0200", "0300"))).toEqual([1, 2, 3]);
  expect(codec.decode(hex("3a300000", "00000000"))).toEqual([]);
  expect(codec.decode(":0\\000\\000\\000\\000\\000\\000")).toEqual([]);
  // Native unsigned order: -1 is uint32 4294967295, after every non-negative member.
  expect(
    codec.decode(hex("3a300000", "02000000", "0000", "0000", "ffff", "0000", "18000000", "1a000000", "0100", "ffff")),
  ).toEqual([1, -1]);
  expect(codec.decode(hex("3b300000", "01", "0000", "0400", "0100", "0500", "0400"))).toEqual([5, 6, 7, 8, 9]);
  const bitset = new Uint8Array(8 + 4 + 4 + 8192);
  bitset.set([0x3a, 0x30, 0, 0, 1, 0, 0, 0, 0, 0, 0x00, 0x10, 16, 0, 0, 0]);
  for (let member = 0; member <= 4096; member++) bitset[16 + (member >> 3)]! |= 1 << (member & 7);
  expect(codec.decode(bitset)).toEqual(Array.from({ length: 4097 }, (_, member) => member));
  expect(codec.decode("{}")).toEqual([]);
  expect(codec.decode("{1,2,-2147483648,-1}")).toEqual([1, 2, -2147483648, -1]);
  expect(codec64.decode("{0,9223372036854775807,-9223372036854775808,-1}")).toEqual([
    0n,
    9223372036854775807n,
    -9223372036854775808n,
    -1n,
  ]);
  expect(codec64.decode(hex("0000000000000000"))).toEqual([]);
  expect(
    codec64.decode(
      hex(
        "0200000000000000",
        "00000000",
        "3a300000",
        "01000000",
        "0000",
        "0000",
        "10000000",
        "0100",
        "ffffffff",
        "3a300000",
        "01000000",
        "ffff",
        "0000",
        "10000000",
        "ffff",
      ),
    ),
  ).toEqual([1n, -1n]);
  expect(decodeRoaringBitmapBytes(new Uint8Array([0x3a, 0x30, 0, 0, 0, 0, 0, 0]))).toEqual([]);
  for (const invalid of [
    "{2,1}",
    "{-1,1}",
    "{1,1}",
    "{ 1}",
    "{1,}",
    "{2147483648}",
    hex("3a300000", "00000000", "00"),
    hex("3c300000", "00000000"),
    hex("3a300000", "01000000", "0000", "0100", "10000000", "0200", "0100"),
    hex("3a300000", "01000000"),
    null,
    1,
  ])
    expect(() => codec.decode(invalid)).toThrow();
  for (const invalid of [
    "{-1,0}",
    "{9223372036854775808}",
    hex("0100000000000000"),
    hex("0200000000000000", "01000000", "3a30000000000000", "00000000", "3a30000000000000"),
  ])
    expect(() => codec64.decode(invalid)).toThrow();
  expect(() => decodeRoaringBitmap64Bytes(hex("0000000001000000"))).toThrow("bucket count");
  expect(() => codec.encode([1.5])).toThrow();
  // SAFETY: an invalid JavaScript number member exercises runtime int8 validation beyond the static signature.
  expect(() => codec64.encode([1] as never)).toThrow();
  expect(rb.arrayCodec.decode('{"{1,2}",NULL,"\\\\x3a30000000000000"}')).toEqual({
    dimensions: [{ lowerBound: 1, length: 3 }],
    values: [[1, 2], null, []],
  });
  expect(rb.array64Codec.encode({ dimensions: [{ lowerBound: 1, length: 2 }], values: [[-1n], null] })).toBe(
    '[1:2]={"{-1}",NULL}',
  );
});
