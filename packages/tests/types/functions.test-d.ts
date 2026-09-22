import { action, query } from "@loom/core/server";
import * as v from "valibot";

action({
  args: v.null(),
  returns: v.string(),
  handler: (context) => {
    // @ts-expect-error Actions do not receive direct database access.
    void context.db;
    return context.requestId;
  },
});

query({
  args: v.object({ name: v.string() }),
  returns: v.string(),
  handler: (context, args) => {
    void context.db;
    // @ts-expect-error Registered arguments retain their validator output types.
    args.name.toFixed();
    return args.name;
  },
});
