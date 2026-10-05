import pg from "pg";
import assert from "node:assert/strict";
import { sql, defineRelations, type SQL } from "drizzle-orm";
import { createSeg_1_4, type SegValue } from "../../../apps/loom/src/core/extensions/adapters/seg";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "./extension-database";
import { observeExtensionProofDatabase } from "./extension-proof-database";
import { segProofSchema } from "./seg-proof-cases";
export const segSchema = segProofSchema;
export const segNamespace = pg.escapeIdentifier(segSchema);
export const segType = `${segNamespace}.seg`;
export const segApi = createSeg_1_4({
  name: "seg",
  version: "1.4",
  schema: segSchema,
  apiSupport: { status: "verified", digest: "bba7c8f626ee6352397bd765ae103231780c7aa366ff9819bcf948ed22bd5fff" },
});
export const segManaged = defineSchema(
  () => ({
    entries: defineTable(
      {
        value: segApi.field(),
        tags: segApi.arrayField(),
        fallback: segApi
          .field()
          .notNull()
          .default(segApi.point(segApi.boundary("7.00"))),
      },
      {
        indexes: [
          { fields: ["value"], extension: segApi.indexes.btree() },
          { fields: ["value"], extension: segApi.indexes.gist() },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
const relations = defineRelations(segManaged.tables);
export async function withSegApi(
  work: (fixture: {
    client: pg.Client;
    connection: DatabaseConnection<typeof relations>;
    api: typeof segApi;
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
        `create schema ${segNamespace}; create extension seg with schema ${segNamespace} version '1.4'`,
      );
      if (proofCaseId) await observeExtensionProofDatabase(url, proofCaseId, "seg");
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(segManaged)))
        await client.query(statement);
      await client.query(
        `create table portable_seg_inputs(lhs ${segType}, rhs ${segType}); insert into portable_seg_inputs values ('~1.00 .. >3.00'::${segType},'<2.00 .. 4.00'::${segType})`,
      );
      const connection = await connectDatabase({ schema: segManaged, relations, connectionString: url });
      try {
        await work({ client, connection, api: segApi });
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
}
export interface SegCase {
  readonly member: string;
  readonly kind: "seg" | "bool" | "int4" | "float4";
  readonly expression: SQL;
  readonly native: string;
}
export function segCases(api = segApi): readonly SegCase[] {
  const lhs = sql<SegValue>`lhs`,
    rhs = sql<SegValue>`rhs`;
  return [
    {
      member: "operator:$extension:seg.@>($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.@>($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.@>) rhs)`,
    },
    {
      member: "operator:$extension:seg.&&($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.&&($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.&&) rhs)`,
    },
    {
      member: "operator:$extension:seg.&<($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.&<($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.&<) rhs)`,
    },
    {
      member: "operator:$extension:seg.&>($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.&>($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.&>) rhs)`,
    },
    {
      member: "operator:$extension:seg.<($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.<($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.<) rhs)`,
    },
    {
      member: "operator:$extension:seg.<@($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.<@($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.<@) rhs)`,
    },
    {
      member: "operator:$extension:seg.<<($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.<<($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.<<) rhs)`,
    },
    {
      member: "operator:$extension:seg.<=($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.<=($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.<=) rhs)`,
    },
    {
      member: "operator:$extension:seg.<>($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.<>($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.<>) rhs)`,
    },
    {
      member: "operator:$extension:seg.=($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.=($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.=) rhs)`,
    },
    {
      member: "operator:$extension:seg.>($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.>($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.>) rhs)`,
    },
    {
      member: "operator:$extension:seg.>=($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.>=($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.>=) rhs)`,
    },
    {
      member: "operator:$extension:seg.>>($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:seg.>>($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `(lhs operator(${segNamespace}.>>) rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_center($extension:seg.seg)",
      kind: "float4",
      expression: api.sql.overloads["routine:$extension:seg.seg_center($extension:seg.seg)"](lhs),
      native: `${segNamespace}.seg_center(lhs)`,
    },
    {
      member: "routine:$extension:seg.seg_cmp($extension:seg.seg,$extension:seg.seg)",
      kind: "int4",
      expression: api.sql.overloads["routine:$extension:seg.seg_cmp($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `${segNamespace}.seg_cmp(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_contained($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_contained($extension:seg.seg,$extension:seg.seg)"](
        lhs,
        rhs,
      ),
      native: `${segNamespace}.seg_contained(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_contains($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_contains($extension:seg.seg,$extension:seg.seg)"](
        lhs,
        rhs,
      ),
      native: `${segNamespace}.seg_contains(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_different($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_different($extension:seg.seg,$extension:seg.seg)"](
        lhs,
        rhs,
      ),
      native: `${segNamespace}.seg_different(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_ge($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_ge($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `${segNamespace}.seg_ge(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_gt($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_gt($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `${segNamespace}.seg_gt(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_inter($extension:seg.seg,$extension:seg.seg)",
      kind: "seg",
      expression: api.sql.overloads["routine:$extension:seg.seg_inter($extension:seg.seg,$extension:seg.seg)"](
        lhs,
        rhs,
      ),
      native: `${segNamespace}.seg_inter(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_le($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_le($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `${segNamespace}.seg_le(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_left($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_left($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `${segNamespace}.seg_left(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_lower($extension:seg.seg)",
      kind: "float4",
      expression: api.sql.overloads["routine:$extension:seg.seg_lower($extension:seg.seg)"](lhs),
      native: `${segNamespace}.seg_lower(lhs)`,
    },
    {
      member: "routine:$extension:seg.seg_lt($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_lt($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `${segNamespace}.seg_lt(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_over_left($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_over_left($extension:seg.seg,$extension:seg.seg)"](
        lhs,
        rhs,
      ),
      native: `${segNamespace}.seg_over_left(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_over_right($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_over_right($extension:seg.seg,$extension:seg.seg)"](
        lhs,
        rhs,
      ),
      native: `${segNamespace}.seg_over_right(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_overlap($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_overlap($extension:seg.seg,$extension:seg.seg)"](
        lhs,
        rhs,
      ),
      native: `${segNamespace}.seg_overlap(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_right($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_right($extension:seg.seg,$extension:seg.seg)"](
        lhs,
        rhs,
      ),
      native: `${segNamespace}.seg_right(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_same($extension:seg.seg,$extension:seg.seg)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:seg.seg_same($extension:seg.seg,$extension:seg.seg)"](lhs, rhs),
      native: `${segNamespace}.seg_same(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_size($extension:seg.seg)",
      kind: "float4",
      expression: api.sql.overloads["routine:$extension:seg.seg_size($extension:seg.seg)"](lhs),
      native: `${segNamespace}.seg_size(lhs)`,
    },
    {
      member: "routine:$extension:seg.seg_union($extension:seg.seg,$extension:seg.seg)",
      kind: "seg",
      expression: api.sql.overloads["routine:$extension:seg.seg_union($extension:seg.seg,$extension:seg.seg)"](
        lhs,
        rhs,
      ),
      native: `${segNamespace}.seg_union(lhs, rhs)`,
    },
    {
      member: "routine:$extension:seg.seg_upper($extension:seg.seg)",
      kind: "float4",
      expression: api.sql.overloads["routine:$extension:seg.seg_upper($extension:seg.seg)"](lhs),
      native: `${segNamespace}.seg_upper(lhs)`,
    },
  ];
}
