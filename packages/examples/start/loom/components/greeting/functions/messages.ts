import { os } from "../_generated/rpc";
export default os.messages.router({
  create: os.messages.create.handler(async ({ input, context }) => context.internal.messages.format(input)),
});
