import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { createExtensionIndex, extensionIndexOpclass } from "../../../apps/loom/src/core/extensions/fields";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { createBtreeGin_1_3 } from "../../../apps/loom/src/core/extensions/adapters/btree_gin";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { createSnapshot } from "../../../apps/loom/src/tooling/migrations/adapter";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";

const manifest = v.parse(extensionManifestValidator, capture);
const definition = {
  extension: {
    name: "pg_trgm",
    version: "1.6",
    schema: "custom",
    apiSupport: { status: "verified" as const, digest: manifest.digest },
  },
  manifest,
  member: "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
  method: "gist",
  opclass: "gist_trgm_ops",
  type: "text",
};

test("operator class options are retained and rendered beside the qualified class", () => {
  const options = { siglen: 32 };
  const contract = createExtensionIndex({ ...definition, options });
  expect(contract.options).toEqual({ siglen: 32 });
  expect(extensionIndexOpclass(contract)).toBe('"custom"."gist_trgm_ops"("siglen"=32)');
  options.siglen = 64;
  expect(contract.options).toEqual({ siglen: 32 });
  expect(extensionIndexOpclass(createExtensionIndex(definition))).toBe('"custom"."gist_trgm_ops"');
});

test("operator class option literals cannot introduce SQL text", () => {
  expect(() => createExtensionIndex({ ...definition, options: { siglen: 1.5 } })).toThrow();
  expect(() => createExtensionIndex({ ...definition, options: { siglen: Infinity } })).toThrow();
  expect(() => createExtensionIndex({ ...definition, options: { "siglen);select": 32 } })).toThrow();
});


test("native Loom storage categories accept their captured BTREE_GIN classes", async () => {
  const api = createBtreeGin_1_3({
    name: "btree_gin", version: "1.3", schema: "native_indexes",
    apiSupport: { status: "verified", digest: "c3c8db3d98f5b687408fa9feac34338a9ad5fc0308c713b709008cd5889b709e" },
  });
  const schema = defineSchema((fields) => ({
    owners: defineTable({ id: fields.uuid() }),
    entries: defineTable({
      flag: fields.boolean(), count: fields.bigint(), amount: fields.numeric(),
      key: fields.uuid(), occurred: fields.timestamp(), owner: fields.reference("owners"),
    }, { indexes: [
      { fields: ["flag"], extension: api.indexes.bool() },
      { fields: ["count"], extension: api.indexes.int8() },
      { fields: ["amount"], extension: api.indexes.numeric() },
      { fields: ["key"], extension: api.indexes.uuid() },
      { fields: ["occurred"], extension: api.indexes.timestamptz() },
      { fields: ["owner"], extension: api.indexes.uuid() },
    ] }),
  }), { namespace: "app" });
  const snapshot = await createSnapshot(schema);
  expect(snapshot.ddl.filter((entity) => entity.entityType === "indexes")).toHaveLength(6);
  expect(snapshot.ddl.filter((entity) => entity.entityType === "indexes").every((entity) => entity.method === "gin")).toBe(true);
  expect(() => defineSchema((fields) => ({
    entries: defineTable({ flag: fields.boolean() }, {
      indexes: [{ fields: ["flag"], extension: api.indexes.int8() }],
    }),
  }), { namespace: "app" })).toThrow();
});
