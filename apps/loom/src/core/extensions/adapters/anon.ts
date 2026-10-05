import type { SQL } from "drizzle-orm";
import type { PostgreSqlArray } from "../codecs";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { createSqlFunction, defaultSqlArgument, type ExtensionSqlInput } from "../sql";
import {
  anonCodecs,
  resolveAnonParameter,
  type AnonCodecName,
  type AnonCodecs,
  type AnonInput,
  type AnonOutput,
  type AnonParameter,
} from "./anon-codecs";
import { anonDefaultArgumentNames, anonRoutineSpecs, type AnonMember, type AnonRoutineSpecs } from "./anon-specs";
import { anonFields } from "./anon-fields";

export { anonCodecs, anonParameter } from "./anon-codecs";
export type { AnonCodecName, AnonCodecs, AnonInput, AnonOutput, AnonParameter } from "./anon-codecs";
export { anonRoutineSpecs } from "./anon-specs";
export type { AnonMember, AnonRoutineSpecs } from "./anon-specs";

export const ANON_DIGEST = "93a826ea74c64096e00ad172603b6b4d5ada6a842d50caa3cb4cc76374029878";
/** The captured objects are in anon, independently of pg_extension.extnamespace. */
export const ANON_NATIVE_SCHEMA = "anon";
/** Native RI callback identities for identifier_fk_identifiers_category_fkey. Not OID-bearing names. */
export const ANON_FOREIGN_KEY_TRIGGER_IDS = [
  'trigger:"$fk-trigger:identifier_fk_identifiers_category_fkey on anon.identifier:17:RI_FKey_check_upd" on anon.identifier',
  'trigger:"$fk-trigger:identifier_fk_identifiers_category_fkey on anon.identifier:17:RI_FKey_noaction_upd" on anon.identifiers_category',
  'trigger:"$fk-trigger:identifier_fk_identifiers_category_fkey on anon.identifier:5:RI_FKey_check_ins" on anon.identifier',
  'trigger:"$fk-trigger:identifier_fk_identifiers_category_fkey on anon.identifier:9:RI_FKey_noaction_del" on anon.identifiers_category',
] as const;
type Specs = AnonRoutineSpecs;
type ArgumentType<Type extends string> = Type extends `?${infer Name}`
  ? Name
  : Type extends `${infer Name}...`
    ? Name
    : Type;
type NamedArguments<Args extends readonly string[]> = Args extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly string[],
]
  ? Head extends `?${string}`
    ? [value?: ArgumentValue<Head>, ...NamedArguments<Tail>]
    : [value: ArgumentValue<Head>, ...NamedArguments<Tail>]
  : [];
type ArgumentValue<Type extends string> =
  ArgumentType<Type> extends "anyelement" | "anyarray"
    ? AnonParameter<unknown, unknown, "value">
    : ArgumentType<Type> extends AnonCodecName
      ? AnonInput<ArgumentType<Type>>
      : never;
export type AnonArguments<Args extends readonly string[]> = NamedArguments<Args>;
type ParameterOutput<Value> = Value extends AnonParameter<unknown, infer Output> ? Output : unknown;
type PolymorphicOutput<
  Member extends AnonMember,
  Args extends readonly unknown[],
> = Specs[Member]["name"] extends "random_in"
  ? ParameterOutput<Args[0]> extends PostgreSqlArray<infer Element>
    ? Element | null
    : unknown
  : ParameterOutput<Args[Specs[Member]["name"] extends "ternary" ? 1 : 0]>;
export type AnonResult<
  Member extends AnonMember,
  Args extends readonly unknown[] = readonly unknown[],
> = Specs[Member]["result"] extends "anyelement"
  ? PolymorphicOutput<Member, Args>
  : Specs[Member]["set"] extends true
    ? readonly AnonDecoded<Specs[Member]["result"], Specs[Member]["name"]>[]
    : AnonDecoded<Specs[Member]["result"], Specs[Member]["name"]>;
type AnonDecoded<Result extends string, Name extends string> = Result extends "record"
  ? Name extends "detect"
    ? AnonOutput<"detect">
    : Name extends "mask_columns"
      ? AnonOutput<"mask_columns">
      : AnonOutput<"record">
  : Result extends AnonCodecName
    ? AnonOutput<Result>
    : unknown;
export type AnonOperatorMember = {
  [Member in AnonMember]: Specs[Member]["result"] extends "event_trigger" ? never : Member;
}[AnonMember];
export type AnonRoutines = {
  readonly [Member in AnonOperatorMember]: <const Args extends AnonArguments<Specs[Member]["args"]>>(
    ...args: Args
  ) => Promise<AnonResult<Member, Args>>;
};
export type AnonQueryMember = {
  [Member in AnonMember]: Specs[Member]["query"] extends true ? Member : never;
}[AnonMember];
type QueryValue<Type extends string> =
  ArgumentType<Type> extends "anyelement" | "anyarray"
    ? AnonParameter
    : ArgumentType<Type> extends AnonCodecName
      ? ExtensionSqlInput<AnonCodecs[ArgumentType<Type>]>
      : never;
type QueryArguments<Args extends readonly string[]> = Args extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly string[],
]
  ? Head extends `?${string}`
    ? [value?: QueryValue<Head>, ...QueryArguments<Tail>]
    : [value: QueryValue<Head>, ...QueryArguments<Tail>]
  : [];
