import { defineApplication } from "kello/server";
import * as v from "valibot";
export default defineApplication({
  env: { APP_ORIGINS: v.optional(v.string(), "http://localhost:5173") },
  rpc: ({ os }) => ({ os }),
});
