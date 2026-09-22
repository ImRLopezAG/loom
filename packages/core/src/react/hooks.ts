"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import * as v from "valibot";
import { canonical } from "../validation/canonical";
import { json, wire } from "../validation/encoding";
import type { JsonValue } from "../schema/fields";
import type { FunctionReference } from "../client/reference";
import { LoomClientError } from "../client/transport";
import type { CallOptions, WireValue } from "../client/transport";
import type { QuerySnapshot } from "../client/live";
import { useLoomContext } from "./provider";

const definitionSchema = v.strictObject({ name: v.string(), version: v.string(), args: json });
const serverSnapshot = Object.freeze({ status: "loading" } as const);
const getServerSnapshot = () => serverSnapshot;

export function useQuery<Input, Output>(
  reference: FunctionReference<"query", "public", Input, Output>,
  args: NoInfer<Input>,
): QuerySnapshot<WireValue<Output>> {
  const { live } = useLoomContext();
  if (reference.kind !== "query" || reference.visibility !== "public")
    throw new LoomClientError("INVALID_REFERENCE", "Live queries require a public generated query reference");
  const encoded = v.safeParse(wire, args);
  if (!encoded.success) throw new LoomClientError("INVALID_ARGUMENTS", "Arguments must use supported wire values");
  const key = canonical({ name: reference.name, version: reference.version, args: encoded.output });
  // Canonical content, rather than object identity, keeps inline object arguments from resubscribing on every result.
  const store = useMemo(() => {
    const definition = v.parse(definitionSchema, JSON.parse(key));
    return live.query<JsonValue, Output>(
      { kind: "query", visibility: "public", name: definition.name, version: definition.version },
      definition.args,
    );
  }, [live, key]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
}
export function useLoomClient() {
  return useLoomContext().client;
}
function useFunction<Kind extends "mutation" | "action", Input, Output>(
  reference: FunctionReference<Kind, "public", Input, Output>,
) {
  const client = useLoomClient();
  return useCallback(
    (args: NoInfer<Input>, options?: CallOptions) => client.call(reference, args, options),
    [client, reference],
  );
}
export function useMutation<Input, Output>(reference: FunctionReference<"mutation", "public", Input, Output>) {
  return useFunction(reference);
}
export function useAction<Input, Output>(reference: FunctionReference<"action", "public", Input, Output>) {
  return useFunction(reference);
}
