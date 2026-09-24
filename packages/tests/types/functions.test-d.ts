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

const bound = createFunctionBuilders(relations, schema);
const noArgs = bound.query({
  handler: ({ tables, validators, db }) => {
    validators.id("projects");
    // @ts-expect-error Context tables preserve schema names.
    void tables.missing;
    // @ts-expect-error ID helpers preserve table names.
    validators.id("missing");
    return db.select({ title: tables.tasks.title }).from(tables.tasks);
  },
});
type NoArgsResult = StandardSchemaV1.InferOutput<typeof noArgs.returns>;
const projected: NoArgsResult = [{ title: "typed" }];
// @ts-expect-error No-args declarations still infer exact result types.
const badProjection: NoArgsResult = [{ title: 123 }];
const withArgs = bound.mutation({
  args: ({ validators }) => ({ projectId: validators.id("projects"), title: v.string() }),
  handler: ({ tables }, args) => {
    // @ts-expect-error Input validation infers a string.
    args.title.toFixed();
    void tables.projects;
    return { projectId: args.projectId, title: args.title };
  },
});
type WithArgs = StandardSchemaV1.InferOutput<typeof withArgs.args>;
// @ts-expect-error Declared arguments remain required.
const missingTitle: WithArgs = { projectId: v.parse(schema.id("projects"), "b04fe8a3-2c1d-4d97-8f03-e96244cc9b70") };
void projected;
void badProjection;
void missingTitle;
// @ts-expect-error Omitted args reject undeclared inputs at the type boundary.
const extraInput: StandardSchemaV1.InferInput<typeof noArgs.args> = { extra: true };
const badCallbackResult: StandardSchemaV1.InferOutput<typeof withArgs.returns> = {
  // @ts-expect-error Callback return inference preserves the ID brand.
  projectId: "not-branded",
  // @ts-expect-error Callback return inference preserves the title type.
  title: 123,
};
const wholeSchema = bound.query({
  args: ({ validators }) => validators.tables.projects.insert,
  handler: (_context, args) => {
    // @ts-expect-error Whole-schema arguments preserve their derived field types.
    args.name.toFixed();
    return args.name;
  },
});
void extraInput;
void badCallbackResult;
void wholeSchema;
