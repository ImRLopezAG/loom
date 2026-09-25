import { defineRpcAuth } from "@loom/core/server";
import { ORPCError } from "@orpc/server";

export default defineRpcAuth({
  authorize: ({ path, identity, job }) => {
    if (path[0] === "files" && (path[1] === "created" || path[1] === "process")) {
      if (!job) throw new ORPCError("FORBIDDEN");
      return;
    }
    if (!identity) throw new ORPCError("UNAUTHORIZED");
  },
});
