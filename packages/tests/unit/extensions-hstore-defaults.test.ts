import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { Field, type FieldDefinition } from "../../../apps/loom/src/core/schema/fields";
import { createExtensionField } from "../../../apps/loom/src/core/extensions/fields";
import type { ExtensionValueSchema } from "../../../apps/loom/src/core/extensions/fields";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import {
  createHstoreArrayCodec,
  createHstoreCodec,
  type HstoreValue,
} from "../../../apps/loom/src/core/extensions/hstore-codec";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import {
  createSnapshot,
  emptySnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";

const namespace = 'Hstore_"Codec_日本';
const quotedNamespace = '"Hstore_""Codec_日本"';
const noSearch = { filter: false, comparison: false, order: false, text: false } as const;
const nullableText: ExtensionValueSchema = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] };
const mappingSchema: ExtensionValueSchema = {
  kind: "object",
  properties: {
    entries: {
      kind: "array",
      items: { kind: "object", properties: { key: { kind: "string" }, value: nullableText } },
    },
  },
};
const arraySchema: ExtensionValueSchema = {
  kind: "object",
  properties: {
    dimensions: {
      kind: "array",
      items: {
        kind: "object",
        properties: { lowerBound: { kind: "number", integer: true }, length: { kind: "number", integer: true } },
      },
    },
    values: { kind: "array", items: { kind: "union", variants: [mappingSchema, { kind: "null" }] } },
  },
};
const extension = (name = "hstore", version = "1.8") => ({
  name,
  version,
  schema: namespace,
  apiSupport: { status: "verified" as const, digest: "fixture-digest" },
});
const scalar = (selected = extension()) =>
  createExtensionField({
    extension: selected,
    member: "type:$extension:hstore.hstore",
    type: "hstore",
    codec: createHstoreCodec(namespace),
    value: mappingSchema,
    search: noSearch,
  });
const array = (selected = extension()) =>
  createExtensionField({
    extension: selected,
    member: "type:$extension:hstore._hstore",
    type: "hstore",
    array: true,
    codec: createHstoreArrayCodec(namespace),
    value: arraySchema,
    search: noSearch,
  });
const mapping = (...entries: readonly [string, string | null][]): HstoreValue => ({
  entries: entries.map(([key, value]) => ({ key, value })),
});
const list = (lowerBound: number, ...values: (HstoreValue | null)[]): PostgreSqlArray<HstoreValue> => ({
  dimensions: values.length ? [{ lowerBound, length: values.length }] : [],
  values,
});
const snapshotOf = (field: FieldDefinition) =>
  createSnapshot(defineSchema(() => ({ docs: { value: field } }), { namespace: "app" }));
const column = (snapshot: Awaited<ReturnType<typeof snapshotOf>>) => {
  const found = snapshot.ddl.find((entity) => entity.entityType === "columns" && entity.name === "value");
  if (found?.entityType !== "columns") throw new Error("Expected the value column");
  return found;
};

test("hstoreDefaults.scalarMappingsWithOneNativeMeaningShareOneSnapshotAndNoMigration", async () => {
  const unsorted = await snapshotOf(
    scalar()
      .notNull()
      .default(mapping(["empty", ""], ["default-key", null])),
  );
  const sorted = await snapshotOf(
    scalar()
      .notNull()
      .default(mapping(["default-key", null], ["empty", ""])),
  );
  expect(snapshotHash(unsorted)).toBe(snapshotHash(sorted));
  expect(await migrationStatements(unsorted, sorted)).toEqual([]);
  expect(await migrationStatements(sorted, unsorted)).toEqual([]);
  expect(column(unsorted).dimensions).toBe(0);
});

test("hstoreDefaults.scalarMeaningsStayDistinctAndChangesStillMigrate", async () => {
  const cases = [
    mapping(["a", null]),
    mapping(["a", ""]),
    mapping(["a", "NULL"]),
    mapping(["a", "null"]),
    mapping(),
    mapping(["b", null]),
    mapping(["a", null], ["b", ""]),
    mapping(["q\"\\'", "x"]),
  ];
  const snapshots = await Promise.all(cases.map((value) => snapshotOf(scalar().default(value))));
  expect(new Set(snapshots.map(snapshotHash)).size).toBe(cases.length);
  for (const [index, snapshot] of snapshots.entries()) {
    const next = snapshots[(index + 1) % snapshots.length]!;
    const statements = await migrationStatements(snapshot, next);
    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain("SET DEFAULT");
  }
});

