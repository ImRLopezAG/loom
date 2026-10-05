import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { getTableColumns } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { fields } from "../../../apps/loom/src/core/schema/fields";
import {
  createExtensionField,
  createExtensionIndex,
  createNativeExtensionField,
} from "../../../apps/loom/src/core/extensions/fields";
import { int4ArrayCodec, int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { arrayCodec, integerCodec, textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import intarrayCapture from "../../../apps/loom/src/tooling/extensions/manifests/intarray.json";
import ltreeCapture from "../../../apps/loom/src/tooling/extensions/manifests/ltree.json";
import { extensionFieldMetadataValidator } from "../../../apps/loom/src/core/extensions/values";
import { createExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import { createSnapshot, snapshotHash } from "../../../apps/loom/src/tooling/migrations/adapter";

const manifest = v.parse(extensionManifestValidator, capture);
const extension = {
  name: manifest.contract.extension,
  version: manifest.contract.version,
  schema: "custom",
  apiSupport: { status: "verified" as const, digest: manifest.digest },
};
const noSearch = { filter: false, comparison: false, order: false, text: false } as const;
const intarrayManifest = v.parse(extensionManifestValidator, intarrayCapture);
const intarray = {
  name: "intarray",
  version: intarrayManifest.contract.version,
  schema: "custom",
  apiSupport: { status: "verified" as const, digest: intarrayManifest.digest },
};
const intMember = "opclass:$extension:intarray.gin__int_ops/gin";
const integerArray = () =>
  createNativeExtensionField({
    extension: intarray,
    manifest: intarrayManifest,
    member: intMember,
    input: { namespace: "pg_catalog", name: "_int4" },
    codec: int4ArrayCodec,
    value: { kind: "array", items: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 } },
    search: noSearch,
  });

test("native intarray storage retains its requirement owner and exact SQL/codec identity", async () => {
  const field = integerArray().notNull().default([0, -2147483648, 2147483647]);
  expect(field.metadata.extension).toMatchObject({
    name: "intarray",
    schema: "custom",
    member: intMember,
    digest: intarrayManifest.digest,
    type: "int4",
    array: true,
    storage: { schema: "pg_catalog", type: "int4", dimensions: 1 },
    codec: int4ArrayCodec.id,
  });
  expect(v.parse(extensionFieldMetadataValidator, field.metadata.extension)).toHaveProperty(
    "storage.schema",
    "pg_catalog",
  );
  const contract = createExtensionIndex({
    extension: intarray,
    manifest: intarrayManifest,
    member: intMember,
    method: "gin",
    opclass: "gin__int_ops",
    type: "int4",
  });
  const schema = defineSchema(() => ({
    documents: defineTable({ numbers: field }, { indexes: [{ fields: ["numbers"], extension: contract }] }),
  }));
  expect(getTableColumns(schema.tables.documents).numbers.getSQLType()).toBe('"pg_catalog"."int4"[]');
  expect(await schema.validators.documents.insert["~standard"].validate({ numbers: [1, 2] })).toHaveProperty("value");
  for (const numbers of [[1, null], [2147483648], [1.5]]) {
    expect(await schema.validators.documents.insert["~standard"].validate({ numbers })).toHaveProperty("issues");
    // @ts-expect-error JavaScript defaults must reject null elements just as typed defaults do.
    expect(() => field.default(numbers)).toThrow();
  }
  expect(schema.metadata.extensionRequirements).toEqual([
    {
      name: "intarray",
      version: intarray.version,
      schema: "custom",
      digest: intarrayManifest.digest,
      member: intMember,
    },
  ]);
  expect(
    (await createSnapshot(schema)).ddl.find((entry) => entry.entityType === "columns" && entry.name === "numbers"),
  ).toMatchObject({ type: "integer", typeSchema: null, dimensions: 1 });
  expect(() =>
    createNativeExtensionField({
      extension: intarray,
      manifest: intarrayManifest,
      member: "type:invented",
      input: { namespace: "pg_catalog", name: "_int4" },
      codec: int4ArrayCodec,
      value: { kind: "array", items: { kind: "number" } },
      search: noSearch,
    }),
  ).toThrow("captured");
  expect(() =>
    createNativeExtensionField({
      extension: intarray,
      manifest: intarrayManifest,
      member: intMember,
      input: { namespace: "pg_catalog", name: "_int4" },
      codec: arrayCodec(integerCodec),
      value: { kind: "array", items: { kind: "bigint" } },
      search: noSearch,
    }),
  ).toThrow("codec");
});

test("intarray indexes reject scalars, int8 arrays and nullable element projections", () => {
  const contract = createExtensionIndex({
    extension: intarray,
    manifest: intarrayManifest,
    member: intMember,
    method: "gin",
    opclass: "gin__int_ops",
    type: "int4",
  });
  const nullable = createNativeExtensionField({
    extension: intarray,
    manifest: intarrayManifest,
    member: intMember,
    input: { namespace: "pg_catalog", name: "_int4" },
    codec: int4ArrayCodec,
    value: { kind: "array", items: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] } },
    search: noSearch,
  });
  const bigintArray = createExtensionField({
    extension: { ...intarray, schema: "pg_catalog" },
    member: intMember,
    type: "int8",
    array: true,
    codec: arrayCodec(integerCodec),
    value: { kind: "array", items: { kind: "bigint" } },
    search: noSearch,
  });
  for (const numbers of [fields.integer(), bigintArray, nullable]) {
    expect(() =>
      defineSchema(() => ({
        documents: defineTable({ numbers }, { indexes: [{ fields: ["numbers"], extension: contract }] }),
      })),
    ).toThrow("incompatible");
  }
  expect(() => int4Codec.encode(2147483648)).toThrow();
  expect(int4Codec.decode("2147483647")).toBe(2147483647);
  expect(int4ArrayCodec.decode("{1,2,3}")).toEqual([1, 2, 3]);
  expect(() => int4ArrayCodec.decode("{1,NULL}")).toThrow();
  expect(() => int4ArrayCodec.decode("[0:1]={1,2}")).toThrow("lower bound 1");
  expect(() => int4ArrayCodec.decode("{{1,2},{3,4}}")).toThrow("one-dimensional");
  expect(int4ArrayCodec.decode("{}")).toEqual([]);
});

