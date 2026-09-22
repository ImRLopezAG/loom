import { useAction, useMutation, useQuery } from "@loom/core/react";
import type { FunctionReference } from "@loom/core/client";

declare const query: FunctionReference<"query", "public", { id: string }, { created: Date; count: bigint }>;
declare const mutation: FunctionReference<"mutation", "public", { value: number }, bigint>;
declare const action: FunctionReference<"action", "public", null, string>;
declare const secret: FunctionReference<"query", "internal", null, string>;
export function useTypeFixture() {
  const snapshot = useQuery(query, { id: "one" });
  if (snapshot.status === "success") {
    const encoded: { created: string; count: string } = snapshot.value;
    void encoded;
  }
  const write = useMutation(mutation);
  const written: Promise<string> = write({ value: 1 });
  void written;
  const invoke = useAction(action);
  const result: Promise<string> = invoke(null);
  void result;
  // @ts-expect-error Query arguments are inferred from the generated reference.
  useQuery(query, { id: 1 });
  // @ts-expect-error Internal queries are not exposed to React consumers.
  useQuery(secret, null);
  // @ts-expect-error Mutation arguments retain their generated types.
  void write({ value: "one" });
  // @ts-expect-error Action and mutation hooks accept only their respective kinds.
  useMutation(action);
  // @ts-expect-error Query hooks do not accept mutations.
  useQuery(mutation, { value: 1 });
}
