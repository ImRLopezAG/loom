import { test, expect } from "vite-plus/test";
import { createPgPartman_5_1_0, pgPartmanDigest } from "../../../apps/loom/src/core/extensions/adapters/pg_partman";
import { pgPartmanAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_partman";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_partman.json";
import {
  check_default_tableCodec,
  check_default_tableArrayCodec,
  part_configCodec,
  show_partition_infoCodec,
} from "../../../apps/loom/src/core/extensions/adapters/pg_partman-codecs";
import native from "../../e2e/fixtures/pg_partman-native-characterization.json";
import { validateRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
const descriptor = {
  name: "pg_partman",
  version: "5.1.0",
  schema: 'part"man',
  apiSupport: { status: "verified", digest: pgPartmanDigest },
} as const;
test("exact 193 identities and 39 direct native routine receipts", () => {
  expect(pgPartmanAnnotations.map((m): string => m.id).sort()).toEqual(
    manifest.contract.members.map((m) => m.id).sort(),
  );
  expect(native.records.map((m) => m.member).sort()).toEqual(
    manifest.contract.members
      .filter((m) => m.kind === "routine")
      .map((m) => m.id)
      .sort(),
  );
  expect(native.procedureInTransaction).toBe("2D000");
  expect(native.records.every((m) => m.sourceSha256.length === 64)).toBe(true);
  expect(pgPartmanDigest).toBe(manifest.digest);
});
test("operator methods stay outside application SQL; defaults qualify and bind", () => {
  const api = createPgPartman_5_1_0(descriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const expression = api.check_name_length("x", undefined, true);
  const compiled = dialect.sqlToQuery(expression);
  expect(compiled.sql).toContain('"part""man"."check_name_length"');
  expect(compiled.sql).toContain('"p_table_partition" =>');
  expect(compiled.params).toEqual(["x", true]);
  expect(extensionExpressionContract(api.show_partitions("fixture.parent"))?.observability).toBe("external");
  expect(api.sql.functions).not.toHaveProperty("create_parent");
  expect(api).not.toHaveProperty("run_maintenance_proc");
  expect(() => createPgPartman_5_1_0({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow();
});
test("native composites preserve nullable attributes, exact bigint and array bounds", () => {
  expect(check_default_tableCodec.decode("(default,9007199254740993)")).toEqual({
    default_table: "default",
    count: 9007199254740993n,
  });
  expect(show_partition_infoCodec.decode("(,,0,9,)")).toEqual({
    child_start_time: null,
    child_end_time: null,
    child_start_id: 0n,
    child_end_id: 9n,
    suffix: null,
  });
  const array = check_default_tableArrayCodec.decode('[0:1]={"(a,9007199254740993)",NULL}');
  expect(array.dimensions).toEqual([{ lowerBound: 0, length: 2 }]);
  expect(array.values).toEqual([{ default_table: "a", count: 9007199254740993n }, null]);
  const allNull = part_configCodec.decode("(" + Array(27).fill("").join(",") + ")");
  expect(allNull.parent_table).toBeNull();
  const api = createPgPartman_5_1_0(descriptor);
  for (const name of ["check_default_table", "part_config", "part_config_sub", "table_privs"] as const) {
    expect(api[`${name}Field`]().metadata.extension?.digest).toBe(manifest.digest);
    expect(api[`${name}ArrayField`]().metadata.extension?.digest).toBe(manifest.digest);
  }
});
test("all eight composite field projections survive canonical required-API serialization", () => {
  const api = createPgPartman_5_1_0({ ...descriptor, schema: "extensions" });
  const fields = [];
  for (const name of ["check_default_table", "part_config", "part_config_sub", "table_privs"] as const) {
    for (const suffix of ["Field", "ArrayField"] as const) {
      const metadata = api[`${name}${suffix}`]().metadata.extension;
      expect(metadata).toBeDefined();
      fields.push({ table: "owned.reports", field: `${name}${suffix}`, metadata });
    }
  }
  const required = validateRequiredApi({ format: 1, apis: [{ schema: "extensions", manifest }], fields, indexes: [] });
  expect(required.fields).toHaveLength(8);
});
