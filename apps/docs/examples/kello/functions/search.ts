import { os } from "../_generated/rpc";

export default os.search.router({
  list: os.search.list.handler(({ context, input }) => context.search.tasks.paginate(input)),
  watch: os.search.watch.handler(({ context, input }) => context.search.tasks.watch(input)),
});
