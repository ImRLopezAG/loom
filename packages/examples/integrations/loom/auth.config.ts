import { defineRpcAuth } from "loom/server";
import { ORPCError } from "@orpc/server";
export default defineRpcAuth({
  authorize: ({ identity }) => {
    if (!identity) throw new ORPCError("UNAUTHORIZED");
  },
});
