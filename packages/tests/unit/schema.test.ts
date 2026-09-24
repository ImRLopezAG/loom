import { describe, expect, test } from "vite-plus/test";
import { defineSchema, defineTable, fields } from "@loom/core/server";
import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import * as v from "valibot";

describe("schema compilation", () => {
  test("validates table IDs without claiming row existence", () => {
    const schema = defineSchema(() => ({ projects: {} }));
    const id = "b04fe8a3-2c1d-4d97-8f03-e96244cc9b70";
    expect(v.parse(schema.id("projects"), id)).toBe(id);
    expect(v.safeParse(schema.id("projects"), "not-an-id").success).toBe(false);
    expect(v.safeParse(schema.id("projects"), 42).success).toBe(false);
    // @ts-expect-error Unknown tables are rejected statically and at runtime.
    expect(() => schema.id("missing")).toThrow("Unknown ID table");
  });

  test("compiles native tables with system fields, forward and circular references", () => {
    const schema = defineSchema((s) => ({
      tasks: { title: s.text().notNull(), projectId: s.reference("projects").notNull() },
      projects: { name: s.text().notNull(), featuredTask: s.reference("tasks", { onDelete: "set null" }) },
    }));
    expect(getTableName(schema.tables.tasks)).toBe("tasks");
    const columns = getTableColumns(schema.tables.tasks);
    expect(columns.projectId.name).toBe("project_id");
    expect(columns._createdAt.name).toBe("_createdAt");
    expect(columns._id.primary).toBe(true);
    expect(getTableConfig(schema.tables.tasks).foreignKeys[0]?.reference().foreignTable).toBe(schema.tables.projects);
    expect(getTableConfig(schema.tables.projects).foreignKeys[0]?.onDelete).toBe("set null");
    expect(Object.isFrozen(schema.metadata)).toBe(true);
    expect(Object.isFrozen(schema.metadata.entities[0]?.fields)).toBe(true);
  });

  test("fingerprints are stable across declaration order and reusable modules", () => {
    const project = defineTable({ name: fields.text().notNull(), rank: fields.integer().default(0) });
    const first = defineSchema(() => ({ projects: project, tasks: { title: fields.text() } }));
    const second = defineSchema((s) => ({
      tasks: { title: s.text() },
      projects: { rank: s.integer().default(0), name: s.text().notNull() },
    }));
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(defineSchema((s) => ({ tasks: { title: s.text().notNull() }, projects: project })).fingerprint).not.toBe(
      first.fingerprint,
    );
  });

  test("rejects reserved fields, unknown references, collisions and invalid delete policy", () => {
    expect(() => defineSchema((s) => ({ tasks: { _id: s.uuid() } }))).toThrow("tasks._id");
    expect(() => defineSchema((s) => ({ tasks: { projectId: s.reference("missing") } }))).toThrow("tasks.projectId");
    expect(() => defineSchema((s) => ({ tasks: { firstName: s.text(), first_name: s.text() } }))).toThrow("collision");
    expect(() => defineSchema(() => ({ taskItems: {}, task_items: {} }))).toThrow("collision");
    expect(() =>
      defineSchema((s) => ({ tasks: { parent: s.reference("tasks", { onDelete: "set null" }).notNull() } })),
    ).toThrow("set null");
  });

  test("supports storage vocabulary, composite indexes and uniqueness", () => {
    const schema = defineSchema((s) => ({
      items: defineTable(
        {
          title: s.text().unique(),
          enabled: s.boolean(),
          count: s.integer(),
          total: s.bigint(),
          price: s.numeric({ precision: 12, scale: 2 }),
          id: s.uuid(),
          when: s.timestamp(),
          details: s.json(),
          state: s.enum(["open", "closed"]),
        },
        { indexes: [{ fields: ["state", "when"], unique: false }] },
      ),
    }));
    const config = getTableConfig(schema.tables.items);
    expect(config.indexes).toHaveLength(1);
    expect(config.columns.find((column) => column.name === "title")?.isUnique).toBe(true);
    expect(config.checks).toHaveLength(1);
    expect(config.columns.find((column) => column.name === "price")?.getSQLType()).toBe("numeric(12, 2)");
  });

  test("declarations snapshot mutable author inputs and reject unsupported fields", () => {
    const choices: [string, ...string[]] = ["open", "closed"];
    const timestamp = new Date("2026-01-01T00:00:00.000Z");
    const declaration = { state: fields.enum(choices), created: fields.timestamp().default(timestamp) };
    choices[0] = "changed";
    timestamp.setUTCFullYear(2030);
    const schema = defineSchema(() => ({ items: declaration }));
    expect(schema.metadata.entities[0]?.fields.find((field) => field.name === "state")?.enumValues).toEqual([
      "open",
      "closed",
    ]);
    expect(schema.metadata.entities[0]?.fields.find((field) => field.name === "created")?.defaultValue).toBe(
      "2026-01-01T00:00:00.000Z",
    );
    Object.defineProperty(declaration, "state", { value: { metadata: { kind: "unsupported" } } });
    expect(() => defineSchema(() => ({ items: declaration }))).toThrow("Unsupported field declaration: items.state");
  });
});
