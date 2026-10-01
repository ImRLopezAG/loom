import { createClient, createServerClient } from "../loom/_generated/api";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
const options = { url: "https://example.test", getToken: async () => "token" };
const browser = createClient(options);
const server = createServerClient(options);
const rpc = createTanstackQueryUtils(browser.client);
const query = rpc.examples.zod.queryOptions({
  input: { name: "Alice" },
  enabled: false,
  select: (data) => data.message,
});
const live = rpc.examples.watch.liveOptions();
const mutation = rpc.examples.add.mutationOptions();
// @ts-expect-error Zod input is inferred through the generated client.
rpc.examples.zod.queryOptions({ input: { name: 1 } });
// @ts-expect-error The mixed Valibot output preserves its actual field types.
rpc.examples.mixed.queryOptions({ input: { name: "Alice" }, select: (data) => data.message.toFixed() });
// @ts-expect-error Server and browser clients share the same required input.
void server.client.examples.effect({ missing: true });
// @ts-expect-error Mutation input also remains inferred.
void server.client.examples.add({ text: 42 });
// @ts-expect-error Effect Schema input remains typed through its Standard Schema adapter.
rpc.examples.effectSchema.queryOptions({ input: { name: 42 } });
export { query, live, mutation };
