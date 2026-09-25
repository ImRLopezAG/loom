import { defineContract, resolveContract, oc, eventIterator } from "@loom/core/contract";
import { implement, createRouterClient } from "@orpc/server";
import * as v from "valibot";
import { z } from "zod";

const contract = resolveContract(
  defineContract({
    hello: oc.input(z.object({ name: z.string() })).output(v.object({ message: v.string() })),
    events: oc.output(eventIterator(z.object({ value: z.number() }))),
  }),
  { validators: { tables: {}, id: () => v.string() } },
);
const os = implement(contract).$context<{ identity: string | null }>();
const auth = os.use(({ context, next }) => {
  if (!context.identity) throw new Error("Unauthorized");
  return next({ context: { user: { id: context.identity } } });
});
const hello = auth.hello.handler(({ input, context }) => ({ message: `${context.user.id}:${input.name}` }));
// @ts-expect-error Handler output must satisfy the declared output schema.
os.hello.handler(() => ({ message: 42 }));
// @ts-expect-error Undeclared procedures do not exist.
void os.missing;
// @ts-expect-error Every declared procedure must be implemented.
os.router({ hello });
const events = os.events.handler(async function* () {
  yield { value: 1 };
});
// @ts-expect-error Streaming contracts require an iterator, not a finite result.
os.events.handler(() => ({ value: 1 }));
const router = os.router({ hello, events });
const client = createRouterClient(router, { context: { identity: "owner" } });
const result: Promise<{ message: string }> = client.hello({ name: "Loom" });
// @ts-expect-error Input schema remains inferred across contract and implementation.
void client.hello({ name: 42 });
export { result };
