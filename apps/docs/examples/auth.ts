import { defineAuth, FunctionAccessDenied } from "@loom/core/server";

export const auth = defineAuth({
  authorize: ({ identity }) => {
    if (!identity) throw new FunctionAccessDenied();
  },
});
