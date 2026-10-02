import { describe, expect, it } from "vite-plus/test";
import { nestedQuery, nestedQueryText } from "../../../apps/loom/src/core/extensions/nested-query";
import { eq, sql, defineRelations } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { withNestedQueryInvocation } from "../../../apps/loom/src/core/extensions/nested-query-private";
import {
  createSqlFunction,
  extensionSqlDialect,
  checkCompiledExtensionQuery,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";
import { searchSchema, searchRelations } from "../fixtures/search-schema";

describe("managed nested queries", () => {
  it("requires an active registered server invocation even for a genuine descriptor", () => {
    const source = createSearchValidators(searchSchema, searchRelations).tasks.search({
      columns: ["title"],
      scope: "public",
    });
    expect(() => nestedQuery(source, { columns: { title: true } })).toThrow("invocation");
  });
  it("does not accept structural search metadata as source authority", () => {
    // @ts-expect-error Deliberately invalid validators exercise the provenance boundary.
    expect(() => nestedQuery({ input: {}, output: {} }, { columns: {} })).toThrow();
  });
  it("carries exact dependencies and rejects compiled ownership reuse even without a live checker", async () => {
    const source = createSearchValidators(searchSchema, searchRelations).tasks.search({
      columns: ["title", "count", "amount"],
      filter: ["title", "count", "amount"],
      scope: { name: "done", version: "1", where: ({ table }) => eq(table.done, false) },
    });
    const dialect = extensionSqlDialect(nodePgCodecs);
    let compiled: ReturnType<typeof dialect.sqlToQuery> | undefined;
    const failure: Error[] = [];
    const owner = {
      graph: searchRelations,
      identity: null,
      assertCurrent() {},
      fail: (cause: Error) => {
        failure.push(cause);
      },
    };
    await withNestedQueryInvocation(owner, async () => {
      const query = nestedQuery(source, {
        columns: { title: true, count: true, amount: true },
        where: {
          title: { eq: "O'Reilly\\$1; select secret" },
          count: { eq: 9007199254740993n },
          amount: { eq: "0.0000000001" },
        },
      });
      const dependencies: string[] = [];
      compiled = withExtensionSqlExecution(
        {
          check: (contract) => {
            dependencies.push(...contract.dependencies);
          },
        },
        () => dialect.sqlToQuery(nestedQueryText(query)),
      );
      expect(dependencies).toContain("tasks");
      const text = String(compiled.params[0]);
      expect(text).toContain("O''Reilly\\\\$1; select secret");
      expect(text).toContain('9007199254740993\'::"pg_catalog"."int8"');
      expect(text).toContain("0.0000000001");
      expect(text).not.toContain("limit");
      checkCompiledExtensionQuery(compiled);
    });
    expect(() => checkCompiledExtensionQuery(compiled!)).toThrow("invocation");
    expect(failure).toHaveLength(1);
  });
  it("rejects policy functions and hidden reads while preserving native operators", async () => {
    const validators = createSearchValidators(searchSchema, searchRelations);
    await withNestedQueryInvocation(
      { graph: searchRelations, identity: null, assertCurrent() {}, fail() {} },
      async () => {
        const source = validators.tasks.search({
          columns: ["title"],
          scope: {
            name: "hidden",
            version: "1",
            where: () => sql`exists (select 1 from ${searchSchema.tables.projects})`,
          },
        });
        expect(() => nestedQuery(source, { columns: { title: true } })).toThrow("unproven");
        const copied = { input: source.input, output: source.output };
        expect(() => nestedQuery(copied, { columns: { title: true } })).toThrow("registered");
      },
    );
  });
  it("retains inner dependencies and unobservable outer state through preparation", async () => {
    const source = createSearchValidators(searchSchema, searchRelations).tasks.search({
      columns: ["title"],
      scope: "public",
    });
    await withNestedQueryInvocation(
      { graph: searchRelations, identity: null, assertCurrent() {}, fail() {} },
      async () => {
        const dialect = extensionSqlDialect(nodePgCodecs);
        const inner = nestedQueryText(nestedQuery(source, { columns: { title: true } }));
        const remote = createSqlFunction({
          schema: "fixture",
          name: "remote",
          member: "fixture:remote",
          arguments: [textCodec] as const,
          result: textCodec,
          dependencies: [],
          observability: "external",
          authority: "query",
        });
        const prepared = dialect.sqlToQuery(sql`select ${remote(inner)}`);
        const dependencies = new Set<string>();
        expect(() =>
          withExtensionSqlExecution(
            {
              check: (contract) => {
                for (const table of contract.dependencies) dependencies.add(table);
                if (contract.observability !== "tables") throw new Error("Unobservable state");
              },
            },
            () => checkCompiledExtensionQuery(prepared),
          ),
        ).toThrow("Unobservable state");
        const local = dialect.sqlToQuery(sql`select ${inner}`);
        withExtensionSqlExecution(
          {
            check: (contract) => {
              for (const table of contract.dependencies) dependencies.add(table);
            },
          },
          () => checkCompiledExtensionQuery(local),
        );
        expect(dependencies).toEqual(new Set(["tasks"]));
      },
    );
  });
  it("rejects hidden child policy reads, hidden native relation filters, and arbitrary wrappers", async () => {
    const validators = createSearchValidators(searchSchema, searchRelations);
    await withNestedQueryInvocation(
      { graph: searchRelations, identity: null, assertCurrent() {}, fail() {} },
      async () => {
        const source = validators.tasks.search({
          columns: ["title"],
          scope: "public",
          through: { taskLabels: "public" },
          relations: {
            labels: {
              columns: ["name"],
              filter: ["name"],
              scope: {
                name: "hidden-child",
                version: "1",
                where: () => sql`exists (select 1 from ${searchSchema.tables.projects})`,
              },
            },
          },
        });
        expect(() =>
          nestedQuery(source, {
            columns: { title: true },
            where: { NOT: { relations: { labels: { some: { name: { eq: "x" } } } } } },
          }),
        ).toThrow("unproven");
        const wrapperSource = validators.tasks.search({
          columns: ["title"],
          scope: { name: "wrapper", version: "1", where: () => sql`${{ getSQL: () => sql`true` }}` },
        });
        expect(() => nestedQuery(wrapperSource, { columns: { title: true } })).toThrow("unproven");
      },
    );
    const graph = defineRelations(searchSchema.tables, (r) => ({
      tasks: {
        project: r.one.projects({ from: r.tasks.projectId, to: r.projects._id, where: { RAW: () => sql`true` } }),
      },
    }));
    const source = createSearchValidators(searchSchema, graph).tasks.search({
      columns: ["title"],
      scope: "public",
      relations: { project: { columns: ["name"], filter: ["name"], scope: "public" } },
    });
    await withNestedQueryInvocation({ graph, identity: null, assertCurrent() {}, fail() {} }, async () => {
      expect(() =>
        nestedQuery(source, {
          columns: { title: true },
          where: { relations: { project: { is: { name: { eq: "x" } } } } },
        }),
      ).toThrow("unproven raw SQL");
    });
  });
});
