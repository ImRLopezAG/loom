import * as v from "valibot";
import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  binaryCodec,
  booleanCodec,
  createExtensionCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type ExtensionCodec,
} from "../codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import { float4Codec } from "../primitive-number-codecs";
import { createSqlFunction, createSqlOperator, defaultSqlArgument } from "../sql";
import { createHalfvecCodec, createVectorCodec } from "../vector-codecs";
import {
  createRabitqArrayCodec,
  createRabitqCodec,
  createSphereHalfvecCodec,
  createSphereRabitqCodec,
  createSphereVectorCodec,
} from "./lakebase-vector-codecs";

export { rabitqNativeText } from "./lakebase-vector-codecs";
export type { RabitqNativeText, SphereRabitqValue, SphereVectorValue } from "./lakebase-vector-codecs";

const digest = "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20";
const vectorDigest = "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4";
type Descriptor = ExtensionDescriptor<"lakebase_vector", { readonly version: "1.1.1"; readonly schema: string }>;
type VectorDescriptor = ExtensionDescriptor<"vector", { readonly version: "0.8.6"; readonly schema: string }>;
const voidCodec = createExtensionCodec({
  id: "pg:void:1",
  sqlType: { schema: "pg_catalog", name: "void" },
  input: v.null(),
  output: v.null(),
  transport: "text",
  encode: () => null,
  decode: () => null,
});

const noSearch = { filter: false, comparison: false, order: false, text: false } as const;
const rabitqValue: ExtensionValueSchema = {
  kind: "object",
  properties: { kind: { kind: "string", enum: ["native-text"] }, text: { kind: "string" } },
};
const numberOrNonfinite: ExtensionValueSchema = {
  kind: "union",
  variants: [
    { kind: "number" },
    { kind: "object", properties: { nonfinite: { kind: "string", enum: ["NaN", "Infinity", "-Infinity"] } } },
    { kind: "null" },
  ],
};
const vectorValue: ExtensionValueSchema = {
  kind: "union",
  variants: [{ kind: "array", items: { kind: "number" } }, { kind: "null" }],
};
const storageOptions = v.strictObject({
  buildMode: v.optional(v.picklist(["standard", "quality", "fast"])),
  lists: v.optional(v.union([v.literal("auto"), v.pipe(v.string(), v.minLength(1), v.maxLength(128))])),
});
export type LakebaseAnnStorage = v.InferInput<typeof storageOptions>;
const settingText = v.pipe(v.string(), v.minLength(1), v.maxLength(64));
const probes = v.union([v.literal("auto"), v.literal(""), settingText]);
const epsilon = v.union([v.literal("auto"), settingText]);
const prefilter = v.picklist(["on", "off"]);

function arrayValue(leaf: ExtensionValueSchema): ExtensionValueSchema {
  let nested: ExtensionValueSchema = { kind: "union", variants: [leaf, { kind: "null" }] };
  const depths: ExtensionValueSchema[] = [];
  for (let rank = 0; rank < 6; rank++) {
    nested = { kind: "array", items: nested };
    depths.push(nested);
  }
  return {
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: {
            lowerBound: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
            length: { kind: "number", integer: true, minimum: 0, maximum: 2147483647 },
          },
        },
      },
      values: { kind: "union", variants: depths },
    },
  };
}

