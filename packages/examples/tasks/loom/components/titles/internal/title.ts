import { os } from "../_generated/rpc";
export default os.internal.title.router({
  normalize: os.internal.title.normalize.handler(({ input }) => input),
});
