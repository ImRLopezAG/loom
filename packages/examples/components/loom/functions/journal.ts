import { auth } from "../_generated/rpc";
export default auth.journal.router({
  list: auth.journal.list.handler(({ context }) => context.components.journal.rpc.entries.list()),
  add: auth.journal.add.handler(({ context, input }) => context.components.journal.rpc.entries.add(input)),
  watch: auth.journal.watch.handler(({ context }) => context.components.journal.rpc.entries.watch()),
});