test("hstoreDefaults.arrayDefaultsKeepTheirArrayCastAndNestedMappingsShareOneMeaning", async () => {
  const empty = await snapshotOf(array().notNull().default(list(1)));
  expect(column(empty).dimensions).toBe(1);
  const created = (await migrationStatements(await emptySnapshot("app"), empty)).join("\n");
  expect(created).toContain(`DEFAULT '{}'::${quotedNamespace}."hstore"[]`);
  expect(created).not.toContain(`."hstore"::`);

  const forward = list(3, mapping(["b", "2"], ["a", null]), null, mapping(["z", ""], ["y", "NULL"]));
  const reordered = list(3, mapping(["a", null], ["b", "2"]), null, mapping(["y", "NULL"], ["z", ""]));
  const left = await snapshotOf(array().default(forward));
  const right = await snapshotOf(array().default(reordered));
  expect(snapshotHash(left)).toBe(snapshotHash(right));
  expect(await migrationStatements(left, right)).toEqual([]);
  const nonempty = (await migrationStatements(await emptySnapshot("app"), left)).join("\n");
  expect(nonempty).toMatch(/DEFAULT '.*'::"Hstore_""Codec_日本"\."hstore"\[\]/);
  expect(nonempty).not.toContain(`."hstore"::`);
});

test("hstoreDefaults.arrayBoundsNullLeavesAndEmptyMappingsStayDistinct", async () => {
  const cases = [
    list(1, mapping(["a", "1"])),
    list(2, mapping(["a", "1"])),
    list(1, null),
    list(1, mapping()),
    list(1, mapping(["a", "1"]), null),
    list(1),
  ];
  const snapshots = await Promise.all(cases.map((value) => snapshotOf(array().default(value))));
  expect(new Set(snapshots.map(snapshotHash)).size).toBe(cases.length);
});

test("hstoreDefaults.otherExtensionsVersionsAndOrdinaryFieldsKeepTheirDefaultSpelling", async () => {
  const forward = mapping(["b", "2"], ["a", "1"]);
  const reordered = mapping(["a", "1"], ["b", "2"]);
  for (const selected of [extension("not_hstore"), extension("hstore", "1.7")]) {
    const left = await snapshotOf(scalar(selected).default(forward));
    const right = await snapshotOf(scalar(selected).default(reordered));
    expect(snapshotHash(left)).not.toBe(snapshotHash(right));
    expect(await migrationStatements(left, right)).not.toEqual([]);
    const leftArray = await snapshotOf(array(selected).default(list(1, forward)));
    const rightArray = await snapshotOf(array(selected).default(list(1, reordered)));
    expect(snapshotHash(leftArray)).not.toBe(snapshotHash(rightArray));
  }
  const text = createSnapshot(
    defineSchema((fields) => ({ docs: { value: fields.text().default("b=>2, a=>1") } }), { namespace: "app" }),
  );
  expect(column(await text)).toMatchObject({ type: "text", default: "'b=>2, a=>1'" });
});

test("hstoreDefaults.nonliteralExpressionsAreNotMistakenForNormalizedLiterals", async () => {
  const desired = await snapshotOf(scalar().default(mapping(["a", "1"], ["b", "2"])));
  const expression = `${quotedNamespace}."hstore"('a','1')`;
  const selected = scalar();
  const expressionField = new Field(
    (name) => selected.build(name).default(sql.raw(expression)),
    { ...selected.metadata, defaultValue: expression },
    selected.validator,
    selected.encodeDefault,
  );
  const expressionSnapshot = await createSnapshot(
    defineSchema(() => ({ docs: { value: expressionField } }), { namespace: "app" }),
  );
  expect(column(expressionSnapshot).default).toBe(expression);
  expect(snapshotHash(expressionSnapshot)).not.toBe(snapshotHash(desired));
  const statements = await migrationStatements(expressionSnapshot, desired);
  expect(statements).toHaveLength(1);
  expect(statements[0]).toContain("SET DEFAULT");
});
