import { createClient, createQueryCache, createLiveQueryClient } from "@loom/core/client";
import type { FunctionReference } from "@loom/core/client";

declare const read: FunctionReference<
  "query",
  "public",
  { id: string },
  { count: bigint; created: Date; names: readonly string[] }
>;
declare const secret: FunctionReference<"query", "internal", null, string>;
const client = createClient({ url: "https://api.example.test" });
const result: Promise<{ count: string; created: string; names: readonly string[] }> = client.call(read, { id: "one" });
void result;
// @ts-expect-error Argument types come from the reference, not the supplied argument.
void client.call(read, { id: 1 });
// @ts-expect-error Public clients cannot invoke internal references.
void client.call(secret, null);
// @ts-expect-error Wire bigint values are decimal strings, not JavaScript bigint.
const native: Promise<{ count: bigint }> = client.call(read, { id: "one" });
void native;
const cache = createQueryCache({ client, deployment: "one", identityKey: null });
const cached: Promise<{ count: string; created: string; names: readonly string[] }> = cache.read(read, { id: "one" });
void cached;
// @ts-expect-error Cache argument types come from the generated reference.
void cache.read(read, { id: 1 });
// @ts-expect-error Caches cannot expose internal queries.
void cache.read(secret, null);
declare const write: FunctionReference<"mutation", "public", null, string>;
// @ts-expect-error Mutations cannot be cached as queries.
void cache.read(write, null);

const live = createLiveQueryClient({ client, url: "https://api.example.test", deployment: "one", identityKey: null });
const snapshot = live.query(read, { id: "one" }).getSnapshot();
if (snapshot.status === "success") {
  const encoded: { count: string; created: string; names: readonly string[] } = snapshot.value;
  void encoded;
}
// @ts-expect-error Live queries retain generated argument inference.
void live.query(read, { id: 1 });
// @ts-expect-error Live queries cannot expose internal references.
void live.query(secret, null);
// @ts-expect-error Mutations cannot become live queries.
void live.query(write, null);
