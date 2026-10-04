import { os } from "../_generated/rpc";
export default os.tasks.router({
  list: os.tasks.list.handler(async ({ context: { db, tables } }) =>
    (await db.select({ title: tables.tasks.title }).from(tables.tasks).limit(100)).map((row) => row.title),
  ),
});
