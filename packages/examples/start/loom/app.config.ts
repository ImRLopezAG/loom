import { defineApplication } from "@loom/core/server";
import * as v from "valibot";
export default defineApplication({
  env: { GREETING_PREFIX: v.optional(v.string(), "Hello") },
  rpc: ({ os }) => ({
    os,
    auth: os.use(({ context, next, errors }) => {
      if (!context.identity) throw errors.UNAUTHORIZED();
      return next({ context: { user: context.identity } });
    }),
  }),
});
