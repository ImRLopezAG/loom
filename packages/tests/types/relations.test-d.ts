import { connectDatabase, defineSchema } from "@loom/core/server";
import { defineRelations } from "drizzle-orm";

const schema = defineSchema((s) => ({
  users: { name: s.text().notNull() },
  tasks: { authorId: s.reference("users").notNull(), reviewerId: s.reference("users"), title: s.text().notNull() },
}));
const relations = defineRelations(schema.tables, (r) => ({
  tasks: {
    author: r.one.users({ from: r.tasks.authorId, to: r.users._id, optional: false, alias: "author" }),
    reviewer: r.one.users({ from: r.tasks.reviewerId, to: r.users._id, alias: "reviewer" }),
  },
}));
const connection = await connectDatabase({ schema, relations, connectionString: "postgres://unused" });
const result = await connection.db.transaction((tx) =>
  tx.query.tasks.findFirst({
    with: { author: true, reviewer: true },
    where: { author: { name: "Angel" } },
  }),
);
if (result) {
  const author: string = result.author.name;
  const reviewer: string | undefined = result.reviewer?.name;
  // @ts-expect-error nullable relation cannot be treated as present
  const invalid: string = result.reviewer.name;
  void [author, reviewer, invalid];
}
// @ts-expect-error query filters expose declared columns
await connection.db.query.tasks.findMany({ where: { missing: "x" } });
