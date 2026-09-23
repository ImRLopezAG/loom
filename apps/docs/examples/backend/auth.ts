import { defineAuth, FunctionAccessDenied } from "@loom/core/server";

export default defineAuth({
  authorize: ({ identity }) => {
    if (!identity) throw new FunctionAccessDenied();
  },
});
