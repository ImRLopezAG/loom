import type { SQL } from "drizzle-orm";
import { createPgtap_1_3_3, pgtapParameter } from "../../../apps/loom/src/core/extensions/adapters/pgtap";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import type { PgtapSession } from "../../../apps/loom/src/tooling/extensions/operations/pgtap";
import { pgtapDescriptor } from "../../e2e/fixtures/pgtap";
const api = createPgtap_1_3_3(pgtapDescriptor);
const version: SQL<string | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.version();
const diagnostic: SQL<string | null> = api.diag("native text diagnostic");
api.fields.__time_trial_type();
const foreignKeys = api.views.foreignKeys("fk");
const foreignName: SQL<string | null> = foreignKeys.columns.fk_table_name;
// @ts-expect-error The native function view needs its sibling-resolving operator session.
api.views.functions("fn");
// @ts-expect-error Test-state mutation never enters application SQL.
void api.sql.overloads["routine:$extension:pgtap.ok(pg_catalog.bool)"];
// @ts-expect-error Sibling-resolving polymorphic overloads require the operator session search path.
api.sql.overloads["routine:$extension:pgtap.diag(pg_catalog.anyelement)"](42);
// @ts-expect-error Exact overload arity.
api.pgVersion(42);
// @ts-expect-error Exact version selection.
createPgtap_1_3_3({ ...pgtapDescriptor, version: "1.3.4" });
async function operator(session: PgtapSession) {
  const tap: string | null = await session.ok(false, "native TAP failure is data");
  const lines: readonly (string | null)[] = await session.finish();
  const state: number | null = await session.call("routine:$extension:pgtap.num_failed()");
  const equality: string | null = await session.call(
    "routine:$extension:pgtap.is(pg_catalog.anyelement,pg_catalog.anyelement)",
    pgtapParameter(int4Codec, 1),
    pgtapParameter(int4Codec, 1),
  );
  // @ts-expect-error Typed boolean arguments cannot receive string values.
  await session.ok("true", "wrong");
  // @ts-expect-error Member identity is closed, no arbitrary SQL escape through a member name.
  await session.call("SELECT 1");
  // @ts-expect-error Exact captured overload arity is required.
  await session.call(
    "routine:$extension:pgtap.is(pg_catalog.anyelement,pg_catalog.anyelement)",
    pgtapParameter(int4Codec, 1),
  );
  return { tap, lines, state, equality };
}
void [version, diagnostic, foreignName, operator];
