import { defineApplication } from "loom/server";
import * as v from "valibot";
export default defineApplication({
  env: {
    APP_ORIGINS: v.optional(v.string(), "http://localhost:3001"),
    GREETING_PREFIX: v.optional(v.string(), "Hello"),
  },
  rpc: ({ os }) => ({
    os,
    auth: os.use(({ context, next, errors }) => {
      if (!context.identity) throw errors.UNAUTHORIZED();
      return next({ context: { user: context.identity } });
    }),
  }),
});
