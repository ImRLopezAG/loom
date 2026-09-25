import { createProjectProcedures, createProjectServices, defineSchema, Invocation } from "@loom/core/server";
import { defineRelations } from "drizzle-orm";
import type { ProcedureContext } from "@loom/core/server";
import { createRouterClient } from "@orpc/server";
import * as v from "valibot";

const schema = defineSchema((s) => ({ tasks: { title: s.text().notNull() } }));
const { procedure } = createProjectProcedures(schema);
const emptySchema = defineSchema(() => ({}));
const emptyRelations = defineRelations(emptySchema.tables);
const { Database } = createProjectServices<typeof emptySchema, typeof emptyRelations>();
// @ts-expect-error Empty tables and validators must not grant database service authority.
createProjectProcedures(emptySchema).procedure.effect(function* () {
  return yield* Database;
});
const finite = procedure.handler(({ context }) => {
  // @ts-expect-error Unknown tables cannot be accessed.
  void context.tables.unknown;
  // @ts-expect-error A bare procedure has no database capability.
  void context.db;
  context.validators.id("tasks");
  // @ts-expect-error Table-branded validators reject unknown tables.
  context.validators.id("missing");
  return { title: context.tables.tasks.title.name };
});
const transformed = procedure
  .input(v.pipe(v.string(), v.transform(Number)))
  .output(
    v.pipe(
      v.number(),
      v.transform((value) => ({ value })),
    ),
  )
  .handler(({ input }) => input + 1);
const effect = procedure.effect(function* () {
  const invocation = yield* Invocation;
  return { requestId: invocation.requestId };
});

export function verifyNativeContracts(context: ProcedureContext) {
  const client = createRouterClient({ finite, transformed, effect }, { context });
  const result: Promise<{ title: string }> = client.finite();
  const computed: Promise<{ value: number }> = client.transformed("41");
  const request: Promise<{ requestId: string }> = client.effect();
  // @ts-expect-error Transforms accept their wire input, not their handler output.
  void client.transformed(41);
  // @ts-expect-error The handler output is not the output schema's input type.
  const wrong: Promise<number> = client.transformed("41");
  // @ts-expect-error Server invocation context cannot be omitted.
  createRouterClient({ finite }, { context: {} });
  void wrong;
  return { result, computed, request };
}
