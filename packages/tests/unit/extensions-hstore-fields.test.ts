import { expect, test } from "vite-plus/test";
import { defineRelations } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres/codecs";
import * as v from "valibot";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/hstore.json";
import { createHstoreFields_1_8 } from "../../../apps/loom/src/core/extensions/hstore-fields";
import {
  createHstoreArrayCodec,
  createHstoreCodec,
  type HstoreValue,
} from "../../../apps/loom/src/core/extensions/hstore-codec";
import type { ArrayValues, PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import {
  createExtensionIndex,
  createNativeExtensionField,
  extensionFieldSqlType,
  extensionIndexAcceptsField,
} from "../../../apps/loom/src/core/extensions/fields";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { extensionFieldMetadataValidator } from "../../../apps/loom/src/core/extensions/values";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";
import { storageParser } from "../../../apps/loom/src/core/validation/encoding";
import { createSnapshot } from "../../../apps/loom/src/tooling/migrations/adapter";

const namespace = 'Hstore_"Fields_日本';
const descriptor = {
  name: "hstore",
  version: "1.8",
  schema: namespace,
  apiSupport: { status: "verified", digest: capture.digest },
} as const;
const api = createHstoreFields_1_8(descriptor);
const quotedType = '"Hstore_""Fields_日本"."hstore"';
const empty: HstoreValue = { entries: [] };
const mapping: HstoreValue = {
  entries: [
    { key: "", value: "" },
    { key: 'quote"\\key', value: "a,=>{}[]'\"\\b" },
    { key: "stored", value: null },
    { key: "NULL", value: "NULL" },
    { key: "__proto__", value: "data" },
    { key: "日本語😀", value: "é é ﻿  " },
  ],
};
function ranked(rank: number): PostgreSqlArray<HstoreValue> {
  let values: ArrayValues<HstoreValue> = [mapping, null, empty];
  for (let depth = 1; depth < rank; depth++) values = [values];
  return {
    dimensions: Array.from({ length: rank }, (_, index) => ({
      lowerBound: index - 3,
      length: index === rank - 1 ? 3 : 1,
    })),
    values,
  };
}

test("hstoreFields.requiresTheExactVerifiedHstore18Contract", () => {
  for (const apiSupport of [
    { status: "verified" as const, digest: "wrong" },
    { status: "verified" as const },
    { status: "unverified" as const },
  ])
    expect(() => createHstoreFields_1_8({ ...descriptor, apiSupport })).toThrow("exact verified contract");
  // @ts-expect-error Only the exact hstore 1.8 descriptor is selectable.
  expect(() => createHstoreFields_1_8({ ...descriptor, version: "1.7" })).toThrow("exact verified contract");
  // @ts-expect-error Only the hstore descriptor is selectable.
  expect(() => createHstoreFields_1_8({ ...descriptor, name: "citext" })).toThrow("exact verified contract");
  expect(Object.isFrozen(api)).toBe(true);
  expect(Object.keys(api).sort()).toEqual(["arrayField", "field"]);
});

test("hstoreFields.metadataBindsSelectedNamespaceDigestAndExtensionOwnedTypeIdentity", () => {
  const scalar = api.field().metadata.extension!;
  const array = api.arrayField().metadata.extension!;
  expect(scalar).toMatchObject({
    name: "hstore",
    version: "1.8",
    schema: namespace,
    digest: capture.digest,
    member: "type:$extension:hstore.hstore",
    type: "hstore",
    codec: createHstoreCodec(namespace).id,
    typmods: [],
    array: false,
    parameters: {},
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(array).toMatchObject({
    name: "hstore",
    version: "1.8",
    schema: namespace,
    digest: capture.digest,
    member: "type:$extension:hstore._hstore",
    type: "hstore",
    codec: createHstoreArrayCodec(namespace).id,
    typmods: [],
    array: true,
    parameters: {},
    search: { filter: false, comparison: false, order: false, text: false },
  });
  // Extension-owned fields claim no pg_catalog storage and no search operators.
  for (const metadata of [scalar, array]) {
    expect(metadata).not.toHaveProperty("storage");
    expect(metadata).not.toHaveProperty("operators");
    expect(Object.isFrozen(metadata)).toBe(true);
    expect(v.is(extensionFieldMetadataValidator, metadata)).toBe(true);
  }
  expect(extensionFieldSqlType(scalar)).toBe(quotedType);
  expect(extensionFieldSqlType(array)).toBe(`${quotedType}[]`);
  expect(createHstoreCodec(namespace).sqlType).toEqual({ schema: namespace, name: scalar.type });
  expect(createHstoreArrayCodec(namespace).sqlType).toEqual({ schema: namespace, name: array.type, array: true });
  expect(api.field().metadata).toMatchObject({ kind: "extension", notNull: false, unique: false });
  expect(api.field().notNull().metadata.notNull).toBe(true);
});

test("hstoreFields.memberIdentitiesAreTheCapturedNativeScalarAndArrayTypes", () => {
  expect(capture.contract).toMatchObject({ extension: "hstore", version: "1.8", postgresMajor: 18, provider: "neon" });
  const types = new Map(
    capture.contract.members.filter((member) => member.kind === "type").map((member) => [member.id, member] as const),
  );
  expect(types.get(api.field().metadata.extension!.member)).toMatchObject({
    name: "hstore",
    namespace: "$extension:hstore",
    element: null,
    array: { namespace: "$extension:hstore", name: "_hstore" },
    input: "$extension:hstore.hstore_in(pg_catalog.cstring)",
    output: "$extension:hstore.hstore_out($extension:hstore.hstore)",
  });
  expect(types.get(api.arrayField().metadata.extension!.member)).toMatchObject({
    name: "_hstore",
    namespace: "$extension:hstore",
    element: { namespace: "$extension:hstore", name: "hstore" },
    input: "pg_catalog.array_in(pg_catalog.cstring,pg_catalog.oid,pg_catalog.int4)",
    output: "pg_catalog.array_out(pg_catalog.anyarray)",
  });
});

test("hstoreFields.nativeFieldFactoryStillRefusesNonPgCatalogStorage", () => {
  // createNativeExtensionField claims reviewed built-in storage; hstore must not be repurposed into that claim.
  expect(() =>
    createNativeExtensionField({
      extension: descriptor,
      manifest: v.parse(extensionManifestValidator, capture),
      member: "type:$extension:hstore.hstore",
      input: { namespace: "$extension:hstore", name: "hstore" },
      codec: createHstoreCodec(namespace),
      value: { kind: "object", properties: {} },
      search: { filter: false, comparison: false, order: false, text: false },
    }),
  ).toThrow("reviewed pg_catalog storage");
});

test("hstoreFields.scalarValuesKeepWholeNullStoredNullAndFixedWrapperDistinct", () => {
  const nullable = storageParser(api.field().metadata);
  const required = storageParser(api.field().notNull().metadata);
  for (const value of [empty, mapping, { entries: [{ key: "k", value: null }] }]) {
    expect(v.safeParse(nullable, value).success).toBe(true);
    expect(v.safeParse(required, value).success).toBe(true);
  }
  // Whole SQL NULL belongs to the field nullability contract, independently of a stored hstore NULL.
  expect(v.safeParse(nullable, null).success).toBe(true);
  expect(v.safeParse(required, null).success).toBe(false);
  const invalid = [
    undefined,
    "a=>b",
    [],
    {},
    { a: "b" },
    new Map([["a", "b"]]),
    { entries: {} },
    { entries: [null] },
    { entries: [{ key: "a" }] },
    { entries: [{ key: "a", value: undefined }] },
    { entries: [{ key: 1, value: "b" }] },
    { entries: [{ key: "a", value: 1 }] },
    { entries: [], extra: true },
    { entries: [{ key: "a", value: "b", extra: true }] },
    {
      entries: [
        { key: "same", value: "first" },
        { key: "same", value: "last" },
      ],
    },
    { entries: [{ key: "a\0b", value: "x" }] },
    { entries: [{ key: "k", value: "\ud800" }] },
    { entries: [{ key: "\udc00", value: "x" }] },
  ];
  for (const input of invalid) {
    expect(v.safeParse(nullable, input).success, JSON.stringify(input)).toBe(false);
    expect(v.safeParse(required, input).success, JSON.stringify(input)).toBe(false);
  }
});

test("hstoreFields.arrayValuesKeepRanksBoundsNullLeavesAndWholeNullDistinct", () => {
  const nullable = storageParser(api.arrayField().metadata);
  const required = storageParser(api.arrayField().notNull().metadata);
  for (let rank = 1; rank <= 6; rank++) {
    expect(v.safeParse(nullable, ranked(rank)).success, `rank ${rank}`).toBe(true);
    expect(v.safeParse(required, ranked(rank)).success, `rank ${rank}`).toBe(true);
  }
  const empty0 = { dimensions: [], values: [] };
  const maximumBound = { dimensions: [{ lowerBound: 2147483646, length: 1 }], values: [null] };
  const minimumBound = { dimensions: [{ lowerBound: -2147483648, length: 1 }], values: [empty] };
  for (const value of [empty0, maximumBound, minimumBound]) expect(v.safeParse(nullable, value).success).toBe(true);
  expect(v.safeParse(nullable, null).success).toBe(true);
  expect(v.safeParse(required, null).success).toBe(false);
  // The empty array and whole SQL NULL are different values.
  expect(v.safeParse(required, empty0).success).toBe(true);
  const one = { lowerBound: 1, length: 1 };
  const invalid = [
    undefined,
    [mapping],
    [],
    {},
    { values: [mapping] },
    { dimensions: [one] },
    { dimensions: [], values: [mapping] },
    { dimensions: [one], values: [] },
    { dimensions: [{ lowerBound: 1, length: 2 }], values: [mapping] },
    { dimensions: [one], values: [mapping, mapping] },
    { dimensions: [one], values: [undefined] },
    { dimensions: [one], values: ["a=>b"] },
    { dimensions: [one], values: [{ a: "b" }] },
    { dimensions: [one], values: [{ entries: [{ key: "a", value: 1 }] }] },
    { dimensions: [one], values: [[mapping]] },
    { dimensions: [one, one], values: [mapping] },
    { dimensions: [{ lowerBound: 1, length: 0 }], values: [] },
    { dimensions: [{ lowerBound: 1.5, length: 1 }], values: [mapping] },
    { dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [mapping] },
    { dimensions: [{ lowerBound: -2147483649, length: 1 }], values: [mapping] },
    { dimensions: [{ lowerBound: 1, length: 1, extra: true }], values: [mapping] },
    { dimensions: [one], values: [mapping], extra: true },
    // Rank seven exceeds PostgreSQL MAXDIM.
    { dimensions: Array.from({ length: 7 }, () => one), values: [[[[[[[mapping]]]]]]] },
    // Ragged nesting fails the exact cardinality check.
    {
      dimensions: [
        { lowerBound: 1, length: 2 },
        { lowerBound: 1, length: 2 },
      ],
      values: [[mapping, mapping], [mapping]],
    },
  ];
  for (const input of invalid) {
    expect(v.safeParse(nullable, input).success, JSON.stringify(input)).toBe(false);
    expect(v.safeParse(required, input).success, JSON.stringify(input)).toBe(false);
  }
});

test("hstoreFields.defaultsUseTheFieldCodecAndQualifiedNativeTypes", () => {
  const dialect = extensionSqlDialect(nodePgCodecs);
  const scalarDefault = api.field().notNull().encodeDefault?.(mapping);
  expect(scalarDefault).toBeDefined();
  const encoded = v.parse(v.string(), createHstoreCodec(namespace).encode(mapping));
  expect(scalarDefault!.fingerprint).toBe(encoded);
  const scalarQuery = dialect.sqlToQuery(scalarDefault!.sql);
  expect(scalarQuery.sql).toBe(`'${encoded.replaceAll("'", "''")}'::${quotedType}`);
  expect(scalarQuery.params).toEqual([]);
  const arrayDefault = api.arrayField().notNull().encodeDefault?.({ dimensions: [], values: [] });
  expect(arrayDefault!.fingerprint).toBe("{}");
  const arrayQuery = dialect.sqlToQuery(arrayDefault!.sql);
  expect(arrayQuery.sql).toBe(`'{}'::${quotedType}[]`);
  expect(arrayQuery.params).toEqual([]);
  // Invalid defaults fail before SQL is built.
  // @ts-expect-error Dictionaries are not the fixed hstore wrapper.
  expect(() => api.field().notNull().encodeDefault?.({ key: "value" })).toThrow();
  // @ts-expect-error Plain arrays erase PostgreSQL bounds.
  expect(() => api.arrayField().notNull().encodeDefault?.([mapping])).toThrow();
});

test("hstoreFields.schemaMetadataAndSnapshotRetainNativeTypeIdentity", async () => {
  const schema = defineSchema(
    (fields) => ({
      docs: {
        label: fields.text().notNull(),
        value: api.field(),
        other: api
          .field()
          .notNull()
          .default({ entries: [{ key: "default-key", value: null }] }),
        items: api.arrayField(),
        many: api.arrayField().notNull().default({ dimensions: [], values: [] }),
      },
    }),
    { namespace: "app" },
  );
  const requirements = schema.metadata.extensionRequirements ?? [];
  expect(new Set(requirements.map((requirement) => requirement.member))).toEqual(
    new Set(["type:$extension:hstore.hstore", "type:$extension:hstore._hstore"]),
  );
  for (const requirement of requirements)
    expect(requirement).toEqual({
      name: "hstore",
      version: "1.8",
      schema: namespace,
      digest: capture.digest,
      member: requirement.member,
    });
  const snapshot = await createSnapshot(schema);
  const columns = Object.fromEntries(
    snapshot.ddl.flatMap((entity) =>
      entity.entityType === "columns" && entity.table === "docs" ? [[entity.name, entity] as const] : [],
    ),
  );
  expect(columns.value).toMatchObject({ type: quotedType, dimensions: 0, notNull: false });
  expect(columns.other).toMatchObject({ type: quotedType, dimensions: 0, notNull: true });
  expect(columns.items).toMatchObject({ type: quotedType, dimensions: 1, notNull: false });
  expect(columns.many).toMatchObject({ type: quotedType, dimensions: 1, notNull: true });
  expect(String(columns.other!.default)).toContain("default-key");
  expect(String(columns.many!.default)).toContain("{}");
});

test("hstoreFields.openNoPublicSearchOrScalarIndexAcceptance", () => {
  const schema = defineSchema(
    (fields) => ({ docs: { label: fields.text().notNull(), value: api.field(), items: api.arrayField() } }),
    { namespace: "app" },
  );
  const validators = createSearchValidators(schema, defineRelations(schema.tables));
  for (const name of ["value", "items"] as const) {
    // @ts-expect-error Equality, ordering and text matching are not approved for hstore fields.
    expect(() => validators.docs.search({ columns: [name], filter: [name], scope: "public" })).toThrow(
      "Unsupported extension search filter",
    );
    // @ts-expect-error Equality, ordering and text matching are not approved for hstore fields.
    expect(() => validators.docs.search({ columns: [name], order: [name], scope: "public" })).toThrow(
      "Unsupported extension search order",
    );
    // @ts-expect-error Equality, ordering and text matching are not approved for hstore fields.
    expect(() => validators.docs.search({ columns: [name], text: [name], scope: "public" })).toThrow(
      "Unsupported extension search text",
    );
  }
  // Native array storage must not satisfy a scalar index class, with either legacy or captured class inputs.
  const scalarClass = {
    extension: descriptor,
    member: "opclass:$extension:hstore.btree_hstore_ops/btree",
    method: "btree",
    opclass: "btree_hstore_ops",
    type: "hstore",
  } as const;
  const array = api.arrayField().metadata;
  expect(extensionIndexAcceptsField(createExtensionIndex(scalarClass), array)).toBe(false);
  expect(
    extensionIndexAcceptsField(
      createExtensionIndex({ ...scalarClass, manifest: v.parse(extensionManifestValidator, capture) }),
      array,
    ),
  ).toBe(false);
});
