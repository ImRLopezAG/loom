import { expect, test } from "vite-plus/test";
import { z } from "zod";
import * as v from "valibot";
import { defineApplication, createApplicationRpc, defineSchema } from "@loom/core/server";
import { oc } from "@loom/core/contract";
import { defineRelations } from "drizzle-orm";

const schema = defineSchema((s) => ({ tasks: { title: s.text().notNull() } }));
const relations = defineRelations(schema.tables);
const contract = { hello: oc.input(z.object({ name: z.string() })).output(v.object({ message: v.string() })) };

declare module "@loom/core/contract" {
  interface ProjectRegistration {
    schema: typeof schema;
    relations: typeof relations;
    contract: typeof contract;
  }
}

test("application definition constructs native named builders without reading environment values", () => {
  let validations = 0;
  const app = defineApplication({
    env: {
      TOKEN: z.string().transform((token) => {
        validations++;
        return token;
      }),
    },
    rpc: ({ os }) => ({
      os,
      auth: os.use(({ context, next }) => {
        if (!context.identity) throw new Error("Unauthorized");
        return next({ context: { user: { id: context.identity.subject } } });
      }),
    }),
  });
  const builders = createApplicationRpc(app, { schema, relations, contract });
  const hello = builders.auth.hello.handler(({ input, context }) => ({
    message: `${input.name}:${context.user.id}:${context.env.TOKEN}:${context.tables.tasks.title.name}`,
  }));
  expect(hello["~orpc"].inputSchemas).toBe(contract.hello["~orpc"].inputSchemas);
  expect(hello["~orpc"].outputSchemas).toBe(contract.hello["~orpc"].outputSchemas);
  expect(validations).toBe(0);
});

test("application context infers transformed environment and native middleware refinements", () => {
  const app = defineApplication({
    env: { PORT: v.pipe(v.string(), v.transform(Number)) },
    rpc: ({ os }) => ({ os }),
  });
  const { os } = createApplicationRpc(app, { schema, relations, contract });
  os.hello.handler(({ context }) => {
    const port: number = context.env.PORT;
    // @ts-expect-error Unknown environment variables are not injected.
    void context.env.SECRET;
    // @ts-expect-error Unknown tables are not available.
    void context.tables.missing;
    context.validators.id("tasks");
    // @ts-expect-error ID validators retain table names.
    context.validators.id("missing");
    return { message: String(port) };
  });
  // @ts-expect-error Contract output still constrains native handlers.
  os.hello.handler(() => ({ message: 42 }));
  expect(Object.keys(app.env)).toEqual(["PORT"]);
});
