import type pg from "pg";
import { systemFieldSql } from "kello/server";
import { quoteIdentifier } from "./connection";
import { installRevisionTracking } from "./revisions";
import { extensionMembershipCte } from "./extension-membership";

/** Install the same system-field protections and runtime grants for release and development DDL. */
export async function protectApplication(
  client: pg.Client,
  namespace: string,
  runtimeRole: string,
  tables: readonly string[],
  metadataNamespace: string,
): Promise<void> {
  const members = await client.query<{ name: string }>(
    `WITH RECURSIVE ${extensionMembershipCte}
    SELECT DISTINCT c.relname AS name FROM members m JOIN pg_class c
      ON m.classid='pg_class'::regclass AND m.objid=c.oid AND m.objsubid=0
      JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1`,
    [namespace],
  );
  if (tables.some((name) => members.rows.some((member) => member.name === name)))
    throw new Error("Application tables cannot claim extension members");
  const entities = tables.map((name) => ({ name, sqlName: name, fields: [], options: {} }));
  for (const statement of systemFieldSql({ namespace, entities })) await client.query(statement);
  await installRevisionTracking(client, namespace, metadataNamespace, tables);
  const application = quoteIdentifier(namespace);
  const role = quoteIdentifier(runtimeRole);
  const overlap = await client.query(
    `WITH RECURSIVE ${extensionMembershipCte}
    SELECT 1 FROM members m CROSS JOIN LATERAL pg_identify_object(m.classid,m.objid,m.objsubid) o
    WHERE o.schema=$1 LIMIT 1`,
    [namespace],
  );
  await client.query(
    overlap.rows.length
      ? `REVOKE CREATE ON SCHEMA ${application} FROM PUBLIC, ${role}`
      : `REVOKE ALL ON SCHEMA ${application} FROM PUBLIC, ${role}`,
  );
  await client.query(`GRANT USAGE ON SCHEMA ${application} TO ${role}`);
  const relations = await client.query<{ identity: string; sequence: boolean }>(
    `WITH RECURSIVE ${extensionMembershipCte}
    SELECT format('%I.%I',n.nspname,c.relname) AS identity,c.relkind='S' AS sequence FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=$1 AND c.relkind IN ('r','p','v','m','f','S')
      AND NOT EXISTS (SELECT 1 FROM members m WHERE m.classid='pg_class'::regclass AND m.objid=c.oid AND m.objsubid=0)
    ORDER BY c.relname`,
    [namespace],
  );
  for (const sequence of [false, true]) {
    const objects = relations.rows
      .filter((relation) => relation.sequence === sequence)
      .map((relation) => relation.identity)
      .join(", ");
    if (!objects) continue;
    const kind = sequence ? "SEQUENCE" : "TABLE";
    await client.query(`REVOKE ALL ON ${kind} ${objects} FROM PUBLIC, ${role}`);
    await client.query(
      `GRANT ${sequence ? "USAGE" : "SELECT, INSERT, UPDATE, DELETE"} ON ${kind} ${objects} TO ${role}`,
    );
  }
  // PostgreSQL returns the fully quoted overload identity; extension routines retain their intended ACLs.
  const routines = await client.query<{ identity: string }>(
    `WITH RECURSIVE ${extensionMembershipCte}
    SELECT p.oid::regprocedure::text AS identity FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname=$1 AND p.prokind IN ('f','p')
      AND NOT EXISTS (SELECT 1 FROM members m WHERE m.classid='pg_proc'::regclass AND m.objid=p.oid)
    ORDER BY p.oid::regprocedure::text`,
    [namespace],
  );
  if (routines.rows.length)
    await client.query(
      `REVOKE ALL ON ROUTINE ${routines.rows.map((routine) => routine.identity).join(", ")} FROM PUBLIC, ${role}`,
    );
}