/** Exact lakebase_vector 1.1.1 queries, fields, ANN indexes and session settings. */
export function createLakebaseVector_1_1_1<const Selected extends Descriptor, const Companion extends VectorDescriptor>(
  descriptor: Selected,
  companion: Companion,
) {
  if (
    descriptor.name !== "lakebase_vector" ||
    descriptor.version !== "1.1.1" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("lakebase_vector 1.1.1 requires its exact verified contract");
  if (
    !companion ||
    companion.name !== "vector" ||
    companion.version !== "0.8.6" ||
    companion.apiSupport.status !== "verified" ||
    companion.apiSupport.digest !== vectorDigest
  )
    throw new Error("lakebase_vector 1.1.1 requires its exact selected vector 0.8.6 companion contract");
  const schema = descriptor.schema;
  const vectorSchema = companion.schema;
  const query = { schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const session = { schema, dependencies: [], observability: "session", authority: "query" } as const;
  const vector = nullableCodec(createVectorCodec(vectorSchema));
  const halfvec = nullableCodec(createHalfvecCodec(vectorSchema));
  const rabitq4 = nullableCodec(createRabitqCodec(schema, "rabitq4"));
  const rabitq8 = nullableCodec(createRabitqCodec(schema, "rabitq8"));
  const sphereVector = nullableCodec(createSphereVectorCodec(schema, vectorSchema));
  const sphereHalfvec = nullableCodec(createSphereHalfvecCodec(schema, vectorSchema));
  const sphereRabitq4 = nullableCodec(createSphereRabitqCodec(schema, "rabitq4"));
  const sphereRabitq8 = nullableCodec(createSphereRabitqCodec(schema, "rabitq8"));
  const float4 = nullableCodec(float4Codec);
  const bool = nullableCodec(booleanCodec);
  const text = nullableCodec(textCodec);
  const bytes = nullableCodec(binaryCodec);
  const relation = nullableCodec(withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regclass" }));
  const empty = text;
  function fn<
    const Arguments extends readonly ExtensionCodec<never, unknown>[],
    Result extends ExtensionCodec<never, unknown>,
  >(name: string, member: string, arguments_: Arguments, result: Result, base: typeof query | typeof session = query) {
    return createSqlFunction({ ...base, name, member, arguments: arguments_, result });
  }
  function op<
    Left extends ExtensionCodec<never, unknown>,
    Right extends ExtensionCodec<never, unknown>,
    Result extends ExtensionCodec<never, unknown>,
  >(name: string, member: string, left: Left, right: Right, result: Result) {
    return createSqlOperator({ ...query, name, member, left, right, result });
  }
  const support = Object.freeze({
    halfvec_cosine_ops: fn(
      "_lakebase_ann_support_halfvec_cosine_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_halfvec_cosine_ops()",
      [] as const,
      empty,
    ),
    halfvec_ip_ops: fn(
      "_lakebase_ann_support_halfvec_ip_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_halfvec_ip_ops()",
      [] as const,
      empty,
    ),
    halfvec_l2_ops: fn(
      "_lakebase_ann_support_halfvec_l2_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_halfvec_l2_ops()",
      [] as const,
      empty,
    ),
    rabitq4_cosine_ops: fn(
      "_lakebase_ann_support_rabitq4_cosine_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq4_cosine_ops()",
      [] as const,
      empty,
    ),
    rabitq4_ip_ops: fn(
      "_lakebase_ann_support_rabitq4_ip_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq4_ip_ops()",
      [] as const,
      empty,
    ),
    rabitq4_l2_ops: fn(
      "_lakebase_ann_support_rabitq4_l2_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq4_l2_ops()",
      [] as const,
      empty,
    ),
    rabitq8_cosine_ops: fn(
      "_lakebase_ann_support_rabitq8_cosine_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq8_cosine_ops()",
      [] as const,
      empty,
    ),
    rabitq8_ip_ops: fn(
      "_lakebase_ann_support_rabitq8_ip_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq8_ip_ops()",
      [] as const,
      empty,
    ),
    rabitq8_l2_ops: fn(
      "_lakebase_ann_support_rabitq8_l2_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq8_l2_ops()",
      [] as const,
      empty,
    ),
    vector_cosine_ops: fn(
      "_lakebase_ann_support_vector_cosine_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_vector_cosine_ops()",
      [] as const,
      empty,
    ),
    vector_ip_ops: fn(
      "_lakebase_ann_support_vector_ip_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_vector_ip_ops()",
      [] as const,
      empty,
    ),
    vector_l2_ops: fn(
      "_lakebase_ann_support_vector_l2_ops",
      "routine:$extension:lakebase_vector._lakebase_ann_support_vector_l2_ops()",
      [] as const,
      empty,
    ),
  });
  const operators = Object.freeze({
    "operator:$extension:lakebase_vector.<->($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)":
      op(
        "<->",
        "operator:$extension:lakebase_vector.<->($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)",
        rabitq4,
        rabitq4,
        float4,
      ),
    "operator:$extension:lakebase_vector.<->($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)":
      op(
        "<->",
        "operator:$extension:lakebase_vector.<->($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)",
        rabitq8,
        rabitq8,
        float4,
      ),
    "operator:$extension:lakebase_vector.<#>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)":
      op(
        "<#>",
        "operator:$extension:lakebase_vector.<#>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)",
        rabitq4,
        rabitq4,
        float4,
      ),
    "operator:$extension:lakebase_vector.<#>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)":
      op(
        "<#>",
        "operator:$extension:lakebase_vector.<#>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)",
        rabitq8,
        rabitq8,
        float4,
      ),
    "operator:$extension:lakebase_vector.<=>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)":
      op(
        "<=>",
        "operator:$extension:lakebase_vector.<=>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)",
        rabitq4,
        rabitq4,
        float4,
      ),
    "operator:$extension:lakebase_vector.<=>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)":
      op(
        "<=>",
        "operator:$extension:lakebase_vector.<=>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)",
        rabitq8,
        rabitq8,
        float4,
      ),
    "operator:$extension:lakebase_vector.<<->>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)":
      op(
        "<<->>",
        "operator:$extension:lakebase_vector.<<->>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)",
        rabitq4,
        sphereRabitq4,
        bool,
      ),
    "operator:$extension:lakebase_vector.<<->>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)":
      op(
        "<<->>",
        "operator:$extension:lakebase_vector.<<->>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)",
        rabitq8,
        sphereRabitq8,
        bool,
      ),
    "operator:$extension:lakebase_vector.<<->>($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)":
      op(
        "<<->>",
        "operator:$extension:lakebase_vector.<<->>($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)",
        halfvec,
        sphereHalfvec,
        bool,
      ),
    "operator:$extension:lakebase_vector.<<->>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)": op(
      "<<->>",
      "operator:$extension:lakebase_vector.<<->>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)",
      vector,
      sphereVector,
      bool,
    ),
    "operator:$extension:lakebase_vector.<<#>>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)":
      op(
        "<<#>>",
        "operator:$extension:lakebase_vector.<<#>>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)",
        rabitq4,
        sphereRabitq4,
        bool,
      ),
    "operator:$extension:lakebase_vector.<<#>>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)":
      op(
        "<<#>>",
        "operator:$extension:lakebase_vector.<<#>>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)",
        rabitq8,
        sphereRabitq8,
        bool,
      ),
    "operator:$extension:lakebase_vector.<<#>>($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)":
      op(
        "<<#>>",
        "operator:$extension:lakebase_vector.<<#>>($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)",
        halfvec,
        sphereHalfvec,
        bool,
      ),
    "operator:$extension:lakebase_vector.<<#>>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)": op(
      "<<#>>",
      "operator:$extension:lakebase_vector.<<#>>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)",
      vector,
      sphereVector,
      bool,
    ),
    "operator:$extension:lakebase_vector.<<=>>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)":
      op(
        "<<=>>",
        "operator:$extension:lakebase_vector.<<=>>($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)",
        rabitq4,
        sphereRabitq4,
        bool,
      ),
    "operator:$extension:lakebase_vector.<<=>>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)":
      op(
        "<<=>>",
        "operator:$extension:lakebase_vector.<<=>>($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)",
        rabitq8,
        sphereRabitq8,
        bool,
      ),
    "operator:$extension:lakebase_vector.<<=>>($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)":
      op(
        "<<=>>",
        "operator:$extension:lakebase_vector.<<=>>($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)",
        halfvec,
        sphereHalfvec,
        bool,
      ),
    "operator:$extension:lakebase_vector.<<=>>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)": op(
      "<<=>>",
      "operator:$extension:lakebase_vector.<<=>>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)",
      vector,
      sphereVector,
      bool,
    ),
  });
  const routines = Object.freeze({
    "routine:$extension:lakebase_vector._lakebase_ann_support_halfvec_cosine_ops()": support.halfvec_cosine_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_halfvec_ip_ops()": support.halfvec_ip_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_halfvec_l2_ops()": support.halfvec_l2_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq4_cosine_ops()": support.rabitq4_cosine_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq4_ip_ops()": support.rabitq4_ip_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq4_l2_ops()": support.rabitq4_l2_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq8_cosine_ops()": support.rabitq8_cosine_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq8_ip_ops()": support.rabitq8_ip_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_rabitq8_l2_ops()": support.rabitq8_l2_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_vector_cosine_ops()": support.vector_cosine_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_vector_ip_ops()": support.vector_ip_ops,
    "routine:$extension:lakebase_vector._lakebase_ann_support_vector_l2_ops()": support.vector_l2_ops,
    "routine:$extension:lakebase_vector._lakebase_vector_halfvec_sphere_cosine_in($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)":
      fn(
        "_lakebase_vector_halfvec_sphere_cosine_in",
        "routine:$extension:lakebase_vector._lakebase_vector_halfvec_sphere_cosine_in($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)",
        [halfvec, sphereHalfvec] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_halfvec_sphere_ip_in($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)":
      fn(
        "_lakebase_vector_halfvec_sphere_ip_in",
        "routine:$extension:lakebase_vector._lakebase_vector_halfvec_sphere_ip_in($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)",
        [halfvec, sphereHalfvec] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_halfvec_sphere_l2_in($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)":
      fn(
        "_lakebase_vector_halfvec_sphere_l2_in",
        "routine:$extension:lakebase_vector._lakebase_vector_halfvec_sphere_l2_in($extension:vector.halfvec,$extension:lakebase_vector.sphere_halfvec)",
        [halfvec, sphereHalfvec] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_operator_cosine($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)":
      fn(
        "_lakebase_vector_rabitq4_operator_cosine",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_operator_cosine($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)",
        [rabitq4, rabitq4] as const,
        float4,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_operator_ip($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)":
      fn(
        "_lakebase_vector_rabitq4_operator_ip",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_operator_ip($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)",
        [rabitq4, rabitq4] as const,
        float4,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_operator_l2($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)":
      fn(
        "_lakebase_vector_rabitq4_operator_l2",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_operator_l2($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)",
        [rabitq4, rabitq4] as const,
        float4,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_send($extension:lakebase_vector.rabitq4)": fn(
      "_lakebase_vector_rabitq4_send",
      "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_send($extension:lakebase_vector.rabitq4)",
      [rabitq4] as const,
      bytes,
    ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_sphere_cosine_in($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)":
      fn(
        "_lakebase_vector_rabitq4_sphere_cosine_in",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_sphere_cosine_in($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)",
        [rabitq4, sphereRabitq4] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_sphere_ip_in($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)":
      fn(
        "_lakebase_vector_rabitq4_sphere_ip_in",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_sphere_ip_in($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)",
        [rabitq4, sphereRabitq4] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_sphere_l2_in($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)":
      fn(
        "_lakebase_vector_rabitq4_sphere_l2_in",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq4_sphere_l2_in($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.sphere_rabitq4)",
        [rabitq4, sphereRabitq4] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_operator_cosine($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)":
      fn(
        "_lakebase_vector_rabitq8_operator_cosine",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_operator_cosine($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)",
        [rabitq8, rabitq8] as const,
        float4,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_operator_ip($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)":
      fn(
        "_lakebase_vector_rabitq8_operator_ip",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_operator_ip($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)",
        [rabitq8, rabitq8] as const,
        float4,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_operator_l2($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)":
      fn(
        "_lakebase_vector_rabitq8_operator_l2",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_operator_l2($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.rabitq8)",
        [rabitq8, rabitq8] as const,
        float4,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_send($extension:lakebase_vector.rabitq8)": fn(
      "_lakebase_vector_rabitq8_send",
      "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_send($extension:lakebase_vector.rabitq8)",
      [rabitq8] as const,
      bytes,
    ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_sphere_cosine_in($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)":
      fn(
        "_lakebase_vector_rabitq8_sphere_cosine_in",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_sphere_cosine_in($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)",
        [rabitq8, sphereRabitq8] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_sphere_ip_in($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)":
      fn(
        "_lakebase_vector_rabitq8_sphere_ip_in",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_sphere_ip_in($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)",
        [rabitq8, sphereRabitq8] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_sphere_l2_in($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)":
      fn(
        "_lakebase_vector_rabitq8_sphere_l2_in",
        "routine:$extension:lakebase_vector._lakebase_vector_rabitq8_sphere_l2_in($extension:lakebase_vector.rabitq8,$extension:lakebase_vector.sphere_rabitq8)",
        [rabitq8, sphereRabitq8] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_vector_sphere_cosine_in($extension:vector.vector,$extension:lakebase_vector.sphere_vector)":
      fn(
        "_lakebase_vector_vector_sphere_cosine_in",
        "routine:$extension:lakebase_vector._lakebase_vector_vector_sphere_cosine_in($extension:vector.vector,$extension:lakebase_vector.sphere_vector)",
        [vector, sphereVector] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_vector_sphere_ip_in($extension:vector.vector,$extension:lakebase_vector.sphere_vector)":
      fn(
        "_lakebase_vector_vector_sphere_ip_in",
        "routine:$extension:lakebase_vector._lakebase_vector_vector_sphere_ip_in($extension:vector.vector,$extension:lakebase_vector.sphere_vector)",
        [vector, sphereVector] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector._lakebase_vector_vector_sphere_l2_in($extension:vector.vector,$extension:lakebase_vector.sphere_vector)":
      fn(
        "_lakebase_vector_vector_sphere_l2_in",
        "routine:$extension:lakebase_vector._lakebase_vector_vector_sphere_l2_in($extension:vector.vector,$extension:lakebase_vector.sphere_vector)",
        [vector, sphereVector] as const,
        bool,
      ),
    "routine:$extension:lakebase_vector.dequantize_to_halfvec($extension:lakebase_vector.rabitq4)": fn(
      "dequantize_to_halfvec",
      "routine:$extension:lakebase_vector.dequantize_to_halfvec($extension:lakebase_vector.rabitq4)",
      [rabitq4] as const,
      halfvec,
    ),
    "routine:$extension:lakebase_vector.dequantize_to_halfvec($extension:lakebase_vector.rabitq8)": fn(
      "dequantize_to_halfvec",
      "routine:$extension:lakebase_vector.dequantize_to_halfvec($extension:lakebase_vector.rabitq8)",
      [rabitq8] as const,
      halfvec,
    ),
    "routine:$extension:lakebase_vector.dequantize_to_vector($extension:lakebase_vector.rabitq4)": fn(
      "dequantize_to_vector",
      "routine:$extension:lakebase_vector.dequantize_to_vector($extension:lakebase_vector.rabitq4)",
      [rabitq4] as const,
      vector,
    ),
    "routine:$extension:lakebase_vector.dequantize_to_vector($extension:lakebase_vector.rabitq8)": fn(
      "dequantize_to_vector",
      "routine:$extension:lakebase_vector.dequantize_to_vector($extension:lakebase_vector.rabitq8)",
      [rabitq8] as const,
      vector,
    ),
    "routine:$extension:lakebase_vector.lakebase_ann_index_info(pg_catalog.regclass)": fn(
      "lakebase_ann_index_info",
      "routine:$extension:lakebase_vector.lakebase_ann_index_info(pg_catalog.regclass)",
      [relation] as const,
      text,
      session,
    ),
    "routine:$extension:lakebase_vector.lakebase_ann_prewarm(pg_catalog.regclass,pg_catalog.text)": createSqlFunction({
      ...session,
      name: "lakebase_ann_prewarm",
      member: "routine:$extension:lakebase_vector.lakebase_ann_prewarm(pg_catalog.regclass,pg_catalog.text)",
      arguments: [relation, defaultSqlArgument(text, "scope")] as const,
      result: nullableCodec(voidCodec),
    }),
    "routine:$extension:lakebase_vector.quantize_to_rabitq4($extension:vector.halfvec)": fn(
      "quantize_to_rabitq4",
      "routine:$extension:lakebase_vector.quantize_to_rabitq4($extension:vector.halfvec)",
      [halfvec] as const,
      rabitq4,
    ),
    "routine:$extension:lakebase_vector.quantize_to_rabitq4($extension:vector.vector)": fn(
      "quantize_to_rabitq4",
      "routine:$extension:lakebase_vector.quantize_to_rabitq4($extension:vector.vector)",
      [vector] as const,
      rabitq4,
    ),
    "routine:$extension:lakebase_vector.quantize_to_rabitq8($extension:vector.halfvec)": fn(
      "quantize_to_rabitq8",
      "routine:$extension:lakebase_vector.quantize_to_rabitq8($extension:vector.halfvec)",
      [halfvec] as const,
      rabitq8,
    ),
    "routine:$extension:lakebase_vector.quantize_to_rabitq8($extension:vector.vector)": fn(
      "quantize_to_rabitq8",
      "routine:$extension:lakebase_vector.quantize_to_rabitq8($extension:vector.vector)",
      [vector] as const,
      rabitq8,
    ),
    "routine:$extension:lakebase_vector.sphere($extension:lakebase_vector.rabitq4,pg_catalog.float4)": fn(
      "sphere",
      "routine:$extension:lakebase_vector.sphere($extension:lakebase_vector.rabitq4,pg_catalog.float4)",
      [rabitq4, float4] as const,
      sphereRabitq4,
    ),
    "routine:$extension:lakebase_vector.sphere($extension:lakebase_vector.rabitq8,pg_catalog.float4)": fn(
      "sphere",
      "routine:$extension:lakebase_vector.sphere($extension:lakebase_vector.rabitq8,pg_catalog.float4)",
      [rabitq8, float4] as const,
      sphereRabitq8,
    ),
    "routine:$extension:lakebase_vector.sphere($extension:vector.halfvec,pg_catalog.float4)": fn(
      "sphere",
      "routine:$extension:lakebase_vector.sphere($extension:vector.halfvec,pg_catalog.float4)",
      [halfvec, float4] as const,
      sphereHalfvec,
    ),
    "routine:$extension:lakebase_vector.sphere($extension:vector.vector,pg_catalog.float4)": fn(
      "sphere",
      "routine:$extension:lakebase_vector.sphere($extension:vector.vector,pg_catalog.float4)",
      [vector, float4] as const,
      sphereVector,
    ),
  });
  const overloads = Object.freeze({ ...operators, ...routines });
  function index(
    method: "lakebase_ann" | "lakebase_annv0",
    opclass: string,
    type: "vector" | "halfvec" | "rabitq4" | "rabitq8",
    inputSchema: string,
  ) {
    return Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: `opclass:$extension:lakebase_vector.${opclass}/${method}`,
        method,
        opclass,
        type,
      }),
      input: Object.freeze({ schema: inputSchema, type, dimensions: 0 }),
    });
  }
  function family(method: "lakebase_ann" | "lakebase_annv0") {
    return Object.freeze({
      vector: Object.freeze({
        l2: () => index(method, "vector_l2_ops", "vector", vectorSchema),
        ip: () => index(method, "vector_ip_ops", "vector", vectorSchema),
        cosine: () => index(method, "vector_cosine_ops", "vector", vectorSchema),
      }),
      halfvec: Object.freeze({
        l2: () => index(method, "halfvec_l2_ops", "halfvec", vectorSchema),
        ip: () => index(method, "halfvec_ip_ops", "halfvec", vectorSchema),
        cosine: () => index(method, "halfvec_cosine_ops", "halfvec", vectorSchema),
      }),
      rabitq4: Object.freeze({
        l2: () => index(method, "rabitq4_l2_ops", "rabitq4", schema),
        ip: () => index(method, "rabitq4_ip_ops", "rabitq4", schema),
        cosine: () => index(method, "rabitq4_cosine_ops", "rabitq4", schema),
      }),
      rabitq8: Object.freeze({
        l2: () => index(method, "rabitq8_l2_ops", "rabitq8", schema),
        ip: () => index(method, "rabitq8_ip_ops", "rabitq8", schema),
        cosine: () => index(method, "rabitq8_cosine_ops", "rabitq8", schema),
      }),
    });
  }
  function typedField<Value>(
    member: string,
    type: string,
    codec: ExtensionCodec<Value, Value>,
    value: ExtensionValueSchema,
    array = false,
    typmods: readonly (string | number)[] = [],
  ) {
    return () =>
      createExtensionField({
        extension: descriptor,
        member,
        type,
        codec,
        value,
        array,
        typmods,
        search: noSearch,
      });
  }
  const sphereVectorValue: ExtensionValueSchema = {
    kind: "object",
    properties: { center: vectorValue, radius: numberOrNonfinite },
  };
  const sphereHalfvecValue = sphereVectorValue;
  const sphereRabitqValue: ExtensionValueSchema = {
    kind: "object",
    properties: { center: { kind: "union", variants: [rabitqValue, { kind: "null" }] }, radius: numberOrNonfinite },
  };
  function storage(options: LakebaseAnnStorage) {
    const checked = v.parse(storageOptions, options);
    return Object.freeze({
      ...(checked.buildMode !== undefined && { build_mode: checked.buildMode }),
      ...(checked.lists !== undefined && { lists: checked.lists }),
    });
  }
  return bindExtension(descriptor, {
    companion: Object.freeze({
      ...companion,
      apiSupport: Object.freeze({ status: "verified" as const, digest: vectorDigest }),
    }),
    codecs: Object.freeze({
      rabitq4: createRabitqCodec(schema, "rabitq4"),
      rabitq8: createRabitqCodec(schema, "rabitq8"),
      rabitq4Array: createRabitqArrayCodec(schema, "rabitq4"),
      rabitq8Array: createRabitqArrayCodec(schema, "rabitq8"),
      sphereVector: createSphereVectorCodec(schema, vectorSchema),
      sphereHalfvec: createSphereHalfvecCodec(schema, vectorSchema),
      sphereRabitq4: createSphereRabitqCodec(schema, "rabitq4"),
      sphereRabitq8: createSphereRabitqCodec(schema, "rabitq8"),
    }),
    field: Object.freeze({
      rabitq4: typedField(
        "type:$extension:lakebase_vector.rabitq4",
        "rabitq4",
        createRabitqCodec(schema, "rabitq4"),
        rabitqValue,
      ),
      rabitq8: typedField(
        "type:$extension:lakebase_vector.rabitq8",
        "rabitq8",
        createRabitqCodec(schema, "rabitq8"),
        rabitqValue,
      ),
      sphereVector: typedField(
        "type:$extension:lakebase_vector.sphere_vector",
        "sphere_vector",
        createSphereVectorCodec(schema, vectorSchema),
        sphereVectorValue,
      ),
      sphereHalfvec: typedField(
        "type:$extension:lakebase_vector.sphere_halfvec",
        "sphere_halfvec",
        createSphereHalfvecCodec(schema, vectorSchema),
        sphereHalfvecValue,
      ),
      sphereRabitq4: typedField(
        "type:$extension:lakebase_vector.sphere_rabitq4",
        "sphere_rabitq4",
        createSphereRabitqCodec(schema, "rabitq4"),
        sphereRabitqValue,
      ),
      sphereRabitq8: typedField(
        "type:$extension:lakebase_vector.sphere_rabitq8",
        "sphere_rabitq8",
        createSphereRabitqCodec(schema, "rabitq8"),
        sphereRabitqValue,
      ),
    }),
    arrayField: Object.freeze({
      rabitq4: typedField(
        "type:$extension:lakebase_vector._rabitq4",
        "rabitq4",
        createRabitqArrayCodec(schema, "rabitq4"),
        arrayValue(rabitqValue),
        true,
      ),
      rabitq8: typedField(
        "type:$extension:lakebase_vector._rabitq8",
        "rabitq8",
        createRabitqArrayCodec(schema, "rabitq8"),
        arrayValue(rabitqValue),
        true,
      ),
      sphereVector: typedField(
        "type:$extension:lakebase_vector._sphere_vector",
        "sphere_vector",
        arrayCodec(createSphereVectorCodec(schema, vectorSchema)),
        arrayValue(sphereVectorValue),
        true,
      ),
      sphereHalfvec: typedField(
        "type:$extension:lakebase_vector._sphere_halfvec",
        "sphere_halfvec",
        arrayCodec(createSphereHalfvecCodec(schema, vectorSchema)),
        arrayValue(sphereHalfvecValue),
        true,
      ),
      sphereRabitq4: typedField(
        "type:$extension:lakebase_vector._sphere_rabitq4",
        "sphere_rabitq4",
        arrayCodec(createSphereRabitqCodec(schema, "rabitq4")),
        arrayValue(sphereRabitqValue),
        true,
      ),
      sphereRabitq8: typedField(
        "type:$extension:lakebase_vector._sphere_rabitq8",
        "sphere_rabitq8",
        arrayCodec(createSphereRabitqCodec(schema, "rabitq8")),
        arrayValue(sphereRabitqValue),
        true,
      ),
    }),
    indexes: Object.freeze({ ann: family("lakebase_ann"), annv0: family("lakebase_annv0") }),
    accessMethods: Object.freeze({
      lakebase_ann: Object.freeze({
        member: "access method:lakebase_ann",
        name: "lakebase_ann",
        handler: "routine:$extension:lakebase_vector.lakebase_annv1_amhandler(pg_catalog.internal)",
      }),
      lakebase_annv0: Object.freeze({
        member: "access method:lakebase_annv0",
        name: "lakebase_annv0",
        handler: "routine:$extension:lakebase_vector.lakebase_annv0_amhandler(pg_catalog.internal)",
      }),
    }),
    storage,
    indexFormat: Object.freeze({
      latest: "_2",
      source: "https://neon.com/docs/extensions/lakebase-vector",
      rebuild: Object.freeze({ kind: "reindex-concurrently", transactional: false as const }),
    }),
    settings: Object.freeze({
      probes: (value: v.InferInput<typeof probes>) =>
        sql`select "pg_catalog"."set_config"(${"lakebase_ann.probes"}, ${v.parse(probes, value)}, true)`,
      epsilon: (value: v.InferInput<typeof epsilon>) =>
        sql`select "pg_catalog"."set_config"(${"lakebase_ann.epsilon"}, ${v.parse(epsilon, value)}, true)`,
      prefilter: (value: v.InferInput<typeof prefilter>) =>
        sql`select "pg_catalog"."set_config"(${"lakebase_ann.prefilter"}, ${v.parse(prefilter, value)}, true)`,
    }),
    sphere: Object.freeze({
      vector: overloads["routine:$extension:lakebase_vector.sphere($extension:vector.vector,pg_catalog.float4)"],
      halfvec: overloads["routine:$extension:lakebase_vector.sphere($extension:vector.halfvec,pg_catalog.float4)"],
      rabitq4:
        overloads["routine:$extension:lakebase_vector.sphere($extension:lakebase_vector.rabitq4,pg_catalog.float4)"],
      rabitq8:
        overloads["routine:$extension:lakebase_vector.sphere($extension:lakebase_vector.rabitq8,pg_catalog.float4)"],
    }),
    withinCosine:
      overloads[
        "operator:$extension:lakebase_vector.<<=>>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)"
      ],
    withinL2:
      overloads[
        "operator:$extension:lakebase_vector.<<->>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)"
      ],
    withinInnerProduct:
      overloads[
        "operator:$extension:lakebase_vector.<<#>>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)"
      ],
    quantize: Object.freeze({
      rabitq4: Object.freeze({
        fromVector: overloads["routine:$extension:lakebase_vector.quantize_to_rabitq4($extension:vector.vector)"],
        fromHalfvec: overloads["routine:$extension:lakebase_vector.quantize_to_rabitq4($extension:vector.halfvec)"],
      }),
      rabitq8: Object.freeze({
        fromVector: overloads["routine:$extension:lakebase_vector.quantize_to_rabitq8($extension:vector.vector)"],
        fromHalfvec: overloads["routine:$extension:lakebase_vector.quantize_to_rabitq8($extension:vector.halfvec)"],
      }),
    }),
    dequantize: Object.freeze({
      toVector: Object.freeze({
        rabitq4:
          overloads["routine:$extension:lakebase_vector.dequantize_to_vector($extension:lakebase_vector.rabitq4)"],
        rabitq8:
          overloads["routine:$extension:lakebase_vector.dequantize_to_vector($extension:lakebase_vector.rabitq8)"],
      }),
      toHalfvec: Object.freeze({
        rabitq4:
          overloads["routine:$extension:lakebase_vector.dequantize_to_halfvec($extension:lakebase_vector.rabitq4)"],
        rabitq8:
          overloads["routine:$extension:lakebase_vector.dequantize_to_halfvec($extension:lakebase_vector.rabitq8)"],
      }),
    }),
    indexInfo: overloads["routine:$extension:lakebase_vector.lakebase_ann_index_info(pg_catalog.regclass)"],
    tooling: Object.freeze({
      prewarm:
        overloads["routine:$extension:lakebase_vector.lakebase_ann_prewarm(pg_catalog.regclass,pg_catalog.text)"],
      indexInfo: overloads["routine:$extension:lakebase_vector.lakebase_ann_index_info(pg_catalog.regclass)"],
    }),
    sql: Object.freeze({
      functions: routines,
      operators,
      overloads,
    }),
  });
}
