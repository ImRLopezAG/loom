import { defineAuth, FunctionAccessDenied } from "@loom/core/server";

export default defineAuth({
  authorize: ({ name, identity, job }) => {
    if (name === "files:created" || name === "files:process") {
      if (!job) throw new FunctionAccessDenied();
      return;
    }
    if (!identity) throw new FunctionAccessDenied();
  },
});
