import { expect, test } from "bun:test";
import { connectDatabase, createFunctionBuilders, defineSchema } from "@loom/core/server";
import { defineRelations } from "drizzle-orm";
import * as v from "valibot";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "bound builders support direct and callback declarations with shared schema context",
  async () => {
    if (!connectionString) throw new Error("Missing integration database");
    const schema = defineSchema((s) => ({ projects: { name: s.text() } }));
    const relations = defineRelations(schema.tables);
    const builders = createFunctionBuilders(relations, schema);
    const connection = await connectDatabase({ schema, relations, connectionString });
    let definitions = 0;
    let calls = 0;
    const direct = builders.query({
      handler: ({ tables, validators }) => {
        calls++;
        expect(tables).toBe(schema.tables);
        expect(validators.tables).toBe(schema.validators);
        expect(validators.id).toBe(schema.id);
        return { count: 12n };
      },
    });
    const callback = builders.mutation({
      args: ({ validators }) => {
        definitions++;
        return { id: validators.id("projects"), name: v.pipe(v.string(), v.trim()) };
      },
      returns: v.string(),
      handler: ({ tables }, args) => {
        expect(tables.projects).toBe(schema.tables.projects);
        return args.name;
      },
    });
    try {
      expect(direct.prepare({ extra: true })).rejects.toThrow("Invalid function arguments");
      expect(callback.prepare({ id: "invalid", name: "name" })).rejects.toThrow("Invalid function arguments");
      expect(calls).toBe(0);
      await connection.transaction(async (db) => {
        const context = Object.freeze({
          db,
          identity: null,
          requestId: "context-test",
          signal: new AbortController().signal,
          scheduler: {
            runAt: async () => {
              throw new Error("unused");
            },
            runAfter: async () => {
              throw new Error("unused");
            },
          },
        });
        expect(await (await direct.prepare({}))(context)).toEqual({ count: "12" });
        expect(await (await direct.prepare({}))(context)).toEqual({ count: "12" });
        expect(
          await (
            await callback.prepare({ id: "b04fe8a3-2c1d-4d97-8f03-e96244cc9b70", name: " Loom " })
          )(context),
        ).toBe("Loom");
        expect(Object.hasOwn(context, "tables")).toBe(false);
      });
      expect(definitions).toBe(1);
      expect(calls).toBe(2);
    } finally {
      await connection.close();
    }
  },
);
