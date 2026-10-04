import { expect } from "vite-plus/test";
import * as v from "valibot";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createIntarray_1_5, intarrayValues } from "../../../apps/loom/src/core/extensions/adapters/intarray";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import {
  createExtensionIndex,
  createNativeExtensionField,
  extensionIndexAcceptsField,
  extensionIndexOpclass,
} from "../../../apps/loom/src/core/extensions/fields";
import { int4ArrayCodec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { intarrayAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/intarray";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/intarray.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { intarrayUnitProofCase } from "../../e2e/fixtures/intarray-proof-cases";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { buildRequiredApi, validateRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";

const manifest = v.parse(extensionManifestValidator, capture);
const descriptor = {
  name: "intarray",
  version: "1.5",
  schema: 'Int"日本',
  apiSupport: { status: "verified", digest: "c71054bd4b390e4e0457bb83bbaeaaef426319c14d6f0563fecfb8758d3224f2" },
} as const;
const dialect = extensionSqlDialect(nodePgCodecs);

extensionProofUnitTest(intarrayUnitProofCase, () => {
  expect(manifest.digest).toBe(descriptor.apiSupport.digest);
  for (const wrong of [
    { ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } },
    { ...descriptor, version: "1.4" },
    { ...descriptor, apiSupport: { status: "unverified" } },
  ])
    // @ts-expect-error Only the exact verified 1.5 pin is accepted.
    expect(() => createIntarray_1_5(wrong)).toThrow("intarray 1.5 requires its exact verified contract");
  const api = createIntarray_1_5(descriptor);
  const nativeField = api.field().notNull();
  expect(nativeField.metadata.extension?.storage).toEqual({ schema: "pg_catalog", type: "int4", dimensions: 1 });
  const schema = defineSchema(() => ({
    documents: defineTable(
      { tags: nativeField },
      {
        indexes: [{ fields: ["tags"], extension: api.indexes.gin() }],
      },
    ),
  }));
  expect(schema.metadata.extensionRequirements).toBeDefined();
  expect(() => api.sort([2, 1], "aSc")).not.toThrow();
  expect(() => api.sort([2, 1], "DeSc")).not.toThrow();

  // Every captured member has exactly one disposition, and every callable member has exactly one canonical binding.
  expect(intarrayAnnotations.map((row) => row.id).sort()).toEqual(
    manifest.contract.members.map((row) => row.id).sort(),
  );
  expect(new Set(intarrayAnnotations.map((row) => row.id)).size).toBe(111);
  const callable = manifest.contract.members.filter(
    (member) =>
      member.kind === "operator" ||
      (member.kind === "routine" &&
        !member.arguments.some((argument) => ["internal", "cstring"].includes(argument.type.name)) &&
        member.returns.name !== "cstring"),
  );
  expect(Object.keys(api.sql.overloads).sort()).toEqual(callable.map((member) => member.id).sort());
  expect(callable).toHaveLength(39);
  const query = intarrayAnnotations.filter((row) => row.disposition === "query").map((row) => row.id);
  expect(query.sort()).toEqual(
    [
      ...callable.map((member) => member.id),
      "type:$extension:intarray.query_int",
      "type:$extension:intarray._query_int",
    ].sort(),
  );
  expect(intarrayAnnotations.filter((row) => row.disposition === "schema").map((row) => row.id)).toEqual(
    manifest.contract.members.filter((member) => member.kind === "opclass").map((member) => member.id),
  );
  for (const [id, call] of Object.entries(api.sql.overloads)) {
    // The captured identity lists operand types in order; an empty left operand marks a prefix operator.
    const types = id
      .slice(id.indexOf("(") + 1, -1)
      .split(",")
      .filter(Boolean);
    const values = types.map((type) =>
      type === "pg_catalog._int4"
        ? intarrayValues([1])
        : type.endsWith(".query_int")
          ? "1"
          : type === "pg_catalog.text"
            ? "asc"
            : 1,
    );
    // @ts-expect-error The overload table is heterogeneous; each entry is exercised with its captured arity.
    expect(extensionExpressionContract(call(...values))?.member).toBe(id);
  }

  // Canonical SQL: schema-qualified operators, exact casts, and arity-selected overloads.
  const contains = dialect.sqlToQuery(api.contains(intarrayValues([1, 2], 0), intarrayValues([])));
  expect(contains.sql).toBe('($1::"pg_catalog"."int4"[] operator("Int""日本".@>) $2::"pg_catalog"."int4"[])');
  expect(contains.params).toEqual(['[0:1]={"1","2"}', "{}"]);
  const count = dialect.sqlToQuery(api.count(intarrayValues([3])));
  expect(count.sql).toBe('(operator("Int""日本".#) $1::"pg_catalog"."int4"[])');
  const matches = dialect.sqlToQuery(api.matchedBy("1&!2", intarrayValues([1])));
  expect(matches.sql).toContain('$1::"Int""日本"."query_int" operator("Int""日本".~~)');
  expect(extensionExpressionContract(api.sort(intarrayValues([2, 1])))?.member).toBe(
    "routine:$extension:intarray.sort(pg_catalog._int4)",
  );
  expect(extensionExpressionContract(api.sort(intarrayValues([2, 1]), "DESC"))?.member).toBe(
    "routine:$extension:intarray.sort(pg_catalog._int4,pg_catalog.text)",
  );
  expect(extensionExpressionContract(api.subarray(intarrayValues([2, 1]), 1))?.member).toBe(
    "routine:$extension:intarray.subarray(pg_catalog._int4,pg_catalog.int4)",
  );
  expect(extensionExpressionContract(api.subarray(intarrayValues([2, 1]), 1, -1))?.member).toBe(
    "routine:$extension:intarray.subarray(pg_catalog._int4,pg_catalog.int4,pg_catalog.int4)",
  );
  // @ts-expect-error PostgreSQL accepts only ASC or DESC.
  expect(() => api.sort(intarrayValues([1]), "up")).toThrow();
  for (const outOfRange of [2147483648, 1.5]) expect(() => api.append(intarrayValues([1]), outOfRange)).toThrow();
  expect(() => api.indexOf({ dimensions: [{ lowerBound: 1, length: 2 }], values: [1] }, 1)).toThrow();

  // query_int and array codecs keep PostgreSQL's exact text forms.
  for (const valid of ["1", "-2147483648", "!(1|2)&3", " ( 1 ) ", "01"])
    expect(api.queryCodec.encode(valid)).toBe(valid);
  for (const invalid of ["", "1&", "1 2", "2147483648", "1\t&2", "(1", "1)", "1&&2", "+1"])
    expect(api.queryCodec.encode(invalid)).toBe(invalid);
  expect(api.queryCodec.decode("1 & ( 2 | !3 )")).toBe("1 & ( 2 | !3 )");
  expect(api.queryCodec.decode(null)).toBeNull();
  expect(api.arrayCodec.decode("[0:1]={5,6}")).toEqual(intarrayValues([5, 6], 0));
  expect(api.arrayCodec.decode("{{1,2},{3,NULL}}")).toEqual({
    dimensions: [
      { lowerBound: 1, length: 2 },
      { lowerBound: 1, length: 2 },
    ],
    values: [
      [1, 2],
      [3, null],
    ],
  });
  expect(intarrayValues([])).toEqual({ dimensions: [], values: [] });

  // Index helpers equal the manifest-checked contract and accept only null-free native int4[] fields.
  const indexes = [
    [api.indexes.gin(), "gin__int_ops", "gin", undefined],
    [api.indexes.gist(), "gist__int_ops", "gist", undefined],
    [api.indexes.gistBig(), "gist__intbig_ops", "gist", undefined],
  ] as const;
  for (const [contract, opclass, method] of indexes)
    expect(contract).toEqual(
      createExtensionIndex({
        extension: descriptor,
        manifest,
        member: `opclass:$extension:intarray.${opclass}/${method}`,
        method,
        opclass,
        type: "int4",
      }),
    );
  expect(extensionIndexOpclass(api.indexes.gist({ numranges: 252 }))).toBe(
    '"Int""日本"."gist__int_ops"("numranges"=252)',
  );
  expect(extensionIndexOpclass(api.indexes.gistBig({ siglen: 2024 }))).toBe(
    '"Int""日本"."gist__intbig_ops"("siglen"=2024)',
  );
  for (const bad of [0, 253, 1.5]) expect(() => api.indexes.gist({ numranges: bad })).toThrow();
  for (const bad of [0, 2025]) expect(() => api.indexes.gistBig({ siglen: bad })).toThrow();
  // @ts-expect-error siglen belongs to the signature class only.
  expect(() => api.indexes.gist({ siglen: 8 })).toThrow();
  const field = (nullable: boolean) =>
    createNativeExtensionField({
      extension: descriptor,
      manifest,
      member: "opclass:$extension:intarray.gin__int_ops/gin",
      input: { namespace: "pg_catalog", name: "_int4" },
      codec: int4ArrayCodec,
      value: {
        kind: "array",
        items: nullable
          ? { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] }
          : { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
      },
      search: { filter: false, comparison: false, order: false, text: false },
    }).metadata;
  for (const [contract] of indexes) {
    expect(extensionIndexAcceptsField(contract, field(false))).toBe(true);
    expect(extensionIndexAcceptsField(contract, field(true))).toBe(false);
  }
  for (const row of intarrayAnnotations) {
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
  }
  const arraySchema = defineSchema(() => ({ items: { values: api.field() } }));
  const required = buildRequiredApi({ intarray: { version: "1.5", schema: descriptor.schema } }, arraySchema.metadata);
  expect(required?.fields).toHaveLength(1);
  expect(validateRequiredApi(required)).toEqual(required);
  expect(() =>
    validateRequiredApi({
      ...required,
      fields: required?.fields.map((field) => ({
        ...field,
        metadata: { ...field.metadata, storage: { schema: "pg_catalog", type: "text", dimensions: 1 } },
      })),
    }),
  ).toThrow(/Required field type/);
});
