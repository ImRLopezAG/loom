import type { ExtensionIndexContract } from "../../../apps/loom/src/core/extensions/fields";
import { createBloom_1_0, type BloomParameters } from "../../../apps/loom/src/core/extensions/adapters/bloom";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";

const bloom = createBloom_1_0({
  name: "bloom",
  version: "1.0",
  schema: 'custom"bloom',
  apiSupport: { status: "verified", digest: "e35e04e263d75f19673d2b1282a75b7975b74f201c7cd5dc8040188f54b06cc3" },
});
const schema: 'custom"bloom' = bloom.schema;
const version: "1.0" = bloom.version;
const int4: ExtensionIndexContract = bloom.indexes.int4();
const text: ExtensionIndexContract = bloom.indexes.text();
const storage: Readonly<Record<string, number>> = bloom.storage({ length: 80, bits: [2, 4] });
const options: BloomParameters = {};
const unique: false = bloom.accessMethod.unique;
const strategies: readonly ["="] = bloom.accessMethod.strategies;
defineSchema(
  (fields) => ({
    entries: defineTable(
      { code: fields.integer(), label: fields.text() },
      { indexes: [{ fields: ["code", "label"], extension: bloom.indexes.text(), with: bloom.storage({ bits: [2] }) }] },
    ),
  }),
  { namespace: "app" },
);
// @ts-expect-error Signature bits are numbers, not bigint.
bloom.storage({ bits: [1n] });
// @ts-expect-error fillfactor is not a bloom storage parameter.
bloom.storage({ fillfactor: 50 });
// @ts-expect-error Only the captured int4 and text classes exist.
bloom.indexes.int8();
// @ts-expect-error The access method has no scalar SQL helpers.
void bloom.sql;
createBloom_1_0({
  name: "bloom",
  // @ts-expect-error Factories only bind the captured extension version.
  version: "1.1",
  schema: "custom",
  apiSupport: { status: "verified" },
});
createBloom_1_0({
  // @ts-expect-error The factory cannot bind a different extension identity.
  name: "pg_trgm",
  version: "1.0",
  schema: "custom",
  apiSupport: { status: "verified" },
});
void [schema, version, int4, text, storage, options, unique, strategies];
