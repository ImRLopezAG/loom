import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { defineRelations, getTableColumns } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { createExtensionField, createExtensionIndex } from "../../../apps/loom/src/core/extensions/fields";
import { createExtensionCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";
import { createSnapshot } from "../../../apps/loom/src/tooling/migrations/adapter";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { searchSchemaMetadata } from "../../../apps/loom/src/core/search/metadata";
import { createSearchCursor } from "../../../apps/loom/src/core/search/cursor";
import { searchPublicNode } from "../../../apps/loom/src/core/search/contract";
import { searchJsonSchemas } from "../../../apps/loom/src/core/search/json-schema";
import { compileSearch } from "../../../apps/loom/src/core/search/compiler";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import {
  assertSchemaExtensionCompatibility,
  compareExtensionSchemaCompatibility,
} from "../../../apps/loom/src/tooling/migrations/extension-compatibility";

const descriptor = {
  name: "fixture",
  version: "1",
  schema: "embedding",
  apiSupport: { status: "verified" as const, digest: "fixture-digest" },
};
const codec = createExtensionCodec({
  id: "fixture:vector:3:1",
  input: v.pipe(v.array(v.pipe(v.number(), v.finite())), v.length(3)),
  output: v.pipe(v.array(v.pipe(v.number(), v.finite())), v.length(3)),
  transport: "text",
  encode: (value) => `[${value.join(",")}]`,
  decode: (value) => JSON.parse(v.parse(v.string(), value)),
});
const operators = Object.fromEntries(
  Object.entries({ eq: "=", ne: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "~~", ilike: "~~*" }).map(
    ([key, name]) => [
      key,
      {
        member: `operator:${name}`,
        schema: "embedding",
        name,
        operand: key === "like" || key === "ilike" ? { schema: "pg_catalog", type: "text" } : ("field" as const),
      },
    ],
  ),
);
const definition = {
  extension: descriptor,
  member: "type:vector",
  type: "vector",
  codec,
  typmods: [3],
  parameters: { dimensions: 3 },
  value: { kind: "array" as const, items: { kind: "number" as const }, length: 3 },
  search: { filter: false, order: false, comparison: false, text: false } as const,
};

describe("extension schema contracts", () => {
  it("rejects operator operands that disagree with public filter and ordering semantics", () => {
    const scalar = {
      ...definition,
      codec: textCodec,
      type: "scalar",
      typmods: [],
      value: { kind: "string" as const },
      search: { filter: true, order: true, comparison: true, text: true },
      operators,
    };
    expect(() =>
      createExtensionField({
        ...scalar,
        operators: { ...operators, like: { member: "operator:~~", schema: "embedding", name: "~~", operand: "field" } },
      }),
    ).toThrow("operand");
    expect(() =>
      createExtensionField({
        ...scalar,
        operators: {
          ...operators,
          lt: { member: "operator:<", schema: "embedding", name: "<", operand: { schema: "pg_catalog", type: "text" } },
        },
      }),
    ).toThrow("operand");
  });
  it("uses the checked native codec for defaults, storage validation and fingerprints", async () => {
    const field = createExtensionField(definition).notNull().unique().default([1, 2, 3]);
    const schema = defineSchema(() => ({ documents: { embedding: field } }));
    expect(getTableColumns(schema.tables.documents).embedding.getSQLType()).toBe('"embedding"."vector"(3)');
    expect(await schema.validators.documents.insert["~standard"].validate({ embedding: [1, 2, 3] })).toEqual({
      value: { embedding: [1, 2, 3] },
    });
    expect(await schema.validators.documents.insert["~standard"].validate({ embedding: [1, 2] })).toHaveProperty(
      "issues",
    );
    expect(schema.metadata.entities[0]?.fields[0]?.extension).toMatchObject({
      member: "type:vector",
      codec: codec.id,
      schema: "embedding",
      typmods: [3],
      parameters: { dimensions: 3 },
    });
    const changed = defineSchema(() => ({
      documents: { embedding: createExtensionField({ ...definition, parameters: { dimensions: 4 } }) },
    }));
    expect(changed.fingerprint).not.toBe(schema.fingerprint);
    const snapshot = await createSnapshot(schema);
    expect(snapshot.ddl.find((entry) => entry.entityType === "columns" && entry.name === "embedding")).toMatchObject({
      type: '"embedding"."vector"(3)',
      typeSchema: null,
      default: "'[1,2,3]'",
    });
  });
  it("preserves qualified operator classes and index options, and rejects mismatched field contracts", async () => {
    const index = createExtensionIndex({
      extension: descriptor,
      member: "opclass:vector_l2_ops",
      method: "hnsw",
      opclass: "vector_l2_ops",
      type: "vector",
    });
    const schema = defineSchema(() => ({
      documents: defineTable(
        { embedding: createExtensionField(definition) },
        { indexes: [{ fields: ["embedding"], extension: index, with: { m: 16 } }] },
      ),
    }));
    const snapshot = await createSnapshot(schema);
    expect(snapshot.ddl.find((entry) => entry.entityType === "indexes")).toMatchObject({
      method: "hnsw",
      with: "m=16",
      columns: [{ value: "embedding", opclass: { name: '"embedding"."vector_l2_ops"', default: false } }],
    });
    expect(() =>
      defineSchema(() => ({
        documents: defineTable(
          { embedding: createExtensionField(definition) },
          { indexes: [{ fields: ["embedding"], extension: { ...index, type: "halfvec" } }] },
        ),
      })),
    ).toThrow("incompatible");
  });
  it("rejects representation-derived search ordering and allows only declared operations", async () => {
    const opaque = createExtensionField({
      ...definition,
      codec: textCodec,
      type: "opaque",
      operators,
      typmods: [],
      value: { kind: "string" },
      search: { filter: true, order: false, comparison: false, text: false },
    });
    const schema = defineSchema(() => ({ documents: { opaque } }));
    const search = createSearchValidators(schema, defineRelations(schema.tables));
    // Runtime parity must reject unsafe policies even when invoked from JavaScript.
    // @ts-expect-error Runtime parity checks a policy that TypeScript also rejects.
    expect(() => search.documents.search({ columns: ["opaque"], order: ["opaque"], scope: "public" })).toThrow("order");
    const descriptor = search.documents.search({ columns: ["opaque"], filter: ["opaque"], scope: "public" });
    expect(await descriptor.input["~standard"].validate({ where: { opaque: { eq: "a" } } })).toHaveProperty("value");
    expect(await descriptor.input["~standard"].validate({ where: { opaque: { gt: "a" } } })).toHaveProperty("issues");
  });
  it("round-trips approved scalar cursors and portable browser field validation", async () => {
    const scalar = createExtensionField({
      ...definition,
      codec: textCodec,
      type: "scalar",
      operators,
      typmods: [],
      value: { kind: "string", pattern: "^[a-z]+$" },
      search: { filter: true, order: true, comparison: true, text: true },
    });
    const schema = defineSchema(() => ({ documents: { scalar: scalar.notNull() } }));
    const search = createSearchValidators(schema, defineRelations(schema.tables)).documents.search({
      columns: ["scalar"],
      filter: ["scalar"],
      order: ["scalar"],
      text: ["scalar"],
      scope: "public",
    });
    const runtime = searchSchemaMetadata(search.input)?.descriptor;
    const publicNode = searchPublicNode(search.input);
    if (!runtime || !publicNode) throw new Error("Missing descriptor");
    expect(searchJsonSchemas(publicNode).output.properties?.rows?.items?.properties?.scalar).toMatchObject({
      type: "string",
      pattern: "^[a-z]+$",
    });
    const cursor = createSearchCursor(
      "03".repeat(32),
      runtime,
      { orderBy: [{ field: "scalar", direction: "asc" }] },
      { branchId: "fixture", namespace: "public", contract: "documents", identity: null },
    );
    const values = ["value", "7c21a867-46c8-4f0f-96d7-65a7bc10ee12"];
    expect(await cursor.read(await cursor.issue(values, "forward"), "forward")).toEqual(values);
    await expect(cursor.issue(["INVALID", values[1]!], "forward")).rejects.toMatchObject({ code: "INVALID_CURSOR" });
  });
  it("requires compatible selected contracts and reviews semantic codec/layout changes", () => {
    const before = defineSchema(() => ({ documents: { embedding: createExtensionField(definition) } }));
    expect(() => assertSchemaExtensionCompatibility(before.metadata, undefined)).toThrow("fixture");
    expect(() =>
      assertSchemaExtensionCompatibility(before.metadata, { fixture: { ...descriptor, schema: "other" } }),
    ).toThrow("namespace");
    expect(() =>
      assertSchemaExtensionCompatibility(before.metadata, { fixture: { ...descriptor, version: "2" } }),
    ).toThrow("version");
    expect(() => assertSchemaExtensionCompatibility(before.metadata, { fixture: descriptor })).not.toThrow();
    const after = defineSchema(() => ({
      documents: { embedding: createExtensionField({ ...definition, parameters: { dimensions: 4 } }) },
    }));
    expect(compareExtensionSchemaCompatibility(before.metadata, after.metadata)).toEqual([
      { entity: "documents.embedding", compatible: false, reason: "Extension field layout or codec changed" },
    ]);
    expect(compareExtensionSchemaCompatibility(before.metadata, before.metadata)).toEqual([]);
  });
  it("compares extension indexes by semantic identity and ignores object insertion order", () => {
    const index = createExtensionIndex({
      extension: descriptor,
      member: "opclass:l2",
      method: "hnsw",
      opclass: "l2",
      type: "vector",
    });
    const other = createExtensionIndex({
      extension: descriptor,
      member: "opclass:ip",
      method: "hnsw",
      opclass: "ip",
      type: "vector",
    });
    const make = (reverse: boolean) =>
      defineSchema(() => ({
        documents: defineTable(
          { embedding: createExtensionField(definition) },
          {
            indexes: (reverse ? [other, index] : [index, other]).map((extension) => ({
              fields: ["embedding"] as const,
              extension,
              with: reverse ? { ef_construction: 32, m: 8 } : { m: 8, ef_construction: 32 },
            })),
          },
        ),
      }));
    expect(compareExtensionSchemaCompatibility(make(false).metadata, make(true).metadata)).toEqual([]);
  });
  it("encodes declared text-pattern operands independently of constrained field storage", () => {
    const letters = createExtensionCodec({
      id: "letters",
      transport: "native",
      input: v.pipe(v.string(), v.regex(/^[a-z]+$/)),
      output: v.string(),
      encode: (value) => value,
      decode: (value) => v.parse(v.string(), value),
    });
    const field = createExtensionField({
      ...definition,
      type: "scalar",
      typmods: [],
      codec: letters,
      value: { kind: "string" },
      search: { filter: true, comparison: false, order: false, text: true },
      operators: {
        ...operators,
        like: {
          member: "operator:~~",
          schema: "embedding",
          name: "~~",
          operand: { schema: "pg_catalog", type: "text" },
        },
        ilike: {
          member: "operator:~~*",
          schema: "embedding",
          name: "~~*",
          operand: { schema: "pg_catalog", type: "text" },
        },
      },
    });
    const schema = defineSchema(() => ({ documents: { title: field } }));
    const search = createSearchValidators(schema, defineRelations(schema.tables)).documents.search({
      columns: ["title"],
      filter: ["title"],
      text: ["title"],
      scope: "public",
    });
    const runtime = searchSchemaMetadata(search.input)?.descriptor;
    if (!runtime) throw new Error("Missing search descriptor");
    const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(
      compileSearch(runtime, { where: { title: { contains: "abc" } } }, null).where(schema.tables.documents),
    );
    expect(query.params).toEqual(["%abc%"]);
    expect(query.sql).toContain('operator("embedding".~~)');
    expect(query.sql).toContain('::"pg_catalog"."text"');
  });
});
