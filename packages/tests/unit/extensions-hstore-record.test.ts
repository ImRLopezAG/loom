import { expect, test } from "vite-plus/test";
import { defineRelations, getColumnTable, getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { nodePgCodecs } from "drizzle-orm/node-postgres/codecs";
import { getColumnFromDecoder } from "drizzle-orm/utils";
import { createHstoreRecord_1_8 } from "../../../apps/loom/src/core/extensions/hstore-record";
import { textCodec, booleanCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createCitext_1_8 } from "../../../apps/loom/src/core/extensions/adapters/citext";
import citextCapture from "../../../apps/loom/src/tooling/extensions/manifests/citext.json";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { defineSchema, type SchemaDefinition } from "../../../apps/loom/src/core/schema/define-schema";
import { withNestedQueryInvocation } from "../../../apps/loom/src/core/extensions/nested-query-private";
import {
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";

const descriptor = {
  name: "hstore",
  version: "1.8",
  schema: 'Hstore_"Record_日本',
  apiSupport: { status: "verified", digest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1" },
} as const;
const api = createHstoreRecord_1_8(descriptor);
const schema = defineSchema(
  (field) => ({
    recordShadow: {
      displayName: field.text().notNull(),
      recordShadow: field.text(),
      status: field.enum(["open", "closed"]).notNull(),
      amount: field.numeric({ precision: 8, scale: 2 }),
    },
  }),
  { namespace: "component_records" },
);
const dialect = extensionSqlDialect(nodePgCodecs);
async function owned(work: () => void | Promise<void>, activeSchema: SchemaDefinition = schema) {
  const failures = new Set<Error>();
  await withNestedQueryInvocation(
    {
      graph: defineRelations<{ recordShadow: PgTable }>({ recordShadow: activeSchema.tables.recordShadow! }),
      identity: null,
      assertCurrent: () => {},
      fail: (cause) => {
        failures.add(cause);
      },
    },
    work,
  );
  return [...failures];
}

test("hstore.record.exactPinsAndThreeIdentities", () => {
  expect(Object.keys(api.sql.overloads).sort()).toEqual([
    "operator:$extension:hstore.#=(pg_catalog.anyelement,$extension:hstore.hstore)",
    "routine:$extension:hstore.hstore(pg_catalog.record)",
    "routine:$extension:hstore.populate_record(pg_catalog.anyelement,$extension:hstore.hstore)",
  ]);
  expect(() => createHstoreRecord_1_8({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow(
    "exact verified contract",
  );
  expect(() => createHstoreRecord_1_8({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow(
    "exact verified contract",
  );
});

test("hstore.record.namedRowsTypesAndAttributeMappings", async () => {
  await owned(() => {
    const row = api.record.tableRow(schema, "recordShadow");
    const rowSql = dialect.sqlToQuery(api.fromRecord(row));
    expect(rowSql.sql).toContain('"component_records"."record_shadow".*');
    expect(extensionExpressionContract(api.fromRecord(row))?.dependencies).toEqual(["component_records.record_shadow"]);
    const type = api.record.tableType(schema, "recordShadow");
    const typeSql = dialect.sqlToQuery(api.fromRecord(type));
    expect(typeSql.sql).toContain('null::"component_records"."record_shadow"');
    expect(extensionExpressionContract(api.fromRecord(type))?.dependencies).toEqual([]);
    const replaced = api.sql.operators["#="](type, { entries: [{ key: "display_name", value: "updated" }] });
    const expression = dialect.sqlToQuery(replaced.fields.displayName);
    expect(expression.sql).toContain('operator("Hstore_""Record_日本".#=)');
    expect(expression.sql).toContain(')."display_name"');
    expect(expression.params).toEqual(['"display_name"=>"updated"']);
    expect(dialect.sqlToQuery(replaced.isNull).sql).toContain("is not distinct from null");
    expect(replaced.attributes).toEqual({
      _id: "_id",
      _createdAt: "_createdAt",
      amount: "amount",
      displayName: "display_name",
      recordShadow: "record_shadow",
      status: "status",
    });
    const amountDecoder = getColumnFromDecoder(replaced.fields.amount);
    const createdDecoder = getColumnFromDecoder(replaced.fields._createdAt);
    if (!amountDecoder || !createdDecoder) throw new Error("Expected real column decoder metadata");
    expect(getColumnTable(amountDecoder)).toBe(schema.tables.recordShadow);
    expect(getColumnFromDecoder(replaced.fields.amount)?.getSQLType()).toBe(
      schema.tables.recordShadow.amount.getSQLType(),
    );
    expect(getColumnTable(createdDecoder)).toBe(schema.tables.recordShadow);
    expect(getColumnFromDecoder(replaced.fields._createdAt)?.getSQLType()).toBe("bigint");
    const mapCreated = dialect.mapperGenerators.rows([{ path: ["created"], field: replaced.fields._createdAt }], {});
    expect(mapCreated([["42"]])).toEqual([{ created: 42 }]);
    expect(() => mapCreated([["9223372036854775807"]])).toThrow("safe integer range");
    const mapJson = v.parse(v.object({ mapFromJsonValue: v.function() }), createdDecoder).mapFromJsonValue;
    expect(mapJson("42")).toBe(42);
    expect(() => mapJson("9223372036854775807")).toThrow("safe integer range");
    const mapStatus = dialect.mapperGenerators.rows([{ path: ["status"], field: replaced.fields.status }], {});
    expect(() => mapStatus([["outside_enum"]])).toThrow("declared enum");
    expect(mapStatus([["open"]])).toEqual([{ status: "open" }]);
    expect(mapStatus([[null]])).toEqual([{ status: null }]);
  });
});

test("hstore.record.attributeOnlySelectionRetainsContractsAndLease", async () => {
  let captured: ReturnType<typeof dialect.sqlToQuery> | undefined;
  await owned(() => {
    const populated = api.populateRecord(api.record.tableType(schema, "recordShadow"), null);
    captured = dialect.sqlToQuery(populated.fields.displayName);
    const contracts = checkCompiledExtensionQuery(captured);
    expect(
      contracts.some(
        (contract) =>
          contract.member ===
          "routine:$extension:hstore.populate_record(pg_catalog.anyelement,$extension:hstore.hstore)",
      ),
    ).toBe(true);
  });
  expect(captured).toBeDefined();
  expect(() => checkCompiledExtensionQuery(captured!)).toThrow("different invocation");
});

test("hstore.record.tableIdentityRefusesOtherComponentAndPoisonsOwner", async () => {
  const other = defineSchema(
    (field) => ({
      recordShadow: {
        displayName: field.text().notNull(),
        recordShadow: field.text(),
        status: field.enum(["open", "closed"]).notNull(),
        amount: field.numeric({ precision: 8, scale: 2 }),
      },
    }),
    { namespace: "other_component" },
  );
  const failures = await owned(() => {
    expect(() => api.record.tableType(other, "recordShadow")).toThrow("outside the current invocation graph");
    expect(() => api.record.tableRow(other, "recordShadow")).toThrow("outside the current invocation graph");
  });
  expect(failures).toHaveLength(2);
  expect(() => api.record.tableType(schema, "recordShadow")).toThrow("active server invocation");
});

test("hstore.record.refusesForgedSchemaAndWitness", async () => {
  await owned(() => {
    const forged = { ...schema };
    expect(() => api.record.tableType(forged, "recordShadow")).toThrow("Loom schema entity");
    // @ts-expect-error Deliberate unknown entity tests the runtime refusal too.
    expect(() => api.record.tableRow(schema, "missing")).toThrow("Loom schema entity");
    const forgedWitness = Object.freeze({});
    // @ts-expect-error Deliberate forged witness tests runtime provenance.
    expect(() => api.fromRecord(forgedWitness)).toThrow("managed provenance");
    // @ts-expect-error Deliberate forged witness tests runtime provenance.
    expect(() => api.populateRecord(forgedWitness, null)).toThrow("managed provenance");
  });
});

test("hstore.record.anonymousRowsAreExplicitlyTypedAndReadOnly", () => {
  const anonymous = api.record.anonymousRow([
    [int4Codec, 1],
    [textCodec, "日本"],
    [booleanCodec, true],
  ] as const);
  const query = dialect.sqlToQuery(api.fromRecord(anonymous));
  expect(query.sql).toContain('row(($1)::"pg_catalog"."int4", ($2)::"pg_catalog"."text", ($3)::"pg_catalog"."bool")');
  expect(query.params).toEqual([1, "日本", true]);
  for (const invalid of ["\0", "\ud800", "\udfff"]) {
    expect(() => api.record.anonymousRow([[textCodec, invalid]])).toThrow("lossless PostgreSQL UTF8 text");
  }
  expect(() => api.record.anonymousRow([])).toThrow("1..1600");
  expect(() => api.record.anonymousRow(Array.from({ length: 1601 }, () => [int4Codec, 1] as const))).toThrow("1..1600");
  expect(() => api.record.anonymousRow([[{ ...textCodec, sqlType: undefined }, "text"]])).toThrow("captured SQL type");
  // @ts-expect-error Anonymous records cannot be used for a named rewrite.
  expect(() => api.populateRecord(anonymous, null)).toThrow("named table witness");
  // @ts-expect-error The canonical operator also refuses anonymous rewrites.
  expect(() => api.sql.operators["#="](anonymous, null)).toThrow("named table witness");
});

test("hstore.record.timestampObservabilitySurvivesEmbeddedProjection", async () => {
  const timed = defineSchema((field) => ({ recordShadow: { at: field.timestamp() } }));
  await owned(() => {
    const expression = api.populateRecord(api.record.tableType(timed, "recordShadow"), null).fields.at;
    expect(() =>
      withExtensionSqlExecution(
        {
          check: (contract) => {
            if (contract.observability === "session") throw new Error("session dependency");
          },
        },
        () => dialect.sqlToQuery(expression),
      ),
    ).toThrow("session dependency");
  }, timed);
});

test("hstore.record.chainKeepsOriginalTableAndScope", async () => {
  await owned(() => {
    const first = api.populateRecord(api.record.tableType(schema, "recordShadow"), { entries: [] });
    const second = api.sql.operators["#="](first.record, { entries: [{ key: "status", value: "open" }] });
    const query = dialect.sqlToQuery(sql`select ${api.fromRecord(second.record)}`);
    const native = checkCompiledExtensionQuery(query).filter(({ member }) => !member.startsWith("managed:"));
    expect(new Set(native.map(({ member }) => member))).toEqual(new Set(Object.keys(api.sql.overloads)));
  });
});

test("hstore.record.refusesMissingExtraOrRenamedColumns", async () => {
  const mutable = defineSchema((field) => ({ recordShadow: { displayName: field.text() } }));
  const columns = getTableColumns(mutable.tables.recordShadow);
  const name = columns.displayName;
  await owned(() => {
    Object.defineProperty(columns, "displayName", { value: undefined, configurable: true });
    try {
      expect(() => api.record.tableType(mutable, "recordShadow")).toThrow("columns differ");
    } finally {
      Object.defineProperty(columns, "displayName", { value: name, configurable: true });
    }
    Object.defineProperty(columns, "unexpected", { value: name, configurable: true, enumerable: true });
    try {
      expect(() => api.record.tableRow(mutable, "recordShadow")).toThrow("columns differ");
    } finally {
      Reflect.deleteProperty(columns, "unexpected");
    }
    Object.defineProperty(name, "name", { value: "different_attribute", configurable: true });
    try {
      expect(() => api.record.tableRow(mutable, "recordShadow")).toThrow("columns differ");
    } finally {
      Object.defineProperty(name, "name", { value: "display_name", configurable: true });
    }
  }, mutable);
});

test("hstore.record.extensionFieldsFailBeforeUnprovenTypeIO", async () => {
  const citext = createCitext_1_8({
    name: "citext",
    version: "1.8",
    schema: "extensions",
    apiSupport: { status: "verified", digest: citextCapture.digest },
  });
  const extended = defineSchema(() => ({ recordShadow: { value: citext.field() } }));
  await owned(() => {
    expect(() => api.record.tableRow(extended, "recordShadow")).toThrow("type I/O authority");
    expect(() => api.record.tableType(extended, "recordShadow")).toThrow("type I/O authority");
  }, extended);
});

test("hstore.record.anonymousTypeIORefusesUnreviewedNativeAndExtensionLeaves", () => {
  for (const sqlType of [
    { schema: "extensions", name: "citext" },
    { schema: "extensions", name: "hstore", array: true },
    { schema: "pg_catalog", name: "regclass" },
    { schema: "pg_catalog", name: "record" },
    { schema: "pg_catalog", name: "cstring", array: true },
  ]) {
    expect(() => api.record.anonymousRow([[{ ...textCodec, sqlType }, "value"]])).toThrow(
      "reviewed pg_catalog SQL type",
    );
  }
});
