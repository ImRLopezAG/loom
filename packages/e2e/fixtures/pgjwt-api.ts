import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations } from "drizzle-orm";
import { createPgJwt_0_2_0 } from "../../../apps/loom/src/core/extensions/adapters/pgjwt";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { withExtensionDatabase } from "./extension-database";

export const pgJwtSchema = "Jwt 日本";
export const pgJwtNamespace = pg.escapeIdentifier(pgJwtSchema);
export const pgJwtApi = createPgJwt_0_2_0({
  name: "pgjwt",
  version: "0.2.0",
  schema: pgJwtSchema,
  apiSupport: { status: "verified", digest: "a2d8b3ee4c390dd05716585a14c23acfebdb05bb3800a06cd72a48578dcabadd" },
});
const schema = defineSchema(() => ({}));
const relations = defineRelations(schema.tables);
export async function withPgJwtApi(
  work: (fixture: {
    url: string;
    client: pg.Client;
    connection: DatabaseConnection<typeof relations>;
    api: typeof pgJwtApi;
  }) => Promise<void>,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      const server = await client.query<{ version: number }>(
        "select current_setting('server_version_num')::int version",
      );
      assert.equal(Math.floor(server.rows[0]!.version / 10000), 18);
      // Upstream calls hmac through @extschema@, so its dependency must be co-located.
      await client.query(
        `create schema ${pgJwtNamespace}; create extension pgcrypto with schema ${pgJwtNamespace} version '1.4'; create extension pgjwt with schema ${pgJwtNamespace} version '0.2.0'`,
      );
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      try {
        await work({ url, client, connection, api: pgJwtApi });
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
}
