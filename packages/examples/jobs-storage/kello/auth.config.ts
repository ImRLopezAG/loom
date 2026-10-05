import { defineRpcAuth } from "kello/server";
import { neonAuth } from "kello/neon";
import { ORPCError } from "@orpc/server";

export default defineRpcAuth({
  verification: neonAuth({
    origins: (process.env.APP_ORIGINS ?? "http://localhost:5173").split(","),
  }),
  authorize: ({ path, identity, job }) => {
    if (path[0] === "files" && (path[1] === "created" || path[1] === "process")) {
      if (!job) throw new ORPCError("FORBIDDEN");
      return;
    }
    if (!identity) throw new ORPCError("UNAUTHORIZED");
  },
});
