import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createQueryMethod, createMutationMethod } from "@loom/core/query";
import type { FunctionReference } from "@loom/core/client";
import type { QueryClient } from "@tanstack/react-query";

declare const query: FunctionReference<"query", "public", { id: string }, { created: Date; count: bigint }>;
declare const mutation: FunctionReference<"mutation", "public", { value: number }, bigint>;
declare const secret: FunctionReference<"query", "internal", null, string>;
declare const client: QueryClient;
const api = { tasks: { list: createQueryMethod(query), save: createMutationMethod(mutation) } };
export function useTypeFixture() {
  const options = api.tasks.list({ input: { id: "one" } });
  const result = useQuery(options);
  const encoded: { created: string; count: string } | undefined = result.data;
  const cached: typeof encoded = client.getQueryData(options.queryKey);
  const selected = useQuery(api.tasks.list({ input: { id: "one" }, select: (row) => row.count.length }));
  const length: number | undefined = selected.data;
  const seeded = useQuery(api.tasks.list({ input: { id: "one" }, initialData: { created: "now", count: "1" } }));
  const defined: string = seeded.data.count;
  const suspense = useSuspenseQuery(options);
  const suspended: string = suspense.data.count;
  const write = useMutation(
    api.tasks.save({
      onSuccess: (value, variables) => {
        const output: string = value;
        const input: number = variables.value;
        void output;
        void input;
      },
    }),
  );
  const written: Promise<string> = write.mutateAsync({ value: 1 });
  void encoded;
  void cached;
  void length;
  void defined;
  void suspended;
  void written;
  // @ts-expect-error Input retains the generated type.
  api.tasks.list({ input: { id: 1 } });
  // @ts-expect-error Internal functions cannot be exposed as client methods.
  createQueryMethod(secret);
  // @ts-expect-error Mutation variables retain their generated type.
  write.mutate({ value: "one" });
  // @ts-expect-error Query identity belongs to the generated method.
  api.tasks.list({ input: { id: "one" }, queryKey: ["unsafe"] });
}
