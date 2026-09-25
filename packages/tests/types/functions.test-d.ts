import { createProjectProcedures, createDatabaseMiddleware, defineSchema } from "@loom/core/server";
import { defineRelations } from "drizzle-orm";
import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import * as v from "valibot";

const schema = defineSchema((s) => ({
  projects: { name: s.text().notNull() },
  tasks: { projectId: s.reference("projects").notNull(), title: s.text().notNull() },
}));
const relations = defineRelations(schema.tables, (r) => ({
  tasks: { project: r.one.projects({ from: r.tasks.projectId, to: r.projects._id, optional: false }) },
}));
const { procedure, validators } = createProjectProcedures(schema);
const read = createDatabaseMiddleware(relations, "read", schema);
const list = procedure.use(read).handler(({ context: { db, tables, validators } }) => {
  // @ts-expect-error Context tables preserve schema names.
  void tables.missing;
  // @ts-expect-error ID helpers preserve table names.
  validators.id("missing");
  // @ts-expect-error Relational filters only accept declared fields.
  void db.query.tasks.findMany({ where: { missing: true } });
  return db.query.tasks.findMany({
    columns: { title: true },
    with: { project: { columns: { name: true } } },
    where: { project: { name: "Loom" } },
    orderBy: { title: "asc" },
  });
});
const result: InferRouterOutputs<typeof list> = [{ title: "typed", project: { name: "Loom" } }];
// @ts-expect-error Native inferred relational projections retain exact column types.
const invalidResult: InferRouterOutputs<typeof list> = [{ title: 123, project: { name: "Loom" } }];
const withArgs = procedure
  .input(v.object({ projectId: validators.id("projects"), title: v.string() }))
  .handler(({ input }) => {
    // @ts-expect-error Input validation infers a string.
    input.title.toFixed();
    return input;
  });
// @ts-expect-error Declared arguments remain required.
const missingTitle: InferRouterInputs<typeof withArgs> = { projectId: "b04fe8a3-2c1d-4d97-8f03-e96244cc9b70" };
const badResult: InferRouterOutputs<typeof withArgs> = {
  // @ts-expect-error Return inference preserves the ID brand.
  projectId: "not-branded",
  title: "typed",
};
const wholeSchema = procedure.input(validators.tables.projects.insert).handler(({ input }) => {
  // @ts-expect-error Whole-schema arguments preserve their derived field types.
  input.name.toFixed();
  return input.name;
});
void [result, invalidResult, missingTitle, badResult, wholeSchema];
