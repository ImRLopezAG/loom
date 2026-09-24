import { action, query, defineSchema, createFunctionBuilders } from "@loom/core/server";
import * as v from "valibot";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { defineRelations } from "drizzle-orm";

action({
  args: v.null(),
  returns: v.string(),
  handler: (context) => {
    // @ts-expect-error Actions do not receive direct database access.
    void context.db;
    return context.requestId;
  },
});

query({
  args: v.object({ name: v.string() }),
  returns: v.string(),
  handler: (context, args) => {
    void context.db;
    // @ts-expect-error Registered arguments retain their validator output types.
    args.name.toFixed();
    return args.name;
  },
});

const schema = defineSchema((s) => ({
  projects: { name: s.text().notNull() },
  tasks: { projectId: s.reference("projects").notNull(), title: s.text().notNull() },
}));
const relations = defineRelations(schema.tables, (r) => ({
  tasks: { project: r.one.projects({ from: r.tasks.projectId, to: r.projects._id, optional: false }) },
}));
query({
  relations,
  args: v.null(),
  returns: v.array(v.object({ title: v.string(), project: v.object({ name: v.string() }) })),
  handler: async ({ db }) => {
    // @ts-expect-error Relational filters only accept declared fields.
    void db.query.tasks.findMany({ where: { missing: true } });
    return db.query.tasks.findMany({
      columns: { title: true },
      with: { project: { columns: { name: true } } },
      where: { project: { name: "Loom" } },
      orderBy: { title: "asc" },
    });
  },
});

const builders = createFunctionBuilders(relations);
const inferred = builders.query({
  args: v.object({ projectId: schema.id("projects") }),
  handler: ({ db }, args) =>
    db.query.tasks.findMany({
      columns: { title: true },
      where: { projectId: { eq: args.projectId } },
    }),
});
type Result = StandardSchemaV1.InferOutput<typeof inferred.returns>;
const result: Result = [{ title: "typed" }];
// @ts-expect-error Inferred return projections retain exact column types.
const invalidResult: Result = [{ title: 123 }];
// @ts-expect-error ID validators only accept declared table names.
schema.id("missing");
void result;
void invalidResult;
