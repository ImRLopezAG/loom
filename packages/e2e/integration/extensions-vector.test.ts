import { test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { defineRelations, eq, sql, type SQL } from "drizzle-orm";
import { customType, integer, pgTable } from "drizzle-orm/pg-core";
import { createVector_0_8_6 } from "../../../apps/loom/src/core/extensions/adapters/vector";
import { floatCodec, type NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
import {
  createVectorCodec,
  type DenseVectorValue,
  type SparseVectorValue,
} from "../../../apps/loom/src/core/extensions/vector-codecs";
import { checkedExtensionExpression, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import type { AnyRelations } from "drizzle-orm";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/vector.json";
import { extensionManifestValidator, type ExtensionMember } from "../../../apps/loom/src/core/extensions/contracts";
import {
  nativeBinaryValue,
  observeNativeVector,
  vectorFunction,
  vectorSchema,
  vectorType,
  withNativeVector,
} from "../fixtures/vector-codecs";

const descriptor = {
  name: "vector",
  version: "0.8.6",
  schema: vectorSchema,
  apiSupport: { status: "verified", digest: capture.digest },
} as const;
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, capture));
type Api = ReturnType<typeof createVector_0_8_6>;
type Connection = DatabaseConnection<AnyRelations>;
type NativeResult = number | boolean | NonfiniteNumber | DenseVectorValue | SparseVectorValue | { hex: string } | null;
interface NativeCase {
  readonly expression: SQL<NativeResult>;
  readonly parameters: readonly (string | number | null)[];
}
async function withApi(operation: (client: pg.Client, connection: Connection, api: Api) => Promise<void>) {
  await withNativeVector(async (client, url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await operation(client, connection, createVector_0_8_6(descriptor));
    } finally {
      await connection.close();
    }
  });
}
const oneRow = sql`(values (1)) fixture(id)`;
async function selected(connection: Connection, expression: SQL<NativeResult>) {
  const rows = await connection.transaction((db) => db.select({ value: expression }).from(oneRow));
  assert.equal(rows.length, 1);
  return rows[0]!.value;
}
function rawCase(member: ExtensionMember) {
  if (member.kind === "routine") {
    const parameters = member.arguments.map(({ type }, index) => {
      const namespace = type.namespace === "$extension:vector" ? vectorSchema : type.namespace;
      return `$${index + 1}::${pg.escapeIdentifier(namespace)}.${pg.escapeIdentifier(type.name)}`;
    });
    return { expression: `${vectorFunction(member.name)}(${parameters.join(",")})`, returns: member.returns };
  }
  assert.equal(member.kind, "operator");
  if (member.kind !== "operator" || !member.left || !member.right || !member.returns)
    throw new Error("Expected captured scalar pair operator");
  return {
    expression: `$1::${vectorType(v.parse(v.picklist(["vector", "halfvec", "sparsevec"]), member.left.name))} operator(${pg.escapeIdentifier(vectorSchema)}.${member.name}) $2::${vectorType(v.parse(v.picklist(["vector", "halfvec", "sparsevec"]), member.right.name))}`,
    returns: member.returns,
  };
}
async function oracle(
  client: pg.Client,
  member: ExtensionMember,
  parameters: NativeCase["parameters"],
): Promise<NativeResult> {
  const raw = rawCase(member);
  if (raw.returns.namespace === "$extension:vector") {
    const kind = v.parse(v.picklist(["vector", "halfvec", "sparsevec"]), raw.returns.name);
    const observed = await observeNativeVector(client, kind, raw.expression, parameters);
    return observed.binary === null ? null : nativeBinaryValue(observed.binary);
  }
  if (raw.returns.name === "bytea") {
    const rows = v.parse(
      v.array(v.strictObject({ value: v.nullable(v.string()) })),
      (await client.query(`select pg_catalog.encode(${raw.expression},'hex') value`, [...parameters])).rows,
    );
    return rows[0]!.value === null ? null : { hex: rows[0]!.value };
  }
  const rows = v.parse(
    v.array(v.strictObject({ value: v.nullable(v.union([v.number(), v.nan(), v.boolean()])) })),
    (await client.query(`select ${raw.expression} value`, [...parameters])).rows,
  );
  const value = rows[0]!.value;
  return raw.returns.name === "float8" && value !== null ? floatCodec.decode(value) : value;
}
function scalarCases(api: Api): NativeCase[] {
  const cases: NativeCase[] = [];
  const add = (expression: SQL<NativeResult>, parameters: NativeCase["parameters"]) => {
    cases.push({ expression, parameters });
  };
  const left = [1, 2, 3],
    right = [3, 2, 1];
  const sparseLeft = {
    dimensions: 3,
    entries: [
      { index: 1, value: 1 },
      { index: 2, value: 2 },
      { index: 3, value: 3 },
    ],
  };
  const sparseRight = {
    dimensions: 3,
    entries: [
      { index: 1, value: 3 },
      { index: 2, value: 2 },
      { index: 3, value: 1 },
    ],
  };
  add(api.vector.sql.functions.l2_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.l1_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.cosine_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.inner_product(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_l2_squared_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_negative_inner_product(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_cmp(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_eq(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_ne(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_lt(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_le(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_gt(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_ge(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_spherical_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_add(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_sub(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_mul(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_concat(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.functions.vector_norm(left), ["[1,2,3]"]);
  add(api.vector.sql.functions.l2_normalize(left), ["[1,2,3]"]);
  add(api.vector.sql.functions.vector_send(left), ["[1,2,3]"]);
  add(api.vector.sql.functions.vector_dims(left), ["[1,2,3]"]);
  add(api.vector.subvector(left, 2, 2), ["[1,2,3]", 2, 2]);
  add(api.vector.sql.operators["<->"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["<+>"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["<=>"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["<#>"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["="](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["<>"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["<"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["<="](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators[">"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators[">="](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["+"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["-"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["*"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.vector.sql.operators["||"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.l2_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.l1_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.cosine_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.inner_product(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_l2_squared_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_negative_inner_product(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_cmp(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_eq(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_ne(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_lt(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_le(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_gt(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_ge(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_spherical_distance(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_add(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_sub(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_mul(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.halfvec_concat(left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.functions.l2_norm(left), ["[1,2,3]"]);
  add(api.halfvec.sql.functions.l2_normalize(left), ["[1,2,3]"]);
  add(api.halfvec.sql.functions.halfvec_send(left), ["[1,2,3]"]);
  add(api.halfvec.sql.functions.vector_dims(left), ["[1,2,3]"]);
  add(api.halfvec.subvector(left, 2, 2), ["[1,2,3]", 2, 2]);
  add(api.halfvec.sql.operators["<->"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["<+>"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["<=>"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["<#>"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["="](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["<>"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["<"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["<="](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators[">"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators[">="](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["+"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["-"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["*"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.halfvec.sql.operators["||"](left, right), ["[1,2,3]", "[3,2,1]"]);
  add(api.sparsevec.sql.functions.l2_distance(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.l1_distance(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.cosine_distance(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.inner_product(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.sparsevec_l2_squared_distance(sparseLeft, sparseRight), [
    "{1:1,2:2,3:3}/3",
    "{1:3,2:2,3:1}/3",
  ]);
  add(api.sparsevec.sql.functions.sparsevec_negative_inner_product(sparseLeft, sparseRight), [
    "{1:1,2:2,3:3}/3",
    "{1:3,2:2,3:1}/3",
  ]);
  add(api.sparsevec.sql.functions.sparsevec_cmp(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.sparsevec_eq(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.sparsevec_ne(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.sparsevec_lt(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.sparsevec_le(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.sparsevec_gt(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.sparsevec_ge(sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.functions.l2_norm(sparseLeft), ["{1:1,2:2,3:3}/3"]);
  add(api.sparsevec.sql.functions.l2_normalize(sparseLeft), ["{1:1,2:2,3:3}/3"]);
  add(api.sparsevec.sql.functions.sparsevec_send(sparseLeft), ["{1:1,2:2,3:3}/3"]);
  add(api.sparsevec.sql.operators["<->"](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.operators["<+>"](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.operators["<=>"](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.operators["<#>"](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.operators["="](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.operators["<>"](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.operators["<"](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.operators["<="](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.operators[">"](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  add(api.sparsevec.sql.operators[">="](sparseLeft, sparseRight), ["{1:1,2:2,3:3}/3", "{1:3,2:2,3:1}/3"]);
  return cases;
}

test("vector.scalarApiEvery100MemberQualifiedNativeOracleAndStrictNull", async () => {
  await withApi(async (client, connection, api) => {
    const cases = scalarCases(api);
    assert.equal(cases.length, 100);
    const covered: string[] = [];
    for (const entry of cases) {
      const id = extensionExpressionContract(entry.expression)?.member;
      const member = manifest.contract.members.find((member) => member.id === id);
      assert.ok(member, id);
      covered.push(member.id);
      assert.deepEqual(
        await selected(connection, entry.expression),
        await oracle(client, member, entry.parameters),
        member.id,
      );
    }
    assert.deepEqual(
      covered.sort(),
      Object.keys(api.sql.overloads)
        .filter((id) => covered.includes(id))
        .sort(),
    );
    // Every implemented function/operator is strict. Its public null input remains SQL NULL.
    for (const group of [api.vector, api.halfvec]) {
      for (const call of [
        group.l2Distance,
        group.l1Distance,
        group.cosineDistance,
        group.innerProduct,
        group.compare,
        group.add,
        group.subtract,
        group.multiply,
        group.concat,
        group.squaredDistance,
        group.sphericalDistance,
        group.negativeInnerProduct,
      ]) {
        assert.equal(await selected(connection, call(null, [1])), null);
        assert.equal(await selected(connection, call([1], null)), null);
      }
      for (const call of [group.norm, group.normalize, group.send, group.dimensions])
        assert.equal(await selected(connection, call(null)), null);
      assert.equal(await selected(connection, group.subvector([1], null, 1)), null);
      assert.equal(await selected(connection, group.subvector([1], 1, null)), null);
      for (const call of Object.values(group.sql.operators))
        assert.equal(await selected(connection, call(null, [1])), null);
    }
    const sparse = { dimensions: 1, entries: [{ index: 1, value: 1 }] };
    for (const call of [
      api.sparsevec.l2Distance,
      api.sparsevec.l1Distance,
      api.sparsevec.cosineDistance,
      api.sparsevec.innerProduct,
      api.sparsevec.squaredDistance,
      api.sparsevec.negativeInnerProduct,
      api.sparsevec.compare,
    ]) {
      assert.equal(await selected(connection, call(null, sparse)), null);
      assert.equal(await selected(connection, call(sparse, null)), null);
    }
    for (const call of [api.sparsevec.norm, api.sparsevec.normalize, api.sparsevec.send])
      assert.equal(await selected(connection, call(null)), null);
    for (const call of Object.values(api.sparsevec.sql.operators))
      assert.equal(await selected(connection, call(sparse, null)), null);
    for (const call of [
      api.vector.sql.functions.vector_eq,
      api.vector.sql.functions.vector_ne,
      api.vector.sql.functions.vector_lt,
      api.vector.sql.functions.vector_le,
      api.vector.sql.functions.vector_gt,
      api.vector.sql.functions.vector_ge,
      api.halfvec.sql.functions.halfvec_eq,
      api.halfvec.sql.functions.halfvec_ne,
      api.halfvec.sql.functions.halfvec_lt,
      api.halfvec.sql.functions.halfvec_le,
      api.halfvec.sql.functions.halfvec_gt,
      api.halfvec.sql.functions.halfvec_ge,
    ])
      assert.equal(await selected(connection, call(null, [1])), null);
    for (const call of [
      api.sparsevec.sql.functions.sparsevec_eq,
      api.sparsevec.sql.functions.sparsevec_ne,
      api.sparsevec.sql.functions.sparsevec_lt,
      api.sparsevec.sql.functions.sparsevec_le,
      api.sparsevec.sql.functions.sparsevec_gt,
      api.sparsevec.sql.functions.sparsevec_ge,
    ])
      assert.equal(await selected(connection, call(sparse, null)), null);
  });
}, 360000);

test("vector.scalarApiNonfiniteDistancesNativeDimensionsAndErrors", async () => {
  await withApi(async (client, connection, api) => {
    for (const group of [api.vector, api.halfvec]) {
      assert.deepEqual(await selected(connection, group.cosineDistance([0, 0], [1, 2])), { nonfinite: "NaN" });
      assert.deepEqual(await selected(connection, group.sql.operators["<=>"]([0, 0], [1, 2])), { nonfinite: "NaN" });
      assert.deepEqual(await selected(connection, group.concat([1], [2, 3])), [1, 2, 3]);
      assert.deepEqual(await selected(connection, group.subvector([1, 2, 3], 2, 10)), [2, 3]);
      assert.deepEqual(await selected(connection, group.normalize([0, 0])), [0, 0]);
      assert.equal(await selected(connection, group.equals([-0], [0])), true);
      assert.equal(await selected(connection, group.lessThan([1], [1, 0])), true);
      await assert.rejects(selected(connection, group.l2Distance([1], [1, 2])));
      await assert.rejects(selected(connection, group.subvector([1, 2, 3], 1, 0)));
    }
    const max = 3.4028234663852886e38;
    assert.deepEqual(await selected(connection, api.vector.l2Distance([max], [-max])), { nonfinite: "Infinity" });
    assert.deepEqual(await selected(connection, api.vector.innerProduct([max], [max])), { nonfinite: "Infinity" });
    assert.deepEqual(await selected(connection, api.vector.negativeInnerProduct([max], [max])), {
      nonfinite: "-Infinity",
    });
    await assert.rejects(selected(connection, api.vector.add([max], [max])));
    await assert.rejects(selected(connection, api.halfvec.add([65504], [65504])));
    const emptySparse = { dimensions: 3, entries: [] };
    assert.deepEqual(await selected(connection, api.sparsevec.cosineDistance(emptySparse, emptySparse)), {
      nonfinite: "NaN",
    });
    assert.deepEqual(await selected(connection, api.sparsevec.normalize(emptySparse)), emptySparse);
    // Direct native errors are compared independently; neither helper simulates arithmetic in JavaScript.
    await assert.rejects(
      client.query(`select ${vectorFunction("l2_distance")}($1::${vectorType("vector")},$2::${vectorType("vector")})`, [
        "[1]",
        "[1,2]",
      ]),
      { code: "22000" },
    );
  });
}, 360000);

test("vector.scalarApiColumnsNestedAliasesAndNullSelection", async () => {
  await withApi(async (client, connection, api) => {
    const dense = customType<{ data: DenseVectorValue; driverData: string }>({
      dataType: () => vectorType("vector", 3),
    });
    const table = pgTable("vector_api_values", {
      id: integer().notNull(),
      embedding: dense(),
      reference: dense().notNull(),
    });
    await client.query(
      `create table vector_api_values(id integer not null,embedding ${vectorType("vector", 3)},reference ${vectorType("vector", 3)} not null)`,
    );
    await client.query(`insert into vector_api_values values(1,'[1,2,3]','[3,2,1]'),(2,NULL,'[1,2,3]')`);
    const result = await connection.transaction((db) => {
      const nested = db
        .select({ id: table.id, embedding: table.embedding, reference: table.reference })
        .from(table)
        .as("nested");
      return db
        .select({
          id: nested.id,
          distance: api.vector.l2Distance(nested.embedding, nested.reference),
          normalized: api.vector.normalize(nested.embedding),
        })
        .from(nested)
        .orderBy(nested.id);
    });
    const norm = await observeNativeVector(
      client,
      "vector",
      `${vectorFunction("l2_normalize")}('[1,2,3]'::${vectorType("vector")})`,
    );
    assert.ok(norm.binary);
    assert.deepEqual(result, [
      { id: 1, distance: Math.sqrt(8), normalized: nativeBinaryValue(norm.binary) },
      { id: 2, distance: null, normalized: null },
    ]);
    const composed = await connection.transaction((db) =>
      db
        .select({ value: api.vector.l2Distance(api.vector.normalize([1, 0, 0]).as("normalized"), [1, 0, 0]) })
        .from(table)
        .where(eq(table.id, 1)),
    );
    assert.deepEqual(composed, [{ value: 0 }]);
    const halfComposed = api.halfvec.add(api.vector.normalize([1, 2]), api.vector.normalize([2, 1]).as("right_value"));
    const halfOracle = await observeNativeVector(
      client,
      "halfvec",
      `${vectorFunction("halfvec_add")}(${vectorFunction("l2_normalize")}($1::${vectorType("vector")})::${vectorType("halfvec")},${vectorFunction("l2_normalize")}($2::${vectorType("vector")})::${vectorType("halfvec")})`,
      ["[1,2]", "[2,1]"],
    );
    assert.ok(halfOracle.binary);
    assert.deepEqual(await selected(connection, halfComposed), nativeBinaryValue(halfOracle.binary));
  });
}, 360000);

test("vector.scalarApiCaughtMalformedDecodingRollsBackInvocation", async () => {
  await withApi(async (client, connection) => {
    await client.query("create table vector_api_decode_guard(value integer)");
    const malformed = checkedExtensionExpression(
      sql`'not-a-vector'::text`,
      createVectorCodec(vectorSchema),
      [],
      undefined,
      "fixture:vector.invalid-result",
    );
    await assert.rejects(
      connection.transaction(async (db) => {
        await db.execute(sql`insert into vector_api_decode_guard values(1)`);
        try {
          await db.select({ value: malformed }).from(oneRow);
        } catch {
          /* The invocation must still fail after a caught decoding error. */
        }
      }),
    );
    assert.deepEqual((await client.query("select count(*)::integer count from vector_api_decode_guard")).rows, [
      { count: 0 },
    ]);
  });
}, 360000);
