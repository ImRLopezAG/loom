import { defineRpcAuth } from "loom/server";
import { neonAuth } from "loom/neon";
import { ORPCError } from "@orpc/server";

export default defineRpcAuth({
  verification: neonAuth({
    origins: (process.env.APP_ORIGINS ?? "http://localhost:5174").split(","),
  }),
  authorize: ({ identity }) => {
    if (!identity) throw new ORPCError("UNAUTHORIZED");
  },
});
