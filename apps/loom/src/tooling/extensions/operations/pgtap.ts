import * as v from "valibot";
import {
  createPgtap_1_3_3,
  pgtapArgument,
  pgtapRoutineSpecs,
  type PgtapArguments,
  type PgtapAnyResult,
  type PgtapMember,
  type PgtapResult,
  type PgtapRoutines,
} from "../../../core/extensions/adapters/pgtap";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/pgtap.json";

// Native members include leading underscores; migration object-name policy does not describe extension identifiers.
const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

export interface PgtapSession {
  /** Canonical exact member IDs retain every overload, including SQL-callable underscore helpers. */
  readonly routines: PgtapRoutines;
  readonly call: <Member extends PgtapMember>(
    member: Member,
    ...args: PgtapArguments<(typeof pgtapRoutineSpecs)[Member]["args"]>
  ) => Promise<PgtapResult<Member>>;
  readonly plan: PgtapRoutines["routine:$extension:pgtap.plan(pg_catalog.int4)"];
  readonly noPlan: PgtapRoutines["routine:$extension:pgtap.no_plan()"];
  readonly ok: PgtapRoutines["routine:$extension:pgtap.ok(pg_catalog.bool,pg_catalog.text)"];
  readonly finish: PgtapRoutines["routine:$extension:pgtap.finish(pg_catalog.bool)"];
  readonly views: {
    readonly foreignKeys: () => Promise<
      readonly import("../../../core/extensions/adapters/pgtap-codecs").PgtapOutput<"pg_all_foreign_keys">[]
    >;
    readonly functions: () => Promise<
      readonly import("../../../core/extensions/adapters/pgtap-codecs").PgtapOutput<"tap_funky">[]
    >;
  };
}

/** Dedicated operator connection and transaction own pgTAP's native temporary test state.
 * TAP failures remain native result data. SQL-taking routines execute with the supplied operator's authority;
 * no automatic finish, JS assertion replacement, or restriction of caller SQL is introduced.
 */
export async function withPgtap<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"pgtap", { version: "1.3.3"; schema: string }>,
  callback: (session: PgtapSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  const api = createPgtap_1_3_3(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const schema = quoteIdentifier(descriptor.schema);
  return withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      // PostgreSQL deparse must see the same fully qualified objects as the captured manifest.
      await context.client.query("SET LOCAL search_path = pg_catalog");
      await verifyExtensionApiContracts(context.client, [requirement]);
      // Native SQL/PLpgSQL bodies use unqualified sibling routines and backend-local pg_temp test state.
      await context.client.query(`SET LOCAL search_path = ${schema}, public, pg_catalog, pg_temp`);
      const entries = Object.entries(pgtapRoutineSpecs).map(([member, spec]) => {
        const call = (...values: readonly unknown[]) =>
          context.run(async () => {
            const minimum = spec.args.filter((type) => !type.endsWith("?")).length;
            if (values.length < minimum || values.length > spec.args.length)
              throw new Error("Invalid pgTAP overload argument count");
            // The captured defaults are trailing; omission lets PostgreSQL evaluate each native default.
            let supplied = values.length;
            while (supplied > minimum && values[supplied - 1] === undefined) supplied--;
            const parameters = values
              .slice(0, supplied)
              .map((value, index) => pgtapArgument(api.codecs, spec.args[index]!, value));
            const args = parameters.map(({ codec }, index) => {
              const type = codec.sqlType;
              if (!type) throw new Error("A pgTAP operator parameter requires its native SQL type");
              return `${spec.variadic && index === spec.args.length - 1 ? "VARIADIC " : ""}$${index + 1}::${quoteIdentifier(type.schema)}.${quoteIdentifier(type.name)}${type.array ? "[]" : ""}`;
            });
            const codec = api.codecs[spec.result];
            const projection = codec.transport === "text" ? "s::pg_catalog.text" : "s";
            // SAFETY: each captured argument codec validates its heterogeneous input during encoding.
            const result = await context.client.query(
              `SELECT ${projection} AS value FROM ${schema}.${quoteIdentifier(spec.name)}(${args.join(",")}) AS s`,
              parameters.map(({ codec, value }) => codec.encode(value as never)),
            );
            const decoded = result.rows.map((row: { value: unknown }) => codec.decode(row.value));
            if (spec.set) return Object.freeze(decoded);
            if (decoded.length !== 1) throw new Error("Native scalar pgTAP routine did not return exactly one row");
            return decoded[0];
          });
        return [member, call] as const;
      });
      // SAFETY: exact native specs determine each tuple/result pair; construction never exposes an asserted result generic.
      const routines = Object.freeze(Object.fromEntries(entries)) as PgtapRoutines;
      const views = {
        foreignKeys: () =>
          context.run(async () => {
            const rows = await context.client.query(
              `SELECT s::pg_catalog.text AS value FROM ${schema}.pg_all_foreign_keys AS s`,
            );
            return Object.freeze(
              rows.rows.map((row: { value: string }) => api.codecs.pg_all_foreign_keys.decode(row.value)),
            );
          }),
        functions: () =>
          context.run(async () => {
            const rows = await context.client.query(`SELECT s::pg_catalog.text AS value FROM ${schema}.tap_funky AS s`);
            return Object.freeze(rows.rows.map((row: { value: string }) => api.codecs.tap_funky.decode(row.value)));
          }),
      };
      // SAFETY: member selects the same function and parameter tuple; this is the canonical dispatch alias.
      const call = ((member: PgtapMember, ...args: readonly unknown[]) =>
        (routines[member] as (...values: readonly unknown[]) => Promise<PgtapAnyResult>)(
          ...args,
        )) as PgtapSession["call"];
      return Object.freeze({
        routines,
        call,
        plan: routines["routine:$extension:pgtap.plan(pg_catalog.int4)"],
        noPlan: routines["routine:$extension:pgtap.no_plan()"],
        ok: routines["routine:$extension:pgtap.ok(pg_catalog.bool,pg_catalog.text)"],
        finish: routines["routine:$extension:pgtap.finish(pg_catalog.bool)"],
        views: Object.freeze(views),
      });
    },
    callback,
    signal,
  );
}
