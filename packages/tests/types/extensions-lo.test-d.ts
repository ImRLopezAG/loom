import { expectTypeOf } from "vite-plus/test";
import { createLo_1_2 } from "../../../apps/loom/src/core/extensions/adapters/lo";
import { withLargeObjects, type LargeObjectSession } from "../../../apps/loom/src/tooling/extensions/operations/lo";
import source from "../../../apps/loom/src/tooling/extensions/manifests/lo.json";
// Compiled by the matching loTypesProofCase; this wrapper performs no runtime operator work.
function loTypeContract(): void {
  const descriptor = {
    name: "lo",
    version: "1.2",
    schema: "extensions",
    apiSupport: { status: "verified", digest: source.digest },
  } as const;
  const lo = createLo_1_2(descriptor);
  expectTypeOf(lo.codec.decode("1")).toEqualTypeOf<number>();
  lo.oid(null);
  lo.oid(4294967295);
  // @ts-expect-error Large-object references are unsigned number OIDs, not strings.
  lo.oid("1");
  // @ts-expect-error The callback is a schema declaration, not an application SQL function.
  lo.sql.functions.lo_manage();
  const promise = withLargeObjects("postgresql://operator/fixture", descriptor, async (session) => {
    expectTypeOf(session).toEqualTypeOf<LargeObjectSession>();
    const oid = await session.create({ hex: "01" });
    expectTypeOf(oid).toEqualTypeOf<number>();
    const bytes = await session.read(oid, { offset: 0n, length: 1 });
    expectTypeOf(bytes).toEqualTypeOf<{ hex: string }>();
    // @ts-expect-error No raw operator client crosses into the callback.
    session.client;
    // @ts-expect-error Native bigint offsets stay exact.
    session.write(oid, 1, bytes);
    return oid;
  });
  expectTypeOf(promise).toEqualTypeOf<Promise<{ readonly completion: "committed"; readonly value: number }>>();
  void promise;
}
void loTypeContract;
