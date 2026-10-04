import { createBtreeGin_1_3 } from "../../../apps/loom/src/core/extensions/adapters/btree_gin";
import type { ExtensionIndexContract } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { pgSchema, pgTable, numeric, text } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

const api = createBtreeGin_1_3({
  name: "btree_gin",
  version: "1.3",
  schema: 'Custom"gin',
  apiSupport: { status: "verified", digest: "c3c8db3d98f5b687408fa9feac34338a9ad5fc0308c713b709008cd5889b709e" },
});
const version: "1.3" = api.version;
const schema: 'Custom"gin' = api.schema;
const name: "btree_gin" = api.name;
const classes: readonly ExtensionIndexContract[] = Object.values(api.indexes).map((declare) => declare());
const indexVersion: "1.3" = api.indexes.int4().version;
const indexMethod: "gin" = api.indexes.int4().method;
const indexClass: "int4_ops" = api.indexes.int4().opclass;
const indexInput: "int4" = api.indexes.int4().input.type;
const indexSchema: 'Custom"gin' = api.indexes.int4().schema;
api.indexes.enum();
api.indexes.numeric();
api.indexes.uuid();
defineSchema(
  (fields) => ({
    entries: defineTable(
      { code: fields.integer(), label: fields.text() },
      {
        indexes: [
          { fields: ["code"], extension: api.indexes.int4() },
          { fields: ["label"], extension: api.indexes.text() },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
// @ts-expect-error Only the exact captured classes are exposed.
api.indexes.jsonb();
// @ts-expect-error Class inputs are declarations, not scalar query arguments.
api.indexes.int4(42);
const ordered = pgSchema("native_enums").enum("ordered", ["low", "middle", "high"]);
const inputs = pgTable("inputs", { enumeration: ordered(), amount: numeric(), text: text() });
const numericResult: SQL<number | null> = api.ginNumericCmp("9007199254740992.0001", "9007199254740992.0002");
const enumResult: SQL<number | null> = api.ginEnumCmp(ordered, inputs.enumeration, "middle");
api.ginNumericCmp(inputs.amount, { nonfinite: "NaN" });
api.sql.functions.gin_numeric_cmp(null, { nonfinite: "Infinity" });
api.sql.functions.gin_enum_cmp(ordered, null, null);
api.sql.overloads["routine:$extension:btree_gin.gin_enum_cmp(pg_catalog.anyenum,pg_catalog.anyenum)"](
  ordered,
  "low",
  "high",
);
// @ts-expect-error Decimal input cannot lose precision through JavaScript numbers.
api.ginNumericCmp(1, "2");
// @ts-expect-error Only this concrete enum's labels are admitted; arguments cannot widen inference.
api.ginEnumCmp(ordered, "absent", "high");
// @ts-expect-error Both enum operands require the same checked labels.
api.ginEnumCmp(ordered, "low", "absent");
// @ts-expect-error Ordinary text columns are not native enum expressions.
api.ginEnumCmp(ordered, inputs.text, "high");
// @ts-expect-error A concrete native enum definition is required for polymorphic parameters.
api.ginEnumCmp("low", "high");
// @ts-expect-error Native-pointer support routines remain unavailable.
api.sql.functions.gin_extract_value_numeric("1", null);
// @ts-expect-error Operator administration is inaccessible through this binding.
api.reindex();
createBtreeGin_1_3({
  name: "btree_gin",
  // @ts-expect-error Only the exact captured version is admitted.
  version: "1.2",
  schema: "extensions",
  apiSupport: { status: "verified" },
});
createBtreeGin_1_3({
  // @ts-expect-error A different extension cannot use the factory.
  name: "btree_gist",
  version: "1.3",
  schema: "extensions",
  apiSupport: { status: "verified" },
});
void [
  version,
  schema,
  name,
  classes,
  indexVersion,
  indexMethod,
  indexClass,
  indexInput,
  indexSchema,
  numericResult,
  enumResult,
];