test("captured ltree array classes follow element metadata and reject other storage", () => {
  const manifest = v.parse(extensionManifestValidator, ltreeCapture);
  const extension = {
    name: "ltree",
    version: manifest.contract.version,
    schema: "tree",
    apiSupport: { status: "verified" as const, digest: manifest.digest },
  };
  const member = "opclass:$extension:ltree.gist__ltree_ops/gist";
  const contract = createExtensionIndex({
    extension,
    manifest,
    member,
    method: "gist",
    opclass: "gist__ltree_ops",
    type: "ltree",
  });
  const scalar = createExtensionField({
    extension,
    member: "type:$extension:ltree.ltree",
    type: "ltree",
    codec: textCodec,
    value: { kind: "string" },
    search: noSearch,
  });
  const array = createExtensionField({
    extension,
    member: "type:$extension:ltree.ltree",
    type: "ltree",
    array: true,
    codec: arrayCodec(textCodec),
    value: { kind: "array", items: { kind: "string" } },
    search: noSearch,
  });
  const schema = defineSchema(() => ({
    documents: defineTable({ paths: array }, { indexes: [{ fields: ["paths"], extension: contract }] }),
  }));
  expect(schema.metadata.extensionRequirements).toHaveLength(2);
  for (const paths of [
    scalar,
    integerArray(),
    createExtensionField({
      extension: { ...extension, name: "other", schema: "other" },
      member: "type:ltree",
      type: "ltree",
      array: true,
      codec: arrayCodec(textCodec),
      value: { kind: "array", items: { kind: "string" } },
      search: noSearch,
    }),
  ]) {
    expect(() =>
      defineSchema(() => ({
        documents: defineTable({ paths }, { indexes: [{ fields: ["paths"], extension: contract }] }),
      })),
    ).toThrow("incompatible");
  }
});

test("captured pg_trgm classes index native text and retain the extension requirement", async () => {
  for (const [method, opclass] of [
    ["gin", "gin_trgm_ops"],
    ["gist", "gist_trgm_ops"],
  ] as const) {
    const contract = createExtensionIndex({
      extension,
      manifest,
      member: `opclass:$extension:pg_trgm.${opclass}/${method}`,
      method,
      opclass,
      type: "text",
    });
    const schema = defineSchema((fields) => ({
      documents: defineTable({ title: fields.text() }, { indexes: [{ fields: ["title"], extension: contract }] }),
    }));
    expect(schema.metadata.extensionRequirements).toEqual([
      {
        name: "pg_trgm",
        version: manifest.contract.version,
        schema: "custom",
        digest: manifest.digest,
        member: `opclass:$extension:pg_trgm.${opclass}/${method}`,
      },
    ]);
    expect((await createSnapshot(schema)).ddl.find((entry) => entry.entityType === "indexes")).toMatchObject({
      method,
      columns: [{ value: "title", opclass: { name: `"custom"."${opclass}"`, default: false } }],
    });
    for (const title of [fields.boolean(), fields.integer()]) {
      expect(() =>
        defineSchema(() => ({
          documents: defineTable({ title }, { indexes: [{ fields: ["title"], extension: contract }] }),
        })),
      ).toThrow("incompatible");
    }
  }
});

test("extension-free desired snapshot retains its historical hash", async () => {
  const schema = defineSchema(
    (fields) => ({
      documents: defineTable(
        { title: fields.text().notNull().default("hello"), count: fields.integer(), active: fields.boolean() },
        {
          indexes: [{ fields: ["title"] }],
        },
      ),
    }),
    { namespace: "app" },
  );
  expect(snapshotHash(await createSnapshot(schema))).toBe(
    "c270d85ad23c6ab4a6ba972c81572ce7cdcc9a21ddc74877d90e72842ed47102",
  );
});

test("native storage requires the exact supported PostgreSQL and provider contract", () => {
  for (const contract of [
    { ...intarrayManifest.contract, postgresMajor: 19 },
    { ...intarrayManifest.contract, provider: "other" },
  ]) {
    const manifest = createExtensionManifest(contract, intarrayManifest.provenance);
    expect(() =>
      createNativeExtensionField({
        extension: { ...intarray, apiSupport: { status: "verified", digest: manifest.digest } },
        manifest,
        member: intMember,
        input: { namespace: "pg_catalog", name: "_int4" },
        codec: int4ArrayCodec,
        value: { kind: "array", items: { kind: "number" } },
        search: noSearch,
      }),
    ).toThrow("captured storage contract");
  }
});
