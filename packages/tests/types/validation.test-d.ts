import type { StandardSchemaV1 } from "@standard-schema/spec";
import { defineSchema, defineTable } from "@loom/core/server";
import { z } from "zod";

const schema = defineSchema((s) => ({
  items: defineTable(
    {
      count: s.integer().notNull().validate(z.string().transform(Number)),
      title: s.text().notNull(),
      role: s.text().notNull(),
    },
    { serverFields: ["role"], commandFields: ["title"], publicFields: ["_id", "title"] },
  ),
}));
type Insert = StandardSchemaV1.InferInput<typeof schema.validators.items.insert>;
type Output = StandardSchemaV1.InferOutput<typeof schema.validators.items.insert>;
type Public = StandardSchemaV1.InferOutput<typeof schema.validators.items.public>;
type Command = StandardSchemaV1.InferInput<typeof schema.validators.items.command>;
const insert: Insert = { count: "12", title: "Build" };
const output: Output = { count: 12, title: "Build" };
const command: Command = { title: "Build" };
// @ts-expect-error input retains validator input type
const wrong: Insert = { count: 12, title: "Build" };
// @ts-expect-error output contains normalized storage values
const wrongOutput: Output = { count: "12", title: "Build" };
// @ts-expect-error server owned fields are excluded
const server: Insert = { count: "12", title: "Build", role: "admin" };
// @ts-expect-error commands are allowlisted
const extraCommand: Command = { title: "Build", count: "12" };
declare const visible: Public;
// @ts-expect-error an unlisted field is not public
void visible.count;
void [insert, output, command, wrong, wrongOutput, server, extraCommand];
