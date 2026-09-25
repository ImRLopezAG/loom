import { defineApplication } from "@loom/core/server";
import { Context } from "effect";
import { z } from "zod";
import { Greeting } from "./services";
export default defineApplication({
  env: { GREETING_PREFIX: z.string().default("Hello") },
  rpc: ({ os }) => ({
    os,
    auth: os.use(({ context, next, errors }) => {
      if (!context.identity) throw errors.UNAUTHORIZED();
      return next({
        context: {
          user: context.identity,
          "effect/context": Context.add(context["effect/context"], Greeting, { prefix: context.env.GREETING_PREFIX }),
        },
      });
    }),
  }),
});
