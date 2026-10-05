import pg from "pg";
import assert from "node:assert/strict";
import { sql, defineRelations, type SQL } from "drizzle-orm";
import { createPrefix_1_2_0, prefixRange, type PrefixRange } from "../../../apps/loom/src/core/extensions/adapters/prefix";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "./extension-database";
import { observeExtensionProofDatabase } from "./extension-proof-database";
import { prefixProofSchema } from "./prefix-proof-cases";

export const prefixSchema = prefixProofSchema;
export const prefixNamespace = pg.escapeIdentifier(prefixSchema);
export const prefixType = `${prefixNamespace}.prefix_range`;
export const prefixApi = createPrefix_1_2_0({
  name: "prefix",
  version: "1.2.0",
  schema: prefixSchema,
  apiSupport: {
    status: "verified",
    digest: "954698fcbe5ada03bdf4bcbd9b22014e77570456f0d8471d4ca2bd99d75581a7",
  },
});
export const prefixManaged = defineSchema(
  () => ({
    entries: defineTable(
      {
        value: prefixApi.field(),
        tags: prefixApi.arrayField(),
        fallback: prefixApi.field().notNull().default(prefixRange("7")),
      },
      {
        indexes: [
          { fields: ["value"], extension: prefixApi.indexes.btree() },
          { fields: ["value"], extension: prefixApi.indexes.gist() },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
const relations = defineRelations(prefixManaged.tables);

export async function withPrefixApi(
  work: (fixture: {
    client: pg.Client;
    connection: DatabaseConnection<typeof relations>;
    api: typeof prefixApi;
  }) => Promise<void>,
  proofCaseId?: string,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const server = await client.query("select current_setting('server_version_num')::int version");
      assert.equal(Math.floor(server.rows[0].version / 10000), 18);
      await client.query(
        `create schema ${prefixNamespace}; create extension prefix with schema ${prefixNamespace} version '1.2.0'`,
      );
      if (proofCaseId) await observeExtensionProofDatabase(url, proofCaseId, "prefix");
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(prefixManaged)))
        await client.query(statement);
      await client.query(
        `create table portable_prefix_inputs(lhs ${prefixType}, rhs ${prefixType}); insert into portable_prefix_inputs values ('123[4-6]'::${prefixType},'1234'::${prefixType})`,
      );
      const connection = await connectDatabase({ schema: prefixManaged, relations, connectionString: url });
      try {
        await work({ client, connection, api: prefixApi });
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
}

export interface PrefixCase {
  readonly member: string;
  readonly kind: "prefix_range" | "bool" | "int4" | "float4" | "text" | "bytea";
  readonly expression: SQL;
  readonly native: string;
}

export function prefixCases(api = prefixApi): readonly PrefixCase[] {
  const lhs = sql<PrefixRange>`lhs`,
    rhs = sql<PrefixRange>`rhs`,
    leftText = sql<string>`lhs::pg_catalog.text`,
    prefix = sql<string>`'123'`,
    first = sql<string>`'4'`,
    last = sql<string>`'6'`;
  return [
    {
      member: "cast:$extension:prefix.prefix_range->pg_catalog.text",
      kind: "text",
      expression: api.sql.overloads["cast:$extension:prefix.prefix_range->pg_catalog.text"](lhs),
      native: `((lhs)::${prefixType})::pg_catalog.text`,
    },
    {
      member: "cast:pg_catalog.text->$extension:prefix.prefix_range",
      kind: "prefix_range",
      expression: api.sql.overloads["cast:pg_catalog.text->$extension:prefix.prefix_range"](leftText),
      native: `((lhs)::pg_catalog.text)::${prefixType}`,
    },
    {
      member: "operator:$extension:prefix.@>($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads["operator:$extension:prefix.@>($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.@>) rhs)`,
    },
    {
      member: "operator:$extension:prefix.&($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "prefix_range",
      expression:
        api.sql.overloads["operator:$extension:prefix.&($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.&) rhs)`,
    },
    {
      member: "operator:$extension:prefix.&&($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads["operator:$extension:prefix.&&($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.&&) rhs)`,
    },
    {
      member: "operator:$extension:prefix.<($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads["operator:$extension:prefix.<($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.<) rhs)`,
    },
    {
      member: "operator:$extension:prefix.<@($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads["operator:$extension:prefix.<@($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.<@) rhs)`,
    },
    {
      member: "operator:$extension:prefix.<=($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads["operator:$extension:prefix.<=($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.<=) rhs)`,
    },
    {
      member: "operator:$extension:prefix.<>($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads["operator:$extension:prefix.<>($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.<>) rhs)`,
    },
    {
      member: "operator:$extension:prefix.=($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads["operator:$extension:prefix.=($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.=) rhs)`,
    },
    {
      member: "operator:$extension:prefix.>($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads["operator:$extension:prefix.>($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.>) rhs)`,
    },
    {
      member: "operator:$extension:prefix.>=($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads["operator:$extension:prefix.>=($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.>=) rhs)`,
    },
    {
      member: "operator:$extension:prefix.|($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "prefix_range",
      expression:
        api.sql.overloads["operator:$extension:prefix.|($extension:prefix.prefix_range,$extension:prefix.prefix_range)"](
          lhs,
          rhs,
        ),
      native: `(lhs operator(${prefixNamespace}.|) rhs)`,
    },
    {
      member: "routine:$extension:prefix.length($extension:prefix.prefix_range)",
      kind: "int4",
      expression: api.sql.overloads["routine:$extension:prefix.length($extension:prefix.prefix_range)"](lhs),
      native: `${prefixNamespace}.length(lhs)`,
    },
    {
      member: "routine:$extension:prefix.pr_penalty($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "float4",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.pr_penalty($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.pr_penalty(lhs, rhs)`,
    },
    {
      member: "routine:$extension:prefix.prefix_range_cmp($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "int4",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_cmp($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_cmp(lhs, rhs)`,
    },
    {
      member:
        "routine:$extension:prefix.prefix_range_contained_by_strict($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_contained_by_strict($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_contained_by_strict(lhs, rhs)`,
    },
    {
      member:
        "routine:$extension:prefix.prefix_range_contained_by($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_contained_by($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_contained_by(lhs, rhs)`,
    },
    {
      member:
        "routine:$extension:prefix.prefix_range_contains_strict($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_contains_strict($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_contains_strict(lhs, rhs)`,
    },
    {
      member:
        "routine:$extension:prefix.prefix_range_contains($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_contains($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_contains(lhs, rhs)`,
    },
    {
      member: "routine:$extension:prefix.prefix_range_eq($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_eq($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_eq(lhs, rhs)`,
    },
    {
      member: "routine:$extension:prefix.prefix_range_ge($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_ge($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_ge(lhs, rhs)`,
    },
    {
      member: "routine:$extension:prefix.prefix_range_gt($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_gt($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_gt(lhs, rhs)`,
    },
    {
      member:
        "routine:$extension:prefix.prefix_range_inter($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "prefix_range",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_inter($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_inter(lhs, rhs)`,
    },
    {
      member: "routine:$extension:prefix.prefix_range_le($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_le($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_le(lhs, rhs)`,
    },
    {
      member: "routine:$extension:prefix.prefix_range_lt($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_lt($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_lt(lhs, rhs)`,
    },
    {
      member: "routine:$extension:prefix.prefix_range_neq($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_neq($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_neq(lhs, rhs)`,
    },
    {
      member:
        "routine:$extension:prefix.prefix_range_overlaps($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "bool",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_overlaps($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_overlaps(lhs, rhs)`,
    },
    {
      member: "routine:$extension:prefix.prefix_range_send($extension:prefix.prefix_range)",
      kind: "bytea",
      expression: api.sql.overloads["routine:$extension:prefix.prefix_range_send($extension:prefix.prefix_range)"](lhs),
      native: `${prefixNamespace}.prefix_range_send(lhs)`,
    },
    {
      member:
        "routine:$extension:prefix.prefix_range_union($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
      kind: "prefix_range",
      expression:
        api.sql.overloads[
          "routine:$extension:prefix.prefix_range_union($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
        ](lhs, rhs),
      native: `${prefixNamespace}.prefix_range_union(lhs, rhs)`,
    },
    {
      member: "routine:$extension:prefix.prefix_range(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      kind: "prefix_range",
      expression:
        api.sql.overloads["routine:$extension:prefix.prefix_range(pg_catalog.text,pg_catalog.text,pg_catalog.text)"](
          prefix,
          first,
          last,
        ),
      native: `${prefixNamespace}.prefix_range('123','4','6')`,
    },
    {
      member: "routine:$extension:prefix.prefix_range(pg_catalog.text)",
      kind: "prefix_range",
      expression: api.sql.overloads["routine:$extension:prefix.prefix_range(pg_catalog.text)"](prefix),
      native: `${prefixNamespace}.prefix_range('123')`,
    },
    {
      member: "routine:$extension:prefix.text($extension:prefix.prefix_range)",
      kind: "text",
      expression: api.sql.overloads["routine:$extension:prefix.text($extension:prefix.prefix_range)"](lhs),
      native: `${prefixNamespace}.text(lhs)`,
    },
  ];
}
