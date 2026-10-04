import { os } from "../_generated/rpc";
export default os.internal.entries.router({
  insert: os.internal.entries.insert.handler(async ({ input, context, errors }) => {
    if (!context.identity) throw errors.UNAUTHORIZED();
    const [entry] = await context.db
      .insert(context.tables.entries)
      .values({
        text: input.text,
        owner: context.identity.subject,
        issuer: context.identity.issuer,
      })
      .returning({ _id: context.tables.entries._id, text: context.tables.entries.text });
    if (!entry) throw errors.REJECTED();
    return entry;
  }),
});
