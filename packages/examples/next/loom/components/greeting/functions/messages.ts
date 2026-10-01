import { os } from "../_generated/rpc";
import { Effect } from "effect";
export default os.messages.router({
  create: os.messages.create.effect(function* ({ input, context }) {
    return yield* Effect.promise(() => context.internal.messages.format(input));
  }),
});
