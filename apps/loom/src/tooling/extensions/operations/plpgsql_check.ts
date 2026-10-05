import * as v from "valibot";
import { createPlpgsqlCheck_2_8 } from "../../../core/extensions/adapters/plpgsql_check";
import {
  plpgsqlCheckDependencyCodec,
  plpgsqlCheckIssueCodec,
  plpgsqlCheckProfiledFunctionCodec,
  plpgsqlCheckProfileLineCodec,
  plpgsqlCheckProfileStatementCodec,
  type PlpgsqlCheckDependency,
  type PlpgsqlCheckIssue,
  type PlpgsqlCheckProfiledFunction,
  type PlpgsqlCheckProfileLine,
  type PlpgsqlCheckProfileStatement,
} from "../../../core/extensions/adapters/plpgsql_check-codecs";
import { qualifiedRelationName, type RelationName } from "../../../core/extensions/adapters/pgstattuple-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { floatCodec, type NonfiniteNumber } from "../../../core/extensions/codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { int4Codec } from "../../../core/extensions/native-codecs";
import { acquireExtensionLock } from "../../migrations/connection";
import { ExtensionOperationError, withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/plpgsql_check.json";

export type {
  PlpgsqlCheckDependency,
  PlpgsqlCheckIssue,
  PlpgsqlCheckProfiledFunction,
  PlpgsqlCheckProfileLine,
  PlpgsqlCheckProfileStatement,
};

const text = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
const signature = v.strictObject({ signature: text });
/** `signature` selects the regprocedure overload and `name` the text overload; PostgreSQL resolves both. */
export const plpgsqlCheckRoutineValidator = v.union([signature, v.strictObject({ name: text })]);
const dependencyEntries = {
  relation: v.optional(v.strictObject({ schema: text, name: text })),
  anyElementType: v.optional(text),
  anyEnumType: v.optional(text),
  anyRangeType: v.optional(text),
  anyCompatibleType: v.optional(text),
  anyCompatibleRangeType: v.optional(text),
};
const flag = v.optional(v.boolean());
const optionEntries = {
  ...dependencyEntries,
  fatalErrors: flag,
  otherWarnings: flag,
  performanceWarnings: flag,
  extraWarnings: flag,
  securityWarnings: flag,
  compatibilityWarnings: flag,
  oldTable: v.optional(v.nullable(text)),
  newTable: v.optional(v.nullable(text)),
  withoutWarnings: flag,
  allWarnings: flag,
  useIncommentOptions: flag,
  incommentOptionsUsageWarning: flag,
  constantTracing: flag,
};
export const plpgsqlCheckDependencyOptionsValidator = v.strictObject(dependencyEntries);
export const plpgsqlCheckOptionsValidator = v.strictObject(optionEntries);
const checkOptionsValidator = v.strictObject({
  ...optionEntries,
  format: v.optional(v.picklist(["text", "json", "xml"])),
});
export const plpgsqlCheckTracerValidator = v.strictObject({
  enable: v.optional(v.nullable(v.boolean())),
  verbosity: v.optional(v.nullable(v.picklist(["terse", "default", "verbose"]))),
});

export type PlpgsqlCheckRoutine =
  | { readonly signature: string; readonly name?: never }
  | { readonly name: string; readonly signature?: never };
export interface PlpgsqlCheckDependencyOptions {
  readonly relation?: RelationName;
  readonly anyElementType?: string;
  readonly anyEnumType?: string;
  readonly anyRangeType?: string;
  readonly anyCompatibleType?: string;
  readonly anyCompatibleRangeType?: string;
}
/** Omitted options are omitted from the call, so PostgreSQL applies the captured 2.8 defaults. */
export interface PlpgsqlCheckOptions extends PlpgsqlCheckDependencyOptions {
  readonly fatalErrors?: boolean;
  readonly otherWarnings?: boolean;
  readonly performanceWarnings?: boolean;
  readonly extraWarnings?: boolean;
  readonly securityWarnings?: boolean;
  readonly compatibilityWarnings?: boolean;
  readonly oldTable?: string | null;
  readonly newTable?: string | null;
  readonly withoutWarnings?: boolean;
  readonly allWarnings?: boolean;
  readonly useIncommentOptions?: boolean;
  readonly incommentOptionsUsageWarning?: boolean;
  readonly constantTracing?: boolean;
}
export interface PlpgsqlCheckTracerRequest {
  readonly enable?: boolean | null;
  readonly verbosity?: "terse" | "default" | "verbose" | null;
}
export interface PlpgsqlCheckResetEffect {
  readonly operation: "reset" | "reset-all";
  readonly signature: string | null;
  readonly state: "acknowledged" | "unknown";
  readonly rollback: "not-transactional";
}
export class PlpgsqlCheckOperationError extends ExtensionOperationError {
  constructor(
    failure: ExtensionOperationError,
    readonly effects: readonly PlpgsqlCheckResetEffect[],
  ) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "PlpgsqlCheckOperationError";
  }
}
type Float8 = number | NonfiniteNumber | null;
export interface PlpgsqlCheckSession {
  readonly check: (
    routine: PlpgsqlCheckRoutine,
    options?: PlpgsqlCheckOptions & { readonly format?: "text" | "json" | "xml" },
  ) => Promise<readonly string[]>;
  readonly checkTable: (
    routine: PlpgsqlCheckRoutine,
    options?: PlpgsqlCheckOptions,
  ) => Promise<readonly PlpgsqlCheckIssue[]>;
  /** The SQL wrapper, ordered by PostgreSQL by type, schema and name. */
  readonly dependencies: (
    routine: PlpgsqlCheckRoutine,
    options?: PlpgsqlCheckDependencyOptions,
  ) => Promise<readonly PlpgsqlCheckDependency[]>;
  /** The C scan behind the wrapper, in native order. */
  readonly nativeDependencies: (
    routine: PlpgsqlCheckRoutine,
    options?: PlpgsqlCheckDependencyOptions,
  ) => Promise<readonly PlpgsqlCheckDependency[]>;
  /** Runtime acknowledgement only; pragmas affect checks when written inside a PL/pgSQL body. */
  readonly pragma: (names: readonly string[] | null) => Promise<number | null>;
  /** NULL/omitted reads the setting. Changes roll back with, and end with, this operator session. */
  readonly profiler: (enable?: boolean | null) => Promise<boolean | null>;
  readonly tracer: (request?: PlpgsqlCheckTracerRequest) => Promise<boolean | null>;
  readonly profile: (routine: PlpgsqlCheckRoutine) => Promise<readonly PlpgsqlCheckProfileLine[]>;
  readonly profileStatements: (routine: PlpgsqlCheckRoutine) => Promise<readonly PlpgsqlCheckProfileStatement[]>;
  readonly profiledFunctions: () => Promise<readonly PlpgsqlCheckProfiledFunction[]>;
  readonly statementCoverage: (routine: PlpgsqlCheckRoutine) => Promise<Float8>;
  readonly branchCoverage: (routine: PlpgsqlCheckRoutine) => Promise<Float8>;
  /** Not transactional; with plpgsql_check preloaded this clears shared server state. */
  readonly resetProfile: (routine: { readonly signature: string }) => Promise<void>;
  readonly resetAllProfiles: () => Promise<void>;
  /** Backend-local planner hook; it ends with the dedicated operator connection. */
  readonly installFakeQueryIdHook: () => Promise<void>;
  readonly removeFakeQueryIdHook: () => Promise<void>;
}

