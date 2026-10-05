import * as v from "valibot";
import {
  anonArgument,
  ANON_NATIVE_SCHEMA,
  anonResultCodec,
  anonRoutineSpecs,
  createAnon_2_5_1,
  type AnonArguments,
  type AnonOperatorMember,
  type AnonResult,
  type AnonRoutines,
} from "../../../core/extensions/adapters/anon";
import type { AnonOutput } from "../../../core/extensions/adapters/anon-codecs";
import { anonDefaultArgumentNames } from "../../../core/extensions/adapters/anon-specs";
import { qualifiedRelationName, type RelationName } from "../../../core/extensions/adapters/pgstattuple-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock, quoteIdentifier } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/anon.json";

const text = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
const relationValidator = v.strictObject({ schema: text, name: text });
export const anonColumnValidator = v.strictObject({ schema: text, table: text, column: text });
/** A SQL expression; anon parses it and rejects functions outside its TRUSTED schemas when the label is written. */
export const anonRuleValidator = v.union([v.strictObject({ value: text }), v.strictObject({ function: text })]);

export interface AnonColumn {
  readonly schema: string;
  readonly table: string;
  readonly column: string;
}
export type AnonRule =
  | { readonly value: string; readonly function?: never }
  | { readonly function: string; readonly value?: never };
/** One row of anon.pg_masking_rules; `rule` is the stored native label. */
export interface AnonMaskingRule {
  readonly schema: string;
  readonly table: string;
  readonly column: string;
  readonly type: string;
  readonly rule: string;
  readonly function: string | null;
  readonly value: string | null;
  readonly priority: number;
}
export interface AnonSession {
  readonly routines: AnonRoutines;
  readonly call: <
    Member extends AnonOperatorMember,
    const Args extends AnonArguments<(typeof anonRoutineSpecs)[Member]["args"]>,
  >(
    member: Member,
    ...args: Args
  ) => Promise<AnonResult<Member, Args>>;
  readonly init: () => Promise<boolean | null>;
  readonly loadFakeData: () => Promise<boolean | null>;
  readonly isInitialized: () => Promise<boolean | null>;
  /** Truncates the fake-data tables; masking rules remain. */
  readonly reset: () => Promise<boolean | null>;
  readonly label: (column: AnonColumn, rule: AnonRule) => Promise<void>;
  readonly unlabel: (column: AnonColumn) => Promise<void>;
  readonly removeAllColumnRules: () => Promise<boolean | null>;
  readonly rules: () => Promise<readonly AnonMaskingRule[]>;
  /** Static masking rewrites stored rows in place; it commits only with the owned transaction. */
  readonly anonymizeColumn: (relation: RelationName, column: string) => Promise<boolean | null>;
  readonly anonymizeTable: (relation: RelationName) => Promise<boolean | null>;
  readonly anonymizeDatabase: () => Promise<boolean | null>;
  readonly startDynamicMasking: (trustNeighbors?: boolean) => Promise<boolean | null>;
  readonly stopDynamicMasking: () => Promise<boolean | null>;
  readonly startReplicaMasking: (policy?: string) => Promise<boolean | null>;
  readonly stopReplicaMasking: () => Promise<boolean | null>;
  readonly refreshReplicaMasking: (policy?: string) => Promise<boolean | null>;
  readonly views: {
    readonly maskingRules: () => Promise<readonly AnonOutput<"pg_masking_rules">[]>;
    readonly masks: () => Promise<readonly AnonOutput<"pg_masks">[]>;
    readonly maskedRoles: () => Promise<readonly AnonOutput<"pg_masked_roles">[]>;
    readonly identifiers: () => Promise<readonly AnonOutput<"pg_identifiers">[]>;
    readonly trustedFunctions: () => Promise<readonly AnonOutput<"pg_trusted_functions">[]>;
  };
}

const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
const ruleRow = v.strictObject({
  schema: v.string(),
  table: v.string(),
  column: v.string(),
  type: v.string(),
  rule: v.string(),
  function: v.nullable(v.string()),
  value: v.nullable(v.string()),
  priority: v.pipe(v.number(), v.integer()),
});

