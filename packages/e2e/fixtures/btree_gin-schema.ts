import { customType, index, integer, pgSchema } from "drizzle-orm/pg-core";
import { createBtreeGin_1_3 } from "../../../apps/loom/src/core/extensions/adapters/btree_gin";
import { extensionIndexOpclass } from "../../../apps/loom/src/core/extensions/fields";

/** Native columns are fixture inputs, not newly claimed Loom field/codec APIs. */
export const btreeGinSamples = {
  bit: ["001", "010", "100"],
  bool: ["false", "true", "true"],
  bpchar: ["a", "b", "c"],
  bytea: ["\\x01", "\\x02", "\\x03"],
  char: ["a", "b", "c"],
  cidr: ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"],
  date: ["2000-01-01", "2000-01-02", "2000-01-03"],
  enum: ["low", "middle", "high"],
  float4: ["-1.5", "0", "1.5"],
  float8: ["-1.5", "0", "1.5"],
  inet: ["10.0.0.1", "10.0.0.2", "10.0.0.3"],
  int2: ["-1", "0", "1"],
  int4: ["-1", "0", "1"],
  int8: ["9007199254740992", "9007199254740993", "9007199254740994"],
  interval: ["1 day", "2 days", "3 days"],
  macaddr: ["00:00:00:00:00:01", "00:00:00:00:00:02", "00:00:00:00:00:03"],
  macaddr8: ["00:00:00:00:00:00:00:01", "00:00:00:00:00:00:00:02", "00:00:00:00:00:00:00:03"],
  money: ["1.00", "2.00", "3.00"],
  name: ["a", "b", "c"],
  numeric: ["9007199254740992.0001", "9007199254740992.0002", "9007199254740992.0003"],
  oid: ["1", "2", "3"],
  text: ["a", "b", "c"],
  time: ["01:00:00", "02:00:00", "03:00:00"],
  timestamp: ["2000-01-01 01:00:00", "2000-01-02 01:00:00", "2000-01-03 01:00:00"],
  timestamptz: ["2000-01-01 01:00:00+00", "2000-01-02 01:00:00+00", "2000-01-03 01:00:00+00"],
  timetz: ["01:00:00+00", "02:00:00+00", "03:00:00+00"],
  uuid: [
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002",
    "00000000-0000-0000-0000-000000000003",
  ],
  varbit: ["001", "010", "100"],
  varchar: ["a", "b", "c"],
} as const;
export type BtreeGinClass = keyof typeof btreeGinSamples;
export function btreeGinSqlType(key: BtreeGinClass): string {
  return key === "enum" ? '"btree_gin_types"."ordered"' : `"pg_catalog"."${key}"`;
}

/** The existing NativeMigrationSchema path supports all captured native inputs, including real PostgreSQL enums. */
export function btreeGinNativeSchema(placement: string) {
  const api = createBtreeGin_1_3({
    name: "btree_gin",
    version: "1.3",
    schema: placement,
    apiSupport: { status: "verified", digest: "c3c8db3d98f5b687408fa9feac34338a9ad5fc0308c713b709008cd5889b709e" },
  });
  const namespace = pgSchema("app");
  const tables = Object.fromEntries(
    Object.keys(api.indexes).map((name) => {
      // SAFETY: the closed factory's own keys are precisely the reviewed fixture classes.
      const key = name as BtreeGinClass;
      const contract = api.indexes[key]();
      const value = customType<{ data: string; driverData: string }>({ dataType: () => btreeGinSqlType(key) });
      return [
        key,
        namespace.table(`btree_gin_${key}`, { id: integer(), value: value() }, (table) => [
          index(`btree_gin_${key}_idx`).using(contract.method, table.value.op(extensionIndexOpclass(contract))),
        ]),
      ];
    }),
  );
  return { namespace: "app", tables };
}
