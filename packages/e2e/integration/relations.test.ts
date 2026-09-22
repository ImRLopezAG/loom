import { expect, test } from "bun:test";
import { connectDatabase, defineSchema, defineTable, runFunctionTransaction } from "@loom/core/server";
import { defineRelations } from "drizzle-orm";
import { pgSchema } from "drizzle-orm/pg-core";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api-postgres";
import pg from "pg";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "native RQB v2 covers self, multiple-target and junction relations inside transactions",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const namespace = `loom_rel_${crypto.randomUUID().replaceAll("-", "")}`;
    const schema = defineSchema(
      (s) => ({
        users: { name: s.text().notNull(), managerId: s.reference("users") },
        projects: { name: s.text().notNull() },
        tasks: {
          title: s.text().notNull(),
          projectId: s.reference("projects").notNull(),
          authorId: s.reference("users").notNull(),
          reviewerId: s.reference("users"),
        },
        memberships: defineTable(
          { userId: s.reference("users").notNull(), projectId: s.reference("projects").notNull() },
          { indexes: [{ fields: ["userId", "projectId"], unique: true }] },
        ),
      }),
      { namespace },
    );
    const relations = defineRelations(schema.tables, (r) => ({
      users: {
        manager: r.one.users({ from: r.users.managerId, to: r.users._id }),
        projects: r.many.projects({
          from: r.users._id.through(r.memberships.userId),
          to: r.projects._id.through(r.memberships.projectId),
        }),
      },
      tasks: {
        project: r.one.projects({ from: r.tasks.projectId, to: r.projects._id, optional: false }),
        author: r.one.users({ from: r.tasks.authorId, to: r.users._id, optional: false, alias: "author" }),
        reviewer: r.one.users({ from: r.tasks.reviewerId, to: r.users._id, alias: "reviewer" }),
      },
    }));
    const setup = new pg.Pool({ connectionString });
    try {
      const empty = await generateDrizzleJson({}, undefined, [namespace]);
      const snapshot = await generateDrizzleJson({ namespace: pgSchema(namespace), ...schema.tables }, empty.id, [
        namespace,
      ]);
      for (const statement of await generateMigration(empty, snapshot)) await setup.query(statement);
      const connection = await connectDatabase({ schema, relations, connectionString, maxConnections: 2 });
      try {
        const { db } = connection;
        const [manager] = await db.insert(schema.tables.users).values({ name: "Manager" }).returning();
        if (!manager) throw new Error("Missing manager");
        const [author] = await db
          .insert(schema.tables.users)
          .values({ name: "Author", managerId: manager._id })
          .returning();
        const [project] = await db.insert(schema.tables.projects).values({ name: "Loom" }).returning();
        if (!author || !project) throw new Error("Missing fixture rows");
        await db.insert(schema.tables.memberships).values({ userId: author._id, projectId: project._id });
        await db.insert(schema.tables.tasks).values([
          { title: "B", projectId: project._id, authorId: author._id, reviewerId: manager._id },
          { title: "A", projectId: project._id, authorId: author._id },
        ]);
        const rows = await runFunctionTransaction(connection, "query", (tx) =>
          tx.query.tasks.findMany({
            where: { project: { name: "Loom" } },
            orderBy: { title: "asc" },
            columns: { title: true },
            with: {
              project: { columns: { name: true } },
              author: { with: { manager: true, projects: true } },
              reviewer: true,
            },
          }),
        );
        expect(rows.map((row) => row.title)).toEqual(["A", "B"]);
        expect(rows[0]?.project.name).toBe("Loom");
        expect(rows[0]?.reviewer).toBeNull();
        expect(rows[1]?.reviewer?.name).toBe("Manager");
        expect(rows[0]?.author.manager?.name).toBe("Manager");
        expect(rows[0]?.author.projects[0]?.name).toBe("Loom");
        expect(Object.keys(rows[0] ?? {}).sort()).toEqual(["author", "project", "reviewer", "title"]);
      } finally {
        await connection.close();
      }
    } finally {
      await setup.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await setup.end();
    }
  },
);
