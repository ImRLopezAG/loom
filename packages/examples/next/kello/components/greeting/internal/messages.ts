import { os } from "../_generated/rpc";
export default os.internal.messages.router({
  format: os.internal.messages.format.handler(({ input, context }) => `${context.env.PREFIX}, ${input.name}!`),
});
