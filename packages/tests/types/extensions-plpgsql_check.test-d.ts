import { expectTypeOf } from "vite-plus/test";
import type { NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
import { createPlpgsqlCheck_2_8 } from "../../../apps/loom/src/core/extensions/adapters/plpgsql_check";
import type {
  PlpgsqlCheckDependency,
  PlpgsqlCheckIssue,
  PlpgsqlCheckProfiledFunction,
} from "../../../apps/loom/src/core/extensions/adapters/plpgsql_check-codecs";
import {
  withPlpgsqlCheck,
  type PlpgsqlCheckOptions,
  type PlpgsqlCheckRoutine,
  type PlpgsqlCheckSession,
} from "../../../apps/loom/src/tooling/extensions/operations/plpgsql_check";
import source from "../../../apps/loom/src/tooling/extensions/manifests/plpgsql_check.json";

// Compiled by the matching plpgsqlCheckTypesProofCase; this wrapper performs no runtime operator work.
function plpgsqlCheckTypeContract(): void {
  const descriptor = {
    name: "plpgsql_check",
    version: "2.8",
    schema: "extensions",
    apiSupport: { status: "verified", digest: source.digest },
  } as const;
  const binding = createPlpgsqlCheck_2_8(descriptor);
  // @ts-expect-error Static analysis and profiling are absent from ordinary application SQL.
  binding.sql.functions.plpgsql_check_function();
  const signature: PlpgsqlCheckRoutine = { signature: "public.f(integer)" };
  const name: PlpgsqlCheckRoutine = { name: "f" };
  // @ts-expect-error A routine is either a native signature or a native name, never both.
  const both: PlpgsqlCheckRoutine = { signature: "f()", name: "f" };
  const options: PlpgsqlCheckOptions = { relation: { schema: "public", name: "t" }, oldTable: null, allWarnings: true };
  // @ts-expect-error Flags are native booleans.
  const numeric: PlpgsqlCheckOptions = { fatalErrors: 1 };
  void [both, numeric];
  void withPlpgsqlCheck("postgresql://operator/fixture", descriptor, async (session) => {
    expectTypeOf(session).toEqualTypeOf<PlpgsqlCheckSession>();
    expectTypeOf(await session.check(signature, { ...options, format: "json" })).toEqualTypeOf<readonly string[]>();
    // @ts-expect-error Native formats are text, json and xml.
    await session.check(name, { format: "yaml" });
    const issues = await session.checkTable(name, options);
    expectTypeOf(issues).toEqualTypeOf<readonly PlpgsqlCheckIssue[]>();
    expectTypeOf(issues[0]!.lineno).toEqualTypeOf<number | null>();
    const dependencies = await session.dependencies(signature);
    expectTypeOf(dependencies).toEqualTypeOf<readonly PlpgsqlCheckDependency[]>();
    expectTypeOf(await session.nativeDependencies(name)).toEqualTypeOf<readonly PlpgsqlCheckDependency[]>();
    expectTypeOf(dependencies[0]!.oid).toEqualTypeOf<number | null>();
    expectTypeOf(await session.pragma(["disable:check"])).toEqualTypeOf<number | null>();
    expectTypeOf(await session.profiler(true)).toEqualTypeOf<boolean | null>();
    expectTypeOf(await session.tracer({ enable: true, verbosity: "terse" })).toEqualTypeOf<boolean | null>();
    const all = await session.profiledFunctions();
    expectTypeOf(all).toEqualTypeOf<readonly PlpgsqlCheckProfiledFunction[]>();
    expectTypeOf(all[0]!.exec_count).toEqualTypeOf<bigint | null>();
    expectTypeOf(all[0]!.total_time).toEqualTypeOf<number | NonfiniteNumber | null>();
    expectTypeOf(await session.statementCoverage(name)).toEqualTypeOf<number | NonfiniteNumber | null>();
    // @ts-expect-error The native reset has only the regprocedure overload.
    await session.resetProfile(name);
    await session.resetProfile({ signature: "public.f(integer)" });
    // @ts-expect-error No raw operator client crosses into callback.
    void session.client;
    return issues;
  });
}
void plpgsqlCheckTypeContract;
