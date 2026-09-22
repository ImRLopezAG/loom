import * as v from "valibot";
import { canonical } from "../validation/canonical";
import { wire } from "../validation/encoding";
import { LoomClientError } from "./transport";
import type { LoomClient, WireValue } from "./transport";
import type { FunctionReference } from "./reference";

export interface QueryCacheOptions {
  readonly client: LoomClient;
  readonly deployment: string;
  readonly identityKey: string | null;
  readonly maxEntries?: number;
}
interface Entry {
  readonly controller: AbortController;
  readonly promise: Promise<unknown>;
}

/** Auth adapters must call setIdentity synchronously when their user/tenant changes or signs out. */
export function createQueryCache(options: QueryCacheOptions) {
  const { client, deployment } = options;
  const maximum = options.maxEntries ?? 100;
  if (!deployment || deployment.length > 2048) throw new Error("Invalid cache deployment identity");
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 1000) throw new Error("Invalid query cache size");
  let identity = options.identityKey;
  let epoch = 0;
  const entries = new Map<string, Entry>();
  const clear = () => {
    epoch++;
    const previous = [...entries.values()];
    entries.clear();
    for (const entry of previous) entry.controller.abort();
  };
  return {
    clear,
    setIdentity(next: string | null): void {
      if (identity === next) return;
      identity = next;
      clear();
    },
    async read<Input, Output>(
      reference: FunctionReference<"query", "public", Input, Output>,
      args: NoInfer<Input>,
    ): Promise<WireValue<Output>> {
      if (reference.kind !== "query" || reference.visibility !== "public")
        throw new LoomClientError("INVALID_REFERENCE", "Query caches accept public queries only");
      const captured = structuredClone(args);
      const encoded = v.safeParse(wire, captured);
      if (!encoded.success) throw new LoomClientError("INVALID_ARGUMENTS", "Arguments must use supported wire values");
      const owner = identity;
      const generation = epoch;
      const key = canonical([deployment, owner, reference.name, reference.version, encoded.output]);
      let entry = entries.get(key);
      if (entry) {
        entries.delete(key);
        entries.set(key, entry);
      } else {
        let evicted: Entry | undefined;
        if (entries.size >= maximum) {
          const oldest = entries.entries().next().value;
          if (oldest) {
            evicted = oldest[1];
            entries.delete(oldest[0]);
          }
        }
        const controller = new AbortController();
        const contract = { ...reference };
        entry = {
          controller,
          promise: Promise.resolve().then(() =>
            client.call(contract, captured, { signal: controller.signal, identityKey: owner }),
          ),
        };
        entries.set(key, entry);
        evicted?.controller.abort();
      }
      try {
        const value = await entry.promise;
        if (owner !== identity)
          throw new LoomClientError("AUTH_CHANGED", "Identity changed while the query was pending");
        if (epoch !== generation || entries.get(key) !== entry)
          throw new LoomClientError("CANCELLED", "Query cache entry was invalidated");
        // SAFETY: This entry's key includes the generated function's name/version and encoded arguments;
        // client.call checks that server contract and returns its wire result. Each caller gets a separate copy.
        return structuredClone(value) as WireValue<Output>;
      } catch (cause) {
        if (entries.get(key) === entry) entries.delete(key);
        if (owner !== identity)
          throw new LoomClientError("AUTH_CHANGED", "Identity changed while the query was pending");
        throw cause;
      }
    },
  };
}
export type QueryCache = ReturnType<typeof createQueryCache>;
