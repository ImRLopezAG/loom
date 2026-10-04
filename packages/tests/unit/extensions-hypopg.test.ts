import { expect, vi } from "vite-plus/test";
import pg from "pg";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { hypopgUnitProofCases, hypopgMemberProofs, hypopgNativeProofCase } from "../../e2e/fixtures/hypopg-proof-cases";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { pgSchema } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { createHypopg_1_4_3 } from "../../../apps/loom/src/core/extensions/adapters/hypopg";
import { hypopgIndexCodec, hypopgOidCodec } from "../../../apps/loom/src/core/extensions/adapters/hypopg-codecs";
import { hypopgAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/hypopg";
import { withHypopg } from "../../../apps/loom/src/tooling/extensions/operations/hypopg";
import * as verification from "../../../apps/loom/src/tooling/extensions/verify";
import { hypopgDescriptor, hypopgDigest } from "../../e2e/fixtures/hypopg";
import source from "../../../apps/loom/src/tooling/extensions/manifests/hypopg.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionExpressionContract,
  extensionSqlDialect,
  checkCompiledExtensionQuery,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";

extensionProofUnitTest(hypopgUnitProofCases[0]!, async () => {
  expect(validateExtensionManifest(v.parse(extensionManifestValidator, source)).digest).toBe(hypopgDigest);
  expect(source.contract.members).toHaveLength(30);
  expect(hypopgAnnotations.map((member) => member.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(hypopgMemberProofs.map((member) => member.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(hypopgNativeProofCase.claims.map((claim) => claim.member).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  const api = createHypopg_1_4_3(hypopgDescriptor);
  expect(Object.keys(api.sql.functions).sort()).toEqual(
    ["hypopg", "hypopg_get_indexdef", "hypopg_hidden_indexes", "hypopg_relation_size"].sort(),
  );
  expect(api.createIndex).toEqual({
    member: "routine:$extension:hypopg.hypopg_create_index(pg_catalog.text)",
    authority: "session",
  });
  expect(() =>
    createHypopg_1_4_3({ ...hypopgDescriptor, apiSupport: { status: "verified", digest: "wrong" } }),
  ).toThrow(/exact verified contract/);
  await expect(
    withHypopg(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...hypopgDescriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});

extensionProofUnitTest(hypopgUnitProofCases[1]!, () => {
  const api = createHypopg_1_4_3(hypopgDescriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  for (const expression of [api.indexes(), api.hiddenIndexes(), api.getIndexdef(null), api.relationSize(42)])
    expect(extensionExpressionContract(expression)?.observability).toBe("session");
  const compiled = dialect.sqlToQuery(sql`select ${api.getIndexdef(42)}, ${api.relationSize(null)}`);
  expect(compiled.sql).toContain('"hypo ""session"""."hypopg_get_indexdef"');
  expect(compiled.params).toEqual(["42", null]);
  const checked: string[] = [];
  withExtensionSqlExecution({ check: (contract) => checked.push(contract.observability) }, () =>
    checkCompiledExtensionQuery(compiled),
  );
  expect(checked).toEqual(["session", "session"]);
  for (const rows of [api.indexRows("i"), api.hiddenIndexRows("h"), api.listView("l"), api.hiddenView("v")]) {
    const observed: string[] = [];
    const query = dialect.sqlToQuery(sql`select ${Object.values(rows.columns)[0]} from ${rows.from}`);
    withExtensionSqlExecution({ check: (contract) => observed.push(contract.observability) }, () =>
      checkCompiledExtensionQuery(query),
    );
    expect(observed).toContain("session");
  }
});

extensionProofUnitTest(hypopgUnitProofCases[2]!, () => {
  expect(hypopgOidCodec.decode("4294967295")).toBe(4294967295);
  expect(() => hypopgOidCodec.decode("4294967296")).toThrow();
  expect(
    hypopgIndexCodec.decode('("<12>btree_items_id",12,16384,2,f,"1 0","0 100","1978 3126",,"{EXPR :value 1}",,403)'),
  ).toEqual({
    indexname: "<12>btree_items_id",
    indexrelid: 12,
    indrelid: 16384,
    innatts: 2,
    indisunique: false,
    indkey: "1 0",
    indcollation: "0 100",
    indclass: "1978 3126",
    indoption: null,
    indexprs: "{EXPR :value 1}",
    indpred: null,
    amid: 403,
  });
  for (const [text, indisunique] of [
    ["f", false],
    ["false", false],
    ["t", true],
    ["true", true],
  ] as const) {
    const index = hypopgIndexCodec.decode(
      `("<12>btree_items_id",12,16384,2,${text},"1 0","0 100","1978 3126",,"{EXPR :value 1}",,403)`,
    );
    expect(index.indisunique).toBe(indisunique);
    expect(hypopgIndexCodec.decode(hypopgIndexCodec.encode(index))).toEqual(index);
  }
  const api = createHypopg_1_4_3(hypopgDescriptor);
  const value = {
    indexrelid: 42,
    index_name: 'hypo,"quoted"',
    schema_name: null,
    table_name: "<dropped>",
    am_name: "btree",
  };
  expect(api.listCodec.decode(api.listCodec.encode(value))).toEqual(value);
  const array = { dimensions: [{ lowerBound: -2, length: 2 }], values: [value, null] };
  expect(api.listArrayCodec.decode(api.listArrayCodec.encode(array))).toEqual(array);
  for (const [text, is_hypo] of [
    ["f", false],
    ["false", false],
    ["t", true],
    ["true", true],
    ["", null],
  ] as const) {
    const hidden = { ...value, is_hypo };
    expect(api.hiddenCodec.decode(`(42,"hypo,""quoted""",,"<dropped>",btree,${text})`)).toEqual(hidden);
    expect(api.hiddenCodec.decode(api.hiddenCodec.encode(hidden))).toEqual(hidden);
    const hiddenArray = { dimensions: [{ lowerBound: -2, length: 2 }], values: [hidden, null] };
    expect(api.hiddenArrayCodec.decode(api.hiddenArrayCodec.encode(hiddenArray))).toEqual(hiddenArray);
  }
  const hiddenMatrix = {
    dimensions: [
      { lowerBound: -1, length: 2 },
      { lowerBound: 3, length: 2 },
    ],
    values: [
      [{ ...value, is_hypo: false }, null],
      [
        { ...value, is_hypo: true },
        { ...value, is_hypo: null },
      ],
    ],
  };
  expect(api.hiddenArrayCodec.decode(api.hiddenArrayCodec.encode(hiddenMatrix))).toEqual(hiddenMatrix);
  const table = pgSchema("app").table("snapshots", {
    observed: api.listField().build("observed"),
    hidden: api.hiddenArrayField().build("hidden"),
  });
  expect(table.observed.getSQLType()).toBe('"hypo ""session"""."hypopg_list_indexes"');
  expect(table.hidden.getSQLType()).toBe('"hypo ""session"""."hypopg_hidden_indexes"[]');
});

extensionProofUnitTest(hypopgUnitProofCases[3]!, async () => {
  // Isolate the driver transport from catalogue admission; this is not native member acceptance.
  const connect = vi.spyOn(pg.Client.prototype, "connect").mockImplementation(async () => undefined);
  const end = vi.spyOn(pg.Client.prototype, "end").mockImplementation(async () => undefined);
  const verify = vi.spyOn(verification, "verifyExtensionApiContracts").mockResolvedValue(undefined);
  const replies: (string | null)[] = [];
  const statements: string[] = [];
  const query = vi.spyOn(pg.Client.prototype, "query").mockImplementation(async (statement, values) => {
    const text = v.parse(v.string(), statement);
    statements.push(text);
    if (text === "SHOW server_version_num") return { rows: [{ server_version_num: "180000" }] };
    if (text.includes("FROM pg_catalog.pg_stat_activity"))
      return {
        rows: [{ pid: 1, started: "fixture", database: "fixture", application: "loom-migrations", role: "operator" }],
      };
    if (text.startsWith("SELECT pg_try_advisory_lock")) return { rows: [{ acquired: true }] };
    if (/"hypopg_(drop|hide|unhide)_index"\(/.test(text)) {
      expect(text).toMatch(/\(\$1::pg_catalog\.oid\)::pg_catalog\.text AS value$/);
      expect(values).toEqual(["42"]);
      expect(replies.length).toBeGreaterThan(0);
      return { rows: [{ value: replies.shift() }] };
    }
    if (text.includes("AS indexes")) return { rows: [{ indexes: 0, hidden: 0 }] };
    return { command: text, rows: [] };
  });
  try {
    const failures: { operation: string; cause: unknown }[] = [];
    for (const operation of ["dropIndex", "hideIndex", "unhideIndex"] as const) {
      replies.splice(0, replies.length, "true", "false", null, "t", "f");
      try {
        const result = await withHypopg(
          "postgresql://operator@127.0.0.1:1/fixture",
          hypopgDescriptor,
          async (session) => {
            const results = [];
            for (let index = 0; index < 5; index++) results.push(await session[operation](42));
            return results;
          },
        );
        expect(result.value).toEqual([true, false, null, true, false]);
        expect(result.completion).toBe("committed");
        expect(result.effects).toEqual(
          Array.from({ length: 5 }, () => ({
            operation,
            state: "acknowledged",
            scope: "backend",
            rollback: "not-transactional",
          })),
        );
        expect(replies).toEqual([]);
      } catch (cause) {
        failures.push({ operation, cause });
      }
    }
    expect(failures).toEqual([]);
    expect(statements.filter((text) => text === "COMMIT")).toHaveLength(3);
  } finally {
    query.mockRestore();
    verify.mockRestore();
    end.mockRestore();
    connect.mockRestore();
  }
});
