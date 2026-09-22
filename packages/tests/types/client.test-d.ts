import { createClient } from "@loom/core/client";
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