export type AnonQueryRoutines = {
  readonly [Member in AnonQueryMember]: (
    ...args: QueryArguments<Specs[Member]["args"]>
  ) => SQL<AnonDecoded<Specs[Member]["result"], Specs[Member]["name"]>>;
};

/** The native polymorphic result is decoded with its concrete input type, never a caller result cast. */
export function anonResultCodec(
  codecs: AnonCodecs,
  spec: { name: string; result: string },
  values: readonly unknown[],
) {
  if (spec.result === "anyelement") {
    const arrayElement = spec.name === "random_in";
    // SAFETY: polymorphic call positions are branded parameters; the resolver checks WeakMap identity and native type.
    const { codec } = resolveAnonParameter(values[spec.name === "ternary" ? 1 : 0] as AnonParameter, arrayElement);
    return { codec, arrayElement };
  }
  if (spec.result === "record" && spec.name === "detect") return { codec: codecs.detect, arrayElement: false };
  if (spec.result === "record" && spec.name === "mask_columns")
    return { codec: codecs.mask_columns, arrayElement: false };
  // SAFETY: exact routine specs contain captured codec names; missing entries fail before any SQL is issued.
  const codec = codecs[spec.result as AnonCodecName];
  if (!codec) throw new Error(`Missing anon result codec: ${spec.result}`);
  return { codec, arrayElement: false };
}

/** Family-only binding, shared by query composition and explicit operator calls. */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The selected native codec validates the argument at the SQL binding boundary.
export function anonArgument(codecs: AnonCodecs, type: string, value: unknown) {
  const name = type.replace(/^\?|\.\.\.$/g, "");
  // SAFETY: resolveAnonParameter checks the brand's private WeakMap identity rather than trusting caller objects.
  if (name === "anyelement" || name === "anyarray")
    // SAFETY: the resolver rejects any identity absent from the private constructor-owned WeakMap.
    return resolveAnonParameter(value as AnonParameter, name === "anyarray");
  // SAFETY: exact specs contain these codec names; the next statement rejects absent entries.
  const codec = codecs[name as AnonCodecName];
  if (!codec) throw new Error(`Missing anon argument codec: ${name}`);
  return { codec, value };
}

/**
 * Static masking labels and in-place rewrites stay operator-only. Query SQL is the captured masking
 * functions and deterministic helpers, including Neon int4 projection_to_oid.
 */
export function createAnon_2_5_1<
  const Descriptor extends ExtensionDescriptor<"anon", { version: "2.5.1"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "anon" ||
    descriptor.version !== "2.5.1" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== ANON_DIGEST
  )
    throw new Error("anon 2.5.1 requires its exact verified contract");
  const codecs = anonCodecs(ANON_NATIVE_SCHEMA);
  const entries = Object.entries(anonRoutineSpecs)
    .filter(([, spec]) => spec.query)
    .map(([member, spec]) => {
      const call = (...values: readonly unknown[]) => {
        const required = spec.args.filter((type) => !type.startsWith("?")).length;
        if (values.length < required || values.length > spec.args.length)
          throw new Error("Invalid anon overload argument count");
        const parameters = values.map((value, index) => anonArgument(codecs, spec.args[index]!, value));
        const args = spec.args.map((type, index) => {
          // SAFETY: optional spec markers are removed to obtain the captured native codec; absence is rejected below.
          const codec = parameters[index]?.codec ?? codecs[type.replace(/^[?]|(\.\.\.)$/g, "") as AnonCodecName];
          if (!codec) throw new Error("An anon polymorphic argument needs its concrete codec");
          // SAFETY: every optional spec has a manifest-matched argument-name entry, verified exhaustively by the unit test.
          return type.startsWith("?")
            ? defaultSqlArgument(
                codec,
                anonDefaultArgumentNames[member as keyof typeof anonDefaultArgumentNames][index],
              )
            : codec;
        });
        const bound = parameters.map(({ value }) => value);
        // SAFETY: mapped public signatures preserve each spec's inputs; construction supplies validated concrete argument and result codecs.
        const factory = createSqlFunction({
          schema: ANON_NATIVE_SCHEMA,
          name: spec.name,
          member,
          arguments: args,
          result: anonResultCodec(codecs, spec, values).codec,
          dependencies: [],
          observability: "external",
          authority: "query",
        }) as (...args: readonly unknown[]) => SQL;
        return factory(...bound);
      };
      return [member, call] as const;
    });
  // SAFETY: entries contain precisely the query=true routine keys and their corresponding codec-backed calls.
  const overloads = Object.freeze(Object.fromEntries(entries)) as AnonQueryRoutines;
  return bindExtension(descriptor, {
    codecs,
    fields: anonFields(descriptor),
    sql: Object.freeze({
      overloads,
      functions: Object.freeze({
        dummy_first_name: overloads["routine:anon.dummy_first_name()"],
        fake_email: overloads["routine:anon.fake_email()"],
        is_initialized: overloads["routine:anon.is_initialized()"],
        partial_email: overloads["routine:anon.partial_email(pg_catalog.text)"],
        projection_to_oid:
          overloads["routine:anon.projection_to_oid(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)"],
        random_int_between: overloads["routine:anon.random_int_between(pg_catalog.int4,pg_catalog.int4)"],
        version: overloads["routine:anon.version()"],
      }),
      operators: Object.freeze({}),
    }),
  });
}