type CallOptions = PlpgsqlCheckOptions & { readonly format?: "text" | "json" | "xml" };
type CallArgument = readonly [Exclude<keyof CallOptions, "relation">, string, string];
const dependencyArguments: readonly CallArgument[] = [
  ["anyElementType", "anyelememttype", "regtype"],
  ["anyEnumType", "anyenumtype", "regtype"],
  ["anyRangeType", "anyrangetype", "regtype"],
  ["anyCompatibleType", "anycompatibletype", "regtype"],
  ["anyCompatibleRangeType", "anycompatiblerangetype", "regtype"],
];
const checkArguments: readonly CallArgument[] = [
  ...dependencyArguments,
  ["format", "format", "text"],
  ["fatalErrors", "fatal_errors", "bool"],
  ["otherWarnings", "other_warnings", "bool"],
  ["performanceWarnings", "performance_warnings", "bool"],
  ["extraWarnings", "extra_warnings", "bool"],
  ["securityWarnings", "security_warnings", "bool"],
  ["compatibilityWarnings", "compatibility_warnings", "bool"],
  ["oldTable", "oldtable", "name"],
  ["newTable", "newtable", "name"],
  ["withoutWarnings", "without_warnings", "bool"],
  ["allWarnings", "all_warnings", "bool"],
  ["useIncommentOptions", "use_incomment_options", "bool"],
  ["incommentOptionsUsageWarning", "incomment_options_usage_warning", "bool"],
  ["constantTracing", "constant_tracing", "bool"],
];

