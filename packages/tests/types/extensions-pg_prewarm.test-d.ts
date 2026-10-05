import { expectTypeOf } from "vite-plus/test";
import { createPgPrewarm_1_2 } from "../../../apps/loom/src/core/extensions/adapters/pg_prewarm";
import {
  withPgPrewarm,
  type PrewarmRequest,
  type PrewarmSession,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_prewarm";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_prewarm.json";
// Compiled by the matching pgPrewarmTypesProofCase; this wrapper performs no runtime operator work.
function pgPrewarmTypeContract(): void {
  const descriptor = {
    name: "pg_prewarm",
    version: "1.2",
    schema: "extensions",
    apiSupport: { status: "verified", digest: source.digest },
  } as const;
  const binding = createPgPrewarm_1_2(descriptor);
  // @ts-expect-error Administrative warming is absent from ordinary application SQL.
  binding.sql.functions.pg_prewarm();
  const request: PrewarmRequest = {
    relation: { schema: "public", name: "items" },
    firstBlock: 0n,
    lastBlock: null,
    mode: "buffer",
    fork: "main",
  };
  // @ts-expect-error Blocks use exact bigint inputs.
  const numeric: PrewarmRequest = { ...request, firstBlock: 1 };
  // @ts-expect-error Native enum has no async mode.
  const mode: PrewarmRequest = { ...request, mode: "async" };
  void [numeric, mode];
  void withPgPrewarm("postgresql://operator/fixture", descriptor, async (session) => {
    expectTypeOf(session).toEqualTypeOf<PrewarmSession>();
    const warmed = await session.prewarm(request);
    expectTypeOf(warmed.blocks).toEqualTypeOf<bigint>();
    expectTypeOf(warmed.cacheResidency).toEqualTypeOf<"not-guaranteed">();
    // @ts-expect-error No raw operator client crosses into callback.
    session.client;
    return warmed;
  });
}
void pgPrewarmTypeContract;
