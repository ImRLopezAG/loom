import { os } from "../_generated/rpc";
export default os.title.router({
  prepare: os.title.prepare.handler(({ context, input }) => context.internal.title.normalize(input)),
});
