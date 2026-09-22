import type pg from "pg";
import { systemFieldSql } from "@loom/core/server";
import { quoteIdentifier } from "./connection";

/** Install the same system-field protections and runtime grants for release and development DDL. */
export async function protectApplication(
  client: pg.Client,
  namespace: string,
  runtimeRole: string,
  tables: readonly string[],
): Promise<void> {
  const entities = tables.map((name) => ({ name, sqlName: name, fields: [], options: {} }));
  for (const statement of systemFieldSql({ namespace, entities })) await client.query(statement);
  const application = quoteIdentifier(namespace);
  const role = quoteIdentifier(runtimeRole);
  await client.query(`REVOKE ALL ON SCHEMA ${application} FROM PUBLIC, ${role}`);
  await client.query(`GRANT USAGE ON SCHEMA ${application} TO ${role}`);
  await client.query(`REVOKE ALL ON ALL TABLES IN SCHEMA ${application} FROM PUBLIC, ${role}`);
  await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${application} TO ${role}`);
  await client.query(`REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ${application} FROM PUBLIC, ${role}`);
}