/** Operator session owns every captured routine. Query-safe members are also application SQL. */
export async function withAnon<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"anon", { version: "2.5.1"; schema: string }>,
  callback: (session: AnonSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  const api = createAnon_2_5_1(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const schema = quoteIdentifier(ANON_NATIVE_SCHEMA);
  return withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await context.client.query("SET LOCAL search_path = pg_catalog");
      await verifyExtensionApiContracts(context.client, [requirement]);
      await context.client.query("LOAD 'anon'");
      await context.client.query(`SET LOCAL search_path = ${schema}, pg_catalog, pg_temp`);
      await context.client.query("SET LOCAL DateStyle = 'ISO, YMD'");
      const entries = Object.entries(anonRoutineSpecs)
        .filter(([, spec]) => spec.result !== "event_trigger")
        .map(([member, spec]) => {
          const call = (...values: readonly unknown[]) =>
            context.run(async () => {
              const minimum = spec.args.filter((type) => !type.startsWith("?")).length;
              if (values.length < minimum || values.length > spec.args.length)
                throw new Error("Invalid anon overload argument count");
              const parameters = values.flatMap((value, index) => {
                const optional = spec.args[index]!.startsWith("?");
                if (optional && value === undefined) return [];
                // SAFETY: the exact manifest supplies argument names for every optional spec, checked by the family unit test.
                const name = optional
                  ? anonDefaultArgumentNames[member as keyof typeof anonDefaultArgumentNames][index]
                  : undefined;
                return [{ ...anonArgument(api.codecs, spec.args[index]!, value), name }];
              });
              const args = parameters.map(({ codec, name }, index) => {
                const type = codec.sqlType;
                if (!type) throw new Error("An anon operator parameter requires its native SQL type");
                return `${name === undefined ? "" : `${quoteIdentifier(name)} => `}$${index + 1}::${quoteIdentifier(type.schema)}.${quoteIdentifier(type.name)}${type.array ? "[]" : ""}`;
              });
              const { codec, arrayElement } = anonResultCodec(api.codecs, spec, values);
              const projection = arrayElement
                ? "ARRAY[s]::pg_catalog.text"
                : codec.transport === "text"
                  ? "s::pg_catalog.text"
                  : "s";
              const result = await context.client.query(
                `SELECT ${projection} AS value FROM ${schema}.${quoteIdentifier(spec.name)}(${args.join(",")}) AS s`,
                // SAFETY: each value retains the codec selected for its captured native argument; encode performs validation.
                parameters.map(({ codec: parameterCodec, value }) => parameterCodec.encode(value as never)),
              );
              const decoded = result.rows.map((row: { value: unknown }) => {
                const value = codec.decode(row.value);
                // SAFETY: arrayElement selects only concrete array codecs, and the SQL projection wraps exactly one native element.
                return arrayElement ? (value as { values: readonly unknown[] }).values[0] : value;
              });
              if (spec.set) return Object.freeze(decoded);
              if (decoded.length !== 1) throw new Error("Native scalar anon routine did not return exactly one row");
              return decoded[0];
            });
          return [member, call] as const;
        });
      // SAFETY: all directly callable captured routines are populated with argument validation and native result decoding.
      const routines = Object.freeze(Object.fromEntries(entries)) as AnonRoutines;
      const flag = async (member: AnonOperatorMember, ...args: readonly unknown[]) => {
        // SAFETY: private aliases select captured routines and validate their decoded result as nullable boolean below.
        // oxlint-disable-next-line anti-slop/no-unknown-returns -- This private dispatcher immediately parses the already-decoded native value.
        const value = await (routines[member] as (...values: readonly unknown[]) => Promise<unknown>)(...args);
        return v.parse(v.nullable(v.boolean()), value);
      };
      async function setLabel(column: AnonColumn, label: string | null) {
        const target = v.parse(anonColumnValidator, column);
        await context.client.query(
          `SECURITY LABEL FOR anon ON COLUMN ${quote(target.schema)}.${quote(target.table)}.${quote(target.column)} IS ${label === null ? "NULL" : literal(label)}`,
        );
      }
      async function selectView<T>(
        name: string,
        // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native driver values enter through the selected view codec's validating decoder.
        codec: { readonly transport?: string; decode: (value: unknown) => T },
      ): Promise<readonly T[]> {
        const projection = codec.transport === "text" ? "s::pg_catalog.text" : "s";
        const result = await context.client.query(
          `SELECT ${projection} AS value FROM ${schema}.${quoteIdentifier(name)} AS s`,
        );
        return Object.freeze(result.rows.map((row: { value: unknown }) => codec.decode(row.value)));
      }
      return Object.freeze({
        routines,
        // SAFETY: the public mapped signature pairs exact keys with exact arguments; each native call validates through its codecs.
        call: ((member: AnonOperatorMember, ...args: readonly unknown[]) =>
          // SAFETY: this internal dispatch erases heterogeneous result types while the public call retains the member-specific signature.
          // oxlint-disable-next-line anti-slop/no-unknown-returns -- The member's validating native result codec determines the public mapped return type.
          (routines[member] as (...values: readonly unknown[]) => Promise<unknown>)(...args)) as AnonSession["call"],
        init: () => flag("routine:anon.init()"),
        loadFakeData: () => flag("routine:anon.load_fake_data()"),
        isInitialized: () => flag("routine:anon.is_initialized()"),
        reset: () => flag("routine:anon.reset()"),
        label: (column, rule) =>
          context.run(() => {
            const parsed = v.parse(anonRuleValidator, rule);
            return setLabel(
              column,
              "value" in parsed ? `MASKED WITH VALUE ${parsed.value}` : `MASKED WITH FUNCTION ${parsed.function}`,
            );
          }),
        unlabel: (column) => context.run(() => setLabel(column, null)),
        removeAllColumnRules: () => flag("routine:anon.remove_masks_for_all_columns()"),
        rules: () =>
          context.run(async () => {
            const result = await context.client.query(
              `SELECT relnamespace::pg_catalog.text AS schema, relname::pg_catalog.text AS table, attname::pg_catalog.text AS column, format_type AS type, col_description AS rule, masking_function AS function, masking_value AS value, priority FROM ${schema}."pg_masking_rules" ORDER BY 1, 2, attnum`,
            );
            return Object.freeze(v.parse(v.array(ruleRow), result.rows).map((row) => Object.freeze(row)));
          }),
        anonymizeColumn: (relation, column) =>
          flag(
            "routine:anon.anonymize_column(pg_catalog.text,pg_catalog.name)",
            qualifiedRelationName(v.parse(relationValidator, relation)),
            v.parse(text, column),
          ),
        anonymizeTable: (relation) =>
          flag(
            "routine:anon.anonymize_table(pg_catalog.regclass)",
            qualifiedRelationName(v.parse(relationValidator, relation)),
          ),
        anonymizeDatabase: () => flag("routine:anon.anonymize_database(pg_catalog.text)"),
        startDynamicMasking: (trustNeighbors) =>
          trustNeighbors === undefined
            ? flag("routine:anon.start_dynamic_masking(pg_catalog.bool)")
            : flag("routine:anon.start_dynamic_masking(pg_catalog.bool)", trustNeighbors),
        stopDynamicMasking: () => flag("routine:anon.stop_dynamic_masking()"),
        startReplicaMasking: (policy) =>
          policy === undefined
            ? flag("routine:anon.start_replica_masking(pg_catalog.text)")
            : flag("routine:anon.start_replica_masking(pg_catalog.text)", policy),
        stopReplicaMasking: () => flag("routine:anon.stop_replica_masking()"),
        refreshReplicaMasking: (policy) =>
          policy === undefined
            ? flag("routine:anon.refresh_replica_masking(pg_catalog.text)")
            : flag("routine:anon.refresh_replica_masking(pg_catalog.text)", policy),
        views: {
          maskingRules: () => context.run(() => selectView("pg_masking_rules", api.codecs.pg_masking_rules)),
          masks: () => context.run(() => selectView("pg_masks", api.codecs.pg_masks)),
          maskedRoles: () => context.run(() => selectView("pg_masked_roles", api.codecs.pg_masked_roles)),
          identifiers: () => context.run(() => selectView("pg_identifiers", api.codecs.pg_identifiers)),
          trustedFunctions: () =>
            context.run(() => selectView("pg_trusted_functions", api.codecs.pg_trusted_functions)),
        },
      } satisfies AnonSession);
    },
    callback,
    signal,
  );
}
