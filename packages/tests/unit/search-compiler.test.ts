import { describe, expect, it } from "vite-plus/test";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { createProjectContext } from "kello/server";
import { oc } from "kello/contract";
import { searchSchema, searchRelations, nestedSelection } from "../fixtures/search-schema";
import { searchContractDescriptor } from "../../../apps/loom/src/core/search/metadata";
import { compileSearch } from "../../../apps/loom/src/core/search/compiler";

const { validators } = createProjectContext(searchSchema, searchRelations);
const search = validators.tables.tasks.search({
  scope: { name: "task", version: "1", where: ({ table }) => eq(table.done, false) },
  columns: ["title", "done", "at", "count", "amount", "_id"],
  filter: ["title", "done", "projectId", "at", "count", "amount"],
  text: ["title"],
  order: ["title"],
  through: { taskLabels: { name: "junction", version: "1", where: ({ table }) => sql`${table._createdAt} > ${0}` } },
  relations: {
    labels: {
      scope: { name: "label", version: "1", where: ({ table }) => eq(table.name, "allowed") },
      columns: ["name"],
      filter: ["name"],
      text: ["name"],
    },
    project: {
      scope: "public",
      columns: ["name"],
      filter: ["name"],
      relations: {
        organization: {
          scope: "public",
          columns: ["name"],
          relations: {
            teams: {
              scope: "public",
              columns: ["name"],
              relations: {
                members: { scope: "public", columns: ["name"] },
              },
            },
          },
        },
      },
    },
  },
});
const descriptor = searchContractDescriptor(oc.input(search.input).output(search.output));
if (!descriptor) throw new Error("Missing search descriptor");
const db = drizzle.mock({ relations: searchRelations });

describe("authorized native search compilation", () => {
  it("parameterizes values and uses existential M2M membership without duplicating roots", () => {
    const compiled = compileSearch(
      descriptor,
      {
        columns: { title: true },
        where: {
          title: { contains: "%' OR 1=1 --_\\", insensitive: true },
          relations: { labels: { some: { name: { eq: "allowed" } }, none: { name: { eq: "forbidden" } } } },
        },
      },
      null,
    );
    const query = db.query.tasks.findMany(compiled.config).toSQL();
    expect(query.sql).toContain("exists (select 1");
    expect(query.sql).toContain("not (exists");
    expect(query.sql).not.toContain("OR 1=1");
    expect(query.params).toContain("%\\%' OR 1=1 --\\_\\\\%");
    expect(query.params.filter((value) => value === "allowed").length).toBeGreaterThanOrEqual(2);
    expect(query.sql).toContain('"task_labels"');
    expect(query.sql).not.toContain("distinct");
    expect(compiled.dependencies).toEqual(new Set(["tasks", "labels", "taskLabels"]));
  });
  it("keeps nested filters out of root membership and applies the native junction scope", () => {
    const compiled = compileSearch(
      descriptor,
      {
        columns: { title: true },
        with: { labels: { columns: { name: true }, where: { name: { eq: "other" } }, limit: 2 } },
      },
      null,
    );
    const query = db.query.tasks.findMany(compiled.config).toSQL();
    expect(query.sql).toContain('"tr0"."_createdAt"');
    expect(query.sql).toContain("left join lateral");
    expect(query.params).toContain("other");
    expect(query.params).toContain("allowed");
    expect(query.sql.slice(query.sql.lastIndexOf("where"))).not.toContain("other");
    expect(query.sql).not.toContain("exists (select 1");
  });
  it("compiles all boolean/scalar operators and four relation edges in one native statement", () => {
    const compiled = compileSearch(
      descriptor,
      {
        ...nestedSelection,
        columns: { at: true, count: true, amount: true },
        where: {
          AND: [
            { title: { eq: "A", ne: "B", in: ["A", "C"], notIn: ["B"], startsWith: "A", endsWith: "C" } },
            { done: { eq: false } },
          ],
          OR: [{ amount: { gt: "1.0000000001", gte: "1", lt: "10", lte: "9" } }, { projectId: { isNull: false } }],
          NOT: { count: { eq: 9007199254740993n } },
          at: { gte: new Date("2026-01-01") },
        },
      },
      null,
    );
    const query = db.query.tasks.findMany(compiled.config).toSQL();
    expect(query.sql.match(/left join lateral/g)).toHaveLength(5);
    expect(query.params).toContain(9007199254740993n);
    expect(query.params).toContain("1.0000000001");
    expect(query.sql).not.toContain('"projectId" as');
    expect(compiled.dependencies).toEqual(new Set(Object.keys(searchRelations)));
  });
  it("rejects invalid fields before invoking policies or constructing SQL", () => {
    expect(() => compileSearch(descriptor, { where: { hidden: { eq: "x" } } }, null)).toThrow(/selection/i);
  });
});