/** Positional routine target plus named arguments for supplied options only. */
function call(
  routine: v.InferOutput<typeof plpgsqlCheckRoutineValidator>,
  options: { readonly [Key in keyof CallOptions]?: CallOptions[Key] | undefined },
  names: readonly CallArgument[],
) {
  const values: (string | boolean | null)[] = ["signature" in routine ? routine.signature : routine.name];
  const parts = ["signature" in routine ? "$1::pg_catalog.regprocedure" : "$1::pg_catalog.text"];
  if (options.relation !== undefined) {
    values.push(qualifiedRelationName(options.relation));
    parts.push(`"relid" => $${values.length}::pg_catalog.regclass`);
  }
  for (const [key, native, type] of names)
    if (options[key] !== undefined) {
      values.push(options[key]);
      parts.push(`"${native}" => $${values.length}::pg_catalog.${type}`);
    }
  return { list: parts.join(","), values };
}

/** Operator-only static analysis and profiling. PostgreSQL enforces privileges; no client reaches the callback. */
export async function withPlpgsqlCheck<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"plpgsql_check", { version: "2.8"; schema: string }>,
  callback: (session: PlpgsqlCheckSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{
  readonly completion: "committed";
  readonly value: Result;
  readonly effects: readonly PlpgsqlCheckResetEffect[];
}> {
  createPlpgsqlCheck_2_8(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const schema = `"${v.parse(text, descriptor.schema).replaceAll('"', '""')}"`;
  const effects: PlpgsqlCheckResetEffect[] = [];
  const snapshot = () => Object.freeze(effects.map((effect) => Object.freeze(effect)));
  try {
    const result = await withExtensionOperation(
      directOperatorUrl,
      async (context) => {
        await acquireExtensionLock(context.client, signal);
        await verifyExtensionApiContracts(context.client, [requirement]);
        async function scalar(sql: string, values: unknown[] = []) {
          const result = await context.client.query(`SELECT ${sql}::pg_catalog.text AS value`, values);
          return v.parse(v.tuple([v.strictObject({ value: v.nullable(v.string()) })]), result.rows)[0].value;
        }
        async function rows<Row>(sql: string, values: unknown[], decode: (value: string) => Row) {
          const result = await context.client.query(
            `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${sql} AS s`,
            values,
          );
          return Object.freeze(
            v.parse(v.array(v.strictObject({ value: v.string() })), result.rows).map((row) => decode(row.value)),
          );
        }
        const routineCall = (routine: PlpgsqlCheckRoutine) =>
          call(v.parse(plpgsqlCheckRoutineValidator, routine), {}, []);
        function dependencies(name: string, routine: PlpgsqlCheckRoutine, options: PlpgsqlCheckDependencyOptions) {
          const target = call(
            v.parse(plpgsqlCheckRoutineValidator, routine),
            v.parse(plpgsqlCheckDependencyOptionsValidator, options),
            dependencyArguments,
          );
          return rows(`${schema}."${name}"(${target.list})`, target.values, plpgsqlCheckDependencyCodec.decode);
        }
        async function reset(operation: PlpgsqlCheckResetEffect["operation"], signatureText: string | null) {
          const index =
            effects.push({ operation, signature: signatureText, state: "unknown", rollback: "not-transactional" }) - 1;
          if (signatureText === null) await context.client.query(`SELECT ${schema}."plpgsql_profiler_reset_all"()`);
          else
            await context.client.query(`SELECT ${schema}."plpgsql_profiler_reset"($1::pg_catalog.regprocedure)`, [
              signatureText,
            ]);
          effects[index] = {
            operation,
            signature: signatureText,
            state: "acknowledged",
            rollback: "not-transactional",
          };
        }
        const decodeFloat = (value: string | null) => (value === null ? null : floatCodec.decode(value));
        // bool::text is `true`/`false`; read the driver's native boolean instead.
        async function flag(sql: string, values: unknown[]) {
          const result = await context.client.query(`SELECT ${sql} AS value`, values);
          return v.parse(v.tuple([v.strictObject({ value: v.nullable(v.boolean()) })]), result.rows)[0].value;
        }
        return Object.freeze({
          check: (routine, options = {}) =>
            context.run(async () => {
              const target = call(
                v.parse(plpgsqlCheckRoutineValidator, routine),
                v.parse(checkOptionsValidator, options),
                checkArguments,
              );
              const result = await context.client.query(
                `SELECT s AS value FROM ${schema}."plpgsql_check_function"(${target.list}) AS s`,
                target.values,
              );
              return Object.freeze(
                v.parse(v.array(v.strictObject({ value: v.string() })), result.rows).map((row) => row.value),
              );
            }),
          checkTable: (routine, options = {}) =>
            context.run(() => {
              const target = call(
                v.parse(plpgsqlCheckRoutineValidator, routine),
                v.parse(plpgsqlCheckOptionsValidator, options),
                checkArguments,
              );
              return rows(
                `${schema}."plpgsql_check_function_tb"(${target.list})`,
                target.values,
                plpgsqlCheckIssueCodec.decode,
              );
            }),
          dependencies: (routine, options = {}) =>
            context.run(() => dependencies("plpgsql_show_dependency_tb", routine, options)),
          nativeDependencies: (routine, options = {}) =>
            context.run(() => dependencies("__plpgsql_show_dependency_tb", routine, options)),
          pragma: (names) =>
            context.run(async () => {
              const checked = v.parse(v.nullable(v.array(v.string())), names);
              const value = await scalar(`${schema}."plpgsql_check_pragma"(VARIADIC $1::pg_catalog.text[])`, [checked]);
              return value === null ? null : int4Codec.decode(value);
            }),
          profiler: (enable = null) =>
            context.run(() =>
              flag(`${schema}."plpgsql_check_profiler"($1::pg_catalog.bool)`, [
                v.parse(v.nullable(v.boolean()), enable),
              ]),
            ),
          tracer: (request = {}) =>
            context.run(async () => {
              const checked = v.parse(plpgsqlCheckTracerValidator, request);
              return flag(`${schema}."plpgsql_check_tracer"($1::pg_catalog.bool,$2::pg_catalog.text)`, [
                checked.enable ?? null,
                checked.verbosity ?? null,
              ]);
            }),
          profile: (routine) =>
            context.run(() => {
              const target = routineCall(routine);
              return rows(
                `${schema}."plpgsql_profiler_function_tb"(${target.list})`,
                target.values,
                plpgsqlCheckProfileLineCodec.decode,
              );
            }),
          profileStatements: (routine) =>
            context.run(() => {
              const target = routineCall(routine);
              return rows(
                `${schema}."plpgsql_profiler_function_statements_tb"(${target.list})`,
                target.values,
                plpgsqlCheckProfileStatementCodec.decode,
              );
            }),
          profiledFunctions: () =>
            context.run(() =>
              rows(`${schema}."plpgsql_profiler_functions_all"()`, [], plpgsqlCheckProfiledFunctionCodec.decode),
            ),
          statementCoverage: (routine) =>
            context.run(async () => {
              const target = routineCall(routine);
              return decodeFloat(
                await scalar(`${schema}."plpgsql_coverage_statements"(${target.list})`, target.values),
              );
            }),
          branchCoverage: (routine) =>
            context.run(async () => {
              const target = routineCall(routine);
              return decodeFloat(await scalar(`${schema}."plpgsql_coverage_branches"(${target.list})`, target.values));
            }),
          resetProfile: (routine) => context.run(() => reset("reset", v.parse(signature, routine).signature)),
          resetAllProfiles: () => context.run(() => reset("reset-all", null)),
          installFakeQueryIdHook: () =>
            context.run(async () => {
              await context.client.query(`SELECT ${schema}."plpgsql_profiler_install_fake_queryid_hook"()`);
            }),
          removeFakeQueryIdHook: () =>
            context.run(async () => {
              await context.client.query(`SELECT ${schema}."plpgsql_profiler_remove_fake_queryid_hook"()`);
            }),
        } satisfies PlpgsqlCheckSession);
      },
      callback,
      signal,
    );
    return { ...result, effects: snapshot() };
  } catch (cause) {
    if (cause instanceof ExtensionOperationError) throw new PlpgsqlCheckOperationError(cause, snapshot());
    throw cause;
  }
}
